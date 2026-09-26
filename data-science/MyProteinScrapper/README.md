# MyProtein Ingredients Scraper

## 📋 Descripción del Proyecto

Este proyecto es un **scraper especializado** diseñado para extraer y limpiar listas de ingredientes de productos de MyProtein desde sus páginas web. El objetivo principal es obtener información precisa y filtrada de ingredientes para cada variante de producto (sabor específico), eliminando información redundante o incorrecta que aparece en las páginas web.

## 🎯 Problema que Resolvemos

### El Problema Principal

Las páginas de productos de MyProtein a menudo muestran **ingredientes para múltiples sabores en una sola página**. Esto ocurre porque varios sabores del mismo producto comparten la misma URL base, y la página muestra todos los ingredientes juntos.

**Ejemplo del problema:**

Imagina que estás viendo el producto "Clear Whey Isolate - Naranja y Mango". En la página web, los ingredientes se muestran así:

```
Lima-Limón: Hidrolizado de Proteína de Suero (Leche) (93%), Ácido (Ácido Cítrico, Ácido Fosfórico), Aroma Natural, Emulsionante (Fosfato Monosódico), Edulcorante (Sucralosa).

Té de Melocotón: Hidrolizado de Proteína de Suero (Leche) (97%), Aroma Natural, Ácido (Ácido Cítrico, Ácido Fosfórico), Emulsionante (Fosfato Monosódico), Edulcorante (Sucralosa).

Mojito: Hidrolizado de Proteína de Suero (Leche) (94%), Aroma, Ácido (Ácido Cítrico, Ácido Fosfórico), Edulcorante (Sucralosa).

Naranja-Mango: Hidrolizado de Proteína de Suero (Leche) (90%), Aroma, Ácido (Ácido Cítrico, Ácido Málico), Edulcorante (Sucralosa, Acesulfamo K), Sustancias Aromatizantes (Natural, Artificial), Colorante (Amarillo Anaranjado)), Ácido (Ácido Fosfórico), Emulsionante (Fosfato Monosódico).

Rainbow: Hidrolizado de Proteína de Suero (Leche) (93%), Aroma, Ácido (Ácido Cítrico, Ácido Málico), Edulcorante (Sucralosa, Acesulfamo K), Sustancias Aromatizantes (Natural, Artificial), Colorante (Rojo Allura, Azul Brillante)), Ácido (Ácido Fosfórico), Emulsionante (Fosfato Monosódico).

Uva: Hidrolizado de Proteína de Suero (Leche) (86%), Aroma, Colorante (Rojo Remolacha), Extracto de Espirulina, Trehalosa, Edulcorante (Sucralosa).

Ramune: Hidrolizado de Proteína de Suero (Leche) (90%), Aroma, Ácido (Ácido Cítrico), Edulcorante (Sucralosa).
```

**¿Cuál es el problema?** Si el producto que estás buscando es "Naranja y Mango", solo necesitas los ingredientes de esa sección, pero la página muestra **7 sabores diferentes**. 

### Problemas Específicos que Resolvemos

1. **Múltiples sabores en una sola página**: La página muestra ingredientes para todos los sabores disponibles, no solo el del producto específico.

2. **Formato inconsistente**: Los sabores pueden aparecer como:
   - `Sabor Naranja y Mango:`
   - `Naranja-Mango:`
   - `Naranja y Mango:`
   - `Naranja & Mango:`

3. **Información adicional no relevante**: 
   - Advertencias de alérgenos repetidas
   - Texto genérico como "Para los alérgenos, ver ingredientes en negrita"
   - Información de múltiples variantes mezclada

4. **Texto mal formateado**: 
   - Saltos de línea innecesarios
   - Espacios extra
   - Prefijos como ":" o "INGREDIENTES:" al inicio

## 🔧 Solución Implementada

### Funcionalidades Principales

1. **Extracción Inteligente de Ingredientes**
   - Busca ingredientes usando múltiples métodos (por ID, data-testid, texto "Ingredientes", clases CSS)
   - Maneja diferentes estructuras HTML de las páginas

2. **Filtrado por Sabor del Producto**
   - Identifica automáticamente las secciones de diferentes sabores
   - Filtra y extrae solo los ingredientes correspondientes al sabor específico del producto
   - Maneja traducciones español-inglés (ej: "Canela y Azúcar" ↔ "Cinnamon & Sugar")

