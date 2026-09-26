"""
Script para analizar la precisión de la detección de aditivos
Compara los aditivos detectados con los que realmente deberían estar en el texto
"""

import json
import random
import re
import unicodedata
from typing import List, Dict, Set, Tuple
from pathlib import Path
from collections import defaultdict

def normalizar_texto(texto: str) -> str:
    """Normaliza texto para búsqueda (minúsculas, sin acentos)"""
    if not texto:
        return ""
    texto_lower = texto.lower()
    texto_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', texto_lower) 
                               if unicodedata.category(c) != 'Mn')
    return texto_sin_acentos

def buscar_e_numeros_en_texto(texto: str) -> Set[str]:
    """Busca E-números mencionados directamente en el texto"""
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

def analizar_producto(producto: Dict, aditivos_db: List[Dict]) -> Dict:
    """Analiza un producto y compara detectados vs esperados"""
    producto_nombre = producto.get('producto', 'Sin nombre')
    texto_ingredientes = producto.get('ingredients', '') or producto.get('ingredientes', '')
    aditivos_detectados = producto.get('aditivos_detectados', [])
    
    # Obtener E-números detectados
    e_numeros_detectados = {a.get('e_numero', '').upper() for a in aditivos_detectados}
    
    # Encontrar aditivos esperados
    e_numeros_esperados = encontrar_aditivos_esperados(texto_ingredientes, aditivos_db)
    
    # Calcular métricas
    verdaderos_positivos = e_numeros_detectados & e_numeros_esperados
    falsos_positivos = e_numeros_detectados - e_numeros_esperados
    falsos_negativos = e_numeros_esperados - e_numeros_detectados
    
    return {
        'producto': producto_nombre,
        'ean': producto.get('ean', ''),
        'texto_ingredientes': texto_ingredientes,  # Texto completo sin truncar
        'e_numeros_detectados': sorted(e_numeros_detectados),
        'e_numeros_esperados': sorted(e_numeros_esperados),
        'verdaderos_positivos': sorted(verdaderos_positivos),
        'falsos_positivos': sorted(falsos_positivos),
        'falsos_negativos': sorted(falsos_negativos),
        'precision': len(verdaderos_positivos) / len(e_numeros_detectados) if e_numeros_detectados else 1.0,
        'recall': len(verdaderos_positivos) / len(e_numeros_esperados) if e_numeros_esperados else 1.0,
        'f1_score': 2 * len(verdaderos_positivos) / (len(e_numeros_detectados) + len(e_numeros_esperados)) 
                   if (e_numeros_detectados or e_numeros_esperados) else 1.0
    }

def obtener_info_aditivo(e_num: str, aditivos_db: List[Dict]) -> Dict:
    """Obtiene información de un aditivo por su E-número"""
    return next((a for a in aditivos_db if a.get('e_numero', '').upper() == e_num.upper()), {})

