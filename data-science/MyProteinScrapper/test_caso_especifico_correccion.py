"""Test para verificar por qué no se están filtrando correctamente algunos productos."""
import pandas as pd
import sys
from pathlib import Path

sys.path.insert(0, '.')
from myprotein_ingredients_scraper import _clean_ingredients_text

# Cargar la BD corregida
bd = Path("MyProtein_Data_All_Products_Final OLD_Corregido.xlsx")
sheets = pd.read_excel(bd, sheet_name=None, engine='openpyxl')

# Buscar un caso específico problemático
print("="*80)
print("TEST DE CASO ESPECÍFICO: Clear Whey Isolate - Naranja y Mango")
print("="*80)

df_proteinas = sheets['Proteinas']

# Buscar el producto
producto = df_proteinas[df_proteinas['product_name'].str.contains('Clear Whey Isolate.*Naranja.*Mango', case=False, na=False)]

if len(producto) > 0:
    row = producto.iloc[0]
    print(f"\nProducto encontrado: {row['product_name']}")
    print(f"Flavour: {row.get('flavour', 'N/A')}")
    
    ingredientes_actuales = str(row.get('ingredients', ''))
    print(f"\nIngredientes actuales (primeros 500 chars):")
    print(ingredientes_actuales[:500])
    print("...")
    
    # Aplicar limpieza manualmente
    print("\n" + "="*80)
    print("APLICANDO LIMPIEZA MANUALMENTE")
    print("="*80)
    
    flavour = row.get('flavour', '')
    ingredientes_limpiados = _clean_ingredients_text(ingredientes_actuales, flavour)
    
    print(f"\nIngredientes después de limpieza (primeros 500 chars):")
    print(ingredientes_limpiados[:500] if ingredientes_limpiados else "(vacío)")
    
    print(f"\nLongitud original: {len(ingredientes_actuales)}")
    print(f"Longitud después de limpieza: {len(ingredientes_limpiados)}")
    
    if ingredientes_actuales == ingredientes_limpiados:
        print("\n⚠️ PROBLEMA: La limpieza no cambió nada. El matching no funcionó.")
    elif not ingredientes_limpiados:
        print("\n⚠️ PROBLEMA: La limpieza devolvió vacío. El matching falló completamente.")
    else:
        print("\n✅ La limpieza funcionó correctamente.")
else:
    print("Producto no encontrado")

# Probar con otro caso: Clear Vegan Protein
print("\n\n" + "="*80)
print("TEST DE CASO ESPECÍFICO: Clear Vegan Protein - Lima y Limón")
print("="*80)

producto2 = df_proteinas[df_proteinas['product_name'].str.contains('Clear Vegan Protein.*Lima.*Lim', case=False, na=False)]

if len(producto2) > 0:
    row = producto2.iloc[0]
    print(f"\nProducto encontrado: {row['product_name']}")
    print(f"Flavour: {row.get('flavour', 'N/A')}")
    
    ingredientes_actuales = str(row.get('ingredients', ''))
    print(f"\nIngredientes actuales (primeros 500 chars):")
    print(ingredientes_actuales[:500])
    print("...")
    
    # Aplicar limpieza manualmente
    print("\n" + "="*80)
    print("APLICANDO LIMPIEZA MANUALMENTE")
    print("="*80)
    
    flavour = row.get('flavour', '')
    ingredientes_limpiados = _clean_ingredients_text(ingredientes_actuales, flavour)
    
    print(f"\nIngredientes después de limpieza (primeros 500 chars):")
    print(ingredientes_limpiados[:500] if ingredientes_limpiados else "(vacío)")
    
    print(f"\nLongitud original: {len(ingredientes_actuales)}")
    print(f"Longitud después de limpieza: {len(ingredientes_limpiados)}")
    
    if ingredientes_actuales == ingredientes_limpiados:
        print("\n⚠️ PROBLEMA: La limpieza no cambió nada. El matching no funcionó.")
    elif not ingredientes_limpiados:
        print("\n⚠️ PROBLEMA: La limpieza devolvió vacío. El matching falló completamente.")
    else:
        print("\n✅ La limpieza funcionó correctamente.")


