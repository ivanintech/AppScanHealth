"""
Script para mostrar resumen del archivo JSON generado
"""
import json

with open('resultados_batches_26-45.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("="*100)
print("RESUMEN ESTADISTICO - PRODUCTOS 26-45")
print("="*100)
print(f"\nTotal productos analizados: {len(data)}")
print(f"Productos con aditivos detectados: {sum(1 for p in data if len(p.get('aditivos_detectados', [])) > 0)}")
print(f"Productos sin aditivos: {sum(1 for p in data if len(p.get('aditivos_detectados', [])) == 0)}")
print(f"Total aditivos detectados: {sum(len(p.get('aditivos_detectados', [])) for p in data)}")
print(f"Promedio aditivos por producto: {sum(len(p.get('aditivos_detectados', [])) for p in data) / len(data):.2f}")

# Contar por tipo
tipos = {}
for producto in data:
    for aditivo in producto.get('aditivos_detectados', []):
        tipo = aditivo.get('tipo', 'N/A')
        tipos[tipo] = tipos.get(tipo, 0) + 1

print("\nDistribucion por tipo:")
for tipo, count in sorted(tipos.items(), key=lambda x: x[1], reverse=True):
    print(f"  {tipo}: {count}")

print("\n" + "="*100)
print("ARCHIVO JSON DISPONIBLE: resultados_batches_26-45.json")
print("="*100)
print("\nEl archivo contiene todos los productos con:")
print("  - producto_num: Numero del producto")
print("  - producto_nombre: Nombre del producto")
print("  - ingredientes: Texto completo de ingredientes")
print("  - aditivos_detectados: Array con aditivos detectados (formato JSON)")
print("\nCada aditivo contiene:")
print("  - e_numero: E-numero del aditivo")
print("  - nombre_original: Nombre del aditivo")
print("  - tipo: No nocivo/Sospechoso/Peligroso")
print("  - origen: Origen del aditivo")
print("  - clasificacion: Clasificacion funcional")

