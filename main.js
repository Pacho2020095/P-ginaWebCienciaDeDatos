// Meses fijos (12 labels siempre)
const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
// Años que quieres en el switch
const YEAR_RANGE = ["2021", "2022", "2023", "2024", "2025"];

// Mapping de peaje -> { sentido -> archivo }
const PEAJE_MODEL_FILES = {
  Sachica: {
    "1": "resultados_sachica_sentido_1.csv",
    "2": "resultados_sachica_sentido_2.csv",
  },
  Bicentenario: {
    "1": "resultados_bicentenario_sentido_1.csv",
    "2": "resultados_bicentenario_sentido_2.csv",
  },
  Casablanca: {
    "1": "resultados_casablanca_sentido_1.csv",
    "2": "resultados_casablanca_sentido_2.csv",
  },
  Cerritos: {
    "1": "resultados_cerritos_ii_sentido_1.csv",
    "2": "resultados_cerritos_ii_sentido_2.csv",
  },
  "La Parada": {
    "2": "resultados_la_parada_sentido_2.csv", // solo sentido 2 disponible
  },
  "Tunel de la Linea": {
    "1": "resultados_peaje_tunel_la_linea_tolima_sentido_1.csv",
    "2": "resultados_peaje_tunel_la_linea_quindio_sentido_2.csv",
  },
  "Pto Triunfo": {
    "1": "resultados_pto_triunfo_sentido_1.csv",
    "2": "resultados_pto_triunfo_sentido_2.csv",
  },
};

let chart1Instance = null;
let chart1DataByYear = null;

// Gráficos de modelos
let modelsSummaryChart = null;
let traficoChart = null;
let peajeModelChart = null;

// Datos crudos
let traficoRows = null;
let modelsRows = null; // resumen_metricas_modelos

// ========== Utilidades generales ==========

// Cargar JSON de resumen_graficas
async function cargarResumen() {
  try {
    const resp = await fetch("resumen_graficas.json");
    if (!resp.ok) {
      throw new Error("HTTP " + resp.status);
    }
    const data = await resp.json();
    return data;
  } catch (err) {
    console.error("Error cargando resumen_graficas.json:", err);
    const errorDiv = document.getElementById("error");
    if (errorDiv) {
      errorDiv.style.display = "block";
    }
    return null;
  }
}

// Parseo simple de CSV (asume que no hay comas dentro de los campos)
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) {
    return { headers: [], rows: [] };
  }
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx].trim() : "";
      });
      return obj;
    });

  return { headers, rows };
}

// Carga un CSV como texto y lo parsea
async function loadCSV(path) {
  const resp = await fetch(path);
  if (!resp.ok) {
    throw new Error("HTTP " + resp.status + " al cargar " + path);
  }
  const text = await resp.text();
  return parseCSV(text);
}

// ========== Gráfico 1 (EDA): preparar datos por año ==========

function prepararDatosChart1(c1) {
  const dataByYear = {};
  const labels = c1.labels || [];
  const values = c1.data || [];

  labels.forEach((lab, idx) => {
    // lab ej: "Ene 2021"
    const partes = lab.split(" ");
    if (partes.length !== 2) return;

    const mesStr = partes[0]; // "Ene"
    const anioStr = partes[1]; // "2021"
    const monthIndex = MONTH_LABELS.indexOf(mesStr);
    if (monthIndex === -1) return;

    if (!dataByYear[anioStr]) {
      dataByYear[anioStr] = new Array(12).fill(null);
    }

    const val = values[idx];
    const numVal = val == null || val === "" ? null : Number(val);
    dataByYear[anioStr][monthIndex] = isNaN(numVal) ? null : numVal;
  });

  // Garantizar los años 2021–2025 aunque no tengan datos
  YEAR_RANGE.forEach((y) => {
    if (!dataByYear[y]) {
      dataByYear[y] = new Array(12).fill(null);
    }
  });

  // Año por defecto: el último de YEAR_RANGE que tenga al menos un dato
  let defaultYear = YEAR_RANGE[0];
  for (let i = YEAR_RANGE.length - 1; i >= 0; i--) {
    const y = YEAR_RANGE[i];
    const arr = dataByYear[y] || [];
    const tieneDatos = arr.some((v) => v != null && !isNaN(v));
    if (tieneDatos) {
      defaultYear = y;
      break;
    }
  }

  return {
    dataByYear,
    years: YEAR_RANGE,
    months: MONTH_LABELS,
    defaultYear,
  };
}

