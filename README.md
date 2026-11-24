# DataDisha 3D

India's census, standing up.

In 2011 India counted 1.21 billion people across 640 districts. The results
sit in tables almost nobody opens. DataDisha puts them on a table instead:
every state and union territory is a block in a 3D grid that sits roughly
where the state sits on the map. The height of a block is one real number
from the census. Its colour is another. You turn the table, click a block,
and read the place. Pick two blocks and they stand side by side.

## What you can do with it

- Set the **block height** to any of nine indicators — population, literacy,
  female literacy, the literacy gender gap, sex ratio, workforce
  participation, Scheduled Caste share, Scheduled Tribe share, or the
  share of children aged 0–6.
- Set the **block colour** to any of the same nine, independently.
- **Hover** a block to read it. **Click** it to pin its full numbers, with
  the all-India figure next to each one.
- Turn on **Compare two states**, click two blocks, and get them side by
  side with the difference on every measure.
- Read the **Top 5 / Bottom 5** for whatever the height is set to — it
  re-ranks the moment you change the measure.
- Scroll down for **three findings** the page works out from the data
  itself. Nothing there was written by hand; change the dataset and the
  findings would change.

## The data is real

Every number comes from one downloaded file: the Census of India 2011
Primary Census Abstract at district level (640 districts), published by
the Office of the Registrar General & Census Commissioner, India, taken
from the public `indiaset/census-2011` copy on Hugging Face on
24 November 2026. State figures are district sums; rates are computed
from those sums the same way the Census computes them. The download, a
CSV copy, the processing script and the full source note are all in
`data/` — start with `data/DATA_SOURCE.md`.

Two honest limits. This is the 2011 map: Andhra Pradesh still includes
Telangana, and Jammu & Kashmir still includes Ladakh. And the source
file has no area column, so density is not shown. I would rather leave a
measure out than borrow numbers that might not line up.

## Run it

It is plain static files — no build step, no server-side code.

```
cd datadisha-3d
python3 -m http.server 8901
# open http://127.0.0.1:8901
```

It also works opened straight from the folder, because the data ships as
a script include (`data/states.js`) next to the canonical
`data/states.json`.

## How it is built

- Three.js r160, vendored in `vendor/` — no CDN, works offline.
- All 35 blocks are one `InstancedMesh`; colour is per-instance; heights
  and colours ease to their new values when you change a measure.
- Rendering pauses when the tab is hidden, the pixel ratio is capped,
  and `prefers-reduced-motion` turns the motion off.
- If WebGL is unavailable the page says so, and the findings, rankings
  and state menu still work — the numbers never depend on the 3D.

## Checks

```
# data integrity (needs a python with pyarrow)
/tmp/datadisha-venv/bin/python qa/check_data.py

# browser smoke (headless Chromium; install once with: cd qa && npm install)
python3 -m http.server 8901 &  node qa/smoke.mjs
```

Latest results are in `qa/QA_RESULTS.md`: data checks all pass, browser
smoke 18/18, zero console errors.
