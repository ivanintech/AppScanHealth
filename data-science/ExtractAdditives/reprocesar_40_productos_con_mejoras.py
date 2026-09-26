"""
Script para reprocesar 40 productos aleatorios con las mejoras implementadas
y comparar resultados ANTES vs DESPUÉS
"""

import json
import random
import sys
from pathlib import Path
from typing import List, Dict, Set

# Añadir el directorio actual al path para importar llm_analyzer
sys.path.insert(0, str(Path(__file__).parent))

from llm_analyzer import LLMAnalyzer, create_llm_config_from_env

def normalizar_texto(texto: str) -> str:
    """Normaliza texto para búsqueda (minúsculas, sin acentos)"""
    import unicodedata
    if not texto:
        return ""
    texto_lower = texto.lower()
    texto_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', texto_lower) 
                               if unicodedata.category(c) != 'Mn')
    return texto_sin_acentos

def buscar_e_numeros_en_texto(texto: str) -> Set[str]:
    """Busca E-números mencionados directamente en el texto"""
    import re
    patron = r'E[-]?\s*(\d+[a-z]?)'
    matches = re.findall(patron, texto, re.IGNORECASE)
    e_numeros = set()
    for match in matches:
        if match:
            num_match = re.match(r'(\d+)([a-z]?)', match, re.IGNORECASE)
            if num_match:
                num = num_match.group(1)
                letra = num_match.group(2).lower() if num_match.group(2) else ''
                e_num = f"E-{num}{letra}"
                e_numeros.add(e_num.upper())
    return e_numeros

def buscar_nombres_aditivos_en_texto(texto: str, aditivo: Dict) -> bool:
    """Verifica si algún nombre del aditivo aparece en el texto"""
    texto_normalizado = normalizar_texto(texto)
    
    # Obtener todos los nombres posibles
    nombres = aditivo.get('nombres_limpios', [])
    nombre_original = aditivo.get('nombre_original', '')
    if nombre_original:
        nombres.extend([n.strip() for n in nombre_original.split(',')])
    
    # Buscar cada nombre en el texto
    for nombre in nombres:
        if not nombre or len(nombre) < 3:
            continue
        
        nombre_normalizado = normalizar_texto(nombre)
        
        # Buscar nombre completo
        if nombre_normalizado in texto_normalizado:
            return True
        
        # Para nombres de una palabra, buscar como palabra completa
        if len(nombre_normalizado.split()) == 1 and len(nombre_normalizado) > 4:
            import re
            patron = r'\b' + re.escape(nombre_normalizado) + r'\b'
            if re.search(patron, texto_normalizado, re.IGNORECASE):
                return True
        
        # Para nombres compuestos, buscar palabras clave importantes
        palabras_nombre = nombre_normalizado.split()
        if len(palabras_nombre) > 1:
            palabras_clave = [p for p in palabras_nombre 
                            if len(p) > 3 and p not in ['de', 'del', 'la', 'el', 'y', 'o', 'con', 'sin']]
            if palabras_clave:
                palabras_encontradas = sum(1 for p in palabras_clave if p in texto_normalizado)
                if palabras_encontradas >= min(2, len(palabras_clave)):
                    return True
    
    return False

def encontrar_aditivos_esperados(texto: str, aditivos_db: List[Dict]) -> Set[str]:
    """Encuentra qué aditivos DEBERÍAN estar en el texto según la base de datos"""
    aditivos_esperados = set()
    
    # 1. Buscar E-números directos
    e_numeros_directos = buscar_e_numeros_en_texto(texto)
    aditivos_esperados.update(e_numeros_directos)
    
    # 2. Buscar por nombres
    for aditivo in aditivos_db:
        e_num = aditivo.get('e_numero', '').upper()
        if e_num in aditivos_esperados:
            continue  # Ya detectado por E-número
        
        if buscar_nombres_aditivos_en_texto(texto, aditivo):
            aditivos_esperados.add(e_num)
    
    return aditivos_esperados

def obtener_info_aditivo(e_num: str, aditivos_db: List[Dict]) -> Dict:
    """Obtiene información de un aditivo por su E-número"""
    return next((a for a in aditivos_db if a.get('e_numero', '').upper() == e_num.upper()), {})