3. **Limpieza de Texto**
   - Elimina advertencias de alérgenos genéricas
   - Remueve prefijos innecesarios (":", "INGREDIENTES:", etc.)
   - Normaliza espacios y saltos de línea
   - Une líneas fragmentadas de ingredientes

4. **Procesamiento en Lote**
   - Lee productos desde un archivo Excel
   - Procesa múltiples URLs en paralelo (configurable)
   - Guarda resultados progresivamente
   - Permite reanudar el proceso si se interrumpe

## 📊 Ejemplos de Mejoras

### Ejemplo 1: Clear Whey Isolate - Naranja y Mango

**❌ ANTES (Texto Original):**
```
Lima-Limón: Hidrolizado de Proteína de Suero (Leche) (93%), Ácido (Ácido Cítrico, Ácido Fosfórico), Aroma Natural, Emulsionante (Fosfato Monosódico), Edulcorante (Sucralosa). Té de Melocotón: Hidrolizado de Proteína de Suero (Leche) (97%), Aroma Natural, Ácido (Ácido Cítrico, Ácido Fosfórico), Emulsionante (Fosfato Monosódico), Edulcorante (Sucralosa). Mojito: Hidrolizado de Proteína de Suero (Leche) (94%), Aroma, Ácido (Ácido Cítrico, Ácido Fosfórico), Edulcorante (Sucralosa). Naranja-Mango: Hidrolizado de Proteína de Suero (Leche) (90%), Aroma, Ácido (Ácido Cítrico, Ácido Málico), Edulcorante (Sucralosa, Acesulfamo K), Sustancias Aromatizantes (Natural, Artificial), Colorante (Amarillo Anaranjado)), Ácido (Ácido Fosfórico), Emulsionante (Fosfato Monosódico). Rainbow: Hidrolizado de Proteína de Suero (Leche) (93%), Aroma, Ácido (Ácido Cítrico, Ácido Málico), Edulcorante (Sucralosa, Acesulfamo K), Sustancias Aromatizantes (Natural, Artificial), Colorante (Rojo Allura, Azul Brillante)), Ácido (Ácido Fosfórico), Emulsionante (Fosfato Monosódico). Uva: Hidrolizado de Proteína de Suero (Leche) (86%), Aroma, Colorante (Rojo Remolacha), Extracto de Espirulina, Trehalosa, Edulcorante (Sucralosa). Ramune: Hidrolizado de Proteína de Suero (Leche) (90%), Aroma, Ácido (Ácido Cítrico), Edulcorante (Sucralosa).
```
**Problema:** Contiene 7 sabores diferentes (Lima-Limón, Té de Melocotón, Mojito, Naranja-Mango, Rainbow, Uva, Ramune)

**✅ DESPUÉS (Texto Corregido):**
```
Hidrolizado de Proteína de Suero (Leche) (90%), Aroma, Ácido (Ácido Cítrico, Ácido Málico), Edulcorante (Sucralosa, Acesulfamo K), Sustancias Aromatizantes (Natural, Artificial), Colorante (Amarillo Anaranjado)), Ácido (Ácido Fosfórico), Emulsionante (Fosfato Monosódico).
```
**Solución:** Solo contiene los ingredientes del sabor "Naranja y Mango"

---

### Ejemplo 2: Mezcla de Proteína Vegana - Turmeric Latte V3

**❌ ANTES (Texto Original):**
```
Plátano: Mezcla de Proteína (93%) (Aislado de Proteína de Guisante, Aislado de Proteína de Haba), Saborizantes Naturales, Sustitutivo de Crema Vegetal (Aceite de Girasol de Alto Oleico, Saborizante Natural, Antioxidante (D-Alfa Tocoferol)), Extracto de Aceite de Cúrcuma, Espesante (Goma de Xantana) Edulcorante (Sucralosa) Chocolate: Mezcla de proteínas (87%) (Aislado de Proteína de Guisante, Aislado de Proteína de Haba), Cacao en Polvo Reducido en Grasa, Saborizantes Naturales, Sustitutivo de Crema Vegetal (Aceite de Girasol de Alto Oleico, Saborizante Natural, Antioxidante (D-Alfa Tocoferol)), Espesante (Goma de Xantana) Edulcorante (Sucralosa) Fresa: Mezcla de proteínas (87%) (Aislado de Proteína de Guisante, Aislado de Proteína de Haba), Saborizantes Naturales, Sustitutivo de Crema Vegetal (Aceite de Girasol de Alto Oleico, Saborizante Natural, Antioxidante (D-Alfa Tocoferol)), Espesante (Goma de Xantana) Edulcorante (Sucralosa)
```
**Problema:** Contiene 3 sabores diferentes (Plátano, Chocolate, Fresa) cuando el producto es "Turmeric Latte V3"

