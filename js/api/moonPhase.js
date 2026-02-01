class MoonPhaseAPI {
  constructor() {
    this.baseUrl = (API_ENDPOINTS?.MOONPHASE?.BASE || "").replace(/\/$/, "");
    this.timeout = API_ENDPOINTS?.MOONPHASE?.TIMEOUT || 5000;
    this.name = "PhaseOfTheMoonToday";
    // API ist offline/existiert nicht mehr - nutze immer lokale Berechnung
    this.isAvailable = false;
  }

  async fetchPhase(date = new Date(), apiKey = null, context = {}) {
    const start = Date.now();

    // Direkt lokale Berechnung verwenden (API ist nicht mehr verfügbar)
    const localData = this._computeLocalPhase(date, context);
    if (localData) {
      return {
        data: localData,
        duration: Date.now() - start,
        source: "moonphase-local",
        statusMessage: "Lokal berechnet",
        state: "online",
      };
    }

    return {
      error: "Mondphase konnte nicht berechnet werden",
      source: "moonphase",
    };
  }

  _buildRequestInit(apiKey) {
    const headers = { Accept: "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey.trim();
    }
    return { headers };
  }

  _normalizeContext(date, context = {}) {
    const isoDate = this._formatDate(date);
    const locationDetails =
      (context && context.locationDetails) || context || {};
    const rawCity =
      context.city ||
      context.cityName ||
      locationDetails.city ||
      locationDetails.locality ||
      locationDetails.region ||
      null;
    const slugValue = rawCity ? this._slugify(rawCity) : "";
    const citySlug = slugValue || null;
    return { isoDate, citySlug };
  }

  _buildRequestQueue({ isoDate, citySlug }) {
    const requests = [];
    if (citySlug) {
      requests.push({
        url: `${this.baseUrl}/location/${encodeURIComponent(citySlug)}`,
        tag: "location",
      });
    }
    if (isoDate) {
      requests.push({
        url: `${this.baseUrl}/date/${isoDate}`,
        tag: "date",
      });
    }
    requests.push({
      url: `${this.baseUrl}/current`,
      tag: "current",
    });
    return requests;
  }

  _formatDate(date) {
    try {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString().split("T")[0];
    } catch (e) {
      return null;
    }
  }

  _slugify(value) {
    return value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();
  }

  _normalize(payload, sourceTag) {
    const entry = this._unwrap(payload);
    if (!entry || typeof entry !== "object") return null;

    const illumination = this._toNumber(
      entry.illumination ??
        entry.percent_illumination ??
        entry.illumination_percentage ??
        entry.illuminationPercent
    );

    const moonrise =
      entry.moonrise_local ||
      entry.moonrise ||
      entry.rise ||
      entry.moonriseTime ||
      this._extractEventTime(entry, "moonrise");
    const moonset =
      entry.moonset_local ||
      entry.moonset ||
      entry.set ||
      entry.moonsetTime ||
      this._extractEventTime(entry, "moonset");

    return {
      phase: entry.phase || entry.current_phase || entry.name || null,
      illumination,
      description:
        entry.description ||
        entry.summary ||
        this._buildDescription(entry.phase, illumination),
      zodiac: entry.zodiac || entry.zodiac_sign || entry.sign || null,
      moonrise,
      moonset,
      emoji: entry.emoji || this._phaseEmoji(entry.phase),
      daysSinceNew: this._toNumber(
        entry.days_since_new || entry.age || entry.moon_age
      ),
      nextFullMoon: entry.next_full_moon || entry.nextFullMoon || null,
      nextNewMoon: entry.next_new_moon || entry.nextNewMoon || null,
      source: sourceTag,
    };
  }

  _unwrap(payload) {
    if (!payload) return null;
    if (Array.isArray(payload) && payload.length) {
      return payload[0];
    }
    if (payload.data) {
      if (Array.isArray(payload.data) && payload.data.length) {
        return payload.data[0];
      }
      if (typeof payload.data === "object") {
        return payload.data;
      }
    }
    return payload;
  }

  _extractEventTime(entry, key) {
    if (!entry || typeof entry !== "object") return null;
    if (entry.events) {
      if (typeof entry.events === "object" && !Array.isArray(entry.events)) {
        return entry.events[key] || null;
      }
      if (Array.isArray(entry.events)) {
        const match = entry.events.find((event) => {
          const label = (event?.type || event?.name || "")
            .toString()
            .toLowerCase();
          return label.includes(key);
        });
        return match?.time || null;
      }
    }
    return null;
  }

  _toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  _phaseEmoji(phase) {
    if (!phase || typeof phase !== "string") return null;
    const key = phase.toLowerCase();
    const mapping = {
      "new moon": "🌑",
      "waxing crescent": "🌒",
      "first quarter": "🌓",
      "waxing gibbous": "🌔",
      "full moon": "🌕",
      "waning gibbous": "🌖",
      "last quarter": "🌗",
      "waning crescent": "🌘",
    };
    return mapping[key] || null;
  }

  _buildDescription(phase, illumination) {
    if (!phase) return null;
    if (typeof illumination !== "number") return phase;
    return `${phase} (${illumination.toFixed(1)}% beleuchtet)`;
  }

  _computeLocalPhase(date, context = {}) {
    try {
      const target = new Date(date);
      if (Number.isNaN(target.getTime())) return null;
      const synodicMonth = 29.530588853; // Tage
      const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14); // Referenz aus Meeus
      const daysSinceNew = (target.getTime() - knownNewMoon) / 86400000;
      const cycle = this._normalizeCycle(daysSinceNew / synodicMonth);
      const age = cycle * synodicMonth;
      const illumination = ((1 - Math.cos(cycle * 2 * Math.PI)) / 2) * 100; // Prozent
      const phaseInfo = this._phaseFromCycle(cycle);
      const locationLabel =
        context?.city ||
        context?.locationDetails?.city ||
        context?.locationDetails?.locality ||
        null;

      // Berechne Mondauf- und -untergangszeiten (Näherung)
      const moonTimes = this._computeMoonTimes(target, cycle, context);

      return {
        phase: phaseInfo.name,
        illumination,
        description: `${phaseInfo.name} (${illumination.toFixed(
          1
        )}% beleuchtet)`,
        zodiac: null,
        moonrise: moonTimes.moonrise,
        moonset: moonTimes.moonset,
        emoji: phaseInfo.emoji,
        daysSinceNew: age,
        nextFullMoon: null,
        nextNewMoon: null,
        source: locationLabel ? `computed:${locationLabel}` : "computed",
      };
    } catch (error) {
      console.warn("MoonPhase Local fallback fehlgeschlagen", error);
      return null;
    }
  }

  /**
   * Berechnet Mondauf- und -untergangszeiten (Näherung)
   * Basiert auf dem Mondalter im Zyklus - der Mond geht jeden Tag etwa 50 Minuten später auf
   */
  _computeMoonTimes(date, cycle, context = {}) {
    try {
      const lat =
        context?.latitude ||
        context?.lat ||
        context?.locationDetails?.latitude ||
        50; // Default: Mitteleuropa
      const targetDate = new Date(date);

      // Basis: Bei Neumond geht der Mond ungefähr mit der Sonne auf/unter
      // Bei Vollmond ist es umgekehrt (Aufgang bei Sonnenuntergang)
      // Der Mond geht jeden Tag etwa 50 Minuten später auf

      // Basiszeiten für Sonnenauf-/untergang (Näherung für Mitteleuropa im Dezember)
      const month = targetDate.getMonth();
      const dayOfYear = this._getDayOfYear(targetDate);

      // Berechne ungefähre Sonnenauf-/untergangszeit basierend auf Jahreszeit
      const sunriseHour = this._estimateSunriseHour(dayOfYear, lat);
      const sunsetHour = this._estimateSunsetHour(dayOfYear, lat);

      // Mondaufgang verschiebt sich um etwa 50 Minuten pro Tag durch den Zyklus
      // Bei Neumond (cycle=0): Mond geht mit Sonne auf
      // Bei Vollmond (cycle=0.5): Mond geht mit Sonne unter auf
      const moonPhaseOffset = cycle * 24; // Stunden Offset durch Mondzyklus

      // Berechne Mondaufgangszeit
      let moonriseHour = (sunriseHour + moonPhaseOffset) % 24;
      let moonsetHour = (sunsetHour + moonPhaseOffset) % 24;

      // Erstelle ISO-Strings für die Zeiten
      const moonriseDate = new Date(targetDate);
      moonriseDate.setHours(
        Math.floor(moonriseHour),
        Math.round((moonriseHour % 1) * 60),
        0,
        0
      );

      const moonsetDate = new Date(targetDate);
      moonsetDate.setHours(
        Math.floor(moonsetHour),
        Math.round((moonsetHour % 1) * 60),
        0,
        0
      );

      // Falls Monduntergang vor Mondaufgang liegt, ist es am nächsten Tag
      if (moonsetDate <= moonriseDate) {
        moonsetDate.setDate(moonsetDate.getDate() + 1);
      }

      return {
        moonrise: moonriseDate.toISOString(),
        moonset: moonsetDate.toISOString(),
      };
    } catch (error) {
      console.warn("Mondzeiten-Berechnung fehlgeschlagen", error);
      return { moonrise: null, moonset: null };
    }
  }

  _getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  _estimateSunriseHour(dayOfYear, lat) {
    // Einfache Näherung für Sonnenaufgang basierend auf Tag des Jahres
    // Wintersonnenwende (Tag 355): spätester Aufgang
    // Sommersonnenwende (Tag 172): frühester Aufgang
    const amplitude = 2.5 * (Math.abs(lat) / 50); // Amplitude basierend auf Breitengrad
    const offset =
      Math.cos(((dayOfYear - 172) * 2 * Math.PI) / 365) * amplitude;
    return 6 + offset; // Basis 6 Uhr +/- Amplitude
  }

  _estimateSunsetHour(dayOfYear, lat) {
    // Einfache Näherung für Sonnenuntergang
    const amplitude = 2.5 * (Math.abs(lat) / 50);
    const offset =
      Math.cos(((dayOfYear - 172) * 2 * Math.PI) / 365) * amplitude;
    return 18 - offset; // Basis 18 Uhr +/- Amplitude
  }

  _normalizeCycle(value) {
    const normalized = value - Math.floor(value);
    return normalized < 0 ? normalized + 1 : normalized;
  }

  _phaseFromCycle(cycle) {
    const phases = [
      "New Moon",
      "Waxing Crescent",
      "First Quarter",
      "Waxing Gibbous",
      "Full Moon",
      "Waning Gibbous",
      "Last Quarter",
      "Waning Crescent",
    ];
    const index = Math.floor(cycle * 8 + 0.5) % phases.length;
    const name = phases[index];
    return {
      name,
      emoji: this._phaseEmoji(name) || this._phaseEmoji(name.toLowerCase()),
    };
  }
}

const moonPhaseAPI = new MoonPhaseAPI();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MoonPhaseAPI;
}
