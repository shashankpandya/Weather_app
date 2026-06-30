/**
 * spaceweather.js – Space Weather & Solar Activity Module
 * APIs: NOAA SWPC (free, no key), NASA DONKI
 */
'use strict';

const SpaceWeatherModule = (() => {

  const SWPC_BASE  = 'https://services.swpc.noaa.gov';
  const DONKI_BASE = 'https://api.nasa.gov/DONKI';
  const NASA_KEY   = 'DEMO_KEY'; // free demo key, 30 req/hour

  // Kp index to aurora visibility
  const KP_AURORA = [
    { min:0,  max:2,  label:'Quiet',      color:'#3fb950', aurora:'Visible only at high latitudes (Alaska, Norway)' },
    { min:3,  max:4,  label:'Unsettled',  color:'#d29922', aurora:'Visible at sub-auroral zones (Canada, northern Russia)' },
    { min:5,  max:5,  label:'G1 Storm',   color:'#ff9800', aurora:'Visible as far south as Michigan, Oregon' },
    { min:6,  max:6,  label:'G2 Storm',   color:'#f85149', aurora:'Visible as far south as New York, Idaho' },
    { min:7,  max:8,  label:'G3-4 Storm', color:'#9c27b0', aurora:'Visible as far south as Illinois, Oregon' },
    { min:9,  max:9,  label:'G5 Storm',   color:'#ff5722', aurora:'Aurora visible near equator — extreme event!' },
  ];

  function kpInfo(kp) {
    return KP_AURORA.find(k => kp >= k.min && kp <= k.max) || KP_AURORA[0];
  }

  // ── fetch Kp index ────────────────────────────────
  async function fetchKp() {
    const res = await fetch(`${SWPC_BASE}/products/noaa-planetary-k-index.json`);
    if (!res.ok) throw new Error('Kp data unavailable');
    return res.json(); // array of [time, kp, ...]
  }

  // ── fetch solar wind ──────────────────────────────
  async function fetchSolarWind() {
    const res = await fetch(`${SWPC_BASE}/products/solar-wind/plasma-2-hour.json`);
    if (!res.ok) throw new Error('Solar wind data unavailable');
    return res.json();
  }

  // ── fetch geomagnetic forecast ────────────────────
  async function fetchGeoForecast() {
    const res = await fetch(`${SWPC_BASE}/text/3-day-geomag-forecast.txt`);
    if (!res.ok) return null;
    return res.text();
  }

  // ── fetch solar flares (DONKI) ────────────────────
  async function fetchFlares() {
    const end = new Date().toISOString().slice(0,10);
    const start = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
    const res = await fetch(`${DONKI_BASE}/FLR?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`);
    if (!res.ok) return [];
    return res.json();
  }

  // ── fetch CME (Coronal Mass Ejections) ────────────
  async function fetchCME() {
    const end = new Date().toISOString().slice(0,10);
    const start = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);
    const res = await fetch(`${DONKI_BASE}/CME?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`);
    if (!res.ok) return [];
    return res.json();
  }

  // ── render Kp gauge ───────────────────────────────
  function renderKpGauge(kpData) {
    const latest = kpData[kpData.length - 1];
    const kp = parseFloat(latest?.[1] || 0);
    const info = kpInfo(Math.round(kp));
    const pct = (kp / 9) * 100;

    const recent = kpData.slice(-24).map((d,i) => {
      const k = parseFloat(d[1]);
      const inf = kpInfo(Math.round(k));
      return `<div class="kp-bar-item" style="background:${inf.color};height:${Math.max(k/9*60,4)}px" title="Kp ${k} — ${d[0]}"></div>`;
    }).join('');

    return `
    <div class="sw-kp-card">
      <div class="sw-kp-header"><i class="fa fa-sun"></i> Planetary Kp Index</div>
      <div class="sw-kp-main">
        <div class="sw-kp-value" style="color:${info.color}">${kp.toFixed(1)}</div>
        <div class="sw-kp-label" style="color:${info.color}">${info.label}</div>
      </div>
      <div class="sw-kp-bar-wrap">
        <div class="sw-kp-fill" style="width:${pct}%;background:${info.color}"></div>
      </div>
      <div class="sw-aurora-note"><i class="fa fa-circle-info"></i> ${info.aurora}</div>
      <div class="sw-kp-history">
        <div class="sw-kp-history-label">Last 24 readings</div>
        <div class="kp-bars">${recent}</div>
      </div>
    </div>`;
  }

  // ── render solar wind ─────────────────────────────
  function renderSolarWind(data) {
    const rows = data.slice(-1)[0] || [];
    const density = parseFloat(rows[1]) || 0;
    const speed   = parseFloat(rows[2]) || 0;
    const temp    = parseFloat(rows[3]) || 0;

    const speedStatus = speed < 400 ? {l:'Slow',c:'#3fb950'} : speed < 600 ? {l:'Moderate',c:'#d29922'} : {l:'Fast',c:'#f85149'};

    return `
    <div class="sw-wind-card">
      <div class="sw-section-title"><i class="fa fa-wind"></i> Solar Wind (ACE/DSCOVR)</div>
      <div class="sw-wind-grid">
        <div class="sw-wind-item">
          <div class="sw-wind-val" style="color:${speedStatus.c}">${Math.round(speed)}</div>
          <div class="sw-wind-unit">km/s</div>
          <div class="sw-wind-label">Speed <span style="color:${speedStatus.c}">(${speedStatus.l})</span></div>
        </div>
        <div class="sw-wind-item">
          <div class="sw-wind-val">${density.toFixed(1)}</div>
          <div class="sw-wind-unit">p/cm³</div>
          <div class="sw-wind-label">Density</div>
        </div>
        <div class="sw-wind-item">
          <div class="sw-wind-val">${(temp/1000).toFixed(0)}K</div>
          <div class="sw-wind-unit">×10³ K</div>
          <div class="sw-wind-label">Temperature</div>
        </div>
      </div>
    </div>`;
  }

  // ── render flares ─────────────────────────────────
  function renderFlares(flares) {
    if (!flares || !flares.length) return `
      <div class="sw-card">
        <div class="sw-section-title"><i class="fa fa-bolt"></i> Solar Flares (Last 7 Days)</div>
        <div class="sw-empty">No solar flares detected in the past 7 days ✅</div>
      </div>`;

    const CLASS_COLOR = { X:'#f85149', M:'#ff9800', C:'#d29922', B:'#3fb950', A:'#8b949e' };
    return `
    <div class="sw-card">
      <div class="sw-section-title"><i class="fa fa-bolt"></i> Solar Flares (Last 7 Days) — ${flares.length} events</div>
      <div class="sw-flare-list">
        ${flares.slice(0,8).map(f => {
          const cls = f.classType?.[0] || 'U';
          const col = CLASS_COLOR[cls] || '#8b949e';
          return `<div class="sw-flare-item">
            <span class="sw-flare-class" style="color:${col};border-color:${col}">${f.classType || '?'}</span>
            <div class="sw-flare-info">
              <div class="sw-flare-time">${f.beginTime ? new Date(f.beginTime).toLocaleString() : '—'}</div>
              <div class="sw-flare-source">${f.sourceLocation || 'Unknown region'} · Peak: ${f.peakTime?.slice(11,16)||'—'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ── render CME ────────────────────────────────────
  function renderCME(cmes) {
    if (!cmes || !cmes.length) return `
      <div class="sw-card">
        <div class="sw-section-title"><i class="fa fa-circle-radiation"></i> Coronal Mass Ejections (Last 7 Days)</div>
        <div class="sw-empty">No CMEs recorded in the past 7 days ✅</div>
      </div>`;

    return `
    <div class="sw-card">
      <div class="sw-section-title"><i class="fa fa-circle-radiation"></i> Coronal Mass Ejections — ${cmes.length} events</div>
      <div class="sw-cme-list">
        ${cmes.slice(0,5).map(c => {
          const speed = c.cmeAnalyses?.[0]?.speed || '—';
          const type = c.cmeAnalyses?.[0]?.type || '—';
          return `<div class="sw-cme-item">
            <div class="sw-cme-time">${c.startTime ? new Date(c.startTime).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
            <div class="sw-cme-meta">Speed: <b>${speed} km/s</b> · Type: ${type}</div>
            <div class="sw-cme-note">${c.note || ''}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ── render educational section ────────────────────
  function renderSpaceWeatherEdu() {
    const items = [
      { icon:'🌞', title:'Solar Flares', desc:'Sudden intense bursts of radiation from the Sun. Classified A/B/C/M/X by intensity. X-class can disrupt radio communications and GPS.' },
      { icon:'💨', title:'Solar Wind', desc:'Continuous stream of charged particles from the Sun. Speed: 300–800 km/s. Drives aurora borealis when it interacts with Earth\'s magnetosphere.' },
      { icon:'💥', title:'Coronal Mass Ejection (CME)', desc:'Massive clouds of magnetized plasma. Take 1–3 days to reach Earth. Can cause G1–G5 geomagnetic storms.' },
      { icon:'🔢', title:'Kp Index (0–9)', desc:'Measures global geomagnetic disturbance. Kp ≥ 5 = geomagnetic storm. Kp 9 = extreme event (Carrington-class). Updated every 3 hours by NOAA.' },
      { icon:'🌌', title:'Aurora (Northern/Southern Lights)', desc:'Caused by solar particles interacting with atmospheric gases. Stronger solar activity → aurora visible at lower latitudes.' },
      { icon:'📡', title:'Impacts on Earth', desc:'Strong events can affect power grids, satellite orbits, HF radio, GPS accuracy, and astronaut safety on the ISS.' },
    ];
    return `
    <div class="sw-edu-section">
      <h3><i class="fa fa-graduation-cap"></i> Understanding Space Weather</h3>
      <div class="sw-edu-grid">
        ${items.map(item=>`
          <div class="sw-edu-card">
            <div class="sw-edu-icon">${item.icon}</div>
            <div class="sw-edu-title">${item.title}</div>
            <div class="sw-edu-desc">${item.desc}</div>
          </div>`).join('')}
      </div>
      <div class="help-tip-box" style="margin-top:12px">
        <i class="fa fa-satellite-dish"></i>
        <div>Data from <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener">NOAA Space Weather Prediction Center</a> and <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener">NASA DONKI</a></div>
      </div>
    </div>`;
  }

  // ── main render ───────────────────────────────────
  async function render() {
    const container = document.getElementById('spaceWeatherContent');
    container.innerHTML = `<div class="wx-loading"><div class="spinner"></div><p>Fetching space weather data from NOAA & NASA…</p></div>`;

    try {
      const [kpData, swData, flares, cmes] = await Promise.allSettled([
        fetchKp(), fetchSolarWind(), fetchFlares(), fetchCME()
      ]);

      const kp  = kpData.status==='fulfilled'  ? kpData.value  : null;
      const sw  = swData.status==='fulfilled'  ? swData.value  : null;
      const fl  = flares.status==='fulfilled'  ? flares.value  : [];
      const cm  = cmes.status==='fulfilled'    ? cmes.value    : [];

      container.innerHTML = `
        <div class="sw-layout">
          <div class="sw-top-row">
            ${kp ? renderKpGauge(kp) : '<div class="sw-card"><p class="text-muted">Kp data unavailable</p></div>'}
            ${sw ? renderSolarWind(sw) : '<div class="sw-card"><p class="text-muted">Solar wind data unavailable</p></div>'}
          </div>
          <div class="sw-events-row">
            ${renderFlares(fl)}
            ${renderCME(cm)}
          </div>
          ${renderSpaceWeatherEdu()}
        </div>`;
    } catch(e) {
      container.innerHTML = `<div class="error-banner"><i class="fa fa-triangle-exclamation"></i> ${e.message}. NOAA may be temporarily unavailable.</div>`;
    }
  }

  return { render };
})();
