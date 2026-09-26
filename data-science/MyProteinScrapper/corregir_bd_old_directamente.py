"""Script para corregir directamente la BD OLD aplicando limpieza de ingredientes."""
import pandas as pd
import sys
import re
from pathlib import Path

sys.path.insert(0, '.')
from myprotein_ingredients_scraper import _clean_ingredients_text

# Rutas de archivos
bd_old = Path("MyProtein_Data_All_Products_Final OLD.xlsx")
bd_salida = Path("MyProtein_Data_All_Products_Final OLD_Corregido.xlsx")

print("="*80)
print("CORRECCION DIRECTA DE BASE DE DATOS OLD")
print("="*80)

if not bd_old.exists():
    print(f"ERROR: La base de datos OLD no existe: {bd_old}")
    sys.exit(1)

print(f"\nCargando base de datos: {bd_old}")
sheets = pd.read_excel(bd_old, sheet_name=None, engine='openpyxl')
print(f"Hojas encontradas: {list(sheets.keys())}")

# Función para contar secciones de sabor
def count_flavor_sections(text: str) -> int:
    """Cuenta el número de secciones de sabor en un texto."""
    if not text or pd.isna(text):
        return 0
    
    text_str = str(text)
    
    # Patrones para detectar sabores
    pattern1 = re.compile(r'Sabor\s+[^:]+?:', re.IGNORECASE | re.DOTALL)
    pattern2 = re.compile(r'(Sin\s+Sabor)\s*:', re.IGNORECASE)
    # Patrón flexible para sabores directos
    pattern3a = re.compile(r'(?:^|\n)([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]{2,40}?)\s*:', re.MULTILINE)
    pattern3b = re.compile(r'\.\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]{2,40}?)\s*:', re.MULTILINE)
    
    matches1 = list(pattern1.finditer(text_str))
    matches2 = list(pattern2.finditer(text_str))
    matches3 = list(pattern3a.finditer(text_str)) + list(pattern3b.finditer(text_str))
    
    # Filtrar falsos positivos del patrón 3
    palabras_no_sabor = ['INGREDIENTES', 'INGREDIENTE', 'Alérgenos', 'Alergenos', 'Para', 'Puede', 
                         'Contiene', 'Fabricado', 'Producido', 'Mezcla', 'Harina', 'Aceite',
                         'Agua', 'Azúcar', 'Edulcorante', 'Aroma', 'Colorante', 'Emulsionante',
                         'Leche', 'Soja', 'Huevo', 'Trigo', 'Gluten', 'ALLERGENS', 'CHIPS', 'Sólidos', 'Elaborado']
    
    valid_matches3 = 0
    for match in matches3:
        flavor_name = match.group(1).strip()
        es_falso_positivo = False
        for palabra_no_sabor in palabras_no_sabor:
            if re.search(rf'\b{re.escape(palabra_no_sabor)}\b', flavor_name, re.IGNORECASE):
                if flavor_name.strip().lower() == palabra_no_sabor.lower():
                    es_falso_positivo = True
                    break
        if not es_falso_positivo and len(flavor_name) >= 3 and len(flavor_name) <= 50:
            valid_matches3 += 1
    
    return len(matches1) + len(matches2) + valid_matches3

productos_corregidos = 0
productos_sin_cambios = 0
productos_problematicos_encontrados = 0

print("\n" + "="*80)
print("PROCESANDO PRODUCTOS")
print("="*80)

