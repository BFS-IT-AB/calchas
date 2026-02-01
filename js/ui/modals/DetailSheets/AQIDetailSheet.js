(function (global) {
  function renderAQIDetailSheet(appState) {
    const sheet = document.getElementById("sheet-aqi");
    if (!sheet) return;

    const airQuality = appState.airQuality || {};
    const eu = airQuality.eu || airQuality.aqiEu || null;
    const us = airQuality.us || airQuality.aqiUs || null;
    const mainPollutant = airQuality.mainPollutant || "PM2.5";

    function labelFor(value) {
      if (value == null) return "unbekannt";
      if (value <= 50) return "gut";
      if (value <= 100) return "mäßig";
      if (value <= 150) return "ungesund für empfindliche Gruppen";
      if (value <= 200) return "ungesund";
      return "sehr ungesund";
    }

    sheet.querySelector(".bottom-sheet__body").innerHTML = `
      <p class="bottom-sheet__subtitle">
        Luftqualitätsindex nach EU- und US-Skala mit kurzer Einordnung.
      </p>
      <div class="aqi-grid">
        <div class="aqi-box">
          <h3>EU AQI</h3>
          <p class="aqi-value">${eu != null ? eu : "—"}</p>
          <p class="aqi-label">${labelFor(eu)}</p>
        </div>
        <div class="aqi-box">
          <h3>US AQI</h3>
          <p class="aqi-value">${us != null ? us : "—"}</p>
          <p class="aqi-label">${labelFor(us)}</p>
        </div>
      </div>
      <p class="aqi-main">
        Hauptschadstoff: <strong>${mainPollutant}</strong>
      </p>
    `;
  }

  global.AQIDetailSheet = { renderAQIDetailSheet };
})(window);
