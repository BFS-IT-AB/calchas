/* Input-Validierungsfunktionen */

/**
 * Validiert Eingabe-Stadtname
 * @param {string} city - Eingegebener Stadtname
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateCityInput(city) {
  if (!city || typeof city !== 'string') {
    return { valid: false, error: ERROR_CODES.INVALID_INPUT.message };
  }

  const trimmed = city.trim();
  const rule = VALIDATION.CITY_NAME;

  if (trimmed.length < rule.MIN_LENGTH) {
    return { valid: false, error: `Stadtname muss mindestens ${rule.MIN_LENGTH} Zeichen lang sein` };
  }

  if (trimmed.length > rule.MAX_LENGTH) {
    return { valid: false, error: `Stadtname darf maximal ${rule.MAX_LENGTH} Zeichen lang sein` };
  }

  if (!rule.PATTERN.test(trimmed)) {
    return { valid: false, error: `Ungültige Zeichen in Stadtname: ${rule.ERROR_MESSAGE}` };
  }

  return { valid: true, error: null };
}

/**
 * Validiert Koordinaten (Latitude, Longitude)
 * @param {number} lat - Breitengrad
 * @param {number} lon - Längengrad
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateCoordinates(lat, lon) {
  const { LAT_MIN, LAT_MAX, LON_MIN, LON_MAX } = VALIDATION.COORDINATES;

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return { valid: false, error: 'Koordinaten müssen Zahlen sein' };
  }

  if (lat < LAT_MIN || lat > LAT_MAX) {
    return { valid: false, error: `Breitengrad muss zwischen ${LAT_MIN} und ${LAT_MAX} liegen` };
  }

  if (lon < LON_MIN || lon > LON_MAX) {
    return { valid: false, error: `Längengrad muss zwischen ${LON_MIN} und ${LON_MAX} liegen` };
  }

  return { valid: true, error: null };
}

/**
 * Validiert Temperatur-Wert
 * @param {number} temp - Temperaturwert
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateTemperature(temp) {
  const { MIN, MAX } = VALIDATION.TEMPERATURE;

  if (typeof temp !== 'number') {
    return { valid: false, error: 'Temperatur muss eine Zahl sein' };
  }

  if (temp < MIN || temp > MAX) {
    return { valid: false, error: `Temperatur außerhalb des erwarteten Bereichs (${MIN}°C - ${MAX}°C)` };
  }

  return { valid: true, error: null };
}

/**
 * Validiert API-Antwort auf Struktur
 * @param {object} data - API-Response
 * @param {string} source - API-Quelle ('openmeteo' oder 'brightsky')
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateApiResponse(data, source) {
  if (!data) {
    return { valid: false, error: 'Keine Daten erhalten' };
  }

  if (source === 'openmeteo') {
    if (!data.hourly || !data.hourly.time || !data.hourly.temperature_2m) {
      return { valid: false, error: 'Ungültige Open-Meteo Antwort-Struktur' };
    }
    if (data.hourly.time.length === 0) {
      return { valid: false, error: 'Keine Zeitdaten von Open-Meteo' };
    }
  } else if (source === 'brightsky') {
    if (!Array.isArray(data.weather)) {
      return { valid: false, error: 'Ungültige BrightSky Antwort-Struktur' };
    }
    if (data.weather.length === 0) {
      return { valid: false, error: 'Keine Wetterdaten von BrightSky' };
    }
  } else if (source === 'nominatim') {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Ungültige Nominatim Antwort-Struktur' };
    }
    if (data.length === 0) {
      return { valid: false, error: 'Ort nicht gefunden' };
    }
    const firstResult = data[0];
    if (!firstResult.lat || !firstResult.lon) {
      return { valid: false, error: 'Koordinaten nicht verfügbar' };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validiert HTTP-Response Status
 * @param {Response} response - Fetch Response Object
 * @param {string} source - API-Quelle für besseres Error-Messaging
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateHttpStatus(response, source = 'API') {
  if (!response || !response.ok) {
    const status = response?.status || 'UNKNOWN';
    
    if (status === 404) {
      return { valid: false, error: `${source}: Ressource nicht gefunden (404)` };
    } else if (status === 429) {
      return { valid: false, error: `${source}: Rate Limit überschritten - bitte später versuchen` };
    } else if (status === 500 || status === 503) {
      return { valid: false, error: `${source}: Server nicht erreichbar (${status})` };
    } else if (status === 'UNKNOWN') {
      return { valid: false, error: `${source}: Verbindungsfehler` };
    } else {
      return { valid: false, error: `${source}: HTTP Fehler ${status}` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validiert JSON-Parsing
 * @param {string} jsonString - JSON-String
 * @returns {object} - {valid: boolean, error: string|null, data: object|null}
 */
