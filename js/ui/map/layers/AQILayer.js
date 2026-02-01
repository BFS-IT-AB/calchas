import aqiAPI from "../../../api/aqi";

export class AQILayer {
  constructor(options = {}) {
    this.id = "aqi";
    this.sourceId = "aqi-source";
    this.layerId = "aqi-layer";
    this.opacity = options.opacity ?? 0.5;
  }

  async onAdd(map, timestamp) {
    const center = map.getCenter();
    const aqiPoint = await aqiAPI.fetchAQIForPoint(
      center.lat,
      center.lng,
      timestamp ? new Date(timestamp).toISOString() : null
    );
    const data = aqiPoint
      ? [
          {
            lat: center.lat,
            lon: center.lng,
            currentAQI: aqiPoint.aqi,
          },
        ]
      : [];
    const geojson = this.buildGeoJSON(data);

    map.addSource(this.sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: this.layerId,
      source: this.sourceId,
      type: "circle",
      paint: {
        "circle-radius": 10,
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "aqi"],
          0,
          "#009966", // Good
          50,
          "#ffde33", // Moderate
          100,
          "#ff9933", // Unhealthy for sensitive
          150,
          "#cc0033", // Unhealthy
          200,
          "#660099", // Very Unhealthy
          300,
          "#7e0023", // Hazardous
        ],
        "circle-opacity": this.opacity,
      },
    });
  }

  async onTimelineUpdate(map, timestamp) {
    if (!map || !map.getSource) return;
    const source = map.getSource(this.sourceId);
    if (!source || !map.getCenter) return;
    const center = map.getCenter();
    const aqiPoint = await aqiAPI.fetchAQIForPoint(
      center.lat,
      center.lng,
      timestamp ? new Date(timestamp).toISOString() : null
    );
    const data = aqiPoint
      ? [
          {
            lat: center.lat,
            lon: center.lng,
            currentAQI: aqiPoint.aqi,
          },
        ]
      : [];
    const geojson = this.buildGeoJSON(data);
    source.setData(geojson);
  }

  buildGeoJSON(data) {
    return {
      type: "FeatureCollection",
      features: (data || []).map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.lon, point.lat],
        },
        properties: { aqi: point.currentAQI || 0 },
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
