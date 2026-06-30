# GeoAlert – Full Project Audit
**Global Natural Events Awareness Hub**
*Powered by NASA EONET v3 API*

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **App name** | GeoAlert – Global Natural Events Hub |
| **Live URL** | https://weather-app-rho-flax-24.vercel.app/ |
| **Stack** | Vanilla HTML · CSS · JavaScript (no framework, no build step) |
| **Data source** | NASA EONET v3 API – `https://eonet.gsfc.nasa.gov/api/v3` |
| **Maps** | Leaflet 1.9.4 + Leaflet.markercluster 1.5.3 |
| **Charts** | Chart.js 4.4.0 |
| **Icons** | Font Awesome 6.5.0 |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Deployment** | Vercel (static hosting) |
| **Total code** | ~2,981 lines · ~157 KB across 3 files |

---

## 2. File Structure

```
Weather_app/
├── index.html      ← Full app structure, all views, modals, guide system
├── app.css         ← Complete stylesheet (dark + light themes, responsive)
├── app.js          ← All logic: API, map, charts, filters, UI, guide tour
├── vercel.json     ← Routing config (all paths → index.html)
├── Weather.html    ← Original weather app (preserved, untouched)
├── Weather.css     ← Original weather styles (preserved)
├── Weather.js      ← Original weather JS (preserved)
└── AUDIT.md        ← This document
```

---

## 3. What Was Built — Session by Session

### Session 1 · Core App (index.html + app.css + app.js)

Built the entire application from scratch, replacing the single-card weather app
with a full multi-view geo-awareness platform.

#### HTML Structure (`index.html`)
- Fixed **topbar** with brand, 6-button navigation, action icons
- **Status bar** — live satellite connection indicator with event count + timestamp
- **Sidebar** — sticky filter panel (search, status, time window, categories, map layer, apply)
- **6 view sections** inside `<main>`: Map, Events, Timeline, Near Me, Learn, Stats
- **Event detail drawer** — slides in from the right on any event click
- **Snapshot modal** — share current view as URL or plain text
- **Toast container** — bottom-right notification stack
- Full `role`, `aria-label`, `aria-modal`, `aria-live` attributes throughout

#### CSS Architecture (`app.css`)
- **CSS custom properties** for full theming (18 variables for dark mode)
- **Light mode override** via `[data-theme="light"]`
- **9 category color variables** (`--c-wildfire`, `--c-storm`, etc.)
- Layout: fixed topbar → statusbar → flex shell (sidebar + main)
- Components: cards, badges, chips, drawers, modals, toasts, skeletons, spinners
- **Responsive breakpoints**: ≤900px (sidebar hidden, icon nav), ≤640px (single column)
- Custom Leaflet popup and marker overrides
- Animations: `pulse`, `skeleton`, `slideInRight`, `fadeOut`, `spin`

#### JavaScript Modules (`app.js`)

| Section | Description |
|---------|-------------|
| **0. Constants & Config** | API base URLs, cache TTL, retry settings, `CATEGORY_META` (13 types with icon/color/label), `LEARN_DATA` (9 categories with facts/safety/links) |
| **0b. Fallback Data** | `FALLBACK_CATEGORIES` (9) + `FALLBACK_EVENTS` (15 representative real-world events) |
| **1. State** | Single `State` object — events, filteredEvents, categories, filters, nearMe, cache, charts, maps, layers |
| **2. Utilities** | `debounce`, `haversineKm`, `bboxFromLatLon`, `formatDate`, `formatDateShort`, `timeSince`, `getCatMeta`, `getEventLatestDate`, `getEventCoords` |
| **3. Toast** | `toast(msg, type, duration)` — success/error/info/warn variants, auto-removes |
| **4. API Client** | `apiFetch` with 3-minute cache, 12s timeout, retry logic; `buildEventsURL`, `fetchEvents`, `fetchCategories`, `fetchEventsGeoJSON` |
| **5. MapModule** | 4 tile providers (OSM, Satellite, Topo, Dark), custom emoji markers, cluster group, popup builder, legend builder, drawer map init with geometry timeline |
| **6. UIModule** | Category sidebar render, event card grid render, card HTML builder, event detail drawer open/close, status bar update, loading overlay, error banner |
| **7. FilterModule** | Read all filter state from DOM, `applySearch`, `applyAll` (category + search filters) |
| **8. ChartsModule** | 7 Chart.js charts: daily bar, category doughnut, stats category horizontal bar, status pie, trend line, weekday bar, heatmap — all with destroy-before-recreate |
| **9–10. Timeline & Stats** | Timeline list + 3 charts; KPI cards + 3 charts + top-10 clickable table |
| **11. NearMeModule** | Nominatim geocoding, lat/lon parser, haversine bbox builder, near-me map render (user dot + radius circle + event markers), safety note logic |
| **12. Learn** | Category grid render, `openLearnModal` with facts table, safety tips, live EONET examples, external links |
| **13. Snapshot** | URL param builder, summary card with top-3 events, clipboard copy |
| **14. loadData** | Orchestrator: fetch categories + events, apply filters, render all, status update |
| **15. View Navigation** | `switchView(name)` — activates view, updates nav, invalidates map sizes |
| **16. URL Params** | `applyURLParams()` — restores status, days, limit from shared URL |
| **17. bindEvents** | All DOM event listeners: nav, apply/clear, search debounce, chips, sort, map controls, drawer, refresh, theme, snapshot |
| **18. Init** | `DOMContentLoaded` — wires everything up, calls `loadData`, starts 60s fallback retry |

