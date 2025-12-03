(function (global) {
  const FROG_BASE_PATH = "assets/froggie/hubui";

  function getTimeOfDay(current) {
    if (!current || typeof current.time !== "string") return "day";
    try {
      const hour = new Date(current.time).getHours();
      if (hour >= 5 && hour < 11) return "morning";
      if (hour >= 11 && hour < 17) return "day";
      if (hour >= 17 && hour < 21) return "sunset";
      return "night";
    } catch (e) {
      return "day";
    }
  }

  function getCondition(current) {
    const code = current && (current.weatherCode ?? current.code);
    if (code == null) return "sunny";

    const rainy = [51, 53, 55, 61, 63, 65, 80, 81, 82];
    const snowy = [71, 73, 75, 77, 85, 86];
    const hazy = [45, 48, 95, 96, 99];

    if (rainy.includes(code)) return "rainy";
    if (snowy.includes(code)) return "snowy";
    if (hazy.includes(code)) return "hazy";
    if (code === 0) return "sunny";
    return "cloudy";
  }

  function buildSceneKey(current) {
    const tod = getTimeOfDay(current);
    const cond = getCondition(current);
    return `mushroom_${tod}_${cond}`;
  }

  function buildBackgroundUrl(sceneKey) {
    return `${FROG_BASE_PATH}/${sceneKey}_bg.webp`;
  }

  function buildRiveUrl(sceneKey) {
    return `${FROG_BASE_PATH}/${sceneKey}_frog.flr`;
  }

  function applyBackground(sceneKey) {
    const pond = document.getElementById("frog-hero-pond");
    if (!pond) return;
    const url = buildBackgroundUrl(sceneKey);
    pond.style.backgroundImage = `url("${url}")`;
    pond.style.backgroundSize = "cover";
    pond.style.backgroundPosition = "center";
  }

  async function initRive(sceneKey) {
    const canvas = document.getElementById("frog-hero-canvas");
    if (!canvas || !global.Rive) return;

    const riveFile = buildRiveUrl(sceneKey);

    try {
      /* eslint-disable no-new */
      new global.Rive({
        src: riveFile,
        canvas,
        autoplay: true,
      });
      /* eslint-enable no-new */
    } catch (e) {
      console.warn("FrogHero Rive konnte nicht initialisiert werden", e);
    }
  }

  function renderFrogHero(current) {
    const sceneKey = buildSceneKey(current || {});
    applyBackground(sceneKey);
    // Rive/Flare animations deferred - the background images already work
    // initRive(sceneKey);
  }

  global.FrogHeroPlayer = {
    renderFrogHero,
  };
})(window);
