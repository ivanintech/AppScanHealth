# Sistema de Matching de Suplementos

## Descripción General

El sistema de matching de suplementos analiza automáticamente el perfil del usuario y sus predicciones de salud para determinar qué suplementos de la base de datos son más útiles para cada usuario específico. Este sistema genera feedback personalizado que se almacena en la base de datos y se muestra en la interfaz de usuario.

## Arquitectura del Sistema

### 1. **SupplementMatchingService**
- **Ubicación**: `src/shared/components/recommendations/SupplementMatchingService.ts`
- **Función**: Analiza la utilidad de cada suplemento basándose en el perfil del usuario
- **Algoritmo**: Sistema de scoring basado en múltiples factores de salud

### 2. **SupplementFeedbackService**
- **Ubicación**: `src/shared/components/recommendations/SupplementFeedbackService.ts`
- **Función**: Gestiona el almacenamiento y recuperación del feedback en la base de datos
- **Tabla**: `ai_recommendations` con `recommendation_type = 'supplement'`

### 3. **SupplementUtilityPanel**
- **Ubicación**: `src/shared/components/SupplementUtilityPanel.tsx`
- **Función**: Componente UI que muestra el feedback personalizado al usuario
- **Características**: Scoring visual, razones personalizadas, advertencias, interacciones

## Flujo de Funcionamiento

### 1. **Procesamiento Automático**
```typescript
// Se ejecuta automáticamente en AdvisoryService.generatePersonalizedPlan()
await this.processSupplementMatching(userProfile, healthAnalysis);
```

### 2. **Análisis de Utilidad**
El sistema evalúa cada suplemento basándose en:

#### **Factores de Salud del Usuario:**
- **Edad y género**: Necesidades específicas por demografía
- **Nivel de estrés**: Alto estrés = mayor necesidad de adaptógenos
- **Calidad del sueño**: Problemas de sueño = necesidad de melatonina/magnesio
- **Tipo de ejercicio**: Fuerza = creatina, cardio = omega-3
- **Exposición solar**: Baja exposición = vitamina D3
- **Historial familiar**: Diabetes = berberina, cardiovascular = omega-3
- **Condiciones médicas**: Problemas específicos = suplementos específicos

#### **Algoritmo de Scoring:**
```typescript
// Ejemplo: Magnesio Bisglicinato
if (stressLevel === 'high') score += 40;           // Estrés alto
if (sleepQuality === 'poor') score += 30;          // Problemas de sueño
if (exerciseType === 'strength') score += 25;      // Ejercicio intenso
if (age > 50) score += 20;                        // Edad avanzada
if (gender === 'female') score += 15;              // Género femenino
```

### 3. **Almacenamiento de Feedback**
```typescript
// Se almacena en ai_recommendations
{
  user_id: "uuid",
  recommendation_type: "supplement",
  title: "Magnesio Bisglicinato",
  content: {
    supplementId: "1",
    isUseful: true,
    utilityScore: 85,
    personalizedReasons: ["El magnesio es esencial para combatir el estrés crónico"],
    warnings: ["Consultar con médico si tienes problemas renales"],
    recommendedTiming: "Noche, 1-2 h antes de acostarse",
    recommendedDosage: "Tomar 1-2 cápsulas por la noche",
    interactions: ["Puede potenciar efectos de sedantes"],
    category: "Mejorar la calidad del sueño",
    confidence: 0.85
  },
  confidence_score: 0.85,
  status: "pending",
  priority: 1
}
```

## Uso en la Interfaz

### 1. **En Páginas de Detalles de Suplemento**
```tsx
import { SupplementUtilityPanel } from '@/shared/components/SupplementUtilityPanel';

<SupplementUtilityPanel
  supplementId="1"
  supplementName="Magnesio Bisglicinato"
  userId={user.id}
/>
```

### 2. **Usando el Hook Personalizado**
```tsx
import { useSupplementMatching } from '@/shared/hooks/useSupplementMatching';

const { feedback, loading, error, updateFeedbackStatus } = useSupplementMatching(
  userId,
  supplementId
);
```

### 3. **Procesamiento Manual**
```tsx
import { useSupplementMatchingForUser } from '@/shared/hooks/useSupplementMatching';

const { matches, processMatching } = useSupplementMatchingForUser(
  userProfile,
  healthAnalysis
);

// Ejecutar matching
await processMatching();
```

## Categorías de Suplementos Soportadas

