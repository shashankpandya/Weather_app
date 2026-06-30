/**
 * GeoAlert – Global Natural Events Awareness Hub
 * Powered by NASA EONET v3 API
 * Vanilla JS · Leaflet · Chart.js
 */

'use strict';

/* ============================================================
   0. CONSTANTS & CONFIG
   ============================================================ */
const EONET_BASE   = 'https://eonet.gsfc.nasa.gov/api/v3';
const NOMINATIM    = 'https://nominatim.openstreetmap.org/search';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const MAX_RETRIES  = 3;
const RETRY_DELAY  = 1500; // ms base delay (doubles each retry)

const CATEGORY_META = {
  wildfires:       { icon:'🔥', color:'#ff6b35', label:'Wildfires',        desc:'Uncontrolled fires that burn in wildland vegetation.' },
  severeStorms:    { icon:'⛈️', color:'#4fc3f7', label:'Severe Storms',    desc:'Tropical cyclones, hurricanes, typhoons, and severe weather.' },
  floods:          { icon:'🌊', color:'#2196f3', label:'Floods',            desc:'Rising or overflow of water inundating normally dry areas.' },
  volcanoes:       { icon:'🌋', color:'#ff5722', label:'Volcanoes',         desc:'Volcanic eruptions and related geological events.' },
  earthquakes:     { icon:'🏔️', color:'#9c27b0', label:'Earthquakes',      desc:'Seismic events and ground shaking.' },
  seaAndLakeIce:   { icon:'🧊', color:'#80deea', label:'Sea & Lake Ice',    desc:'Changes in sea ice extent and lake ice coverage.' },
  landslides:      { icon:'⛰️', color:'#795548', label:'Landslides',       desc:'Mass movement of rock, earth, or debris.' },
  drought:         { icon:'☀️', color:'#ff9800', label:'Drought',           desc:'Prolonged periods of abnormally low rainfall.' },
  dustHaze:        { icon:'🌫️', color:'#d4ac78', label:'Dust & Haze',      desc:'Dust storms and hazy atmospheric conditions.' },
  mangroves:       { icon:'🌿', color:'#4caf50', label:'Mangroves',         desc:'Changes in mangrove forest coverage.' },
  waterColor:      { icon:'💧', color:'#00bcd4', label:'Water Color',       desc:'Unusual changes in water body color, often from algae.' },
  tempExtremes:    { icon:'🌡️', color:'#e91e63', label:'Temp Extremes',    desc:'Extreme temperature events, both hot and cold.' },
  default:         { icon:'🌐', color:'#8b949e', label:'Other',             desc:'Other natural events tracked by NASA EONET.' },
};

const LEARN_DATA = {
  wildfires: {
    title:'Wildfires', icon:'🔥', color:'#ff6b35',
    summary:'Wildfires are uncontrolled fires that spread rapidly through vegetation, forests, and grasslands. They can be triggered by lightning, human activity, or extreme heat and drought conditions.',
    facts:[ ['Avg. speed','14 mph in grass'],['Hottest temp','1,472°F (800°C)'],['US/year','~70,000 fires'],['CO2 released','~8 Gt/year globally'] ],
    safety:['Prepare a go-bag with essentials.','Sign up for local evacuation alerts.','Clear dry vegetation around your home.','Never go back for belongings — evacuate immediately.'],
    links:[ {label:'NIFC',url:'https://www.nifc.gov/'},{label:'NASA Fire Info',url:'https://www.earthdata.nasa.gov/learn/find-data/near-real-time/firms'} ]
  },
  severeStorms: {
    title:'Severe Storms', icon:'⛈️', color:'#4fc3f7',
    summary:'Severe storms include tropical cyclones, hurricanes, typhoons, and tornado-producing supercells. They bring powerful winds, heavy rain, storm surges, and flooding.',
    facts:[ ['Hurricane scale','Cat 1–5 (Saffir-Simpson)'],['Fastest wind','185+ mph in Category 5'],['Season (Atlantic)','June 1 – Nov 30'],['Costliest storm','Hurricane Katrina ~$125B'] ],
    safety:['Know your local storm shelter.','Board windows and secure outdoor items.','Stock 3-day emergency water/food supply.','Avoid driving through flooded roads.'],
    links:[ {label:'NHC',url:'https://www.nhc.noaa.gov/'},{label:'Weather.gov',url:'https://www.weather.gov/'} ]
  },
  floods: {
    title:'Floods', icon:'🌊', color:'#2196f3',
    summary:'Floods occur when water inundates land that is normally dry. They can be caused by heavy rainfall, storm surge, dam failure, or rapid snowmelt.',
    facts:[ ['#1 weather hazard','Most deadly worldwide'],['Flash flood','Can develop in <6 hours'],['Depth needed','6 inches to knock over adult'],['Car float','Just 12 inches of water'] ],
    safety:['Move to higher ground immediately.','Do not walk or drive through flood water.','Disconnect electrical appliances.','Follow local emergency instructions.'],
    links:[ {label:'FEMA Floods',url:'https://www.fema.gov/flood'},{label:'Flood Smart',url:'https://www.floodsmart.gov/'} ]
  },
  volcanoes: {
    title:'Volcanoes', icon:'🌋', color:'#ff5722',
    summary:'Volcanic eruptions release magma, ash, gases, and pyroclastic flows from the Earth\'s mantle. They can alter local and global climates and pose significant hazards.',
    facts:[ ['Active volcanoes','~1,500 worldwide'],['Eruptions/year','~50–60 globally'],['Pyroclastic speed','Up to 450 mph'],['Largest known','Mauna Loa, Hawaii'] ],
    safety:['Follow evacuation orders immediately.','Wear N95 mask to protect from ash.','Protect water supply from ash contamination.','Avoid river valleys downstream.'],
    links:[ {label:'USGS Volcanoes',url:'https://www.usgs.gov/natural-hazards/volcano-hazards'},{label:'Smithsonian GVP',url:'https://volcano.si.edu/'} ]
  },
  earthquakes: {
    title:'Earthquakes', icon:'🏔️', color:'#9c27b0',
    summary:'Earthquakes are caused by the sudden release of energy in Earth\'s crust due to tectonic plate movement, creating seismic waves felt as ground shaking.',
    facts:[ ['Measurable quakes/year','~500,000'],['Felt by humans','~100,000/year'],['Magnitude scale','Richter / Moment magnitude'],['Deadliest in history','1556 Shaanxi, China (~830K deaths)'] ],
    safety:['Drop, Cover, and Hold On during shaking.','Stay away from windows and heavy furniture.','Have a household reunification plan.','After: watch for aftershocks.'],
    links:[ {label:'USGS Earthquakes',url:'https://earthquake.usgs.gov/'},{label:'EMSC',url:'https://www.emsc-csem.org/'} ]
  },
  seaAndLakeIce: {
    title:'Sea & Lake Ice', icon:'🧊', color:'#80deea',
    summary:'Monitoring sea and lake ice coverage is critical for climate science. Changes in polar sea ice affect ocean currents, weather patterns, and arctic ecosystems.',
    facts:[ ['Arctic ice decline','~13% per decade since 1979'],['Antarctic summer','4–7M km² minimum'],['Thickness avg','2–3 meters (multi-year ice)'],['Albedo effect','Ice reflects 80–90% solar energy'] ],
    safety:['Never walk on ice unless thickness is confirmed safe.','Carry a rope and ice picks if crossing.','Always let someone know your route.'],
    links:[ {label:'NSIDC',url:'https://nsidc.org/'},{label:'NASA Cryosphere',url:'https://climate.nasa.gov/vital-signs/ice-sheets/'} ]
  },
  landslides: {
    title:'Landslides', icon:'⛰️', color:'#795548',
    summary:'Landslides occur when masses of rock, earth, or debris move down a slope. They are often triggered by heavy rain, earthquakes, or human activity on unstable slopes.',
    facts:[ ['Caused by','Rain, quakes, erosion, construction'],['Speed','Up to 200 mph (rockfalls)'],['US cost','~$3.5B/year in damages'],['Warning signs','Cracks in ground, leaning trees'] ],
    safety:['Avoid building on steep, unstable slopes.','Watch for land movement signals (cracking ground, tilting trees).','Have a vertical evacuation plan.','Avoid river channels after heavy rain.'],
    links:[ {label:'USGS Landslides',url:'https://www.usgs.gov/natural-hazards/landslide-hazards'} ]
  },
  drought: {
    title:'Drought', icon:'☀️', color:'#ff9800',
    summary:'Drought is a prolonged period of abnormally low rainfall leading to water shortage. It affects agriculture, drinking water supply, and can worsen wildfire conditions.',
    facts:[ ['US drought monitor','Updated weekly'],['Longest US drought','1276–1299 AD (tree ring data)'],['Economic impact','$6–8B per year in US'],['Key index','Palmer Drought Severity Index (PDSI)'] ],
    safety:['Conserve water: fix leaks, shorten showers.','Store emergency water supply.','Follow local water restriction orders.','Support drought-resistant landscaping.'],
    links:[ {label:'US Drought Monitor',url:'https://droughtmonitor.unl.edu/'},{label:'NDMC',url:'https://drought.unl.edu/'} ]
  },
  dustHaze: {
    title:'Dust & Haze', icon:'🌫️', color:'#d4ac78',
    summary:'Dust storms and haze events reduce visibility and degrade air quality significantly. Saharan dust can travel thousands of kilometers across oceans.',
    facts:[ ['Sahara to Amazon','2 billion tons of dust/year'],['Air quality index','AQI >300 is hazardous'],['Vision reduction','Near zero in severe sandstorms'],['Health risk','Respiratory diseases, eye irritation'] ],
    safety:['Stay indoors during dust events.','Wear N95 or higher-grade mask outdoors.','Keep windows and doors sealed.','Check AQI before outdoor activities.'],
    links:[ {label:'AirNow AQI',url:'https://www.airnow.gov/'},{label:'NASA MODIS',url:'https://worldview.earthdata.nasa.gov/'} ]
  },
};

