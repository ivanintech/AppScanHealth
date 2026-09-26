import logging
import re
import json
import unicodedata
from pathlib import Path
from typing import List, Optional, Dict, Any, TYPE_CHECKING
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
from bs4 import BeautifulSoup
import requests
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Importar detector de aditivos
if TYPE_CHECKING:
    from aditivos_detector import AditivosDetector
    from llm_analyzer import LLMAnalyzer

try:
    from aditivos_detector import AditivosDetector
    from llm_analyzer import LLMAnalyzer, create_llm_config_from_env
    ADITIVOS_AVAILABLE = True
except ImportError:
    ADITIVOS_AVAILABLE = False
    AditivosDetector = None  # type: ignore
    LLMAnalyzer = None  # type: ignore
    create_llm_config_from_env = None  # type: ignore
    logger.warning("No se pudo importar el detector de aditivos. La detección de aditivos no estará disponible.")

INPUT_DEFAULT = "MyProtein_Data_All_Products_Final.xlsx"
OUTPUT_DEFAULT = "MyProtein_Ingredients.xlsx"


def _strip_accents_lower(s: str) -> str:
    """Normaliza texto eliminando acentos y convirtiendo a minúsculas."""
    try:
        s = unicodedata.normalize("NFKD", s)
        s = "".join(ch for ch in s if not unicodedata.combining(ch))
    except Exception:
        pass
    return s.lower().strip()


def _final_cleanup_ingredients(result: str) -> str:
    """Aplica limpieza final al texto de ingredientes."""
    # Limpiar prefijos comunes no deseados
    prefixes_to_remove = [
        r'^:\s*',  # Dos puntos al inicio
        r'^INGREDIENTES?:\s*',  # "INGREDIENTES:" o "INGREDIENTE:"
        r'^Ingredientes?:\s*',  # "Ingredientes:" o "Ingrediente:"
    ]
    for prefix in prefixes_to_remove:
        result = re.sub(prefix, '', result, flags=re.IGNORECASE)
    
    # Unir líneas que están separadas innecesariamente
    lines = result.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Si la línea es muy corta (menos de 3 palabras o 30 caracteres) y no termina con puntuación,
        # probablemente es una continuación de la línea anterior
        is_short_line = len(line.split()) <= 3 and len(line) < 30
        
        # Si hay una línea anterior
        if cleaned_lines:
            prev_line = cleaned_lines[-1]
            
            # Si la línea anterior termina con paréntesis abierto o la línea actual es corta,
            # unir con espacio (no con nueva línea)
            if (prev_line.endswith('(') or 
                (is_short_line and not line.endswith(('.', ':', ')', ';')) and 
                 not prev_line.endswith(('.', ')', ';')))):
                cleaned_lines[-1] = prev_line + ' ' + line
            else:
                cleaned_lines.append(line)
        else:
            cleaned_lines.append(line)
    
    # Unir todas las líneas en un solo texto, pero preservar estructura lógica
    # Si hay muchas líneas, unirlas con espacios
    if len(cleaned_lines) > 1:
        result = ' '.join(cleaned_lines)
    else:
        result = cleaned_lines[0] if cleaned_lines else ""
    
    # Limpiar espacios múltiples y espacios alrededor de paréntesis
    result = re.sub(r'\s+', ' ', result)
    result = re.sub(r'\s*\(\s*', ' (', result)  # Espacio antes de (
    result = re.sub(r'\s*\)\s*', ') ', result)  # Espacio después de )
    result = re.sub(r'\s*,\s*', ', ', result)  # Espacio después de coma
    result = re.sub(r'\s+', ' ', result)  # Limpiar espacios múltiples de nuevo
    result = result.strip()
    
    # Eliminar ":" al inicio si todavía está ahí
    if result.startswith(':'):
        result = result[1:].strip()
    
    return result


