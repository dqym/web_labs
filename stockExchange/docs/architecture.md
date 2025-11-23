# Stock Exchange Simulator – Architecture Plan

## Overview
Full-stack TypeScript solution consisting of a NestJS backend exposing REST + WebSocket APIs and a React + Redux + Material UI frontend served via Vite. Persistent configuration is stored in JSON files, making the app self-contained without a database.

## Backend (NestJS)
- **Framework**: NestJS (TypeScript) with Fastify adapter (better WS throughput) – can fall back to Express if needed.
- **Modules**:
  - `ConfigModule`: reads/writes brokers and stocks JSON files through a `JsonStoreService` to satisfy persistence requirement.
  - `BrokersModule`: REST CRUD for broker list (name, cash balance, active flag) and emits WebSocket notifications on updates.
  - `StocksModule`: exposes available stocks, historical quotes, and selection toggles for trading.
  - `MarketModule`: holds `MarketSettingsService` (start date, tick speed) and `SimulationService` that replays historical prices and broadcasts ticker updates over `@WebSocketGateway`.
  - `AuthModule` (optional bonus): Passport.js local strategy with sessionless JWT guard for admin screens.
- **Data flow**:
  - JSON files stored under `data/brokers.json`, `data/stocks.json`, `data/settings.json`.
  - `SimulationService` loads selected stocks + historical quotes and iterates through dates via RxJS interval mapped to configured playback speed.
  - WebSocket messages follow `{ date: string, quotes: Array<{symbol:string, price:number}> }`.
- **Tech**: Class-validator pipes, Swagger for quick API inspection, websocket gateway using `@nestjs/websockets` (socket.io adapter).

## Frontend (React)
- **Framework**: React 18 + Vite + TypeScript.
- **State**: Redux Toolkit store with slices:
  - `brokersSlice` (list + CRUD async thunks)
  - `stocksSlice` (catalog, historical data, selection state)
  - `settingsSlice` (market start date, tick speed, simulation status)
  - `wsSlice` (live ticker feed)
- **Routing**: `react-router-dom` with routes `/brokers`, `/stocks`, `/market` plus `/login` if auth enabled.
- **UI**: Material UI components, responsive layout via `Grid` + `useMediaQuery`. Charts via `react-chartjs-2` (wrapping Chart.js) to render price history (line chart) and selection summary (bar chart).
- **WebSockets**: Reusable hook `useTickerFeed` establishing socket.io connection to backend; updates Redux store for live panels.
- **Pages**:
  - **BrokersPage**: table + forms to add/remove/edit brokers, cash slider, selection toggle.
  - **StocksPage**: list of supported tickers, detail drawer with historical table + chart, selection checkboxes.
  - **MarketSettingsPage**: controls start date, tick speed, start button, real-time ticker board, timeline indicator.
- **Responsiveness**: Layout scales via Material UI breakpoints, mobile nav drawer.

## Data & Historical Quotes
- Ships preloaded JSON for mandatory tickers (AAPL, SBUX, MSFT, CSCO, QCOM, AMZN, TSLA, AMD) for current + previous year. Fetching from nasdaq.com is manual/offline; data stored in `data/historical/<symbol>.json`.
- `stocks.json` references metadata, `historical` directory holds price arrays.

## Figma Design
- UI mockups prepared in Figma (frames: Brokers List, Stock Catalog, Market Dashboard, Mobile variations). Documented separately in `docs/figma.md` with sharing instructions.

## Deployment & Tooling
- Root workspace uses pnpm with shared `package.json` scripts: `pnpm --filter backend ...`, `pnpm --filter frontend ...`.
- ESLint + Prettier configs aligned for both apps.
- `.env` managed separately for backend (port, JWT secret) and frontend (API base URL).
