import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const sourceUrl = new URL("data/raw/owid-co2-data.csv", root);
const dashboardUrl = new URL("site/data/co2-dashboard.json", root);

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function number(value) {
  if (value === "" || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return Number(value.toFixed(digits));
}

function hasValues(row, columns) {
  return columns.every((column) => number(row[column]) !== null);
}

function countryRows(rows) {
  return rows.filter((row) => row.iso_code?.length === 3);
}

function latestYear(rows, columns) {
  return Math.max(...rows.filter((row) => hasValues(row, columns)).map((row) => number(row.year)));
}

function byCountryYear(rows, year) {
  const map = new Map();
  for (const row of rows) {
    if (number(row.year) === year) {
      map.set(row.country, row);
    }
  }
  return map;
}

function gini(values) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((total, value) => total + value, 0);
  if (!n || sum === 0) {
    return null;
  }
  const weighted = sorted.reduce((total, value, index) => total + (index + 1) * value, 0);
  return (2 * weighted) / (n * sum) - (n + 1) / n;
}

function quantileBreaks(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q) => sorted[Math.floor((sorted.length - 1) * q)];
  return [at(0.25), at(0.5), at(0.75)];
}

function decouplingClass(gdpGrowth, co2Growth) {
  if (gdpGrowth > 0 && co2Growth < 0) {
    return "absolute decoupling";
  }
  if (gdpGrowth > 0 && co2Growth >= 0 && co2Growth < gdpGrowth) {
    return "relative decoupling";
  }
  if (gdpGrowth > 0 && co2Growth >= gdpGrowth) {
    return "no decoupling with growth";
  }
  return "GDP did not grow";
}

const rawRows = countryRows(parseCsv(await readFile(sourceUrl, "utf8")));
const dashboard = JSON.parse(await readFile(dashboardUrl, "utf8"));

const landUseYear = latestYear(rawRows, ["co2", "co2_including_luc", "land_use_change_co2", "population"]);
const landUseBase = rawRows
  .filter((row) => number(row.year) === landUseYear)
  .filter((row) => hasValues(row, ["co2", "co2_including_luc", "land_use_change_co2", "population"]))
  .filter((row) => number(row.population) >= 1_000_000)
  .map((row) => {
    const co2 = number(row.co2);
    const co2IncludingLuc = number(row.co2_including_luc);
    const gap = co2IncludingLuc - co2;
    return {
      country: row.country,
      iso_code: row.iso_code,
      co2: round(co2, 3),
      co2_including_luc: round(co2IncludingLuc, 3),
      land_use_change_co2: round(number(row.land_use_change_co2), 3),
      luc_gap: round(gap, 3),
      luc_share_of_fossil_co2: round((100 * gap) / co2, 3),
    };
  });
const landUse = [
  ...landUseBase.toSorted((a, b) => a.luc_gap - b.luc_gap).slice(0, 10),
  ...landUseBase.toSorted((a, b) => b.luc_gap - a.luc_gap).slice(0, 10),
].toSorted((a, b) => a.luc_gap - b.luc_gap);

const historicalYear = latestYear(rawRows, ["co2", "cumulative_co2", "population"]);
const historicalBase = rawRows
  .filter((row) => number(row.year) === historicalYear)
  .filter((row) => hasValues(row, ["co2", "cumulative_co2", "population"]))
  .filter((row) => number(row.population) >= 1_000_000 && number(row.co2) > 0 && number(row.cumulative_co2) > 0);
const currentTotal = historicalBase.reduce((total, row) => total + number(row.co2), 0);
const cumulativeTotal = historicalBase.reduce((total, row) => total + number(row.cumulative_co2), 0);
const historical = historicalBase
  .map((row) => {
    const currentShare = (100 * number(row.co2)) / currentTotal;
    const cumulativeShare = (100 * number(row.cumulative_co2)) / cumulativeTotal;
    return {
      country: row.country,
      iso_code: row.iso_code,
      co2: round(number(row.co2), 3),
      cumulative_co2: round(number(row.cumulative_co2), 3),
      current_share_pct: round(currentShare, 4),
      cumulative_share_pct: round(cumulativeShare, 4),
      current_minus_cumulative_share_pct: round(currentShare - cumulativeShare, 4),
      current_to_cumulative_ratio: round(currentShare / cumulativeShare, 4),
    };
  })
  .toSorted((a, b) => b.cumulative_share_pct - a.cumulative_share_pct);

