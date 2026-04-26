# Reference Comparison: What the High-Scoring Project Had

Reference repo:
https://github.com/jsmaskeen/CS328-Writing-Assignment.git

Reference site:
https://heknowssomething.netlify.app/

## What They Did Well

- Their submission is a complete exported notebook-style webpage, so the final artifact reads like a data story rather than only a code dump.
- They start with dataset explanation and raw-data cleaning.
- They state a primary hypothesis and multiple sub-hypotheses.
- They use supporting evidence from external reports, not just one CSV.
- They include several statistical tests:
  - Pearson correlation.
  - OLS regression with R-squared and coefficient interpretation.
  - Two-sample t-tests.
  - p-values and 95% confidence language.
- They combine charts with direct interpretation after each result.
- Their conclusion ties the hypotheses back to a real-world operational recommendation.

## What We Already Have

- Cleaner and more interactive final webpage.
- Broader dataset with global country coverage.
- Stronger visual interactivity through tabs, dropdowns, hoverable charts, and k-means exploration.
- Clear three-person division:
  - Economy.
  - Energy mix.
  - Policy/trade/structural change.
- More modern statistical toolkit:
  - Spearman rank correlation for skewed country data.
  - Permutation p-test.
  - Bootstrap confidence interval.
  - CLT simulation.
  - K-means clustering.

## What We Were Missing Before This Update

- The notebook did not contain the full technical methods section that the website had.
- The written report did not explicitly mention p-values, confidence bounds, CLT, or clustering.
- There was no separate methods appendix documenting the statistical choices.
- The assignment code looked split between notebook and web app; now both contain the technical layer.

## What We Should Include in the Final Submission

- Submit the executed notebook as the main artifact.
- Include the Netlify webpage link as the interactive version.
- Mention the methods appendix if the evaluator wants technical detail.
- In the oral/written summary, emphasize:
  - Hypotheses are explicit.
  - Each hypothesis is quantified.
  - Results are backed by graphs and statistical tests.
  - Causal claims are cautious because the data is observational.

## Short Verdict

The reference project earned marks because it was hypothesis-driven, statistically explicit, and presented as a coherent story. Our project now matches that structure and adds a stronger interactive dashboard plus more advanced resampling and clustering methods.

