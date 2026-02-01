const path = require("path");

describe("HistoricalChart helpers", () => {
  beforeAll(() => {
    // Ensure global window exists (provided by Jest jsdom environment)
    // Load features module to register HistoricalChart on window
    require(path.resolve(__dirname, "../../js/ui/shared/features.js"));
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"></div>';
  });

  it("keeps only the most recent 30 entries for the chart view", () => {
    const chart = new window.HistoricalChart("chart");
    const start = new Date("2025-01-01T00:00:00Z");
    const entries = Array.from({ length: 40 }, (_, idx) => {
      const ts = new Date(start);
      ts.setDate(ts.getDate() + idx);
      const iso = ts.toISOString().split("T")[0];
      return {
        date: iso,
        label: `Tag ${idx + 1}`,
        max: 10 + idx,
        min: 2 + idx,
        rain: 0.5,
      };
    });

    const breakdown = chart._computeHistoricalBreakdown(entries);
    expect(breakdown.chartEntries).toHaveLength(30);
    expect(breakdown.chartEntries[0].date).toBe("2025-01-11");
    expect(breakdown.chartEntries[29].date).toBe(
      entries[entries.length - 1].date,
    );
  });

  it("aggregates monthly averages and totals", () => {
    const chart = new window.HistoricalChart("chart");
    const january = Array.from({ length: 5 }, (_, idx) => ({
      date: `2025-01-0${idx + 1}`,
      label: `Jan ${idx + 1}`,
      max: 10 + idx,
      min: 2 + idx,
      rain: idx,
    }));
    const february = Array.from({ length: 5 }, (_, idx) => ({
      date: `2025-02-0${idx + 1}`,
      label: `Feb ${idx + 1}`,
      max: 5 + idx,
      min: -1 + idx,
      rain: 0.2,
    }));
    const monthly = chart._aggregateMonthly([...january, ...february]);

    expect(monthly).toHaveLength(2);
    expect(monthly[0].key).toBe("2025-01");
    expect(monthly[0].avgMax).toBeCloseTo(12, 2);
    expect(monthly[0].totalRain).toBeCloseTo(10, 2);
    expect(monthly[1].key).toBe("2025-02");
    expect(monthly[1].avgMin).toBeCloseTo(1, 1);
  });
});
