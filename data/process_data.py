#!/usr/bin/env python3
"""DataDisha 3D — data pipeline.

Reads the downloaded Census of India 2011 district-level Primary Census
Abstract (data/source/census-2011-districts.parquet, distributed by
indiaset/census-2011 on Hugging Face), aggregates districts to the 35
states/UTs of the 2011 frame, computes derived indicators from the raw
counts, and writes:
  - data/states.json                    (what the app loads)
  - data/source/census-2011-districts.csv  (plain-CSV copy of the raw rows)

Run with a python that has pyarrow:
  /tmp/datadisha-venv/bin/python data/process_data.py
No number is typed by hand anywhere in this script; every figure in the
output is computed from the downloaded file.
"""
import csv
import json
import os

import pyarrow.parquet as pq

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source", "census-2011-districts.parquet")
OUT_JSON = os.path.join(HERE, "states.json")
OUT_CSV = os.path.join(HERE, "source", "census-2011-districts.csv")

# Tile-grid position per state (col west->east, row north->south).
# Rough geographic position only — a chart, not a survey map.
GRID = {
    "Jammu & Kashmir": (3, 0),
    "Punjab": (2, 1), "Himachal Pradesh": (3, 1), "Uttarakhand": (4, 1),
    "Arunachal Pradesh": (8, 1),
    "Chandigarh": (2, 2), "Haryana": (3, 2), "NCT of Delhi": (4, 2),
    "Uttar Pradesh": (5, 2), "Sikkim": (7, 2), "Nagaland": (8, 2),
    "Rajasthan": (1, 3), "Madhya Pradesh": (3, 3), "Bihar": (6, 3),
    "Assam": (7, 3), "Manipur": (8, 3),
    "Gujarat": (0, 4), "Chhattisgarh": (4, 4), "Jharkhand": (5, 4),
    "West Bengal": (6, 4), "Meghalaya": (7, 4), "Tripura": (8, 4),
    "Daman & Diu": (0, 5), "Dadra & Nagar Haveli": (1, 5),
    "Maharashtra": (2, 5), "Andhra Pradesh": (3, 5), "Odisha": (5, 5),
    "Mizoram": (8, 5),
    "Goa": (1, 6), "Karnataka": (2, 6),
    "Kerala": (2, 7), "Tamil Nadu": (3, 7), "Puducherry": (4, 7),
    "Andaman & Nicobar Islands": (8, 7),
    "Lakshadweep": (1, 8),
}

CODE = {
    "Jammu & Kashmir": "JK", "Punjab": "PB", "Himachal Pradesh": "HP",
    "Uttarakhand": "UK", "Arunachal Pradesh": "AR", "Chandigarh": "CH",
    "Haryana": "HR", "NCT of Delhi": "DL", "Uttar Pradesh": "UP",
    "Sikkim": "SK", "Nagaland": "NL", "Rajasthan": "RJ",
    "Madhya Pradesh": "MP", "Bihar": "BR", "Assam": "AS", "Manipur": "MN",
    "Gujarat": "GJ", "Chhattisgarh": "CG", "Jharkhand": "JH",
    "West Bengal": "WB", "Meghalaya": "ML", "Tripura": "TR",
    "Daman & Diu": "DD", "Dadra & Nagar Haveli": "DN", "Maharashtra": "MH",
    "Andhra Pradesh": "AP", "Odisha": "OD", "Mizoram": "MZ", "Goa": "GA",
    "Karnataka": "KA", "Kerala": "KL", "Tamil Nadu": "TN",
    "Puducherry": "PY", "Andaman & Nicobar Islands": "AN",
    "Lakshadweep": "LD",
}

DISPLAY = {"NCT of Delhi": "Delhi (NCT)"}

SUM_FIELDS = [
    "pop_total", "pop_male", "pop_female", "pop_under6_total",
    "pop_under6_male", "pop_under6_female", "pop_sc", "pop_st",
    "literate_total", "literate_male", "literate_female", "workers_total",
]


