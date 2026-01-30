/**
 * HistoryStats.js - Statistics & Modal Templates for History Page
 *
 * Handles all statistics calculations, insights generation,
 * and modal content rendering for the history feature.
 *
 * MetricCard Design: Matches Health-Page styling for visual consistency.
 * GOLDENE REGEL: All modals use Glass-Tokens und Swift-Easing.
 *
 * @module ui/history/components/HistoryStats
 * @version 1.1.0
 */
(function (global) {
  "use strict";

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    CLIMATE_NORMALS: {
      january: { avgTemp: 0.6, precip: 42.3, sunshine: 44.7 },
      february: { avgTemp: 1.4, precip: 33.3, sunshine: 73.5 },
      march: { avgTemp: 5.1, precip: 40.5, sunshine: 120.2 },
      april: { avgTemp: 9.6, precip: 37.1, sunshine: 159.3 },
      may: { avgTemp: 14.4, precip: 53.8, sunshine: 220.8 },
      june: { avgTemp: 17.4, precip: 68.7, sunshine: 222.6 },
      july: { avgTemp: 19.5, precip: 55.5, sunshine: 217.8 },
      august: { avgTemp: 19.0, precip: 58.2, sunshine: 205.8 },
      september: { avgTemp: 14.7, precip: 45.1, sunshine: 152.2 },
      october: { avgTemp: 9.8, precip: 37.3, sunshine: 108.3 },
      november: { avgTemp: 5.0, precip: 43.8, sunshine: 53.4 },
      december: { avgTemp: 1.5, precip: 55.3, sunshine: 37.7 },
    },
    MONTH_NAMES: [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ],
    MONTH_LABELS_DE: [
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
    ],
  };

  // ============================================
  // METRIC CARD TEMPLATES (Health-Page Parity)
  // ============================================

  /**
   * Generate a MetricCard matching the Health-Page design
   * @param {Object} options - Card configuration
   * @returns {string} - HTML string
   */
  function renderMetricCard(options) {
    const {
      icon,
      label,
      value,
      unit = "",
      trend = null, // 'up', 'down', or null
      trendValue = null, // e.g., '+2.3°'
      subtitle = null,
      colorClass = "", // e.g., 'metric-card--warm', 'metric-card--cold'
      onClick = null, // data attribute for click handler
    } = options;

    const trendHTML = trend
      ? `
      <span class="metric-card__trend metric-card__trend--${trend}">
        <span class="material-symbols-outlined">${trend === "up" ? "trending_up" : "trending_down"}</span>
        ${trendValue || ""}
      </span>
    `
      : "";

    const subtitleHTML = subtitle
      ? `
      <span class="metric-card__subtitle">${subtitle}</span>
    `
      : "";

    const clickAttr = onClick ? `data-action="${onClick}"` : "";
    const clickableClass = onClick ? "metric-card--clickable" : "";

    return `
      <div class="metric-card history-metric-card ${colorClass} ${clickableClass}" ${clickAttr}>
        <div class="metric-card__icon-wrap">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <div class="metric-card__content">
          <span class="metric-card__label">${label}</span>
          <span class="metric-card__value">${value}<span class="metric-card__unit">${unit}</span></span>
          ${subtitleHTML}
          ${trendHTML}
        </div>
      </div>
    `;
  }

  /**
   * Generate a grid of statistics cards from calculated stats
   * Uses MetricCard design from Health-Page
   */
  function renderStatsGrid(stats, comparisonStats = null, month = 0) {
    if (!stats)
      return '<div class="stats-grid--empty">Keine Daten verfügbar</div>';

    const normals =
      CONFIG.CLIMATE_NORMALS[CONFIG.MONTH_NAMES[month]] ||
      CONFIG.CLIMATE_NORMALS.january;

    // Calculate trends if comparison available
    const calcTrend = (current, previous) => {
      if (previous === null || current === null)
        return { trend: null, value: null };
      const diff = current - previous;
      return {
        trend: diff > 0 ? "up" : diff < 0 ? "down" : null,
        value: diff !== 0 ? (diff > 0 ? "+" : "") + diff.toFixed(1) : null,
      };
    };

    const tempTrend = comparisonStats
      ? calcTrend(stats.avgTemp, comparisonStats.avgTemp)
      : {};
    const precipTrend = comparisonStats
      ? calcTrend(stats.totalPrecip, comparisonStats.totalPrecip)
      : {};

    // Temperature anomaly color
    const tempAnomaly =
      stats.avgTemp !== null ? stats.avgTemp - normals.avgTemp : 0;
    const tempColorClass =
      tempAnomaly > 2
        ? "metric-card--warm"
        : tempAnomaly < -2
          ? "metric-card--cold"
          : "";

    const cards = [
      renderMetricCard({
        icon: "device_thermostat",
        label: "Durchschnitt",
        value: stats.avgTemp?.toFixed(1) ?? "–",
        unit: "°C",
        colorClass: tempColorClass,
        trend: tempTrend.trend,
        trendValue: tempTrend.value ? tempTrend.value + "°" : null,
        subtitle: `Klimamittel: ${normals.avgTemp.toFixed(1)}°`,
      }),
      renderMetricCard({
        icon: "thermostat_auto",
        label: "Max / Min",
        value: `${stats.maxTemp?.toFixed(1) ?? "–"} / ${stats.minTemp?.toFixed(1) ?? "–"}`,
        unit: "°C",
        subtitle: `Spanne: ${stats.tempRange?.toFixed(1) ?? "–"}°`,
      }),
      renderMetricCard({
        icon: "water_drop",
        label: "Niederschlag",
        value: stats.totalPrecip?.toFixed(1) ?? "0",
        unit: " mm",
        trend: precipTrend.trend,
        trendValue: precipTrend.value ? precipTrend.value + " mm" : null,
        subtitle: `${stats.rainDays} Regentage`,
      }),
      renderMetricCard({
        icon: "air",
        label: "Windspitze",
        value: stats.maxWind?.toFixed(0) ?? "–",
        unit: " km/h",
        subtitle: `Ø ${stats.avgWind?.toFixed(1) ?? "–"} km/h`,
      }),
      renderMetricCard({
        icon: "wb_sunny",
        label: "Sonnenstunden",
        value: stats.totalSunshine?.toFixed(0) ?? "0",
        unit: " h",
        subtitle: `${stats.sunnyDays} sonnige Tage`,
      }),
      renderMetricCard({
        icon: "ac_unit",
        label: "Frosttage",
        value: stats.frostDays,
        unit: "",
        colorClass: stats.frostDays > 10 ? "metric-card--cold" : "",
        subtitle: `${stats.iceDays} Eistage`,
      }),
    ];

    return `
      <div class="history-stats-grid">
        ${cards.join("")}
      </div>
    `;
  }

  /**
   * Render extremes timeline with clickable cards
   */
  function renderExtremesTimeline(extremes, onClick = "open-extreme") {
    if (!extremes)
      return '<div class="extremes-timeline--empty">Keine Extremwerte gefunden</div>';

    const formatExtreme = (data, type, icon, title, valueExtractor) => {
      if (!data) return null;
      const date = new Date(data.date);
      const value = valueExtractor(data);

      return {
        type,
        icon,
        title,
        value,
        date: data.date,
        dateFormatted: date.toLocaleDateString("de-DE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        data,
      };
    };

    const items = [
      formatExtreme(
        extremes.hottestDay,
        "hot",
        "local_fire_department",
        "Heißester Tag",
        (d) => `${d.temp_max?.toFixed(1) ?? "–"}°C`,
      ),
      formatExtreme(
        extremes.coldestDay,
        "cold",
        "ac_unit",
        "Kältester Tag",
        (d) => `${d.temp_min?.toFixed(1) ?? "–"}°C`,
      ),
      formatExtreme(
        extremes.wettestDay,
        "rain",
        "rainy",
        "Nassester Tag",
        (d) => `${d.precip?.toFixed(1) ?? "0"} mm`,
      ),
      formatExtreme(
        extremes.windiestDay,
        "wind",
        "storm",
        "Stürmischster Tag",
        (d) => `${d.wind_speed?.toFixed(0) ?? "–"} km/h`,
      ),
    ].filter(Boolean);

    return `
      <div class="history-extremes-timeline">
        ${items
          .map(
            (item, index) => `
          <button class="extreme-card" data-action="${onClick}" data-extreme-type="${item.type}" data-extreme-date="${item.date}">
            <div class="extreme-card__timeline">
              <div class="extreme-card__dot extreme-card__dot--${item.type}">
                <span class="material-symbols-outlined">${item.icon}</span>
              </div>
              ${index < items.length - 1 ? '<div class="extreme-card__line"></div>' : ""}
            </div>
            <div class="extreme-card__content">
              <span class="extreme-card__title">${item.title}</span>
              <span class="extreme-card__value">${item.value}</span>
              <span class="extreme-card__date">${item.dateFormatted}</span>
            </div>
            <span class="extreme-card__arrow material-symbols-outlined">chevron_right</span>
          </button>
        `,
          )
          .join("")}
      </div>
    `;
  }

  // ============================================
  // STATISTICS CALCULATIONS
  // ============================================

  /**
   * Calculate comprehensive statistics from weather data
   */
  function calculateStats(data) {
    if (!data || data.length === 0) return getEmptyStats();

    const validTemps = data.filter((d) => d.temp_avg !== null);
    const validMinTemps = data.filter((d) => d.temp_min !== null);
    const validMaxTemps = data.filter((d) => d.temp_max !== null);
    const validPrecip = data.filter((d) => d.precip !== null);
    const validWind = data.filter((d) => d.wind_speed !== null);
    const validHumidity = data.filter((d) => d.humidity !== null);
    const validSunshine = data.filter((d) => d.sunshine !== null);

    return {
      // Temperature stats
      avgTemp: validTemps.length
        ? validTemps.reduce((s, d) => s + d.temp_avg, 0) / validTemps.length
        : null,
      maxTemp: validMaxTemps.length
        ? Math.max(...validMaxTemps.map((d) => d.temp_max))
        : null,
      minTemp: validMinTemps.length
        ? Math.min(...validMinTemps.map((d) => d.temp_min))
        : null,
      tempRange:
        validMaxTemps.length && validMinTemps.length
          ? Math.max(...validMaxTemps.map((d) => d.temp_max)) -
            Math.min(...validMinTemps.map((d) => d.temp_min))
          : null,

      // Frost analysis
      frostDays: validMinTemps.filter((d) => d.temp_min < 0).length,
      iceDays: validMaxTemps.filter((d) => d.temp_max < 0).length,
      tropicalNights: validMinTemps.filter((d) => d.temp_min >= 20).length,
      hotDays: validMaxTemps.filter((d) => d.temp_max >= 30).length,
      summerDays: validMaxTemps.filter((d) => d.temp_max >= 25).length,

      // Precipitation stats
      totalPrecip: validPrecip.reduce((s, d) => s + d.precip, 0),
      avgPrecip: validPrecip.length
        ? validPrecip.reduce((s, d) => s + d.precip, 0) / validPrecip.length
        : 0,
      maxPrecip: validPrecip.length
        ? Math.max(...validPrecip.map((d) => d.precip))
        : 0,
      rainDays: validPrecip.filter((d) => d.precip >= 0.1).length,
      heavyRainDays: validPrecip.filter((d) => d.precip >= 10).length,
      dryDays: validPrecip.filter((d) => d.precip < 0.1).length,

      // Wind stats
      avgWind: validWind.length
        ? validWind.reduce((s, d) => s + d.wind_speed, 0) / validWind.length
        : 0,
      maxWind: validWind.length
        ? Math.max(...validWind.map((d) => d.wind_speed))
        : 0,
      stormDays: validWind.filter((d) => d.wind_speed >= 62).length,
      windyDays: validWind.filter((d) => d.wind_speed >= 39).length,
      calmDays: validWind.filter((d) => d.wind_speed < 12).length,

      // Humidity stats
      avgHumidity: validHumidity.length
        ? validHumidity.reduce((s, d) => s + d.humidity, 0) /
          validHumidity.length
        : null,
      maxHumidity: validHumidity.length
        ? Math.max(...validHumidity.map((d) => d.humidity))
        : null,
      minHumidity: validHumidity.length
        ? Math.min(...validHumidity.map((d) => d.humidity))
        : null,
      humidDays: validHumidity.filter((d) => d.humidity >= 85).length,

      // Sunshine stats
      totalSunshine: validSunshine.reduce((s, d) => s + d.sunshine, 0),
      avgSunshine: validSunshine.length
        ? validSunshine.reduce((s, d) => s + d.sunshine, 0) /
          validSunshine.length
        : 0,
      maxSunshine: validSunshine.length
        ? Math.max(...validSunshine.map((d) => d.sunshine))
        : 0,
      cloudyDays: validSunshine.filter((d) => d.sunshine < 1).length,
      sunnyDays: validSunshine.filter((d) => d.sunshine >= 8).length,

      // Meta
      totalDays: data.length,
      dataQuality: validTemps.length / data.length,
    };
  }

  /**
   * Get empty stats object
   */
  function getEmptyStats() {
    return {
      avgTemp: null,
      maxTemp: null,
      minTemp: null,
      tempRange: null,
      frostDays: 0,
      iceDays: 0,
      tropicalNights: 0,
      hotDays: 0,
      summerDays: 0,
      totalPrecip: 0,
      avgPrecip: 0,
      maxPrecip: 0,
      rainDays: 0,
      heavyRainDays: 0,
      dryDays: 0,
      avgWind: 0,
      maxWind: 0,
      stormDays: 0,
      windyDays: 0,
      calmDays: 0,
      avgHumidity: null,
      maxHumidity: null,
      minHumidity: null,
      humidDays: 0,
      totalSunshine: 0,
      avgSunshine: 0,
      maxSunshine: 0,
      cloudyDays: 0,
      sunnyDays: 0,
      totalDays: 0,
      dataQuality: 0,
    };
  }

  /**
   * Compare two periods and return detailed comparison
   */
  function comparePeriods(statsA, statsB) {
    const compare = (a, b, unit = "", decimals = 1) => {
      const diff = a !== null && b !== null ? a - b : null;
      const pct = b !== 0 && b !== null ? ((a - b) / Math.abs(b)) * 100 : null;
      return {
        valueA: a,
        valueB: b,
        diff: diff !== null ? Number(diff.toFixed(decimals)) : null,
        percentDiff: pct !== null ? Number(pct.toFixed(1)) : null,
        trend: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
        unit,
      };
    };

    return {
      temperature: {
        avg: compare(statsA.avgTemp, statsB.avgTemp, "°C"),
        max: compare(statsA.maxTemp, statsB.maxTemp, "°C"),
        min: compare(statsA.minTemp, statsB.minTemp, "°C"),
        frostDays: compare(statsA.frostDays, statsB.frostDays, "Tage", 0),
      },
      precipitation: {
        total: compare(statsA.totalPrecip, statsB.totalPrecip, "mm"),
        rainDays: compare(statsA.rainDays, statsB.rainDays, "Tage", 0),
        maxDaily: compare(statsA.maxPrecip, statsB.maxPrecip, "mm"),
      },
      wind: {
        avg: compare(statsA.avgWind, statsB.avgWind, "km/h"),
        max: compare(statsA.maxWind, statsB.maxWind, "km/h"),
        stormDays: compare(statsA.stormDays, statsB.stormDays, "Tage", 0),
      },
      sunshine: {
        total: compare(statsA.totalSunshine, statsB.totalSunshine, "h", 0),
        avg: compare(statsA.avgSunshine, statsB.avgSunshine, "h"),
        sunnyDays: compare(statsA.sunnyDays, statsB.sunnyDays, "Tage", 0),
      },
    };
  }

  // ============================================
  // CLIMATE INSIGHTS ENGINE
  // ============================================

  /**
   * INSIGHT SEVERITY LEVELS
   * Used for card styling and prioritization
   */
  const INSIGHT_SEVERITY = {
    RECORD: 0, // Rekorde (höchste Priorität)
    EXTREME: 1, // Extreme Anomalien (>3°C oder >75%)
    SIGNIFICANT: 2, // Signifikante Anomalien (>2°C oder >50%)
    MODERATE: 3, // Moderate Anomalien (>1.5°C oder >30%)
    NOTABLE: 4, // Bemerkenswerte Muster
    INFO: 5, // Allgemeine Informationen
  };

  /**
   * INSIGHT CATEGORIES
   * For filtering and grouping insights
   */
  const INSIGHT_CATEGORIES = {
    TEMPERATURE: "temperature",
    PRECIPITATION: "precipitation",
    SUNSHINE: "sunshine",
    WIND: "wind",
    RECORD: "record",
    COMPARISON: "comparison",
  };

  /**
   * Generate dynamic insights based on stats and climate normals
   * Enhanced with record detection, severity levels, and deep comparison
   *
   * @param {Object} stats - Current period statistics
   * @param {Object|null} previousStats - Previous period for comparison
   * @param {number} month - Month index (0-11)
   * @param {Object|null} historicalData - Full historical dataset for record detection
   * @returns {Array} Sorted insights array with severity and category
   */
  function generateInsights(
    stats,
    previousStats = null,
    month = 0,
    historicalData = null,
  ) {
    const insights = [];
    const monthName = CONFIG.MONTH_NAMES[month];
    const monthLabel = CONFIG.MONTH_LABELS_DE[month];
    const normals =
      CONFIG.CLIMATE_NORMALS[monthName] || CONFIG.CLIMATE_NORMALS.january;

    if (!stats || stats.totalDays === 0) {
      return [];
    }

    // ========================================
    // 1. RECORD DETECTION (Highest Priority)
    // ========================================
    if (historicalData && historicalData.length > 0) {
      const records = detectRecords(stats, historicalData, monthLabel);
      insights.push(...records);
    }

    // ========================================
    // 2. TEMPERATURE ANOMALY ANALYSIS
    // ========================================
    if (stats.avgTemp !== null) {
      const tempAnomaly = stats.avgTemp - normals.avgTemp;
      const absAnomaly = Math.abs(tempAnomaly);
      const isWarm = tempAnomaly > 0;

      // Extreme anomaly (>3°C deviation)
      if (absAnomaly >= 3) {
        insights.push({
          id: "temp-extreme-anomaly",
          type: isWarm
            ? "insight-card--extreme-warm"
            : "insight-card--extreme-cold",
          icon: isWarm ? "whatshot" : "severe_cold",
          title: isWarm ? "Extreme Wärme" : "Extreme Kälte",
          text: `${absAnomaly.toFixed(1)}°C ${isWarm ? "über" : "unter"} dem Klimamittel – ein ${isWarm ? "außergewöhnlich warmer" : "außergewöhnlich kalter"} ${monthLabel}.`,
          detail: `Klimamittel: ${normals.avgTemp.toFixed(1)}°C | Gemessen: ${stats.avgTemp.toFixed(1)}°C`,
          severity: INSIGHT_SEVERITY.EXTREME,
          category: INSIGHT_CATEGORIES.TEMPERATURE,
          badge: isWarm
            ? "+" + absAnomaly.toFixed(1) + "°"
            : "-" + absAnomaly.toFixed(1) + "°",
        });
      }
      // Significant anomaly (2-3°C)
      else if (absAnomaly >= 2) {
        insights.push({
          id: "temp-significant-anomaly",
          type: isWarm ? "insight-card--warm" : "insight-card--cold",
          icon: isWarm ? "local_fire_department" : "ac_unit",
          title: isWarm ? "Deutlich wärmer" : "Deutlich kälter",
          text: `Mit ${stats.avgTemp.toFixed(1)}°C war es ${absAnomaly.toFixed(1)}°C ${isWarm ? "wärmer" : "kälter"} als das Klimamittel.`,
          detail: `Klimamittel für ${monthLabel}: ${normals.avgTemp.toFixed(1)}°C`,
          severity: INSIGHT_SEVERITY.SIGNIFICANT,
          category: INSIGHT_CATEGORIES.TEMPERATURE,
        });
      }
      // Moderate anomaly (1.5-2°C)
      else if (absAnomaly >= 1.5) {
        insights.push({
          id: "temp-moderate-anomaly",
          type: isWarm ? "insight-card--warm" : "insight-card--cold",
          icon: isWarm ? "device_thermostat" : "thermostat",
          title: "Temperaturabweichung",
          text: `${absAnomaly.toFixed(1)}°C ${isWarm ? "wärmer" : "kälter"} als üblich für ${monthLabel}.`,
          severity: INSIGHT_SEVERITY.MODERATE,
          category: INSIGHT_CATEGORIES.TEMPERATURE,
        });
      }
    }

    // Hot days / Tropical nights (summer context)
    if (stats.hotDays > 0) {
      insights.push({
        id: "hot-days",
        type: "insight-card--extreme-warm",
        icon: "sunny",
        title: "Hitzetage",
        text: `${stats.hotDays} Tag${stats.hotDays > 1 ? "e" : ""} mit über 30°C${stats.tropicalNights > 0 ? ` und ${stats.tropicalNights} Tropennacht${stats.tropicalNights > 1 ? "näche" : ""} (≥20°C)` : ""}.`,
        severity:
          stats.hotDays > 5
            ? INSIGHT_SEVERITY.EXTREME
            : INSIGHT_SEVERITY.SIGNIFICANT,
        category: INSIGHT_CATEGORIES.TEMPERATURE,
        badge: stats.hotDays + " Tage",
      });
    }

    // Frost analysis (winter context)
    if (stats.frostDays > 0) {
      const frostText =
        stats.iceDays > 0
          ? `${stats.frostDays} Frosttage, davon ${stats.iceDays} Eistage (ganztägig <0°C)`
          : `${stats.frostDays} Nächte mit Frost`;
      insights.push({
        id: "frost-days",
        type: "insight-card--cold",
        icon: stats.iceDays > 0 ? "weather_snowy" : "severe_cold",
        title: stats.iceDays > 0 ? "Eisige Kälte" : "Frostnächte",
        text: frostText + ".",
        severity:
          stats.iceDays > 5
            ? INSIGHT_SEVERITY.SIGNIFICANT
            : INSIGHT_SEVERITY.MODERATE,
        category: INSIGHT_CATEGORIES.TEMPERATURE,
      });
    }

    // ========================================
    // 3. PRECIPITATION ANOMALY ANALYSIS
    // ========================================
    if (stats.totalPrecip !== null && normals.precip > 0) {
      const precipAnomaly =
        ((stats.totalPrecip - normals.precip) / normals.precip) * 100;
      const absPrecipAnomaly = Math.abs(precipAnomaly);
      const isWet = precipAnomaly > 0;

      // Extreme precipitation anomaly (>75%)
      if (absPrecipAnomaly >= 75) {
        insights.push({
          id: "precip-extreme-anomaly",
          type: isWet
            ? "insight-card--extreme-rain"
            : "insight-card--extreme-dry",
          icon: isWet ? "flood" : "water_loss",
          title: isWet ? "Extremer Niederschlag" : "Extreme Trockenheit",
          text: `${absPrecipAnomaly.toFixed(0)}% ${isWet ? "mehr" : "weniger"} Niederschlag als im Klimamittel.`,
          detail: `Erwartet: ${normals.precip.toFixed(1)} mm | Gefallen: ${stats.totalPrecip.toFixed(1)} mm`,
          severity: INSIGHT_SEVERITY.EXTREME,
          category: INSIGHT_CATEGORIES.PRECIPITATION,
          badge: (isWet ? "+" : "-") + absPrecipAnomaly.toFixed(0) + "%",
        });
      }
      // Significant (50-75%)
      else if (absPrecipAnomaly >= 50) {
        insights.push({
          id: "precip-significant-anomaly",
          type: isWet ? "insight-card--rain" : "insight-card--dry",
          icon: isWet ? "rainy" : "wb_sunny",
          title: isWet ? "Sehr nass" : "Sehr trocken",
          text: `${stats.totalPrecip.toFixed(1)} mm Niederschlag – ${absPrecipAnomaly.toFixed(0)}% ${isWet ? "über" : "unter"} dem Durchschnitt.`,
          severity: INSIGHT_SEVERITY.SIGNIFICANT,
          category: INSIGHT_CATEGORIES.PRECIPITATION,
        });
      }
      // Moderate (30-50%)
      else if (absPrecipAnomaly >= 30) {
        insights.push({
          id: "precip-moderate-anomaly",
          type: isWet ? "insight-card--rain" : "insight-card--dry",
          icon: isWet ? "water_drop" : "partly_cloudy_day",
          title: "Niederschlagsabweichung",
          text: `${absPrecipAnomaly.toFixed(0)}% ${isWet ? "mehr" : "weniger"} Regen als üblich (${stats.totalPrecip.toFixed(1)} vs. ${normals.precip.toFixed(1)} mm).`,
          severity: INSIGHT_SEVERITY.MODERATE,
          category: INSIGHT_CATEGORIES.PRECIPITATION,
        });
      }
    }

    // Heavy rain events
    if (stats.heavyRainDays > 0) {
      insights.push({
        id: "heavy-rain",
        type: "insight-card--rain",
        icon: "thunderstorm",
        title: "Starkregen",
        text: `${stats.heavyRainDays} Tag${stats.heavyRainDays > 1 ? "e" : ""} mit Starkniederschlag (≥10 mm/Tag).`,
        detail: `Maximum: ${stats.maxPrecip?.toFixed(1) || "–"} mm an einem Tag`,
        severity:
          stats.heavyRainDays > 3
            ? INSIGHT_SEVERITY.SIGNIFICANT
            : INSIGHT_SEVERITY.NOTABLE,
        category: INSIGHT_CATEGORIES.PRECIPITATION,
      });
    }

    // ========================================
    // 4. SUNSHINE ANALYSIS
    // ========================================
    if (stats.totalSunshine > 0 && normals.sunshine > 0) {
      const sunAnomaly =
        ((stats.totalSunshine - normals.sunshine) / normals.sunshine) * 100;
      const absSunAnomaly = Math.abs(sunAnomaly);
      const isSunny = sunAnomaly > 0;

      if (absSunAnomaly >= 40) {
        insights.push({
          id: "sun-anomaly",
          type: isSunny ? "insight-card--sunny" : "insight-card--cloudy",
          icon: isSunny ? "wb_sunny" : "cloud",
          title: isSunny ? "Sonnenverwöhnt" : "Sonnenarm",
          text: `${absSunAnomaly.toFixed(0)}% ${isSunny ? "mehr" : "weniger"} Sonnenstunden als üblich.`,
          detail: `${stats.totalSunshine.toFixed(0)} h (Normal: ${normals.sunshine.toFixed(0)} h)`,
          severity:
            absSunAnomaly >= 60
              ? INSIGHT_SEVERITY.SIGNIFICANT
              : INSIGHT_SEVERITY.MODERATE,
          category: INSIGHT_CATEGORIES.SUNSHINE,
        });
      }
    }

    // ========================================
    // 5. WIND ANALYSIS
    // ========================================
    if (stats.stormDays > 0) {
      insights.push({
        id: "storm-days",
        type: "insight-card--wind",
        icon: "storm",
        title: "Sturmereignisse",
        text: `${stats.stormDays} Tag${stats.stormDays > 1 ? "e" : ""} mit Sturm (≥62 km/h).`,
        detail: `Maximale Böen: ${stats.maxWind?.toFixed(0) || "–"} km/h`,
        severity:
          stats.stormDays > 2
            ? INSIGHT_SEVERITY.SIGNIFICANT
            : INSIGHT_SEVERITY.NOTABLE,
        category: INSIGHT_CATEGORIES.WIND,
      });
    }

    // ========================================
    // 6. PERIOD COMPARISON
    // ========================================
    if (
      previousStats &&
      previousStats.avgTemp !== null &&
      stats.avgTemp !== null
    ) {
      const tempDiff = stats.avgTemp - previousStats.avgTemp;
      const absTempDiff = Math.abs(tempDiff);

      if (absTempDiff >= 3) {
        insights.push({
          id: "temp-period-change",
          type: tempDiff > 0 ? "insight-card--warm" : "insight-card--cold",
          icon: tempDiff > 0 ? "trending_up" : "trending_down",
          title: "Temperatursprung",
          text: `${absTempDiff.toFixed(1)}°C ${tempDiff > 0 ? "wärmer" : "kälter"} als im Vormonat.`,
          severity: INSIGHT_SEVERITY.NOTABLE,
          category: INSIGHT_CATEGORIES.COMPARISON,
        });
      }

      // Precipitation change
      if (previousStats.totalPrecip !== null && stats.totalPrecip !== null) {
        const precipDiff = stats.totalPrecip - previousStats.totalPrecip;
        const precipPct =
          previousStats.totalPrecip > 0
            ? (precipDiff / previousStats.totalPrecip) * 100
            : 0;

        if (Math.abs(precipPct) >= 100) {
          insights.push({
            id: "precip-period-change",
            type: precipDiff > 0 ? "insight-card--rain" : "insight-card--dry",
            icon: precipDiff > 0 ? "water_drop" : "water_loss",
            title: precipDiff > 0 ? "Deutlich nasser" : "Deutlich trockener",
            text: `${Math.abs(precipPct).toFixed(0)}% ${precipDiff > 0 ? "mehr" : "weniger"} Niederschlag als im Vormonat.`,
            severity: INSIGHT_SEVERITY.NOTABLE,
            category: INSIGHT_CATEGORIES.COMPARISON,
          });
        }
      }
    }

    // Sort by severity and return top insights
    return insights.sort((a, b) => a.severity - b.severity).slice(0, 6);
  }

  /**
   * Detect records from historical data
   * @private
   */
  function detectRecords(currentStats, historicalData, monthLabel) {
    const records = [];

    // Find historical extremes from data array
    if (!Array.isArray(historicalData) || historicalData.length < 365) {
      return records; // Need at least 1 year of data for meaningful records
    }

    const historicalStats = {
      maxTemp: Math.max(
        ...historicalData
          .filter((d) => d.temp_max !== null)
          .map((d) => d.temp_max),
      ),
      minTemp: Math.min(
        ...historicalData
          .filter((d) => d.temp_min !== null)
          .map((d) => d.temp_min),
      ),
      maxPrecip: Math.max(
        ...historicalData.filter((d) => d.precip !== null).map((d) => d.precip),
      ),
    };

    // Temperature record high
    if (
      currentStats.maxTemp !== null &&
      currentStats.maxTemp >= historicalStats.maxTemp * 0.98
    ) {
      const isNewRecord = currentStats.maxTemp >= historicalStats.maxTemp;
      records.push({
        id: "record-high-temp",
        type: "insight-card--record-warm",
        icon: "emoji_events",
        title: isNewRecord ? "🔥 Temperaturrekord!" : "Nahe am Rekord",
        text: `Höchsttemperatur von ${currentStats.maxTemp.toFixed(1)}°C ${isNewRecord ? "– neuer Rekord" : `nähert sich dem Rekord von ${historicalStats.maxTemp.toFixed(1)}°C`}.`,
        severity: isNewRecord
          ? INSIGHT_SEVERITY.RECORD
          : INSIGHT_SEVERITY.EXTREME,
        category: INSIGHT_CATEGORIES.RECORD,
        badge: "🏆",
      });
    }

    // Temperature record low
    if (
      currentStats.minTemp !== null &&
      currentStats.minTemp <= historicalStats.minTemp * 1.02
    ) {
      const isNewRecord = currentStats.minTemp <= historicalStats.minTemp;
      records.push({
        id: "record-low-temp",
        type: "insight-card--record-cold",
        icon: "emoji_events",
        title: isNewRecord ? "❄️ Kälterekord!" : "Nahe am Kälterekord",
        text: `Tiefsttemperatur von ${currentStats.minTemp.toFixed(1)}°C ${isNewRecord ? "– neuer Rekord" : `nähert sich dem Rekord von ${historicalStats.minTemp.toFixed(1)}°C`}.`,
        severity: isNewRecord
          ? INSIGHT_SEVERITY.RECORD
          : INSIGHT_SEVERITY.EXTREME,
        category: INSIGHT_CATEGORIES.RECORD,
        badge: "🏆",
      });
    }

    // Precipitation record
    if (
      currentStats.maxPrecip !== null &&
      currentStats.maxPrecip >= historicalStats.maxPrecip * 0.95
    ) {
      const isNewRecord = currentStats.maxPrecip >= historicalStats.maxPrecip;
      records.push({
        id: "record-precip",
        type: "insight-card--record-rain",
        icon: "emoji_events",
        title: isNewRecord ? "🌧️ Niederschlagsrekord!" : "Nahe am Regenrekord",
        text: `${currentStats.maxPrecip.toFixed(1)} mm an einem Tag${isNewRecord ? " – neuer Rekord!" : ""}.`,
        severity: isNewRecord
          ? INSIGHT_SEVERITY.RECORD
          : INSIGHT_SEVERITY.EXTREME,
        category: INSIGHT_CATEGORIES.RECORD,
        badge: "🏆",
      });
    }

    return records;
  }

  // ============================================
  // INSIGHT CARD RENDERING
  // ============================================

  /**
   * Render a single Insight Card with glassmorphism design
   * @param {Object} insight - Insight object from generateInsights()
   * @param {number} index - Card index for stagger animation
   * @returns {string} HTML string
   */
  function renderInsightCard(insight, index = 0) {
    const {
      id = "",
      type = "",
      icon = "info",
      title = "",
      text = "",
      detail = null,
      badge = null,
      category = "",
    } = insight;

    const badgeHTML = badge
      ? `<span class="insight-card__badge">${badge}</span>`
      : "";

    const detailHTML = detail
      ? `<p class="insight-card__detail">${detail}</p>`
      : "";

    const categoryAttr = category ? `data-category="${category}"` : "";

    return `
      <article
        class="history-insight-card ${type}"
        data-insight-id="${id}"
        ${categoryAttr}
        style="--stagger-index: ${index}"
      >
        <div class="insight-card__icon-wrap">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <div class="insight-card__content">
          <header class="insight-card__header">
            <h4 class="insight-card__title">${title}</h4>
            ${badgeHTML}
          </header>
          <p class="insight-card__text">${text}</p>
          ${detailHTML}
        </div>
      </article>
    `;
  }

  /**
   * Render the full Insights Panel with header and cards
   * @param {Array} insights - Array of insight objects
   * @param {string} periodLabel - e.g. "Januar 2024"
   * @returns {string} HTML string
   */
  function renderInsightsPanel(insights, periodLabel = "") {
    if (!insights || insights.length === 0) {
      return `
        <section class="history-insights-panel history-insights-panel--empty">
          <header class="insights-panel__header">
            <span class="material-symbols-outlined">lightbulb</span>
            <h3>Klima-Insights</h3>
          </header>
          <div class="insights-panel__empty">
            <span class="material-symbols-outlined">check_circle</span>
            <p>Keine besonderen Auffälligkeiten für ${periodLabel || "diesen Zeitraum"}.</p>
          </div>
        </section>
      `;
    }

    const insightCardsHTML = insights
      .map((insight, index) => renderInsightCard(insight, index))
      .join("");

    // Group insights by category for potential filtering
    const categories = [
      ...new Set(insights.map((i) => i.category).filter(Boolean)),
    ];
    const categoryChips =
      categories.length > 1
        ? `<div class="insights-panel__filters">
          ${categories.map((cat) => `<button class="insights-filter-chip" data-filter="${cat}">${getCategoryLabel(cat)}</button>`).join("")}
        </div>`
        : "";

    return `
      <section class="history-insights-panel" data-insights-count="${insights.length}">
        <header class="insights-panel__header">
          <span class="material-symbols-outlined">lightbulb</span>
          <h3>Klima-Insights</h3>
          ${periodLabel ? `<span class="insights-panel__period">${periodLabel}</span>` : ""}
        </header>
        ${categoryChips}
        <div class="insights-panel__cards">
          ${insightCardsHTML}
        </div>
      </section>
    `;
  }

  /**
   * Render skeleton placeholder for insights panel
   * @returns {string} HTML string
   */
  function renderInsightsSkeleton() {
    const skeletonCards = Array(3)
      .fill(null)
      .map(
        (_, i) => `
      <div class="history-insight-card history-insight-card--skeleton" style="--stagger-index: ${i}">
        <div class="insight-card__icon-wrap shimmer"></div>
        <div class="insight-card__content">
          <div class="skeleton-line skeleton-line--title shimmer"></div>
          <div class="skeleton-line skeleton-line--text shimmer"></div>
          <div class="skeleton-line skeleton-line--detail shimmer"></div>
        </div>
      </div>
    `,
      )
      .join("");

    return `
      <section class="history-insights-panel history-insights-panel--loading">
        <header class="insights-panel__header">
          <span class="material-symbols-outlined">lightbulb</span>
          <h3>Klima-Insights</h3>
        </header>
        <div class="insights-panel__cards">
          ${skeletonCards}
        </div>
      </section>
    `;
  }

  /**
   * Hydrate insights container with real data (animated)
   * @param {HTMLElement} container - Container element
   * @param {Array} insights - Insights array
   * @param {string} periodLabel - Period label
   */
  function hydrateInsightsContainer(container, insights, periodLabel = "") {
    if (!container) {
      console.warn("[HistoryStats] No insights container provided");
      return;
    }

    const panelHTML = renderInsightsPanel(insights, periodLabel);

    // Smooth transition
    container.classList.add("insights-container--hydrating");

    requestAnimationFrame(() => {
      container.innerHTML = panelHTML;

      requestAnimationFrame(() => {
        container.classList.remove("insights-container--hydrating");
        container.classList.add("insights-container--hydrated");

        // Trigger staggered card animations
        const cards = container.querySelectorAll(".history-insight-card");
        cards.forEach((card, i) => {
          card.style.animationDelay = `${i * 80}ms`;
          card.classList.add("insight-card--animate-in");
        });
      });
    });

    console.log(`✅ [HistoryStats] ${insights.length} Insights hydrated`);
  }

  /**
   * Get human-readable label for insight category
   * @private
   */
  function getCategoryLabel(category) {
    const labels = {
      temperature: "Temperatur",
      precipitation: "Niederschlag",
      sunshine: "Sonnenschein",
      wind: "Wind",
      record: "Rekorde",
      comparison: "Vergleich",
    };
    return labels[category] || category;
  }

  /**
   * Find extremes from dataset
   */
  function findExtremes(data) {
    if (!data || data.length === 0) return null;

    const validTemp = data.filter(
      (d) => d.temp_max !== null && d.temp_min !== null,
    );
    const validPrecip = data.filter((d) => d.precip !== null);
    const validWind = data.filter((d) => d.wind_speed !== null);

    return {
      hottestDay: validTemp.length
        ? validTemp.reduce((max, d) => (d.temp_max > max.temp_max ? d : max))
        : null,
      coldestDay: validTemp.length
        ? validTemp.reduce((min, d) => (d.temp_min < min.temp_min ? d : min))
        : null,
      wettestDay: validPrecip.length
        ? validPrecip.reduce((max, d) => (d.precip > max.precip ? d : max))
        : null,
      windiestDay: validWind.length
        ? validWind.reduce((max, d) =>
            d.wind_speed > max.wind_speed ? d : max,
          )
        : null,
    };
  }

  // ============================================
  // MODAL TEMPLATES
  // ============================================

  /**
   * Render day detail modal content
   * Uses health-glass-bg and health-swift-easing CSS variables
   */
  function renderDayDetailModal(day, metric = "temperature") {
    if (!day) return "";

    const date = new Date(day.date);
    const formattedDate = `${date.getDate()}. ${CONFIG.MONTH_LABELS_DE[date.getMonth()]} ${date.getFullYear()}`;
    const weatherDesc = getWeatherDescription(day);

    return `
      <div class="history-modal__content history-modal__content--day-detail">
        <div class="swipe-handle"></div>
        <button class="history-modal__close" data-action="close" aria-label="Schließen">
          <span class="material-symbols-outlined">close</span>
        </button>

        <header class="day-detail__header">
          <h3>${formattedDate}</h3>
          <p class="day-detail__weather">${weatherDesc}</p>
        </header>

        <div class="day-detail__chart">
          <canvas id="history-day-detail-chart"></canvas>
        </div>

        <div class="day-detail__metrics">
          <div class="day-detail__metric">
            <span class="material-symbols-outlined">device_thermostat</span>
            <div>
              <span class="day-detail__metric-label">Temperatur</span>
              <span class="day-detail__metric-value">${day.temp_min?.toFixed(1) ?? "–"}° / ${day.temp_max?.toFixed(1) ?? "–"}°</span>
            </div>
          </div>
          <div class="day-detail__metric">
            <span class="material-symbols-outlined">water_drop</span>
            <div>
              <span class="day-detail__metric-label">Niederschlag</span>
              <span class="day-detail__metric-value">${day.precip?.toFixed(1) ?? "0"} mm</span>
            </div>
          </div>
          <div class="day-detail__metric">
            <span class="material-symbols-outlined">air</span>
            <div>
              <span class="day-detail__metric-label">Wind</span>
              <span class="day-detail__metric-value">${day.wind_speed ?? "–"} km/h</span>
            </div>
          </div>
          <div class="day-detail__metric">
            <span class="material-symbols-outlined">humidity_percentage</span>
            <div>
              <span class="day-detail__metric-label">Feuchtigkeit</span>
              <span class="day-detail__metric-value">${day.humidity ?? "–"}%</span>
            </div>
          </div>
        </div>

        <div class="day-detail__note">
          <span class="material-symbols-outlined">info</span>
          <p>${getSeasonalNote(day)}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render extreme detail modal content
   */
  function renderExtremeDetailModal(extreme, location) {
    if (!extreme) return "";

    const tempMin = extreme.data?.temp_min?.toFixed?.(1) ?? "–";
    const tempMax = extreme.data?.temp_max?.toFixed?.(1) ?? "–";
    const precip = extreme.data?.precip?.toFixed?.(1) ?? "0";
    const windSpeed = extreme.data?.wind_speed?.toFixed?.(0) ?? "–";
    const humidity = extreme.data?.humidity ?? "–";
    const sunshine = extreme.data?.sunshine?.toFixed?.(1) ?? "–";

    return `
      <div class="history-modal__content history-modal__content--extreme">
        <div class="swipe-handle"></div>
        <button class="history-modal__close" data-action="close" aria-label="Schließen">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="extreme-detail__header extreme-detail__header--${extreme.type}">
          <div class="extreme-detail__icon">
            <span class="material-symbols-outlined">${extreme.icon}</span>
          </div>
          <div class="extreme-detail__title-group">
            <h3>${extreme.title}</h3>
            <span class="extreme-detail__value">${extreme.value}</span>
          </div>
        </div>

        <div class="extreme-detail__info">
          <div class="extreme-detail__row">
            <span class="material-symbols-outlined">calendar_today</span>
            <span>${extreme.dateFormatted}</span>
          </div>
          <div class="extreme-detail__row">
            <span class="material-symbols-outlined">location_on</span>
            <span>${location?.name || "Berlin"}</span>
          </div>
        </div>

        <div class="extreme-detail__chart">
          <canvas id="history-extreme-mini-chart"></canvas>
        </div>

        <div class="extreme-detail__metrics">
          <div class="extreme-detail__metric">
            <span class="material-symbols-outlined">device_thermostat</span>
            <div class="extreme-detail__metric-data">
              <span class="extreme-detail__metric-label">Temperatur</span>
              <span class="extreme-detail__metric-value">${tempMin}° / ${tempMax}°C</span>
            </div>
          </div>
          <div class="extreme-detail__metric">
            <span class="material-symbols-outlined">water_drop</span>
            <div class="extreme-detail__metric-data">
              <span class="extreme-detail__metric-label">Niederschlag</span>
              <span class="extreme-detail__metric-value">${precip} mm</span>
            </div>
          </div>
          <div class="extreme-detail__metric">
            <span class="material-symbols-outlined">air</span>
            <div class="extreme-detail__metric-data">
              <span class="extreme-detail__metric-label">Wind</span>
              <span class="extreme-detail__metric-value">${windSpeed} km/h</span>
            </div>
          </div>
          <div class="extreme-detail__metric">
            <span class="material-symbols-outlined">humidity_percentage</span>
            <div class="extreme-detail__metric-data">
              <span class="extreme-detail__metric-label">Feuchtigkeit</span>
              <span class="extreme-detail__metric-value">${humidity}%</span>
            </div>
          </div>
          <div class="extreme-detail__metric">
            <span class="material-symbols-outlined">wb_sunny</span>
            <div class="extreme-detail__metric-data">
              <span class="extreme-detail__metric-label">Sonnenstunden</span>
              <span class="extreme-detail__metric-value">${sunshine} h</span>
            </div>
          </div>
        </div>

        <div class="extreme-detail__note">
          <span class="material-symbols-outlined">info</span>
          <p>${getExtremeNote(extreme)}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render location picker modal
   */
  function renderLocationModal(locations, currentLocation) {
    return `
      <div class="history-modal__content history-modal__content--location">
        <div class="swipe-handle"></div>
        <header class="history-modal__header">
          <h3>Standort wählen</h3>
        </header>
        <div class="history-modal__body">
          <div class="location-list">
            ${locations
              .map(
                (loc) => `
              <button class="location-item ${loc.id === currentLocation?.id ? "location-item--active" : ""}" data-location-id="${loc.id}">
                <span class="material-symbols-outlined">${loc.id === "current" ? "my_location" : "location_on"}</span>
                <span class="location-item__name">${loc.name}</span>
                ${loc.id === currentLocation?.id ? '<span class="material-symbols-outlined">check</span>' : ""}
              </button>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render period selector modal
   */
  function renderPeriodSelectorModal(periods, currentPeriod, periodType) {
    return `
      <div class="history-modal__content history-modal__content--period">
        <div class="swipe-handle"></div>
        <header class="history-modal__header">
          <h3>Zeitraum ${periodType} wählen</h3>
        </header>
        <div class="history-modal__body">
          <div class="period-list">
            ${periods
              .map(
                (p) => `
              <button class="period-item ${p.id === currentPeriod ? "period-item--active" : ""}" data-period-id="${p.id}">
                <span class="material-symbols-outlined">calendar_month</span>
                <span class="period-item__name">${p.label}</span>
                ${p.id === currentPeriod ? '<span class="material-symbols-outlined">check</span>' : ""}
              </button>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render info/glossary modal
   */
  function renderInfoModal() {
    return `
      <div class="history-modal__content history-modal__content--info">
        <div class="swipe-handle"></div>
        <button class="history-modal__close" data-action="close" aria-label="Schließen">
          <span class="material-symbols-outlined">close</span>
        </button>
        <header class="history-modal__header">
          <h3>Begriffserklärungen</h3>
        </header>
        <div class="history-modal__body">
          <dl class="info-definitions">
            <dt>Durchschnittstemperatur</dt>
            <dd>Mittelwert aller Tages-Durchschnitte im gewählten Zeitraum.</dd>

            <dt>Klimamittel</dt>
            <dd>Langjähriger Durchschnitt (30 Jahre) für den Standort.</dd>

            <dt>Frosttage</dt>
            <dd>Tage, an denen die Tiefsttemperatur unter 0°C lag.</dd>

            <dt>Eistage</dt>
            <dd>Tage, an denen die Höchsttemperatur unter 0°C blieb.</dd>

            <dt>Hitzewelle</dt>
            <dd>Mindestens 3 aufeinanderfolgende Tage mit Temperaturen über 30°C.</dd>

            <dt>Niederschlag</dt>
            <dd>Gemessene Wassermenge in Millimetern (1mm = 1 Liter/m²).</dd>

            <dt>Sturmtag</dt>
            <dd>Tag mit Windböen über 62 km/h (Beaufort 8+).</dd>
          </dl>
        </div>
      </div>
    `;
  }

  /**
   * Render custom date picker modal
   */
  function renderCustomDateModal(startDate, endDate) {
    const today = new Date().toISOString().split("T")[0];
    return `
      <div class="history-modal__content history-modal__content--custom-date">
        <div class="swipe-handle"></div>
        <button class="history-modal__close" data-action="close" aria-label="Schließen">
          <span class="material-symbols-outlined">close</span>
        </button>
        <header class="history-modal__header">
          <h3>Zeitraum wählen</h3>
        </header>
        <div class="history-modal__body">
          <div class="date-picker-form">
            <div class="date-input-group">
              <label for="history-start-date">Von</label>
              <input type="date" id="history-start-date" value="${startDate || "2025-01-01"}" max="${today}">
            </div>
            <div class="date-input-group">
              <label for="history-end-date">Bis</label>
              <input type="date" id="history-end-date" value="${endDate || today}" max="${today}">
            </div>
            <button class="date-picker-submit" data-action="apply-date">
              <span class="material-symbols-outlined">check</span>
              Anwenden
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getWeatherDescription(day) {
    const parts = [];

    if (day.temp_avg < -8) parts.push("Eisig");
    else if (day.temp_avg < -3) parts.push("Sehr kalt");
    else if (day.temp_avg < 2) parts.push("Kalt");
    else if (day.temp_avg < 8) parts.push("Kühl");
    else if (day.temp_avg < 15) parts.push("Mild");
    else if (day.temp_avg < 25) parts.push("Warm");
    else parts.push("Heiß");

    if (day.precip > 5) parts.push("starker Regen");
    else if (day.precip > 2) parts.push("Regen");
    else if (day.precip > 0) parts.push("leichter Niederschlag");

    if (day.wind_speed > 40) parts.push("stürmisch");
    else if (day.wind_speed > 25) parts.push("windig");

    if (day.sunshine > 8) parts.push("sonnig");
    else if (day.sunshine < 1) parts.push("bedeckt");

    return parts.join(", ");
  }

  function getSeasonalNote(day) {
    const month = new Date(day.date).getMonth();
    const temp = day.temp_avg;

    if (month >= 11 || month <= 1) {
      if (temp < -10)
        return "Außergewöhnlich kalter Wintertag – etwa 3°C unter dem saisonalen Durchschnitt.";
      if (temp > 8)
        return "Ungewöhnlich milder Wintertag – deutlich über dem Klimamittel.";
      return "Typische Winterbedingungen für diese Region.";
    }
    if (month >= 5 && month <= 7) {
      if (temp > 35)
        return "Extreme Hitze – Vorsicht vor Dehydrierung und Sonnenstich.";
      if (temp < 18)
        return "Kühler Sommertag – unter dem saisonalen Durchschnitt.";
      return "Normale Sommerverhältnisse.";
    }
    return "Saisonale Verhältnisse.";
  }

  function getExtremeNote(extreme) {
    const notes = {
      hot: "Dieser Tag markiert den heißesten gemessenen Wert im Analysezeitraum. Solche Temperaturen treten statistisch nur an wenigen Tagen pro Jahr auf.",
      cold: "An diesem Tag wurde die niedrigste Temperatur gemessen. Strenger Frost dieser Art ist für mitteleuropäische Winter ungewöhnlich.",
      rain: "Dieser Tag verzeichnete die höchste Niederschlagsmenge. Solche Ereignisse können zu lokalen Überschwemmungen führen.",
      wind: "Die an diesem Tag gemessene Windgeschwindigkeit entspricht Sturmstärke. Schäden an Bäumen und Gebäuden sind möglich.",
    };
    return notes[extreme?.type] || "";
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // ============================================
  // SKELETON / PLACEHOLDER RENDERING
  // ============================================

  /**
   * Render initial skeleton placeholders for History page
   * Shows loading state before real data arrives
   *
   * @param {HTMLElement} container - History container element
   */
  function renderInitialSkeletons(container) {
    if (!container) return;

    // Only render if container is empty (first render)
    if (container.innerHTML.trim() !== "") return;

    container.innerHTML = `
      <div class="history-skeleton" role="status" aria-label="Lädt historische Daten...">
        <!-- Header Skeleton -->
        <div class="history-skeleton__header">
          <div class="history-skeleton__location shimmer"></div>
          <div class="history-skeleton__icon shimmer"></div>
        </div>

        <!-- Tab Skeleton -->
        <div class="history-skeleton__tabs">
          <div class="history-skeleton__tab shimmer"></div>
          <div class="history-skeleton__tab shimmer"></div>
          <div class="history-skeleton__tab shimmer"></div>
          <div class="history-skeleton__tab shimmer"></div>
        </div>

        <!-- Stats Cards Skeleton -->
        <div class="history-skeleton__stats-grid">
          ${renderSkeletonCard()}
          ${renderSkeletonCard()}
          ${renderSkeletonCard()}
          ${renderSkeletonCard()}
          ${renderSkeletonCard()}
          ${renderSkeletonCard()}
        </div>

        <!-- Chart Skeleton -->
        <div class="history-skeleton__chart-section">
          <div class="history-skeleton__chart-title shimmer"></div>
          <div class="history-skeleton__chart shimmer"></div>
        </div>

        <!-- Insights Skeleton -->
        <div class="history-skeleton__insights">
          <div class="history-skeleton__insight shimmer"></div>
          <div class="history-skeleton__insight shimmer"></div>
          <div class="history-skeleton__insight shimmer"></div>
        </div>
      </div>
    `;
    console.log("⏳ [HistoryStats] Skeleton-Platzhalter gerendert");
  }

  /**
   * Generate a single skeleton card HTML
   */
  function renderSkeletonCard() {
    return `
      <div class="history-skeleton__card">
        <div class="history-skeleton__card-icon shimmer"></div>
        <div class="history-skeleton__card-content">
          <div class="history-skeleton__card-label shimmer"></div>
          <div class="history-skeleton__card-value shimmer"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render placeholder/fallback cards with dummy data
   * Used when API fails or no data available
   */
  function renderFallbackStats() {
    const dummyStats = {
      avgTemp: 2.3,
      maxTemp: 7.5,
      minTemp: -4.2,
      tempRange: 11.7,
      totalPrecip: 38.5,
      rainDays: 12,
      maxWind: 62,
      avgWind: 18.5,
      totalSunshine: 45,
      sunnyDays: 5,
      frostDays: 15,
      iceDays: 3,
    };

    return renderStatsGrid(dummyStats, null, new Date().getMonth());
  }

  // ============================================
  // DATA HYDRATION - Replace Skeletons with Real Data
  // ============================================

  /**
   * Hydrate the stats container - replace skeletons with real MetricCards
   * Called when loadHistoricalData() completes
   *
   * @param {HTMLElement} container - Stats container element
   * @param {Object} stats - Calculated statistics
   * @param {Object} comparisonStats - Previous period stats for trends
   * @param {number} month - Current month (0-11)
   */
  function hydrateStatsContainer(
    container,
    stats,
    comparisonStats = null,
    month = 0,
  ) {
    if (!container || !stats) return;

    const gridContainer =
      container.querySelector(".history-stats-grid") ||
      container.querySelector(".history-skeleton__stats-grid");

    if (!gridContainer) {
      console.warn("[HistoryStats] No stats grid container found");
      return;
    }

    // Get climate normals for anomaly calculation
    const normals =
      CONFIG.CLIMATE_NORMALS[CONFIG.MONTH_NAMES[month]] ||
      CONFIG.CLIMATE_NORMALS.january;

    // Calculate trends vs previous period OR vs climate normals
    const calcTrend = (current, reference, isTemp = false) => {
      if (reference === null || current === null)
        return { trend: null, value: null };
      const diff = current - reference;
      const threshold = isTemp ? 1.0 : 5; // 1°C for temp, 5 for others

      if (Math.abs(diff) < threshold) return { trend: null, value: null };

      return {
        trend: diff > 0 ? "up" : "down",
        value: (diff > 0 ? "+" : "") + diff.toFixed(1),
      };
    };

    // Temperature anomaly (vs climate normal)
    const tempAnomaly =
      stats.avgTemp !== null ? stats.avgTemp - normals.avgTemp : 0;
    const tempTrend = comparisonStats
      ? calcTrend(stats.avgTemp, comparisonStats.avgTemp, true)
      : calcTrend(stats.avgTemp, normals.avgTemp, true);

    // Precipitation trend
    const precipTrend = comparisonStats
      ? calcTrend(stats.totalPrecip, comparisonStats.totalPrecip)
      : calcTrend(stats.totalPrecip, normals.precip);

    // Temperature color classes based on anomaly
    const getTempColorClass = (anomaly) => {
      if (anomaly >= 5) return "metric-card--extreme-warm";
      if (anomaly >= 2) return "metric-card--warm";
      if (anomaly <= -5) return "metric-card--extreme-cold";
      if (anomaly <= -2) return "metric-card--cold";
      return "";
    };

    const tempColorClass = getTempColorClass(tempAnomaly);

    // Build the hydrated cards
    const cards = [
      renderMetricCard({
        icon: "device_thermostat",
        label: "Durchschnitt",
        value: stats.avgTemp?.toFixed(1) ?? "–",
        unit: "°C",
        colorClass: tempColorClass,
        trend: tempTrend.trend,
        trendValue: tempTrend.value ? tempTrend.value + "°" : null,
        subtitle: `Klimamittel: ${normals.avgTemp.toFixed(1)}°`,
        onClick: "show-temp-detail",
      }),
      renderMetricCard({
        icon: "thermostat_auto",
        label: "Max / Min",
        value: `${stats.maxTemp?.toFixed(1) ?? "–"} / ${stats.minTemp?.toFixed(1) ?? "–"}`,
        unit: "°C",
        subtitle: `Spanne: ${stats.tempRange?.toFixed(1) ?? "–"}°`,
        colorClass: stats.tempRange > 20 ? "metric-card--volatile" : "",
      }),
      renderMetricCard({
        icon: "water_drop",
        label: "Niederschlag",
        value: stats.totalPrecip?.toFixed(1) ?? "0",
        unit: " mm",
        trend: precipTrend.trend,
        trendValue: precipTrend.value ? precipTrend.value + " mm" : null,
        subtitle: `${stats.rainDays} Regentage`,
        colorClass:
          stats.totalPrecip > normals.precip * 1.5 ? "metric-card--wet" : "",
      }),
      renderMetricCard({
        icon: "air",
        label: "Windspitze",
        value: stats.maxWind?.toFixed(0) ?? "–",
        unit: " km/h",
        subtitle: `Ø ${stats.avgWind?.toFixed(1) ?? "–"} km/h`,
        colorClass: stats.maxWind >= 62 ? "metric-card--storm" : "",
      }),
      renderMetricCard({
        icon: "wb_sunny",
        label: "Sonnenstunden",
        value: stats.totalSunshine?.toFixed(0) ?? "0",
        unit: " h",
        subtitle: `${stats.sunnyDays} sonnige Tage`,
      }),
      renderMetricCard({
        icon: "ac_unit",
        label: "Frosttage",
        value: stats.frostDays ?? 0,
        unit: "",
        colorClass: stats.frostDays > 10 ? "metric-card--cold" : "",
        subtitle: `${stats.iceDays ?? 0} Eistage`,
      }),
    ];

    // Hydrate with smooth transition
    gridContainer.classList.add("history-stats-grid--hydrating");

    requestAnimationFrame(() => {
      gridContainer.innerHTML = cards.join("");
      gridContainer.className = "history-stats-grid"; // Remove skeleton class

      // Trigger fade-in animation
      requestAnimationFrame(() => {
        gridContainer.classList.add("history-stats-grid--hydrated");
      });
    });

    console.log("✅ [HistoryStats] Stats hydrated with real data");
  }

  // ============================================
  // PUBLIC API
  // ============================================
  global.HistoryStats = {
    // Statistics
    calculateStats,
    getEmptyStats,
    comparePeriods,
    generateInsights,
    findExtremes,

    // MetricCard Templates (Health-Page Parity)
    renderMetricCard,
    renderStatsGrid,
    renderExtremesTimeline,

    // Climate Insights Engine
    renderInsightCard,
    renderInsightsPanel,
    renderInsightsSkeleton,
    hydrateInsightsContainer,
    INSIGHT_SEVERITY,
    INSIGHT_CATEGORIES,

    // Skeleton / Placeholders
    renderInitialSkeletons,
    renderSkeletonCard,
    renderFallbackStats,

    // Data Hydration
    hydrateStatsContainer,

    // Modal templates
    renderDayDetailModal,
    renderExtremeDetailModal,
    renderLocationModal,
    renderPeriodSelectorModal,
    renderInfoModal,
    renderCustomDateModal,

    // Utilities
    getWeatherDescription,
    getSeasonalNote,
    getExtremeNote,
    formatDate,

    // Configuration
    CONFIG,
  };
})(typeof window !== "undefined" ? window : this);
