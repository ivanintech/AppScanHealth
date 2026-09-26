"""Script para corregir ingredientes en la BD original comparando con la nuestra."""
import pandas as pd
import sys
import re
from pathlib import Path
sys.path.insert(0, '.')

from myprotein_ingredients_scraper import _clean_ingredients_text

# Rutas de archivos
bd_original = Path("MyProtein_Data_All_Products_Final.xlsx")
bd_nuestra = Path("MyProtein_Ingredients_Final.xlsx")
bd_salida = Path("MyProtein_Data_All_Products_Final_Corregido.xlsx")

print("="*80)
print("CORRECCION DE INGREDIENTES EN BASE DE DATOS ORIGINAL")
print("="*80)

# Cargar ambas bases de datos
print("\nCargando bases de datos...")

# Cargar BD original - leer todas las hojas
print("Leyendo todas las hojas del Excel original...")
sheets_original = pd.read_excel(bd_original, sheet_name=None, engine='openpyxl')
print(f"Hojas encontradas en BD original: {list(sheets_original.keys())}")

# Combinar todas las hojas de la BD original
df_original_list = []
for sheet_name, df_sheet in sheets_original.items():
    if "url" in df_sheet.columns:
        print(f"  - Hoja '{sheet_name}': {len(df_sheet)} productos")
        df_original_list.append(df_sheet)
    else:
        print(f"  - Hoja '{sheet_name}': Sin columna 'url', omitida")

if df_original_list:
    df_original = pd.concat(df_original_list, ignore_index=True)
    print(f"Total productos en BD original (todas las hojas): {len(df_original)}")
else:
    print("[ERROR] No se encontraron hojas con columna 'url' en la BD original")
    sys.exit(1)

# Cargar BD nuestra
df_nuestra = pd.read_excel(bd_nuestra, engine='openpyxl')
print(f"BD Nuestra: {len(df_nuestra)} productos")

# Verificar que ambas tienen la columna 'url' para hacer matching
if 'url' not in df_original.columns:
    print("\n[ERROR] La BD original no tiene columna 'url'")
    sys.exit(1)

if 'url' not in df_nuestra.columns:
    print("\n[ERROR] La BD nuestra no tiene columna 'url'")
    sys.exit(1)

# Crear diccionario de nuestra BD indexado por URL
nuestra_bd_dict = {}
for _, row in df_nuestra.iterrows():
    url = str(row['url']).strip() if pd.notna(row['url']) else None
    if url:
        nuestra_bd_dict[url] = {
            'ingredients': row.get('ingredients', ''),
            'flavour': row.get('flavour', '')
        }

print(f"\nDiccionario de nuestra BD creado: {len(nuestra_bd_dict)} URLs")

# Verificar si la BD original tiene columna 'ingredients'
tiene_columna_ingredients = 'ingredients' in df_original.columns

if not tiene_columna_ingredients:
    print("\n[INFO] La BD original no tiene columna 'ingredients', se creará una nueva")
    df_original['ingredients'] = None

# Estadísticas
productos_procesados = 0
productos_corregidos = 0
productos_sin_cambios = 0
productos_sin_url = 0
productos_no_encontrados = 0
correcciones_aplicadas = []

print("\n" + "="*80)
print("PROCESANDO PRODUCTOS")
print("="*80)

