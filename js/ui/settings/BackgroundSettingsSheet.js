/**
 * BackgroundSettingsSheet.js - Automatische Aktualisierungen & Benachrichtigungen
 * Für PWA/Web-App optimiert
 */
(function (global) {
  // Toast notification helper
  function showToast(message, isError) {
    var existing = document.querySelector(".settings-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className =
      "settings-toast" + (isError ? " settings-toast--error" : "");
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("settings-toast--visible");
    });

    setTimeout(function () {
      toast.classList.remove("settings-toast--visible");
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 2500);
  }

  const STORAGE_KEYS = {
    autoRefresh: "wetter_auto_refresh",
    refreshInterval: "wetter_refresh_interval",
    notifications: "wetter_notifications_allowed",
    releaseNotes: "wetter_release_notes_toast",
  };

  const INTERVALS = [
    { value: "off", label: "Aus", minutes: 0 },
    { value: "5m", label: "5 Minuten", minutes: 5 },
    { value: "15m", label: "15 Minuten", minutes: 15 },
    { value: "30m", label: "30 Minuten", minutes: 30 },
    { value: "1h", label: "1 Stunde", minutes: 60 },
  ];

  function readBool(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === "true";
    } catch (e) {
      return fallback;
    }
  }

  function renderBackgroundSheet(appState) {
    var container = document.getElementById("settings-background-body");
    if (!container) return;

    var autoRefresh = readBool(STORAGE_KEYS.autoRefresh, true);
    var refreshInterval =
      localStorage.getItem(STORAGE_KEYS.refreshInterval) || "15m";
    var notificationsAllowed = readBool(STORAGE_KEYS.notifications, false);
    var releaseNotesToast = readBool(STORAGE_KEYS.releaseNotes, true);
    var notificationSupported = "Notification" in window;
    var notificationStatus = notificationSupported
      ? Notification.permission
      : "unsupported";

    var html =
      '<div class="background-settings">' +
      // Auto-Refresh Section
      '<div class="background-card background-card--primary">' +
      "<div>" +
      '<p class="background-card__title">Automatische Aktualisierung</p>' +
      '<p class="background-card__subtitle">Wetterdaten werden automatisch aktualisiert, wenn die App geöffnet ist</p>' +
      "</div>" +
      '<button type="button" class="pill-switch' +
      (autoRefresh ? " pill-switch--on" : "") +
      '" data-action="toggle-auto-refresh" aria-pressed="' +
      autoRefresh +
      '">' +
      '<span class="pill-switch__knob"></span>' +
      "</button>" +
      "</div>" +
      // Refresh Interval
      '<div class="background-section">' +
      '<p class="background-section__title">Aktualisierungsintervall</p>' +
      '<div class="background-intervals">';

    INTERVALS.forEach(function (opt) {
      html +=
        '<button type="button" class="chip' +
        (refreshInterval === opt.value ? " chip--active" : "") +
        '" data-refresh-value="' +
        opt.value +
        '">' +
        opt.label +
        "</button>";
    });

    html +=
      "</div>" +
      "</div>" +
      // Notifications Section
      '<div class="background-card background-card--alert">' +
      "<div>" +
      '<p class="background-card__title">Browser-Benachrichtigungen</p>' +
      '<p class="background-card__subtitle">' +
      (notificationSupported
        ? notificationStatus === "granted"
          ? "✓ Erlaubt"
          : notificationStatus === "denied"
          ? "✗ Blockiert"
          : "Nicht aktiviert"
        : "Nicht unterstützt") +
      "</p>" +
      "</div>" +
      (notificationSupported && notificationStatus !== "denied"
        ? '<button type="button" class="chip chip--action" data-action="request-notifications">' +
          (notificationStatus === "granted" ? "Testen" : "Aktivieren") +
          "</button>"
        : "") +
      "</div>" +
      // Additional Settings
      '<div class="background-section">' +
      '<p class="background-section__title">Sonstige</p>' +
      '<div class="background-list">' +
      '<div class="background-list__row">' +
      "<div>" +
      '<span class="background-list__title">Release-Hinweise anzeigen</span>' +
      '<span class="background-list__subtitle">Zeige eine Nachricht bei neuen Versionen</span>' +
      "</div>" +
      '<button type="button" class="pill-switch' +
      (releaseNotesToast ? " pill-switch--on" : "") +
      '" data-action="toggle-release-notes" aria-pressed="' +
      releaseNotesToast +
      '">' +
      '<span class="pill-switch__knob"></span>' +
      "</button>" +
      "</div>" +
      '<div class="background-list__row">' +
      "<div>" +
      '<span class="background-list__title">Jetzt aktualisieren</span>' +
      '<span class="background-list__subtitle">Wetterdaten manuell neu laden</span>' +
      "</div>" +
      '<button type="button" class="chip chip--action" data-action="refresh-now">🔄 Aktualisieren</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      // Info Note
      '<div class="background-info-note">' +
      '<span class="background-info-note__icon">ℹ️</span>' +
      "<p>Als Web-App kann Calchas nur aktualisieren, wenn die Seite geöffnet ist. " +
      "Installiere die App als PWA für bessere Performance.</p>" +
      "</div>" +
      "</div>";

    container.innerHTML = html;
    wireEvents(container, appState);
  }

  function wireEvents(container, appState) {
    // Auto-refresh toggle
    var autoRefreshBtn = container.querySelector(
      '[data-action="toggle-auto-refresh"]'
    );
    if (autoRefreshBtn) {
      autoRefreshBtn.addEventListener("click", function () {
        var current = autoRefreshBtn.getAttribute("aria-pressed") === "true";
        var next = !current;
        autoRefreshBtn.setAttribute("aria-pressed", String(next));
        autoRefreshBtn.classList.toggle("pill-switch--on", next);
        localStorage.setItem(STORAGE_KEYS.autoRefresh, String(next));

        if (next) {
          startAutoRefresh();
          showToast("✓ Automatische Aktualisierung aktiviert");
        } else {
          stopAutoRefresh();
          showToast("✓ Automatische Aktualisierung deaktiviert");
        }
      });
    }

    // Interval selection
    container.querySelectorAll("[data-refresh-value]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-refresh-value") || "15m";
        localStorage.setItem(STORAGE_KEYS.refreshInterval, value);

        // Update UI
        container
          .querySelectorAll("[data-refresh-value]")
          .forEach(function (b) {
            b.classList.remove("chip--active");
          });
        btn.classList.add("chip--active");

        // Restart auto-refresh with new interval
        if (readBool(STORAGE_KEYS.autoRefresh, true)) {
          startAutoRefresh();
        }

        var match = INTERVALS.find(function (opt) {
          return opt.value === value;
        });
        showToast(
          "✓ Intervall auf " + (match ? match.label : value) + " gesetzt"
        );
      });
    });

    // Notification request
    var notifBtn = container.querySelector(
      '[data-action="request-notifications"]'
    );
    if (notifBtn) {
      notifBtn.addEventListener("click", function () {
        if (Notification.permission === "granted") {
          // Test notification
          new Notification("Calchas Wetter", {
            body: "Benachrichtigungen funktionieren! 🌤️",
            icon: "assets/logo.png",
          });
        } else {
          Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
              localStorage.setItem(STORAGE_KEYS.notifications, "true");
              renderBackgroundSheet(appState);
              new Notification("Calchas Wetter", {
                body: "Benachrichtigungen aktiviert! 🌤️",
                icon: "assets/logo.png",
              });
            }
          });
        }
      });
    }

    // Release notes toggle
    var releaseBtn = container.querySelector(
      '[data-action="toggle-release-notes"]'
    );
    if (releaseBtn) {
      releaseBtn.addEventListener("click", function () {
        var current = releaseBtn.getAttribute("aria-pressed") === "true";
        var next = !current;
        releaseBtn.setAttribute("aria-pressed", String(next));
        releaseBtn.classList.toggle("pill-switch--on", next);
        localStorage.setItem(STORAGE_KEYS.releaseNotes, String(next));
      });
    }

    // Manual refresh
    var refreshNowBtn = container.querySelector('[data-action="refresh-now"]');
    if (refreshNowBtn) {
      refreshNowBtn.addEventListener("click", function () {
        refreshNowBtn.disabled = true;
        refreshNowBtn.textContent = "⏳ Lädt...";

        if (
          window.loadWeatherForCity &&
          window.appState &&
          window.appState.currentCity
        ) {
          window
            .loadWeatherForCity(window.appState.currentCity)
            .then(function () {
              refreshNowBtn.disabled = false;
              refreshNowBtn.textContent = "✓ Aktualisiert";
              setTimeout(function () {
                refreshNowBtn.textContent = "🔄 Aktualisieren";
              }, 2000);
            })
            .catch(function () {
              refreshNowBtn.disabled = false;
              refreshNowBtn.textContent = "✗ Fehler";
              setTimeout(function () {
                refreshNowBtn.textContent = "🔄 Aktualisieren";
              }, 2000);
            });
        } else {
          location.reload();
        }
      });
    }
  }

  // Auto-refresh timer management
  var autoRefreshTimer = null;

  function startAutoRefresh() {
    stopAutoRefresh();

    var interval = localStorage.getItem(STORAGE_KEYS.refreshInterval) || "15m";
    var match = INTERVALS.find(function (opt) {
      return opt.value === interval;
    });
    var minutes = match ? match.minutes : 15;

    if (minutes <= 0) return;

    autoRefreshTimer = setInterval(function () {
      if (
        document.visibilityState === "visible" &&
        window.loadWeatherForCity &&
        window.appState &&
        window.appState.currentCity
      ) {
        console.log("[AutoRefresh] Aktualisiere Wetterdaten...");
        window.loadWeatherForCity(window.appState.currentCity);
      }
    }, minutes * 60 * 1000);

    console.log(
      "[AutoRefresh] Gestartet mit Intervall: " + minutes + " Minuten"
    );
  }

  function stopAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
      console.log("[AutoRefresh] Gestoppt");
    }
  }

  // Initialize auto-refresh on page load if enabled
  if (readBool(STORAGE_KEYS.autoRefresh, true)) {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(startAutoRefresh, 5000); // Wait 5s after page load
    });
  }

  global.BackgroundSettingsSheet = {
    renderBackgroundSheet,
    startAutoRefresh,
    stopAutoRefresh,
  };
})(window);
