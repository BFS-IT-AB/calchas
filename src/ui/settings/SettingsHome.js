/**
 * SettingsHome.js - Einstellungen-Hauptseite
 * Design inspiriert von WeatherMaster App
 */
(function (global) {
  // SVG Icons für Settings
  const ICONS = {
    appearance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M14 9l3 3-3 3"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 9h-3v9h-5v-6h-2v6H6v-9H3l9-9z"/></svg>`,
    units: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14l2.83 2.83m4.48 4.48l2.83 2.83"/></svg>`,
    background: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 019-9"/></svg>`,
    models: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>`,
    language: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
    export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l4-4m-4 4l-4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>`,
    import: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15V3m0 12l4-4m-4 4l-4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    about: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>`,
  };

  // Icon colors
  const COLORS = {
    appearance: "#d4a574",
    home: "#7cb342",
    units: "#5c6bc0",
    background: "#c75b39",
    models: "#26a69a",
    language: "#9c27b0",
    export: "#7986cb",
    import: "#5c6bc0",
    discord: "#5865f2",
    about: "#7e57c2",
  };

  function renderSettingsHome(appState) {
    const container = document.getElementById("settings-home-container");
    if (!container) {
      console.warn("[SettingsHome] Container nicht gefunden");
      return;
    }

    const homeLocation = getHomeLocationLabel(appState);
    const currentLang =
      global.i18n?.getLanguage?.() === "en" ? "English" : "Deutsch";

    container.innerHTML = `
      <div class="settings-home">
        ${renderRow(
          "appearance",
          "Aussehen",
          "Themen, Animationen und App-Layout",
          "sheet-settings-theme"
        )}
        ${renderRow("home", "Heimatort", homeLocation, "sheet-settings-home")}
        ${renderRow(
          "units",
          "Einheiten",
          "Temperatur, Wind, Luftdruck, Sichtweite, Niederschlag, Tageszeit, Luftqualitätsindex",
          "sheet-settings-units"
        )}
        ${renderRow(
          "background",
          "Hintergrundaktualisierungen",
          "Widget-Updates, Update-Intervall und geplante Updates",
          "sheet-settings-background"
        )}
        ${renderRow(
          "models",
          "Wettermodelle",
          "Open-Meteo Wettermodelle",
          "sheet-settings-models"
        )}
        ${renderRow(
          "language",
          "Sprache",
          currentLang,
          "sheet-settings-language"
        )}
        ${renderRow(
          "export",
          "Daten exportieren",
          null,
          "sheet-settings-export"
        )}
        ${renderRow(
          "import",
          "Daten importieren",
          null,
          "sheet-settings-import"
        )}
        ${renderRow(
          "discord",
          "Tritt unserem Discord Server bei",
          null,
          "sheet-settings-discord"
        )}
        ${renderRow(
          "about",
          "Über Calchas",
          "Änderungsprotokoll, Version, Lizenzen und mehr",
          "sheet-settings-about"
        )}
      </div>
    `;
  }

  function getHomeLocationLabel(appState) {
    const fallback = "Nicht gesetzt";
    const home = appState?.homeLocation;
    if (home?.city || home?.name) {
      const city = home.city || home.name;
      const country = home.country || home.countryCode || "";
      return country ? `${city}, ${country}` : city;
    }

    try {
      const homeData = localStorage.getItem("wetter_home_location");
      if (homeData) {
        const parsed = JSON.parse(homeData);
        if (parsed?.city) {
          return parsed.country
            ? `${parsed.city}, ${parsed.country}`
            : parsed.city;
        }
      }
    } catch (e) {}
    return fallback;
  }

  function renderRow(key, title, subtitle, sheetId) {
    const icon = ICONS[key] || "";
    const color = COLORS[key] || "#666";
    const subtitleHtml = subtitle
      ? `<span class="settings-row__subtitle">${subtitle}</span>`
      : "";

    return `
      <button class="settings-row" type="button" data-bottom-sheet="${sheetId}">
        <span class="settings-row__icon" style="background-color: ${color}">${icon}</span>
        <span class="settings-row__content">
          <span class="settings-row__title">${title}</span>
          ${subtitleHtml}
        </span>
        <span class="settings-row__chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </span>
      </button>
    `;
  }

  global.SettingsHome = { renderSettingsHome };
})(window);
