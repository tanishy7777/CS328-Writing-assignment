# Hypotheses and Three-Person Work Split

## Core Research Question

How do economic scale, natural-resource/fuel structure, and policy-linked development choices shape national CO2 emissions?

Use careful language: this dataset can support descriptive and statistical evidence, but it cannot prove that a specific policy caused a specific emissions outcome unless extra policy data is added.

## Final Split

Each person takes one independent theme and tests two small hypotheses. Do not turn these into three disconnected projects; treat them as sub-questions under the common theme above.

### Person 1: Economy

Hypotheses:
- H1A: Higher GDP per capita is associated with higher CO2 per capita.
- H1B: GDP per capita alone does not reliably predict CO2 per GDP; energy mix and economic structure explain variation better.

How to test:
- Use 2022, the latest year with broad GDP coverage.
- Compute GDP per capita = `gdp / population`.
- Compare Spearman correlations:
  - GDP per capita vs `co2_per_capita`
  - GDP per capita vs `co2_per_gdp`
- Visuals:
  - Scatterplot of GDP per capita vs CO2 per capita, log x-axis.
  - Scatterplot or ranked table of GDP per capita vs CO2 per GDP.
  - Label a few outliers: United States, Qatar, China, India, France, South Africa.

Preliminary evidence from the downloaded data:
- In 2022, among countries with population above 1 million and available GDP/energy data, GDP per capita and CO2 per capita have Spearman r about 0.89.
- GDP per capita and CO2 per GDP are weakly related, suggesting rich countries are not automatically more carbon-intensive per unit of output.

Deliverables:
- 2-3 graphs.
- 250-300 words.
- A short explanation of why total emissions, per-capita emissions, and emissions intensity answer different questions.

### Person 2: Energy Mix

Hypotheses:
- H2A: Coal-heavy countries have higher CO2 emissions intensity.
- H2B: Energy use per capita strongly predicts CO2 per capita, but cleaner energy mixes create exceptions.

How to test:
- Use 2024 for the latest fuel-mix data.
- Define `coal_share = coal_co2 / (coal_co2 + oil_co2 + gas_co2)`.
- Restrict to countries with population above 1 million and CO2 emissions above 20 million tonnes to avoid tiny-country noise.
- Compare countries with `coal_share >= 0.5` against countries with `coal_share < 0.2`.
- Use a permutation test or Welch-style comparison of average `co2_per_unit_energy`.
- Use 2022 or 2023 to compare `energy_per_capita` with `co2_per_capita`.
- Visuals:
  - Scatterplot of coal share vs CO2 per unit energy.
  - Scatterplot of energy per capita vs CO2 per capita.
  - Optional stacked bar chart of coal/oil/gas shares for 10-12 case-study countries.

Preliminary evidence from the downloaded data:
- In 2024, high-coal countries average about 0.274 kg CO2 per kWh of primary energy, while low-coal countries average about 0.168.
- High coal-share examples include South Africa, China, Vietnam, India, Kazakhstan, Indonesia, the Philippines, and Taiwan.
- In 2022, energy per capita and CO2 per capita have Spearman r about 0.97.

Deliverables:
- 2-3 graphs.
- 250-300 words.
- One statistical comparison of high-coal and low-coal countries.

### Person 3: Policy, Trade, and Structural Change

Hypotheses:
- H3A: Production-based and consumption-based emissions change which countries look responsible.
- H3B: Some countries show declining emissions over time, possibly due to policy, technology, or structural economic change.

How to test:
- Use 2023, the latest year with broad `consumption_co2` and `trade_co2_share` coverage.
- `trade_co2_share > 0` means consumption emissions exceed territorial emissions.
- Compare high-income and low-income countries using 2022 GDP per capita as an income proxy.
- For trends, index each selected country's CO2 emissions to 1990 = 100 or 2005 = 100.
- Use cautious language: the dataset can show decline, but cannot prove policy caused the decline without extra policy data.
- Visuals:
  - Bar chart: top importers and exporters by `trade_co2_share`.
  - Paired-dot plot: territorial CO2 vs consumption CO2 for selected countries.
  - Line chart of indexed emissions for selected countries.

Preliminary evidence from the downloaded data:
- Top positive trade-adjustment examples include Hong Kong, Switzerland, Singapore, Belgium, and Latvia.
- Negative examples include Bahrain, Qatar, Vietnam, Kazakhstan, South Africa, Russia, and India.
- This is a strong "counting matters" section, but avoid saying imports alone prove government policy success or failure.

Deliverables:
- 250-350 words.
- 2 visuals:
- territorial vs consumption emissions.
- emissions trend index for selected countries since 1990 or 2005.
- A paragraph on why accounting method changes the moral/policy interpretation.

## Optional Bonus Graph

If the combined report has room, add one land-use change graph under Person 2's theme:
- Compare `co2` with `co2_including_luc`.
- Brazil, the Democratic Republic of Congo, Cote d'Ivoire, Ethiopia, Bolivia, Tanzania, and Zambia show large land-use additions.
- This is a strong natural-resources angle, but keep it optional so the project stays focused.

## Combine-at-End Checklist

- Agree on one country filter: use countries with `iso_code` length 3 and exclude aggregates like "World".
- Use 2022 for GDP-heavy analysis, 2023 for trade-adjusted analysis, and 2024 for latest fuel/land-use analysis.
- Use consistent units in captions: million tonnes CO2, tonnes per person, kg CO2 per kWh, kg CO2 per international dollar.
- Keep the final writeup around 1000 words excluding code.
- Do not make every plot global. Use global plots plus 6-12 labeled case-study countries.
- State limitations: missing GDP in 2024, consumption data lag, observational data, and policy not directly measured.

## Suggested Final Argument

The report can conclude that national CO2 emissions are not explained by "rich vs poor" alone. Economic development increases energy use, but the emissions outcome depends on how energy is produced, whether production is exported or imported, and whether emissions are falling over time. This lets the writeup make a sharper point: climate responsibility changes depending on whether we measure production, consumption, energy systems, or structural change.
