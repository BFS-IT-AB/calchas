(function (global) {
  // Simple placeholder for MapLayerManager to allow RadarController to function visually
  // and prevent app.js from crashing when accessing it.
  global.MapLayerManager = {
    init: function (mapContainer) {
      console.log("[MapLayerManager] Initialized (Shim)");
    },
    getLayerList: function () {
      // Connect to the live MapComponent instance if available
      if (
        window.appMapInstance &&
        typeof window.appMapInstance.getLayerList === "function"
      ) {
        return window.appMapInstance.getLayerList();
      }
      return [];
    },
    updateLayerData: function (layerId, timestamp) {
      // Stub
    },
    registerLayer: function (id, layer) {
      console.log("[MapLayerManager] Registered layer (Shim):", id);
    },
    toggleLayer: function (id) {
      console.log("[MapLayerManager] Toggle layer requested:", id);
      if (window.appMapInstance) {
        // Assume 'true' for now to show it, or check status.
        // MapComponent.toggleOverlay assumes specific layer types.
        // We'll pass true to ensure it activates.
        // NOTE: The MapComponent toggle is toggleOverlay(type, visible)
        // Check if it's already on to toggle off?
        // For now, let's just assume this shim is used for activation primarily.

        // This shim might be called by legacy code expecting a specific behavior.
        // But since we fixed the UI checkboxes in MapComponent directly, this shim
        // is mostly to prevent crashes in other parts of the app.

        // However, if there are external calls to toggleLayer, we should handle them.

        // We can't easily know the current state without querying the map instance.
        // Let's defer to MapComponent's logic if possible.
        // But MapComponent.toggleOverlay requires explicit 'visible' boolean.

        // Let's create a shim that tries to toggle.
        const layerType = id; // Assuming id matches layerType
        const map = window.appMapInstance;

        // Check if layer is currently active
        const isVisible =
          map.overlays &&
          map.overlays[layerType] &&
          map.map.hasLayer(map.overlays[layerType]);

        map.toggleOverlay(layerType, !isVisible);
      }
    },
  };
})(window);