// ========== Crear gráficos de la vista EDA ==========

function crearGraficos(resumen) {
  if (!resumen) return;

  // ---------- Gráfico 1: línea con selector de año ----------
  if (resumen.chart1) {
    const c1 = resumen.chart1;
    const config1 = prepararDatosChart1(c1);
    chart1DataByYear = config1.dataByYear;

    const ctx1 = document.getElementById("chart1").getContext("2d");
    const yearSelect = document.getElementById("yearSelect");

    // Llenar el <select> con los años
    yearSelect.innerHTML = "";
    config1.years.forEach((y) => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      if (y === config1.defaultYear) {
        opt.selected = true;
      }
      yearSelect.appendChild(opt);
    });

    // Crear el gráfico inicial con el año por defecto
    chart1Instance = new Chart(ctx1, {
      type: "line",
      data: {
        labels: config1.months,
        datasets: [
          {
            label: c1.title + " (" + config1.defaultYear + ")",
            data: chart1DataByYear[config1.defaultYear],
            borderWidth: 2,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Mes",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: c1.yLabel || "Valor",
            },
          },
        },
      },
    });

    // Cambiar el año cuando se selecciona otro
    yearSelect.addEventListener("change", (e) => {
      const year = e.target.value;
      if (!chart1Instance || !chart1DataByYear[year]) return;

      chart1Instance.data.datasets[0].data = chart1DataByYear[year];
      chart1Instance.data.datasets[0].label = c1.title + " (" + year + ")";
      chart1Instance.update();
    });
  }

  // ---------- Gráfico 2: barras ----------
  if (resumen.chart2) {
    const c2 = resumen.chart2;
    const ctx2 = document.getElementById("chart2").getContext("2d");
    new Chart(ctx2, {
      type: "bar",
      data: {
        labels: c2.labels,
        datasets: [
          {
            label: c2.title,
            data: c2.data,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Peaje",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: c2.yLabel || "Valor",
            },
          },
        },
      },
    });
  }

  // ---------- Gráfico 3: pie ----------
  if (resumen.chart3) {
    const c3 = resumen.chart3;
    const ctx3 = document.getElementById("chart3").getContext("2d");
    new Chart(ctx3, {
      type: "pie",
      data: {
        labels: c3.labels,
        datasets: [
          {
            label: c3.title,
            data: c3.data,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}

// ========== Navegación entre vistas ==========

function setupNavigation() {
  const buttons = document.querySelectorAll(".nav-button");
  const views = document.querySelectorAll(".view-section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;

      // Actualizar botón activo
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Mostrar solo la vista seleccionada
      views.forEach((view) => {
        view.classList.toggle("active", view.id === targetId);
      });
    });
  });
}

// ========== Sección Modelos: 1) Resumen de modelos (selector + gráfico) ==========

function computeModelsSummaryHTML(rows, mode, peaje, sentido) {
  const peajes = new Set(rows.map((r) => r.peaje));
  const targets = new Set(rows.map((r) => r.target));

  const rmseVals = rows
    .map((r) => parseFloat(r.rmse_test))
    .filter((v) => !isNaN(v));
  const smapeVals = rows
    .map((r) => parseFloat(r.smape_test))
    .filter((v) => !isNaN(v));

  const minRMSE = rmseVals.length ? Math.min(...rmseVals) : NaN;
  const maxRMSE = rmseVals.length ? Math.max(...rmseVals) : NaN;
  const avgRMSE =
    rmseVals.length > 0 ? rmseVals.reduce((a, b) => a + b, 0) / rmseVals.length : NaN;

  const minSMAPE = smapeVals.length ? Math.min(...smapeVals) : NaN;
  const maxSMAPE = smapeVals.length ? Math.max(...smapeVals) : NaN;

  let bestModel = null;
  rows.forEach((r) => {
    const v = parseFloat(r.rmse_test);
    if (isNaN(v)) return;
    if (!bestModel || v < parseFloat(bestModel.rmse_test)) {
      bestModel = r;
    }
  });

  const scopeText =
    mode === "general"
      ? "en todos los peajes y targets"
      : `para <strong>${peaje}</strong> (sentido ${sentido})`;

  return `
    <p>Se consideran <strong>${rows.length}</strong> modelos ${scopeText}, que cubren
    <strong>${peajes.size}</strong> peajes y
    <strong>${targets.size}</strong> targets.</p>
    <p>
      En el conjunto de prueba, el RMSE va aproximadamente de
      <strong>${isNaN(minRMSE) ? "N/D" : minRMSE.toFixed(1)}</strong> a
      <strong>${isNaN(maxRMSE) ? "N/D" : maxRMSE.toFixed(1)}</strong>,
      con un promedio cercano a
      <strong>${isNaN(avgRMSE) ? "N/D" : avgRMSE.toFixed(1)}</strong>.
    </p>
    <p>
      El sMAPE en prueba se mueve entre
      <strong>${isNaN(minSMAPE) ? "N/D" : minSMAPE.toFixed(2)}%</strong> y
      <strong>${isNaN(maxSMAPE) ? "N/D" : maxSMAPE.toFixed(2)}%</strong>.
    </p>
    ${
      bestModel
        ? `<p>
      El mejor modelo por RMSE de prueba corresponde al peaje
      <strong>${bestModel.peaje}</strong> (${bestModel.target}),
      con RMSE test = <strong>${parseFloat(
        bestModel.rmse_test
      ).toFixed(1)}</strong>.
    </p>`
        : ""
    }
  `;
}

function updateModelsChart(mode, peaje, sentido) {
  const summaryDiv = document.getElementById("models-summary-text");
  const canvas = document.getElementById("models-summary-chart");
  if (!summaryDiv || !canvas || !modelsRows) return;

  let rows = modelsRows;

  if (mode === "peaje-sentido") {
    const targetStr = sentido === "1" ? "sentido_1" : "sentido_2";
    rows = modelsRows.filter(
      (r) => r.peaje === peaje && r.target === targetStr
    );
  }

  if (!rows.length) {
    summaryDiv.innerHTML =
      mode === "general"
        ? "No se encontraron modelos en resumen_metricas_modelos.csv."
        : `No se encontraron modelos para <strong>${peaje}</strong> en sentido <strong>${sentido}</strong>.`;
    if (modelsSummaryChart) {
      modelsSummaryChart.destroy();
      modelsSummaryChart = null;
    }
    return;
  }

  // Texto de resumen
  summaryDiv.innerHTML = computeModelsSummaryHTML(rows, mode, peaje, sentido);

  // Preparar datos para gráfico
  let labels, data;
  if (mode === "general") {
    labels = rows.map((r) => {
      const t =
        r.target === "sentido_1"
          ? "S1"
          : r.target === "sentido_2"
          ? "S2"
          : r.target;
      return `${r.peaje} (${t})`;
    });
    data = rows.map((r) => {
      const v = parseFloat(r.rmse_test);
      return isNaN(v) ? null : v;
    });
  } else {
    // Por peaje y sentido: barras por modelo
    labels = rows.map((r) => r.modelo || `${r.peaje} (${r.target})`);
    data = rows.map((r) => {
      const v = parseFloat(r.rmse_test);
      return isNaN(v) ? null : v;
    });
  }

  if (modelsSummaryChart) {
    modelsSummaryChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  modelsSummaryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "RMSE test",
          data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxRotation: 60,
            minRotation: 40,
            autoSkip: false,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "RMSE test",
          },
        },
      },
    },
  });
}

