/**
 * PrivacyApiInfoSheet.js - Datenschutz & API-Info
 * Design inspiriert von WeatherMaster App
 */
(function (global) {
  function renderPrivacySheet() {
    const container = document.getElementById("settings-privacy-body");
    if (!container) return;

    const t = global.i18n
      ? global.i18n.t
      : (key) => {
          const fallbacks = {
            "settings.privacy.title": "Datenschutz",
            "settings.privacy.storedDataTitle": "Gespeicherte Daten",
            "settings.privacy.storedDataIntro":
              "Diese Daten werden lokal auf deinem Gerät gespeichert:",
            "settings.privacy.storedFavorites": "Favoriten-Orte",
            "settings.privacy.storedSettings": "App-Einstellungen",
            "settings.privacy.storedCache": "Wetter-Cache",
            "settings.privacy.apisTitle": "Verwendete APIs",
            "settings.privacy.apisIntro":
              "Die App nutzt folgende externe Dienste:",
            "settings.privacy.privacyLink": "Datenschutzerklärung",
            "settings.privacy.termsLink": "Nutzungsbedingungen",
          };
          return fallbacks[key] || key;
        };

    container.innerHTML = `
      <div class="privacy-settings">
        <div class="privacy-section">
          <h3 class="privacy-section__title">
            <span class="privacy-section__icon">💾</span>
            ${t("settings.privacy.storedDataTitle")}
          </h3>
          <p class="privacy-section__text">${t(
            "settings.privacy.storedDataIntro"
          )}</p>
          <div class="privacy-data-list">
            <div class="privacy-data-item">
              <span class="privacy-data-item__icon">⭐</span>
              <span class="privacy-data-item__text">${t(
                "settings.privacy.storedFavorites"
              )}</span>
            </div>
            <div class="privacy-data-item">
              <span class="privacy-data-item__icon">⚙️</span>
              <span class="privacy-data-item__text">${t(
                "settings.privacy.storedSettings"
              )}</span>
            </div>
            <div class="privacy-data-item">
              <span class="privacy-data-item__icon">🗃️</span>
              <span class="privacy-data-item__text">${t(
                "settings.privacy.storedCache"
              )}</span>
            </div>
          </div>
        </div>

        <div class="privacy-section">
          <h3 class="privacy-section__title">
            <span class="privacy-section__icon">🌐</span>
            ${t("settings.privacy.apisTitle")}
          </h3>
          <p class="privacy-section__text">${t(
            "settings.privacy.apisIntro"
          )}</p>
          <div class="privacy-api-list">
            <div class="privacy-api-item">
              <span class="privacy-api-item__name">Open-Meteo</span>
              <span class="privacy-api-item__desc">Wetterdaten</span>
            </div>
            <div class="privacy-api-item">
              <span class="privacy-api-item__name">BrightSky</span>
              <span class="privacy-api-item__desc">DWD Daten</span>
            </div>
            <div class="privacy-api-item">
              <span class="privacy-api-item__name">NOAA Alerts</span>
              <span class="privacy-api-item__desc">Warnungen</span>
            </div>
            <div class="privacy-api-item">
              <span class="privacy-api-item__name">OpenStreetMap</span>
              <span class="privacy-api-item__desc">Karten</span>
            </div>
          </div>
        </div>

        <div class="privacy-section">
          <h3 class="privacy-section__title">
            <span class="privacy-section__icon">📄</span>
            Links
          </h3>
          <div class="privacy-links">
            <a href="legal/privacy.html" target="_blank" class="privacy-link">
              <span class="privacy-link__text">${t(
                "settings.privacy.privacyLink"
              )}</span>
              <span class="privacy-link__arrow">›</span>
            </a>
            <a href="legal/terms.html" target="_blank" class="privacy-link">
              <span class="privacy-link__text">${t(
                "settings.privacy.termsLink"
              )}</span>
              <span class="privacy-link__arrow">›</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  global.PrivacyApiInfoSheet = { renderPrivacySheet };
})(window);