# Procesar cada producto de la BD original
for idx, row in df_original.iterrows():
    url = str(row['url']).strip() if pd.notna(row['url']) else None
    
    if not url or url == 'nan':
        productos_sin_url += 1
        continue
    
    # Obtener ingredientes de la BD original
    ingredientes_original = str(row.get('ingredients', '')).strip() if pd.notna(row.get('ingredients')) else ''
    
    # Obtener ingredientes de nuestra BD
    if url not in nuestra_bd_dict:
        productos_no_encontrados += 1
        continue
    
    ingredientes_nuestros = str(nuestra_bd_dict[url]['ingredients']).strip() if pd.notna(nuestra_bd_dict[url]['ingredients']) else ''
    flavour = str(nuestra_bd_dict[url]['flavour']).strip() if pd.notna(nuestra_bd_dict[url]['flavour']) else ''
    
    productos_procesados += 1
    
    # Obtener nombre del producto
    producto_nombre = row.get('product_name', row.get('producto', 'Sin nombre'))
    
    # Comparar longitudes
    len_original = len(ingredientes_original)
    len_nuestros = len(ingredientes_nuestros)
    
    # Si la original tiene más texto, verificar si tiene múltiples sabores
    if len_original > len_nuestros and len_original > 0:
        # Contar secciones de sabor en la original
        sabores_original = len(re.findall(r'Sabor\s+[^:]+?:', ingredientes_original, re.IGNORECASE | re.DOTALL))
        
        # También verificar formato directo (X:)
        sabores_directos_original = []
        sabores_comunes = ['Plátano', 'Platano', 'Banana', 'Chocolate', 'Vainilla', 'Vanilla', 
                          'Fresa', 'Strawberry', 'Café', 'Cafe', 'Coffee', 'Cacao', 'Cocoa',
                          'Cinnamon', 'Canela', 'Maple', 'Arce', 'Golden', 'Dorado',
                          'Cookies', 'Galletas', 'Cream', 'Nata', 'Crema', 'Matcha',
                          'Caramelo', 'Caramel', 'Turmeric', 'Cúrcuma', 'Curcuma',
                          'Raspberry', 'Frambuesa', 'Orange', 'Naranja', 'Limón', 'Limon',
                          'Piña', 'Pina', 'Coco', 'Coconut', 'Melocotón', 'Melocoton']
        for sabor in sabores_comunes:
            pattern = re.compile(rf'^{re.escape(sabor)}\s*:', re.MULTILINE | re.IGNORECASE)
            if pattern.search(ingredientes_original):
                sabores_directos_original.append(sabor)
        
        total_sabores_original = sabores_original + len(sabores_directos_original)
        
        # Si tiene múltiples sabores (en cualquier formato), aplicar corrección
        if total_sabores_original > 1 or (sabores_original > 1):
            producto_nombre = row.get('product_name', row.get('producto', 'Sin nombre'))
            print(f"\n[{idx+1}] {producto_nombre}")
            print(f"  URL: {url[:80]}...")
            print(f"  Flavour: {flavour}")
            print(f"  Original: {len_original} chars, {total_sabores_original} sabores ({sabores_original} 'Sabor X:', {len(sabores_directos_original)} directos)")
            print(f"  Nuestra: {len_nuestros} chars")
            
            # Aplicar corrección usando nuestra función
            ingredientes_corregidos = _clean_ingredients_text(ingredientes_original, flavour)
            len_corregidos = len(ingredientes_corregidos)
            
            print(f"  Corregido: {len_corregidos} chars")
            
            # Verificar si la corrección funcionó
            sabores_corregidos = len(re.findall(r'Sabor\s+[^:]+?:', ingredientes_corregidos, re.IGNORECASE | re.DOTALL))
            
            if sabores_corregidos <= 1:
                # La corrección funcionó, actualizar
                df_original.at[idx, 'ingredients'] = ingredientes_corregidos
                productos_corregidos += 1
                correcciones_aplicadas.append({
                    'producto': producto_nombre,
                    'flavour': flavour,
                    'original_len': len_original,
                    'corregido_len': len_corregidos,
                    'sabores_original': total_sabores_original,
                    'sabores_corregido': sabores_corregidos
                })
                print(f"  [OK] Corregido: {total_sabores_original} -> {sabores_corregidos} secciones")
            else:
                print(f"  [ATENCION] La corrección no funcionó completamente: aún tiene {sabores_corregidos} secciones")
                # Aún así, usar nuestra versión si es mejor
                if len_nuestros > 0:
                    df_original.at[idx, 'ingredients'] = ingredientes_nuestros
                    productos_corregidos += 1
                    print(f"  [USANDO NUESTRA VERSION]")
        else:
            # No tiene múltiples sabores, pero la original es más larga
            # Solo aplicar limpieza si realmente hay múltiples sabores o si nuestra versión es mejor
            # Si no hay múltiples sabores, mantener la original (es más completa)
            productos_sin_cambios += 1
    elif len_nuestros > len_original:
        # Nuestra versión es mejor, actualizar
        if len_nuestros > 0:
            df_original.at[idx, 'ingredients'] = ingredientes_nuestros
            productos_corregidos += 1
            print(f"\n[{idx+1}] {producto_nombre}")
            print(f"  [ACTUALIZADO] Nuestra versión es mejor ({len_nuestros} vs {len_original} chars)")
    else:
        # Longitudes similares, mantener la original o usar la nuestra si está más limpia
        productos_sin_cambios += 1
    
    # Mostrar progreso cada 100 productos
    if (idx + 1) % 100 == 0:
        print(f"\nProgreso: {idx + 1}/{len(df_original)} productos procesados...")

