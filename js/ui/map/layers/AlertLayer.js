import noaaAlertsAPI from "../../../api/noaaAlerts";

export class AlertLayer {
  constructor(options = {}) {
    this.id = "alerts";
    this.sourceId = "alerts-source";
    this.layerId = "alerts-layer";
    this.opacity = options.opacity ?? 0.4;
  }

  async onAdd(map, timestamp) {
    const center = map.getCenter();
    const alerts = await noaaAlertsAPI.fetchAlertsForPoint(
      center.lat,
      center.lng
    );

    window.CALCHAS_ALERTS = alerts;

    const geojson = this.buildAlertGeoJSON(alerts);

    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, { type: "geojson", data: geojson });
      map.addLayer({
        id: this.layerId,
        source: this.sourceId,
        type: "fill",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": this.opacity,
          "fill-outline-color": "#000000",
        },
      });

      map.on("click", this.layerId, (e) => {
        const props = e.features[0].properties;
        // eslint-disable-next-line no-undef
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${props.event}</strong><br/>${props.severity || ""}`
          )
          .addTo(map);
      });

      map.getCanvas().style.cursor = "pointer";
    } else {
      map.getSource(this.sourceId).setData(geojson);
    }

    this.updateAlertBadge(alerts);
    this.renderAlertSheet(alerts);
  }

  buildAlertGeoJSON(alerts) {
    return {
      type: "FeatureCollection",
      features: (alerts || []).map((alert) => ({
        type: "Feature",
        geometry: alert.geometry || {
          type: "Point",
          coordinates: [0, 0],
        },
        properties: {
          event: alert.event,
          severity: alert.severity,
          color: alert.color,
          headline: alert.headline,
          areaDesc: alert.areaDesc,
          validTime: alert.validTime,
        },
      })),
    };
  }

  updateAlertBadge(alerts) {
    const badge = document.querySelector(".alert-badge");
    if (!badge) return;
    if (alerts.length > 0) {
      badge.textContent = `⚠️ ${alerts.length} Warnungen aktiv`;
      badge.style.display = "block";
      badge.onclick = () => this.openAlertSheet();
    } else {
      badge.style.display = "none";
    }
  }

  renderAlertSheet(alerts) {
    const listContainer = document.querySelector("#alert-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";
    if (!alerts.length) {
      listContainer.innerHTML =
        '<p style="padding: 16px; color: var(--color-text-secondary);">Keine aktiven Warnungen.</p>';
      return;
    }

    const map =
      window.MapContainer && window.MapContainer.getMap
        ? window.MapContainer.getMap()
        : null;

    alerts.forEach((alert) => {
      const item = document.createElement("div");
      const severityClass = (alert.severity || "").toLowerCase();
      item.className = `alert-item alert-item--${severityClass}`;
      const validUntil = new Date(
        (alert.validTime && alert.validTime.split("/")[1]) || Date.now()
      ).toLocaleTimeString();
      item.innerHTML = `
        <div class="alert-item__icon">${this.getAlertIcon(
          alert.event || ""
        )}</div>
        <div class="alert-item__content">
          <div class="alert-item__title">${
            alert.event || "Unbekannter Event"
          }</div>
          <div class="alert-item__area">${
            alert.areaDesc || "Unbekanntes Gebiet"
          }</div>
          <div class="alert-item__time">Gültig bis ${validUntil}</div>
        </div>
        <button class="alert-item__action" type="button">→ Karte</button>
      `;
      const button = item.querySelector(".alert-item__action");
      if (button && map && alert.geometry && alert.geometry.coordinates) {
        button.addEventListener("click", () => {
          try {
            const geom = alert.geometry;
            if (geom.type === "Polygon") {
              const coords = geom.coordinates[0] || [];
              if (coords.length) {
                const lats = coords.map((c) => c[1]);
                const lons = coords.map((c) => c[0]);
                const bounds = [
                  [Math.min(...lons), Math.min(...lats)],
                  [Math.max(...lons), Math.max(...lats)],
                ];
                map.fitBounds(bounds, { padding: 20 });
              }
            } else if (geom.type === "Point") {
              map.flyTo({ center: geom.coordinates, zoom: 8 });
            }
          } catch (e) {
            console.warn("Alert zoom failed", e);
          }
        });
      }
      listContainer.appendChild(item);
    });
  }

  getAlertIcon(eventType) {
    const iconMap = {
      Tornado: "🌪️",
      "Severe Thunderstorm": "⛈️",
      "Flash Flood": "🌊",
      "Winter Storm": "❄️",
      Wind: "💨",
    };
    const entry = Object.entries(iconMap).find(([key]) =>
      eventType.includes(key)
    );
    return (entry && entry[1]) || "⚠️";
  }

  openAlertSheet() {
    if (window.ModalController && window.ModalController.openSheet) {
      window.ModalController.openSheet("map-alerts");
    }
  }
}