---

### Session 2 · API Resilience (503 Fix)

The deployed site showed a blank screen with `HTTP 503: Service Unavailable`
because NASA EONET was temporarily down. Three fixes were added:

#### Retry with Exponential Backoff
```
apiFetch(url, attempt)
  → 12s timeout via AbortController
  → On 5xx/429/timeout: retry up to 3 times
  → Delays: 1.5s → 3s → 6s
  → Shows "retry N/3…" in status bar
```

#### Graceful Fallback Dataset
- 15 hand-picked real events across all 9 categories, multiple continents
- Includes open and closed examples, magnitude data where applicable
- Complete geometry arrays (some with multi-point history)
- `FALLBACK_CATEGORIES` ensures the sidebar populates even with no API

#### Offline Warning Banner
- Yellow bar injected below the status bar
- Text: "NASA EONET unavailable — displaying sample events"
- **Retry Now** button (clears cache + reloads)
- **✕** dismiss button
- Adjusts `app-shell` height so content is not hidden behind it
- `hideOfflineBanner()` removes it and restores layout when live data returns

#### Auto-Recovery
- `setInterval` every 60 seconds silently retries if offline banner is present
- On success: banner disappears, live data loads, toast confirms

---

### Session 3 · User Guide System

Three interconnected components added to make the app accessible to
non-technical users, travellers, students, and community workers.

#### Welcome Overlay (first visit)
- Full-screen modal with blur backdrop
- Hero: globe emoji, app title, tagline
- 2×2 feature grid (Map, Near Me, Stats, Learn) with icons and 1-line descriptions
- Two CTAs: **Take a Quick Tour** (~2 min badge) and **Skip — Jump In**
- **"Don't show again"** checkbox → `localStorage.setItem('geoalert_guide_seen', '1')`
- Shown only on first visit; skipped automatically on return visits

#### Interactive Step Tour (9 steps)
```
Step 1  → Welcome (centered, no highlight)
Step 2  → Map view button + auto-switches to Map
Step 3  → Sidebar filter header (highlights sidebar)
Step 4  → Events list button + auto-switches to Events
Step 5  → Near Me button + auto-switches to Near Me
Step 6  → Timeline button + auto-switches to Timeline
Step 7  → Learn button + auto-switches to Learn
Step 8  → Share (snapshot) button
Step 9  → Help (?) button — tour complete
```
- Dark backdrop with **cutout highlight** on target element
- Blue glow box-shadow around target
- Smart tooltip positioning: below or right of target, auto-flips near edges
- Directional arrow on tooltip (top/bottom/left/right)
- Step counter badge, animated dot progress
- Back/Next buttons + arrow key navigation (← →)
- Esc or ✕ exits at any time

#### Help Panel (? button, always available)
7-tab modal (780px wide, 90vh max):

| Tab | Contents |
|-----|----------|
| **Overview** | Intro banner, 6 feature blocks with "Go to →" buttons, pro tip box, "Launch Tour" button |
| **🗺 Map** | 6 numbered steps, full color legend grid for all 9 event types |
| **🔍 Filters** | 7-row reference table, live-search tip |
| **📍 Near Me** | 6 numbered steps, safety disclaimer box |
| **📊 Views** | Accordion: Timeline, Stats, Detail Drawer, Share Snapshot |
| **❓ FAQ** | 8 questions (data source, freshness, 503, mobile, regions, Open/Closed, magnitude, sharing) |
| **⌨️ Shortcuts** | Full keyboard/mouse shortcut table, traveller tip, teacher tip |

