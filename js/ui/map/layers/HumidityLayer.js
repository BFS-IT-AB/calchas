import gridFieldsAPI from "../../../api/gridFields";

export class HumidityLayer {
  constructor(options = {}) {
    this.id = "humidity";
    this.sourceId = "humidity-source";
    this.layerId = "humidity-layer";
    this.opacity = options.opacity ?? 0.5;
  }

  async onAdd(map, timestamp) {
    const center = map.getCenter();
    const data = await gridFieldsAPI.fetchHumidity(
      center.lat,
      center.lng,
      timestamp
    );
    const geojson = this.buildGeoJSON(data || []);

    map.addSource(this.sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: this.layerId,
      source: this.sourceId,
      type: "circle",
      paint: {
        "circle-radius": 8,
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "humidity"],
          0,
          "#c19a6b",
          30,
          "#4caf50",
          60,
          "#00bcd4",
          90,
          "#1e3a8a",
        ],
        "circle-opacity": this.opacity,
      },
    });
  }

  async onTimelineUpdate(map, timestamp) {
    const center = map.getCenter();
    const data = await gridFieldsAPI.fetchHumidity(
      center.lat,
      center.lng,
      timestamp
    );
    const geojson = this.buildGeoJSON(data || []);
    const source = map.getSource(this.sourceId);
    if (source) {
      source.setData(geojson);
    }
  }

  buildGeoJSON(data) {
    return {
      type: "FeatureCollection",
      features: data.map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.lon, point.lat],
        },
        properties: { humidity: point.currentHumidity || 0 },
      })),
    };
  }

  toggleVisibility(map, visible) {
    map.setLayoutProperty(
      this.layerId,
      "visibility",
      visible ? "visible" : "none"
    );
  }
}
