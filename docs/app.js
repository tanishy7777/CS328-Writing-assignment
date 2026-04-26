const colors = {
  teal: "#2f6f73",
  rust: "#b4553f",
  blue: "#356d88",
  violet: "#6b5b95",
  gold: "#c69214",
  ink: "#192026",
  gray: "#8a98a3",
  green: "#4b7f52",
  magenta: "#994f88",
};

const charts = {};
let data;

const formatNumber = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const formatWhole = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

function setReadout(id, title, body) {
  document.querySelector(id).innerHTML = `<strong>${title}</strong><span>${body}</span>`;
}

function countryOptions(select, rows, preferred) {
  const countries = [...new Set(rows.map((row) => row.country))].sort();
  select.innerHTML = countries
    .map((country) => `<option value="${country}">${country}</option>`)
    .join("");
  select.value = countries.includes(preferred) ? preferred : countries[0];
}

function ensureCountrySelect(select, rows, fallback) {
  const countries = new Set(rows.map((row) => row.country));
  if (!countries.has(select.value)) {
    countryOptions(select, rows, fallback);
  }
  return select.value;
}

function pointStyle(rows, selected) {
  return rows.map((row) => (row.country === selected ? 8 : 4));
}

function pointColors(rows, selected, base) {
  return rows.map((row) => (row.country === selected ? colors.gold : base));
}

function selectedRow(rows, selected) {
  return rows.find((row) => row.country === selected) || rows[0];
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].stop();
    charts[id].destroy();
    delete charts[id];
  }
}

