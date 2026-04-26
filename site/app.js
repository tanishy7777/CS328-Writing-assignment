const colors = {
  teal: "#2f6f73",
  rust: "#b4553f",
  blue: "#356d88",
  violet: "#6b5b95",
  gold: "#c69214",
  ink: "#192026",
  gray: "#8a98a3",
};

const charts = {};
let data;

const formatNumber = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

function countryOptions(select, rows, preferred) {
  const countries = [...new Set(rows.map((row) => row.country))].sort();
  select.innerHTML = countries
    .map((country) => `<option value="${country}">${country}</option>`)
    .join("");
  select.value = countries.includes(preferred) ? preferred : countries[0];
}

function pointStyle(rows, selected) {
  return rows.map((row) => (row.country === selected ? 8 : 4));
}

function pointColors(rows, selected, base) {
  return rows.map((row) => (row.country === selected ? colors.gold : base));
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
  }
}

function renderEconomy() {
  const mode = document.querySelector("#economyMode").value;
  const selected = document.querySelector("#economyCountry").value;
  const yLabel = mode === "co2_per_capita"
    ? "CO2 per capita, tonnes/person"
    : "CO2 per GDP, kg per international-$";
  const rows = data.economy.filter((row) => row.gdp_per_capita > 0 && row[mode] != null);

  destroyChart("economy");
  charts.economy = new Chart(document.querySelector("#economyChart"), {
    type: "scatter",
    data: {
      datasets: [{
        label: yLabel,
        data: rows.map((row) => ({ x: row.gdp_per_capita, y: row[mode], country: row.country })),
        backgroundColor: pointColors(rows, selected, colors.blue),
        borderColor: pointColors(rows, selected, colors.blue),
        pointRadius: pointStyle(rows, selected),
      }],
    },
    options: scatterOptions("GDP per capita, log scale", yLabel, true),
  });
}

function renderEnergy() {
  const mode = document.querySelector("#energyMode").value;
  const selected = document.querySelector("#energyCountry").value;
  const rows = mode === "coal" ? data.energyMix : data.energyUse;
  const xKey = mode === "coal" ? "coal_share" : "energy_per_capita";
  const yKey = mode === "coal" ? "co2_per_unit_energy" : "co2_per_capita";
  const xLabel = mode === "coal" ? "Coal share of coal+oil+gas CO2 (%)" : "Primary energy use per capita, kWh/person";
  const yLabel = mode === "coal" ? "CO2 per unit energy, kg/kWh" : "CO2 per capita, tonnes/person";

  destroyChart("energy");
  charts.energy = new Chart(document.querySelector("#energyChart"), {
    type: "scatter",
    data: {
      datasets: [{
        label: yLabel,
        data: rows.map((row) => ({ x: row[xKey], y: row[yKey], country: row.country })),
        backgroundColor: pointColors(rows, selected, mode === "coal" ? colors.rust : colors.teal),
        borderColor: pointColors(rows, selected, mode === "coal" ? colors.rust : colors.teal),
        pointRadius: pointStyle(rows, selected),
      }],
    },
    options: scatterOptions(xLabel, yLabel, false),
  });
}

function tradeRows() {
  const mode = document.querySelector("#tradeMode").value;
  if (mode === "importers") {
    return [...data.trade].sort((a, b) => b.trade_co2_share - a.trade_co2_share).slice(0, 12).reverse();
  }
  if (mode === "exporters") {
    return [...data.trade].sort((a, b) => a.trade_co2_share - b.trade_co2_share).slice(0, 12).reverse();
  }
  const exporters = [...data.trade].sort((a, b) => a.trade_co2_share - b.trade_co2_share).slice(0, 8);
  const importers = [...data.trade].sort((a, b) => b.trade_co2_share - a.trade_co2_share).slice(0, 8);
  return [...exporters, ...importers].sort((a, b) => a.trade_co2_share - b.trade_co2_share);
}

function renderTrade() {
  const rows = tradeRows();
  destroyChart("trade");
  charts.trade = new Chart(document.querySelector("#tradeChart"), {
    type: "bar",
    data: {
      labels: rows.map((row) => row.country),
      datasets: [{
        label: "Trade CO2 share (%)",
        data: rows.map((row) => row.trade_co2_share),
        backgroundColor: rows.map((row) => row.trade_co2_share >= 0 ? colors.blue : colors.rust),
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${formatNumber.format(context.raw)}%`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Trade CO2 share (%)" },
          grid: { color: "rgba(25,32,38,0.08)" },
        },
        y: { grid: { display: false } },
      },
    },
  });
}

function renderTrend() {
  const mode = document.querySelector("#trendMode").value;
  const countries = [...new Set(data.trends.map((row) => row.country))].sort();
  const palette = [colors.blue, colors.rust, colors.teal, colors.violet, colors.gold, "#4b7f52", "#994f88", "#5d6f7f", "#a5652a"];

  destroyChart("trend");
  charts.trend = new Chart(document.querySelector("#trendChart"), {
    type: "line",
    data: {
      datasets: countries.map((country, index) => {
        const rows = data.trends.filter((row) => row.country === country);
        return {
          label: country,
          data: rows.map((row) => ({
            x: row.year,
            y: mode === "index" ? row.co2_index_1990_100 : row.co2,
          })),
          borderColor: palette[index % palette.length],
          backgroundColor: palette[index % palette.length],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25,
        };
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "nearest" },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatNumber.format(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Year" },
          ticks: {
            precision: 0,
            callback: (value) => String(Math.round(value)),
          },
          grid: { color: "rgba(25,32,38,0.08)" },
        },
        y: {
          title: { display: true, text: mode === "index" ? "CO2 emissions index, 1990 = 100" : "Annual CO2, million tonnes" },
          grid: { color: "rgba(25,32,38,0.08)" },
        },
      },
    },
  });
}

function scatterOptions(xLabel, yLabel, logX) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw;
            return `${raw.country}: ${formatNumber.format(raw.x)}, ${formatNumber.format(raw.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: logX ? "logarithmic" : "linear",
        title: { display: true, text: xLabel },
        grid: { color: "rgba(25,32,38,0.08)" },
      },
      y: {
        title: { display: true, text: yLabel },
        grid: { color: "rgba(25,32,38,0.08)" },
      },
    },
  };
}

function showPanel(name) {
  document.querySelectorAll(".tab").forEach((button) => {
    const active = button.dataset.panel === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === name);
  });
  const chart = charts[name];
  if (chart) {
    setTimeout(() => chart.resize(), 0);
  }
}

async function init() {
  const response = await fetch("data/co2-dashboard.json");
  data = await response.json();

  countryOptions(document.querySelector("#economyCountry"), data.economy, "India");
  countryOptions(document.querySelector("#energyCountry"), data.energyUse, "India");

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.panel));
  });
  document.querySelector("#economyMode").addEventListener("change", renderEconomy);
  document.querySelector("#economyCountry").addEventListener("change", renderEconomy);
  document.querySelector("#energyMode").addEventListener("change", renderEnergy);
  document.querySelector("#energyCountry").addEventListener("change", renderEnergy);
  document.querySelector("#tradeMode").addEventListener("change", renderTrade);
  document.querySelector("#trendMode").addEventListener("change", renderTrend);

  renderEconomy();
  renderEnergy();
  renderTrade();
  renderTrend();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

init();