function setupModelsControls() {
  const modeSelect = document.getElementById("models-mode");
  const peajeSelect = document.getElementById("models-peaje-select");
  const sentidoSelect = document.getElementById("models-sentido-select");
  const peajeRow = document.querySelector(".models-peaje-row");
  const sentidoRow = document.querySelector(".models-sentido-row");

  if (!modeSelect || !peajeSelect || !sentidoSelect || !modelsRows) return;

  // Poblar peajes desde modelos
  const peajesSet = new Set(modelsRows.map((r) => r.peaje).filter(Boolean));
  const peajes = Array.from(peajesSet).sort();
  peajeSelect.innerHTML = "";
  peajes.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    peajeSelect.appendChild(opt);
  });

  function refreshVisibility() {
    const mode = modeSelect.value;
    if (mode === "peaje-sentido") {
      if (peajeRow) peajeRow.style.display = "flex";
      if (sentidoRow) sentidoRow.style.display = "flex";
    } else {
      if (peajeRow) peajeRow.style.display = "none";
      if (sentidoRow) sentidoRow.style.display = "none";
    }
  }

  function updateFromControls() {
    const mode = modeSelect.value;
    const peaje = peajeSelect.value;
    const sentido = sentidoSelect.value;
    updateModelsChart(mode, peaje, sentido);
  }

  modeSelect.addEventListener("change", () => {
    refreshVisibility();
    updateFromControls();
  });
  peajeSelect.addEventListener("change", updateFromControls);
  sentidoSelect.addEventListener("change", updateFromControls);

  // Estado inicial: general
  modeSelect.value = "general";
  refreshVisibility();
  updateFromControls();
}

