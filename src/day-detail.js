(function () {
  const STORAGE_PREFIX = "calchas.dayDetail.";
  const LAST_KEY = "calchas.dayDetail.lastKey";

  function init() {
    const root = document.getElementById("detail-root");
    if (!root) return;
    const payload = loadPayload();
    if (!payload) {
      root.dataset.state = "error";
      root.innerHTML =
        '<p class="detail-error">Keine gespeicherten Tagesdetails gefunden. Öffne die 7-Tage-Ansicht erneut und wähle einen Tag.</p>';
      return;
    }
    const template = window.dayDetailTemplate?.build;
    if (typeof template !== "function") {
      root.dataset.state = "error";
      root.innerHTML =
        '<p class="detail-error">Darstellung nicht verfügbar. Bitte aktualisiere die Seite.</p>';
      return;
    }
    root.dataset.state = "ready";
    root.innerHTML = template({ ...payload, backButton: true });
    const backBtn = root.querySelector(".detail-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.opener && !window.opener.closed) {
          window.close();
        } else {
          window.history.back();
        }
      });
    }
  }

  function loadPayload() {
    const hash = decodeURIComponent(
      window.location.hash.replace("#", "")
    ).trim();
    let storageKey = hash ? `${STORAGE_PREFIX}${hash}` : null;
    if (!storageKey) {
      storageKey = sessionStorage.getItem(LAST_KEY) || null;
    }
    if (!storageKey) return null;
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw);
      sessionStorage.setItem(LAST_KEY, storageKey);
      return payload;
    } catch (error) {
      console.warn("Day detail payload konnte nicht gelesen werden", error);
      return null;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