**✅ DESPUÉS (Texto Corregido):**
```
Mezcla de Proteína (93%) (Aislado de Proteína de Guisante, Aislado de Proteína de Haba), Saborizantes Naturales, Sustitutivo de Crema Vegetal (Aceite de Girasol de Alto Oleico, Saborizante Natural, Antioxidante (D-Alfa Tocoferol)), Extracto de Aceite de Cúrcuma, Espesante (Goma de Xantana) Edulcorante (Sucralosa)
```
**Solución:** Identifica correctamente que "Turmeric Latte" corresponde a la sección "Plátano" (porque contiene cúrcuma) y extrae solo esos ingredientes

---

### Ejemplo 3: Mezcla de Tortitas Proteicas - Canela y Azúcar

**❌ ANTES (Texto Original):**
```
Alérgenos: Para los alérgenos, incluidos los cereales que contienen gluten, ver los ingredientes en negrita.

Sabor Cookies & Cream: Mezcla de Proteínas (Concentrado de Proteína de Suero (Leche) [Contiene Emulsionante; Lecitina de Soja, Lecitina de Girasol], Concentrado de Proteína de Leche, Clara de Huevo en Polvo) (75%), Harina de Avena, Trocitos de Galleta de Chocolate Negro (Harina de Trigo Fortificada, Aceite Vegetal (Palma, Colza), Azúcar, Cacao en Polvo, Jarabe de Azúcar Invertido, Agente Impulsor (Bicarbonato de Sodio), Sal) (6%), TCM en Polvo (Triglicéridos de Cadena Media(de Aceite de Palmiste), Jarabe de Glucosa, Proteína de Leche, Estabilizante (Fosfato Dipotásico), Antiaglomerante (Fosfato Tricálcico)), Aroma, Agente Impulsor (Bicarbonato de Sodio), Edulcorante (Sucralosa).

Sabor Chocolate: Mezcla de Proteínas (31%) (Concentrado de Proteína de Suero (Leche), Concentrado de proteína de Leche, Clara de Huevo en Polvo), Harina de Avena (13%), Cacao en Polvo, Triglicéridos de Cadena Media (TCM) (68-75%), Caseinato de Sodio (Leche), Sólidos de Jarabe de Glucosa, Emulsionante (E472c), Gasificante (Bicarbonato de Sodio), Edulcorante (Sucralosa), Emulsionante (Lecitina de Soja).

Sabor Golden Syrup: Mezcla de Proteínas (31%) (Concentrado de Proteína de Suero (Leche), Concentrado de proteína de Leche, Clara de Huevo en Polvo), Harina de Avena (13%), Aroma, Triglicéridos de Cadena Media (TCM) (68-75%), Caseinato de Sodio (Leche), Sólidos de Jarabe de Glucosa, Emulsionante (E472c), Gasificante (Bicarbonato de Sodio), Edulcorante (Sucralosa), Emulsionante (Lecitina de Soja).

Sabor Maple Syrup: Mezcla de Proteínas (31%) (Concentrado de Proteína de Suero (Leche), Concentrado de proteína de Leche, Clara de Huevo en Polvo), Harina de Avena (13%), Aroma, Triglicéridos de Cadena Media (TCM) (68-75%), Caseinato de Sodio (Leche), Sólidos de Jarabe de Glucosa, Emulsionante (E472c), Gasificante (Bicarbonato de Sodio), Edulcorante (Sucralosa), Emulsionante (Lecitina de Soja).

Sin Sabor: Mezcla de Proteínas (35%) ((Concentrado de Proteína de Suero (Leche), Concentrado de proteína de Leche, Clara de Huevo en Polvo), Harina de Avena (12%), Triglicéridos de Cadena Media (TCM) (68-75%), Caseinato de Sodio (Leche), Sólidos de Jarabe de Glucosa, Emulsionante (E472c), Gasificante (Bicarbonato de Sodio), Edulcorante (Sucralosa), Emulsionante (Lecitina de Soja).

Sabor Matcha: Mezcla de Proteínas (75%) (Concentrado de Proteína de Suero (Leche) [Contiene Emulsionantes: Lecitina de Soja, Lecitina de Girasol], Concentrado de proteína de Leche, Clara de Huevo en Polvo, Leche Desnatada en Polvo), Harina de Avena (11%), Té Verde en Polvo (Camellia sinensis L.) (9%), TCM en Polvo (Triglicéridos de Cadena Media (de Aceite de Coco), Goma de Acacia), Gasificante (Bicarbonato de Sodio), Edulcorante (Sucralosa).

Sabor Arándano: Mezcla de Proteínas (66%) (Leche), Emulsionante (Lecitina de Soja)), Huevos Camperos, Harina de Avena, Aroma Natural (Colorantes (Rojo Remolacha, Antocianina), Ácido Cítrico), Edulcorante (Sucralosa), Triglicéridos de Cadena media en Polvo (Leche), Gasificante (Bicarbonato de Sodio).

Sabor Cinnamon & Sugar: Mezcla de Proteínas (66%) (Leche), Emulsionante (Lecitina de Soja)), Huevos Camperos, Harina de Avena, Aroma, Extracto de Malta (Cebada), Edulcorante (Sucralosa), Canela Molida, Triglicéridos de Cadena media en Polvo (Leche), Gasificante (Bicarbonato de Sodio).
```
**Problema:** Contiene 8 sabores diferentes + advertencias de alérgenos cuando el producto es "Canela y Azúcar"