def metrics_from(s):
    """Derived indicators from summed raw counts. Effective literacy =
    literates / population aged 7+, the Census of India's own definition."""
    pop = s["pop_total"]
    lit_base = pop - s["pop_under6_total"]
    lit_base_m = s["pop_male"] - s["pop_under6_male"]
    lit_base_f = s["pop_female"] - s["pop_under6_female"]
    lit = s["literate_total"] / lit_base * 100
    lit_m = s["literate_male"] / lit_base_m * 100
    lit_f = s["literate_female"] / lit_base_f * 100
    return {
        "population": pop,
        "literacy": round(lit, 1),
        "female_literacy": round(lit_f, 1),
        "gender_gap": round(lit_m - lit_f, 1),
        "sex_ratio": round(s["pop_female"] / s["pop_male"] * 1000),
        "workforce": round(s["workers_total"] / pop * 100, 1),
        "sc_share": round(s["pop_sc"] / pop * 100, 1),
        "st_share": round(s["pop_st"] / pop * 100, 1),
        "child_share": round(s["pop_under6_total"] / pop * 100, 1),
    }


def main():
    table = pq.read_table(SRC)
    rows = table.to_pylist()

    # Plain-CSV copy of the raw download, for anyone who wants to check.
    with open(OUT_CSV, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=table.column_names)
        w.writeheader()
        w.writerows(rows)

    states = {}
    india = {k: 0 for k in SUM_FIELDS}
    for r in rows:
        st = states.setdefault(
            r["state_name"], {k: 0 for k in SUM_FIELDS} | {"districts": 0})
        for k in SUM_FIELDS:
            st[k] += r[k]
            india[k] += r[k]
        st["districts"] += 1

    out_states = []
    for name, s in sorted(states.items()):
        col, row = GRID[name]
        out_states.append({
            "code": CODE[name],
            "name": DISPLAY.get(name, name),
            "source_name": name,
            "col": col, "row": row,
            "districts": s["districts"],
            "metrics": metrics_from(s),
        })

    doc = {
        "meta": {
            "title": "Census of India 2011 — Primary Census Abstract, state level",
            "frame": "35 states and union territories as they stood in 2011 "
                     "(Andhra Pradesh and Jammu & Kashmir undivided)",
            "district_rows": len(rows),
            "national": metrics_from(india),
        },
        "metrics": {
            "population":     {"label": "Population", "unit": "people", "decimals": 0, "ramp": "amount"},
            "literacy":       {"label": "Literacy rate (age 7+)", "unit": "%", "decimals": 1, "ramp": "rate"},
            "female_literacy": {"label": "Female literacy rate (age 7+)", "unit": "%", "decimals": 1, "ramp": "rate"},
            "gender_gap":     {"label": "Literacy gender gap (men − women)", "unit": "points", "decimals": 1, "ramp": "amount"},
            "sex_ratio":      {"label": "Sex ratio", "unit": "women per 1,000 men", "decimals": 0, "ramp": "rate"},
            "workforce":      {"label": "Workforce participation", "unit": "% of population", "decimals": 1, "ramp": "rate"},
            "sc_share":       {"label": "Scheduled Caste share", "unit": "% of population", "decimals": 1, "ramp": "amount"},
            "st_share":       {"label": "Scheduled Tribe share", "unit": "% of population", "decimals": 1, "ramp": "amount"},
            "child_share":    {"label": "Children aged 0–6", "unit": "% of population", "decimals": 1, "ramp": "amount"},
        },
        "states": out_states,
    }
    with open(OUT_JSON, "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)

    # Same content as a script include, so the page also works opened
    # straight from a folder (fetch of a local .json is blocked on file://).
    out_js = os.path.join(HERE, "states.js")
    with open(out_js, "w") as f:
        f.write("/* Generated by process_data.py from the downloaded Census "
                "2011 district file.\n   Same content as states.json — do "
                "not edit by hand. */\nwindow.DATADISHA_DATA = ")
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write(";\n")

    print("district rows:", len(rows))
    print("states:", len(out_states))
    print("india population:", india["pop_total"])
    print("national metrics:", doc["meta"]["national"])


if __name__ == "__main__":
    main()