def generar_reporte(analisis: List[Dict], aditivos_db: List[Dict]) -> str:
    """Genera un reporte detallado del análisis"""
    reporte = []
    reporte.append("="*100)
    reporte.append("ANÁLISIS DE PRECISIÓN DE DETECCIÓN DE ADITIVOS")
    reporte.append("="*100)
    reporte.append("")
    
    # Estadísticas generales
    total_productos = len(analisis)
    total_vp = sum(len(a['verdaderos_positivos']) for a in analisis)
    total_fp = sum(len(a['falsos_positivos']) for a in analisis)
    total_fn = sum(len(a['falsos_negativos']) for a in analisis)
    
    precision_promedio = sum(a['precision'] for a in analisis) / total_productos if total_productos > 0 else 0
    recall_promedio = sum(a['recall'] for a in analisis) / total_productos if total_productos > 0 else 0
    f1_promedio = sum(a['f1_score'] for a in analisis) / total_productos if total_productos > 0 else 0
    
    reporte.append("ESTADÍSTICAS GENERALES")
    reporte.append("-"*100)
    reporte.append(f"Total productos analizados: {total_productos}")
    reporte.append(f"Verdaderos positivos: {total_vp}")
    reporte.append(f"Falsos positivos: {total_fp}")
    reporte.append(f"Falsos negativos: {total_fn}")
    reporte.append(f"Precisión promedio: {precision_promedio:.2%}")
    reporte.append(f"Recall promedio: {recall_promedio:.2%}")
    reporte.append(f"F1-Score promedio: {f1_promedio:.2%}")
    reporte.append("")
    
    # Análisis de falsos positivos
    falsos_positivos_por_aditivo = defaultdict(int)
    for a in analisis:
        for e_num in a['falsos_positivos']:
            falsos_positivos_por_aditivo[e_num] += 1
    
    if falsos_positivos_por_aditivo:
        reporte.append("FALSOS POSITIVOS (detectados incorrectamente)")
        reporte.append("-"*100)
        for e_num, count in sorted(falsos_positivos_por_aditivo.items(), key=lambda x: x[1], reverse=True):
            aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
            nombre = aditivo_info.get('nombre_original', 'N/A')
            reporte.append(f"  {e_num} ({nombre}): {count} veces")
        reporte.append("")
    
    # Análisis de falsos negativos
    falsos_negativos_por_aditivo = defaultdict(int)
    for a in analisis:
        for e_num in a['falsos_negativos']:
            falsos_negativos_por_aditivo[e_num] += 1
    
    if falsos_negativos_por_aditivo:
        reporte.append("FALSOS NEGATIVOS (no detectados pero deberían estar)")
        reporte.append("-"*100)
        for e_num, count in sorted(falsos_negativos_por_aditivo.items(), key=lambda x: x[1], reverse=True):
            aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
            nombre = aditivo_info.get('nombre_original', 'N/A')
            reporte.append(f"  {e_num} ({nombre}): {count} veces")
        reporte.append("")
    
    # Productos con problemas
    productos_con_fp = [a for a in analisis if a['falsos_positivos']]
    productos_con_fn = [a for a in analisis if a['falsos_negativos']]
    
    if productos_con_fp:
        reporte.append(f"PRODUCTOS CON FALSOS POSITIVOS ({len(productos_con_fp)} productos)")
        reporte.append("-"*100)
        for a in productos_con_fp[:10]:  # Primeros 10
            reporte.append(f"\nProducto: {a['producto']}")
            fp_con_nombres = []
            for e_num in a['falsos_positivos']:
                aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
                nombre = aditivo_info.get('nombre_original', 'N/A')
                fp_con_nombres.append(f"{e_num} ({nombre})")
            reporte.append(f"  Falsos positivos: {', '.join(fp_con_nombres)}")
            reporte.append(f"  Ingredientes: {a['texto_ingredientes']}")
        reporte.append("")
    
    if productos_con_fn:
        reporte.append(f"PRODUCTOS CON FALSOS NEGATIVOS ({len(productos_con_fn)} productos)")
        reporte.append("-"*100)
        for a in productos_con_fn[:10]:  # Primeros 10
            reporte.append(f"\nProducto: {a['producto']}")
            fn_con_nombres = []
            for e_num in a['falsos_negativos']:
                aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
                nombre = aditivo_info.get('nombre_original', 'N/A')
                fn_con_nombres.append(f"{e_num} ({nombre})")
            reporte.append(f"  Falsos negativos: {', '.join(fn_con_nombres)}")
            reporte.append(f"  Ingredientes: {a['texto_ingredientes']}")
        reporte.append("")
    
    # Detalle de todos los productos analizados
    reporte.append("DETALLE DE PRODUCTOS ANALIZADOS")
    reporte.append("-"*100)
    for i, a in enumerate(analisis, 1):
        reporte.append(f"\n[{i}] {a['producto']}")
        reporte.append(f"    EAN: {a['ean']}")
        
        # Aditivos detectados con nombres
        if a['e_numeros_detectados']:
            detectados_con_nombres = []
            for e_num in a['e_numeros_detectados']:
                aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
                nombre = aditivo_info.get('nombre_original', 'N/A')
                if e_num in a['verdaderos_positivos']:
                    detectados_con_nombres.append(f"{e_num} ({nombre}) [VP]")
                else:
                    detectados_con_nombres.append(f"{e_num} ({nombre}) [FP]")
            reporte.append(f"    Detectados ({len(a['e_numeros_detectados'])}): {', '.join(detectados_con_nombres)}")
        else:
            reporte.append(f"    Detectados: Ninguno")
        
        # Aditivos esperados con nombres
        if a['e_numeros_esperados']:
            esperados_con_nombres = []
            for e_num in a['e_numeros_esperados']:
                aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
                nombre = aditivo_info.get('nombre_original', 'N/A')
                if e_num in a['verdaderos_positivos']:
                    esperados_con_nombres.append(f"{e_num} ({nombre}) [VP]")
                else:
                    esperados_con_nombres.append(f"{e_num} ({nombre}) [FN]")
            reporte.append(f"    Esperados ({len(a['e_numeros_esperados'])}): {', '.join(esperados_con_nombres)}")
        else:
            reporte.append(f"    Esperados: Ninguno")
        
        # Métricas
        reporte.append(f"    Precisión: {a['precision']:.2%} | Recall: {a['recall']:.2%} | F1: {a['f1_score']:.2%}")
    
    reporte.append("")
    reporte.append("")
    
    # Conclusiones y recomendaciones
    reporte.append("CONCLUSIONES Y RECOMENDACIONES")
    reporte.append("-"*100)
    
    if total_fp > 0:
        reporte.append(f"⚠️ Se detectaron {total_fp} falsos positivos en total.")
        reporte.append("   RECOMENDACIÓN: Reforzar validación post-procesamiento para evitar detecciones incorrectas.")
        reporte.append("")
    
    if total_fn > 0:
        reporte.append(f"⚠️ Se perdieron {total_fn} aditivos que deberían haberse detectado.")
        reporte.append("   RECOMENDACIÓN: Mejorar el matching de nombres, especialmente para variaciones ortográficas.")
        reporte.append("")
    
    # Análisis específico de aditivos problemáticos
    if falsos_positivos_por_aditivo:
        e_num_mas_fp = max(falsos_positivos_por_aditivo.items(), key=lambda x: x[1])
        reporte.append(f"🔴 Aditivo con más falsos positivos: {e_num_mas_fp[0]} ({e_num_mas_fp[1]} veces)")
        aditivo_info = obtener_info_aditivo(e_num_mas_fp[0], aditivos_db)
        reporte.append(f"   Revisar validación específica para este aditivo en el prompt.")
        reporte.append("")
    
    if falsos_negativos_por_aditivo:
        e_num_mas_fn = max(falsos_negativos_por_aditivo.items(), key=lambda x: x[1])
        reporte.append(f"🟡 Aditivo con más falsos negativos: {e_num_mas_fn[0]} ({e_num_mas_fn[1]} veces)")
        aditivo_info = obtener_info_aditivo(e_num_mas_fn[0], aditivos_db)
        nombres = aditivo_info.get('nombres_limpios', [])
        reporte.append(f"   Nombres en BD: {', '.join(nombres[:5])}")
        reporte.append(f"   Revisar si faltan variaciones de nombres en la base de datos o en el prompt.")
        reporte.append("")
    
    reporte.append("="*100)
    
    return "\n".join(reporte)

