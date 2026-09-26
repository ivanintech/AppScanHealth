import pandas as pd
import json

df = pd.read_excel('resultados_aditivos_doble_excel_20251119_040457.xlsx', engine='openpyxl')
with open('resultados_aditivos_doble_excel_20251119_040457.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)

print('Total Excel:', len(df))
print('Total JSON:', len(json_data))
print('Excel con ingredientes:', df['ingredientes'].notna().sum())

# Verificar primer producto
print('\nPrimer producto:')
print('Excel EAN:', df.iloc[0]['ean'], type(df.iloc[0]['ean']))
print('JSON EAN:', json_data[0]['ean'], type(json_data[0]['ean']))
ean_excel = str(df.iloc[0]['ean']).replace('.0', '').strip()
ean_json = str(json_data[0]['ean']).replace('.0', '').strip()
print('Match:', ean_excel == ean_json)
print('Excel tiene ingredientes:', pd.notna(df.iloc[0]['ingredientes']))
if pd.notna(df.iloc[0]['ingredientes']):
    print('Ingredientes preview:', str(df.iloc[0]['ingredientes'])[:100])