function renderEconomy() {
  const mode = document.querySelector("#economyMode").value;
  const selected = document.querySelector("#economyCountry").value;
  const yLabel = mode === "co2_per_capita"
    ? "CO2 per capita, tonnes/person"
    : "CO2 per GDP, kg per international-$";
  const rows = data.economy.filter((row) => row.gdp_per_capita > 0 && row[mode] != null);
  const row = selectedRow(rows, selected);

  if (mode === "co2_per_capita") {
    setReadout(
      "#economyReadout",
      `${row.country}: income and personal footprint`,
      `GDP per person is ${formatWhole.format(row.gdp_per_capita)} international-$ and CO2 per person is ${formatNumber.format(row.co2_per_capita)} tonnes. This view supports H1A: richer countries usually sit higher on individual emissions.`
    );
  } else {
    setReadout(
      "#economyReadout",
      `${row.country}: wealth is not the same as carbon efficiency`,
      `GDP per person is ${formatWhole.format(row.gdp_per_capita)} international-$ and CO2 per GDP is ${formatNumber.format(row.co2_per_gdp)} kg per international-$. The flatter pattern shows why GDP alone cannot explain emissions intensity.`
    );
  }

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
  const countrySelect = document.querySelector("#energyCountry");
  const rows = mode === "coal" ? data.energyMix : data.energyUse;
  const selected = ensureCountrySelect(countrySelect, rows, "India");
  const xKey = mode === "coal" ? "coal_share" : "energy_per_capita";
  const yKey = mode === "coal" ? "co2_per_unit_energy" : "co2_per_capita";
  const xLabel = mode === "coal" ? "Coal share of coal+oil+gas CO2 (%)" : "Primary energy use per capita, kWh/person";
  const yLabel = mode === "coal" ? "CO2 per unit energy, kg/kWh" : "CO2 per capita, tonnes/person";
  const row = selectedRow(rows, selected);

  if (mode === "coal") {
    setReadout(
      "#energyReadout",
      `${row.country}: fuel mix check`,
      `Coal accounts for ${formatNumber.format(row.coal_share)}% of fossil CO2 in this filtered sample, and energy carbon intensity is ${formatNumber.format(row.co2_per_unit_energy)} kg CO2/kWh. Higher coal share generally pushes countries upward.`
    );
  } else {
    setReadout(
      "#energyReadout",
      `${row.country}: demand check`,
      `Energy use is ${formatWhole.format(row.energy_per_capita)} kWh per person and CO2 is ${formatNumber.format(row.co2_per_capita)} tonnes per person. This view shows why energy demand strongly predicts personal emissions.`
    );
  }

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
  const mostPositive = [...rows].sort((a, b) => b.trade_co2_share - a.trade_co2_share)[0];
  const mostNegative = [...rows].sort((a, b) => a.trade_co2_share - b.trade_co2_share)[0];
  setReadout(
    "#tradeReadout",
    "Read positive and negative bars differently",
    `${mostPositive.country} has the largest positive adjustment in this view (${formatNumber.format(mostPositive.trade_co2_share)}%), so consumption accounting raises its footprint. ${mostNegative.country} has the largest negative adjustment (${formatNumber.format(mostNegative.trade_co2_share)}%), so territorial production is higher than consumption.`
  );

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
  const latestYear = Math.max(...data.trends.map((row) => row.year));
  const latestRows = data.trends.filter((row) => row.year === latestYear);
  const largestDrop = [...latestRows].sort((a, b) => a.co2_index_1990_100 - b.co2_index_1990_100)[0];
  const largestGrowth = [...latestRows].sort((a, b) => b.co2_index_1990_100 - a.co2_index_1990_100)[0];

  if (mode === "index") {
    setReadout(
      "#trendReadout",
      `Indexed to 1990 for fair comparison`,
      `By ${latestYear}, ${largestDrop.country} is at ${formatNumber.format(largestDrop.co2_index_1990_100)} on the 1990=100 scale, while ${largestGrowth.country} is at ${formatNumber.format(largestGrowth.co2_index_1990_100)}. The point is divergence, not one universal pathway.`
    );
  } else {
    setReadout(
      "#trendReadout",
      `Absolute emissions show scale`,
      `In ${latestYear}, the largest annual emitter in this comparison is ${[...latestRows].sort((a, b) => b.co2 - a.co2)[0].country}. Use this view for scale, and the index view for change relative to each country's own 1990 baseline.`
    );
  }

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

function landUseRows() {
  const mode = document.querySelector("#landUseMode").value;
  const rows = [...data.landUse];
  if (mode === "additions") {
    return rows.sort((a, b) => b.luc_gap - a.luc_gap).slice(0, 12).reverse();
  }
  if (mode === "reductions") {
    return rows.sort((a, b) => a.luc_gap - b.luc_gap).slice(0, 12).reverse();
  }
  return rows.sort((a, b) => a.luc_gap - b.luc_gap);
}

function renderLandUse() {
  const rows = landUseRows();
  const largestAddition = [...data.landUse].sort((a, b) => b.luc_gap - a.luc_gap)[0];
  const largestReduction = [...data.landUse].sort((a, b) => a.luc_gap - b.luc_gap)[0];
  setReadout(
    "#landUseReadout",
    "Land use can move the national total in either direction",
    `${largestAddition.country} adds ${formatWhole.format(largestAddition.luc_gap)} million tonnes CO2 when land-use change is included. ${largestReduction.country} moves down by ${formatWhole.format(Math.abs(largestReduction.luc_gap))} million tonnes. This is why fossil-only CO2 is incomplete for some countries.`
  );

  destroyChart("landUse");
  charts.landUse = new Chart(document.querySelector("#landUseChart"), {
    type: "bar",
    data: {
      labels: rows.map((row) => row.country),
      datasets: [{
        label: "Land-use adjustment, million tonnes CO2",
        data: rows.map((row) => row.luc_gap),
        backgroundColor: rows.map((row) => row.luc_gap >= 0 ? colors.rust : colors.teal),
      }],
    },
    options: horizontalBarOptions("Land-use adjustment, million tonnes CO2"),
  });
}

function historyGapRows() {
  const currentHeavy = [...data.historical]
    .sort((a, b) => b.current_minus_cumulative_share_pct - a.current_minus_cumulative_share_pct)
    .slice(0, 8);
  const legacyHeavy = [...data.historical]
    .sort((a, b) => a.current_minus_cumulative_share_pct - b.current_minus_cumulative_share_pct)
    .slice(0, 8);
  return [...legacyHeavy, ...currentHeavy].sort((a, b) => a.current_minus_cumulative_share_pct - b.current_minus_cumulative_share_pct);
}

function renderHistory() {
  const mode = document.querySelector("#historyMode").value;
  const selected = document.querySelector("#historyCountry").value;
  const row = selectedRow(data.historical, selected);
  const summary = data.summaries.historical;
  setReadout(
    "#historyReadout",
    `${row.country}: current and historical shares`,
    `Current share is ${formatNumber.format(row.current_share_pct)}% and cumulative share is ${formatNumber.format(row.cumulative_share_pct)}%. Across ${summary.countries} countries, the top 10 account for ${formatNumber.format(summary.top10_current_share_pct)}% of current CO2 and ${formatNumber.format(summary.top10_cumulative_share_pct)}% of cumulative CO2.`
  );

  destroyChart("history");
  if (mode === "gap") {
    const rows = historyGapRows();
    charts.history = new Chart(document.querySelector("#historyChart"), {
      type: "bar",
      data: {
        labels: rows.map((item) => item.country),
        datasets: [{
          label: "Current share minus cumulative share, percentage points",
          data: rows.map((item) => item.current_minus_cumulative_share_pct),
          backgroundColor: rows.map((item) => item.current_minus_cumulative_share_pct >= 0 ? colors.blue : colors.violet),
        }],
      },
      options: horizontalBarOptions("Current minus cumulative share, percentage points"),
    });
    return;
  }

  charts.history = new Chart(document.querySelector("#historyChart"), {
    type: "scatter",
    data: {
      datasets: [{
        label: "Country shares",
        data: data.historical.map((item) => ({
          x: item.cumulative_share_pct,
          y: item.current_share_pct,
          country: item.country,
        })),
        backgroundColor: pointColors(data.historical, selected, colors.blue),
        borderColor: pointColors(data.historical, selected, colors.blue),
        pointRadius: pointStyle(data.historical, selected),
      }],
    },
    options: scatterOptions("Cumulative CO2 share (%)", "Current annual CO2 share (%)", false),
  });
}

function decouplingPalette(className) {
  if (className === "absolute decoupling") return colors.teal;
  if (className === "relative decoupling") return colors.blue;
  if (className === "no decoupling with growth") return colors.rust;
  return colors.gray;
}

function renderDecoupling() {
  const mode = document.querySelector("#decouplingMode").value;
  const selected = document.querySelector("#decouplingCountry").value;
  const row = selectedRow(data.decoupling, selected);
  const abs = data.summaries.decoupling.find((item) => item.decoupling_class === "absolute decoupling");
  const rel = data.summaries.decoupling.find((item) => item.decoupling_class === "relative decoupling");
  setReadout(
    "#decouplingReadout",
    `${row.country}: ${row.decoupling_class}`,
    `GDP changed by ${formatNumber.format(row.gdp_growth_pct)}%, CO2 changed by ${formatNumber.format(row.co2_growth_pct)}%, and CO2/GDP intensity changed by ${formatNumber.format(row.intensity_change_pct)}%. Overall, ${formatNumber.format(abs.share_pct)}% absolutely decoupled and ${formatNumber.format(rel.share_pct)}% relatively decoupled.`
  );

  destroyChart("decoupling");
  if (mode === "summary") {
    const rows = data.summaries.decoupling;
    charts.decoupling = new Chart(document.querySelector("#decouplingChart"), {
      type: "bar",
      data: {
        labels: rows.map((item) => item.decoupling_class),
        datasets: [{
          label: "Share of matched countries (%)",
          data: rows.map((item) => item.share_pct),
          backgroundColor: rows.map((item) => decouplingPalette(item.decoupling_class)),
        }],
      },
      options: verticalBarOptions("Share of matched countries (%)"),
    });
    return;
  }

  if (mode === "intensity") {
    const lower = [...data.decoupling].sort((a, b) => a.intensity_change_pct - b.intensity_change_pct).slice(0, 10);
    const higher = [...data.decoupling].sort((a, b) => b.intensity_change_pct - a.intensity_change_pct).slice(0, 10);
    const rows = [...lower, ...higher].sort((a, b) => a.intensity_change_pct - b.intensity_change_pct);
    charts.decoupling = new Chart(document.querySelector("#decouplingChart"), {
      type: "bar",
      data: {
        labels: rows.map((item) => item.country),
        datasets: [{
          label: "CO2/GDP intensity change (%)",
          data: rows.map((item) => item.intensity_change_pct),
          backgroundColor: rows.map((item) => item.intensity_change_pct <= 0 ? colors.teal : colors.rust),
        }],
      },
      options: horizontalBarOptions("CO2/GDP intensity change, 1990-2022 (%)"),
    });
    return;
  }

  const classes = [...new Set(data.decoupling.map((item) => item.decoupling_class))];
  charts.decoupling = new Chart(document.querySelector("#decouplingChart"), {
    type: "scatter",
    data: {
      datasets: classes.map((className) => {
        const rows = data.decoupling.filter((item) => item.decoupling_class === className);
        return {
          label: className,
          data: rows.map((item) => ({
            x: item.gdp_growth_pct,
            y: item.co2_growth_pct,
            country: item.country,
          })),
          backgroundColor: rows.map((item) => item.country === selected ? colors.gold : decouplingPalette(className)),
          borderColor: rows.map((item) => item.country === selected ? colors.gold : decouplingPalette(className)),
          pointRadius: rows.map((item) => item.country === selected ? 8 : 4),
        };
      }),
    },
    options: scatterOptions("GDP growth, 1990-2022 (%)", "CO2 growth, 1990-2022 (%)", false),
  });
}

function horizontalBarOptions(xTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${formatNumber.format(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: xTitle },
        grid: { color: "rgba(25,32,38,0.08)" },
      },
      y: { grid: { display: false } },
    },
  };
}

