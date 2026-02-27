# ✈️ AirBridge — Frontend
**The door-to-gate departure decision engine.**

AirBridge eliminates the guesswork of airport timing. Enter your flight details, customize your preferences, and get a confidence-scored, minute-by-minute departure plan — from your door to the gate.

[![JavaScript](https://img.shields.io/badge/javascript-ES2022-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Vite](https://img.shields.io/badge/vite-5.x-purple.svg)](https://vitejs.dev/) [![Tailwind CSS](https://img.shields.io/badge/tailwind-3.x-blue.svg)](https://tailwindcss.com/)

---

## Overview
This is the web frontend for AirBridge. It provides a guided, three-step flow for departure planning:

1. **Trip Input** — Enter flight number directly, or search by airline + route + time window
2. **Flight Selection** — Browse matching flights filtered by your criteria and pick your departure
3. **Departure Plan** — View your personalized door-to-gate timeline with confidence scoring

### Key Features
- Dual input mode (flight number / route search)
- Interactive preferences (transport mode, risk profile, checked bags, children, buffer)
- Visual journey map (Leave Home → Airport → Baggage → TSA → Gate)
- Segment breakdown cards (transport, TSA, gate walk, baggage, confidence score)
- Live status indicators (Engine Active, Live & Reactive badges)
- Responsive design for desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite |
| Language | JavaScript (ES2022) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Linting | ESLint |

---

## Project Structure
```
src/
├── api/
│ └── airbridge.contracts.ts # TypeScript types mirroring backend schemas
├── components/ # UI components
├── pages/ # Route-level page components
├── styles/ # Tailwind config + global styles
└── ...
```

---

## Getting Started
```bash
git clone https://github.com/rabahbabaci/airbridge-frontend.git
cd airbridge-frontend
npm install
cp .env.example .env.local
```

Set in `.env.local`:
```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url # stays on Base44 until FastAPI switch
```

Run the app:
```bash
npm run dev
```

---

## Backend Integration
This frontend is designed to work with the [AirBridge Backend API](https://github.com/rabahbabaci/airbridge-backend). API contract types live in `src/api/airbridge.contracts.ts` and stay 1:1 with the backend’s Pydantic schemas.

### Contract Sync Rule
After every backend build:
1. Pull latest `airbridge-backend`.
2. Diff `src/app/schemas/*.py`.
3. Update `airbridge.contracts.ts` so enums and field names match exactly.
4. Commit the contract update alongside any UI work depending on it.

Key contracts:
- `TripContext` (response from `POST /v1/trips`)
- `TripPreferences` + `TripPreferenceOverrides`
- `RecommendationResponse` + `SegmentDetail`
- Enums: `TransportMode`, `ConfidenceProfile`, `SecurityAccess`, `DepartureTimeWindow`, etc.

Backend connection will eventually use `VITE_BASE44_APP_BASE_URL`. Until then, the frontend runs entirely on Base44’s managed backend—use the contracts for type safety and UI parity, but do not connect fetch calls yet.

---

## Live Deployment Guardrails
- Repo deploys automatically to [airbridgeberkeley.base44.app](https://airbridgeberkeley.base44.app).
- **Do not** remove or rename existing Base44 data flows or components without coordination.
- Hold off on FastAPI network calls until explicitly instructed (the flip happens via `VITE_BASE44_APP_BASE_URL`).

---

## Beta Scope
- **Airports:** SFO, OAK, SJC
- **Input modes:** Flight Number, Route Search
- **Status:** Live beta on Base44 (front-end only)

---

## Roadmap
- [x] Landing page & positioning
- [x] Departure Setup wizard (3 steps)
- [x] Dual input mode
- [x] Flight selection UI
- [x] Preference customization
- [x] Journey map visualization
- [x] Segment breakdown cards
- [x] Backend contract types (`airbridge.contracts.ts`)
- [ ] Wire FastAPI backend
- [ ] Boarding pass toggle
- [ ] Security access selector
- [ ] Real-time recommendation updates
- [ ] Push notifications
- [ ] Mobile-optimized experience

---

## Related
- **Backend API:** [airbridge-backend](https://github.com/rabahbabaci/airbridge-backend)
- **Live beta:** [airbridgeberkeley.base44.app](https://airbridgeberkeley.base44.app)

---

## License

[MIT](LICENSE)
