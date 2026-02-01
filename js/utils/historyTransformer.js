export class HistoryTransformer {
  static aggregateByDay(data) {
    if (!data || data.length === 0) return this._emptyAggregation();

    const dates = data.map((d) => d.date);
    const temps = {
      min: data.map((d) => d.temp_min),
      max: data.map((d) => d.temp_max),
      avg: data.map((d) => (d.temp_min + d.temp_max) / 2),
    };
    const precips = data.map((d) => d.precip || 0);
    const winds = data.map((d) => d.wind_speed || 0);
    const humidities = data.map((d) => d.humidity || 0);

    return { dates, temps, precips, winds, humidities, bucketSize: "day" };
  }

  static aggregateByWeek(data) {
    if (!data || data.length === 0) return this._emptyAggregation();

    const weeks = {};

    data.forEach((point) => {
      const date = new Date(point.date);
      const year = date.getFullYear();
      const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
      const key = `${year}-W${week}`;

      if (!weeks[key]) {
        weeks[key] = {
          temps: [],
          precips: [],
          winds: [],
          humidities: [],
          dates: [],
        };
      }

      weeks[key].temps.push(point.temp_min, point.temp_max);
      weeks[key].precips.push(point.precip || 0);
      weeks[key].winds.push(point.wind_speed || 0);
      weeks[key].humidities.push(point.humidity || 0);
      weeks[key].dates.push(point.date);
    });

    const dates = Object.keys(weeks);
    const temps = {
      min: dates.map((week) => Math.min(...weeks[week].temps)),
      max: dates.map((week) => Math.max(...weeks[week].temps)),
      avg: dates.map(
        (week) =>
          weeks[week].temps.reduce((a, b) => a + b, 0) /
          weeks[week].temps.length
      ),
    };
    const precips = dates.map((week) =>
      weeks[week].precips.reduce((a, b) => a + b, 0)
    );
    const winds = dates.map(
      (week) =>
        weeks[week].winds.reduce((a, b) => a + b, 0) / weeks[week].winds.length
    );
    const humidities = dates.map(
      (week) =>
        weeks[week].humidities.reduce((a, b) => a + b, 0) /
        weeks[week].humidities.length
    );

    return { dates, temps, precips, winds, humidities, bucketSize: "week" };
  }

  static aggregateByMonth(data) {
    if (!data || data.length === 0) return this._emptyAggregation();

    const months = {};

    data.forEach((point) => {
      const date = new Date(point.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      if (!months[key]) {
        months[key] = {
          temps: [],
          precips: [],
          winds: [],
          humidities: [],
          dates: [],
        };
      }

      months[key].temps.push(point.temp_min, point.temp_max);
      months[key].precips.push(point.precip || 0);
      months[key].winds.push(point.wind_speed || 0);
      months[key].humidities.push(point.humidity || 0);
      months[key].dates.push(point.date);
    });

    const dates = Object.keys(months);
    const temps = {
      min: dates.map((month) => Math.min(...months[month].temps)),
      max: dates.map((month) => Math.max(...months[month].temps)),
      avg: dates.map(
        (month) =>
          months[month].temps.reduce((a, b) => a + b, 0) /
          months[month].temps.length
      ),
    };
    const precips = dates.map((month) =>
      months[month].precips.reduce((a, b) => a + b, 0)
    );
    const winds = dates.map(
      (month) =>
        months[month].winds.reduce((a, b) => a + b, 0) /
        months[month].winds.length
    );
    const humidities = dates.map(
      (month) =>
        months[month].humidities.reduce((a, b) => a + b, 0) /
        months[month].humidities.length
    );

    return { dates, temps, precips, winds, humidities, bucketSize: "month" };
  }

  static calculateInsights(data) {
    if (!data || data.length === 0) return this._emptyInsights();

    const temps = data.map((d) => (d.temp_min + d.temp_max) / 2);
    const precips = data.map((d) => d.precip || 0);
    const winds = data.map((d) => d.wind_speed || 0);
    const tempMaxes = data.map((d) => d.temp_max);

    const warmestIdx = tempMaxes.indexOf(Math.max(...tempMaxes));
    const coldestIdx = data
      .map((d) => d.temp_min)
      .indexOf(Math.min(...data.map((d) => d.temp_min)));
    const wettestIdx = precips.indexOf(Math.max(...precips));
    const windiestIdx = winds.indexOf(Math.max(...winds));

    const mid = Math.floor(data.length / 2) || 1;
    const firstHalfAvg = temps.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalfAvg =
      temps.slice(mid).reduce((a, b) => a + b, 0) / (data.length - mid || 1);
    const trend = secondHalfAvg > firstHalfAvg ? "warming" : "cooling";

    return {
      warmestDay: {
        date: data[warmestIdx].date,
        temp: data[warmestIdx].temp_max,
      },
      coldestDay: {
        date: data[coldestIdx].date,
        temp: data[coldestIdx].temp_min,
      },
      wettestDay: {
        date: data[wettestIdx].date,
        precip: data[wettestIdx].precip,
      },
      windiestDay: {
        date: data[windiestIdx].date,
        wind: data[windiestIdx].wind_speed,
      },
      avgTemp: (temps.reduce((a, b) => a + b, 0) / (temps.length || 1)).toFixed(
        1
      ),
      avgPrecip: (
        precips.reduce((a, b) => a + b, 0) / (precips.length || 1)
      ).toFixed(1),
      trend,
      totalDays: data.length,
    };
  }

  static _emptyAggregation() {
    return {
      dates: [],
      temps: { min: [], max: [], avg: [] },
      precips: [],
      winds: [],
      humidities: [],
      bucketSize: "day",
    };
  }

  static _emptyInsights() {
    return {
      warmestDay: { date: null, temp: null },
      coldestDay: { date: null, temp: null },
      wettestDay: { date: null, precip: null },
      windiestDay: { date: null, wind: null },
      avgTemp: 0,
      avgPrecip: 0,
      trend: "stable",
      totalDays: 0,
    };
  }
}

export default HistoryTransformer;
