# Render Deployment Guide

This repository deploys as two Render services from the root `render.yaml` Blueprint:

- **`akshaya-patra-backend`** — Node/Express API backed by MongoDB.
- **`akshaya-patra-frontend`** — Vite/React static site. Its API URL is connected to the backend service by the Blueprint.

## Before you deploy

Have these ready:

1. A Git repository containing this project, connected to Render.
2. A MongoDB deployment and database user with read/write access.
3. A second, independent MongoDB deployment for the catalog backup mirror. The backup URI must point to a different MongoDB deployment from the primary URI.
4. A long random value for each backend secret: `JWT_SECRET` and `OTP_HASH_SECRET`.
5. SMTP credentials if the site needs to send sign-in codes or pickup notifications.
6. The organization details to display on the site, such as registration numbers and bank details.

Do not copy real secrets into this guide or commit either `.env` file. Use the example files as key lists: [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

## Create the Render services

1. Push the project to your Git provider and open the repository in the Render Dashboard.
2. Choose **New → Blueprint** and select the repository. Render will read `render.yaml` and prepare both services.
3. Enter the requested values for every `sync: false` variable listed below. Set them in Render’s environment variable form; do not add quote characters around values.
4. Confirm the Blueprint creates both services, then deploy.

The Blueprint configures each service’s root directory and build/start commands. The backend health check is `/api/health`. The frontend includes a rewrite to `index.html` for client-side routes.

## Backend environment variables

Set these on the **`akshaya-patra-backend`** service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Connection URI for the primary MongoDB deployment. |
| `MONGODB_DB` | No | Primary database name. Blueprint default: `akshaya_patra`. |
| `MONGODB_BACKUP_URI` | Recommended | URI for the independent MongoDB deployment used for catalog snapshots. It must not resolve to the primary deployment. |
| `MONGODB_BACKUP_DB` | No | Backup database name. Blueprint default: `akshaya_patra_backup`. |
| `JWT_SECRET` | Yes for authenticated seller flows | Keep private and use at least 32 characters. |
| `OTP_HASH_SECRET` | Yes for OTP and pickup-claim flows | Keep private and use a strong random value. |
| `SMTP_HOST` | For email delivery | SMTP server hostname. |
| `SMTP_PORT` | For email delivery | Blueprint default: `587`. |
| `SMTP_USER` | For email delivery | SMTP account username. |
| `SMTP_PASS` | For email delivery | SMTP account password or app password. Keep private. |
| `SMTP_FROM` | For email delivery | Verified sender address shown to recipients. |
| `SMTP_SECURE` | If needed by your SMTP provider | Set `true` for implicit TLS, commonly port 465; use `false` for STARTTLS, commonly port 587. If omitted, the application defaults to `false`. |

`NODE_ENV` is set to `production` by the Blueprint. Render supplies the service port; the app listens on `PORT` (the Blueprint currently sets it to `5000`).

The API creates its application collections and indexes when it connects to the primary MongoDB database. If `MONGODB_BACKUP_URI` is configured, it initializes `seller_catalog_backup` and mirrors catalog changes. Configure the backup on a separate deployment, not just a different database name on the primary cluster.

Email delivery requires all of `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Without them, OTP email and pickup-availability messages cannot be sent.

## Frontend environment variables

`VITE_API_URL` is connected to the backend host by the Blueprint. The frontend normalizes it to HTTPS when the scheme is omitted and appends `/api` itself.

Set the `VITE_ORG_*` variables on **`akshaya-patra-frontend`** before its build. They configure public site details including:

- Organization name, CIN, Section 8 registration, 12A/80G URNs, Darpan ID, CSR-1 number, and GSTIN.
- 80G deduction percentage, authorized signatory, and Form 10BE order number.
- Public bank account name, bank, account number, IFSC, branch, escrow label, and audit description.

Use the exact variable names from [`frontend/.env.example`](frontend/.env.example). These values are compiled into the browser app because they use the `VITE_` prefix. **They are public to site visitors. Do not put passwords, private keys, database URIs, or other secrets in frontend variables.**

If an organization value changes in Render, redeploy the frontend so the new value is included in the static build.

## Verify the deployment

1. Open the backend service’s `/api/health` URL. It should return JSON with `"status":"healthy"`.
2. Open the frontend service URL and confirm the page loads over HTTPS.
3. Check the Render logs for both services. The backend should report a MongoDB connection and a running server; there should be no startup failure.
4. Confirm the organization details render as expected. If the site displays `Not configured`, check that variable on the frontend service and redeploy it.
5. Exercise the flows your deployment uses, including catalog loading, seller sign-in, checkout, donation receipts, and email delivery when SMTP is configured.

## Updating the site

Push changes to the connected Git branch to trigger a deployment. Backend environment changes take effect after the backend restarts. Frontend environment changes require a new frontend build and deploy because Vite embeds them at build time.

For local development, copy the example files to `.env` files and fill them locally. Keep `.env` files untracked; never paste their contents into a public issue or commit.
