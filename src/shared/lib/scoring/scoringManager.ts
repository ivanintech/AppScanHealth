// src/libs/scoring/scoringManager.ts

import { calcularPuntuacionGeneral } from './generalScoring';
import { calcularPuntuacionNutriScore } from './nutriscoreScoring';
import { clasificarSuplemento } from '../classification/classifySupplement';

export type ProductJSON = { [key: string]: any };

/**
 * Decide qué sistema de scoring usar según el producto.
 * @param producto JSON del producto
 * @returns PuntuacionResult calculada
 */
export function calcularPuntuacion(producto: ProductJSON) {
  if (producto.nutriscore_score != null && !isNaN(Number(producto.nutriscore_score))) {

    // Si existe NutriScore, usar scoring específico
    return calcularPuntuacionNutriScore(producto);

  } else {

    // Si no, obtener subcategoria y usar scoring general
    let clasificacion = producto.categoria
      ? { categoria: producto.categoria, subcategoria: producto.subcategoria }
      : clasificarSuplemento(producto);

    console.log(`Categoría detectada: ${clasificacion.categoria}, subcategoría asignada: ${clasificacion.subcategoria}`);

    return calcularPuntuacionGeneral(producto, clasificacion.subcategoria);
  }
}
