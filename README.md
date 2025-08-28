# BIMPO

Nature-education bingo app: Birds, Insects, Mushrooms, Plants, Other.

## Tech
- Frontend: SvelteKit + Tailwind v4 + shadcn-svelte
- Backend: Node + Hono (TypeScript)
- Data: iNaturalist API `/observations/species_counts`

## Prereqs
- Node >= 18.18

## Run locally
Open two terminals.

1) Backend
```bash
cd apps/server
npm install
npm run build
npm start
# http://localhost:8787
```

2) Frontend
```bash
cd apps/web
npm install
npm run dev
# http://localhost:5173
```

## Usage
- Use "Use my location" or enter lat/lng
- Click "Generate Board" to fetch top N species and build a board
- Check tiles as you observe items; board persists in localStorage

## Configuration
- Backend port: `PORT` env (default 8787)
- Species endpoint: `/api/species?lat=..&lng=..&radius=25&n=25`

## Future work
- Camera capture and species verification
- Upload observations to iNaturalist
- Better board theming and sharing
