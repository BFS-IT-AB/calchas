/**
 * HistoryViewBrowser.js - Weather History & Insights
 * Clean, focused design with three views:
 * 1. Dashboard (Bento Grid) - Quick overview cards
 * 2. Comparison - Temperature deviation vs average
 * 3. Calendar - Color-coded calendar view
 */
(function (global) {
  "use strict";

  class HistoryView {
    constructor(options = {}) {
      this.containerId = options.containerId || "history-container";
      this.currentTab = "dashboard";
      this.historyData = [];
      this.currentCalendarDate = new Date();
      this.comparisonMonth1 = this._getPreviousMonth(1);
      this.comparisonMonth2 = this._getPreviousMonth(2);
      this.comparisonMetric = "temperature";
      this.selectedCalendarDay = null;
    }

    _getPreviousMonth(monthsAgo) {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      return { year: d.getFullYear(), month: d.getMonth() };
    }

    async render(rawHistory) {
      const container = document.querySelector(`#${this.containerId}`);
      if (!container) return;

      this.historyData = rawHistory || [];

      // If no data provided, try to load it directly
      if (this.historyData.length === 0) {
        this._renderLoading(container);
        await this._loadHistoricalData();
      }

      if (this.historyData.length === 0) {
        this._renderEmpty(container);
        return;
      }

      this._renderView(container);
    }

    _renderLoading(container) {
      container.innerHTML = `
        <div class="hv">
          <header class="hv-header">
            <div class="hv-tabs">
              <button class="hv-tab hv-tab--active">Dashboard</button>
              <button class="hv-tab">Vergleich</button>
              <button class="hv-tab">Kalender</button>
            </div>
          </header>
          <div class="hv-empty">
            <div class="hv-loading-spinner"></div>
            <h3>Wetterdaten werden geladen...</h3>
            <p>Die historischen Daten werden abgerufen.</p>
          </div>
        </div>
      `;
    }

    async _loadHistoricalData() {
      try {
        // Get coordinates from appState or use Berlin as default
        const lat = window.appState?.currentCoordinates?.lat ?? 52.52;
        const lon = window.appState?.currentCoordinates?.lon ?? 13.405;

        const today = new Date();
        const oneYearAgo = new Date(
          today.getTime() - 365 * 24 * 60 * 60 * 1000
        );
        const startDate = oneYearAgo.toISOString().split("T")[0];
        const endDate = today.toISOString().split("T")[0];

        console.log(
          "[HistoryView] Loading data from",
          startDate,
          "to",
          endDate
        );

        // Direct API call to Open-Meteo Archive
        const url = new URL("https://archive-api.open-meteo.com/v1/archive");
        url.searchParams.set("latitude", lat);
        url.searchParams.set("longitude", lon);
        url.searchParams.set("start_date", startDate);
        url.searchParams.set("end_date", endDate);
        url.searchParams.set(
          "daily",
          [
            "temperature_2m_min",
            "temperature_2m_max",
            "precipitation_sum",
            "windspeed_10m_max",
            "relative_humidity_2m_mean",
          ].join(",")
        );
        url.searchParams.set("timezone", "auto");

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();

        if (data.daily && data.daily.time) {
          this.historyData = data.daily.time.map((date, idx) => ({
            date,
            temp_min: data.daily.temperature_2m_min[idx],
            temp_max: data.daily.temperature_2m_max[idx],
            precip: data.daily.precipitation_sum[idx] || 0,
            wind_speed: data.daily.windspeed_10m_max[idx],
            humidity: data.daily.relative_humidity_2m_mean[idx],
          }));

          console.log("[HistoryView] Loaded", this.historyData.length, "days");
        }
      } catch (error) {
        console.error("[HistoryView] Failed to load historical data:", error);
      }
    }

    _renderEmpty(container) {
      container.innerHTML = `
        <div class="hv">
          <header class="hv-header">
            <h1 class="hv-title">Historie & Insights</h1>
          </header>
          <div class="hv-empty">
            <div class="hv-empty__icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 3v18h18"/>
                <path d="M7 16l4-4 4 4 5-6"/>
              </svg>
            </div>
            <h3>Wetterdaten werden geladen...</h3>
            <p>Die historischen Daten werden abgerufen.</p>
          </div>
        </div>
      `;
    }

    _renderView(container) {
      container.innerHTML = `
        <div class="hv">
          <header class="hv-header">
            <div class="hv-tabs">
              <button class="hv-tab ${
                this.currentTab === "dashboard" ? "hv-tab--active" : ""
              }" data-tab="dashboard">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="4" rx="1"/>
                  <rect x="14" y="10" width="7" height="11" rx="1"/>
                  <rect x="3" y="13" width="7" height="8" rx="1"/>
                </svg>
                Dashboard
              </button>
              <button class="hv-tab ${
                this.currentTab === "comparison" ? "hv-tab--active" : ""
              }" data-tab="comparison">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M7 12l4-4 4 4 5-6"/>
                </svg>
                Vergleich
              </button>
              <button class="hv-tab ${
                this.currentTab === "calendar" ? "hv-tab--active" : ""
              }" data-tab="calendar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                </svg>
                Kalender
              </button>
            </div>
          </header>
          <div class="hv-content">
            ${this._renderTabContent()}
          </div>
        </div>
      `;
      this._attachEventListeners(container);
    }

    _renderTabContent() {
      switch (this.currentTab) {
        case "dashboard":
          return this._renderDashboard();
        case "comparison":
          return this._renderComparison();
        case "calendar":
          return this._renderCalendar();
        default:
          return this._renderDashboard();
      }
    }

    // ========== DASHBOARD (BENTO GRID) ==========
    _renderDashboard() {
      const stats = this._calculateStats();
      const last30Days = this._getLast30DaysData();
      const rainfall = last30Days.reduce((sum, d) => sum + (d.precip || 0), 0);
      const avgWind = this._average(
        last30Days.map((d) => d.wind_speed).filter(Boolean)
      );
      const insight = this._generateInsight(stats);

      return `
        <div class="hv-dashboard">
          <!-- Top Row: Two small cards -->
          <div class="hv-bento-row">
            <div class="hv-card hv-card--small">
              <div class="hv-card__header">
                <span class="hv-card__title">Niederschlag</span>
              </div>
              <div class="hv-card__body">
                <div class="hv-metric">
                  <svg class="hv-metric__icon hv-metric__icon--rain" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                  </svg>
                  <div class="hv-metric__value">${rainfall.toFixed(
                    0
                  )}<span class="hv-metric__unit">mm</span></div>
                </div>
                <span class="hv-card__subtitle">Letzte 30 Tage</span>
              </div>
            </div>

            <div class="hv-card hv-card--small">
              <div class="hv-card__header">
                <span class="hv-card__title">Windtrends</span>
              </div>
              <div class="hv-card__body">
                <div class="hv-metric">
                  <svg class="hv-metric__icon hv-metric__icon--wind" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
                  </svg>
                  <div class="hv-metric__value">${avgWind.toFixed(
                    0
                  )}<span class="hv-metric__unit">km/h</span></div>
                </div>
                <span class="hv-card__subtitle">Ø Durchschnitt</span>
              </div>
            </div>
          </div>

          <!-- Temperature Trend Card (Large) -->
          <div class="hv-card hv-card--large">
            <div class="hv-card__header">
              <span class="hv-card__title">Temperatur</span>
            </div>
            <div class="hv-card__body">
              ${this._renderTrendChart(last30Days)}

              <!-- AI Insight -->
              <div class="hv-insight">
                <div class="hv-insight__badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  AI Insight
                </div>
                <div class="hv-insight__text">
                  <strong>${insight.title}</strong>
                  <span>${insight.description}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Row: Two metric cards -->
          <div class="hv-bento-row">
            <div class="hv-card hv-card--metric">
              <div class="hv-card__icon-box hv-card__icon-box--aqi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div class="hv-card__info">
                <span class="hv-card__label">Luftfeuchtigkeit</span>
                <span class="hv-card__value-inline">${stats.avgHumidity.toFixed(
                  0
                )}%</span>
              </div>
            </div>

            <div class="hv-card hv-card--metric">
              <div class="hv-card__icon-box hv-card__icon-box--solar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              </div>
              <div class="hv-card__info">
                <span class="hv-card__label">Sonnige Tage</span>
                <span class="hv-card__value-inline">${stats.sunnyDays}</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Row -->
          <div class="hv-quick-stats">
            <div class="hv-stat">
              <span class="hv-stat__label">Max. Temp</span>
              <span class="hv-stat__value hv-stat__value--hot">${stats.maxTemp.toFixed(
                1
              )}°</span>
            </div>
            <div class="hv-stat">
              <span class="hv-stat__label">Min. Temp</span>
              <span class="hv-stat__value hv-stat__value--cold">${stats.minTemp.toFixed(
                1
              )}°</span>
            </div>
            <div class="hv-stat">
              <span class="hv-stat__label">Ø Temp</span>
              <span class="hv-stat__value">${stats.avgTemp.toFixed(1)}°</span>
            </div>
            <div class="hv-stat">
              <span class="hv-stat__label">Regentage</span>
              <span class="hv-stat__value">${stats.rainyDays}</span>
            </div>
          </div>
        </div>
      `;
    }

    _renderTrendChart(data) {
      if (!data || data.length === 0) {
        return `<div class="hv-chart-empty">Keine Daten verfügbar</div>`;
      }

      const width = 320;
      const height = 140;
      const padding = { top: 20, right: 10, bottom: 25, left: 35 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const temps = data
        .flatMap((d) => [d.temp_min, d.temp_max])
        .filter((t) => t != null);
      const minT = Math.floor(Math.min(...temps) - 2);
      const maxT = Math.ceil(Math.max(...temps) + 2);
      const range = maxT - minT || 10;

      const xScale = (i) =>
        padding.left + (i / (data.length - 1 || 1)) * chartW;
      const yScale = (v) =>
        padding.top + chartH - ((v - minT) / range) * chartH;

      // Build gradient area path
      let areaPath = `M${xScale(0)},${yScale(data[0]?.temp_max || 0)}`;
      data.forEach((d, i) => {
        if (d.temp_max != null)
          areaPath += ` L${xScale(i)},${yScale(d.temp_max)}`;
      });
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].temp_min != null)
          areaPath += ` L${xScale(i)},${yScale(data[i].temp_min)}`;
      }
      areaPath += " Z";

      // Build line paths
      let maxLine = "";
      let minLine = "";
      data.forEach((d, i) => {
        const x = xScale(i);
        if (d.temp_max != null) {
          maxLine += (maxLine ? " L" : "M") + `${x},${yScale(d.temp_max)}`;
        }
        if (d.temp_min != null) {
          minLine += (minLine ? " L" : "M") + `${x},${yScale(d.temp_min)}`;
        }
      });

      // Y-axis labels
      const yLabels = [minT, minT + range / 2, maxT]
        .map(
          (v) =>
            `<text x="${padding.left - 8}" y="${
              yScale(v) + 4
            }" class="hv-chart-label">${Math.round(v)}°</text>`
        )
        .join("");

      // X-axis labels (first, middle, last)
      const xLabels = [0, Math.floor(data.length / 2), data.length - 1]
        .filter((i, idx, arr) => arr.indexOf(i) === idx)
        .map((i) => {
          const d = new Date(data[i]?.date);
          return `<text x="${xScale(i)}" y="${
            height - 5
          }" class="hv-chart-label">${d.getDate()}.${d.getMonth() + 1}</text>`;
        })
        .join("");

      return `
        <svg class="hv-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FF6B6B" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#4ECDC4" stop-opacity="0.4"/>
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          ${[0, 0.5, 1]
            .map(
              (p) =>
                `<line x1="${padding.left}" y1="${
                  padding.top + chartH * (1 - p)
                }" x2="${width - padding.right}" y2="${
                  padding.top + chartH * (1 - p)
                }" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`
            )
            .join("")}

          <!-- Area fill -->
          <path d="${areaPath}" fill="url(#tempGradient)"/>

          <!-- Lines -->
          <path d="${maxLine}" fill="none" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round"/>
          <path d="${minLine}" fill="none" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/>

          <!-- Labels -->
          ${yLabels}
          ${xLabels}
        </svg>
        <div class="hv-chart-legend">
          <span class="hv-legend-item"><span class="hv-legend-dot hv-legend-dot--max"></span>Höchst</span>
          <span class="hv-legend-item"><span class="hv-legend-dot hv-legend-dot--min"></span>Tiefst</span>
        </div>
      `;
    }

    // ========== COMPARISON VIEW ==========
    _renderComparison() {
      const month1Data = this._getMonthData(this.comparisonMonth1);
      const month2Data = this._getMonthData(this.comparisonMonth2);
      const avgData = this._calculateYearlyAverage();

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
      const monthNamesFull = [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
      ];

      const m1Label = `${monthNamesFull[this.comparisonMonth1.month]} ${
        this.comparisonMonth1.year
      }`;
      const m2Label = `${monthNamesFull[this.comparisonMonth2.month]} ${
        this.comparisonMonth2.year
      }`;

      return `
        <div class="hv-comparison">
          <div class="hv-comparison__header">
            <h2 class="hv-comparison__title">Temperaturabweichung vs Jahresdurchschnitt</h2>
            <div class="hv-comparison__selectors">
              <div class="hv-month-selector">
                <label class="hv-month-selector__label">Monat 1</label>
                <div class="hv-month-buttons">
                  <button class="hv-month-btn hv-month-btn--prev" data-selector="month1-prev">←</button>
                  <span class="hv-month-display" id="month1-display">${this._formatMonthDisplay(this.comparisonMonth1)}</span>
                  <button class="hv-month-btn hv-month-btn--next" data-selector="month1-next">→</button>
                </div>
              </div>
              <div class="hv-month-selector">
                <label class="hv-month-selector__label">Monat 2</label>
                <div class="hv-month-buttons">
                  <button class="hv-month-btn hv-month-btn--prev" data-selector="month2-prev">←</button>
                  <span class="hv-month-display" id="month2-display">${this._formatMonthDisplay(this.comparisonMonth2)}</span>
                  <button class="hv-month-btn hv-month-btn--next" data-selector="month2-next">→</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Deviation Chart -->
          <div class="hv-comparison__chart">
            ${this._renderDeviationChart(
              month1Data,
              month2Data,
              avgData,
              m1Label,
              m2Label
            )}
          </div>

          <!-- Comparison Cards -->
          <div class="hv-comparison__cards">
            <div class="hv-comp-card">
              <div class="hv-comp-card__icon">🌡️</div>
              <div class="hv-comp-card__content">
                <span class="hv-comp-card__title">Max Temp</span>
                <div class="hv-comp-card__values">
                  <span class="hv-comp-card__value">${this._getMaxTemp(
                    month1Data
                  ).toFixed(1)}°C</span>
                  <span class="hv-comp-card__vs">vs</span>
                  <span class="hv-comp-card__value">${this._getMaxTemp(
                    month2Data
                  ).toFixed(1)}°C</span>
                </div>
                <span class="hv-comp-card__labels">${
                  monthNames[this.comparisonMonth1.month]
                } ${this.comparisonMonth1.year} | ${
        monthNames[this.comparisonMonth2.month]
      } ${this.comparisonMonth2.year}</span>
              </div>
            </div>

            <div class="hv-comp-card">
              <div class="hv-comp-card__icon">💧</div>
              <div class="hv-comp-card__content">
                <span class="hv-comp-card__title">Niederschlag</span>
                <div class="hv-comp-card__values">
                  <span class="hv-comp-card__value">${this._getTotalPrecip(
                    month1Data
                  ).toFixed(0)}mm</span>
                  <span class="hv-comp-card__vs">vs</span>
                  <span class="hv-comp-card__value">${this._getTotalPrecip(
                    month2Data
                  ).toFixed(0)}mm</span>
                </div>
                <span class="hv-comp-card__labels">${
                  monthNames[this.comparisonMonth1.month]
                } ${this.comparisonMonth1.year} | ${
        monthNames[this.comparisonMonth2.month]
      } ${this.comparisonMonth2.year}</span>
              </div>
            </div>
          </div>

          <!-- Metric Toggle -->
          <div class="hv-comparison__toggle">
            <span>Metrik wechseln:</span>
            <label class="hv-toggle">
              <span class="${
                this.comparisonMetric === "temperature"
                  ? "hv-toggle__label--active"
                  : ""
              }">Temperatur</span>
              <input type="checkbox" id="metric-toggle" ${
                this.comparisonMetric === "precipitation" ? "checked" : ""
              }>
              <span class="hv-toggle__slider"></span>
              <span class="${
                this.comparisonMetric === "precipitation"
                  ? "hv-toggle__label--active"
                  : ""
              }">Niederschlag</span>
            </label>
          </div>
        </div>
      `;
    }

    _renderMonthOptions(selected) {
      // This function is deprecated - use _formatMonthDisplay instead
      return "";
    }

    _formatMonthDisplay(monthObj) {
      const monthNames = [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
      ];
      return `${monthNames[monthObj.month]} ${monthObj.year}`;
    }

    _changeMonth(selector, direction) {
      const monthObj = selector === "month1"
        ? this.comparisonMonth1
        : this.comparisonMonth2;

      const newDate = new Date(monthObj.year, monthObj.month + direction, 1);
      const newMonth = {
        year: newDate.getFullYear(),
        month: newDate.getMonth(),
      };

      if (selector === "month1") {
        this.comparisonMonth1 = newMonth;
      } else {
        this.comparisonMonth2 = newMonth;
      }
    }

    _renderDeviationChart(month1Data, month2Data, avgData, m1Label, m2Label) {
      const width = 340;
      const height = 200;
      const padding = { top: 30, right: 20, bottom: 40, left: 45 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      // Aggregate data by day of month - choose metric
      const maxDays = 31;
      let m1Values, m2Values, avgValue, yLabel, unit, minVal, maxVal;

      if (this.comparisonMetric === "precipitation") {
        m1Values = this._aggregatePrecipByDay(month1Data);
        m2Values = this._aggregatePrecipByDay(month2Data);
        avgValue = avgData.avgPrecip || 0;
        yLabel = "Niederschlag (mm)";
        unit = "mm";
      } else {
        m1Values = this._aggregateByDay(month1Data);
        m2Values = this._aggregateByDay(month2Data);
        avgValue = avgData.avgTemp;
        yLabel = "Temperatur (°C)";
        unit = "°";
      }

      const allValues = [...m1Values, ...m2Values].filter((v) => v != null);
      if (allValues.length === 0) {
        return `<div class="hv-chart-empty">Keine Daten für den Vergleich</div>`;
      }

      minVal = Math.floor(Math.min(...allValues, avgValue) - 3);
      maxVal = Math.ceil(Math.max(...allValues, avgValue) + 3);
      const range = maxVal - minVal || 10;

      const xScale = (i) => padding.left + (i / (maxDays - 1)) * chartW;
      const yScale = (v) =>
        padding.top + chartH - ((v - minVal) / range) * chartH;

      // Build line paths
      let m1Line = "";
      let m2Line = "";

      for (let i = 0; i < maxDays; i++) {
        if (m1Values[i] != null) {
          m1Line +=
            (m1Line ? " L" : "M") + `${xScale(i)},${yScale(m1Values[i])}`;
        }
        if (m2Values[i] != null) {
          m2Line +=
            (m2Line ? " L" : "M") + `${xScale(i)},${yScale(m2Values[i])}`;
        }
      }

      // Average line
      const avgY = yScale(avgValue);

      return `
        <svg class="hv-chart hv-chart--comparison" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <!-- Grid -->
          ${[0, 0.25, 0.5, 0.75, 1]
            .map(
              (p) =>
                `<line x1="${padding.left}" y1="${
                  padding.top + chartH * (1 - p)
                }" x2="${width - padding.right}" y2="${
                  padding.top + chartH * (1 - p)
                }" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`
            )
            .join("")}

          <!-- Average line -->
          <line x1="${padding.left}" y1="${avgY}" x2="${
        width - padding.right
      }" y2="${avgY}"
                stroke="#FFD93D" stroke-width="2" stroke-dasharray="6,4" opacity="0.8"/>
          <text x="${width - padding.right + 5}" y="${
        avgY + 4
      }" class="hv-chart-label hv-chart-label--avg">Ø Jahr</text>

          <!-- Month lines -->
          <path d="${m1Line}" fill="none" stroke="#FF6B6B" stroke-width="2.5" stroke-linecap="round"/>
          <path d="${m2Line}" fill="none" stroke="#4ECDC4" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Y axis labels -->
          ${[minVal, minVal + range / 2, maxVal]
            .map(
              (v) =>
                `<text x="${padding.left - 8}" y="${
                  yScale(v) + 4
                }" class="hv-chart-label">${Math.round(v)}${unit}</text>`
            )
            .join("")}

          <!-- X axis labels -->
          ${[1, 10, 20, 31]
            .map(
              (d) =>
                `<text x="${xScale(d - 1)}" y="${
                  height - 10
                }" class="hv-chart-label">${d}</text>`
            )
            .join("")}
        </svg>
        <div class="hv-chart-legend hv-chart-legend--comparison">
          <span class="hv-legend-item"><span class="hv-legend-line hv-legend-line--m1"></span>${m1Label}</span>
          <span class="hv-legend-item"><span class="hv-legend-line hv-legend-line--m2"></span>${m2Label}</span>
          <span class="hv-legend-item"><span class="hv-legend-line hv-legend-line--avg"></span>Jahresdurchschnitt</span>
        </div>
      `;
    }

    // ========== CALENDAR VIEW ==========
    _renderCalendar() {
      const date = this.currentCalendarDate;
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNames = [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
        "Dezember",
      ];
      const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDayOfWeek = firstDay.getDay();

      const days = [];

      // Previous month days
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        days.push({
          day: prevMonthLastDay - i,
          isOtherMonth: true,
          date: null,
        });
      }

      // Current month days
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const currentDate = new Date(year, month, d);
        const dateStr = currentDate.toISOString().split("T")[0];
        const weather = this._getWeatherForDate(dateStr);
        days.push({
          day: d,
          isOtherMonth: false,
          date: dateStr,
          weather,
          isToday: this._isToday(currentDate),
        });
      }

      // Next month days
      const remaining = 42 - days.length;
      for (let d = 1; d <= remaining; d++) {
        days.push({ day: d, isOtherMonth: true, date: null });
      }

      // Selected day details
      const selectedWeather = this.selectedCalendarDay
        ? this._getWeatherForDate(this.selectedCalendarDay)
        : null;

      return `
        <div class="hv-calendar">
          <div class="hv-calendar__header">
            <h2 class="hv-calendar__title">Visualisierung</h2>
          </div>

          <div class="hv-calendar__nav">
            <button class="hv-calendar__nav-btn" data-nav="prev">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <h3 class="hv-calendar__month">${monthNames[month]} ${year}</h3>
            <button class="hv-calendar__nav-btn" data-nav="next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          <div class="hv-calendar__grid">
            <div class="hv-calendar__weekdays">
              ${dayNames.map((d) => `<span>${d}</span>`).join("")}
            </div>
            <div class="hv-calendar__days">
              ${days.map((d) => this._renderCalendarDay(d)).join("")}
            </div>
          </div>

          ${
            selectedWeather
              ? this._renderDayPopup(this.selectedCalendarDay, selectedWeather)
              : ""
          }

          <!-- Bottom Metrics Sheet -->
          <div class="hv-calendar__sheet">
            <div class="hv-sheet__handle"></div>
            <div class="hv-sheet__tabs">
              <button class="hv-sheet__tab hv-sheet__tab--active" data-metric="temperature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
                </svg>
                Temperatur
              </button>
              <button class="hv-sheet__tab" data-metric="precipitation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                Niederschlag
              </button>
              <button class="hv-sheet__tab" data-metric="confidence">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                Konfidenz
              </button>
            </div>
          </div>
        </div>
      `;
    }

    _renderCalendarDay(dayData) {
      const classes = ["hv-cal-day"];
      if (dayData.isOtherMonth) classes.push("hv-cal-day--other");
      if (dayData.isToday) classes.push("hv-cal-day--today");
      if (dayData.date === this.selectedCalendarDay)
        classes.push("hv-cal-day--selected");

      // Color based on temperature
      let bgColor = "";
      if (dayData.weather && !dayData.isOtherMonth) {
        const avgTemp =
          ((dayData.weather.temp_max || 0) + (dayData.weather.temp_min || 0)) /
          2;
        bgColor = this._getTempColor(avgTemp);
        if (dayData.weather.precip > 1) {
          classes.push("hv-cal-day--rainy");
        }
      }

      const style =
        bgColor && !dayData.isOtherMonth
          ? `style="background: ${bgColor}"`
          : "";

      return `
        <div class="${classes.join(" ")}" ${style} ${
        dayData.date ? `data-date="${dayData.date}"` : ""
      }>
          <span class="hv-cal-day__num">${dayData.day}</span>
        </div>
      `;
    }

    _renderDayPopup(dateStr, weather) {
      const date = new Date(dateStr);
      const dayName = date.toLocaleDateString("de-DE", { weekday: "short" });
      const dayNum = date.getDate();

      return `
        <div class="hv-day-popup">
          <div class="hv-day-popup__header">
            <span class="hv-day-popup__day">${dayName} ${dayNum}</span>
            <button class="hv-day-popup__close" data-close-popup>×</button>
          </div>
          <div class="hv-day-popup__content">
            <span class="hv-day-popup__temp">${
              weather.temp_max?.toFixed(1) || "—"
            }°C</span>
            <span class="hv-day-popup__desc">${this._getWeatherDescription(
              weather
            )}</span>
          </div>
        </div>
      `;
    }

    _getTempColor(temp) {
      // Temperature to color gradient
      if (temp <= -10) return "rgba(30, 60, 114, 0.7)";
      if (temp <= 0) return "rgba(66, 165, 245, 0.6)";
      if (temp <= 10) return "rgba(77, 182, 172, 0.5)";
      if (temp <= 15) return "rgba(129, 199, 132, 0.5)";
      if (temp <= 20) return "rgba(255, 213, 79, 0.5)";
      if (temp <= 25) return "rgba(255, 167, 38, 0.6)";
      if (temp <= 30) return "rgba(255, 112, 67, 0.6)";
      return "rgba(239, 83, 80, 0.7)";
    }

    _getWeatherDescription(weather) {
      if (weather.precip > 5) return "Regnerisch";
      if (weather.precip > 0.5) return "Leichter Regen";
      if (weather.temp_min < 0) return "Frostig";
      if (weather.temp_max > 25) return "Sonnig";
      return "Bewölkt";
    }

    // ========== DATA HELPERS ==========
    _calculateStats() {
      const last30 = this._getLast30DaysData();
      const temps = last30
        .flatMap((d) => [d.temp_min, d.temp_max])
        .filter((t) => t != null);
      const humidities = last30.map((d) => d.humidity).filter(Boolean);

      let sunnyDays = 0;
      let rainyDays = 0;
      last30.forEach((d) => {
        if (d.precip > 1) rainyDays++;
        else if (d.humidity < 70) sunnyDays++;
      });

      return {
        maxTemp: temps.length ? Math.max(...temps) : 0,
        minTemp: temps.length ? Math.min(...temps) : 0,
        avgTemp: this._average(temps),
        avgHumidity: this._average(humidities),
        sunnyDays,
        rainyDays,
      };
    }

    _getLast30DaysData() {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return this.historyData
        .filter((d) => {
          const date = new Date(d.date);
          return date >= thirtyDaysAgo && date <= now;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    _getMonthData(monthObj) {
      return this.historyData
        .filter((d) => {
          const date = new Date(d.date);
          return (
            date.getFullYear() === monthObj.year &&
            date.getMonth() === monthObj.month
          );
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    _calculateYearlyAverage() {
      const temps = this.historyData
        .flatMap((d) => [d.temp_min, d.temp_max])
        .filter((t) => t != null);
      const precips = this.historyData
        .map((d) => d.precip || 0)
        .filter((p) => p != null);
      return {
        avgTemp: this._average(temps),
        avgPrecip: this._average(precips),
      };
    }

    _aggregateByDay(data) {
      const byDay = new Array(31).fill(null);
      data.forEach((d) => {
        const day = new Date(d.date).getDate() - 1;
        if (day >= 0 && day < 31) {
          const avg = ((d.temp_max || 0) + (d.temp_min || 0)) / 2;
          byDay[day] = avg;
        }
      });
      return byDay;
    }

    _aggregatePrecipByDay(data) {
      const byDay = new Array(31).fill(null);
      data.forEach((d) => {
        const day = new Date(d.date).getDate() - 1;
        if (day >= 0 && day < 31) {
          byDay[day] = d.precip || 0;
        }
      });
      return byDay;
    }

    _getMaxTemp(data) {
      const temps = data.map((d) => d.temp_max).filter(Boolean);
      return temps.length ? Math.max(...temps) : 0;
    }

    _getTotalPrecip(data) {
      return data.reduce((sum, d) => sum + (d.precip || 0), 0);
    }

    _getWeatherForDate(dateStr) {
      return this.historyData.find((d) => d.date === dateStr) || null;
    }

    _average(arr) {
      if (!arr || arr.length === 0) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    _isToday(date) {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }

    _generateInsight(stats) {
      const now = new Date();
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
      const currentMonth = monthNames[now.getMonth()];
      const year = now.getFullYear();

      // Calculate deviation from yearly average
      const yearlyAvg = this._calculateYearlyAverage().avgTemp;
      const deviation = stats.avgTemp - yearlyAvg;
      const sign = deviation >= 0 ? "+" : "";

      return {
        title: `${currentMonth} ${year}: ${sign}${deviation.toFixed(1)}°C vs Ø`,
        description:
          deviation > 1
            ? "Überdurchschnittlich warm"
            : deviation < -1
            ? "Unterdurchschnittlich kühl"
            : "Im Durchschnittsbereich",
      };
    }

    // ========== EVENT HANDLERS ==========
    _attachEventListeners(container) {
      // Tab navigation
      container.querySelectorAll(".hv-tab").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.currentTab = e.currentTarget.dataset.tab;
          this._renderView(container);
        });
      });

      // Calendar navigation
      container.querySelectorAll(".hv-calendar__nav-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const dir = e.currentTarget.dataset.nav;
          const current = this.currentCalendarDate;
          if (dir === "prev") {
            this.currentCalendarDate = new Date(
              current.getFullYear(),
              current.getMonth() - 1,
              1
            );
          } else {
            this.currentCalendarDate = new Date(
              current.getFullYear(),
              current.getMonth() + 1,
              1
            );
          }
          this._renderView(container);
        });
      });

      // Calendar day click
      container.querySelectorAll(".hv-cal-day[data-date]").forEach((day) => {
        day.addEventListener("click", (e) => {
          const dateStr = e.currentTarget.dataset.date;
          this.selectedCalendarDay =
            this.selectedCalendarDay === dateStr ? null : dateStr;
          this._renderView(container);
        });
      });

      // Close popup
      const closeBtn = container.querySelector("[data-close-popup]");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.selectedCalendarDay = null;
          this._renderView(container);
        });
      }

      // Month selector buttons (Comparison view)
      const monthButtons = container.querySelectorAll(".hv-month-btn");
      monthButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const selector = e.currentTarget.dataset.selector;
          const [month, direction] = selector.includes("prev")
            ? [selector.replace("-prev", ""), -1]
            : [selector.replace("-next", ""), 1];

          this._changeMonth(month, direction);
          this._renderView(container);
        });
      });

      // Metric toggle
      const metricToggle = container.querySelector("#metric-toggle");
      if (metricToggle) {
        metricToggle.addEventListener("change", (e) => {
          this.comparisonMetric = e.target.checked
            ? "precipitation"
            : "temperature";
          this._renderView(container);
        });
      }
    }
  }

  global.HistoryView = HistoryView;
})(window);
