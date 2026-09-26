"""
Analizador de Aditivos con LLM
==============================

Este módulo integra el detector de aditivos con modelos de lenguaje grandes (LLM)
para proporcionar análisis más inteligentes y contextuales de los aditivos detectados.
"""

import os
import json
import logging
import re
import unicodedata
from typing import List, Dict, Optional, Any, Set
from dataclasses import dataclass
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logger
logger = logging.getLogger(__name__)

@dataclass
class LLMConfig:
    """Configuración para el LLM"""
    provider: str  # 'openai', 'anthropic', 'huggingface', 'local'
    api_key: str
    model: str
    max_tokens: int = 1000
    temperature: float = 0.3

class LLMAnalyzer:
    """
    Analizador de aditivos que utiliza LLMs para proporcionar análisis inteligentes.
    """
    
    def __init__(self, config: LLMConfig, custom_prompt_template: Optional[str] = None):
        """
        Inicializa el analizador LLM.
        
        Args:
            config: Configuración del LLM
            custom_prompt_template: Template de prompt personalizado (opcional). 
                                   Si se proporciona, se usará en lugar del prompt por defecto.
                                   Debe contener {texto}, {e_numeros_directos_texto}, {aditivos_info}
        """
        self.config = config
        self.client = self._initialize_client()
        self.custom_prompt_template = custom_prompt_template
    
    def _initialize_client(self):
        """Inicializa el cliente del LLM según el proveedor."""
        if self.config.provider == 'openai':
            try:
                from openai import OpenAI
                import os
                # Soportar base_url personalizado (para Nebius u otros proveedores compatibles)
                # Primero intentar desde variable de entorno, luego desde config si está disponible
                base_url = os.getenv('OPENAI_BASE_URL')
                # Si no hay base_url en env pero el config tiene un atributo base_url, usarlo
                if not base_url and hasattr(self.config, 'base_url'):
                    base_url = self.config.base_url
                
                if base_url:
                    return OpenAI(api_key=self.config.api_key, base_url=base_url)
                else:
                    return OpenAI(api_key=self.config.api_key)
            except ImportError:
                raise ImportError("OpenAI library not installed. Run: pip install openai")
        
        elif self.config.provider == 'anthropic':
            try:
                import anthropic
                return anthropic.Anthropic(api_key=self.config.api_key)
            except ImportError:
                raise ImportError("Anthropic library not installed. Run: pip install anthropic")
        
        elif self.config.provider == 'huggingface':
            # Hugging Face usa requests directamente, no necesita cliente especial
            import requests
            return None  # Se manejará en _get_llm_response
        
        else:
            raise ValueError(f"Proveedor no soportado: {self.config.provider}")
    
    def analyze_additives(self, aditivos_detectados: List[Dict], texto_original: str) -> Dict[str, Any]:
        """
        Analiza los aditivos detectados usando un LLM.
        
        Args:
            aditivos_detectados: Lista de aditivos detectados
            texto_original: Texto original analizado
            
        Returns:
            Diccionario con el análisis del LLM
        """
        if not aditivos_detectados:
            return {
                "resumen": "No se detectaron aditivos en el texto.",
                "recomendaciones": [],
                "riesgos": [],
                "analisis_detallado": "El texto no contiene aditivos alimentarios detectables."
            }
        
        # Preparar prompt
        prompt = self._create_analysis_prompt(aditivos_detectados, texto_original)
        
        # Obtener respuesta del LLM
        response = self._get_llm_response(prompt)
        
        # Procesar respuesta
        return self._process_llm_response(response, aditivos_detectados)
    
    def _create_analysis_prompt(self, aditivos: List[Dict], texto: str) -> str:
        """Crea el prompt para el análisis de aditivos."""
        
        # Preparar información de aditivos
        aditivos_info = []
        for aditivo in aditivos:
            info = {
                "e_numero": aditivo['e_numero'],
                "nombre": aditivo['aditivo']['nombre_original'],
                "tipo": aditivo['tipo'],
                "origen": aditivo['origen'],
                "clasificacion": aditivo['clasificacion'],
                "similitud": aditivo['similitud']
            }
            aditivos_info.append(info)
        
        prompt = f"""
Eres un experto en aditivos alimentarios y nutrición. Analiza los siguientes aditivos detectados en un texto de ingredientes de un suplemento alimentario.

TEXTO ORIGINAL:
"{texto}"

ADITIVOS DETECTADOS:
{json.dumps(aditivos_info, indent=2, ensure_ascii=False)}

Por favor, proporciona un análisis completo en formato JSON con la siguiente estructura:

{{
    "resumen": "Resumen general de los aditivos encontrados y su impacto en la salud",
    "recomendaciones": [
        "Recomendación específica 1",
        "Recomendación específica 2"
    ],
    "riesgos": [
        "Riesgo potencial 1",
        "Riesgo potencial 2"
    ],
    "analisis_detallado": "Análisis detallado de cada aditivo y sus efectos",
    "puntuacion_salud": 85,
    "categoria_general": "Seguro/Sospechoso/Peligroso"
}}

Considera:
1. La clasificación de peligrosidad de cada aditivo
2. Los efectos potenciales en la salud
3. Si hay aditivos problemáticos que deberían evitarse
4. Si el producto es generalmente seguro para el consumo
5. Recomendaciones específicas para el consumidor

Responde SOLO con el JSON, sin texto adicional.
"""
        return prompt
    
    def _get_llm_response(self, prompt: str) -> str:
        """Obtiene respuesta del LLM según el proveedor."""
        
        if self.config.provider == 'openai':
            response = self.client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "Eres un experto en aditivos alimentarios y nutrición."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )
            return response.choices[0].message.content
        
        elif self.config.provider == 'anthropic':
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text
        
        elif self.config.provider == 'huggingface':
            try:
                from huggingface_hub import InferenceClient
            except ImportError:
                raise ImportError("huggingface_hub library not installed. Run: pip install huggingface_hub")
            
            import time
            
            # Lista de proveedores a intentar en orden de preferencia
            # Primero intentar sin especificar proveedor (usa configuración del usuario)
            # Luego probar proveedores específicos
            providers_to_try = [None, 'replicate', 'novita', 'nscale', 'hf-inference', 'together', 'fireworks-ai']
            
            # Formatear prompt para modelos instruct (Mistral usa formato especial)
            if 'mistral' in self.config.model.lower() or 'instruct' in self.config.model.lower():
                # Formato para modelos Mistral Instruct v0.2
                # El formato correcto es: <s>[INST] instrucción [/INST]
                formatted_prompt = f"<s>[INST] {prompt} [/INST]"
            else:
                formatted_prompt = prompt
            
            # Intentar con cada proveedor hasta que uno funcione
            last_error = None
            for provider in providers_to_try:
                try:
                    provider_name = provider if provider else "configuración del usuario (sin especificar)"
                    logger.info(f"Intentando con proveedor: {provider_name}")
                    
                    # Crear cliente con o sin proveedor específico
                    if provider:
                        client = InferenceClient(
                            model=self.config.model,
                            token=self.config.api_key if self.config.api_key else None,
                            provider=provider
                        )
                    else:
                        # Sin especificar proveedor, usa la configuración del usuario
                        client = InferenceClient(
                            model=self.config.model,
                            token=self.config.api_key if self.config.api_key else None
                        )
                    
                    # Intentar la llamada con retry
                    max_retries = 2  # Reducir a 2 intentos para fallar más rápido
                    for attempt in range(max_retries):
                        try:
                            # Usar text_generation para modelos de texto
                            response = client.text_generation(
                                formatted_prompt,
                                max_new_tokens=self.config.max_tokens,
                                temperature=self.config.temperature,
                                return_full_text=False
                            )
                            logger.info(f"Respuesta exitosa con proveedor: {provider_name}")
                            return response
                            
                        except Exception as e:
                            error_str = str(e)
                            # Detectar errores que indican que este proveedor no funciona
                            if ("404" in error_str or "not found" in error_str.lower() or 
                                "provider" in error_str.lower() and "not supported" in error_str.lower() or
                                "not supported by provider" in error_str.lower() or
                                "task" in error_str.lower() and "not supported" in error_str.lower()):
                                # Este proveedor no está disponible o no soporta este modelo/tarea
                                logger.warning(f"Proveedor '{provider_name}' no disponible o no soporta este modelo: {error_str[:200]}")
                                last_error = e
                                break  # Salir del loop de retry y probar siguiente proveedor
                            elif "503" in error_str or "loading" in error_str.lower() or "timeout" in error_str.lower():
                                # Modelo cargándose o timeout, esperar y reintentar
                                wait_time = 2 ** attempt  # Exponential backoff
                                logger.warning(f"Modelo cargándose o timeout, esperando {wait_time}s antes de reintentar...")
                                time.sleep(wait_time)
                                continue
                            elif "401" in error_str or "unauthorized" in error_str.lower():
                                # No autorizado - probablemente falta API key
                                error_msg = "Error 401: No autorizado. Se requiere HUGGINGFACE_API_KEY."
                                error_msg += " Obtén una API key gratuita en: https://huggingface.co/settings/tokens"
                                logger.error(error_msg)
                                raise ValueError(error_msg)
                            elif "429" in error_str or "rate limit" in error_str.lower():
                                # Rate limit, esperar más tiempo
                                wait_time = 5 * (attempt + 1)
                                logger.warning(f"Rate limit alcanzado, esperando {wait_time}s antes de reintentar...")
                                time.sleep(wait_time)
                                continue
                            else:
                                logger.error(f"Error llamando a Hugging Face con proveedor '{provider_name}' (intento {attempt + 1}/{max_retries}): {error_str[:200]}")
                                if attempt == max_retries - 1:
                                    last_error = e
                                    break  # Probar siguiente proveedor
                                time.sleep(1)
                    
                    # Si llegamos aquí, este proveedor no funcionó, probar el siguiente
                    continue
                    
                except Exception as e:
                    error_str = str(e)
                    provider_name = provider if provider else "configuración del usuario (sin especificar)"
                    if ("provider" in error_str.lower() and "not supported" in error_str.lower() or
                        "404" in error_str or "not found" in error_str.lower()):
                        logger.warning(f"Proveedor '{provider_name}' no soportado o modelo no encontrado, probando siguiente...")
                        last_error = e
                        continue
                    else:
                        last_error = e
                        continue
            
            # Si llegamos aquí, ningún proveedor funcionó
            error_msg = f"No se pudo conectar con ningún proveedor disponible. Último error: {last_error}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        else:
            raise ValueError(f"Proveedor no soportado: {self.config.provider}")
    
    def _process_llm_response(self, response: str, aditivos: List[Dict]) -> Dict[str, Any]:
        """Procesa la respuesta del LLM y la estructura."""
        try:
            # Intentar parsear como JSON
            analysis = json.loads(response)
            
            # Agregar información adicional
            analysis["aditivos_analizados"] = len(aditivos)
            analysis["fecha_analisis"] = self._get_current_timestamp()
            
            return analysis
            
        except json.JSONDecodeError:
            # Si no es JSON válido, crear estructura básica
            return {
                "resumen": response[:200] + "..." if len(response) > 200 else response,
                "recomendaciones": ["Revisar manualmente los aditivos detectados"],
                "riesgos": ["Análisis automático no disponible"],
                "analisis_detallado": response,
                "puntuacion_salud": 50,
                "categoria_general": "Desconocido",
                "aditivos_analizados": len(aditivos),
                "fecha_analisis": self._get_current_timestamp(),
                "error": "Respuesta del LLM no pudo ser procesada como JSON"
            }
    
    def _get_current_timestamp(self) -> str:
        """Obtiene timestamp actual."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def _reparar_json_truncado(self, json_str: str) -> str:
        """
        Intenta reparar un JSON truncado o mal formateado.
        
        Args:
            json_str: String JSON potencialmente truncado
            
        Returns:
            String JSON reparado o el original si no se puede reparar
        """
        import re
        
        # Si el JSON parece estar completo, devolverlo tal cual
        try:
            json.loads(json_str)
            return json_str
        except json.JSONDecodeError:
            pass
        
        # Buscar el inicio del JSON (primer {)
        start_idx = json_str.find('{')
        if start_idx == -1:
            return json_str
        
        # Buscar el último objeto completo en el array
        # Intentar encontrar "aditivos_detectados": [
        pattern = r'"aditivos_detectados"\s*:\s*\['
        match = re.search(pattern, json_str)
        if not match:
            return json_str
        
        # Buscar desde el inicio del array hasta el último objeto completo
        array_start = match.end() - 1  # posición del [
        bracket_count = 0
        last_complete_obj_end = array_start
        
        i = array_start
        while i < len(json_str):
            if json_str[i] == '{':
                bracket_count += 1
            elif json_str[i] == '}':
                bracket_count -= 1
                if bracket_count == 0:
                    # Encontramos un objeto completo
                    last_complete_obj_end = i + 1
            elif json_str[i] == ']' and bracket_count == 0:
                # Fin del array
                last_complete_obj_end = i + 1
                break
            i += 1
        
        # Si encontramos objetos completos, cerrar el JSON correctamente
        if last_complete_obj_end > array_start:
            # Extraer la parte válida
            valid_part = json_str[:last_complete_obj_end]
            
            # Cerrar el array y el objeto principal si es necesario
            if not valid_part.rstrip().endswith(']'):
                valid_part += ']'
            if not valid_part.rstrip().endswith('}'):
                valid_part += '}'
            
            return valid_part
        
        return json_str
    
    def get_health_score(self, aditivos: List[Dict]) -> int:
        """
        Calcula una puntuación de salud basada en los aditivos detectados.
        
        Args:
            aditivos: Lista de aditivos detectados
            
        Returns:
            Puntuación de 0-100 (100 = muy saludable, 0 = muy poco saludable)
        """
        if not aditivos:
            return 100
        
        score = 100
        
        for aditivo in aditivos:
            if 'Peligroso' in aditivo['tipo']:
                score -= 20
            elif 'Sospechoso' in aditivo['tipo']:
                score -= 10
            elif 'No nocivo' in aditivo['tipo']:
                score -= 2
        
        return max(0, min(100, score))
    
    def _extraer_e_numeros_directos(self, texto: str) -> List[str]:
        """
        Extrae E-números mencionados directamente en el texto.
        
        Args:
            texto: Texto de ingredientes
            
        Returns:
            Lista de E-números encontrados (formato: E-XXX o E-XXXa)
        """
        # Patrón mejorado para E-números: E-XXX, E-XXXa, E150a, E150, E XXX, etc.
        # Acepta: E-150, E150, E-150a, E150a, E 150, E 150a, etc.
        # También captura en contextos como "Colorante (E122)", "E-122", "E122", etc.
        pattern = r'E[-]?\s*(\d+[a-z]?)'
        matches = re.findall(pattern, texto, re.IGNORECASE)
        # Normalizar formato: E-XXX (número en mayúscula, letra en minúscula si existe)
        e_numeros = []
        for match in matches:
            if match:
                # Separar número y letra opcional
                num_match = re.match(r'(\d+)([a-z]?)', match, re.IGNORECASE)
                if num_match:
                    num = num_match.group(1)
                    letra = num_match.group(2).lower() if num_match.group(2) else ''
                    e_num = f"E-{num}{letra}"
                    e_numeros.append(e_num)
        
        # Eliminar duplicados y ordenar
        e_numeros_unicos = list(set(e_numeros))
        
        # MEJORA: También buscar E-números en contextos comunes como:
        # "Colorante (E122)", "Edulcorante (E955)", "E-122", etc.
        # Esto ayuda a capturar casos donde el E-número está en paréntesis o después de dos puntos
        patrones_contexto = [
            r'\(E[-]?\s*(\d+[a-z]?)\)',  # (E122), (E-122), (E122a)
            r':\s*E[-]?\s*(\d+[a-z]?)',  # : E122, : E-122
            r'E[-]?\s*(\d+[a-z]?)\s*[,\n]',  # E122, o E122\n
        ]
        for patron in patrones_contexto:
            matches_contexto = re.findall(patron, texto, re.IGNORECASE)
            for match in matches_contexto:
                if match:
                    num_match = re.match(r'(\d+)([a-z]?)', match, re.IGNORECASE)
                    if num_match:
                        num = num_match.group(1)
                        letra = num_match.group(2).lower() if num_match.group(2) else ''
                        e_num = f"E-{num}{letra}"
                        if e_num not in e_numeros_unicos:
                            e_numeros_unicos.append(e_num)
        
        return e_numeros_unicos
    
    def detect_additives_in_text(self, texto: str, aditivos_database: List[Dict]) -> List[Dict]:
        """
        Detecta aditivos en un texto usando Claude/LLM comparando con la base de datos.
        Incluye extracción previa de E-números directos para mejorar exhaustividad.
        
        Args:
            texto: Texto de ingredientes a analizar
            aditivos_database: Lista de aditivos de la base de datos (formato aditivos.json)
            
        Returns:
            Lista de aditivos detectados con su información completa
        """
        if not texto or not texto.strip():
            return []
        
        # PASO 1: Extraer E-números mencionados directamente en el texto
        e_numeros_directos = self._extraer_e_numeros_directos(texto)
        aditivos_directos = []
        for e_num in e_numeros_directos:
            # Buscar primero el E-número exacto
            aditivo_completo = next((a for a in aditivos_database if a.get('e_numero', '').upper() == e_num.upper()), None)
            
            # Si no se encuentra y tiene letra (ej: E-472c), buscar la versión base sin letra (E-472)
            if not aditivo_completo and e_num and e_num[-1].isalpha():
                e_num_base = e_num[:-1]  # Quitar la letra (E-472c -> E-472)
                aditivo_completo = next((a for a in aditivos_database if a.get('e_numero', '').upper() == e_num_base.upper()), None)
                if aditivo_completo:
                    # Usar el E-número BASE (E-472) ya que la variante con letra no existe en la BD
                    # Pero mantener referencia al original detectado para evitar duplicados
                    logger.info(f"E-número {e_num} no existe en BD, usando versión base {e_num_base}")
                    e_num = e_num_base  # Usar la versión base que sí existe
            
            if aditivo_completo:
                aditivos_directos.append({
                    'e_numero': e_num.upper(),  # Usar E-número que existe en la BD
                    'aditivo': aditivo_completo,
                    'tipo': aditivo_completo.get('tipo', ''),
                    'origen': aditivo_completo.get('origen', ''),
                    'clasificacion': aditivo_completo.get('clasificacion', ''),
                    'similitud': 1.0,  # Alta confianza para E-números directos
                    'metodo_deteccion': 'e_numero_directo'
                })
        
        logger.info(f"Extraídos {len(aditivos_directos)} aditivos por E-números directos: {[a['e_numero'] for a in aditivos_directos]}")
        
        # Preparar lista de E-números directos ya detectados para el prompt
        e_numeros_directos_lista = [a['e_numero'] for a in aditivos_directos]
        e_numeros_directos_texto = ", ".join(e_numeros_directos_lista) if e_numeros_directos_lista else "ninguno"
        
        # Preparar lista de aditivos con TODOS los nombres posibles para mejor matching
        aditivos_info = []
        for aditivo in aditivos_database:
            # Incluir todos los nombres posibles: nombres_limpios + nombre_original (split por comas)
            nombres = aditivo.get('nombres_limpios', [])
            nombre_original = aditivo.get('nombre_original', '')
            # Dividir nombre_original por comas y agregar cada variante
            if nombre_original:
                nombres_originales = [n.strip().lower() for n in nombre_original.split(',')]
                nombres.extend(nombres_originales)
            
            # Los nombres_limpios ya incluyen todas las variantes necesarias después de la actualización
            # No necesitamos agregar más variantes aquí ya que están en la base de datos
            
            # Eliminar duplicados y mantener orden
            nombres_unicos = []
            for n in nombres:
                n_lower = n.lower().strip()
                if n_lower and n_lower not in [x.lower() for x in nombres_unicos]:
                    nombres_unicos.append(n)
            
            # Obtener E-número
            e_num = aditivo.get('e_numero', '')
            
            aditivos_info.append({
                "e": e_num,
                "n": ", ".join(nombres_unicos[:10]),  # Hasta 10 nombres para mejor matching
                "t": aditivo.get('tipo', ''),
                "o": aditivo.get('origen', ''),
                "c": aditivo.get('clasificacion', '')
            })
        
        # Crear prompt dinámico y genérico para detección inteligente
        # Optimizado para funcionar con cualquier formato de texto de ingredientes
        # Si hay un prompt personalizado, usarlo; si no, usar el por defecto
        if self.custom_prompt_template:
            # Usar prompt personalizado
            prompt = self.custom_prompt_template.format(
                texto=texto,
                e_numeros_directos_texto=e_numeros_directos_texto,
                aditivos_info=json.dumps(aditivos_info, indent=1, ensure_ascii=False)
            )
        else:
            # Usar prompt por defecto (versión generalista y dinámica)
            prompt = f"""Eres un experto en aditivos alimentarios. Analiza el siguiente texto de ingredientes y detecta TODOS los aditivos que aparecen explícitamente, comparándolos con la base de datos proporcionada.

