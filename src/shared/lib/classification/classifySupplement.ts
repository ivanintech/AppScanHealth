// src/lib/categorization/clasificarSuplemento.ts

// -------------------------
// 1. Mapeo de clasificación
// -------------------------
const KEYWORDS: Record<string, string[]> = {
    // === 1. Proteínas & Aminoácidos ===
    "1.1 Proteínas en polvo": ["protein", "whey", "casein", "isolate", "gainer", "proteinas"],
    "1.2 Barras proteicas": ["protein-bar", "energy-bar", "snack-bar", "nut-bar"],
    "1.3 Bebidas proteicas RTD": ["protein-drink", "protein-shake", "milkshake", "ready-to-drink"],
    "1.4 BCAA / Aminoácidos": ["amino", "glutamine", "leucine", "valine", "isoleucine"],

    // === 2. Energéticos & Pre-entrenos ===
    "2.1 Pre-entrenos": ["pre", "workout", "preentreno", "pretrainer", "booster", "nitric-oxide"],
    "2.2 Energéticos": ["energy", "energy-drink", "stimulant", "guarana", "caffeine", "taurine"],

    // === 3. Vitaminas & Minerales ===
    "3.1 Multivitamínicos": ["vitamin", "multivitamin", "prenatal", "centrum", "supradyn"],
    "3.2 Minerales": ["magnesium", "iron", "zinc", "calcium", "potassium", "selenium"],

    // === 4. Ácidos grasos & Omega ===
    "4.1 Omega 3-6-9": ["omega", "epa", "dha", "fish-oil", "linseed", "flaxseed", "aceite-de-pescado"],

    // === 5. Control de peso ===
    "5.1 Sustitutivos de comida": ["meal-replacement", "weight-loss", "low-calorie", "diet-shake", "slim-fast"],
    "5.2 Quemagrasas / Termogénicos": [
        "fat-burner", "thermogenic", "carnitine", "cla", "green-tea-extract",
        "quemagrasa", "termogenico", "detox"
    ],

    // === 6. Salud & Bienestar ===
    "6.1 Antioxidantes": ["antioxidant", "resveratrol", "coenzyme-q10", "coq10", "grape-seed"],
    "6.2 Probióticos & Digestivos": ["probiotic", "digestive", "lactobacillus", "bifidobacterium", "prebiotic"],
    "6.3 Salud ósea / Articular": ["glucosamine", "chondroitin", "collagen", "bone", "joint", "msm", "hyaluronic", "articular"],

    // === 7. Suplementos Naturales & Otros ===
    "7.1 Extractos vegetales": ["plant-extract", "herbal", "ginseng", "ashwagandha", "maca", "turmeric", "curcuma"],
    "7.2 Superfoods": ["spirulina", "chlorella", "moringa", "acai", "baobab", "superfood"],
    "7.3 Otros suplementos específicos": ["supplement", "nutritional-supplement", "food-supplement", "specific-product", "specific"],
};

