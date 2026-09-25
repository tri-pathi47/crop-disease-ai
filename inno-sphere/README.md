# Inno Sphere

**Crop health and farm intelligence for Indian farmers.**
Capture → Analyze → Verify → Explain → Advise → Monitor

A farmer photographs an affected plant with an ordinary phone camera. The system
checks the photo is usable, measures the symptoms, weighs them against the crop
stage, the soil record, the live weather and the field's satellite history, and
returns a ranked assessment with its evidence, its confidence, and what to do
next — in the farmer's own language.

No special camera. No IoT sensors. No hardware of any kind.

---

## Run it

You need Python 3.11+ and Node 20+.

### Automated tests

Run the backend contract and service tests, then build the frontend:

```bash
cd backend
pip install -r requirements.txt
python -m pytest -q
cd ../frontend
npm install
npm run build
```

Every push to `main` and every pull request runs the same checks in GitHub Actions.

### Local development

```bash
# Terminal 1 — API
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Terminal 2 — web app
cd frontend
npm install
npm run dev
```

Set `DATABASE_URL` in `.env` to point at your own PostgreSQL instance.
If it is omitted, the API uses a local SQLite file for development.

### Deploy the API on Render with Neon

Use the included `render.yaml` blueprint to create both the API and frontend.
Add these environment variables to the API service in Render:

The API is pinned to Python 3.11 because the dependency set has prebuilt wheels
for Python 3.11. This prevents Render from trying to compile `pydantic-core`
with Rust under Python 3.14.

```text
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require
ENVIRONMENT=production
JWT_SECRET=<a-long-random-secret>
FRONTEND_URL=https://your-frontend-service.onrender.com
```

The API automatically converts Neon's `postgresql://` URL (and Render's legacy
`postgres://` form) to the installed `psycopg` SQLAlchemy driver. Keep Neon's
`sslmode=require` query parameter in the URL. The Render health check is
`/health`.

Add this variable to the frontend service, using the API service URL shown by
Render:

```text
VITE_API_URL=https://your-api-service.onrender.com
```

The frontend Render service includes a catch-all rewrite to `index.html`, so
React Router pages continue to load when opened or refreshed directly.

### In VS Code

Open the `inno-sphere` folder. The recommended extensions are suggested on first
open, and `F5` launches the API with the debugger attached (see
`.vscode/launch.json`).

---

## How the assessment works

The pipeline is deliberately sequential, and each stage can stop it.

| Stage | Where | What happens |
|---|---|---|
| Quality gate | `services/image_quality.py` | Measures brightness, contrast, Laplacian sharpness and leaf coverage. A photo below the usable threshold is rejected with the specific reason, before any analysis. |
| Symptom measurement | `services/segmentation.py` | Splits leaf tissue into healthy, yellowed and necrotic, and reports the affected fraction. |
| Differential scoring | `services/scoring.py` | Ranks healthy / fungal / nutrient / stress / pest using the measured features plus crop stage, soil values, weather and the farmer's own description. |
| Confidence | `services/scoring.py` | Derived from how many views were sent, their quality, and the margin between the top two causes. Low confidence triggers a request for a specific extra photo. |
| Knowledge match | `services/knowledge.py` | Retrieves the matching entry, with its source and version. |
| Advisory | `routers/diagnosis.py` | Farmer-language explanation, ranked alternatives, the evidence list, and concrete next actions. |

### Things the system will not do

These are design commitments, not limitations to be removed later:

- **It can return "no problem visible."** A diagnostic tool that must always name
  a disease is worse than useless — it trains farmers to spray on noise.
- **It never states a confidence it did not compute.** Percentages come from the
  transparent rules in `scoring.py`, and the interface says so in plain words.
- **It does not recommend a specific chemical.** Product choice depends on state
  registration, crop stage and pre-harvest interval. The app points at the local
  KVK or plant clinic instead.
- **It does not claim satellite data diagnoses disease.** Spectral data tells you
  *where to walk*. Only the plant tells you what is wrong.
- **It degrades instead of failing.** If the forecast is unreachable, the
  assessment still runs and drops weather from its evidence list.

---

## What is live, and what needs credentials

| Service | Status | To enable |
|---|---|---|
| Weather | **Live, no key needed** — Open-Meteo | works out of the box |
| Crop knowledge base | **Ships with the app** | `backend/app/data/knowledge.json` |
| Image quality + symptom measurement | **Runs locally** via OpenCV | works out of the box |
| Satellite imagery | Needs an account | `COPERNICUS_USER` / `COPERNICUS_PASSWORD`, then implement `_fetch_l2a()` in `services/satellite.py` |
| Indian-language speech | Browser speech by default | `BHASHINI_API_KEY` for Bhashini ASR/TTS |

Where a service is not connected, the interface says so and offers to connect it.
It does not display numbers that were never measured.

---

## Replacing the heuristics with trained models

The vision layer is intentionally simple, explainable, and isolated behind two
functions. Swapping in real models does not touch anything else:

1. **Classification** — replace `scoring.score()` with your model's calibrated
   probabilities, and update `scoring_note` in `schemas.py`, since the output
   would then genuinely be probabilities.
2. **Segmentation** — replace the body of `segmentation.segment()` with a
   U-Net or YOLOv8-seg call. Keep the return keys and the overlay still works.
3. **Detection** — add pest counting with YOLO in a new `services/detection.py`
   and extend the evidence list in `routers/diagnosis.py`.
4. **Explainability** — swap the colour overlay in `segmentation.overlay_png()`
   for Grad-CAM against your classifier, and update the caption in
   `frontend/src/pages/Result.jsx`, which currently calls it a colour heuristic.
5. **RAG** — `services/rag.py` documents the exact steps: embed the knowledge
   chunks into pgvector, swap `retrieve()` for vector search, and feed the
   retrieved chunks to your LLM in `generate()`.

Uncomment the model libraries in `requirements.txt` and the `vector` extension
in `db/schema.sql` when you get there.

---

## Layout

```
inno-sphere/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, router registration
│   │   ├── config.py          environment settings
│   │   ├── models.py          SQLAlchemy models
│   │   ├── schemas.py         request/response contracts
│   │   ├── routers/           auth, farm, images, diagnosis, context, chat, knowledge
│   │   ├── services/          quality, segmentation, scoring, knowledge, rag, weather, satellite
│   │   └── data/              curated crop, disease, pest and glossary knowledge
│   └── db/                    schema.sql + starting records
├── frontend/
│   └── src/
│       ├── components/        Shell (responsive nav), Icons, Ui, Empty
│       ├── pages/             15 screens
│       └── lib/               api client, i18n, on-device image checks, farm state
└── .vscode/
```

## Responsive behaviour

One codebase, two layouts. Below 960px: sticky header, five-item bottom tab bar,
single-column content, 50px minimum tap targets, safe-area insets so nothing
hides under a notch or home bar. At 960px and above: the tab bar disappears and a
grouped sidebar takes over with all thirteen sections. Light and dark themes both
ship, driven by CSS custom properties.

## Languages

Twelve are listed; six (English, Hindi, Marathi, Bengali, Tamil, Punjabi) have
farmer-facing strings written rather than machine-translated, in
`frontend/src/lib/i18n.js`. Add a language by adding a block there and a row in
`ui_terms` in the knowledge base. Language is always the farmer's choice and is
never set from GPS.

## Licence and data

Knowledge entries cite ICAR, FAO and state agricultural university material.
Verify the agronomic content with a qualified agronomist before any field
deployment, and keep the `source` and `version` fields current.