const decouplingStart = 1990;
const decouplingEnd = 2022;
const baseByCountry = byCountryYear(rawRows, decouplingStart);
const endByCountry = byCountryYear(rawRows, decouplingEnd);
const decouplingBase = [];
for (const [country, start] of baseByCountry) {
  const end = endByCountry.get(country);
  if (!end) {
    continue;
  }
  if (!hasValues(start, ["gdp", "co2"]) || !hasValues(end, ["gdp", "co2", "population"])) {
    continue;
  }
  const gdpStart = number(start.gdp);
  const gdpEnd = number(end.gdp);
  const co2Start = number(start.co2);
  const co2End = number(end.co2);
  const populationEnd = number(end.population);
  if (populationEnd < 1_000_000 || gdpStart <= 0 || gdpEnd <= 0 || co2Start <= 0 || co2End <= 0) {
    continue;
  }
  const gdpGrowth = 100 * (gdpEnd / gdpStart - 1);
  const co2Growth = 100 * (co2End / co2Start - 1);
  const logIntensityChange = Math.log(co2End / co2Start) - Math.log(gdpEnd / gdpStart);
  decouplingBase.push({
    country,
    iso_code: end.iso_code,
    gdp_growth_pct: round(gdpGrowth, 3),
    co2_growth_pct: round(co2Growth, 3),
    intensity_change_pct: round(100 * (Math.exp(logIntensityChange) - 1), 3),
    gdp_per_capita_2022: round(gdpEnd / populationEnd, 3),
    decoupling_class: decouplingClass(gdpGrowth, co2Growth),
  });
}
const [q1, q2, q3] = quantileBreaks(decouplingBase.map((row) => row.gdp_per_capita_2022));
const decoupling = decouplingBase
  .map((row) => ({
    ...row,
    income_quartile_2022:
      row.gdp_per_capita_2022 <= q1
        ? "Q1 lowest GDP/person"
        : row.gdp_per_capita_2022 <= q2
          ? "Q2"
          : row.gdp_per_capita_2022 <= q3
            ? "Q3"
            : "Q4 highest GDP/person",
  }))
  .toSorted((a, b) => a.co2_growth_pct - b.co2_growth_pct);

const decouplingSummary = Object.values(
  decoupling.reduce((groups, row) => {
    groups[row.decoupling_class] ??= { decoupling_class: row.decoupling_class, countries: 0, share_pct: 0 };
    groups[row.decoupling_class].countries += 1;
    return groups;
  }, {}),
).map((row) => ({ ...row, share_pct: round((100 * row.countries) / decoupling.length, 2) }));

dashboard.landUse = landUse;
dashboard.historical = historical;
dashboard.decoupling = decoupling;
dashboard.summaries = {
  ...(dashboard.summaries ?? {}),
  historical: {
    countries: historical.length,
    annual_co2_gini: round(gini(historicalBase.map((row) => number(row.co2))), 4),
    cumulative_co2_gini: round(gini(historicalBase.map((row) => number(row.cumulative_co2))), 4),
    top10_current_share_pct: round(
      historical.toSorted((a, b) => b.current_share_pct - a.current_share_pct).slice(0, 10)
        .reduce((total, row) => total + row.current_share_pct, 0),
      2,
    ),
    top10_cumulative_share_pct: round(
      historical.slice(0, 10).reduce((total, row) => total + row.cumulative_share_pct, 0),
      2,
    ),
  },
  decoupling: decouplingSummary,
};
dashboard.meta.years = {
  ...dashboard.meta.years,
  land_use: landUseYear,
  historical: historicalYear,
  decoupling_start: decouplingStart,
  decoupling_end: decouplingEnd,
};
dashboard.meta.counts = {
  ...dashboard.meta.counts,
  land_use: landUse.length,
  historical: historical.length,
  decoupling: decoupling.length,
};

await writeFile(dashboardUrl, `${JSON.stringify(dashboard)}\n`);
