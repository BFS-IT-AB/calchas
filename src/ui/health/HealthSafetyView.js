(function (global) {
  function buildScoreBar(score) {
    const clamped = Math.max(0, Math.min(100, score || 0));
    return `
      <div class="score-bar">
        <div class="score-bar__fill" style="width:${clamped}%"></div>
      </div>
    `;
  }

  function labelForScore(score) {
    if (score >= 80) return "sehr gut";
    if (score >= 60) return "gut";
    if (score >= 40) return "ok";
    if (score >= 20) return "mäßig";
    return "kritisch";
  }

  function render(appState, healthState) {
    // Try multiple container selectors for compatibility
    const container =
      document.getElementById("health-view-container") ||
      document.querySelector('[data-view="health"] .app-view__content') ||
      document.querySelector('[data-view="health"]');
    if (!container) {
      console.warn("[HealthSafetyView] Container not found");
      return;
    }

    const state = healthState || {};
    const timeline = state.outdoorScoreTimeline || [];
    const sliced = timeline.slice(0, 12);

    const cardsHtml = `
      <section class="health-layout">
        <div class="health-layout__left">
          <article class="health-card">
            <h2>Regenschirm</h2>
            <p>${state.umbrellaLabel || "Regenschirm: –"}</p>
          </article>
          <article class="health-card">
            <h2>Draußen</h2>
            <p>${state.outdoorLabel || "Draußen: –"}</p>
          </article>
          <article class="health-card">
            <h2>Kleidung</h2>
            <p>${state.clothingLabel || "Kleidung: –"}</p>
          </article>
          <article class="health-card">
            <h2>Fahrsicherheit</h2>
            <p>${state.drivingLabel || "Fahrsicherheit: –"}</p>
          </article>
          <article class="health-card">
            <h2>Hitze</h2>
            <p>${state.heatLabel || "Hitzerisiko: –"}</p>
          </article>
          <article class="health-card">
            <h2>UV-Schutz</h2>
            <p>${state.uvProtectionLabel || "UV-Schutz: –"}</p>
          </article>
        </div>
        <div class="health-layout__right">
          <section class="health-chart-card">
            <header>
              <h2>Draußen-Score</h2>
              <p>Wie angenehm ist es in den nächsten Stunden?</p>
            </header>
            <div class="health-chart-barlist">
              ${
                sliced.length > 0
                  ? sliced
                      .map((slot) => {
                        const time = slot.time || "";
                        const score = slot.score || 0;
                        return `
                      <div class="health-chart-row">
                        <span class="health-chart-row__time">${time}</span>
                        <span class="health-chart-row__score">${score}</span>
                        ${buildScoreBar(score)}
                        <span class="health-chart-row__label">${labelForScore(
                          score
                        )}</span>
                      </div>
                    `;
                      })
                      .join("")
                  : '<p class="health-empty-notice">Stundenweise Daten laden...</p>'
              }
            </div>
          </section>
        </div>
      </section>
    `;

    container.innerHTML = cardsHtml;
  }

  global.HealthSafetyView = { render };
})(window);
