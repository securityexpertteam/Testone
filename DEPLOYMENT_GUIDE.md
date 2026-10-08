# Render Deployment Guide

This repository deploys as three Render services from the root `render.yaml` Blueprint:

- **`akshaya-patra-backend`** — Node/Express API backed by MongoDB.
- **`akshaya-patra-frontend`** — public Vite/React static site. The Seller Login footer entry opens collaboration contact information only.
- **`akshaya-patra-seller-portal`** — separate Vite/React seller workspace. It uses the same backend API and MongoDB, but seller accounts must be explicitly approved.

## Before you deploy

Have these ready:

1. A Git repository containing this project, connected to Render.
2. A MongoDB deployment and database user with read/write access.
3. A second, independent MongoDB deployment for the active database mirror. The primary MongoDB deployment must support change streams (MongoDB Atlas replica sets do).
4. A long random value for each backend secret: `JWT_SECRET` and `OTP_HASH_SECRET`.
5. SMTP credentials if the site needs to send sign-in codes or pickup notifications.
6. The organization details to display on the site, such as registration numbers and bank details.

Do not copy real secrets into this guide or commit either `.env` file. Use the example files as key lists: [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

## Create the Render services

1. Push the project to your Git provider and open the repository in the Render Dashboard.
2. Choose **New → Blueprint** and select the repository. Render will read `render.yaml` and prepare the backend, public site, and separate seller portal.
3. Enter the requested values for every `sync: false` variable listed below. Set them in Render’s environment variable form; do not add quote characters around values.
4. Confirm the Blueprint creates all three services, then deploy.

The Blueprint configures each service’s root directory and build/start commands. The backend health check is `/api/health`. The frontend includes a rewrite to `index.html` for client-side routes.

## Backend environment variables

Set these on the **`akshaya-patra-backend`** service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Connection URI for the primary MongoDB deployment. |
| `MONGODB_DB` | No | Primary database name. Blueprint default: `akshaya_patra`. |
| `MONGODB_BACKUP_URI` | Recommended | URI for the independent MongoDB deployment that mirrors application collections. It must not resolve to the primary deployment. |
| `MONGODB_BACKUP_DB` | No | Backup database name. Blueprint default: `akshaya_patra_backup`. |
| `JWT_SECRET` | Yes for authenticated seller flows | Keep private and use at least 32 characters. |
| `SELLER_ADMIN_KEY` | Yes for seller account administration | A separate random secret of at least 32 characters. Keep it only in the backend environment and trusted admin tooling. Never put it in either frontend environment. |
| `ADMIN_USERNAME` | Yes for admin console | Initial admin login name, stored/configured only on the backend. |
| `ADMIN_INITIAL_PASSWORD` | Yes for first admin login | Bootstrap password of at least 12 characters; first sign-in forces a change to a 14+ character password. It is not used to overwrite an already initialized admin account. |
| `ADMIN_LOGIN_LOCKOUT_MINUTES` | No | Lockout duration after five failed admin password attempts. Whole number from `1` to `60`; Blueprint default is `15`. Changing it also adjusts the remaining duration for an existing lockout. |
| `ADMIN_EMAIL` | Yes for admin recovery | Registered email used to validate recovery and receive production OTP. |
| `ADMIN_MOBILE` | Yes for admin recovery | Registered mobile number in international format, e.g. `+91...`; used for recovery validation and SMS OTP delivery. |
| `ADMIN_RESET_CODE` | Yes for admin recovery | Independent random secret of at least 32 characters. Keep only in backend environment; it is required in addition to the OTP. |
| `ADMIN_OTP_MODE` | Optional | Set to `development` only for local/temporary testing; this returns the reset OTP visibly in the admin UI. Never set this in production. Otherwise both email and SMS delivery must be configured. |
| `ADMIN_SMS_ACCOUNT_SID` | Production admin recovery | Twilio account SID. Keep private. |
| `ADMIN_SMS_AUTH_TOKEN` | Production admin recovery | Twilio auth token. Keep private. |
| `ADMIN_SMS_FROM` | Production admin recovery | Twilio sender number in international format. |
| `OTP_HASH_SECRET` | Yes for OTP and pickup-claim flows | Keep private and use a strong random value. |
| `OTP_DELIVERY_MODE` | Yes to choose delivery behavior | Set to `development` only for temporary testing; the generated OTP is returned to the public frontend. Set to `smtp` when email delivery is ready. If unset, production defaults to SMTP. |
| `SMTP_HOST` | For email delivery | SMTP server hostname. |
| `SMTP_PORT` | For email delivery | Blueprint default: `587`. |
| `SMTP_USER` | For email delivery | SMTP account username. |
| `SMTP_PASS` | For email delivery | SMTP account password or app password. Keep private. |
| `SMTP_FROM` | For email delivery | Verified sender address shown to recipients. |
| `SMTP_SECURE` | If needed by your SMTP provider | Set `true` for implicit TLS, commonly port 465; use `false` for STARTTLS, commonly port 587. If omitted, the application defaults to `false`. |

`NODE_ENV` is set to `production` by the Blueprint. Render supplies the service port; the app listens on `PORT` (the Blueprint currently sets it to `5000`).

The API creates its application collections and indexes when it connects to the primary MongoDB database. If `MONGODB_BACKUP_URI` is configured, the backend reconciles all application collections into same-named collections in the backup database and watches primary database changes to mirror inserts, updates, replacements, and deletes. Catalog products are also written to the dedicated `seller_catalog_backup` collection. Change events are retried, and the worker re-snapshots the primary database when it reconnects. With both deployments available and the change stream healthy, updates normally reach the backup within seconds; a provider outage or a large reconciliation can take longer. Configure the backup on a separate deployment, not just a different database name on the primary cluster.

The mirror includes customer, seller, order, donation, payment, and raffle records, including personal data. Restrict access to the backup deployment and its credentials.

Email delivery requires all of `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Without them, OTP email and pickup-availability messages cannot be sent.

### Seller governance and access

Seller applicants can submit an application from the separate seller portal. Applications create a `PENDING_REVIEW` account and do not grant login access; the seller workspace accepts only accounts with `status: "APPROVED"`. Existing seller records without this status cannot log in until reviewed and explicitly approved. Suspending an account revokes seller API access on the next request, including for an already-issued session token.

Set `SELLER_ADMIN_KEY` on the backend to a unique random value of at least 32 characters. Trusted staff can use the backend-only administration API over HTTPS:

- `POST /api/auth/admin/sellers` with `X-Seller-Admin-Key` and JSON fields `storeName`, `sellerName`, `email`, `phone`, optional `gstin`, and a one-time password of at least 12 characters creates an account in `PENDING_REVIEW`. Deliver initial credentials through a verified, private channel.
- `GET /api/auth/admin/sellers` with `X-Seller-Admin-Key` lists account IDs and approval status without returning password hashes.
- `PATCH /api/auth/admin/sellers/:sellerId/status` with the same header and `{ "status": "APPROVED" }` or `{ "status": "SUSPENDED" }` updates an existing seller's access after review. Newly provisioned and legacy accounts must be explicitly approved after due diligence.
- `POST /api/auth/seller/register` accepts seller applications with a 12+ character password and saves them as `PENDING_REVIEW`; an administrator must approve the seller before login is enabled.

Do not place `SELLER_ADMIN_KEY` in browser code, static-site settings, URLs, or support messages. If the key is exposed, rotate it in the backend environment and redeploy the backend. Apply the seller-portal static service from the Blueprint; the Render dashboard will show its separate URL. The public site intentionally does not expose a direct seller login link.

Before re-enabling access for existing records, have staff review the organisation, representative identity, product provenance, and payout ownership, then explicitly approve only verified accounts. Do not bulk-approve accounts based only on their prior existence.

### Administrator console

The main public application serves the hidden route `https://<public-site>/godadmin`; there is no public navigation link to it. The console authenticates only against the backend and reads/writes the existing MongoDB deployment. On its first successful login, it requires changing the environment-provided bootstrap password. Keep `ADMIN_INITIAL_PASSWORD`, `ADMIN_RESET_CODE`, and all admin/SMS credentials exclusively on the backend.

Recovery requires the configured username, email, mobile, `ADMIN_RESET_CODE`, and a short-lived OTP delivered by both SMTP and Twilio SMS. `ADMIN_OTP_MODE=development` bypasses delivery and shows the OTP in the console, so it is strictly for local/temporary testing and must not be set on a live Render service. Seller approval/suspension is recorded in `admin_audit`; seller notification email is sent when SMTP is configured. Status changes still take effect if email delivery fails, and the console reports that failure.

The admin console has sections for portfolio overview, seller management, order register, finance/margins, donors, sales channels, vendor/catalog, operations/stock, trends/performance, and governance audit. It includes monthly revenue/contribution charts, payment reconciliation, seller performance, low-stock and ticket queues, referral/payment-method revenue, donation-by-cause summaries, and CSV exports. Portfolio figures use saved orders, payments, order-linked donation records, seller accounts, products, and raffle campaigns. Collected order revenue counts only `PAID`/`SUCCESS`; pay-on-delivery confirmations remain visible as their own payment status, not cash collected.

The finance section is explicitly not a net-profit or audited accounting report: seller settlements, operating costs, refunds, historical cost snapshots, and bank reconciliations are not persisted. Current stock cost value and listed catalog margins are labeled as estimates. Direct donation form entries are currently stored client-side and are not included in this backend report. The current schema has no standalone sponsor CRM or independent marketing-channel field, so the donor register is not a verified sponsor directory and channel reporting is limited to saved payment methods and `refid` referral attribution.

**Temporary OTP testing:** On the backend Render service, set `OTP_DELIVERY_MODE` to `development`, then redeploy the backend. With MongoDB and `OTP_HASH_SECRET` configured, the OTP appears in the checkout UI and API response, so anyone who can access the public site can see an OTP they request. Do not leave this enabled on a live service. When testing is complete, configure SMTP, set `OTP_DELIVERY_MODE` to `smtp` (or remove it), and redeploy.

## Frontend environment variables

`VITE_API_URL` is set in the Blueprint to `https://testone-viby.onrender.com`. The frontend appends `/api` itself, so API requests use `https://testone-viby.onrender.com/api`. For local builds, set the same value in `frontend/.env` (or copy `frontend/.env.example`).

The Blueprint also provides the public organization and website values from `frontend/.env.example`: legal name and short name, tagline, PAN/TAN and incorporation details, legal structure and operating scope, registered office and contact phone, verification flags, compliance note, website title/subtitle, and receipt availability. Confirm these values in the Render environment before deploying; static frontend environment values are compiled at build time.

- Organization name, CIN, Section 8 registration, 12A/80G URNs, Darpan ID, CSR-1 number, and GSTIN.
- 80G deduction percentage, authorized signatory, and Form 10BE order number.
- Public bank account name, bank, account number, IFSC, branch, escrow label, and audit description.

Use the exact variable names from [`frontend/.env.example`](frontend/.env.example). These values are compiled into the browser app because they use the `VITE_` prefix. **They are public to site visitors. Do not put passwords, private keys, database URIs, bank credentials, or other secrets in frontend variables. Review bank account display values carefully before publishing.**

If an organization value changes in Render, redeploy the frontend so the new value is included in the static build.

Referral sales are available only to an authenticated seller. `GET /api/orders/referral-summary` requires an active seller login session and returns order counts and gross revenue grouped by referral ID for that seller. The Seller Portal displays this report in **Analytics**; orders without a stored referral ID are counted under `subhash`.

## Verify the deployment

1. Open the backend service’s `/api/health` URL. It should return JSON with `"status":"healthy"`.
2. Open the frontend service URL and confirm the page loads over HTTPS.
3. Check the Render logs for both services. The backend should report a MongoDB connection and a running server; there should be no startup failure.
4. Confirm the organization details render as expected. If the site displays `Not configured`, check that variable on the frontend service and redeploy it.
5. Exercise the flows your deployment uses, including catalog loading, seller sign-in, checkout, donation receipts, and email delivery when SMTP is configured.

## Updating the site

Push changes to the connected Git branch to trigger a deployment. Backend environment changes take effect after the backend restarts. Frontend environment changes require a new frontend build and deploy because Vite embeds them at build time.

For local development, copy the example files to `.env` files and fill them locally. Keep `.env` files untracked; never paste their contents into a public issue or commit.
