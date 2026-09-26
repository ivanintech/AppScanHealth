"""
Script para analizar un texto de ingredientes y detectar aditivos
"""
import json
import sys
from pathlib import Path
from llm_analyzer import LLMAnalyzer, LLMConfig, create_llm_config_from_env

def main():
    texto_ingredientes = """Mezcla de proteína (22%) (proteína de lactosuero hidrolizada (leche), concentrado de proteína de leche, concentrado de proteína de lactosuero (leche), aislado de proteína de soja), edulcorante (maltitol), humectante (glicerol), fibra de raíz de achicoria, recubrimiento con sabor a chocolate con leche (10%) (edulcorante (maltitol), palmiste, leche desnatada en polvo, lactosuero dulce en polvo (leche), emulsionantes (lecitina de girasol, polirricinoleato de poliglicerol), saborizante), caramelo bajo en azúcar (8%) (oligofructosa, humectante (glicerol), aceites vegetales (palmiste, palma), mantequilla (leche), agua, harina de germen de algarroba, emulsionantes (mono- y diglicéridos de ácidos grasos, lecitina de colza, triestearato de sorbitán), azúcar caramelizado, gelificante (pectina), sal), gelatina bovina hidrolizada, aceite de colza, caseinato de calcio (leche), cacao en polvo bajo en grasa, trocitos crujientes de proteína de soja y cacao (2%) (aislado de proteína de soja, cacao en polvo, almidón de tapioca), trocitos de chocolate blanco (2%) (azúcar, manteca de cacao, leche entera en polvo, leche desnatada en polvo, azúcar de leche, lactosuero en polvo (leche), emulsionante (lecitina de soja), saborizante de vainilla natural), saborizante natural, pasta de cacao, saborizante, emulsionante (lecitina de soja). CHOCOLATE BLANCO: 18% mínimo de sólidos de leche."""

    print("="*100)
    print("ANÁLISIS DE INGREDIENTES - DETECCIÓN DE ADITIVOS")
    print("="*100)
    print()
    print("TEXTO DE INGREDIENTES:")
    print("-"*100)
    print(texto_ingredientes)
    print()
    print("-"*100)
    print()
    
    # Cargar base de datos de aditivos
    print("1. Cargando base de datos de aditivos...")
    aditivos_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\aditivos.json")
    with open(aditivos_path, 'r', encoding='utf-8') as f:
        aditivos_db = json.load(f)
    print(f"   [OK] {len(aditivos_db)} aditivos cargados")
    print()
    
    # Inicializar LLM Analyzer
    print("2. Inicializando analizador LLM...")
    config = create_llm_config_from_env()
    if not config:
        print("   [ERROR] No se pudo cargar la configuración del LLM desde variables de entorno")
        return
    
    analyzer = LLMAnalyzer(config)
    print("   [OK] Analizador inicializado")
    print()
    
    # Detectar aditivos
    print("3. Detectando aditivos en el texto...")
    aditivos_detectados = analyzer.detect_additives_in_text(texto_ingredientes, aditivos_db)
    print(f"   [OK] {len(aditivos_detectados)} aditivos detectados")
    print()
    
    # Mostrar resultados
    print("="*100)
    print("ADITIVOS DETECTADOS")
    print("="*100)
    print()
    
    if aditivos_detectados:
        for i, aditivo in enumerate(aditivos_detectados, 1):
            print(f"{i}. {aditivo.get('e_numero', 'N/A')}: {aditivo.get('nombre_original', 'N/A')}")
            print(f"   Tipo: {aditivo.get('tipo', 'N/A')}")
            print(f"   Origen: {aditivo.get('origen', 'N/A')}")
            print(f"   Clasificación: {aditivo.get('clasificacion', 'N/A')}")
            print()
    else:
        print("No se detectaron aditivos en el texto.")
    
    print("="*100)
    
    # Guardar resultados en JSON
    resultado_json = {
        'texto_ingredientes': texto_ingredientes,
        'aditivos_detectados': aditivos_detectados,
        'total_detectados': len(aditivos_detectados)
    }
    
    resultado_path = Path(r"C:\Users\ivang\Documents\Projects\AppScanHealth\ExtractAdditives\analisis_texto_ingredientes.json")
    with open(resultado_path, 'w', encoding='utf-8') as f:
        json.dump(resultado_json, f, ensure_ascii=False, indent=2)
    print(f"\nResultados guardados en: {resultado_path}")

if __name__ == "__main__":
    main()

