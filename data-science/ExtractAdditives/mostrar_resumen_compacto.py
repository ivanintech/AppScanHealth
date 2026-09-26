"""
Script para mostrar resumen compacto de todos los productos 26-45
"""
import pandas as pd
import json
from llm_analyzer import LLMAnalyzer, LLMConfig
import os
from dotenv import load_dotenv

load_dotenv()

# Cargar base de datos
with open('aditivos.json', 'r', encoding='utf-8') as f:
    aditivos_db = json.load(f)

# Configurar LLM
api_key = os.environ.get('NEBIUS_API_KEY', '')
model = os.getenv('OPENAI_MODEL', 'meta-llama/Llama-3.3-70B-Instruct')
max_tokens = int(os.getenv('OPENAI_MAX_TOKENS', '8000'))
temperature = float(os.getenv('OPENAI_TEMPERATURE', '0.2'))
base_url = os.getenv('OPENAI_BASE_URL', 'https://api.studio.nebius.com/v1/')
os.environ['OPENAI_API_KEY'] = api_key
os.environ['OPENAI_BASE_URL'] = base_url
config = LLMConfig(provider='openai', api_key=api_key, model=model, max_tokens=max_tokens, temperature=temperature)
llm_analyzer = LLMAnalyzer(config)

# Cargar productos 26-45
df_all = pd.read_excel('MyProtein_Data_All_Products.xlsx')
df = df_all.iloc[25:45].copy()

resultados_completos = []

for idx, row in df.iterrows():
    producto_num = idx + 26
    producto_nombre = row.get('product_name', 'Sin nombre')
    ingredientes = row.get('ingredients', '')
    
    if not ingredientes or pd.isna(ingredientes):
        resultados_completos.append({
            "producto_num": producto_num,
            "producto_nombre": producto_nombre,
            "ingredientes": None,
            "aditivos_detectados": []
        })
        continue
    
    # Detectar aditivos
    try:
        aditivos_detectados = llm_analyzer.detect_additives_in_text(ingredientes, aditivos_db)
        
        # Formatear aditivos
        aditivos_json = []
        for aditivo in aditivos_detectados:
            e_num = aditivo.get('e_numero', 'N/A')
            aditivo_info = aditivo.get('aditivo', {})
            nombre = aditivo_info.get('nombre_original', 'N/A')
            tipo = aditivo.get('tipo', 'N/A')
            origen = aditivo.get('origen', 'N/A')
            clasificacion = aditivo.get('clasificacion', 'N/A')
            
            aditivos_json.append({
                "e_numero": e_num,
                "nombre_original": nombre,
                "tipo": tipo,
                "origen": origen,
                "clasificacion": clasificacion
            })
        
        resultados_completos.append({
            "producto_num": producto_num,
            "producto_nombre": producto_nombre,
            "ingredientes": ingredientes,
            "aditivos_detectados": aditivos_json
        })
        
    except Exception as e:
        resultados_completos.append({
            "producto_num": producto_num,
            "producto_nombre": producto_nombre,
            "ingredientes": ingredientes,
            "aditivos_detectados": [],
            "error": str(e)
        })

# Guardar en archivo JSON
with open('resultados_batches_26-45.json', 'w', encoding='utf-8') as f:
    json.dump(resultados_completos, f, indent=2, ensure_ascii=False)

# Mostrar resumen en consola
print("="*100)
print("RESUMEN COMPACTO - PRODUCTOS 26-45")
print("="*100)
print()

for resultado in resultados_completos:
    producto_num = resultado['producto_num']
    producto_nombre = resultado['producto_nombre']
    ingredientes = resultado['ingredientes']
    aditivos = resultado['aditivos_detectados']
    
    print(f"\n{'='*100}")
    print(f"PRODUCTO #{producto_num}: {producto_nombre}")
    print(f"{'='*100}")
    
    if ingredientes is None:
        print("[SIN INGREDIENTES]")
        continue
    
    print(f"\nTEXTO DE INGREDIENTES:")
    print(f"{ingredientes}")
    
    print(f"\nADITIVOS DETECTADOS ({len(aditivos)}):")
    if len(aditivos) == 0:
        print("  Ninguno")
    else:
        print(json.dumps(aditivos, indent=2, ensure_ascii=False))
    
    print()

print("="*100)
print(f"Total productos: {len(resultados_completos)}")
total_aditivos = sum(len(r['aditivos_detectados']) for r in resultados_completos)
print(f"Total aditivos detectados: {total_aditivos}")
print("="*100)
print("\nArchivo JSON guardado en: resultados_batches_26-45.json")

