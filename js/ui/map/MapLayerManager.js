import { TemperatureLayer } from "./layers/TemperatureLayer";
import { WindLayer } from "./layers/WindLayer";
import { CloudLayer } from "./layers/CloudLayer";
import { HumidityLayer } from "./layers/HumidityLayer";
import { AQILayer } from "./layers/AQILayer";
import { AlertLayer } from "./layers/AlertLayer";

export class MapLayerManager {
  constructor(map) {
    this.map = map;
    this.layers = {
      radar: null,
      satellite: null,
      temperature: new TemperatureLayer(),
      wind: new WindLayer(),
      cloud: new CloudLayer(),
      humidity: new HumidityLayer(),
      aqi: new AQILayer(),
      alerts: new AlertLayer(),
    };
    this.visibleLayers = new Set(["radar", "satellite"]);
  }

  async addLayer(layerId, timestamp = null) {
    const layer = this.layers[layerId];
    if (!layer) {
      console.warn(`[MapLayerManager] Layer ${layerId} not found`);
      return;
    }
    try {
      if (layer.onAdd) {
        await layer.onAdd(this.map, timestamp);
      }
      this.visibleLayers.add(layerId);
    } catch (error) {
      console.error(`[MapLayerManager] Failed to add layer ${layerId}:`, error);
    }
  }

  async removeLayer(layerId) {
    const layer = this.layers[layerId];
    if (!layer || !layer.layerId) return;
    try {
      if (this.map.getLayer(layer.layerId)) {
        this.map.removeLayer(layer.layerId);
      }
      if (this.map.getSource(layer.sourceId)) {
        this.map.removeSource(layer.sourceId);
      }
      this.visibleLayers.delete(layerId);
    } catch (error) {
      console.error(
        `[MapLayerManager] Failed to remove layer ${layerId}:`,
        error
      );
    }
  }

  async updateAllLayers(timestamp) {
    for (const layerId of this.visibleLayers) {
      const layer = this.layers[layerId];
      if (layer && layer.onTimelineUpdate) {
        try {
          await layer.onTimelineUpdate(this.map, timestamp);
        } catch (error) {
          console.warn(
            `[MapLayerManager] Failed to update layer ${layerId}:`,
            error
          );
        }
      }
    }
  }

  toggleLayer(layerId, visible) {
    const layer = this.layers[layerId];
    if (!layer || !layer.layerId) return;
    try {
      const visibility = visible ? "visible" : "none";
      this.map.setLayoutProperty(layer.layerId, "visibility", visibility);
      if (visible) {
        this.visibleLayers.add(layerId);
      } else {
        this.visibleLayers.delete(layerId);
      }
    } catch (error) {
      console.warn(
        `[MapLayerManager] Failed to toggle layer ${layerId}:`,
        error
      );
    }
  }

  getLayerList() {
    return Object.keys(this.layers);
  }
}
