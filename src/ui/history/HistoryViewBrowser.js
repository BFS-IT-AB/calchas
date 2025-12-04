/**
 * HistoryViewBrowser.js - Browserkompatible Version ohne ES6 Module
 * Zeigt historische Wetterdaten als Charts und Insights an
 */
(function (global) {
  "use strict";

  class HistoryView {
    constructor(options = {}) {
      this.containerId = options.containerId || "history-container";
      this.currentBucketSize = "day";
      this.historyData = null;
    }

    async render(rawHistory) {
      const container = document.querySelector(`#${this.containerId}`);
      if (!container) {
        console.warn(`[HistoryView] Container #${this.containerId} not found`);
        return;
      }

      // Check if we have data
      if (!rawHistory || rawHistory.length === 0) {
        this._renderEmpty(container);
        return;
      }

      this.historyData = rawHistory;
      this._renderView(container);
    }

    _renderEmpty(container) {
      container.innerHTML = `
        <div class="history-empty">
          <div class="history-empty__icon">📊</div>
          <h3 class="history-empty__title">Noch keine historischen Daten</h3>
          <p class="history-empty__text">
            Historische Wetterdaten werden automatisch gesammelt,
            sobald du die App regelmäßig nutzt.
          </p>
          <div class="history-empty__demo">
            <h4>Verfügbare Ansichten:</h4>
            <ul>
              <li>📈 Temperaturverlauf der letzten Tage/Wochen</li>
              <li>🌧️ Niederschlagsmengen im Zeitverlauf</li>
              <li>💡 Interessante Einsichten und Trends</li>
            </ul>
          </div>
        </div>
      `;
    }

    _renderView(container) {
      container.innerHTML = `
        <div class="history-view">
          <div class="history-control">
            <button class="history-btn history-btn--active" data-bucket="day">Tag</button>
            <button class="history-btn" data-bucket="week">Woche</button>
            <button class="history-btn" data-bucket="month">Monat</button>
          </div>

          <div class="history-charts">
            <div class="history-chart-card">
              <div class="history-chart-card__header">
                <h4>🌡️ Temperatur</h4>
                <span class="history-chart-card__legend">
                  <span class="history-chart-legend__item">
                    <span class="history-chart-legend__swatch history-chart-legend__swatch--band"></span>
                    Min/Max
                  </span>
                  <span class="history-chart-legend__item">
                    <span class="history-chart-legend__swatch history-chart-legend__swatch--avg"></span>
                    Durchschnitt
                  </span>
                </span>
              </div>
              <div id="history-temp-chart" class="history-chart-svg"></div>
            </div>
            <div class="history-chart-card">
              <div class="history-chart-card__header">
                <h4>🌧️ Niederschlag</h4>
                <span class="history-chart-card__legend">
                  <span class="history-chart-legend__item">
                    <span class="history-chart-legend__swatch history-chart-legend__swatch--precip"></span>
                    Tagesmenge
                  </span>
                </span>
              </div>
              <div id="history-precip-chart" class="history-chart-svg"></div>
            </div>
          </div>

          <div class="history-insights">
            <h4>💡 Einsichten</h4>
            <div id="history-insights-grid" class="insights-grid"></div>
          </div>
        </div>
      `;

      // Event Listeners für die Bucket-Buttons
      container.querySelectorAll(".history-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          container
            .querySelectorAll(".history-btn")
            .forEach((b) => b.classList.remove("history-btn--active"));
          e.target.classList.add("history-btn--active");
          this.currentBucketSize = e.target.dataset.bucket;
          this._updateCharts();
        });
      });

      this._updateCharts();
    }

    _updateCharts() {
      const aggregated = this._aggregateData();
      this._drawTemperatureChart(aggregated);
      this._drawPrecipitationChart(aggregated);
      this._drawInsights(aggregated);
    }

    _aggregateData() {
      if (!this.historyData || this.historyData.length === 0) {
        return [];
      }

      // Einfache Aggregation basierend auf bucket size
      const data = this.historyData;

      switch (this.currentBucketSize) {
        case "week":
          return this._aggregateByWeek(data);
        case "month":
          return this._aggregateByMonth(data);
        default:
          return this._aggregateByDay(data);
      }
    }

    _aggregateByDay(data) {
      // Gruppiere nach Tag
      const groups = {};
      data.forEach((entry) => {
        const date = new Date(entry.date || entry.timestamp);
        const key = date.toISOString().split("T")[0];
        if (!groups[key]) {
          groups[key] = { temps: [], precip: 0 };
        }
        if (entry.temp !== undefined) groups[key].temps.push(entry.temp);
        if (entry.precipitation !== undefined)
          groups[key].precip += entry.precipitation;
      });

      return Object.entries(groups)
        .map(([date, vals]) => ({
          label: new Date(date).toLocaleDateString("de-DE", {
            weekday: "short",
            day: "numeric",
          }),
          avgTemp:
            vals.temps.length > 0
              ? vals.temps.reduce((a, b) => a + b, 0) / vals.temps.length
              : null,
          minTemp: vals.temps.length > 0 ? Math.min(...vals.temps) : null,
          maxTemp: vals.temps.length > 0 ? Math.max(...vals.temps) : null,
          precip: vals.precip,
        }))
        .slice(-7);
    }

    _aggregateByWeek(data) {
      // Gruppiere nach Kalenderwoche
      const groups = {};
      data.forEach((entry) => {
        const date = new Date(entry.date || entry.timestamp);
        const week = this._getWeekNumber(date);
        const key = `${date.getFullYear()}-W${week}`;
        if (!groups[key]) {
          groups[key] = { temps: [], precip: 0, week };
        }
        if (entry.temp !== undefined) groups[key].temps.push(entry.temp);
        if (entry.precipitation !== undefined)
          groups[key].precip += entry.precipitation;
      });

      return Object.entries(groups)
        .map(([key, vals]) => ({
          label: `KW ${vals.week}`,
          avgTemp:
            vals.temps.length > 0
              ? vals.temps.reduce((a, b) => a + b, 0) / vals.temps.length
              : null,
          minTemp: vals.temps.length > 0 ? Math.min(...vals.temps) : null,
          maxTemp: vals.temps.length > 0 ? Math.max(...vals.temps) : null,
          precip: vals.precip,
        }))
        .slice(-4);
    }

    _aggregateByMonth(data) {
      // Gruppiere nach Monat
      const groups = {};
      data.forEach((entry) => {
        const date = new Date(entry.date || entry.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!groups[key]) {
          groups[key] = {
            temps: [],
            precip: 0,
            month: date.getMonth(),
            year: date.getFullYear(),
          };
        }
        if (entry.temp !== undefined) groups[key].temps.push(entry.temp);
        if (entry.precipitation !== undefined)
          groups[key].precip += entry.precipitation;
      });

      const monthNames = [
        "Jan",
        "Feb",
        "Mär",
        "Apr",
        "Mai",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dez",
      ];
      return Object.entries(groups)
        .map(([key, vals]) => ({
          label: monthNames[vals.month],
          avgTemp:
            vals.temps.length > 0
              ? vals.temps.reduce((a, b) => a + b, 0) / vals.temps.length
              : null,
          minTemp: vals.temps.length > 0 ? Math.min(...vals.temps) : null,
          maxTemp: vals.temps.length > 0 ? Math.max(...vals.temps) : null,
          precip: vals.precip,
        }))
        .slice(-6);
    }

    _getWeekNumber(date) {
      const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    }

    _drawTemperatureChart(data) {
      const container = document.getElementById("history-temp-chart");
      if (!container || data.length === 0) {
        if (container)
          container.innerHTML =
            '<p class="history-no-data">Keine Temperaturdaten verfügbar</p>';
        return;
      }

      const width = container.clientWidth || 300;
      const height = 150;
      const padding = { top: 20, right: 20, bottom: 30, left: 40 };

      const temps = data
        .flatMap((d) => [d.minTemp, d.maxTemp, d.avgTemp])
        .filter((t) => t !== null);
      const minVal = Math.min(...temps) - 2;
      const maxVal = Math.max(...temps) + 2;

      const xScale = (i) =>
        padding.left +
        (i / (data.length - 1 || 1)) * (width - padding.left - padding.right);
      const yScale = (v) =>
        height -
        padding.bottom -
        ((v - minVal) / (maxVal - minVal)) *
          (height - padding.top - padding.bottom);

      // Band Path (min to max)
      let bandPath = "";
      data.forEach((d, i) => {
        if (d.minTemp !== null && d.maxTemp !== null) {
          const x = xScale(i);
          if (i === 0) bandPath += `M${x},${yScale(d.maxTemp)}`;
          else bandPath += `L${x},${yScale(d.maxTemp)}`;
        }
      });
      for (let i = data.length - 1; i >= 0; i--) {
        const d = data[i];
        if (d.minTemp !== null) {
          bandPath += `L${xScale(i)},${yScale(d.minTemp)}`;
        }
      }
      bandPath += "Z";

      // Average line
      let avgPath = "";
      data.forEach((d, i) => {
        if (d.avgTemp !== null) {
          const x = xScale(i);
          const y = yScale(d.avgTemp);
          if (i === 0 || avgPath === "") avgPath += `M${x},${y}`;
          else avgPath += `L${x},${y}`;
        }
      });

      // X-Axis labels
      const labels = data
        .map(
          (d, i) =>
            `<text x="${xScale(i)}" y="${
              height - 8
            }" text-anchor="middle" class="chart-label">${d.label}</text>`
        )
        .join("");

      // Y-Axis
      const yTicks = 5;
      const yLabels = Array.from({ length: yTicks }, (_, i) => {
        const val = minVal + (i / (yTicks - 1)) * (maxVal - minVal);
        return `<text x="${padding.left - 8}" y="${
          yScale(val) + 4
        }" text-anchor="end" class="chart-label">${Math.round(val)}°</text>`;
      }).join("");

      container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="tempBandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:var(--color-temp-warm, #ff6b6b);stop-opacity:0.4"/>
              <stop offset="100%" style="stop-color:var(--color-temp-cool, #4dabf7);stop-opacity:0.4"/>
            </linearGradient>
          </defs>
          <path d="${bandPath}" fill="url(#tempBandGradient)" stroke="none"/>
          <path d="${avgPath}" fill="none" stroke="var(--color-accent, #ffd43b)" stroke-width="2" stroke-linecap="round"/>
          ${labels}
          ${yLabels}
        </svg>
      `;
    }

    _drawPrecipitationChart(data) {
      const container = document.getElementById("history-precip-chart");
      if (!container || data.length === 0) {
        if (container)
          container.innerHTML =
            '<p class="history-no-data">Keine Niederschlagsdaten verfügbar</p>';
        return;
      }

      const width = container.clientWidth || 300;
      const height = 120;
      const padding = { top: 10, right: 20, bottom: 30, left: 40 };

      const maxPrecip = Math.max(...data.map((d) => d.precip), 1);
      const barWidth = Math.max(
        8,
        (width - padding.left - padding.right) / data.length - 4
      );

      const bars = data
        .map((d, i) => {
          const x =
            padding.left +
            (i / data.length) * (width - padding.left - padding.right) +
            barWidth / 4;
          const barHeight =
            (d.precip / maxPrecip) * (height - padding.top - padding.bottom);
          const y = height - padding.bottom - barHeight;
          return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
                rx="4" fill="var(--color-rain, #74c0fc)" opacity="0.8"/>
          <text x="${x + barWidth / 2}" y="${
            height - 8
          }" text-anchor="middle" class="chart-label">${d.label}</text>
        `;
        })
        .join("");

      container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          ${bars}
          <text x="${padding.left - 8}" y="${
        padding.top + 10
      }" text-anchor="end" class="chart-label">${Math.round(maxPrecip)}mm</text>
          <text x="${padding.left - 8}" y="${
        height - padding.bottom
      }" text-anchor="end" class="chart-label">0</text>
        </svg>
      `;
    }

    _drawInsights(data) {
      const container = document.getElementById("history-insights-grid");
      if (!container) return;

      if (data.length === 0) {
        container.innerHTML =
          '<p class="history-no-data">Keine Daten für Einsichten verfügbar</p>';
        return;
      }

      const avgTemps = data
        .filter((d) => d.avgTemp !== null)
        .map((d) => d.avgTemp);
      const totalPrecip = data.reduce((sum, d) => sum + (d.precip || 0), 0);
      const avgTemp =
        avgTemps.length > 0
          ? avgTemps.reduce((a, b) => a + b, 0) / avgTemps.length
          : null;
      const maxTemp = Math.max(
        ...data.filter((d) => d.maxTemp !== null).map((d) => d.maxTemp)
      );
      const minTemp = Math.min(
        ...data.filter((d) => d.minTemp !== null).map((d) => d.minTemp)
      );

      const insights = [];

      if (avgTemp !== null) {
        insights.push({
          icon: "🌡️",
          label: "Durchschnitt",
          value: `${avgTemp.toFixed(1)}°C`,
        });
      }

      if (maxTemp !== -Infinity) {
        insights.push({
          icon: "🔥",
          label: "Maximum",
          value: `${maxTemp.toFixed(1)}°C`,
        });
      }

      if (minTemp !== Infinity) {
        insights.push({
          icon: "❄️",
          label: "Minimum",
          value: `${minTemp.toFixed(1)}°C`,
        });
      }

      insights.push({
        icon: "💧",
        label: "Niederschlag gesamt",
        value: `${totalPrecip.toFixed(1)} mm`,
      });

      container.innerHTML = insights
        .map(
          (insight) => `
        <div class="insight-card">
          <span class="insight-card__icon">${insight.icon}</span>
          <span class="insight-card__label">${insight.label}</span>
          <span class="insight-card__value">${insight.value}</span>
        </div>
      `
        )
        .join("");
    }
  }

  // Expose to global scope
  global.HistoryView = HistoryView;
})(window);