TEXTO DE INGREDIENTES A ANALIZAR:

{texto}

⚠️ E-NÚMEROS YA DETECTADOS DIRECTAMENTE DEL TEXTO (NO LOS INCLUYAS DE NUEVO):

{e_numeros_directos_texto}

Estos E-números ya fueron extraídos directamente del texto y NO deben aparecer en tu respuesta. Si detectas un aditivo que corresponde a uno de estos E-números, NO lo incluyas en tu respuesta.

BASE DE DATOS DE ADITIVOS (lista completa y fija - formato: E-número | nombres/variantes | tipo | origen | clasificación):

{json.dumps(aditivos_info, indent=1, ensure_ascii=False)}

═══════════════════════════════════════════════════════════════════════════════
PRINCIPIOS FUNDAMENTALES DE DETECCIÓN (APLICABLES A TODOS LOS ADITIVOS)
═══════════════════════════════════════════════════════════════════════════════

PRINCIPIO #1: EVIDENCIA TEXTUAL LITERAL (REGLA DE ORO ABSOLUTA)
   - SOLO detecta aditivos cuyo NOMBRE COMPLETO (de la base de datos) aparece LITERALMENTE en el texto
   - O cuyo E-NÚMERO aparece directamente en el texto
   - NO INFIERAS, NO ASUMAS, NO INVENTES, NO ASOCIES
   - Si el nombre NO aparece literalmente → NO lo detectes (es un falso positivo)

PRINCIPIO #2: MATCHING EXACTO CON VARIACIONES VÁLIDAS
   - Compara el texto con los nombres en la base de datos (campo "n" contiene todas las variantes)
   - Acepta variaciones ortográficas: "Glucósidos" = "Glicósidos" (E-960), "Propilenglicol" = "Propilenoglicol" (E-1520)
   - Acepta variaciones de formato: "carbonato de sodio" = "carbonato sódico" = "Carbonato Na" (E-500)
   - Acepta abreviaciones de elementos químicos: "Fe" = "hierro", "Na" = "sodio", "K" = "potasio", "Ca" = "calcio", "Mg" = "magnesio"
   - Acepta variaciones de guiones: "mono-" = "mono" = "mono y" (para E-471: "mono- y diglicéridos" = "mono y diglicéridos")
   - Acepta variaciones de acentos: "ésteres" = "esteres", "óxido" = "oxido", "ácidos" = "acidos"
   - Acepta variaciones de abreviaciones: "oxid." = "oxidado", "sódico" = "de sodio"
   - Normaliza mayúsculas/minúsculas y acentos al comparar
   - PERO: Compuestos diferentes son diferentes: "bicarbonato" ≠ "carbonato", "carotenos" ≠ "carotenoides"

PRINCIPIO #3: DISTINCIÓN INGREDIENTES NATURALES vs ADITIVOS PROCESADOS
   - INGREDIENTES NATURALES/PROCESADOS GENÉRICOS (NO son aditivos a menos que se mencionen explícitamente):
     * Alimentos básicos: cacahuetes, leche, harina, trigo, avena, cacao, azúcar, sal, huevos, frutas, verduras
     * Ingredientes procesados genéricos: "Jarabe de Glucosa", "Harina de Avena", "Aceite Vegetal", "Triglicéridos de Cadena Media"
     * Extractos/concentrados naturales: "Extracto de Cártamo", "Concentrados (Zanahoria, Hibisco)", "Agua"
     * Categorías funcionales genéricas: "Saborizante Natural", "Saborizante", "Emulsionante", "Colorante" (sin especificar)
   
   - REGLA: Si el texto solo menciona ingredientes naturales o categorías genéricas SIN especificar el nombre del aditivo → NO detectes aditivos
   - EJEMPLO: "Saborizante Natural" → NO detectar E-322 (Lecitina) a menos que diga "lecitina"
   - EJEMPLO: "Colorante (Carotenos)" → NO detectar E-160 (Carotenoides) - son diferentes
   - EJEMPLO: "Concentrados (Zanahoria, Hibisco)" → NO detectar E-160, E-163 - son ingredientes naturales

PRINCIPIO #4: PRECISIÓN QUÍMICA (COMPUESTOS DIFERENTES SON DIFERENTES)
   - Los nombres químicos deben coincidir EXACTAMENTE (o ser variaciones válidas reconocidas)
   - "Bicarbonato de sodio" ≠ "Carbonato de sodio" (E-500) - son compuestos diferentes
   - "Carotenos" ≠ "Carotenoides" (E-160) - son compuestos diferentes
   - Los metales importan: "carbonato de sodio" ≠ "carbonato de calcio" ≠ "carbonato de amonio"
   - Los prefijos importan: "mono-" y "di-" indican estructuras diferentes

PRINCIPIO #5: CLASIFICACIONES FUNCIONALES (NO INFERIR POR CATEGORÍAS GENÉRICAS)
   - Si el texto dice "Saborizante Natural" → NO infieras qué aditivos contiene
   - Si el texto dice "Emulsionante" sin especificar → NO infieras E-322 (Lecitina)
   - Si el texto dice "Colorante" sin especificar → NO infieras colorantes específicos
   - Si el texto dice "Conservante" sin especificar → NO infieras conservantes específicos
   - Si el texto dice "Antioxidante" sin especificar → NO infieras antioxidantes específicos
   - Si el texto dice "Estabilizante" sin especificar → NO infieras estabilizantes específicos
   - Si el texto dice "Edulcorante" sin especificar → NO infieras edulcorantes específicos
   - REGLA: Solo detecta si el NOMBRE ESPECÍFICO del aditivo aparece en el texto

PRINCIPIO #6: INGREDIENTES CON COLOR NATURAL (NO SON ADITIVOS E-NÚMERO)
   - Ingredientes naturales con color: "Zanahoria", "Hibisco", "Remolacha", "Cúrcuma", "Cártamo"
   - Estos NO son aditivos E-número a menos que se mencione el nombre específico del aditivo
   - "Zanahoria" → NO detectar E-160 (Carotenoides) a menos que diga "carotenoides"
   - "Cúrcuma" → NO detectar E-100 (Curcumina) a menos que diga "curcumina"
   - "Remolacha" → NO detectar E-162 (Betanina) a menos que diga "betanina"
   - "Hibisco" → NO detectar E-163 (Antocianinas) a menos que diga "antocianinas"

PRINCIPIO #7: INGREDIENTES PROCESADOS GENÉRICOS (NO INFERIR ADITIVOS RELACIONADOS)
   - "Jarabe de Glucosa" → NO contiene E-1400 (Dextrina), E-1200 (Polidextrosa), etc. a menos que se mencionen
   - "Harina de Avena/Trigo" → NO contiene almidones modificados (E-1400, E-1401, E-1402, etc.) a menos que se mencionen
   - "Aceite Vegetal" → NO contiene E-479 (Aceite soja oxid.) a menos que se mencione explícitamente
   - "Triglicéridos de Cadena Media" → NO contienen aditivos procesados a menos que se mencionen
   - REGLA: Solo detecta si el NOMBRE ESPECÍFICO del aditivo aparece en el texto

