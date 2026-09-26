"""
Script para validar aleatoriamente 20 productos y verificar que la detección de aditivos funcionó correctamente
"""

import json
import pandas as pd
import random
import re
import unicodedata
from pathlib import Path
from typing import List, Dict, Tuple

def cargar_base_datos_aditivos():
    """Carga la base de datos de aditivos"""
    with open('aditivos.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def _strip_accents_lower(s: str) -> str:
    """Normaliza texto eliminando acentos y convirtiendo a minúsculas."""
    try:
        s = unicodedata.normalize("NFKD", s)
        s = "".join(ch for ch in s if not unicodedata.combining(ch))
    except Exception:
        pass
    return s.lower().strip()

def validar_aditivo_en_texto(aditivo_detectado: Dict, texto_ingredientes: str, aditivos_db: List[Dict]) -> Tuple[bool, str]:
    """
    Valida que un aditivo detectado realmente aparece en el texto de ingredientes.
    
    Returns:
        (es_valido, mensaje)
    """
    e_num = aditivo_detectado.get('e_numero', '').upper()
    
    # Buscar el aditivo en la base de datos
    aditivo_en_db = next((a for a in aditivos_db if a.get('e_numero', '').upper() == e_num), None)
    
    if not aditivo_en_db:
        return (False, f"E-numero {e_num} NO existe en la base de datos")
    
    if not texto_ingredientes or not str(texto_ingredientes).strip():
        return (False, "No hay texto de ingredientes para validar")
    
    texto = str(texto_ingredientes)
    
    # PRIMERO: Verificar si el E-número aparece directamente en el texto
    e_num_sin_guion = e_num.replace('-', '')
    e_num_base = re.match(r'E-?(\d+)', e_num).group(1) if re.match(r'E-?(\d+)', e_num) else None
    
    # Buscar variantes del E-número en el texto
    patrones_e_num = [
        re.escape(e_num),
        re.escape(e_num_sin_guion),
        re.escape(e_num.replace('E-', 'E')),
    ]
    if e_num_base:
        patrones_e_num.extend([
            f'E-?{e_num_base}[a-z]?',  # E-472, E472, E-472c, E472c
            f'E{re.escape(e_num_base)}[a-z]?',
        ])
    
    e_num_encontrado = False
    for patron in patrones_e_num:
        if re.search(patron, texto, re.IGNORECASE):
            e_num_encontrado = True
            break
    
    # Si el E-número aparece directamente, es válido
    if e_num_encontrado:
        return (True, "Valido - E-numero aparece directamente en el texto")
    
    # SEGUNDO: Si no aparece el E-número, validar que el nombre aparezca
    nombres = aditivo_en_db.get('nombres_limpios', [])
    nombre_original = aditivo_en_db.get('nombre_original', '')
    if nombre_original:
        nombres.extend([n.strip().lower() for n in nombre_original.split(',')])
    
    texto_lower = texto.lower()
    texto_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', texto_lower) if unicodedata.category(c) != 'Mn')
    
    # CASO ESPECIAL: E-960 (Glicósidos de esteviol) - manejar variaciones ortográficas
    if e_num.upper() == 'E-960':
        variantes_esteviol = ['glicósidos de esteviol', 'glucósidos de esteviol', 'glicosidos de esteviol', 
                             'glucosidos de esteviol', 'esteviósido', 'esteviosido', 'glucósidos de steviol',
                             'glicósidos de steviol', 'glucosidos de steviol', 'glicosidos de steviol',
                             'glucósidos de steviol', 'glicósidos de steviol']
        for var in variantes_esteviol:
            var_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', var) if unicodedata.category(c) != 'Mn')
            if var in texto_lower or var_sin_acentos in texto_sin_acentos:
                if ('glucósidos' in texto_lower or 'glicósidos' in texto_lower or 
                    'glucosidos' in texto_sin_acentos or 'glicosidos' in texto_sin_acentos):
                    if ('esteviol' in texto_lower or 'steviol' in texto_lower or
                        'esteviol' in texto_sin_acentos or 'steviol' in texto_sin_acentos):
                        return (True, "Valido - nombre aparece en el texto (E-960 con variaciones)")
    
    # Buscar si algún nombre aparece en el texto
    nombre_encontrado = False
    nombre_encontrado_texto = None
    
    for nombre in nombres:
        if nombre and len(nombre) > 2:
            nombre_lower = nombre.lower().strip()
            nombre_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', nombre_lower) if unicodedata.category(c) != 'Mn')
            
            # Buscar el nombre completo
            if nombre_lower in texto_lower or nombre_sin_acentos in texto_sin_acentos:
                nombre_encontrado = True
                nombre_encontrado_texto = nombre
                break
            
            # Para nombres de una sola palabra importante, buscar como palabra completa
            if len(nombre_lower.split()) == 1 and len(nombre_lower) > 4:
                patron = r'\b' + re.escape(nombre_lower) + r'\b'
                patron_sin_acentos = r'\b' + re.escape(nombre_sin_acentos) + r'\b'
                if (re.search(patron, texto_lower, re.IGNORECASE) or 
                    re.search(patron_sin_acentos, texto_sin_acentos, re.IGNORECASE)):
                    nombre_encontrado = True
                    nombre_encontrado_texto = nombre
                    break
    
    if not nombre_encontrado:
        return (False, f"Nombre del aditivo NO aparece literalmente en el texto (falso positivo)")
    
    return (True, f"Valido - nombre '{nombre_encontrado_texto}' aparece en el texto")

def validar_producto(producto: Dict, aditivos_db: List[Dict]) -> Dict:
    """Valida un producto completo"""
    producto_nombre = producto.get('producto', 'Sin nombre')
    # Intentar obtener ingredientes con diferentes nombres de campo
    ingredientes = producto.get('ingredients', '') or producto.get('ingredientes', '')
    aditivos_detectados = producto.get('aditivos_detectados', [])
    e_numeros = producto.get('e_numeros', [])
    
    validaciones = []
    aditivos_validos = 0
    aditivos_invalidos = 0
    
    # Validar cada aditivo detectado
    for aditivo_info in aditivos_detectados:
        # Obtener E-número del aditivo
        e_num = aditivo_info.get('e_numero', '')
        nombre_original = aditivo_info.get('nombre_original', '')
        if not nombre_original:
            # Intentar obtener del objeto aditivo si existe
            aditivo_obj = aditivo_info.get('aditivo', {})
            if isinstance(aditivo_obj, dict):
                nombre_original = aditivo_obj.get('nombre_original', '')
        
        es_valido, mensaje = validar_aditivo_en_texto(aditivo_info, ingredientes, aditivos_db)
        
        validaciones.append({
            'e_numero': e_num,
            'nombre_original': nombre_original,
            'es_valido': es_valido,
            'mensaje': mensaje
        })
        
        if es_valido:
            aditivos_validos += 1
        else:
            aditivos_invalidos += 1
    
    return {
        'producto': producto_nombre,
        'ean': producto.get('ean', ''),
        'fuente': producto.get('fuente', ''),
        'total_aditivos': len(aditivos_detectados),
        'aditivos_validos': aditivos_validos,
        'aditivos_invalidos': aditivos_invalidos,
        'validaciones': validaciones,
        'ingredientes_preview': str(ingredientes)[:300] + '...' if len(str(ingredientes)) > 300 else str(ingredientes)
    }

def main():
    print("="*100)
    print("VALIDACION ALEATORIA - DETECCION DE ADITIVOS")
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
    
    # 2. Cargar resultados
    print("2. Cargando resultados del procesamiento...")
    archivo_excel = "resultados_aditivos_doble_excel_20251119_040457.xlsx"
    archivo_json = "resultados_aditivos_doble_excel_20251119_040457.json"
    
    try:
        # Cargar desde Excel (tiene los ingredientes)
        df_excel = pd.read_excel(archivo_excel, engine="openpyxl")
        print(f"   [OK] {len(df_excel)} productos cargados desde Excel")
        
        # Cargar desde JSON para tener la estructura completa de aditivos
        with open(archivo_json, 'r', encoding='utf-8') as f:
            resultados_json = json.load(f)
        print(f"   [OK] {len(resultados_json)} productos cargados desde JSON")
        
        # Combinar: usar ingredientes del Excel y aditivos del JSON
        # Crear diccionario de ingredientes por EAN (normalizado)
        ingredientes_por_ean = {}
        for idx, row in df_excel.iterrows():
            ean_raw = row.get('ean', '')
            # Normalizar EAN: convertir a string y limpiar
            if pd.notna(ean_raw):
                ean = str(ean_raw).strip().replace('.0', '')  # Eliminar .0 de floats
                ingredientes = row.get('ingredients', '')
                if pd.notna(ingredientes) and str(ingredientes).strip():
                    ingredientes_por_ean[ean] = str(ingredientes).strip()
        
        # Agregar ingredientes a los resultados JSON
        ingredientes_agregados = 0
        for resultado in resultados_json:
            ean_raw = resultado.get('ean', '')
            # Normalizar EAN del JSON también
            if ean_raw:
                ean = str(ean_raw).strip().replace('.0', '')
                if ean in ingredientes_por_ean:
                    resultado['ingredientes'] = ingredientes_por_ean[ean]
                    ingredientes_agregados += 1
        
        print(f"   [OK] {ingredientes_agregados} productos con ingredientes agregados de {len(ingredientes_por_ean)} disponibles en Excel")
    except Exception as e:
        print(f"   [ERROR] Error cargando datos: {e}")
        import traceback
        traceback.print_exc()
        return
    print()
    
    # 3. Filtrar productos con aditivos detectados
    productos_con_aditivos = [p for p in resultados_json if p.get('total_aditivos', 0) > 0]
    productos_sin_aditivos = [p for p in resultados_json if p.get('total_aditivos', 0) == 0]
    
    print(f"3. Estadisticas de productos:")
    print(f"   - Total productos: {len(resultados_json)}")
    print(f"   - Con aditivos: {len(productos_con_aditivos)}")
    print(f"   - Sin aditivos: {len(productos_sin_aditivos)}")
    print()
    
    # 4. Seleccionar 20 productos aleatoriamente (priorizando los que tienen aditivos)
    print("4. Seleccionando 20 productos aleatoriamente para validacion...")
    
    # Seleccionar 15 con aditivos y 5 sin aditivos (si hay suficientes)
    random.seed(42)  # Para reproducibilidad
    
    productos_a_validar = []
    if len(productos_con_aditivos) >= 15:
        productos_a_validar.extend(random.sample(productos_con_aditivos, 15))
    else:
        productos_a_validar.extend(productos_con_aditivos)
    
    if len(productos_sin_aditivos) >= 5:
        productos_a_validar.extend(random.sample(productos_sin_aditivos, 5))
    else:
        productos_a_validar.extend(productos_sin_aditivos[:5-len(productos_a_validar)])
    
    # Completar hasta 20 si es necesario
    if len(productos_a_validar) < 20:
        faltantes = 20 - len(productos_a_validar)
        todos_productos = [p for p in resultados_json if p not in productos_a_validar]
        productos_a_validar.extend(random.sample(todos_productos, min(faltantes, len(todos_productos))))
    
    print(f"   [OK] {len(productos_a_validar)} productos seleccionados")
    print()
    
    # 5. Validar cada producto
    print("5. Validando productos seleccionados...\n")
    resultados_validacion = []
    
    for i, producto in enumerate(productos_a_validar, 1):
        resultado = validar_producto(producto, aditivos_db)
        resultados_validacion.append(resultado)
        
        print(f"[{i}/20] {resultado['producto']}")
        print(f"   Fuente: {resultado['fuente']} | EAN: {resultado['ean']}")
        print(f"   Aditivos detectados: {resultado['total_aditivos']}")
        print(f"   [OK] Validos: {resultado['aditivos_validos']}")
        print(f"   [ERROR] Invalidos: {resultado['aditivos_invalidos']}")
        
        if resultado['total_aditivos'] > 0:
            print(f"   Detalle de validaciones:")
            for val in resultado['validaciones']:
                estado = "[OK]" if val['es_valido'] else "[ERROR]"
                print(f"     {estado} {val['e_numero']}: {val['nombre_original']}")
                if not val['es_valido']:
                    print(f"        -> {val['mensaje']}")
        print()
    
    # 6. Resumen final
    print("="*100)
    print("RESUMEN DE VALIDACION")
    print("="*100)
    
    total_validados = len(resultados_validacion)
    total_aditivos = sum(r['total_aditivos'] for r in resultados_validacion)
    total_validos = sum(r['aditivos_validos'] for r in resultados_validacion)
    total_invalidos = sum(r['aditivos_invalidos'] for r in resultados_validacion)
    
    print(f"\nProductos validados: {total_validados}")
    print(f"Total aditivos en productos validados: {total_aditivos}")
    print(f"   [OK] Validos: {total_validos} ({total_validos/max(total_aditivos,1)*100:.1f}%)")
    print(f"   [ERROR] Invalidos: {total_invalidos} ({total_invalidos/max(total_aditivos,1)*100:.1f}%)")
    
    if total_aditivos > 0:
        precision = (total_validos / total_aditivos) * 100
        print(f"\nPRECISION: {precision:.1f}%")
        if precision == 100.0:
            print("   [PERFECTO] Todos los aditivos detectados son validos.")
        elif precision >= 90.0:
            print("   [EXCELENTE] Muy buena precision.")
        elif precision >= 75.0:
            print("   [BUENO] Buena precision, pero hay margen de mejora.")
        else:
            print("   [ATENCION] Precision baja, requiere revision.")
    
    # Mostrar productos con errores
    productos_con_errores = [r for r in resultados_validacion if r['aditivos_invalidos'] > 0]
    if productos_con_errores:
        print(f"\nProductos con aditivos invalidos ({len(productos_con_errores)}):")
        for r in productos_con_errores:
            print(f"   - {r['producto']} ({r['fuente']})")
            for val in r['validaciones']:
                if not val['es_valido']:
                    print(f"     * {val['e_numero']}: {val['mensaje']}")
    
    print("\n" + "="*100)
    print("VALIDACION COMPLETADA")
    print("="*100)
    
    # Guardar reporte detallado
    reporte_path = "reporte_validacion_20_productos.txt"
    with open(reporte_path, 'w', encoding='utf-8') as f:
        f.write("="*100 + "\n")
        f.write("REPORTE DETALLADO - VALIDACION DE 20 PRODUCTOS ALEATORIOS\n")
        f.write("="*100 + "\n\n")
        
        for r in resultados_validacion:
            f.write("-"*100 + "\n")
            f.write(f"Producto: {r['producto']}\n")
            f.write(f"Fuente: {r['fuente']} | EAN: {r['ean']}\n")
            f.write(f"Total aditivos: {r['total_aditivos']}\n")
            f.write(f"Validos: {r['aditivos_validos']} | Invalidos: {r['aditivos_invalidos']}\n\n")
            
            if r['total_aditivos'] > 0:
                f.write("Validaciones:\n")
                for val in r['validaciones']:
                    estado = "OK" if val['es_valido'] else "ERROR"
                    f.write(f"  [{estado}] {val['e_numero']}: {val['nombre_original']}\n")
                    f.write(f"    -> {val['mensaje']}\n")
            
            f.write(f"\nIngredientes (preview):\n{r['ingredientes_preview']}\n\n")
        
        f.write("="*100 + "\n")
        f.write("RESUMEN\n")
        f.write("="*100 + "\n")
        f.write(f"Total aditivos: {total_aditivos}\n")
        f.write(f"Validos: {total_validos} ({total_validos/max(total_aditivos,1)*100:.1f}%)\n")
        f.write(f"Invalidos: {total_invalidos} ({total_invalidos/max(total_aditivos,1)*100:.1f}%)\n")
        if total_aditivos > 0:
            f.write(f"Precision: {(total_validos / total_aditivos) * 100:.1f}%\n")
    
    print(f"\n[INFO] Reporte detallado guardado en: {reporte_path}")

if __name__ == "__main__":
    main()

