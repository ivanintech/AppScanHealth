"""Debug detallado del matching para entender por qué falla."""
import sys
import re
sys.path.insert(0, '.')
from myprotein_ingredients_scraper import _strip_accents_lower, _clean_ingredients_text

# Caso de prueba
texto = """Lima-Limón: Hidrolizado de Proteína de Suero
(Leche)
(93%), Ácido (Ácido Cítrico, Ácido Fosfórico), Aroma Natural, Emulsionante (Fosfato Monosódico), Edulcorante (Sucralosa).
Té de Melocotón: Hidrolizado de Proteína de Suero
(Leche)
(97%), Aroma Natural, Ácido (Ácido Cítrico, Ácido Fosfórico), Emulsionante (Fosfato Monosódico), Edulcorante (Sucralosa).
Mojito: Hidrolizado de Proteína de Suero
(Leche)
(94%), Aroma, Ácido (Ácido Cítrico, Ácido Fosfórico), Edulcorante (Sucralosa).
Naranja-Mango: Hidrolizado de Proteína de Suero
(Leche)
(90%), Aroma, Ácido (Ácido Cítrico, Ácido Málico), Edulcorante (Sucralosa, Acesulfamo K), Sustancias Aromatizantes (Natural, Artificial), Colorante (Amarillo Anaranjado)), Ácido (Ácido Fosfórico), Emulsionante (Fosfato Monosódico)."""

flavour = "Naranja y  Mango"  # Con doble espacio

print("="*80)
print("DEBUG DETALLADO DE MATCHING")
print("="*80)
print(f"\nFlavour del producto: '{flavour}'")
print(f"\nTexto de ingredientes (primeros 500 chars):")
print(texto[:500])

# Normalizar el flavour
product_flavour_norm = _strip_accents_lower(str(flavour).strip())
print(f"\nFlavour normalizado (sin acentos, minúsculas): '{product_flavour_norm}'")

# Normalizar guiones y espacios
product_flavour_norm_cleaned = re.sub(r'[&y\-_]', ' ', product_flavour_norm)
product_flavour_norm_cleaned = re.sub(r'\s+', ' ', product_flavour_norm_cleaned).strip()
print(f"Flavour normalizado (sin guiones, espacios normalizados): '{product_flavour_norm_cleaned}'")

# Buscar sabores en el texto
flavor_pattern3a = re.compile(
    r'(?:^|\n)([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]{2,40}?)\s*:', 
    re.MULTILINE
)

matches = list(flavor_pattern3a.finditer(texto))
print(f"\nSabores encontrados en el texto:")
for i, match in enumerate(matches):
    flavor_name = match.group(1).strip()
    flavor_norm = _strip_accents_lower(flavor_name)
    flavor_norm_cleaned = re.sub(r'[&y\-_]', ' ', flavor_norm)
    flavor_norm_cleaned = re.sub(r'\s+', ' ', flavor_norm_cleaned).strip()
    print(f"  [{i}] '{flavor_name}' -> normalizado: '{flavor_norm_cleaned}'")
    print(f"      ¿Coincide con '{product_flavour_norm_cleaned}'? {flavor_norm_cleaned == product_flavour_norm_cleaned}")

# Aplicar la función completa
print("\n" + "="*80)
print("APLICANDO FUNCIÓN COMPLETA")
print("="*80)
resultado = _clean_ingredients_text(texto, flavour)
print(f"\nResultado: {len(resultado)} caracteres")
if resultado:
    print(f"Primeros 200 chars: {resultado[:200]}")
else:
    print("(vacío)")


