# Walkable HYD

Interactive walkability explorer, street-audit dashboard, and community pedestrian issue map for **Hyderabad**.

## Features

- **Interactive Hyderabad Map (Leaflet + OpenStreetMap)**
  - Toggleable layers for **Walk Zones** (dynamic weighted score badges), **Pedestrian Issues** (severity-coded pins & popups), and **Hyderabad Metro** interchange/corridor stations.
  - Click-to-drop & draggable pin placement for reporting street issues with automatic nearest-neighborhood matching.
- **10 Audited Hyderabad Neighborhoods**
  - Jubilee Hills & KBR Perimeter, Necklace Road & Hussain Sagar, Charminar & Laad Bazaar, Secunderabad Parade Ground, HITEC City & Durgam Cheruvu, Banjara Hills, Ameerpet & SR Nagar, Abids/Koti, Gachibowli & Botanical Garden Edge, and Sainikpuri & Yapral.
  - Detailed 4-pillar breakdown (**Canopy & Shade**, **Footpath Quality**, **Metro & Transit**, **Lighting & Safety**), field audit telemetry, and corridor segment statuses.
- **Score Priority Lens & Comparison**
  - Live score re-weighting via presets (*Balanced City*, *Deccan Summer*, *Night & Safety*, *Metro Last-Mile*, *Wheelchair & Stroller*) or custom sliders.
  - Side-by-side neighborhood comparison view.
- **Community Issue Reporter & Export**
  - Filterable feed, upvoting, status workflow (`Reported` → `Verified` → `In Progress` → `Resolved`), `localStorage` persistence, and CSV/JSON export.

## Tech Stack

- React 18 + Vite
- Tailwind CSS v4
- Leaflet
- Lucide React

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```
