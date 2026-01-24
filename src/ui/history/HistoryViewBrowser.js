/**
 * HistoryViewBrowser.js - Weather History & Insights
 * Complete native-app-like implementation with full interactivity
 * Edge-to-edge design, skeleton loading, modals, and API-ready architecture
 */
(function (global) {
  "use strict";

  // ============================================
  // CONFIGURATION & CONSTANTS
  // ============================================
  const CONFIG = {
    // Open-Meteo Archive API for historical data
    ARCHIVE_API_URL: "https://archive-api.open-meteo.com/v1/archive",
    // Open-Meteo Forecast API for recent/forecast data
    FORECAST_API_URL: "https://api.open-meteo.com/v1/forecast",
    // Cache duration in milliseconds (30 minutes)
    CACHE_TTL: 30 * 60 * 1000,
    // Skeleton loading delay (ms)
    SKELETON_DELAY: 600,
    // Animation duration (ms)
    ANIMATION_DURATION: 350,
    // Climate reference averages (Berlin, January)
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
    // Month names for lookup
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
  };

  // ============================================
  // HISTORY DATA MANAGER - Async Data Fetching
  // ============================================
  class HistoryDataManager {
    constructor() {
      this.cache = new Map();
      this.pendingRequests = new Map();
    }

    /**
     * Fetch historical weather data from Open-Meteo Archive API
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} startDate - YYYY-MM-DD format
     * @param {string} endDate - YYYY-MM-DD format
     * @returns {Promise<Array>} - Normalized daily weather data
     */
    async fetchHistoricalData(lat, lon, startDate, endDate) {
      const cacheKey = `hist_${lat}_${lon}_${startDate}_${endDate}`;

      // Check cache first
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 [HistoryDataManager] Cache hit: ${cacheKey}`);
        return cached;
      }

      // Prevent duplicate requests
      if (this.pendingRequests.has(cacheKey)) {
        console.log(`⏳ [HistoryDataManager] Waiting for pending: ${cacheKey}`);
        return this.pendingRequests.get(cacheKey);
      }

      const requestPromise = this._doFetchHistorical(
        lat,
        lon,
        startDate,
        endDate,
        cacheKey,
      );
      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        return result;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    }

    async _doFetchHistorical(lat, lon, startDate, endDate, cacheKey) {
      try {
        const url = new URL(CONFIG.ARCHIVE_API_URL);
        url.searchParams.set("latitude", lat);
        url.searchParams.set("longitude", lon);
        url.searchParams.set("start_date", startDate);
        url.searchParams.set("end_date", endDate);
        url.searchParams.set(
          "daily",
          [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "precipitation_sum",
            "wind_speed_10m_max",
            "relative_humidity_2m_mean",
            "sunshine_duration",
            "weather_code",
          ].join(","),
        );
        url.searchParams.set("timezone", "Europe/Berlin");

        console.log(
          `🌐 [HistoryDataManager] Fetching: ${startDate} to ${endDate}`,
        );
        const startTime = performance.now();

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const normalized = this._normalizeApiResponse(data);

        const duration = Math.round(performance.now() - startTime);
        console.log(
          `✅ [HistoryDataManager] Fetched ${normalized.length} days in ${duration}ms`,
        );

        // Cache successful response
        this._setCache(cacheKey, normalized);

        return normalized;
      } catch (error) {
        console.error(`❌ [HistoryDataManager] Fetch failed:`, error);
        // Return fallback empty array on error
        return [];
      }
    }

    /**
     * Normalize Open-Meteo API response to unified format
     */
    _normalizeApiResponse(data) {
      if (!data?.daily?.time) return [];

      const { daily } = data;
      return daily.time.map((date, i) => ({
        date,
        temp_max: daily.temperature_2m_max?.[i] ?? null,
        temp_min: daily.temperature_2m_min?.[i] ?? null,
        temp_avg: daily.temperature_2m_mean?.[i] ?? null,
        precip: daily.precipitation_sum?.[i] ?? 0,
        wind_speed: daily.wind_speed_10m_max?.[i] ?? 0,
        humidity: daily.relative_humidity_2m_mean?.[i] ?? null,
        // Convert sunshine from seconds to hours
        sunshine: daily.sunshine_duration?.[i]
          ? Math.round((daily.sunshine_duration[i] / 3600) * 10) / 10
          : 0,
        weather_code: daily.weather_code?.[i] ?? null,
      }));
    }

    /**
     * Fetch data for a specific month/year
     */
    async fetchMonthData(lat, lon, year, month) {
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      return this.fetchHistoricalData(lat, lon, startDate, endDate);
    }

    /**
     * Fetch last N days of data
     */
    async fetchLastNDays(lat, lon, days) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      // Archive API has ~5 day delay, use forecast API for recent days
      const archiveEnd = new Date();
      archiveEnd.setDate(archiveEnd.getDate() - 5);

      const formatDate = (d) => d.toISOString().split("T")[0];

      if (start < archiveEnd) {
        // Need to combine archive + forecast
        const archiveData = await this.fetchHistoricalData(
          lat,
          lon,
          formatDate(start),
          formatDate(archiveEnd),
        );
        const forecastData = await this._fetchRecentForecast(lat, lon, 5);
        return [...archiveData, ...forecastData];
      } else {
        return this._fetchRecentForecast(lat, lon, days);
      }
    }

    async _fetchRecentForecast(lat, lon, days) {
      try {
        const url = new URL(CONFIG.FORECAST_API_URL);
        url.searchParams.set("latitude", lat);
        url.searchParams.set("longitude", lon);
        url.searchParams.set("past_days", Math.min(days, 92));
        url.searchParams.set("forecast_days", 0);
        url.searchParams.set(
          "daily",
          [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "wind_speed_10m_max",
            "relative_humidity_2m_mean",
            "sunshine_duration",
          ].join(","),
        );
        url.searchParams.set("timezone", "Europe/Berlin");

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        return this._normalizeApiResponse(data);
      } catch (error) {
        console.error(`❌ [HistoryDataManager] Forecast fetch failed:`, error);
        return [];
      }
    }

    _getFromCache(key) {
      const entry = this.cache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        this.cache.delete(key);
        return null;
      }
      return entry.data;
    }

    _setCache(key, data) {
      this.cache.set(key, {
        data,
        expires: Date.now() + CONFIG.CACHE_TTL,
      });
    }

    clearCache() {
      this.cache.clear();
      console.log("🗑️ [HistoryDataManager] Cache cleared");
    }
  }

  // ============================================
  // CALCULATION ENGINE - Statistics & Insights
  // ============================================
  class CalculationEngine {
    /**
     * Calculate comprehensive statistics from weather data
     * @param {Array} data - Array of daily weather objects
     * @returns {Object} - Statistics object
     */
    static calculateStats(data) {
      if (!data || data.length === 0) return CalculationEngine.getEmptyStats();

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
        stormDays: validWind.filter((d) => d.wind_speed >= 62).length, // Beaufort 8+
        windyDays: validWind.filter((d) => d.wind_speed >= 39).length, // Beaufort 6+
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

    static getEmptyStats() {
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
     * Calculate percentage difference between two values
     */
    static calcPercentageDiff(valueA, valueB) {
      if (valueB === 0 || valueB === null) return null;
      return ((valueA - valueB) / Math.abs(valueB)) * 100;
    }

    /**
     * Calculate absolute difference between two values
     */
    static calcAbsoluteDiff(valueA, valueB) {
      if (valueA === null || valueB === null) return null;
      return valueA - valueB;
    }

    /**
     * Compare two periods and return detailed comparison
     */
    static comparePeriods(statsA, statsB) {
      const compare = (a, b, unit = "", decimals = 1) => {
        const diff = CalculationEngine.calcAbsoluteDiff(a, b);
        const pct = CalculationEngine.calcPercentageDiff(a, b);
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

    /**
     * Generate dynamic insights based on stats and climate normals
     */
    static generateInsights(stats, previousStats = null, month = 0) {
      const insights = [];
      const monthName = CONFIG.MONTH_NAMES[month];
      const normals =
        CONFIG.CLIMATE_NORMALS[monthName] || CONFIG.CLIMATE_NORMALS.january;

      // Temperature anomaly insight
      if (stats.avgTemp !== null) {
        const tempAnomaly = stats.avgTemp - normals.avgTemp;
        if (Math.abs(tempAnomaly) >= 1.5) {
          const isWarm = tempAnomaly > 0;
          insights.push({
            type: isWarm ? "insight-item--warm" : "insight-item--cold",
            icon: isWarm ? "local_fire_department" : "ac_unit",
            text: `Dieser Monat ist ${Math.abs(tempAnomaly).toFixed(1)}°C ${isWarm ? "wärmer" : "kälter"} als das Klimamittel (${normals.avgTemp.toFixed(1)}°C).`,
            priority: 1,
          });
        }
      }

      // Frost days insight
      if (stats.frostDays > 0) {
        const frostSeverity =
          stats.frostDays > 20
            ? "viele"
            : stats.frostDays > 10
              ? "einige"
              : "wenige";
        insights.push({
          type: "insight-item--cold",
          icon: "severe_cold",
          text: `${stats.frostDays} Frosttage (Tmin < 0°C) – ${frostSeverity} für diesen Monat.`,
          priority: 2,
        });
      }

      // Ice days insight (entire day below 0)
      if (stats.iceDays > 0) {
        insights.push({
          type: "insight-item--extreme",
          icon: "weather_snowy",
          text: `${stats.iceDays} Eistage, an denen es durchgehend unter 0°C blieb.`,
          priority: 2,
        });
      }

      // Precipitation insight
      if (stats.totalPrecip !== null) {
        const precipAnomaly =
          ((stats.totalPrecip - normals.precip) / normals.precip) * 100;
        if (Math.abs(precipAnomaly) >= 30) {
          const isWet = precipAnomaly > 0;
          insights.push({
            type: isWet ? "insight-item--rain" : "insight-item--dry",
            icon: isWet ? "rainy" : "wb_sunny",
            text: `${Math.abs(precipAnomaly).toFixed(0)}% ${isWet ? "mehr" : "weniger"} Niederschlag als üblich (${stats.totalPrecip.toFixed(1)} vs. ${normals.precip.toFixed(1)} mm).`,
            priority: 2,
          });
        }
      }

      // Heavy rain events
      if (stats.heavyRainDays > 0) {
        insights.push({
          type: "insight-item--rain",
          icon: "thunderstorm",
          text: `${stats.heavyRainDays} Tag${stats.heavyRainDays > 1 ? "e" : ""} mit Starkniederschlag (≥10mm).`,
          priority: 3,
        });
      }

      // Comparison with previous period
      if (
        previousStats &&
        previousStats.avgTemp !== null &&
        stats.avgTemp !== null
      ) {
        const tempDiff = stats.avgTemp - previousStats.avgTemp;
        if (Math.abs(tempDiff) >= 2) {
          insights.push({
            type: tempDiff > 0 ? "insight-item--warm" : "insight-item--cold",
            icon: tempDiff > 0 ? "trending_up" : "trending_down",
            text: `${Math.abs(tempDiff).toFixed(1)}°C ${tempDiff > 0 ? "wärmer" : "kälter"} als im Vormonat.`,
            priority: 3,
          });
        }
      }

      // Storm days insight
      if (stats.stormDays > 0) {
        insights.push({
          type: "insight-item--extreme",
          icon: "storm",
          text: `${stats.stormDays} Sturmtag${stats.stormDays > 1 ? "e" : ""} mit Windböen über 62 km/h.`,
          priority: 3,
        });
      }

      // Sunshine insight
      if (stats.totalSunshine > 0) {
        const sunAnomaly =
          ((stats.totalSunshine - normals.sunshine) / normals.sunshine) * 100;
        if (Math.abs(sunAnomaly) >= 25) {
          const isSunny = sunAnomaly > 0;
          insights.push({
            type: isSunny ? "insight-item--neutral" : "insight-item--cold",
            icon: isSunny ? "wb_sunny" : "cloud",
            text: `${Math.abs(sunAnomaly).toFixed(0)}% ${isSunny ? "mehr" : "weniger"} Sonnenstunden als üblich.`,
            priority: 4,
          });
        }
      }

      // Sort by priority and return top insights
      return insights.sort((a, b) => a.priority - b.priority).slice(0, 4);
    }

    /**
     * Get extremes from a dataset
     */
    static findExtremes(data) {
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
  }

  // ============================================
  // CHART MANAGER - Memory-Safe Chart Handling
  // ============================================
  class ChartManager {
    constructor() {
      this.instances = new Map();
    }

    /**
     * Create or update a chart, destroying existing instance first
     */
    create(canvasId, config) {
      // Destroy existing chart on this canvas
      this.destroy(canvasId);

      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.warn(`[ChartManager] Canvas not found: ${canvasId}`);
        return null;
      }

      // Ensure Chart.js is available
      if (typeof Chart === "undefined") {
        console.error("[ChartManager] Chart.js not loaded");
        return null;
      }

      try {
        const ctx = canvas.getContext("2d");
        const chart = new Chart(ctx, config);
        this.instances.set(canvasId, chart);
        console.log(`📊 [ChartManager] Created chart: ${canvasId}`);
        return chart;
      } catch (error) {
        console.error(`[ChartManager] Failed to create chart:`, error);
        return null;
      }
    }

    /**
     * Destroy a specific chart by canvas ID
     */
    destroy(canvasId) {
      const chart = this.instances.get(canvasId);
      if (chart) {
        try {
          chart.destroy();
          this.instances.delete(canvasId);
          console.log(`🗑️ [ChartManager] Destroyed chart: ${canvasId}`);
        } catch (error) {
          console.error(`[ChartManager] Error destroying chart:`, error);
        }
      }
    }

    /**
     * Destroy all chart instances (call on tab switch)
     */
    destroyAll() {
      const count = this.instances.size;
      this.instances.forEach((chart, id) => {
        try {
          chart.destroy();
        } catch (e) {
          console.warn(`[ChartManager] Error destroying ${id}:`, e);
        }
      });
      this.instances.clear();
      if (count > 0) {
        console.log(`🗑️ [ChartManager] Destroyed all ${count} charts`);
      }
    }

    /**
     * Check if a chart exists
     */
    has(canvasId) {
      return this.instances.has(canvasId);
    }

    /**
     * Get a chart instance
     */
    get(canvasId) {
      return this.instances.get(canvasId);
    }
  }

  // ============================================
  // STATE MANAGER - Centralized State
  // ============================================
  class StateManager {
    constructor(initialState = {}) {
      this._state = { ...initialState };
      this._listeners = new Map();
    }

    get(key) {
      return key ? this._state[key] : { ...this._state };
    }

    set(key, value) {
      const oldValue = this._state[key];
      this._state[key] = value;

      // Notify listeners
      if (this._listeners.has(key)) {
        this._listeners.get(key).forEach((cb) => cb(value, oldValue));
      }
    }

    subscribe(key, callback) {
      if (!this._listeners.has(key)) {
        this._listeners.set(key, new Set());
      }
      this._listeners.get(key).add(callback);

      // Return unsubscribe function
      return () => this._listeners.get(key)?.delete(callback);
    }

    reset(initialState = {}) {
      this._state = { ...initialState };
    }
  }

  // ============================================
  // SINGLETON INSTANCES
  // ============================================
  const dataManager = new HistoryDataManager();
  const chartManager = new ChartManager();

  // Available locations
  const LOCATIONS = [
    { id: "current", name: "Aktueller Standort", lat: 52.52, lon: 13.41 },
    { id: "berlin", name: "Berlin", lat: 52.52, lon: 13.41 },
    { id: "munich", name: "München", lat: 48.14, lon: 11.58 },
    { id: "hamburg", name: "Hamburg", lat: 53.55, lon: 9.99 },
    { id: "cologne", name: "Köln", lat: 50.94, lon: 6.96 },
    { id: "frankfurt", name: "Frankfurt", lat: 50.11, lon: 8.68 },
  ];

  // Available periods for comparison
  const AVAILABLE_PERIODS = [
    { id: "januar2026", label: "Januar 2026", year: 2026, month: 0 },
    { id: "dezember2025", label: "Dezember 2025", year: 2025, month: 11 },
    { id: "januar2025", label: "Januar 2025", year: 2025, month: 0 },
    { id: "dezember2024", label: "Dezember 2024", year: 2024, month: 11 },
    { id: "juli2024", label: "Juli 2024", year: 2024, month: 6 },
  ];

  // ============================================
  // STATIC MOCK DATA - Realistic weather data
  // ============================================
  const MOCK_DATA = {
    januar2025: [
      {
        date: "2025-01-01",
        temp_min: -1.2,
        temp_max: 4.8,
        temp_avg: 1.8,
        precip: 0,
        wind_speed: 12,
        humidity: 78,
        sunshine: 2.1,
      },
      {
        date: "2025-01-02",
        temp_min: 0.5,
        temp_max: 6.2,
        temp_avg: 3.4,
        precip: 0,
        wind_speed: 8,
        humidity: 72,
        sunshine: 3.5,
      },
      {
        date: "2025-01-03",
        temp_min: 2.1,
        temp_max: 7.8,
        temp_avg: 5.0,
        precip: 2.4,
        wind_speed: 15,
        humidity: 85,
        sunshine: 0.5,
      },
      {
        date: "2025-01-04",
        temp_min: 1.8,
        temp_max: 5.4,
        temp_avg: 3.6,
        precip: 5.2,
        wind_speed: 22,
        humidity: 92,
        sunshine: 0,
      },
      {
        date: "2025-01-05",
        temp_min: -0.5,
        temp_max: 3.2,
        temp_avg: 1.4,
        precip: 1.8,
        wind_speed: 18,
        humidity: 88,
        sunshine: 1.2,
      },
      {
        date: "2025-01-06",
        temp_min: -2.4,
        temp_max: 2.1,
        temp_avg: -0.2,
        precip: 0,
        wind_speed: 10,
        humidity: 75,
        sunshine: 4.2,
      },
      {
        date: "2025-01-07",
        temp_min: -3.8,
        temp_max: 1.5,
        temp_avg: -1.2,
        precip: 0,
        wind_speed: 6,
        humidity: 70,
        sunshine: 5.1,
      },
      {
        date: "2025-01-08",
        temp_min: -4.2,
        temp_max: 0.8,
        temp_avg: -1.7,
        precip: 0.5,
        wind_speed: 8,
        humidity: 82,
        sunshine: 2.8,
      },
      {
        date: "2025-01-09",
        temp_min: -5.5,
        temp_max: -0.5,
        temp_avg: -3.0,
        precip: 3.2,
        wind_speed: 14,
        humidity: 90,
        sunshine: 0,
      },
      {
        date: "2025-01-10",
        temp_min: -8.2,
        temp_max: -2.4,
        temp_avg: -5.3,
        precip: 1.5,
        wind_speed: 12,
        humidity: 85,
        sunshine: 1.5,
      },
      {
        date: "2025-01-11",
        temp_min: -10.5,
        temp_max: -4.2,
        temp_avg: -7.4,
        precip: 0,
        wind_speed: 5,
        humidity: 72,
        sunshine: 6.2,
      },
      {
        date: "2025-01-12",
        temp_min: -12.1,
        temp_max: -5.8,
        temp_avg: -9.0,
        precip: 0,
        wind_speed: 4,
        humidity: 68,
        sunshine: 6.8,
      },
      {
        date: "2025-01-13",
        temp_min: -11.8,
        temp_max: -4.5,
        temp_avg: -8.2,
        precip: 0,
        wind_speed: 6,
        humidity: 65,
        sunshine: 5.9,
      },
      {
        date: "2025-01-14",
        temp_min: -13.2,
        temp_max: -6.2,
        temp_avg: -9.7,
        precip: 0,
        wind_speed: 3,
        humidity: 62,
        sunshine: 7.1,
      },
      {
        date: "2025-01-15",
        temp_min: -11.5,
        temp_max: -3.8,
        temp_avg: -7.7,
        precip: 0.8,
        wind_speed: 8,
        humidity: 78,
        sunshine: 3.2,
      },
      {
        date: "2025-01-16",
        temp_min: -9.2,
        temp_max: -2.1,
        temp_avg: -5.7,
        precip: 2.1,
        wind_speed: 15,
        humidity: 88,
        sunshine: 0.5,
      },
      {
        date: "2025-01-17",
        temp_min: -6.8,
        temp_max: 0.5,
        temp_avg: -3.2,
        precip: 4.5,
        wind_speed: 20,
        humidity: 92,
        sunshine: 0,
      },
      {
        date: "2025-01-18",
        temp_min: -4.2,
        temp_max: 2.8,
        temp_avg: -0.7,
        precip: 2.8,
        wind_speed: 18,
        humidity: 85,
        sunshine: 1.8,
      },
      {
        date: "2025-01-19",
        temp_min: -2.5,
        temp_max: 4.2,
        temp_avg: 0.9,
        precip: 0,
        wind_speed: 12,
        humidity: 75,
        sunshine: 4.5,
      },
      {
        date: "2025-01-20",
        temp_min: -1.8,
        temp_max: 5.5,
        temp_avg: 1.9,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.2,
      },
      {
        date: "2025-01-21",
        temp_min: 0.2,
        temp_max: 6.8,
        temp_avg: 3.5,
        precip: 1.2,
        wind_speed: 14,
        humidity: 82,
        sunshine: 2.1,
      },
      {
        date: "2025-01-22",
        temp_min: 1.5,
        temp_max: 7.2,
        temp_avg: 4.4,
        precip: 3.8,
        wind_speed: 22,
        humidity: 90,
        sunshine: 0.8,
      },
      {
        date: "2025-01-23",
        temp_min: 2.8,
        temp_max: 8.5,
        temp_avg: 5.7,
        precip: 6.2,
        wind_speed: 28,
        humidity: 95,
        sunshine: 0,
      },
      {
        date: "2025-01-24",
        temp_min: 1.2,
        temp_max: 6.8,
        temp_avg: 4.0,
        precip: 2.4,
        wind_speed: 18,
        humidity: 88,
        sunshine: 1.5,
      },
      {
        date: "2025-01-25",
        temp_min: -0.5,
        temp_max: 4.5,
        temp_avg: 2.0,
        precip: 0,
        wind_speed: 10,
        humidity: 75,
        sunshine: 4.8,
      },
      {
        date: "2025-01-26",
        temp_min: -1.8,
        temp_max: 3.2,
        temp_avg: 0.7,
        precip: 0,
        wind_speed: 6,
        humidity: 68,
        sunshine: 5.5,
      },
      {
        date: "2025-01-27",
        temp_min: -2.5,
        temp_max: 2.8,
        temp_avg: 0.2,
        precip: 0.5,
        wind_speed: 12,
        humidity: 80,
        sunshine: 3.2,
      },
      {
        date: "2025-01-28",
        temp_min: -1.2,
        temp_max: 4.5,
        temp_avg: 1.7,
        precip: 1.8,
        wind_speed: 16,
        humidity: 85,
        sunshine: 1.8,
      },
      {
        date: "2025-01-29",
        temp_min: 0.5,
        temp_max: 5.8,
        temp_avg: 3.2,
        precip: 0,
        wind_speed: 10,
        humidity: 72,
        sunshine: 4.2,
      },
      {
        date: "2025-01-30",
        temp_min: 1.2,
        temp_max: 6.5,
        temp_avg: 3.9,
        precip: 0,
        wind_speed: 8,
        humidity: 68,
        sunshine: 5.1,
      },
      {
        date: "2025-01-31",
        temp_min: 0.8,
        temp_max: 5.2,
        temp_avg: 3.0,
        precip: 2.1,
        wind_speed: 14,
        humidity: 82,
        sunshine: 2.5,
      },
    ],
    januar2026: [
      {
        date: "2026-01-01",
        temp_min: -3.5,
        temp_max: 2.2,
        temp_avg: -0.7,
        precip: 0,
        wind_speed: 15,
        humidity: 72,
        sunshine: 3.8,
      },
      {
        date: "2026-01-02",
        temp_min: -5.2,
        temp_max: 0.5,
        temp_avg: -2.4,
        precip: 1.2,
        wind_speed: 18,
        humidity: 80,
        sunshine: 2.1,
      },
      {
        date: "2026-01-03",
        temp_min: -7.8,
        temp_max: -1.5,
        temp_avg: -4.7,
        precip: 2.8,
        wind_speed: 22,
        humidity: 88,
        sunshine: 0.5,
      },
      {
        date: "2026-01-04",
        temp_min: -9.5,
        temp_max: -3.2,
        temp_avg: -6.4,
        precip: 0,
        wind_speed: 12,
        humidity: 75,
        sunshine: 5.2,
      },
      {
        date: "2026-01-05",
        temp_min: -11.2,
        temp_max: -4.8,
        temp_avg: -8.0,
        precip: 0,
        wind_speed: 8,
        humidity: 68,
        sunshine: 6.5,
      },
      {
        date: "2026-01-06",
        temp_min: -12.8,
        temp_max: -5.5,
        temp_avg: -9.2,
        precip: 0,
        wind_speed: 5,
        humidity: 62,
        sunshine: 7.2,
      },
      {
        date: "2026-01-07",
        temp_min: -14.2,
        temp_max: -7.2,
        temp_avg: -10.7,
        precip: 0,
        wind_speed: 4,
        humidity: 58,
        sunshine: 7.5,
      },
      {
        date: "2026-01-08",
        temp_min: -13.5,
        temp_max: -6.8,
        temp_avg: -10.2,
        precip: 0.5,
        wind_speed: 6,
        humidity: 65,
        sunshine: 6.2,
      },
      {
        date: "2026-01-09",
        temp_min: -11.8,
        temp_max: -4.2,
        temp_avg: -8.0,
        precip: 1.8,
        wind_speed: 12,
        humidity: 78,
        sunshine: 3.5,
      },
      {
        date: "2026-01-10",
        temp_min: -9.2,
        temp_max: -2.5,
        temp_avg: -5.9,
        precip: 3.5,
        wind_speed: 20,
        humidity: 88,
        sunshine: 0.8,
      },
      {
        date: "2026-01-11",
        temp_min: -6.5,
        temp_max: 0.2,
        temp_avg: -3.2,
        precip: 5.2,
        wind_speed: 25,
        humidity: 92,
        sunshine: 0,
      },
      {
        date: "2026-01-12",
        temp_min: -4.2,
        temp_max: 2.8,
        temp_avg: -0.7,
        precip: 2.8,
        wind_speed: 18,
        humidity: 85,
        sunshine: 2.2,
      },
      {
        date: "2026-01-13",
        temp_min: -2.8,
        temp_max: 4.5,
        temp_avg: 0.9,
        precip: 0,
        wind_speed: 10,
        humidity: 75,
        sunshine: 4.8,
      },
      {
        date: "2026-01-14",
        temp_min: -1.5,
        temp_max: 5.8,
        temp_avg: 2.2,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.5,
      },
      {
        date: "2026-01-15",
        temp_min: 0.2,
        temp_max: 6.5,
        temp_avg: 3.4,
        precip: 1.5,
        wind_speed: 14,
        humidity: 82,
        sunshine: 2.8,
      },
      {
        date: "2026-01-16",
        temp_min: 1.8,
        temp_max: 7.2,
        temp_avg: 4.5,
        precip: 4.2,
        wind_speed: 22,
        humidity: 90,
        sunshine: 0.5,
      },
      {
        date: "2026-01-17",
        temp_min: 0.5,
        temp_max: 5.5,
        temp_avg: 3.0,
        precip: 2.8,
        wind_speed: 16,
        humidity: 85,
        sunshine: 1.8,
      },
      {
        date: "2026-01-18",
        temp_min: -1.2,
        temp_max: 4.2,
        temp_avg: 1.5,
        precip: 0,
        wind_speed: 10,
        humidity: 75,
        sunshine: 4.5,
      },
      {
        date: "2026-01-19",
        temp_min: -0.5,
        temp_max: 5.8,
        temp_avg: 2.7,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.2,
      },
      {
        date: "2026-01-20",
        temp_min: 2.5,
        temp_max: 9.2,
        temp_avg: 5.9,
        precip: 0,
        wind_speed: 6,
        humidity: 65,
        sunshine: 6.1,
      },
      {
        date: "2026-01-21",
        temp_min: 4.8,
        temp_max: 11.5,
        temp_avg: 8.2,
        precip: 0,
        wind_speed: 5,
        humidity: 62,
        sunshine: 6.8,
      },
      {
        date: "2026-01-22",
        temp_min: 5.5,
        temp_max: 12.8,
        temp_avg: 9.2,
        precip: 0,
        wind_speed: 8,
        humidity: 68,
        sunshine: 5.5,
      },
      {
        date: "2026-01-23",
        temp_min: 6.2,
        temp_max: 13.5,
        temp_avg: 9.9,
        precip: 1.2,
        wind_speed: 12,
        humidity: 75,
        sunshine: 3.8,
      },
      {
        date: "2026-01-24",
        temp_min: 4.8,
        temp_max: 10.2,
        temp_avg: 7.5,
        precip: 3.5,
        wind_speed: 18,
        humidity: 85,
        sunshine: 1.5,
      },
      {
        date: "2026-01-25",
        temp_min: 2.2,
        temp_max: 7.5,
        temp_avg: 4.9,
        precip: 0,
        wind_speed: 12,
        humidity: 75,
        sunshine: 4.2,
      },
      {
        date: "2026-01-26",
        temp_min: -0.5,
        temp_max: 5.2,
        temp_avg: 2.4,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.8,
      },
      {
        date: "2026-01-27",
        temp_min: -2.8,
        temp_max: 3.5,
        temp_avg: 0.4,
        precip: 2.5,
        wind_speed: 15,
        humidity: 82,
        sunshine: 2.1,
      },
      {
        date: "2026-01-28",
        temp_min: -4.5,
        temp_max: 1.2,
        temp_avg: -1.7,
        precip: 4.8,
        wind_speed: 22,
        humidity: 90,
        sunshine: 0,
      },
      {
        date: "2026-01-29",
        temp_min: -3.2,
        temp_max: 2.8,
        temp_avg: -0.2,
        precip: 1.5,
        wind_speed: 16,
        humidity: 85,
        sunshine: 2.5,
      },
      {
        date: "2026-01-30",
        temp_min: -1.5,
        temp_max: 4.5,
        temp_avg: 1.5,
        precip: 0,
        wind_speed: 10,
        humidity: 75,
        sunshine: 4.8,
      },
      {
        date: "2026-01-31",
        temp_min: -0.8,
        temp_max: 5.2,
        temp_avg: 2.2,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.2,
      },
    ],
    dezember2024: [
      {
        date: "2024-12-01",
        temp_min: 1.2,
        temp_max: 6.5,
        temp_avg: 3.9,
        precip: 2.1,
        wind_speed: 14,
        humidity: 82,
        sunshine: 2.5,
      },
      {
        date: "2024-12-02",
        temp_min: 0.5,
        temp_max: 5.8,
        temp_avg: 3.2,
        precip: 0,
        wind_speed: 10,
        humidity: 72,
        sunshine: 4.2,
      },
      {
        date: "2024-12-03",
        temp_min: -0.8,
        temp_max: 4.2,
        temp_avg: 1.7,
        precip: 1.5,
        wind_speed: 12,
        humidity: 78,
        sunshine: 2.8,
      },
      {
        date: "2024-12-04",
        temp_min: -2.1,
        temp_max: 3.5,
        temp_avg: 0.7,
        precip: 3.2,
        wind_speed: 18,
        humidity: 85,
        sunshine: 0.5,
      },
      {
        date: "2024-12-05",
        temp_min: -3.5,
        temp_max: 1.8,
        temp_avg: -0.9,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.1,
      },
      {
        date: "2024-12-06",
        temp_min: -4.8,
        temp_max: 0.5,
        temp_avg: -2.2,
        precip: 0,
        wind_speed: 5,
        humidity: 65,
        sunshine: 6.2,
      },
      {
        date: "2024-12-07",
        temp_min: -5.5,
        temp_max: -0.8,
        temp_avg: -3.2,
        precip: 1.8,
        wind_speed: 12,
        humidity: 80,
        sunshine: 1.5,
      },
      {
        date: "2024-12-08",
        temp_min: -6.2,
        temp_max: -1.5,
        temp_avg: -3.9,
        precip: 2.5,
        wind_speed: 15,
        humidity: 85,
        sunshine: 0.8,
      },
      {
        date: "2024-12-09",
        temp_min: -4.5,
        temp_max: 0.2,
        temp_avg: -2.2,
        precip: 0,
        wind_speed: 10,
        humidity: 75,
        sunshine: 4.5,
      },
      {
        date: "2024-12-10",
        temp_min: -2.8,
        temp_max: 2.5,
        temp_avg: -0.2,
        precip: 0,
        wind_speed: 8,
        humidity: 70,
        sunshine: 5.2,
      },
      {
        date: "2024-12-11",
        temp_min: -1.2,
        temp_max: 4.8,
        temp_avg: 1.8,
        precip: 1.2,
        wind_speed: 14,
        humidity: 78,
        sunshine: 2.1,
      },
      {
        date: "2024-12-12",
        temp_min: 0.5,
        temp_max: 6.2,
        temp_avg: 3.4,
        precip: 4.5,
        wind_speed: 22,
        humidity: 90,
        sunshine: 0,
      },
      {
        date: "2024-12-13",
        temp_min: 2.1,
        temp_max: 7.5,
        temp_avg: 4.8,
        precip: 5.8,
        wind_speed: 25,
        humidity: 92,
        sunshine: 0,
      },
      {
        date: "2024-12-14",
        temp_min: 1.5,
        temp_max: 5.8,
        temp_avg: 3.7,
        precip: 2.1,
        wind_speed: 18,
        humidity: 85,
        sunshine: 1.2,
      },
      {
        date: "2024-12-15",
        temp_min: -0.5,
        temp_max: 4.2,
        temp_avg: 1.9,
        precip: 0,
        wind_speed: 10,
        humidity: 72,
        sunshine: 4.8,
      },
    ],
    juli2024: [
      {
        date: "2024-07-01",
        temp_min: 15.2,
        temp_max: 26.5,
        temp_avg: 20.9,
        precip: 0,
        wind_speed: 8,
        humidity: 55,
        sunshine: 12.5,
      },
      {
        date: "2024-07-02",
        temp_min: 16.8,
        temp_max: 28.2,
        temp_avg: 22.5,
        precip: 0,
        wind_speed: 6,
        humidity: 52,
        sunshine: 13.2,
      },
      {
        date: "2024-07-03",
        temp_min: 18.5,
        temp_max: 31.5,
        temp_avg: 25.0,
        precip: 0,
        wind_speed: 5,
        humidity: 48,
        sunshine: 14.1,
      },
      {
        date: "2024-07-04",
        temp_min: 19.2,
        temp_max: 33.8,
        temp_avg: 26.5,
        precip: 0,
        wind_speed: 8,
        humidity: 45,
        sunshine: 14.5,
      },
      {
        date: "2024-07-05",
        temp_min: 20.5,
        temp_max: 35.2,
        temp_avg: 27.9,
        precip: 0,
        wind_speed: 10,
        humidity: 42,
        sunshine: 14.8,
      },
      {
        date: "2024-07-06",
        temp_min: 21.2,
        temp_max: 36.5,
        temp_avg: 28.9,
        precip: 0,
        wind_speed: 12,
        humidity: 40,
        sunshine: 15.0,
      },
      {
        date: "2024-07-07",
        temp_min: 22.5,
        temp_max: 37.8,
        temp_avg: 30.2,
        precip: 0,
        wind_speed: 8,
        humidity: 38,
        sunshine: 15.2,
      },
      {
        date: "2024-07-08",
        temp_min: 23.2,
        temp_max: 38.5,
        temp_avg: 30.9,
        precip: 0,
        wind_speed: 6,
        humidity: 35,
        sunshine: 15.5,
      },
      {
        date: "2024-07-09",
        temp_min: 24.5,
        temp_max: 39.2,
        temp_avg: 31.9,
        precip: 0,
        wind_speed: 5,
        humidity: 32,
        sunshine: 15.8,
      },
      {
        date: "2024-07-10",
        temp_min: 25.2,
        temp_max: 40.5,
        temp_avg: 32.9,
        precip: 0,
        wind_speed: 8,
        humidity: 30,
        sunshine: 16.0,
      },
      {
        date: "2024-07-11",
        temp_min: 24.8,
        temp_max: 39.8,
        temp_avg: 32.3,
        precip: 0,
        wind_speed: 10,
        humidity: 32,
        sunshine: 15.5,
      },
      {
        date: "2024-07-12",
        temp_min: 23.5,
        temp_max: 38.2,
        temp_avg: 30.9,
        precip: 0,
        wind_speed: 12,
        humidity: 35,
        sunshine: 14.8,
      },
      {
        date: "2024-07-13",
        temp_min: 22.8,
        temp_max: 36.5,
        temp_avg: 29.7,
        precip: 2.5,
        wind_speed: 18,
        humidity: 55,
        sunshine: 10.2,
      },
      {
        date: "2024-07-14",
        temp_min: 20.2,
        temp_max: 32.8,
        temp_avg: 26.5,
        precip: 8.5,
        wind_speed: 22,
        humidity: 72,
        sunshine: 5.5,
      },
      {
        date: "2024-07-15",
        temp_min: 18.5,
        temp_max: 28.5,
        temp_avg: 23.5,
        precip: 12.2,
        wind_speed: 25,
        humidity: 85,
        sunshine: 2.1,
      },
      {
        date: "2024-07-16",
        temp_min: 16.2,
        temp_max: 25.8,
        temp_avg: 21.0,
        precip: 5.8,
        wind_speed: 18,
        humidity: 78,
        sunshine: 6.5,
      },
      {
        date: "2024-07-17",
        temp_min: 15.8,
        temp_max: 27.2,
        temp_avg: 21.5,
        precip: 0,
        wind_speed: 10,
        humidity: 62,
        sunshine: 11.2,
      },
      {
        date: "2024-07-18",
        temp_min: 16.5,
        temp_max: 29.5,
        temp_avg: 23.0,
        precip: 0,
        wind_speed: 8,
        humidity: 55,
        sunshine: 13.5,
      },
    ],
  };

  // ============================================
  // MAIN CLASS - History View Controller
  // ============================================
  class HistoryView {
    constructor(options = {}) {
      this.containerId = options.containerId || "history-container";

      // State management
      this.state = new StateManager({
        currentTab: "analyse",
        currentMetric: "temperature",
        currentPeriod: "30",
        comparisonPeriodA: "januar2025",
        comparisonPeriodB: "januar2026",
        customStartDate: null,
        customEndDate: null,
        isLoading: false,
      });

      // View state
      this.currentTab = "analyse";
      this.currentMetric = "temperature";
      this.currentPeriod = "30";
      this.currentLocation = LOCATIONS[0];
      this.comparisonPeriodA = "januar2025";
      this.comparisonPeriodB = "januar2026";
      this.customStartDate = null;
      this.customEndDate = null;
      this.currentCalendarDate = new Date();
      this.selectedCalendarDay = null;
      this.selectedExtreme = null;
      this.isLoading = false;

      // Data cache for current session
      this._dataCache = new Map();
    }

    // ========================================
    // PUBLIC API
    // ========================================
    async render(rawHistory) {
      const container = document.querySelector(`#${this.containerId}`);
      if (!container) {
        console.error("History container not found:", this.containerId);
        return;
      }

      this._renderShell(container);
      this._bindGlobalEvents(container);
      await this._loadTabWithSkeleton();
    }

    // ========================================
    // DATA FETCHING - Real API Integration
    // ========================================

    /**
     * Fetch data for the currently selected period
     */
    async _fetchCurrentPeriodData() {
      const { lat, lon } = this.currentLocation;
      const days = parseInt(this.currentPeriod, 10);

      if (
        this.currentPeriod === "custom" &&
        this.customStartDate &&
        this.customEndDate
      ) {
        return dataManager.fetchHistoricalData(
          lat,
          lon,
          this.customStartDate,
          this.customEndDate,
        );
      }

      // Fetch last N days
      return dataManager.fetchLastNDays(lat, lon, days || 30);
    }

    /**
     * Fetch data for a named period (e.g., "januar2025")
     */
    async _fetchNamedPeriodData(periodId) {
      const period = AVAILABLE_PERIODS.find((p) => p.id === periodId);
      if (!period) {
        console.warn(`[HistoryView] Unknown period: ${periodId}`);
        return [];
      }

      const { lat, lon } = this.currentLocation;
      return dataManager.fetchMonthData(lat, lon, period.year, period.month);
    }

    /**
     * Get data for the current period (with caching)
     */
    async _getDataForPeriod() {
      const cacheKey = `period_${this.currentLocation.id}_${this.currentPeriod}`;

      if (this._dataCache.has(cacheKey)) {
        return this._dataCache.get(cacheKey);
      }

      const data = await this._fetchCurrentPeriodData();
      this._dataCache.set(cacheKey, data);
      return data;
    }

    /**
     * Get comparison data for two periods
     */
    async _getComparisonData() {
      const [dataA, dataB] = await Promise.all([
        this._fetchNamedPeriodData(this.comparisonPeriodA),
        this._fetchNamedPeriodData(this.comparisonPeriodB),
      ]);
      return { dataA, dataB };
    }

    // ========================================
    // STATISTICS & CALCULATIONS (Delegated)
    // ========================================

    _calculateStats(data) {
      return CalculationEngine.calculateStats(data);
    }

    _comparePeriods(statsA, statsB) {
      return CalculationEngine.comparePeriods(statsA, statsB);
    }

    _generateDynamicInsights(stats, previousStats) {
      const month = this.currentCalendarDate.getMonth();
      return CalculationEngine.generateInsights(stats, previousStats, month);
    }

    _findExtremes(data) {
      return CalculationEngine.findExtremes(data);
    }

    // ========================================
    // CHART MANAGEMENT (Memory-Safe)
    // ========================================

    _destroyCharts() {
      chartManager.destroyAll();
    }

    _createChart(canvasId, config) {
      return chartManager.create(canvasId, config);
    }

    _destroyChart(canvasId) {
      chartManager.destroy(canvasId);
    }

    // ========================================
    // SHELL & NAVIGATION - Edge-to-Edge Native Layout
    // ========================================
    _renderShell(container) {
      container.innerHTML = `
        <div class="history-page">
          <!-- Sticky Glass Top Bar -->
          <header class="history-header top-bar" id="history-top-bar">
            <button class="history-header__location" id="history-location-btn">
              <span class="material-symbols-outlined">location_on</span>
              <span class="history-header__location-text">${this.currentLocation.name}</span>
              <span class="material-symbols-outlined history-header__chevron">expand_more</span>
            </button>
            <button class="history-header__action" id="history-info-btn" aria-label="Info">
              <span class="material-symbols-outlined">info</span>
            </button>
          </header>

          <!-- Sticky Tab Navigation -->
          <nav class="history-tabs" role="tablist">
            <button class="history-tab ${this.currentTab === "analyse" ? "history-tab--active" : ""}" data-tab="analyse" role="tab">
              <span class="material-symbols-outlined">analytics</span>
              Analyse
            </button>
            <button class="history-tab ${this.currentTab === "vergleich" ? "history-tab--active" : ""}" data-tab="vergleich" role="tab">
              <span class="material-symbols-outlined">compare</span>
              Vergleich
            </button>
            <button class="history-tab ${this.currentTab === "kalender" ? "history-tab--active" : ""}" data-tab="kalender" role="tab">
              <span class="material-symbols-outlined">calendar_month</span>
              Kalender
            </button>
            <button class="history-tab ${this.currentTab === "extreme" ? "history-tab--active" : ""}" data-tab="extreme" role="tab">
              <span class="material-symbols-outlined">warning</span>
              Extreme
            </button>
          </nav>

          <!-- Main Content with Bottom Safe Area -->
          <main class="history-content" id="history-tab-content" role="tabpanel"></main>
        </div>

        <!-- Modals Container -->
        <div class="history-modals" id="history-modals"></div>
      `;

      // Setup scroll listener for enhanced glass effect
      this._setupScrollListener(container);
    }

    // ========================================
    // SCROLL LISTENER - Enhanced Glass on Scroll
    // ========================================
    _setupScrollListener(container) {
      const topBar = container.querySelector("#history-top-bar");
      if (!topBar) return;

      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrollY =
              window.scrollY || document.documentElement.scrollTop;
            if (scrollY > 20) {
              topBar.classList.add(
                "history-header--scrolled",
                "top-bar--scrolled",
              );
            } else {
              topBar.classList.remove(
                "history-header--scrolled",
                "top-bar--scrolled",
              );
            }
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    _bindGlobalEvents(container) {
      // Tab navigation
      container.querySelectorAll(".history-tab").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const newTab = e.currentTarget.dataset.tab;
          if (newTab !== this.currentTab) {
            container
              .querySelectorAll(".history-tab")
              .forEach((b) => b.classList.remove("history-tab--active"));
            e.currentTarget.classList.add("history-tab--active");
            this.currentTab = newTab;
            await this._loadTabWithSkeleton();
          }
        });
      });

      // Location button
      const locationBtn = container.querySelector("#history-location-btn");
      if (locationBtn) {
        locationBtn.addEventListener("click", () => this._showLocationModal());
      }

      // Info button
      const infoBtn = container.querySelector("#history-info-btn");
      if (infoBtn) {
        infoBtn.addEventListener("click", () => this._showInfoModal());
      }
    }

    // ========================================
    // LOADING & SKELETON - Async Data Loading
    // ========================================
    async _loadTabWithSkeleton() {
      const content = document.querySelector("#history-tab-content");
      if (!content) return;

      // CRITICAL: Destroy all charts before switching tabs to prevent memory leaks
      this._destroyCharts();

      this.isLoading = true;
      content.innerHTML = this._renderSkeleton();
      content.classList.add("history-content--loading");

      try {
        // Render the active tab (which will fetch real data)
        await this._renderActiveTab();
      } catch (error) {
        console.error("[HistoryView] Tab loading failed:", error);
        content.innerHTML = this._renderErrorState(error.message);
      } finally {
        this.isLoading = false;
        content.classList.remove("history-content--loading");
      }
    }

    _renderSkeleton() {
      return `
        <div class="skeleton-container">
          <div class="skeleton-pills">
            <div class="skeleton skeleton--pill"></div>
            <div class="skeleton skeleton--pill"></div>
            <div class="skeleton skeleton--pill"></div>
            <div class="skeleton skeleton--pill"></div>
          </div>
          <div class="skeleton skeleton--chart"></div>
          <div class="skeleton-kpi-grid">
            <div class="skeleton skeleton--kpi"></div>
            <div class="skeleton skeleton--kpi"></div>
            <div class="skeleton skeleton--kpi"></div>
            <div class="skeleton skeleton--kpi"></div>
          </div>
        </div>
      `;
    }

    _renderErrorState(message) {
      return `
        <div class="history-error">
          <span class="material-symbols-outlined">cloud_off</span>
          <h3>Daten konnten nicht geladen werden</h3>
          <p>${message || "Bitte überprüfen Sie Ihre Internetverbindung."}</p>
          <button class="history-error__retry" onclick="this.closest('.history-page')?.__historyView?._loadTabWithSkeleton()">
            <span class="material-symbols-outlined">refresh</span>
            Erneut versuchen
          </button>
        </div>
      `;
    }

    async _renderActiveTab() {
      const content = document.querySelector("#history-tab-content");
      if (!content) return;

      switch (this.currentTab) {
        case "analyse":
          await this._renderAnalyseTab(content);
          break;
        case "vergleich":
          await this._renderVergleichTab(content);
          break;
        case "kalender":
          await this._renderKalenderTab(content);
          break;
        case "extreme":
          await this._renderExtremeTab(content);
          break;
      }
    }

    // ========================================
    // TAB 1: ANALYSE - Real Data Integration
    // ========================================
    async _renderAnalyseTab(container) {
      // Fetch real data from API
      const data = await this._getDataForPeriod();
      const stats = this._calculateStats(data);

      // Fetch previous period for comparison
      const previousPeriodId = this._getPreviousPeriodId();
      const previousData = previousPeriodId
        ? await this._fetchNamedPeriodData(previousPeriodId)
        : [];
      const previousStats = this._calculateStats(previousData);

      // Generate dynamic insights based on real data
      const insights = this._generateDynamicInsights(stats, previousStats);

      // Determine period label
      const periodLabel = this._getCurrentPeriodLabel();

      container.innerHTML = `
        <section class="analyse-section">
          <div class="metric-selector">
            ${this._renderMetricPills()}
          </div>

          <div class="period-selector">
            ${this._renderPeriodButtons()}
          </div>

          <div class="analyse-grid">
            <div class="chart-card">
              <div class="chart-card__header">
                <h3 class="chart-card__title">${this._getMetricTitle()}</h3>
                <span class="chart-card__subtitle">${periodLabel} · ${data.length} Tage</span>
              </div>
              <div class="chart-card__body">
                <canvas id="analyse-chart"></canvas>
              </div>
            </div>

            <aside class="insight-card">
              <div class="insight-card__header">
                <span class="material-symbols-outlined">lightbulb</span>
                <h4>Erkenntnisse</h4>
              </div>
              <div class="insight-card__body">
                ${
                  insights.length > 0
                    ? insights
                        .map(
                          (i) => `
                  <div class="insight-item ${i.type}">
                    <span class="material-symbols-outlined">${i.icon}</span>
                    <p>${i.text}</p>
                  </div>
                `,
                        )
                        .join("")
                    : `
                  <div class="insight-item insight-item--neutral">
                    <span class="material-symbols-outlined">info</span>
                    <p>Keine besonderen Auffälligkeiten in diesem Zeitraum.</p>
                  </div>
                `
                }
              </div>
            </aside>
          </div>

          <div class="kpi-grid">
            ${this._renderAnalyseKPIs(stats, previousStats)}
          </div>

          <details class="trend-accordion">
            <summary>
              <span class="material-symbols-outlined">trending_up</span>
              Trend-Interpretation
              <span class="material-symbols-outlined trend-accordion__chevron">expand_more</span>
            </summary>
            <div class="trend-accordion__content">
              ${this._generateTrendContent(stats)}
            </div>
          </details>
        </section>
      `;

      this._bindAnalyseEvents(container);

      // Draw chart with slight delay to ensure DOM is ready
      requestAnimationFrame(() => this._drawAnalyseChart(data));
    }

    /**
     * Get a readable label for the current period
     */
    _getCurrentPeriodLabel() {
      if (this.currentPeriod === "custom" && this.customStartDate) {
        return `${this.customStartDate} bis ${this.customEndDate}`;
      }
      const days = parseInt(this.currentPeriod, 10);
      if (days === 7) return "Letzte 7 Tage";
      if (days === 14) return "Letzte 14 Tage";
      if (days === 30) return "Letzte 30 Tage";
      if (days === 90) return "Letzte 90 Tage";
      return `Letzte ${days} Tage`;
    }

    /**
     * Get previous period ID for comparison
     */
    _getPreviousPeriodId() {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthNames = [
        "januar",
        "februar",
        "maerz",
        "april",
        "mai",
        "juni",
        "juli",
        "august",
        "september",
        "oktober",
        "november",
        "dezember",
      ];
      const periodId = `${monthNames[prevMonth.getMonth()]}${prevMonth.getFullYear()}`;
      return (
        AVAILABLE_PERIODS.find((p) => p.id === periodId)?.id ||
        AVAILABLE_PERIODS[2]?.id
      );
    }

    _renderMetricPills() {
      const metrics = [
        { id: "temperature", label: "Temperatur", icon: "device_thermostat" },
        { id: "precipitation", label: "Niederschlag", icon: "water_drop" },
        { id: "wind", label: "Wind", icon: "air" },
        { id: "humidity", label: "Feuchtigkeit", icon: "humidity_percentage" },
        { id: "sunshine", label: "Sonne", icon: "wb_sunny" },
      ];

      return metrics
        .map(
          (m) => `
        <button class="metric-pill ${this.currentMetric === m.id ? "metric-pill--active" : ""}" data-metric="${m.id}">
          <span class="material-symbols-outlined">${m.icon}</span>
          ${m.label}
        </button>
      `,
        )
        .join("");
    }

    _renderPeriodButtons() {
      const periods = [
        { id: "7", label: "7 Tage" },
        { id: "30", label: "30 Tage" },
        { id: "90", label: "3 Monate" },
        { id: "365", label: "1 Jahr" },
        { id: "custom", label: "Custom", icon: "date_range" },
      ];

      return periods
        .map(
          (p) => `
        <button class="period-btn ${this.currentPeriod === p.id ? "period-btn--active" : ""}" data-period="${p.id}">
          ${p.icon ? `<span class="material-symbols-outlined">${p.icon}</span>` : ""}
          ${p.label}
        </button>
      `,
        )
        .join("");
    }

    _getMetricTitle() {
      const titles = {
        temperature: "Temperaturverlauf",
        precipitation: "Niederschlag",
        wind: "Windgeschwindigkeit",
        humidity: "Luftfeuchtigkeit",
        sunshine: "Sonnenscheindauer",
      };
      return titles[this.currentMetric] || "Daten";
    }

    _renderAnalyseKPIs(stats, prevStats) {
      const kpis = this._getKPIsForMetric(stats, prevStats);
      return kpis
        .map(
          (kpi) => `
        <div class="kpi-card">
          <div class="kpi-card__icon">
            <span class="material-symbols-outlined">${kpi.icon}</span>
          </div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">${kpi.label}</span>
            <span class="kpi-card__value">${kpi.value}</span>
            ${
              kpi.change !== undefined
                ? `
              <span class="kpi-card__change ${kpi.change >= 0 ? "kpi-card__change--positive" : "kpi-card__change--negative"}">
                <span class="material-symbols-outlined">${kpi.change >= 0 ? "trending_up" : "trending_down"}</span>
                ${kpi.change >= 0 ? "+" : ""}${kpi.change.toFixed(1)}${kpi.changeUnit || ""}
              </span>
            `
                : ""
            }
          </div>
        </div>
      `,
        )
        .join("");
    }

    _getKPIsForMetric(stats, prevStats) {
      const changeTemp = stats.avgTemp - prevStats.avgTemp;
      const changePrecip = stats.totalPrecip - prevStats.totalPrecip;

      if (this.currentMetric === "temperature") {
        return [
          {
            icon: "thermostat",
            label: "Ø Temperatur",
            value: `${stats.avgTemp.toFixed(1)}°C`,
            change: changeTemp,
            changeUnit: "°C",
          },
          {
            icon: "arrow_upward",
            label: "Maximum",
            value: `${stats.maxTemp.toFixed(1)}°C`,
          },
          {
            icon: "arrow_downward",
            label: "Minimum",
            value: `${stats.minTemp.toFixed(1)}°C`,
          },
          {
            icon: "ac_unit",
            label: "Frosttage",
            value: `${stats.frostDays}`,
            change: stats.frostDays - prevStats.frostDays,
            changeUnit: "",
          },
        ];
      } else if (this.currentMetric === "precipitation") {
        return [
          {
            icon: "water_drop",
            label: "Gesamt",
            value: `${stats.totalPrecip.toFixed(1)} mm`,
            change: changePrecip,
            changeUnit: " mm",
          },
          {
            icon: "schedule",
            label: "Ø pro Tag",
            value: `${stats.avgPrecip.toFixed(1)} mm`,
          },
          {
            icon: "storm",
            label: "Max. Tag",
            value: `${stats.maxPrecip.toFixed(1)} mm`,
          },
          { icon: "rainy", label: "Regentage", value: `${stats.rainDays}` },
        ];
      } else if (this.currentMetric === "wind") {
        return [
          {
            icon: "air",
            label: "Ø Wind",
            value: `${stats.avgWind.toFixed(1)} km/h`,
          },
          {
            icon: "storm",
            label: "Max. Böe",
            value: `${stats.maxWind.toFixed(0)} km/h`,
          },
          { icon: "warning", label: "Sturmtage", value: `${stats.stormDays}` },
          { icon: "park", label: "Ruhige Tage", value: `${stats.calmDays}` },
        ];
      } else if (this.currentMetric === "humidity") {
        return [
          {
            icon: "humidity_percentage",
            label: "Ø Feuchtigkeit",
            value: `${stats.avgHumidity.toFixed(0)}%`,
          },
          {
            icon: "arrow_upward",
            label: "Maximum",
            value: `${stats.maxHumidity.toFixed(0)}%`,
          },
          {
            icon: "arrow_downward",
            label: "Minimum",
            value: `${stats.minHumidity.toFixed(0)}%`,
          },
          { icon: "cloud", label: "Feuchte Tage", value: `${stats.humidDays}` },
        ];
      } else if (this.currentMetric === "sunshine") {
        return [
          {
            icon: "wb_sunny",
            label: "Gesamt",
            value: `${stats.totalSunshine.toFixed(0)} h`,
          },
          {
            icon: "schedule",
            label: "Ø pro Tag",
            value: `${stats.avgSunshine.toFixed(1)} h`,
          },
          {
            icon: "brightness_high",
            label: "Sonnigster",
            value: `${stats.maxSunshine.toFixed(1)} h`,
          },
          { icon: "cloud", label: "Trübe Tage", value: `${stats.cloudyDays}` },
        ];
      }
      return [];
    }

    _generateDynamicInsights(stats, prevStats) {
      const insights = [];
      const tempDiff = stats.avgTemp - CONFIG.CLIMATE_AVERAGE;
      const precipDiff =
        ((stats.totalPrecip - prevStats.totalPrecip) /
          (prevStats.totalPrecip || 1)) *
        100;

      // Temperature insight
      if (Math.abs(tempDiff) > 0.5) {
        insights.push({
          type: tempDiff > 0 ? "insight-item--warm" : "insight-item--cold",
          icon: tempDiff > 0 ? "trending_up" : "trending_down",
          text: `${Math.abs(tempDiff).toFixed(1)}°C ${tempDiff > 0 ? "wärmer" : "kälter"} als das Klimamittel.`,
        });
      }

      // Precipitation insight
      if (Math.abs(precipDiff) > 10) {
        insights.push({
          type: precipDiff > 0 ? "insight-item--rain" : "insight-item--dry",
          icon: precipDiff > 0 ? "water_drop" : "wb_sunny",
          text: `${Math.abs(precipDiff).toFixed(0)}% ${precipDiff > 0 ? "mehr" : "weniger"} Niederschlag als im Vormonat.`,
        });
      }

      // Frost insight
      if (stats.frostDays > 15) {
        insights.push({
          type: "insight-item--cold",
          icon: "ac_unit",
          text: `Ausgeprägte Frostperiode mit ${stats.frostDays} Frosttagen.`,
        });
      }

      // Extreme cold insight
      if (stats.minTemp < -10) {
        insights.push({
          type: "insight-item--extreme",
          icon: "warning",
          text: `Extreme Kälte: Tiefsttemperatur von ${stats.minTemp.toFixed(1)}°C gemessen.`,
        });
      }

      return insights.length > 0
        ? insights
        : [
            {
              type: "insight-item--neutral",
              icon: "check_circle",
              text: "Keine auffälligen Abweichungen im gewählten Zeitraum.",
            },
          ];
    }

    _generateTrendContent(stats) {
      const trend =
        stats.avgTemp > 5
          ? "aufwärts"
          : stats.avgTemp < -2
            ? "abwärts"
            : "stabil";
      const volatility =
        stats.maxTemp - stats.minTemp > 15 ? "hoch" : "moderat";

      return `
        <div class="trend-grid">
          <div class="trend-item">
            <span class="trend-item__label">Trendrichtung</span>
            <span class="trend-item__value trend-item__value--${trend === "aufwärts" ? "positive" : trend === "abwärts" ? "negative" : "neutral"}">
              ${trend === "aufwärts" ? "↗ Erwärmung" : trend === "abwärts" ? "↘ Abkühlung" : "→ Stabil"}
            </span>
          </div>
          <div class="trend-item">
            <span class="trend-item__label">Volatilität</span>
            <span class="trend-item__value">${volatility}</span>
          </div>
          <div class="trend-item">
            <span class="trend-item__label">Temperaturspanne</span>
            <span class="trend-item__value">${(stats.maxTemp - stats.minTemp).toFixed(1)}°C</span>
          </div>
          <div class="trend-item">
            <span class="trend-item__label">Klimaabweichung</span>
            <span class="trend-item__value">${(stats.avgTemp - CONFIG.CLIMATE_AVERAGE).toFixed(1)}°C</span>
          </div>
        </div>
      `;
    }

    _bindAnalyseEvents(container) {
      // Metric pills
      container.querySelectorAll(".metric-pill").forEach((pill) => {
        pill.addEventListener("click", async (e) => {
          this.currentMetric = e.currentTarget.dataset.metric;
          await this._loadTabWithSkeleton();
        });
      });

      // Period buttons
      container.querySelectorAll(".period-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const period = e.currentTarget.dataset.period;
          if (period === "custom") {
            this._showCustomDateModal();
          } else {
            this.currentPeriod = period;
            await this._loadTabWithSkeleton();
          }
        });
      });
    }

    _drawAnalyseChart(data) {
      const canvas = document.getElementById("analyse-chart");
      if (!canvas || typeof Chart === "undefined") return;

      const labels = data.map((d) => parseInt(d.date.split("-")[2]));
      let config = this._getChartConfigForMetric(data, labels);

      // Use chartManager for proper memory management
      chartManager.create("analyse-chart", config);
    }

    /**
     * Get climate average for current month
     */
    _getClimateAverage() {
      const monthIdx = new Date().getMonth();
      const monthName = CONFIG.MONTH_NAMES[monthIdx];
      return CONFIG.CLIMATE_NORMALS[monthName]?.avgTemp ?? 10;
    }

    _getChartConfigForMetric(data, labels) {
      const climateAvg = this._getClimateAverage();

      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 20, 30, 0.95)",
            titleColor: "#fff",
            bodyColor: "#a7b1c6",
            borderColor: "rgba(138, 180, 255, 0.3)",
            borderWidth: 1,
            padding: 14,
            cornerRadius: 12,
            displayColors: true,
            callbacks: {
              title: (items) => `Tag ${items[0].label}`,
              label: (item) => {
                if (item.dataset.label === "Klimamittel") {
                  return ` ${item.dataset.label}: ${climateAvg.toFixed(1)}°C (Referenz)`;
                }
                const unit =
                  this.currentMetric === "temperature"
                    ? "°C"
                    : this.currentMetric === "precipitation"
                      ? " mm"
                      : this.currentMetric === "wind"
                        ? " km/h"
                        : this.currentMetric === "humidity"
                          ? "%"
                          : " h";
                return ` ${item.dataset.label}: ${typeof item.raw === "number" ? item.raw.toFixed(1) : item.raw}${unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
            ticks: {
              color: "#6b7280",
              font: { size: 11, weight: 500 },
              maxTicksLimit: 10,
              maxRotation: 0,
            },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
            ticks: {
              color: "#6b7280",
              font: { size: 11 },
              callback: (val) =>
                this.currentMetric === "temperature" ? val + "°" : val,
            },
          },
        },
      };

      if (this.currentMetric === "temperature") {
        // Temperature chart with band shading and climate reference line
        return {
          type: "line",
          data: {
            labels,
            datasets: [
              // Temperature band (shading between Min/Max)
              {
                label: "Max",
                data: data.map((d) => d.temp_max),
                borderColor: "rgba(255, 152, 0, 0.6)",
                backgroundColor: (ctx) => {
                  const chart = ctx.chart;
                  const { ctx: context, chartArea } = chart;
                  if (!chartArea) return "rgba(138, 180, 255, 0.15)";
                  const gradient = context.createLinearGradient(
                    0,
                    chartArea.bottom,
                    0,
                    chartArea.top,
                  );
                  gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)");
                  gradient.addColorStop(0.5, "rgba(138, 180, 255, 0.2)");
                  gradient.addColorStop(1, "rgba(255, 152, 0, 0.15)");
                  return gradient;
                },
                fill: "+1",
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.5,
              },
              {
                label: "Min",
                data: data.map((d) => d.temp_min),
                borderColor: "rgba(59, 130, 246, 0.6)",
                backgroundColor: "transparent",
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.5,
              },
              // Average temperature line
              {
                label: "Durchschnitt",
                data: data.map((d) => d.temp_avg),
                borderColor: "#8ab4ff",
                backgroundColor: "transparent",
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#8ab4ff",
                pointHoverBorderColor: "#fff",
                pointHoverBorderWidth: 2,
              },
              // Climate reference line (dashed)
              {
                label: "Klimamittel",
                data: Array(data.length).fill(climateAvg),
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "transparent",
                borderWidth: 2,
                borderDash: [8, 6],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
              },
            ],
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              annotation: {
                annotations: {
                  climateLine: {
                    type: "line",
                    yMin: climateAvg,
                    yMax: climateAvg,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    borderWidth: 2,
                    borderDash: [8, 6],
                    label: {
                      content: `Klimamittel: ${climateAvg.toFixed(1)}°C`,
                      display: true,
                      position: "end",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      color: "#fff",
                      font: { size: 10 },
                      padding: 4,
                    },
                  },
                },
              },
            },
          },
        };
      } else if (this.currentMetric === "precipitation") {
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Niederschlag",
                data: data.map((d) => d.precip),
                backgroundColor: "rgba(138, 180, 255, 0.7)",
                borderColor: "#8ab4ff",
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: "#8ab4ff",
              },
            ],
          },
          options: baseOptions,
        };
      } else if (this.currentMetric === "wind") {
        return {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Wind",
                data: data.map((d) => d.wind_speed),
                borderColor: "#80cbc4",
                backgroundColor: "rgba(128, 203, 196, 0.15)",
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
              },
            ],
          },
          options: baseOptions,
        };
      } else if (this.currentMetric === "humidity") {
        return {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Feuchtigkeit",
                data: data.map((d) => d.humidity),
                borderColor: "#64b5f6",
                backgroundColor: "rgba(100, 181, 246, 0.15)",
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
              },
            ],
          },
          options: baseOptions,
        };
      } else {
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Sonnenschein",
                data: data.map((d) => d.sunshine),
                backgroundColor: "rgba(255, 210, 111, 0.7)",
                borderColor: "#ffd26f",
                borderWidth: 1,
                borderRadius: 6,
              },
            ],
          },
          options: baseOptions,
        };
      }
    }

    // ========================================
    // TAB 2: VERGLEICH - Real Data Integration
    // ========================================
    async _renderVergleichTab(container) {
      // Fetch both comparison periods from API
      const { dataA, dataB } = await this._getComparisonData();

      // Calculate comparison using real data
      const comparison = this._calculateDetailedComparison(dataA, dataB);

      const periodALabel =
        AVAILABLE_PERIODS.find((p) => p.id === this.comparisonPeriodA)?.label ||
        "Zeitraum A";
      const periodBLabel =
        AVAILABLE_PERIODS.find((p) => p.id === this.comparisonPeriodB)?.label ||
        "Zeitraum B";

      container.innerHTML = `
        <section class="vergleich-section">
          <div class="comparison-selector">
            <button class="comparison-period-btn" id="period-a-btn">
              <span class="comparison-period-btn__label">Zeitraum A</span>
              <span class="comparison-period-btn__value">${periodALabel}</span>
              <span class="material-symbols-outlined">expand_more</span>
            </button>
            <div class="comparison-vs">VS</div>
            <button class="comparison-period-btn" id="period-b-btn">
              <span class="comparison-period-btn__label">Zeitraum B</span>
              <span class="comparison-period-btn__value">${periodBLabel}</span>
              <span class="material-symbols-outlined">expand_more</span>
            </button>
          </div>

          <div class="comparison-legend">
            <div class="comparison-legend__item">
              <span class="comparison-legend__line comparison-legend__line--a"></span>
              <span>${periodALabel} (${dataA.length} Tage)</span>
            </div>
            <div class="comparison-legend__item">
              <span class="comparison-legend__line comparison-legend__line--b"></span>
              <span>${periodBLabel} (${dataB.length} Tage)</span>
            </div>
          </div>

          <div class="chart-card chart-card--full">
            <canvas id="comparison-chart"></canvas>
          </div>

          <div class="comparison-insight">
            <span class="material-symbols-outlined">insights</span>
            <p>${comparison.statement}</p>
          </div>

          <div class="kpi-grid kpi-grid--compact">
            <div class="kpi-card kpi-card--comparison">
              <span class="kpi-card__label">Ø-Differenz</span>
              <span class="kpi-card__value ${comparison.avgDiff >= 0 ? "kpi-card__value--positive" : "kpi-card__value--negative"}">
                ${comparison.avgDiff >= 0 ? "+" : ""}${comparison.avgDiff.toFixed(1)}°C
              </span>
            </div>
            <div class="kpi-card kpi-card--comparison">
              <span class="kpi-card__label">Max-Differenz</span>
              <span class="kpi-card__value ${comparison.maxDiff >= 0 ? "kpi-card__value--positive" : "kpi-card__value--negative"}">
                ${comparison.maxDiff >= 0 ? "+" : ""}${comparison.maxDiff.toFixed(1)}°C
              </span>
            </div>
            <div class="kpi-card kpi-card--comparison">
              <span class="kpi-card__label">Frosttage Δ</span>
              <span class="kpi-card__value ${comparison.frostDiff <= 0 ? "kpi-card__value--positive" : "kpi-card__value--negative"}">
                ${comparison.frostDiff >= 0 ? "+" : ""}${comparison.frostDiff}
              </span>
            </div>
            <div class="kpi-card kpi-card--comparison">
              <span class="kpi-card__label">Abweichung</span>
              <span class="kpi-card__value ${comparison.percentDiff >= 0 ? "kpi-card__value--positive" : "kpi-card__value--negative"}">
                ${comparison.percentDiff >= 0 ? "+" : ""}${comparison.percentDiff.toFixed(0)}%
              </span>
            </div>
          </div>

          <div class="comparison-details">
            <h4>Detailvergleich</h4>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Metrik</th>
                  <th>${periodALabel}</th>
                  <th>${periodBLabel}</th>
                  <th>Differenz</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ø Temperatur</td>
                  <td>${comparison.statsA.avgTemp?.toFixed(1) ?? "–"}°C</td>
                  <td>${comparison.statsB.avgTemp?.toFixed(1) ?? "–"}°C</td>
                  <td class="${comparison.avgDiff >= 0 ? "positive" : "negative"}">${comparison.avgDiff >= 0 ? "+" : ""}${comparison.avgDiff.toFixed(1)}°C</td>
                </tr>
                <tr>
                  <td>Niederschlag</td>
                  <td>${comparison.statsA.totalPrecip?.toFixed(1) ?? "–"} mm</td>
                  <td>${comparison.statsB.totalPrecip?.toFixed(1) ?? "–"} mm</td>
                  <td class="${comparison.precipDiff >= 0 ? "positive" : "negative"}">${comparison.precipDiff >= 0 ? "+" : ""}${comparison.precipDiff.toFixed(1)} mm</td>
                </tr>
                <tr>
                  <td>Sonnenstunden</td>
                  <td>${comparison.statsA.totalSunshine?.toFixed(0) ?? "–"} h</td>
                  <td>${comparison.statsB.totalSunshine.toFixed(0)} h</td>
                  <td class="${comparison.sunshineDiff >= 0 ? "positive" : "negative"}">${comparison.sunshineDiff >= 0 ? "+" : ""}${comparison.sunshineDiff.toFixed(0)} h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      `;

      this._bindVergleichEvents(container);
      setTimeout(
        () =>
          this._drawComparisonChart(dataA, dataB, periodALabel, periodBLabel),
        100,
      );
    }

    _bindVergleichEvents(container) {
      const periodABtn = container.querySelector("#period-a-btn");
      const periodBBtn = container.querySelector("#period-b-btn");

      if (periodABtn) {
        periodABtn.addEventListener("click", () =>
          this._showPeriodSelectorModal("A"),
        );
      }
      if (periodBBtn) {
        periodBBtn.addEventListener("click", () =>
          this._showPeriodSelectorModal("B"),
        );
      }
    }

    _calculateDetailedComparison(dataA, dataB) {
      const statsA = this._calculateStats(dataA);
      const statsB = this._calculateStats(dataB);

      const avgDiff = statsB.avgTemp - statsA.avgTemp;
      const maxDiff = statsB.maxTemp - statsA.maxTemp;
      const frostDiff = statsB.frostDays - statsA.frostDays;
      const precipDiff = statsB.totalPrecip - statsA.totalPrecip;
      const sunshineDiff = statsB.totalSunshine - statsA.totalSunshine;
      const percentDiff =
        statsA.avgTemp !== 0
          ? ((statsB.avgTemp - statsA.avgTemp) / Math.abs(statsA.avgTemp)) * 100
          : 0;

      let statement = "";
      if (Math.abs(avgDiff) < 0.5) {
        statement =
          "Die beiden Zeiträume zeigen ähnliche Temperaturverhältnisse.";
      } else if (avgDiff > 0) {
        statement = `Zeitraum B war durchschnittlich ${avgDiff.toFixed(1)}°C wärmer als Zeitraum A.`;
      } else {
        statement = `Zeitraum B war durchschnittlich ${Math.abs(avgDiff).toFixed(1)}°C kälter als Zeitraum A.`;
      }

      if (Math.abs(precipDiff) > 10) {
        statement += ` Der Niederschlag unterschied sich um ${Math.abs(precipDiff).toFixed(1)} mm.`;
      }

      return {
        statsA,
        statsB,
        avgDiff,
        maxDiff,
        frostDiff,
        precipDiff,
        sunshineDiff,
        percentDiff,
        statement,
      };
    }

    _drawComparisonChart(dataA, dataB, labelA, labelB) {
      const canvas = document.getElementById("comparison-chart");
      if (!canvas || typeof Chart === "undefined") return;

      const maxLen = Math.max(dataA.length, dataB.length);
      const labels = Array.from({ length: maxLen }, (_, i) => i + 1);

      // Custom plugin for deviation area shading
      const deviationAreaPlugin = {
        id: "deviationArea",
        beforeDatasetsDraw: (chart) => {
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return;

          const datasetA = chart.data.datasets[0];
          const datasetB = chart.data.datasets[1];
          if (!datasetA?.data || !datasetB?.data) return;

          ctx.save();
          ctx.beginPath();

          // Draw area between the two lines
          const xScale = scales.x;
          const yScale = scales.y;

          // Forward path (datasetA)
          for (let i = 0; i < datasetA.data.length; i++) {
            const x = xScale.getPixelForValue(i);
            const y = yScale.getPixelForValue(datasetA.data[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Backward path (datasetB - reversed)
          for (let i = datasetB.data.length - 1; i >= 0; i--) {
            const x = xScale.getPixelForValue(i);
            const y = yScale.getPixelForValue(datasetB.data[i]);
            ctx.lineTo(x, y);
          }

          ctx.closePath();

          // Create gradient for deviation area
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, "rgba(248, 113, 113, 0.15)");
          gradient.addColorStop(0.5, "rgba(138, 180, 255, 0.08)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.15)");

          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
        },
      };

      // Use chartManager for proper memory management
      chartManager.create("comparison-chart", {
        type: "line",
        plugins: [deviationAreaPlugin],
        data: {
          labels,
          datasets: [
            {
              label: labelA,
              data: dataA.map((d) => d.temp_avg),
              borderColor: "rgba(255, 255, 255, 0.6)",
              backgroundColor: "transparent",
              borderWidth: 2.5,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "#fff",
            },
            {
              label: labelB,
              data: dataB.map((d) => d.temp_avg),
              borderColor: "#8ab4ff",
              backgroundColor: "transparent",
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: "#8ab4ff",
              pointHoverBorderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "#a7b1c6",
                font: { size: 12, weight: 500 },
                usePointStyle: true,
                pointStyle: "line",
                padding: 20,
              },
            },
            tooltip: {
              backgroundColor: "rgba(15, 20, 30, 0.95)",
              titleColor: "#fff",
              bodyColor: "#a7b1c6",
              borderColor: "rgba(138, 180, 255, 0.3)",
              borderWidth: 1,
              padding: 14,
              cornerRadius: 12,
              callbacks: {
                title: (items) => `Tag ${items[0].label}`,
                afterBody: (items) => {
                  if (items.length >= 2) {
                    const diff = (items[1].raw - items[0].raw).toFixed(1);
                    const sign = diff > 0 ? "+" : "";
                    return `\nAbweichung: ${sign}${diff}°C`;
                  }
                  return "";
                },
                label: (item) =>
                  ` ${item.dataset.label}: ${item.raw.toFixed(1)}°C`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: { color: "#6b7280", font: { size: 11 }, maxTicksLimit: 8 },
            },
            y: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                color: "#6b7280",
                font: { size: 11 },
                callback: (v) => v + "°",
              },
            },
          },
        },
      });
    }

    // ========================================
    // TAB 3: KALENDER - Real Data Integration
    // ========================================
    async _renderKalenderTab(container) {
      const year = this.currentCalendarDate.getFullYear();
      const month = this.currentCalendarDate.getMonth();

      // Fetch month data from API
      const { lat, lon } = this.currentLocation;
      const monthData = await dataManager.fetchMonthData(lat, lon, year, month);

      // Cache for event handlers
      this._currentMonthData = monthData;

      container.innerHTML = `
        <section class="kalender-section">
          <div class="calendar-controls">
            <button class="calendar-nav" id="cal-prev">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <h3 class="calendar-title">${this._getMonthName(month)} ${year}</h3>
            <button class="calendar-nav" id="cal-next">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div class="metric-selector metric-selector--compact">
            <button class="metric-pill metric-pill--small ${this.currentMetric === "temperature" ? "metric-pill--active" : ""}" data-metric="temperature">
              <span class="material-symbols-outlined">device_thermostat</span>
              Temp
            </button>
            <button class="metric-pill metric-pill--small ${this.currentMetric === "precipitation" ? "metric-pill--active" : ""}" data-metric="precipitation">
              <span class="material-symbols-outlined">water_drop</span>
              Regen
            </button>
            <button class="metric-pill metric-pill--small ${this.currentMetric === "sunshine" ? "metric-pill--active" : ""}" data-metric="sunshine">
              <span class="material-symbols-outlined">wb_sunny</span>
              Sonne
            </button>
          </div>

          <div class="calendar-scale">
            <span class="calendar-scale__label">${this.currentMetric === "temperature" ? "Kalt" : this.currentMetric === "precipitation" ? "Trocken" : "Bewölkt"}</span>
            <div class="calendar-scale__gradient calendar-scale__gradient--${this.currentMetric}"></div>
            <span class="calendar-scale__label">${this.currentMetric === "temperature" ? "Warm" : this.currentMetric === "precipitation" ? "Nass" : "Sonnig"}</span>
          </div>

          <div class="calendar-weekdays">
            <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
          </div>

          <div class="calendar-grid" id="calendar-grid">
            ${this._renderCalendarDays(year, month, monthData)}
          </div>

          ${
            monthData.length === 0
              ? `
            <div class="calendar-no-data">
              <span class="material-symbols-outlined">cloud_off</span>
              <p>Keine Daten für diesen Monat verfügbar</p>
            </div>
          `
              : ""
          }
        </section>

        <!-- Day Detail Bottom Sheet -->
        <div class="bottom-sheet-overlay ${this.selectedCalendarDay ? "bottom-sheet-overlay--visible" : ""}" id="day-sheet-overlay"></div>
        <div class="bottom-sheet ${this.selectedCalendarDay ? "bottom-sheet--open" : ""}" id="day-detail-sheet">
          ${this.selectedCalendarDay ? this._renderDayDetailSheet() : ""}
        </div>
      `;

      this._bindKalenderEvents(container);
      if (this.selectedCalendarDay) {
        setTimeout(() => this._drawDayDetailChart(), 200);
      }
    }

    _renderCalendarDays(year, month, monthData) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = (firstDay.getDay() + 6) % 7;
      const daysInMonth = lastDay.getDate();

      let html = "";
      for (let i = 0; i < startPadding; i++) {
        html += '<div class="calendar-cell calendar-cell--empty"></div>';
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayData = monthData.find((d) => d.date === dateStr);
        const bgColor = this._getDayColor(dayData);
        const textColor = this._getDayTextColor(dayData);
        const isSelected = this.selectedCalendarDay?.date === dateStr;
        const isToday = this._isToday(year, month, day);

        html += `
          <button class="calendar-cell ${isSelected ? "calendar-cell--selected" : ""} ${isToday ? "calendar-cell--today" : ""}"
                  data-date="${dateStr}"
                  style="background-color: ${bgColor};"
                  aria-label="${day}. ${this._getMonthName(month)}">
            <span class="calendar-cell__day" style="color: ${textColor};">${day}</span>
            ${dayData ? `<span class="calendar-cell__value" style="color: ${textColor};">${this._getCalendarCellValue(dayData)}</span>` : ""}
          </button>
        `;
      }

      return html;
    }

    _getCalendarCellValue(dayData) {
      if (this.currentMetric === "temperature")
        return `${dayData.temp_avg.toFixed(0)}°`;
      if (this.currentMetric === "precipitation")
        return dayData.precip > 0 ? `${dayData.precip.toFixed(0)}` : "";
      if (this.currentMetric === "sunshine")
        return `${dayData.sunshine.toFixed(0)}h`;
      return "";
    }

    /**
     * Get color for temperature value using smooth gradient interpolation
     * @param {number} temp - Temperature in Celsius
     * @returns {string} - CSS color value
     */
    _getColorForTemp(temp) {
      // Temperature color scale: -15°C (deep blue) to 35°C (deep red)
      const colorStops = [
        { temp: -15, r: 13, g: 71, b: 161 }, // Deep blue
        { temp: -10, r: 21, g: 101, b: 192 }, // Blue
        { temp: -5, r: 30, g: 136, b: 229 }, // Light blue
        { temp: 0, r: 66, g: 165, b: 245 }, // Ice blue
        { temp: 5, r: 144, g: 202, b: 249 }, // Very light blue
        { temp: 10, r: 255, g: 249, b: 196 }, // Pale yellow
        { temp: 15, r: 255, g: 224, b: 130 }, // Light orange
        { temp: 20, r: 255, g: 183, b: 77 }, // Orange
        { temp: 25, r: 255, g: 138, b: 101 }, // Deep orange
        { temp: 30, r: 239, g: 83, b: 80 }, // Red-orange
        { temp: 35, r: 198, g: 40, b: 40 }, // Deep red
      ];

      // Clamp temperature to range
      const clampedTemp = Math.max(-15, Math.min(35, temp));

      // Find surrounding color stops
      let lowerStop = colorStops[0];
      let upperStop = colorStops[colorStops.length - 1];

      for (let i = 0; i < colorStops.length - 1; i++) {
        if (
          clampedTemp >= colorStops[i].temp &&
          clampedTemp <= colorStops[i + 1].temp
        ) {
          lowerStop = colorStops[i];
          upperStop = colorStops[i + 1];
          break;
        }
      }

      // Linear interpolation between stops
      const range = upperStop.temp - lowerStop.temp;
      const t = range === 0 ? 0 : (clampedTemp - lowerStop.temp) / range;

      const r = Math.round(lowerStop.r + t * (upperStop.r - lowerStop.r));
      const g = Math.round(lowerStop.g + t * (upperStop.g - lowerStop.g));
      const b = Math.round(lowerStop.b + t * (upperStop.b - lowerStop.b));

      return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Get color for precipitation value
     * @param {number} precip - Precipitation in mm
     * @returns {string} - CSS color value
     */
    _getColorForPrecip(precip) {
      if (precip === 0) return "rgba(255, 255, 255, 0.05)";
      if (precip < 0.5) return "rgba(227, 242, 253, 0.6)";
      if (precip < 1) return "rgba(187, 222, 251, 0.7)";
      if (precip < 2) return "rgba(100, 181, 246, 0.75)";
      if (precip < 4) return "rgba(33, 150, 243, 0.8)";
      if (precip < 8) return "rgba(21, 101, 192, 0.85)";
      return "rgba(13, 71, 161, 0.9)";
    }

    /**
     * Get color for sunshine hours
     * @param {number} sun - Sunshine hours
     * @returns {string} - CSS color value
     */
    _getColorForSunshine(sun) {
      if (sun < 0.5) return "rgba(255, 255, 255, 0.05)";
      if (sun < 2) return "rgba(255, 248, 225, 0.5)";
      if (sun < 4) return "rgba(255, 236, 179, 0.6)";
      if (sun < 6) return "rgba(255, 213, 79, 0.7)";
      if (sun < 8) return "rgba(255, 193, 7, 0.8)";
      if (sun < 10) return "rgba(255, 179, 0, 0.85)";
      return "rgba(255, 160, 0, 0.9)";
    }

    _getDayColor(dayData) {
      if (!dayData) return "rgba(255, 255, 255, 0.05)";

      if (this.currentMetric === "temperature") {
        return this._getColorForTemp(dayData.temp_avg);
      } else if (this.currentMetric === "precipitation") {
        return this._getColorForPrecip(dayData.precip);
      } else if (this.currentMetric === "sunshine") {
        return this._getColorForSunshine(dayData.sunshine);
      }
      return "rgba(255, 255, 255, 0.05)";
    }

    _getDayTextColor(dayData) {
      if (!dayData) return "#6b7280";
      if (this.currentMetric === "temperature") {
        return dayData.temp_avg <= 6 ? "#ffffff" : "#1a1a1a";
      }
      if (this.currentMetric === "precipitation") {
        return dayData.precip >= 4 ? "#ffffff" : "#1a1a1a";
      }
      if (this.currentMetric === "sunshine") {
        return dayData.sunshine >= 7 ? "#1a1a1a" : "#1a1a1a";
      }
      return "#f1f3f6";
    }

    _bindKalenderEvents(container) {
      // Metric pills
      container.querySelectorAll(".metric-pill").forEach((pill) => {
        pill.addEventListener("click", async (e) => {
          this.currentMetric = e.currentTarget.dataset.metric;
          this.selectedCalendarDay = null;
          await this._renderKalenderTab(container);
        });
      });

      // Calendar navigation
      const prevBtn = container.querySelector("#cal-prev");
      const nextBtn = container.querySelector("#cal-next");
      if (prevBtn) {
        prevBtn.addEventListener("click", async () => {
          this.currentCalendarDate.setMonth(
            this.currentCalendarDate.getMonth() - 1,
          );
          this.selectedCalendarDay = null;
          await this._renderKalenderTab(container);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", async () => {
          this.currentCalendarDate.setMonth(
            this.currentCalendarDate.getMonth() + 1,
          );
          this.selectedCalendarDay = null;
          await this._renderKalenderTab(container);
        });
      }

      // Calendar cells
      container
        .querySelectorAll(".calendar-cell:not(.calendar-cell--empty)")
        .forEach((cell) => {
          cell.addEventListener("click", async (e) => {
            const dateStr = e.currentTarget.dataset.date;
            // Use cached month data or fetch fresh
            const monthData = this._currentMonthData || [];
            const dayData = monthData.find((d) => d.date === dateStr);
            if (dayData) {
              this.selectedCalendarDay = dayData;
              await this._renderKalenderTab(container);
            }
          });
        });

      // Bottom sheet overlay
      const overlay = container.querySelector("#day-sheet-overlay");
      if (overlay) {
        overlay.addEventListener("click", async () => {
          this.selectedCalendarDay = null;
          await this._renderKalenderTab(container);
        });
      }

      // Close button
      const closeBtn = container.querySelector("#close-day-sheet");
      if (closeBtn) {
        closeBtn.addEventListener("click", async () => {
          this.selectedCalendarDay = null;
          await this._renderKalenderTab(container);
        });
      }
    }

    _renderDayDetailSheet() {
      const day = this.selectedCalendarDay;
      if (!day) return "";

      const date = new Date(day.date);
      const formattedDate = `${date.getDate()}. ${this._getMonthName(date.getMonth())} ${date.getFullYear()}`;
      const weatherDesc = this._getWeatherDescription(day);

      return `
        <div class="bottom-sheet__handle"></div>
        <div class="bottom-sheet__content">
          <button class="bottom-sheet__close" id="close-day-sheet" aria-label="Schließen">
            <span class="material-symbols-outlined">close</span>
          </button>

          <header class="day-sheet__header">
            <h3>${formattedDate}</h3>
            <p class="day-sheet__weather">${weatherDesc}</p>
          </header>

          <div class="day-sheet__chart">
            <canvas id="day-detail-chart"></canvas>
          </div>

          <div class="day-sheet__metrics">
            <div class="day-metric">
              <span class="material-symbols-outlined">device_thermostat</span>
              <div>
                <span class="day-metric__label">Temperatur</span>
                <span class="day-metric__value">${day.temp_min.toFixed(1)}° / ${day.temp_max.toFixed(1)}°</span>
              </div>
            </div>
            <div class="day-metric">
              <span class="material-symbols-outlined">water_drop</span>
              <div>
                <span class="day-metric__label">Niederschlag</span>
                <span class="day-metric__value">${day.precip.toFixed(1)} mm</span>
              </div>
            </div>
            <div class="day-metric">
              <span class="material-symbols-outlined">air</span>
              <div>
                <span class="day-metric__label">Wind</span>
                <span class="day-metric__value">${day.wind_speed} km/h</span>
              </div>
            </div>
            <div class="day-metric">
              <span class="material-symbols-outlined">humidity_percentage</span>
              <div>
                <span class="day-metric__label">Feuchtigkeit</span>
                <span class="day-metric__value">${day.humidity}%</span>
              </div>
            </div>
          </div>

          <div class="day-sheet__note">
            <span class="material-symbols-outlined">info</span>
            <p>${this._getSeasonalNote(day)}</p>
          </div>
        </div>
      `;
    }

    /**
     * Draw combined hourly chart with temperature line and precipitation bars
     */
    _drawDayDetailChart() {
      const canvas = document.getElementById("day-detail-chart");
      if (!canvas || typeof Chart === "undefined" || !this.selectedCalendarDay)
        return;

      const day = this.selectedCalendarDay;
      const hours = [
        "00:00",
        "03:00",
        "06:00",
        "09:00",
        "12:00",
        "15:00",
        "18:00",
        "21:00",
      ];

      // Generate realistic hourly temperature curve
      const tempRange = day.temp_max - day.temp_min;
      const temps = hours.map((_, i) => {
        const hourOfDay = i * 3;
        // Peak temperature around 14:00 (index ~4-5), lowest around 05:00 (index ~2)
        const factor = Math.sin(((hourOfDay - 5) * Math.PI) / 12);
        return day.temp_min + tempRange * 0.5 + tempRange * 0.5 * factor;
      });

      // Generate realistic hourly precipitation (random distribution based on daily total)
      const dailyPrecip = day.precip || 0;
      const precipDistribution =
        dailyPrecip > 0
          ? this._generatePrecipDistribution(dailyPrecip, hours.length)
          : Array(hours.length).fill(0);

      // Use chartManager for proper memory management
      chartManager.create("day-detail-chart", {
        type: "bar",
        data: {
          labels: hours,
          datasets: [
            // Precipitation bars (primary axis)
            {
              type: "bar",
              label: "Niederschlag",
              data: precipDistribution,
              backgroundColor: (ctx) => {
                const value = ctx.raw;
                if (value === 0) return "rgba(59, 130, 246, 0.1)";
                if (value < 0.5) return "rgba(59, 130, 246, 0.3)";
                if (value < 1) return "rgba(59, 130, 246, 0.5)";
                return "rgba(59, 130, 246, 0.7)";
              },
              borderColor: "rgba(59, 130, 246, 0.8)",
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.6,
              categoryPercentage: 0.8,
              yAxisID: "yPrecip",
              order: 2,
            },
            // Temperature line (secondary axis)
            {
              type: "line",
              label: "Temperatur",
              data: temps,
              borderColor: "#ff9800",
              backgroundColor: (ctx) => {
                const chart = ctx.chart;
                const { ctx: context, chartArea } = chart;
                if (!chartArea) return "rgba(255, 152, 0, 0.15)";
                const gradient = context.createLinearGradient(
                  0,
                  chartArea.bottom,
                  0,
                  chartArea.top,
                );
                gradient.addColorStop(0, "rgba(255, 152, 0, 0.05)");
                gradient.addColorStop(1, "rgba(255, 152, 0, 0.25)");
                return gradient;
              },
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: "#ff9800",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointHoverRadius: 8,
              yAxisID: "yTemp",
              order: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "#a7b1c6",
                font: { size: 11 },
                usePointStyle: true,
                padding: 12,
              },
            },
            tooltip: {
              backgroundColor: "rgba(15, 20, 30, 0.95)",
              titleColor: "#fff",
              bodyColor: "#a7b1c6",
              borderColor: "rgba(138, 180, 255, 0.3)",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (item) => {
                  if (item.dataset.label === "Temperatur") {
                    return ` ${item.raw.toFixed(1)}°C`;
                  }
                  return ` ${item.raw.toFixed(1)} mm`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#6b7280", font: { size: 10 } },
            },
            yTemp: {
              type: "linear",
              position: "left",
              grid: { color: "rgba(255,255,255,0.05)" },
              ticks: {
                color: "#ff9800",
                font: { size: 10 },
                callback: (v) => v.toFixed(0) + "°",
              },
              title: {
                display: false,
              },
            },
            yPrecip: {
              type: "linear",
              position: "right",
              min: 0,
              suggestedMax: Math.max(dailyPrecip * 0.6, 2),
              grid: { display: false },
              ticks: {
                color: "#3b82f6",
                font: { size: 10 },
                callback: (v) => v.toFixed(1) + "mm",
              },
              title: {
                display: false,
              },
            },
          },
        },
      });
    }

    /**
     * Generate realistic precipitation distribution throughout the day
     */
    _generatePrecipDistribution(totalPrecip, hours) {
      // Create random-ish but realistic distribution
      const weights = Array(hours)
        .fill(0)
        .map(() => Math.random());
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      // Normalize to match total daily precipitation
      return weights.map((w) => (w / totalWeight) * totalPrecip);
    }

    // ========================================
    // TAB 4: EXTREME - Real Data Integration
    // ========================================
    async _renderExtremeTab(container) {
      // Fetch last 365 days for extreme analysis
      const { lat, lon } = this.currentLocation;
      const data = await dataManager.fetchLastNDays(lat, lon, 365);

      // Calculate extremes from real data
      const extremes = this._calculateExtremesFromData(data);
      const overallExtremes = this._findExtremes(data);

      // Calculate date range
      const dateRange =
        data.length > 0
          ? `${this._formatDate(data[0].date)} – ${this._formatDate(data[data.length - 1].date)}`
          : "Keine Daten";

      container.innerHTML = `
        <section class="extreme-section">
          <header class="extreme-header">
            <h3>Wetterextreme</h3>
            <p>Bemerkenswerte Wetterereignisse der letzten 12 Monate</p>
          </header>

          ${
            extremes.length > 0
              ? `
            <div class="extreme-timeline">
              ${extremes
                .map(
                  (ext, idx) => `
                <button class="extreme-card" data-extreme-id="${ext.id}">
                  <div class="extreme-card__timeline">
                    <div class="extreme-card__dot extreme-card__dot--${ext.type}">
                      <span class="material-symbols-outlined">${ext.icon}</span>
                    </div>
                    ${idx < extremes.length - 1 ? '<div class="extreme-card__line"></div>' : ""}
                  </div>
                  <div class="extreme-card__content">
                    <span class="extreme-card__title">${ext.title}</span>
                    <span class="extreme-card__value">${ext.value}</span>
                    <span class="extreme-card__date">${ext.dateFormatted}</span>
                    <span class="extreme-card__location">${this.currentLocation.name}</span>
                  </div>
                  <span class="material-symbols-outlined extreme-card__arrow">chevron_right</span>
                </button>
              `,
                )
                .join("")}
            </div>
          `
              : `
            <div class="extreme-empty">
              <span class="material-symbols-outlined">info</span>
              <p>Keine extremen Wetterereignisse im Analysezeitraum gefunden.</p>
            </div>
          `
          }

          <div class="extreme-summary">
            <h4>Zusammenfassung</h4>
            <div class="extreme-summary__grid">
              <div class="extreme-summary__item">
                <span class="material-symbols-outlined">device_thermostat</span>
                <div>
                  <span class="extreme-summary__label">Temp. Spanne</span>
                  <span class="extreme-summary__value">
                    ${overallExtremes?.coldestDay?.temp_min?.toFixed(1) ?? "–"}°C bis
                    ${overallExtremes?.hottestDay?.temp_max?.toFixed(1) ?? "–"}°C
                  </span>
                </div>
              </div>
              <div class="extreme-summary__item">
                <span class="material-symbols-outlined">calendar_month</span>
                <div>
                  <span class="extreme-summary__label">Analysezeitraum</span>
                  <span class="extreme-summary__value">${dateRange}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Extreme Detail Modal -->
        <div class="modal-overlay ${this.selectedExtreme ? "modal-overlay--visible" : ""}" id="extreme-modal-overlay"></div>
        <div class="modal ${this.selectedExtreme ? "modal--open" : ""}" id="extreme-detail-modal">
          ${this.selectedExtreme ? this._renderExtremeDetailModal() : ""}
        </div>
      `;

      this._bindExtremeEvents(container);
    }

    /**
     * Calculate extremes from real data
     */
    _calculateExtremesFromData(data) {
      if (!data || data.length === 0) return [];

      const extremes = [];
      let idCounter = 1;

      // Find hottest day
      const hottestDay = data.reduce(
        (max, d) =>
          (d.temp_max ?? -Infinity) > (max.temp_max ?? -Infinity) ? d : max,
        data[0],
      );
      if (
        hottestDay &&
        hottestDay.temp_max !== null &&
        hottestDay.temp_max >= 30
      ) {
        extremes.push({
          id: idCounter++,
          type: "hot",
          icon: "local_fire_department",
          title: "Heißester Tag",
          value: `${hottestDay.temp_max.toFixed(1)}°C`,
          rawValue: hottestDay.temp_max,
          date: hottestDay.date,
          dateFormatted: this._formatDate(hottestDay.date),
          data: hottestDay,
        });
      }

      // Find coldest day
      const coldestDay = data.reduce(
        (min, d) =>
          (d.temp_min ?? Infinity) < (min.temp_min ?? Infinity) ? d : min,
        data[0],
      );
      if (
        coldestDay &&
        coldestDay.temp_min !== null &&
        coldestDay.temp_min <= -5
      ) {
        extremes.push({
          id: idCounter++,
          type: "cold",
          icon: "ac_unit",
          title: "Kältester Tag",
          value: `${coldestDay.temp_min.toFixed(1)}°C`,
          rawValue: coldestDay.temp_min,
          date: coldestDay.date,
          dateFormatted: this._formatDate(coldestDay.date),
          data: coldestDay,
        });
      }

      // Find wettest day
      const wettestDay = data.reduce(
        (max, d) => ((d.precip ?? 0) > (max.precip ?? 0) ? d : max),
        data[0],
      );
      if (wettestDay && wettestDay.precip >= 15) {
        extremes.push({
          id: idCounter++,
          type: "rain",
          icon: "rainy",
          title: "Stärkster Niederschlag",
          value: `${wettestDay.precip.toFixed(1)} mm`,
          rawValue: wettestDay.precip,
          date: wettestDay.date,
          dateFormatted: this._formatDate(wettestDay.date),
          data: wettestDay,
        });
      }

      // Find windiest day
      const windiestDay = data.reduce(
        (max, d) => ((d.wind_speed ?? 0) > (max.wind_speed ?? 0) ? d : max),
        data[0],
      );
      if (windiestDay && windiestDay.wind_speed >= 50) {
        extremes.push({
          id: idCounter++,
          type: "wind",
          icon: "storm",
          title: "Stärkster Wind",
          value: `${windiestDay.wind_speed.toFixed(0)} km/h`,
          rawValue: windiestDay.wind_speed,
          date: windiestDay.date,
          dateFormatted: this._formatDate(windiestDay.date),
          data: windiestDay,
        });
      }

      // Sort by date (most recent first)
      return extremes.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Format date for display
     */
    _formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    _bindExtremeEvents(container) {
      container.querySelectorAll(".extreme-card").forEach((card) => {
        card.addEventListener("click", async () => {
          const extremeId = card.dataset.extremeId;
          // Fetch fresh data and calculate extremes
          const { lat, lon } = this.currentLocation;
          const data = await dataManager.fetchLastNDays(lat, lon, 365);
          const extremesList = this._calculateExtremesFromData(data);
          this.selectedExtreme =
            extremesList.find((e) => e.id.toString() === extremeId) || null;
          await this._renderExtremeTab(container);

          // Draw mini chart after modal renders
          if (this.selectedExtreme?.data) {
            requestAnimationFrame(() => {
              this._drawExtremeMiniChart(this.selectedExtreme.data);
            });
          }
        });
      });

      const overlay = container.querySelector("#extreme-modal-overlay");
      const closeBtn = container.querySelector("#close-extreme-modal");
      if (overlay) {
        overlay.addEventListener("click", async () => {
          this.selectedExtreme = null;
          await this._renderExtremeTab(container);
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", async () => {
          this.selectedExtreme = null;
          await this._renderExtremeTab(container);
        });
      }
    }

    _renderExtremeDetailModal() {
      const ext = this.selectedExtreme;
      if (!ext) return "";

      // Safely get data values with fallbacks
      const tempMin = ext.data?.temp_min?.toFixed?.(1) ?? "–";
      const tempMax = ext.data?.temp_max?.toFixed?.(1) ?? "–";
      const precip = ext.data?.precip?.toFixed?.(1) ?? "0";
      const windSpeed = ext.data?.wind_speed?.toFixed?.(0) ?? "–";
      const humidity = ext.data?.humidity ?? "–";
      const sunshine = ext.data?.sunshine?.toFixed?.(1) ?? "–";

      return `
        <div class="modal__content extreme-detail-modal">
          <button class="modal__close" id="close-extreme-modal">
            <span class="material-symbols-outlined">close</span>
          </button>

          <div class="extreme-detail__header extreme-detail__header--${ext.type}">
            <div class="extreme-detail__icon">
              <span class="material-symbols-outlined">${ext.icon}</span>
            </div>
            <div class="extreme-detail__title-group">
              <h3>${ext.title}</h3>
              <span class="extreme-detail__value">${ext.value}</span>
            </div>
          </div>

          <div class="extreme-detail__info">
            <div class="extreme-detail__row">
              <span class="material-symbols-outlined">calendar_today</span>
              <span>${ext.dateFormatted}</span>
            </div>
            <div class="extreme-detail__row">
              <span class="material-symbols-outlined">location_on</span>
              <span>${this.currentLocation?.name || "Berlin"}</span>
            </div>
          </div>

          <div class="extreme-detail__chart">
            <canvas id="extreme-mini-chart"></canvas>
          </div>

          <div class="extreme-detail__metrics">
            <div class="extreme-metric">
              <span class="material-symbols-outlined">device_thermostat</span>
              <div class="extreme-metric__data">
                <span class="extreme-metric__label">Temperatur</span>
                <span class="extreme-metric__value">${tempMin}° / ${tempMax}°C</span>
              </div>
            </div>
            <div class="extreme-metric">
              <span class="material-symbols-outlined">water_drop</span>
              <div class="extreme-metric__data">
                <span class="extreme-metric__label">Niederschlag</span>
                <span class="extreme-metric__value">${precip} mm</span>
              </div>
            </div>
            <div class="extreme-metric">
              <span class="material-symbols-outlined">air</span>
              <div class="extreme-metric__data">
                <span class="extreme-metric__label">Wind</span>
                <span class="extreme-metric__value">${windSpeed} km/h</span>
              </div>
            </div>
            <div class="extreme-metric">
              <span class="material-symbols-outlined">humidity_percentage</span>
              <div class="extreme-metric__data">
                <span class="extreme-metric__label">Feuchtigkeit</span>
                <span class="extreme-metric__value">${humidity}%</span>
              </div>
            </div>
            <div class="extreme-metric">
              <span class="material-symbols-outlined">wb_sunny</span>
              <div class="extreme-metric__data">
                <span class="extreme-metric__label">Sonnenstunden</span>
                <span class="extreme-metric__value">${sunshine} h</span>
              </div>
            </div>
          </div>

          <div class="extreme-detail__note">
            <span class="material-symbols-outlined">info</span>
            <p>${this._getExtremeNote(ext)}</p>
          </div>
        </div>
      `;
    }

    /**
     * Draw mini chart for extreme detail modal
     */
    _drawExtremeMiniChart(extremeData) {
      if (!extremeData || typeof Chart === "undefined") return;

      // Simulate hourly temperature curve for the extreme day
      const hours = ["00:00", "06:00", "12:00", "18:00", "24:00"];
      const tempMin = extremeData.temp_min ?? 0;
      const tempMax = extremeData.temp_max ?? 10;
      const tempRange = tempMax - tempMin;

      // Generate realistic temperature curve
      const temps = [
        tempMin + tempRange * 0.2, // 00:00 - cool
        tempMin + tempRange * 0.1, // 06:00 - coldest
        tempMax, // 12:00 - peak
        tempMax - tempRange * 0.3, // 18:00 - cooling
        tempMin + tempRange * 0.3, // 24:00 - night
      ];

      const config = {
        type: "line",
        data: {
          labels: hours,
          datasets: [
            {
              label: "Temperatur",
              data: temps,
              borderColor:
                extremeData.temp_max >= 30
                  ? "#ef4444"
                  : extremeData.temp_min <= 0
                    ? "#3b82f6"
                    : "#8ab4ff",
              backgroundColor:
                extremeData.temp_max >= 30
                  ? "rgba(239, 68, 68, 0.1)"
                  : extremeData.temp_min <= 0
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(138, 180, 255, 0.1)",
              borderWidth: 2.5,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 20, 30, 0.95)",
              titleColor: "#fff",
              bodyColor: "#a7b1c6",
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (item) => ` ${item.raw.toFixed(1)}°C`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#6b7280", font: { size: 10 } },
            },
            y: {
              grid: { color: "rgba(255,255,255,0.05)" },
              ticks: {
                color: "#6b7280",
                font: { size: 10 },
                callback: (val) => val + "°",
              },
            },
          },
        },
      };

      chartManager.create("extreme-mini-chart", config);
    }

    _getExtremeNote(ext) {
      const notes = {
        hot: "Dieser Tag markiert den heißesten gemessenen Wert im Analysezeitraum. Solche Temperaturen treten statistisch nur an wenigen Tagen pro Jahr auf.",
        cold: "An diesem Tag wurde die niedrigste Temperatur gemessen. Strenger Frost dieser Art ist für mitteleuropäische Winter ungewöhnlich.",
        rain: "Dieser Tag verzeichnete die höchste Niederschlagsmenge. Solche Ereignisse können zu lokalen Überschwemmungen führen.",
        wind: "Die an diesem Tag gemessene Windgeschwindigkeit entspricht Sturmstärke. Schäden an Bäumen und Gebäuden sind möglich.",
      };
      return notes[ext.type] || "";
    }

    // ========================================
    // MODALS
    // ========================================
    _showLocationModal() {
      const modals = document.querySelector("#history-modals");
      if (!modals) return;

      modals.innerHTML = `
        <div class="modal-overlay modal-overlay--visible" id="location-modal-overlay"></div>
        <div class="modal modal--open modal--bottom" id="location-modal">
          <div class="modal__content">
            <div class="modal__handle"></div>
            <h3 class="modal__title">Standort wählen</h3>
            <div class="location-list">
              ${LOCATIONS.map(
                (loc) => `
                <button class="location-item ${loc.id === this.currentLocation.id ? "location-item--active" : ""}" data-location-id="${loc.id}">
                  <span class="material-symbols-outlined">${loc.id === "current" ? "my_location" : "location_on"}</span>
                  <span class="location-item__name">${loc.name}</span>
                  ${loc.id === this.currentLocation.id ? '<span class="material-symbols-outlined">check</span>' : ""}
                </button>
              `,
              ).join("")}
            </div>
          </div>
        </div>
      `;

      this._bindLocationModalEvents(modals);
    }

    _bindLocationModalEvents(modals) {
      const overlay = modals.querySelector("#location-modal-overlay");
      if (overlay) {
        overlay.addEventListener("click", () => this._closeModal());
      }

      modals.querySelectorAll(".location-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const locId = item.dataset.locationId;
          this.currentLocation =
            LOCATIONS.find((l) => l.id === locId) || LOCATIONS[0];
          this._closeModal();

          // Update location text
          const locText = document.querySelector(
            ".history-header__location-text",
          );
          if (locText) locText.textContent = this.currentLocation.name;

          // Reload data
          await this._loadTabWithSkeleton();
        });
      });
    }

    _showPeriodSelectorModal(periodType) {
      const modals = document.querySelector("#history-modals");
      if (!modals) return;

      const currentPeriod =
        periodType === "A" ? this.comparisonPeriodA : this.comparisonPeriodB;

      modals.innerHTML = `
        <div class="modal-overlay modal-overlay--visible" id="period-modal-overlay"></div>
        <div class="modal modal--open modal--bottom" id="period-modal">
          <div class="modal__content">
            <div class="modal__handle"></div>
            <h3 class="modal__title">Zeitraum ${periodType} wählen</h3>
            <div class="period-list">
              ${AVAILABLE_PERIODS.map(
                (p) => `
                <button class="period-item ${p.id === currentPeriod ? "period-item--active" : ""}" data-period-id="${p.id}">
                  <span class="material-symbols-outlined">calendar_month</span>
                  <span class="period-item__name">${p.label}</span>
                  ${p.id === currentPeriod ? '<span class="material-symbols-outlined">check</span>' : ""}
                </button>
              `,
              ).join("")}
            </div>
          </div>
        </div>
      `;

      this._bindPeriodModalEvents(modals, periodType);
    }

    _bindPeriodModalEvents(modals, periodType) {
      const overlay = modals.querySelector("#period-modal-overlay");
      if (overlay) {
        overlay.addEventListener("click", () => this._closeModal());
      }

      modals.querySelectorAll(".period-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const periodId = item.dataset.periodId;
          if (periodType === "A") {
            this.comparisonPeriodA = periodId;
          } else {
            this.comparisonPeriodB = periodId;
          }
          this._closeModal();
          await this._loadTabWithSkeleton();
        });
      });
    }

    _showCustomDateModal() {
      const modals = document.querySelector("#history-modals");
      if (!modals) return;

      const today = new Date().toISOString().split("T")[0];

      modals.innerHTML = `
        <div class="modal-overlay modal-overlay--visible" id="date-modal-overlay"></div>
        <div class="modal modal--open" id="date-modal">
          <div class="modal__content">
            <button class="modal__close" id="close-date-modal">
              <span class="material-symbols-outlined">close</span>
            </button>
            <h3 class="modal__title">Zeitraum wählen</h3>
            <div class="date-picker-form">
              <div class="date-input-group">
                <label for="start-date">Von</label>
                <input type="date" id="start-date" value="2025-01-01" max="${today}">
              </div>
              <div class="date-input-group">
                <label for="end-date">Bis</label>
                <input type="date" id="end-date" value="2025-01-31" max="${today}">
              </div>
              <button class="date-picker-submit" id="apply-date-range">
                <span class="material-symbols-outlined">check</span>
                Anwenden
              </button>
            </div>
          </div>
        </div>
      `;

      this._bindDateModalEvents(modals);
    }

    _bindDateModalEvents(modals) {
      const overlay = modals.querySelector("#date-modal-overlay");
      const closeBtn = modals.querySelector("#close-date-modal");
      const applyBtn = modals.querySelector("#apply-date-range");

      if (overlay) overlay.addEventListener("click", () => this._closeModal());
      if (closeBtn)
        closeBtn.addEventListener("click", () => this._closeModal());

      if (applyBtn) {
        applyBtn.addEventListener("click", async () => {
          const startDate = document.getElementById("start-date")?.value;
          const endDate = document.getElementById("end-date")?.value;
          if (startDate && endDate) {
            this.customStartDate = startDate;
            this.customEndDate = endDate;
            this.currentPeriod = "custom";
            this._closeModal();
            await this._loadTabWithSkeleton();
          }
        });
      }
    }

    _showInfoModal() {
      const modals = document.querySelector("#history-modals");
      if (!modals) return;

      modals.innerHTML = `
        <div class="modal-overlay modal-overlay--visible" id="info-modal-overlay"></div>
        <div class="modal modal--open" id="info-modal">
          <div class="modal__content">
            <button class="modal__close" id="close-info-modal">
              <span class="material-symbols-outlined">close</span>
            </button>
            <h3 class="modal__title">Begriffserklärungen</h3>
            <dl class="info-definitions">
              <dt>Durchschnittstemperatur</dt>
              <dd>Mittelwert aller Tages-Durchschnitte im gewählten Zeitraum.</dd>

              <dt>Klimamittel</dt>
              <dd>Langjähriger Durchschnitt (30 Jahre) für den Standort.</dd>

              <dt>Frosttage</dt>
              <dd>Tage, an denen die Tiefsttemperatur unter 0°C lag.</dd>

              <dt>Hitzewelle</dt>
              <dd>Mindestens 3 aufeinanderfolgende Tage mit Temperaturen über 30°C.</dd>

              <dt>Niederschlag</dt>
              <dd>Gemessene Wassermenge in Millimetern (1mm = 1 Liter/m²).</dd>
            </dl>
          </div>
        </div>
      `;

      const overlay = modals.querySelector("#info-modal-overlay");
      const closeBtn = modals.querySelector("#close-info-modal");
      if (overlay) overlay.addEventListener("click", () => this._closeModal());
      if (closeBtn)
        closeBtn.addEventListener("click", () => this._closeModal());
    }

    _closeModal() {
      const modals = document.querySelector("#history-modals");
      if (modals) modals.innerHTML = "";
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    _getWeatherDescription(day) {
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

    _getSeasonalNote(day) {
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

    _getMonthName(month) {
      return (
        [
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
        ][month] || ""
      );
    }

    _isToday(year, month, day) {
      const today = new Date();
      return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      );
    }

    _delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  // Export to global scope
  global.HistoryView = HistoryView;
})(typeof window !== "undefined" ? window : this);
