(function (global) {
  function normalizeSeries(raw, options) {
    const timeKey = options.timeKey || "time";
    const valueKey = options.valueKey || "value";

    return (raw || [])
      .map((entry) => {
        const t = entry[timeKey];
        const v = entry[valueKey];
        if (v == null || Number.isNaN(Number(v))) return null;
        return {
          timeLabel: entry.timeLabel || t || "",
          value: Number(v),
        };
      })
      .filter(Boolean);
  }

  function buildBarsHtml(series, options) {
    if (!series.length) return "";
    const max = Math.max(...series.map((s) => s.value || 0)) || 1;

    return series
      .map((s) => {
        const ratio = Math.max(0, s.value) / max;
        const height = 15 + ratio * 85; // 15-100%
        const labelFormatter =
          options.labelFormatter || ((v) => `${Math.round(v)}%`);
        const valueLabel = labelFormatter(s.value);
        return `
          <div class="mini-bar">
            <div class="mini-bar__fill" style="height:${height}%"></div>
            <span class="mini-bar__value">${valueLabel}</span>
            <span class="mini-bar__time">${s.timeLabel}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderBarChart(target, raw, options) {
    if (!target) return;
    const series = normalizeSeries(raw, options || {});
    const classes = options.className || "mini-bar-chart";
    const bars = buildBarsHtml(series, options || {});
    target.innerHTML = `<div class="${classes}">${bars}</div>`;
  }

  global.graphRenderer = {
    renderBarChart,
  };
})(window);
