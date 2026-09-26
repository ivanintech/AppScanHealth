"""
Script para mostrar los textos y aditivos detectados del batch 36-40
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

# Cargar productos 36-40
df_all = pd.read_excel('MyProtein_Data_All_Products.xlsx')
df = df_all.iloc[35:40].copy()

for idx, row in df.iterrows():
    producto_num = idx + 36
    producto_nombre = row.get('product_name', 'Sin nombre')
    ingredientes = row.get('ingredients')
    
    print('='*80)
    print(f'PRODUCTO {producto_num}: {producto_nombre}')
    print('='*80)
    print('\nTEXTO DE INGREDIENTES:')
    print('-'*80)
    print(ingredientes)
    print('-'*80)
    
    # Detectar aditivos
    try:
        aditivos_detectados = llm_analyzer.detect_additives_in_text(ingredientes, aditivos_db)
        
        print(f'\nADITIVOS DETECTADOS ({len(aditivos_detectados)}):')
        print('-'*80)
        for i, aditivo in enumerate(aditivos_detectados, 1):
            e_num = aditivo.get('e_numero', 'N/A')
            aditivo_info = aditivo.get('aditivo', {})
            nombre = aditivo_info.get('nombre_original', 'N/A')
            tipo = aditivo.get('tipo', 'N/A')
            origen = aditivo.get('origen', 'N/A')
            clasificacion = aditivo.get('clasificacion', 'N/A')
            print(f'\n{i}. [{e_num}] {nombre}')
            print(f'   Tipo: {tipo}')
            print(f'   Origen: {origen}')
            print(f'   Clasificacion: {clasificacion}')
            
            # Buscar en la base de datos para verificar
            aditivo_en_db = next((a for a in aditivos_db if a.get('e_numero', '').upper() == e_num.upper()), None)
            if aditivo_en_db:
                nombre_db = aditivo_en_db.get('nombre_original', 'N/A')
                nombres_limpios = aditivo_en_db.get('nombres_limpios', [])
                print(f'   Nombres en DB: {nombre_db}')
                print(f'   Nombres limpios: {nombres_limpios}')
        print('-'*80)
        print()
    except Exception as e:
        print(f'ERROR: {e}\n')

