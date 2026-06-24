vercel-air-quality-map/
├── api/
│   ├── update_overlays.py     ← runs hourly via Vercel Cron
│   └── get_overlays.py        ← serves latest overlay URLs to frontend
├── public/
│   └── index.html             ← Leaflet frontend
├── map-ui.js                  ← Leaflet map loader
├── overlays/                  ← local cache/screenshot source (for dev)
├── vercel.json                ← config for Python + Cron
├── .env.example               ← env vars for Postgres + Blob
└── README.md                  ← for one-click install
