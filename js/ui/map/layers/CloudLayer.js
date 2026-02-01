import gridFieldsAPI from "../../../api/gridFields";

export class CloudLayer {
  constructor(options = {}) {
    this.id = "cloud";
    this.sourceId = "cloud-source";
    this.layerId = "cloud-layer";
    this.opacity = options.opacity ?? 0.3;
  }

  async onAdd(map, timestamp) {
    const center = map.getCenter();
    const data = await gridFieldsAPI.fetchCloudCover(
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
          ["get", "cloud"],
          0,
          "#ffffff",
          50,
          "#999999",
          100,
          "#1a1a4d",
        ],
        "circle-opacity": this.opacity,
      },
    });
  }

  async onTimelineUpdate(map, timestamp) {
    const center = map.getCenter();
    const data = await gridFieldsAPI.fetchCloudCover(
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
        properties: { cloud: point.currentCloud || 0 },
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
