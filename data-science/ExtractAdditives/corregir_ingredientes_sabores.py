"""
Script para corregir los ingredientes y asegurar que cada producto tiene solo su sabor correspondiente
"""
import pandas as pd
import re
import unicodedata
from pathlib import Path
from typing import Optional

def _strip_accents_lower(s: str) -> str:
    """Normaliza texto eliminando acentos y convirtiendo a minúsculas."""
    try:
        s = unicodedata.normalize("NFKD", s)
        s = "".join(ch for ch in s if not unicodedata.combining(ch))
    except Exception:
        pass
    return s.lower().strip()

def _clean_ingredients_text_mejorado(text: str, product_flavour: Optional[str] = None) -> str:
    """
    Versión mejorada de limpieza de ingredientes que maneja mejor los casos de múltiples sabores.
    """
    if not text:
        return ""
    
    # Primero eliminar líneas de alérgenos al inicio
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    
    # Eliminar líneas de alérgenos
    allergen_keywords = [
        'alérgenos:', 'alergenos:', 'alérgeno:', 'alergeno:',
        'para los alérgenos', 'para los alergenos',
        'ver los ingredientes en negrita', 'ver los ingredientes en negrita.',
        'consulte los ingredientes en negrita', 'consulte los ingredientes en negrita.',
        'también puede contener', 'tambien puede contener',
        'negrita',
    ]
    
    filtered_lines = []
    for line in lines:
        norm_line = _strip_accents_lower(line)
        if (any(keyword in norm_line for keyword in allergen_keywords) or 
            norm_line.strip() == 'negrita' or
            norm_line.strip() == '.'):
            continue
        filtered_lines.append(line)
    
    if not filtered_lines:
        return ""
    
    text_cleaned = "\n".join(filtered_lines)
    
    # Detectar secciones de sabor - patrón mejorado
    # Busca: "Sabor X:", "Sabor X\n", "Sin Sabor:", etc.
    flavor_pattern = re.compile(r'(?:Sabor\s+|Sin\s+)([^:\n]+?)[:\n]', re.IGNORECASE)
    
    flavor_matches = list(flavor_pattern.finditer(text_cleaned))
    
    if len(flavor_matches) == 0:
        # No hay secciones de sabor, devolver texto limpio
        return text_cleaned.strip()
    
    # Si hay múltiples sabores, filtrar por el sabor del producto
    if len(flavor_matches) > 1 and product_flavour:
        product_flavour_norm = _strip_accents_lower(str(product_flavour).strip())
        
        # Mapeo de sabores comunes (español -> inglés y variantes)
        mapeo_sabores = {
            'sirope de oro': ['golden syrup', 'sirope de oro', 'golden'],
            'maple syrup': ['maple syrup', 'jarabe de arce', 'arce'],
            'sin sabor': ['sin sabor', 'unflavoured', 'natural', 'sin saborizante'],
            'chocolate': ['chocolate', 'cacao'],
            'avellana': ['avellana', 'hazelnut', 'nut'],
            'vainilla': ['vainilla', 'vanilla'],
            'fresa': ['fresa', 'strawberry', 'fresas'],
            'caramelo': ['caramelo', 'toffee', 'caramel'],
        }
        
        # Buscar el sabor que coincida
        matched_section = None
        mejor_coincidencia = 0
        
        for i, match in enumerate(flavor_matches):
            flavor_name = match.group(1).strip()
            flavor_norm = _strip_accents_lower(flavor_name)
            
            # Comparación directa
            if (product_flavour_norm == flavor_norm or
                product_flavour_norm in flavor_norm or
                flavor_norm in product_flavour_norm):
                matched_section = i
                mejor_coincidencia = 3
                break
            
            # Comparación usando mapeo
            for sabor_base, variantes in mapeo_sabores.items():
                if sabor_base in product_flavour_norm:
                    if any(v in flavor_norm for v in variantes):
                        if mejor_coincidencia < 2:
                            matched_section = i
                            mejor_coincidencia = 2
                    break
            
            # Comparación por palabras clave
            if mejor_coincidencia < 1:
                product_words = [w for w in product_flavour_norm.split() if len(w) > 2]
                if any(word in flavor_norm for word in product_words):
                    matched_section = i
                    mejor_coincidencia = 1
        
        # Extraer solo la sección del sabor encontrado
        if matched_section is not None:
            match = flavor_matches[matched_section]
            start_pos = match.end()
            # Buscar el inicio del siguiente sabor o el final del texto
            if matched_section + 1 < len(flavor_matches):
                end_pos = flavor_matches[matched_section + 1].start()
            else:
                end_pos = len(text_cleaned)
            
            flavor_content = text_cleaned[start_pos:end_pos].strip()
            return flavor_content
        else:
            # No se encontró match, devolver el primer sabor por defecto
            first_match = flavor_matches[0]
            start_pos = first_match.end()
            if len(flavor_matches) > 1:
                end_pos = flavor_matches[1].start()
            else:
                end_pos = len(text_cleaned)
            return text_cleaned[start_pos:end_pos].strip()
    
    # Si solo hay un sabor o no se encontró match, devolver todo el contenido después del primer sabor
    if flavor_matches:
        first_match = flavor_matches[0]
        start_pos = first_match.end()
        return text_cleaned[start_pos:].strip()
    
    return text_cleaned.strip()

