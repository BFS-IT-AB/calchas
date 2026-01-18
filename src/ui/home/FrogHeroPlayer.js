(function (global) {
  // Korrekter Pfad relativ zur index.html im src-Verzeichnis
  const FROG_BASE_PATH = "assets/froggie/hubui";

  // Verfügbare Szenen-Typen: fields, hill, mushroom
  const SCENE_TYPE = "fields"; // Landschaft-Szene für dynamisches Wetter

  // Dynamische Himmelfarben basierend auf Wetter und Tageszeit
  // WICHTIG: Diese Farben müssen exakt zum Himmel der Fields-Bilder passen!
  // Die Farben wurden aus den tatsächlichen Fields-Bildern extrahiert
  const SKY_COLORS = {
    // Morning - Morgenhimmel
    morning_sunny: { top: "#A8D4E6", mid: "#B8DEF0", bottom: "#C8E8F5" },
    morning_cloudy: { top: "#8A9AA8", mid: "#96A6B4", bottom: "#A2B2C0" },
    morning_rainy: { top: "#6D7D8B", mid: "#7A8A96", bottom: "#8797A2" },
    morning_snowy: { top: "#C0D0DE", mid: "#CCE0EE", bottom: "#D8EAF4" },
    morning_hazy: { top: "#9AAAB8", mid: "#A6B6C4", bottom: "#B2C2D0" },

    // Day - Tageshimmel (aus Fields-Bildern extrahiert)
    day_sunny: { top: "#7EC8E3", mid: "#8AD0E8", bottom: "#96D8ED" },
    day_cloudy: { top: "#5A6B73", mid: "#687982", bottom: "#768790" },
    day_rainy: { top: "#5A6A72", mid: "#677780", bottom: "#74848C" },
    day_snowy: { top: "#A8B8C6", mid: "#B4C4D2", bottom: "#C0D0DE" },
    day_hazy: { top: "#7A8A92", mid: "#8898A0", bottom: "#96A6AE" },

    // Sunset - Abendhimmel
    sunset_sunny: { top: "#E8A07A", mid: "#F0B892", bottom: "#F8D0AA" },
    sunset_cloudy: { top: "#7D6E80", mid: "#8D7E90", bottom: "#9D8EA0" },
    sunset_rainy: { top: "#5A5060", mid: "#6A6070", bottom: "#7A7080" },
    sunset_snowy: { top: "#9888A0", mid: "#A898B0", bottom: "#B8A8C0" },
    sunset_hazy: { top: "#8A7A8A", mid: "#9A8A9A", bottom: "#AA9AAA" },

    // Night - Nachthimmel
    night_sunny: { top: "#1E2340", mid: "#2A3050", bottom: "#364060" },
    night_cloudy: { top: "#262C3A", mid: "#323848", bottom: "#3E4456" },
    night_rainy: { top: "#1E2430", mid: "#2A3040", bottom: "#363C50" },
    night_snowy: { top: "#3A4050", mid: "#464C60", bottom: "#525870" },
    night_hazy: { top: "#2A3040", mid: "#363C50", bottom: "#424860" },
  };

  // Bodenfarben der Fields-Bilder (extrahiert aus den tatsächlichen Bildern)
  // Diese sind die dunklen Farben am unteren Rand der Fields
  const GROUND_COLORS = {
    // Morning - Morgenboden (lila-grau Töne wie im Bild)
    morning_sunny: "#4a4555",
    morning_cloudy: "#4a4555",
    morning_rainy: "#3a3545",
    morning_snowy: "#5a5565",
    morning_hazy: "#4a4555",

    // Day - Tagesboden (grün-braun)
    day_sunny: "#5a6555",
    day_cloudy: "#4a5045",
    day_rainy: "#3a4038",
    day_snowy: "#6a7065",
    day_hazy: "#4a5045",

    // Sunset - Abendboden (lila-rosa wie im Bild)
    sunset_sunny: "#4a3845",
    sunset_cloudy: "#4a3845",
    sunset_rainy: "#3a2835",
    sunset_snowy: "#5a4855",
    sunset_hazy: "#4a3845",

    // Night - Nachtboden (dunkel lila)
    night_sunny: "#2a2535",
    night_cloudy: "#2a2535",
    night_rainy: "#1a1525",
    night_snowy: "#3a3545",
    night_hazy: "#2a2535",
  };

  // Funktion um Bodenfarbe zu bekommen
  function getGroundColor(tod, cond) {
    const key = `${tod}_${cond}`;
    return GROUND_COLORS[key] || GROUND_COLORS.day_cloudy;
  }

  // Funktion um eine dunklere Version einer Farbe zu erstellen
  function darkenColor(hex, factor = 0.7) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  function getTimeOfDay(current, timezone) {
    if (!current) return "day";

    // Versuche die Stunde aus der Standort-Timezone zu bekommen
    let hour;

    // Priorität: Standort-Timezone verwenden (nicht Geräte-Lokalzeit!)
    if (timezone) {
      try {
        const locationTime = new Date().toLocaleString("en-US", {
          timeZone: timezone,
          hour: "numeric",
          hour12: false,
        });
        hour = parseInt(locationTime, 10);
        console.log(
          `[FrogHero] Using location timezone: ${timezone}, hour: ${hour}`
        );
      } catch (e) {
        console.warn("[FrogHero] Timezone parsing failed:", e);
        hour = null;
      }
    }

    // Fallback: Zeit aus current.time (falls vorhanden und keine Timezone)
    if (hour == null && current.time) {
      try {
        hour = new Date(current.time).getHours();
        console.log(`[FrogHero] Using current.time, hour: ${hour}`);
      } catch (e) {
        hour = null;
      }
    }

    // Letzter Fallback: Geräte-Lokalzeit (sollte vermieden werden)
    if (hour == null) {
      hour = new Date().getHours();
      console.warn("[FrogHero] Fallback to device time, hour:", hour);
    }

    if (hour >= 5 && hour < 10) return "morning";
    if (hour >= 10 && hour < 17) return "day";
    if (hour >= 17 && hour < 21) return "sunset";
    return "night";
  }

  function getCondition(current) {
    const code =
      current && (current.weatherCode ?? current.code ?? current.weather_code);
    console.log("[FrogHero] Weather code detected:", code);

    if (code == null) return "cloudy"; // Default für bedeckt

    // Detaillierte Wetter-Codes nach WMO
    const rainy = [51, 53, 55, 61, 63, 65, 80, 81, 82]; // Nieselregen, Regen, Schauer
    const snowy = [71, 73, 75, 77, 85, 86]; // Schneefall
    const hazy = [45, 48]; // Nebel
    const stormy = [95, 96, 99]; // Gewitter
    const cloudy = [2, 3]; // Teilweise bewölkt, bedeckt

    if (stormy.includes(code)) return "rainy"; // Gewitter als rainy
    if (rainy.includes(code)) return "rainy";
    if (snowy.includes(code)) return "snowy";
    if (hazy.includes(code)) return "hazy";
    if (cloudy.includes(code)) return "cloudy";
    if (code === 0 || code === 1) return "sunny";
    return "cloudy";
  }

  function buildSceneKey(current, timezone) {
    const tod = getTimeOfDay(current, timezone);
    const cond = getCondition(current);
    return `${SCENE_TYPE}_${tod}_${cond}`;
  }

  function buildBackgroundUrl(sceneKey) {
    return `${FROG_BASE_PATH}/${sceneKey}_bg.webp`;
  }

  function getSkyColors(tod, cond) {
    const key = `${tod}_${cond}`;
    return SKY_COLORS[key] || SKY_COLORS.day_cloudy;
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  function applyDynamicGradients(tod, cond) {
    const colors = getSkyColors(tod, cond);
    const groundColor = getGroundColor(tod, cond);
    const pageBgColor = darkenColor(groundColor, 0.85); // Leicht dunklere Version der Bodenfarbe
    const pond = document.getElementById("frog-hero-pond");
    const appShell = document.querySelector(".app-shell");
    const weatherHero = document.querySelector(".weather-hero");
    const appBar = document.getElementById("app-bar");
    const body = document.body;

    if (!pond) return;

    // Top-Gradient deaktiviert - verdunkelt das Bild nicht mehr
    const topGradient = `none`;

    // Bottom-Gradient deaktiviert - Übergang erfolgt durch .fields-bg-transition
    const bottomGradient = `none`;

    // App-Bar Gradient - nahtloser Übergang von Himmelfarbe zu transparent
    const appBarGradient = `linear-gradient(to bottom,
      ${colors.top} 0%,
      ${hexToRgba(colors.top, 0.85)} 30%,
      ${hexToRgba(colors.top, 0.5)} 60%,
      ${hexToRgba(colors.top, 0.15)} 85%,
      transparent 100%)`;

    // Setze CSS Custom Properties global auf document.documentElement
    document.documentElement.style.setProperty("--sky-top", colors.top);
    document.documentElement.style.setProperty(
      "--sky-top-rgb",
      hexToRgb(colors.top)
    );
    document.documentElement.style.setProperty("--sky-mid", colors.mid);
    document.documentElement.style.setProperty("--sky-bottom", colors.bottom);
    document.documentElement.style.setProperty(
      "--sky-bottom-rgb",
      hexToRgb(colors.bottom)
    );
    document.documentElement.style.setProperty("--ground-color", groundColor);
    document.documentElement.style.setProperty(
      "--ground-color-rgb",
      hexToRgb(groundColor)
    );
    document.documentElement.style.setProperty("--page-bg", pageBgColor);
    document.documentElement.style.setProperty(
      "--page-bg-rgb",
      hexToRgb(pageBgColor)
    );
    document.documentElement.style.setProperty("--top-gradient", topGradient);
    document.documentElement.style.setProperty(
      "--bottom-gradient",
      bottomGradient
    );
    document.documentElement.style.setProperty("--card-bg", pageBgColor);
    document.documentElement.style.setProperty(
      "--app-bar-gradient",
      appBarGradient
    );

    // Nur lokal auf pond setzen, damit Änderungen nicht die gesamte Seite beeinflussen
    pond.style.setProperty("--sky-top", colors.top);
    pond.style.setProperty("--sky-top-rgb", hexToRgb(colors.top));
    pond.style.setProperty("--sky-mid", colors.mid);
    pond.style.setProperty("--sky-bottom", colors.bottom);
    pond.style.setProperty("--sky-bottom-rgb", hexToRgb(colors.bottom));
    pond.style.setProperty("--ground-color", groundColor);
    pond.style.setProperty("--ground-color-rgb", hexToRgb(groundColor));
    pond.style.setProperty("--page-bg", pageBgColor);
    pond.style.setProperty("--page-bg-rgb", hexToRgb(pageBgColor));
    pond.style.setProperty("--top-gradient", topGradient);
    pond.style.setProperty("--bottom-gradient", bottomGradient);
    pond.style.setProperty("--card-bg", pageBgColor);

    // Auch auf weather-hero__scene setzen für die Übergangs-Elemente
    const scene = document.querySelector(".weather-hero__scene");
    if (scene) {
      scene.style.setProperty("--sky-top", colors.top);
      scene.style.setProperty("--sky-top-rgb", hexToRgb(colors.top));
      scene.style.setProperty("--page-bg", pageBgColor);
      scene.style.setProperty("--page-bg-rgb", hexToRgb(pageBgColor));
    }

    // HTML und Body bekommen die Bodenfarbe als Basis-Hintergrund
    // Die Himmelsfarbe wird nur auf den oberen Bereich (weather-hero) angewendet
    const homeSection = document.querySelector('[data-view="home"]');
    const isHomeVisible = homeSection && !homeSection.hidden;

    if (isHomeVisible) {
      // Body und html bekommen die dunkle Bodenfarbe als durchgehenden Hintergrund
      document.documentElement.style.background = pageBgColor;
      if (body) {
        body.style.background = pageBgColor;
      }

      // App-shell bekommt auch die Bodenfarbe
      if (appShell) {
        appShell.style.background = pageBgColor;
      }

      // Home-Section bekommt die Bodenfarbe als Hintergrund
      if (homeSection) {
        homeSection.style.background = pageBgColor;
      }

      // Card-Groups bekommen alle die Bodenfarbe
      // Der Übergang erfolgt durch fields-ground-transition im Bild selbst
      const cardGroups = document.querySelectorAll(
        '[data-view="home"] .card-group'
      );
      cardGroups.forEach((cg) => {
        cg.style.background = pageBgColor;
      });
    }

    // App-Bar bekommt die Himmelsfarbe als Hintergrund (fixiert oben)
    if (appBar) {
      appBar.style.background = colors.top;
    }

    // Weather-hero bekommt Gradient von Himmel zu Boden, um Lücken am unteren Rand zu kaschieren
    if (weatherHero) {
      weatherHero.style.background = `linear-gradient(to bottom, ${colors.top} 50%, ${pageBgColor} 100%)`;
    }

    // Weather-hero Header bekommt die Himmelsfarbe als Hintergrund (Bereich über dem Bild)
    const weatherHeroHeader = document.querySelector(".weather-hero__header");
    if (weatherHeroHeader) {
      weatherHeroHeader.style.background = colors.top;
    }

    console.log("[FrogHero] Applied sky colors for", tod, cond, ":", colors);
  }

  function applyBackground(sceneKey, current, timezone) {
    const pond = document.getElementById("frog-hero-pond");
    if (!pond) {
      console.warn("[FrogHero] frog-hero-pond nicht gefunden");
      return;
    }

    const url = buildBackgroundUrl(sceneKey);
    console.log("[FrogHero] Setze Hintergrund:", url, "für Wetter-Szene");

    pond.style.backgroundImage = `url("${url}")`;
    pond.style.backgroundSize = "cover";
    pond.style.backgroundPosition = "center bottom";
    pond.style.backgroundRepeat = "no-repeat";
    pond.style.minHeight = "220px";

    // Dynamische Gradienten anwenden (mit Standort-Timezone)
    const tod = getTimeOfDay(current, timezone);
    const cond = getCondition(current);
    applyDynamicGradients(tod, cond);
  }

  /**
   * Rendert den Frog Hero Hintergrund basierend auf Wetter und Standort-Zeit
   * @param {Object} currentOrState - Entweder current-Objekt oder vollständiger homeState
   * @param {string} [timezone] - Optional: Standort-Timezone (falls nicht in currentOrState enthalten)
   */
  function renderFrogHero(currentOrState, timezone) {
    // Unterstütze beide Aufrufvarianten:
    // 1. renderFrogHero(homeState) - vollständiger State mit timezone
    // 2. renderFrogHero(current, timezone) - separater timezone Parameter
    let current = currentOrState;
    let tz = timezone;

    // Wenn homeState übergeben wurde, extrahiere current und timezone
    if (currentOrState && (currentOrState.current || currentOrState.timezone)) {
      current = currentOrState.current || currentOrState;
      tz = currentOrState.timezone || timezone;
    }

    const sceneKey = buildSceneKey(current || {}, tz);
    console.log(
      "[FrogHero] Scene Key:",
      sceneKey,
      "Timezone:",
      tz,
      "Current:",
      current
    );
    applyBackground(sceneKey, current, tz);
  }

  global.FrogHeroPlayer = {
    renderFrogHero,
    buildSceneKey,
    getTimeOfDay,
    getCondition,
    getSkyColors,
    SCENE_TYPE,
    SKY_COLORS,
  };
})(window);
