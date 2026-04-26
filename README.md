# CS 328 CO2 Emissions Writing Assignment Starter

Dataset downloaded from the Our World in Data CO2 repository:

- `data/raw/owid-co2-data.csv`
- `data/raw/owid-co2-codebook.csv`

Suggested submission artifact:

- Work in `notebooks/co2_assignment_starter.ipynb`
- Export the final notebook to HTML/PDF only after combining the three sections.

Project theme:

> Effects of economy, natural-resource distribution, and policy-linked structural choices on CO2 emissions across countries.

Final three-person split:

- Person 1: Economy
- Person 2: Energy mix
- Person 3: Policy, trade, and structural change

The strongest report should avoid claiming simple causality from one observational dataset. Frame the conclusion as: emissions are shaped by scale and wealth, but the major explanatory differences come from energy use, fuel mix, consumption accounting, and structural change over time.

See `reports/hypotheses_and_worksplit.md` for the proposed hypotheses and three-person division.

## Setup

```powershell
python -m pip install -r requirements.txt
jupyter notebook notebooks/co2_assignment_starter.ipynb
```
