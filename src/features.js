/**
 * features.js - Makes all extra features functional
 * Maps, Alerts, Historical Charts, Analytics
 */

// ============================================
// 1. LEAFLET MAPS INTEGRATION
// ============================================

class WeatherMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.marker = null;
  }

  init(lat, lng, cityName) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Clear existing map completely
    if (this.map) {
      try {
        this.map.remove();
        this.map = null;
        this.marker = null;
      } catch (e) {
        console.warn('Map cleanup warning:', e);
      }
    }

    // Clear container HTML to reset Leaflet state
    container.innerHTML = '';

    // Initialize Leaflet map
    try {
      this.map = L.map(this.containerId).setView([lat, lng], 10);

      // Add OSM tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
      }).addTo(this.map);

      // Add marker
      this.marker = L.marker([lat, lng]).addTo(this.map);
      this.marker.bindPopup(`<b>${cityName}</b><br>Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`).openPopup();

      console.log('✅ Map initialized:', cityName);
    } catch (e) {
      console.error('❌ Map initialization failed:', e);
      container.innerHTML = `<p style="color: red; padding: 20px;">Karte konnte nicht geladen werden: ${e.message}</p>`;
    }
  }

  updateLocation(lat, lng, cityName) {
    if (!this.map) {
      this.init(lat, lng, cityName);
      return;
    }

    this.map.setView([lat, lng], 10);
    
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.marker.setPopupContent(`<b>${cityName}</b><br>Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
      this.marker.bindPopup(`<b>${cityName}</b><br>Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`).openPopup();
    }
  }
}

// ============================================
// 2. WEATHER ALERTS (MeteoAlarm-style)
// ============================================

class WeatherAlerts {
  constructor(containerId) {
    this.containerId = containerId;
  }

  async fetchAlerts(lat, lng, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = '<p style="padding: 20px; text-align: center;">🔄 Lade Wetterwarnungen...</p>';

    try {
      // Simulate MeteoAlarm data (in production, use real API)
      // For now, check Open-Meteo for severe weather codes
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,weathercode&timezone=auto`
      );

      if (!response.ok) throw new Error('API Fehler');

      const data = await response.json();
      const alerts = this.analyzeWeatherData(data, city);

      this.renderAlerts(alerts, city);
    } catch (e) {
      console.error('Alerts fetch error:', e);
      container.innerHTML = `<p style="color: #666; padding: 20px; text-align: center;">⚠️ Keine Warnungen verfügbar (${e.message})</p>`;
    }
  }

  analyzeWeatherData(data, city) {
    const alerts = [];
    const current = data.current || {};
    const hourly = data.hourly || {};

    // Check for extreme conditions
    if (current.windspeed_10m > 60) {
      alerts.push({
        severity: 'red',
        icon: '🌪️',
        title: 'Sturmwarnung',
        description: `Sehr starker Wind mit ${current.windspeed_10m.toFixed(0)} km/h erwartet.`,
        time: new Date().toLocaleString('de-DE')
      });
    } else if (current.windspeed_10m > 40) {
      alerts.push({
        severity: 'orange',
        icon: '💨',
        title: 'Windwarnung',
        description: `Starker Wind mit ${current.windspeed_10m.toFixed(0)} km/h.`,
        time: new Date().toLocaleString('de-DE')
      });
    }

    // Check temperature extremes
    if (current.temperature_2m > 35) {
      alerts.push({
        severity: 'orange',
        icon: '🔥',
        title: 'Hitzewarnung',
        description: `Sehr hohe Temperaturen (${current.temperature_2m.toFixed(1)}°C).`,
        time: new Date().toLocaleString('de-DE')
      });
    } else if (current.temperature_2m < -10) {
      alerts.push({
        severity: 'orange',
        icon: '❄️',
        title: 'Kältewarnung',
        description: `Sehr niedrige Temperaturen (${current.temperature_2m.toFixed(1)}°C).`,
        time: new Date().toLocaleString('de-DE')
      });
    }

    // Check for severe weather codes
    const weathercode = current.weathercode;
    if ([95, 96, 99].includes(weathercode)) {
      alerts.push({
        severity: 'red',
        icon: '⛈️',
        title: 'Gewitterwarnung',
        description: 'Gewitter mit Starkregen möglich.',
        time: new Date().toLocaleString('de-DE')
      });
    } else if ([82, 86].includes(weathercode)) {
      alerts.push({
        severity: 'orange',
        icon: '🌧️',
        title: 'Starkregenwarnung',
        description: 'Starker Regen erwartet.',
        time: new Date().toLocaleString('de-DE')
      });
    }

    return alerts;
  }

  renderAlerts(alerts, city) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('Alerts container not found:', this.containerId);
      return;
    }

    if (!Array.isArray(alerts) || alerts.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #d4edda; border-radius: 8px; color: #155724;">
          <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
          <h3 style="margin: 0 0 8px 0;">Keine aktuellen Warnungen</h3>
          <p style="margin: 0;">Für ${city} liegen derzeit keine Wetterwarnungen vor.</p>
        </div>
      `;
      console.log('✅ No alerts for', city);
      return;
    }

    const html = alerts.map(alert => `
      <div class="alert-card alert-${alert.severity}" style="
        padding: 16px;
        margin-bottom: 16px;
        border-left: 4px solid ${alert.severity === 'red' ? '#dc3545' : alert.severity === 'orange' ? '#fd7e14' : '#ffc107'};
        background: ${alert.severity === 'red' ? '#f8d7da' : alert.severity === 'orange' ? '#fff3cd' : '#d1ecf1'};
        border-radius: 8px;
      ">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="font-size: 2rem;">${alert.icon}</div>
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #000;">${alert.title}</h3>
            <p style="margin: 0 0 8px 0; color: #333;">${alert.description}</p>
            <small style="color: #666;">Zeitpunkt: ${alert.time}</small>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <p style="font-weight: 600; color: #dc3545;">⚠️ ${alerts.length} aktive Warnung(en) für ${city}</p>
      </div>
      ${html}
    `;
  }
}

// ============================================
// 3. HISTORICAL WEATHER CHARTS
// ============================================

class HistoricalChart {
  constructor(containerId) {
    this.containerId = containerId;
    this.chart = null;
  }

  async fetchAndRender(lat, lng, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = '<p style="padding: 20px; text-align: center;">📊 Lade historische Daten...</p>';

    try {
      // Fetch last 7 days from Open-Meteo Archive
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1); // Yesterday (archive data is delayed)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 8); // 8 days ago

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      console.log(`Fetching historical data: ${start} to ${end}`);

      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.renderChart(data, city);
    } catch (e) {
      console.error('Historical data error:', e);
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
          <p style="color: #666; margin: 0;">📈 Historische Daten nicht verfügbar</p>
          <small style="color: #999;">${e.message}</small>
        </div>
      `;
    }
  }

  renderChart(data, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '<canvas id="historical-canvas" style="max-height: 400px;"></canvas>';

    const canvas = document.getElementById('historical-canvas');
    if (!canvas) return;

    const daily = data.daily || {};
    const labels = (daily.time || []).map(d => {
      const date = new Date(d);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
    });

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Create chart
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Max Temp (°C)',
            data: daily.temperature_2m_max || [],
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.3
          },
          {
            label: 'Min Temp (°C)',
            data: daily.temperature_2m_min || [],
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Temperaturverlauf - ${city} (Letzte 7 Tage)`
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Temperatur (°C)'
            }
          }
        }
      }
    });
  }
}

// ============================================
// 4. ANALYTICS MODULE
// ============================================

class Analytics {
  constructor() {
    this.events = this.loadEvents();
    // Enable by default if not set
    const savedSetting = localStorage.getItem('wetter_analytics_enabled');
    this.enabled = savedSetting === null ? true : savedSetting === 'true';
    if (savedSetting === null) {
      localStorage.setItem('wetter_analytics_enabled', 'true');
    }
  }

  loadEvents() {
    try {
      return JSON.parse(localStorage.getItem('wetter_analytics_events') || '[]');
    } catch (e) {
      return [];
    }
  }

  saveEvents() {
    try {
      localStorage.setItem('wetter_analytics_events', JSON.stringify(this.events));
    } catch (e) {
      console.warn('Analytics save failed:', e);
    }
  }

  logEvent(type, data = {}) {
    if (!this.enabled) return;

    this.events.push({
      type,
      data,
      timestamp: Date.now()
    });

    if (this.events.length > 1000) {
      this.events = this.events.slice(-500); // Keep last 500
    }

    this.saveEvents();
  }

  getStats() {
    const searches = this.events.filter(e => e.type === 'search').length;
    const apiCalls = this.events.filter(e => e.type === 'api_call').length;
    const cacheHits = this.events.filter(e => e.type === 'cache_hit').length;
    const favActions = this.events.filter(e => e.type === 'favorite_action').length;

    return { searches, apiCalls, cacheHits, favActions, total: this.events.length };
  }

  exportData() {
    return JSON.stringify({
      events: this.events,
      stats: this.getStats(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = this.getStats();

    container.innerHTML = `
      <div style="padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px;">📊 Nutzungsstatistiken</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #007BFF;">${stats.searches}</div>
            <div style="color: #666; margin-top: 8px;">Suchanfragen</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #28a745;">${stats.apiCalls}</div>
            <div style="color: #666; margin-top: 8px;">API Calls</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #ffc107;">${stats.cacheHits}</div>
            <div style="color: #666; margin-top: 8px;">Cache Hits</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #17a2b8;">${stats.favActions}</div>
            <div style="color: #666; margin-top: 8px;">Favoriten</div>
          </div>
        </div>
        <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="analytics-toggle" ${this.enabled ? 'checked' : ''} 
                   style="width: 20px; height: 20px; cursor: pointer;">
            <span>Analytics aktiviert (Daten werden nur lokal gespeichert)</span>
          </label>
        </div>
      </div>
      <button id="export-analytics-btn" class="btn-secondary" style="margin-top: 16px;">📥 Analytics exportieren (JSON)</button>
    `;

    // Wire up toggle
    const toggle = document.getElementById('analytics-toggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        this.enabled = e.target.checked;
        localStorage.setItem('wetter_analytics_enabled', String(this.enabled));
        console.log('Analytics:', this.enabled ? 'enabled' : 'disabled');
      });
    }

    // Wire up export
    const exportBtn = document.getElementById('export-analytics-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = this.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wetter-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }
}

// Export globally
window.WeatherMap = WeatherMap;
window.WeatherAlerts = WeatherAlerts;
window.HistoricalChart = HistoricalChart;
window.Analytics = Analytics;
