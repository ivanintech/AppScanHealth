"""
Script para validar que cada producto tiene solo ingredientes de su sabor correspondiente
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

def encontrar_sabores_en_texto(texto: str) -> list:
    """Encuentra todas las menciones de sabores en el texto de ingredientes."""
    if not texto or pd.isna(texto):
        return []
    
    # Patrón para detectar secciones de sabor: "Sabor X:" o "Sabor X\n"
    flavor_pattern = re.compile(r'Sabor\s+([^:\n]+?)[:\n]', re.IGNORECASE)
    matches = flavor_pattern.findall(texto)
    
    sabores_encontrados = []
    for match in matches:
        sabor = match.strip()
        if sabor:
            sabores_encontrados.append(sabor)
    
    return sabores_encontrados

def comparar_sabores(sabor_producto: str, sabores_en_texto: list) -> tuple:
    """
    Compara el sabor del producto con los sabores encontrados en el texto.
    Retorna (coincide, sabores_extra, mensaje)
    """
    if not sabor_producto or pd.isna(sabor_producto):
        sabor_producto_norm = ""
    else:
        sabor_producto_norm = _strip_accents_lower(str(sabor_producto))
    
    if not sabores_en_texto:
        return (True, [], "No hay secciones de sabor en el texto (OK)")
    
    sabores_extra = []
    sabor_coincide = False
    
    for sabor_texto in sabores_en_texto:
        sabor_texto_norm = _strip_accents_lower(sabor_texto)
        
        # Verificar si coincide con el sabor del producto
        if (sabor_producto_norm == sabor_texto_norm or
            sabor_producto_norm in sabor_texto_norm or
            sabor_texto_norm in sabor_producto_norm):
            sabor_coincide = True
        else:
            # Verificar por palabras clave
            if sabor_producto_norm:
                palabras_producto = [w for w in sabor_producto_norm.split() if len(w) > 2]
                palabras_texto = [w for w in sabor_texto_norm.split() if len(w) > 2]
                if any(palabra in sabor_texto_norm for palabra in palabras_producto):
                    sabor_coincide = True
                else:
                    sabores_extra.append(sabor_texto)
            else:
                sabores_extra.append(sabor_texto)
    
    # Si hay múltiples sabores y uno coincide, los demás son extra
    if len(sabores_en_texto) > 1:
        if sabor_coincide:
            # Filtrar el que coincide
            sabores_extra = [s for s in sabores_en_texto 
                           if not (_strip_accents_lower(s) == sabor_producto_norm or
                                  sabor_producto_norm in _strip_accents_lower(s) or
                                  _strip_accents_lower(s) in sabor_producto_norm)]
        else:
            # Ninguno coincide, todos son extra
            sabores_extra = sabores_en_texto
    
    if sabores_extra:
        return (False, sabores_extra, f"Se encontraron sabores adicionales: {', '.join(sabores_extra)}")
    elif sabor_coincide:
        return (True, [], "Sabor coincide correctamente")
    else:
        return (False, sabores_en_texto, f"Ningún sabor coincide. Producto tiene '{sabor_producto}', texto tiene: {', '.join(sabores_en_texto)}")

def validar_sabores_ingredientes(archivo_excel: str):
    """Valida que cada producto tiene solo ingredientes de su sabor correspondiente."""
    print("="*100)
    print("VALIDACIÓN DE SABORES EN INGREDIENTES")
    print("="*100)
    print(f"\nLeyendo archivo: {archivo_excel}\n")
    
    df = pd.read_excel(archivo_excel, engine="openpyxl")
    
    print(f"Total de productos: {len(df)}\n")
    
    problemas = []
    productos_sin_sabor = []
    productos_sin_ingredientes = []
    productos_ok = []
    
    for idx, row in df.iterrows():
        producto = row.get("producto", "")
        ean = row.get("ean", "")
        flavour = row.get("flavour", "")
        ingredients = row.get("ingredients", "")
        
        # Verificar si tiene ingredientes
        if pd.isna(ingredients) or not str(ingredients).strip():
            productos_sin_ingredientes.append({
                "idx": idx,
                "producto": producto,
                "ean": ean,
                "flavour": flavour
            })
            continue
        
        # Verificar si tiene sabor
        if pd.isna(flavour) or not str(flavour).strip():
            productos_sin_sabor.append({
                "idx": idx,
                "producto": producto,
                "ean": ean,
                "ingredients_preview": str(ingredients)[:100] + "..." if len(str(ingredients)) > 100 else str(ingredients)
            })
            continue
        
        # Buscar sabores en el texto
        sabores_en_texto = encontrar_sabores_en_texto(str(ingredients))
        coincide, sabores_extra, mensaje = comparar_sabores(flavour, sabores_en_texto)
        
        if not coincide:
            problemas.append({
                "idx": idx,
                "producto": producto,
                "ean": ean,
                "flavour": flavour,
                "sabores_en_texto": sabores_en_texto,
                "sabores_extra": sabores_extra,
                "mensaje": mensaje,
                "ingredients_preview": str(ingredients)[:200] + "..." if len(str(ingredients)) > 200 else str(ingredients)
            })
        else:
            productos_ok.append({
                "idx": idx,
                "producto": producto,
                "flavour": flavour
            })
    
    # Reporte
    print("="*100)
    print("RESUMEN DE VALIDACION")
    print("="*100)
    print(f"\n[OK] Productos OK: {len(productos_ok)}")
    print(f"[!]  Productos con problemas: {len(problemas)}")
    print(f"[X] Productos sin sabor: {len(productos_sin_sabor)}")
    print(f"[X] Productos sin ingredientes: {len(productos_sin_ingredientes)}")
    
    # Mostrar productos con problemas
    if problemas:
        print("\n" + "="*100)
        print("PRODUCTOS CON PROBLEMAS DE SABOR")
        print("="*100)
        for i, prob in enumerate(problemas[:20], 1):  # Mostrar primeros 20
            print(f"\n{i}. Producto #{prob['idx']}: {prob['producto']}")
            print(f"   EAN: {prob['ean']}")
            print(f"   Sabor del producto: '{prob['flavour']}'")
            print(f"   Sabores encontrados en texto: {prob['sabores_en_texto']}")
            print(f"   Problema: {prob['mensaje']}")
            print(f"   Ingredientes (preview): {prob['ingredients_preview']}")
        
        if len(problemas) > 20:
            print(f"\n... y {len(problemas) - 20} productos más con problemas")
    
    # Mostrar productos sin sabor
    if productos_sin_sabor:
        print("\n" + "="*100)
        print("PRODUCTOS SIN SABOR DEFINIDO")
        print("="*100)
        for i, prod in enumerate(productos_sin_sabor[:10], 1):
            print(f"{i}. Producto #{prod['idx']}: {prod['producto']} (EAN: {prod['ean']})")
    
    # Mostrar productos sin ingredientes
    if productos_sin_ingredientes:
        print("\n" + "="*100)
        print("PRODUCTOS SIN INGREDIENTES")
        print("="*100)
        for i, prod in enumerate(productos_sin_ingredientes[:10], 1):
            print(f"{i}. Producto #{prod['idx']}: {prod['producto']} (EAN: {prod['ean']}, Sabor: {prod['flavour']})")
    
    # Guardar reporte detallado
    if problemas:
        reporte_path = "reporte_validacion_sabores.txt"
        with open(reporte_path, "w", encoding="utf-8") as f:
            f.write("="*100 + "\n")
            f.write("REPORTE DETALLADO - VALIDACIÓN DE SABORES\n")
            f.write("="*100 + "\n\n")
            f.write(f"Total productos con problemas: {len(problemas)}\n\n")
            
            for prob in problemas:
                f.write("-"*100 + "\n")
                f.write(f"Producto #{prob['idx']}: {prob['producto']}\n")
                f.write(f"EAN: {prob['ean']}\n")
                f.write(f"Sabor del producto: '{prob['flavour']}'\n")
                f.write(f"Sabores encontrados en texto: {prob['sabores_en_texto']}\n")
                f.write(f"Sabores extra: {prob['sabores_extra']}\n")
                f.write(f"Problema: {prob['mensaje']}\n")
                f.write(f"\nIngredientes completos:\n{prob['ingredients_preview']}\n\n")
        
        print(f"\n[INFO] Reporte detallado guardado en: {reporte_path}")
    
    print("\n" + "="*100)
    print("VALIDACIÓN COMPLETADA")
    print("="*100)
    
    return {
        "total": len(df),
        "ok": len(productos_ok),
        "problemas": len(problemas),
        "sin_sabor": len(productos_sin_sabor),
        "sin_ingredientes": len(productos_sin_ingredientes)
    }

if __name__ == "__main__":
    import sys
    
    archivo = "MyProtein_Ingredients_Final.xlsx"
    if len(sys.argv) > 1:
        archivo = sys.argv[1]
    
    resultados = validar_sabores_ingredientes(archivo)
    
    # Exit code basado en resultados
    if resultados["problemas"] > 0 or resultados["sin_ingredientes"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