async function initModelsSummary() {
  const summaryDiv = document.getElementById("models-summary-text");
  if (!summaryDiv) return;

  summaryDiv.textContent = "Cargando resumen de modelos...";

  try {
    const { headers, rows } = await loadCSV("resumen_metricas_modelos.csv");
    modelsRows = rows;
    if (!rows.length) {
      summaryDiv.textContent =
        "No se encontraron modelos en resumen_metricas_modelos.csv.";
      return;
    }

    setupModelsControls();
  } catch (err) {
    console.error("Error cargando resumen_metricas_modelos.csv:", err);
    summaryDiv.textContent =
      "Error al cargar resumen_metricas_modelos.csv. Verifica que el archivo exista en la misma carpeta.";
  }
}

// ========== Sección Modelos: 2) trafico_limpio (gráfico con selector) ==========

function updateTraficoChart(mode, peaje, sentido) {
  const canvas = document.getElementById("trafico-chart");
  if (!canvas || !traficoRows) return;

  const ctx = canvas.getContext("2d");

  const grupos = {};
  traficoRows.forEach((r) => {
    const tipo = r.tipo_dia || "desconocido";

    // Filtrado por peaje en modo peaje-sentido
    if (mode === "peaje-sentido") {
      if (!peaje || r.peaje !== peaje) return;
    }

    let val;
    if (mode === "general") {
      // componente general: promedio de la columna "total"
      val = parseFloat(r.total);
    } else {
      // por peaje y sentido: usar sentido_1 o sentido_2
      if (sentido === "1") {
        val = parseFloat(r.sentido_1);
      } else if (sentido === "2") {
        val = parseFloat(r.sentido_2);
      } else {
        val = parseFloat(r.total);
      }
    }

    if (!grupos[tipo]) {
      grupos[tipo] = { suma: 0, n: 0 };
    }
    if (!isNaN(val)) {
      grupos[tipo].suma += val;
      grupos[tipo].n += 1;
    }
  });

  const tipos = Object.keys(grupos);
  const labels = tipos.map((t) =>
    t
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const data = tipos.map((t) =>
    grupos[t].n > 0 ? grupos[t].suma / grupos[t].n : 0
  );

  let labelText;
  if (mode === "general") {
    labelText = "Tráfico promedio diario (total, todos los peajes)";
  } else {
    labelText = `Tráfico promedio diario - ${peaje} - sentido ${sentido}`;
  }

  if (traficoChart) {
    traficoChart.destroy();
  }

  traficoChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: labelText,
          data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Tipo de día",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Promedio de vehículos por día",
          },
        },
      },
    },
  });
}

