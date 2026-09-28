# Render Deployment Guide

This project is structured with separate **frontend** and **backend** folders to allow seamless deployment on [Render](https://render.com).

---

## Architecture Overview

```text
├── backend/                  <-- Express REST API Service
│   ├── routes/
│   │   ├── orders.ts         <-- Order booking & ticket linkage
│   │   └── raffle.ts         <-- Master raffle ledger & transparent draw
│   ├── data/
│   │   └── store.ts          <-- Persistent master store
│   ├── server.ts             <-- Express server entry
│   ├── package.json          <-- Backend dependencies & scripts
│   └── tsconfig.json
│
├── frontend/                 <-- Vite + React 19 + Tailwind CSS Frontend
│   ├── src/                  <-- React components & pages
│   ├── index.html            <-- HTML entry
│   ├── vite.config.ts        <-- Vite configuration
│   ├── package.json          <-- Frontend dependencies & scripts
│   └── tsconfig.json
│
├── render.yaml               <-- Render Blueprint (Deploy both with 1 click)
└── package.json              <-- Root command shortcuts for frontend/backend
```

---

## Option 1: Instant Deployment via Render Blueprint (Recommended)

1. Push this repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect this repository. Render will automatically detect `render.yaml` and provision:
   - **`akshaya-patra-backend`**: Node.js Web Service running from `backend/` on port `5000` (Health Check: `/api/health`).
   - **`akshaya-patra-frontend`**: Static Site built from `frontend/` publishing to `dist`.

---

## Option 2: Deploying Separately as Two Services Manually

### Service A: Backend API Web Service
- **Service Type**: **Web Service**
- **Environment**: **Node**
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Required environment variables**: `MONGODB_URI`, `OTP_HASH_SECRET`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Set `MONGODB_DB` if the database should not be named `akshaya_patra`.
- **Optional active catalog backup**: Set `MONGODB_BACKUP_URI` to a MongoDB deployment independent from the primary, and `MONGODB_BACKUP_DB` (defaults to `akshaya_patra_backup`). Catalog changes are mirrored into `seller_catalog_backup`; failed writes queue in the primary DB for retry. Do not put this URI in frontend environment variables.

### Service B: Frontend Static Site
- **Service Type**: **Static Site**
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rule**: `/* -> /index.html` (SPA fallback)
- **Environment Variable**: `VITE_API_URL` = URL of your Backend Web Service (e.g. `https://akshaya-patra-backend.onrender.com`). `render.yaml` derives this from the backend service host.

Customer carts and accounts are stored in MongoDB collections named `carts` and `users`. Checkout uses the customer's email as the login ID and issues an HS256 JWT after OTP verification; tokens expire after 30 days. `JWT_SECRET` must be a long, random secret of at least 32 characters. In local non-production mode, the six-digit OTP is displayed in the checkout UI for testing; in production, it is sent by email and never returned to the browser. Production requires SMTP configuration. OTPs expire after 10 minutes and are stored hashed. `OTP_HASH_SECRET` must also be a long, random secret.

---

## Option 3: Deploying as a Unified Full-Stack Web Service
You can also deploy as a single Render Web Service from the repository root:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- The backend will serve the API at `/api/*` and host the compiled frontend `dist/` statically.