// Pesos asignados
const KEYWORD_WEIGHTS: Record<string, number> = {
    // Proteínas
    protein: 1, whey: 3, casein: 3, isolate: 3, gainer: 2, proteinas: 1,
    "protein-bar": 3, "energy-bar": 2, "snack-bar": 2, "nut-bar": 2,
    "protein-drink": 3, "protein-shake": 3, milkshake: 2, "ready-to-drink": 2,
    amino: 1, glutamine: 3, leucine: 3, valine: 3, isoleucine: 3,

    // Energéticos
    pre: 1, workout: 1, preentreno: 3, pretrainer: 2, booster: 2, "nitric-oxide": 2,
    energy: 1, "energy-drink": 3, stimulant: 2, guarana: 2, caffeine: 2, taurine: 2,

    // Vitaminas
    vitamin: 1, multivitamin: 3, prenatal: 3, centrum: 3, supradyn: 3,
    magnesium: 2, iron: 2, zinc: 2, calcium: 2, potassium: 2, selenium: 2,

    // Omega
    omega: 1, epa: 3, dha: 3, "fish-oil": 3, linseed: 2, flaxseed: 2, "aceite-de-pescado": 3,

    // Control de peso
    "meal-replacement": 3, "weight-loss": 2, "low-calorie": 2, "diet-shake": 2, "slim-fast": 2,
    "fat-burner": 3, thermogenic: 3, carnitine: 2, cla: 2, "green-tea-extract": 2,
    quemagrasa: 3, termogenico: 3, detox: 2,

    // Salud
    antioxidant: 2, resveratrol: 3, "coenzyme-q10": 3, coq10: 3, "grape-seed": 3,
    probiotic: 3, digestive: 2, lactobacillus: 3, bifidobacterium: 3, prebiotic: 2,
    glucosamine: 3, chondroitin: 3, collagen: 3, bone: 2, joint: 2, msm: 2, hyaluronic: 2, articular: 2,

    // Naturales
    "plant-extract": 3, herbal: 2, ginseng: 3, ashwagandha: 3, maca: 3, turmeric: 3, curcuma: 3,
    spirulina: 3, chlorella: 3, moringa: 3, acai: 3, baobab: 3, superfood: 2,
    supplement: 1, "nutritional-supplement": 2, "food-supplement": 2, "specific-product": 2,
};

// -------------------------
// 2. Tipos
// -------------------------
export type ProductJSON = { [key: string]: any };

export interface Clasificacion {
    categoria: string;
    subcategoria: string;
}

// -------------------------
// 3. Función de clasificación
// -------------------------
export function clasificarSuplemento(product: ProductJSON): Clasificacion {
    // Parsear categories_tags si es un string JSON
    let categoriesTags: string[] = [];
    if (typeof product.categories_tags === 'string') {
        try {
            categoriesTags = JSON.parse(product.categories_tags);
        } catch (e) {
            console.warn('Error parsing categories_tags:', product.categories_tags);
            categoriesTags = [];
        }
    } else if (Array.isArray(product.categories_tags)) {
        categoriesTags = product.categories_tags;
    }
    
    const keywordsList = product._keywords || [];
    const productName = product.product_name || "";

    const tagsNorm = categoriesTags.map(t => t.split(":").pop()?.toLowerCase() || "");
    const nameTokens = productName.toLowerCase().split(/\s+/);

    // Inicializar puntajes
    const subcatScores: Record<string, number> = {};
    for (const subcat of Object.keys(KEYWORDS)) {
        subcatScores[subcat] = 0;
    }

    // Sumar scores
    for (const [subcat, keywords] of Object.entries(KEYWORDS)) {
        for (const kw of keywords) {
            const weight = KEYWORD_WEIGHTS[kw] || 1;

            // categories_tags
            if (tagsNorm.some(tag => tag.includes(kw))) {
                subcatScores[subcat] += weight;
            }
            // _keywords
            if (keywordsList.some(k => k.toLowerCase().includes(kw))) {
                subcatScores[subcat] += weight;
            }
            // product_name tokens
            if (nameTokens.some(token => token.includes(kw))) {
                subcatScores[subcat] += weight;
            }
        }
    }

    const maxScore = Math.max(...Object.values(subcatScores));
    if (maxScore === 0) {
        return { categoria: "__sin_clasificar__", subcategoria: "__sin_clasificar__" };
    }

    const [bestSubcat] = Object.entries(subcatScores).find(([_, score]) => score === maxScore)!;

    // Extraer categoría principal (ej: "1. Proteínas & Aminoácidos")
    const categoria = bestSubcat.split(" ")[0].split(".")[0]; // coge "1", "2", "3"...
    const categoriaNombre = bestSubcat.split(" ")[1]; // fallback simple

    return {
        categoria: categoriaNombre || categoria,
        subcategoria: bestSubcat,
    };
}
