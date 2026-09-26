import pandas as pd
import json
from pathlib import Path

def añadir_ingredientes_al_json():
    """Añade la columna ingredients del Excel a cada producto en el JSON"""
    
    # Rutas de archivos
    excel_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\resultados_aditivos_doble_excel_20251119_040457.xlsx")
    json_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\resultados_aditivos_doble_excel_20251119_040457.json")
    
    print("="*80)
    print("AÑADIENDO INGREDIENTES DEL EXCEL AL JSON")
    print("="*80)
    print()
    
    # 1. Cargar Excel
    print("1. Cargando Excel...")
    try:
        df_excel = pd.read_excel(excel_path, engine="openpyxl")
        print(f"   [OK] {len(df_excel)} productos cargados desde Excel")
        
        # Verificar qué columnas tiene
        print(f"   Columnas disponibles: {list(df_excel.columns)}")
        
        # Buscar columna de ingredientes (puede ser 'ingredients' o 'ingredientes')
        columna_ingredientes = None
        if 'ingredients' in df_excel.columns:
            columna_ingredientes = 'ingredients'
        elif 'ingredientes' in df_excel.columns:
            columna_ingredientes = 'ingredientes'
        else:
            print("   [ERROR] No se encontró columna 'ingredients' ni 'ingredientes'")
            return
        
        print(f"   [OK] Usando columna: '{columna_ingredientes}'")
    except Exception as e:
        print(f"   [ERROR] Error cargando Excel: {e}")
        return
    
    print()
    
    # 2. Cargar JSON
    print("2. Cargando JSON...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            productos_json = json.load(f)
        print(f"   [OK] {len(productos_json)} productos cargados desde JSON")
    except Exception as e:
        print(f"   [ERROR] Error cargando JSON: {e}")
        return
    
    print()
    
    # 3. Crear diccionario de ingredientes por EAN
    print("3. Creando diccionario de ingredientes por EAN...")
    ingredientes_por_ean = {}
    ean_sin_ingredientes = 0
    
    for idx, row in df_excel.iterrows():
        ean_raw = row.get('ean', '')
        # Normalizar EAN: convertir a string y limpiar
        if pd.notna(ean_raw):
            ean = str(ean_raw).strip().replace('.0', '')  # Eliminar .0 de floats
            ingredientes = row.get(columna_ingredientes, '')
            if pd.notna(ingredientes) and str(ingredientes).strip():
                ingredientes_por_ean[ean] = str(ingredientes).strip()
            else:
                ean_sin_ingredientes += 1
    
    print(f"   [OK] {len(ingredientes_por_ean)} productos con ingredientes en Excel")
    if ean_sin_ingredientes > 0:
        print(f"   [INFO] {ean_sin_ingredientes} productos sin ingredientes en Excel")
    
    print()
    
    # 4. Añadir ingredientes a cada producto en el JSON
    print("4. Añadiendo ingredientes a productos en JSON...")
    ingredientes_agregados = 0
    productos_sin_match = []
    
    for producto in productos_json:
        ean_producto = str(producto.get('ean', '')).strip().replace('.0', '')
        
        if ean_producto in ingredientes_por_ean:
            producto['ingredients'] = ingredientes_por_ean[ean_producto]
            ingredientes_agregados += 1
        else:
            productos_sin_match.append({
                'producto': producto.get('producto', 'N/A'),
                'ean': ean_producto
            })
    
    print(f"   [OK] {ingredientes_agregados} productos con ingredientes agregados")
    if productos_sin_match:
        print(f"   [INFO] {len(productos_sin_match)} productos sin match en Excel")
        if len(productos_sin_match) <= 10:
            print("   Productos sin match:")
            for p in productos_sin_match:
                print(f"      - {p['producto']} (EAN: {p['ean']})")
        else:
            print(f"   Primeros 10 productos sin match:")
            for p in productos_sin_match[:10]:
                print(f"      - {p['producto']} (EAN: {p['ean']})")
    
    print()
    
    # 5. Guardar JSON actualizado
    print("5. Guardando JSON actualizado...")
    try:
        # Crear backup
        backup_path = json_path.with_suffix('.json.backup')
        if not backup_path.exists():
            import shutil
            shutil.copy2(json_path, backup_path)
            print(f"   [OK] Backup creado: {backup_path.name}")
        
        # Guardar JSON actualizado
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(productos_json, f, ensure_ascii=False, indent=2)
        print(f"   [OK] JSON guardado exitosamente")
    except Exception as e:
        print(f"   [ERROR] Error guardando JSON: {e}")
        return
    
    print()
    print("="*80)
    print("PROCESO COMPLETADO")
    print("="*80)
    print(f"Total productos en JSON: {len(productos_json)}")
    print(f"Productos con ingredientes agregados: {ingredientes_agregados}")
    print(f"Productos sin match: {len(productos_sin_match)}")
    print()

if __name__ == "__main__":
    añadir_ingredientes_al_json()