def generar_reporte_json_ingredientes(analisis: List[Dict], aditivos_db: List[Dict]) -> List[Dict]:
    """Genera un reporte JSON con ingredientes y aditivos detectados para cada producto"""
    reporte = []
    
    for a in analisis:
        # Obtener información completa de aditivos detectados
        aditivos_detectados_info = []
        for e_num in a['e_numeros_detectados']:
            aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
            aditivos_detectados_info.append({
                'e_numero': e_num,
                'nombre': aditivo_info.get('nombre_original', 'N/A'),
                'tipo': aditivo_info.get('tipo', 'N/A'),
                'origen': aditivo_info.get('origen', 'N/A'),
                'clasificacion': aditivo_info.get('clasificacion', 'N/A'),
                'es_verdadero_positivo': e_num in a['verdaderos_positivos'],
                'es_falso_positivo': e_num in a['falsos_positivos']
            })
        
        # Obtener información completa de aditivos esperados (no detectados)
        aditivos_no_detectados_info = []
        for e_num in a['falsos_negativos']:
            aditivo_info = obtener_info_aditivo(e_num, aditivos_db)
            aditivos_no_detectados_info.append({
                'e_numero': e_num,
                'nombre': aditivo_info.get('nombre_original', 'N/A'),
                'tipo': aditivo_info.get('tipo', 'N/A'),
                'origen': aditivo_info.get('origen', 'N/A'),
                'clasificacion': aditivo_info.get('clasificacion', 'N/A')
            })
        
        producto_info = {
            'producto': a['producto'],
            'ean': a['ean'],
            'ingredientes': a['texto_ingredientes'],
            'aditivos_detectados': aditivos_detectados_info,
            'aditivos_no_detectados': aditivos_no_detectados_info,
            'metricas': {
                'precision': a['precision'],
                'recall': a['recall'],
                'f1_score': a['f1_score'],
                'total_detectados': len(a['e_numeros_detectados']),
                'total_esperados': len(a['e_numeros_esperados']),
                'verdaderos_positivos': len(a['verdaderos_positivos']),
                'falsos_positivos': len(a['falsos_positivos']),
                'falsos_negativos': len(a['falsos_negativos'])
            }
        }
        reporte.append(producto_info)
    
    return reporte

