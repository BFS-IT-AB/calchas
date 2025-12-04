(function (global) {
  /**
   * Weather Cards - Visuelle Wetter-Karten wie in den Screenshots
   * Mit SVG-Grafiken, Gauges und klickbaren Detail-Modalen
   */

  // === HELPER FUNCTIONS ===

  function getWeatherIcon(code, isDay = true) {
    const icons = {
      0: isDay ? "☀️" : "🌙",
      1: isDay ? "🌤️" : "🌙",
      2: "⛅",
      3: "☁️",
      45: "🌫️",
      48: "🌫️",
      51: "🌦️",
      53: "🌦️",
      55: "🌧️",
      61: "🌧️",
      63: "🌧️",
      65: "🌧️",
      71: "🌨️",
      73: "🌨️",
      75: "❄️",
      80: "🌦️",
      81: "🌧️",
      82: "⛈️",
      95: "⛈️",
      96: "⛈️",
      99: "⛈️",
    };
    return icons[code] || "☁️";
  }

  function createArcPath(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  }

  function createGaugeSVG(value, max, color, size = 80) {
    const percentage = Math.min(value / max, 1);
    const angle = percentage * 270; // 270 degree arc
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;

    const bgPath = createArcPath(cx, cy, radius, -135, 135);
    const valuePath = createArcPath(cx, cy, radius, -135, -135 + angle);

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <path d="${bgPath}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="6" stroke-linecap="round"/>
        <path d="${valuePath}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `;
  }

  function createCircularProgressSVG(value, max, color, size = 70) {
    const percentage = Math.min(value / max, 1);
    const circumference = 2 * Math.PI * 28;
    const offset = circumference * (1 - percentage);

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="5"/>
        <circle cx="35" cy="35" r="28" fill="none" stroke="${color}" stroke-width="5"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                stroke-linecap="round" transform="rotate(-90 35 35)"/>
      </svg>
    `;
  }

  function createWaveSVG(color = "#7B9FD4") {
    return `
      <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
        <path d="M0 40 Q50 20 100 40 T200 40 L200 60 L0 60 Z" fill="${color}" opacity="0.6"/>
        <path d="M0 45 Q50 30 100 45 T200 45 L200 60 L0 60 Z" fill="${color}" opacity="0.8"/>
      </svg>
    `;
  }

  function createSunPathSVG(sunrise, sunset, currentTime) {
    const sunriseTime = new Date(sunrise).getTime();
    const sunsetTime = new Date(sunset).getTime();
    const now = currentTime || Date.now();

    let progress = 0;
    if (now >= sunriseTime && now <= sunsetTime) {
      progress = (now - sunriseTime) / (sunsetTime - sunriseTime);
    } else if (now > sunsetTime) {
      progress = 1;
    }

    const angle = -180 + progress * 180;
    const sunX = 100 + 80 * Math.cos((angle * Math.PI) / 180);
    const sunY = 70 + 50 * Math.sin((angle * Math.PI) / 180);

    return `
      <svg width="100%" height="80" viewBox="0 0 200 80">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#4A6FA5;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#7B9FD4;stop-opacity:0.6"/>
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="70" rx="80" ry="50" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="4,4"/>
        <path d="M20 70 Q100 20 180 70" fill="url(#skyGrad)"/>
        <circle cx="${sunX}" cy="${sunY}" r="8" fill="#FFD700"/>
        <line x1="20" y1="70" x2="180" y2="70" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      </svg>
    `;
  }

  // === CARD RENDERING ===

  function renderHumidityCard(container, data) {
    const humidity = data.humidity ?? 0;
    const dewPoint = data.dewPoint ?? 0;

    container.innerHTML = `
      <button class="weather-card weather-card--humidity" data-card="humidity" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">💧</span>
          <span class="weather-card__label">Luftfeuchtigkeit</span>
        </div>
        <div class="weather-card__visual weather-card__visual--gradient">
          <span class="weather-card__value-large">${Math.round(
            humidity
          )}%</span>
        </div>
        <div class="weather-card__footer">
          <span class="weather-card__badge">${Math.round(dewPoint)}°</span>
          <span class="weather-card__sublabel">Taupunkt</span>
        </div>
      </button>
    `;
  }

  function renderSunCard(container, data) {
    const sunrise = data.sunrise;
    const sunset = data.sunset;
    const sunriseLabel = sunrise
      ? new Date(sunrise).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";
    const sunsetLabel = sunset
      ? new Date(sunset).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";

    container.innerHTML = `
      <button class="weather-card weather-card--sun" data-card="sun" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">🌅</span>
          <span class="weather-card__label">Sonne</span>
        </div>
        <div class="weather-card__visual weather-card__visual--sun">
          ${createSunPathSVG(sunrise, sunset)}
        </div>
        <div class="weather-card__sun-times">
          <span>↑ ${sunriseLabel}</span>
          <span>↓ ${sunsetLabel}</span>
        </div>
      </button>
    `;
  }

  function renderPressureCard(container, data) {
    const pressure = data.pressure ?? 1013;
    const normalized = (pressure - 950) / 100; // 950-1050 hPa range

    container.innerHTML = `
      <button class="weather-card weather-card--pressure" data-card="pressure" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">🌡️</span>
          <span class="weather-card__label">Luftdruck</span>
        </div>
        <div class="weather-card__gauge">
          ${createGaugeSVG(normalized * 100, 100, "#7FBADC", 100)}
          <div class="weather-card__gauge-value">
            <span class="weather-card__value-large">${Math.round(
              pressure
            )}</span>
            <span class="weather-card__unit">hPa</span>
          </div>
        </div>
      </button>
    `;
  }

  function renderVisibilityCard(container, data) {
    const visibility = data.visibility ?? 10;

    container.innerHTML = `
      <button class="weather-card weather-card--visibility" data-card="visibility" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">👁️</span>
          <span class="weather-card__label">Sichtweite</span>
        </div>
        <div class="weather-card__blob">
          <span class="weather-card__value-large">${Math.round(
            visibility
          )}</span>
          <span class="weather-card__unit">Km</span>
        </div>
      </button>
    `;
  }

  function renderWindCard(container, data) {
    const windSpeed = data.windSpeed ?? 0;
    const windGust = data.windGust ?? windSpeed;
    const windDirection = data.windDirection ?? 0;

    // Create wind direction indicator
    const windPath = `
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="windGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4A6FA5"/>
            <stop offset="100%" style="stop-color:#7B9FD4"/>
          </linearGradient>
        </defs>
        <path d="M40 10 Q60 30 50 50 Q45 60 40 70 Q35 60 30 50 Q20 30 40 10"
              fill="url(#windGrad)" transform="rotate(${windDirection}, 40, 40)"/>
      </svg>
    `;

    container.innerHTML = `
      <button class="weather-card weather-card--wind" data-card="wind" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">💨</span>
          <span class="weather-card__label">Wind</span>
        </div>
        <div class="weather-card__wind-visual">
          ${windPath}
          <div class="weather-card__wind-value">
            <span class="weather-card__value-large">${Math.round(
              windSpeed
            )}</span>
          </div>
        </div>
        <div class="weather-card__footer">
          <span class="weather-card__sublabel">${Math.round(
            windGust
          )} Km/h</span>
        </div>
      </button>
    `;
  }

  function renderUVCard(container, data) {
    const uvIndex = data.uvIndex ?? 0;
    const uvLevels = [
      { max: 2, label: "Wenig", color: "#4CAF50" },
      { max: 5, label: "Moderat", color: "#FFEB3B" },
      { max: 7, label: "Hoch", color: "#FF9800" },
      { max: 10, label: "Sehr hoch", color: "#F44336" },
      { max: 15, label: "Extrem", color: "#9C27B0" },
    ];

    const level =
      uvLevels.find((l) => uvIndex <= l.max) || uvLevels[uvLevels.length - 1];

    // Create UV scale dots
    const dots = uvLevels
      .map((l, i) => {
        const isActive =
          uvIndex > (i > 0 ? uvLevels[i - 1].max : 0) && uvIndex <= l.max;
        return `<span class="uv-dot" style="background:${l.color};opacity:${
          isActive ? 1 : 0.3
        }"></span>`;
      })
      .join("");

    container.innerHTML = `
      <button class="weather-card weather-card--uv" data-card="uv" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">☀️</span>
          <span class="weather-card__label">UV-Index</span>
        </div>
        <div class="weather-card__blob weather-card__blob--purple">
          <span class="weather-card__value-large">${uvIndex}</span>
        </div>
        <div class="weather-card__uv-indicator">
          <span class="weather-card__uv-dot" style="background:${level.color}"></span>
          <span class="weather-card__sublabel">${level.label}</span>
        </div>
        <div class="weather-card__uv-scale">${dots}</div>
      </button>
    `;
  }

  function renderAQICard(container, data) {
    const aqi = data.aqi ?? data.europeanAqi ?? 0;
    const aqiLevels = [
      { max: 25, label: "Gut", color: "#4CAF50" },
      { max: 50, label: "OK", color: "#8BC34A" },
      { max: 75, label: "Moderat", color: "#FFEB3B" },
      { max: 100, label: "Schlecht", color: "#FF9800" },
      { max: 150, label: "Sehr schlecht", color: "#F44336" },
    ];

    const level =
      aqiLevels.find((l) => aqi <= l.max) || aqiLevels[aqiLevels.length - 1];

    // Create gradient bar
    const gradientBar = `
      <div class="aqi-gradient">
        <div class="aqi-gradient__bar"></div>
        <div class="aqi-gradient__marker" style="left:${Math.min(
          (aqi / 150) * 100,
          100
        )}%"></div>
      </div>
    `;

    container.innerHTML = `
      <button class="weather-card weather-card--aqi" data-card="aqi" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">≋</span>
          <span class="weather-card__label">AQI</span>
        </div>
        <div class="weather-card__aqi-value">
          <span class="weather-card__value-large">${Math.round(aqi)}</span>
        </div>
        ${gradientBar}
        <div class="weather-card__footer">
          <span class="weather-card__sublabel">${level.label}</span>
        </div>
      </button>
    `;
  }

  function renderPrecipitationCard(container, data) {
    const precipSum = data.precipitationSum ?? 0;
    const precipProb = data.precipProbMax ?? 0;

    container.innerHTML = `
      <button class="weather-card weather-card--precipitation" data-card="precipitation" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">🌧️</span>
          <span class="weather-card__label">Niederschlag</span>
        </div>
        <div class="weather-card__precip-value">
          <span class="weather-card__value-large">${precipSum.toFixed(1)}</span>
          <span class="weather-card__unit">mm</span>
        </div>
        <div class="weather-card__footer">
          <span class="weather-card__sublabel">Gesamt heute</span>
          <span class="weather-card__precip-icon">💧</span>
        </div>
      </button>
    `;
  }

  function renderMoonCard(container, data) {
    const moonrise = data.moonrise;
    const moonset = data.moonset;
    const moonPhase = data.moonPhase ?? 0;

    const moonriseLabel = moonrise
      ? new Date(moonrise).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";
    const moonsetLabel = moonset
      ? new Date(moonset).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";

    container.innerHTML = `
      <button class="weather-card weather-card--moon" data-card="moon" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">🌙</span>
          <span class="weather-card__label">Mond</span>
        </div>
        <div class="weather-card__visual weather-card__visual--moon">
          ${createWaveSVG("#6B7FD4")}
        </div>
        <div class="weather-card__sun-times">
          <span>↑ ${moonriseLabel}</span>
          <span>↓ ${moonsetLabel}</span>
        </div>
      </button>
    `;
  }

  function renderCloudCoverCard(container, data) {
    const cloudCover = data.cloudCover ?? 0;

    container.innerHTML = `
      <button class="weather-card weather-card--clouds" data-card="clouds" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">☁️</span>
          <span class="weather-card__label">Bedeckungsgrad</span>
        </div>
        <div class="weather-card__blob weather-card__blob--purple">
          <span class="weather-card__value-large">${Math.round(
            cloudCover
          )}</span>
          <span class="weather-card__unit">%</span>
        </div>
      </button>
    `;
  }

  function renderPollenCard(container, data) {
    const pollenData = data.pollen || { trees: 1, grass: 1, weeds: 1 };

    const createPollenGauge = (value, label, icon) => {
      const color =
        value <= 1
          ? "#4CAF50"
          : value <= 2
          ? "#FFEB3B"
          : value <= 3
          ? "#FF9800"
          : "#F44336";
      return `
        <div class="pollen-gauge">
          ${createCircularProgressSVG(value, 4, color, 50)}
          <div class="pollen-gauge__content">
            <span class="pollen-gauge__icon">${icon}</span>
            <span class="pollen-gauge__label">${label}</span>
            <span class="pollen-gauge__value">${value}/4</span>
            <span class="pollen-gauge__level">${
              value <= 1
                ? "Wenig"
                : value <= 2
                ? "Moderat"
                : value <= 3
                ? "Hoch"
                : "Sehr hoch"
            }</span>
          </div>
        </div>
      `;
    };

    container.innerHTML = `
      <button class="weather-card weather-card--pollen weather-card--wide" data-card="pollen" type="button">
        <div class="weather-card__header">
          <span class="weather-card__icon">🌿</span>
          <span class="weather-card__label">Pollenflug</span>
        </div>
        <div class="weather-card__pollen-grid">
          ${createPollenGauge(pollenData.trees || 1, "Bäume", "🌳")}
          ${createPollenGauge(pollenData.grass || 1, "Gräser", "🌾")}
          ${createPollenGauge(pollenData.weeds || 1, "Kräuter", "🌱")}
        </div>
      </button>
    `;
  }

  // === DETAIL MODALS ===

  function openCardDetailModal(cardType, appState) {
    const current = appState.current || {};
    const daily = (appState.daily && appState.daily[0]) || {};
    const hourly = appState.hourly || [];
    const aqi = appState.aqi || {};

    const modalContent = getModalContent(cardType, {
      current,
      daily,
      hourly,
      aqi,
    });

    const sheetId = `sheet-${cardType}-detail`;
    let sheet = document.getElementById(sheetId);

    if (!sheet) {
      sheet = document.createElement("section");
      sheet.id = sheetId;
      sheet.className = "bottom-sheet bottom-sheet--full";
      document.getElementById("bottom-sheet-overlay")?.appendChild(sheet);
    }

    sheet.innerHTML = modalContent;

    if (window.ModalController) {
      window.ModalController.openSheet(sheetId);
    }
  }

  function getModalContent(type, data) {
    const { current, daily, hourly, aqi } = data;

    const templates = {
      humidity: () => {
        const humidity = current.humidity ?? 0;
        const dewPoint = current.dewPoint ?? 0;
        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">💧</span>
            <h2 class="bottom-sheet__title">Luftfeuchtigkeit</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Aktuelle Bedingungen</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${Math.round(humidity)}%</span>
              </div>
              <p>Der Taupunkt liegt bei ${Math.round(dewPoint)}°C</p>
            </div>
            <div class="detail-card">
              <p>Die Luftfeuchtigkeit gibt an, wie viel Wasserdampf in der Luft enthalten ist.
              Bei hoher Luftfeuchtigkeit fühlt sich die Temperatur wärmer an.</p>
            </div>
          </div>
        `;
      },

      aqi: () => {
        const aqiValue = aqi.europeanAqi ?? aqi.usAqi ?? 0;
        const usAqi = aqi.usAqi ?? 0;
        const euAqi = aqi.europeanAqi ?? 0;
        const aqiLabel =
          euAqi <= 25
            ? "Gut"
            : euAqi <= 50
            ? "OK"
            : euAqi <= 75
            ? "Moderat"
            : "Schlecht";

        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">≋</span>
            <h2 class="bottom-sheet__title">Luftqualität</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Aktuelle Bedingungen</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${Math.round(euAqi)}</span>
                <span class="detail-card__label">${aqiLabel}</span>
              </div>
              <div class="aqi-gradient aqi-gradient--large">
                <div class="aqi-gradient__bar"></div>
                <div class="aqi-gradient__marker" style="left:${Math.min(
                  (euAqi / 150) * 100,
                  100
                )}%"></div>
              </div>
              <div class="detail-card__row">
                <span>US AQI:</span>
                <span class="detail-card__badge">${Math.round(usAqi)}</span>
              </div>
              <div class="detail-card__row">
                <span>Europäischer AQI:</span>
                <span class="detail-card__badge">${Math.round(euAqi)}</span>
              </div>
            </div>
            <div class="detail-card__tabs">
              <button class="detail-card__tab detail-card__tab--active">US AQI</button>
              <button class="detail-card__tab">Europäischer AQI</button>
            </div>
            <div class="detail-card">
              <p>Der EU AQI (Luftqualitätsindex) ist ein Maß welches genutzt wird, um die Luftverschmutzung
              in der Europäischen Union zu vermitteln. Es ist in fünf Level unterteilt von "Gut" bis "Sehr schlecht".</p>
              <ul class="detail-card__list">
                <li>0-25: Die Luftqualität wird als zufriedenstellend angesehen.</li>
                <li>26-50: Die Luftqualität ist akzeptabel.</li>
                <li>51-75: Empfindliche Personen sollten Vorsicht walten lassen.</li>
                <li>76-100: Gesundheitliche Auswirkungen möglich.</li>
              </ul>
            </div>
          </div>
        `;
      },

      uv: () => {
        const uvIndex = current.uvIndex ?? 0;
        const uvLabel =
          uvIndex <= 2
            ? "Wenig"
            : uvIndex <= 5
            ? "Moderat"
            : uvIndex <= 7
            ? "Hoch"
            : "Sehr hoch";

        // Create hourly UV data
        const hourlyUV = hourly
          .slice(0, 12)
          .map(
            (h) => `
          <div class="hourly-bar">
            <div class="hourly-bar__fill" style="height:${
              ((h.uvIndex || 0) / 11) * 100
            }%"></div>
            <span class="hourly-bar__value">${h.uvIndex || 0}</span>
            <span class="hourly-bar__time">${new Date(
              h.time
            ).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
        `
          )
          .join("");

        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">☀️</span>
            <h2 class="bottom-sheet__title">UV-Index</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Heutiger Durchschnitt</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${uvIndex}</span>
                <span class="detail-card__label">${uvLabel}</span>
              </div>
              <div class="hourly-bars">${hourlyUV}</div>
            </div>
            <div class="detail-card">
              <p>Der UV-Index gibt die Stärke der ultravioletten Strahlung an. Die Skala reicht von 0 bis 11.</p>
              <ul class="detail-card__list">
                <li>1-2: Niedrig. Kein Schutz erforderlich.</li>
                <li>3-5: Moderat. Schutz empfohlen.</li>
                <li>6-7: Hoch. Schutz erforderlich.</li>
                <li>8+: Sehr hoch. Zusätzlicher Schutz nötig.</li>
              </ul>
            </div>
          </div>
        `;
      },

      precipitation: () => {
        const precipSum = daily.precipitationSum ?? 0;
        const precipProb = daily.precipProbMax ?? 0;

        const hourlyPrecip = hourly
          .slice(0, 12)
          .map(
            (h) => `
          <div class="hourly-bar">
            <div class="hourly-bar__fill hourly-bar__fill--precip" style="height:${
              h.precipProb || 0
            }%"></div>
            <span class="hourly-bar__value">${h.precipProb || 0}%</span>
            <span class="hourly-bar__amount">${(h.precipitation || 0).toFixed(
              1
            )}</span>
            <span class="hourly-bar__time">${new Date(
              h.time
            ).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
        `
          )
          .join("");

        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">🌧️</span>
            <h2 class="bottom-sheet__title">Niederschlag</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Niederschlagsmenge</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${precipSum.toFixed(1)}</span>
                <span class="detail-card__label">mm • heute</span>
              </div>
              <div class="hourly-bars">${hourlyPrecip}</div>
            </div>
            <div class="detail-card">
              <p>Die Regenmenge gibt an, wie viel Regen zu erwarten ist, in der Regel in Millimetern.</p>
              <p>Die Regenwahrscheinlichkeit bezeichnet die Wahrscheinlichkeit, dass es in einem bestimmten
              Zeitraum zu Niederschlägen kommt.</p>
            </div>
          </div>
        `;
      },

      wind: () => {
        const windSpeed = current.windSpeed ?? 0;
        const windGust = current.windGust ?? 0;
        const windDir = current.windDirection ?? 0;
        const windDirLabel = getWindDirectionLabel(windDir);

        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">💨</span>
            <h2 class="bottom-sheet__title">Wind</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Aktueller Wind</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${Math.round(windSpeed)}</span>
                <span class="detail-card__label">km/h</span>
              </div>
              <div class="detail-card__row">
                <span>Böen:</span>
                <span>${Math.round(windGust)} km/h</span>
              </div>
              <div class="detail-card__row">
                <span>Richtung:</span>
                <span>${windDirLabel} (${windDir}°)</span>
              </div>
            </div>
          </div>
        `;
      },

      visibility: () => {
        const visibility = current.visibility ?? 10;
        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">👁️</span>
            <h2 class="bottom-sheet__title">Sichtweite</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Aktuelle Sichtweite</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${Math.round(
                  visibility
                )}</span>
                <span class="detail-card__label">km</span>
              </div>
              <p>${
                visibility > 10
                  ? "Sehr gute Sicht"
                  : visibility >= 5
                  ? "Gute Sicht"
                  : "Eingeschränkte Sicht"
              }</p>
            </div>
          </div>
        `;
      },

      pressure: () => {
        const pressure = current.pressure ?? 1013;
        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">🌡️</span>
            <h2 class="bottom-sheet__title">Luftdruck</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Aktueller Luftdruck</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${Math.round(pressure)}</span>
                <span class="detail-card__label">hPa</span>
              </div>
              <p>${
                pressure > 1020
                  ? "Hochdruck - stabiles Wetter"
                  : pressure < 1000
                  ? "Tiefdruck - wechselhaftes Wetter"
                  : "Normaler Luftdruck"
              }</p>
            </div>
          </div>
        `;
      },

      sun: () => {
        const sunrise = daily.sunrise;
        const sunset = daily.sunset;
        const sunriseLabel = sunrise
          ? new Date(sunrise).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--";
        const sunsetLabel = sunset
          ? new Date(sunset).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--";

        let daylightStr = "";
        if (sunrise && sunset) {
          const diffMs = new Date(sunset) - new Date(sunrise);
          const hours = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          daylightStr = `${hours} Std ${mins} Min`;
        }

        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">🌅</span>
            <h2 class="bottom-sheet__title">Sonne</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <div class="detail-card__sun-visual">
                ${createSunPathSVG(sunrise, sunset)}
              </div>
              <div class="detail-card__row">
                <span>🌅 Sonnenaufgang:</span>
                <span>${sunriseLabel}</span>
              </div>
              <div class="detail-card__row">
                <span>🌇 Sonnenuntergang:</span>
                <span>${sunsetLabel}</span>
              </div>
              <div class="detail-card__row">
                <span>☀️ Tageslänge:</span>
                <span>${daylightStr}</span>
              </div>
            </div>
          </div>
        `;
      },

      moon: () => {
        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">🌙</span>
            <h2 class="bottom-sheet__title">Mond</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Mondphase</h3>
              <p>Mondphasen-Informationen werden geladen...</p>
            </div>
          </div>
        `;
      },

      clouds: () => {
        const cloudCover = current.cloudCover ?? 0;
        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">☁️</span>
            <h2 class="bottom-sheet__title">Bewölkung</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Aktueller Bedeckungsgrad</h3>
              <div class="detail-card__hero">
                <span class="detail-card__value">${Math.round(
                  cloudCover
                )}%</span>
              </div>
              <p>${
                cloudCover < 25
                  ? "Überwiegend klar"
                  : cloudCover < 50
                  ? "Leicht bewölkt"
                  : cloudCover < 75
                  ? "Bewölkt"
                  : "Stark bewölkt"
              }</p>
            </div>
          </div>
        `;
      },

      pollen: () => {
        return `
          <header class="bottom-sheet__header">
            <span class="bottom-sheet__icon">🌿</span>
            <h2 class="bottom-sheet__title">Pollenflug</h2>
            <button class="bottom-sheet__close" type="button" data-close-sheet>
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>
          <div class="bottom-sheet__body">
            <div class="detail-card">
              <h3>Pollenbelastung</h3>
              <p>Detaillierte Polleninformationen sind verfügbar.</p>
            </div>
          </div>
        `;
      },
    };

    return templates[type]
      ? templates[type]()
      : `<div class="detail-card"><p>Details nicht verfügbar</p></div>`;
  }

  function getWindDirectionLabel(deg) {
    const directions = [
      "N",
      "NNO",
      "NO",
      "ONO",
      "O",
      "OSO",
      "SO",
      "SSO",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  }

  // === MAIN RENDER FUNCTION ===

  function renderWeatherCards(appState) {
    const container = document.getElementById("weather-cards-grid");
    if (!container) return;

    const current = appState.current || {};
    const daily = (appState.daily && appState.daily[0]) || {};
    const aqi = appState.aqi || {};

    // Prepare data
    const cardData = {
      humidity: current.humidity ?? 0,
      dewPoint:
        current.dewPoint ?? (current.temperature ? current.temperature - 5 : 0),
      sunrise: daily.sunrise,
      sunset: daily.sunset,
      pressure: current.pressure ?? current.surfacePressure ?? 1013,
      visibility: current.visibility ?? 10,
      windSpeed: current.windSpeed ?? 0,
      windGust: current.windGust ?? current.windSpeed ?? 0,
      windDirection: current.windDirection ?? 0,
      uvIndex: current.uvIndex ?? 0,
      aqi: aqi.europeanAqi ?? aqi.usAqi ?? 0,
      europeanAqi: aqi.europeanAqi ?? 0,
      usAqi: aqi.usAqi ?? 0,
      precipitationSum: daily.precipitationSum ?? 0,
      precipProbMax: daily.precipProbMax ?? 0,
      cloudCover: current.cloudCover ?? 0,
      moonrise: daily.moonrise,
      moonset: daily.moonset,
      moonPhase: daily.moonPhase ?? 0,
      pollen: appState.pollen || { trees: 1, grass: 1, weeds: 1 },
    };

    // Clear and render cards
    container.innerHTML = `
      <div id="card-humidity" class="weather-card-wrapper"></div>
      <div id="card-sun" class="weather-card-wrapper"></div>
      <div id="card-pressure" class="weather-card-wrapper"></div>
      <div id="card-visibility" class="weather-card-wrapper"></div>
      <div id="card-wind" class="weather-card-wrapper"></div>
      <div id="card-uv" class="weather-card-wrapper"></div>
      <div id="card-aqi" class="weather-card-wrapper"></div>
      <div id="card-precipitation" class="weather-card-wrapper"></div>
      <div id="card-moon" class="weather-card-wrapper"></div>
      <div id="card-clouds" class="weather-card-wrapper"></div>
      <div id="card-pollen" class="weather-card-wrapper weather-card-wrapper--wide"></div>
    `;

    // Render each card
    renderHumidityCard(document.getElementById("card-humidity"), cardData);
    renderSunCard(document.getElementById("card-sun"), cardData);
    renderPressureCard(document.getElementById("card-pressure"), cardData);
    renderVisibilityCard(document.getElementById("card-visibility"), cardData);
    renderWindCard(document.getElementById("card-wind"), cardData);
    renderUVCard(document.getElementById("card-uv"), cardData);
    renderAQICard(document.getElementById("card-aqi"), cardData);
    renderPrecipitationCard(
      document.getElementById("card-precipitation"),
      cardData
    );
    renderMoonCard(document.getElementById("card-moon"), cardData);
    renderCloudCoverCard(document.getElementById("card-clouds"), cardData);
    renderPollenCard(document.getElementById("card-pollen"), cardData);

    // Add click handlers
    container.querySelectorAll(".weather-card").forEach((card) => {
      card.addEventListener("click", () => {
        const cardType = card.dataset.card;
        if (cardType) {
          openCardDetailModal(cardType, appState);
        }
      });
    });
  }

  // Export
  global.WeatherCards = {
    renderWeatherCards,
    openCardDetailModal,
  };
})(window);