def _clean_ingredients_text(text: str, product_flavour: Optional[str] = None) -> str:
    """Limpia el texto de ingredientes eliminando alérgenos y filtrando por sabor."""
    if not text:
        return ""
    
    # Primero eliminar líneas de alérgenos al inicio
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    
    # Eliminar líneas de alérgenos al principio
    allergen_keywords = [
        'alérgenos:', 'alergenos:', 'alérgeno:', 'alergeno:',
        'para los alérgenos', 'para los alergenos',
        'ver los ingredientes en negrita', 'ver los ingredientes en negrita.',
        'consulte los ingredientes en negrita', 'consulte los ingredientes en negrita.',
        'también puede contener', 'tambien puede contener',
        'negrita',  # Líneas que solo dicen "negrita"
    ]
    
    # Filtrar líneas de alérgenos
    filtered_lines = []
    for line in lines:
        norm_line = _strip_accents_lower(line)
        # Saltar líneas que solo contienen palabras de alérgenos o "negrita"
        if (any(keyword in norm_line for keyword in allergen_keywords) or 
            norm_line.strip() == 'negrita' or
            norm_line.strip() == '.'):
            continue
        filtered_lines.append(line)
    
    if not filtered_lines:
        return ""
    
    text_cleaned = "\n".join(filtered_lines)
    
    # Detectar secciones de sabor usando regex más robusto
    # Patrón mejorado que detecta:
    # - "Sabor X:" donde X puede tener espacios, caracteres especiales, y "&"
    # - Maneja saltos de línea entre "Sabor" y el nombre del sabor
    # - "Sin Sabor:" o "Sin sabor:" como caso especial (captura "Sin Sabor" completo)
    # - "X:" donde X es un nombre de sabor al inicio de línea (formato alternativo)
    # Usamos múltiples patrones para cubrir todos los casos
    # Nota: \s incluye espacios, tabs y saltos de línea, y [^:\n] permite saltos de línea en el nombre
    flavor_pattern1 = re.compile(r'Sabor\s+([^:]+?)\s*:', re.IGNORECASE | re.DOTALL)
    flavor_pattern2 = re.compile(r'(Sin\s+Sabor)\s*:', re.IGNORECASE)
    
    # Patrón para formato alternativo: nombres de sabor al inicio de línea seguidos de ":"
    # En lugar de una lista limitada, usamos un patrón más flexible que detecta
    # cualquier palabra o frase que parezca un nombre de sabor (no palabras comunes)
    
    # Palabras que NO son sabores (para filtrar falsos positivos)
    palabras_no_sabor = [
        r'INGREDIENTES?', r'INGREDIENTE', r'Alérgenos?', r'Alergenos?',
        r'Para', r'Puede', r'Contiene', r'Fabricado', r'Producido',
        r'Mezcla', r'Harina', r'Aceite', r'Agua', r'Azúcar', r'Edulcorante',
        r'Aroma', r'Colorante', r'Emulsionante', r'Leche', r'Soja', r'Huevo',
        r'Trigo', r'Gluten', r'ALLERGENS', r'CHIPS', r'Sólidos', r'Elaborado'
    ]
    
    # Patrón flexible: detecta cualquier palabra/frase seguida de ":" 
    # Puede estar al inicio de línea/string O después de un punto y espacio
    # Formato: "Palabra o Frase:" donde puede tener espacios, guiones, "&", etc.
    # Usar dos patrones: uno para inicio de línea/string y otro para después de punto
    flavor_pattern3a = re.compile(
        r'(?:^|\n)([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]{2,40}?)\s*:', 
        re.MULTILINE
    )
    flavor_pattern3b = re.compile(
        r'\.\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s&\-]{2,40}?)\s*:', 
        re.MULTILINE
    )
    
    # Buscar todas las secciones de sabor
    flavor_matches = list(flavor_pattern1.finditer(text_cleaned))
    sin_sabor_matches = list(flavor_pattern2.finditer(text_cleaned))
    direct_flavor_matches = list(flavor_pattern3a.finditer(text_cleaned)) + list(flavor_pattern3b.finditer(text_cleaned))
    
    # Agregar matches de "Sin Sabor" con un wrapper que simula group(1)
    for match in sin_sabor_matches:
        class SinSaborMatch:
            def __init__(self, original_match):
                self._match = original_match
            def start(self):
                return self._match.start()
            def end(self):
                return self._match.end()
            def group(self, n):
                if n == 1:
                    return "Sin Sabor"
                return self._match.group(0) if n == 0 else None
        flavor_matches.append(SinSaborMatch(match))
    
    # Agregar matches de formato directo (sin "Sabor")
    # Filtrar falsos positivos (palabras que no son sabores)
    for match in direct_flavor_matches:
        flavor_name_candidate = match.group(1).strip()
        flavor_name_lower = flavor_name_candidate.lower()
        
        # Filtrar si es una palabra común que no es un sabor
        # PERO solo si la palabra completa coincide (no si es parte de un nombre compuesto)
        es_falso_positivo = False
        for palabra_no_sabor in palabras_no_sabor:
            # Usar word boundary para que solo coincida palabras completas
            pattern_no_sabor = re.compile(rf'\b{re.escape(palabra_no_sabor)}\b', re.IGNORECASE)
            if pattern_no_sabor.search(flavor_name_candidate):
                # Si la palabra completa es igual a la palabra no-sabor, es falso positivo
                if flavor_name_candidate.strip().lower() == palabra_no_sabor.lower():
                    es_falso_positivo = True
                    break
                # Si empieza con la palabra no-sabor seguida de ":" (como "INGREDIENTES:"), es falso positivo
                if flavor_name_candidate.strip().lower().startswith(palabra_no_sabor.lower() + ':'):
                    es_falso_positivo = True
                    break
        
        # También filtrar si es muy corta (menos de 3 caracteres) o muy larga (más de 50)
        if len(flavor_name_candidate) < 3 or len(flavor_name_candidate) > 50:
            es_falso_positivo = True
        
        # Filtrar si contiene solo números o caracteres especiales
        if re.match(r'^[\d\s\-\(\)]+$', flavor_name_candidate):
            es_falso_positivo = True
        
        # Filtrar si empieza con minúscula (probablemente no es un nombre de sabor al inicio de línea)
        # PERO permitir si parece un nombre de sabor válido (tiene mayúsculas después, como "Lima-Limón")
        if flavor_name_candidate and flavor_name_candidate[0].islower():
            # Permitir algunos casos especiales conocidos
            nombres_minuscula_permitidos = ['elaborado', 'producido', 'fabricado']
            # También permitir si tiene mayúsculas en medio (como "lima-Limón" o "té de Melocotón")
            tiene_mayusculas = any(c.isupper() for c in flavor_name_candidate[1:])
            if not any(perm in flavor_name_lower for perm in nombres_minuscula_permitidos) and not tiene_mayusculas:
                # Verificar si es realmente el inicio de línea o está en medio de una frase
                match_start = match.start()
                # Si hay texto antes del match en la misma línea, probablemente no es un sabor
                line_start = text_cleaned.rfind('\n', 0, match_start) + 1
                text_before = text_cleaned[line_start:match_start].strip()
                if text_before and not text_before.endswith('.'):
                    es_falso_positivo = True
        
        if not es_falso_positivo:
            class DirectFlavorMatch:
                def __init__(self, original_match):
                    self._match = original_match
                    # Si el match incluye ". " al inicio (patrón 3b), ajustar la posición
                    # Si el match incluye "\n" al inicio (patrón 3a), ajustar la posición
                    match_text = original_match.group(0)
                    if match_text.startswith('. '):
                        # El start() incluye el punto y espacio, pero queremos empezar después
                        self._adjusted_start = original_match.start() + 2  # Saltar ". "
                    elif match_text.startswith('\n'):
                        # El start() incluye el salto de línea, pero queremos empezar después
                        self._adjusted_start = original_match.start() + 1  # Saltar "\n"
                    else:
                        self._adjusted_start = original_match.start()
                def start(self):
                    return self._adjusted_start
                def end(self):
                    return self._match.end()
                def group(self, n):
                    if n == 1:
                        # Extraer el nombre del sabor (grupo 1 ya tiene el nombre sin el punto)
                        return self._match.group(1).strip()
                    return self._match.group(0) if n == 0 else None
            flavor_matches.append(DirectFlavorMatch(match))
    
    # Ordenar todos los matches por posición de inicio para asegurar orden correcto
    flavor_matches.sort(key=lambda m: m.start())
    
    if len(flavor_matches) == 0:
        # No hay secciones de sabor, devolver texto limpio
        return text_cleaned.strip()
    
    # Si hay múltiples sabores, filtrar por el sabor del producto
    if len(flavor_matches) > 1 and product_flavour:
        # Normalizar el flavour del producto: primero normalizar espacios múltiples y guiones
        product_flavour_str = str(product_flavour).strip()
        # Normalizar espacios múltiples primero
        product_flavour_str = re.sub(r'\s+', ' ', product_flavour_str)
        product_flavour_norm = _strip_accents_lower(product_flavour_str)
        
        # Mapeo de traducciones comunes español-inglés para sabores
        flavor_translations = {
            'canela': 'cinnamon',
            'azucar': 'sugar',
            'chocolate': 'chocolate',
            'vainilla': 'vanilla',
            'fresa': 'strawberry',
            'platano': 'banana',
            'arandano': 'blueberry',
            'coco': 'coconut',
            'caramelo': 'caramel',
            'nueces': 'nuts',
            'avellana': 'hazelnut',
            'cafe': 'coffee',
            'matcha': 'matcha',
            'maple': 'maple',
            'syrup': 'syrup',
            'golden': 'golden',
            'cookies': 'cookies',
            'cream': 'cream',
            'sin sabor': 'sin sabor',
            'sin': 'sin',
            'mazapan': 'marzipan',
            'mantequilla': 'butter',
            'cacahuete': 'peanut',
            'turron': 'nougat',
            'crema': 'cream',
            'sirope': 'syrup',
            'oro': 'golden',
            'arandanos': 'blueberry',
            'frambuesa': 'raspberry',
            'melocoton': 'peach',
            'mango': 'mango',
            'arce': 'maple',
            'moca': 'mocha',
            'turmeric': 'turmeric',
            'latte': 'latte',
            'cúrcuma': 'turmeric',
            'curcuma': 'turmeric',
            'white chocolate': 'white chocolate',
            'chocolate blanco': 'white chocolate',
            'raspberry': 'raspberry',
            'orange': 'orange',
            'naranja': 'orange',
            'cacao': 'cocoa',
            'cocoa': 'cocoa',
            'cacao & orange': 'cacao & orange',
            'cacao and orange': 'cacao & orange',
        }
        
        # Mapeo inverso para casos donde el texto tiene español y el producto tiene inglés
        reverse_translations = {
            'cinnamon': 'canela',
            'sugar': 'azucar',
            'strawberry': 'fresa',
            'banana': 'platano',
            'blueberry': 'arandano',
            'coffee': 'cafe',
            'coconut': 'coco',
            'hazelnut': 'avellana',
            'peanut': 'cacahuete',
            'nougat': 'turron',
            'raspberry': 'frambuesa',
            'peach': 'melocoton',
            'mocha': 'moca',
            'turmeric': 'cúrcuma',
            'white chocolate': 'chocolate blanco',
            'orange': 'naranja',
            'cocoa': 'cacao',
            'lime': 'lima', 'lemon': 'limon',
            'peach': 'melocoton', 'grape': 'uva',
            'blackcurrant': 'grosella', 'elderflower': 'saúco',
            'grapefruit': 'pomelo', 'watermelon': 'sandia',
            'apple': 'manzana',
        }
        
        # Normalizar el sabor del producto: reemplazar palabras conocidas
        product_flavour_normalized = product_flavour_norm
        for es_word, en_word in flavor_translations.items():
            if es_word in product_flavour_normalized:
                product_flavour_normalized = product_flavour_normalized.replace(es_word, en_word)
        
        # También aplicar traducciones inversas (inglés -> español)
        for en_word, es_word in reverse_translations.items():
            if en_word in product_flavour_normalized:
                # No reemplazar directamente, sino crear una versión alternativa
                product_flavour_normalized_alt = product_flavour_normalized.replace(en_word, es_word)
        
        # Caso especial: "Sin Sabor" / "Sin sabor"
        if 'sin' in product_flavour_normalized and 'sabor' in product_flavour_normalized:
            product_flavour_normalized = 'sin sabor'
        
        # Casos especiales para nombres compuestos comunes
        # "Turmeric Latte" puede aparecer como "Plátano:" en el texto porque contiene cúrcuma
        # "Café y Nueces" puede aparecer como "Café y Nueces:" o "Coffee & Nuts:"
        if 'cafe' in product_flavour_normalized and 'nueces' in product_flavour_normalized:
            # Buscar también "Coffee" y "Nuts" como alternativas
            product_flavour_normalized = product_flavour_normalized.replace('cafe', 'coffee').replace('nueces', 'nuts')
        
        if 'turmeric' in product_flavour_normalized and 'latte' in product_flavour_normalized:
            # "Turmeric Latte" puede aparecer como "Plátano:" en el texto
            # Necesitamos buscar por contenido, no solo por nombre
            # Por ahora, intentaremos buscar "Plátano" como fallback
            pass
        
        # Extraer palabras clave del sabor del producto (palabras de más de 2 letras)
        product_words = [w for w in product_flavour_normalized.split() if len(w) > 2]
        # También incluir palabras del sabor original
        product_words_original = [w for w in product_flavour_norm.split() if len(w) > 2]
        all_product_words = list(set(product_words + product_words_original))
        
        matched_section = None
        best_match_score = 0
        
        # Buscar el sabor que mejor coincida
        for i, match in enumerate(flavor_matches):
            flavor_name = match.group(1).strip()
            # Normalizar: si el nombre capturado es "Sabor" (sin más texto), puede ser un error del regex
            if flavor_name.lower() == 'sabor':
                continue
            flavor_norm = _strip_accents_lower(flavor_name)
            
            # Calcular score de coincidencia
            match_score = 0
            
            # Caso especial: "Sin Sabor"
            if 'sin' in product_flavour_normalized and 'sabor' in product_flavour_normalized:
                if 'sin' in flavor_norm and 'sabor' in flavor_norm:
                    match_score = 100
                elif flavor_norm.strip() == 'sin sabor' or flavor_norm.strip() == 'sin':
                    match_score = 100
            
            # Comparación exacta
            if match_score == 0:
                # Limpiar el nombre del sabor de prefijos comunes como "a", "de", "a dulce de azúcar de", etc.
                # También limpiar "Sabor" si está al inicio
                flavor_norm_cleaned = re.sub(r'^(sabor|a|de|a dulce de azucar de|a dulce de azúcar de)\s+', '', flavor_norm, flags=re.IGNORECASE)
                flavor_norm_cleaned = flavor_norm_cleaned.strip()
                
                # Normalizar "&", "y", "-" y "_" a espacios para comparación
                flavor_norm_cleaned = re.sub(r'[&y\-_]', ' ', flavor_norm_cleaned)
                product_flavour_norm_cleaned = re.sub(r'[&y\-_]', ' ', product_flavour_norm)
                product_flavour_normalized_cleaned = re.sub(r'[&y\-_]', ' ', product_flavour_normalized)
                
                # Normalizar espacios múltiples
                flavor_norm_cleaned = re.sub(r'\s+', ' ', flavor_norm_cleaned).strip()
                product_flavour_norm_cleaned = re.sub(r'\s+', ' ', product_flavour_norm_cleaned).strip()
                product_flavour_normalized_cleaned = re.sub(r'\s+', ' ', product_flavour_normalized_cleaned).strip()
                
                # Normalizar plurales/singulares comunes
                flavor_norm_cleaned = re.sub(r'\barandanos\b', 'arandano', flavor_norm_cleaned, flags=re.IGNORECASE)
                product_flavour_norm_cleaned = re.sub(r'\barandanos\b', 'arandano', product_flavour_norm_cleaned, flags=re.IGNORECASE)
                
                # Comparación exacta (con y sin normalización)
                if product_flavour_norm == flavor_norm or product_flavour_normalized == flavor_norm:
                    match_score = 100
                elif product_flavour_norm_cleaned == flavor_norm_cleaned or product_flavour_normalized_cleaned == flavor_norm_cleaned:
                    match_score = 95
                # Contención completa (una contiene a la otra)
                elif product_flavour_norm in flavor_norm or flavor_norm in product_flavour_norm:
                    match_score = 80
                elif product_flavour_norm_cleaned in flavor_norm_cleaned or flavor_norm_cleaned in product_flavour_norm_cleaned:
                    match_score = 75
                # Contención con versión normalizada
                elif product_flavour_normalized in flavor_norm or flavor_norm in product_flavour_normalized:
                    match_score = 70
                # Comparación de palabras clave: si todas las palabras importantes del producto están en el sabor
                else:
                    # Primero intentar con comparación de palabras clave
                    product_words_set = set(product_flavour_norm_cleaned.split())
                    flavor_words_set = set(flavor_norm_cleaned.split())
                    # Si todas las palabras del producto (excepto "y", "&", etc.) están en el sabor
                    product_important_words = {w for w in product_words_set if len(w) > 2 and w not in {'y', 'and', '&', 'de', 'a'}}
                    if product_important_words and product_important_words.issubset(flavor_words_set):
                        match_score = 85
                    # Si al menos 2 palabras importantes coinciden
                    elif len(product_important_words.intersection(flavor_words_set)) >= 2:
                        match_score = 60
                    else:
                        # Intentar con traducciones inversas
                        flavor_norm_translated = flavor_norm_cleaned
                        for en_word, es_word in reverse_translations.items():
                            if en_word in flavor_norm_translated:
                                flavor_norm_translated = flavor_norm_translated.replace(en_word, es_word)
                        
                        if product_flavour_norm_cleaned == flavor_norm_translated or product_flavour_normalized_cleaned == flavor_norm_translated:
                            match_score = 90
                        elif product_flavour_norm_cleaned in flavor_norm_translated or flavor_norm_translated in product_flavour_norm_cleaned:
                            match_score = 75
                        else:
                            # Contar palabras coincidentes (más flexible)
                            flavor_words = [w for w in flavor_norm_cleaned.split() if len(w) > 2]
                            product_words_cleaned = [w for w in product_flavour_norm_cleaned.split() if len(w) > 2]
                            
                            # Buscar palabras clave importantes (chocolate, triple, fudge, etc.)
                            keywords_product = set(product_words_cleaned)
                            keywords_flavor = set(flavor_words)
                            
                            # Si hay palabras clave importantes que coinciden
                            important_keywords = {'chocolate', 'triple', 'fudge', 'cookies', 'cream', 'caramel', 'vanilla', 
                                                'strawberry', 'banana', 'coffee', 'matcha', 'cinnamon', 'sugar', 'azucar', 'azúcar',
                                                'piña', 'pina', 'pineapple', 'coco', 'coconut', 'limon', 'limón', 'lemon', 'lime', 'lima',
                                                'naranja', 'orange', 'mango', 'arandano', 'arándano', 'blueberry', 'caramelo', 
                                                'salado', 'salted', 'canela', 'turron', 'nougat', 'avellana', 'hazelnut',
                                                'mojito', 'rainbow', 'ramune', 'uva', 'grape', 'melocoton', 'melocotón', 'peach',
                                                'grosella', 'blackcurrant', 'saúco', 'elderflower', 'pomelo', 'grapefruit',
                                                'sandia', 'sandía', 'watermelon', 'manzana', 'apple', 'frambuesa', 'raspberry'}
                            
                            matching_important = keywords_product.intersection(keywords_flavor).intersection(important_keywords)
                            if matching_important:
                                match_score = len(matching_important) * 30  # 30 puntos por palabra clave importante
                            
                            # También contar todas las palabras coincidentes
                            matching_words = sum(1 for word in product_words_cleaned if word in flavor_norm_cleaned or any(flw in word for flw in flavor_words))
                            if matching_words > 0:
                                match_score = max(match_score, matching_words * 20)  # 20 puntos por palabra coincidente
                            
                            # También verificar con traducciones
                            flavor_words_translated = [w for w in flavor_norm_translated.split() if len(w) > 2]
                            matching_words_translated = sum(1 for word in product_words_cleaned if word in flavor_norm_translated or any(flw in word for flw in flavor_words_translated))
                            if matching_words_translated > 0:
                                match_score = max(match_score, matching_words_translated * 20)
            
            if match_score > best_match_score:
                best_match_score = match_score
                matched_section = i
        
        # Si encontramos un match, extraer solo esa sección
        # Reducir el umbral mínimo a 15 puntos para ser más flexible
        if matched_section is not None and best_match_score >= 15:
            match = flavor_matches[matched_section]
            start_pos = match.end()
            # Buscar el inicio del siguiente sabor o el final del texto
            if matched_section + 1 < len(flavor_matches):
                end_pos = flavor_matches[matched_section + 1].start()
            else:
                end_pos = len(text_cleaned)
            
            flavor_content = text_cleaned[start_pos:end_pos].strip()
            # Aplicar limpieza final al contenido extraído
            return _final_cleanup_ingredients(flavor_content)
        else:
            # Caso especial: "Turmeric Latte" - buscar por contenido (cúrcuma)
            if 'turmeric' in product_flavour_normalized or 'curcuma' in product_flavour_norm:
                for i, match in enumerate(flavor_matches):
                    start_pos = match.end()
                    if i + 1 < len(flavor_matches):
                        end_pos = flavor_matches[i + 1].start()
                    else:
                        end_pos = len(text_cleaned)
                    flavor_content = text_cleaned[start_pos:end_pos]
                    # Buscar "cúrcuma" o "turmeric" en el contenido
                    if 'cúrcuma' in flavor_content.lower() or 'curcuma' in flavor_content.lower() or 'turmeric' in flavor_content.lower():
                        return _final_cleanup_ingredients(flavor_content)
            
            # Fallback: Si no se encontró match pero hay múltiples sabores, intentar matching más simple
            # basado solo en palabras clave importantes
            if best_match_score < 15 and len(flavor_matches) > 1:
                # Extraer palabras clave del flavour del producto
                product_keywords = set()
                for word in product_flavour_norm.split():
                    if len(word) > 2:
                        product_keywords.add(word.lower())
                for word in product_flavour_normalized.split():
                    if len(word) > 2:
                        product_keywords.add(word.lower())
                
                # Buscar el sabor que tenga más palabras clave en común
                best_keyword_match = None
                best_keyword_score = 0
                for i, match in enumerate(flavor_matches):
                    flavor_name = match.group(1).strip()
                    flavor_norm_simple = _strip_accents_lower(flavor_name)
                    # Limpiar prefijos
                    flavor_norm_simple = re.sub(r'^(sabor|a|de|a dulce de azucar de|a dulce de azúcar de)\s+', '', flavor_norm_simple, flags=re.IGNORECASE).strip()
                    # Normalizar también guiones y otros separadores
                    flavor_norm_simple = re.sub(r'[&y\-_]', ' ', flavor_norm_simple)
                    flavor_norm_simple = re.sub(r'\s+', ' ', flavor_norm_simple).strip()
                    
                    flavor_keywords = set()
                    for word in flavor_norm_simple.split():
                        if len(word) > 2:
                            flavor_keywords.add(word.lower())
                    
                    # Contar palabras clave en común
                    common_keywords = product_keywords.intersection(flavor_keywords)
                    if len(common_keywords) > best_keyword_score:
                        best_keyword_score = len(common_keywords)
                        best_keyword_match = i
                
                # Si encontramos un match por palabras clave, usarlo
                if best_keyword_match is not None and best_keyword_score > 0:
                    match = flavor_matches[best_keyword_match]
                    start_pos = match.end()
                    if best_keyword_match + 1 < len(flavor_matches):
                        end_pos = flavor_matches[best_keyword_match + 1].start()
                    else:
                        end_pos = len(text_cleaned)
                    flavor_content = text_cleaned[start_pos:end_pos].strip()
                    return _final_cleanup_ingredients(flavor_content)
            
            # Si no se encontró match pero hay múltiples sabores, no devolver nada
            # (es mejor devolver vacío que devolver todos los sabores)
            logger.debug(f"No se encontró match para flavour '{product_flavour}' entre {len(flavor_matches)} sabores disponibles")
            return ""
    
    # Si solo hay un sabor, devolver todo el contenido después del primer sabor
    # Si hay múltiples sabores pero no se proporcionó flavour, devolver vacío (no sabemos cuál elegir)
    if len(flavor_matches) == 1:
        # Solo hay un sabor, devolver su contenido
        first_match = flavor_matches[0]
        start_pos = first_match.end()
        result = text_cleaned[start_pos:].strip()
        return _final_cleanup_ingredients(result)
    elif len(flavor_matches) > 1 and not product_flavour:
        # Hay múltiples sabores pero no se proporcionó flavour, no podemos elegir
        logger.debug(f"Múltiples sabores encontrados ({len(flavor_matches)}) pero no se proporcionó flavour")
        return ""
    else:
        # No hay secciones de sabor, devolver texto limpio
        result = text_cleaned.strip()
        return _final_cleanup_ingredients(result)


