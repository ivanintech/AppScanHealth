// src/libs/scoring/nutriScoreScoring.ts

// Tipado del producto (genérico)
export type ProductJSON = { [key: string]: unknown };

// Cargar base de aditivos desde Supabase con fallback a JSON
async function loadAdditivesDB() {
    try {
        // Importar el cliente de Supabase dinámicamente para evitar problemas de SSR
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Variables de entorno de Supabase no configuradas");
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
            .from('additives')
            .select('*');
            
        if (error) {
            console.error('Error cargando aditivos desde Supabase:', error);
            throw error;
        }
        
        console.log(`✅ Cargados ${data?.length || 0} aditivos desde Supabase`);
        return data || [];
    } catch (error) {
        console.error('❌ Error cargando aditivos desde Supabase, usando fallback JSON:', error);
        
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
            console.error('❌ Error cargando aditivos desde JSON fallback:', jsonError);
            // Último fallback: retornar array vacío para que el scoring continúe
            return [];
        }
    }
}

// -------------------- FUNCIONES DE PUNTUACIÓN --------------------
const nutriRanges = [
    { letra: "A", min: -15, max: -3, puntosMax: 60 },
    { letra: "B", min: -2, max: 2, puntosMax: 51 },
    { letra: "C", min: 3, max: 10, puntosMax: 36 },
    { letra: "D", min: 11, max: 18, puntosMax: 21 },
    { letra: "E", min: 19, max: 51, puntosMax: 12 },
];

export function puntNutriscore(score: number | null): number {
    if (score == null) return 0;

    for (let i = 0; i < nutriRanges.length; i++) {
        const rango = nutriRanges[i];
        if (score >= rango.min && score <= rango.max) {
            const rangeSpan = rango.max - rango.min;
            const positionInRange = score - rango.min;

            const nextMax = (i + 1 < nutriRanges.length) ? nutriRanges[i + 1].puntosMax : 0;
            const minPuntos = nextMax + 1;
            const maxPuntos = rango.puntosMax;

            return maxPuntos - (positionInRange / rangeSpan) * (maxPuntos - minPuntos);
        }
    }
    return 0;
}

async function puntAditivos(additives_original_tags: string[] = []) {
    // Cargamos los aditivos desde Supabase
    const additivesDB = await loadAdditivesDB();

    if (!Array.isArray(additives_original_tags) || additives_original_tags.length === 0)
        return { score: 30, hasPeligroso: false, detalles: [] };

    let puntos = 30;
    let hasPeligroso = false;
    const detalles = [];

    additives_original_tags.forEach((tag) => {
        const match = tag.toUpperCase().replace(/^EN:/, "").trim().match(/\d+/);
        if (!match) return;
        const numero = match[0];
        const eId = `E-${numero}`;

        // Buscar en la tabla additives usando e_id
        const aditivo = additivesDB.find(a => a.e_id?.toUpperCase() === eId);
        const riesgo = aditivo?.searchterm || "No encontrado";

        if (riesgo.toLowerCase() === "¡peligroso!" || riesgo.toLowerCase() === "peligroso") {
            puntos -= 20;
            hasPeligroso = true;
        } else if (riesgo.toLowerCase() === "sospechoso") {
            puntos -= 5;
        } else if (riesgo.toLowerCase() === "no encontrado") {
            puntos -= 10;
        }

        detalles.push({ eId, riesgo, e_name: aditivo?.e_name });
    });

    return { score: Math.max(puntos, 0), hasPeligroso, detalles };
}