**✅ DESPUÉS (Texto Corregido):**
```
Mezcla de Proteínas (66%) (Leche), Emulsionante (Lecitina de Soja)), Huevos Camperos, Harina de Avena, Aroma, Extracto de Malta (Cebada), Edulcorante (Sucralosa), Canela Molida, Triglicéridos de Cadena media en Polvo (Leche), Gasificante (Bicarbonato de Sodio).
```
**Solución:** 
- Elimina las advertencias de alérgenos genéricas
- Identifica que "Canela y Azúcar" corresponde a "Sabor Cinnamon & Sugar" (maneja traducciones)
- Extrae solo los ingredientes de ese sabor específico

---

### Ejemplo 4: Barrita Proteica Layered - Chocolate Peanut Pretzel

**❌ ANTES (Texto Original):**
```
: Mezcla de proteína (23%) (proteína de lactosuero hidrolizada (
leche
), concentrado de proteína de
leche
, concentrado de proteína de lactosuero (
leche
), aislado de proteína de
soja
), edulcorante (maltitol), humectante (glicerol), fibra de raíz de achicoria, recubrimiento con
```
**Problemas:**
- Tiene un ":" al inicio innecesario
- Tiene saltos de línea innecesarios dentro de los ingredientes
- El texto está cortado (falta información)

**✅ DESPUÉS (Texto Corregido):**
```
Mezcla de proteína (23%) (proteína de lactosuero hidrolizada (leche), concentrado de proteína de leche, concentrado de proteína de lactosuero (leche), aislado de proteína de soja), edulcorante (maltitol), humectante (glicerol), fibra de raíz de achicoria, recubrimiento con sabor a chocolate con leche (10%) (edulcorante (maltitol), grasa de palma, cacao en polvo bajo en grasa, leche desnatada en polvo, lactosuero en polvo, emulsionantes (lecitina de soja, lecitina de girasol), aroma), trocitos de pretzel (5%) (harina de trigo, sal, aceite de girasol, gasificante (bicarbonato de sodio), levadura), mantequilla de cacahuete (4%) (cacahuetes, sal), trocitos de chocolate negro (3%) (masa de cacao, edulcorante (maltitol), cacao en polvo, emulsionante (lecitina de soja), aroma), sal, edulcorante (sucralosa).
```
**Solución:**
- Elimina el ":" inicial
- Une las líneas fragmentadas
- Obtiene el texto completo de los ingredientes

---

## 📈 Resultados del Proyecto

### Estadísticas de Mejoras

- **1032 productos** procesados en total
- **122 productos corregidos** con mejoras significativas:
  - **16 productos** con múltiples sabores eliminados correctamente
  - **36 productos** con texto significativamente más completo (+30% o más caracteres)
  - **70 productos** con mejoras menores de formato y limpieza

### Distribución de Mejoras por Categoría

- **Barritas**: 19 productos mejorados
- **Proteinas**: 32 productos mejorados  
- **Suplementos**: 9 productos mejorados
- **Vitaminas**: 4 productos mejorados

## 🛠️ Uso del Programa

### Requisitos

```bash
pip install pandas openpyxl requests beautifulsoup4 lxml
```

### Uso Básico

