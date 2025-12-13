(function (global) {
  /**
   * Advanced Outdoor Score Calculator
   * Combines multiple environmental factors into a comprehensive score
   */
  function calculateAdvancedOutdoorScore(params) {
    const {
      temp = 20,
      feels = temp,
      wind = 0,
      precipProb = 0,
      humidity = 50,
      uvIndex = 0,
      cloudCover = 50,
      visibility = 10,
      pollenLevel = 0, // 0-5 scale
      aqiValue = 0,
    } = params;

    let score = 100;
    const factors = {};

    // 1. Temperature Factor (25% weight)
    // Optimal: 18-24°C, penalties outside this range
    let tempScore = 100;
    if (feels < 5) {
      tempScore = Math.max(0, 100 - (5 - feels) * 8);
    } else if (feels < 10) {
      tempScore = Math.max(30, 100 - (10 - feels) * 6);
    } else if (feels < 18) {
      tempScore = Math.max(60, 100 - (18 - feels) * 5);
    } else if (feels <= 24) {
      tempScore = 100; // Optimal range
    } else if (feels <= 28) {
      tempScore = Math.max(70, 100 - (feels - 24) * 5);
    } else if (feels <= 32) {
      tempScore = Math.max(40, 100 - (feels - 24) * 7);
    } else {
      tempScore = Math.max(10, 100 - (feels - 24) * 10);
    }
    factors.temperature = { score: tempScore, weight: 0.25, value: feels };

    // 2. Wind Factor (15% weight)
    // Optimal: < 15 km/h, light breeze is good
    let windScore = 100;
    if (wind <= 10) {
      windScore = 100;
    } else if (wind <= 20) {
      windScore = 90;
    } else if (wind <= 35) {
      windScore = Math.max(50, 100 - (wind - 15) * 2);
    } else if (wind <= 50) {
      windScore = Math.max(20, 70 - (wind - 35) * 2);
    } else {
      windScore = Math.max(0, 30 - (wind - 50));
    }
    factors.wind = { score: windScore, weight: 0.15, value: wind };

    // 3. Precipitation Probability (20% weight)
    let precipScore = 100;
    if (precipProb <= 10) {
      precipScore = 100;
    } else if (precipProb <= 30) {
      precipScore = 90;
    } else if (precipProb <= 50) {
      precipScore = 70;
    } else if (precipProb <= 70) {
      precipScore = 45;
    } else if (precipProb <= 85) {
      precipScore = 25;
    } else {
      precipScore = 10;
    }
    factors.precipitation = {
      score: precipScore,
      weight: 0.2,
      value: precipProb,
    };

    // 4. UV Index (10% weight)
    // High UV is actually bad for outdoor activities without protection
    let uvScore = 100;
    if (uvIndex <= 2) {
      uvScore = 100;
    } else if (uvIndex <= 5) {
      uvScore = 85;
    } else if (uvIndex <= 7) {
      uvScore = 65;
    } else if (uvIndex <= 10) {
      uvScore = 40;
    } else {
      uvScore = 20;
    }
    factors.uv = { score: uvScore, weight: 0.1, value: uvIndex };

    // 5. Humidity Factor (10% weight)
    // Optimal: 40-60%, too low or too high is uncomfortable
    let humidityScore = 100;
    if (humidity >= 40 && humidity <= 60) {
      humidityScore = 100;
    } else if (humidity < 40) {
      humidityScore = Math.max(60, 100 - (40 - humidity) * 1.5);
    } else if (humidity <= 75) {
      humidityScore = Math.max(60, 100 - (humidity - 60) * 2);
    } else if (humidity <= 90) {
      humidityScore = Math.max(30, 70 - (humidity - 75) * 2);
    } else {
      humidityScore = Math.max(10, 40 - (humidity - 90));
    }
    factors.humidity = { score: humidityScore, weight: 0.1, value: humidity };

    // 6. Air Quality (10% weight)
    let aqiScore = 100;
    if (aqiValue <= 20) {
      aqiScore = 100;
    } else if (aqiValue <= 40) {
      aqiScore = 85;
    } else if (aqiValue <= 60) {
      aqiScore = 65;
    } else if (aqiValue <= 80) {
      aqiScore = 45;
    } else if (aqiValue <= 100) {
      aqiScore = 25;
    } else {
      aqiScore = Math.max(0, 25 - (aqiValue - 100) * 0.5);
    }
    factors.airQuality = { score: aqiScore, weight: 0.1, value: aqiValue };

    // 7. Pollen Factor (5% weight) - seasonal importance
    let pollenScore = 100;
    if (pollenLevel <= 1) {
      pollenScore = 100;
    } else if (pollenLevel <= 2) {
      pollenScore = 80;
    } else if (pollenLevel <= 3) {
      pollenScore = 55;
    } else if (pollenLevel <= 4) {
      pollenScore = 30;
    } else {
      pollenScore = 10;
    }
    factors.pollen = { score: pollenScore, weight: 0.05, value: pollenLevel };

    // 8. Visibility Factor (5% weight)
    let visibilityScore = 100;
    if (visibility >= 10) {
      visibilityScore = 100;
    } else if (visibility >= 5) {
      visibilityScore = 85;
    } else if (visibility >= 2) {
      visibilityScore = 60;
    } else if (visibility >= 1) {
      visibilityScore = 35;
    } else {
      visibilityScore = 15;
    }
    factors.visibility = {
      score: visibilityScore,
      weight: 0.05,
      value: visibility,
    };

    // Calculate weighted score
    score = Object.values(factors).reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    );
    score = Math.max(0, Math.min(100, Math.round(score)));

    return { score, factors };
  }

  function healthSafetyEngine(appState) {
    const current = appState.current || {};
    const daily = (appState.daily && appState.daily[0]) || {};
    const aqi = appState.aqi || {};
    const pollen = appState.pollen || {};

    const temp = current.temperature;
    const feels = current.apparentTemperature || current.feelsLike || temp;
    const precipProb = current.precipProb || daily.precipProbMax || 0;
    const wind = current.windSpeed || 0;
    const humidity = current.humidity || 0;
    const hourly = appState.hourly || [];
    const uvIndex = current.uvIndex || daily.uvIndexMax || 0;
    const visibility = current.visibility || 10;
    const cloudCover = current.cloudCover || 50;
    const aqiValue = aqi.europeanAqi || aqi.usAqi || 0;

    // Calculate average pollen level (0-5 scale)
    const pollenLevel = Math.round(
      ((pollen.trees || 1) + (pollen.grass || 1) + (pollen.weeds || 1)) / 3
    );

    let umbrellaLabel = "Regenschirm: nicht notwendig";
    if (precipProb >= 60) umbrellaLabel = "Regenschirm: empfohlen";
    if (precipProb >= 85) umbrellaLabel = "Regenschirm: dringend empfohlen";

    let outdoorLabel = "Draußen: gut";
    if (feels <= -5 || feels >= 32 || wind >= 50)
      outdoorLabel = "Draußen: kritisch";
    else if (feels <= 0 || feels >= 28 || wind >= 35)
      outdoorLabel = "Draußen: mäßig";

    let clothingLabel = "Kleidung: keine Jacke";
    if (feels <= 4) clothingLabel = "Kleidung: dicke Jacke";
    else if (feels <= 12) clothingLabel = "Kleidung: leichte Jacke";
    if (precipProb >= 70) clothingLabel = "Kleidung: Regenmantel";

    let drivingLabel = "Fahrsicherheit: gut";
    if (wind >= 50 || precipProb >= 80 || humidity >= 95) {
      drivingLabel = "Fahrsicherheit: kritisch";
    } else if (wind >= 35 || precipProb >= 60) {
      drivingLabel = "Fahrsicherheit: vorsichtig";
    }

    let heatLabel = "Hitzerisiko: gering";
    if (feels >= 35) heatLabel = "Hitzerisiko: hoch";
    else if (feels >= 30) heatLabel = "Hitzerisiko: mittel";

    let uvProtectionLabel = "UV-Schutz: normal";
    const maxUv = hourly.reduce(
      (max, h) => Math.max(max, h.uvIndex != null ? h.uvIndex : h.uv || 0),
      0
    );
    if (maxUv >= 8) uvProtectionLabel = "UV-Schutz: sehr hoch";
    else if (maxUv >= 5) uvProtectionLabel = "UV-Schutz: erhöht";

    // AQI Label basierend auf echten Daten
    let aqiLabel = null;
    const aqiLabelRaw = aqi.label || null;

    if (aqiValue != null && aqiLabelRaw) {
      const labelMap = {
        Good: "gut",
        Fair: "akzeptabel",
        Moderate: "mäßig",
        Poor: "schlecht",
        "Very Poor": "sehr schlecht",
        "Extremely Poor": "extrem schlecht",
        "Unhealthy for Sensitive Groups": "kritisch für empfindliche Gruppen",
        Unhealthy: "ungesund",
        "Very Unhealthy": "sehr ungesund",
        Hazardous: "gefährlich",
      };
      const translated = labelMap[aqiLabelRaw] || aqiLabelRaw.toLowerCase();
      aqiLabel = `Die Luftqualität ist ${translated} (AQI ${Math.round(
        aqiValue
      )}).`;
    } else if (aqiValue != null) {
      let quality = "gut";
      if (aqiValue > 100) quality = "schlecht";
      else if (aqiValue > 50) quality = "mäßig";
      else if (aqiValue > 25) quality = "akzeptabel";
      aqiLabel = `Die Luftqualität ist ${quality} (AQI ${Math.round(
        aqiValue
      )}).`;
    }

    // Generate advanced outdoor score timeline with all factors
    const outdoorScoreTimeline = hourly.slice(0, 24).map((h) => {
      const hourTemp = h.temperature != null ? h.temperature : temp;
      const hourFeels =
        h.apparentTemperature != null
          ? h.apparentTemperature
          : h.feelsLike != null
          ? h.feelsLike
          : feels;
      const hourWind = h.windSpeed != null ? h.windSpeed : wind;
      const hourPrecipProb =
        h.precipitationProbability != null
          ? h.precipitationProbability
          : h.precipProb != null
          ? h.precipProb
          : precipProb;
      const hourHumidity = h.humidity != null ? h.humidity : humidity;
      const hourUv =
        h.uvIndex != null ? h.uvIndex : h.uv != null ? h.uv : uvIndex;
      const hourVisibility = h.visibility != null ? h.visibility : visibility;
      const hourCloudCover = h.cloudCover != null ? h.cloudCover : cloudCover;

      const result = calculateAdvancedOutdoorScore({
        temp: hourTemp,
        feels: hourFeels,
        wind: hourWind,
        precipProb: hourPrecipProb,
        humidity: hourHumidity,
        uvIndex: hourUv,
        cloudCover: hourCloudCover,
        visibility: hourVisibility,
        pollenLevel,
        aqiValue,
      });

      return {
        time: h.time || h.timeLabel,
        score: result.score,
        factors: result.factors,
      };
    });

    // Calculate current score with factors
    const currentScoreResult = calculateAdvancedOutdoorScore({
      temp,
      feels,
      wind,
      precipProb,
      humidity,
      uvIndex,
      cloudCover,
      visibility,
      pollenLevel,
      aqiValue,
    });

    return {
      umbrellaLabel,
      outdoorLabel,
      clothingLabel,
      drivingLabel,
      heatLabel,
      uvProtectionLabel,
      aqiLabel,
      outdoorScoreTimeline,
      currentOutdoorScore: currentScoreResult.score,
      currentScoreFactors: currentScoreResult.factors,
      raw: {
        temp,
        feels,
        precipProb,
        wind,
        humidity,
        uvIndex,
        pollenLevel,
        aqiValue,
        visibility,
      },
    };
  }

  global.healthSafetyEngine = healthSafetyEngine;
  global.calculateAdvancedOutdoorScore = calculateAdvancedOutdoorScore;
})(window);
