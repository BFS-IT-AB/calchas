/**
 * AboutSheet.js - Über die App
 * Design inspiriert von WeatherMaster App (Screenshot 4)
 */
(function (global) {
  // SVG Icons
  const ICONS = {
    license: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>`,
    code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
    bug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-2.93-7.07l-2.83 2.83m-4.48 4.48l-2.83 2.83m0-10.14l2.83 2.83m4.48 4.48l2.83 2.83"/></svg>`,
    apps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    thirdparty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`,
    terms: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>`,
    privacy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
  };

  function renderAboutSheet() {
    const container = document.getElementById("settings-about-body");
    if (!container) {
      console.warn("[AboutSheet] Container nicht gefunden");
      return;
    }

    const version = global.APP_VERSION || "2.6.6";

    container.innerHTML = `
      <div class="about-settings">
        <!-- App Header -->
        <div class="about-header">
          <div class="about-header__icon">
            <img src="assets/google-weather-icons/weather/sunny.svg" alt="Calchas" onerror="this.textContent='☁️'"/>
          </div>
          <div class="about-header__info">
            <h2 class="about-header__name">Calchas</h2>
            <div class="about-header__badges">
              <span class="about-badge about-badge--version">v${version}</span>
              <button class="about-badge about-badge--changelog" type="button" data-action="changelog">Was ist neu</button>
            </div>
          </div>
        </div>

        <!-- Main Links -->
        <div class="about-links">
          ${renderAboutRow("license", "Lizenzen", "GNU GPL-3.0", "#5c6bc0")}
          ${renderAboutRow(
            "email",
            "E-Mail",
            "pranshul.devmain@gmail.com",
            "#5c6bc0"
          )}
          ${renderAboutRow("code", "Quellcode", "Auf GitHub", "#5c6bc0")}
          ${renderAboutRow("bug", "Problem melden", "Auf GitHub", "#5c6bc0")}
          ${renderAboutRow("apps", "Weitere Apps", "Ansicht", "#5c6bc0")}
          ${renderAboutRow(
            "heart",
            "Contributors",
            "Übersetzer & Helfer",
            "#5c6bc0"
          )}
        </div>

        <!-- Legal Section -->
        <div class="about-legal">
          ${renderAboutRow(
            "thirdparty",
            "Lizenzen von Drittanbietern",
            null,
            "#5c6bc0"
          )}
          <a href="legal/terms.html" target="_blank" class="about-row">
            <span class="about-row__icon" style="background-color: #5c6bc0">${
              ICONS.terms
            }</span>
            <span class="about-row__content">
              <span class="about-row__title">Nutzungsbedingungen</span>
            </span>
          </a>
          <a href="legal/privacy.html" target="_blank" class="about-row">
            <span class="about-row__icon" style="background-color: #5c6bc0">${
              ICONS.privacy
            }</span>
            <span class="about-row__content">
              <span class="about-row__title">Datenschutzerklärung</span>
            </span>
          </a>
        </div>
      </div>
    `;

    // Changelog button handler
    container
      .querySelector('[data-action="changelog"]')
      ?.addEventListener("click", showChangelog);
  }

  function renderAboutRow(iconKey, title, subtitle, color) {
    const icon = ICONS[iconKey] || "";
    const subtitleHtml = subtitle
      ? `<span class="about-row__subtitle">${subtitle}</span>`
      : "";

    return `
      <button class="about-row" type="button">
        <span class="about-row__icon" style="background-color: ${color}">${icon}</span>
        <span class="about-row__content">
          <span class="about-row__title">${title}</span>
          ${subtitleHtml}
        </span>
      </button>
    `;
  }

  function showChangelog() {
    const existingModal = document.getElementById("changelog-modal");
    if (existingModal) existingModal.remove();

    const version = global.APP_VERSION || "2.6.6";

    const modal = document.createElement("div");
    modal.id = "changelog-modal";
    modal.className = "changelog-modal";
    modal.innerHTML = `
      <div class="changelog-backdrop"></div>
      <div class="changelog-content">
        <div class="changelog-header">
          <h3>Neuerungen</h3>
          <button type="button" class="changelog-close">✕</button>
        </div>
        <div class="changelog-body">
          <div class="changelog-version">
            <span class="changelog-badge">v${version}</span>
            <span class="changelog-badge changelog-badge--latest">Latest</span>
          </div>
          <h4>🛠️ Update</h4>
          <ul class="changelog-list">
            <li>🌡️ <strong>Fixed:</strong> Falsche Temperaturwerte korrigiert (#693)</li>
            <li>🌅 <strong>Fixed:</strong> Tageslichtdauer und Zusammenfassung stimmen wieder</li>
            <li>🌧️ <strong>Fixed:</strong> Niederschlagssumme nutzt aktuelle Daten</li>
            <li>☀️ <strong>Fixed:</strong> UV-Index & Windgeschwindigkeiten berichtigt</li>
            <li>🌍 <strong>Updated:</strong> Alle Übersetzungen aktualisiert</li>
            <li>🎨 <strong>Tweaked:</strong> Widget- und UI-Verbesserungen</li>
          </ul>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal
      .querySelector(".changelog-backdrop")
      .addEventListener("click", () => modal.remove());
    modal
      .querySelector(".changelog-close")
      .addEventListener("click", () => modal.remove());
    requestAnimationFrame(() =>
      modal.classList.add("changelog-modal--visible")
    );
  }

  global.AboutSheet = { renderAboutSheet };
})(window);