### **Suplementos Base (Implementados):**
1. **Magnesio Bisglicinato** - Estrés, sueño, ejercicio
2. **Ashwagandha** - Estrés, ansiedad, hormonas
3. **Vitamina D3** - Exposición solar, edad, huesos
4. **Omega-3** - Cardiovascular, inflamación, cerebro
5. **Zinc** - Inmunidad, ejercicio, dietas vegetarianas
6. **Melatonina** - Sueño, estrés, edad
7. **Creatina** - Ejercicio de fuerza, rendimiento
8. **Probióticos** - Salud digestiva, antibióticos

### **Criterios de Evaluación por Suplemento:**

#### **Magnesio Bisglicinato:**
- Estrés alto/very_high: +40 puntos
- Problemas de sueño: +30 puntos
- Ejercicio intenso: +25 puntos
- Edad >50: +20 puntos
- Género femenino: +15 puntos

#### **Ashwagandha:**
- Estrés very_high: +50 puntos
- Estrés high: +35 puntos
- Problemas de sueño: +25 puntos
- Mujeres 25-45 años: +20 puntos

#### **Vitamina D3:**
- Exposición solar baja: +40 puntos
- Edad >50: +30 puntos
- Dieta vegana/vegetariana: +25 puntos
- Osteoporosis/depresión: +35 puntos

## Personalización Avanzada

### **Razones Personalizadas:**
El sistema genera explicaciones específicas basadas en el perfil del usuario:

```typescript
// Ejemplo de razones generadas
[
  "El magnesio es esencial para combatir el estrés crónico",
  "El magnesio mejora la calidad del sueño y la relajación muscular",
  "El magnesio es crucial para la contracción muscular y recuperación"
]
```

### **Advertencias Contextuales:**
```typescript
// Ejemplo de advertencias
[
  "Consultar con médico si tienes problemas renales",
  "Puede interactuar con medicamentos para tiroides",
  "Evitar con anticoagulantes"
]
```

### **Timing y Dosificación:**
```typescript
// Información específica de uso
{
  recommendedTiming: "Noche, 1-2 h antes de acostarse, con o sin comida",
  recommendedDosage: "Tomar 1-2 cápsulas por la noche, aproximadamente 1-2 horas antes de acostarse",
  interactions: ["Puede potenciar efectos de sedantes", "Tomar separado de calcio"]
}
```

## Integración con Base de Datos

### **Tabla `categories`:**
- Filtro: `recommended_time IS NOT NULL`
- Campos utilizados: `name`, `description`, `recommended_time`, `usage_instructions`, `health_goals`, `considerations`, `interactions`

### **Tabla `ai_recommendations`:**
- **Tipo**: `recommendation_type = 'supplement'`
- **Contenido**: JSON con toda la información del feedback
- **Estado**: `pending` → `accepted`/`rejected`
- **Prioridad**: Basada en `utilityScore`

## Métricas y Monitoreo

### **Logs del Sistema:**
```
🔄 Procesando matching de suplementos...
📊 Encontrados 8 suplementos relevantes
✅ Feedback de suplementos almacenado exitosamente
```

### **Métricas de Utilidad:**
- **Alta utilidad**: 80-100% (verde)
- **Utilidad media**: 60-79% (amarillo)
- **Utilidad baja**: 40-59% (naranja)
- **Baja utilidad**: 0-39% (rojo)

## Extensibilidad

### **Agregar Nuevos Suplementos:**
1. Añadir entrada en `SupplementMatchingService.categories`
2. Implementar método `analyze[Suplemento]Utility()`
3. Agregar caso en `analyzeSupplementUtility()`

### **Mejorar Algoritmos:**
1. Ajustar pesos de scoring en métodos de análisis
2. Agregar nuevos factores de evaluación
3. Implementar machine learning para scoring dinámico

## Beneficios del Sistema

1. **Personalización Real**: Cada usuario recibe feedback específico basado en su perfil
2. **Transparencia**: El usuario entiende por qué un suplemento le es útil
3. **Seguridad**: Advertencias sobre interacciones y contraindicaciones
4. **Eficiencia**: Procesamiento automático sin intervención manual
5. **Escalabilidad**: Fácil agregar nuevos suplementos y criterios
6. **Feedback Loop**: El usuario puede confirmar o rechazar recomendaciones

Este sistema transforma la experiencia de suplementación de genérica a altamente personalizada, proporcionando valor real al usuario basado en datos científicos y su perfil único de salud.
