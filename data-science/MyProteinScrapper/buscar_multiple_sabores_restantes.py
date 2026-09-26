"""Script para buscar productos que aún tienen múltiples sabores en la BD corregida."""
import pandas as pd
import re
import sys
from pathlib import Path

# Configurar encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

bd_corregida = Path("MyProtein_Data_All_Products_Final_Corregido.xlsx")

print("="*80)
print("BUSCANDO PRODUCTOS CON MULTIPLES SABORES EN BD CORREGIDA")
print("="*80)

# Cargar todas las hojas
sheets = pd.read_excel(bd_corregida, sheet_name=None, engine='openpyxl')

def combinar_hojas(sheets_dict):
    dfs = []
    for sheet_name, df in sheets_dict.items():
        if "url" in df.columns:
            df_copy = df.copy()
            df_copy['_sheet'] = sheet_name
            dfs.append(df_copy)
    return pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()

df = combinar_hojas(sheets)

print(f"Total productos: {len(df)}")

# Buscar productos con múltiples sabores
productos_problematicos = []

# Patrones para detectar sabores
# 1. Formato "Sabor X:"
pattern_sabor = re.compile(r'Sabor\s+[^:]+?:', re.IGNORECASE | re.DOTALL)

# 2. Formato directo "X:" donde X es un nombre de sabor
# Lista expandida de sabores comunes
sabores_comunes = [
    'Plátano', 'Platano', 'Banana', 'Chocolate', 'Vainilla', 'Vanilla',
    'Fresa', 'Strawberry', 'Café', 'Cafe', 'Coffee', 'Cacao', 'Cocoa',
    'Cinnamon', 'Canela', 'Maple', 'Arce', 'Golden', 'Dorado',
    'Cookies', 'Galletas', 'Cream', 'Nata', 'Crema', 'Matcha',
    'Caramelo', 'Caramel', 'Turmeric', 'Cúrcuma', 'Curcuma',
    'Raspberry', 'Frambuesa', 'Orange', 'Naranja', 'Limón', 'Limon',
    'Piña', 'Pina', 'Coco', 'Coconut', 'Melocotón', 'Melocoton',
    'Lima', 'Lemon', 'Mango', 'Uva', 'Grape', 'Mojito',
    'Rainbow', 'Ramune', 'Té', 'Te', 'Peach', 'Melocotón'
]

# También buscar patrones como "X-Y:" o "X Y:" o "X & Y:"
for idx, row in df.iterrows():
    if pd.isna(row.get('ingredients')):
        continue
    
    ingredientes = str(row['ingredients'])
    producto = row.get('product_name', row.get('producto', 'Sin nombre'))
    flavour = row.get('flavour', '')
    sheet = row.get('_sheet', '')
    url = row.get('url', '')
    
    # Contar secciones "Sabor X:"
    sabores_sabor = len(pattern_sabor.findall(ingredientes))
    
    # Buscar formato directo (nombres de sabor seguidos de ":")
    # Patrón más flexible que detecta cualquier palabra seguida de ":"
    # pero solo si parece un nombre de sabor (no "INGREDIENTES:", "Alérgenos:", etc.)
    pattern_directo = re.compile(r'^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]+?)\s*:', re.MULTILINE)
    matches_directos = pattern_directo.findall(ingredientes)
    
    # Filtrar matches que no son sabores (palabras comunes que aparecen en ingredientes)
    palabras_no_sabor = ['INGREDIENTES', 'INGREDIENTE', 'Alérgenos', 'Alergenos', 'Para', 'Puede', 
                         'Contiene', 'Fabricado', 'Producido', 'Mezcla', 'Harina', 'Aceite',
                         'Agua', 'Azúcar', 'Edulcorante', 'Aroma', 'Colorante', 'Emulsionante']
    
    sabores_directos = []
    for match in matches_directos:
        match_clean = match.strip()
        # Si no es una palabra común y tiene más de 2 caracteres, probablemente es un sabor
        if (len(match_clean) > 2 and 
            not any(no_sabor.lower() in match_clean.lower() for no_sabor in palabras_no_sabor) and
            match_clean not in ['Leche', 'Soja', 'Huevo', 'Trigo', 'Gluten']):
            sabores_directos.append(match_clean)
    
    total_sabores = sabores_sabor + len(sabores_directos)
    
    # Si tiene más de 1 sabor, es problemático
    if total_sabores > 1:
        productos_problematicos.append({
            'idx': idx,
            'producto': producto,
            'flavour': flavour,
            'sheet': sheet,
            'url': url,
            'ingredientes': ingredientes,
            'sabores_sabor': sabores_sabor,
            'sabores_directos': sabores_directos,
            'total_sabores': total_sabores
        })

print(f"\n{'='*80}")
print(f"PRODUCTOS CON MULTIPLES SABORES ENCONTRADOS: {len(productos_problematicos)}")
print(f"{'='*80}")

if productos_problematicos:
    # Mostrar los primeros 30 casos
    print("\nMostrando los primeros 30 casos problemáticos:\n")
    
    for i, caso in enumerate(productos_problematicos[:30], 1):
        print(f"{'='*80}")
        print(f"CASO {i}: {caso['producto']}")
        print(f"{'='*80}")
        print(f"Hoja: {caso['sheet']} | Flavour: {caso['flavour']}")
        print(f"Total sabores detectados: {caso['total_sabores']}")
        print(f"  - Formato 'Sabor X:': {caso['sabores_sabor']}")
        print(f"  - Formato directo 'X:': {len(caso['sabores_directos'])}")
        if caso['sabores_directos']:
            print(f"  - Sabores directos encontrados: {', '.join(caso['sabores_directos'][:10])}")
        
        # Mostrar ingredientes (primeros 600 chars)
        ingredientes_clean = caso['ingredientes'].replace('\n', ' ').strip()[:600]
        if len(caso['ingredientes']) > 600:
            ingredientes_clean += "..."
        print(f"\nIngredientes (primeros 600 chars):")
        print(f"   {ingredientes_clean}")
        print()
    
    if len(productos_problematicos) > 30:
        print(f"\n... y {len(productos_problematicos) - 30} casos más")
    
    # Estadísticas
    print(f"\n{'='*80}")
    print("ESTADISTICAS")
    print(f"{'='*80}")
    
    # Distribución por número de sabores
    distribucion = {}
    for caso in productos_problematicos:
        num = caso['total_sabores']
        distribucion[num] = distribucion.get(num, 0) + 1
    
    print("\nDistribución por número de sabores:")
    for num in sorted(distribucion.keys()):
        print(f"  {num} sabores: {distribucion[num]} productos")
    
    # Distribución por hoja
    print("\nDistribución por hoja:")
    hojas_dist = {}
    for caso in productos_problematicos:
        hoja = caso['sheet']
        hojas_dist[hoja] = hojas_dist.get(hoja, 0) + 1
    for hoja, count in sorted(hojas_dist.items()):
        print(f"  {hoja}: {count} productos")
    
else:
    print("\n✅ No se encontraron productos con múltiples sabores")

print(f"\n{'='*80}")



