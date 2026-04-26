# CS 328 CO2 Emissions Writing Assignment

This repository contains our CS 328 writing assignment on cross-country CO2 emissions. The main analysis lives in a notebook, and the published site renders that notebook directly so the narrative, code, figures, and outputs stay in one place.

Web page: https://tanishy7777.github.io/CS328-Writing-assignment/

## Project Focus

We study how national CO2 emissions differ across countries and how the answer changes depending on the metric. The notebook looks at three broad ideas:

- Economy and energy as baseline drivers of emissions
- Trade, land use, and historical totals as different responsibility measures
- Decoupling as a way to study whether growth is separating from emissions

The analysis uses the Our World in Data CO2 dataset and keeps the claims observational rather than causal.

## Main Files

- `notebooks/co2_assignment_starter.ipynb`
  The working notebook and main analysis artifact.
- `docs/`
  Static site published by GitHub Pages or Netlify. It renders the notebook from `docs/data/co2_assignment_starter.ipynb`.
- `docs/data/co2_assignment_starter.ipynb`
  Published notebook copy used by the site.
- `data/raw/owid-co2-data.csv`
  Raw OWID CO2 data.
- `data/raw/owid-co2-codebook.csv`
  OWID codebook.
- `scripts/build-dashboard-data.mjs`
  Utility script for generating supporting JSON data used by older interactive chart views and related assets.
- `reports/`
  Planning notes, writeup material, and supporting documentation.

## Setup

Install Python dependencies and open the notebook:

```powershell
python -m pip install -r requirements.txt
jupyter notebook notebooks/co2_assignment_starter.ipynb
```

## Local Site Preview

The static site is published from `docs/`, which works with GitHub Pages and is also configured in `netlify.toml`.

To preview it locally:

```powershell
python -m http.server 4173 --directory docs
```

Then open `http://localhost:4173`.

## Data Notes

The project uses the Our World in Data CO2 repository as its main data source. Different sections of the notebook use different latest years depending on variable coverage, so the cleaning and filtering steps are handled inside the notebook rather than with one global rule.

## Deployment

Netlify publishes the `docs/` directory:

```toml
[build]
  publish = "docs"
```

That means changes to the published notebook copy or the files inside `docs/` will affect the deployed webpage.
