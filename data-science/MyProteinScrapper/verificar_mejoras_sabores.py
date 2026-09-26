"""Script para verificar específicamente las mejoras de múltiples sabores."""
import pandas as pd
import re
import sys
from pathlib import Path

# Configurar encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Rutas de archivos
bd_old = Path("MyProtein_Data_All_Products_Final OLD.xlsx")
bd_new = Path("MyProtein_Data_All_Products_Final_Corregido.xlsx")
bd_nuestra = Path("MyProtein_Ingredients_Final.xlsx")

print("="*80)
print("VERIFICACION DE MEJORAS DE MULTIPLES SABORES")
print("="*80)

# Cargar y combinar hojas
def combinar_hojas(sheets_dict):
    dfs = []
    for sheet_name, df in sheets_dict.items():
        if "url" in df.columns:
            df_copy = df.copy()
            df_copy['_sheet'] = sheet_name
            dfs.append(df_copy)
    if dfs:
        return pd.concat(dfs, ignore_index=True)
    return pd.DataFrame()

sheets_old = pd.read_excel(bd_old, sheet_name=None, engine='openpyxl')
sheets_new = pd.read_excel(bd_new, sheet_name=None, engine='openpyxl')
df_nuestra = pd.read_excel(bd_nuestra, engine='openpyxl')

df_old = combinar_hojas(sheets_old)
df_new = combinar_hojas(sheets_new)

print(f"Total productos en BD antigua: {len(df_old)}")
print(f"Total productos en BD nueva: {len(df_new)}")
print(f"Total productos en BD nuestra: {len(df_nuestra)}")

# Crear diccionarios
old_dict = {}
for _, row in df_old.iterrows():
    url = str(row['url']).strip() if pd.notna(row['url']) else None
    if url:
        old_dict[url] = {
            'producto': row.get('product_name', row.get('producto', 'Sin nombre')),
            'flavour': row.get('flavour', ''),
            'ingredients': str(row.get('ingredients', '')).strip() if pd.notna(row.get('ingredients')) else '',
            'sheet': row.get('_sheet', '')
        }

new_dict = {}
for _, row in df_new.iterrows():
    url = str(row['url']).strip() if pd.notna(row['url']) else None
    if url:
        new_dict[url] = {
            'ingredients': str(row.get('ingredients', '')).strip() if pd.notna(row.get('ingredients')) else ''
        }

# Crear diccionario de nuestra BD para comparar
nuestra_dict = {}
for _, row in df_nuestra.iterrows():
    url = str(row['url']).strip() if pd.notna(row['url']) else None
    if url:
        nuestra_dict[url] = {
            'ingredients': str(row.get('ingredients', '')).strip() if pd.notna(row.get('ingredients')) else ''
        }

print(f"\n{'='*80}")
print("BUSCANDO CASOS CON MULTIPLES SABORES")
print(f"{'='*80}")

# Caso 1: Productos que tenían múltiples sabores en OLD y ahora no
casos_corregidos = []
for url in old_dict.keys():
    if url not in new_dict:
        continue
    
    old_data = old_dict[url]
    new_data = new_dict[url]
    
    old_ing = old_data['ingredients']
    new_ing = new_data['ingredients']
    
    # Contar secciones de sabor
    sabores_old = len(re.findall(r'Sabor\s+[^:]+?:', old_ing, re.IGNORECASE | re.DOTALL))
    sabores_new = len(re.findall(r'Sabor\s+[^:]+?:', new_ing, re.IGNORECASE | re.DOTALL))
    
    # También buscar formato directo (X:)
    sabores_directos_old = []
    sabores_directos_new = []
    sabores_comunes = ['Plátano', 'Platano', 'Banana', 'Chocolate', 'Vainilla', 'Vanilla', 
                       'Fresa', 'Strawberry', 'Café', 'Cafe', 'Coffee', 'Cacao', 'Cocoa',
                       'Cinnamon', 'Canela', 'Maple', 'Arce', 'Golden', 'Dorado',
                       'Cookies', 'Galletas', 'Cream', 'Nata', 'Crema', 'Matcha',
                       'Caramelo', 'Caramel', 'Turmeric', 'Cúrcuma', 'Curcuma',
                       'Raspberry', 'Frambuesa', 'Orange', 'Naranja', 'Limón', 'Limon',
                       'Piña', 'Pina', 'Coco', 'Coconut', 'Melocotón', 'Melocoton']
    
    for sabor in sabores_comunes:
        pattern = re.compile(rf'^{re.escape(sabor)}\s*:', re.MULTILINE | re.IGNORECASE)
        if pattern.search(old_ing):
            sabores_directos_old.append(sabor)
        if pattern.search(new_ing):
            sabores_directos_new.append(sabor)
    
    total_sabores_old = sabores_old + len(sabores_directos_old)
    total_sabores_new = sabores_new + len(sabores_directos_new)
    
    # Si tenía múltiples sabores y ahora tiene 1 o menos
    if total_sabores_old > 1 and total_sabores_new <= 1:
        casos_corregidos.append({
            'url': url,
            'producto': old_data['producto'],
            'flavour': old_data['flavour'],
            'sheet': old_data['sheet'],
            'old_ingredients': old_ing,
            'new_ingredients': new_ing,
            'sabores_old': total_sabores_old,
            'sabores_new': total_sabores_new,
            'sabores_directos_old': sabores_directos_old,
            'sabores_directos_new': sabores_directos_new
        })

