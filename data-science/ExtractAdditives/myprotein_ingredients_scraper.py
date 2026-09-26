import logging
import re
import json
import unicodedata
from pathlib import Path
from typing import List, Optional, Dict, Any, TYPE_CHECKING
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
from bs4 import BeautifulSoup
import requests
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Importar detector de aditivos
if TYPE_CHECKING:
    from aditivos_detector import AditivosDetector
    from llm_analyzer import LLMAnalyzer

try:
    from aditivos_detector import AditivosDetector
    from llm_analyzer import LLMAnalyzer, create_llm_config_from_env
    ADITIVOS_AVAILABLE = True
except ImportError:
    ADITIVOS_AVAILABLE = False
    AditivosDetector = None  # type: ignore
    LLMAnalyzer = None  # type: ignore
    create_llm_config_from_env = None  # type: ignore
    logger.warning("No se pudo importar el detector de aditivos. La detección de aditivos no estará disponible.")

INPUT_DEFAULT = "MyProtein_Data_All_Products.xlsx"
OUTPUT_DEFAULT = "MyProtein_Ingredients.xlsx"


def _strip_accents_lower(s: str) -> str:
    """Normaliza texto eliminando acentos y convirtiendo a minúsculas."""
    try:
        s = unicodedata.normalize("NFKD", s)
        s = "".join(ch for ch in s if not unicodedata.combining(ch))
    except Exception:
        pass
    return s.lower().strip()


def _clean_ingredients_text(text: str, product_flavour: Optional[str] = None) -> str:
    """Limpia el texto de ingredientes eliminando alérgenos y filtrando por sabor."""
    if not text:
        return ""
    
    # Primero eliminar líneas de alérgenos al inicio
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    
    # Eliminar líneas de alérgenos al principio
    allergen_keywords = [
        'alérgenos:', 'alergenos:', 'alérgeno:', 'alergeno:',
        'para los alérgenos', 'para los alergenos',
        'ver los ingredientes en negrita', 'ver los ingredientes en negrita.',
        'consulte los ingredientes en negrita', 'consulte los ingredientes en negrita.',
        'también puede contener', 'tambien puede contener',
        'negrita',  # Líneas que solo dicen "negrita"
    ]
    
    # Filtrar líneas de alérgenos
    filtered_lines = []
    for line in lines:
        norm_line = _strip_accents_lower(line)
        # Saltar líneas que solo contienen palabras de alérgenos o "negrita"
        if (any(keyword in norm_line for keyword in allergen_keywords) or 
            norm_line.strip() == 'negrita' or
            norm_line.strip() == '.'):
            continue
        filtered_lines.append(line)
    
    if not filtered_lines:
        return ""
    
    text_cleaned = "\n".join(filtered_lines)
    
    # Detectar secciones de sabor usando regex más robusto
    # Patrón: "Sabor X:" o "Sabor X\n" donde X puede tener espacios y caracteres especiales
    flavor_pattern = re.compile(r'Sabor\s+([^:\n]+?)[:\n]', re.IGNORECASE)
    
    # Buscar todas las secciones de sabor
    flavor_matches = list(flavor_pattern.finditer(text_cleaned))
    
    if len(flavor_matches) == 0:
        # No hay secciones de sabor, devolver texto limpio
        return text_cleaned.strip()
    
    # Si hay múltiples sabores, filtrar por el sabor del producto
    if len(flavor_matches) > 1 and product_flavour:
        product_flavour_norm = _strip_accents_lower(str(product_flavour).strip())
        
        # Buscar el sabor que coincida
        matched_section = None
        for i, match in enumerate(flavor_matches):
            flavor_name = match.group(1).strip()
            flavor_norm = _strip_accents_lower(flavor_name)
            
            # Comparación exacta o parcial
            if (product_flavour_norm == flavor_norm or
                product_flavour_norm in flavor_norm or
                flavor_norm in product_flavour_norm):
                matched_section = i
                break
        
        # Si no hay match exacto, buscar por palabras clave
        if matched_section is None:
            product_words = [w for w in product_flavour_norm.split() if len(w) > 2]
            for i, match in enumerate(flavor_matches):
                flavor_name = match.group(1).strip()
                flavor_norm = _strip_accents_lower(flavor_name)
                if any(word in flavor_norm for word in product_words):
                    matched_section = i
                    break
        
        # Extraer solo la sección del sabor encontrado
        if matched_section is not None:
            match = flavor_matches[matched_section]
            start_pos = match.end()
            # Buscar el inicio del siguiente sabor o el final del texto
            if matched_section + 1 < len(flavor_matches):
                end_pos = flavor_matches[matched_section + 1].start()
            else:
                end_pos = len(text_cleaned)
            
            flavor_content = text_cleaned[start_pos:end_pos].strip()
            return flavor_content
    
    # Si solo hay un sabor o no se encontró match, devolver todo el contenido después del primer sabor
    if flavor_matches:
        first_match = flavor_matches[0]
        start_pos = first_match.end()
        return text_cleaned[start_pos:].strip()
    
    return text_cleaned.strip()


