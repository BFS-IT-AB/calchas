/**
 * ThemeSelectorSheet.js - Theme-Auswahl
 * Design inspiriert von WeatherMaster App
 */
(function (global) {
  const THEME_OPTIONS = [
    {
      value: "system",
      icon: "🖥️",
      title: "System",
      subtitle: "Folgt dem Gerätemodus",
    },
    {
      value: "light",
      icon: "☀️",
      title: "Hell",
      subtitle: "Helles Layout mit hohem Kontrast",
    },
    {
      value: "dark",
      icon: "🌙",
      title: "Dunkel",
      subtitle: "Dunkles Layout für nachts",
    },
  ];

  function renderThemeSheet(appState) {
    const container = document.getElementById("settings-theme-body");
    if (!container) return;
    const current = appState?.settings?.theme || "system";

    container.innerHTML = `
      <div class="theme-settings">
        ${THEME_OPTIONS.map((opt) => renderThemeOption(opt, current)).join("")}
      </div>
    `;

    container.querySelectorAll("[data-theme-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.getAttribute("data-theme-value");
        applyTheme(appState, value);
        renderThemeSheet(appState);
      });
    });
  }

  function renderThemeOption(option, current) {
    const isActive = current === option.value;
    const activeClass = isActive ? " theme-option--active" : "";

    return `
      <button
        type="button"
        class="theme-option${activeClass}"
        data-theme-value="${option.value}"
      >
        <span class="theme-option__icon">${option.icon}</span>
        <span class="theme-option__content">
          <span class="theme-option__title">${option.title}</span>
          <span class="theme-option__subtitle">${option.subtitle}</span>
        </span>
        ${isActive ? '<span class="theme-option__check">✓</span>' : ""}
      </button>
    `;
  }

  function applyTheme(appState, value) {
    if (!appState.settings) appState.settings = {};
    appState.settings.theme = value;
    try {
      localStorage.setItem("wetter_theme", value);
    } catch (e) {}

    // Legacy boolean flag for rest of app
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = value === "dark" || (value === "system" && prefersDark);
    if (typeof appState.isDarkMode !== "undefined") {
      appState.isDarkMode = isDark;
    }
    try {
      localStorage.setItem("wetter_dark_mode", String(isDark));
    } catch (e) {}

    const root = document.documentElement;
    const body = document.body;

    // Entferne alte Theme-Klassen
    body.classList.remove("dark-mode", "light-mode");

    if (value === "system") {
      root.removeAttribute("data-theme");
      if (isDark) {
        body.classList.add("dark-mode");
      } else {
        body.classList.add("light-mode");
      }
    } else if (value === "dark") {
      root.setAttribute("data-theme", "dark");
      body.classList.add("dark-mode");
    } else if (value === "light") {
      root.setAttribute("data-theme", "light");
      body.classList.add("light-mode");
    }
  }

  global.ThemeSelectorSheet = { renderThemeSheet };
})(window);