```bash
python myprotein_ingredients_scraper.py \
    --input "MyProtein_Data_All_Products_Final.xlsx" \
    --output "MyProtein_Ingredients_Final.xlsx" \
    --concurrency 4 \
    --no-aditivos
```

### Parámetros Principales

- `--input`: Archivo Excel de entrada con productos (debe tener columnas: `url`, `flavour`, `product_name`)
- `--output`: Archivo Excel de salida con ingredientes extraídos
- `--concurrency`: Número de hilos paralelos (recomendado: 4-8)
- `--no-aditivos`: Desactiva la detección de aditivos (más rápido)
- `--no-resume`: No reanuda desde donde se quedó (recomienza desde cero)

### Corrección de Base de Datos Original

Después de extraer los ingredientes, puedes aplicar las correcciones directamente a la base de datos original:

```bash
python corregir_ingredientes_bd.py
```

Este script:
- Compara la BD original con la BD de ingredientes corregidos
- Identifica productos con múltiples sabores o texto incompleto
- Aplica las correcciones manteniendo la estructura original de hojas Excel

## 🔍 Detalles Técnicos

### Algoritmo de Filtrado por Sabor

El programa utiliza un sistema de **matching inteligente** que:

1. **Detecta secciones de sabor** usando patrones regex:
   - `Sabor X:` (formato estándar)
   - `X:` (formato directo, ej: "Naranja-Mango:")
   - `Sin Sabor:` (caso especial)

2. **Normaliza nombres de sabores**:
   - Elimina prefijos ("Sabor", "a", "de", etc.)
   - Normaliza separadores ("&", "y", "-" → espacios)
   - Maneja traducciones español-inglés
   - Ignora plurales/singulares

3. **Calcula un score de coincidencia**:
   - 100 puntos: Coincidencia exacta
   - 95 puntos: Coincidencia después de normalización
   - 85 puntos: Todas las palabras importantes coinciden
   - 60-80 puntos: Coincidencia parcial
   - 30 puntos por palabra clave importante (chocolate, naranja, mango, etc.)

4. **Extrae solo la sección correspondiente** al sabor del producto

### Casos Especiales Manejados

- **"Turmeric Latte"**: Se identifica buscando "cúrcuma" en el contenido, ya que puede aparecer bajo el nombre "Plátano:" en la página
- **"Sin Sabor"**: Se maneja como caso especial para productos sin saborizantes
- **Sabores con guiones**: "Naranja-Mango" se normaliza para coincidir con "Naranja y Mango"
- **Traducciones**: "Canela y Azúcar" se traduce a "Cinnamon & Sugar" para matching

## 📁 Estructura de Archivos

```
MyProteinScrapper/
├── myprotein_ingredients_scraper.py    # Script principal de scraping
├── corregir_ingredientes_bd.py          # Script para aplicar correcciones a BD original
├── MyProtein_Data_All_Products_Final.xlsx          # BD original (entrada)
├── MyProtein_Ingredients_Final.xlsx                # BD con ingredientes extraídos
└── MyProtein_Data_All_Products_Final_Corregido.xlsx # BD original corregida (salida)
```

## 🎓 Para Desarrolladores

### Funciones Principales

- `scrape_ingredients(url)`: Extrae ingredientes de una URL
- `extract_ingredients(soup)`: Busca ingredientes en el HTML usando múltiples métodos
- `_clean_ingredients_text(text, product_flavour)`: Limpia y filtra ingredientes por sabor
- `process_excel(...)`: Procesa un archivo Excel completo

### Extensibilidad

El código está diseñado para ser fácilmente extensible:
- Agregar nuevos patrones de detección de sabores
- Añadir más traducciones de sabores
- Mejorar el algoritmo de matching
- Integrar detección de aditivos (ya implementado pero opcional)

## 📝 Notas Importantes

- El scraper respeta los tiempos de respuesta del servidor
- Los resultados se guardan progresivamente para evitar pérdida de datos
- El proceso puede reanudarse si se interrumpe (usando `--resume`)
- Se recomienda usar `--concurrency 4` para no sobrecargar el servidor

## 🤝 Contribuciones

Si encuentras casos donde el filtrado no funciona correctamente, puedes:
1. Agregar nuevos patrones de sabores en `flavor_pattern3`
2. Añadir traducciones en `flavor_translations` y `reverse_translations`
3. Mejorar el algoritmo de matching en `_clean_ingredients_text`

---

**Desarrollado para mejorar la calidad y precisión de los datos de ingredientes de productos MyProtein.**



