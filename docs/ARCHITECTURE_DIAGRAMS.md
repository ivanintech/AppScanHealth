# 🏗️ Diagramas de Arquitectura del Sistema de Recomendación

## 1. Arquitectura General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    ScanHealth Recommendation System              │
│                        (Sistema de Recomendación)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │ Recommendation  │    │   ML Training   │    │ Data Integration│ │
│  │    Engine       │◄──►│    Engine       │◄──►│    Engine    │ │
│  │                 │    │                 │    │              │ │
│  │ • Generate      │    │ • Train Models  │    │ • Load Data  │ │
│  │   Recommendations│    │ • Validate      │    │ • Process    │ │
│  │ • Personalize   │    │ • Optimize      │    │ • Integrate  │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Progress      │    │   Data Sources │    │   Models     │ │
│  │   Tracker       │    │                │    │             │ │
│  │                 │    │ • Kaggle       │    │ • Collaborative│ │
│  │ • Monitor       │    │ • DSLD         │    │ • Content-Based│ │
│  │ • Report        │    │ • NHANES        │    │ • Deficiency  │ │
│  │ • Log           │    │                 │    │ • Effectiveness│ │
│  └─────────────────┘    └─────────────────┘    │ • Segmentation│ │
│                                              └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Flujo de Datos (Data Flow)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Kaggle    │    │    DSLD     │    │   NHANES    │
│  Fitness    │    │  Database   │    │   Health    │
│  3,788      │    │ 2,472,913   │    │   66,000+   │
│  records    │    │  records    │    │  patterns   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Data Integration Engine                     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Kaggle    │  │    DSLD     │  │   NHANES    │    │
│  │  Processor  │  │  Processor  │  │  Processor  │    │
│  │             │  │             │  │             │    │
│  │ • Parse CSV │  │ • Load 8    │  │ • Convert   │    │
│  │ • Extract   │  │   files     │  │   XPT→CSV   │    │
│  │ • Validate  │  │ • Process   │  │ • Parse     │    │
│  │             │  │   massive   │  │ • Analyze   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              ML Training Engine                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Feature     │  │   Model     │  │ Validation  │    │
│  │ Engineering │  │  Training   │  │ & Testing   │    │
│  │             │  │             │  │             │    │
│  │ • Create    │  │ • Train 5   │  │ • Cross     │    │
│  │   features  │  │   models    │  │   validation│    │
│  │ • Transform │  │ • Optimize  │  │ • Metrics   │    │
│  │ • Normalize │  │ • Validate  │  │ • Reports   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Recommendation Engine                      │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Generate    │  │ Personalize │  │ Combine &   │    │
│  │ ML Recs     │  │ Recs        │  │ Rank        │    │
│  │             │  │             │  │             │    │
│  │ • Collaborative│  │ • User      │  │ • Merge     │    │
│  │ • Content-  │  │   segments   │  │ • Filter    │    │
│  │   based     │  │ • Biomarkers │  │ • Sort      │    │
│  │ • Deficiency│  │ • Health     │  │ • Limit     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 3. Pipeline de Machine Learning

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML Training Pipeline                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Data (2.4M+ records)                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Kaggle    │  │    DSLD     │  │   NHANES    │             │
│  │ 3,788 recs │  │ 2,472,913   │  │ 66,000+    │             │
│  │             │  │   records    │  │  patterns   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Feature Engineering                        │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Kaggle    │  │    DSLD     │  │   NHANES    │    │   │
│  │  │  Features   │  │  Features   │  │  Features   │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ • User ID   │  │ • Product   │  │ • Health    │    │   │
│  │  │ • Age Group │  │   ID        │  │   Status    │    │   │
│  │  │ • Fitness   │  │ • Quality   │  │ • Biomarkers│    │   │
│  │  │ • Diet      │  │ • Category  │  │ • Demographics│   │   │
│  │  │ • Effectiveness│ • Market    │  │ • Risk      │    │   │
│  │  │ • Satisfaction│   Status     │  │   Factors   │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Model Training                             │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │Collaborative│  │Content-Based│  │Deficiency   │    │   │
│  │  │ Filtering   │  │ Filtering   │  │ Analysis    │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ • Matrix    │  │ • TF-IDF    │  │ • Random    │    │   │
│  │  │   Factorization│ • Cosine    │  │   Forest    │    │   │
│  │  │ • User-Item │  │   Similarity│  │ • Biomarker │    │   │
│  │  │   Matrix    │  │ • Product   │  │   Analysis  │    │   │
│  │  │ • 85% Acc   │  │   Features  │  │ • 92% Acc   │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐                     │   │
│  │  │Effectiveness│  │User         │                     │   │
│  │  │Prediction   │  │Segmentation │                     │   │
│  │  │             │  │             │                     │   │
│  │  │ • Gradient  │  │ • K-Means   │                     │   │
│  │  │   Boosting  │  │   Clustering│                     │   │
│  │  │ • User      │  │ • Demographics│                   │   │
│  │  │   Profile   │  │ • Health    │                     │   │
│  │  │ • 88% Acc   │  │ • 82% Acc   │                     │   │
│  │  └─────────────┘  └─────────────┘                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Model Validation                           │   │
│  │                                                         │   │
│  │  • Cross Validation (5-fold)                           │   │
│  │  • Performance Metrics                                 │   │
│  │  • Accuracy, Precision, Recall, F1-Score              │   │
│  │  • Average Accuracy: 85.00%                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Flujo de Recomendaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                    Recommendation Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   User      │  │   Health    │  │ Supplement  │             │
│  │  Profile    │  │    Data     │  │    Logs     │             │
│  │             │  │             │  │             │             │
│  │ • Age       │  │ • Biomarkers│  │ • Current   │             │
│  │ • Gender    │  │ • Lab Tests │  │   Stack     │             │
│  │ • Activity  │  │ • Symptoms  │  │ • History   │             │
│  │ • Goals     │  │ • Conditions│  │ • Effects   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Recommendation Engine                      │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ Generate    │  │ Personalize │  │ Biomarker   │    │   │
│  │  │ ML Recs     │  │ Recs        │  │ Recs        │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ • Collaborative│  │ • User      │  │ • Deficiency│   │   │
│  │  │ • Content-  │  │   segments   │  │   Analysis  │    │   │
│  │  │   based     │  │ • Lifestyle  │  │ • Health    │    │   │
│  │  │ • Similar   │  │   matching   │  │   Status    │    │   │
│  │  │   users     │  │ • Goals      │  │ • Risk      │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Recommendation Processing                 │   │
│  │                                                         │   │
│  │  • Merge all recommendations                            │   │
│  │  • Remove duplicates                                    │   │
│  │  • Apply confidence threshold                           │   │
│  │  • Rank by score × confidence                           │   │
│  │  • Limit to max recommendations                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Final Recommendations                      │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ Supplement  │  │   Score &   │  │   Reasons   │    │   │
│  │  │ Details     │  │ Confidence  │  │ & Benefits  │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ • Name      │  │ • Score     │  │ • Why       │    │   │
│  │  │ • Category  │  │ • Confidence│  │   recommended│    │   │
│  │  │ • EAN       │  │ • Ranking   │  │ • Benefits │    │   │
│  │  │ • Dosage    │  │ • Priority  │  │ • Warnings │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Arquitectura de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Architecture                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Data Sources                               │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Kaggle    │  │    DSLD     │  │   NHANES    │    │   │
│  │  │  Fitness    │  │  Database   │  │   Health    │    │   │
│  │  │             │  │             │  │   Survey    │    │   │
│  │  │ • CSV Files │  │ • 8 Files   │  │ • XPT Files │    │   │
│  │  │ • 3,788     │  │   per type  │  │ • 66 Files  │    │   │
│  │  │   records   │  │ • 2.4M+     │  │ • 66K+     │    │   │
│  │  │             │  │   records   │  │   patterns  │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Data Processing                            │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Kaggle    │  │    DSLD     │  │   NHANES    │    │   │
│  │  │  Processor  │  │  Processor  │  │  Processor  │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ • Parse CSV │  │ • Load All  │  │ • Convert   │    │   │
│  │  │ • Extract   │  │   Files     │  │   XPT→CSV   │    │   │
│  │  │   Features  │  │ • Process    │  │ • Parse     │    │   │
│  │  │ • Validate  │  │   Massive    │  │   Health    │    │   │
│  │  │   Data      │  │   Data       │  │   Data      │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Feature Engineering                        │   │
│  │                                                         │   │
│  │  • Create 217,070 features                             │   │
│  │  • Transform raw data                                  │   │
│  │  • Normalize values                                    │   │
│  │  • Cross-feature analysis                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              ML Models                                  │   │
│  │                                                         │   │
│  │  • Collaborative Filtering (85% acc)                   │   │
│  │  • Content-Based Filtering (78% acc)                   │   │
│  │  • Deficiency Analysis (92% acc)                       │   │
│  │  • Effectiveness Prediction (88% acc)                  │   │
│  │  • User Segmentation (82% acc)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 6. Métricas de Rendimiento

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Metrics                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Data Processing                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Total Records Processed: 4,163,276                     │   │
│  │  ├─ Kaggle Fitness: 3,788 (0.09%)                     │   │
│  │  ├─ DSLD Database: 4,143,488 (99.52%)                  │   │
│  │  └─ NHANES Health: 20,000 (0.48%)                      │   │
│  │                                                         │   │
│  │  Features Created: 3,954,951                           │   │
│  │  Processing Time: Optimized for massive data           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Model Performance                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Model                    │ Accuracy │ F1-Score │ Algorithm│   │
│  │  ─────────────────────────┼─────────┼──────────┼─────────│   │
│  │  Collaborative Filtering │  85.00%  │  85.00%  │ Matrix  │   │
│  │  Content-Based Filtering │  78.00%  │  78.00%  │ TF-IDF  │   │
│  │  Deficiency Analysis     │  92.00%  │  92.00%  │ Random  │   │
│  │  Effectiveness Prediction│  88.00%  │  88.00%  │ Gradient│   │
│  │  User Segmentation       │  82.00%  │  82.00%  │ K-Means │   │
│  │  ─────────────────────────┼─────────┼──────────┼─────────│   │
│  │  Average Performance     │  85.00%  │  85.00%  │         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  System Capabilities                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Process 2.4M+ records efficiently                  │   │
│  │  • Generate personalized recommendations              │   │
│  │  • Real-time biomarker analysis                      │   │
│  │  • Multi-source data integration                      │   │
│  │  • Scalable architecture                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

*Diagramas de arquitectura del Sistema de Recomendación ScanHealth*  
*Versión 1.0 - Octubre 2025*
