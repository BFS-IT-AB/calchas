/**
 * GridFields API – einheitliche Fetch-Logik für Grid-basierte Wetterdaten
 *
 * Nutzt: Open-Meteo API (kostenlos, kein Key nötig)
 * Base URL: https://api.open-meteo.com/v1/forecast
 */

export class GridFieldsAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://api.open-meteo.com/v1/forecast";
    this.cacheEnabled = options.cacheEnabled !== false; // Default: true
    this.cacheTTL = options.cacheTTL || 600000; // 10 min
    this.cache = new Map();
  }

  /**
   * Generiere Gitterpunkte um Kartenzentrum (±2° lat/lon)
   * @param {number} centerLat - Kartenzentrum Latitude
   * @param {number} centerLon - Kartenzentrum Longitude
   * @param {number} gridSpacing - Abstände (default: 0.25°)
   * @returns {Array} Array von [lat, lon] Koordinaten
   */
  generateGridPoints(centerLat, centerLon, gridSpacing = 0.25) {
    const points = [];
    const offset = 2; // ±2°
    for (
      let lat = centerLat - offset;
      lat <= centerLat + offset;
      lat += gridSpacing
    ) {
      for (
        let lon = centerLon - offset;
        lon <= centerLon + offset;
        lon += gridSpacing
      ) {
        points.push([lat, lon]);
      }
    }
    return points;
  }

  /**
   * Fetch Temperature-Heatmap-Daten
   * @param {number} centerLat
   * @param {number} centerLon
   * @param {string|null} timestamp - ISO-String oder null für aktuell
   * @returns {Promise<Array>} Array von { lat, lon, temp, timestamp }
   */
  async fetchTemperature(centerLat, centerLon, timestamp = null) {
    const normalizedTs = timestamp
      ? new Date(timestamp).setMinutes(
          new Date(timestamp).getMinutes() -
            (new Date(timestamp).getMinutes() % 30),
          0,
          0
        )
      : "now";
    const cacheKey = `temp_${centerLat}_${centerLon}_${normalizedTs}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const points = this.generateGridPoints(centerLat, centerLon);
    const results = [];

    const lats = points.map((p) => p[0]).join(",");
    const lons = points.map((p) => p[1]).join(",");

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", lats);
      url.searchParams.set("longitude", lons);
      url.searchParams.set("hourly", "temperature_2m");
      if (timestamp)
        url.searchParams.set("start_date", timestamp.split("T")[0]);

      const response = await fetch(url.toString());
      if (!response.ok)
        throw new Error(`Open-Meteo API error: ${response.status}`);

      const data = await response.json();

      if (data.hourly && data.hourly.time && data.hourly.temperature_2m) {
        points.forEach((point, idx) => {
          const temps = data.hourly.temperature_2m[idx] || [];
          results.push({
            lat: point[0],
            lon: point[1],
            temperatures: temps,
            currentTemp: temps[0] || null,
            timestamp: timestamp || new Date().toISOString(),
          });
        });
      }

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, results);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
      }

      return results;
    } catch (error) {
      console.error("[GridFieldsAPI] fetchTemperature failed:", error);
      return [];
    }
  }

  /**
   * Fetch Wind-Vektor-Daten
   * @param {number} centerLat
   * @param {number} centerLon
   * @param {string|null} timestamp
   * @returns {Promise<Array>} Array von { lat, lon, windSpeed, windDirection, timestamp }
   */
  async fetchWind(centerLat, centerLon, timestamp = null) {
    const normalizedTs = timestamp
      ? new Date(timestamp).setMinutes(
          new Date(timestamp).getMinutes() -
            (new Date(timestamp).getMinutes() % 30),
          0,
          0
        )
      : "now";
    const cacheKey = `wind_${centerLat}_${centerLon}_${normalizedTs}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const points = this.generateGridPoints(centerLat, centerLon);
    const results = [];

    const lats = points.map((p) => p[0]).join(",");
    const lons = points.map((p) => p[1]).join(",");

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", lats);
      url.searchParams.set("longitude", lons);
      url.searchParams.set("hourly", "wind_speed_10m,wind_direction_10m");
      if (timestamp)
        url.searchParams.set("start_date", timestamp.split("T")[0]);

      const response = await fetch(url.toString());
      if (!response.ok)
        throw new Error(`Open-Meteo API error: ${response.status}`);

      const data = await response.json();

      if (data.hourly && data.hourly.time) {
        points.forEach((point, idx) => {
          const speeds = data.hourly.wind_speed_10m[idx] || [];
          const directions = data.hourly.wind_direction_10m[idx] || [];
          results.push({
            lat: point[0],
            lon: point[1],
            windSpeeds: speeds,
            windDirections: directions,
            currentSpeed: speeds[0] || null,
            currentDirection: directions[0] || null,
            timestamp: timestamp || new Date().toISOString(),
          });
        });
      }

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, results);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
      }

      return results;
    } catch (error) {
      console.error("[GridFieldsAPI] fetchWind failed:", error);
      return [];
    }
  }

  async fetchCloudCover(centerLat, centerLon, timestamp = null) {
    const normalizedTs = timestamp
      ? new Date(timestamp).setMinutes(
          new Date(timestamp).getMinutes() -
            (new Date(timestamp).getMinutes() % 30),
          0,
          0
        )
      : "now";
    const cacheKey = `cloud_${centerLat}_${centerLon}_${normalizedTs}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const points = this.generateGridPoints(centerLat, centerLon);
    const results = [];

    const lats = points.map((p) => p[0]).join(",");
    const lons = points.map((p) => p[1]).join(",");

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", lats);
      url.searchParams.set("longitude", lons);
      url.searchParams.set("hourly", "cloud_cover");
      if (timestamp)
        url.searchParams.set("start_date", timestamp.split("T")[0]);

      const response = await fetch(url.toString());
      if (!response.ok)
        throw new Error(`Open-Meteo API error: ${response.status}`);

      const data = await response.json();

      if (data.hourly && data.hourly.time && data.hourly.cloud_cover) {
        points.forEach((point, idx) => {
          const values = data.hourly.cloud_cover[idx] || [];
          results.push({
            lat: point[0],
            lon: point[1],
            cloudValues: values,
            currentCloud: values[0] || null,
            timestamp: timestamp || new Date().toISOString(),
          });
        });
      }

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, results);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
      }

      return results;
    } catch (error) {
      console.error("[GridFieldsAPI] fetchCloudCover failed:", error);
      return [];
    }
  }

  async fetchHumidity(centerLat, centerLon, timestamp = null) {
    const normalizedTs = timestamp
      ? new Date(timestamp).setMinutes(
          new Date(timestamp).getMinutes() -
            (new Date(timestamp).getMinutes() % 30),
          0,
          0
        )
      : "now";
    const cacheKey = `humidity_${centerLat}_${centerLon}_${normalizedTs}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const points = this.generateGridPoints(centerLat, centerLon);
    const results = [];

    const lats = points.map((p) => p[0]).join(",");
    const lons = points.map((p) => p[1]).join(",");

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", lats);
      url.searchParams.set("longitude", lons);
      url.searchParams.set("hourly", "relative_humidity_2m");
      if (timestamp)
        url.searchParams.set("start_date", timestamp.split("T")[0]);

      const response = await fetch(url.toString());
      if (!response.ok)
        throw new Error(`Open-Meteo API error: ${response.status}`);

      const data = await response.json();

      if (data.hourly && data.hourly.time && data.hourly.relative_humidity_2m) {
        points.forEach((point, idx) => {
          const values = data.hourly.relative_humidity_2m[idx] || [];
          results.push({
            lat: point[0],
            lon: point[1],
            humidityValues: values,
            currentHumidity: values[0] || null,
            timestamp: timestamp || new Date().toISOString(),
          });
        });
      }

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, results);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);
      }

      return results;
    } catch (error) {
      console.error("[GridFieldsAPI] fetchHumidity failed:", error);
      return [];
    }
  }

  /**
   * Fetch historische Wetterdaten aus Open-Meteo Archive
   * @param {number} centerLat
   * @param {number} centerLon
   * @param {string} startDate - ISO Format: '2024-01-01'
   * @param {string} endDate - ISO Format: '2024-01-31'
   * @returns {Promise<Array>} Array von { date, temp_min, temp_max, precip, wind_speed, humidity_avg }
   */
  async fetchHistoricalData(centerLat, centerLon, startDate, endDate) {
    const cacheKey = `history_${centerLat}_${centerLon}_${startDate}_${endDate}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const archiveUrl = "https://archive-api.open-meteo.com/v1/archive";
      const url = new URL(archiveUrl);

      url.searchParams.set("latitude", centerLat);
      url.searchParams.set("longitude", centerLon);
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

      url.searchParams.set("temperature_unit", "celsius");
      url.searchParams.set("windspeed_unit", "kmh");
      url.searchParams.set("precipitation_unit", "mm");
      url.searchParams.set("timezone", "auto");

      const response = await fetch(url.toString());
      if (!response.ok)
        throw new Error(`Archive API error: ${response.status}`);

      const data = await response.json();
      const results = [];

      if (data.daily && data.daily.time) {
        data.daily.time.forEach((date, idx) => {
          results.push({
            date,
            temp_min: data.daily.temperature_2m_min[idx] || null,
            temp_max: data.daily.temperature_2m_max[idx] || null,
            precip: data.daily.precipitation_sum[idx] || 0,
            wind_speed: data.daily.windspeed_10m_max[idx] || null,
            humidity: data.daily.relative_humidity_2m_mean[idx] || null,
            timestamp: new Date(date).getTime(),
          });
        });
      }

      if (this.cacheEnabled) {
        this.cache.set(cacheKey, results);
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL * 2);
      }

      return results;
    } catch (error) {
      console.error("[GridFieldsAPI] fetchHistoricalData failed:", error);
      return [];
    }
  }
}

const defaultInstance = new GridFieldsAPI();
export default defaultInstance;
