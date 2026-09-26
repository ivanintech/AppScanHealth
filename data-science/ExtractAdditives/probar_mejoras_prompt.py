"""
Script para probar las mejoras del prompt con productos específicos
Compara detección ANTES vs DESPUÉS de las mejoras
"""

import json
import sys
from pathlib import Path

# Añadir el directorio actual al path para importar llm_analyzer
sys.path.insert(0, str(Path(__file__).parent))

from llm_analyzer import LLMAnalyzer, LLMConfig, create_llm_config_from_env

def probar_productos_especificos():
    """Prueba las mejoras con productos específicos que tenían problemas"""
    
    print("="*100)
    print("PRUEBA DE MEJORAS DEL PROMPT")
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
    
    # Seleccionar productos problemáticos específicos
    productos_prueba = [
        {
            'nombre': 'L-TEANINA 200mg',
            'texto': 'L-teanina, inositol, cápsula vegetal [agente de recubrimiento (hidroxipropilmetilcelulosa)], antiaglomerantes [ácidos grasos (fuente vegetal), dióxido de silicio].',
            'problema': 'Detectaba E-470, E-471, E-472, etc. cuando solo debería detectar E-570 y E-551'
        },
        {
            'nombre': 'BCAA Comprimidos - 90Tabletas',
            'texto': 'Preparado de Aminoácidos de Cadena Ramificada (2:1:1) (Hidroxipropilmetilcelulosa), Agente de Carga (Celulosa Microcristalina), Agente Antiaglomerante (Estearato de Magnesio, Dióxido de Silicio), Vitamina B6 (Clorhidrato de Piridoxina), Vitamina B1 (Clorhidrato de Tiamina), Agente de Recubrimiento (Hidroxipropilmetilcelulosa), Colorante (Óxido de Hierro, Óxido de Calcio, Óxido de Magnesio).',
            'problema': 'No detectaba E-172, E-529, E-530 (óxidos con abreviaciones)'
        },
        {
            'nombre': 'VITAMINA D3 LIPOSOMADA VEGANA',
            'texto': 'Vitamina D3 liposomada [estabilizante (goma arábiga), emulgente (lecitinas), colecalciferol (vitamina D3), antioxidante (alfa-tocoferol)], agente de carga (celulosa microcristalina), cápsula vegetal [agente de recubrimiento (hidroxipropilmetilcelulosa), estabilizante (hidroxipropilcelulosa), antiaglomerantes [dióxido de silicio, ácidos grasos (fuente vegetal)]].',
            'problema': 'Detectaba múltiples aditivos relacionados con ácidos grasos cuando solo debería detectar E-570'
        },
        {
            'nombre': 'Mezcla de Tortitas Proteicas - 200g - Chocolate',
            'texto': ': Mezcla de Proteínas (31%) (Concentrado de Proteína de Suero (Leche), Concentrado de proteína de Leche, Clara de Huevo en Polvo), Harina de Avena (13%), Cacao en Polvo, Triglicéridos de Cadena Media (TCM) (68-75%), Caseinato de Sodio (Leche), Sólidos de Jarabe de Glucosa, Emulsionante (E472c), Gasificante (Bicarbonato de Sodio), Edulcorante (Sucralosa), Emulsionante (Lecitina de Soja).',
            'problema': 'Tenía falso positivo con E-472, debería detectar E-472c (con letra) o E-472 base'
        }
    ]
    
    print("3. Probando productos específicos con mejoras...")
    print()
    
    resultados = []
    
    for i, producto_prueba in enumerate(productos_prueba, 1):
        print(f"   [{i}/{len(productos_prueba)}] Probando: {producto_prueba['nombre']}")
        print(f"      Problema conocido: {producto_prueba['problema']}")
        print(f"      Texto: {producto_prueba['texto'][:100]}...")
        
        try:
            # Detectar aditivos con el LLM mejorado
            aditivos_detectados = llm_analyzer.detect_additives_in_text(
                producto_prueba['texto'], 
                aditivos_db
            )
            
            e_numeros_detectados = [a.get('e_numero', '') for a in aditivos_detectados]
            
            resultado = {
                'producto': producto_prueba['nombre'],
                'texto': producto_prueba['texto'],
                'problema_esperado': producto_prueba['problema'],
                'aditivos_detectados': e_numeros_detectados,
                'total_detectados': len(aditivos_detectados)
            }
            resultados.append(resultado)
            
            print(f"      ✅ Detectados: {', '.join(e_numeros_detectados) if e_numeros_detectados else 'Ninguno'}")
            print()
            
        except Exception as e:
            print(f"      ❌ Error: {e}")
            print()
            resultados.append({
                'producto': producto_prueba['nombre'],
                'error': str(e)
            })
    
    # Guardar resultados
    resultados_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\prueba_mejoras_prompt.json")
    with open(resultados_path, 'w', encoding='utf-8') as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    
    print(f"4. Resultados guardados en: {resultados_path}")
    print()
    
    # Análisis de resultados
    print("="*100)
    print("ANÁLISIS DE RESULTADOS")
    print("="*100)
    print()
    
    for resultado in resultados:
        if 'error' in resultado:
            print(f"❌ {resultado['producto']}: Error - {resultado['error']}")
            continue
        
        print(f"📦 {resultado['producto']}")
        print(f"   Problema esperado: {resultado['problema_esperado']}")
        print(f"   Aditivos detectados: {', '.join(resultado['aditivos_detectados']) if resultado['aditivos_detectados'] else 'Ninguno'}")
        
        # Verificar si se resolvió el problema
        if 'ácidos grasos' in resultado['texto'].lower():
            if 'E-570' in resultado['aditivos_detectados']:
                # Verificar que NO detectó los relacionados incorrectamente
                relacionados_incorrectos = ['E-470', 'E-470B', 'E-471', 'E-472', 'E-473', 'E-474', 'E-475', 'E-476', 'E-477', 'E-478', 'E-479']
                detectados_incorrectos = [e for e in resultado['aditivos_detectados'] if e in relacionados_incorrectos]
                if not detectados_incorrectos:
                    print(f"   ✅ CORRECTO: Detectó E-570 y NO detectó incorrectamente los relacionados")
                else:
                    print(f"   ⚠️ PROBLEMA: Detectó incorrectamente: {', '.join(detectados_incorrectos)}")
            else:
                print(f"   ⚠️ PROBLEMA: No detectó E-570 cuando debería")
        
        if 'E472c' in resultado['texto'] or 'E-472c' in resultado['texto']:
            if 'E-472' in resultado['aditivos_detectados'] or 'E-472c' in resultado['aditivos_detectados']:
                print(f"   ✅ CORRECTO: Detectó E-472 o E-472c")
            else:
                print(f"   ⚠️ PROBLEMA: No detectó E-472 cuando aparece E472c en el texto")
        
        if 'Óxido de Hierro' in resultado['texto'] or 'Óxido de Fe' in resultado['texto']:
            if 'E-172' in resultado['aditivos_detectados']:
                print(f"   ✅ CORRECTO: Detectó E-172 (Óxido de hierro/Fe)")
            else:
                print(f"   ⚠️ PROBLEMA: No detectó E-172")
        
        if 'Óxido de Calcio' in resultado['texto'] or 'Óxido de Ca' in resultado['texto']:
            if 'E-529' in resultado['aditivos_detectados']:
                print(f"   ✅ CORRECTO: Detectó E-529 (Óxido de Ca/calcio)")
            else:
                print(f"   ⚠️ PROBLEMA: No detectó E-529")
        
        if 'Óxido de Magnesio' in resultado['texto'] or 'Óxido de Mg' in resultado['texto']:
            if 'E-530' in resultado['aditivos_detectados']:
                print(f"   ✅ CORRECTO: Detectó E-530 (Óxido de Mg/magnesio)")
            else:
                print(f"   ⚠️ PROBLEMA: No detectó E-530")
        
        print()

if __name__ == "__main__":
    probar_productos_especificos()


