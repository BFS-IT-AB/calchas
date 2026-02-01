(function (global) {
  function SatelliteLayer(options) {
    this.options = options || {};
    this.id = this.options.id || "satellite";
    this.opacity = 1;
    this.colorScheme = "truecolor";
    this.sourceId = "satellite-source";
    this.layerId = "satellite-layer";
  }

  SatelliteLayer.prototype.onAdd = function (map, timestamp) {
    if (!map || !map.addSource || !map.addLayer) return;

    const color = this.colorScheme === "infrared" ? "3" : "2";
    const initialTs = timestamp || Date.now();
    const timeToken = Math.floor(initialTs / 1000);
    const tileUrl =
      "https://tiles.rainviewer.com/v2/satellite/" +
      timeToken +
      "/256/{z}/{x}/{y}/2/" +
      color +
      ".png";

    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "Satellite data © RainViewer",
      });
    }

    if (!map.getLayer(this.layerId)) {
      map.addLayer({
        id: this.layerId,
        type: "raster",
        source: this.sourceId,
        paint: {
          "raster-opacity": this.opacity,
        },
      });
    }
  };

  SatelliteLayer.prototype.onRemove = function (map) {
    if (!map) return;
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  };

  SatelliteLayer.prototype.onTimelineUpdate = function (timestamp) {
    if (!timestamp || !window.MapContainer || !window.MapContainer.getMap) {
      return;
    }
    const map = window.MapContainer.getMap();
    if (!map || !map.getSource(this.sourceId)) return;
    const color = this.colorScheme === "infrared" ? "3" : "2";
    const timeToken = Math.floor(timestamp / 1000);
    const tileUrl =
      "https://tiles.rainviewer.com/v2/satellite/" +
      timeToken +
      "/256/{z}/{x}/{y}/2/" +
      color +
      ".png";
    map.getSource(this.sourceId).tiles = [tileUrl];
  };

  SatelliteLayer.prototype.render = function (map, timestamp) {};

  SatelliteLayer.prototype.setOpacity = function (opacity) {
    this.opacity = opacity;
  };

  SatelliteLayer.prototype.setColorScheme = function (scheme) {
    this.colorScheme = scheme || "truecolor";
  };

  global.SatelliteLayer = SatelliteLayer;
})(window);