function setupTraficoControls() {
  const modeSelect = document.getElementById("trafico-mode");
  const peajeSelect = document.getElementById("trafico-peaje-select");
  const sentidoSelect = document.getElementById("trafico-sentido-select");
  const peajeRow = document.querySelector(".trafico-peaje-row");
  const sentidoRow = document.querySelector(".trafico-sentido-row");

  if (!modeSelect || !peajeSelect || !sentidoSelect || !traficoRows) return;

  // Poblar peajes desde el dataset
  const peajesSet = new Set();
  traficoRows.forEach((r) => {
    if (r.peaje) peajesSet.add(r.peaje);
  });
  const peajes = Array.from(peajesSet).sort();
  peajeSelect.innerHTML = "";
  peajes.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    peajeSelect.appendChild(opt);
  });

  function refreshVisibility() {
    const mode = modeSelect.value;
    if (mode === "peaje-sentido") {
      if (peajeRow) peajeRow.style.display = "flex";
      if (sentidoRow) sentidoRow.style.display = "flex";
    } else {
      if (peajeRow) peajeRow.style.display = "none";
      if (sentidoRow) sentidoRow.style.display = "none";
    }
  }

  function updateFromControls() {
    const mode = modeSelect.value;
    const peaje = peajeSelect.value;
    const sentido = sentidoSelect.value;
    updateTraficoChart(mode, peaje, sentido);
  }

  modeSelect.addEventListener("change", () => {
    refreshVisibility();
    updateFromControls();
  });
  peajeSelect.addEventListener("change", updateFromControls);
  sentidoSelect.addEventListener("change", updateFromControls);

  // Estado inicial: vista general
  modeSelect.value = "general";
  refreshVisibility();
  updateFromControls();
}

async function initTraficoSummary() {
  const summaryDiv = document.getElementById("trafico-summary");
  if (!summaryDiv) return;

  summaryDiv.textContent = "Cargando información de trafico_limpio.csv...";

  try {
    const { headers, rows } = await loadCSV("trafico_limpio.csv");
    traficoRows = rows;
    if (!rows.length) {
      summaryDiv.textContent =
        "No se encontraron filas en trafico_limpio.csv.";
      return;
    }

    const totalReg = rows.length;
    const peajes = new Set(rows.map((r) => r.peaje));
    const fechas = rows.map((r) => r.fecha).filter(Boolean);
    let minFecha = null;
    let maxFecha = null;
    if (fechas.length) {
      minFecha = fechas.reduce((a, b) => (a < b ? a : b));
      maxFecha = fechas.reduce((a, b) => (a > b ? a : b));
    }

    summaryDiv.innerHTML = `
      <p>El dataset <code>trafico_limpio.csv</code> contiene
      <strong>${totalReg}</strong> registros diarios de tráfico, cubriendo
      <strong>${peajes.size}</strong> peajes.</p>
      <p>
        El rango temporal va aproximadamente desde
        <strong>${minFecha || "N/D"}</strong> hasta
        <strong>${maxFecha || "N/D"}</strong>.
      </p>
      <p>Puedes alternar entre una vista general y una vista filtrada por peaje y sentido.</p>
    `;

    setupTraficoControls();
  } catch (err) {
    console.error("Error cargando trafico_limpio.csv:", err);
    summaryDiv.textContent =
      "Error al cargar trafico_limpio.csv. Verifica que el archivo exista en la misma carpeta.";
  }
}

// ========== Sección Modelos: 3) Modelo por peaje y sentido (gráfico) ==========

