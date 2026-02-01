import gridFieldsAPI from "../../../api/gridFields";

(function (global) {
  function WindLayer(options) {
    this.options = options || {};
    this.id = this.options.id || "wind";
    this.opacity = 1;
    this.colorScheme = "default";
    this.sourceId = "wind-source";
    this.layerId = "wind-arrows";
  }

  WindLayer.prototype.buildGeoJSON = function (data) {
    return {
      type: "FeatureCollection",
      features: (data || []).map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.lon, point.lat],
        },
        properties: {
          speed: point.currentSpeed,
          direction: point.currentDirection,
        },
      })),
    };
  };

  WindLayer.prototype.onAdd = async function (map, timestamp) {
    try {
      if (!map || !map.getCenter) return;
      const center = map.getCenter();
      const data = await gridFieldsAPI.fetchWind(
        center.lat,
        center.lng,
        timestamp ? new Date(timestamp).toISOString() : null
      );
      const geojson = this.buildGeoJSON(data);

      if (!map.getSource(this.sourceId)) {
        map.addSource(this.sourceId, {
          type: "geojson",
          data: geojson,
        });
      }

      if (!map.getLayer(this.layerId)) {
        map.addLayer({
          id: this.layerId,
          type: "symbol",
          source: this.sourceId,
          layout: {
            "icon-image": "triangle-11",
            "icon-rotate": ["get", "direction"],
          },
        });
      }
    } catch (e) {
      console.error("WindLayer onAdd failed", e);
    }
  };

  WindLayer.prototype.onRemove = function (map) {
    if (!map) return;
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  };

  WindLayer.prototype.onTimelineUpdate = async function (timestamp) {
    try {
      if (!window.MapContainer || !window.MapContainer.getMap) return;
      const map = window.MapContainer.getMap();
      if (!map || !map.getSource(this.sourceId)) return;
      const center = map.getCenter();
      const data = await gridFieldsAPI.fetchWind(
        center.lat,
        center.lng,
        timestamp ? new Date(timestamp).toISOString() : null
      );
      const geojson = this.buildGeoJSON(data);
      map.getSource(this.sourceId).setData(geojson);
    } catch (e) {
      console.error("WindLayer onTimelineUpdate failed", e);
    }
  };

  WindLayer.prototype.render = function () {};

  WindLayer.prototype.setOpacity = function (opacity) {
    this.opacity = opacity;
  };

  WindLayer.prototype.setColorScheme = function (scheme) {
    this.colorScheme = scheme || "default";
  };

  global.WindLayer = WindLayer;
})(window);
