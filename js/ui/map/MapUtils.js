(function (global) {
  function getInitialCenter(appState) {
    const coords = appState?.currentCoordinates || appState?.location;
    if (!coords) return [52.52, 13.405]; // Berlin fallback
    const lat = coords.lat ?? coords.latitude ?? 52.52;
    const lon = coords.lon ?? coords.lng ?? coords.longitude ?? 13.405;
    return [lat, lon];
  }

  global.MapUtils = {
    getInitialCenter,
  };
})(window);
