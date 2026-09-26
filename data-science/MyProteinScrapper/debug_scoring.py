"""Debug del scoring para ver por qué no está funcionando el matching."""
import sys
import re
import logging
sys.path.insert(0, '.')
from myprotein_ingredients_scraper import _strip_accents_lower

# Configurar logging para ver los mensajes de debug
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger('myprotein_ingredients_scraper')

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

flavour = "Naranja y  Mango"

# Simular el proceso de matching
product_flavour_norm = _strip_accents_lower(str(flavour).strip())
print(f"Flavour normalizado: '{product_flavour_norm}'")

# Buscar sabores
flavor_pattern3a = re.compile(
    r'(?:^|\n)([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]{2,40}?)\s*:', 
    re.MULTILINE
)

matches = list(flavor_pattern3a.finditer(texto))
print(f"\nSabores encontrados: {len(matches)}")

# Calcular scores
for i, match in enumerate(matches):
    flavor_name = match.group(1).strip()
    flavor_norm = _strip_accents_lower(flavor_name)
    
    # Normalizar
    flavor_norm_cleaned = re.sub(r'[&y\-_]', ' ', flavor_norm)
    flavor_norm_cleaned = re.sub(r'\s+', ' ', flavor_norm_cleaned).strip()
    product_flavour_norm_cleaned = re.sub(r'[&y\-_]', ' ', product_flavour_norm)
    product_flavour_norm_cleaned = re.sub(r'\s+', ' ', product_flavour_norm_cleaned).strip()
    
    print(f"\n[{i}] Sabor: '{flavor_name}'")
    print(f"    Normalizado: '{flavor_norm_cleaned}'")
    
    # Calcular score
    match_score = 0
    
    # Comparación exacta
    if product_flavour_norm_cleaned == flavor_norm_cleaned:
        match_score = 95
        print(f"    ✅ Coincidencia exacta: score = {match_score}")
    else:
        # Comparación de palabras clave
        product_words_set = set(product_flavour_norm_cleaned.split())
        flavor_words_set = set(flavor_norm_cleaned.split())
        product_important_words = {w for w in product_words_set if len(w) > 2 and w not in {'y', 'and', '&', 'de', 'a'}}
        
        print(f"    Palabras importantes del producto: {product_important_words}")
        print(f"    Palabras del sabor: {flavor_words_set}")
        
        if product_important_words and product_important_words.issubset(flavor_words_set):
            match_score = 85
            print(f"    ✅ Todas las palabras importantes coinciden: score = {match_score}")
        elif len(product_important_words.intersection(flavor_words_set)) >= 2:
            match_score = 60
            print(f"    ✅ Al menos 2 palabras coinciden: score = {match_score}")
        else:
            # Palabras clave importantes
            important_keywords = {'naranja', 'orange', 'mango'}
            matching_important = product_important_words.intersection(flavor_words_set).intersection(important_keywords)
            if matching_important:
                match_score = len(matching_important) * 30
                print(f"    ✅ Palabras clave importantes coinciden: {matching_important}, score = {match_score}")
            else:
                matching_words = sum(1 for word in product_important_words if word in flavor_norm_cleaned)
                if matching_words > 0:
                    match_score = matching_words * 20
                    print(f"    ✅ Palabras coincidentes: {matching_words}, score = {match_score}")
                else:
                    print(f"    X No hay coincidencias suficientes: score = {match_score}")

