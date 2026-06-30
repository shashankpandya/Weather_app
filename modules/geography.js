/**
 * geography.js – Country / Region Geography Explorer
 * APIs: REST Countries v3.1 (free), Open-Meteo, Nominatim reverse geocoding
 * Tectonic plate layer: GeoJSON from public GitHub repo
 */
'use strict';

const GeographyModule = (() => {

  const RC_BASE = 'https://restcountries.com/v3.1';
  const TECTONIC_URL = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

  let geoMap = null;
  let tectonicLayer = null;
  let countryLayer = null;
  let allCountries = [];

  // ── fetch country ─────────────────────────────────
  async function fetchCountry(name) {
    const res = await fetch(`${RC_BASE}/name/${encodeURIComponent(name)}?fullText=false`);
    if (!res.ok) throw new Error('Country not found');
    const data = await res.json();
    return data[0];
  }

  async function fetchAllCountries() {
    if (allCountries.length) return allCountries;
    const res = await fetch(`${RC_BASE}/all?fields=name,cca2,region,subregion,population,area,capital,flags,latlng`);
    if (!res.ok) throw new Error('Could not load countries');
    allCountries = await res.json();
    return allCountries;
  }

  // ── render country card ───────────────────────────
  function renderCountryCard(c) {
    const name = c.name.common;
    const official = c.name.official;
    const capital = c.capital?.[0] || '—';
    const pop = c.population ? c.population.toLocaleString() : '—';
    const area = c.area ? c.area.toLocaleString() + ' km²' : '—';
    const region = c.region || '—';
    const sub = c.subregion || '—';
    const currencies = c.currencies ? Object.values(c.currencies).map(cu=>`${cu.name} (${cu.symbol||''})`).join(', ') : '—';
    const languages = c.languages ? Object.values(c.languages).join(', ') : '—';
    const timezones = (c.timezones || []).join(', ');
    const borders = (c.borders || []).join(', ') || 'None (island or landlocked)';
    const flag = c.flags?.svg || c.flags?.png || '';
    const lat = c.latlng?.[0]?.toFixed(2) || '—';
    const lon = c.latlng?.[1]?.toFixed(2) || '—';
    const tld = (c.tld || []).join(', ') || '—';
    const drivingSide = c.car?.side || '—';
    const callingCodes = (c.idd?.root || '') + (c.idd?.suffixes?.[0] || '');
    const startOfWeek = c.startOfWeek || '—';
    const continents = (c.continents || []).join(', ');
    const independent = c.independent ? '✅ Yes' : '❌ No';

    return `
    <div class="geo-country-card">
      <div class="geo-country-hero">
        ${flag ? `<img src="${flag}" alt="Flag of ${name}" class="geo-flag" />` : '<div class="geo-flag-placeholder">🏳️</div>'}
        <div class="geo-country-info">
          <h2>${name}</h2>
          <p class="text-muted">${official}</p>
          <div class="geo-badges">
            <span class="badge" style="background:var(--accent-glow);color:var(--accent)">${region}</span>
            <span class="badge" style="background:var(--bg-hover);color:var(--text-secondary)">${sub}</span>
            <span class="badge" style="background:var(--bg-hover);color:var(--text-secondary)">${continents}</span>
          </div>
        </div>
      </div>
      <div class="geo-detail-grid">
        <div class="geo-detail-item"><label>🏙️ Capital</label><span>${capital}</span></div>
        <div class="geo-detail-item"><label>👥 Population</label><span>${pop}</span></div>
        <div class="geo-detail-item"><label>📐 Area</label><span>${area}</span></div>
        <div class="geo-detail-item"><label>📍 Coordinates</label><span>${lat}°N, ${lon}°E</span></div>
        <div class="geo-detail-item"><label>💱 Currency</label><span>${currencies}</span></div>
        <div class="geo-detail-item"><label>🗣️ Languages</label><span>${languages}</span></div>
        <div class="geo-detail-item"><label>🕐 Timezones</label><span>${timezones}</span></div>
        <div class="geo-detail-item"><label>🌐 TLD</label><span>${tld}</span></div>
        <div class="geo-detail-item"><label>📞 Calling Code</label><span>${callingCodes || '—'}</span></div>
        <div class="geo-detail-item"><label>🚗 Driving Side</label><span>${drivingSide}</span></div>
        <div class="geo-detail-item"><label>🗓️ Week Start</label><span>${startOfWeek}</span></div>
        <div class="geo-detail-item"><label>🏳️ Independent</label><span>${independent}</span></div>
        <div class="geo-detail-item geo-wide"><label>🗺️ Bordering Countries</label><span>${borders}</span></div>
      </div>
    </div>`;
  }

  // ── render countries table ────────────────────────
  function renderCountriesTable(countries, sortBy='population', filterRegion='') {
    let filtered = filterRegion ? countries.filter(c=>c.region===filterRegion) : countries;
    filtered = [...filtered].sort((a,b)=>{
      if (sortBy==='population') return (b.population||0)-(a.population||0);
      if (sortBy==='area') return (b.area||0)-(a.area||0);
      if (sortBy==='name') return a.name.common.localeCompare(b.name.common);
      return 0;
    });

    const regions = [...new Set(countries.map(c=>c.region))].filter(Boolean).sort();
    return `
    <div class="geo-table-controls">
      <select id="geoRegionFilter" aria-label="Filter by region">
        <option value="">All Regions</option>
        ${regions.map(r=>`<option value="${r}" ${r===filterRegion?'selected':''}>${r}</option>`).join('')}
      </select>
      <select id="geoSortBy" aria-label="Sort by">
        <option value="population" ${sortBy==='population'?'selected':''}>Sort: Population</option>
        <option value="area" ${sortBy==='area'?'selected':''}>Sort: Area</option>
        <option value="name" ${sortBy==='name'?'selected':''}>Sort: Name A-Z</option>
      </select>
      <span class="text-muted" style="font-size:0.8rem">${filtered.length} countries</span>
    </div>
    <div class="geo-countries-grid">
      ${filtered.slice(0,60).map(c=>`
        <div class="geo-mini-card" data-country="${c.name.common}">
          <img src="${c.flags?.png||''}" alt="${c.name.common}" class="geo-mini-flag" onerror="this.style.display='none'" />
          <div class="geo-mini-info">
            <div class="geo-mini-name">${c.name.common}</div>
            <div class="geo-mini-meta">${c.region} · Pop: ${(c.population/1000000).toFixed(1)}M</div>
          </div>
        </div>`).join('')}
    </div>`;
  }

  // ── render tectonic plates section ───────────────
  function renderTectonicInfo() {
    const plates = [
      { name:'Pacific Plate', area:'103.3M km²', type:'Oceanic', desc:'Largest tectonic plate, mostly under the Pacific Ocean.' },
      { name:'North American Plate', area:'75.9M km²', type:'Continental', desc:'Covers North America and part of the Atlantic Ocean.' },
      { name:'Eurasian Plate', area:'67.8M km²', type:'Continental', desc:'Covers most of Europe and Asia.' },
      { name:'African Plate', area:'61.3M km²', type:'Continental', desc:'Covers the African continent and surrounding ocean floor.' },
      { name:'Antarctic Plate', area:'60.9M km²', type:'Continental', desc:'Surrounds the Antarctic continent.' },
      { name:'Indo-Australian Plate', area:'58.9M km²', type:'Continental', desc:'Moving north at ~7cm/year, causing Himalayan uplift.' },
      { name:'South American Plate', area:'43.6M km²', type:'Continental', desc:'Covers South America and part of the Atlantic.' },
      { name:'Nazca Plate', area:'15.6M km²', type:'Oceanic', desc:'Subducting under South America, causing Andes volcanoes.' },
    ];
    return `
    <div class="geo-plates-section">
      <h3><i class="fa fa-layer-group"></i> Major Tectonic Plates</h3>
      <p class="text-muted" style="font-size:0.82rem;margin-bottom:12px">Earth's lithosphere is divided into ~15 major and dozens of minor tectonic plates that constantly move, causing earthquakes, volcanoes, and mountain building.</p>
      <div class="geo-plates-grid">
        ${plates.map(p=>`
          <div class="geo-plate-card">
            <div class="geo-plate-name">${p.name}</div>
            <div class="geo-plate-badges">
              <span class="badge" style="background:${p.type==='Oceanic'?'#2196f322':'#ff980022'};color:${p.type==='Oceanic'?'#2196f3':'#ff9800'}">${p.type}</span>
              <span class="badge" style="background:var(--bg-hover);color:var(--text-muted)">${p.area}</span>
            </div>
            <div class="geo-plate-desc">${p.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── render biomes section ─────────────────────────
  function renderBiomesSection() {
    const biomes = [
      { icon:'🌲', name:'Boreal Forest (Taiga)', climate:'Subarctic', desc:'Largest land biome. Found in Canada, Russia, Scandinavia. Cold winters, coniferous trees.' },
      { icon:'🌳', name:'Temperate Deciduous Forest', climate:'Temperate', desc:'Eastern US, Europe, East Asia. Four seasons, diverse wildlife.' },
      { icon:'🌴', name:'Tropical Rainforest', climate:'Tropical wet', desc:'Amazon, Congo, SE Asia. Highest biodiversity. 50–450 species per km².' },
      { icon:'🌾', name:'Tropical Savanna', climate:'Tropical dry', desc:'Sub-Saharan Africa, N Australia. Distinct wet & dry seasons.' },
      { icon:'🌵', name:'Desert (Hot)', climate:'Arid', desc:'Sahara, Arabian, Sonoran. <250mm rain/year. Extreme temperatures.' },
      { icon:'🏔️', name:'Alpine / Montane', climate:'Cold', desc:'Found above treeline on mountains worldwide. Low oxygen, UV intense.' },
      { icon:'🌿', name:'Mediterranean Shrubland', climate:'Mediterranean', desc:'Mild wet winters, dry hot summers. California, S Europe, SW Australia.' },
      { icon:'❄️', name:'Tundra', climate:'Arctic/Alpine', desc:'Arctic regions. Permafrost layer, treeless. Rich in migratory birds.' },
      { icon:'🌊', name:'Ocean / Marine', climate:'Varied', desc:'Covers 71% of Earth. Includes coral reefs, open ocean, deep sea zones.' },
      { icon:'🌱', name:'Temperate Grassland', climate:'Temperate', desc:'American prairies, Eurasian steppes. Fertile soils, few trees.' },
    ];
    return `
    <div class="geo-biomes-section">
      <h3><i class="fa fa-leaf"></i> Earth's Major Biomes</h3>
      <div class="geo-biomes-grid">
        ${biomes.map(b=>`
          <div class="geo-biome-card">
            <div class="geo-biome-icon">${b.icon}</div>
            <div class="geo-biome-name">${b.name}</div>
            <div class="badge" style="background:var(--bg-hover);color:var(--text-muted);margin:4px 0;font-size:0.7rem">${b.climate}</div>
            <div class="geo-biome-desc">${b.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── render geography map ──────────────────────────
  function initGeoMap() {
    if (geoMap) return;
    const el = document.getElementById('geoMapEl');
    if (!el) return;
    geoMap = L.map(el).setView([20,0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap contributors' }).addTo(geoMap);

    // Load tectonic plates
    fetch(TECTONIC_URL)
      .then(r=>r.json())
      .then(data=>{
        tectonicLayer = L.geoJSON(data, {
          style:{ color:'#ff5722', weight:1.5, opacity:0.6, fill:false, dashArray:'4 4' }
        }).addTo(geoMap);
        tectonicLayer.bindTooltip('Tectonic Plate Boundary');
      }).catch(()=>{});
  }

  // ── main render ───────────────────────────────────
  async function render(query) {
    const container = document.getElementById('geoContent');
    const isCountrySearch = !!query;

    if (query) {
      container.querySelector('#geoSearchInput').value = query;
      const detailDiv = document.getElementById('geoCountryDetail');
      detailDiv.innerHTML = `<div class="wx-loading"><div class="spinner"></div><p>Loading <b>${query}</b>…</p></div>`;
      try {
        const c = await fetchCountry(query);
        detailDiv.innerHTML = renderCountryCard(c);
        // Zoom map to country
        if (c.latlng && geoMap) {
          geoMap.setView(c.latlng, 5);
        }
      } catch(e) {
        detailDiv.innerHTML = `<div class="error-banner"><i class="fa fa-triangle-exclamation"></i> ${e.message}</div>`;
      }
    }
  }

  async function initView() {
    const container = document.getElementById('geoContent');
    if (container.dataset.initialized) return;
    container.dataset.initialized = '1';

    // Build the page structure first
    container.innerHTML = `
      <div class="geo-layout">
        <div class="geo-left">
          <div class="geo-search-row">
            <input id="geoSearchInput" placeholder="Search a country…" aria-label="Search country" />
            <button id="geoSearchBtn" class="btn-primary"><i class="fa fa-search"></i> Search</button>
          </div>
          <div id="geoCountryDetail" class="geo-country-detail">
            <div class="geo-empty-state"><i class="fa fa-globe fa-3x"></i><p>Search for a country to see its geography, demographics, languages, and more.</p></div>
          </div>
          ${renderTectonicInfo()}
          ${renderBiomesSection()}
        </div>
        <div class="geo-right">
          <div class="geo-map-wrap">
            <div class="geo-map-header"><h3><i class="fa fa-map"></i> World Map + Tectonic Plates</h3></div>
            <div id="geoMapEl" class="geo-map-el" role="application" aria-label="World geography map with tectonic plates"></div>
          </div>
          <div id="geoTableWrap" class="geo-table-wrap">
            <h3><i class="fa fa-table"></i> All Countries</h3>
            <div id="geoCountriesTable">
              <div class="wx-loading"><div class="spinner"></div><p>Loading countries…</p></div>
            </div>
          </div>
        </div>
      </div>`;

    // Bind search
    document.getElementById('geoSearchBtn').addEventListener('click', () => {
      const q = document.getElementById('geoSearchInput').value.trim();
      if (q) render(q);
    });
    document.getElementById('geoSearchInput').addEventListener('keypress', e => {
      if (e.key==='Enter') document.getElementById('geoSearchBtn').click();
    });

    initGeoMap();

    // Load countries table async
    try {
      const countries = await fetchAllCountries();
      const tableEl = document.getElementById('geoCountriesTable');
      tableEl.innerHTML = renderCountriesTable(countries);
      // Bind filters
      document.getElementById('geoRegionFilter')?.addEventListener('change', function() {
        tableEl.innerHTML = renderCountriesTable(countries, document.getElementById('geoSortBy').value, this.value);
        bindCountryCards(countries);
      });
      document.getElementById('geoSortBy')?.addEventListener('change', function() {
        tableEl.innerHTML = renderCountriesTable(countries, this.value, document.getElementById('geoRegionFilter').value);
        bindCountryCards(countries);
      });
      bindCountryCards(countries);
    } catch(e) {
      document.getElementById('geoCountriesTable').innerHTML = `<div class="error-banner">${e.message}</div>`;
    }
  }

  function bindCountryCards(countries) {
    document.querySelectorAll('.geo-mini-card').forEach(card => {
      card.addEventListener('click', () => render(card.dataset.country));
    });
  }

  return { initView, render };
})();
