(function (global) {
  function renderUVDetailSheet(appState) {
    const sheet = document.getElementById("sheet-uv");
    if (!sheet) return;

    const hourly = appState.hourly || [];
    const timeline = hourly.slice(0, 24);

    const items = timeline
      .map((h) => {
        const timeLabel = h.timeLabel || h.time || "";
        const uv = h.uvIndex != null ? h.uvIndex : h.uv || 0;
        return `
          <div class="uv-row">
            <span class="uv-row__time">${timeLabel}</span>
            <span class="uv-row__value">UV ${uv.toFixed(1)}</span>
          </div>
        `;
      })
      .join("");

    sheet.querySelector(".bottom-sheet__body").innerHTML = `
      <p class="bottom-sheet__subtitle">
        Tagesverlauf des UV-Index – meide die hohen Werte zur Mittagszeit.
      </p>
      <div class="uv-timeline">${items}</div>
      <ul class="uv-tips">
        <li>Ab UV 3: Schatten suchen.</li>
        <li>Ab UV 5: Sonnencreme SPF 30+ und Hut empfohlen.</li>
      </ul>
    `;
  }

  global.UVDetailSheet = { renderUVDetailSheet };
})(window);