**? button** pulses blue (4 times, 2s delay) for new users via CSS animation.
Stops pulsing permanently once the guide is opened.

---

## 4. NASA EONET API Usage

| Endpoint | Used for |
|----------|----------|
| `GET /events` | Main event fetch with filters |
| `GET /events/geojson` | GeoJSON format (map overlay ready) |
| `GET /categories` | Category list for sidebar |

### Query Parameters Used

| Parameter | Effect |
|-----------|--------|
| `status=open\|closed` | Filter by event status |
| `days=N` | Events from last N days |
| `start=YYYY-MM-DD` | Custom date range start |
| `end=YYYY-MM-DD` | Custom date range end |
| `limit=N` | Cap results (20–200) |
| `category=id` | Filter by event type |
| `bbox=minLon,maxLat,maxLon,minLat` | Geographic bounding box |

### Event Object Fields Used

| Field | Displayed as |
|-------|-------------|
| `id` | Event ID, cache key |
| `title` | Card title, map popup, drawer |
| `description` | Card body, drawer |
| `closed` | Open/Closed badge, opacity |
| `link` | NASA EONET link in drawer |
| `categories[].id/title` | Color coding, badge, filter |
| `sources[].id/url` | Source list in drawer |
| `geometry[].date` | Latest date display |
| `geometry[].type` | Point vs Polygon handling |
| `geometry[].coordinates` | Map marker placement |
| `geometry[].magnitudeValue` | Magnitude display |
| `geometry[].magnitudeUnit` | Magnitude unit label |

---

## 5. Accessibility Features

- All interactive elements have `aria-label`
- Map sections use `role="application"`
- Modals/drawers use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Status bar uses `role="status"` and `aria-live="polite"`
- Toast container uses `aria-live="assertive"`
- Tour tooltip uses `role="tooltip"` and `aria-live="polite"`
- Category list uses `role="group"`, radio groups use `role="radiogroup"`
- All decorative icons have `aria-hidden="true"`
- All `<img>` elements have `alt` attributes
- Cards have `tabindex="0"` and `role="button"` for keyboard access
- `:focus-visible` outline on event cards
- `accent-color: var(--accent)` on all checkboxes/radios
- High-contrast dark mode by default; light mode toggle available
- `Esc` key closes all modals, drawers, and the tour

---

## 6. Performance Considerations

| Technique | Detail |
|-----------|--------|
| **3-minute cache** | `State.cache` prevents duplicate API calls for same URL |
| **Debounced search** | 350ms debounce on keyword input |
| **Marker clustering** | Leaflet.markercluster groups nearby markers, reduces DOM nodes |
| **`preferCanvas: true`** | Leaflet canvas renderer for better performance with many markers |
| **Chart destroy before recreate** | `ChartsModule.destroy(key)` prevents memory leaks |
| **Chunked loading** | MarkerCluster `chunkedLoading: true` |
| **Configurable limit** | User controls max events (20–200) |
| **Lazy detail maps** | Drawer map only initializes when drawer opens |
| **No build step** | Zero-bundle, loads directly in browser |

---

## 7. Error Handling Summary

| Scenario | Behaviour |
|----------|-----------|
| NASA API 503/500 | Retry 3× with exponential backoff (1.5s/3s/6s) |
| Request timeout (>12s) | Abort + retry up to 3 times |
| All retries fail | Load `FALLBACK_EVENTS` + show yellow offline banner |
| API recovers | Auto-detected every 60s, banner removed, live data restored |
| Location denied (Near Me) | Toast "Location access denied" |
| City not found (Nominatim) | Toast "Location not found. Try lat,lon format." |
| Empty filter results | Empty state illustration + "No events match your filters." |
| Invalid geometry | `getEventCoords()` returns null, event skipped silently |
| Leaflet map already destroyed | Null-check before `remove()` |
| Chart already exists | `destroy()` called before `new Chart()` |

---

## 8. Event Categories Supported

