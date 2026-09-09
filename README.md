# HydroNexus

**HydroNexus** is an end-to-end dam-break inundation and HADR decision-support prototype for the Machhu-II Dam SIH 2026 case study.

## Demo scenarios

| Scenario | Status | Use |
|---|---|---|
| S1 — Major Demo Breach | READY | Uses the uploaded `Machhu2_new.p02.hdf` result |
| S2 — Extreme Demo Breach | CONFIGURATION ONLY | Hypothetical larger breach; run HEC-RAS before using numbers |
| S3 — Catastrophic Demo Breach | CONFIGURATION ONLY | Hypothetical largest screening breach; run HEC-RAS before using numbers |

S1 dashboard snapshot: **04SEP2026 00:29:00**, selected at the maximum modeled breach flow.

### S1 extracted demo metrics

- Flooded footprint: **15.26 km²** at a >0.5 ft cell-depth threshold
- Maximum depth at snapshot: **24.73 m**
- Maximum face velocity at snapshot: **11.26 m/s**
- Peak breach flow: **82919 cfs (2348 m³/s)**
- Simulation output duration: **0.33 hours**
- Source CRS for HEC-RAS geometry: **EPSG:32642**

> **Important:** This is a demo/prototype result. The uploaded HEC-RAS run has numerical warnings and must not be presented as an operational forecast or validated hazard map.

## Architecture

React/Vite + Leaflet → FastAPI → SQLAlchemy → SQLite locally / PostgreSQL on Render.

The HEC-RAS `.p02.hdf` is converted into lightweight web assets under `data/demo/` so the dashboard can be deployed without running HEC-RAS on the cloud.

## Local run

### Backend
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Production Docker

```bash
docker build -t hydronexus .
docker run -p 10000:10000 hydronexus
```

## Render deployment

The repository contains `render.yaml` and a Dockerfile. Render can deploy the web service and PostgreSQL database from a connected Git repository. See the official Render deployment documentation: https://render.com/docs/deploys

## Next engineering step

Run HEC-RAS for S2 and S3, replace/add their extracted GIS outputs, and change their status from `configuration-only` to `ready`.