def extract_ingredients(soup: BeautifulSoup) -> Optional[str]:
    """Extrae ingredientes del panel con id='ingredients' o buscando por texto."""
    try:
        # Método 1: Buscar por id="ingredients"
        panel = soup.find(id="ingredients")
        if panel:
            text = panel.get_text("\n", strip=True)
            if text:
                return text
        
        # Método 2: Buscar por atributo data-testid o similar
        panel = soup.find(attrs={"data-testid": "ingredients"})
        if panel:
            text = panel.get_text("\n", strip=True)
            if text:
                return text
        
        # Método 3: Buscar por texto "Ingredientes" o "Ingredientes" y tomar el siguiente elemento
        ingredients_headers = soup.find_all(string=re.compile(r'Ingredientes?', re.IGNORECASE))
        for header in ingredients_headers:
            # Buscar el elemento padre que contiene el header
            parent = header.find_parent()
            if parent:
                # Buscar el siguiente elemento hermano o el contenido del mismo elemento
                # Intentar encontrar el texto de ingredientes en el mismo contenedor
                text = parent.get_text("\n", strip=True)
                # Filtrar para obtener solo la parte de ingredientes (después del header)
                lines = text.split("\n")
                found_header = False
                ingredients_lines = []
                for line in lines:
                    if re.search(r'Ingredientes?', line, re.IGNORECASE):
                        found_header = True
                        continue
                    if found_header and line.strip():
                        # Detener si encontramos otra sección (Información nutricional, Detalles, etc.)
                        if re.search(r'Información nutricional|Detalles del producto|Información sobre alérgenos', line, re.IGNORECASE):
                            break
                        ingredients_lines.append(line)
                
                if ingredients_lines:
                    return "\n".join(ingredients_lines)
        
        # Método 4: Buscar por clase CSS común
        common_classes = ["ingredients", "product-ingredients", "ingredients-list", "product-details-ingredients"]
        for class_name in common_classes:
            panel = soup.find(class_=re.compile(class_name, re.IGNORECASE))
            if panel:
                text = panel.get_text("\n", strip=True)
                if text and len(text) > 50:  # Asegurar que hay contenido significativo
                    return text
        
        # Método 5: Buscar cualquier elemento que contenga texto largo con palabras clave de ingredientes
        # Palabras clave comunes en listas de ingredientes
        keywords = ["proteína", "edulcorante", "humectante", "emulsionante", "leche", "soja", "cacao"]
        all_text_elements = soup.find_all(string=True)
        for elem in all_text_elements:
            text = str(elem).strip()
            if len(text) > 100 and any(keyword.lower() in text.lower() for keyword in keywords):
                # Verificar que parece una lista de ingredientes (contiene comas, paréntesis, etc.)
                if "," in text or "(" in text:
                    return text
        
        return None
    except Exception as e:
        logger.debug(f"Error extrayendo ingredientes: {e}")
        return None


