"""
Script de Validación - Detección de Aditivos con Nebius LLM
Procesa 5 productos a la vez para validar precisión
"""

import os
import json
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
from llm_analyzer import LLMAnalyzer, LLMConfig

def cargar_base_datos_aditivos():
    with open('aditivos.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def configurar_nebius_llm():
    api_key = os.environ.get('NEBIUS_API_KEY', '')
    model = os.getenv('OPENAI_MODEL', 'meta-llama/Llama-3.3-70B-Instruct')
    max_tokens = int(os.getenv('OPENAI_MAX_TOKENS', '8000'))
    temperature = float(os.getenv('OPENAI_TEMPERATURE', '0.2'))
    base_url = os.getenv('OPENAI_BASE_URL', 'https://api.studio.nebius.com/v1/')
    os.environ['OPENAI_API_KEY'] = api_key
    os.environ['OPENAI_BASE_URL'] = base_url
    config = LLMConfig(provider='openai', api_key=api_key, model=model, max_tokens=max_tokens, temperature=temperature)
    return LLMAnalyzer(config)

def validar_aditivo_en_texto(aditivo_detectado, texto_ingredientes, aditivos_db):
    """Valida que el nombre del aditivo aparezca literalmente en el texto O que su E-número aparezca directamente"""
    e_num = aditivo_detectado.get('e_numero', '').upper()
    aditivo_en_db = next((a for a in aditivos_db if a.get('e_numero', '').upper() == e_num), None)
    
    if not aditivo_en_db:
        return (False, f"E-numero {e_num} NO existe en la base de datos")
    
    # PRIMERO: Verificar si el E-número aparece directamente en el texto (evidencia suficiente)
    import re
    # Buscar E-número con o sin guión, con o sin letra (ej: E472c, E-472c, E472, E-472)
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
        if re.search(patron, texto_ingredientes, re.IGNORECASE):
            e_num_encontrado = True
            break
    
    # Si el E-número aparece directamente, es válido (no requiere validación de nombre)
    if e_num_encontrado:
        return (True, "Valido - E-numero aparece directamente en el texto")
    
    # SEGUNDO: Si no aparece el E-número, validar que el nombre aparezca
    nombres = aditivo_en_db.get('nombres_limpios', [])
    nombre_original = aditivo_en_db.get('nombre_original', '')
    if nombre_original:
        nombres.extend([n.strip().lower() for n in nombre_original.split(',')])
    
    texto_lower = texto_ingredientes.lower()
    import unicodedata
    texto_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', texto_lower) if unicodedata.category(c) != 'Mn')
    
    # CASO ESPECIAL: E-960 (Glicósidos de esteviol) - manejar variaciones ortográficas y mayúsculas
    if e_num.upper() == 'E-960':
        variantes_esteviol = ['glicósidos de esteviol', 'glucósidos de esteviol', 'glicosidos de esteviol', 
                             'glucosidos de esteviol', 'esteviósido', 'esteviosido', 'glucósidos de steviol',
                             'glicósidos de steviol', 'glucosidos de steviol', 'glicosidos de steviol',
                             'glucósidos de steviol', 'glicósidos de steviol']  # Con mayúsculas
        # Buscar variantes con y sin acentos
        for var in variantes_esteviol:
            var_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', var) if unicodedata.category(c) != 'Mn')
            if var in texto_lower or var_sin_acentos in texto_sin_acentos:
                # También buscar palabras clave separadas
                if ('glucósidos' in texto_lower or 'glicósidos' in texto_lower or 
                    'glucosidos' in texto_sin_acentos or 'glicosidos' in texto_sin_acentos):
                    if ('esteviol' in texto_lower or 'steviol' in texto_lower or
                        'esteviol' in texto_sin_acentos or 'steviol' in texto_sin_acentos):
                        return (True, "Valido - nombre aparece en el texto (E-960 con variaciones)")
    
    # Buscar si algún nombre aparece en el texto
    nombre_encontrado = False
    for nombre in nombres:
        if nombre and len(nombre) > 2:
            nombre_lower = nombre.lower().strip()
            nombre_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', nombre_lower) if unicodedata.category(c) != 'Mn')
            
            if nombre_lower in texto_lower or nombre_sin_acentos in texto_sin_acentos:
                nombre_encontrado = True
                break
    
    if not nombre_encontrado:
        return (False, f"Nombre del aditivo NO aparece literalmente en el texto (falso positivo)")
    
    return (True, "Valido - nombre aparece en el texto")

def analizar_producto(idx, producto_nombre, ingredientes, llm_analyzer, aditivos_db):
    if pd.isna(ingredientes) or not ingredientes or not str(ingredientes).strip():
        return {'idx': idx, 'producto': producto_nombre, 'ingredientes': None, 'ingredientes_completo': None,
                'aditivos_detectados': [], 'validaciones': [], 'total_aditivos': 0, 'aditivos_validos': 0,
                'aditivos_invalidos': 0, 'error': 'Sin ingredientes'}
    
    ingredientes_str = str(ingredientes).strip()
    
    try:
        aditivos_detectados = llm_analyzer.detect_additives_in_text(ingredientes_str, aditivos_db)
        
        validaciones = []
        aditivos_validos = 0
        aditivos_invalidos = 0
        
        for aditivo_info in aditivos_detectados:
            es_valido, mensaje = validar_aditivo_en_texto(aditivo_info, ingredientes_str, aditivos_db)
            validaciones.append({
                'e_numero': aditivo_info.get('e_numero', 'N/A'),
                'nombre': aditivo_info.get('aditivo', {}).get('nombre_original', 'N/A'),
                'es_valido': es_valido,
                'mensaje': mensaje
            })
            if es_valido:
                aditivos_validos += 1
            else:
                aditivos_invalidos += 1
        
        peligrosos = sum(1 for a in aditivos_detectados if 'Peligroso' in a.get('tipo', ''))
        sospechosos = sum(1 for a in aditivos_detectados if 'Sospechoso' in a.get('tipo', ''))
        no_nocivos = sum(1 for a in aditivos_detectados if 'No nocivo' in a.get('tipo', ''))
        
        return {
            'idx': idx, 'producto': producto_nombre, 'ingredientes': ingredientes_str[:200] + '...' if len(ingredientes_str) > 200 else ingredientes_str,
            'ingredientes_completo': ingredientes_str, 'aditivos_detectados': aditivos_detectados, 'validaciones': validaciones,
            'e_numeros': [a.get('e_numero', '') for a in aditivos_detectados], 'total_aditivos': len(aditivos_detectados),
            'aditivos_validos': aditivos_validos, 'aditivos_invalidos': aditivos_invalidos,
            'peligrosos': peligrosos, 'sospechosos': sospechosos, 'no_nocivos': no_nocivos, 'error': None
        }
    except Exception as e:
        return {'idx': idx, 'producto': producto_nombre, 'ingredientes': ingredientes_str[:200] + '...' if len(ingredientes_str) > 200 else ingredientes_str,
                'ingredientes_completo': ingredientes_str, 'aditivos_detectados': [], 'validaciones': [],
                'total_aditivos': 0, 'aditivos_validos': 0, 'aditivos_invalidos': 0,
                'peligrosos': 0, 'sospechosos': 0, 'no_nocivos': 0, 'error': str(e)}

def main():
    print("="*80)
    print("VALIDACION DE PRECISION - DETECCION DE ADITIVOS (PRODUCTOS 41-45)")
    print("="*80)
    print()
    
    print("1. Cargando base de datos de aditivos...")
    aditivos_db = cargar_base_datos_aditivos()
    print(f"   [OK] {len(aditivos_db)} aditivos cargados")
    print()
    
    print("2. Configurando Nebius LLM...")
    try:
        llm_analyzer = configurar_nebius_llm()
        print(f"   [OK] Nebius LLM configurado")
    except Exception as e:
        print(f"   [ERROR] Error configurando LLM: {e}")
        return
    print()
    
    print("3. Cargando productos del Excel (productos 41-45)...")
    try:
        df_all = pd.read_excel('MyProtein_Data_All_Products.xlsx')
        df = df_all.iloc[40:45].copy()  # Productos 41-45 (índices 40-44)
        df.reset_index(drop=True, inplace=True)
        print(f"   [OK] {len(df)} productos cargados (productos 41-45)")
    except Exception as e:
        print(f"   [ERROR] Error cargando Excel: {e}")
        return
    print()
    
    print("4. Analizando y validando productos...\n")
    resultados = []
    
    for idx, row in df.iterrows():
        producto_nombre = row.get('product_name', 'Sin nombre')
        ingredientes = row.get('ingredients')
        producto_num = idx + 41  # Productos 41-45
        
        print(f"[{producto_num}/246] {producto_nombre}")
        print("-" * 80)
        
        try:
            resultado = analizar_producto(producto_num, producto_nombre, ingredientes, llm_analyzer, aditivos_db)
            resultados.append(resultado)
            
            if resultado['error']:
                print(f"[ERROR] {resultado['error']}\n")
            elif not resultado['ingredientes']:
                print("[WARNING] Sin ingredientes disponibles\n")
            else:
                ingredientes_completo = resultado.get('ingredientes_completo', resultado.get('ingredientes', ''))
                
                # Mostrar texto de ingredientes
                print("\n" + "-" * 80)
                print("TEXTO DE INGREDIENTES:")
                print("-" * 80)
                print(ingredientes_completo)
                print("-" * 80)
                
                # Mostrar resumen de detección
                print(f"\nRESUMEN DE DETECCION:")
                print(f"   Total detectados: {resultado['total_aditivos']}")
                print(f"   [OK] Validos: {resultado['aditivos_validos']}")
                print(f"   [ERROR] Invalidos: {resultado['aditivos_invalidos']}")
                
                # Mostrar aditivos en formato JSON
                if resultado['total_aditivos'] > 0:
                    print(f"\nADITIVOS DETECTADOS (JSON):")
                    print("-" * 80)
                    aditivos_json = []
                    for i, aditivo in enumerate(resultado['aditivos_detectados']):
                        validacion = resultado['validaciones'][i]
                        aditivo_info = {
                            "e_numero": aditivo.get('e_numero', 'N/A'),
                            "nombre_original": aditivo.get('aditivo', {}).get('nombre_original', 'N/A'),
                            "tipo": aditivo.get('tipo', 'N/A'),
                            "origen": aditivo.get('origen', 'N/A'),
                            "clasificacion": aditivo.get('clasificacion', 'N/A'),
                            "valido": validacion['es_valido'],
                            "mensaje_validacion": validacion['mensaje']
                        }
                        aditivos_json.append(aditivo_info)
                    
                    print(json.dumps(aditivos_json, indent=2, ensure_ascii=False))
                    print("-" * 80)
                else:
                    print(f"\nADITIVOS DETECTADOS: Ninguno")
                    print("-" * 80)
                print()
        except Exception as e:
            print(f"  [ERROR] Excepcion: {str(e)}\n")
    
    print("\n" + "="*80)
    print("RESUMEN DE VALIDACION")
    print("="*80)
    
    total_productos = len(resultados)
    total_aditivos = sum(r['total_aditivos'] for r in resultados)
    total_validos = sum(r['aditivos_validos'] for r in resultados)
    total_invalidos = sum(r['aditivos_invalidos'] for r in resultados)
    
    print(f"\nProductos analizados: {total_productos}")
    print(f"Total aditivos detectados: {total_aditivos}")
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
    else:
        print(f"\n[WARNING] No se detectaron aditivos en este batch.")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    main()