def main():
    print("="*100)
    print("REPROCESAMIENTO DE 40 PRODUCTOS CON MEJORAS IMPLEMENTADAS")
    print("="*100)
    print()
    
    # Cargar archivos
    print("1. Cargando archivos...")
    resultados_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\resultados_aditivos_doble_excel_20251119_040457.json")
    aditivos_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\aditivos.json")
    
    with open(resultados_path, 'r', encoding='utf-8') as f:
        productos = json.load(f)
    print(f"   [OK] {len(productos)} productos cargados")
    
    with open(aditivos_path, 'r', encoding='utf-8') as f:
        aditivos_db = json.load(f)
    print(f"   [OK] {len(aditivos_db)} aditivos en base de datos")
    print()
    
    # Inicializar LLM
    print("2. Inicializando LLM...")
    try:
        llm_config = create_llm_config_from_env()
        if not llm_config:
            print("   [ERROR] No se encontró configuración LLM en variables de entorno")
            print("   Configura ANTHROPIC_API_KEY o OPENAI_API_KEY")
            return
        
        llm_analyzer = LLMAnalyzer(llm_config)
        print(f"   [OK] LLM inicializado: {llm_config.provider} - {llm_config.model}")
    except Exception as e:
        print(f"   [ERROR] Error inicializando LLM: {e}")
        return
    
    print()
    
    # Filtrar productos con ingredientes
    productos_con_ingredientes = [p for p in productos 
                                  if p.get('ingredients') or p.get('ingredientes')]
    print(f"3. Productos con ingredientes: {len(productos_con_ingredientes)}")
    print()
    
    # Seleccionar 40 productos aleatoriamente (misma semilla que antes)
    random.seed(123)  # Misma semilla que el análisis anterior
    productos_seleccionados = random.sample(productos_con_ingredientes, 
                                           min(40, len(productos_con_ingredientes)))
    print(f"4. Reprocesando {len(productos_seleccionados)} productos con LLM mejorado...")
    print()
    
    resultados_comparacion = []
    
    for i, producto in enumerate(productos_seleccionados, 1):
        producto_nombre = producto.get('producto', 'Sin nombre')
        texto_ingredientes = producto.get('ingredients', '') or producto.get('ingredientes', '')
        aditivos_antes = producto.get('aditivos_detectados', [])
        e_numeros_antes = {a.get('e_numero', '').upper() for a in aditivos_antes}
        
        # Encontrar aditivos esperados
        e_numeros_esperados = encontrar_aditivos_esperados(texto_ingredientes, aditivos_db)
        
        print(f"   [{i}/{len(productos_seleccionados)}] {producto_nombre[:60]}...")
        print(f"      Antes: {len(e_numeros_antes)} aditivos - {', '.join(sorted(e_numeros_antes))}")
        
        try:
            # Reprocesar con LLM mejorado
            aditivos_despues = llm_analyzer.detect_additives_in_text(texto_ingredientes, aditivos_db)
            e_numeros_despues = {a.get('e_numero', '').upper() for a in aditivos_despues}
            
            print(f"      Despues: {len(e_numeros_despues)} aditivos - {', '.join(sorted(e_numeros_despues))}")
            
            # Comparar
            verdaderos_positivos_antes = e_numeros_antes & e_numeros_esperados
            falsos_positivos_antes = e_numeros_antes - e_numeros_esperados
            falsos_negativos_antes = e_numeros_esperados - e_numeros_antes
            
            verdaderos_positivos_despues = e_numeros_despues & e_numeros_esperados
            falsos_positivos_despues = e_numeros_despues - e_numeros_esperados
            falsos_negativos_despues = e_numeros_esperados - e_numeros_despues
            
            precision_antes = len(verdaderos_positivos_antes) / len(e_numeros_antes) if e_numeros_antes else 1.0
            recall_antes = len(verdaderos_positivos_antes) / len(e_numeros_esperados) if e_numeros_esperados else 1.0
            f1_antes = 2 * len(verdaderos_positivos_antes) / (len(e_numeros_antes) + len(e_numeros_esperados)) if (e_numeros_antes or e_numeros_esperados) else 1.0
            
            precision_despues = len(verdaderos_positivos_despues) / len(e_numeros_despues) if e_numeros_despues else 1.0
            recall_despues = len(verdaderos_positivos_despues) / len(e_numeros_esperados) if e_numeros_esperados else 1.0
            f1_despues = 2 * len(verdaderos_positivos_despues) / (len(e_numeros_despues) + len(e_numeros_esperados)) if (e_numeros_despues or e_numeros_esperados) else 1.0
            
            print(f"      Precision: {precision_antes:.2%} -> {precision_despues:.2%} | Recall: {recall_antes:.2%} -> {recall_despues:.2%} | F1: {f1_antes:.2%} -> {f1_despues:.2%}")
            
            eliminados = falsos_positivos_antes - falsos_positivos_despues
            añadidos = verdaderos_positivos_despues - verdaderos_positivos_antes
            falsos_negativos_corregidos = falsos_negativos_antes - falsos_negativos_despues
            
            if eliminados:
                print(f"      [OK] Eliminados {len(eliminados)} falsos positivos: {', '.join(sorted(eliminados))}")
            if añadidos:
                print(f"      [OK] Añadidos {len(añadidos)} verdaderos positivos: {', '.join(sorted(añadidos))}")
            if falsos_negativos_corregidos:
                print(f"      [OK] Corregidos {len(falsos_negativos_corregidos)} falsos negativos: {', '.join(sorted(falsos_negativos_corregidos))}")
            
            resultados_comparacion.append({
                'producto': producto_nombre,
                'ean': producto.get('ean', ''),
                'texto_ingredientes': texto_ingredientes[:200] + '...' if len(texto_ingredientes) > 200 else texto_ingredientes,
                'antes': {
                    'e_numeros': sorted(e_numeros_antes),
                    'total': len(e_numeros_antes),
                    'vp': len(verdaderos_positivos_antes),
                    'fp': len(falsos_positivos_antes),
                    'fn': len(falsos_negativos_antes),
                    'precision': precision_antes,
                    'recall': recall_antes,
                    'f1': f1_antes
                },
                'despues': {
                    'e_numeros': sorted(e_numeros_despues),
                    'total': len(e_numeros_despues),
                    'vp': len(verdaderos_positivos_despues),
                    'fp': len(falsos_positivos_despues),
                    'fn': len(falsos_negativos_despues),
                    'precision': precision_despues,
                    'recall': recall_despues,
                    'f1': f1_despues
                },
                'mejoras': {
                    'eliminados_fp': sorted(eliminados),
                    'añadidos_vp': sorted(añadidos),
                    'corregidos_fn': sorted(falsos_negativos_corregidos)
                }
            })
            
        except Exception as e:
            print(f"      [ERROR] Error: {e}")
            resultados_comparacion.append({
                'producto': producto_nombre,
                'error': str(e)
            })
        
        print()
    
    # Guardar resultados
    resultados_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\comparacion_mejoras_40_productos.json")
    with open(resultados_path, 'w', encoding='utf-8') as f:
        json.dump(resultados_comparacion, f, ensure_ascii=False, indent=2)
    
    print(f"5. Resultados guardados en: {resultados_path}")
    print()
    
    # Calcular métricas agregadas
    productos_validos = [r for r in resultados_comparacion if 'error' not in r]
    
    if productos_validos:
        total_vp_antes = sum(r['antes']['vp'] for r in productos_validos)
        total_fp_antes = sum(r['antes']['fp'] for r in productos_validos)
        total_fn_antes = sum(r['antes']['fn'] for r in productos_validos)
        
        total_vp_despues = sum(r['despues']['vp'] for r in productos_validos)
        total_fp_despues = sum(r['despues']['fp'] for r in productos_validos)
        total_fn_despues = sum(r['despues']['fn'] for r in productos_validos)
        
        precision_promedio_antes = sum(r['antes']['precision'] for r in productos_validos) / len(productos_validos)
        recall_promedio_antes = sum(r['antes']['recall'] for r in productos_validos) / len(productos_validos)
        f1_promedio_antes = sum(r['antes']['f1'] for r in productos_validos) / len(productos_validos)
        
        precision_promedio_despues = sum(r['despues']['precision'] for r in productos_validos) / len(productos_validos)
        recall_promedio_despues = sum(r['despues']['recall'] for r in productos_validos) / len(productos_validos)
        f1_promedio_despues = sum(r['despues']['f1'] for r in productos_validos) / len(productos_validos)
        
        print("="*100)
        print("COMPARACIÓN DE MÉTRICAS - ANTES vs DESPUÉS")
        print("="*100)
        print()
        print(f"ANTES (con código anterior):")
        print(f"  Verdaderos positivos: {total_vp_antes}")
        print(f"  Falsos positivos: {total_fp_antes}")
        print(f"  Falsos negativos: {total_fn_antes}")
        print(f"  Precisión promedio: {precision_promedio_antes:.2%}")
        print(f"  Recall promedio: {recall_promedio_antes:.2%}")
        print(f"  F1-Score promedio: {f1_promedio_antes:.2%}")
        print()
        print(f"DESPUÉS (con mejoras implementadas):")
        print(f"  Verdaderos positivos: {total_vp_despues}")
        print(f"  Falsos positivos: {total_fp_despues}")
        print(f"  Falsos negativos: {total_fn_despues}")
        print(f"  Precisión promedio: {precision_promedio_despues:.2%}")
        print(f"  Recall promedio: {recall_promedio_despues:.2%}")
        print(f"  F1-Score promedio: {f1_promedio_despues:.2%}")
        print()
        print(f"MEJORAS:")
        print(f"  Verdaderos positivos: {total_vp_antes} -> {total_vp_despues} (+{total_vp_despues - total_vp_antes})")
        print(f"  Falsos positivos: {total_fp_antes} -> {total_fp_despues} ({total_fp_despues - total_fp_antes:+d})")
        print(f"  Falsos negativos: {total_fn_antes} -> {total_fn_despues} ({total_fn_despues - total_fn_antes:+d})")
        print(f"  Precisión: {precision_promedio_antes:.2%} -> {precision_promedio_despues:.2%} ({precision_promedio_despues - precision_promedio_antes:+.2%})")
        print(f"  Recall: {recall_promedio_antes:.2%} -> {recall_promedio_despues:.2%} ({recall_promedio_despues - recall_promedio_antes:+.2%})")
        print(f"  F1-Score: {f1_promedio_antes:.2%} -> {f1_promedio_despues:.2%} ({f1_promedio_despues - f1_promedio_antes:+.2%})")
        print()
    
    print("="*100)

if __name__ == "__main__":
    main()