def scrape_ingredients(url: str, timeout: float = 20.0) -> Optional[str]:
    """Extrae ingredientes de una URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        }
        resp = requests.get(url, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            logger.warning(f"Error HTTP {resp.status_code} para URL: {url}")
            return None
        soup = BeautifulSoup(resp.content, "lxml")
        ingredients = extract_ingredients(soup)
        if not ingredients:
            logger.debug(f"No se encontraron ingredientes en: {url}")
        return ingredients
    except requests.Timeout:
        logger.warning(f"Timeout al acceder a: {url}")
        return None
    except requests.RequestException as e:
        logger.warning(f"Error de red al acceder a {url}: {e}")
        return None
    except Exception as e:
        logger.debug(f"Error inesperado al procesar {url}: {e}")
        return None


def _save_partial_results(tasks: List[Dict], results: Dict[str, Optional[str]], 
                          aditivos_results: Dict[str, Optional[Dict]], 
                          output_path: Path, detect_aditivos: bool):
    """Guarda resultados parciales en el archivo de salida."""
    rows = []
    for task in tasks:
        url = task["url"]
        ingredients = results.get(url)
        aditivos_info = aditivos_results.get(url) if detect_aditivos else None
        
        row = {
            "producto": task.get("product_name", ""),
            "ean": task.get("ean", ""),
            "url": url,
            "flavour": task.get("flavour", ""),
            "ingredients": ingredients,
        }
        
        if aditivos_info:
            row["e_numeros"] = ", ".join(sorted(aditivos_info.get('e_numeros', []))) if aditivos_info.get('e_numeros') else ""
            row["aditivos count"] = aditivos_info.get('total_aditivos', 0)
            row["aditivos peligrosos"] = aditivos_info.get('aditivos_peligrosos', 0)
            row["aditivos no peligrosos"] = aditivos_info.get('aditivos_no_nocivos', 0)
            row["aditivos sospechosos"] = aditivos_info.get('aditivos_sospechosos', 0)
        else:
            if detect_aditivos:
                row["e_numeros"] = ""
                row["aditivos count"] = 0
                row["aditivos peligrosos"] = 0
                row["aditivos no peligrosos"] = 0
                row["aditivos sospechosos"] = 0
        
        rows.append(row)
    
    df_partial = pd.DataFrame(rows)
    
    # Combinar con existente si existe
    if output_path.exists():
        try:
            existing = pd.read_excel(output_path, engine="openpyxl")
            # Actualizar filas existentes y agregar nuevas
            combined = pd.concat([existing, df_partial], ignore_index=True)
            combined = combined.drop_duplicates(subset=["url"], keep="last")  # Mantener la versión más reciente
            df_final = combined
        except Exception:
            df_final = df_partial
    else:
        df_final = df_partial
    
    # Reordenar columnas
    column_order = ["producto", "ean", "url", "flavour"]
    if detect_aditivos:
        column_order.extend(["aditivos count", "aditivos peligrosos", "aditivos no peligrosos", "aditivos sospechosos", "e_numeros", "ingredients"])
    else:
        column_order.append("ingredients")
    
    existing_columns = [col for col in column_order if col in df_final.columns]
    other_columns = [col for col in df_final.columns if col not in column_order]
    df_final = df_final[existing_columns + other_columns]
    
    df_final.to_excel(output_path, index=False, engine="openpyxl")


def detectar_aditivos_en_texto(texto: str, detector: Optional[Any], 
                                llm_analyzer: Optional[Any] = None,
                                aditivos_database: Optional[List[Dict]] = None) -> Dict[str, Any]:
    """
    Detecta aditivos en un texto de ingredientes usando SOLO Claude LLM.
    NO usa embeddings/sentence-transformers.
    
    Args:
        texto: Texto de ingredientes a analizar
        detector: Instancia de AditivosDetector (solo para obtener base de datos, no se usa para detección)
        llm_analyzer: Analizador LLM (Claude) - REQUERIDO
        aditivos_database: Base de datos de aditivos para usar con LLM
        
    Returns:
        Diccionario con información de aditivos detectados
    """
    if not texto or not texto.strip():
        return {
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_no_nocivos': 0,
            'aditivos_sospechosos': 0
        }
    
    # SOLO usar Claude LLM, sin fallback a embeddings
    if not llm_analyzer or not aditivos_database:
        logger.warning("LLM o base de datos no disponible. No se detectarán aditivos.")
        return {
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_no_nocivos': 0,
            'aditivos_sospechosos': 0,
            'error': 'LLM no disponible'
        }
    
    try:
        # Usar SOLO Claude para detección
        logger.debug(f"Llamando a detect_additives_in_text con texto de {len(texto)} caracteres")
        aditivos_finales = llm_analyzer.detect_additives_in_text(texto, aditivos_database)
        logger.info(f"Claude detectó {len(aditivos_finales)} aditivos en el texto")
        
        if not aditivos_finales:
            return {
                'aditivos_detectados': [],
                'e_numeros': [],
                'total_aditivos': 0,
                'aditivos_peligrosos': 0,
                'aditivos_no_nocivos': 0,
                'aditivos_sospechosos': 0
            }
        
        # El formato puede variar, normalizar
        # Usar diccionario para eliminar duplicados de E-números
        aditivos_unicos = {}
        e_numeros_set = set()
        
        for a in aditivos_finales:
            # Obtener e_numero (puede estar en diferentes lugares según el formato)
            e_num = a.get('e_numero') or (a.get('aditivo', {}).get('e_numero') if isinstance(a.get('aditivo'), dict) else None)
            if e_num and e_num not in e_numeros_set:
                e_numeros_set.add(e_num)
                aditivos_unicos[e_num] = a
        
        # Convertir a lista sin duplicados
        aditivos_sin_duplicados = list(aditivos_unicos.values())
        e_numeros = list(e_numeros_set)
        
        # Contar por tipo correctamente
        peligrosos = 0
        no_nocivos = 0
        sospechosos = 0
        
        for a in aditivos_sin_duplicados:
            # Obtener tipo (puede estar en diferentes lugares)
            tipo = a.get('tipo') or (a.get('aditivo', {}).get('tipo') if isinstance(a.get('aditivo'), dict) else None) or ''
            tipo_str = str(tipo)
            
            if 'Peligroso' in tipo_str:
                peligrosos += 1
            elif 'No nocivo' in tipo_str:
                no_nocivos += 1
            elif 'Sospechoso' in tipo_str:
                sospechosos += 1
            else:
                # Si no tiene tipo claro, contar como sospechoso por seguridad
                sospechosos += 1
        
        return {
            'aditivos_detectados': aditivos_sin_duplicados,
            'e_numeros': e_numeros,
            'total_aditivos': len(aditivos_sin_duplicados),
            'aditivos_peligrosos': peligrosos,
            'aditivos_no_nocivos': no_nocivos,
            'aditivos_sospechosos': sospechosos
        }
    except Exception as e:
        logger.error(f"Error detectando aditivos con Claude: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        return {
            'aditivos_detectados': [],
            'e_numeros': [],
            'total_aditivos': 0,
            'aditivos_peligrosos': 0,
            'aditivos_no_nocivos': 0,
            'aditivos_sospechosos': 0,
            'error': str(e)
        }


def process_excel(input_path: Path, output_path: Path, concurrency: int = 8, resume: bool = True,
                  detect_aditivos: bool = True, use_llm: bool = False, use_column: bool = False):
    """
    Procesa Excel y extrae ingredientes, opcionalmente detectando aditivos.
    
    Args:
        input_path: Ruta al Excel de entrada
        output_path: Ruta al Excel de salida
        concurrency: Número de hilos concurrentes
        resume: Si True, reanuda desde donde se quedó
        detect_aditivos: Si True, detecta aditivos en los ingredientes
        use_llm: Si True, usa LLM para análisis adicional (requiere configuración)
        use_column: Si True, usa la columna 'ingredients' del Excel directamente sin scraping
    """
    if not input_path.exists():
        raise FileNotFoundError(f"No existe el fichero: {input_path}")
    
    # Inicializar detector de aditivos si está disponible
    detector = None
    llm_analyzer = None
    aditivos_database = None  # Base de datos para usar con LLM
    
    if detect_aditivos and ADITIVOS_AVAILABLE:
        try:
            logger.info("Inicializando detector de aditivos...")
            detector = AditivosDetector()
            detector.inicializar_aditivos(usar_web=False, archivo="aditivos.json")
            # Guardar base de datos para usar con LLM
            aditivos_database = detector.aditivos_data
            logger.info("Detector de aditivos inicializado correctamente")
            
            # Inicializar LLM (SOLO Claude) - REQUERIDO para detección de aditivos
            # Si detect_aditivos=True, siempre intentar inicializar LLM (no requiere --use-llm)
            if detect_aditivos:
                try:
                    if create_llm_config_from_env is None:
                        logger.error("LLM solicitado pero módulo no disponible. Se requiere Claude para detección de aditivos.")
                        raise ValueError("LLM module not available")
                    else:
                        import os
                        from llm_analyzer import LLMConfig
                        
                        # SOLO usar Anthropic (Claude) para detección de aditivos
                        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
                        if not anthropic_key:
                            logger.error("ANTHROPIC_API_KEY no encontrada. Se requiere Claude para detección de aditivos.")
                            raise ValueError("ANTHROPIC_API_KEY not found")
                        
                        # FORZAR modelo haiku - es el más disponible y funciona correctamente
                        # Ignorar variable de entorno si está configurada con un modelo no disponible
                        env_model = os.getenv('ANTHROPIC_MODEL', '')
                        if env_model in ['claude-3-haiku-20240307', 'claude-3-5-haiku-20241022']:
                            model_name = env_model
                        else:
                            # Forzar haiku si el modelo de env no es válido o no está configurado
                            if env_model:
                                logger.warning(f"Modelo de entorno '{env_model}' puede no estar disponible. Usando claude-3-haiku-20240307")
                            model_name = 'claude-3-haiku-20240307'
                        
                        logger.info(f"Usando modelo: {model_name}")
                        
                        llm_config = LLMConfig(
                            provider='anthropic',
                            api_key=anthropic_key,
                            model=model_name,
                            max_tokens=int(os.getenv('ANTHROPIC_MAX_TOKENS', '2000')),  # Aumentado para respuestas más largas
                            temperature=float(os.getenv('ANTHROPIC_TEMPERATURE', '0.3'))
                        )
                        try:
                            llm_analyzer = LLMAnalyzer(llm_config)
                            logger.info(f"Claude LLM inicializado: {llm_config.model} (solo se usará Claude, sin embeddings)")
                        except Exception as e:
                            logger.error(f"Error inicializando Claude: {e}. No se pueden detectar aditivos sin Claude.")
                            raise
                except Exception as e:
                    logger.error(f"No se pudo inicializar Claude LLM: {e}. La detección de aditivos requiere Claude.")
                    raise
        except Exception as e:
            logger.error(f"Error inicializando detector de aditivos: {e}")
            logger.warning("Continuando sin detección de aditivos")
            detector = None
    
    logger.info("Cargando Excel: %s", input_path)
    sheets = pd.read_excel(input_path, sheet_name=None, engine="openpyxl")
    
    # Combinar todas las hojas y crear diccionario con metadata
    all_rows = []
    for sheet_name, df in sheets.items():
        if "url" not in df.columns:
            continue
        
        for _, row in df.iterrows():
            url = row.get("url")
            if pd.isna(url) or not url:
                continue
            
            url_str = str(url).strip()
            if url_str:
                all_rows.append({
                    "url": url_str,
                    "product_name": row.get("product_name", ""),
                    "flavour": row.get("flavour"),
                    "sku": row.get("sku", ""),
                    "ean": row.get("ean", ""),
                    "ingredients": row.get("ingredients") if "ingredients" in df.columns else None,
                })
    
    # Filtrar filas ya procesadas si resume está activo
    processed_urls = set()
    if resume and output_path.exists():
        try:
            existing = pd.read_excel(output_path, engine="openpyxl")
            if "url" in existing.columns:
                processed_urls = set(existing["url"].dropna().astype(str))
            logger.info("Reanudación: se omitirán %d URLs ya procesadas.", len(processed_urls))
        except Exception:
            pass
    
    # Filtrar filas a procesar
    tasks = [row for row in all_rows if row["url"] not in processed_urls]
    
    logger.info("Total filas a procesar: %d", len(tasks))
    
    # Procesar ingredientes
    results = {}
    aditivos_results = {}
    
    if use_column:
        # Usar columna ingredients directamente sin scraping
        logger.info("Usando columna 'ingredients' del Excel directamente (sin scraping)")
        
        # Pre-procesar: limpiar ingredientes primero (rápido, no necesita concurrencia)
        cleaned_ingredients = {}
        for task in tasks:
            url = task["url"]
            raw_ingredients = task.get("ingredients")
            
            if pd.isna(raw_ingredients) or not raw_ingredients:
                cleaned_ingredients[url] = None
                continue
            
            # Limpiar ingredientes usando el sabor del producto
            flavour = task.get("flavour")
            cleaned = _clean_ingredients_text(str(raw_ingredients), flavour)
            cleaned_ingredients[url] = cleaned if cleaned else None
            results[url] = cleaned
        
        # Detectar aditivos con concurrencia si está habilitado (llamadas a API)
        if detect_aditivos and detector and llm_analyzer:
            logger.info("Detectando aditivos con concurrencia...")
            tasks_with_ingredients = [(url, cleaned_ingredients[url]) for url in cleaned_ingredients.keys() 
                                     if cleaned_ingredients[url] is not None]
            
            def process_aditivos(url_ingredients):
                url, cleaned = url_ingredients
                try:
                    aditivos_info = detectar_aditivos_en_texto(cleaned, detector, llm_analyzer, aditivos_database)
                    return url, aditivos_info
                except Exception as e:
                    logger.error(f"Error detectando aditivos para {url}: {e}")
                    return url, None
            
            with ThreadPoolExecutor(max_workers=min(concurrency, 10)) as executor:  # Limitar a 10 para evitar rate limits
                futures = {executor.submit(process_aditivos, task): task[0] for task in tasks_with_ingredients}
                
                processed_count = 0
                save_interval = 50  # Guardar cada 50 productos procesados
                
                with tqdm(total=len(tasks_with_ingredients), desc="Detectando aditivos", unit="producto") as pbar:
                    for fut in as_completed(futures):
                        url, aditivos_info = fut.result()
                        aditivos_results[url] = aditivos_info
                        processed_count += 1
                        pbar.update(1)
                        
                        # Guardar resultados parciales cada cierto intervalo
                        if processed_count % save_interval == 0:
                            try:
                                _save_partial_results(tasks, results, aditivos_results, output_path, detect_aditivos)
                                logger.info(f"Guardado parcial: {processed_count}/{len(tasks_with_ingredients)} productos procesados")
                            except Exception as e:
                                logger.warning(f"Error guardando resultados parciales: {e}")
        else:
            # Si no hay detección de aditivos, solo marcar como None
            for url in cleaned_ingredients.keys():
                aditivos_results[url] = None
    else:
        # Hacer scraping de URLs
        logger.info("Haciendo scraping de URLs para extraer ingredientes")
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = {executor.submit(scrape_ingredients, task["url"]): task for task in tasks}
            
            desc_text = "Extrayendo ingredientes" + (" y detectando aditivos" if detect_aditivos else "")
            with tqdm(total=len(tasks), desc=desc_text, unit="url") as pbar:
                for fut in as_completed(futures):
                    task = futures[fut]
                    url = task["url"]
                    try:
                        raw_ingredients = fut.result()
                        if raw_ingredients:
                            # Limpiar ingredientes usando el sabor del producto
                            flavour = task.get("flavour")
                            cleaned = _clean_ingredients_text(raw_ingredients, flavour)
                            results[url] = cleaned if cleaned else None
                            
                            # Detectar aditivos si está habilitado
                            if detect_aditivos and cleaned and detector:
                                aditivos_info = detectar_aditivos_en_texto(cleaned, detector, llm_analyzer, aditivos_database)
                                aditivos_results[url] = aditivos_info
                            else:
                                aditivos_results[url] = None
                        else:
                            results[url] = None
                            aditivos_results[url] = None
                    except Exception as e:
                        logger.error(f"Error procesando {url}: {e}")
                        results[url] = None
                        aditivos_results[url] = None
                    pbar.update(1)
    
    # Crear DataFrame de salida
    rows = []
    for task in tasks:
        url = task["url"]
        ingredients = results.get(url)
        aditivos_info = aditivos_results.get(url) if detect_aditivos else None
        
        row = {
            "producto": task.get("product_name", ""),
            "ean": task.get("ean", ""),
            "url": url,
            "flavour": task.get("flavour", ""),
            "ingredients": ingredients,
        }
        
        # Agregar información de aditivos si está disponible (solo columnas solicitadas)
        if aditivos_info:
            row["e_numeros"] = ", ".join(sorted(aditivos_info.get('e_numeros', []))) if aditivos_info.get('e_numeros') else ""
            row["aditivos count"] = aditivos_info.get('total_aditivos', 0)
            row["aditivos peligrosos"] = aditivos_info.get('aditivos_peligrosos', 0)
            row["aditivos no peligrosos"] = aditivos_info.get('aditivos_no_nocivos', 0)
            row["aditivos sospechosos"] = aditivos_info.get('aditivos_sospechosos', 0)
        else:
            # Columnas vacías si no hay detección de aditivos
            if detect_aditivos:
                row["e_numeros"] = ""
                row["aditivos count"] = 0
                row["aditivos peligrosos"] = 0
                row["aditivos no peligrosos"] = 0
                row["aditivos sospechosos"] = 0
        
        rows.append(row)
    
    df_new = pd.DataFrame(rows)
    
    # Combinar con existente
    if resume and output_path.exists():
        try:
            existing = pd.read_excel(output_path, engine="openpyxl")
            combined = pd.concat([existing, df_new], ignore_index=True)
            combined = combined.drop_duplicates(subset=["url"], keep="first")
            df_final = combined
        except Exception:
            df_final = df_new
    else:
        df_final = df_new
    
    # Reordenar columnas según lo solicitado: producto, ean, url, flavour, aditivos count, aditivos peligrosos, aditivos no peligrosos, aditivos sospechosos
    column_order = ["producto", "ean", "url", "flavour"]
    if detect_aditivos:
        column_order.extend(["aditivos count", "aditivos peligrosos", "aditivos no peligrosos", "aditivos sospechosos", "e_numeros", "ingredients"])
    else:
        column_order.append("ingredients")
    
    # Reordenar solo las columnas que existen
    existing_columns = [col for col in column_order if col in df_final.columns]
    other_columns = [col for col in df_final.columns if col not in column_order]
    df_final = df_final[existing_columns + other_columns]
    
    logger.info("Guardando resultados en: %s (%d filas)", output_path, len(df_final))
    df_final.to_excel(output_path, index=False, engine="openpyxl")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Extrae ingredientes de productos MyProtein y detecta aditivos.")
    parser.add_argument("--input", "-i", default=INPUT_DEFAULT, help="Excel de entrada")
    parser.add_argument("--output", "-o", default=OUTPUT_DEFAULT, help="Excel de salida")
    parser.add_argument("--concurrency", type=int, default=8, help="Concurrencia (default: 8)")
    parser.add_argument("--no-resume", action="store_true", help="No reanudar (empezar desde cero)")
    parser.add_argument("--no-aditivos", action="store_true", help="No detectar aditivos (solo extraer ingredientes)")
    parser.add_argument("--use-llm", action="store_true", help="Usar LLM para análisis adicional (requiere API key configurada)")
    parser.add_argument("--use-column", action="store_true", help="Usar columna 'ingredients' del Excel directamente sin scraping")
    
    args = parser.parse_args()
    
    try:
        process_excel(
            Path(args.input),
            Path(args.output),
            concurrency=args.concurrency,
            resume=not args.no_resume,
            detect_aditivos=not args.no_aditivos,
            use_llm=args.use_llm,
            use_column=args.use_column,
        )
        logger.info("Finalizado con éxito.")
    except Exception:
        logger.exception("Error en la ejecución.")
        exit(1)


if __name__ == "__main__":
    main()
