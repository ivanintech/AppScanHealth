"""Script para crear un resumen limpio de las mejoras en ingredientes."""
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

print("="*80)
print("RESUMEN DE MEJORAS EN INGREDIENTES")
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

df_old = combinar_hojas(sheets_old)
df_new = combinar_hojas(sheets_new)

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

# Encontrar mejoras
mejoras = []
for url in old_dict.keys():
    if url not in new_dict:
        continue
    
    old_data = old_dict[url]
    new_data = new_dict[url]
    
    old_ing = old_data['ingredients']
    new_ing = new_data['ingredients']
    
    # Filtrar inválidos
    if any(kw in new_ing.lower() for kw in ['const ', 'window.', 'function', 'javascript']):
        continue
    
    len_old = len(old_ing)
    len_new = len(new_ing)
    sabores_old = len(re.findall(r'Sabor\s+[^:]+?:', old_ing, re.IGNORECASE | re.DOTALL))
    sabores_new = len(re.findall(r'Sabor\s+[^:]+?:', new_ing, re.IGNORECASE | re.DOTALL))
    
    # Detectar mejoras significativas
    mejorado = False
    razon = ""
    
    if sabores_old > 1 and sabores_new <= 1:
        mejorado = True
        razon = f"✅ Múltiples sabores eliminados ({sabores_old} → {sabores_new})"
    elif len_old > 0 and len_new > len_old * 1.3:  # 30% más largo
        mejorado = True
        razon = f"✅ Texto más completo (+{len_new - len_old} chars, {len_old} → {len_new})"
    elif len_old == 0 and len_new > 100:
        mejorado = True
        razon = f"✅ Texto agregado (antes vacío, ahora {len_new} chars)"
    
    if mejorado and len_new > 50:  # Solo si el nuevo texto es significativo
        mejoras.append({
            'producto': old_data['producto'],
            'flavour': old_data['flavour'],
            'sheet': old_data['sheet'],
            'old_ing': old_ing,
            'new_ing': new_ing,
            'len_old': len_old,
            'len_new': len_new,
            'sabores_old': sabores_old,
            'sabores_new': sabores_new,
            'razon': razon
        })

# Ordenar: primero múltiples sabores eliminados, luego mejoras de longitud
mejoras_ordenadas = sorted(mejoras, key=lambda x: (
    x['sabores_old'] > 1,  # Prioridad a eliminación de múltiples sabores
    x['len_new'] - x['len_old']  # Luego por mejora de longitud
), reverse=True)

print(f"\n📊 Total de mejoras encontradas: {len(mejoras)} productos\n")

# Mostrar 25 mejores ejemplos
print("="*80)
print("TOP 25 MEJORAS EN INGREDIENTES")
print("="*80)

for i, mejora in enumerate(mejoras_ordenadas[:25], 1):
    print(f"\n{'─'*80}")
    print(f"📦 EJEMPLO {i}: {mejora['producto']}")
    print(f"{'─'*80}")
    print(f"📋 Hoja: {mejora['sheet']} | Flavour: {mejora['flavour']}")
    print(f"💡 {mejora['razon']}")
    print(f"📏 Longitud: {mejora['len_old']} → {mejora['len_new']} caracteres")
    
    # Mostrar antes (limitado y limpio)
    old_clean = mejora['old_ing'].replace('\n', ' ').strip()[:300]
    if mejora['len_old'] > 300:
        old_clean += "..."
    
    print(f"\n🔴 ANTES:")
    print(f"   {old_clean}")
    
    # Mostrar después (limitado y limpio)
    new_clean = mejora['new_ing'].replace('\n', ' ').strip()[:300]
    if mejora['len_new'] > 300:
        new_clean += "..."
    
    print(f"\n🟢 DESPUÉS:")
    print(f"   {new_clean}")

# Estadísticas
print(f"\n{'='*80}")
print("📈 ESTADÍSTICAS GENERALES")
print(f"{'='*80}")

multi_sabor = sum(1 for m in mejoras if m['sabores_old'] > 1 and m['sabores_new'] <= 1)
texto_agregado = sum(1 for m in mejoras if m['len_old'] == 0 and m['len_new'] > 0)
texto_completo = sum(1 for m in mejoras if m['len_old'] > 0 and m['len_new'] > m['len_old'] * 1.3)

print(f"\n✅ Productos con múltiples sabores eliminados: {multi_sabor}")
print(f"✅ Productos con texto agregado (antes vacío): {texto_agregado}")
print(f"✅ Productos con texto significativamente más completo: {texto_completo}")

print(f"\n📊 Distribución por hoja:")
hojas_count = {}
for m in mejoras:
    hojas_count[m['sheet']] = hojas_count.get(m['sheet'], 0) + 1
for sheet, count in sorted(hojas_count.items()):
    print(f"   • {sheet}: {count} productos mejorados")

print(f"\n{'='*80}")



