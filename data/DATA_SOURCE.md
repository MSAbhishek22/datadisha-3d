# Data source — DataDisha 3D

Every number in this app comes from one downloaded file. Nothing was typed
in by hand, and no figure was estimated.

- **Dataset:** Census of India 2011 — Primary Census Abstract (PCA),
  district level, 640 districts across the 35 states and union territories
  of the 2011 frame.
- **Original publisher:** Office of the Registrar General & Census
  Commissioner, India (Census of India 2011).
- **Copy used:** `indiaset/census-2011` on Hugging Face (a public mirror of
  the PCA tables), downloaded as Parquet from
  https://huggingface.co/api/datasets/indiaset/census-2011/parquet/default/train/0.parquet
- **Retrieved:** 24 November 2026.
- **Files kept in this repo:**
  - `data/source/census-2011-districts.parquet` — the download, untouched.
  - `data/source/census-2011-districts.csv` — the same rows as plain CSV.
  - `data/states.json` / `data/states.js` — state-level aggregates computed
    by `data/process_data.py`.

## How state figures are computed

District rows are summed to their state. Rates are then computed from the
summed counts, the same way the Census publishes them:

- **Literacy rate** = literates ÷ population aged 7 and above × 100
  (the Census "effective literacy" definition).
- **Sex ratio** = females ÷ males × 1,000.
- **Workforce participation** = total workers ÷ total population × 100.
- **Shares** (SC, ST, children 0–6) = group ÷ total population × 100.

## Checks against the official published figures

- Sum of all district populations: **1,210,854,977** — the official Census
  2011 total for India.
- Kerala effective literacy computed from the raw counts: **94.0%** — the
  official published figure.
- National sex ratio computed from the raw counts: **943** — the official
  published figure.

## Honest limits

- This is the **2011** frame: Andhra Pradesh includes Telangana, and
  Jammu & Kashmir includes Ladakh, as they stood at the census. There is no
  year slider because the dataset is a single census, not a time series.
- The source has no district area column, so **population density is not
  shown** — rather than borrow an area table from somewhere else and risk
  mismatched boundaries, the metric is simply absent.
- Tile positions on the 3D table are approximate (a grid chart), not
  surveyed boundaries.
