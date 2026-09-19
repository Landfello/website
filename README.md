# Landfello

Marketplace for buying and selling land in Africa.

- **Buyers** browse verified land listings and call Landfello to buy
- **Agents** register, upload land photos + details, and list parcels for sale
- **Frontend:** React + Vite
- **Backend:** Python FastAPI + SQLite

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Install

```bash
npm run install:all
```

### Run

```bash
npm run dev
```

- API: http://localhost:8000
- App: http://localhost:5173
- API docs: http://localhost:8000/docs

### Demo accounts (seeded)

| Role   | Email                    | Password     |
|--------|--------------------------|--------------|
| Agent  | agent@landfello.example  | password123  |
| Buyer  | buyer@landfello.example  | password123  |

### Buying land

Buyers tap **Buy land** on a listing and dial the Landfello inquiry number shown on screen:

**+1240717560**

### Tests

```bash
npm run test:backend
```

## Deploy frontend to Vercel

The React app lives in `frontend/`. This repo includes a root `vercel.json` so importing the GitHub repo into Vercel deploys only that app (not the Python API).

1. Push this repo to GitHub
2. In Vercel → **Add New…** → **Project** → import the repo
3. Leave **Root Directory** as the repo root (the included `vercel.json` builds `frontend/`)
4. Add environment variables (Production + Preview):

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://your-api.onrender.com/api` |
| `VITE_FIREBASE_API_KEY` | from Firebase console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-app` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase console |
| `VITE_FIREBASE_APP_ID` | from Firebase console |
| `VITE_FIREBASE_MEASUREMENT_ID` | optional |

5. Deploy
6. Copy the Vercel URL into the API’s `FRONTEND_URL` and `CORS_ORIGINS` on Render, then redeploy the API

`VITE_*` values are baked in at build time. After changing them, trigger a new Vercel deployment.

Local preview of the production bundle:

```bash
npm run build:frontend
npm run preview --prefix frontend
```

## Deploy backend to Render (Docker)

The API ships with a production Dockerfile at `backend/Dockerfile` and a Render blueprint at `render.yaml`.

### Option A — Render Blueprint

1. Push this repo to GitHub
2. In Render → **New** → **Blueprint** → select the repo
3. Set `FRONTEND_URL` and `CORS_ORIGINS` to your frontend URL
4. Deploy — health check is `/health`

### Option B — Manual Docker web service

1. Render → **New** → **Web Service** → connect this repo
2. Runtime: **Docker**
3. Dockerfile path: `backend/Dockerfile`
4. Docker build context: `backend`
5. Add env vars from `backend/.env.example` (at least `SECRET_KEY`, `FRONTEND_URL`, `CORS_ORIGINS`)

### Local Docker smoke test

```bash
docker build -t landfello-api ./backend
docker run --rm -p 8000:8000 -e SECRET_KEY=dev -e FRONTEND_URL=http://localhost:5173 landfello-api
```

Then open http://localhost:8000/health

> Note: SQLite on Render’s free plan is ephemeral unless you attach a persistent disk at `/data`.

## Core flows

1. **Agent:** Sign up as agent → Add Property → upload images + land details → listing appears for buyers
2. **Buyer:** Sign up as investor → Browse `/buy` → Open listing → Buy land → call **+1240717560**