def main():
    print("="*100)
    print("ANÁLISIS DE PRECISIÓN DE DETECCIÓN DE ADITIVOS")
    print("="*100)
    print()
    
    # Cargar archivos
    print("1. Cargando archivos...")
    resultados_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\resultados_aditivos_doble_excel_20251119_040457.json")
    aditivos_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\aditivos.json")
    
    with open(resultados_path, 'r', encoding='utf-8') as f:
        # Leer y limpiar caracteres de control inválidos
        contenido = f.read()
        # Reemplazar caracteres de control problemáticos
        import re
        # Escapar caracteres de control no permitidos en JSON strings (excepto \n, \r, \t)
        # Reemplazar \n reales dentro de strings JSON por \\n
        # Esto es un workaround para JSON mal formateado
        contenido_limpio = re.sub(r'(?<!\\)\n(?![\s]*["}])', '\\n', contenido)
        # Eliminar otros caracteres de control problemáticos
        contenido_limpio = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', contenido_limpio)
        try:
            productos = json.loads(contenido_limpio)
        except json.JSONDecodeError as e:
            # Si aún falla, intentar con una limpieza más agresiva
            print(f"   [WARNING] Error al parsear JSON: {e}")
            print(f"   [INFO] Intentando limpieza más agresiva...")
            # Reemplazar todos los \n dentro de strings por espacios
            contenido_limpio2 = re.sub(r'(?<!\\)\n', ' ', contenido_limpio)
            productos = json.loads(contenido_limpio2)
    print(f"   [OK] {len(productos)} productos cargados")
    
    with open(aditivos_path, 'r', encoding='utf-8') as f:
        aditivos_db = json.load(f)
    print(f"   [OK] {len(aditivos_db)} aditivos en base de datos")
    print()
    
    # Filtrar productos con ingredientes
    productos_con_ingredientes = [p for p in productos 
                                  if p.get('ingredients') or p.get('ingredientes')]
    print(f"2. Productos con ingredientes: {len(productos_con_ingredientes)}")
    print()
    
    # Seleccionar 40 productos aleatoriamente
    random.seed(8888)  # Nueva semilla para batch diferente (validación híbrido mejorado - batch 3)
    productos_seleccionados = random.sample(productos_con_ingredientes, 
                                           min(40, len(productos_con_ingredientes)))
    print(f"3. Analizando {len(productos_seleccionados)} productos seleccionados aleatoriamente...")
    print()
    
    # Analizar cada producto
    analisis = []
    for i, producto in enumerate(productos_seleccionados, 1):
        print(f"   Analizando producto {i}/{len(productos_seleccionados)}: {producto.get('producto', 'N/A')[:50]}...")
        resultado = analizar_producto(producto, aditivos_db)
        analisis.append(resultado)
    
    print()
    print("4. Generando reporte...")
    
    # Generar reporte
    reporte = generar_reporte(analisis, aditivos_db)
    
    # Guardar reporte
    reporte_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\reporte_analisis_deteccion_40_productos_hibrido_mejorado_batch3.txt")
    with open(reporte_path, 'w', encoding='utf-8') as f:
        f.write(reporte)
    
    print(f"   [OK] Reporte guardado en: {reporte_path}")
    print()
    
    # Guardar también análisis detallado en JSON
    analisis_json_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\analisis_detallado_40_productos_hibrido_mejorado_batch3.json")
    with open(analisis_json_path, 'w', encoding='utf-8') as f:
        json.dump(analisis, f, ensure_ascii=False, indent=2)
    print(f"   [OK] Análisis detallado guardado en: {analisis_json_path}")
    
    # Generar reporte JSON con ingredientes y aditivos detectados
    reporte_json = generar_reporte_json_ingredientes(analisis, aditivos_db)
    reporte_json_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\reporte_ingredientes_aditivos_detectados_batch3.json")
    with open(reporte_json_path, 'w', encoding='utf-8') as f:
        json.dump(reporte_json, f, ensure_ascii=False, indent=2)
    print(f"   [OK] Reporte JSON (ingredientes + aditivos) guardado en: {reporte_json_path}")

if __name__ == "__main__":
    main()

