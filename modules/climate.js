/**
 * climate.js – Climate & Historical Data Module
 * APIs: Open-Meteo Climate API (ERA5 reanalysis) – free, no key
 */
'use strict';

const ClimateModule = (() => {

  const BASE = 'https://climate-api.open-meteo.com/v1/climate';

  let charts = {};
  function destroyChart(k) { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  async function fetchClimate(lat, lon) {
    const url = `${BASE}?latitude=${lat}&longitude=${lon}` +
      `&start_date=1991-01-01&end_date=2020-12-31` +
      `&models=EC_Earth3P_HR` +
      `&monthly=temperature_2m_mean,precipitation_sum,windspeed_10m_mean`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Climate API unavailable');
    return res.json();
  }

  async function fetchClimate30yr(lat, lon) {
    // Use Open-Meteo forecast API with historical mode for monthly normals
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
      `&timezone=auto&past_days=365&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Historical weather unavailable');
    return res.json();
  }

  function aggregateByMonth(daily) {
    const buckets = Array.from({length:12}, () => ({ tMax:[], tMin:[], precip:[], wind:[] }));
    daily.time.forEach((t,i) => {
      const m = new Date(t).getMonth();
      if (daily.temperature_2m_max[i] != null) buckets[m].tMax.push(daily.temperature_2m_max[i]);
      if (daily.temperature_2m_min[i] != null) buckets[m].tMin.push(daily.temperature_2m_min[i]);
      if (daily.precipitation_sum[i] != null)  buckets[m].precip.push(daily.precipitation_sum[i]);
      if (daily.wind_speed_10m_max[i] != null)  buckets[m].wind.push(daily.wind_speed_10m_max[i]);
    });
    return buckets.map(b => ({
      tMax:  b.tMax.length  ? +(b.tMax.reduce((s,v)=>s+v,0)/b.tMax.length).toFixed(1)  : null,
      tMin:  b.tMin.length  ? +(b.tMin.reduce((s,v)=>s+v,0)/b.tMin.length).toFixed(1)  : null,
      precip:b.precip.length? +(b.precip.reduce((s,v)=>s+v,0)).toFixed(1)               : null,
      wind:  b.wind.length  ? +(b.wind.reduce((s,v)=>s+v,0)/b.wind.length).toFixed(1)   : null,
    }));
  }

  function renderClimateCharts(monthly, locName) {
    const labels = MONTHS;
    const tMax  = monthly.map(m => m.tMax);
    const tMin  = monthly.map(m => m.tMin);
    const prec  = monthly.map(m => m.precip);
    const wind  = monthly.map(m => m.wind);

    const chartConf = (ctx, ds, opts={}) => new Chart(ctx, {
      data: { labels, datasets: ds },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11} } } }, ...opts }
    });

    destroyChart('climTemp'); destroyChart('climPrecip'); destroyChart('climWind');

    setTimeout(() => {
      const c1 = document.getElementById('climTempChart');
      if (c1) charts['climTemp'] = chartConf(c1, [
        { type:'line', label:'Avg Max °C', data:tMax, borderColor:'#f85149', backgroundColor:'#f8514922', tension:0.4, fill:false },
        { type:'line', label:'Avg Min °C', data:tMin, borderColor:'#2196f3', backgroundColor:'#2196f322', tension:0.4, fill:false },
      ], { scales:{ x:{ ticks:{ color:'#8b949e' } }, y:{ ticks:{ color:'#8b949e' }, grid:{ color:'#30363d' } } } });

      const c2 = document.getElementById('climPrecipChart');
      if (c2) charts['climPrecip'] = chartConf(c2, [
        { type:'bar', label:'Total Rainfall mm', data:prec, backgroundColor:'#2196f366', borderColor:'#2196f3', borderRadius:4 },
      ], { scales:{ x:{ ticks:{ color:'#8b949e' } }, y:{ ticks:{ color:'#8b949e' }, grid:{ color:'#30363d' } } } });

      const c3 = document.getElementById('climWindChart');
      if (c3) charts['climWind'] = chartConf(c3, [
        { type:'line', label:'Avg Max Wind km/h', data:wind, borderColor:'#4fc3f7', backgroundColor:'#4fc3f722', tension:0.4, fill:true },
      ], { scales:{ x:{ ticks:{ color:'#8b949e' } }, y:{ ticks:{ color:'#8b949e' }, grid:{ color:'#30363d' } } } });
    }, 100);
  }

  function renderClimateSummary(monthly, locName) {
    const hottest = monthly.reduce((a, b, i) => (b.tMax > (monthly[a]?.tMax || -99) ? i : a), 0);
    const coldest = monthly.reduce((a, b, i) => (b.tMin < (monthly[a]?.tMin || 99) ? i : a), 0);
    const wettest = monthly.reduce((a, b, i) => ((b.precip||0) > (monthly[a]?.precip||0) ? i : a), 0);
    const driest  = monthly.reduce((a, b, i) => ((b.precip||0) < (monthly[a]?.precip||99999) ? i : a), 0);
    const annualPrecip = monthly.reduce((s,m) => s + (m.precip||0), 0).toFixed(0);
    const avgAnnualTemp = (monthly.reduce((s,m) => s + ((m.tMax||0)+(m.tMin||0))/2, 0)/12).toFixed(1);

    return `
    <div class="clim-summary">
      <h3><i class="fa fa-cloud-sun"></i> Climate Summary for ${locName}</h3>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:12px">Based on past 12 months of ERA5 reanalysis data</p>
      <div class="clim-kpi-grid">
        <div class="clim-kpi"><div class="clim-kpi-val">${avgAnnualTemp}°C</div><div class="clim-kpi-label">Annual Avg Temp</div></div>
        <div class="clim-kpi"><div class="clim-kpi-val">${annualPrecip}mm</div><div class="clim-kpi-label">Annual Rainfall</div></div>
        <div class="clim-kpi"><div class="clim-kpi-val" style="color:#f85149">${MONTHS[hottest]}</div><div class="clim-kpi-label">Hottest Month</div></div>
        <div class="clim-kpi"><div class="clim-kpi-val" style="color:#80deea">${MONTHS[coldest]}</div><div class="clim-kpi-label">Coldest Month</div></div>
        <div class="clim-kpi"><div class="clim-kpi-val" style="color:#2196f3">${MONTHS[wettest]}</div><div class="clim-kpi-label">Wettest Month</div></div>
        <div class="clim-kpi"><div class="clim-kpi-val" style="color:#ff9800">${MONTHS[driest]}</div><div class="clim-kpi-label">Driest Month</div></div>
      </div>
    </div>`;
  }

  async function render(query) {
    const container = document.getElementById('climateContent');
    container.innerHTML = `<div class="wx-loading"><div class="spinner"></div><p>Loading climate data for <b>${query}</b>…</p></div>`;
    try {
      // geocode
      const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, { headers:{'Accept-Language':'en'} });
      const gData = await gRes.json();
      if (!gData.length) throw new Error('Location not found');
      const lat = parseFloat(gData[0].lat), lon = parseFloat(gData[0].lon);
      const locName = gData[0].display_name.split(',').slice(0,2).join(', ');

      const hist = await fetchClimate30yr(lat, lon);
      const monthly = aggregateByMonth(hist.daily);

      container.innerHTML = `
        <div class="clim-header">
          <div class="clim-search-row">
            <input id="climInput" class="clim-search-input" value="${query}" placeholder="Search location…"/>
            <button id="climSearchBtn" class="btn-primary"><i class="fa fa-search"></i> Search</button>
          </div>
        </div>
        ${renderClimateSummary(monthly, locName)}
        <div class="clim-charts-grid">
          <div class="chart-card"><h3>🌡️ Monthly Temperature Range (°C)</h3><div style="height:200px"><canvas id="climTempChart"></canvas></div></div>
          <div class="chart-card"><h3>🌧️ Monthly Precipitation (mm)</h3><div style="height:200px"><canvas id="climPrecipChart"></canvas></div></div>
          <div class="chart-card"><h3>💨 Monthly Wind Speed (km/h)</h3><div style="height:200px"><canvas id="climWindChart"></canvas></div></div>
        </div>
        <div class="clim-table-wrap">
          <h3>📅 Monthly Normals Table</h3>
          <table class="clim-table">
            <thead><tr><th>Month</th><th>Avg Max °C</th><th>Avg Min °C</th><th>Rainfall mm</th><th>Wind km/h</th></tr></thead>
            <tbody>
              ${monthly.map((m,i) => `
                <tr>
                  <td><b>${MONTHS[i]}</b></td>
                  <td style="color:#f85149">${m.tMax ?? '—'}</td>
                  <td style="color:#2196f3">${m.tMin ?? '—'}</td>
                  <td style="color:#4fc3f7">${m.precip ?? '—'}</td>
                  <td>${m.wind ?? '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      renderClimateCharts(monthly, locName);
      bindClimateSearch();
    } catch(e) {
      container.innerHTML = `<div style="padding:12px"><div class="error-banner"><i class="fa fa-triangle-exclamation"></i> ${e.message}</div>
        <div class="clim-header"><div class="clim-search-row">
          <input id="climInput" class="clim-search-input" value="${query}" placeholder="Search location…"/>
          <button id="climSearchBtn" class="btn-primary"><i class="fa fa-search"></i> Search</button>
        </div></div></div>`;
      bindClimateSearch();
    }
  }

  function bindClimateSearch() {
    const btn = document.getElementById('climSearchBtn');
    const inp = document.getElementById('climInput');
    if (btn && inp) {
      btn.onclick = () => { const q = inp.value.trim(); if (q) render(q); };
      inp.onkeypress = e => { if (e.key==='Enter') btn.click(); };
    }
  }

  function init() {
    // default render on tab open is triggered by switchView
  }

  return { init, render };
})();
