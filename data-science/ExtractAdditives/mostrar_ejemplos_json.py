"""
Script para mostrar ejemplos específicos del archivo JSON
"""
import json

with open('resultados_batches_26-45.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("="*100)
print("EJEMPLOS DE PRODUCTOS CON SUS ADITIVOS DETECTADOS")
print("="*100)

# Mostrar producto 39 (el que tenía falsos positivos)
print("\n" + "="*100)
print("PRODUCTO 39: Calendario de Adviento 2025")
print("="*100)
p39 = [p for p in data if p['producto_num'] == 39][0]
print(f"\nTEXTO DE INGREDIENTES (fragmento):")
print(p39['ingredientes'][:500] + "...")
print(f"\nADITIVOS DETECTADOS ({len(p39['aditivos_detectados'])}):")
for aditivo in p39['aditivos_detectados']:
    print(f"  [{aditivo['e_numero']}] {aditivo['nombre_original']} - {aditivo['tipo']}")

# Mostrar algunos productos más
for producto in data[:5]:
    print("\n" + "="*100)
    print(f"PRODUCTO {producto['producto_num']}: {producto['producto_nombre']}")
    print("="*100)
    print(f"\nADITIVOS DETECTADOS ({len(producto['aditivos_detectados'])}):")
    if len(producto['aditivos_detectados']) == 0:
        print("  Ninguno")
    else:
        for aditivo in producto['aditivos_detectados']:
            print(f"  [{aditivo['e_numero']}] {aditivo['nombre_original']} ({aditivo['tipo']})")
    print(f"\nJSON COMPLETO:")
    print(json.dumps({
        "producto_num": producto['producto_num'],
        "producto_nombre": producto['producto_nombre'],
        "aditivos_detectados": producto['aditivos_detectados']
    }, indent=2, ensure_ascii=False))

print("\n" + "="*100)
print("ARCHIVO COMPLETO DISPONIBLE: resultados_batches_26-45.json")
print("="*100)
print("\nEl archivo contiene 20 productos (26-45) con:")
print("  - Texto completo de ingredientes")
print("  - Aditivos detectados en formato JSON")
print("\nPuedes abrir el archivo JSON en cualquier editor para revisar todos los productos.")

