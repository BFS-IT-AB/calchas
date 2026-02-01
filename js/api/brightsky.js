/* brightsky.dev API Integration */

class BrightSkyAPI {
  constructor() {
    this.baseUrl = API_ENDPOINTS.BRIGHTSKY.BASE;
    this.timeout = API_ENDPOINTS.BRIGHTSKY.TIMEOUT;
    this.name = 'BrightSky';
  }

  /**
   * Holt Wetter-Daten für Koordinaten
   * @param {number} latitude - Breitengrad
   * @param {number} longitude - Längengrad
   * @param {string} date - Datum (YYYY-MM-DD)
   * @returns {Promise<object>} - Wetterdaten
   */
  async fetchWeather(latitude, longitude, date = null) {
    try {
      // Validiere Koordinaten
      const coordCheck = validateCoordinates(latitude, longitude);
      if (!coordCheck.valid) {
        throw new Error(coordCheck.error);
      }

      // Prüfe Cache
      const cacheKey = `${latitude}_${longitude}_${date || 'today'}`;
      const cached = weatherCache.getForecast(cacheKey, 'brightsky');
      if (cached) {
        console.log('✅ BrightSky Cache Hit');
        return { data: cached, fromCache: true };
      }

      // Setze Datum auf heute wenn nicht angegeben
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      // Baue URL mit Parametern
      const params = new URLSearchParams({
        lat: latitude.toFixed(4),
        lon: longitude.toFixed(4),
        date: date
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      const startTime = Date.now();

      // Fetch mit Timeout + Retry für transient errors
      const maxAttempts = 3;
      let attempt = 0;
      let response = null;
      let data = null;
      while (attempt < maxAttempts) {
        try {
          response = await safeApiFetch(url, {}, this.timeout);
          data = await response.json();
          const validation = validateApiResponse(data, 'brightsky');
          if (!validation.valid) {
            throw new Error(validation.error);
          }
          break;
        } catch (err) {
          attempt += 1;
          const isLast = attempt >= maxAttempts;
          const msg = (err && err.message) ? err.message : '';
          const isClientError = /HTTP Fehler 4\d\d|404|400|429/.test(msg);
          if (isClientError || isLast) {
            throw err;
          }
          const waitMs = 200 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, waitMs));
          console.warn(`BrightSky Versuch ${attempt} fehlgeschlagen, erneut in ${waitMs}ms...`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ BrightSky erfolgreich (${duration}ms)`);

      // Speichere im Cache
      weatherCache.setForecast(cacheKey, 'brightsky', data);

      return {
        data,
        fromCache: false,
        duration,
        source: 'brightsky'
      };
    } catch (error) {
      console.error(`❌ BrightSky Fehler: ${error.message}`);
      return {
        error: error.message,
        source: 'brightsky'
      };
    }
  }

  /**
   * Formatiert Wetter-Daten für Anzeige
   * @param {object} data - BrightSky Rohdaten
   * @param {number} limit - Anzahl der Einträge (default: 24)
   * @returns {array} - Formatierte Wetter-Daten
   */
  formatWeatherData(data, limit = 24) {
    if (!data || !Array.isArray(data.weather)) return [];

    return data.weather.slice(0, limit).map(entry => ({
      time: entry.timestamp,
      temperature: entry.temperature,
      feelsLike: entry.feels_like,
      windSpeed: entry.windspeed,
      windDirection: entry.wind_direction,
      relativeHumidity: entry.relative_humidity,
      precipitation: entry.precipitation,
      precipitation_probability: entry.precipitation_probability,
      weatherCode: entry.icon,
      emoji: this._getWeatherEmoji(entry.icon)
    }));
  }

  /**
   * Holt mehrtägige Prognose
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} days - Anzahl der Tage
   * @returns {Promise<array>}
   */
  async fetchMultiDay(latitude, longitude, days = 5) {
    const allWeather = [];
    const today = new Date();

    try {
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const result = await this.fetchWeather(latitude, longitude, dateStr);
        
        if (result.error) {
          console.warn(`Fehler für ${dateStr}:`, result.error);
          continue;
        }

        allWeather.push({
          date: dateStr,
          data: result.data
        });
      }

      return allWeather;
    } catch (error) {
      console.error('Fehler bei Multi-Day Fetch:', error);
      return allWeather;
    }
  }

  /**
   * Map Icon-Code zu Emoji und Beschreibung
   * @private
   */
  _getWeatherEmoji(iconCode) {
    const iconMap = {
      'clear-day': '☀️',
      'clear-night': '🌙',
      'partly-cloudy-day': '⛅',
      'partly-cloudy-night': '🌤️',
      'cloudy': '☁️',
      'foggy': '🌫️',
      'rainy': '🌧️',
      'rainy-day': '🌦️',
      'rainy-night': '🌧️',
      'snowy': '❄️',
      'snowy-rainy': '🌨️',
      'thunderstormy': '⛈️',
      'thunderstormy-rainy': '⛈️',
      'hail': '🧊',
      'windy': '💨'
    };

    return iconMap[iconCode] || '❓';
  }

  /**
   * Gibt freundliche Beschreibung vom Icon
   */
  getWeatherDescription(iconCode) {
    const descriptions = {
      'clear-day': 'Klarer Tag',
      'clear-night': 'Klare Nacht',
      'partly-cloudy-day': 'Teilweise bewölkt (Tag)',
      'partly-cloudy-night': 'Teilweise bewölkt (Nacht)',
      'cloudy': 'Bewölkt',
      'foggy': 'Neblig',
      'rainy': 'Regen',
      'rainy-day': 'Regen (Tag)',
      'rainy-night': 'Regen (Nacht)',
      'snowy': 'Schnee',
      'snowy-rainy': 'Schnee und Regen',
      'thunderstormy': 'Gewitter',
      'thunderstormy-rainy': 'Gewitter mit Regen',
      'hail': 'Hagel',
      'windy': 'Windig'
    };

    return descriptions[iconCode] || 'Unbekannt';
  }
}

/**
 * Singleton-Instanz
 */
const brightSkyAPI = new BrightSkyAPI();