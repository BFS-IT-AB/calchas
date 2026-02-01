/**
 * NOAA Alerts API – Wetter-Warnungen (USA-fokussiert)
 *
 * Nutzt: https://api.weather.gov (kostenlos, CORS-enabled)
 */

export class NoaaAlertsAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://api.weather.gov";
    this.cacheTTL = options.cacheTTL || 300000; // 5 min
    this.cache = new Map();
  }

  /**
   * Fetch aktive Warnungen für einen Punkt
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<Array>} Array von Alert-Objekten mit GeoJSON-Geometrien
   */
  async fetchAlertsForPoint(lat, lon) {
    const cacheKey = `alerts_${lat}_${lon}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const url = `${this.baseUrl}/alerts/active?point=${lat},${lon}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `NOAA API returned ${response.status}, returning empty alerts`
        );
        return [];
      }

      const data = await response.json();
      const alerts = data.features || [];

      const normalized = alerts.map((feature) => ({
        id: feature.id,
        event: feature.properties.event,
        headline: feature.properties.headline,
        description: feature.properties.description,
        severity: feature.properties.severity,
        areaDesc: feature.properties.areaDesc,
        validTime: feature.properties.validTime,
        geometry: feature.geometry,
        color: this.getSeverityColor(feature.properties.severity),
      }));

      this.cache.set(cacheKey, normalized);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL);

      return normalized;
    } catch (error) {
      console.error("[NoaaAlertsAPI] fetchAlertsForPoint failed:", error);
      return [];
    }
  }

  /**
   * Bestimme Farbe basierend auf Severity
   */
  getSeverityColor(severity) {
    const colorMap = {
      Extreme: "#C00000",
      Severe: "#FF0000",
      Moderate: "#FFA500",
      Minor: "#FFFF00",
      Unknown: "#808080",
    };
    return colorMap[severity] || colorMap.Unknown;
  }
}

const defaultInstance = new NoaaAlertsAPI();
export default defaultInstance;