| Icon | Category | Color |
|------|----------|-------|
| 🔥 | Wildfires | `#ff6b35` |
| ⛈️ | Severe Storms | `#4fc3f7` |
| 🌊 | Floods | `#2196f3` |
| 🌋 | Volcanoes | `#ff5722` |
| 🏔️ | Earthquakes | `#9c27b0` |
| 🧊 | Sea & Lake Ice | `#80deea` |
| ⛰️ | Landslides | `#795548` |
| ☀️ | Drought | `#ff9800` |
| 🌫️ | Dust & Haze | `#d4ac78` |
| 🌿 | Mangroves | `#4caf50` |
| 💧 | Water Color | `#00bcd4` |
| 🌡️ | Temp Extremes | `#e91e63` |
| 🌐 | Other | `#8b949e` |

---

## 9. Learn Content Coverage

9 categories have full educational content:

| Category | Facts | Safety Tips | External Links |
|----------|-------|-------------|----------------|
| Wildfires | 4 | 4 | NIFC, NASA FIRMS |
| Severe Storms | 4 | 4 | NHC, Weather.gov |
| Floods | 4 | 4 | FEMA, FloodSmart |
| Volcanoes | 4 | 4 | USGS, Smithsonian GVP |
| Earthquakes | 4 | 4 | USGS, EMSC |
| Sea & Lake Ice | 4 | 3 | NSIDC, NASA Cryosphere |
| Landslides | 4 | 4 | USGS Landslides |
| Drought | 4 | 4 | US Drought Monitor, NDMC |
| Dust & Haze | 4 | 4 | AirNow, NASA MODIS |

---

## 10. Third-Party Libraries

| Library | Version | CDN | Purpose |
|---------|---------|-----|---------|
| Leaflet | 1.9.4 | unpkg | Interactive maps |
| Leaflet.markercluster | 1.5.3 | unpkg | Marker grouping |
| Chart.js | 4.4.0 | jsDelivr | All charts |
| Font Awesome | 6.5.0 | cdnjs | Icons |
| OpenStreetMap tiles | — | osm.org | Default map layer |
| Esri World Imagery | — | arcgisonline | Satellite layer |
| OpenTopoMap | — | opentopomap.org | Topographic layer |
| Stadia Maps (Dark) | — | stadiamaps.com | Dark map layer |
| Nominatim | — | nominatim.openstreetmap.org | City geocoding |

---

## 11. Keyboard & Interaction Reference

| Action | Shortcut / Interaction |
|--------|----------------------|
| Close drawer / modal / tour | `Esc` |
| Tour: next step | `→` arrow key |
| Tour: previous step | `←` arrow key |
| Open event detail | Click any card, map marker popup → "View Details", timeline row, stats table row |
| Pan map | Click + drag |
| Zoom map | Scroll wheel / +/− buttons |
| Expand cluster | Click cluster circle |
| Fit all events | ⛶ button (map top-right) |
| Toggle clustering | ⊞ button (map top-right) |
| Search events | Type in sidebar search box (live, no button needed) |
| Apply filters | Click "Apply Filters" button |
| Reset filters | Click "Clear all" in sidebar header |
| Switch map layer | Sidebar radio buttons |
| Switch theme | ☯ icon (top bar) |
| Share | 📤 icon (top bar) → copy URL or text |
| Open guide | ? icon (top bar) |
| Refresh data | 🔄 icon (top bar) |

---

## 12. What Still Could Be Extended

These are noted in the original PRD as future scope — not yet built:

- **Satellite imagery overlays** via NASA Worldview / GIBS API
- **Heatmap mode** (button exists, shows "coming in v2" toast)
- **Risk tagging** heuristics (e.g. "storm near coastline")
- **Multi-language support** (i18n strings)
- **PNG export** of snapshot card
- **Push notifications** for new events
- **Earthquake magnitude filter** (magMin/magMax params)
- **Bounding box draw on map** (drag rectangle → bbox query)
- **Backend caching layer** for heavier API proxying

---

## 13. Deployment

**Platform:** Vercel (static, no server)

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/",    "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy updates: push to the connected Git repository or run `vercel --prod`.

**Note on Chrome "Dangerous Site" warning:** This only appears when opening
`index.html` directly via `file://` protocol. Serving via `http://localhost`
(e.g. Python `http.server` or VS Code Live Server) or via Vercel resolves it.

---

*Audit generated: June 30, 2026*
*Codebase: 2,981 lines · 157 KB · 3 files*
*Data: NASA EONET v3 · eonet.gsfc.nasa.gov*
