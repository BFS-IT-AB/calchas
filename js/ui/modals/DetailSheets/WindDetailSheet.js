(function (global) {
  function renderWindDetailSheet(appState) {
    const sheet = document.getElementById("sheet-wind");
    if (!sheet) return;

    const hourly = appState.hourly || [];
    const timeline = hourly.slice(0, 24);
    const current = appState.current || {};

    const items = timeline
      .map((h) => {
        const timeLabel = h.timeLabel || h.time || "";
        const speed = h.windSpeed || 0;
        const gusts = h.windGusts || h.windGust || null;
        return `
          <div class="wind-row">
            <span class="wind-row__time">${timeLabel}</span>
            <span class="wind-row__speed">${Math.round(speed)} km/h</span>
            <span class="wind-row__gusts">${
              gusts != null ? `Böen bis ${Math.round(gusts)} km/h` : ""
            }</span>
          </div>
        `;
      })
      .join("");

    sheet.querySelector(".bottom-sheet__body").innerHTML = `
      <p class="bottom-sheet__subtitle">
        Aktueller Wind ${Math.round(current.windSpeed || 0)} km/h, Böen bis ${
      current.windGusts != null ? Math.round(current.windGusts) : "—"
    } km/h.
      </p>
      <div class="wind-compass" aria-hidden="true"></div>
      <div class="wind-timeline">${items}</div>
    `;
  }

  global.WindDetailSheet = { renderWindDetailSheet };
})(window);
