"""Script para verificar si la BD original tiene productos con múltiples sabores."""
import pandas as pd
import re

# Cargar BD original
df = pd.read_excel('MyProtein_Data_All_Products_Final.xlsx', engine='openpyxl')

print("="*80)
print("VERIFICACION DE BD ORIGINAL")
print("="*80)
print(f"Total productos: {len(df)}")

# Verificar columnas
print(f"\nColumnas disponibles: {list(df.columns)}")

# Verificar si tiene columna ingredients
if 'ingredients' in df.columns:
    print("\n[OK] La BD tiene columna 'ingredients'")
    
    # Buscar productos con múltiples sabores
    productos_multi_sabor = []
    for idx, row in df.iterrows():
        if pd.notna(row.get('ingredients')):
            ingredientes = str(row['ingredients'])
            sabores = len(re.findall(r'Sabor\s+[^:]+?:', ingredientes, re.IGNORECASE | re.DOTALL))
            if sabores > 1:
                productos_multi_sabor.append({
                    'idx': idx,
                    'producto': row.get('producto', 'Sin nombre'),
                    'flavour': row.get('flavour', ''),
                    'url': row.get('url', ''),
                    'sabores': sabores,
                    'longitud': len(ingredientes),
                    'ingredientes': ingredientes[:300] + '...' if len(ingredientes) > 300 else ingredientes
                })
    
    print(f"\nProductos con múltiples sabores: {len(productos_multi_sabor)}")
    
    if productos_multi_sabor:
        print("\nPrimeros 10 casos:")
        for i, item in enumerate(productos_multi_sabor[:10], 1):
            print(f"\n{i}. {item['producto']}")
            print(f"   Flavour: {item['flavour']}")
            print(f"   Sabores: {item['sabores']}")
            print(f"   Longitud: {item['longitud']} chars")
            print(f"   Ingredientes (primeros 300): {item['ingredientes']}")
    else:
        print("\n[INFO] No se encontraron productos con múltiples sabores en la BD original")
        
        # Mostrar algunos ejemplos de ingredientes para ver qué tienen
        print("\nEjemplos de ingredientes en la BD original:")
        count = 0
        for idx, row in df.iterrows():
            if pd.notna(row.get('ingredients')) and count < 5:
                ingredientes = str(row['ingredients'])
                print(f"\n{count+1}. {row.get('producto', 'Sin nombre')}")
                print(f"   Longitud: {len(ingredientes)} chars")
                print(f"   Ingredientes (primeros 200): {ingredientes[:200]}...")
                count += 1
else:
    print("\n[INFO] La BD no tiene columna 'ingredients'")

print("\n" + "="*80)



