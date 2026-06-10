# Hometown — a neighborhood social platform for Burgaw, NC

A MERN (MongoDB · Express · React · Node) social platform scoped to a single
neighborhood. Portfolio project + something locally useful.

## Stack

- **MongoDB** + Mongoose (data)
- **Express** (REST API)
- **React** + Vite + React Router (frontend)
- **JWT** auth (hand-rolled — no Supabase)
- **Socket.io** for realtime (Phase 3+)

## Roadmap

| Phase | Feature | New skill |
|-------|---------|-----------|
| 0 | Auth foundation | JWT auth, middleware, React auth context |
| 1 | Posts feed | CRUD + embedded documents |
| 2 | Events + calendar | Date-range queries, calendar UI |
| 3 | Realtime board | WebSockets (Socket.io) — **v1 ships here** |
| 4 | Marketplace | Image upload + search/filter |
| 5 | Notifications | Event-driven patterns + email |
| 6 | Moderation | Roles, queues, audit logging |
| 7 | Map + directory + polls | Geo data, privacy controls |
| 8 | Admin analytics | Mongo aggregation pipelines |

Two decisions baked in from day one: every document carries a `neighborhood`
reference (so multi-tenant is possible later with no migration), and
`location` fields use GeoJSON `Point` shape (so the Phase 7 map needs no
schema change).

## Project structure

```
hometown/
├── server/                 Express API
│   └── src/
│       ├── config/db.js    Mongo connection
│       ├── models/         Mongoose schemas
│       ├── middleware/     requireAuth, requireSameNeighborhood, requireRole
│       ├── routes/         API routes
│       ├── utils/seed.js   Seed script
│       └── index.js        Server entry
└── client/                 React app (Vite)
    └── src/
        ├── api/client.js   fetch wrapper (attaches JWT)
        ├── context/        AuthContext
        ├── components/     ProtectedRoute
        ├── pages/          Login, Register, Dashboard
        └── App.jsx         Routing
```

## Getting started

### Prerequisites

- **Node.js 18+** (`node --version`)
- **MongoDB** running locally. Either:
  - Install MongoDB Community Edition and run `mongod`, OR
  - Use a free MongoDB Atlas cluster and paste its URI into `.env`

### 1. Server

```bash
cd server
npm install
cp .env.example .env        # then edit .env — at minimum set a real JWT_SECRET
npm run seed                # creates the Burgaw neighborhood + 3 test users
npm run dev                 # starts on http://localhost:5000
```

Test users (password for all: `password123`):
- `admin@burgaw.test` (admin)
- `mod@burgaw.test` (moderator)
- `resident@burgaw.test` (resident)

### 2. Client (in a second terminal)

```bash
cd client
npm install
npm run dev                 # starts on http://localhost:5173
```

Open http://localhost:5173, log in with a test user, and you should land on
the dashboard. That's Phase 0 done.

### Sanity checks

- `curl http://localhost:5000/api/health` → `{"ok":true}`
- If login fails with "No neighborhood exists," you forgot `npm run seed`.
- If the client can't reach the API, confirm both servers are running — Vite
  proxies `/api` to port 5000 (see `client/vite.config.js`).