/* ============================================================
   0b. FALLBACK DATA (shown when NASA EONET is unreachable)
   ============================================================ */
const FALLBACK_CATEGORIES = [
  { id:'wildfires',     title:'Wildfires' },
  { id:'severeStorms',  title:'Severe Storms' },
  { id:'floods',        title:'Floods' },
  { id:'volcanoes',     title:'Volcanoes' },
  { id:'earthquakes',   title:'Earthquakes' },
  { id:'seaAndLakeIce', title:'Sea & Lake Ice' },
  { id:'landslides',    title:'Landslides' },
  { id:'drought',       title:'Drought' },
  { id:'dustHaze',      title:'Dust & Haze' },
];

// Representative real-world events as static fallback
const FALLBACK_EVENTS = [
  { id:'EONET_6471', title:'Sawmill Fire, Arizona', description:'Active wildfire burning in Cochise County, Arizona.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6471', categories:[{id:'wildfires',title:'Wildfires'}], sources:[{id:'InciWeb',url:'https://inciweb.nwcg.gov/'}], geometry:[{date:'2024-06-15T00:00:00Z',type:'Point',coordinates:[-110.0,31.7],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6210', title:'Tropical Storm Alberto', description:'Category 1 tropical storm in the Gulf of Mexico.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6210', categories:[{id:'severeStorms',title:'Severe Storms'}], sources:[{id:'NHC',url:'https://www.nhc.noaa.gov/'}], geometry:[{date:'2024-06-20T00:00:00Z',type:'Point',coordinates:[-96.0,24.5],magnitudeValue:65,magnitudeUnit:'kts'}] },
  { id:'EONET_6350', title:'Mayon Volcano Eruption', description:'Ongoing eruption with lava flow on Luzon Island, Philippines.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6350', categories:[{id:'volcanoes',title:'Volcanoes'}], sources:[{id:'PHIVOLCS',url:'https://www.phivolcs.dost.gov.ph/'}], geometry:[{date:'2024-06-18T00:00:00Z',type:'Point',coordinates:[123.685,13.257],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6400', title:'Bangladesh Monsoon Floods', description:'Severe flooding affecting millions in Sylhet and Sunamganj districts.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6400', categories:[{id:'floods',title:'Floods'}], sources:[{id:'FloodList',url:'https://floodlist.com/'}], geometry:[{date:'2024-06-22T00:00:00Z',type:'Point',coordinates:[91.8,24.9],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6380', title:'Greece Wildfire Complex', description:'Multiple wildfires burning near Athens, driven by strong Meltemi winds.', closed:'2024-06-10T00:00:00Z', link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6380', categories:[{id:'wildfires',title:'Wildfires'}], sources:[{id:'EFFIS',url:'https://effis.jrc.ec.europa.eu/'}], geometry:[{date:'2024-06-08T00:00:00Z',type:'Point',coordinates:[23.7,37.9],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6450', title:'Arctic Sea Ice Minimum', description:'Sea ice extent in the Beaufort Sea below seasonal average by 18%.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6450', categories:[{id:'seaAndLakeIce',title:'Sea & Lake Ice'}], sources:[{id:'NSIDC',url:'https://nsidc.org/'}], geometry:[{date:'2024-06-12T00:00:00Z',type:'Point',coordinates:[-145.0,73.0],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6460', title:'California Landslide – Big Sur', description:'Large landslide closes Highway 1 near Big Sur after heavy rain.', closed:'2024-06-05T00:00:00Z', link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6460', categories:[{id:'landslides',title:'Landslides'}], sources:[{id:'USGS',url:'https://www.usgs.gov/'}], geometry:[{date:'2024-06-04T00:00:00Z',type:'Point',coordinates:[-121.8,36.1],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6420', title:'Saharan Dust Plume – Atlantic', description:'Dense dust plume from the Sahara crossing the Atlantic towards the Caribbean.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6420', categories:[{id:'dustHaze',title:'Dust & Haze'}], sources:[{id:'NASA MODIS',url:'https://worldview.earthdata.nasa.gov/'}], geometry:[{date:'2024-06-19T00:00:00Z',type:'Point',coordinates:[-30.0,16.0],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6430', title:'Horn of Africa Drought', description:'Severe drought conditions persist across Somalia, Ethiopia and Kenya.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6430', categories:[{id:'drought',title:'Drought'}], sources:[{id:'FEWS NET',url:'https://fews.net/'}], geometry:[{date:'2024-06-14T00:00:00Z',type:'Point',coordinates:[42.5,6.0],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6415', title:'Hawaii Kilauea Eruption', description:'Summit eruption at Kilauea with active lava lake. No immediate threat to communities.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6415', categories:[{id:'volcanoes',title:'Volcanoes'}], sources:[{id:'USGS HVO',url:'https://www.usgs.gov/observatories/hvo'}], geometry:[{date:'2024-06-21T00:00:00Z',type:'Point',coordinates:[-155.286,19.421],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6412', title:'Typhoon Gaemi – Western Pacific', description:'Super Typhoon Gaemi strengthening rapidly near the Philippines.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6412', categories:[{id:'severeStorms',title:'Severe Storms'}], sources:[{id:'JTWC',url:'https://www.metoc.navy.mil/jtwc/'}], geometry:[{date:'2024-06-23T00:00:00Z',type:'Point',coordinates:[128.5,18.2],magnitudeValue:95,magnitudeUnit:'kts'}] },
  { id:'EONET_6408', title:'Peru Amazon Flooding', description:'Ucayali River overflows impacting riverside communities in Ucayali Region.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6408', categories:[{id:'floods',title:'Floods'}], sources:[{id:'FloodList',url:'https://floodlist.com/'}], geometry:[{date:'2024-06-17T00:00:00Z',type:'Point',coordinates:[-74.5,-8.4],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6395', title:'Canada Boreal Wildfire Complex', description:'Widespread wildfires burning across Alberta and British Columbia.', closed:null, link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6395', categories:[{id:'wildfires',title:'Wildfires'}], sources:[{id:'CIFFC',url:'https://ciffc.ca/'}], geometry:[{date:'2024-06-20T00:00:00Z',type:'Point',coordinates:[-116.5,54.2],magnitudeValue:null,magnitudeUnit:null},{date:'2024-06-22T00:00:00Z',type:'Point',coordinates:[-116.8,54.4],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6388', title:'Tonga Submarine Volcano', description:'Renewed activity at Hunga Tonga-Hunga Ha\'apai volcanic complex.', closed:'2024-06-01T00:00:00Z', link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6388', categories:[{id:'volcanoes',title:'Volcanoes'}], sources:[{id:'Smithsonian GVP',url:'https://volcano.si.edu/'}], geometry:[{date:'2024-05-28T00:00:00Z',type:'Point',coordinates:[-175.382,-20.536],magnitudeValue:null,magnitudeUnit:null}] },
  { id:'EONET_6375', title:'India Heat Wave', description:'Extreme heat conditions across Rajasthan and Uttar Pradesh exceeding 47°C.', closed:'2024-06-12T00:00:00Z', link:'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6375', categories:[{id:'tempExtremes',title:'Temp. Extremes'}], sources:[{id:'IMD',url:'https://mausam.imd.gov.in/'}], geometry:[{date:'2024-06-05T00:00:00Z',type:'Point',coordinates:[76.0,27.0],magnitudeValue:47,magnitudeUnit:'°C'}] },
];

/* ============================================================
   1. STATE
   ============================================================ */
const State = {
  events:         [],
  categories:     [],
  filteredEvents: [],
  selectedEvent:  null,
  currentView:    'map',
  theme:          'dark',
  useClustering:  true,
  filters: {
    status:     'open',
    days:       7,
    dateStart:  '',
    dateEnd:    '',
    limit:      50,
    categories: new Set(),
    search:     '',
  },
  nearMe: { lat: null, lon: null, radius: 200 },
  cache:  {},
  charts: {},
  maps:   { main: null, nearme: null, drawer: null },
  layers: { markers: null, nearme: null },
};

/* ============================================================
   2. UTILITIES
   ============================================================ */
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function bboxFromLatLon(lat, lon, radiusKm) {
  const deg = radiusKm / 111;
  const lonDeg = deg / Math.cos(lat * Math.PI / 180);
  return [lon - lonDeg, lat + deg, lon + lonDeg, lat - deg].map(v => +v.toFixed(4));
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function formatDateShort(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function timeSince(str) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getCatMeta(categories) {
  if (!categories || !categories.length) return { icon:'🌐', color:'#8b949e', label:'Unknown' };
  const id = categories[0].id.replace(/ /g,'');
  return CATEGORY_META[id] || { icon:'🌐', color:'#8b949e', label: categories[0].title };
}

function getEventLatestDate(event) {
  if (!event.geometry || !event.geometry.length) return '';
  const dates = event.geometry.map(g => g.date).filter(Boolean).sort();
  return dates[dates.length - 1] || '';
}

function getEventCoords(event) {
  if (!event.geometry || !event.geometry.length) return null;
  const g = event.geometry[event.geometry.length - 1];
  if (!g || !g.coordinates) return null;
  if (g.type === 'Point') return { lat: g.coordinates[1], lon: g.coordinates[0] };
  if (g.type === 'Polygon') {
    const coords = g.coordinates[0];
    const lat = coords.reduce((s,c) => s + c[1], 0) / coords.length;
    const lon = coords.reduce((s,c) => s + c[0], 0) / coords.length;
    return { lat, lon };
  }
  return null;
}

/* ============================================================
   3. TOAST NOTIFICATIONS
   ============================================================ */
function toast(msg, type = 'info', duration = 3000) {
  const icons = { success:'✓', error:'✗', info:'ℹ', warn:'⚠' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration + 400);
}

/* ============================================================
   4. API CLIENT
   ============================================================ */
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiFetch(url, attempt = 1) {
  const cached = State.cache[url];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      // Retry on 5xx or 429
      if ((res.status >= 500 || res.status === 429) && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        UIModule.updateStatus(`<i class="fa fa-satellite-dish pulse"></i> NASA EONET busy (retry ${attempt}/${MAX_RETRIES})…`);
        await sleep(delay);
        return apiFetch(url, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    State.cache[url] = { data, ts: Date.now() };
    return data;
  } catch (e) {
    if (e.name === 'AbortError') {
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt);
        return apiFetch(url, attempt + 1);
      }
      throw new Error('Request timed out after retries');
    }
    if (attempt < MAX_RETRIES && e.message.includes('fetch')) {
      await sleep(RETRY_DELAY * attempt);
      return apiFetch(url, attempt + 1);
    }
    throw e;
  }
}

function buildEventsURL(params = {}) {
  const p = { ...State.filters, ...params };
  const url = new URL(`${EONET_BASE}/events`);
  if (p.status && p.status !== 'all') url.searchParams.set('status', p.status);
  if (p.days > 0) url.searchParams.set('days', p.days);
  if (p.days === 0 && p.dateStart) url.searchParams.set('start', p.dateStart);
  if (p.days === 0 && p.dateEnd) url.searchParams.set('end', p.dateEnd);
  if (p.limit) url.searchParams.set('limit', p.limit);
  if (p.categories && p.categories.size > 0) url.searchParams.set('category', [...p.categories].join(','));
  if (p.bbox) url.searchParams.set('bbox', p.bbox.join(','));
  return url.toString();
}

async function fetchEvents(extraParams) {
  const url = buildEventsURL(extraParams);
  const data = await apiFetch(url);
  return data.events || [];
}

async function fetchCategories() {
  const data = await apiFetch(`${EONET_BASE}/categories`);
  return data.categories || [];
}

async function fetchEventsGeoJSON(params) {
  const base = buildEventsURL(params).replace('/events?', '/events/geojson?');
  const url = base.replace(`${EONET_BASE}/events?`, `${EONET_BASE}/events/geojson?`);
  // construct proper geojson url
  const p = { ...State.filters, ...params };
  const gUrl = new URL(`${EONET_BASE}/events/geojson`);
  if (p.status && p.status !== 'all') gUrl.searchParams.set('status', p.status);
  if (p.days > 0) gUrl.searchParams.set('days', p.days);
  if (p.limit) gUrl.searchParams.set('limit', p.limit);
  if (p.categories && p.categories.size > 0) gUrl.searchParams.set('category', [...p.categories].join(','));
  return apiFetch(gUrl.toString());
}

/* ============================================================
   5. MAP MODULE
   ============================================================ */
const MapModule = {
  tileProviders: {
    osm:       { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr:'© OpenStreetMap contributors', opts:{} },
    satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr:'© Esri World Imagery', opts:{maxZoom:19} },
    topo:      { url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr:'© OpenTopoMap', opts:{maxZoom:17} },
    dark:      { url:'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', attr:'© Stadia Maps', opts:{} },
  },
  currentTile: null,

  init() {
    State.maps.main = L.map('map', { zoomControl: false, preferCanvas: true }).setView([20, 0], 2);
    L.control.zoom({ position: 'bottomright' }).addTo(State.maps.main);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(State.maps.main);
    this.setLayer('osm');
    State.layers.markers = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    State.maps.main.addLayer(State.layers.markers);
    // Near Me map
    State.maps.nearme = L.map('nearmeMap', { zoomControl: true }).setView([20, 0], 2);
    L.tileLayer(this.tileProviders.osm.url, { attribution: this.tileProviders.osm.attr }).addTo(State.maps.nearme);
    State.layers.nearme = L.layerGroup().addTo(State.maps.nearme);
  },

  setLayer(name) {
    const prov = this.tileProviders[name] || this.tileProviders.osm;
    if (this.currentTile) State.maps.main.removeLayer(this.currentTile);
    this.currentTile = L.tileLayer(prov.url, { attribution: prov.attr, ...prov.opts });
    this.currentTile.addTo(State.maps.main);
  },

  makeIcon(meta, isOpen) {
    const bg = meta.color;
    const emoji = meta.icon;
    return L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${bg};width:30px;height:30px;opacity:${isOpen?1:0.55}">${emoji}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -18],
    });
  },

  renderEvents(events) {
    State.layers.markers.clearLayers();
    const bounds = [];
    events.forEach(ev => {
      const coords = getEventCoords(ev);
      if (!coords) return;
      const meta = getCatMeta(ev.categories);
      const isOpen = !ev.closed;
      const icon = this.makeIcon(meta, isOpen);
      const latestDate = getEventLatestDate(ev);
      const mag = ev.geometry && ev.geometry[0] && ev.geometry[0].magnitudeValue
        ? `${ev.geometry[0].magnitudeValue} ${ev.geometry[0].magnitudeUnit || ''}` : '—';
      const marker = L.marker([coords.lat, coords.lon], { icon, title: ev.title });
      marker.bindPopup(`
        <div class="popup-title">${meta.icon} ${ev.title}</div>
        <span class="popup-badge" style="background:${meta.color}22;color:${meta.color}">${meta.label}</span>
        <div class="popup-meta">
          📅 ${formatDate(latestDate)}<br/>
          ${mag !== '—' ? `📊 Magnitude: ${mag}<br/>` : ''}
          🔴 ${isOpen ? '<span style="color:#3fb950">Open</span>' : '<span style="color:#f85149">Closed</span>'}
        </div>
        <div class="popup-btn" data-evid="${ev.id}">View Details →</div>
      `);
      marker.on('popupopen', () => {
        const btn = document.querySelector(`.popup-btn[data-evid="${ev.id}"]`);
        if (btn) btn.onclick = () => UIModule.openDrawer(ev);
      });
      State.layers.markers.addLayer(marker);
      bounds.push([coords.lat, coords.lon]);
    });
    return bounds;
  },

  fitAll(events) {
    const bounds = events.map(ev => getEventCoords(ev)).filter(Boolean).map(c => [c.lat, c.lon]);
    if (bounds.length) State.maps.main.fitBounds(L.latLngBounds(bounds).pad(0.1));
  },

  toggleClustering(on) {
    const markers = State.layers.markers;
    if (on) {
      State.maps.main.addLayer(markers);
    } else {
      State.maps.main.removeLayer(markers);
      markers.getLayers().forEach(l => State.maps.main.addLayer(l));
    }
  },

  buildLegend(events) {
    const seen = new Map();
    events.forEach(ev => {
      const meta = getCatMeta(ev.categories);
      if (!seen.has(meta.label)) seen.set(meta.label, meta);
    });
    const container = document.getElementById('legendItems');
    container.innerHTML = '';
    seen.forEach(meta => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-dot" style="background:${meta.color}"></span><span>${meta.icon} ${meta.label}</span>`;
      container.appendChild(item);
    });
  },

  initDrawerMap(event) {
    const coords = getEventCoords(event);
    if (!coords) return;
    const container = document.getElementById('drawerMapEl');
    if (!container) return;
    if (State.maps.drawer) { State.maps.drawer.remove(); State.maps.drawer = null; }
    State.maps.drawer = L.map(container).setView([coords.lat, coords.lon], 6);
    L.tileLayer(this.tileProviders.osm.url, { attribution: this.tileProviders.osm.attr }).addTo(State.maps.drawer);
    // Plot all geometry points
    if (event.geometry) {
      event.geometry.forEach((g, i) => {
        if (!g.coordinates) return;
        let lat, lon;
        if (g.type === 'Point') { lat = g.coordinates[1]; lon = g.coordinates[0]; }
        else if (g.type === 'Polygon') {
          const c = g.coordinates[0];
          lat = c.reduce((s,p)=>s+p[1],0)/c.length;
          lon = c.reduce((s,p)=>s+p[0],0)/c.length;
        }
        if (lat && lon) {
          const meta = getCatMeta(event.categories);
          L.circleMarker([lat, lon], {
            radius: i === event.geometry.length - 1 ? 10 : 6,
            color: meta.color, fillColor: meta.color, fillOpacity: 0.7, weight: 2
          }).addTo(State.maps.drawer).bindTooltip(formatDate(g.date));
        }
      });
    }
    setTimeout(() => State.maps.drawer.invalidateSize(), 200);
  }
};

/* ============================================================
   6. UI MODULE – Cards, Drawer, Views
   ============================================================ */
const UIModule = {
  renderCategories(categories, eventCounts) {
    const list = document.getElementById('categoryList');
    list.innerHTML = '';
    categories.forEach(cat => {
      const meta = CATEGORY_META[cat.id] || { icon:'🌐', color:'#8b949e' };
      const count = eventCounts[cat.id] || 0;
      const wrap = document.createElement('label');
      wrap.className = 'cat-toggle';
      wrap.innerHTML = `
        <input type="checkbox" value="${cat.id}" checked />
        <span class="cat-dot" style="background:${meta.color}"></span>
        <span>${meta.icon || ''} ${cat.title}</span>
        <span class="cat-count">${count}</span>
      `;
      list.appendChild(wrap);
    });
  },

  renderEventGrid(events) {
    const grid = document.getElementById('eventGrid');
    const empty = document.getElementById('listEmpty');
    if (!events.length) { grid.innerHTML = ''; empty.style.display = 'flex'; return; }
    empty.style.display = 'none';
    const sortVal = document.getElementById('sortSelect').value;
    const sorted = [...events].sort((a, b) => {
      const da = getEventLatestDate(a), db = getEventLatestDate(b);
      if (sortVal === 'date-desc') return new Date(db) - new Date(da);
      if (sortVal === 'date-asc')  return new Date(da) - new Date(db);
      if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
      if (sortVal === 'category')  return (a.categories[0]?.title||'').localeCompare(b.categories[0]?.title||'');
      return 0;
    });
    grid.innerHTML = sorted.map(ev => this.buildCardHTML(ev)).join('');
    grid.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        const ev = State.filteredEvents.find(e => e.id === card.dataset.id);
        if (ev) this.openDrawer(ev);
      });
    });
  },

  buildCardHTML(ev) {
    const meta = getCatMeta(ev.categories);
    const isOpen = !ev.closed;
    const latestDate = getEventLatestDate(ev);
    const coords = getEventCoords(ev);
    const mag = ev.geometry && ev.geometry[0] && ev.geometry[0].magnitudeValue
      ? `${ev.geometry[0].magnitudeValue} ${ev.geometry[0].magnitudeUnit || ''}` : null;
    return `
      <div class="event-card" data-id="${ev.id}" tabindex="0" role="button" aria-label="${ev.title}">
        <div class="card-header">
          <div class="card-icon" style="background:${meta.color}22">${meta.icon}</div>
          <div class="card-title">${ev.title}</div>
        </div>
        <div class="card-body">
          <div class="card-date">
            <i class="fa fa-calendar-day" aria-hidden="true"></i>
            ${formatDate(latestDate)} · ${timeSince(latestDate)}
          </div>
          ${ev.description ? `<div class="card-desc">${ev.description}</div>` : ''}
          ${coords ? `<div class="card-date" style="margin-top:4px"><i class="fa fa-location-dot" aria-hidden="true"></i> ${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}</div>` : ''}
        </div>
        <div class="card-footer">
          <span class="badge ${isOpen ? 'badge-open' : 'badge-closed'}">
            ${isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
          <span class="card-cat-badge" style="background:${meta.color}22;color:${meta.color}">${meta.label}</span>
          ${mag ? `<span class="card-mag">📊 ${mag}</span>` : ''}
        </div>
      </div>`;
  },

  openDrawer(event) {
    State.selectedEvent = event;
    const meta = getCatMeta(event.categories);
    const isOpen = !event.closed;
    const latestDate = getEventLatestDate(event);
    const coords = getEventCoords(event);
    const drawer = document.getElementById('detailDrawer');
    const body = document.getElementById('drawerBody');
    document.getElementById('drawerTitle').textContent = event.title;

    // Geometry timeline
    const geoItems = (event.geometry || []).slice(-10).reverse().map(g => {
      let coordStr = '';
      if (g.type === 'Point') coordStr = `${+g.coordinates[1].toFixed(3)}, ${+g.coordinates[0].toFixed(3)}`;
      const mag = g.magnitudeValue ? `<span style="color:var(--accent)">📊 ${g.magnitudeValue} ${g.magnitudeUnit||''}</span>` : '';
      return `<div class="geo-item"><span class="geo-dot"></span><span>${formatDate(g.date)}</span>${coordStr ? `<span class="text-muted" style="font-size:0.75rem">📍${coordStr}</span>` : ''}${mag}</div>`;
    }).join('');

    // Sources
    const srcItems = (event.sources || []).map(s =>
      `<div class="source-item"><i class="fa fa-external-link" aria-hidden="true"></i><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.id}</a></div>`
    ).join('') || '<span class="text-muted">No sources listed</span>';

    body.innerHTML = `
      <div class="drawer-map" id="drawerMapEl"></div>
      <div class="detail-title">${meta.icon} ${event.title}</div>
      <div class="detail-meta">
        <span class="badge ${isOpen?'badge-open':'badge-closed'}">${isOpen?'🟢 Open':'🔴 Closed'}</span>
        <span class="badge" style="background:${meta.color}22;color:${meta.color}">${meta.label}</span>
        ${event.closed ? `<span class="text-muted" style="font-size:0.78rem">Closed: ${formatDate(event.closed)}</span>` : ''}
      </div>
      ${event.description ? `<div class="detail-desc">${event.description}</div>` : ''}
      <div class="drawer-section">
        <h4>📅 Latest Update</h4>
        <p style="font-size:0.875rem">${formatDate(latestDate)} · ${timeSince(latestDate)}</p>
        ${coords ? `<p style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">📍 ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}</p>` : ''}
      </div>
      <div class="drawer-section">
        <h4>📊 Geometry Timeline (last 10 points)</h4>
        <div class="geo-timeline">${geoItems || '<span class="text-muted">No geometry data</span>'}</div>
      </div>
      <div class="drawer-section">
        <h4>🔗 Sources</h4>
        <div class="source-list">${srcItems}</div>
      </div>
      <div class="drawer-section">
        <h4>🏷️ Event ID</h4>
        <code style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted)">${event.id}</code>
      </div>
      ${event.link ? `<div class="drawer-section"><a href="${event.link}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="display:inline-flex"><i class="fa fa-rocket"></i> View on NASA EONET</a></div>` : ''}
    `;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.getElementById('drawerBackdrop').classList.add('show');
    setTimeout(() => MapModule.initDrawerMap(event), 100);
  },

  closeDrawer() {
    const drawer = document.getElementById('detailDrawer');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.getElementById('drawerBackdrop').classList.remove('show');
  },

  updateStatus(text, count, time) {
    document.getElementById('statusText').innerHTML = text;
    if (count !== undefined) document.getElementById('eventCount').textContent = count ? `${count} events` : '';
    if (time) document.getElementById('lastUpdated').textContent = `Updated: ${time}`;
  },

  showLoading(parentId) {
    const p = document.getElementById(parentId);
    if (!p) return;
    const ov = document.createElement('div');
    ov.className = 'loading-overlay'; ov.id = 'loadingOverlay';
    ov.innerHTML = '<div class="spinner"></div><div class="loading-text">Fetching from NASA EONET…</div>';
    p.style.position = 'relative'; p.appendChild(ov);
  },

  hideLoading() {
    const ov = document.getElementById('loadingOverlay');
    if (ov) ov.remove();
  },

  showError(parentId, msg, retryFn) {
    const p = document.getElementById(parentId);
    if (!p) return;
    p.innerHTML = `<div class="error-banner"><i class="fa fa-triangle-exclamation"></i><span>${msg}</span><button class="retry-btn" id="retryBtn">Retry</button></div>`;
    if (retryFn) document.getElementById('retryBtn').onclick = retryFn;
  }
};

/* ============================================================
   7. FILTER MODULE
   ============================================================ */
const FilterModule = {
  getCheckedCategories() {
    const checks = document.querySelectorAll('#categoryList input[type=checkbox]');
    const checked = new Set();
    checks.forEach(c => { if (c.checked) checked.add(c.value); });
    return checked;
  },

  readFilters() {
    State.filters.status   = document.querySelector('input[name=status]:checked')?.value || 'open';
    State.filters.limit    = parseInt(document.getElementById('limitSelect').value) || 50;
    State.filters.search   = document.getElementById('searchInput').value.trim().toLowerCase();
    State.filters.categories = this.getCheckedCategories();
    const activeChip = document.querySelector('.chip.active');
    const days = activeChip ? parseInt(activeChip.dataset.days) : 7;
    State.filters.days = days;
    if (days === 0) {
      State.filters.dateStart = document.getElementById('dateStart').value;
      State.filters.dateEnd   = document.getElementById('dateEnd').value;
    }
  },

  applySearch(events) {
    const q = State.filters.search;
    if (!q) return events;
    return events.filter(ev =>
      ev.title.toLowerCase().includes(q) ||
      (ev.description || '').toLowerCase().includes(q) ||
      (ev.categories || []).some(c => c.title.toLowerCase().includes(q))
    );
  },

  applyAll(events) {
    let filtered = [...events];
    // category filter (if specific categories are set and list not empty)
    if (State.filters.categories.size > 0) {
      filtered = filtered.filter(ev =>
        ev.categories && ev.categories.some(c => State.filters.categories.has(c.id))
      );
    }
    filtered = this.applySearch(filtered);
    return filtered;
  }
};

/* ============================================================
   8. CHARTS MODULE
   ============================================================ */
const ChartsModule = {
  COLORS: ['#ff6b35','#4fc3f7','#2196f3','#ff5722','#9c27b0','#80deea','#795548','#ff9800','#d4ac78','#4caf50','#00bcd4','#e91e63','#8bc34a'],

  destroy(key) {
    if (State.charts[key]) { State.charts[key].destroy(); delete State.charts[key]; }
  },

  dailyChart(events) {
    this.destroy('daily');
    // Group by date
    const counts = {};
    events.forEach(ev => {
      const d = getEventLatestDate(ev);
      if (!d) return;
      const day = d.slice(0, 10);
      counts[day] = (counts[day] || 0) + 1;
    });
    const labels = Object.keys(counts).sort();
    const data = labels.map(l => counts[l]);
    const ctx = document.getElementById('chartDaily');
    if (!ctx) return;
    State.charts['daily'] = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels.map(formatDateShort), datasets: [{ label: 'Events', data, backgroundColor: '#58a6ff88', borderColor: '#58a6ff', borderWidth: 1, borderRadius: 4 }] },
      options: { responsive:true, maintainAspectRatio:true, plugins:{ legend:{display:false} }, scales:{ x:{ticks:{color:'#8b949e',font:{size:11}}}, y:{ticks:{color:'#8b949e',font:{size:11}},grid:{color:'#30363d'}} } }
    });
  },

  categoryChart(events) {
    this.destroy('category');
    const counts = {};
    events.forEach(ev => {
      const meta = getCatMeta(ev.categories);
      counts[meta.label] = (counts[meta.label] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data   = labels.map(l => counts[l]);
    const colors = labels.map((l, i) => {
      const meta = Object.values(CATEGORY_META).find(m => m.label === l);
      return meta ? meta.color : this.COLORS[i % this.COLORS.length];
    });
    const ctx = document.getElementById('chartCategory');
    if (!ctx) return;
    State.charts['category'] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors.map(c => c+'cc'), borderColor: colors, borderWidth: 2 }] },
      options: { responsive:true, maintainAspectRatio:true, plugins:{ legend:{ position:'right', labels:{ color:'#8b949e', font:{size:11} } } } }
    });
  },

  statsCatChart(events) {
    this.destroy('statsCat');
    const counts = {};
    events.forEach(ev => { const m = getCatMeta(ev.categories); counts[m.label] = (counts[m.label]||0)+1; });
    const labels = Object.keys(counts).sort((a,b) => counts[b]-counts[a]);
    const data   = labels.map(l => counts[l]);
    const colors = labels.map(l => { const meta = Object.values(CATEGORY_META).find(m=>m.label===l); return meta?meta.color:'#8b949e'; });
    const ctx = document.getElementById('chartStatsCat'); if (!ctx) return;
    State.charts['statsCat'] = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[{ label:'Count', data, backgroundColor:colors.map(c=>c+'88'), borderColor:colors, borderWidth:1, borderRadius:4 }] },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}}, scales:{ x:{ticks:{color:'#8b949e',font:{size:10}}}, y:{ticks:{color:'#8b949e',font:{size:10}}}, grid:{color:'#30363d'} } }
    });
  },

  statsStatusChart(events) {
    this.destroy('statsStatus');
    const open   = events.filter(e => !e.closed).length;
    const closed = events.filter(e =>  e.closed).length;
    const ctx = document.getElementById('chartStatsStatus'); if (!ctx) return;
    State.charts['statsStatus'] = new Chart(ctx, {
      type:'pie',
      data:{ labels:['Open','Closed'], datasets:[{ data:[open,closed], backgroundColor:['#3fb95066','#f8514966'], borderColor:['#3fb950','#f85149'], borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:true, plugins:{ legend:{ labels:{ color:'#8b949e' } } } }
    });
  },

  statsTrendChart(events) {
    this.destroy('statsTrend');
    const counts = {};
    events.forEach(ev => { const d = getEventLatestDate(ev); if (!d) return; const day = d.slice(0,10); counts[day]=(counts[day]||0)+1; });
    const labels = Object.keys(counts).sort();
    const data   = labels.map(l => counts[l]);
    const ctx = document.getElementById('chartStatsTrend'); if (!ctx) return;
    State.charts['statsTrend'] = new Chart(ctx, {
      type:'line',
      data:{ labels:labels.map(formatDateShort), datasets:[{ label:'Events per day', data, fill:true, backgroundColor:'#58a6ff22', borderColor:'#58a6ff', tension:0.4, pointRadius:3, pointBackgroundColor:'#58a6ff' }] },
      options:{ responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}}, scales:{ x:{ticks:{color:'#8b949e',font:{size:11}}}, y:{ticks:{color:'#8b949e',font:{size:11}},grid:{color:'#30363d'}} } }
    });
  },

  heatmapChart(events) {
    this.destroy('heatmap');
    // Simple bar chart of events per weekday as stand-in heatmap
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const counts = Array(7).fill(0);
    events.forEach(ev => { const d = new Date(getEventLatestDate(ev)); if (!isNaN(d)) counts[d.getDay()]++; });
    const ctx = document.getElementById('chartHeatmap'); if (!ctx) return;
    State.charts['heatmap'] = new Chart(ctx, {
      type:'bar',
      data:{ labels:days, datasets:[{ label:'Events by weekday', data:counts, backgroundColor:'#9c27b055', borderColor:'#9c27b0', borderWidth:1, borderRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}}, scales:{ x:{ticks:{color:'#8b949e'}}, y:{ticks:{color:'#8b949e'},grid:{color:'#30363d'}} } }
    });
  }
};

/* ============================================================
   9. TIMELINE VIEW
   ============================================================ */
function renderTimeline(events) {
  ChartsModule.dailyChart(events);
  ChartsModule.categoryChart(events);
  ChartsModule.heatmapChart(events);
  // Timeline list
  const list = document.getElementById('timelineList');
  const sorted = [...events].sort((a,b) => new Date(getEventLatestDate(b)) - new Date(getEventLatestDate(a)));
  list.innerHTML = sorted.slice(0, 80).map(ev => {
    const meta = getCatMeta(ev.categories);
    const d = getEventLatestDate(ev);
    return `
      <div class="timeline-item" data-id="${ev.id}">
        <span style="font-size:1.2rem">${meta.icon}</span>
        <span class="timeline-date">${formatDate(d)}</span>
        <span style="flex:1;font-size:0.85rem;font-weight:500">${ev.title}</span>
        <span class="badge" style="background:${meta.color}22;color:${meta.color};font-size:0.72rem">${meta.label}</span>
        <span class="badge ${ev.closed?'badge-closed':'badge-open'}" style="font-size:0.72rem">${ev.closed?'Closed':'Open'}</span>
      </div>`;
  }).join('');
  list.querySelectorAll('.timeline-item').forEach(el => {
    el.addEventListener('click', () => {
      const ev = State.filteredEvents.find(e => e.id === el.dataset.id);
      if (ev) UIModule.openDrawer(ev);
    });
  });
}

/* ============================================================
   10. STATS VIEW
   ============================================================ */
function renderStats(events) {
  // KPIs
  const open = events.filter(e => !e.closed).length;
  const catSet = new Set(events.flatMap(e => e.categories.map(c=>c.id)));
  const countries = new Set(events.map(e => getEventCoords(e)).filter(Boolean).map(c => `${Math.round(c.lat/10)*10},${Math.round(c.lon/10)*10}`));
  const kpi = document.getElementById('statsKpi');
  kpi.innerHTML = `
    <div class="kpi-card"><div class="kpi-value">${events.length}</div><div class="kpi-label">Total Events</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:var(--success)">${open}</div><div class="kpi-label">Active Now</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:var(--danger)">${events.length - open}</div><div class="kpi-label">Closed</div></div>
    <div class="kpi-card"><div class="kpi-value">${catSet.size}</div><div class="kpi-label">Categories</div></div>
    <div class="kpi-card"><div class="kpi-value">${countries.size}</div><div class="kpi-label">Regions</div></div>
  `;
  ChartsModule.statsCatChart(events);
  ChartsModule.statsStatusChart(events);
  ChartsModule.statsTrendChart(events);
  // Top 10 table
  const sorted = [...events].sort((a,b) => new Date(getEventLatestDate(b)) - new Date(getEventLatestDate(a)));
  const tableEl = document.getElementById('topEventsTable');
  tableEl.innerHTML = `
    <div class="top-events-header">🏆 Top 10 Recent Events</div>
    <table>
      <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Date</th><th>Status</th></tr></thead>
      <tbody>
        ${sorted.slice(0,10).map((ev,i) => {
          const meta = getCatMeta(ev.categories);
          return `<tr>
            <td>${i+1}</td>
            <td style="cursor:pointer;color:var(--accent)" class="top-ev-link" data-id="${ev.id}">${ev.title}</td>
            <td><span style="color:${meta.color}">${meta.icon} ${meta.label}</span></td>
            <td>${formatDate(getEventLatestDate(ev))}</td>
            <td><span class="badge ${ev.closed?'badge-closed':'badge-open'}" style="font-size:0.72rem">${ev.closed?'Closed':'Open'}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  tableEl.querySelectorAll('.top-ev-link').forEach(el => {
    el.addEventListener('click', () => {
      const ev = State.filteredEvents.find(e => e.id === el.dataset.id);
      if (ev) UIModule.openDrawer(ev);
    });
  });
}

/* ============================================================
   11. NEAR ME MODULE
   ============================================================ */
const NearMeModule = {
  async searchByCity(query) {
    const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(query)}&limit=1`;
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (!data.length) throw new Error('Location not found');
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name };
    } catch(e) { toast('Location not found. Try "lat,lon" format.', 'error'); return null; }
  },

  parseManualInput(val) {
    const parts = val.split(',').map(v => parseFloat(v.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return { lat: parts[0], lon: parts[1], name: `${parts[0]}, ${parts[1]}` };
    return null;
  },

  async load(lat, lon, name) {
    State.nearMe.lat = lat; State.nearMe.lon = lon;
    const radius = parseInt(document.getElementById('radiusSelect').value) || 200;
    State.nearMe.radius = radius;
    const status = document.getElementById('nearmeStatus');
    status.innerHTML = `<i class="fa fa-spinner pulse"></i> Searching events within ${radius} km of <b>${name||'your location'}</b>…`;
    const bbox = bboxFromLatLon(lat, lon, radius);
    try {
      const events = await fetchEvents({ bbox, days: State.filters.days, status: State.filters.status, limit: 100 });
      const withDist = events.map(ev => {
        const coords = getEventCoords(ev);
        if (!coords) return { ...ev, _dist: Infinity };
        const dist = haversineKm(lat, lon, coords.lat, coords.lon);
        return { ...ev, _dist: Math.round(dist) };
      }).filter(e => e._dist <= radius).sort((a,b) => a._dist - b._dist);
      status.innerHTML = `📍 <b>${withDist.length}</b> events found within ${radius} km of <b>${name||'your location'}</b>`;
      this.renderNearMeMap(lat, lon, withDist, radius);
      this.renderNearMeList(withDist);
    } catch(e) {
      status.innerHTML = `<span style="color:var(--danger)">⚠ ${e.message}</span>`;
    }
  },

  renderNearMeMap(lat, lon, events, radius) {
    State.layers.nearme.clearLayers();
    State.maps.nearme.setView([lat, lon], 6);
    // User marker
    L.circleMarker([lat, lon], { radius: 12, color:'#58a6ff', fillColor:'#58a6ff', fillOpacity:0.6, weight:3 })
      .addTo(State.layers.nearme).bindTooltip('📍 Your Location').openTooltip();
    // Radius circle
    L.circle([lat, lon], { radius: radius * 1000, color:'#58a6ff44', fillColor:'#58a6ff11', weight:1, dashArray:'5 5' }).addTo(State.layers.nearme);
    events.forEach(ev => {
      const coords = getEventCoords(ev);
      if (!coords) return;
      const meta = getCatMeta(ev.categories);
      L.circleMarker([coords.lat, coords.lon], { radius:8, color:meta.color, fillColor:meta.color, fillOpacity:0.7, weight:2 })
        .addTo(State.layers.nearme)
        .bindPopup(`<b>${meta.icon} ${ev.title}</b><br/>${ev._dist} km away`)
        .on('click', () => UIModule.openDrawer(ev));
    });
  },

  renderNearMeList(events) {
    const list = document.getElementById('nearmeList');
    if (!events.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa fa-search-location fa-2x"></i><p>No events found in this radius.</p></div>';
      return;
    }
    list.innerHTML = events.map(ev => {
      const meta = getCatMeta(ev.categories);
      const d = getEventLatestDate(ev);
      const safetyNote = ev._dist < 50 ? '⚠ Very close! Check local authority alerts immediately.'
        : ev._dist < 150 ? '⚡ Nearby event. Monitor local emergency services.'
        : 'ℹ Monitor this event. Stay informed via local news.';
      return `
        <div class="nearme-card" data-id="${ev.id}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:1.2rem">${meta.icon}</span>
            <span style="font-weight:600;font-size:0.9rem;flex:1">${ev.title}</span>
            <span class="distance">${ev._dist} km</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted)">
            <span style="color:${meta.color}">${meta.label}</span> · ${formatDate(d)}
          </div>
          <div class="safety-note">${safetyNote}</div>
        </div>`;
    }).join('');
    list.querySelectorAll('.nearme-card').forEach(el => {
      el.addEventListener('click', () => {
        const ev = events.find(e => e.id === el.dataset.id);
        if (ev) UIModule.openDrawer(ev);
      });
    });
  }
};

/* ============================================================
   12. LEARN VIEW
   ============================================================ */
function renderLearn(events) {
  const grid = document.getElementById('learnGrid');
  const catCounts = {};
  events.forEach(ev => ev.categories.forEach(c => { catCounts[c.id] = (catCounts[c.id]||0)+1; }));

  const allCats = Object.keys(LEARN_DATA);
  grid.innerHTML = allCats.map(catId => {
    const data = LEARN_DATA[catId];
    const count = catCounts[catId] || 0;
    return `
      <div class="learn-card" data-cat="${catId}" tabindex="0" role="button" aria-label="Learn about ${data.title}">
        <div class="learn-icon">${data.icon}</div>
        <h3>${data.title}</h3>
        <p>${data.summary.slice(0,100)}…</p>
        <span class="learn-count">${count} current events</span>
      </div>`;
  }).join('');

  grid.querySelectorAll('.learn-card').forEach(el => {
    el.addEventListener('click', () => openLearnModal(el.dataset.cat, events));
    el.addEventListener('keypress', e => { if (e.key==='Enter') openLearnModal(el.dataset.cat, events); });
  });
}

function openLearnModal(catId, events) {
  const data = LEARN_DATA[catId];
  if (!data) return;
  const relEvents = events.filter(ev => ev.categories.some(c => c.id === catId)).slice(0, 3);
  const content = document.getElementById('learnModalContent');
  content.innerHTML = `
    <div class="learn-modal-hero">
      <div class="learn-modal-icon">${data.icon}</div>
      <div>
        <h2 id="learnModalTitle">${data.title}</h2>
        <p>${data.summary}</p>
      </div>
    </div>
    <div class="learn-facts">
      ${data.facts.map(f => `<div class="learn-fact"><div class="fact-label">${f[0]}</div><div class="fact-value">${f[1]}</div></div>`).join('')}
    </div>
    <div class="learn-safety">
      <h4>🛡️ Safety Tips</h4>
      <ul>${data.safety.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    ${relEvents.length ? `
    <div class="learn-examples">
      <h4>🌍 Live Examples from NASA EONET</h4>
      ${relEvents.map(ev => {
        const d = getEventLatestDate(ev);
        const coords = getEventCoords(ev);
        return `<div class="learn-example-item" data-id="${ev.id}">
          <b>${ev.title}</b>
          <br/><span style="font-size:0.78rem;color:var(--text-muted)">${formatDate(d)} ${coords ? ` · 📍 ${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}` : ''}</span>
        </div>`;
      }).join('')}
    </div>` : ''}
    <div class="learn-links">
      ${data.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer"><i class="fa fa-external-link"></i> ${l.label}</a>`).join('')}
    </div>`;

  // Bind example clicks
  content.querySelectorAll('.learn-example-item').forEach(el => {
    el.addEventListener('click', () => {
      const ev = events.find(e => e.id === el.dataset.id);
      if (ev) { closeLearnModal(); UIModule.openDrawer(ev); }
    });
  });

  document.getElementById('learnModal').style.display = 'flex';
}

function closeLearnModal() {
  document.getElementById('learnModal').style.display = 'none';
}

/* ============================================================
   13. SNAPSHOT / SHARE MODULE
   ============================================================ */
function openSnapshot() {
  const events = State.filteredEvents;
  const top3 = [...events].sort((a,b) => new Date(getEventLatestDate(b)) - new Date(getEventLatestDate(a))).slice(0,3);
  const catLabel = State.filters.categories.size > 0 ? [...State.filters.categories].join(', ') : 'All Categories';
  const daysLabel = State.filters.days > 0 ? `Last ${State.filters.days} days` : 'Custom range';
  const now = new Date().toLocaleString();

  const params = new URLSearchParams({
    status: State.filters.status,
    days: State.filters.days,
    limit: State.filters.limit,
  });
  if (State.filters.categories.size) params.set('category', [...State.filters.categories].join(','));
  const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

  const content = document.getElementById('snapshotContent');
  content.innerHTML = `
    <div class="snap-title">🌍 GeoAlert Snapshot</div>
    <div class="snap-meta">Generated: ${now} · ${catLabel} · ${daysLabel} · Status: ${State.filters.status}</div>
    <div style="font-size:1.5rem;font-weight:700;color:var(--accent);margin-bottom:12px">${events.length} events</div>
    <div class="snap-events">
      ${top3.map(ev => {
        const meta = getCatMeta(ev.categories);
        return `<div class="snap-event-item">${meta.icon} <b>${ev.title}</b> <span style="color:var(--text-muted);font-size:0.78rem;margin-left:auto">${formatDate(getEventLatestDate(ev))}</span></div>`;
      }).join('')}
    </div>
    ${events.length > 3 ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">…and ${events.length-3} more events</div>` : ''}
    <div style="margin-top:12px;font-size:0.78rem;color:var(--text-muted)">🔗 ${shareUrl}</div>
    <div style="margin-top:8px;font-size:0.72rem;color:var(--text-muted)">Data: NASA EONET v3 · eonet.gsfc.nasa.gov</div>
  `;
  document.getElementById('btnCopyLink').onclick = () => {
    navigator.clipboard.writeText(shareUrl).then(() => toast('Link copied!', 'success')).catch(() => toast('Copy failed', 'error'));
  };
  document.getElementById('btnCopyText').onclick = () => {
    const txt = `GeoAlert Snapshot – ${now}\n${events.length} Natural Events (${catLabel}, ${daysLabel})\n\n${top3.map(ev => `• ${ev.title} – ${formatDate(getEventLatestDate(ev))}`).join('\n')}\n\nData: NASA EONET · ${shareUrl}`;
    navigator.clipboard.writeText(txt).then(() => toast('Text copied!', 'success')).catch(() => toast('Copy failed', 'error'));
  };
  document.getElementById('snapshotModal').style.display = 'flex';
}

/* ============================================================
   14. MAIN DATA LOAD + VIEW RENDER
   ============================================================ */
async function loadData() {
  FilterModule.readFilters();
  UIModule.updateStatus('<i class="fa fa-satellite-dish pulse"></i> Fetching from NASA EONET…');

  // Try to fetch categories (use fallback if API is down)
  if (!State.categories.length) {
    try {
      State.categories = await fetchCategories();
    } catch {
      State.categories = FALLBACK_CATEGORIES;
    }
  }

  // Try to fetch events with full retry logic
  let usedFallback = false;
  try {
    const events = await fetchEvents();
    State.events = events;
  } catch (e) {
    console.warn('NASA EONET unreachable, using fallback data:', e.message);
    usedFallback = true;
    State.events = FALLBACK_EVENTS;
  }

  State.filteredEvents = FilterModule.applyAll(State.events);

  // Build category counts for sidebar
  const catCounts = {};
  State.filteredEvents.forEach(ev => ev.categories.forEach(c => { catCounts[c.id] = (catCounts[c.id]||0)+1; }));
  UIModule.renderCategories(State.categories, catCounts);

  const now = new Date().toLocaleTimeString();

  if (usedFallback) {
    UIModule.updateStatus(
      `<i class="fa fa-triangle-exclamation" style="color:var(--warning)"></i> NASA EONET unavailable – showing sample data`,
      State.filteredEvents.length,
      now
    );
    // Show a dismissible banner on the map
    showOfflineBanner();
    toast('NASA EONET is temporarily unavailable. Showing sample events.', 'warn', 6000);
  } else {
    hideOfflineBanner();
    UIModule.updateStatus(
      `<i class="fa fa-circle-check" style="color:var(--success)"></i> NASA EONET connected`,
      State.filteredEvents.length,
      now
    );
    toast(`Loaded ${State.filteredEvents.length} events`, 'success');
  }

  renderCurrentView();
}

function showOfflineBanner() {
  let banner = document.getElementById('offlineBanner');
  if (banner) return;
  banner = document.createElement('div');
  banner.id = 'offlineBanner';
  banner.style.cssText = `
    position:fixed; top:calc(var(--topbar-h) + var(--statusbar-h)); left:0; right:0; z-index:998;
    background:#3d2e1a; border-bottom:1px solid #d29922; color:#e3b341;
    padding:8px 16px; font-size:0.82rem;
    display:flex; align-items:center; gap:10px;
  `;
  banner.innerHTML = `
    <i class="fa fa-satellite-dish"></i>
    <span><b>NASA EONET is temporarily unavailable</b> — displaying representative sample events. 
    Live data will reload automatically once the API recovers.</span>
    <button onclick="document.getElementById('offlineBanner').remove(); State.cache={}; loadData();"
      style="margin-left:auto; background:#d29922; color:#000; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.78rem; font-weight:600;">
      🔄 Retry Now
    </button>
    <button onclick="this.parentElement.remove()"
      style="background:none; border:none; color:#e3b341; cursor:pointer; font-size:1rem; padding:2px 6px;">✕</button>
  `;
  document.body.appendChild(banner);
  // push shell down so content isn't hidden
  document.querySelector('.app-shell').style.marginTop =
    `calc(var(--topbar-h) + var(--statusbar-h) + 42px)`;
  document.querySelector('.app-shell').style.height =
    `calc(100vh - var(--topbar-h) - var(--statusbar-h) - 42px)`;
}

function hideOfflineBanner() {
  const banner = document.getElementById('offlineBanner');
  if (banner) banner.remove();
  document.querySelector('.app-shell').style.marginTop = '';
  document.querySelector('.app-shell').style.height = '';
}

function renderCurrentView() {
  const view = State.currentView;
  if (view === 'map') {
    MapModule.renderEvents(State.filteredEvents);
    MapModule.buildLegend(State.filteredEvents);
  } else if (view === 'list') {
    UIModule.renderEventGrid(State.filteredEvents);
  } else if (view === 'timeline') {
    renderTimeline(State.filteredEvents);
  } else if (view === 'stats') {
    renderStats(State.filteredEvents);
  } else if (view === 'learn') {
    renderLearn(State.filteredEvents);
  } else if (view === 'dashboard') {
    DashboardModule.render();
  }
}

/* ============================================================
   15. VIEW NAVIGATION
   ============================================================ */
function switchView(name) {
  State.currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(`view-${name}`);
  if (view) view.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
  if (btn) btn.classList.add('active');

  if (name === 'map' && State.maps.main) {
    setTimeout(() => State.maps.main.invalidateSize(), 100);
  }
  if (name === 'nearme' && State.maps.nearme) {
    setTimeout(() => State.maps.nearme.invalidateSize(), 100);
  }
  // New modules
  if (name === 'dashboard')    { DashboardModule.render(); return; }
  if (name === 'weather')      { WeatherModule.init(); return; }
  if (name === 'climate')      {
    ClimateModule.init();
    // Bind welcome buttons
    document.querySelectorAll('.clim-city-btn').forEach(b => {
      b.onclick = () => ClimateModule.render(b.dataset.city);
    });
    document.getElementById('climSearchBtn')?.addEventListener('click', () => {
      const v = document.getElementById('climInput')?.value.trim();
      if (v) ClimateModule.render(v);
    });
    document.getElementById('climInput')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') document.getElementById('climSearchBtn')?.click();
    });
    return;
  }
  if (name === 'geography')    { GeographyModule.initView(); return; }
  if (name === 'spaceweather') {
    SpaceWeatherModule.render();
    document.getElementById('btnRefreshSpace')?.addEventListener('click', () => SpaceWeatherModule.render());
    return;
  }

  if (State.filteredEvents.length) renderCurrentView();
}

/* ============================================================
   16. URL PARAMS – Restore filters from shareable URL
   ============================================================ */
function applyURLParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.has('status')) {
    const r = document.querySelector(`input[name=status][value="${p.get('status')}"]`);
    if (r) r.checked = true;
  }
  if (p.has('days')) {
    const days = parseInt(p.get('days'));
    document.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.days) === days);
    });
  }
  if (p.has('limit')) {
    const sel = document.getElementById('limitSelect');
    if (sel) sel.value = p.get('limit');
  }
}

/* ============================================================
   17. EVENT LISTENERS SETUP
   ============================================================ */
function bindEvents() {
  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Apply filters
  document.getElementById('btnApply').addEventListener('click', () => {
    State.cache = {}; // clear cache on manual apply
    loadData();
  });

  // Clear filters
  document.getElementById('btnClearFilters').addEventListener('click', () => {
    document.querySelectorAll('#categoryList input').forEach(i => i.checked = true);
    document.querySelector('input[name=status][value=open]').checked = true;
    document.querySelector('.chip[data-days="7"]').click();
    document.getElementById('searchInput').value = '';
    document.getElementById('limitSelect').value = '50';
    State.cache = {};
    loadData();
  });

  // Search debounced
  document.getElementById('searchInput').addEventListener('input', debounce(() => {
    FilterModule.readFilters();
    State.filteredEvents = FilterModule.applyAll(State.events);
    UIModule.updateStatus(
      `<i class="fa fa-circle-check" style="color:var(--success)"></i> NASA EONET connected`,
      State.filteredEvents.length
    );
    renderCurrentView();
  }, 350));

  // Time chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const days = parseInt(chip.dataset.days);
      document.getElementById('customDateRange').style.display = days === 0 ? 'flex' : 'none';
    });
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change', () => {
    UIModule.renderEventGrid(State.filteredEvents);
  });

  // Map controls
  document.getElementById('btnFitAll').addEventListener('click', () => MapModule.fitAll(State.filteredEvents));
  document.getElementById('btnCluster').addEventListener('click', function() {
    State.useClustering = !State.useClustering;
    this.classList.toggle('active', State.useClustering);
    MapModule.toggleClustering(State.useClustering);
  });
  document.getElementById('btnHeatmap').addEventListener('click', function() {
    this.classList.toggle('active');
    toast('Heatmap mode: coming in v2!', 'info');
  });

  // Map layer radio
  document.querySelectorAll('input[name=mapLayer]').forEach(r => {
    r.addEventListener('change', () => MapModule.setLayer(r.value));
  });

  // Drawer close
  document.getElementById('drawerClose').addEventListener('click', UIModule.closeDrawer);
  document.getElementById('drawerBackdrop').addEventListener('click', UIModule.closeDrawer);

  // Refresh
  document.getElementById('btnRefresh').addEventListener('click', () => {
    State.cache = {};
    loadData();
    toast('Refreshing data…', 'info');
  });

  // Theme toggle
  document.getElementById('btnTheme').addEventListener('click', () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', State.theme === 'light' ? 'light' : '');
    toast(`Switched to ${State.theme} mode`, 'info');
  });

  // Snapshot
  document.getElementById('btnSnapshot').addEventListener('click', openSnapshot);
  document.getElementById('snapshotClose').addEventListener('click', () => {
    document.getElementById('snapshotModal').style.display = 'none';
  });
  document.getElementById('snapshotBackdrop').addEventListener('click', () => {
    document.getElementById('snapshotModal').style.display = 'none';
  });

  // Learn modal close
  document.getElementById('learnModalClose').addEventListener('click', closeLearnModal);
  document.querySelector('#learnModal .modal-backdrop').addEventListener('click', closeLearnModal);

  // Near Me
  document.getElementById('btnGeolocate').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Geolocation not supported.', 'error'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      NearMeModule.load(pos.coords.latitude, pos.coords.longitude, 'Your Location');
    }, () => toast('Location access denied.', 'error'));
  });

  document.getElementById('btnManualSearch').addEventListener('click', async () => {
    const val = document.getElementById('manualCity').value.trim();
    if (!val) return;
    const coords = NearMeModule.parseManualInput(val);
    if (coords) {
      NearMeModule.load(coords.lat, coords.lon, coords.name);
    } else {
      const loc = await NearMeModule.searchByCity(val);
      if (loc) NearMeModule.load(loc.lat, loc.lon, loc.name);
    }
  });

  document.getElementById('manualCity').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('btnManualSearch').click();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      UIModule.closeDrawer();
      closeLearnModal();
      document.getElementById('snapshotModal').style.display = 'none';
      document.getElementById('helpPanel').style.display = 'none';
      TourModule.end();
    }
  });
}

/* ============================================================
   19. USER GUIDE – Welcome, Tour, Help Panel
   ============================================================ */

/* ---------- Tour step definitions ---------- */
const TOUR_STEPS = [
  {
    icon: '🌍', title: 'Welcome to GeoAlert!',
    body: 'This quick tour walks you through every feature in about 2 minutes. You can exit at any time by pressing Esc or clicking the ✕.',
    target: null, position: 'center'
  },
  {
    icon: '🗺️', title: 'The Live World Map',
    body: 'The Map view shows every active natural event as a color-coded emoji marker. 🔥 Wildfires are orange, ⛈️ Storms are blue, 🌋 Volcanoes are red, and so on. Click any marker to see details.',
    target: '.nav-btn[data-view="map"]', position: 'bottom', view: 'map'
  },
  {
    icon: '🔍', title: 'Filters Sidebar',
    body: 'Use the left panel to filter by Status (Open/Closed), Time Window (last 3–30 days), Category (wildfires, storms…) and keyword. Hit Apply Filters to reload.',
    target: '.sidebar__header', position: 'right'
  },
  {
    icon: '📋', title: 'Events List',
    body: 'Switch to Events view for a card-based layout of all events. Sort by newest, oldest, or category. Click any card to open the detail panel on the right.',
    target: '.nav-btn[data-view="list"]', position: 'bottom', view: 'list'
  },
  {
    icon: '📍', title: 'Near Me – Your Local Events',
    body: 'Click "Use My Location" or type a city name to find natural events within 100–1000 km of you. Each result shows the exact distance and a safety context note.',
    target: '.nav-btn[data-view="nearme"]', position: 'bottom', view: 'nearme'
  },
  {
    icon: '⏱️', title: 'Timeline & Charts',
    body: 'The Timeline view shows daily event counts, category breakdown, and weekday activity — perfect for spotting patterns and trends over your selected date range.',
    target: '.nav-btn[data-view="timeline"]', position: 'bottom', view: 'timeline'
  },
  {
    icon: '🎓', title: 'Learn About Each Event Type',
    body: 'The Learn tab has deep-dive cards for every category: plain-English explanations, key facts, safety tips, and live EONET examples. Great for students and curious users alike.',
    target: '.nav-btn[data-view="learn"]', position: 'bottom', view: 'learn'
  },
  {
    icon: '📤', title: 'Share a Snapshot',
    body: 'Click the share icon (top bar) to generate a summary of your current view with a shareable URL. The link restores your exact filters so anyone can see what you see.',
    target: '#btnSnapshot', position: 'bottom'
  },
  {
    icon: '❓', title: 'User Guide Always Available',
    body: 'Click the ? button any time to open this full User Guide — with tabs for the Map, Filters, Near Me, FAQ, and keyboard shortcuts. You\'re all set!',
    target: '#btnGuide', position: 'bottom'
  },
];

const TourModule = {
  current: 0,
  active:  false,

  start() {
    this.current = 0;
    this.active  = true;
    document.getElementById('tourBackdrop').classList.add('active');
    this.show();
  },

  show() {
    const step = TOUR_STEPS[this.current];
    const tooltip = document.getElementById('tourTooltip');
    document.getElementById('tourStep').textContent  = `Step ${this.current + 1} / ${TOUR_STEPS.length}`;
    document.getElementById('tourIcon').textContent  = step.icon;
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourBody').textContent  = step.body;
    document.getElementById('tourPrev').disabled     = this.current === 0;

    const nextBtn = document.getElementById('tourNext');
    nextBtn.innerHTML = this.current === TOUR_STEPS.length - 1
      ? '<i class="fa fa-check"></i> Finish'
      : 'Next <i class="fa fa-arrow-right"></i>';

    // Dots
    const dots = document.getElementById('tourDots');
    dots.innerHTML = TOUR_STEPS.map((_, i) =>
      `<div class="tour-dot ${i === this.current ? 'active' : ''}"></div>`).join('');

    // Navigate to view if needed
    if (step.view) switchView(step.view);

    // Position tooltip
    tooltip.style.display = 'block';
    this.positionTooltip(step);
  },

  positionTooltip(step) {
    const tooltip   = document.getElementById('tourTooltip');
    const highlight = document.getElementById('tourHighlight');
    const arrow     = document.getElementById('tourArrow');
    arrow.className = 'tour-arrow';

    if (!step.target || step.position === 'center') {
      highlight.classList.remove('active');
      tooltip.style.top    = '50%';
      tooltip.style.left   = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      highlight.classList.remove('active');
      tooltip.style.top    = '50%';
      tooltip.style.left   = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    tooltip.style.transform = '';
    const rect    = el.getBoundingClientRect();
    const tw      = tooltip.offsetWidth  || 320;
    const th      = tooltip.offsetHeight || 200;
    const pad     = 14;

    // Highlight the target
    highlight.classList.add('active');
    highlight.style.top    = `${rect.top    - 4}px`;
    highlight.style.left   = `${rect.left   - 4}px`;
    highlight.style.width  = `${rect.width  + 8}px`;
    highlight.style.height = `${rect.height + 8}px`;

    // Position tooltip
    if (step.position === 'bottom') {
      let top  = rect.bottom + pad;
      let left = rect.left + rect.width / 2 - tw / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
      if (top + th > window.innerHeight - 8) top = rect.top - th - pad;
      tooltip.style.top  = `${top}px`;
      tooltip.style.left = `${left}px`;
      arrow.classList.add('bottom');
    } else if (step.position === 'right') {
      let top  = rect.top + rect.height / 2 - th / 2;
      let left = rect.right + pad;
      top  = Math.max(8, Math.min(top, window.innerHeight - th - 8));
      if (left + tw > window.innerWidth - 8) left = rect.left - tw - pad;
      tooltip.style.top  = `${top}px`;
      tooltip.style.left = `${left}px`;
      arrow.classList.add('right');
    }
  },

  next() {
    if (this.current >= TOUR_STEPS.length - 1) { this.end(); return; }
    this.current++;
    this.show();
  },

  prev() {
    if (this.current <= 0) return;
    this.current--;
    this.show();
  },

  end() {
    this.active = false;
    document.getElementById('tourTooltip').style.display = 'none';
    document.getElementById('tourHighlight').classList.remove('active');
    document.getElementById('tourBackdrop').classList.remove('active');
    toast('Tour complete! Click ? any time to open the User Guide.', 'info', 4000);
  }
};

/* ---------- Welcome overlay ---------- */
function initWelcome() {
  const seen = localStorage.getItem('geoalert_guide_seen');
  const overlay = document.getElementById('welcomeOverlay');
  if (seen === '1') { overlay.style.display = 'none'; return; }
  overlay.style.display = 'flex';

  document.getElementById('btnStartTour').addEventListener('click', () => {
    if (document.getElementById('chkDontShow').checked) localStorage.setItem('geoalert_guide_seen', '1');
    overlay.style.display = 'none';
    setTimeout(() => TourModule.start(), 400);
  });

  document.getElementById('btnSkipTour').addEventListener('click', () => {
    if (document.getElementById('chkDontShow').checked) localStorage.setItem('geoalert_guide_seen', '1');
    overlay.style.display = 'none';
  });
}

/* ---------- Help panel ---------- */
function initHelpPanel() {
  const panel = document.getElementById('helpPanel');

  // Open
  document.getElementById('btnGuide').addEventListener('click', () => {
    panel.style.display = 'flex';
    // stop pulsing once opened
    document.getElementById('btnGuide').classList.remove('highlight-pulse');
  });

  // Close
  document.getElementById('helpPanelClose').addEventListener('click', () => panel.style.display = 'none');
  document.getElementById('helpPanelBackdrop').addEventListener('click', () => panel.style.display = 'none');

  // Tab switching
  document.querySelectorAll('.help-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.help-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.help-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      const pane = document.querySelector(`.help-pane[data-pane="${tab.dataset.tab}"]`);
      if (pane) pane.classList.add('active');
    });
  });

  // Go-to buttons inside overview
  document.querySelectorAll('.help-goto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.style.display = 'none';
      switchView(btn.dataset.goto);
    });
  });

  // Launch tour from inside guide
  document.getElementById('btnLaunchTour').addEventListener('click', () => {
    panel.style.display = 'none';
    setTimeout(() => TourModule.start(), 200);
  });

  // Accordion
  document.querySelectorAll('.ha-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.ha-item');
      item.classList.toggle('open');
    });
  });
}

/* ---------- Tour button bindings ---------- */
function initTourButtons() {
  document.getElementById('tourNext').addEventListener('click',  () => TourModule.next());
  document.getElementById('tourPrev').addEventListener('click',  () => TourModule.prev());
  document.getElementById('tourClose').addEventListener('click', () => TourModule.end());
  document.addEventListener('keydown', e => {
    if (!TourModule.active) return;
    if (e.key === 'ArrowRight') TourModule.next();
    if (e.key === 'ArrowLeft')  TourModule.prev();
  });
}

/* ============================================================
   18. INIT  (updated to include guide init)
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // Expose globals needed by modules
  window.CATEGORY_META = CATEGORY_META;
  window.State = State;
  window.switchView = switchView;

  applyURLParams();
  MapModule.init();
  bindEvents();
  initWelcome();
  initHelpPanel();
  initTourButtons();

  // Wire weather quick-city buttons
  document.querySelectorAll('.wx-city-btn').forEach(b => {
    b.addEventListener('click', () => WeatherModule.render(b.dataset.city));
  });

  // Default view: dashboard
  switchView('dashboard');

  await loadData();

  setInterval(() => {
    const banner = document.getElementById('offlineBanner');
    if (banner) {
      State.cache = {};
      loadData();
    }
  }, 60000);
});