# Procesar cada hoja
for sheet_name, df in sheets.items():
    print(f"\nProcesando hoja: {sheet_name} ({len(df)} productos)")
    
    if 'ingredients' not in df.columns:
        print(f"  [SALTADA] No tiene columna 'ingredients'")
        continue
    
    if 'flavour' not in df.columns:
        print(f"  [ADVERTENCIA] No tiene columna 'flavour', se procesará sin filtrado por sabor")
    
    for idx, row in df.iterrows():
        if pd.isna(row.get('ingredients')):
            continue
        
        ingredientes_original = str(row.get('ingredients', '')).strip()
        flavour = row.get('flavour', '') if 'flavour' in df.columns else None
        
        if not ingredientes_original:
            continue
        
        # Contar secciones de sabor
        num_sabores = count_flavor_sections(ingredientes_original)
        
        # Si tiene múltiples sabores o parece problemático, aplicar limpieza
        if num_sabores > 1 or len(ingredientes_original) > 500:  # Textos largos pueden tener múltiples sabores
            productos_problematicos_encontrados += 1
            
            # Aplicar limpieza
            ingredientes_limpiados = _clean_ingredients_text(ingredientes_original, flavour)
            
            # Si la limpieza devolvió vacío pero había múltiples sabores, intentar de nuevo
            # con un enfoque más agresivo: normalizar el flavour primero
            if not ingredientes_limpiados and num_sabores > 1 and flavour:
                # Normalizar el flavour para mejorar el matching
                import re
                from myprotein_ingredients_scraper import _strip_accents_lower
                flavour_normalized = _strip_accents_lower(str(flavour).strip())
                # Normalizar espacios múltiples y guiones
                flavour_normalized = re.sub(r'[&y\-_]', ' ', flavour_normalized)
                flavour_normalized = re.sub(r'\s+', ' ', flavour_normalized).strip()
                # Intentar de nuevo con el flavour normalizado
                ingredientes_limpiados = _clean_ingredients_text(ingredientes_original, flavour_normalized)
            
            # Solo actualizar si la limpieza produjo un resultado razonable
            if ingredientes_limpiados and len(ingredientes_limpiados) > 50:
                num_sabores_despues = count_flavor_sections(ingredientes_limpiados)
                
                # Si redujo el número de sabores o mejoró significativamente
                if num_sabores_despues < num_sabores or (num_sabores > 1 and num_sabores_despues <= 1):
                    df.at[idx, 'ingredients'] = ingredientes_limpiados
                    productos_corregidos += 1
                    
                    producto_nombre = row.get('product_name', row.get('producto', f'Producto {idx+1}'))
                    print(f"  [{idx+1}] {producto_nombre}")
                    print(f"    Flavour: {flavour}")
                    print(f"    Sabores: {num_sabores} -> {num_sabores_despues}")
                    print(f"    Longitud: {len(ingredientes_original)} -> {len(ingredientes_limpiados)} chars")
                else:
                    productos_sin_cambios += 1
            elif num_sabores > 1:
                # Si aún tiene múltiples sabores y no se pudo limpiar, es un problema
                producto_nombre = row.get('product_name', row.get('producto', f'Producto {idx+1}'))
                print(f"  [PROBLEMA] {producto_nombre} - No se pudo limpiar (sabores: {num_sabores})")
                productos_sin_cambios += 1
            else:
                productos_sin_cambios += 1
        else:
            productos_sin_cambios += 1
        
        if (idx + 1) % 50 == 0:
            print(f"  Progreso: {idx+1}/{len(df)} productos procesados...")

print("\n" + "="*80)
print("RESUMEN DE CORRECCIONES")
print("="*80)
print(f"Productos problemáticos encontrados: {productos_problematicos_encontrados}")
print(f"Productos corregidos: {productos_corregidos}")
print(f"Productos sin cambios: {productos_sin_cambios}")

print("\n" + "="*80)
print("GUARDANDO BASE DE DATOS CORREGIDA")
print("="*80)

# Guardar manteniendo la estructura de hojas
with pd.ExcelWriter(bd_salida, engine='openpyxl') as writer:
    for sheet_name, df in sheets.items():
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        print(f"  - Hoja '{sheet_name}': {len(df)} productos guardados")

print(f"\nBase de datos corregida guardada en: {bd_salida}")
print("="*80)
print("PROCESO COMPLETADO")
print("="*80)

