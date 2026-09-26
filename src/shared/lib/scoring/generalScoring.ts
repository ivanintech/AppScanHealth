// src/libs/scoring/generalScoring.ts

import { supabase } from '@/shared/supabase/client';

// Tipado del producto (genérico)
export type ProductJSON = { [key: string]: unknown };

// Tipado del resultado de cada bloque
export interface PuntuacionBloque {
    exists: boolean;
    score: number;
}

// Tipado del resultado completo
export interface ResultadoPuntuacion {
    eficacia_30: PuntuacionBloque;
    seguridad_60: PuntuacionBloque;
    extra_10: PuntuacionBloque;
    total: number;
}

// Función auxiliar para imprimir encabezado de sección
function printHeader(title) {
    console.log("\n=== " + title + " ===");
}

// Función auxiliar para imprimir subencabezado
function printSubHeader(title) {
    console.log("\n--- " + title + " ---");
}

// Cargar base de aditivos desde Supabase con fallback a JSON
async function loadAdditivesDB() {
    try {
        const { data, error } = await supabase
            .from('additives')
            .select('*');

        if (error) {
            console.error('Error cargando aditivos desde Supabase:', error);
            throw error;
        }

        console.log(`Cargados ${data?.length || 0} aditivos desde Supabase`);
        return data || [];
    } catch (error) {
        console.error('Error cargando aditivos desde Supabase, usando fallback JSON:', error);

        // Fallback: cargar desde el archivo JSON local
        try {
            const response = await fetch('/data/additives.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const additivesData = await response.json();
            console.log(`✅ Cargados ${additivesData?.length || 0} aditivos desde JSON fallback`);
            return additivesData || [];
        } catch (jsonError) {
            console.error('Error cargando aditivos desde JSON fallback:', jsonError);
            // Último fallback: retornar array vacío para que el scoring continúe
            return [];
        }
    }
}





// ------------------------------------------------------------------
// -------------------- SISTEMA: SEGURIDAD (60%) --------------------
// ------------------------------------------------------------------
const ADITIVOS_MAX = 40;
const INGREDIENTES_DESCONOCIDOS_MAX = 15;
const ACEITE_PALMA_MAX = 5;

// --- 1) Aditivos ---
async function puntAditivos(product) {
    // Cargamos los aditivos desde Supabase
    const additivesDB = await loadAdditivesDB();

    // Parsear additives_tags si es string JSON
    let additives_original_tags = product.additives_tags || [];
    if (typeof additives_original_tags === 'string') {
        try {
            additives_original_tags = JSON.parse(additives_original_tags);
        } catch (e) {
            console.warn('Error parseando additives_tags:', e);
            additives_original_tags = [];
        }
    }

    let puntos = ADITIVOS_MAX;
    let hasPeligroso = false;
    const detalles = [];

    printSubHeader("Evaluación de Aditivos");
    console.log(`Total aditivos encontrados: ${additives_original_tags.length}`);

    if (Array.isArray(additives_original_tags) && additives_original_tags.length > 0) {
        additives_original_tags.forEach((tag) => {
            const match = tag.toUpperCase().replace(/^EN:/, "").trim().match(/\d+/);
            if (!match) return;
            const numero = match[0];
            const eId = `E-${numero}`;

            // Buscar en la tabla additives usando e_id
            const aditivo = additivesDB.find(a => a.e_id?.toUpperCase() === eId);
            const riesgo = aditivo?.searchterm || "No encontrado";

            let penalizacion = 0;
            if (riesgo.toLowerCase() === "¡peligroso!" || riesgo.toLowerCase() === "peligroso") {
                penalizacion = 20;
                puntos -= penalizacion;
                hasPeligroso = true;
            } else if (riesgo.toLowerCase() === "sospechoso") {
                penalizacion = 5;
                puntos -= penalizacion;
            } else if (riesgo.toLowerCase() === "no encontrado") {
                penalizacion = 10;
                puntos -= penalizacion;
            }

            detalles.push({ eId, riesgo, penalizacion, e_name: aditivo?.e_name });
            console.log(`  ${eId}: riesgo="${riesgo}", penalización=${penalizacion}, puntos restantes=${Math.max(puntos, 0)}`);
        });
    }

    console.log(`Puntuación final aditivos: ${Math.max(puntos, 0)} de ${ADITIVOS_MAX}`);
    return { score: Math.max(puntos, 0), detalles, hasPeligroso };
}

// --- 2) Ingredientes desconocidos (placeholder) ---
function puntIngredientesDesconocidos(product) {
    const known = product.known_ingredients_n || 0;
    const unknown = product.unknown_ingredients_n || 0;
    const total = known + unknown;

    let score = 0;
    let porcentajeDesconocidos = 0;

    if (total > 0) {
        porcentajeDesconocidos = unknown / total;

        if (porcentajeDesconocidos >= 0.8) {
            score = 0;
        } else {
            // Escalar proporcionalmente entre 0% y 80%
            score = Math.round((1 - (porcentajeDesconocidos / 0.8)) * INGREDIENTES_DESCONOCIDOS_MAX * 100) / 100;
        }
    }

    printSubHeader("Evaluación de Ingredientes Desconocidos");
    console.log(`Ingredientes conocidos: ${known}, desconocidos: ${unknown}, total: ${total}`);
    console.log(`Porcentaje desconocidos: ${(porcentajeDesconocidos * 100).toFixed(2)}%`);
    console.log(`Puntuación asignada: ${score} de ${INGREDIENTES_DESCONOCIDOS_MAX}`);

    return { score, porcentajeDesconocidos, known, unknown };
}

// --- 3) Aceite de palma (placeholder) ---
function puntAceitePalma(product) {
    const tags = product.ingredients_analysis_tags || [];
    let score = 0;
    let categoria = "no detectado";

    // Buscar si hay algún tag relacionado con aceite de palma
    if (tags.includes("en:palm-oil-free")) {
        score = ACEITE_PALMA_MAX;  // máxima puntuación
        categoria = "libre de aceite de palma";
    } else if (tags.includes("en:may-contain-palm-oil")) {
        score = Math.round(ACEITE_PALMA_MAX * 0.5);  // puntuación media
        categoria = "puede contener aceite de palma";
    } else if (tags.includes("en:palm-oil")) {
        score = 0;  // mínima puntuación
        categoria = "contiene aceite de palma";
    } else if (tags.includes("en:palm-oil-content-unknown") || tags.length === 0) {
        score = Math.round(ACEITE_PALMA_MAX * 0.3);  // puntuación baja por desconocido
        categoria = "desconocido";
    } else {
        // caso general si hay tags pero ninguno relacionado con palma
        score = Math.round(ACEITE_PALMA_MAX * 0.3);
        categoria = "sin información sobre palma";
    }

    printSubHeader("Evaluación Aceite de Palma");
    console.log(`Tags encontrados: ${tags.join(", ")}`);
    console.log(`Categoría: ${categoria}, Puntuación: ${score} de ${ACEITE_PALMA_MAX}`);

    return { score, categoria, tags };
}


// --- Función principal de seguridad ---
async function calculateSecurity(product) {
    printHeader("SISTEMA DE SEGURIDAD (60%)");

    const aditivos = await puntAditivos(product);
    const desconocidos = puntIngredientesDesconocidos(product);
    const palma = puntAceitePalma(product);

    const scoreTotal = aditivos.score + desconocidos.score + palma.score;

    console.log("\n--- Resumen Seguridad ---");
    console.log(`Aditivos: ${aditivos.score} / ${ADITIVOS_MAX}`);
    console.log(`Ingredientes desconocidos: ${desconocidos.score} / ${INGREDIENTES_DESCONOCIDOS_MAX}`);
    console.log(`Aceite de palma: ${palma.score} / ${ACEITE_PALMA_MAX}`);
    console.log(`Puntuación total de seguridad: ${scoreTotal} / 60`);

    return scoreTotal;
}





// -----------------------------------------------------------------
// -------------------- SISTEMA: EFICACIA (30%) --------------------
// -----------------------------------------------------------------
const EFICACIA_MAX = 30;
const PRIMARY_PORTION = 24; // 80% de 30
const BONUS_PORTION = 6;    // 20% de 30

// Configuración por subcategoría: parámetros primarios (key, direction, weight, min, max)
// y bonuses (lista de reglas simples: nutrient, tipo, umbral, puntos)
const SUBCATEGORY_CONFIG = {
    "1.1 Proteínas en polvo": {
        primaries: [
            { key: "proteins_100g", direction: "higher", weight: 0.60, min: 50, max: 95 },
            { key: "saturated-fat_100g", direction: "lower", weight: 0.10, min: 0, max: 10 },
            { key: "carbohydrates_100g", direction: "lower", weight: 0.10, min: 0, max: 30 },
            { key: "fiber_100g", direction: "higher", weight: 0.10, min: 0, max: 10 },
            { key: "energy-kcal_100g", direction: "range", weight: 0.10, min: 350, max: 450 }
        ],
        bonuses: [
            // Bonos simples basados en vitaminas minerales y bioactivos (solo con campos disponibles)
            { type: "vitamin_presence", pointsPerVitamin: 0.5, cap: 2.0 },
            { type: "mineral_presence", pointsPerMineral: 0.2, cap: 1.0 }
        ]
    },

    "1.2 Barras proteicas": {
        primaries: [
            { key: "proteins_100g", direction: "higher", weight: 0.35, min: 5, max: 30 },
            { key: "sugars_100g", direction: "lower", weight: 0.30, min: 0, max: 40 },
            { key: "fat_100g", direction: "lower", weight: 0.20, min: 0, max: 30 },
            { key: "fiber_100g", direction: "higher", weight: 0.15, min: 0, max: 10 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.25, cap: 1.5 },
            { type: "no_palm_proxy", points: 0.5 } // proxy: si labels indican sin palm o keywords (si los tienes)
        ]
    },

    "1.3 Bebidas proteicas RTD": {
        primaries: [
            { key: "proteins_100g", direction: "higher", weight: 0.40, min: 2, max: 15 },
            { key: "sugars_100g", direction: "lower", weight: 0.30, min: 0, max: 15 },
            { key: "energy-kcal_100g", direction: "range", weight: 0.15, min: 50, max: 150 },
            { key: "fat_100g", direction: "lower", weight: 0.15, min: 0, max: 10 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.3, cap: 1.5 }
        ]
    },

    "1.4 BCAA / Aminoácidos": {
        primaries: [
            // no tenemos bcaas específicos en la lista; usamos proteins como proxy
            { key: "proteins_100g", direction: "higher", weight: 0.70, min: 0, max: 95 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.30, min: 0, max: 50 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "2.1 Pre-entrenos": {
        primaries: [
            // usamos caffeine_100g como proxy (si tienes mg/serving mejor, después lo cambias)
            { key: "caffeine_100g", direction: "higher", weight: 0.40, min: 0.15, max: 40 },
            { key: "sugars_100g", direction: "lower", weight: 0.20, min: 0, max: 30 },
            { key: "sodium_100g", direction: "neutral", weight: 0.20, min: 0, max: 2000 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.20, min: 0, max: 200 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "2.2 Energéticos": {
        primaries: [
            { key: "caffeine_100g", direction: "higher", weight: 0.50, min: 10, max: 30000 },
            { key: "sugars_100g", direction: "lower", weight: 0.30, min: 0, max: 40 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.20, min: 0, max: 300 }
        ],
        bonuses: [
            { type: "vitamin_b_group_presence", points: 0.5 } // si detectas varias vitaminas B
        ]
    },

    "3.1 Multivitamínicos": {
        primaries: [
            // primario: media normalizada de vitaminas clave + algunos minerales
            { key: "vitamin-b1_100g", direction: "higher", weight: 0.10, min: 0, max: 100 },
            { key: "vitamin-b2_100g", direction: "higher", weight: 0.10, min: 0, max: 100 },
            { key: "vitamin-b6_100g", direction: "higher", weight: 0.10, min: 0, max: 100 },
            { key: "vitamin-b12_100g", direction: "higher", weight: 0.10, min: 0, max: 100 },
            { key: "vitamin-c_100g", direction: "higher", weight: 0.10, min: 0, max: 2000 },
            { key: "iron_100g", direction: "higher", weight: 0.10, min: 0, max: 100 },
            { key: "zinc_100g", direction: "higher", weight: 0.10, min: 0, max: 100 },
            { key: "magnesium_100g", direction: "higher", weight: 0.10, min: 0, max: 500 },
            { key: "calcium_100g", direction: "higher", weight: 0.10, min: 0, max: 2000 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.3, cap: 2.5 },
            { type: "mineral_presence", pointsPerMineral: 0.2, cap: 1.5 }
        ]
    },

    "3.2 Minerales": {
        primaries: [
            // voto por usar el mineral específico que te interese; aquí se hace proxy con iron/magnesium/zinc/calcium
            { key: "iron_100g", direction: "higher", weight: 0.25, min: 0, max: 100 },
            { key: "magnesium_100g", direction: "higher", weight: 0.25, min: 0, max: 500 },
            { key: "calcium_100g", direction: "higher", weight: 0.25, min: 0, max: 2000 },
            { key: "zinc_100g", direction: "higher", weight: 0.25, min: 0, max: 100 }
        ],
        bonuses: [
            { type: "mineral_presence", pointsPerMineral: 0.25, cap: 2.0 }
        ]
    },

    "4.1 Omega 3-6-9": {
        primaries: [
            // no tenemos EPA/DHA en la lista; usamos fat y cholesterol como proxies de calidad grasa
            { key: "fat_100g", direction: "higher", weight: 0.60, min: 10, max: 100 },
            { key: "cholesterol_100g", direction: "lower", weight: 0.40, min: 0, max: 500 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "5.1 Sustitutivos de comida": {
        primaries: [
            { key: "energy-kcal_100g", direction: "range", weight: 0.30, min: 200, max: 400 },
            { key: "proteins_100g", direction: "higher", weight: 0.25, min: 10, max: 40 },
            { key: "carbohydrates_100g", direction: "balanced", weight: 0.20, min: 10, max: 60 },
            { key: "fiber_100g", direction: "higher", weight: 0.15, min: 3, max: 20 },
            { key: "fat_100g", direction: "lower", weight: 0.10, min: 0, max: 25 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.25, cap: 1.5 },
            { type: "mineral_presence", pointsPerMineral: 0.15, cap: 1.0 }
        ]
    },

    "5.2 Quemagrasas / Termogénicos": {
        primaries: [
            // sin termogénicos específicos, usamos caffeine + bajo energy + bajo fat
            { key: "caffeine_100g", direction: "higher", weight: 0.40, min: 0, max: 40000 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.30, min: 0, max: 300 },
            { key: "fat_100g", direction: "lower", weight: 0.30, min: 0, max: 30 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "6.1 Antioxidantes": {
        primaries: [
            { key: "vitamin-c_100g", direction: "higher", weight: 0.50, min: 0, max: 2000 },
            { key: "vitamin-e_100g", direction: "higher", weight: 0.25, min: 0, max: 100 },
            { key: "beta-carotene_100g", direction: "higher", weight: 0.25, min: 0, max: 10000 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.25, cap: 2.0 }
        ]
    },

    "6.2 Probióticos & Digestivos": {
        primaries: [
            // sin CFU en lista; usamos fiber, proteins y energy como proxies
            { key: "fiber_100g", direction: "higher", weight: 0.50, min: 0, max: 30 },
            { key: "proteins_100g", direction: "higher", weight: 0.10, min: 0, max: 95 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.40, min: 0, max: 500 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "6.3 Salud ósea / Articular": {
        primaries: [
            { key: "calcium_100g", direction: "higher", weight: 0.40, min: 0, max: 1000 },
            { key: "magnesium_100g", direction: "higher", weight: 0.30, min: 0, max: 500 },
            { key: "proteins_100g", direction: "higher", weight: 0.15, min: 0, max: 95 },
            { key: "vitamin-k_100g", direction: "higher", weight: 0.15, min: 0, max: 200 }
        ],
        bonuses: [
            { type: "mineral_presence", pointsPerMineral: 0.2, cap: 1.0 }
        ]
    },

    "7.1 Extractos vegetales": {
        primaries: [
            // sin estandarizaciones ni compuestos activos en la lista; usamos fiber y vitamins como proxy
            { key: "fiber_100g", direction: "higher", weight: 0.40, min: 0, max: 30 },
            { key: "vitamin-c_100g", direction: "higher", weight: 0.30, min: 0, max: 2000 },
            { key: "beta-carotene_100g", direction: "higher", weight: 0.30, min: 0, max: 10000 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "7.2 Superfoods": {
        primaries: [
            { key: "fiber_100g", direction: "higher", weight: 0.40, min: 0, max: 30 },
            { key: "proteins_100g", direction: "higher", weight: 0.30, min: 0, max: 30 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.30, min: 0, max: 800 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    },

    "7.3 Otros suplementos específicos": {
        primaries: [
            { key: "proteins_100g", direction: "higher", weight: 0.35, min: 0, max: 95 },
            { key: "energy-kcal_100g", direction: "lower", weight: 0.35, min: 0, max: 800 },
            { key: "vitamin-c_100g", direction: "higher", weight: 0.30, min: 0, max: 2000 }
        ],
        bonuses: [
            { type: "vitamin_presence", pointsPerVitamin: 0.2, cap: 1.0 }
        ]
    }
};

// Normalizador general
function normalize(value, min, max, direction) {
    if (value == null || isNaN(value)) return 0;

    switch (direction) {
        case "higher":
            return Math.max(0, Math.min(1, (value - min) / (max - min)));
        case "lower":
            return Math.max(0, Math.min(1, (max - value) / (max - min)));
        case "range": {
            if (value < min || value > max) return 0;
            const mid = (min + max) / 2;
            const halfRange = (max - min) / 2;
            return 1 - Math.abs(value - mid) / halfRange;
        }
        case "balanced": {
            if (value < min || value > max) return 0;
            return 1; // dentro del rango se da el máximo
        }
        case "neutral": {
            return 0.5; // placeholder neutral
        }
        default:
            return 0;
    }
}

// Bonuses
function calculateBonuses(product, bonuses) {
    let bonusScore = 0;

    for (const bonus of bonuses) {
        if (bonus.type === "vitamin_presence") {
            const vitamins = Object.keys(product).filter((k) => k.includes("vitamin-") && product[k] > 0);
            bonusScore += Math.min(vitamins.length * bonus.pointsPerVitamin, bonus.cap);
        }

        if (bonus.type === "mineral_presence") {
            const minerals = ["calcium_100g", "magnesium_100g", "iron_100g", "zinc_100g"];
            const count = minerals.filter((m) => product[m] && product[m] > 0).length;
            bonusScore += Math.min(count * bonus.pointsPerMineral, bonus.cap);
        }

        if (bonus.type === "vitamin_b_group_presence") {
            const vitB = ["vitamin-b1_100g", "vitamin-b2_100g", "vitamin-b6_100g", "vitamin-b12_100g"];
            const count = vitB.filter((v) => product[v] && product[v] > 0).length;
            if (count >= 2) bonusScore += bonus.points;
        }

        if (bonus.type === "no_palm_proxy") {
            const labels = product.labels_tags || [];
            const keywords = product.ingredients_text || "";
            if (labels.includes("en:palm-oil-free") || /sin palma/i.test(keywords)) {
                bonusScore += bonus.points;
            }
        }
    }

    return bonusScore;
}

// Calcular eficacia global
function calculateEfficacy(product, subcategory) {
    const config = SUBCATEGORY_CONFIG[subcategory];
    if (!config) {
        console.warn(`No hay config para subcategoría ${subcategory}`);
        return 0;
    }

    printHeader(`SISTEMA DE EFICACIA (30%)`);
    printSubHeader("Parámetros primarios:");

    let score = 0;
    for (const param of config.primaries) {
        const value = product[param.key];
        const norm = normalize(value, param.min, param.max, param.direction);
        const contrib = norm * param.weight * PRIMARY_PORTION;
        console.log(`  ${param.key}: valor=${value}, normalizado=${norm.toFixed(2)}, contribución=${contrib.toFixed(2)}`);
        score += norm * param.weight;
    }

    const primaryScore = score * PRIMARY_PORTION;

    const rawBonus = calculateBonuses(product, config.bonuses);
    const bonusScore = Math.min(rawBonus, BONUS_PORTION);

    console.log(`Bonuses: raw=${rawBonus.toFixed(2)}, limitados a ${BONUS_PORTION}, total bonus=${bonusScore.toFixed(2)}`);
    console.log(`Total eficacia: ${(primaryScore + bonusScore).toFixed(2)} de ${EFICACIA_MAX}`);

    return primaryScore + bonusScore;
}





// --------------------------------------------------------------
// -------------------- SISTEMA: EXTRA (10%) --------------------
// --------------------------------------------------------------
const EXTRA_MAX = 10;

function calculateExtra(product) {
    const labels_tags = product.labels_tags || [];
    let puntos = 0;
    const breakdown = [];

    printHeader("SISTEMA EXTRA (10%)");

    if (!Array.isArray(labels_tags) || labels_tags.length === 0) {
        console.log("No hay etiquetas disponibles. Puntuación: 0 de " + EXTRA_MAX);
        return 0;
    }

    console.log(`Etiquetas encontradas: [${labels_tags.join(", ")}]`);

    // Orgánico
    const organicTags = ["en:organic", "en:eu-organic", "en:usda-organic", "fr:ab-agriculture-biologique", "de:eg-öko-verordnung", "en:canada-organic"];
    if (labels_tags.some(tag => organicTags.includes(tag))) {
        puntos += 1;
        breakdown.push({ category: "Orgánico", tags: labels_tags.filter(tag => organicTags.includes(tag)), points: 1 });
    }

    // Vegano
    const veganTags = ["en:vegan", "en:european-vegetarian-union-vegan", "en:vegan-action", "en:veganok", "en:v-label-international-vegan", "en:vegecert-certified-vegan"];
    if (labels_tags.some(tag => veganTags.includes(tag))) {
        puntos += 1;
        breakdown.push({ category: "Vegano", tags: labels_tags.filter(tag => veganTags.includes(tag)), points: 1 });
    }

    // Vegetariano
    const vegetarianTags = ["en:vegetarian", "en:european-vegetarian-union", "en:vegetarian-society-approved", "en:ovo-vegetarian", "en:ovo-lacto-vegetarian", "en:lacto-vegetarian"];
    if (labels_tags.some(tag => vegetarianTags.includes(tag))) {
        puntos += 1;
        breakdown.push({ category: "Vegetariano", tags: labels_tags.filter(tag => vegetarianTags.includes(tag)), points: 1 });
    }

    // Limpieza
    const cleanTags = ["en:no-colorings", "en:no-artificial-colours-or-flavours", "en:no-artificial-flavors", "en:no-sugar", "en:no-added-sugar", "en:low-or-no-sugar"];
    const cleanMatch = labels_tags.filter(tag => cleanTags.includes(tag));
    if (cleanMatch.length > 0) {
        const pts = Math.min(cleanMatch.length, 2);
        puntos += pts;
        breakdown.push({ category: "Limpieza", tags: cleanMatch, points: pts });
    }

    // Certificaciones
    const certTags = ["en:fair-trade", "en:fsc", "en:green-dot", "en:ut-certified", "en:sustainable-palm-oil"];
    const certMatch = labels_tags.filter(tag => certTags.includes(tag));
    if (certMatch.length > 0) {
        const pts = Math.min(certMatch.length, 2);
        puntos += pts;
        breakdown.push({ category: "Certificaciones", tags: certMatch, points: pts });
    }

    // Limitar a máximo
    puntos = Math.min(puntos, EXTRA_MAX);

    // Mostrar desglose completo
    breakdown.forEach(item => {
        console.log(`  - ${item.category}: tags encontrados = [${item.tags.join(", ")}], puntos = ${item.points}`);
    });

    console.log(`Puntuación Extra total: ${puntos} de ${EXTRA_MAX}`);

    return puntos;
}





// -----------------------------------------------------------
// -------------------- FUNCION PRINCIPAL --------------------
// -----------------------------------------------------------
export async function calcularPuntuacionGeneral(
    producto: ProductJSON,
    subcategoria: string
): Promise<ResultadoPuntuacion> {
    // Seguridad
    const seguridad = await calculateSecurity(producto);

    // Eficacia (usa nutriments + subcategoría)
    const eficacia = calculateEfficacy(producto.nutriments || {}, subcategoria);

    // Extra
    const extra = calculateExtra(producto);

    // Total
    let total = eficacia + seguridad + extra;
    total = Math.round(total * 100) / 100;

    const resultado: ResultadoPuntuacion = {
        eficacia_30: { exists: !!producto.nutriments, score: eficacia },
        seguridad_60: { exists: true, score: seguridad },
        extra_10: { exists: true, score: extra },
        total,
    };

    return resultado;
}
