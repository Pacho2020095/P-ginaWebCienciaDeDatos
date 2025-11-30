
# ENTREGA FINAL – CIENCIA DE DATOS APLICADA / WEBAPP

PROYECTO: ANALÍSIS DE FLUJO VEHICULAR EN PEAJES COLOMBIANOS 

INTEGRANTES: 

* Nicolas González Ochoa. 
* Francisco Santamaría. 
* Ana Catalina Gelvez. 


# 🚧 Descripción del Proyecto

Este proyecto presenta el proceso completo de análisis de datos, preprocesamiento, construcción de modelos de machine learning y despliegue de un dashboard interactivo para los peajes pertenecientes a la Unión Temporal Peajes Nacionales (UTPN).

El objetivo principal fue identificar oportunidades para optimizar los costos operativos de los peajes sin afectar su funcionamiento, a través de modelos predictivos basados en datos históricos de tráfico vehicular.

# 🎯 Objetivos del Proyecto

* Analizar el comportamiento histórico del tráfico vehicular en más de 40 peajes en Colombia.
* Entrenar modelos predictivos para estimar el flujo vehicular por peaje y por sentido.
* Identificar escenarios en los que se puedan desactivar carriles sin afectar la operación.

Diseñar un dashboard web que permita visualizar:

* Datos agregados de tráfico.
* Métricas de los modelos.
* Comparación entre valores reales y predichos.
* Entregar conclusiones de negocio basadas en los resultados.
* Proponer productos de datos que mejoren la operación de la UTPN.

# 🧠 Modelos de Machine Learning

* Se entrenaron modelos por peaje y sentido, utilizando:
* DecisionTreeRegressor
* XGBoost Regressor (modelo con mejor desempeño)

# 📏 Métricas utilizadas

* RMSE
* MAE
* MASE
* sMAPE
* R²

Los mejores modelos lograron errores bajos y una estabilidad alta entre validación y prueba.
En algunos casos, se identificaron oportunidades de optimización de hasta 50% en costos operativos sin afectar la circulación.

# 📊 Dashboard Web

El dashboard fue desarrollado para visualizar:

* Dataset procesado (trafico_limpio)
* Tráfico promedio por tipo de día
* Métricas de cada modelo
* Comparación real vs. predicho por peaje y sentido
* Resumen general de todos los modelos entrenados


# 🛠 Tecnologías utilizadas en el dashboard

* Next.js
* React
* Recharts / Chart.js
* TailwindCSS o CSS Modules


# Vercel para despliegue

📁 Estructura del Repositorio
/
├── data/                 # Datasets brutos y procesados
├── notebooks/            # Jupyter notebooks con análisis y modelado
├── models/               # Modelos entrenados (pickle/joblib)
├── dashboard/            # Código del dashboard web (React / Next.js)
├── diagrams/             # Diagramas y documentación visual
├── utils/                # Scripts auxiliares (métricas, limpieza, etc.)
└── README.md             # Este archivo


# 🧹 Preprocesamiento de Datos

El preprocesamiento incluyó:

* Limpieza de valores nulos
* Revisión de duplicados
* Ajuste de granularidad y fechas
* Reducción de atributos irrelevantes
* Codificación de variables categóricas
* Normalización de valores numéricos

Selección de atributos clave:

* Fecha
* Tráfico por sentido
* Tipo de día

# 🚀 Resultados Principales

* Se lograron modelos robustos para múltiples peajes y sentidos.
* Se identificaron escenarios concretos donde es posible reducir costos operativos hasta un 50%.
* Se construyó un dashboard funcional para uso estratégico del cliente.
* Se generaron insights clave sobre:
* Patrones de tráfico por tipo de día
* Comportamientos por infraestructura (carriles)
* Peajes con mayor potencial de optimización

# 🧩 Tecnologías y Librerías

Lenguajes:

* Python
* JavaScript
* HTML / CSS

Librerías principales (Python)

* Pandas
* NumPy
* Scikit-learn
* XGBoost
* Matplotlib
* Seaborn
* Joblib / Pickle
* Dashboard
* React
* Next.js
* Recharts / Chart.js
* TailwindCSS
* Vercel




