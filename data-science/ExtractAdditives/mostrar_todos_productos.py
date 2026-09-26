"""
Script para mostrar todos los productos 26-45 con sus aditivos detectados
"""
import json

with open('resultados_batches_26-45.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("="*100)
print("TODOS LOS PRODUCTOS 26-45 CON SUS ADITIVOS DETECTADOS")
print("="*100)

for producto in data:
    producto_num = producto['producto_num']
    producto_nombre = producto['producto_nombre']
    ingredientes = producto['ingredientes']
    aditivos = producto['aditivos_detectados']
    
    print("\n" + "="*100)
    print(f"PRODUCTO #{producto_num}: {producto_nombre}")
    print("="*100)
    
    if ingredientes is None:
        print("\n[SIN INGREDIENTES]")
        continue
    
    print("\nTEXTO DE INGREDIENTES:")
    print("-"*100)
    print(ingredientes)
    print("-"*100)
    
    print(f"\nADITIVOS DETECTADOS (FINALES): {len(aditivos)}")
    print("-"*100)
    
    if len(aditivos) == 0:
        print("Ninguno")
    else:
        # Mostrar en formato legible
        for i, aditivo in enumerate(aditivos, 1):
            e_num = aditivo['e_numero']
            nombre = aditivo['nombre_original']
            tipo = aditivo['tipo']
            origen = aditivo['origen']
            clasificacion = aditivo['clasificacion']
            print(f"{i}. [{e_num}] {nombre}")
            print(f"   Tipo: {tipo} | Origen: {origen} | Clasificacion: {clasificacion}")
        
        # Mostrar también en formato JSON
        print("\nFORMATO JSON:")
        print(json.dumps(aditivos, indent=2, ensure_ascii=False))
    
    print("-"*100)

print("\n" + "="*100)
print("RESUMEN")
print("="*100)
total = sum(len(p['aditivos_detectados']) for p in data)
print(f"Total productos: {len(data)}")
print(f"Total aditivos detectados: {total}")
print(f"Promedio: {total/len(data):.2f} aditivos por producto")
print("="*100)