def extract_ingredients(soup: BeautifulSoup) -> Optional[str]:
    """Extrae ingredientes del panel con id='ingredients'."""
    try:
        panel = soup.find(id="ingredients")
        if not panel:
            return None
        
        text = panel.get_text("\n", strip=True)
        return text if text else None
    except Exception:
        return None


def scrape_ingredients(url: str, timeout: float = 20.0) -> Optional[str]:
    """Extrae ingredientes de una URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        }
        resp = requests.get(url, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.content, "lxml")
        return extract_ingredients(soup)
    except Exception:
        return None


def _save_partial_results(tasks: List[Dict], results: Dict[str, Optional[str]], 
                          aditivos_results: Dict[str, Optional[Dict]], 
                          output_path: Path, detect_aditivos: bool):
    """Guarda resultados parciales en el archivo de salida."""
    rows = []
    for task in tasks:
        url = task["url"]
        ingredients = results.get(url)
        aditivos_info = aditivos_results.get(url) if detect_aditivos else None
        
        row = {
            "producto": task.get("product_name", ""),
            "ean": task.get("ean", ""),
            "url": url,
            "flavour": task.get("flavour", ""),
            "ingredients": ingredients,
        }
        
        if aditivos_info:
            row["e_numeros"] = ", ".join(sorted(aditivos_info.get('e_numeros', []))) if aditivos_info.get('e_numeros') else ""
            row["aditivos count"] = aditivos_info.get('total_aditivos', 0)
            row["aditivos peligrosos"] = aditivos_info.get('aditivos_peligrosos', 0)
            row["aditivos no peligrosos"] = aditivos_info.get('aditivos_no_nocivos', 0)
            row["aditivos sospechosos"] = aditivos_info.get('aditivos_sospechosos', 0)
        else:
            if detect_aditivos:
                row["e_numeros"] = ""
                row["aditivos count"] = 0
                row["aditivos peligrosos"] = 0
                row["aditivos no peligrosos"] = 0
                row["aditivos sospechosos"] = 0
        
        rows.append(row)
    
    df_partial = pd.DataFrame(rows)
    
    # Combinar con existente si existe
    if output_path.exists():
        try:
            existing = pd.read_excel(output_path, engine="openpyxl")
            # Actualizar filas existentes y agregar nuevas
            combined = pd.concat([existing, df_partial], ignore_index=True)
            combined = combined.drop_duplicates(subset=["url"], keep="last")  # Mantener la versión más reciente
            df_final = combined
        except Exception:
            df_final = df_partial
    else:
        df_final = df_partial
    
    # Reordenar columnas
    column_order = ["producto", "ean", "url", "flavour"]
    if detect_aditivos:
        column_order.extend(["aditivos count", "aditivos peligrosos", "aditivos no peligrosos", "aditivos sospechosos", "e_numeros", "ingredients"])
    else:
        column_order.append("ingredients")
    
    existing_columns = [col for col in column_order if col in df_final.columns]
    other_columns = [col for col in df_final.columns if col not in column_order]
    df_final = df_final[existing_columns + other_columns]
    
    df_final.to_excel(output_path, index=False, engine="openpyxl")


def detectar_aditivos_en_texto(texto: str, detector: Optional[Any], 
                                llm_analyzer: Optional[Any] = None,
                                aditivos_database: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """
    Detecta aditivos en un texto de ingredientes usando SOLO Claude LLM.
    NO usa embeddings/sentence-transformers.
    
    Args:
        texto: Texto de ingredientes a analizar
        detector: Instancia de AditivosDetector (solo para obtener base de datos, no se usa para detección)
        llm_analyzer: Analizador LLM (Claude) - REQUERIDO
        aditivos_database: Base de datos de aditivos para usar con LLM
        
    Returns:
        Diccionario con información de aditivos detectados
    """
    if not texto or not texto.strip():
        return {
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_no_nocivos': 0,
            'aditivos_sospechosos': 0
        }
    
    # SOLO usar Claude LLM, sin fallback a embeddings
    if not llm_analyzer or not aditivos_database:
        logger.warning("LLM o base de datos no disponible. No se detectarán aditivos.")
        return {
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_no_nocivos': 0,
            'aditivos_sospechosos': 0,
            'error': 'LLM no disponible'
        }
    
    try:
        # Usar SOLO Claude para detección
        logger.debug(f"Llamando a detect_additives_in_text con texto de {len(texto)} caracteres")
        aditivos_finales = llm_analyzer.detect_additives_in_text(texto, aditivos_database)
        logger.info(f"Claude detectó {len(aditivos_finales)} aditivos en el texto")
        
        if not aditivos_finales:
            return {
                'aditivos_detectados': [],
                'e_numeros': [],
                'total_aditivos': 0,
                'aditivos_peligrosos': 0,
                'aditivos_no_nocivos': 0,
                'aditivos_sospechosos': 0
            }
        
        # El formato puede variar, normalizar
        # Usar diccionario para eliminar duplicados de E-números
        aditivos_unicos = {}
        e_numeros_set = set()
        
        for a in aditivos_finales:
            # Obtener e_numero (puede estar en diferentes lugares según el formato)
            e_num = a.get('e_numero') or (a.get('aditivo', {}).get('e_numero') if isinstance(a.get('aditivo'), dict) else None)
            if e_num and e_num not in e_numeros_set:
                e_numeros_set.add(e_num)
                aditivos_unicos[e_num] = a
        
        # Convertir a lista sin duplicados
        aditivos_sin_duplicados = list(aditivos_unicos.values())
        e_numeros = list(e_numeros_set)
        
        # Contar por tipo correctamente
        peligrosos = 0
        no_nocivos = 0
        sospechosos = 0
        
        for a in aditivos_sin_duplicados:
            # Obtener tipo (puede estar en diferentes lugares)
            tipo = a.get('tipo') or (a.get('aditivo', {}).get('tipo') if isinstance(a.get('aditivo'), dict) else None) or ''
            tipo_str = str(tipo)
            
            if 'Peligroso' in tipo_str:
                peligrosos += 1
            elif 'No nocivo' in tipo_str:
                no_nocivos += 1
            elif 'Sospechoso' in tipo_str:
                sospechosos += 1
            else:
                # Si no tiene tipo claro, contar como sospechoso por seguridad
                sospechosos += 1
        
        return {
            'aditivos_detectados': aditivos_sin_duplicados,
            'e_numeros': e_numeros,
            'total_aditivos': len(aditivos_sin_duplicados),
            'aditivos_peligrosos': peligrosos,
            'aditivos_no_nocivos': no_nocivos,
            'aditivos_sospechosos': sospechosos
        }
    except Exception as e:
        logger.error(f"Error detectando aditivos con Claude: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        return {
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_no_nocivos': 0,
            'aditivos_sospechosos': 0,
            'error': str(e)
        }


def process_excel(input_path: Path, output_path: Path, concurrency: int = 8, resume: bool = True,
                  detect_aditivos: bool = True, use_llm: bool = False, use_column: bool = False):
    """
    Procesa Excel y extrae ingredientes, opcionalmente detectando aditivos.
    
    Args:
        input_path: Ruta al Excel de entrada
        output_path: Ruta al Excel de salida
        concurrency: Número de hilos concurrentes
        resume: Si True, reanuda desde donde se quedó
        detect_aditivos: Si True, detecta aditivos en los ingredientes
        use_llm: Si True, usa LLM para análisis adicional (requiere configuración)
        use_column: Si True, usa la columna 'ingredients' del Excel directamente sin scraping
    """
    if not input_path.exists():
        raise FileNotFoundError(f"No existe el fichero: {input_path}")
    
    # Inicializar detector de aditivos si está disponible
    detector = None
    llm_analyzer = None
    aditivos_database = None  # Base de datos para usar con LLM
    
    if detect_aditivos and ADITIVOS_AVAILABLE:
        try:
            logger.info("Inicializando detector de aditivos...")
            detector = AditivosDetector()
            detector.inicializar_aditivos(usar_web=False, archivo="aditivos.json")
            # Guardar base de datos para usar con LLM
            aditivos_database = detector.aditivos_data
            logger.info("Detector de aditivos inicializado correctamente")
            
            # Inicializar LLM (SOLO Claude) - REQUERIDO para detección de aditivos
            # Si detect_aditivos=True, siempre intentar inicializar LLM (no requiere --use-llm)
            if detect_aditivos:
                try:
                    if create_llm_config_from_env is None:
                        logger.error("LLM solicitado pero módulo no disponible. Se requiere Claude para detección de aditivos.")
                        raise ValueError("LLM module not available")
                    else:
                        import os
                        from llm_analyzer import LLMConfig
                        
                        # SOLO usar Anthropic (Claude) para detección de aditivos
                        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
                        if not anthropic_key:
                            logger.error("ANTHROPIC_API_KEY no encontrada. Se requiere Claude para detección de aditivos.")
                            raise ValueError("ANTHROPIC_API_KEY not found")
                        
                        # FORZAR modelo haiku - es el más disponible y funciona correctamente
                        # Ignorar variable de entorno si está configurada con un modelo no disponible
                        env_model = os.getenv('ANTHROPIC_MODEL', '')
                        if env_model in ['claude-3-haiku-20240307', 'claude-3-5-haiku-20241022']:
                            model_name = env_model
                        else:
                            # Forzar haiku si el modelo de env no es válido o no está configurado
                            if env_model:
                                logger.warning(f"Modelo de entorno '{env_model}' puede no estar disponible. Usando claude-3-haiku-20240307")
                            model_name = 'claude-3-haiku-20240307'
                        
                        logger.info(f"Usando modelo: {model_name}")
                        
                        llm_config = LLMConfig(
                            provider='anthropic',
                            api_key=anthropic_key,
                            model=model_name,
                            max_tokens=int(os.getenv('ANTHROPIC_MAX_TOKENS', '2000')),  # Aumentado para respuestas más largas
                            temperature=float(os.getenv('ANTHROPIC_TEMPERATURE', '0.3'))
                        )
                        try:
                            llm_analyzer = LLMAnalyzer(llm_config)
                            logger.info(f"Claude LLM inicializado: {llm_config.model} (solo se usará Claude, sin embeddings)")
                        except Exception as e:
                            logger.error(f"Error inicializando Claude: {e}. No se pueden detectar aditivos sin Claude.")
                            raise
                except Exception as e:
                    logger.error(f"No se pudo inicializar Claude LLM: {e}. La detección de aditivos requiere Claude.")
                    raise
        except Exception as e:
            logger.error(f"Error inicializando detector de aditivos: {e}")
            logger.warning("Continuando sin detección de aditivos")
            detector = None
    
    logger.info("Cargando Excel: %s", input_path)
    sheets = pd.read_excel(input_path, sheet_name=None, engine="openpyxl")
    
    # Combinar todas las hojas y crear diccionario con metadata
    all_rows = []
    for sheet_name, df in sheets.items():
        if "url" not in df.columns:
            continue
        
        for _, row in df.iterrows():
            url = row.get("url")
            if pd.isna(url) or not url:
                continue
            
            url_str = str(url).strip()
            if url_str:
                all_rows.append({
                    "url": url_str,
                    "product_name": row.get("product_name", ""),
                    "flavour": row.get("flavour"),
                    "sku": row.get("sku", ""),
                    "ean": row.get("ean", ""),
                    "ingredients": row.get("ingredients") if "ingredients" in df.columns else None,
                })
    
    # Filtrar filas ya procesadas si resume está activo
    processed_urls = set()
    if resume and output_path.exists():
        try:
            existing = pd.read_excel(output_path, engine="openpyxl")
            if "url" in existing.columns:
                processed_urls = set(existing["url"].dropna().astype(str))
            logger.info("Reanudación: se omitirán %d URLs ya procesadas.", len(processed_urls))
        except Exception:
            pass
    
    # Filtrar filas a procesar
    tasks = [row for row in all_rows if row["url"] not in processed_urls]
    
    logger.info("Total filas a procesar: %d", len(tasks))
    
    # Procesar ingredientes
    results = {}
    aditivos_results = {}
    
    if use_column:
        # Usar columna ingredients directamente sin scraping
        logger.info("Usando columna 'ingredients' del Excel directamente (sin scraping)")
        
        # Pre-procesar: limpiar ingredientes primero (rápido, no necesita concurrencia)
        cleaned_ingredients = {}
        for task in tasks:
            url = task["url"]
            raw_ingredients = task.get("ingredients")
            
            if pd.isna(raw_ingredients) or not raw_ingredients:
                cleaned_ingredients[url] = None
                continue
            
            # Limpiar ingredientes usando el sabor del producto
            flavour = task.get("flavour")
            cleaned = _clean_ingredients_text(str(raw_ingredients), flavour)
            cleaned_ingredients[url] = cleaned if cleaned else None
            results[url] = cleaned
        
        # Detectar aditivos con concurrencia si está habilitado (llamadas a API)
        if detect_aditivos and detector and llm_analyzer:
            logger.info("Detectando aditivos con concurrencia...")
            tasks_with_ingredients = [(url, cleaned_ingredients[url]) for url in cleaned_ingredients.keys() 
                                     if cleaned_ingredients[url] is not None]
            
            def process_aditivos(url_ingredients):
                url, cleaned = url_ingredients
                try:
                    aditivos_info = detectar_aditivos_en_texto(cleaned, detector, llm_analyzer, aditivos_database)
                    return url, aditivos_info
                except Exception as e:
                    logger.error(f"Error detectando aditivos para {url}: {e}")
                    return url, None
            
            with ThreadPoolExecutor(max_workers=min(concurrency, 10)) as executor:  # Limitar a 10 para evitar rate limits
                futures = {executor.submit(process_aditivos, task): task[0] for task in tasks_with_ingredients}
                
                processed_count = 0
                save_interval = 50  # Guardar cada 50 productos procesados
                
                with tqdm(total=len(tasks_with_ingredients), desc="Detectando aditivos", unit="producto") as pbar:
                    for fut in as_completed(futures):
                        url, aditivos_info = fut.result()
                        aditivos_results[url] = aditivos_info
                        processed_count += 1
                        pbar.update(1)
                        
                        # Guardar resultados parciales cada cierto intervalo
                        if processed_count % save_interval == 0:
                            try:
                                _save_partial_results(tasks, results, aditivos_results, output_path, detect_aditivos)
                                logger.info(f"Guardado parcial: {processed_count}/{len(tasks_with_ingredients)} productos procesados")
                            except Exception as e:
                                logger.warning(f"Error guardando resultados parciales: {e}")
        else:
            # Si no hay detección de aditivos, solo marcar como None
            for url in cleaned_ingredients.keys():
                aditivos_results[url] = None
    else:
        # Hacer scraping de URLs
        logger.info("Haciendo scraping de URLs para extraer ingredientes")
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = {executor.submit(scrape_ingredients, task["url"]): task for task in tasks}
            
            desc_text = "Extrayendo ingredientes" + (" y detectando aditivos" if detect_aditivos else "")
            with tqdm(total=len(tasks), desc=desc_text, unit="url") as pbar:
                for fut in as_completed(futures):
                    task = futures[fut]
                    url = task["url"]
                    try:
                        raw_ingredients = fut.result()
                        if raw_ingredients:
                            # Limpiar ingredientes usando el sabor del producto
                            flavour = task.get("flavour")
                            cleaned = _clean_ingredients_text(raw_ingredients, flavour)
                            results[url] = cleaned if cleaned else None
                            
                            # Detectar aditivos si está habilitado
                            if detect_aditivos and cleaned and detector:
                                aditivos_info = detectar_aditivos_en_texto(cleaned, detector, llm_analyzer, aditivos_database)
                                aditivos_results[url] = aditivos_info
                            else:
                                aditivos_results[url] = None
                        else:
                            results[url] = None
                            aditivos_results[url] = None
                    except Exception as e:
                        logger.error(f"Error procesando {url}: {e}")
                        results[url] = None
                        aditivos_results[url] = None
                    pbar.update(1)
    
    # Crear DataFrame de salida
    rows = []
    for task in tasks:
        url = task["url"]
        ingredients = results.get(url)
        aditivos_info = aditivos_results.get(url) if detect_aditivos else None
        
        row = {
            "producto": task.get("product_name", ""),
            "ean": task.get("ean", ""),
            "url": url,
            "flavour": task.get("flavour", ""),
            "ingredients": ingredients,
        }
        
        # Agregar información de aditivos si está disponible (solo columnas solicitadas)
        if aditivos_info:
            row["e_numeros"] = ", ".join(sorted(aditivos_info.get('e_numeros', []))) if aditivos_info.get('e_numeros') else ""
            row["aditivos count"] = aditivos_info.get('total_aditivos', 0)
            row["aditivos peligrosos"] = aditivos_info.get('aditivos_peligrosos', 0)
            row["aditivos no peligrosos"] = aditivos_info.get('aditivos_no_nocivos', 0)
            row["aditivos sospechosos"] = aditivos_info.get('aditivos_sospechosos', 0)
        else:
            # Columnas vacías si no hay detección de aditivos
            if detect_aditivos:
                row["e_numeros"] = ""
                row["aditivos count"] = 0
                row["aditivos peligrosos"] = 0
                row["aditivos no peligrosos"] = 0
                row["aditivos sospechosos"] = 0
        
        rows.append(row)
    
    df_new = pd.DataFrame(rows)
    
    # Combinar con existente
    if resume and output_path.exists():
        try:
            existing = pd.read_excel(output_path, engine="openpyxl")
            combined = pd.concat([existing, df_new], ignore_index=True)
            combined = combined.drop_duplicates(subset=["url"], keep="first")
            df_final = combined
        except Exception:
            df_final = df_new
    else:
        df_final = df_new
    
    # Reordenar columnas según lo solicitado: producto, ean, url, flavour, aditivos count, aditivos peligrosos, aditivos no peligrosos, aditivos sospechosos
    column_order = ["producto", "ean", "url", "flavour"]
    if detect_aditivos:
        column_order.extend(["aditivos count", "aditivos peligrosos", "aditivos no peligrosos", "aditivos sospechosos", "e_numeros", "ingredients"])
    else:
        column_order.append("ingredients")
    
    # Reordenar solo las columnas que existen
    existing_columns = [col for col in column_order if col in df_final.columns]
    other_columns = [col for col in df_final.columns if col not in column_order]
    df_final = df_final[existing_columns + other_columns]
    
    logger.info("Guardando resultados en: %s (%d filas)", output_path, len(df_final))
    df_final.to_excel(output_path, index=False, engine="openpyxl")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Extrae ingredientes de productos MyProtein y detecta aditivos.")
    parser.add_argument("--input", "-i", default=INPUT_DEFAULT, help="Excel de entrada")
    parser.add_argument("--output", "-o", default=OUTPUT_DEFAULT, help="Excel de salida")
    parser.add_argument("--concurrency", type=int, default=8, help="Concurrencia (default: 8)")
    parser.add_argument("--no-resume", action="store_true", help="No reanudar (empezar desde cero)")
    parser.add_argument("--no-aditivos", action="store_true", help="No detectar aditivos (solo extraer ingredientes)")
    parser.add_argument("--use-llm", action="store_true", help="Usar LLM para análisis adicional (requiere API key configurada)")
    parser.add_argument("--use-column", action="store_true", help="Usar columna 'ingredients' del Excel directamente sin scraping")
    
    args = parser.parse_args()
    
    try:
        process_excel(
            Path(args.input),
            Path(args.output),
            concurrency=args.concurrency,
            resume=not args.no_resume,
            detect_aditivos=not args.no_aditivos,
            use_llm=args.use_llm,
            use_column=args.use_column,
        )
        logger.info("Finalizado con éxito.")
    except Exception:
        logger.exception("Error en la ejecución.")
        exit(1)


if __name__ == "__main__":
    main()
