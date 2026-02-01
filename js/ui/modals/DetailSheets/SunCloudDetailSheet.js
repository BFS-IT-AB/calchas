(function (global) {
  function renderSunCloudDetailSheet(appState) {
    const sheet = document.getElementById("sheet-sun-cloud");
    if (!sheet) return;

    const daily = (appState.daily && appState.daily[0]) || {};
    const sunrise = daily.sunriseFormatted || daily.sunrise || "—";
    const sunset = daily.sunsetFormatted || daily.sunset || "—";
    const cloud = daily.cloudCover || daily.cloudiness || null;

    sheet.querySelector(".bottom-sheet__body").innerHTML = `
      <p class="bottom-sheet__subtitle">
        Sonnenbahn und Bewölkung für den heutigen Tag.
      </p>
      <div class="sun-track">
        <div class="sun-track__row">
          <span>Aufgang</span>
          <span>${sunrise}</span>
        </div>
        <div class="sun-track__row">
          <span>Untergang</span>
          <span>${sunset}</span>
        </div>
        <div class="sun-track__row">
          <span>Bewölkung</span>
          <span>${cloud != null ? cloud + "%" : "—"}</span>
        </div>
      </div>
    `;
  }

  global.SunCloudDetailSheet = { renderSunCloudDetailSheet };
})(window);
