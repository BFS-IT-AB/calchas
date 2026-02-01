import gridFieldsAPI from "../../../api/gridFields";

(function (global) {
  function TemperatureLayer(options) {
    this.options = options || {};
    this.id = this.options.id || "temperature";
    this.opacity = 1;
    this.colorScheme = "heat";
    this.sourceId = "temp-source";
    this.layerId = "temp-heatmap";
  }

  TemperatureLayer.prototype.buildGeoJSON = function (data) {
    return {
      type: "FeatureCollection",
      features: (data || []).map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.lon, point.lat],
        },
        properties: {
          temp: point.currentTemp,
        },
      })),
    };
  };

  TemperatureLayer.prototype.onAdd = async function (map, timestamp) {
    try {
      if (!map || !map.getCenter) return;
      const center = map.getCenter();
      const data = await gridFieldsAPI.fetchTemperature(
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
          type: "heatmap",
          source: this.sourceId,
          paint: {
            "heatmap-opacity": this.opacity,
          },
        });
      }
    } catch (e) {
      console.error("TemperatureLayer onAdd failed", e);
    }
  };

  TemperatureLayer.prototype.onRemove = function (map) {
    if (!map) return;
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  };

  TemperatureLayer.prototype.onTimelineUpdate = async function (timestamp) {
    try {
      if (!window.MapContainer || !window.MapContainer.getMap) return;
      const map = window.MapContainer.getMap();
      if (!map || !map.getSource(this.sourceId)) return;
      const center = map.getCenter();
      const data = await gridFieldsAPI.fetchTemperature(
        center.lat,
        center.lng,
        timestamp ? new Date(timestamp).toISOString() : null
      );
      const geojson = this.buildGeoJSON(data);
      map.getSource(this.sourceId).setData(geojson);
    } catch (e) {
      console.error("TemperatureLayer onTimelineUpdate failed", e);
    }
  };

  TemperatureLayer.prototype.render = function () {};

  TemperatureLayer.prototype.setOpacity = function (opacity) {
    this.opacity = opacity;
  };

  TemperatureLayer.prototype.setColorScheme = function (scheme) {
    this.colorScheme = scheme || "heat";
  };

  global.TemperatureLayer = TemperatureLayer;
})(window);
