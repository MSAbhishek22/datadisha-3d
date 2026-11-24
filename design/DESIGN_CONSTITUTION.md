# DataDisha 3D — Design Constitution

Written 24 Nov 2026, before any frontend code, per ABHI_22 Blueprint Part V.

## The idea in one line

India's Census, laid out like a surveyor's table: every state a wooden block on a
gridded paper chart. Pick a measure and the blocks rise; pick another and they
change colour. The country becomes something you can walk around, not a table
you have to read.

## Design research (inspected 24 Nov 2026)

1. **threeui.com** (3D/spatial reference) — a library of authored Three.js
   scenes. Learning: one strong 3D object per screen, scene economy, light
   doing the mood work. Applied: one scene only — the block map — no extra
   decorative 3D anywhere on the page. Not copied: its dark testimonial
   templates and shader-heavy hero pieces.
2. **tasteskill.dev** (typography/composition reference) — "one motif runs it
   all", "the quiet instrument: small type, big space", colour chapters per
   section, and an explicit warning against the default purple-gradient AI
   page. Applied: one motif (the survey grid), small quiet labels, big space
   around the chart, one palette for the whole page. Not copied: its poster
   layouts and coffee-shop art direction.
3. **dark.design** (product/data reference) — a gallery of restrained product
   sites; the listing itself shows data pieces (e.g. a dam-levels tracker)
   treated as the hero. Learning: restraint is a style; colour is spent on
   data, not decoration. Applied in negative: DataDisha is a *light* paper
   page (the fleet's recent work is mostly dark), but it keeps the same
   discipline — one accent family, everything else ink and paper. Not copied:
   the dark theme itself.
4. **minimal.gallery** (composition reference) — hand-picked minimal sites;
   the pattern across them is edge-aligned type, generous margins, almost no
   boxes-inside-boxes. Applied: the page is three flat chapters (problem,
   explorer, outcome) with hairline rules, not cards stacked on cards.
   Not copied: any specific site's layout.
5. **21st.dev** (interaction reference) — a component library whose pieces
   share one trait: every control answers instantly and visibly (hover lift,
   pressed state, shimmer feedback). Applied: every control in the explorer
   re-renders the scene or the panels in the same frame — no control is
   decorative. Not copied: React/Tailwind code or the shimmer-button look.

## Identity — "The Survey Table"

- **Metaphor:** a chart-room table. Paper, ink, wooden blocks, a printed grid.
- **Background:** warm paper `#f5efe3`. Panels: slightly deeper paper `#efe7d6`
  with a 1px ink hairline `#d8cdb4`.
- **Ink:** `#22303c` for text and outlines. Secondary ink `#5c6a72`.
- **Data colour:** one sequential ramp, sand `#d9c9a3` → terracotta `#c96f3b`
  → deep teal `#0e6e6b` is *not* used as a single ramp; instead each metric
  maps low→high along sand → terracotta → maroon `#8c3b22` for "amount"
  metrics, and sand → sage → deep teal for "rate" metrics. The legend always
  prints the actual low and high values, so colour never floats free of the
  numbers.
- **Selection:** ink outline + the block lifts 6%. Compare picks get solid
  rings: first pick teal `#0e6e6b`, second pick saffron `#e09f1f`.
- **Type:** Georgia (system serif) for headlines — the voice of a printed
  report. System sans for controls and data, tabular figures for numbers.
  No webfonts: the page must work offline from a folder.
- **Labels:** every block carries its state code in small caps, printed on
  the paper beside it (HTML labels projected from the scene), like names
  written on a chart by hand.
- **Motion:** blocks grow and recolour over 600 ms with an ease-out; the
  camera makes one slow opening move, then stops. `prefers-reduced-motion`
  turns transitions instant and stops the opening move. Nothing loops,
  nothing glows, no particles.

## Layout

1. **Problem** — a short opening chapter: a census table has 640 districts
   and nobody can *see* it. One paragraph, three plain facts from the data.
2. **Explorer** — the 3D table, full width. A control bar above it (height
   metric, colour metric, compare toggle, spin toggle, reset view). A side
   panel: selected state's full numbers, or the two compared states side by
   side; below it, Top 5 / Bottom 5 for the height metric.
3. **Outcome** — "What the data shows": three findings computed from the
   dataset itself at load time, each with its numbers printed.
4. **Footer** — dataset name, publisher, link, retrieval date, and the honest
   limits (2011 frame: Andhra Pradesh undivided, Jammu & Kashmir undivided,
   tiles placed roughly, not to survey accuracy).

## Rules this build holds itself to

- Every visible control works and is listed in `qa/INTERACTION_INVENTORY.md`.
- No number appears anywhere that is not computed from the bundled dataset.
- The scene is one `InstancedMesh` of blocks; per-instance colour; pixel
  ratio capped; rendering pauses when the tab is hidden.
- If WebGL is unavailable, the page says so plainly and still shows the
  findings and the data table values in the panels (the numbers never depend
  on the 3D working).
