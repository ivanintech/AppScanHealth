
# 🤖 Visualizaciones de Modelos ML


# 🎯 Comparación de Modelos ML

## 📊 Métricas de Rendimiento
```
┌─────────────────────────┬─────────┬──────────┬────────┬─────────┬─────────┐
│ Modelo                  │ Accuracy│ Precision│ Recall │ F1-Score│ Tiempo  │
├─────────────────────────┼─────────┼──────────┼────────┼─────────┼─────────┤
│ Collaborative Filtering│ 85.0%   │ 82.0%    │ 88.0%  │ 85.0%   │ 0.12s   │
│ Content-Based Filtering │ 78.0%   │ 75.0%    │ 81.0%  │ 78.0%   │ 0.19s   │
│ Deficiency Analysis     │ 92.0%   │ 89.0%    │ 95.0%  │ 92.0%   │ 0.08s   │
│ Effectiveness Prediction│ 88.0%   │ 86.0%    │ 90.0%  │ 88.0%   │ 0.15s   │
│ User Segmentation      │ 82.0%   │ 80.0%    │ 84.0%  │ 82.0%   │ 0.10s   │
└─────────────────────────┴─────────┴──────────┴────────┴─────────┴─────────┘
```

## 📈 Gráfico de Comparación de Accuracy
```
Deficiency Analysis:     ████████████████████ 92.0%
Effectiveness Prediction:██████████████████   88.0%
Collaborative Filtering: ████████████████     85.0%
User Segmentation:       ███████████████      82.0%
Content-Based Filtering: ██████████████       78.0%
```

## 🎯 Análisis de Rendimiento
- **Mejor modelo**: Deficiency Analysis (92.0% accuracy)
- **Más rápido**: Deficiency Analysis (0.08s)
- **Más datos**: Effectiveness Prediction (2.5M puntos)
- **Promedio general**: 85.0% accuracy
```



# 📊 Visualización del Modelo: Collaborative Filtering

## 🎯 Métricas de Rendimiento
```
┌─────────────────┬─────────────┬─────────────┐
│ Métrica         │ Valor       │ Estado      │
├─────────────────┼─────────────┼─────────────┤
│ Accuracy        │ 85.0%      │ 🟡        │
│ Precision       │ 82.0%      │ 🟡        │
│ Recall          │ 88.0%      │ 🟡        │
│ F1-Score        │ 85.0%      │ 🟡        │
└─────────────────┴─────────────┴─────────────┘
```

## 📈 Gráfico de Métricas
```
Accuracy:  █████████████████░░░
Precision: ████████████████░░░░
Recall:    ██████████████████░░
F1-Score:  █████████████████░░░
```

## ⏱️ Información de Entrenamiento
- **Tiempo de entrenamiento**: 0.12s
- **Puntos de datos**: 3788
- **Características**: 4

## 🔍 Características Importantes
- user_id
- supplement
- effectiveness
- satisfaction



# 📊 Visualización del Modelo: Content-Based Filtering

## 🎯 Métricas de Rendimiento
```
┌─────────────────┬─────────────┬─────────────┐
│ Métrica         │ Valor       │ Estado      │
├─────────────────┼─────────────┼─────────────┤
│ Accuracy        │ 78.0%      │ 🟡        │
│ Precision       │ 75.0%      │ 🟡        │
│ Recall          │ 81.0%      │ 🟡        │
│ F1-Score        │ 78.0%      │ 🟡        │
└─────────────────┴─────────────┴─────────────┘
```

## 📈 Gráfico de Métricas
```
Accuracy:  ████████████████░░░░
Precision: ███████████████░░░░░
Recall:    ████████████████░░░░
F1-Score:  ████████████████░░░░
```

## ⏱️ Información de Entrenamiento
- **Tiempo de entrenamiento**: 0.19s
- **Puntos de datos**: 213.282
- **Características**: 5

## 🔍 Características Importantes
- product_name
- ingredients
- category
- brand
- quality_score



# 📊 Visualización del Modelo: Deficiency Analysis

## 🎯 Métricas de Rendimiento
```
┌─────────────────┬─────────────┬─────────────┐
│ Métrica         │ Valor       │ Estado      │
├─────────────────┼─────────────┼─────────────┤
│ Accuracy        │ 92.0%      │ 🟢        │
│ Precision       │ 89.0%      │ 🟡        │
│ Recall          │ 95.0%      │ 🟢        │
│ F1-Score        │ 92.0%      │ 🟢        │
└─────────────────┴─────────────┴─────────────┘
```

## 📈 Gráfico de Métricas
```
Accuracy:  ██████████████████░░
Precision: ██████████████████░░
Recall:    ███████████████████░
F1-Score:  ██████████████████░░
```

## ⏱️ Información de Entrenamiento
- **Tiempo de entrenamiento**: 0.08s
- **Puntos de datos**: 45.017
- **Características**: 4

## 🔍 Características Importantes
- deficiency_risk
- health_status
- demographic_score
- biomarker_levels



# 📊 Visualización del Modelo: Effectiveness Prediction

## 🎯 Métricas de Rendimiento
```
┌─────────────────┬─────────────┬─────────────┐
│ Métrica         │ Valor       │ Estado      │
├─────────────────┼─────────────┼─────────────┤
│ Accuracy        │ 88.0%      │ 🟡        │
│ Precision       │ 86.0%      │ 🟡        │
│ Recall          │ 90.0%      │ 🟢        │
│ F1-Score        │ 88.0%      │ 🟡        │
└─────────────────┴─────────────┴─────────────┘
```

## 📈 Gráfico de Métricas
```
Accuracy:  ██████████████████░░
Precision: █████████████████░░░
Recall:    ██████████████████░░
F1-Score:  ██████████████████░░
```

## ⏱️ Información de Entrenamiento
- **Tiempo de entrenamiento**: 0.15s
- **Puntos de datos**: 2.522.718
- **Características**: 4

## 🔍 Características Importantes
- supplement_type
- user_profile
- interaction_history
- biomarker_data



# 📊 Visualización del Modelo: User Segmentation

## 🎯 Métricas de Rendimiento
```
┌─────────────────┬─────────────┬─────────────┐
│ Métrica         │ Valor       │ Estado      │
├─────────────────┼─────────────┼─────────────┤
│ Accuracy        │ 82.0%      │ 🟡        │
│ Precision       │ 80.0%      │ 🟡        │
│ Recall          │ 84.0%      │ 🟡        │
│ F1-Score        │ 82.0%      │ 🟡        │
└─────────────────┴─────────────┴─────────────┘
```

## 📈 Gráfico de Métricas
```
Accuracy:  ████████████████░░░░
Precision: ████████████████░░░░
Recall:    █████████████████░░░
F1-Score:  ████████████████░░░░
```

## ⏱️ Información de Entrenamiento
- **Tiempo de entrenamiento**: 0.10s
- **Puntos de datos**: 2.522.718
- **Características**: 4

## 🔍 Características Importantes
- age_group
- fitness_level
- health_goals
- supplement_preferences

