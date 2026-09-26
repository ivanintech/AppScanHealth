"""
Script para procesar detección de aditivos en dos archivos Excel
- MyProtein_Ingredients_Final_Corregido.xlsx
- hsn_products_all.xlsx
Usando Nebius LLM con Llama 3.3 70B
"""

import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from tqdm import tqdm
import logging

load_dotenv()
from llm_analyzer import LLMAnalyzer, LLMConfig

# Configurar logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Token de Nebius
NEBIUS_API_KEY = os.environ.get('NEBIUS_API_KEY', '')
NEBIUS_BASE_URL = "https://api.studio.nebius.com/v1/"
NEBIUS_MODEL = "meta-llama/Llama-3.3-70B-Instruct"

def cargar_base_datos_aditivos():
    """Carga la base de datos de aditivos desde aditivos.json"""
    with open('aditivos.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def configurar_nebius_llm():
    """Configura el LLM de Nebius"""
    api_key = NEBIUS_API_KEY
    model = os.getenv('OPENAI_MODEL', NEBIUS_MODEL)
    max_tokens = int(os.getenv('OPENAI_MAX_TOKENS', '8000'))
    temperature = float(os.getenv('OPENAI_TEMPERATURE', '0.2'))
    base_url = os.getenv('OPENAI_BASE_URL', NEBIUS_BASE_URL)
    
    # Configurar variables de entorno para compatibilidad (llm_analyzer las lee)
    os.environ['OPENAI_API_KEY'] = api_key
    os.environ['OPENAI_BASE_URL'] = base_url
    
    # Crear configuración LLM
    config = LLMConfig(
        provider='openai',
        api_key=api_key,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature
    )
    
    # Agregar base_url como atributo (llm_analyzer lo verifica)
    config.base_url = base_url
    
    return LLMAnalyzer(config)

def analizar_producto(producto_info, llm_analyzer, aditivos_db):
    """
    Analiza un producto y detecta aditivos en sus ingredientes.
    
    Args:
        producto_info: Diccionario con información del producto (nombre, ingredientes, etc.)
        llm_analyzer: Instancia de LLMAnalyzer
        aditivos_db: Base de datos de aditivos
        
    Returns:
        Diccionario con resultados del análisis
    """
    producto_nombre = producto_info.get('producto', producto_info.get('product_name', 'Sin nombre'))
    ingredientes = producto_info.get('ingredients')
    fuente = producto_info.get('fuente', 'desconocida')
    ean = producto_info.get('ean', '')
    
    if pd.isna(ingredientes) or not ingredientes or not str(ingredientes).strip():
        return {
            'producto': producto_nombre,
            'ean': ean,
            'fuente': fuente,
            'ingredientes': None,
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_sospechosos': 0,
            'aditivos_no_nocivos': 0,
            'error': 'Sin ingredientes'
        }
    
    ingredientes_str = str(ingredientes).strip()
    
    try:
        # Detectar aditivos usando LLM
        aditivos_detectados = llm_analyzer.detect_additives_in_text(ingredientes_str, aditivos_db)
        
        # Contar por tipo
        peligrosos = sum(1 for a in aditivos_detectados if 'Peligroso' in a.get('tipo', ''))
        sospechosos = sum(1 for a in aditivos_detectados if 'Sospechoso' in a.get('tipo', ''))
        no_nocivos = sum(1 for a in aditivos_detectados if 'No nocivo' in a.get('tipo', ''))
        
        # Extraer E-números
        e_numeros = [a.get('e_numero', '') for a in aditivos_detectados if a.get('e_numero')]
        
        return {
            'producto': producto_nombre,
            'ean': ean,
            'fuente': fuente,
            'ingredientes': ingredientes_str,
            'aditivos_detectados': aditivos_detectados,
            'e_numeros': e_numeros,
            'total_aditivos': len(aditivos_detectados),
            'aditivos_peligrosos': peligrosos,
            'aditivos_sospechosos': sospechosos,
            'aditivos_no_nocivos': no_nocivos,
            'error': None
        }
    except Exception as e:
        logger.error(f"Error analizando producto {producto_nombre}: {e}", exc_info=True)
        return {
            'producto': producto_nombre,
            'ean': ean,
            'fuente': fuente,
            'ingredientes': ingredientes_str[:200] + '...' if len(ingredientes_str) > 200 else ingredientes_str,
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_sospechosos': 0,
            'aditivos_no_nocivos': 0,
            'error': str(e)
        }

def cargar_productos_myprotein(archivo_path):
    """Carga productos del archivo MyProtein"""
    logger.info(f"Cargando productos MyProtein desde: {archivo_path}")
    df = pd.read_excel(archivo_path, engine="openpyxl")
    
    productos = []
    for idx, row in df.iterrows():
        productos.append({
            'producto': row.get('producto', ''),
            'ean': row.get('ean', ''),
            'url': row.get('url', ''),
            'flavour': row.get('flavour', ''),
            'ingredients': row.get('ingredients', ''),
            'fuente': 'MyProtein'
        })
    
    logger.info(f"Cargados {len(productos)} productos de MyProtein")
    return productos

def cargar_productos_hsn(archivo_path):
    """Carga productos del archivo HSN"""
    logger.info(f"Cargando productos HSN desde: {archivo_path}")
    df = pd.read_excel(archivo_path, engine="openpyxl")
    
    productos = []
    for idx, row in df.iterrows():
        productos.append({
            'product_name': row.get('product_name', ''),
            'ean': row.get('ean', ''),
            'url': row.get('url', ''),
            'flavour': row.get('flavour', ''),
            'ingredients': row.get('ingredients', ''),
            'fuente': 'HSN'
        })
    
    logger.info(f"Cargados {len(productos)} productos de HSN")
    return productos

def guardar_resultados(resultados, archivo_salida):
    """Guarda los resultados en un archivo Excel"""
    logger.info(f"Guardando resultados en: {archivo_salida}")
    
    rows = []
    for resultado in resultados:
        row = {
            'producto': resultado.get('producto', ''),
            'ean': resultado.get('ean', ''),
            'fuente': resultado.get('fuente', ''),
            'total_aditivos': resultado.get('total_aditivos', 0),
            'aditivos_peligrosos': resultado.get('aditivos_peligrosos', 0),
            'aditivos_sospechosos': resultado.get('aditivos_sospechosos', 0),
            'aditivos_no_nocivos': resultado.get('aditivos_no_nocivos', 0),
            'e_numeros': ', '.join(sorted(resultado.get('e_numeros', []))),
            'ingredientes': resultado.get('ingredientes', ''),
            'error': resultado.get('error', '')
        }
        rows.append(row)
    
    df_resultados = pd.DataFrame(rows)
    df_resultados.to_excel(archivo_salida, index=False, engine="openpyxl")
    logger.info(f"Resultados guardados: {len(rows)} productos")

def guardar_resultados_json(resultados, archivo_salida):
    """Guarda los resultados en un archivo JSON"""
    logger.info(f"Guardando resultados JSON en: {archivo_salida}")
    
    # Convertir a formato serializable
    resultados_json = []
    for resultado in resultados:
        resultado_json = {
            'producto': resultado.get('producto', ''),
            'ean': resultado.get('ean', ''),
            'fuente': resultado.get('fuente', ''),
            'total_aditivos': resultado.get('total_aditivos', 0),
            'aditivos_peligrosos': resultado.get('aditivos_peligrosos', 0),
            'aditivos_sospechosos': resultado.get('aditivos_sospechosos', 0),
            'aditivos_no_nocivos': resultado.get('aditivos_no_nocivos', 0),
            'e_numeros': resultado.get('e_numeros', []),
            'aditivos_detectados': []
        }
        
        # Serializar aditivos detectados
        for aditivo in resultado.get('aditivos_detectados', []):
            aditivo_info = {
                'e_numero': aditivo.get('e_numero', ''),
                'nombre_original': aditivo.get('aditivo', {}).get('nombre_original', '') if isinstance(aditivo.get('aditivo'), dict) else '',
                'tipo': aditivo.get('tipo', ''),
                'origen': aditivo.get('origen', ''),
                'clasificacion': aditivo.get('clasificacion', ''),
                'metodo_deteccion': aditivo.get('metodo_deteccion', '')
            }
            resultado_json['aditivos_detectados'].append(aditivo_info)
        
        resultados_json.append(resultado_json)
    
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(resultados_json, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Resultados JSON guardados: {len(resultados_json)} productos")

def main():
    print("="*100)
    print("PROCESAMIENTO DE ADITIVOS - DOBLE EXCEL (MyProtein + HSN)")
    print("="*100)
    print()
    
    # 1. Cargar base de datos de aditivos
    print("1. Cargando base de datos de aditivos...")
    try:
        aditivos_db = cargar_base_datos_aditivos()
        print(f"   [OK] {len(aditivos_db)} aditivos cargados")
    except Exception as e:
        print(f"   [ERROR] Error cargando aditivos: {e}")
        return
    print()
    
    # 2. Configurar Nebius LLM
    print("2. Configurando Nebius LLM...")
    try:
        llm_analyzer = configurar_nebius_llm()
        print(f"   [OK] Nebius LLM configurado: {NEBIUS_MODEL}")
    except Exception as e:
        print(f"   [ERROR] Error configurando LLM: {e}")
        return
    print()
    
    # 3. Cargar productos de ambos archivos
    print("3. Cargando productos de ambos archivos Excel...")
    productos = []
    
    # MyProtein
    archivo_myprotein = Path("db/MyProtein_Ingredients_Final_Corregido.xlsx")
    if archivo_myprotein.exists():
        try:
            productos_mp = cargar_productos_myprotein(archivo_myprotein)
            productos.extend(productos_mp)
            print(f"   [OK] MyProtein: {len(productos_mp)} productos cargados")
        except Exception as e:
            print(f"   [ERROR] Error cargando MyProtein: {e}")
    else:
        print(f"   [WARNING] Archivo MyProtein no encontrado: {archivo_myprotein}")
    
    # HSN
    archivo_hsn = Path("db/hsn_products_all.xlsx")
    if archivo_hsn.exists():
        try:
            productos_hsn = cargar_productos_hsn(archivo_hsn)
            productos.extend(productos_hsn)
            print(f"   [OK] HSN: {len(productos_hsn)} productos cargados")
        except Exception as e:
            print(f"   [ERROR] Error cargando HSN: {e}")
    else:
        print(f"   [WARNING] Archivo HSN no encontrado: {archivo_hsn}")
    
    print(f"\n   [TOTAL] {len(productos)} productos a procesar")
    print()
    
    if len(productos) == 0:
        print("[ERROR] No se encontraron productos para procesar")
        return
    
    # 4. Procesar productos
    print("4. Analizando productos y detectando aditivos...\n")
    resultados = []
    
    # Filtrar productos sin ingredientes
    productos_con_ingredientes = [p for p in productos if p.get('ingredients') and str(p.get('ingredients')).strip()]
    productos_sin_ingredientes = len(productos) - len(productos_con_ingredientes)
    
    if productos_sin_ingredientes > 0:
        print(f"[INFO] {productos_sin_ingredientes} productos sin ingredientes serán omitidos\n")
    
    # Procesar con barra de progreso
    for producto_info in tqdm(productos_con_ingredientes, desc="Procesando productos", unit="producto"):
        try:
            resultado = analizar_producto(producto_info, llm_analyzer, aditivos_db)
            resultados.append(resultado)
        except Exception as e:
            logger.error(f"Error procesando producto {producto_info.get('producto', 'desconocido')}: {e}")
            resultados.append({
                'producto': producto_info.get('producto', producto_info.get('product_name', 'Sin nombre')),
                'ean': producto_info.get('ean', ''),
                'fuente': producto_info.get('fuente', 'desconocida'),
                'ingredientes': str(producto_info.get('ingredients', '')),
                'aditivos_detectados': [],
                'e_numeros': [],
                'total_aditivos': 0,
                'aditivos_peligrosos': 0,
                'aditivos_sospechosos': 0,
                'aditivos_no_nocivos': 0,
                'error': str(e)
            })
    
    # 5. Guardar resultados
    print("\n5. Guardando resultados...")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Excel
    archivo_excel = f"resultados_aditivos_doble_excel_{timestamp}.xlsx"
    guardar_resultados(resultados, archivo_excel)
    print(f"   [OK] Excel guardado: {archivo_excel}")
    
    # JSON
    archivo_json = f"resultados_aditivos_doble_excel_{timestamp}.json"
    guardar_resultados_json(resultados, archivo_json)
    print(f"   [OK] JSON guardado: {archivo_json}")
    print()
    
    # 6. Resumen
    print("="*100)
    print("RESUMEN DE PROCESAMIENTO")
    print("="*100)
    
    total_productos = len(resultados)
    productos_con_aditivos = sum(1 for r in resultados if r.get('total_aditivos', 0) > 0)
    productos_sin_aditivos = total_productos - productos_con_aditivos
    productos_con_error = sum(1 for r in resultados if r.get('error'))
    
    total_aditivos = sum(r.get('total_aditivos', 0) for r in resultados)
    total_peligrosos = sum(r.get('aditivos_peligrosos', 0) for r in resultados)
    total_sospechosos = sum(r.get('aditivos_sospechosos', 0) for r in resultados)
    total_no_nocivos = sum(r.get('aditivos_no_nocivos', 0) for r in resultados)
    
    print(f"\nProductos procesados: {total_productos}")
    print(f"   - Con aditivos detectados: {productos_con_aditivos}")
    print(f"   - Sin aditivos: {productos_sin_aditivos}")
    print(f"   - Con errores: {productos_con_error}")
    
    print(f"\nTotal aditivos detectados: {total_aditivos}")
    print(f"   - Peligrosos: {total_peligrosos}")
    print(f"   - Sospechosos: {total_sospechosos}")
    print(f"   - No nocivos: {total_no_nocivos}")
    
    # Estadísticas por fuente
    print(f"\nPor fuente:")
    for fuente in ['MyProtein', 'HSN']:
        resultados_fuente = [r for r in resultados if r.get('fuente') == fuente]
        if resultados_fuente:
            total_f = len(resultados_fuente)
            con_aditivos_f = sum(1 for r in resultados_fuente if r.get('total_aditivos', 0) > 0)
            aditivos_f = sum(r.get('total_aditivos', 0) for r in resultados_fuente)
            print(f"   - {fuente}: {total_f} productos, {con_aditivos_f} con aditivos, {aditivos_f} aditivos totales")
    
    print("\n" + "="*100)
    print("PROCESAMIENTO COMPLETADO")
    print("="*100)

if __name__ == "__main__":
    main()

