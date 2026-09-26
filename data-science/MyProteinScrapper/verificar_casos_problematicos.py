"""Script para verificar casos donde la limpieza resultó en textos muy cortos."""
import pandas as pd
import sys
import re
sys.path.insert(0, '.')

from myprotein_ingredients_scraper import _clean_ingredients_text

# Cargar ambas bases de datos
df_original = pd.read_excel('MyProtein_Data_All_Products_Final.xlsx', engine='openpyxl')
df_corregido = pd.read_excel('MyProtein_Data_All_Products_Final_Corregido.xlsx', engine='openpyxl')

print("="*80)
print("VERIFICACION DE CASOS PROBLEMATICOS")
print("="*80)

# Buscar casos donde la corrección resultó en texto muy corto
casos_problematicos = []

for idx, row_orig in df_original.iterrows():
    if idx >= len(df_corregido):
        continue
    
    row_corr = df_corregido.iloc[idx]
    
    ingredientes_orig = str(row_orig.get('ingredients', '')).strip() if pd.notna(row_orig.get('ingredients')) else ''
    ingredientes_corr = str(row_corr.get('ingredients', '')).strip() if pd.notna(row_corr.get('ingredients')) else ''
    
    len_orig = len(ingredientes_orig)
    len_corr = len(ingredientes_corr)
    
    # Si la corrección resultó en texto muy corto (menos del 20% del original)
    if len_orig > 200 and len_corr < len_orig * 0.2 and len_corr < 100:
        casos_problematicos.append({
            'idx': idx,
            'producto': row_orig.get('product_name', 'Sin nombre'),
            'flavour': row_orig.get('flavour', ''),
            'original': ingredientes_orig,
            'corregido': ingredientes_corr,
            'len_orig': len_orig,
            'len_corr': len_corr
        })

print(f"\nCasos problemáticos encontrados: {len(casos_problematicos)}")

if casos_problematicos:
    print("\nAnalizando casos problemáticos...")
    for i, caso in enumerate(casos_problematicos[:10], 1):
        print(f"\n{'='*80}")
        print(f"CASO {i}: {caso['producto']}")
        print(f"{'='*80}")
        print(f"Flavour: {caso['flavour']}")
        print(f"Longitud: {caso['len_orig']} -> {caso['len_corr']} chars")
        
        # Verificar si tiene múltiples sabores
        sabores_orig = len(re.findall(r'Sabor\s+[^:]+?:', caso['original'], re.IGNORECASE | re.DOTALL))
        print(f"Secciones de sabor en original: {sabores_orig}")
        
        print(f"\n--- TEXTO ORIGINAL (primeros 500 chars) ---")
        print(caso['original'][:500])
        
        print(f"\n--- TEXTO CORREGIDO ---")
        print(caso['corregido'])
        
        # Intentar aplicar la corrección de nuevo para ver qué pasa
        if caso['flavour']:
            resultado_test = _clean_ingredients_text(caso['original'], caso['flavour'])
            print(f"\n--- RESULTADO DE PRUEBA ---")
            print(f"Longitud: {len(resultado_test)} chars")
            print(f"Texto: {resultado_test[:500] if len(resultado_test) > 0 else '(vacío)'}")
            
            if len(resultado_test) == 0:
                print(f"[PROBLEMA] La función devolvió texto vacío")
            elif len(resultado_test) < 50:
                print(f"[ATENCION] La función devolvió texto muy corto")
            else:
                print(f"[OK] La función devolvió texto de longitud razonable")

print("\n" + "="*80)



