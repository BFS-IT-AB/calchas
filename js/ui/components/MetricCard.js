(function (global) {
  function createMetricCard(props) {
    const { id, icon, label, value, subtitle, onClick } = props;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "metric-card";
    button.dataset.metricId = id;

    button.innerHTML = `
      <div class="metric-card__icon">${icon || ""}</div>
      <div class="metric-card__content">
        <span class="metric-card__label">${label}</span>
        <span class="metric-card__value">${value}</span>
        ${
          subtitle
            ? `<span class="metric-card__subtitle">${subtitle}</span>`
            : ""
        }
      </div>
      <span class="metric-card__ripple" aria-hidden="true"></span>
    `;

    if (typeof onClick === "function") {
      button.addEventListener("click", (event) => {
        const ripple = button.querySelector(".metric-card__ripple");
        if (ripple) {
          ripple.classList.remove("metric-card__ripple--active");
          // force reflow to restart animation
          void ripple.offsetWidth;
          ripple.classList.add("metric-card__ripple--active");
        }
        onClick(event, id);
      });
    }

    return button;
  }

  function renderMetricCards(container, cards) {
    if (!container) return;
    container.innerHTML = "";
    cards.forEach((card) => {
      container.appendChild(createMetricCard(card));
    });
  }

  global.MetricCard = {
    renderMetricCards,
  };
})(window);