def corregir_archivo_ingredientes(archivo_entrada: str, archivo_salida: str, usar_original: bool = False):
    """Corrige el archivo de ingredientes para que cada producto tenga solo su sabor."""
    print("="*100)
    print("CORRECCION DE INGREDIENTES POR SABOR")
    print("="*100)
    print(f"\nLeyendo archivo: {archivo_entrada}\n")
    
    # Leer el archivo (original o procesado según parámetro)
    if usar_original:
        df_original = pd.read_excel(archivo_entrada, engine="openpyxl")
    else:
        # Leer el archivo procesado y el original para obtener los ingredientes originales
        df_procesado = pd.read_excel(archivo_entrada, engine="openpyxl")
        df_original = pd.read_excel("db/MyProtein_Data_All_Products_Final.xlsx", engine="openpyxl")
        
        # Combinar: usar datos del procesado pero ingredientes del original
        df_resultado = df_procesado.copy()
        
        # Mapear ingredientes originales por URL o EAN
        ingredientes_por_ean = {}
        for idx, row in df_original.iterrows():
            ean = row.get("ean", "")
            if pd.notna(ean):
                ingredientes_por_ean[str(ean)] = row.get("ingredients", "")
        
        # Actualizar ingredientes en el resultado
        for idx, row in df_resultado.iterrows():
            ean = str(row.get("ean", ""))
            if ean in ingredientes_por_ean:
                df_resultado.at[idx, 'ingredients'] = ingredientes_por_ean[ean]
        
        df_original = df_resultado
    
    print(f"Total de productos: {len(df_original)}\n")
    print("Procesando ingredientes...\n")
    
    ingredientes_corregidos = 0
    productos_sin_ingredientes = 0
    
    for idx, row in df_original.iterrows():
        flavour = row.get("flavour", "")
        ingredients = row.get("ingredients", "")
        
        if pd.isna(ingredients) or not str(ingredients).strip():
            productos_sin_ingredientes += 1
            continue
        
        # Limpiar ingredientes con la función mejorada
        ingredients_cleaned = _clean_ingredients_text_mejorado(str(ingredients), flavour)
        
        if ingredients_cleaned != str(ingredients):
            ingredientes_corregidos += 1
        
        # Actualizar el DataFrame
        df_original.at[idx, 'ingredients'] = ingredients_cleaned
    
    print(f"[OK] Ingredientes corregidos: {ingredientes_corregidos}")
    print(f"[X] Productos sin ingredientes: {productos_sin_ingredientes}")
    
    # Guardar archivo corregido
    print(f"\nGuardando archivo corregido: {archivo_salida}")
    df_original.to_excel(archivo_salida, index=False, engine="openpyxl")
    
    print("\n" + "="*100)
    print("CORRECCION COMPLETADA")
    print("="*100)
    
    return df_original

if __name__ == "__main__":
    import sys
    
    archivo_entrada = "db/MyProtein_Data_All_Products_Final.xlsx"
    archivo_salida = "MyProtein_Ingredients_Final_Corregido.xlsx"
    
    if len(sys.argv) > 1:
        archivo_entrada = sys.argv[1]
    if len(sys.argv) > 2:
        archivo_salida = sys.argv[2]
    
    df_corregido = corregir_archivo_ingredientes(archivo_entrada, archivo_salida)
    
    print(f"\nArchivo corregido guardado en: {archivo_salida}")
    print(f"Total productos procesados: {len(df_corregido)}")

