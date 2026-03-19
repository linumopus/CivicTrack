# CivicTrack

Full-stack civic issue tracking app.

## Tech
- **Backend**: Node.js + Express + TypeScript + Mongoose (MongoDB Atlas) + JWT
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Maps**: MapLibre GL JS + OpenStreetMap raster tiles
- **Shared types**: `types/index.ts` (imported by both apps)

## Setup

### 1) Configure environment variables

- Backend: copy `backend/.env.example` → `backend/.env` and set:
  - `MONGO_URI` (MongoDB Atlas connection string)
  - `JWT_SECRET` (20+ chars)

- Frontend: copy `frontend/.env.example` → `frontend/.env` (defaults are fine for local dev)

### 2) Install dependencies

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3) Run locally

```bash
npm run dev
```

- App + API: `http://localhost:3000` (health: `/api/health`)

## REST API (required endpoints)
- `GET /api/complaints`
- `POST /api/complaints` (auth)
- `PATCH /api/complaints/:id/status` (admin auth)

## Extra endpoints used by the UI
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/complaints/:id/upvote` (auth, duplicate-proof)
- `DELETE /api/complaints/:id` (admin)