async function loadPeajeModel(peajeKey, sentido) {
  const filesBySentido = PEAJE_MODEL_FILES[peajeKey] || {};
  const file = filesBySentido[sentido];

  const summaryDiv = document.getElementById("peaje-model-summary");
  const canvas = document.getElementById("peaje-model-chart");

  if (!summaryDiv || !canvas) return;

  if (!file) {
    summaryDiv.innerHTML = `
      <p>No hay archivo de resultados configurado para el peaje
      <strong>${peajeKey}</strong> en el sentido <strong>${sentido}</strong>.</p>
      <p>Prueba cambiando el sentido o seleccionando otro peaje.</p>
    `;
    if (peajeModelChart) {
      peajeModelChart.destroy();
      peajeModelChart = null;
    }
    return;
  }

  summaryDiv.textContent =
    "Cargando modelo para " + peajeKey + " (sentido " + sentido + ")...";

  try {
    const { headers, rows } = await loadCSV(file);
    if (!rows.length) {
      summaryDiv.textContent =
        "No se encontraron datos en " + file + ".";
      if (peajeModelChart) {
        peajeModelChart.destroy();
        peajeModelChart = null;
      }
      return;
    }

    const first = rows[0];
    const nombrePeaje = first.peaje || peajeKey;
    const modelo = first.modelo || "N/D";
    const target = first.target || "N/D";

    function fmt(field) {
      const v = parseFloat(first[field]);
      return isNaN(v) ? "N/D" : v.toFixed(2);
    }

    // Filtrar filas de test y ordenarlas por fecha
    const testRows = rows.filter(
      (r) => (r.set || "").toLowerCase() === "test"
    );
    testRows.sort((a, b) => {
      const fa = a.fecha || "";
      const fb = b.fecha || "";
      return fa.localeCompare(fb);
    });

    const lastRows = testRows.slice(-30); // últimas 30 observaciones de test

    const labels = lastRows.map((r) => r.fecha || "");
    const yReal = lastRows.map((r) => {
      const v = parseFloat(r.y_real);
      return isNaN(v) ? null : v;
    });
    const yPred = lastRows.map((r) => {
      const v = parseFloat(r.y_pred);
      return isNaN(v) ? null : v;
    });

    summaryDiv.innerHTML = `
      <p><strong>Peaje:</strong> ${nombrePeaje}</p>
      <p><strong>Modelo:</strong> ${modelo}</p>
      <p><strong>Target:</strong> ${target}</p>
      <p>
        <strong>Métricas (configuración del modelo)</strong><br/>
        RMSE val = ${fmt("rmse_val")}, MAE val = ${fmt("mae_val")}, sMAPE val = ${fmt(
      "smape_val"
    )}%, MASE val = ${fmt("mase_val")}<br/>
        RMSE test = ${fmt("rmse_test")}, MAE test = ${fmt(
      "mae_test"
    )}, sMAPE test = ${fmt("smape_test")}%, MASE test = ${fmt("mase_test")}
      </p>
      <p>Abajo se muestra la comparación entre valores reales y predichos en el conjunto de prueba (últimos días).</p>
    `;

    if (peajeModelChart) {
      peajeModelChart.destroy();
    }

    const ctx = canvas.getContext("2d");
    peajeModelChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "y_real (test)",
            data: yReal,
            borderWidth: 2,
            tension: 0.2,
          },
          {
            label: "y_pred (test)",
            data: yPred,
            borderWidth: 2,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Fecha",
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Vehículos/día",
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error cargando archivo para peaje", peajeKey, err);
    summaryDiv.textContent =
      "Error al cargar el archivo " +
      file +
      ". Verifica que exista en la misma carpeta.";
    if (peajeModelChart) {
      peajeModelChart.destroy();
      peajeModelChart = null;
    }
  }
}

function setupPeajeSelector() {
  const peajeSelect = document.getElementById("peaje-select");
  const sentidoSelect = document.getElementById("sentido-select");
  if (!peajeSelect || !sentidoSelect) return;

  // Llenar el select con las opciones de peajes
  peajeSelect.innerHTML = "";
  Object.keys(PEAJE_MODEL_FILES).forEach((peaje) => {
    const opt = document.createElement("option");
    opt.value = peaje;
    opt.textContent = peaje;
    peajeSelect.appendChild(opt);
  });

  function updatePeajeModel() {
    const peajeKey = peajeSelect.value;
    const sentido = sentidoSelect.value;
    loadPeajeModel(peajeKey, sentido);
  }

  peajeSelect.addEventListener("change", updatePeajeModel);
  sentidoSelect.addEventListener("change", updatePeajeModel);

  // Valor inicial: primer peaje y sentido 1
  const firstKey = Object.keys(PEAJE_MODEL_FILES)[0];
  if (firstKey) {
    peajeSelect.value = firstKey;
  }
  sentidoSelect.value = "1";
  updatePeajeModel();
}

// ========== Init ==========

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();

  // Gráficos de análisis exploratorio
  const resumenGraficas = await cargarResumen();
  crearGraficos(resumenGraficas);

  // Sección de modelos (resumen, trafico_limpio, selector de peaje/sentido)
  await initModelsSummary();
  await initTraficoSummary();
  setupPeajeSelector();
});

