/**
 * weather.js – Live Weather Module
 * APIs: Open-Meteo (free, no key) + OpenWeatherMap geocoding via Nominatim
 */
'use strict';

const WeatherModule = (() => {

  const OWM_GEO  = 'https://nominatim.openstreetmap.org/search';
  const OM_BASE  = 'https://api.open-meteo.com/v1';
  const AIR_BASE = 'https://air-quality-api.open-meteo.com/v1';

  const WMO_CODES = {
    0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Foggy', 48:'Icy fog', 51:'Light drizzle', 53:'Moderate drizzle',
    55:'Dense drizzle', 61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain',
    71:'Slight snow', 73:'Moderate snow', 75:'Heavy snow', 77:'Snow grains',
    80:'Slight showers', 81:'Moderate showers', 82:'Violent showers',
    85:'Slight snow showers', 86:'Heavy snow showers',
    95:'Thunderstorm', 96:'Thunderstorm + hail', 99:'Heavy thunderstorm + hail',
  };

  const WMO_ICON = {
    0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
    45:'🌫️', 48:'🌫️', 51:'🌦️', 53:'🌦️', 55:'🌧️',
    61:'🌧️', 63:'🌧️', 65:'🌧️', 71:'🌨️', 73:'🌨️', 75:'❄️',
    77:'🌨️', 80:'🌦️', 81:'🌦️', 82:'⛈️', 85:'🌨️', 86:'❄️',
    95:'⛈️', 96:'⛈️', 99:'⛈️',
  };

  const UV_LABEL = v => v < 3 ? {l:'Low',c:'#3fb950'} : v < 6 ? {l:'Moderate',c:'#d29922'} : v < 8 ? {l:'High',c:'#ff9800'} : v < 11 ? {l:'Very High',c:'#f85149'} : {l:'Extreme',c:'#9c27b0'};

  const AQI_LABEL = v => v <= 50 ? {l:'Good',c:'#3fb950'} : v <= 100 ? {l:'Moderate',c:'#d29922'} : v <= 150 ? {l:'Unhealthy for sensitive',c:'#ff9800'} : v <= 200 ? {l:'Unhealthy',c:'#f85149'} : v <= 300 ? {l:'Very Unhealthy',c:'#9c27b0'} : {l:'Hazardous',c:'#f85149'};

  const WIND_DIR = deg => { const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']; return dirs[Math.round(deg/22.5)%16]; };

  let currentCoords = null;
  let charts = {};

  function destroyChart(k) { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }

  // ── geocode ──────────────────────────────────────
  async function geocode(query) {
    const params = `?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(OWM_GEO + params, { headers: { 'Accept-Language':'en' } });
    const data = await res.json();
    if (!data.length) throw new Error('Location not found');
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name.split(',').slice(0,2).join(', ') };
  }

  // ── fetch weather ─────────────────────────────────
  async function fetchWeather(lat, lon) {
    const url = `${OM_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset` +
      `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m` +
      `&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    return res.json();
  }

  // ── fetch air quality ─────────────────────────────
  async function fetchAirQuality(lat, lon) {
    const url = `${AIR_BASE}/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone` +
      `&hourly=european_aqi&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  }

  // ── render current weather card ───────────────────
  function renderCurrent(data, name) {
    const c = data.current;
    const wmo = c.weather_code;
    const icon = WMO_ICON[wmo] || '🌡️';
    const desc = WMO_CODES[wmo] || 'Unknown';
    const uv = UV_LABEL(c.uv_index || 0);
    const isDay = c.is_day;

    return `
    <div class="wx-current-card">
      <div class="wx-current-top">
        <div class="wx-location"><i class="fa fa-location-dot"></i> ${name}</div>
        <div class="wx-badge ${isDay ? 'day' : 'night'}">${isDay ? '☀️ Day' : '🌙 Night'}</div>
      </div>
      <div class="wx-main">
        <div class="wx-icon-big">${icon}</div>
        <div class="wx-temp-big">${Math.round(c.temperature_2m)}°C</div>
        <div class="wx-feel">Feels like ${Math.round(c.apparent_temperature)}°C</div>
        <div class="wx-desc">${desc}</div>
      </div>
      <div class="wx-grid">
        <div class="wx-cell"><i class="fa fa-droplet"></i><span>${c.relative_humidity_2m}%</span><label>Humidity</label></div>
        <div class="wx-cell"><i class="fa fa-wind"></i><span>${Math.round(c.wind_speed_10m)} km/h ${WIND_DIR(c.wind_direction_10m)}</span><label>Wind</label></div>
        <div class="wx-cell"><i class="fa fa-gauge-high"></i><span>${Math.round(c.pressure_msl)} hPa</span><label>Pressure</label></div>
        <div class="wx-cell"><i class="fa fa-eye"></i><span>${c.visibility ? (c.visibility/1000).toFixed(1)+'km' : '—'}</span><label>Visibility</label></div>
        <div class="wx-cell"><i class="fa fa-cloud-rain"></i><span>${c.precipitation} mm</span><label>Precip</label></div>
        <div class="wx-cell"><span style="color:${uv.c};font-weight:700">${c.uv_index?.toFixed(1) || '—'}</span><label>UV Index <span style="color:${uv.c}">(${uv.l})</span></label></div>
      </div>
    </div>`;
  }

  // ── render 7-day forecast ─────────────────────────
  function renderForecast(data) {
    const d = data.daily;
    const days = d.time.map((t, i) => {
      const date = new Date(t);
      const dow = date.toLocaleDateString('en-US', { weekday:'short' });
      const dayStr = date.toLocaleDateString('en-US', { month:'short', day:'numeric' });
      const icon = WMO_ICON[d.weather_code[i]] || '🌡️';
      const desc = WMO_CODES[d.weather_code[i]] || '';
      const sunrise = d.sunrise[i]?.slice(11,16) || '—';
      const sunset  = d.sunset[i]?.slice(11,16) || '—';
      return `
        <div class="wx-day-card ${i===0?'today':''}">
          <div class="wx-day-header">${i===0?'Today':dow}<br/><span class="text-muted" style="font-size:0.72rem">${dayStr}</span></div>
          <div class="wx-day-icon">${icon}</div>
          <div class="wx-day-desc">${desc}</div>
          <div class="wx-day-temps"><span class="wx-hi">${Math.round(d.temperature_2m_max[i])}°</span><span class="wx-lo">${Math.round(d.temperature_2m_min[i])}°</span></div>
          <div class="wx-day-meta"><i class="fa fa-cloud-rain"></i>${d.precipitation_sum[i]}mm &nbsp; <i class="fa fa-wind"></i>${Math.round(d.wind_speed_10m_max[i])}km/h</div>
          <div class="wx-day-sun">🌅${sunrise} 🌇${sunset}</div>
        </div>`;
    }).join('');
    return `<div class="wx-forecast-strip">${days}</div>`;
  }

  // ── render hourly chart ───────────────────────────
  function renderHourlyChart(data) {
    const h = data.hourly;
    const now = new Date();
    const startIdx = h.time.findIndex(t => new Date(t) >= now);
    const slice = 24;
    const labels = h.time.slice(startIdx, startIdx+slice).map(t => t.slice(11,16));
    const temps  = h.temperature_2m.slice(startIdx, startIdx+slice);
    const precip = h.precipitation_probability.slice(startIdx, startIdx+slice);

    destroyChart('wxHourly');
    setTimeout(() => {
      const ctx = document.getElementById('wxHourlyChart');
      if (!ctx) return;
      charts['wxHourly'] = new Chart(ctx, {
        data: {
          labels,
          datasets: [
            { type:'line', label:'Temp °C', data:temps, borderColor:'#f85149', backgroundColor:'#f8514922', tension:0.4, yAxisID:'y', fill:true, pointRadius:2 },
            { type:'bar',  label:'Rain %',  data:precip, backgroundColor:'#2196f344', borderColor:'#2196f3', yAxisID:'y1', borderRadius:2 },
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'#8b949e', font:{size:11} } } },
          scales:{
            x:{ ticks:{ color:'#8b949e', font:{size:10}, maxRotation:0 } },
            y:{ ticks:{ color:'#f85149', font:{size:10} }, position:'left', title:{ display:true, text:'°C', color:'#f85149' } },
            y1:{ ticks:{ color:'#2196f3', font:{size:10} }, position:'right', grid:{ drawOnChartArea:false }, max:100, title:{ display:true, text:'%', color:'#2196f3' } }
          }
        }
      });
    }, 100);
    return `<div class="wx-chart-card"><h3>Next 24h Temperature & Rain Probability</h3><div style="height:180px"><canvas id="wxHourlyChart"></canvas></div></div>`;
  }

  // ── render air quality ────────────────────────────
  function renderAirQuality(aq) {
    if (!aq || !aq.current) return '';
    const c = aq.current;
    const aqi = Math.round(c.european_aqi);
    const label = AQI_LABEL(aqi);
    return `
    <div class="wx-aq-card">
      <div class="wx-aq-header"><i class="fa fa-wind"></i> Air Quality</div>
      <div class="wx-aq-main">
        <div class="wx-aq-value" style="color:${label.c}">${aqi}</div>
        <div class="wx-aq-label" style="color:${label.c}">${label.l}</div>
        <div class="wx-aq-bar"><div class="wx-aq-fill" style="width:${Math.min(aqi/500*100,100)}%;background:${label.c}"></div></div>
      </div>
      <div class="wx-aq-grid">
        <div class="wx-aq-item"><label>PM2.5</label><span>${c.pm2_5?.toFixed(1)||'—'} µg/m³</span></div>
        <div class="wx-aq-item"><label>PM10</label><span>${c.pm10?.toFixed(1)||'—'} µg/m³</span></div>
        <div class="wx-aq-item"><label>NO₂</label><span>${c.nitrogen_dioxide?.toFixed(1)||'—'} µg/m³</span></div>
        <div class="wx-aq-item"><label>O₃</label><span>${c.ozone?.toFixed(1)||'—'} µg/m³</span></div>
      </div>
    </div>`;
  }

  // ── main render ───────────────────────────────────
  async function render(query) {
    const container = document.getElementById('weatherContent');
    container.innerHTML = `<div class="wx-loading"><div class="spinner"></div><p>Fetching weather for <b>${query}</b>…</p></div>`;
    try {
      const loc = await geocode(query);
      currentCoords = loc;
      const [wx, aq] = await Promise.all([
        fetchWeather(loc.lat, loc.lon),
        fetchAirQuality(loc.lat, loc.lon)
      ]);
      container.innerHTML = `
        <div class="wx-layout">
          <div class="wx-left">
            ${renderCurrent(wx, loc.name)}
            ${renderAirQuality(aq)}
          </div>
          <div class="wx-right">
            ${renderForecast(wx)}
            ${renderHourlyChart(wx)}
          </div>
        </div>`;
      document.getElementById('wxSearchInput').value = query;
    } catch(e) {
      container.innerHTML = `<div class="error-banner"><i class="fa fa-triangle-exclamation"></i> ${e.message}</div>`;
    }
  }

  function init() {
    const searchBtn = document.getElementById('wxSearchBtn');
    const searchInput = document.getElementById('wxSearchInput');
    const locBtn = document.getElementById('wxLocBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const q = searchInput.value.trim();
        if (q) render(q);
      });
    }
    if (searchInput) {
      searchInput.addEventListener('keypress', e => { if (e.key==='Enter') searchBtn?.click(); });
    }
    if (locBtn) {
      locBtn.addEventListener('click', () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async pos => {
          const { latitude:lat, longitude:lon } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const d = await res.json();
          const name = d.address?.city || d.address?.town || d.address?.village || `${lat.toFixed(2)},${lon.toFixed(2)}`;
          render(name);
        }, () => toast('Location access denied.', 'error'));
      });
    }
  }

  return { init, render };
})();
