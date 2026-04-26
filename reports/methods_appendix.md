# Methods Appendix

This project uses four small statistical tools to make the CO2 argument more defensible.

## Spearman Correlation

Spearman correlation is used instead of only Pearson correlation because country-level CO2 variables are skewed and contain large outliers. It measures whether countries preserve a monotonic ranking relationship, not whether the relationship is perfectly linear.

Key results:
- GDP per capita vs CO2 per capita, 2022: Spearman r = 0.891.
- Energy per capita vs CO2 per capita, 2022: Spearman r = 0.970.
- GDP per capita vs CO2 per GDP, 2022: Spearman r = 0.083.

## Permutation p-test

To test whether coal-heavy countries have higher CO2 per unit energy, countries are split into:
- High coal: coal share of coal+oil+gas CO2 >= 50%.
- Low coal: coal share of coal+oil+gas CO2 < 20%.

The observed mean gap is:

> high-coal mean minus low-coal mean = 0.106 kg CO2/kWh.

A permutation test shuffles the high/low labels thousands of times. The resulting p-value is about 0.0004, meaning a gap this large is very unlikely if coal share had no relationship to emissions intensity.

## Bootstrap Confidence Bounds

Bootstrap resampling estimates uncertainty around the coal-intensity gap. The 95% bootstrap interval is approximately:

> 0.075 to 0.136 kg CO2/kWh.

Because this interval stays above zero, the result is directionally robust: high-coal countries have higher emissions intensity in this sample.

## Central Limit Theorem Demo

The CLT visualization repeatedly samples 30 countries and plots the distribution of sample mean CO2 per capita. Even though country emissions are skewed, the sample means form a smoother distribution around the population mean. This supports why sample means and confidence intervals are useful, while still reminding us that outliers matter.

## K-means Clustering

K-means is used as an exploratory tool, not as proof of causality. Countries are clustered using four standardized 2022 features:
- log10 GDP per capita.
- log10 energy per capita.
- CO2 per capita.
- CO2 per GDP.

The dashboard uses k = 4 clusters:
- Low income, low energy.
- Middle income, carbon intensive.
- High energy transition mix.
- High income, high footprint.

These clusters help show that countries are not just "rich" or "poor"; they occupy different emissions profiles depending on energy use and carbon intensity.

