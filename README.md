# Poster Press

Poster Press is a Bangla-first poster studio for national occasions, tributes, and campaigns. The workspace contains a Next.js editor and an Express/Mongoose API. Exact user copy is rendered as text; Gemini is optional and only suggests a bounded palette and decoration style.

## Requirements

- Node.js 22 LTS or newer (20.11+ is supported)
- npm 10+
- Docker Desktop for local MongoDB, or a MongoDB connection string

## Run locally

```powershell
Copy-Item .env.example .env
npm ci
docker compose up -d mongo
npm run seed
npm run dev
```

Open `http://localhost:3000`. Browser API calls use Next.js rewrites to `http://localhost:4000`; API health is available at `http://localhost:4000/health`. Set `JWT_SECRET` in `.env` to a private random value of at least 32 characters before registering accounts. The local asset driver is for development only; production startup refuses it.

The studio supports guest PNG export. Sign in or create an account to upload photos, generate and save posters to history, and access account-protected assets. Set `GEMINI_API_KEY` to enable optional design suggestions; without it, deterministic template defaults are used. Run `npm run seed` again after changing template seed data.

## Quality gates

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

CI runs lint, typecheck, tests, and production builds on Node 22. API tests do not need a live MongoDB instance; template seeding and authenticated generation do.

## Packages

- `apps/web`: Next.js App Router, React, TypeScript, local Bangla fonts, responsive poster editor and 1600 × 2000 PNG export.
- `apps/api`: Express 5, Mongoose, cookie-based JWT auth, owner-checked uploads and poster history, rate-limited generation, Sharp PNG rendering, and optional Gemini design suggestions.

## Deployment

This repository includes a free testing Blueprint in `render.yaml`. In Render, choose **New + → Blueprint** and connect the repository. It creates only the API service on Render's free plan; deploy the Next.js frontend separately on Vercel. Free Render services sleep when idle, so the first request after inactivity can be slow. When prompted, set `WEB_ORIGIN` to the exact Vercel production URL and provide a MongoDB Atlas connection string and Cloudinary credentials. Render generates `JWT_SECRET`. The API idempotently ensures the starter templates exist whenever it starts. Gemini is optional.

In Vercel, set `NEXT_PUBLIC_API_URL=/api/v1` and `API_ORIGIN=https://poster-api.onrender.com` (or the actual Render API hostname). The Next.js rewrite keeps browser API calls on the frontend origin so secure session cookies continue to work.

Build the API manually with `docker build -f Dockerfile.api -t poster-api .`. Configure `NODE_ENV=production`, Render's `PORT` (provided automatically), `WEB_ORIGIN`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `STORAGE_DRIVER=cloudinary`, and the three `CLOUDINARY_*` secrets. Optionally configure `GEMINI_API_KEY` and `GEMINI_MODEL`. Restrict `WEB_ORIGIN` to the exact frontend origin.

The API Docker image includes Noto fonts for Bengali rendering. Validate actual print proofs for the chosen printer and paper; PNG dimensions alone do not certify color profile or print quality. MongoDB backups, Cloudinary lifecycle/retention, and Gemini quota controls should be configured in the deployment environment.