print(f"\n✅ CASOS CORREGIDOS: {len(casos_corregidos)} productos con múltiples sabores eliminados\n")

if casos_corregidos:
    print("Mostrando los primeros 20 casos corregidos:\n")
    for i, caso in enumerate(casos_corregidos[:20], 1):
        print(f"{'='*80}")
        print(f"CASO {i}: {caso['producto']}")
        print(f"{'='*80}")
        print(f"Hoja: {caso['sheet']} | Flavour: {caso['flavour']}")
        print(f"Sabores ANTES: {caso['sabores_old']} ({caso['sabores_directos_old']})")
        print(f"Sabores DESPUÉS: {caso['sabores_new']} ({caso['sabores_directos_new']})")
        
        # Mostrar texto antes (primeros 500 chars)
        old_clean = caso['old_ingredients'].replace('\n', ' ').strip()[:500]
        if len(caso['old_ingredients']) > 500:
            old_clean += "..."
        print(f"\n🔴 ANTES (primeros 500 chars):")
        print(f"   {old_clean}")
        
        # Mostrar texto después (primeros 500 chars)
        new_clean = caso['new_ingredients'].replace('\n', ' ').strip()[:500]
        if len(caso['new_ingredients']) > 500:
            new_clean += "..."
        print(f"\n🟢 DESPUÉS (primeros 500 chars):")
        print(f"   {new_clean}")
        
        # Verificar si coincide con nuestra BD
        if caso['url'] in nuestra_dict:
            nuestra_ing = nuestra_dict[caso['url']]['ingredients']
            if nuestra_ing == caso['new_ingredients']:
                print(f"\n✅ Coincide con nuestra BD corregida")
            else:
                print(f"\n⚠️  Diferente de nuestra BD corregida")
                print(f"   Nuestra versión: {len(nuestra_ing)} chars")
                print(f"   Versión en BD nueva: {len(caso['new_ingredients'])} chars")
        print()
else:
    print("⚠️  No se encontraron casos con múltiples sabores en la BD antigua")
    print("   Esto puede significar que:")
    print("   1. La BD antigua ya estaba corregida")
    print("   2. Los casos problemáticos no estaban en la BD antigua")
    print("   3. Necesitamos verificar contra la BD original (MyProtein_Data_All_Products_Final.xlsx)")

# Verificar casos específicos que sabíamos que tenían problemas
print(f"\n{'='*80}")
print("VERIFICANDO CASOS ESPECIFICOS CONOCIDOS")
print(f"{'='*80}")

casos_especificos = [
    "Mezcla de Proteína Vegana",
    "Mezcla Ganador de Peso",
    "Monodosis de Colágeno",
    "Clear Protein Water",
    "Mezcla de Tortitas"
]

for nombre_producto in casos_especificos:
    print(f"\n🔍 Buscando productos con '{nombre_producto}'...")
    encontrados = []
    for url, data in old_dict.items():
        if nombre_producto.lower() in data['producto'].lower():
            encontrados.append((url, data))
    
    if encontrados:
        for url, data in encontrados[:3]:  # Mostrar máximo 3
            if url in new_dict:
                old_ing = data['ingredients']
                new_ing = new_dict[url]['ingredients']
                
                sabores_old = len(re.findall(r'Sabor\s+[^:]+?:', old_ing, re.IGNORECASE | re.DOTALL))
                sabores_new = len(re.findall(r'Sabor\s+[^:]+?:', new_ing, re.IGNORECASE | re.DOTALL))
                
                print(f"   • {data['producto']} (Flavour: {data['flavour']})")
                print(f"     Sabores: {sabores_old} → {sabores_new}")
                if sabores_old > 1 and sabores_new <= 1:
                    print(f"     ✅ CORREGIDO")
                elif sabores_old > 1:
                    print(f"     ⚠️  Aún tiene {sabores_new} sabores")
    else:
        print(f"   No encontrado en BD antigua")

print(f"\n{'='*80}")



