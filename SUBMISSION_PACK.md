# Submission pack — DataDisha 3D

## What this is for

A fleet asset for data/AI hackathons: proof, in one link, that a real
public dataset can be turned into something a judge can *see* in thirty
seconds. It is not itself a DS2 entry — DS2 is an event-day build inside
the organisers' sandbox (see below).

## DS2 Hackathon fit (per FILING_PLAN_100.md, row 10)

- **Event:** DS2 Hackathon — "Make the Pilot Data Make Sense"
  (dataspace2.eu / Athens Technology Center).
- **Key dates:** register by **30 Nov 2026**; build day **3 or 4 Dec
  2026**, 10:00–18:30 CET (pick one); submission is the same-day demo.
- **The actual DS2 build** is an AI agent on the DS2 data-space APIs that
  explains real pilot data (Greek farm sensors, Slovenian air quality and
  traffic, Romanian public transport) in plain language. That build
  happens on the day, in their sandbox.
- **Where DataDisha fits:** it is the portfolio piece behind the pitch —
  "I turn public data into things people can see; here is a national
  census standing in 3D, built from the raw district file, with the
  checks to prove the numbers." Use it in the registration/profile and
  the demo-day intro if a portfolio link is asked for. Do not file it as
  the DS2 submission itself.

## Also fits

- Any "data storytelling / open data / govtech" side track: the whole
  pitch is one sentence — *a real census, in 3D, every number checkable
  against the source file in the repo.*
- A general portfolio link for data roles: the repo shows the full chain
  (download → process → verify → visualise) with QA evidence.

## The 30-second demo script (for a live recording, once deployed)

1. Open the live page. "This is the Census of India 2011 — 640 districts,
   standing up."
2. Height is literacy, colour is population. Point at the short dark
   block: "Bihar — 104 million people, the lowest literacy in the
   country. The table makes you feel both facts at once."
3. Change colour to literacy gender gap. "Same table, different story."
4. Compare Kerala and Bihar. "94.0 against 61.8 — and here is every other
   measure, side by side."
5. Scroll to the findings. "These three sentences were computed from the
   data when the page loaded. Nothing on this page was typed by hand."

## Status and remaining steps

- Build + QA: **done locally** (see `qa/QA_RESULTS.md`).
- Deployment, GitHub, demo video: **not done** — exact steps in
  `DEPLOY.md`. Until those are finished this project is
  INCOMPLETE/BLOCKED at blueprint gates 9–11, and should be described
  that way.
- DS2 registration (by 30 Nov 2026) is a separate one-form step for the
  user/agent in the browser; DataDisha does not block it.
