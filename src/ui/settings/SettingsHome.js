/**
 * SettingsHome.js - Einstellungen-Hauptseite
 * Zeigt alle verfügbaren Einstellungsoptionen als Karten an
 */
(function (global) {
  function renderSettingsHome(appState) {
    const container = document.getElementById("settings-home-container");
    if (!container) {
      console.warn("[SettingsHome] Container nicht gefunden");
      return;
    }

    // Translation function with fallback
    const tr = (key) => {
      if (global.i18n && global.i18n.t) {
        return global.i18n.t(key);
      }
      // Fallback translations
      const fallbacks = {
        "settings.group.appearance": "Erscheinungsbild",
        "settings.subtitle.appearance": "Thema und Farben",
        "settings.group.home": "Heimatort",
        "settings.subtitle.home": "Standardstandort festlegen",
        "settings.group.units": "Einheiten",
        "settings.subtitle.units": "Temperatur, Wind, etc.",
        "settings.group.background": "Hintergrund-Updates",
        "settings.subtitle.background": "Automatische Aktualisierung",
        "settings.group.models": "Wettermodelle",
        "settings.subtitle.models": "Datenquellen auswählen",
        "settings.group.language": "Sprache",
        "settings.languageLabel": "Aktuelle Sprache",
        "settings.languageValueDe": "Deutsch",
        "settings.languageValueEn": "English",
        "settings.group.export": "Daten exportieren",
        "settings.subtitle.export": "Einstellungen sichern",
        "settings.group.import": "Daten importieren",
        "settings.subtitle.import": "Einstellungen wiederherstellen",
        "settings.group.community": "Community",
        "settings.subtitle.community": "Feedback und Support",
        "settings.privacy.title": "Datenschutz",
        "settings.group.about": "Über die App",
        "settings.subtitle.about": "Version und Infos",
      };
      return fallbacks[key] || key;
    };

    container.innerHTML = `
      <div class="settings-home">
        ${renderCard(
          "appearance",
          "🎨",
          tr("settings.group.appearance"),
          tr("settings.subtitle.appearance"),
          "sheet-settings-theme"
        )}
        ${renderCard(
          "home",
          "📍",
          tr("settings.group.home"),
          tr("settings.subtitle.home"),
          "sheet-settings-home"
        )}
        ${renderCard(
          "units",
          "📏",
          tr("settings.group.units"),
          tr("settings.subtitle.units"),
          "sheet-settings-units"
        )}
        ${renderCard(
          "background",
          "⏱️",
          tr("settings.group.background"),
          tr("settings.subtitle.background"),
          "sheet-settings-background"
        )}
        ${renderCard(
          "models",
          "☁️",
          tr("settings.group.models"),
          tr("settings.subtitle.models"),
          "sheet-settings-models"
        )}
        ${renderCard(
          "language",
          "🌐",
          tr("settings.group.language"),
          `${tr("settings.languageLabel")}: ${
            (global.i18n &&
              global.i18n.getLanguage &&
              global.i18n.getLanguage() === "en" &&
              tr("settings.languageValueEn")) ||
            tr("settings.languageValueDe")
          }`,
          "sheet-settings-language"
        )}
        ${renderCard(
          "export",
          "📤",
          tr("settings.group.export"),
          tr("settings.subtitle.export"),
          "sheet-settings-export"
        )}
        ${renderCard(
          "import",
          "📥",
          tr("settings.group.import"),
          tr("settings.subtitle.import"),
          "sheet-settings-import"
        )}
        ${renderCard(
          "community",
          "👥",
          tr("settings.group.community"),
          tr("settings.subtitle.community"),
          "sheet-settings-community"
        )}
        ${renderCard(
          "privacy",
          "🔒",
          tr("settings.privacy.title"),
          tr("settings.subtitle.about"),
          "sheet-settings-privacy"
        )}
        ${renderCard(
          "about",
          "ℹ️",
          tr("settings.group.about"),
          tr("settings.subtitle.about"),
          "sheet-settings-about"
        )}
      </div>
    `;
  }

  function renderCard(key, icon, title, subtitle, sheetId) {
    return `
      <button
        class="settings-card"
        type="button"
        data-bottom-sheet="${sheetId}"
        data-settings-key="${key}"
      >
        <span class="settings-card__icon">${icon}</span>
        <span class="settings-card__content">
          <span class="settings-card__title">${title}</span>
          <span class="settings-card__subtitle">${subtitle}</span>
        </span>
      </button>
    `;
  }

  global.SettingsHome = {
    renderSettingsHome,
  };
})(window);
