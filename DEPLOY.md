# Deploying Hometown to Railway

Hometown deploys as a **single service**: the Express server serves both the API
(and Socket.io) and the built React app, so it's one URL and one deploy.

Your data services are already cloud-hosted:

- **MongoDB Atlas** — database
- **Cloudinary** — marketplace images
- **Resend** — notification emails

You only need to host the app itself.

---

## 1. Let Atlas accept connections from Railway

Railway dials out from rotating IPs, so allow connections from anywhere:

1. MongoDB Atlas → **Network Access** → **Add IP Address**
2. Choose **Allow access from anywhere** (`0.0.0.0/0`) → Confirm

> For a hardened production setup you'd lock this down, but `0.0.0.0/0` is the
> normal starting point for a PaaS host like Railway.

## 2. Create the Railway project

1. Sign up at **[railway.app](https://railway.app)** and connect your GitHub.
2. **New Project → Deploy from GitHub repo → `kiramichele/hometown`**.
3. Railway auto-detects Node and uses the root `package.json`:
   - **build:** `npm run build` (installs server + client deps, builds the
     React app into `client/dist`)
   - **start:** `npm start` (`node server/src/index.js`, which then serves
     `client/dist`)

   If it doesn't auto-detect, set those two commands manually in
   **Settings → Build / Deploy**.

## 3. Set environment variables

In the service's **Variables** tab, add:

| Variable          | Value                                                        |
| ----------------- | ----------------------------------------------------------- |
| `MONGODB_URI`     | your Atlas connection string                                 |
| `JWT_SECRET`      | a long random string                                         |
| `CLOUDINARY_URL`  | from your Cloudinary dashboard                               |
| `RESEND_API_KEY`  | from Resend                                                  |
| `MAIL_FROM`       | `Hometown <onboarding@resend.dev>` (or your verified domain) |
| `CLIENT_ORIGIN`   | your Railway URL (see step 4) — used for email links         |

> `PORT` is provided by Railway automatically — don't set it. The server reads
> `process.env.PORT`.

## 4. Generate a public URL

1. **Settings → Networking → Generate Domain** → you get
   `https://<something>.up.railway.app`.
2. Set `CLIENT_ORIGIN` to that exact URL and redeploy (this makes the links in
   notification emails point at the live site).

## 5. Verify

- Visit your Railway URL — you should see the login page.
- Log in with a seeded account (`resident@burgaw.test` / `password123`) or
  register a new one.
- Check the board (realtime), marketplace (images), and notifications.

---

## Notes

- **Seed data** already lives in your Atlas database (we've been developing
  against it). To reset it, run `npm run seed` locally — it points at the same
  `MONGODB_URI`.
- **Email** only delivers to your own Resend account address until you verify a
  sending domain at resend.com/domains, then point `MAIL_FROM` at it.
- **Secrets:** never commit `.env` (it's gitignored). Set everything in
  Railway's Variables. If a key was ever exposed, rotate it.
- **Auto-deploy:** every push to `main` triggers a new Railway deploy.
