# Deploy — DataDisha 3D (remaining steps, in order)

Everything buildable locally is done. What is left needs the user's
signed-in browser and accounts. Do these in order; the project stays
INCOMPLETE/BLOCKED at blueprint gates 9–11 until step 4 is verified.

## 1. GitHub repo (user's browser, signed in as MSAbhishek22)

1. Create a public repo named `datadisha-3d` on github.com/new
   (no README, no .gitignore — the folder already has both its docs).
2. Push this folder (`~/workspace/hackathons/datadisha-3d/`) to it.
   Do not push `qa/node_modules/` (reinstall locally with
   `cd qa && npm install` when needed) or the `/tmp` venv.
3. Note the commit SHA — the deployment must match it (gate 10).

## 2. GitHub Pages

1. Repo → Settings → Pages → Source: deploy from branch `main`, folder
   `/ (root)`.
2. Wait for the build, then open
   `https://msabhishek22.github.io/datadisha-3d/`.

## 3. Verify the live deployment (as a stranger, signed out)

1. Page loads over HTTPS; the 3D table renders; no console errors.
2. Change block height to Population — columns re-grow; rankings show
   Uttar Pradesh first.
3. Click Kerala — detail table shows literacy 94.0%.
4. Compare Kerala + West Bengal — difference column appears.
5. Re-run the smoke against the live URL (edit `URL` in `qa/smoke.mjs`)
   and record the result in `qa/QA_RESULTS.md`.

## 4. Demo video (from the LIVE URL only)

- Record the deployed page, following the 30-second script in
  `SUBMISSION_PACK.md`. Show at least one real action (metric switch +
  a compare). Local recordings do not count.
- Upload (user's YouTube) and paste the link here and in the README.

## 5. DS2 registration (separate, by 30 Nov 2026)

- Register for the DS2 Hackathon on the organiser's site before
  **30 Nov 2026**; pick the build day (3 or 4 Dec). DataDisha is the
  portfolio link, not the entry — see `SUBMISSION_PACK.md`.
