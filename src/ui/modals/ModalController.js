(function (global) {
  let activeSheetId = null;

  // Mapping von Sheet-IDs zu Render-Funktionen
  function renderSheetContent(sheetId) {
    // Get appState with fallback to default structure
    let appState = global.appState;
    if (!appState && global.AppState) {
      try {
        appState = new global.AppState();
        global.appState = appState;
      } catch (e) {
        console.warn("[ModalController] Konnte AppState nicht instanzieren", e);
      }
    }

    if (!appState) {
      appState = {
        settings: {
          theme: localStorage.getItem("wetter_theme") || "system",
          units: JSON.parse(localStorage.getItem("wetter_units") || "{}"),
        },
        favorites: [],
        homeLocation: null,
        units: JSON.parse(localStorage.getItem("wetter_units") || "null") || {},
      };
    }

    const renderMap = {
      "sheet-settings-theme": () => {
        if (global.ThemeSelectorSheet?.renderThemeSheet) {
          global.ThemeSelectorSheet.renderThemeSheet(appState);
        }
      },
      "sheet-settings-units": () => {
        if (global.UnitsSelectorSheet?.renderUnitsSheet) {
          global.UnitsSelectorSheet.renderUnitsSheet(appState);
        }
      },
      "sheet-settings-language": () => {
        if (global.LanguageSelectorSheet?.renderLanguageSheet) {
          global.LanguageSelectorSheet.renderLanguageSheet(appState);
        }
      },
      "sheet-settings-home": () => {
        if (global.HomeLocationSheet?.renderHomeSheet) {
          global.HomeLocationSheet.renderHomeSheet(appState);
        }
      },
      "sheet-settings-about": () => {
        if (global.AboutSheet?.renderAboutSheet) {
          global.AboutSheet.renderAboutSheet(appState);
        }
      },
      "sheet-settings-background": () => {
        if (global.BackgroundSettingsSheet?.renderBackgroundSheet) {
          global.BackgroundSettingsSheet.renderBackgroundSheet(appState);
        }
      },
      "sheet-settings-privacy": () => {
        if (global.PrivacyApiInfoSheet?.renderPrivacySheet) {
          global.PrivacyApiInfoSheet.renderPrivacySheet(appState);
        }
      },
      "sheet-settings-models": () => {
        renderModelsSheet();
      },
      "sheet-settings-export": () => {
        renderExportSheet(appState);
      },
      "sheet-settings-import": () => {
        renderImportSheet(appState);
      },
      "sheet-settings-discord": () => {
        renderDiscordSheet();
      },
    };

    // Helper render functions for sheets that don't have dedicated modules
    function renderModelsSheet() {
      const container = document.getElementById("settings-models-body");
      if (!container) return;
      container.innerHTML = `
        <div class="settings-sheet-content">
          <div class="settings-info-card">
            <span class="settings-info-card__icon">🌤️</span>
            <div class="settings-info-card__content">
              <p class="settings-info-card__title">Wettermodelle</p>
              <p class="settings-info-card__text">Die Auswahl verschiedener Wettermodelle von Open-Meteo wird in einer kommenden Version verfügbar sein. Aktuell wird das optimale Standardmodell für deinen Standort verwendet.</p>
            </div>
          </div>
          <div class="settings-models-list">
            <div class="settings-model-item settings-model-item--active">
              <span class="settings-model-item__icon">✓</span>
              <span class="settings-model-item__name">Auto (Best Match)</span>
              <span class="settings-model-item__badge">Aktiv</span>
            </div>
            <div class="settings-model-item settings-model-item--disabled">
              <span class="settings-model-item__icon">🇩🇪</span>
              <span class="settings-model-item__name">ICON (DWD)</span>
              <span class="settings-model-item__badge">Bald</span>
            </div>
            <div class="settings-model-item settings-model-item--disabled">
              <span class="settings-model-item__icon">🇺🇸</span>
              <span class="settings-model-item__name">GFS (NOAA)</span>
              <span class="settings-model-item__badge">Bald</span>
            </div>
            <div class="settings-model-item settings-model-item--disabled">
              <span class="settings-model-item__icon">🇪🇺</span>
              <span class="settings-model-item__name">ECMWF</span>
              <span class="settings-model-item__badge">Bald</span>
            </div>
          </div>
        </div>
      `;
    }

    function renderExportSheet(state) {
      const container = document.getElementById("settings-export-body");
      if (!container) return;
      container.innerHTML = `
        <div class="settings-sheet-content">
          <div class="settings-info-card">
            <span class="settings-info-card__icon">📤</span>
            <div class="settings-info-card__content">
              <p class="settings-info-card__title">Daten exportieren</p>
              <p class="settings-info-card__text">Exportiere deine Einstellungen, Favoriten und den Heimatort als JSON-Datei. Du kannst diese Datei auf anderen Geräten importieren.</p>
            </div>
          </div>
          <button type="button" class="settings-action-btn" id="export-data-btn">
            <span class="settings-action-btn__icon">💾</span>
            <span class="settings-action-btn__text">Daten als JSON exportieren</span>
          </button>
        </div>
      `;

      document
        .getElementById("export-data-btn")
        ?.addEventListener("click", () => {
          try {
            const exportData = {
              version: "1.0",
              exportedAt: new Date().toISOString(),
              settings: state?.settings || {},
              favorites: state?.favorites || [],
              homeLocation: state?.homeLocation || null,
              units: state?.units || {},
              theme: localStorage.getItem("wetter_theme") || "system",
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `wetter-app-backup-${
              new Date().toISOString().split("T")[0]
            }.json`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error("Export fehlgeschlagen:", e);
          }
        });
    }

    function renderImportSheet(state) {
      const container = document.getElementById("settings-import-body");
      if (!container) return;
      container.innerHTML = `
        <div class="settings-sheet-content">
          <div class="settings-info-card">
            <span class="settings-info-card__icon">📥</span>
            <div class="settings-info-card__content">
              <p class="settings-info-card__title">Daten importieren</p>
              <p class="settings-info-card__text">Importiere eine zuvor exportierte JSON-Datei, um deine Einstellungen wiederherzustellen.</p>
            </div>
          </div>
          <label class="settings-file-input">
            <input type="file" accept=".json" id="import-file-input" hidden />
            <span class="settings-action-btn">
              <span class="settings-action-btn__icon">📁</span>
              <span class="settings-action-btn__text">JSON-Datei auswählen</span>
            </span>
          </label>
          <div id="import-status" class="settings-import-status"></div>
        </div>
      `;

      document
        .getElementById("import-file-input")
        ?.addEventListener("change", (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const statusEl = document.getElementById("import-status");
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              if (data.settings) {
                Object.assign(state.settings || {}, data.settings);
              }
              if (data.favorites) {
                state.favorites = data.favorites;
              }
              if (data.homeLocation) {
                state.homeLocation = data.homeLocation;
              }
              if (data.units) {
                state.units = data.units;
                localStorage.setItem(
                  "wetter_units",
                  JSON.stringify(data.units)
                );
              }
              if (data.theme) {
                localStorage.setItem("wetter_theme", data.theme);
              }
              if (statusEl) {
                statusEl.innerHTML =
                  '<span class="settings-import-success">✓ Import erfolgreich! Bitte lade die Seite neu.</span>';
              }
            } catch (err) {
              console.error("Import fehlgeschlagen:", err);
              if (statusEl) {
                statusEl.innerHTML =
                  '<span class="settings-import-error">✗ Ungültige Datei</span>';
              }
            }
          };
          reader.readAsText(file);
        });
    }

    function renderDiscordSheet() {
      const container = document.getElementById("settings-discord-body");
      if (!container) return;
      container.innerHTML = `
        <div class="settings-sheet-content">
          <div class="settings-discord-header">
            <span class="settings-discord-logo">🎮</span>
            <h3 class="settings-discord-title">Discord Community</h3>
          </div>
          <p class="settings-discord-text">Werde Teil unserer Discord-Community! Tausche dich mit anderen Wetter-Enthusiasten aus, erhalte Hilfe und bleibe über neue Features informiert.</p>
          <a href="https://discord.gg/weathermaster" target="_blank" rel="noopener noreferrer" class="settings-discord-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" class="settings-discord-btn__icon"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            <span>Discord beitreten</span>
          </a>
        </div>
      `;
    }

    if (renderMap[sheetId]) {
      try {
        renderMap[sheetId]();
      } catch (e) {
        console.warn(`[ModalController] Render failed for ${sheetId}:`, e);
      }
    }
  }

  function resolveSheetId(idOrMetric) {
    if (!idOrMetric) return null;
    if (idOrMetric.startsWith("sheet-")) return idOrMetric;
    if (idOrMetric.startsWith("metric-")) {
      return `sheet-${idOrMetric}`;
    }

    const metricMapping = {
      wind: "sheet-metric-wind",
      precipitation: "sheet-metric-precipitation",
      uv: "sheet-metric-uv",
      visibility: "sheet-metric-visibility",
      aqi: "sheet-aqi",
      "temperature-trend": "sheet-temperature-trend",
      "sun-cloud": "sheet-sun-cloud",
      "map-layers": "sheet-map-layers",
    };

    return metricMapping[idOrMetric] || idOrMetric;
  }

  function openSheet(idOrMetric) {
    const overlay = document.getElementById("bottom-sheet-overlay");
    const resolvedId = resolveSheetId(idOrMetric);
    const sheet = resolvedId && document.getElementById(resolvedId);
    if (!overlay || !sheet) return;

    // Render Sheet content vor dem Öffnen
    renderSheetContent(resolvedId);

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    sheet.classList.add("bottom-sheet--visible");
    activeSheetId = resolvedId;
  }

  function closeSheet() {
    const overlay = document.getElementById("bottom-sheet-overlay");
    if (!overlay) return;
    const activeSheet = activeSheetId && document.getElementById(activeSheetId);
    if (activeSheet) {
      activeSheet.classList.remove("bottom-sheet--visible");
    }
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    activeSheetId = null;
  }

  function initModalController() {
    const overlay = document.getElementById("bottom-sheet-overlay");
    if (!overlay) return;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeSheet();
      }
      // Handle close buttons inside sheets
      if (event.target.closest("[data-close-sheet]")) {
        closeSheet();
      }
    });

    document.addEventListener("click", (event) => {
      const trigger =
        event.target.closest("[data-bottom-sheet]") ||
        event.target.closest("[data-bottom-sheet-target]");
      if (!trigger) return;

      const targetIdAttr =
        trigger.getAttribute("data-bottom-sheet") ||
        trigger.getAttribute("data-bottom-sheet-target");
      if (!targetIdAttr) return;

      openSheet(targetIdAttr);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSheet();
      }
    });
  }

  function open(metricIdOrSheetId) {
    openSheet(metricIdOrSheetId);
  }

  global.ModalController = {
    openSheet,
    open,
    closeSheet,
    initModalController,
  };
})(window);