print("\n" + "="*80)
print("RESUMEN DE CORRECCIONES")
print("="*80)
print(f"Productos procesados: {productos_procesados}")
print(f"Productos corregidos: {productos_corregidos}")
print(f"Productos sin cambios: {productos_sin_cambios}")
print(f"Productos sin URL: {productos_sin_url}")
print(f"Productos no encontrados en nuestra BD: {productos_no_encontrados}")

if correcciones_aplicadas:
    print(f"\nCorrecciones aplicadas: {len(correcciones_aplicadas)}")
    print("\nPrimeros 10 casos corregidos:")
    for i, corr in enumerate(correcciones_aplicadas[:10], 1):
        print(f"\n{i}. {corr['producto']}")
        print(f"   Flavour: {corr['flavour']}")
        print(f"   Longitud: {corr['original_len']} -> {corr['corregido_len']} chars")
        print(f"   Secciones de sabor: {corr['sabores_original']} -> {corr['sabores_corregido']}")

# Guardar la BD corregida manteniendo la estructura de hojas original
print("\n" + "="*80)
print("GUARDANDO BASE DE DATOS CORREGIDA")
print("="*80)

# Crear un diccionario con las correcciones aplicadas (indexado por URL)
correcciones_dict = {}
for idx, row in df_original.iterrows():
    url = str(row['url']).strip() if pd.notna(row['url']) else None
    if url and pd.notna(row.get('ingredients')):
        correcciones_dict[url] = row['ingredients']

# Aplicar correcciones a cada hoja original y guardar
print("Aplicando correcciones a cada hoja y guardando...")
with pd.ExcelWriter(bd_salida, engine='openpyxl') as writer:
    for sheet_name, df_sheet in sheets_original.items():
        if "url" not in df_sheet.columns:
            # Si no tiene URL, guardar sin modificar
            df_sheet.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"  - Hoja '{sheet_name}': Sin columna 'url', guardada sin modificar")
            continue
        
        # Aplicar correcciones a esta hoja
        productos_corregidos_hoja = 0
        for idx, row in df_sheet.iterrows():
            url = str(row['url']).strip() if pd.notna(row['url']) else None
            if url and url in correcciones_dict:
                # Aplicar corrección
                df_sheet.at[idx, 'ingredients'] = correcciones_dict[url]
                productos_corregidos_hoja += 1
        
        # Guardar hoja corregida
        df_sheet.to_excel(writer, sheet_name=sheet_name, index=False)
        print(f"  - Hoja '{sheet_name}': {len(df_sheet)} productos, {productos_corregidos_hoja} corregidos")

print(f"\nBase de datos corregida guardada en: {bd_salida}")
print(f"Estructura de hojas original mantenida: {list(sheets_original.keys())}")

print("\n" + "="*80)
print("PROCESO COMPLETADO")
print("="*80)

