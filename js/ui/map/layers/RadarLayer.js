(function (global) {
  function RadarLayer(options) {
    this.options = options || {};
    this.id = this.options.id || "radar";
    this.opacity = 1;
    this.colorScheme = "default";
    this.sourceId = "radar-source";
    this.layerId = "radar-layer";
  }

  RadarLayer.prototype.onAdd = function (map, timestamp) {
    if (!map || !map.addSource || !map.addLayer) return;

    const color = this.colorScheme === "classic" ? "3" : "2";
    const initialTs = timestamp || Date.now();
    const timeToken = Math.floor(initialTs / 1000);
    const tileUrl =
      "https://tiles.rainviewer.com/v2/radar/" +
      timeToken +
      "/256/{z}/{x}/{y}/2/" +
      color +
      ".png";

    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "Radar data © RainViewer",
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

  RadarLayer.prototype.onRemove = function (map) {
    if (!map) return;
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  };

  RadarLayer.prototype.onTimelineUpdate = function (timestamp) {
    if (!timestamp || !window.MapContainer || !window.MapContainer.getMap) {
      return;
    }
    const map = window.MapContainer.getMap();
    if (!map || !map.getSource(this.sourceId)) return;
    const color = this.colorScheme === "classic" ? "3" : "2";
    const timeToken = Math.floor(timestamp / 1000);
    const tileUrl =
      "https://tiles.rainviewer.com/v2/radar/" +
      timeToken +
      "/256/{z}/{x}/{y}/2/" +
      color +
      ".png";
    map.getSource(this.sourceId).tiles = [tileUrl];
  };

  RadarLayer.prototype.render = function (map, timestamp) {
    // MapLibre rendert Layer nativ; hier optional Overlays steuern
  };

  RadarLayer.prototype.setOpacity = function (opacity) {
    this.opacity = opacity;
  };

  RadarLayer.prototype.setColorScheme = function (scheme) {
    this.colorScheme = scheme || "default";
  };

  global.RadarLayer = RadarLayer;
})(window);
