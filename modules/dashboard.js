/**
 * dashboard.js – Unified Live Dashboard (Home view)
 * Aggregates all data streams into one at-a-glance overview
 */
'use strict';

const DashboardModule = (() => {

  let tickerInterval = null;
  let refreshInterval = null;

  // ── World facts (static) ─────────────────────────
  const EARTH_FACTS = [
    { icon:'🌍', label:'Surface Area', value:'510.1M km²' },
    { icon:'🌊', label:'Ocean Coverage', value:'71%' },
    { icon:'🏔️', label:'Highest Point', value:'Mt. Everest 8,849m' },
    { icon:'🌊', label:'Deepest Point', value:'Mariana Trench -11,034m' },
    { icon:'🌡️', label:'Hottest Recorded', value:'56.7°C (Death Valley, 1913)' },
    { icon:'❄️', label:'Coldest Recorded', value:'-89.2°C (Vostok, 1983)' },
    { icon:'💨', label:'Fastest Wind', value:'408 km/h (Barrow Island, 1996)' },
    { icon:'🌧️', label:'Wettest Place', value:'Mawsynram, India (~12,000mm/yr)' },
    { icon:'🏜️', label:'Driest Place', value:'Atacama Desert (<1mm/yr avg)' },
    { icon:'👥', label:'World Population', value:'~8.1 Billion (2024)' },
    { icon:'🌲', label:'Tree Count', value:'~3.04 Trillion trees' },
    { icon:'🦋', label:'Known Species', value:'~8.7 Million estimated' },
    { icon:'🌋', label:'Active Volcanoes', value:'~1,500 worldwide' },
    { icon:'📏', label:'Circumference', value:'40,075 km (equatorial)' },
    { icon:'🔄', label:'Rotation Speed', value:'1,670 km/h at equator' },
    { icon:'☀️', label:'Distance to Sun', value:'149.6M km (1 AU)' },
  ];

  // ── Climate change indicators ─────────────────────
  const CLIMATE_INDICATORS = [
    { icon:'🌡️', label:'Global Temp Rise', value:'+1.2°C', note:'vs. pre-industrial average (1850–1900)', color:'#f85149' },
    { icon:'🌊', label:'Sea Level Rise', value:'+20cm', note:'since 1900, accelerating since 1990', color:'#2196f3' },
    { icon:'🧊', label:'Arctic Ice Loss', value:'-13%/decade', note:'September minimum since 1979', color:'#80deea' },
    { icon:'💨', label:'CO₂ Concentration', value:'~423 ppm', note:'Highest in 3 million years (Mauna Loa 2024)', color:'#ff9800' },
    { icon:'🌲', label:'Deforestation', value:'~10M ha/yr', note:'Net forest loss per year globally', color:'#4caf50' },
    { icon:'🐠', label:'Ocean Acidification', value:'pH 8.1 → 8.05', note:'30% more acidic since 1800s', color:'#00bcd4' },
  ];

  // ── Render earth facts ────────────────────────────
  function renderEarthFacts() {
    return `
    <div class="dash-section">
      <h3><i class="fa fa-globe"></i> Earth at a Glance</h3>
      <div class="dash-facts-grid">
        ${EARTH_FACTS.map(f=>`
          <div class="dash-fact-card">
            <div class="dash-fact-icon">${f.icon}</div>
            <div class="dash-fact-label">${f.label}</div>
            <div class="dash-fact-value">${f.value}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── Render climate indicators ─────────────────────
  function renderClimateIndicators() {
    return `
    <div class="dash-section">
      <h3><i class="fa fa-chart-line"></i> Climate Change Key Indicators</h3>
      <p class="text-muted" style="font-size:0.82rem;margin-bottom:12px">Based on IPCC, NOAA, NASA, and WMO data</p>
      <div class="dash-climate-grid">
        ${CLIMATE_INDICATORS.map(c=>`
          <div class="dash-climate-card">
            <div class="dash-climate-icon">${c.icon}</div>
            <div class="dash-climate-value" style="color:${c.color}">${c.value}</div>
            <div class="dash-climate-label">${c.label}</div>
            <div class="dash-climate-note">${c.note}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── Render live events ticker ─────────────────────
  function renderEventsTicker(events) {
    if (!events || !events.length) return '';
    const CATEGORY_META_LOCAL = window.CATEGORY_META || {};
    const items = events.slice(0,20).map(ev => {
      const cat = ev.categories?.[0];
      const meta = cat ? (CATEGORY_META_LOCAL[cat.id] || { icon:'🌐', color:'#8b949e' }) : { icon:'🌐', color:'#8b949e' };
      const date = ev.geometry?.[ev.geometry.length-1]?.date;
      const d = date ? new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
      return `<span class="ticker-item"><span style="color:${meta.color}">${meta.icon}</span> ${ev.title} <span class="text-muted">${d}</span></span>`;
    }).join('<span class="ticker-sep">·</span>');
    return `
    <div class="dash-ticker-wrap" aria-label="Live events ticker" role="marquee">
      <div class="ticker-label"><i class="fa fa-satellite-dish pulse"></i> LIVE</div>
      <div class="ticker-track" id="tickerTrack">${items}${items}</div>
    </div>`;
  }

  // ── Render quick navigation ───────────────────────
  function renderQuickNav() {
    const cards = [
      { view:'map',          icon:'🗺️',  title:'Live Event Map',    desc:'Interactive world map of all active natural events' },
      { view:'weather',      icon:'🌤️',  title:'Weather',           desc:'Current conditions, 7-day forecast, hourly charts' },
      { view:'climate',      icon:'🌡️',  title:'Climate Data',      desc:'Historical climate normals, rainfall, temperature trends' },
      { view:'geography',    icon:'🌍',  title:'Geography Explorer', desc:'Country profiles, tectonic plates, biomes, world facts' },
      { view:'spaceweather', icon:'☀️',  title:'Space Weather',     desc:'Solar flares, CME, Kp index, aurora forecast' },
      { view:'nearme',       icon:'📍',  title:'Events Near Me',    desc:'Find natural events within any radius of your location' },
      { view:'list',         icon:'📋',  title:'Events List',       desc:'Browse, sort and filter all tracked natural events' },
      { view:'timeline',     icon:'⏱️',  title:'Timeline & Charts', desc:'Daily trends, category breakdown, activity patterns' },
      { view:'learn',        icon:'🎓',  title:'Learn',             desc:'Educational content for every event type with safety tips' },
      { view:'stats',        icon:'📊',  title:'Global Stats',      desc:'KPIs, charts, top-10 events ranked table' },
    ];
    return `
    <div class="dash-section">
      <h3><i class="fa fa-compass"></i> Quick Navigation</h3>
      <div class="dash-nav-grid">
        ${cards.map(c=>`
          <div class="dash-nav-card" data-goto="${c.view}" tabindex="0" role="button" aria-label="Go to ${c.title}">
            <div class="dash-nav-icon">${c.icon}</div>
            <div class="dash-nav-title">${c.title}</div>
            <div class="dash-nav-desc">${c.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── Render active event summary ───────────────────
  function renderEventSummary(events) {
    if (!events || !events.length) return '';
    const CATEGORY_META_LOCAL = window.CATEGORY_META || {};
    const open   = events.filter(e=>!e.closed);
    const closed = events.filter(e=>e.closed);
    const byCat  = {};
    open.forEach(e => {
      const id = e.categories?.[0]?.id || 'other';
      byCat[id] = (byCat[id]||0)+1;
    });
    const topCats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);

    return `
    <div class="dash-section">
      <h3><i class="fa fa-satellite-dish"></i> NASA EONET Live Summary</h3>
      <div class="dash-event-kpi">
        <div class="dash-ev-kpi-card"><div class="dash-ev-kpi-val">${events.length}</div><div class="dash-ev-kpi-label">Total Events</div></div>
        <div class="dash-ev-kpi-card" style="border-color:var(--success)"><div class="dash-ev-kpi-val" style="color:var(--success)">${open.length}</div><div class="dash-ev-kpi-label">Active Now</div></div>
        <div class="dash-ev-kpi-card" style="border-color:var(--danger)"><div class="dash-ev-kpi-val" style="color:var(--danger)">${closed.length}</div><div class="dash-ev-kpi-label">Recently Closed</div></div>
      </div>
      <div class="dash-cat-bars">
        ${topCats.map(([id, count]) => {
          const meta = CATEGORY_META_LOCAL[id] || { icon:'🌐', color:'#8b949e', label: id };
          const pct  = Math.round(count / open.length * 100);
          return `<div class="dash-cat-bar-row">
            <span>${meta.icon} ${meta.label}</span>
            <div class="dash-cat-bar-track"><div class="dash-cat-bar-fill" style="width:${pct}%;background:${meta.color}"></div></div>
            <span style="color:${meta.color};font-weight:600">${count}</span>
          </div>`;
        }).join('')}
      </div>
      <button class="btn-primary" style="margin-top:12px" onclick="switchView('map')"><i class="fa fa-map"></i> Open Live Map</button>
    </div>`;
  }

  // ── main render ───────────────────────────────────
  function render() {
    const container = document.getElementById('dashboardContent');
    const events = window.State?.filteredEvents || [];

    container.innerHTML = `
      ${renderEventsTicker(events)}
      <div class="dash-body">
        <div class="dash-col-main">
          ${renderQuickNav()}
          ${renderEarthFacts()}
          ${renderClimateIndicators()}
        </div>
        <div class="dash-col-side">
          ${renderEventSummary(events)}
          <div class="dash-section">
            <h3><i class="fa fa-info-circle"></i> About GeoAlert</h3>
            <div class="dash-about-card">
              <p>GeoAlert is a free, open, community-focused platform for understanding Earth's natural events in real time. It brings together data from NASA, NOAA, Open-Meteo, REST Countries, and other authoritative sources into one accessible interface.</p>
              <div class="dash-about-sources">
                <span class="dash-source-badge">🛰️ NASA EONET v3</span>
                <span class="dash-source-badge">🌦️ Open-Meteo</span>
                <span class="dash-source-badge">☀️ NOAA SWPC</span>
                <span class="dash-source-badge">🌍 REST Countries</span>
                <span class="dash-source-badge">🗺️ OpenStreetMap</span>
                <span class="dash-source-badge">🚀 NASA DONKI</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Bind quick nav cards
    container.querySelectorAll('.dash-nav-card').forEach(card => {
      card.addEventListener('click', () => switchView(card.dataset.goto));
      card.addEventListener('keypress', e => { if (e.key==='Enter') switchView(card.dataset.goto); });
    });

    // Start ticker animation
    startTicker();
  }

  function startTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    let pos = 0;
    clearInterval(tickerInterval);
    tickerInterval = setInterval(() => {
      pos += 0.5;
      if (pos > track.scrollWidth / 2) pos = 0;
      track.style.transform = `translateX(-${pos}px)`;
    }, 16);
  }

  function stopTicker() { clearInterval(tickerInterval); }

  return { render, stopTicker };
})();