PRINCIPIO #8: CONSERVANTES Y ANTIOXIDANTES (NO INFERIR SIN EVIDENCIA)
   - Conservantes (E-200, E-201, E-202, E-203, E-210, E-211, E-212, E-213, etc.):
     * Solo detecta si el texto menciona: "ácido sórbico", "sorbato", "ácido benzoico", "benzoato", "conservante" + nombre específico
     * NO infieras conservantes porque "los productos procesados suelen tener conservantes"
     * NO infieras conservantes porque el texto dice "Agua" o ingredientes naturales
   
   - Antioxidantes (E-300, E-301, E-302, E-303, E-304, E-306, E-307, E-308, E-309, etc.):
     * Solo detecta si el texto menciona: "ácido ascórbico", "ascorbato", "tocoferol", "antioxidante" + nombre específico
     * NO infieras antioxidantes sin evidencia textual

PRINCIPIO #9: ESTABILIZANTES/ESPESANTES/ANTIAGLOMERANTES (NO INFERIR SIN EVIDENCIA)
   - Estabilizantes/Espesantes (E-400, E-401, E-402, E-403, E-404, E-405, E-406, E-440, E-422, etc.):
     * Solo detecta si el texto menciona: "ácido algínico", "alginato", "pectina", "glicerina", "glicerol", "estabilizante" + nombre específico, "espesante" + nombre específico
     * NO infieras estabilizantes sin evidencia textual
   
   - Antiaglomerantes (E-500, E-501, E-503, E-504, E-551, E-552, E-553, etc.):
     * Solo detecta si el texto menciona: "carbonato" + metal específico, "dióxido silicio", "sílice", "antiaglomerante" + nombre específico
     * NO infieras antiaglomerantes sin evidencia textual
     * ⚠️ CRÍTICO: "Bicarbonato" ≠ "Carbonato" - E-500 es carbonato, NO bicarbonato

PRINCIPIO #10: EDULCORANTES (NO INFERIR SIN EVIDENCIA)
   - Edulcorantes (E-420, E-950, E-951, E-952, E-953, E-954, E-955, E-957, E-959, E-960, E-965, E-966, E-967, E-968, etc.):
     * Solo detecta si el texto menciona el nombre específico del edulcorante
     * "Sorbitol" → E-420, "Sucralosa" → E-955, "Glicósidos de esteviol"/"Glucósidos de esteviol" → E-960
     * NO infieras edulcorantes sin evidencia textual

PRINCIPIO #11: DISTINCIÓN TÉRMINOS GENÉRICOS vs ESPECÍFICOS (CRÍTICO - EVITA FALSOS POSITIVOS)
   ⚠️ REGLA DE ORO: Si el texto dice un término GENÉRICO, NO detectes aditivos ESPECÍFICOS relacionados
   
   CASOS CRÍTICOS:
   
   1. "ÁCIDOS GRASOS" (término genérico):
      - Si el texto dice SOLO "ácidos grasos" o "ácidos grasos (fuente vegetal)" → DETECTA SOLO E-570 (Ácidos grasos)
      - NO detectes: E-470 (Sales de Ácidos Grasos), E-471 (Mono y Diglicéridos), E-472 (Ésteres), E-473 (Sucroésteres), 
                     E-474 (Sucroglicéridos), E-475 (Ésteres), E-476 (Polirricinoleato), E-477 (Ésteres propano), 
                     E-478 (Lacatato), E-479 (Aceite soja oxid.)
      - SOLO detecta estos si el texto menciona el NOMBRE ESPECÍFICO:
        * "sales de ácidos grasos" → E-470
        * "mono- y diglicéridos de ácidos grasos" o "mono y diglicéridos" → E-471
        * "ésteres de ácidos grasos" → E-472 o E-475 (verificar cuál es más específico)
        * "sucroésteres de ácidos grasos" → E-473
        * "sucroglicéridos de ácidos grasos" → E-474
        * "polirricinoleato de ácidos grasos" o "polirricinoleato de poliglicerol" → E-476
        * "ésteres propano de ácidos grasos" → E-477
        * "lacatato de ácidos grasos" → E-478
        * "aceite soja oxidado" o "aceite de soja oxidado" → E-479
   
   2. "CARBONATO" (término genérico):
      - Si el texto dice SOLO "carbonato" sin especificar metal → NO detectes E-500, E-501, E-503, E-504
      - SOLO detecta si especifica: "carbonato de sodio" → E-500, "carbonato de calcio" → E-170, etc.
   
   3. "ÓXIDO" (término genérico):
      - Si el texto dice SOLO "óxido" sin especificar → NO detectes E-172, E-529, E-530
      - SOLO detecta si especifica: "óxido de hierro" o "óxido de Fe" → E-172, "óxido de Ca" → E-529, "óxido de Mg" → E-530
   
   4. "CITRATO" (término genérico):
      - Si el texto dice SOLO "citrato" sin especificar metal → NO detectes E-331, E-332, E-333
      - SOLO detecta si especifica: "citrato de sodio" → E-331, "citrato de potasio" → E-332, "citrato de calcio" → E-333
   
   REGLA GENERAL: 
   - Término GENÉRICO (ej: "ácidos grasos") → Detecta SOLO el aditivo que se llama exactamente así (E-570)
   - Término ESPECÍFICO (ej: "sales de ácidos grasos") → Detecta el aditivo específico (E-470)
   - NO infieras aditivos específicos desde términos genéricos

═══════════════════════════════════════════════════════════════════════════════
PROCESO DE DETECCIÓN (SIGUE ESTOS PASOS EN ORDEN)
═══════════════════════════════════════════════════════════════════════════════

PASO 1: E-NÚMEROS DIRECTOS (YA PROCESADOS - NO LOS DETECTES)
   - Los E-números mencionados arriba ya fueron extraídos directamente del texto
   - ⚠️ CRÍTICO: NO debes detectar estos E-números de nuevo en tu respuesta
   - ⚠️ CRÍTICO: Si detectas un aditivo por nombre que corresponde a un E-número ya detectado, NO lo incluyas
   - Tu trabajo es detectar SOLO los aditivos que NO tienen E-número explícito en el texto

PASO 2: BÚSQUEDA EXHAUSTIVA DE NOMBRES EN TODO EL TEXTO
   - ⚠️ CRÍTICO: Busca nombres de aditivos en TODO el texto, incluyendo TODAS las secciones de sabores/variantes
   - ⚠️ CRÍTICO: Si el texto tiene múltiples sabores (ej: "Sabor Chocolate: ... Sabor Vanilla: ..."), busca aditivos en TODAS las secciones
   - Los aditivos pueden aparecer de múltiples formas:
     * Después de categorías funcionales: "emulsionantes (lecitina)", "edulcorantes (sucralosa)", "colorantes (E150a)"
     * Dentro de paréntesis: "(lecitina de soja)", "(propilenglicol)", "(ácido cítrico)"
     * Mencionados directamente: "Sucralosa", "Lecitina", "Propilenglicol", "Ácido Cítrico"
     * En listas de ingredientes: "Ingredientes: azúcar, lecitina, sucralosa"
     * Con o sin categoría funcional: "lecitina de soja" o "emulsionante: lecitina de soja"
     * En cualquier sección de sabor: "Sabor X: ... Edulcorante (Sucralosa) ..." → detecta E-955
   - Examina TODO el texto, no solo paréntesis, no solo una sección
   - Compara cada palabra/frase con los nombres en la base de datos (campo "n")

PASO 3: MATCHING CON LA BASE DE DATOS
   - Para cada aditivo en la base de datos, verifica si ALGÚN nombre (del campo "n") aparece en el texto
   - Normaliza mayúsculas/minúsculas y acentos al comparar
   - Acepta variaciones ortográficas válidas (ej: "Glucósidos" = "Glicósidos" para E-960)
   - Acepta variaciones de formato (ej: "carbonato de sodio" = "carbonato sódico" = "Carbonato Na")
   - PERO: Compuestos diferentes son diferentes: "bicarbonato" ≠ "carbonato", "carotenos" ≠ "carotenoides"

PASO 4: VALIDACIÓN OBLIGATORIA ANTES DE DETECTAR
   Para CADA aditivo que consideres detectar, verifica:
   a) ¿El nombre del aditivo (o variante reconocida) aparece LITERALMENTE en el texto?
   b) ¿O el E-número aparece directamente en el texto?
   c) Si NO aparece literalmente → NO lo detectes (es un falso positivo)
   d) ¿Estás infiriendo por categorías funcionales genéricas? → NO lo detectes
   e) ¿Estás infiriendo por ingredientes relacionados? → NO lo detectes
   f) ¿Estás infiriendo por conocimiento general? → NO lo detectes

═══════════════════════════════════════════════════════════════════════════════
EJEMPLOS DE DETECCIÓN CORRECTA vs INCORRECTA
═══════════════════════════════════════════════════════════════════════════════

✅ DETECCIÓN CORRECTA (el nombre aparece literalmente):
   - "Edulcorante (Sucralosa)" → "Sucralosa" aparece → SÍ detectar E-955
   - "Emulsionante (Lecitina de Soja)" → "Lecitina de Soja" aparece → SÍ detectar E-322
   - "Regulador de Acidez (Ácido Cítrico)" → "Ácido Cítrico" aparece → SÍ detectar E-330
   - "Colorante (Curcumina)" → "Curcumina" aparece → SÍ detectar E-100
   - "Colorante (Dióxido de Titanio)" → "Dióxido de Titanio" aparece → SÍ detectar E-171
   - "E150" o "E-150" aparece → SÍ detectar E-150
   - "Edulcorante (Glucósidos De Steviol)" → "Glucósidos De Steviol" aparece → SÍ detectar E-960 (variación ortográfica válida)

❌ DETECCIÓN INCORRECTA (falsos positivos - NO detectes):
   - "Cacahuetes (100%)" → NO aparece ningún nombre/E-número → {{"aditivos_detectados": []}}
   - "Saborizante Natural" → NO menciona "lecitina" → NO detectar E-322
   - "Colorante (Carotenos)" → NO menciona "Carotenoides" → NO detectar E-160 ("Carotenos" ≠ "Carotenoides")
   - "Concentrados (Zanahoria, Hibisco)" → NO menciona aditivos específicos → NO detectar E-160, E-163
   - "Colorante (Rojo Remolacha)" → NO menciona "Betanina" → NO detectar E-162
   - "Jarabe de Glucosa" → NO menciona "Dextrina" → NO detectar E-1400
   - "Agua" → NO menciona conservantes → NO detectar E-200, E-201, E-202, E-203, E-210, E-211, E-212, E-213
   - "Saborizante Natural" → NO menciona antioxidantes → NO detectar E-300, E-301, E-302, etc.
   - "Emulsionante" sin especificar → NO menciona "lecitina" → NO detectar E-322
   - "Estabilizante" sin especificar → NO menciona estabilizantes específicos → NO detectar E-400, E-440, E-422
   - "Antiaglomerante" sin especificar → NO menciona antiaglomerantes específicos → NO detectar E-500, E-551
   - "Edulcorante" sin especificar → NO menciona edulcorantes específicos → NO detectar E-420, E-955, E-960
   - "Bicarbonato de Sodio" → NO es E-500 (que es carbonato de sodio) → NO detectar E-500
   - "ácidos grasos (fuente vegetal)" → Término genérico → DETECTA SOLO E-570, NO E-470, E-471, E-472, E-475, E-476, E-477, E-478
   - "antiaglomerantes [dióxido de silicio, ácidos grasos (fuente vegetal)]" → "ácidos grasos" es genérico → DETECTA E-570 y E-551, NO E-470, E-471, E-472, etc.
   - "sales de ácidos grasos" → Término específico → SÍ detectar E-470
   - "mono y diglicéridos de ácidos grasos" → Término específico → SÍ detectar E-471

═══════════════════════════════════════════════════════════════════════════════
REGLA FINAL ABSOLUTA
═══════════════════════════════════════════════════════════════════════════════

- PRECISIÓN > EXHAUSTIVIDAD: Si hay CUALQUIER duda, NO detectes el aditivo
- La base de datos de aditivos es FIJA y COMPLETA - solo busca aditivos que estén en esa lista
- Si el texto solo contiene ingredientes naturales sin aditivos mencionados → retorna: {{"aditivos_detectados": []}}
- NO inventes aditivos que no están en el texto
- NO asumas que ingredientes naturales contienen aditivos
- NO infieras aditivos por categorías funcionales genéricas
- NO infieras aditivos por ingredientes relacionados
- NO infieras aditivos por conocimiento general
- ⚠️ CRÍTICO: NO infieras aditivos específicos desde términos genéricos (ej: "ácidos grasos" → SOLO E-570, NO E-470, E-471, etc.)
- PERO: Si un aditivo de la base de datos aparece en el texto (en cualquier formato válido), DETECTALO

FORMATO DE RESPUESTA (JSON):
{{
    "aditivos_detectados": [
        {{
            "e_numero": "E-XXX" o "E-XXXa" (MANTÉN la letra si aparece en el texto: E150a → "E-150a", NO "E-150"),
            "nombre_original": "Nombre del aditivo de la base de datos",
            "tipo": "No nocivo/Sospechoso/¡Peligroso!",
            "origen": "Origen del aditivo",
            "clasificacion": "Clasificación del aditivo",
            "confianza": "alta"
        }}
    ]
}}

⚠️ RECORDATORIO CRÍTICO SOBRE E-NÚMEROS CON LETRAS:
- Si el texto dice "E150a" y NO está en la lista de ya detectados → devuelve "e_numero": "E-150a" (CON la letra)
- Si el texto dice "E472c" y NO está en la lista de ya detectados → devuelve "e_numero": "E-472c" (CON la letra)
- Si el texto dice "E150" y NO está en la lista de ya detectados → devuelve "e_numero": "E-150" (SIN letra)
- NUNCA elimines la letra de un E-número que aparece en el texto original
- PERO: Si un E-número YA está en la lista de detectados, NO lo incluyas en tu respuesta

