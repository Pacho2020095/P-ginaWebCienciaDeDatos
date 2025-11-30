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

// Mapping de peaje -> archivo de resultados
const PEAJE_MODEL_FILES = {
  Sachica: "resultados_sachica_sentido_1.csv",
  Bicentenario: "resultados_bicentenario_sentido_1.csv",
  Casablanca: "resultados_casablanca_sentido_1.csv",
  Cerritos: "resultados_cerritos_ii_sentido_1.csv",
  "La Parada": "resultados_la_parada_sentido_2.csv",
  "Tunel de la Linea": "resultados_peaje_tunel_la_linea_tolima_sentido_1.csv",
  "Pto Triunfo": "resultados_pto_triunfo_sentido_1.csv",
};

let chart1Instance = null;
let chart1DataByYear = null;

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

// ========== Gráfico 1: preparar datos por año ==========

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

// ========== Sección Modelos: 1) Resumen de modelos ==========

async function initModelsSummary() {
  const summaryDiv = document.getElementById("models-summary-text");
  const tableEl = document.getElementById("models-summary-table");
  if (!summaryDiv || !tableEl) return;

  summaryDiv.textContent = "Cargando resumen de modelos...";
  tableEl.innerHTML = "";

  try {
    const { headers, rows } = await loadCSV("resumen_metricas_modelos.csv");
    if (!rows.length) {
      summaryDiv.textContent = "No se encontraron modelos en resumen_metricas_modelos.csv.";
      return;
    }

    const peajes = new Set(rows.map((r) => r.peaje));
    const targets = new Set(rows.map((r) => r.target));

    const metricRows = rows.map((r) => ({
      modelo: r.modelo,
      peaje: r.peaje,
      target: r.target,
      rmse_test: parseFloat(r.rmse_test),
      mae_test: parseFloat(r.mae_test),
      smape_test: parseFloat(r.smape_test),
      mase_test: parseFloat(r.mase_test),
    }));

    const rmseVals = metricRows
      .map((m) => m.rmse_test)
      .filter((v) => !isNaN(v));
    const smapeVals = metricRows
      .map((m) => m.smape_test)
      .filter((v) => !isNaN(v));

    const minRMSE = rmseVals.length ? Math.min(...rmseVals) : NaN;
    const maxRMSE = rmseVals.length ? Math.max(...rmseVals) : NaN;
    const avgRMSE =
      rmseVals.length > 0
        ? rmseVals.reduce((a, b) => a + b, 0) / rmseVals.length
        : NaN;

    const minSMAPE = smapeVals.length ? Math.min(...smapeVals) : NaN;
    const maxSMAPE = smapeVals.length ? Math.max(...smapeVals) : NaN;

    let bestModel = null;
    metricRows.forEach((m) => {
      if (isNaN(m.rmse_test)) return;
      if (!bestModel || m.rmse_test < bestModel.rmse_test) {
        bestModel = m;
      }
    });

    summaryDiv.innerHTML = `
      <p>Se entrenaron <strong>${rows.length}</strong> modelos para
      <strong>${peajes.size}</strong> peajes y
      <strong>${targets.size}</strong> targets (sentidos).</p>
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
        con RMSE test = <strong>${bestModel.rmse_test.toFixed(1)}</strong>.
      </p>`
          : ""
      }
    `;

    // Tabla de resumen (peaje, target, rmse_test, mae_test, smape_test, mase_test)
    const cols = [
      { key: "peaje", label: "Peaje" },
      { key: "target", label: "Target" },
      { key: "rmse_test", label: "RMSE test" },
      { key: "mae_test", label: "MAE test" },
      { key: "smape_test", label: "sMAPE test (%)" },
      { key: "mase_test", label: "MASE test" },
    ];

    let theadHtml = "<thead><tr>";
    cols.forEach((c) => {
      theadHtml += `<th>${c.label}</th>`;
    });
    theadHtml += "</tr></thead>";

    let tbodyHtml = "<tbody>";
    metricRows.forEach((m) => {
      tbodyHtml += "<tr>";
      cols.forEach((c) => {
        let val = m[c.key];
        if (typeof val === "number") {
          val = isNaN(val) ? "N/D" : val.toFixed(2);
        }
        tbodyHtml += `<td>${val}</td>`;
      });
      tbodyHtml += "</tr>";
    });
    tbodyHtml += "</tbody>";

    tableEl.innerHTML = theadHtml + tbodyHtml;
  } catch (err) {
    console.error("Error cargando resumen_metricas_modelos.csv:", err);
    summaryDiv.textContent =
      "Error al cargar resumen_metricas_modelos.csv. Verifica que el archivo exista en la misma carpeta.";
  }
}

// ========== Sección Modelos: 2) trafico_limpio ==========

async function initTraficoSummary() {
  const summaryDiv = document.getElementById("trafico-summary");
  const tableEl = document.getElementById("trafico-table");
  if (!summaryDiv || !tableEl) return;

  summaryDiv.textContent =
    "Cargando información de trafico_limpio.csv...";
  tableEl.innerHTML = "";

  try {
    const { headers, rows } = await loadCSV("trafico_limpio.csv");
    if (!rows.length) {
      summaryDiv.textContent =
        "No se encontraron filas en trafico_limpio.csv.";
      return;
    }

    const totalReg = rows.length;
    const peajes = new Set(rows.map((r) => r.peaje));
    const tiposDia = new Set(rows.map((r) => r.tipo_dia));

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
      <strong>${peajes.size}</strong> peajes y distintos tipos de día
      (${Array.from(tiposDia).join(", ")}).</p>
      <p>
        El rango temporal va aproximadamente desde
        <strong>${minFecha || "N/D"}</strong> hasta
        <strong>${maxFecha || "N/D"}</strong>.
      </p>
      <p>Debajo se muestra una muestra de las primeras filas del dataset.</p>
    `;

    // Tabla de muestra (primeras 10 filas)
    const columnsToShow = [
      "fecha",
      "peaje",
      "sentido_1",
      "sentido_2",
      "total",
      "tipo_dia",
    ];

    let theadHtml = "<thead><tr>";
    columnsToShow.forEach((c) => {
      theadHtml += `<th>${c}</th>`;
    });
    theadHtml += "</tr></thead>";

    let tbodyHtml = "<tbody>";
    rows.slice(0, 10).forEach((r) => {
      tbodyHtml += "<tr>";
      columnsToShow.forEach((c) => {
        tbodyHtml += `<td>${r[c] !== undefined ? r[c] : ""}</td>`;
      });
      tbodyHtml += "</tr>";
    });
    tbodyHtml += "</tbody>";

    tableEl.innerHTML = theadHtml + tbodyHtml;
  } catch (err) {
    console.error("Error cargando trafico_limpio.csv:", err);
    summaryDiv.textContent =
      "Error al cargar trafico_limpio.csv. Verifica que el archivo exista en la misma carpeta.";
  }
}

