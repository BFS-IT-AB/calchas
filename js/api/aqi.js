export class AQIAPI {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl ||
      "https://air-quality-api.open-meteo.com/v1/air-quality";
  }

  async fetchAQIForPoint(lat, lon, timestamp = null) {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      url.searchParams.set("hourly", "european_aqi");
      if (timestamp) {
        const d = new Date(timestamp);
        const isoDate = d.toISOString().split("T")[0];
        url.searchParams.set("start_date", isoDate);
        url.searchParams.set("end_date", isoDate);
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`AQI API error: ${res.status}`);
      const data = await res.json();
      const times = data.hourly?.time || [];
      const values = data.hourly?.european_aqi || [];
      if (!times.length || !values.length) return null;

      let idx = values.length - 1;
      if (timestamp) {
        const target = new Date(timestamp).getTime();
        let bestDiff = Infinity;
        times.forEach((t, i) => {
          const diff = Math.abs(new Date(t).getTime() - target);
          if (diff < bestDiff) {
            bestDiff = diff;
            idx = i;
          }
        });
      }

      return {
        aqi: values[idx],
        time: times[idx],
      };
    } catch (e) {
      console.error("[AQIAPI] fetchAQIForPoint failed", e);
      return null;
    }
  }

  /**
   * Fetches pollen data from Open-Meteo Air Quality API
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} [timezone] - Optional timezone for correct hour calculation
   * @returns {Promise<object|null>} - Pollen data with trees, grass, weeds levels (1-4 scale)
   */
  async fetchPollenData(lat, lon, timezone) {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      // Open-Meteo provides pollen data: alder, birch, grass, mugwort, olive, ragweed
      url.searchParams.set(
        "hourly",
        "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen"
      );
      url.searchParams.set("forecast_days", "1");
      if (timezone) {
        url.searchParams.set("timezone", timezone);
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Pollen API error: ${res.status}`);
      const data = await res.json();

      const times = data.hourly?.time || [];
      if (!times.length) return null;

      // Find current hour index - use location timezone if available
      let currentHour;
      if (timezone) {
        try {
          const locationTimeStr = new Date().toLocaleString("en-US", {
            timeZone: timezone,
            hour: "numeric",
            hour12: false,
          });
          currentHour = parseInt(locationTimeStr, 10);
        } catch (e) {
          currentHour = new Date().getHours();
        }
      } else {
        currentHour = new Date().getHours();
      }

      let idx = 0;
      for (let i = 0; i < times.length; i++) {
        const hour = new Date(times[i]).getHours();
        if (hour >= currentHour) {
          idx = i;
          break;
        }
      }

      // Get pollen values for current time
      const alder = data.hourly?.alder_pollen?.[idx] || 0;
      const birch = data.hourly?.birch_pollen?.[idx] || 0;
      const grass = data.hourly?.grass_pollen?.[idx] || 0;
      const mugwort = data.hourly?.mugwort_pollen?.[idx] || 0;
      const olive = data.hourly?.olive_pollen?.[idx] || 0;
      const ragweed = data.hourly?.ragweed_pollen?.[idx] || 0;

      // Combine tree pollens (alder, birch, olive) and weed pollens (mugwort, ragweed)
      const treesMax = Math.max(alder, birch, olive);
      const weedsMax = Math.max(mugwort, ragweed);

      // Convert Open-Meteo grains/m³ to 1-4 scale
      // Tree pollen thresholds (grains/m³): Low <50, Moderate 50-200, High 200-500, Very High >500
      // Grass pollen thresholds: Low <20, Moderate 20-100, High 100-300, Very High >300
      // Weed pollen thresholds: Low <20, Moderate 20-80, High 80-200, Very High >200

      const convertTreeLevel = (value) => {
        if (value < 50) return 1;
        if (value < 200) return 2;
        if (value < 500) return 3;
        return 4;
      };

      const convertGrassLevel = (value) => {
        if (value < 20) return 1;
        if (value < 100) return 2;
        if (value < 300) return 3;
        return 4;
      };

      const convertWeedLevel = (value) => {
        if (value < 20) return 1;
        if (value < 80) return 2;
        if (value < 200) return 3;
        return 4;
      };

      return {
        trees: convertTreeLevel(treesMax),
        grass: convertGrassLevel(grass),
        weeds: convertWeedLevel(weedsMax),
        // Raw data for detailed view
        raw: {
          alder: Math.round(alder),
          birch: Math.round(birch),
          olive: Math.round(olive),
          grass: Math.round(grass),
          mugwort: Math.round(mugwort),
          ragweed: Math.round(ragweed),
        },
        time: times[idx],
        source: "Open-Meteo Air Quality",
      };
    } catch (e) {
      console.error("[AQIAPI] fetchPollenData failed", e);
      return null;
    }
  }
}

const defaultInstance = new AQIAPI();
export default defaultInstance;
