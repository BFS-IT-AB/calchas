(function (global) {
  function renderPrecipitationDetailSheet(appState) {
    const sheet = document.getElementById("sheet-precipitation");
    if (!sheet) return;

    const body = sheet.querySelector(".bottom-sheet__body");
    if (!body) return;

    const hourly = appState.hourly || [];
    const timeline = hourly.slice(0, 24);

    const chartContainerId = "precip-chart";

    body.innerHTML = `
      <p class="bottom-sheet__subtitle">
        Überblick der Niederschlagswahrscheinlichkeit und -menge für die nächsten Stunden.
      </p>
      <div id="${chartContainerId}" class="precip-chart"></div>
      <button type="button" class="bottom-sheet__cta" data-nav-target="radar">
        Karten öffnen
      </button>
    `;

    const chartEl = document.getElementById(chartContainerId);
    if (
      chartEl &&
      global.graphRenderer &&
      global.graphRenderer.renderBarChart
    ) {
      const series = timeline.map((h) => ({
        time: h.time,
        timeLabel: h.timeLabel || h.time || "",
        value: h.precipitationProbability || h.precipProb || 0,
      }));

      global.graphRenderer.renderBarChart(chartEl, series, {
        className: "mini-bar-chart mini-bar-chart--precip",
        labelFormatter: (v) => `${Math.round(v)}%`,
      });
    }
  }

  global.PrecipitationDetailSheet = { renderPrecipitationDetailSheet };
})(window);