Responde SOLO con el JSON, sin explicaciones adicionales."""
        
        try:
            response = self._get_llm_response(prompt)
            
            # Limpiar respuesta: eliminar markdown code blocks si existen
            response_clean = response.strip()
            if response_clean.startswith('```'):
                # Extraer JSON de code block
                lines = response_clean.split('\n')
                start_idx = 1 if lines[0].startswith('```') else 0
                end_idx = len(lines) - 1 if lines[-1].startswith('```') else len(lines)
                response_clean = '\n'.join(lines[start_idx:end_idx])
            
            # Intentar reparar JSON truncado
            response_clean = self._reparar_json_truncado(response_clean)
            
            # Procesar respuesta
            try:
                result = json.loads(response_clean)
                aditivos_detectados = result.get('aditivos_detectados', [])
                
                # Si la respuesta no tiene el formato esperado, intentar extraer directamente
                if not aditivos_detectados and isinstance(result, list):
                    aditivos_detectados = result
                
                # DEBUG: Log temporal
                logger.info(f"LLM devolvió {len(aditivos_detectados)} aditivos")
                if aditivos_detectados:
                    for a in aditivos_detectados[:5]:  # Primeros 5
                        logger.info(f"  - {a.get('e_numero', 'N/A')}: {a.get('nombre', 'N/A')}")
                
                # Función helper para verificar si dos E-números son variantes del mismo aditivo base
                def son_variantes_mismo_aditivo(e1: str, e2: str) -> bool:
                    """Verifica si dos E-números son variantes del mismo aditivo (ej: E-150a y E-150)"""
                    e1_clean = e1.upper().replace('E-', '').replace('E', '')
                    e2_clean = e2.upper().replace('E-', '').replace('E', '')
                    
                    # Extraer número base (sin letra)
                    match1 = re.match(r'(\d+)([a-z]?)', e1_clean, re.IGNORECASE)
                    match2 = re.match(r'(\d+)([a-z]?)', e2_clean, re.IGNORECASE)
                    
                    if match1 and match2:
                        num1 = match1.group(1)
                        num2 = match2.group(1)
                        # Si los números base son iguales, son variantes del mismo aditivo
                        return num1 == num2
                    return False
                
                # Convertir al formato esperado y eliminar duplicados
                aditivos_formateados = []
                e_numeros_vistos = set()  # Para evitar duplicados
                e_numeros_directos_map = {}  # Mapeo de E-números directos detectados
                
                # Primero agregar aditivos detectados por E-números directos (ya procesados)
                for aditivo_directo in aditivos_directos:
                    e_num = aditivo_directo['e_numero']
                    if e_num not in e_numeros_vistos:
                        e_numeros_vistos.add(e_num)
                        aditivos_formateados.append(aditivo_directo)
                        # Guardar también la versión base (sin letra) para comparación
                        match = re.match(r'E-(\d+)([a-z]?)', e_num.upper())
                        if match:
                            num_base = match.group(1)
                            e_num_base = f"E-{num_base}"
                            e_numeros_directos_map[e_num_base] = e_num  # Mapeo: E-150 -> E-150a
                
                # Luego agregar aditivos detectados por el LLM
                for aditivo_llm in aditivos_detectados:
                    # Buscar el aditivo completo en la base de datos
                    e_num = aditivo_llm.get('e_numero', '')
                    if not e_num:
                        continue
                    
                    # Normalizar E-número
                    e_num = e_num.upper().strip()
                    if not e_num.startswith('E-'):
                        e_num = f"E-{e_num.replace('E', '').replace('-', '').strip()}"
                    
                    # Verificar si ya fue detectado exactamente por E-número directo
                    if e_num in e_numeros_vistos:
                        continue
                    
                    # Verificar si es una variante de un E-número directo ya detectado
                    # (ej: LLM devuelve "E-150" pero ya detectamos "E-150a", o viceversa)
                    es_variante = False
                    e_num_directo_variante = None
                    for e_num_visto in e_numeros_vistos:
                        if son_variantes_mismo_aditivo(e_num, e_num_visto):
                            es_variante = True
                            e_num_directo_variante = e_num_visto
                            break
                    
                    # Si es variante de un E-número directo, usar el directo (más específico) y saltar este
                    # Priorizar siempre el E-número directo extraído del texto sobre el del LLM
                    if es_variante:
                        logger.info(f"E-número del LLM '{e_num}' es variante de E-número directo '{e_num_directo_variante}', omitiendo el del LLM y usando el directo")
                        continue
                    
                    # También verificar si el E-número base (sin letra) coincide con un E-número directo que tiene letra
                    # Ej: LLM devuelve "E-150" pero ya detectamos "E-150a" directamente
                    match_e_num = re.match(r'E-(\d+)([a-z]?)', e_num.upper())
                    if match_e_num:
                        num_base = match_e_num.group(1)
                        e_num_base_sin_letra = f"E-{num_base}"
                        # Verificar si hay un E-número directo que es variante de este
                        for e_num_visto in e_numeros_vistos:
                            if son_variantes_mismo_aditivo(e_num_base_sin_letra, e_num_visto):
                                logger.info(f"E-número del LLM '{e_num}' es variante base de E-número directo '{e_num_visto}', omitiendo el del LLM")
                                es_variante = True
                                break
                        if es_variante:
                            continue
                    
                    e_numeros_vistos.add(e_num)
                    aditivo_completo = next((a for a in aditivos_database if a.get('e_numero', '').upper() == e_num.upper()), None)
                    
                    if aditivo_completo:
                        # VALIDACIÓN POST-PROCESAMIENTO: Verificar que el nombre del aditivo aparezca literalmente en el texto
                        # EXCEPCIÓN: Si el E-número fue detectado directamente del texto (ya está en aditivos_directos), 
                        # no requiere validación de nombre porque el E-número mismo es evidencia suficiente
                        e_num_detectado_directo = any(a['e_numero'].upper() == e_num.upper() for a in aditivos_directos)
                        e_num_base_detectado = False
                        # Verificar si es variante de un E-número directo detectado
                        match_e_num = re.match(r'E-(\d+)([a-z]?)', e_num.upper())
                        if match_e_num:
                            num_base = match_e_num.group(1)
                            e_num_base = f"E-{num_base}"
                            e_num_base_detectado = any(a['e_numero'].upper() == e_num_base.upper() for a in aditivos_directos)
                        
                        # Preparar variables para validaciones
                        texto_lower_validation = texto.lower()
                        texto_sin_acentos_validation = ''.join(c for c in unicodedata.normalize('NFD', texto_lower_validation) if unicodedata.category(c) != 'Mn')
                        
                        # VALIDACIONES ESPECÍFICAS PRIMERO (tienen prioridad sobre validación general)
                        # Estas validaciones rechazan falsos positivos conocidos ANTES de validar nombres
                        
                        # Caso 1: E-160 (Carotenoides) - NO detectar si solo dice "Carotenos" (sin "oides")
                        if e_num.upper() == 'E-160':
                            if 'carotenoides' not in texto_lower_validation and 'carotenoides' not in texto_sin_acentos_validation:
                                # Verificar si dice "carotenos" (sin "oides") - esto es diferente
                                if 'carotenos' in texto_lower_validation or 'carotenos' in texto_sin_acentos_validation:
                                    logger.warning(f"E-160 (Carotenoides) rechazado: el texto dice 'Carotenos' pero NO 'Carotenoides'. Son compuestos diferentes.")
                                    continue
                                # Verificar si solo menciona ingredientes naturales con color
                                ingredientes_naturales_color = ['zanahoria', 'hibisco', 'remolacha', 'cúrcuma', 'cártamo']
                                if any(ing in texto_lower_validation for ing in ingredientes_naturales_color):
                                    if 'carotenoides' not in texto_lower_validation:
                                        logger.warning(f"E-160 (Carotenoides) rechazado: solo menciona ingredientes naturales con color, no el aditivo específico.")
                                        continue
                        
                        # Caso 2: E-322 (Lecitina) - NO detectar si solo dice "Saborizante Natural" o "Saborizante" sin mencionar lecitina
                        if e_num.upper() == 'E-322':
                            if 'lecitina' not in texto_lower_validation and 'lecitina' not in texto_sin_acentos_validation:
                                # Verificar si solo dice categorías genéricas
                                categorias_genericas = ['saborizante natural', 'saborizante', 'emulsionante']
                                if any(cat in texto_lower_validation for cat in categorias_genericas):
                                    logger.warning(f"E-322 (Lecitina) rechazado: solo menciona categorías genéricas sin especificar 'lecitina'.")
                                    continue
                        
                        # Si fue detectado directamente (o es variante de uno detectado), no requiere validación de nombre
                        if e_num_detectado_directo or e_num_base_detectado:
                            nombre_encontrado = True
                        else:
                            # Solo validar nombre si NO fue detectado directamente
                            nombres_aditivo = aditivos_database[aditivos_database.index(aditivo_completo)].get('nombres_limpios', [])
                            nombre_original = aditivos_database[aditivos_database.index(aditivo_completo)].get('nombre_original', '')
                            
                            # Agregar variantes del nombre original (split por comas)
                            if nombre_original:
                                nombres_originales = [n.strip().lower() for n in nombre_original.split(',')]
                                nombres_aditivo.extend(nombres_originales)
                            
                            # Normalizar texto para búsqueda (sin acentos, minúsculas)
                            texto_normalizado = texto_lower_validation
                            texto_sin_acentos = texto_sin_acentos_validation
                            
                            # Aplicar equivalencias químicas al texto (Fe=hierro, Na=sodio, etc.)
                            texto_con_equivalencias = texto_normalizado
                            equivalencias_quimicas = {
                                ' fe ': ' hierro ', ' fe,': ' hierro,', ' fe.': ' hierro.', ' fe)': ' hierro)',
                                ' na ': ' sodio ', ' na,': ' sodio,', ' na.': ' sodio.', ' na)': ' sodio)',
                                ' k ': ' potasio ', ' k,': ' potasio,', ' k.': ' potasio.', ' k)': ' potasio)',
                                ' ca ': ' calcio ', ' ca,': ' calcio,', ' ca.': ' calcio.', ' ca)': ' calcio)',
                                ' mg ': ' magnesio ', ' mg,': ' magnesio,', ' mg.': ' magnesio.', ' mg)': ' magnesio)',
                            }
                            for abrev, completo in equivalencias_quimicas.items():
                                texto_con_equivalencias = texto_con_equivalencias.replace(abrev, completo)
                            
                            # Verificar si algún nombre del aditivo aparece en el texto
                            nombre_encontrado = False
                            
                            # VALIDACIONES ESPECÍFICAS PARA MEJORAR RECALL (ANTES de validación general)
                            # Estas validaciones FUERZAN la detección de aditivos problemáticos cuando aparecen en el texto
                            
                            # Caso ESPECIAL 1: E-122 (Azorrubina/Carmoisina) - CRÍTICO: Mejorar recall
                            if e_num.upper() == 'E-122':
                                # Variantes completas incluyendo todas las formas conocidas
                                variantes_e122 = [
                                    'e122', 'e-122', 'e 122', 'carmoisina', 'azorrubina', 'azorubina',
                                    'red 3', 'red3', 'red#3', 'c.i. 14720', 'c.i.14720', 'ci 14720', 'ci14720',
                                    'ci.14720', 'acid red 14', 'acidred14', 'brillantcarmoisin o', 'brillantcarmoisino',
                                    'azorubina s', 'azorubinas', 'carmoisine', 'carmoisin'
                                ]
                                encontrado_e122 = False
                                for variante in variantes_e122:
                                    if variante in texto_lower_validation or variante in texto_sin_acentos_validation:
                                        encontrado_e122 = True
                                        break
                                # También buscar como E-número directo en múltiples contextos
                                if (re.search(r'E[-]?\s*122\b', texto, re.IGNORECASE) or
                                    re.search(r'\(E[-]?\s*122\)', texto, re.IGNORECASE) or
                                    re.search(r':\s*E[-]?\s*122', texto, re.IGNORECASE)):
                                    encontrado_e122 = True
                                # Buscar variantes de "Red 3" y "C.I. 14720" con diferentes formatos
                                if (re.search(r'\bred\s*3\b', texto, re.IGNORECASE) or
                                    re.search(r'\bred#3\b', texto, re.IGNORECASE) or
                                    re.search(r'c\.?i\.?\s*14720', texto, re.IGNORECASE) or
                                    re.search(r'ci\.?\s*14720', texto, re.IGNORECASE)):
                                    encontrado_e122 = True
                                if encontrado_e122:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-122 (Azorrubina/Carmoisina) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 2: E-955 (Sucralosa) - CRÍTICO: Mejorar recall
                            if e_num.upper() == 'E-955' and not nombre_encontrado:
                                variantes_e955 = ['sucralosa', 'e955', 'e-955']
                                encontrado_e955 = False
                                for variante in variantes_e955:
                                    if variante in texto_lower_validation or variante in texto_sin_acentos_validation:
                                        encontrado_e955 = True
                                        break
                                # También buscar como palabra completa
                                if re.search(r'\bsucralosa\b', texto, re.IGNORECASE):
                                    encontrado_e955 = True
                                if encontrado_e955:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-955 (Sucralosa) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 3: E-479 (Aceite soja oxidado) - CRÍTICO: Mejorar recall
                            if e_num.upper() == 'E-479' and not nombre_encontrado:
                                variantes_e479 = [
                                    'aceite soja oxidado', 'aceite de soja oxidado', 'aceite soja oxid.',
                                    'aceite de soja oxid.', 'aceite soja oxidado', 'aceite soja oxidado'
                                ]
                                encontrado_e479 = False
                                for variante in variantes_e479:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e479 = True
                                        break
                                # También buscar palabras clave: "aceite" + "soja" + "oxidado/oxid."
                                if 'aceite' in texto_lower_validation and 'soja' in texto_lower_validation:
                                    if 'oxidado' in texto_lower_validation or 'oxid.' in texto_lower_validation or 'oxidado' in texto_sin_acentos_validation or 'oxid' in texto_sin_acentos_validation:
                                        encontrado_e479 = True
                                if encontrado_e479:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-479 (Aceite soja oxidado) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 4: E-500 (Carbonato Na) - Mejorar recall
                            if e_num.upper() == 'E-500' and not nombre_encontrado:
                                variantes_e500 = [
                                    'carbonato de sodio', 'carbonato sódico', 'carbonato sodico', 
                                    'carbonatos de sodio', 'carbonato na', 'carbonato de na'
                                ]
                                encontrado_e500 = False
                                for variante in variantes_e500:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e500 = True
                                        break
                                # También buscar con equivalencias químicas
                                if 'carbonato' in texto_lower_validation and ('sodio' in texto_lower_validation or 'na' in texto_lower_validation or 'sodico' in texto_sin_acentos_validation):
                                    encontrado_e500 = True
                                if encontrado_e500:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-500 (Carbonato Na) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 5: E-529 (Óxido de Ca) - Mejorar recall
                            if e_num.upper() == 'E-529' and not nombre_encontrado:
                                variantes_e529 = ['óxido de calcio', 'oxido de calcio', 'óxido de ca', 'oxido de ca', 'óxido ca', 'oxido ca']
                                encontrado_e529 = False
                                for variante in variantes_e529:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e529 = True
                                        break
                                # También buscar con equivalencias químicas
                                if 'oxido' in texto_sin_acentos_validation and ('calcio' in texto_lower_validation or 'ca' in texto_lower_validation):
                                    encontrado_e529 = True
                                if encontrado_e529:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-529 (Óxido de Ca) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 6: E-530 (Óxido Mg) - Mejorar recall
                            if e_num.upper() == 'E-530' and not nombre_encontrado:
                                variantes_e530 = ['óxido de magnesio', 'oxido de magnesio', 'óxido de mg', 'oxido de mg', 'óxido mg', 'oxido mg']
                                encontrado_e530 = False
                                for variante in variantes_e530:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e530 = True
                                        break
                                # También buscar con equivalencias químicas
                                if 'oxido' in texto_sin_acentos_validation and ('magnesio' in texto_lower_validation or 'mg' in texto_lower_validation):
                                    encontrado_e530 = True
                                if encontrado_e530:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-530 (Óxido Mg) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 7: E-551 (Dióxido Silicio) - Mejorar recall
                            if e_num.upper() == 'E-551' and not nombre_encontrado:
                                variantes_e551 = [
                                    'dióxido de silicio', 'dioxido de silicio', 'dióxido silicio', 
                                    'dioxido silicio', 'dióxido de sílice', 'dioxido de silice'
                                ]
                                encontrado_e551 = False
                                for variante in variantes_e551:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e551 = True
                                        break
                                # También buscar palabras clave
                                if ('dioxido' in texto_sin_acentos_validation or 'dióxido' in texto_lower_validation) and ('silicio' in texto_lower_validation or 'silice' in texto_sin_acentos_validation):
                                    encontrado_e551 = True
                                if encontrado_e551:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-551 (Dióxido Silicio) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 8: E-172 (Óxido de hierro) - Mejorar recall
                            if e_num.upper() == 'E-172' and not nombre_encontrado:
                                variantes_e172 = ['óxido de hierro', 'oxido de hierro', 'óxido de fe', 'oxido de fe', 'óxido hierro', 'oxido hierro', 'óxido fe', 'oxido fe']
                                encontrado_e172 = False
                                for variante in variantes_e172:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e172 = True
                                        break
                                # También buscar con equivalencias químicas
                                if 'oxido' in texto_sin_acentos_validation and ('hierro' in texto_lower_validation or ' fe ' in texto_lower_validation):
                                    encontrado_e172 = True
                                if encontrado_e172:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-172 (Óxido de hierro) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 9: E-570 (Ácidos grasos) - Mejorar recall cuando aparece término genérico
                            if e_num.upper() == 'E-570' and not nombre_encontrado:
                                terminos_e570 = ['ácidos grasos', 'acidos grasos']
                                encontrado_e570 = False
                                for term in terminos_e570:
                                    if term in texto_lower_validation or term in texto_sin_acentos_validation:
                                        encontrado_e570 = True
                                        break
                                # También buscar en contextos como "antiaglomerantes [ácidos grasos (fuente vegetal)]"
                                if 'acidos grasos' in texto_sin_acentos_validation:
                                    encontrado_e570 = True
                                if encontrado_e570:
                                    nombre_encontrado = True  # Forzar aceptación
                                    logger.info(f"E-570 (Ácidos grasos) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 10: Ácidos grasos específicos - Mejorar recall cuando aparecen términos específicos
                            # Si aparece un término específico (ej: "sales magnésicas de ácidos grasos"), detectar el E-número correspondiente
                            if e_num.upper() == 'E-470B' and not nombre_encontrado:
                                # Buscar "sales magnésicas de ácidos grasos" o variantes
                                terminos_e470b = [
                                    'sales magnésicas de ácidos grasos', 'sales de magnesio de ácidos grasos',
                                    'sales magnesicas de acidos grasos', 'sales de magnesio de acidos grasos'
                                ]
                                for term in terminos_e470b:
                                    term_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', term) if unicodedata.category(c) != 'Mn')
                                    if term in texto_lower_validation or term_sin_acentos in texto_sin_acentos_validation:
                                        nombre_encontrado = True
                                        logger.info(f"E-470B detectado por término específico: '{term}'")
                                        break
                            
                            if e_num.upper() == 'E-471' and not nombre_encontrado:
                                # Buscar "mono y diglicéridos" o variantes
                                terminos_e471 = [
                                    'mono y diglicéridos', 'mono- y diglicéridos', 'mono y digliceridos',
                                    'mono-diglicéridos', 'monoglicéridos y diglicéridos', 'mono y di-glicéridos'
                                ]
                                for term in terminos_e471:
                                    term_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', term) if unicodedata.category(c) != 'Mn')
                                    if term in texto_lower_validation or term_sin_acentos in texto_sin_acentos_validation:
                                        nombre_encontrado = True
                                        logger.info(f"E-471 detectado por término específico: '{term}'")
                                        break
                            
                            if e_num.upper() == 'E-470' and not nombre_encontrado:
                                # Buscar "sales de ácidos grasos" (sin especificar metal)
                                terminos_e470 = ['sales de ácidos grasos', 'sales de acidos grasos']
                                for term in terminos_e470:
                                    term_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', term) if unicodedata.category(c) != 'Mn')
                                    if term in texto_lower_validation or term_sin_acentos in texto_sin_acentos_validation:
                                        nombre_encontrado = True
                                        logger.info(f"E-470 detectado por término específico: '{term}'")
                                        break
                            
                            # Caso ESPECIAL 11: E-965 (Maltitol) - Mejorar recall
                            if e_num.upper() == 'E-965' and not nombre_encontrado:
                                variantes_e965 = ['maltitol', 'e965', 'e-965']
                                encontrado_e965 = False
                                for variante in variantes_e965:
                                    if variante in texto_lower_validation or variante in texto_sin_acentos_validation:
                                        encontrado_e965 = True
                                        break
                                # También buscar como palabra completa
                                if re.search(r'\bmaltitol\b', texto, re.IGNORECASE):
                                    encontrado_e965 = True
                                if encontrado_e965:
                                    nombre_encontrado = True
                                    logger.info(f"E-965 (Maltitol) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 12: E-330 (Ácido cítrico) - Mejorar recall
                            if e_num.upper() == 'E-330' and not nombre_encontrado:
                                variantes_e330 = ['ácido cítrico', 'acido citrico', 'ácido citrico', 'acido cítrico']
                                encontrado_e330 = False
                                for variante in variantes_e330:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e330 = True
                                        break
                                # También buscar palabras clave
                                if 'acido' in texto_sin_acentos_validation and 'citrico' in texto_sin_acentos_validation:
                                    encontrado_e330 = True
                                if encontrado_e330:
                                    nombre_encontrado = True
                                    logger.info(f"E-330 (Ácido cítrico) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 13: E-440 (Pectina) - Mejorar recall
                            if e_num.upper() == 'E-440' and not nombre_encontrado:
                                variantes_e440 = ['pectina', 'pectinas', 'e440', 'e-440']
                                encontrado_e440 = False
                                for variante in variantes_e440:
                                    if variante in texto_lower_validation or variante in texto_sin_acentos_validation:
                                        encontrado_e440 = True
                                        break
                                # También buscar como palabra completa
                                if re.search(r'\bpectina[s]?\b', texto, re.IGNORECASE):
                                    encontrado_e440 = True
                                if encontrado_e440:
                                    nombre_encontrado = True
                                    logger.info(f"E-440 (Pectina) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 14: E-150 (Caramelo) - Mejorar recall
                            if e_num.upper() == 'E-150' and not nombre_encontrado:
                                variantes_e150 = ['caramelo', 'e150', 'e-150', 'e150a', 'e-150a', 'e150b', 'e-150b', 'e150c', 'e-150c', 'e150d', 'e-150d']
                                encontrado_e150 = False
                                for variante in variantes_e150:
                                    if variante in texto_lower_validation or variante in texto_sin_acentos_validation:
                                        encontrado_e150 = True
                                        break
                                # También buscar como E-número directo
                                if re.search(r'E[-]?\s*150[a-d]?\b', texto, re.IGNORECASE):
                                    encontrado_e150 = True
                                if encontrado_e150:
                                    nombre_encontrado = True
                                    logger.info(f"E-150 (Caramelo) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 15: E-322 (Lecitina) - Mejorar recall
                            if e_num.upper() == 'E-322' and not nombre_encontrado:
                                variantes_e322 = ['lecitina', 'e322', 'e-322']
                                encontrado_e322 = False
                                for variante in variantes_e322:
                                    if variante in texto_lower_validation or variante in texto_sin_acentos_validation:
                                        encontrado_e322 = True
                                        break
                                # También buscar como palabra completa
                                if re.search(r'\blecitina\b', texto, re.IGNORECASE):
                                    encontrado_e322 = True
                                if encontrado_e322:
                                    nombre_encontrado = True
                                    logger.info(f"E-322 (Lecitina) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 16: E-170 (Carbonato de calcio) - Mejorar recall
                            if e_num.upper() == 'E-170' and not nombre_encontrado:
                                variantes_e170 = [
                                    'carbonato de calcio', 'carbonato cálcico', 'carbonato calcico',
                                    'carbonato ca', 'carbonato de ca'
                                ]
                                encontrado_e170 = False
                                for variante in variantes_e170:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e170 = True
                                        break
                                # También buscar con equivalencias químicas
                                if 'carbonato' in texto_lower_validation and ('calcio' in texto_lower_validation or 'calcico' in texto_sin_acentos_validation or 'ca' in texto_lower_validation):
                                    encontrado_e170 = True
                                if encontrado_e170:
                                    nombre_encontrado = True
                                    logger.info(f"E-170 (Carbonato de calcio) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 18: E-460 (Celulosa) - Mejorar recall
                            if e_num.upper() == 'E-460' and not nombre_encontrado:
                                # Variantes comunes de celulosa
                                variantes_e460 = [
                                    'celulosa', 'e460', 'e-460', 'celulosa microcristalina', 
                                    'microcristalina', 'celulosa en polvo', 'celulosa vegetal'
                                ]
                                encontrado_e460 = False
                                for variante in variantes_e460:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e460 = True
                                        break
                                # Buscar como palabra completa (evitar falsos positivos con "celulósico", etc.)
                                if re.search(r'\bcelulosa\b', texto, re.IGNORECASE):
                                    encontrado_e460 = True
                                # Buscar en contextos como "agente de carga (celulosa microcristalina)"
                                if 'celulosa' in texto_lower_validation and ('microcristalina' in texto_lower_validation or 'agente de carga' in texto_lower_validation):
                                    encontrado_e460 = True
                                if encontrado_e460:
                                    nombre_encontrado = True
                                    logger.info(f"E-460 (Celulosa) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 19: E-461 (Metil celulosa) - Mejorar recall
                            if e_num.upper() == 'E-461' and not nombre_encontrado:
                                # Variantes comunes de metil celulosa
                                variantes_e461 = [
                                    'metil celulosa', 'metilcelulosa', 'e461', 'e-461'
                                ]
                                encontrado_e461 = False
                                for variante in variantes_e461:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e461 = True
                                        break
                                # Buscar palabras clave: "metil" + "celulosa"
                                if 'metil' in texto_lower_validation and 'celulosa' in texto_lower_validation:
                                    encontrado_e461 = True
                                if encontrado_e461:
                                    nombre_encontrado = True
                                    logger.info(f"E-461 (Metil celulosa) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 20: E-462 (Etilcelulosa) - Mejorar recall
                            if e_num.upper() == 'E-462' and not nombre_encontrado:
                                # Variantes comunes de etilcelulosa
                                variantes_e462 = [
                                    'etilcelulosa', 'etil celulosa', 'e462', 'e-462'
                                ]
                                encontrado_e462 = False
                                for variante in variantes_e462:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e462 = True
                                        break
                                # Buscar palabras clave: "etil" + "celulosa"
                                if 'etil' in texto_lower_validation and 'celulosa' in texto_lower_validation:
                                    encontrado_e462 = True
                                if encontrado_e462:
                                    nombre_encontrado = True
                                    logger.info(f"E-462 (Etilcelulosa) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 21: E-473 (Sucroésteres de Ácidos Grasos) - Mejorar recall
                            if e_num.upper() == 'E-473' and not nombre_encontrado:
                                # Variantes comunes
                                variantes_e473 = [
                                    'sucroésteres de ácidos grasos', 'sucroesteres de acidos grasos',
                                    'sucroésteres', 'sucroesteres', 'e473', 'e-473'
                                ]
                                encontrado_e473 = False
                                for variante in variantes_e473:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e473 = True
                                        break
                                # Buscar palabras clave: "sucroésteres" o "sucroesteres"
                                if 'sucroesteres' in texto_sin_acentos_validation or 'sucroésteres' in texto_lower_validation:
                                    encontrado_e473 = True
                                if encontrado_e473:
                                    nombre_encontrado = True
                                    logger.info(f"E-473 (Sucroésteres) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 22: E-474 (Sucroglicéridos de Ácidos Grasos) - Mejorar recall
                            if e_num.upper() == 'E-474' and not nombre_encontrado:
                                # Variantes comunes
                                variantes_e474 = [
                                    'sucroglicéridos de ácidos grasos', 'sucrogliceridos de acidos grasos',
                                    'sucroglicéridos', 'sucrogliceridos', 'e474', 'e-474'
                                ]
                                encontrado_e474 = False
                                for variante in variantes_e474:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e474 = True
                                        break
                                # Buscar palabras clave: "sucroglicéridos" o "sucrogliceridos"
                                if 'sucrogliceridos' in texto_sin_acentos_validation or 'sucroglicéridos' in texto_lower_validation:
                                    encontrado_e474 = True
                                if encontrado_e474:
                                    nombre_encontrado = True
                                    logger.info(f"E-474 (Sucroglicéridos) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 23: E-475 (Ésteres de Ácidos Grasos) - Mejorar recall
                            if e_num.upper() == 'E-475' and not nombre_encontrado:
                                # Variantes comunes (distinguir de E-472 que también es "Ésteres")
                                variantes_e475 = [
                                    'ésteres de ácidos grasos', 'esteres de acidos grasos',
                                    'ésteres', 'esteres', 'e475', 'e-475'
                                ]
                                encontrado_e475 = False
                                for variante in variantes_e475:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e475 = True
                                        break
                                # Buscar palabras clave: "ésteres" + "ácidos grasos" (sin especificar "glicéridos" o "propano")
                                if 'esteres' in texto_sin_acentos_validation and 'acidos grasos' in texto_sin_acentos_validation:
                                    # Asegurar que NO es E-472 (ésteres de glicéridos) ni E-477 (ésteres propano)
                                    if 'gliceridos' not in texto_sin_acentos_validation and 'propano' not in texto_sin_acentos_validation:
                                        encontrado_e475 = True
                                if encontrado_e475:
                                    nombre_encontrado = True
                                    logger.info(f"E-475 (Ésteres de Ácidos Grasos) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 24: E-476 (Polirricinoleato de Ácidos Grasos) - Mejorar recall
                            if e_num.upper() == 'E-476' and not nombre_encontrado:
                                # Variantes comunes
                                variantes_e476 = [
                                    'polirricinoleato de ácidos grasos', 'polirricinoleato de acidos grasos',
                                    'polirricinoleato de poliglicerol', 'polirricinoleato',
                                    'e476', 'e-476'
                                ]
                                encontrado_e476 = False
                                for variante in variantes_e476:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e476 = True
                                        break
                                # Buscar palabras clave: "polirricinoleato"
                                if 'polirricinoleato' in texto_sin_acentos_validation or 'polirricinoleato' in texto_lower_validation:
                                    encontrado_e476 = True
                                if encontrado_e476:
                                    nombre_encontrado = True
                                    logger.info(f"E-476 (Polirricinoleato) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 25: E-477 (Ésteres propano de Ácidos Grasos) - Mejorar recall
                            if e_num.upper() == 'E-477' and not nombre_encontrado:
                                # Variantes comunes
                                variantes_e477 = [
                                    'ésteres propano de ácidos grasos', 'esteres propano de acidos grasos',
                                    'ésteres propano', 'esteres propano', 'e477', 'e-477'
                                ]
                                encontrado_e477 = False
                                for variante in variantes_e477:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e477 = True
                                        break
                                # Buscar palabras clave: "ésteres" + "propano"
                                if 'esteres' in texto_sin_acentos_validation and 'propano' in texto_lower_validation:
                                    encontrado_e477 = True
                                if encontrado_e477:
                                    nombre_encontrado = True
                                    logger.info(f"E-477 (Ésteres propano) detectado por validación específica mejorada")
                            
                            # Caso ESPECIAL 26: E-478 (Lacatato de Ácidos Grasos) - Mejorar recall
                            if e_num.upper() == 'E-478' and not nombre_encontrado:
                                # Variantes comunes
                                variantes_e478 = [
                                    'lacatato de ácidos grasos', 'lacatato de acidos grasos',
                                    'lacatato', 'e478', 'e-478'
                                ]
                                encontrado_e478 = False
                                for variante in variantes_e478:
                                    variante_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', variante) if unicodedata.category(c) != 'Mn')
                                    if variante in texto_lower_validation or variante_sin_acentos in texto_sin_acentos_validation:
                                        encontrado_e478 = True
                                        break
                                # Buscar palabras clave: "lacatato"
                                if 'lacatato' in texto_sin_acentos_validation or 'lacatato' in texto_lower_validation:
                                    encontrado_e478 = True
                                if encontrado_e478:
                                    nombre_encontrado = True
                                    logger.info(f"E-478 (Lacatato) detectado por validación específica mejorada")
                            
                            # Si ya se encontró por validación específica, saltar la validación general
                            if not nombre_encontrado:
                                # Validación general de nombres (solo si no se encontró por validación específica)
                                for nombre in nombres_aditivo:
                                    if nombre and len(nombre) > 2:  # Ignorar nombres muy cortos
                                        nombre_normalizado = nombre.lower().strip()
                                        nombre_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', nombre_normalizado) if unicodedata.category(c) != 'Mn')
                                    
                                    # Aplicar equivalencias químicas al nombre también
                                    nombre_con_equivalencias = nombre_normalizado
                                    for abrev, completo in equivalencias_quimicas.items():
                                        nombre_con_equivalencias = nombre_con_equivalencias.replace(abrev, completo)
                                    
                                    # MEJORA: Buscar el nombre completo en el texto (con y sin acentos, con equivalencias)
                                    # También buscar en contextos comunes como paréntesis, después de dos puntos, etc.
                                    if (nombre_normalizado in texto_normalizado or 
                                        nombre_sin_acentos in texto_sin_acentos or
                                        nombre_con_equivalencias in texto_con_equivalencias):
                                        nombre_encontrado = True
                                        break
                                    
                                    # MEJORA: Buscar en contextos comunes como "Edulcorante (Sucralosa)", "Colorante: E122", etc.
                                    contextos_comunes = [
                                        f'({nombre_normalizado})',
                                        f'({nombre_sin_acentos})',
                                        f': {nombre_normalizado}',
                                        f': {nombre_sin_acentos}',
                                        f'[{nombre_normalizado}]',
                                        f'[{nombre_sin_acentos}]',
                                    ]
                                    for contexto in contextos_comunes:
                                        if contexto in texto_normalizado or contexto in texto_sin_acentos:
                                            nombre_encontrado = True
                                            break
                                    if nombre_encontrado:
                                        break
                                    
                                    # Para nombres de una sola palabra importante (ej: "sucralosa"), buscar también como palabra completa
                                    # Esto ayuda cuando aparece en contextos como "Edulcorante (Sucralosa)"
                                    if len(nombre_normalizado.split()) == 1 and len(nombre_normalizado) > 4:
                                        # Buscar como palabra completa (no como substring de otra palabra)
                                        patron = r'\b' + re.escape(nombre_normalizado) + r'\b'
                                        patron_sin_acentos = r'\b' + re.escape(nombre_sin_acentos) + r'\b'
                                        patron_con_equivalencias = r'\b' + re.escape(nombre_con_equivalencias) + r'\b'
                                        if (re.search(patron, texto_normalizado, re.IGNORECASE) or 
                                            re.search(patron_sin_acentos, texto_sin_acentos, re.IGNORECASE) or
                                            re.search(patron_con_equivalencias, texto_con_equivalencias, re.IGNORECASE)):
                                            nombre_encontrado = True
                                            break
                                    
                                    # Si el nombre tiene múltiples palabras, buscar palabras clave importantes
                                    # Esto ayuda con variaciones de orden o mayúsculas
                                    palabras_nombre = nombre_normalizado.split()
                                    if len(palabras_nombre) > 1:
                                        # Buscar palabras clave (ignorar palabras muy comunes como "de", "y", "el", etc.)
                                        palabras_clave = [p for p in palabras_nombre if len(p) > 3 and p not in ['de', 'del', 'la', 'el', 'y', 'o', 'con', 'sin']]
                                        if palabras_clave:
                                            # Verificar que al menos 2 palabras clave aparezcan en el texto (o todas si son pocas)
                                            # También buscar variaciones sin acentos y variantes comunes
                                            palabras_encontradas = 0
                                            for palabra in palabras_clave:
                                                palabra_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', palabra) if unicodedata.category(c) != 'Mn')
                                                
                                                # Variantes comunes conocidas (ej: "esteviol" = "steviol")
                                                variantes = [palabra, palabra_sin_acentos]
                                                if palabra == 'esteviol':
                                                    variantes.append('steviol')
                                                elif palabra == 'steviol':
                                                    variantes.append('esteviol')
                                                
                                                # Añadir equivalencias químicas
                                                equivalencias = {
                                                    'fe': 'hierro', 'hierro': 'fe',
                                                    'na': 'sodio', 'sodio': 'na',
                                                    'k': 'potasio', 'potasio': 'k',
                                                    'ca': 'calcio', 'calcio': 'ca',
                                                    'mg': 'magnesio', 'magnesio': 'mg'
                                                }
                                                if palabra in equivalencias:
                                                    variantes.append(equivalencias[palabra])
                                                
                                                encontrada = False
                                                for variante in variantes:
                                                    if variante in texto_normalizado or variante in texto_sin_acentos or variante in texto_con_equivalencias:
                                                        encontrada = True
                                                        break
                                                
                                                if encontrada:
                                                    palabras_encontradas += 1
                                            
                                            # Si hay solo 1 palabra clave importante, aceptarla si aparece
                                            # Si hay 2 o más, requerir al menos 2
                                            if len(palabras_clave) == 1:
                                                if palabras_encontradas >= 1:
                                                    nombre_encontrado = True
                                                    break
                                            else:
                                                if palabras_encontradas >= min(2, len(palabras_clave)):
                                                    nombre_encontrado = True
                                                    break
                        
                        # VALIDACIONES ESPECÍFICAS ADICIONALES (después de validación general de nombres)
                        # Estas validaciones rechazan falsos positivos que pasaron la validación general pero son incorrectos
                        
                        # Caso 3: E-163 (Antocianinas) - NO detectar si solo menciona ingredientes naturales
                        if e_num.upper() == 'E-163':
                            if 'antocianinas' not in texto_lower_validation and 'antocianinas' not in texto_sin_acentos_validation:
                                ingredientes_con_antocianinas = ['hibisco', 'grosella', 'arándano', 'frambuesa']
                                if any(ing in texto_lower_validation for ing in ingredientes_con_antocianinas):
                                    logger.warning(f"E-163 (Antocianinas) rechazado: solo menciona ingredientes naturales, no el aditivo específico.")
                                    continue
                        
                        # Caso 4: E-162 (Betanina) - NO detectar si solo menciona "Remolacha" sin "betanina"
                        if e_num.upper() == 'E-162':
                            if 'betanina' not in texto_lower_validation and 'betanina' not in texto_sin_acentos_validation:
                                if 'remolacha' in texto_lower_validation or 'rojo remolacha' in texto_lower_validation:
                                    logger.warning(f"E-162 (Betanina) rechazado: solo menciona 'Remolacha' sin especificar 'betanina'.")
                                    continue
                        
                        # Caso 6: E-960 (Glicósidos de esteviol) - Aceptar variaciones ortográficas y de mayúsculas
                        if e_num.upper() == 'E-960':
                            # Verificar variaciones: "glicósidos", "glucósidos", "esteviol", "steviol"
                            variantes_esteviol = ['glicósidos de esteviol', 'glucósidos de esteviol', 'glicosidos de esteviol', 
                                                 'glucosidos de esteviol', 'esteviósido', 'esteviosido', 'glucósidos de steviol',
                                                 'glicósidos de steviol', 'glucosidos de steviol', 'glicosidos de steviol']
                            encontrado_esteviol = any(var in texto_lower_validation or var in texto_sin_acentos_validation for var in variantes_esteviol)
                            # También buscar palabras clave separadas
                            if not encontrado_esteviol:
                                if ('glucósidos' in texto_lower_validation or 'glicósidos' in texto_lower_validation or 
                                    'glucosidos' in texto_sin_acentos_validation or 'glicosidos' in texto_sin_acentos_validation):
                                    if ('esteviol' in texto_lower_validation or 'steviol' in texto_lower_validation or
                                        'esteviol' in texto_sin_acentos_validation or 'steviol' in texto_sin_acentos_validation):
                                        encontrado_esteviol = True
                            if encontrado_esteviol:
                                nombre_encontrado = True  # Forzar aceptación si encontramos variantes válidas
                        
                        # Caso 5: Conservantes (E-200, E-201, E-202, E-203, E-210, E-211, E-212, E-213) - NO detectar sin evidencia
                        conservantes_e_nums = ['E-200', 'E-201', 'E-202', 'E-203', 'E-210', 'E-211', 'E-212', 'E-213']
                        if e_num.upper() in conservantes_e_nums:
                            # Verificar si menciona nombres de conservantes
                            nombres_conservantes = ['ácido sórbico', 'sorbato', 'ácido benzoico', 'benzoato', 'conservante']
                            if not any(nom in texto_lower_validation or nom in texto_sin_acentos_validation for nom in nombres_conservantes):
                                # Verificar si el nombre específico del aditivo aparece
                                nombre_aditivo_encontrado = False
                                for nom in nombres_aditivo:
                                    if nom and len(nom) > 2:
                                        nom_lower = nom.lower().strip()
                                        if nom_lower in texto_lower_validation:
                                            nombre_aditivo_encontrado = True
                                            break
                                if not nombre_aditivo_encontrado:
                                    logger.warning(f"{e_num} rechazado: no hay evidencia textual de conservantes en el texto.")
                                    continue
                        
                        # Caso 7: Antioxidantes (E-300, E-301, E-302, etc.) - NO detectar sin evidencia
                        antioxidantes_e_nums = ['E-300', 'E-301', 'E-302', 'E-303', 'E-304', 'E-306', 'E-307', 'E-308', 'E-309']
                        if e_num.upper() in antioxidantes_e_nums:
                            nombres_antioxidantes = ['ácido ascórbico', 'ascorbato', 'tocoferol', 'antioxidante']
                            if not any(nom in texto_lower_validation or nom in texto_sin_acentos_validation for nom in nombres_antioxidantes):
                                # Verificar si el nombre específico del aditivo aparece
                                nombre_aditivo_encontrado = False
                                for nom in nombres_aditivo:
                                    if nom and len(nom) > 2:
                                        nom_lower = nom.lower().strip()
                                        if nom_lower in texto_lower_validation:
                                            nombre_aditivo_encontrado = True
                                            break
                                if not nombre_aditivo_encontrado:
                                    logger.warning(f"{e_num} rechazado: no hay evidencia textual de antioxidantes en el texto.")
                                    continue
                        
                        # Caso 8: Estabilizantes/Espesantes genéricos (E-400, E-440, E-422) - NO detectar sin evidencia
                        estabilizantes_e_nums = ['E-400', 'E-401', 'E-402', 'E-403', 'E-404', 'E-405', 'E-406', 'E-440', 'E-422']
                        if e_num.upper() in estabilizantes_e_nums:
                            nombres_estabilizantes = ['ácido algínico', 'alginato', 'pectina', 'glicerina', 'glicerol', 'estabilizante', 'espesante']
                            if not any(nom in texto_lower_validation or nom in texto_sin_acentos_validation for nom in nombres_estabilizantes):
                                # Verificar si el nombre específico del aditivo aparece
                                nombre_aditivo_encontrado = False
                                for nom in nombres_aditivo:
                                    if nom and len(nom) > 2:
                                        nom_lower = nom.lower().strip()
                                        if nom_lower in texto_lower_validation:
                                            nombre_aditivo_encontrado = True
                                            break
                                if not nombre_aditivo_encontrado:
                                    logger.warning(f"{e_num} rechazado: no hay evidencia textual de estabilizantes/espesantes en el texto.")
                                    continue
                        
                        # Caso 9: Edulcorantes genéricos (E-420) - NO detectar sin evidencia
                        if e_num.upper() == 'E-420':
                            if 'sorbitol' not in texto_lower_validation and 'sorbitol' not in texto_sin_acentos_validation:
                                logger.warning(f"E-420 (Sorbitol) rechazado: no hay evidencia textual de sorbitol en el texto.")
                                continue
                        
                        # Caso 10: Antiaglomerantes (E-500, E-551) - NO detectar sin evidencia
                        # NOTA: E-500 y E-551 tienen validaciones específicas arriba que mejoran el recall
                        # Esta validación solo aplica si NO pasaron las validaciones específicas
                        antiaglomerantes_e_nums = ['E-500', 'E-501', 'E-503', 'E-504', 'E-551', 'E-552', 'E-553']
                        if e_num.upper() in antiaglomerantes_e_nums and not nombre_encontrado:
                            nombres_antiaglomerantes = ['carbonato', 'dióxido silicio', 'sílice', 'antiaglomerante']
                            if not any(nom in texto_lower_validation or nom in texto_sin_acentos_validation for nom in nombres_antiaglomerantes):
                                # Verificar si el nombre específico del aditivo aparece
                                nombre_aditivo_encontrado = False
                                for nom in nombres_aditivo:
                                    if nom and len(nom) > 2:
                                        nom_lower = nom.lower().strip()
                                        if nom_lower in texto_lower_validation:
                                            nombre_aditivo_encontrado = True
                                            break
                                if not nombre_aditivo_encontrado:
                                    logger.warning(f"{e_num} rechazado: no hay evidencia textual de antiaglomerantes en el texto.")
                                    continue
                        
                        # Caso 11: ÁCIDOS GRASOS - CRÍTICO: Evitar falsos positivos con términos genéricos
                        # Si el texto dice SOLO "ácidos grasos" (genérico), NO detectar aditivos específicos relacionados
                        aditivos_acidos_grasos_especificos = ['E-470', 'E-470B', 'E-471', 'E-472', 'E-473', 'E-474', 'E-475', 'E-476', 'E-477', 'E-478', 'E-479']
                        if e_num.upper() in aditivos_acidos_grasos_especificos:
                            # Verificar si el texto dice SOLO "ácidos grasos" sin el término específico
                            texto_tiene_acidos_grasos_generico = (
                                'ácidos grasos' in texto_lower_validation or 
                                'acidos grasos' in texto_sin_acentos_validation
                            )
                            
                            # Verificar si tiene el término específico del aditivo
                            tiene_termino_especifico = False
                            
                            if e_num.upper() == 'E-470':
                                terminos_especificos = ['sales de ácidos grasos', 'sales de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-470B':
                                terminos_especificos = ['sales de magnesio de ácidos grasos', 'sales de magnesio de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-471':
                                terminos_especificos = ['mono y diglicéridos', 'mono- y diglicéridos', 'mono y digliceridos', 'mono-diglicéridos', 'monoglicéridos y diglicéridos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-472':
                                terminos_especificos = ['ésteres de ácidos grasos', 'esteres de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-473':
                                terminos_especificos = ['sucroésteres de ácidos grasos', 'sucroesteres de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-474':
                                terminos_especificos = ['sucroglicéridos de ácidos grasos', 'sucrogliceridos de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-475':
                                terminos_especificos = ['ésteres de ácidos grasos', 'esteres de acidos grasos']
                                # E-475 tiene el mismo nombre que E-472, pero son diferentes - verificar contexto
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-476':
                                terminos_especificos = ['polirricinoleato de ácidos grasos', 'polirricinoleato de poliglicerol', 'polirricinoleato', 'polirricinoleato de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-477':
                                terminos_especificos = ['ésteres propano de ácidos grasos', 'esteres propano de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-478':
                                terminos_especificos = ['lacatato de ácidos grasos', 'lacatato de acidos grasos']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            elif e_num.upper() == 'E-479':
                                terminos_especificos = ['aceite soja oxidado', 'aceite de soja oxidado', 'aceite soja oxid.', 'aceite de soja oxid.']
                                tiene_termino_especifico = any(term in texto_lower_validation or term in texto_sin_acentos_validation for term in terminos_especificos)
                            
                            # Si el texto tiene "ácidos grasos" genérico pero NO el término específico, rechazar
                            if texto_tiene_acidos_grasos_generico and not tiene_termino_especifico:
                                logger.warning(f"{e_num} rechazado: el texto dice 'ácidos grasos' (genérico) pero NO menciona el término específico '{aditivo_completo.get('nombre_original', 'N/A')}'. Solo debe detectarse E-570 (Ácidos grasos) cuando aparece el término genérico.")
                                continue
                        
                        # Si no se encuentra el nombre literalmente Y no fue detectado directamente, omitir este aditivo (probable falso positivo)
                        if not nombre_encontrado:
                            logger.warning(f"Aditivo {e_num} ({aditivo_completo.get('nombre_original', 'N/A')}) detectado por LLM pero su nombre no aparece literalmente en el texto. Omitiendo para evitar falso positivo.")
                            continue
                        
                        aditivos_formateados.append({
                            'e_numero': e_num,
                            'aditivo': aditivo_completo,
                            'tipo': aditivo_llm.get('tipo', aditivo_completo.get('tipo', '')),
                            'origen': aditivo_llm.get('origen', aditivo_completo.get('origen', '')),
                            'clasificacion': aditivo_llm.get('clasificacion', aditivo_completo.get('clasificacion', '')),
                            'similitud': 1.0 if aditivo_llm.get('confianza') == 'alta' else 0.8 if aditivo_llm.get('confianza') == 'media' else 0.6,
                            'metodo_deteccion': 'llm'
                        })
                
                logger.info(f"Total aditivos detectados: {len(aditivos_formateados)} ({len(aditivos_directos)} por E-números directos, {len(aditivos_formateados) - len(aditivos_directos)} por LLM)")
                
                # CAPA PROACTIVA: Buscar aditivos que el LLM no detectó pero que claramente están en el texto
                # Esto mejora significativamente el recall
                e_numeros_ya_detectados = {a['e_numero'].upper() for a in aditivos_formateados}
                aditivos_proactivos = self._buscar_aditivos_proactivamente(texto, aditivos_database, e_numeros_ya_detectados)
                
                # Añadir aditivos proactivos encontrados
                for aditivo_proactivo in aditivos_proactivos:
                    if aditivo_proactivo['e_numero'].upper() not in e_numeros_ya_detectados:
                        aditivos_formateados.append(aditivo_proactivo)
                        e_numeros_ya_detectados.add(aditivo_proactivo['e_numero'].upper())
                        logger.info(f"Aditivo {aditivo_proactivo['e_numero']} detectado proactivamente (no detectado por LLM)")
                
                logger.info(f"Total aditivos finales: {len(aditivos_formateados)} (añadidos {len(aditivos_proactivos)} proactivamente)")
                return aditivos_formateados
                
            except json.JSONDecodeError as e:
                # Si no es JSON válido, intentar extraer información del texto usando regex
                logger.warning(f"Respuesta LLM no es JSON válido, intentando extraer con regex: {str(e)[:100]}")
                
                # Intentar extraer objetos de aditivos del JSON parcial
                # Buscar patrones como: "e_numero": "E-XXX"
                e_num_pattern = r'"e_numero"\s*:\s*"([^"]+)"'
                e_numeros_encontrados = re.findall(e_num_pattern, response_clean, re.IGNORECASE)
                
                # Si no encontramos E-números con el patrón completo, buscar directamente
                if not e_numeros_encontrados:
                    e_pattern = r'E-[\d]+[a-z]?'
                    e_numeros_encontrados = re.findall(e_pattern, response_clean, re.IGNORECASE)
                
                if e_numeros_encontrados:
                    aditivos_formateados = []
                    e_numeros_vistos_regex = set()
                    
                    for e_num in set(e_numeros_encontrados):
                        # Limpiar el E-número
                        e_num_clean = e_num.strip().upper()
                        if not e_num_clean.startswith('E-'):
                            e_num_clean = f"E-{e_num_clean.replace('E', '').replace('-', '').strip()}"
                        
                        if e_num_clean in e_numeros_vistos_regex:
                            continue
                        e_numeros_vistos_regex.add(e_num_clean)
                        
                        aditivo_completo = next((a for a in aditivos_database if a.get('e_numero', '').upper() == e_num_clean.upper()), None)
                        if aditivo_completo:
                            aditivos_formateados.append({
                                'e_numero': e_num_clean,
                                'aditivo': aditivo_completo,
                                'tipo': aditivo_completo.get('tipo', ''),
                                'origen': aditivo_completo.get('origen', ''),
                                'clasificacion': aditivo_completo.get('clasificacion', ''),
                                'similitud': 0.7,  # Confianza media si se extrajo con regex
                                'metodo_deteccion': 'regex_fallback'
                            })
                    
                    # Combinar con aditivos detectados por E-números directos
                    e_numeros_directos_set = {a['e_numero'] for a in aditivos_directos}
                    for aditivo_directo in aditivos_directos:
                        if aditivo_directo['e_numero'] not in {a.get('e_numero') for a in aditivos_formateados}:
                            aditivos_formateados.append(aditivo_directo)
                    
                    if aditivos_formateados:
                        logger.info(f"Extraídos {len(aditivos_formateados)} aditivos usando regex fallback + E-números directos")
                        return aditivos_formateados
                
                # Si no se encontró nada con regex, al menos retornar los E-números directos
                if aditivos_directos:
                    logger.info(f"Retornando {len(aditivos_directos)} aditivos detectados por E-números directos")
                    return aditivos_directos
                
                logger.warning(f"No se pudo extraer aditivos de la respuesta: {response_clean[:500]}")
                return []
                
        except Exception as e:
            logger.error(f"Error detectando aditivos con LLM: {e}", exc_info=True)
            return []
    
    def _buscar_aditivos_proactivamente(self, texto: str, aditivos_database: List[Dict], e_numeros_ya_detectados: Set[str]) -> List[Dict]:
        """
        Busca proactivamente aditivos en el texto que el LLM no detectó pero que claramente están presentes.
        Esto mejora significativamente el recall.
        """
        import unicodedata
        import re
        
        aditivos_proactivos = []
        texto_lower = texto.lower()
        texto_sin_acentos = ''.join(c for c in unicodedata.normalize('NFD', texto_lower) if unicodedata.category(c) != 'Mn')
        
        aditivos_problematicos = [
            # Aditivos más problemáticos (frecuentes falsos negativos)
            'E-122', 'E-460', 'E-461', 'E-462', 'E-470', 'E-470B', 'E-471', 'E-472', 
            'E-473', 'E-474', 'E-475', 'E-476', 'E-477', 'E-478', 'E-479', 'E-500',
            'E-529', 'E-530', 'E-551', 'E-172', 'E-570', 'E-955', 'E-422', 'E-330',
            'E-440', 'E-150', 'E-322', 'E-965', 'E-101', 'E-170',
            # Aditivos adicionales problemáticos identificados
            'E-331', 'E-332', 'E-333',  # Citratos
            'E-508', 'E-509', 'E-511',  # Cloruros
            'E-1401',  # Almidón ácido
            'E-228',  # Sulfito ácido de potasio
            'E-153',  # Carbón vegetal
            'E-416',  # Goma K.
            'E-1400',  # Dextrina
            'E-300',  # Ácido ascórbico
            'E-524', 'E-528',  # Hidróxidos
            'E-541',  # Fosfato ácido
            'E-415',  # Goma xantana
            'E-202',  # Sorbato de potasio
            'E-201', 'E-203',  # Sorbatos
            'E-221', 'E-226',  # Sulfitos
            'E-1200',  # Polidextrosa
            'E-450',  # Difosfatos
            'E-412',  # Goma guar
            'E-967',  # Xilitol
            'E-128',  # Rojo 2G
            'E-1520',  # Propilenglicol
            'E-296',  # Ácido málico
            'E-420',  # Sorbitol
            'E-306',  # Extracción Vegetal
            'E-219',  # Hidróxido M. de Na
            'E-440A',  # Pectinas
            'E-325', 'E-326', 'E-327',  # Lactatos
            'E-401', 'E-402', 'E-404',  # Alginatos
            'E-1402'  # Almidón alcalino modificado
        ]
        
        for aditivo in aditivos_database:
            e_num = aditivo.get('e_numero', '').upper()
            if e_num in e_numeros_ya_detectados or e_num not in aditivos_problematicos:
                continue
            
            nombre_encontrado = False
            
            if e_num == 'E-122':
                # E-122 es el más problemático - búsqueda exhaustiva
                variantes = ['e122', 'e-122', 'e 122', 'carmoisina', 'azorrubina', 'azorubina',
                           'red 3', 'red3', 'red#3', 'c.i. 14720', 'c.i.14720', 'ci 14720', 'ci14720',
                           'ci.14720', 'acid red 14', 'acidred14', 'brillantcarmoisin o', 'brillantcarmoisino',
                           'azorubina s', 'azorubinas', 'carmoisine', 'carmoisin']
                # Buscar en texto normalizado
                if any(v in texto_lower or v in texto_sin_acentos for v in variantes):
                    nombre_encontrado = True
                # Buscar E-número directo en varios formatos
                elif re.search(r'E[-]?\s*122\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
                # Buscar en contextos comunes como "Colorante (E122)", "E-122", etc.
                elif re.search(r'(colorante|color|dye).*?[\(:]?\s*E[-]?\s*122', texto, re.IGNORECASE):
                    nombre_encontrado = True
                # Buscar variantes de nombres en contextos
                elif re.search(r'\b(carmoisina|azorrubina|red\s*3)\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-460':
                # Celulosa puede aparecer de varias formas
                if (re.search(r'\bcelulosa\b', texto, re.IGNORECASE) or 
                    ('celulosa' in texto_lower and ('microcristalina' in texto_lower or 'microcristalina' in texto_sin_acentos or 
                     'agente de carga' in texto_lower or 'agente de carga' in texto_sin_acentos or
                     'en polvo' in texto_lower or 'vegetal' in texto_lower))):
                    nombre_encontrado = True
            elif e_num == 'E-461':
                if 'metil' in texto_lower and 'celulosa' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-462':
                if 'etil' in texto_lower and 'celulosa' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-470':
                if 'sales de ácidos grasos' in texto_lower or 'sales de acidos grasos' in texto_sin_acentos:
                    nombre_encontrado = True
            elif e_num == 'E-470B':
                if ('sales magnésicas de ácidos grasos' in texto_lower or 
                    'sales de magnesio de ácidos grasos' in texto_lower or
                    'sales magnesicas de acidos grasos' in texto_sin_acentos or
                    'sales de magnesio de acidos grasos' in texto_sin_acentos):
                    nombre_encontrado = True
            elif e_num == 'E-471':
                terminos = ['mono y diglicéridos', 'mono- y diglicéridos', 'mono y digliceridos',
                          'mono-diglicéridos', 'monoglicéridos y diglicéridos', 'mono y di-glicéridos']
                if any(term in texto_lower or term in texto_sin_acentos for term in terminos):
                    nombre_encontrado = True
            elif e_num == 'E-472':
                if 'ésteres de ácidos grasos' in texto_lower or 'esteres de acidos grasos' in texto_sin_acentos:
                    nombre_encontrado = True
            elif e_num == 'E-473':
                if 'sucroesteres' in texto_sin_acentos or 'sucroésteres' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-474':
                if 'sucrogliceridos' in texto_sin_acentos or 'sucroglicéridos' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-475':
                if ('esteres' in texto_sin_acentos and 'acidos grasos' in texto_sin_acentos and
                    'gliceridos' not in texto_sin_acentos and 'propano' not in texto_lower):
                    nombre_encontrado = True
            elif e_num == 'E-476':
                if 'polirricinoleato' in texto_sin_acentos or 'polirricinoleato' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-477':
                if 'esteres' in texto_sin_acentos and 'propano' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-478':
                if 'lacatato' in texto_sin_acentos or 'lacatato' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-479':
                # Aceite soja oxidado - múltiples variantes
                if (('aceite' in texto_lower and 'soja' in texto_lower and
                    ('oxidado' in texto_lower or 'oxid.' in texto_lower or 'oxid' in texto_sin_acentos)) or
                    ('aceite de soja' in texto_lower and ('oxidado' in texto_lower or 'oxid.' in texto_lower)) or
                    ('aceite soja oxid' in texto_lower or 'aceite soja oxidado' in texto_lower)):
                    nombre_encontrado = True
            elif e_num == 'E-500':
                if ('carbonato' in texto_lower and 
                    ('sodio' in texto_lower or 'na' in texto_lower or 'sodico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-529':
                if ('oxido' in texto_sin_acentos and 
                    ('calcio' in texto_lower or 'ca' in texto_lower)):
                    nombre_encontrado = True
            elif e_num == 'E-530':
                if ('oxido' in texto_sin_acentos and 
                    ('magnesio' in texto_lower or 'mg' in texto_lower)):
                    nombre_encontrado = True
            elif e_num == 'E-551':
                if (('dioxido' in texto_sin_acentos or 'dióxido' in texto_lower) and 
                    ('silicio' in texto_lower or 'silice' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-172':
                if ('oxido' in texto_sin_acentos and 
                    ('hierro' in texto_lower or ' fe ' in texto_lower)):
                    nombre_encontrado = True
            elif e_num == 'E-570':
                if 'acidos grasos' in texto_sin_acentos or 'ácidos grasos' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-955':
                if re.search(r'\bsucralosa\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-422':
                if re.search(r'\bglicerina\b', texto, re.IGNORECASE) or 'glicerol' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-330':
                if ('acido' in texto_sin_acentos and 'citrico' in texto_sin_acentos):
                    nombre_encontrado = True
            elif e_num == 'E-440':
                if re.search(r'\bpectina[s]?\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-150':
                if 'caramelo' in texto_lower or re.search(r'E[-]?\s*150[a-d]?\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-322':
                if re.search(r'\blecitina\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-965':
                if re.search(r'\bmaltitol\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-101':
                if 'riboflavina' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-170':
                if ('carbonato' in texto_lower and 
                    ('calcio' in texto_lower or 'calcico' in texto_sin_acentos or 'ca' in texto_lower)):
                    nombre_encontrado = True
            elif e_num == 'E-331':
                if ('citrato' in texto_lower and 
                    ('sodio' in texto_lower or 'na' in texto_lower or 'sodico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-332':
                if ('citrato' in texto_lower and 
                    ('potasio' in texto_lower or 'k' in texto_lower or 'potasico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-333':
                if ('citrato' in texto_lower and 
                    ('calcio' in texto_lower or 'ca' in texto_lower or 'calcico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-508':
                if ('cloruro' in texto_lower and 
                    ('potasio' in texto_lower or 'k' in texto_lower or 'potasico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-509':
                if ('cloruro' in texto_lower and 
                    ('calcio' in texto_lower or 'ca' in texto_lower or 'calcico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-511':
                if ('cloruro' in texto_lower and 
                    ('magnesio' in texto_lower or 'mg' in texto_lower)):
                    nombre_encontrado = True
            elif e_num == 'E-1401':
                if ('almidon' in texto_sin_acentos and 'acido' in texto_sin_acentos) or 'almidón ácido' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-228':
                if ('sulfito' in texto_lower and 'acido' in texto_sin_acentos and 
                    ('potasio' in texto_lower or 'k' in texto_lower or 'potasico' in texto_sin_acentos)) or 'bisulfito de potasio' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-153':
                if ('carbon' in texto_lower and ('vegetal' in texto_lower or 'animal' in texto_lower)) or 'carbón vegetal' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-416':
                if 'goma k' in texto_lower or 'goma karaya' in texto_lower or 'karaya' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-1400':
                if re.search(r'\bdextrina[s]?\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-300':
                if ('acido' in texto_sin_acentos and 'ascorbico' in texto_sin_acentos) or 'ácido ascórbico' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-524':
                if ('hidroxido' in texto_sin_acentos and 'sodio' in texto_lower) or 'hidróxido de sodio' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-528':
                if ('hidroxido' in texto_sin_acentos and 'magnesio' in texto_lower) or 'hidróxido de magnesio' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-541':
                if 'fosfato acido' in texto_sin_acentos or 'fosfato ácido' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-415':
                if 'goma xantana' in texto_lower or 'xantano' in texto_lower or 'xanthan' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-202':
                if ('sorbato' in texto_lower and 
                    ('potasio' in texto_lower or 'k' in texto_lower or 'potasico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-201':
                if ('sorbato' in texto_lower and 
                    ('sodio' in texto_lower or 'na' in texto_lower or 'sodico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-203':
                if ('sorbato' in texto_lower and 
                    ('calcio' in texto_lower or 'ca' in texto_lower or 'calcico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-221':
                if ('sulfito' in texto_lower and 
                    ('sodio' in texto_lower or 'na' in texto_lower or 'sodico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-226':
                if ('sulfito' in texto_lower and 
                    ('calcio' in texto_lower or 'ca' in texto_lower or 'calcico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-1200':
                if re.search(r'\bpolidextrosa[s]?\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-450':
                if 'difosfato' in texto_lower or 'difosfatos' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-412':
                if 'goma guar' in texto_lower or 'guar' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-967':
                if re.search(r'\bxilitol\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-128':
                if 'rojo 2g' in texto_lower or 'red 2g' in texto_lower or 'red2g' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-1520':
                if ('propilenglicol' in texto_lower or 'propilenoglicol' in texto_lower or 
                    '1,2-propanodiol' in texto_lower or 'propanodiol' in texto_lower):
                    nombre_encontrado = True
            elif e_num == 'E-296':
                if ('acido' in texto_sin_acentos and 'malico' in texto_sin_acentos) or 'ácido málico' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-420':
                if re.search(r'\bsorbitol\b', texto, re.IGNORECASE):
                    nombre_encontrado = True
            elif e_num == 'E-306':
                if 'extraccion vegetal' in texto_sin_acentos or 'extracción vegetal' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-219':
                if ('hidroxido' in texto_sin_acentos and 'magnesio' in texto_lower and 'sodio' in texto_lower) or 'hidróxido m. de na' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-440A':
                if 'pectinas' in texto_lower:
                    nombre_encontrado = True
            elif e_num == 'E-325':
                if ('lactato' in texto_lower and 
                    ('sodio' in texto_lower or 'na' in texto_lower or 'sodico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-326':
                if ('lactato' in texto_lower and 
                    ('potasio' in texto_lower or 'k' in texto_lower or 'potasico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-327':
                if ('lactato' in texto_lower and 
                    ('calcio' in texto_lower or 'ca' in texto_lower or 'calcico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-401':
                if ('alginato' in texto_lower and 
                    ('sodio' in texto_lower or 'na' in texto_lower or 'sodico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-402':
                if ('alginato' in texto_lower and 
                    ('potasio' in texto_lower or 'k' in texto_lower or 'potasico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-404':
                if ('alginato' in texto_lower and 
                    ('calcio' in texto_lower or 'ca' in texto_lower or 'calcico' in texto_sin_acentos)):
                    nombre_encontrado = True
            elif e_num == 'E-1402':
                if ('almidon' in texto_sin_acentos and 'alcalino' in texto_sin_acentos and 'modificado' in texto_lower) or 'almidón alcalino modificado' in texto_lower:
                    nombre_encontrado = True
            
            if nombre_encontrado:
                aditivos_proactivos.append({
                    'e_numero': e_num,
                    'aditivo': aditivo,
                    'tipo': aditivo.get('tipo', ''),
                    'origen': aditivo.get('origen', ''),
                    'clasificacion': aditivo.get('clasificacion', ''),
                    'similitud': 0.9,
                    'metodo_deteccion': 'proactivo'
                })
        
        return aditivos_proactivos


def create_llm_config_from_env() -> Optional[LLMConfig]:
    """
    Crea configuración LLM desde variables de entorno.
    Prioridad: OpenAI > Anthropic > Hugging Face
    
    Returns:
        Configuración LLM o None si no hay configuración disponible
    """
    # Intentar OpenAI primero
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        return LLMConfig(
            provider='openai',
            api_key=openai_key,
            model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
            max_tokens=int(os.getenv('OPENAI_MAX_TOKENS', '1000')),
            temperature=float(os.getenv('OPENAI_TEMPERATURE', '0.3'))
        )
    
    # Intentar Anthropic
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')
    if anthropic_key:
        return LLMConfig(
            provider='anthropic',
            api_key=anthropic_key,
            model=os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
            max_tokens=int(os.getenv('ANTHROPIC_MAX_TOKENS', '1000')),
            temperature=float(os.getenv('ANTHROPIC_TEMPERATURE', '0.3'))
        )
    
    # Intentar Hugging Face (gratuito, puede funcionar sin API key para algunos modelos)
    huggingface_model = os.getenv('HUGGINGFACE_MODEL')
    if huggingface_model:
        return LLMConfig(
            provider='huggingface',
            api_key=os.getenv('HUGGINGFACE_API_KEY', ''),  # Opcional, algunos modelos no requieren
            model=huggingface_model,
            max_tokens=int(os.getenv('HUGGINGFACE_MAX_TOKENS', '1000')),
            temperature=float(os.getenv('HUGGINGFACE_TEMPERATURE', '0.3'))
        )
    
    return None


def create_manual_llm_config(provider: str, api_key: str, model: str = None) -> LLMConfig:
    """
    Crea configuración LLM manual.
    
    Args:
        provider: 'openai', 'anthropic', o 'huggingface'
        api_key: Clave API (opcional para Hugging Face)
        model: Modelo específico (opcional)
        
    Returns:
        Configuración LLM
    """
    if provider == 'openai':
        return LLMConfig(
            provider='openai',
            api_key=api_key,
            model=model or 'gpt-3.5-turbo',
            max_tokens=1000,
            temperature=0.3
        )
    elif provider == 'anthropic':
        return LLMConfig(
            provider='anthropic',
            api_key=api_key,
            model=model or 'claude-3-5-sonnet-20241022',
            max_tokens=1000,
            temperature=0.3
        )
    elif provider == 'huggingface':
        return LLMConfig(
            provider='huggingface',
            api_key=api_key or '',  # Opcional para Hugging Face
            model=model or 'mistralai/Mistral-7B-Instruct-v0.2',
            max_tokens=1000,
            temperature=0.3
        )
    else:
        raise ValueError(f"Proveedor no soportado: {provider}")


# Ejemplo de uso
if __name__ == "__main__":
    # Crear configuración desde variables de entorno
    config = create_llm_config_from_env()
    
    if config:
        print(f"Configuración LLM cargada: {config.provider} - {config.model}")
    else:
        print("No se encontró configuración LLM en variables de entorno")
        print("Configura las variables OPENAI_API_KEY o ANTHROPIC_API_KEY")



