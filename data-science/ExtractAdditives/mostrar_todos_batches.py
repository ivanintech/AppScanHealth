"""
Script para mostrar todos los productos de los batches 26-45 con sus aditivos detectados
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

# Cargar productos 26-45 (batches 26-30, 31-35, 36-40, 41-45)
df_all = pd.read_excel('MyProtein_Data_All_Products.xlsx')
df = df_all.iloc[25:45].copy()  # Productos 26-45 (índices 25-44)

print("="*100)
print("RESUMEN COMPLETO - PRODUCTOS 26-45 (BATCHES 1-4)")
print("="*100)
print()

total_aditivos = 0
total_validos = 0
total_invalidos = 0

for idx, row in df.iterrows():
    producto_num = idx + 26
    producto_nombre = row.get('product_name', 'Sin nombre')
    ingredientes = row.get('ingredients', '')
    
    print("="*100)
    print(f"PRODUCTO #{producto_num}: {producto_nombre}")
    print("="*100)
    
    if not ingredientes or pd.isna(ingredientes):
        print("[SIN INGREDIENTES]")
        print()
        continue
    
    print("\nTEXTO DE INGREDIENTES:")
    print("-"*100)
    print(ingredientes)
    print("-"*100)
    
    # Detectar aditivos
    try:
        aditivos_detectados = llm_analyzer.detect_additives_in_text(ingredientes, aditivos_db)
        
        print(f"\nADITIVOS DETECTADOS (FINALES): {len(aditivos_detectados)}")
        print("-"*100)
        
        if len(aditivos_detectados) == 0:
            print("Ninguno")
        else:
            # Crear lista JSON para mostrar
            aditivos_json = []
            for aditivo in aditivos_detectados:
                e_num = aditivo.get('e_numero', 'N/A')
                aditivo_info = aditivo.get('aditivo', {})
                nombre = aditivo_info.get('nombre_original', 'N/A')
                tipo = aditivo.get('tipo', 'N/A')
                origen = aditivo.get('origen', 'N/A')
                clasificacion = aditivo.get('clasificacion', 'N/A')
                
                aditivo_json = {
                    "e_numero": e_num,
                    "nombre_original": nombre,
                    "tipo": tipo,
                    "origen": origen,
                    "clasificacion": clasificacion
                }
                aditivos_json.append(aditivo_json)
                
                # Mostrar también en formato legible
                tipo_icon = "[PELIGROSO]" if "Peligroso" in tipo else "[SOSPECHOSO]" if "Sospechoso" in tipo else "[NO NOCIVO]"
                print(f"  [{e_num}] {nombre}")
                print(f"      {tipo_icon} {tipo} | Origen: {origen} | Clasificacion: {clasificacion}")
            
            print("\nFORMATO JSON:")
            print(json.dumps(aditivos_json, indent=2, ensure_ascii=False))
        
        total_aditivos += len(aditivos_detectados)
        print("-"*100)
        print()
        
    except Exception as e:
        print(f"[ERROR] {e}\n")

print("="*100)
print("RESUMEN TOTAL")
print("="*100)
print(f"Productos analizados: {len(df)}")
print(f"Total aditivos detectados: {total_aditivos}")
print(f"Promedio por producto: {total_aditivos/len(df):.1f}")
print("="*100)

