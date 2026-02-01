/* Error-Messages Handling Component */

class ErrorHandler {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.errorStack = [];
    this.autoHideTimeout = UI_CONFIG.ERROR_DISPLAY_TIME;
  }

  /**
   * Zeigt Error an
   * @param {string} message - Error-Meldung
   * @param {string} type - Error-Type (error, warning, info)
   * @param {number} duration - Auto-Hide Dauer in ms (null = manual)
   */
  show(message, type = "error", duration = null, options = {}) {
    if (!this.container) return;

    const errorId = `error_${Date.now()}`;
    const displayDuration = duration || this.autoHideTimeout;
    const {
      allowHtml = false,
      title = null,
      meta = null,
      list = null,
      actions = null,
      icon = null,
    } = options;

    const errorEl = document.createElement("div");
    errorEl.className = `error-alert error-${type}`;
    errorEl.id = errorId;

    const content = document.createElement("div");
    content.className = "error-content";

    const iconEl = document.createElement("span");
    iconEl.className = "error-icon";
    iconEl.textContent = icon || this._getIcon(type);

    const body = document.createElement("div");
    body.className = "error-body";

    if (title) {
      const titleEl = document.createElement("p");
      titleEl.className = "error-title";
      titleEl.textContent = title;
      body.appendChild(titleEl);
    }

    const messageEl = document.createElement("p");
    messageEl.className = "error-message";
    if (allowHtml) {
      messageEl.innerHTML = message;
    } else {
      messageEl.textContent = message;
    }
    body.appendChild(messageEl);

    if (meta) {
      const metaEl = document.createElement("p");
      metaEl.className = "error-meta";
      metaEl.textContent = meta;
      body.appendChild(metaEl);
    }

    if (Array.isArray(list) && list.length) {
      const listEl = document.createElement("ul");
      listEl.className = "error-list";
      list.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        listEl.appendChild(li);
      });
      body.appendChild(listEl);
    }

    if (Array.isArray(actions) && actions.length) {
      const actionEl = document.createElement("div");
      actionEl.className = "error-actions";
      actions.forEach((action) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          action.kind === "primary" ? "btn-primary" : "btn-secondary";
        btn.textContent = action.label;
        btn.addEventListener("click", () => {
          if (typeof action.onClick === "function") {
            action.onClick({ close: () => this.hide(errorId) });
          }
        });
        actionEl.appendChild(btn);
      });
      body.appendChild(actionEl);
    }

    const closeBtn = document.createElement("button");
    closeBtn.className = "error-close";
    closeBtn.dataset.errorId = errorId;
    closeBtn.setAttribute("aria-label", "Benachrichtigung schließen");
    closeBtn.textContent = "✕";

    content.appendChild(iconEl);
    content.appendChild(body);
    content.appendChild(closeBtn);
    errorEl.appendChild(content);

    this.container.appendChild(errorEl);
    this.errorStack.push(errorId);

    setTimeout(() => errorEl.classList.add("show"), 10);

    closeBtn.addEventListener("click", () => {
      this.hide(errorId);
    });

    if (displayDuration > 0) {
      setTimeout(() => this.hide(errorId), displayDuration);
    }

    return errorId;
  }

  /**
   * Versteckt Error
   * @param {string} errorId - Error-Element ID
   */
  hide(errorId) {
    const errorEl = document.getElementById(errorId);
    if (!errorEl) return;

    errorEl.classList.remove("show");
    setTimeout(() => {
      errorEl.remove();
      this.errorStack = this.errorStack.filter((id) => id !== errorId);
    }, 300);
  }

  /**
   * Zeigt Error-Benachrichtigung
   */
  showError(message, duration, options) {
    return this.show(message, "error", duration, options);
  }

  /**
   * Zeigt Warning-Benachrichtigung
   */
  showWarning(message, duration, options) {
    return this.show(message, "warning", duration, options);
  }

  /**
   * Zeigt Info-Benachrichtigung
   */
  showInfo(message, duration, options) {
    return this.show(message, "info", duration, options);
  }

  /**
   * Zeigt Success-Benachrichtigung
   */
  showSuccess(message, duration, options) {
    return this.show(message, "success", duration, options);
  }

  /**
   * Zeigt API-spezifischen Error mit Details
   */
  showApiError(apiSource, errorMessage) {
    const message = `
      <strong>${this._escapeHtml(apiSource)} Fehler:</strong><br>
      ${this._escapeHtml(errorMessage)}
    `.trim();
    return this.showError(message, null, { allowHtml: true });
  }

  /**
   * Zeigt Error mit Retry-Button
   */
  showWithRetry(message, onRetry) {
    if (!this.container) return;

    const errorId = `error_${Date.now()}`;
    const errorEl = document.createElement("div");
    errorEl.className = "error-alert error-error";
    errorEl.id = errorId;
    errorEl.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${this._escapeHtml(message)}</span>
        <div class="error-actions">
          <button class="btn-retry" data-error-id="${errorId}">🔄 Erneut versuchen</button>
          <button class="error-close" data-error-id="${errorId}">✕</button>
        </div>
      </div>
    `;

    this.container.appendChild(errorEl);
    this.errorStack.push(errorId);

    setTimeout(() => errorEl.classList.add("show"), 10);

    // Retry Button
    errorEl.querySelector(".btn-retry").addEventListener("click", () => {
      this.hide(errorId);
      onRetry();
    });

    // Close Button
    errorEl.querySelector(".error-close").addEventListener("click", () => {
      this.hide(errorId);
    });

    return errorId;
  }

  /**
   * Zeigt mehrzeiligen Error
   */
  showDetailed(title, details, errorCode = null) {
    let message = `<strong>${this._escapeHtml(title)}</strong>`;

    if (details) {
      message += `<br><small>${this._escapeHtml(details)}</small>`;
    }

    if (errorCode) {
      message += `<br><code style="font-size: 0.8em; opacity: 0.7;">Code: ${this._escapeHtml(
        errorCode
      )}</code>`;
    }

    return this.showError(message, null, { allowHtml: true });
  }

  /**
   * Löscht alle Errors
   */
  clearAll() {
    this.errorStack.forEach((errorId) => {
      const el = document.getElementById(errorId);
      if (el) el.remove();
    });
    this.errorStack = [];
  }

  /**
   * Gibt Icon basierend auf Type zurück
   * @private
   */
  _getIcon(type) {
    const icons = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      success: "✅",
    };
    return icons[type] || "🔔";
  }

  /**
   * HTML-Escape für Sicherheit
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Gibt Anzahl aktiver Errors
   */
  getErrorCount() {
    return this.errorStack.length;
  }

  /**
   * Setzt Auto-Hide Timeout
   */
  setAutoHideTimeout(ms) {
    this.autoHideTimeout = ms;
  }
}

/**
 * Globale Error-Handler Instanz
 */
let errorHandler;

/**
 * Initialisiert Error-Handler (wird in app.js aufgerufen)
 */
function initErrorHandler(containerSelector = "#error-container") {
  errorHandler = new ErrorHandler(containerSelector);
  return errorHandler;
}

/**
 * Shortcut-Funktionen
 */
function showError(message, duration, options) {
  return errorHandler?.showError(message, duration, options);
}

function showWarning(message, duration, options) {
  return errorHandler?.showWarning(message, duration, options);
}

function showInfo(message, duration, options) {
  return errorHandler?.showInfo(message, duration, options);
}

function showSuccess(message, duration, options) {
  return errorHandler?.showSuccess(message, duration, options);
}
