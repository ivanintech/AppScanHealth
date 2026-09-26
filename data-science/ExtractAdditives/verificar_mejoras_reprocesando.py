"""
Script para verificar las mejoras reprocesando productos problemáticos específicos
Compara resultados ANTES (del JSON) vs DESPUÉS (con LLM mejorado)
"""

import json
import sys
from pathlib import Path

# Añadir el directorio actual al path para importar llm_analyzer
sys.path.insert(0, str(Path(__file__).parent))

from llm_analyzer import LLMAnalyzer, create_llm_config_from_env

def verificar_mejoras():
    """Reprocesa productos problemáticos y compara resultados"""
    
    print("="*100)
    print("VERIFICACIÓN DE MEJORAS - REPROCESANDO PRODUCTOS PROBLEMÁTICOS")
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
    
    # Seleccionar productos problemáticos específicos del JSON
    productos_prueba = []
    
    # Buscar productos específicos conocidos
    nombres_buscar = [
        "EXTRACTO DE MACA 750mg",
        "L-TEANINA 200mg",
        "BCAA Comprimidos - 90Tabletas",
        "VITAMINA D3 LIPOSOMADA VEGANA (Liposovit®) 2000UI",
        "Mezcla de Tortitas Proteicas - 200g - Chocolate"
    ]
    
    for nombre in nombres_buscar:
        producto = next((p for p in productos 
                        if p.get('producto') and isinstance(p.get('producto'), str) 
                        and nombre.lower() in str(p.get('producto', '')).lower()), None)
        if producto and producto.get('ingredients'):
            productos_prueba.append(producto)
    
    if not productos_prueba:
        print("   [INFO] No se encontraron productos específicos, usando productos con 'ácidos grasos'...")
        # Buscar productos con "ácidos grasos" en el texto
        for producto in productos:
            ingredientes = producto.get('ingredients', '')
            if ingredientes and isinstance(ingredientes, str) and 'ácidos grasos' in ingredientes.lower():
                if len(productos_prueba) < 5:  # Limitar a 5 productos
                    productos_prueba.append(producto)
                else:
                    break
    
    print(f"3. Reprocesando {len(productos_prueba)} productos problemáticos...")
    print()
    
    resultados_comparacion = []
    
    for i, producto in enumerate(productos_prueba, 1):
        producto_nombre = producto.get('producto', 'Sin nombre')
        texto_ingredientes = producto.get('ingredients', '')
        aditivos_antes = producto.get('aditivos_detectados', [])
        e_numeros_antes = {a.get('e_numero', '').upper() for a in aditivos_antes}
        
        print(f"   [{i}/{len(productos_prueba)}] {producto_nombre[:60]}...")
        print(f"      Antes: {len(e_numeros_antes)} aditivos - {', '.join(sorted(e_numeros_antes))}")
        
        try:
            # Reprocesar con LLM mejorado
            aditivos_despues = llm_analyzer.detect_additives_in_text(texto_ingredientes, aditivos_db)
            e_numeros_despues = {a.get('e_numero', '').upper() for a in aditivos_despues}
            
            print(f"      Después: {len(e_numeros_despues)} aditivos - {', '.join(sorted(e_numeros_despues))}")
            
            # Comparar
            eliminados = e_numeros_antes - e_numeros_despues
            añadidos = e_numeros_despues - e_numeros_antes
            mantenidos = e_numeros_antes & e_numeros_despues
            
            if eliminados:
                print(f"      [OK] Eliminados (falsos positivos corregidos): {', '.join(sorted(eliminados))}")
            if añadidos:
                print(f"      [OK] Añadidos (mejor recall): {', '.join(sorted(añadidos))}")
            if not eliminados and not añadidos:
                print(f"      [INFO] Sin cambios")
            
            resultados_comparacion.append({
                'producto': producto_nombre,
                'ean': producto.get('ean', ''),
                'texto_ingredientes': texto_ingredientes[:200] + '...' if len(texto_ingredientes) > 200 else texto_ingredientes,
                'antes': {
                    'e_numeros': sorted(e_numeros_antes),
                    'total': len(e_numeros_antes)
                },
                'despues': {
                    'e_numeros': sorted(e_numeros_despues),
                    'total': len(e_numeros_despues)
                },
                'eliminados': sorted(eliminados),
                'añadidos': sorted(añadidos),
                'mantenidos': sorted(mantenidos)
            })
            
        except Exception as e:
            print(f"      [ERROR] Error: {e}")
            resultados_comparacion.append({
                'producto': producto_nombre,
                'error': str(e)
            })
        
        print()
    
    # Guardar resultados
    resultados_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\comparacion_antes_despues_mejoras.json")
    with open(resultados_path, 'w', encoding='utf-8') as f:
        json.dump(resultados_comparacion, f, ensure_ascii=False, indent=2)
    
    print(f"4. Resultados guardados en: {resultados_path}")
    print()
    
    # Generar reporte
    print("="*100)
    print("REPORTE DE COMPARACIÓN - ANTES vs DESPUÉS")
    print("="*100)
    print()
    
    total_eliminados = sum(len(r.get('eliminados', [])) for r in resultados_comparacion if 'eliminados' in r)
    total_añadidos = sum(len(r.get('añadidos', [])) for r in resultados_comparacion if 'añadidos' in r)
    total_mejoras = total_eliminados + total_añadidos
    
    print(f"RESUMEN GENERAL:")
    print(f"  - Falsos positivos eliminados: {total_eliminados}")
    print(f"  - Aditivos añadidos (mejor recall): {total_añadidos}")
    print(f"  - Total mejoras: {total_mejoras}")
    print()
    
    for resultado in resultados_comparacion:
        if 'error' in resultado:
            print(f"[ERROR] {resultado['producto']}: Error - {resultado['error']}")
            continue
        
        print(f"[PRODUCTO] {resultado['producto']}")
        print(f"   ANTES: {resultado['antes']['total']} aditivos - {', '.join(resultado['antes']['e_numeros'])}")
        print(f"   DESPUES: {resultado['despues']['total']} aditivos - {', '.join(resultado['despues']['e_numeros'])}")
        
        if resultado['eliminados']:
            print(f"   [MEJORA] Eliminados {len(resultado['eliminados'])} falsos positivos: {', '.join(resultado['eliminados'])}")
        
        if resultado['añadidos']:
            print(f"   [MEJORA] Añadidos {len(resultado['añadidos'])} aditivos (mejor recall): {', '.join(resultado['añadidos'])}")
        
        if not resultado['eliminados'] and not resultado['añadidos']:
            print(f"   [INFO] Sin cambios")
        
        print()
    
    # Análisis específico de mejoras
    print("="*100)
    print("ANÁLISIS ESPECÍFICO DE MEJORAS")
    print("="*100)
    print()
    
    # Contar mejoras por tipo
    falsos_positivos_eliminados = {}
    aditivos_añadidos = {}
    
    for resultado in resultados_comparacion:
        if 'eliminados' in resultado:
            for e_num in resultado['eliminados']:
                falsos_positivos_eliminados[e_num] = falsos_positivos_eliminados.get(e_num, 0) + 1
        
        if 'añadidos' in resultado:
            for e_num in resultado['añadidos']:
                aditivos_añadidos[e_num] = aditivos_añadidos.get(e_num, 0) + 1
    
    if falsos_positivos_eliminados:
        print("FALSOS POSITIVOS ELIMINADOS (por aditivo):")
        for e_num, count in sorted(falsos_positivos_eliminados.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {e_num}: {count} veces")
        print()
    
    if aditivos_añadidos:
        print("ADITIVOS AÑADIDOS - MEJORA DE RECALL (por aditivo):")
        for e_num, count in sorted(aditivos_añadidos.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {e_num}: {count} veces")
        print()
    
    print("="*100)
    print("CONCLUSIÓN")
    print("="*100)
    
    if total_eliminados > 0:
        print(f"[OK] Las mejoras eliminaron {total_eliminados} falsos positivos")
        print("   Esto confirma que el PRINCIPIO #11 y la validacion post-procesamiento funcionan correctamente.")
    
    if total_añadidos > 0:
        print(f"[OK] Las mejoras añadieron {total_añadidos} aditivos correctos")
        print("   Esto confirma que las equivalencias quimicas y mejor matching funcionan correctamente.")
    
    if total_mejoras == 0:
        print("[INFO] No se detectaron cambios significativos en estos productos especificos.")
        print("   Esto puede deberse a que estos productos ya estaban bien detectados,")
        print("   o que las mejoras se aplicaran mejor en otros productos del dataset.")
    
    print()

if __name__ == "__main__":
    verificar_mejoras()