export function puntExtra(labels_tags: string[] = []): number {
    if (!Array.isArray(labels_tags) || labels_tags.length === 0) return 0;

    let puntos = 0;

    const organicTags = ["en:organic", "en:eu-organic", "en:usda-organic", "fr:ab-agriculture-biologique", "de:eg-öko-verordnung", "en:canada-organic"];
    if (labels_tags.some(tag => organicTags.includes(tag))) puntos += 1;

    const veganTags = ["en:vegan", "en:european-vegetarian-union-vegan", "en:vegan-action", "en:veganok", "en:v-label-international-vegan", "en:vegecert-certified-vegan"];
    if (labels_tags.some(tag => veganTags.includes(tag))) puntos += 1;

    const vegetarianTags = ["en:vegetarian", "en:european-vegetarian-union", "en:vegetarian-society-approved", "en:ovo-vegetarian", "en:ovo-lacto-vegetarian", "en:lacto-vegetarian"];
    if (labels_tags.some(tag => vegetarianTags.includes(tag))) puntos += 1;

    const cleanTags = ["en:no-palm-oil", "en:no-colorings", "en:no-artificial-colours-or-flavours", "en:no-artificial-flavors", "en:no-sugar", "en:no-added-sugar", "en:low-or-no-sugar"];
    const cleanCount = labels_tags.filter(tag => cleanTags.includes(tag)).length;
    puntos += Math.min(cleanCount, 2);

    const certTags = ["en:fair-trade", "en:fsc", "en:green-dot", "en:ut-certified", "en:sustainable-palm-oil"];
    const certCount = labels_tags.filter(tag => certTags.includes(tag)).length;
    puntos += Math.min(certCount, 2);

    return Math.min(puntos, 10);
}

// -------------------- FUNCIÓN PRINCIPAL --------------------
export async function calcularPuntuacionNutriScore(producto: ProductJSON) {
    console.log("\n================== SISTEMA NUTRISCORE ==================");

    // --- NutriScore ---
    const nutriScoreExists = producto.nutriscore_score != null;
    const nutriScoreValue = nutriScoreExists ? producto.nutriscore_score : "No encontrado";
    const nutriScore = puntNutriscore(Number(producto.nutriscore_score) || 0);
    console.log(`NutriScore: valor=${nutriScoreValue}, puntuación normalizada=${nutriScore.toFixed(2)}`);

    // --- Aditivos ---
    const aditivosExists = Array.isArray(producto.additives_original_tags) && producto.additives_original_tags.length > 0;
    const additivesTags = Array.isArray(producto.additives_original_tags) ? producto.additives_original_tags as string[] : [];
    const aditivosResult = aditivosExists ? await puntAditivos(additivesTags) : { score: 30, hasPeligroso: false, detalles: [] };
    console.log("--- Evaluación de Aditivos ---");
    aditivosResult.detalles.forEach(d => {
        console.log(`  ${d.eId}: riesgo="${d.riesgo}"`);
    });
    console.log(`Puntuación aditivos: ${aditivosResult.score} de 30`);
    if (aditivosResult.hasPeligroso) console.log("⚠️ Contiene aditivo peligroso");

    // --- Extra ---
    const labelsTags = Array.isArray(producto.labels_tags) ? producto.labels_tags as string[] : [];
    const extraExists = labelsTags.length > 0;
    const extraScore = extraExists ? puntExtra(labelsTags) : 0;
    console.log("--- Sistema Extra ---");
    console.log(`Etiquetas encontradas: ${extraExists ? labelsTags.join(", ") : "No disponible"}`);
    console.log(`Puntuación Extra: ${extraScore} de 10`);

    // --- Total ---
    let total = nutriScore + aditivosResult.score + extraScore;
    if (aditivosResult.hasPeligroso && total > 49) {
        console.log(`⚠️ Ajustando total por aditivo peligroso (máx 49)`);
        total = 49;
    }
    total = Math.round(total * 100) / 100;
    console.log(`Puntuación total NutriScore: ${total}\n`);

    return {
        normalized_nutriscore_60: { exists: nutriScoreExists, value: nutriScoreValue, score: nutriScore },
        additives_score_30: { exists: aditivosExists, additives: aditivosResult.detalles, score: aditivosResult.score },
        extra_10: { exists: extraExists, value: extraExists ? labelsTags.join(", ") : "No disponible", score: extraScore },
        total
    };
}