function verticalBarOptions(yTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${formatNumber.format(context.raw)}%`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        title: { display: true, text: yTitle },
        grid: { color: "rgba(25,32,38,0.08)" },
      },
    },
  };
}

function methodStat(label, value, note = "") {
  return `
    <article class="method-stat">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>
  `;
}

function renderHistogramMethod({ id, rows, label, xTitle, barColor, observed, lower, upper }) {
  destroyChart("methods");
  const datasets = [{
    type: "bar",
    label,
    data: rows.map((row) => ({ x: row.x, y: row.count })),
    backgroundColor: barColor,
    borderWidth: 0,
    barPercentage: 1,
    categoryPercentage: 1,
  }];

  if (observed !== undefined) {
    datasets.push({
      type: "scatter",
      label: "Observed statistic",
      data: [{ x: observed, y: Math.max(...rows.map((row) => row.count)) * 0.96 }],
      backgroundColor: colors.gold,
      borderColor: colors.gold,
      pointRadius: 7,
    });
  }

  if (lower !== undefined && upper !== undefined) {
    datasets.push({
      type: "scatter",
      label: "95% bounds",
      data: [
        { x: lower, y: Math.max(...rows.map((row) => row.count)) * 0.88 },
        { x: upper, y: Math.max(...rows.map((row) => row.count)) * 0.88 },
      ],
      backgroundColor: colors.rust,
      borderColor: colors.rust,
      pointRadius: 6,
    });
  }

  charts[id] = new Chart(document.querySelector("#methodChart"), {
    type: "bar",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "nearest" },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatNumber.format(context.parsed.x)}, ${formatNumber.format(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: xTitle },
          grid: { color: "rgba(25,32,38,0.08)" },
        },
        y: {
          title: { display: true, text: "Simulation count" },
          grid: { color: "rgba(25,32,38,0.08)" },
        },
      },
    },
  });
}

function renderKMeans() {
  const clusters = data.methods.kmeans;
  const palette = [colors.blue, colors.rust, colors.teal, colors.violet];
  const rows = clusters.points;
  const tableWrap = document.querySelector("#clusterTableWrap");
  tableWrap.hidden = false;
  document.querySelector("#clusterTableBody").innerHTML = clusters.centers.map((row) => `
    <tr>
      <td>${row.cluster}: ${row.cluster_name}</td>
      <td>${row.countries}</td>
      <td>${formatNumber.format(row.avg_gdp_per_capita)}</td>
      <td>${formatNumber.format(row.avg_energy_per_capita)}</td>
      <td>${formatNumber.format(row.avg_co2_per_capita)}</td>
      <td>${formatNumber.format(row.avg_co2_per_gdp)}</td>
    </tr>
  `).join("");

  destroyChart("methods");
  charts.methods = new Chart(document.querySelector("#methodChart"), {
    type: "scatter",
    data: {
      datasets: [1, 2, 3, 4].map((clusterId, index) => {
        const clusterRows = rows.filter((row) => row.cluster === clusterId);
        return {
          label: clusterRows[0]?.cluster_name || `Cluster ${clusterId}`,
          data: clusterRows.map((row) => ({
            x: row.gdp_per_capita,
            y: row.co2_per_capita,
            country: row.country,
          })),
          backgroundColor: palette[index],
          borderColor: palette[index],
          pointRadius: 4.5,
        };
      }),
    },
    options: scatterOptions("GDP per capita, log scale", "CO2 per capita, tonnes/person", true),
  });
}

function renderMethods() {
  const mode = document.querySelector("#methodMode").value;
  document.querySelector("#clusterTableWrap").hidden = true;

  if (mode === "permutation") {
    const method = data.methods.permutation;
    setReadout(
      "#methodReadout",
      "Permutation asks whether the coal gap could appear by random labeling",
      `The observed high-coal minus low-coal gap is ${formatNumber.format(method.observed_diff)} kg CO2/kWh. A p-value of ${formatNumber.format(method.p_value)} means shuffled labels rarely produce a gap this large.`
    );
    document.querySelector("#methodStats").innerHTML = [
      methodStat("Observed gap", formatNumber.format(method.observed_diff), "high coal minus low coal"),
      methodStat("p-value", formatNumber.format(method.p_value), "two-sided permutation test"),
      methodStat("High-coal n", method.high_coal_n, "coal share >= 50%"),
      methodStat("Low-coal n", method.low_coal_n, "coal share < 20%"),
    ].join("");
    renderHistogramMethod({
      id: "methods",
      rows: method.histogram,
      label: "Null distribution",
      xTitle: "Mean difference under shuffled labels",
      barColor: "rgba(53, 109, 136, 0.72)",
      observed: method.observed_diff,
    });
  } else if (mode === "bootstrap") {
    const method = data.methods.bootstrap;
    setReadout(
      "#methodReadout",
      "Bootstrap estimates uncertainty around the coal gap",
      `The 95% interval runs from ${formatNumber.format(method.ci_low)} to ${formatNumber.format(method.ci_high)} kg CO2/kWh. Because the whole interval is above zero, the direction of the result is stable.`
    );
    document.querySelector("#methodStats").innerHTML = [
      methodStat("Observed gap", formatNumber.format(method.observed_diff), "kg CO2/kWh"),
      methodStat("Lower bound", formatNumber.format(method.ci_low), "2.5th percentile"),
      methodStat("Upper bound", formatNumber.format(method.ci_high), "97.5th percentile"),
      methodStat("Interpretation", "positive", "interval stays above zero"),
    ].join("");
    renderHistogramMethod({
      id: "methods",
      rows: method.histogram,
      label: "Bootstrap distribution",
      xTitle: "Bootstrapped high-coal minus low-coal mean difference",
      barColor: "rgba(180, 85, 63, 0.72)",
      observed: method.observed_diff,
      lower: method.ci_low,
      upper: method.ci_high,
    });
  } else if (mode === "clt") {
    const method = data.methods.clt;
    setReadout(
      "#methodReadout",
      "The CLT check explains why sample means are still useful",
      `Individual country emissions are skewed, but repeated samples of ${method.sample_size} countries produce a smoother distribution around ${formatNumber.format(method.population_mean)} tonnes per person.`
    );
    document.querySelector("#methodStats").innerHTML = [
      methodStat("Sample size", method.sample_size, "countries per resample"),
      methodStat("Population mean", formatNumber.format(method.population_mean), "CO2/person"),
      methodStat("Mean of means", formatNumber.format(method.sample_mean_mean), "simulation average"),
      methodStat("Std. error", formatNumber.format(method.sample_mean_sd), "sampling spread"),
    ].join("");
    renderHistogramMethod({
      id: "methods",
      rows: method.histogram,
      label: "Sample means",
      xTitle: "Mean CO2 per capita from repeated samples",
      barColor: "rgba(47, 111, 115, 0.72)",
      observed: method.population_mean,
    });
  } else {
    const method = data.methods.kmeans;
    setReadout(
      "#methodReadout",
      "K-means summarizes country profiles",
      `${method.points.length} countries are grouped into ${method.k} profiles using GDP, energy use, CO2 per person, and CO2 per GDP. These clusters describe patterns; they do not prove causality.`
    );
    document.querySelector("#methodStats").innerHTML = [
      methodStat("Clusters", method.k, "k-means"),
      methodStat("Countries", method.points.length, "2022 complete cases"),
      methodStat("Features", "4", "GDP, energy, CO2/person, CO2/GDP"),
      methodStat("Purpose", "exploratory", "not causal"),
    ].join("");
    renderKMeans();
  }
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

  const chartNames = name === "responsibility" ? ["trade", "trend"] : [name];
  chartNames.forEach((chartName) => {
    const chart = charts[chartName];
    if (!chart) {
      return;
    }
    setTimeout(() => {
      if (charts[chartName] === chart) {
        chart.resize();
      }
    }, 0);
  });
}

async function init() {
  const response = await fetch("data/co2-dashboard.json");
  data = await response.json();
  Chart.defaults.animation = false;

  countryOptions(document.querySelector("#economyCountry"), data.economy, "India");
  countryOptions(document.querySelector("#energyCountry"), data.energyMix, "India");
  countryOptions(document.querySelector("#historyCountry"), data.historical, "United States");
  countryOptions(document.querySelector("#decouplingCountry"), data.decoupling, "United Kingdom");

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.panel));
  });
  document.querySelector("#economyMode").addEventListener("change", renderEconomy);
  document.querySelector("#economyCountry").addEventListener("change", renderEconomy);
  document.querySelector("#energyMode").addEventListener("change", renderEnergy);
  document.querySelector("#energyCountry").addEventListener("change", renderEnergy);
  document.querySelector("#tradeMode").addEventListener("change", renderTrade);
  document.querySelector("#trendMode").addEventListener("change", renderTrend);
  document.querySelector("#landUseMode").addEventListener("change", renderLandUse);
  document.querySelector("#historyMode").addEventListener("change", renderHistory);
  document.querySelector("#historyCountry").addEventListener("change", renderHistory);
  document.querySelector("#decouplingMode").addEventListener("change", renderDecoupling);
  document.querySelector("#decouplingCountry").addEventListener("change", renderDecoupling);
  document.querySelector("#methodMode").addEventListener("change", renderMethods);

  renderEconomy();
  renderEnergy();
  renderTrade();
  renderTrend();
  renderLandUse();
  renderHistory();
  renderDecoupling();
  renderMethods();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

init();
