(function (global) {
  function renderTemperatureTrendDetailSheet(appState) {
    const sheet = document.getElementById("sheet-temperature-trend");
    if (!sheet) return;

    const hourly = appState.hourly || [];
    const timeline = hourly.slice(0, 24);

    const points = timeline
      .map((h) => {
        const timeLabel = h.timeLabel || h.time || "";
        const temp = h.temperature != null ? h.temperature : null;
        return `
          <div class="temp-point">
            <span class="temp-point__time">${timeLabel}</span>
            <span class="temp-point__value">${
              temp != null ? Math.round(temp) + "°" : "—"
            }</span>
          </div>
        `;
      })
      .join("");

    sheet.querySelector(".bottom-sheet__body").innerHTML = `
      <p class="bottom-sheet__subtitle">
        Temperaturkurve über den Tag – erkenne Höchst- und Tiefstwerte.
      </p>
      <div class="temp-trend">${points}</div>
    `;
  }

  global.TemperatureTrendDetailSheet = { renderTemperatureTrendDetailSheet };
})(window);
