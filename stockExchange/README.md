# Stock Exchange Simulator

Full-stack NestJS + React application for configuring a simulated broker exchange: manage broker participants, configure supported equities, replay historical prices, and emit real-time quotes to connected clients over WebSockets.

## Highlights
- **Persistent JSON storage** for brokers, stocks, market settings, and historical quotes (no external DB required).
- **NestJS backend** with REST endpoints, Passport-based authentication, and Socket.IO gateway for live tick broadcasts.
- **React 18 + Vite frontend** with Material UI, React Router, Redux Toolkit, Chart.js visualizations, and responsive layouts down to mobile breakpoints.
- **Historical data coverage** for Apple, Starbucks, Microsoft, Cisco, Qualcomm, Amazon, Tesla, and AMD (2024–2025 sample dataset in `backend/data/historical`).
- **Figma blueprint** documented in `docs/figma.md` to guide continued UI refinements.

## Project Structure
```
backend/   NestJS server (REST + WebSocket)
frontend/  React client (Vite, TS, Redux, MUI)
docs/      Architecture notes + Figma blueprint
data/      JSON persistence (inside backend/)
```

## Getting Started
1. **Install dependencies** (runs for both workspaces):
   ```bash
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   ```
2. **Environment variables**
   - Copy `backend/.env.example` → `backend/.env` (adjust `PORT`, `JWT_SECRET` as needed).
   - Copy `frontend/.env.example` → `frontend/.env` if you need a custom API/WebSocket base URL.
3. **Development servers**
   ```bash
   npm run dev          # runs backend (localhost:3001) + frontend (localhost:5173)
   ```
   Log in on the frontend with the seeded admin user (`admin` / `admin123`).

## Backend APIs (NestJS)
Base URL: `http://localhost:3001/api`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Obtain JWT token | – |
| GET | `/health` | Health probe | – |
| GET | `/brokers` | List brokers | – |
| POST/PATCH/DELETE | `/brokers` | Manage brokers | ✅ |
| GET | `/stocks` | List stocks | – |
| GET | `/stocks/:symbol/history` | Historical quotes | – |
| PATCH | `/stocks/:symbol` | Toggle participation | ✅ |
| GET | `/market/settings` | Current exchange settings | – |
| PATCH | `/market/settings` | Update settings | ✅ |
| POST | `/market/simulations/start` | Start playback + first tick | ✅ |
| POST | `/market/simulations/stop` | Stop playback | ✅ |
| GET | `/market/tick` | Latest broadcast tick snapshot | – |

WebSocket namespace: `ws://localhost:3001/ticker` (event `tick` broadcasting `{ date, prices[] }`).

## Frontend (React + MUI)
- Pages: Brokers, Stocks, Market Settings, Login.
- State management via Redux Toolkit slices (auth, brokers, stocks, market).
- Chart.js for historical price visualization, Material UI components for responsive UI.
- Live ticker updates via Socket.IO client hook.

## Testing & Quality
- **Backend unit tests**: `npm --prefix backend test`
- **Backend e2e tests**: `npm --prefix backend run test:e2e`
- **Frontend build (type-check)**: `npm --prefix frontend run build`

## Design Assets
Refer to `docs/figma.md` for frame descriptions, spacing tokens, and component guidance when editing the Figma mockups.

## Future Enhancements
1. Persist broker credentials + multi-user auth store.
2. Import live historical CSVs from Nasdaq automatically.
3. Add broker-side UI for subscribing to WebSocket feeds and executing simulated trades.
4. Expand test coverage (frontend components + backend integration flows).
