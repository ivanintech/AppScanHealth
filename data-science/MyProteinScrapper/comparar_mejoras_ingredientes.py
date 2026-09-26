"""Script para comparar la BD antigua con la nueva y mostrar mejoras en ingredientes."""
import pandas as pd
import re
import sys
from pathlib import Path

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Rutas de archivos
bd_old = Path("MyProtein_Data_All_Products_Final OLD.xlsx")
bd_new = Path("MyProtein_Data_All_Products_Final_Corregido.xlsx")

print("="*80)
print("COMPARACION DE MEJORAS EN INGREDIENTES")
print("="*80)

# Cargar ambas bases de datos (todas las hojas)
print("\nCargando bases de datos...")
sheets_old = pd.read_excel(bd_old, sheet_name=None, engine='openpyxl')
sheets_new = pd.read_excel(bd_new, sheet_name=None, engine='openpyxl')

print(f"Hojas en BD antigua: {list(sheets_old.keys())}")
print(f"Hojas en BD nueva: {list(sheets_new.keys())}")

# Combinar todas las hojas en un solo DataFrame para cada BD
def combinar_hojas(sheets_dict):
    """Combina todas las hojas en un solo DataFrame."""
    dfs = []
    for sheet_name, df in sheets_dict.items():
        if "url" in df.columns:
            df_copy = df.copy()
            df_copy['_sheet'] = sheet_name  # Guardar nombre de hoja
            dfs.append(df_copy)
    if dfs:
        return pd.concat(dfs, ignore_index=True)
    return pd.DataFrame()

df_old = combinar_hojas(sheets_old)
df_new = combinar_hojas(sheets_new)

print(f"\nTotal productos en BD antigua: {len(df_old)}")
print(f"Total productos en BD nueva: {len(df_new)}")

# Crear diccionarios indexados por URL
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
            'producto': row.get('product_name', row.get('producto', 'Sin nombre')),
            'flavour': row.get('flavour', ''),
            'ingredients': str(row.get('ingredients', '')).strip() if pd.notna(row.get('ingredients')) else '',
            'sheet': row.get('_sheet', '')
        }

print(f"\nURLs en BD antigua: {len(old_dict)}")
print(f"URLs en BD nueva: {len(new_dict)}")

# Comparar y encontrar mejoras
mejoras = []

for url in old_dict.keys():
    if url not in new_dict:
        continue
    
    old_data = old_dict[url]
    new_data = new_dict[url]
    
    old_ing = old_data['ingredients']
    new_ing = new_data['ingredients']
    
    len_old = len(old_ing)
    len_new = len(new_ing)
    
    # Contar secciones de sabor en ambas versiones
    sabores_old = len(re.findall(r'Sabor\s+[^:]+?:', old_ing, re.IGNORECASE | re.DOTALL))
    sabores_new = len(re.findall(r'Sabor\s+[^:]+?:', new_ing, re.IGNORECASE | re.DOTALL))
    
    # Detectar mejoras
    mejorado = False
    razon_mejora = []
    
    # Mejora 1: Se eliminaron múltiples sabores
    if sabores_old > 1 and sabores_new <= 1:
        mejorado = True
        razon_mejora.append(f"Eliminados múltiples sabores ({sabores_old} -> {sabores_new})")
    
    # Mejora 2: Texto más completo (significativamente más largo)
    if len_old > 0 and len_new > len_old * 1.2:  # 20% más largo
        mejorado = True
        razon_mejora.append(f"Texto más completo ({len_old} -> {len_new} chars, +{len_new - len_old} chars)")
    
    # Mejora 3: Se agregó texto cuando antes estaba vacío
    if len_old == 0 and len_new > 0:
        mejorado = True
        razon_mejora.append(f"Se agregó texto (antes vacío, ahora {len_new} chars)")
    
    # Mejora 4: Texto más limpio (sin múltiples sabores pero similar longitud)
    if sabores_old > 1 and sabores_new <= 1 and abs(len_new - len_old) < len_old * 0.3:
        mejorado = True
        razon_mejora.append(f"Texto filtrado correctamente (mismo sabor, sin otros)")
    
    # Filtrar casos inválidos (código JavaScript, etc.)
    invalid_keywords = ['const ', 'window.', 'function', 'javascript', 'script', 'document.']
    if any(keyword in new_ing.lower() for keyword in invalid_keywords):
        continue  # Saltar este producto
    
    if mejorado:
        mejoras.append({
            'url': url,
            'producto': old_data['producto'],
            'flavour': old_data['flavour'],
            'sheet': old_data['sheet'],
            'old_ingredients': old_ing,
            'new_ingredients': new_ing,
            'len_old': len_old,
            'len_new': len_new,
            'sabores_old': sabores_old,
            'sabores_new': sabores_new,
            'razones': razon_mejora
        })