function validateJsonParsing(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return { valid: true, error: null, data };
  } catch (e) {
    return { valid: false, error: 'Ungültiges JSON-Format erhalten', data: null };
  }
}

/**
 * Validiert NetworkTimeout
 * @param {number} duration - Dauer in ms
 * @param {number} timeout - Timeout-Limit in ms
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateTimeout(duration, timeout = 5000) {
  if (duration > timeout) {
    return { valid: false, error: ERROR_CODES.TIMEOUT.message };
  }
  return { valid: true, error: null };
}

/**
 * Validiert Geo-Suchergebnisse
 * @param {array} results - Array von Geo-Objekten
 * @returns {object} - {valid: boolean, error: string|null}
 */
function validateGeoResults(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return { valid: false, error: 'Keine Suchergebnisse gefunden' };
  }

  // Prüfe erste Ergebnis auf erforderliche Felder
  const first = results[0];
  if (!first.lat || !first.lon || !first.display_name) {
    return { valid: false, error: 'Unvollständige Geo-Daten erhalten' };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize User Input - entfernt gefährliche Zeichen
 * @param {string} input - Benutzereingabe
 * @returns {string} - Sanitized Input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>\"'%]/g, '')  // Entferne HTML/Script-Zeichen
    .replace(/\s+/g, ' ')      // Normalisiere Leerzeichen
    .substring(0, VALIDATION.CITY_NAME.MAX_LENGTH);
}

/**
 * Format-Fehler für Anzeige
 * @param {string} errorCode - Error Code
 * @param {string} details - Optional: zusätzliche Details
 * @returns {string} - Formatierte Fehlermeldung
 */
function formatErrorMessage(errorCode, details = '') {
  const error = ERROR_CODES[errorCode] || ERROR_CODES.API_ERROR;
  const message = `${error.icon} ${error.message}`;
  
  if (details) {
    return `${message}\n\n📝 Details: ${details}`;
  }
  
  return message;
}

/**
 * Wrapper für sichere API-Anfragen mit Timeout und Error-Handling
 * @param {string} url - API-URL
 * @param {object} options - Fetch-Optionen
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>}
 */
async function safeApiFetch(url, options = {}, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const statusCheck = validateHttpStatus(response);
    if (!statusCheck.valid) {
        // Try to include response body snippet for better debugging (e.g., 400 details)
        let bodySnippet = '';
        try {
          const text = await response.text();
          bodySnippet = text ? ` - ${text.substring(0, 300)}` : '';
        } catch (e) {
          bodySnippet = '';
        }
        throw new Error(statusCheck.error + bodySnippet);
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(ERROR_CODES.TIMEOUT.message);
    }
    throw error;
  }
}

/**
 * Batch-Validierung mehrerer Felder
 * @param {object} data - Daten zum Validieren
 * @param {object} rules - Validierungsregeln
 * @returns {object} - {valid: boolean, errors: array}
 */
function validateBatch(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    switch (rule.type) {
      case 'city':
        const cityCheck = validateCityInput(value);
        if (!cityCheck.valid) errors.push({ field, message: cityCheck.error });
        break;
      case 'coordinates':
        const coordCheck = validateCoordinates(value.lat, value.lon);
        if (!coordCheck.valid) errors.push({ field, message: coordCheck.error });
        break;
      case 'temperature':
        const tempCheck = validateTemperature(value);
        if (!tempCheck.valid) errors.push({ field, message: tempCheck.error });
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}