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

let chart1Instance = null;
let chart1DataByYear = null;

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

// Prepara dataByYear para chart1 a partir de labels tipo "Ene 2021"
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

/* Navegación entre vistas (ventanas) */
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

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  const resumen = await cargarResumen();
  crearGraficos(resumen);
});