print(f"\n{'='*80}")
print(f"MEJORAS ENCONTRADAS: {len(mejoras)} productos")
print(f"{'='*80}")

# Ordenar por tipo de mejora (priorizar eliminación de múltiples sabores)
mejoras_ordenadas = sorted(mejoras, key=lambda x: (
    x['sabores_old'] > 1,  # Primero los que tenían múltiples sabores
    x['len_new'] - x['len_old']  # Luego por diferencia de longitud
), reverse=True)

# Mostrar los primeros 30 ejemplos
print(f"\nMostrando los primeros 30 ejemplos de mejoras:\n")

for i, mejora in enumerate(mejoras_ordenadas[:30], 1):
    print(f"{'='*80}")
    print(f"EJEMPLO {i}: {mejora['producto']}")
    print(f"{'='*80}")
    print(f"Hoja: {mejora['sheet']}")
    print(f"Flavour: {mejora['flavour']}")
    print(f"Razones de mejora: {', '.join(mejora['razones'])}")
    print(f"\nLongitud: {mejora['len_old']} -> {mejora['len_new']} caracteres")
    print(f"Secciones de sabor: {mejora['sabores_old']} -> {mejora['sabores_new']}")
    
    print(f"\n--- ANTES (primeros 400 caracteres) ---")
    old_text = mejora['old_ingredients'][:400].encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    print(old_text)
    if len(mejora['old_ingredients']) > 400:
        print(f"... ({len(mejora['old_ingredients']) - 400} caracteres más)")
    
    print(f"\n--- DESPUÉS (primeros 400 caracteres) ---")
    new_text = mejora['new_ingredients'][:400].encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    print(new_text)
    if len(mejora['new_ingredients']) > 400:
        print(f"... ({len(mejora['new_ingredients']) - 400} caracteres más)")
    
    print()

# Estadísticas generales
print(f"\n{'='*80}")
print("ESTADISTICAS GENERALES")
print(f"{'='*80}")

# Productos con múltiples sabores eliminados
multi_sabor_eliminados = sum(1 for m in mejoras if m['sabores_old'] > 1 and m['sabores_new'] <= 1)
print(f"\nProductos con múltiples sabores eliminados: {multi_sabor_eliminados}")

# Productos con texto agregado (antes vacío)
texto_agregado = sum(1 for m in mejoras if m['len_old'] == 0 and m['len_new'] > 0)
print(f"Productos con texto agregado (antes vacío): {texto_agregado}")

# Productos con texto más completo
texto_completo = sum(1 for m in mejoras if m['len_old'] > 0 and m['len_new'] > m['len_old'] * 1.2)
print(f"Productos con texto significativamente más completo: {texto_completo}")

# Distribución por hoja
print(f"\nDistribución de mejoras por hoja:")
hojas_mejoras = {}
for m in mejoras:
    sheet = m['sheet']
    hojas_mejoras[sheet] = hojas_mejoras.get(sheet, 0) + 1

for sheet, count in sorted(hojas_mejoras.items()):
    print(f"  - {sheet}: {count} productos mejorados")

print(f"\n{'='*80}")