// ========== Sección Modelos: 3) Modelo por peaje ==========

async function loadPeajeModel(peajeKey) {
  const file = PEAJE_MODEL_FILES[peajeKey];
  const summaryDiv = document.getElementById("peaje-model-summary");
  const tableEl = document.getElementById("peaje-model-table");

  if (!file || !summaryDiv || !tableEl) return;

  summaryDiv.textContent = "Cargando modelo para " + peajeKey + "...";
  tableEl.innerHTML = "";

  try {
    const { headers, rows } = await loadCSV(file);
    if (!rows.length) {
      summaryDiv.textContent =
        "No se encontraron datos en " + file + ".";
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

    summaryDiv.innerHTML = `
      <p><strong>Peaje:</strong> ${nombrePeaje}</p>
      <p><strong>Modelo:</strong> ${modelo}</p>
      <p><strong>Target:</strong> ${target}</p>
      <p>
        <strong>Métricas (misma configuración en todas las filas del set)</strong><br/>
        RMSE val = ${fmt("rmse_val")}, MAE val = ${fmt("mae_val")}, sMAPE val = ${fmt(
      "smape_val"
    )}%, MASE val = ${fmt("mase_val")}<br/>
        RMSE test = ${fmt("rmse_test")}, MAE test = ${fmt(
      "mae_test"
    )}, sMAPE test = ${fmt("smape_test")}%, MASE test = ${fmt("mase_test")}
      </p>
      <p>Debajo se muestra una muestra de las últimas predicciones del conjunto de prueba.</p>
    `;

    // Filtrar filas de test y ordenarlas por fecha
    const testRows = rows.filter(
      (r) => (r.set || "").toLowerCase() === "test"
    );
    testRows.sort((a, b) => {
      const fa = a.fecha || "";
      const fb = b.fecha || "";
      return fa.localeCompare(fb);
    });

    const lastRows = testRows.slice(-15); // últimas 15 observaciones de test

    const cols = ["fecha", "y_real", "y_pred", "set"];

    let theadHtml = "<thead><tr>";
    cols.forEach((c) => {
      theadHtml += `<th>${c}</th>`;
    });
    theadHtml += "</tr></thead>";

    let tbodyHtml = "<tbody>";
    lastRows.forEach((r) => {
      tbodyHtml += "<tr>";
      cols.forEach((c) => {
        let val = r[c] !== undefined ? r[c] : "";
        if (c === "y_real" || c === "y_pred") {
          const num = parseFloat(val);
          val = isNaN(num) ? val : num.toFixed(0);
        }
        tbodyHtml += `<td>${val}</td>`;
      });
      tbodyHtml += "</tr>";
    });
    tbodyHtml += "</tbody>";

    tableEl.innerHTML = theadHtml + tbodyHtml;
  } catch (err) {
    console.error("Error cargando archivo para peaje", peajeKey, err);
    summaryDiv.textContent =
      "Error al cargar el archivo " +
      file +
      ". Verifica que exista en la misma carpeta.";
  }
}

function setupPeajeSelector() {
  const select = document.getElementById("peaje-select");
  if (!select) return;

  // Llenar el select con las opciones de peajes
  select.innerHTML = "";
  Object.keys(PEAJE_MODEL_FILES).forEach((peaje) => {
    const opt = document.createElement("option");
    opt.value = peaje;
    opt.textContent = peaje;
    select.appendChild(opt);
  });

  // Cambiar modelo al cambiar el peaje
  select.addEventListener("change", (e) => {
    const peajeKey = e.target.value;
    loadPeajeModel(peajeKey);
  });

  // Cargar por defecto el primero
  const firstKey = Object.keys(PEAJE_MODEL_FILES)[0];
  if (firstKey) {
    select.value = firstKey;
    loadPeajeModel(firstKey);
  }
}

// ========== Init ==========

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();

  // Gráficos de análisis exploratorio
  const resumenGraficas = await cargarResumen();
  crearGraficos(resumenGraficas);

  // Sección de modelos (resumen, trafico_limpio, selector de peaje)
  await initModelsSummary();
  await initTraficoSummary();
  setupPeajeSelector();
});
