/**
 * MasterUIController.js - Centralized UI Controller
 *
 * Single source of truth for ALL modal and card interactions.
 * Uses the Health-page components as the absolute blueprint.
 *
 * Features:
 * - Event Delegation (single click listener on main container)
 * - CSS-class-based transitions (.is-visible, .is-active)
 * - Global scrim element management
 * - Unified card/modal interactions
 * - Zero custom JS-math animations (pure CSS)
 *
 * @module ui/MasterUIController
 * @version 1.0.0
 */
(function (global) {
  "use strict";

  // ===========================================
  // CONFIGURATION - Uses Design Tokens (Phase 4)
  // ===========================================
  const CONFIG = {
    // Timing - read from CSS variables at runtime
    transitionDuration: 300, // --modal-transition-duration fallback

    // Selectors
    cardSelector: ".standard-card",
    backdropId: "master-backdrop", // Single backdrop element
    sheetClass: "standard-modal",
  };

  // ===========================================
  // STATE - Single Backdrop Principle
  // ===========================================
  let state = {
    activeModalId: null,
    modalStack: [], // Track stacked modals for z-index management
    isAnimating: false,
    backdropElement: null,
    currentZIndex: 1000, // Start from --z-modal-base
  };

  // ===========================================
  // SINGLE BACKDROP MANAGEMENT (Phase 4)
  // Global nur EIN Backdrop-Element
  // ===========================================

  /**
   * Get or create the SINGLE global backdrop element.
   * Implements the Single-Backdrop-Principle from Phase 4.
   * Uses CSS variables from design-tokens.css.
   *
   * @returns {HTMLElement} The single backdrop element
   */
  function getOrCreateBackdrop() {
    // Return existing backdrop if it's still in DOM
    if (
      state.backdropElement &&
      document.body.contains(state.backdropElement)
    ) {
      return state.backdropElement;
    }

    // PRIORITY 1: Use existing #bottom-sheet-overlay (existing modal system)
    let backdrop = document.getElementById("bottom-sheet-overlay");

    // PRIORITY 2: Check for #master-backdrop
    if (!backdrop) {
      backdrop = document.getElementById(CONFIG.backdropId);
    }

    // PRIORITY 3: Create new backdrop with design-token styles
    if (!backdrop) {
      console.log("[MasterUI] Creating single backdrop element");
      backdrop = document.createElement("div");
      backdrop.id = CONFIG.backdropId;
      backdrop.className = "master-backdrop";

      // Apply design-token styles inline for guaranteed consistency
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        background: "var(--modal-backdrop-bg, rgba(22, 22, 24, 0.96))",
        backdropFilter:
          "var(--modal-backdrop-blur, blur(20px)) var(--modal-backdrop-saturate, saturate(180%))",
        WebkitBackdropFilter:
          "var(--modal-backdrop-blur, blur(20px)) var(--modal-backdrop-saturate, saturate(180%))",
        zIndex: "var(--z-backdrop, 999)",
        opacity: "0",
        visibility: "hidden",
        transition:
          "opacity var(--modal-transition-duration, 300ms) var(--modal-transition-easing, cubic-bezier(0.05, 0.7, 0.1, 1)), visibility var(--modal-transition-duration, 300ms)",
        pointerEvents: "none",
      });

      document.body.appendChild(backdrop);
    }

    backdrop.setAttribute("aria-hidden", "true");

    // Clean up legacy/orphaned backdrop elements (NICHT das existierende overlay)
    document
      .querySelectorAll(
        "#modal-scrim, .flip-scrim, .health-modal-overlay:not(.health-modal-overlay--visible)",
      )
      .forEach((el) => {
        if (el !== backdrop) {
          el.remove();
        }
      });

    // Single click handler for backdrop
    if (!backdrop._masterUIClickHandler) {
      backdrop._masterUIClickHandler = true;
      backdrop.addEventListener("click", (e) => {
        // Only close if clicking directly on backdrop, not on modal content
        if (
          e.target === backdrop ||
          e.target.classList.contains("bottom-sheet-overlay") ||
          e.target.classList.contains("master-backdrop")
        ) {
          closeActiveModal();
        }
      });
    }

    state.backdropElement = backdrop;
    return backdrop;
  }

  /**
   * Show the single backdrop (no duplicate creation!)
   */
  function showBackdrop() {
    const backdrop = getOrCreateBackdrop();

    // Force reflow before adding visible state
    void backdrop.offsetHeight;

    // Apply visible state
    backdrop.classList.add("is-open", "is-visible");
    Object.assign(backdrop.style, {
      opacity: "1",
      visibility: "visible",
      pointerEvents: "auto",
    });
    backdrop.setAttribute("aria-hidden", "false");

    console.log("[MasterUI] Backdrop shown (single element)");
  }

  /**
   * Hide the single backdrop
   */
  function hideBackdrop() {
    const backdrop = state.backdropElement;
    if (backdrop) {
      backdrop.classList.remove("is-open", "is-visible");
      Object.assign(backdrop.style, {
        opacity: "0",
        visibility: "hidden",
        pointerEvents: "none",
      });
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  /**
   * Completely remove the backdrop (cleanup)
   */
  function destroyBackdrop() {
    // Don't destroy #bottom-sheet-overlay - it's part of index.html
    const backdrop = state.backdropElement;
    if (backdrop && backdrop.id === CONFIG.backdropId) {
      backdrop.remove();
    }
    state.backdropElement = null;

    // Clean up any legacy elements
    document
      .querySelectorAll("#modal-scrim, .flip-scrim, .flip-phantom")
      .forEach((el) => el.remove());
  }

  // ===========================================
  // Z-INDEX MANAGEMENT (Phase 4)
  // Kontrollierte Stapelung über CSS Variables
  // ===========================================

  /**
   * Get the next z-index for stacked modals
   * Uses CSS variable as base, increments by 1 for each stacked modal
   *
   * @returns {number} The z-index value to use
   */
  function getNextZIndex() {
    const baseZIndex = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--z-modal-base",
      ) || "1000",
      10,
    );
    return baseZIndex + state.modalStack.length;
  }

  /**
   * Apply z-index to a modal element
   * @param {HTMLElement} modal - The modal element
   */
  function applyModalZIndex(modal) {
    const zIndex = getNextZIndex();
    modal.style.zIndex = zIndex;
    console.log(`[MasterUI] Modal z-index set to ${zIndex}`);
  }

  // ===========================================
  // MODAL MANAGEMENT
  // ===========================================

  /**
   * Resolve a modal ID from various input formats
   * @param {string} idOrMetric - Sheet ID, metric name, or data attribute value
   * @returns {string|null} Resolved modal ID
   */
  function resolveModalId(idOrMetric) {
    if (!idOrMetric) return null;

    // Already has sheet- prefix
    if (idOrMetric.startsWith("sheet-")) return idOrMetric;

    // Has metric- prefix
    if (idOrMetric.startsWith("metric-")) return "sheet-" + idOrMetric;

    // Common metric mappings
    const metricMapping = {
      wind: "sheet-metric-wind",
      precipitation: "sheet-metric-precipitation",
      uv: "sheet-metric-uv",
      visibility: "sheet-metric-visibility",
      aqi: "sheet-aqi",
      "temperature-trend": "sheet-temperature-trend",
      "sun-cloud": "sheet-sun-cloud",
      "map-layers": "sheet-map-layers",
      "location-picker": "sheet-location-picker",
      settings: "sheet-settings",
    };

    return metricMapping[idOrMetric] || idOrMetric;
  }

  /**
   * Ensure modal has the standard drag handle (Health modal style)
   * @param {HTMLElement} modal - The modal element
   */
  function ensureDragHandle(modal) {
    // Check for both class names (standard and legacy)
    if (
      !modal.querySelector(".bottom-sheet__handle, .standard-modal__handle")
    ) {
      const handle = document.createElement("div");
      // Use the Health modal class name
      handle.className = "bottom-sheet__handle";
      handle.setAttribute("aria-hidden", "true");
      modal.insertBefore(handle, modal.firstChild);
    }
  }

  /**
   * Open a modal by ID
   * Uses EXACT same technique as Health-page (requestAnimationFrame for class toggle)
   *
   * @param {string} modalId - The modal ID to open
   * @param {HTMLElement} [sourceElement] - Optional source element (for future use)
   */
  function openModal(modalId, sourceElement) {
    console.log("[MasterUI] openModal called:", modalId);

    if (state.isAnimating) {
      console.log("[MasterUI] Animation in progress, skipping");
      return;
    }

    const resolvedId = resolveModalId(modalId);
    const modal = resolvedId && document.getElementById(resolvedId);

    console.log("[MasterUI] Resolved ID:", resolvedId, "Modal found:", !!modal);

    if (!modal) {
      console.warn("[MasterUI] Modal not found:", modalId);
      return;
    }

    // Close any currently open modal first (but keep backdrop if stacking)
    if (state.activeModalId && state.activeModalId !== resolvedId) {
      closeActiveModal(true); // silent close (no animation wait)
    }

    state.isAnimating = true;
    state.activeModalId = resolvedId;

    // Track modal in stack for z-index management
    if (!state.modalStack.includes(resolvedId)) {
      state.modalStack.push(resolvedId);
    }

    // Ensure drag handle exists
    ensureDragHandle(modal);

    // Apply controlled z-index (Phase 4)
    applyModalZIndex(modal);

    // ZENTRAL: Lock body scroll via .modal-open class
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");

    // Show backdrop (SINGLE element, no duplicates)
    showBackdrop();

    // Render content if applicable (use ModalContentRenderer or legacy ModalController)
    const contentRenderer =
      global.ModalContentRenderer || global.ModalController;
    if (contentRenderer?.renderSheetContent) {
      try {
        contentRenderer.renderSheetContent(resolvedId);
      } catch (e) {
        console.warn("[MasterUI] Content render failed:", e);
      }
    }

    // STUTTER FIX: Double-requestAnimationFrame pattern
    // First RAF: Browser paints the modal in hidden/off-screen state (display:flex, transform:translateY(100%))
    // Second RAF: Apply visible class AFTER browser has painted, triggering smooth CSS transition
    // This is the EXACT technique used by the Health-page "Outfit für heute" modal
    modal.style.display = "flex";
    modal.style.flexDirection = "column";

    requestAnimationFrame(() => {
      // Force style recalc - browser now knows modal is display:flex at translateY(100%)
      void modal.offsetHeight;

      requestAnimationFrame(() => {
        // NOW add visible classes - CSS transition will animate from 100% to 0
        modal.classList.add("is-visible");
        modal.classList.add("standard-modal--visible");
        modal.classList.add("bottom-sheet--visible");

        console.log(
          "[MasterUI] Modal classes applied:",
          modal.id,
          modal.classList.toString(),
        );

        state.isAnimating = false;
      });
    });

    // Accessibility
    modal.setAttribute("aria-hidden", "false");

    // Focus management
    const firstFocusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), CONFIG.transitionDuration);
    }
  }

  /**
   * Close the currently active modal (Phase 4 - Single Backdrop)
   * Uses CSS variable timing for consistent transitions
   *
   * @param {boolean} [silent=false] - If true, skip animation delay
   */
  function closeActiveModal(silent = false) {
    const modal =
      state.activeModalId && document.getElementById(state.activeModalId);

    console.log(
      "[MasterUI] closeActiveModal called, modal:",
      state.activeModalId,
    );

    // Remove visible classes - triggers CSS transition back to translateY(100%)
    if (modal) {
      modal.classList.remove("is-visible");
      modal.classList.remove("standard-modal--visible");
      modal.classList.remove("bottom-sheet--visible");
      modal.setAttribute("aria-hidden", "true");
      modal.style.zIndex = ""; // Reset z-index
    }

    // Remove from modal stack
    const index = state.modalStack.indexOf(state.activeModalId);
    if (index > -1) {
      state.modalStack.splice(index, 1);
    }

    // Only hide backdrop if no more modals in stack
    if (state.modalStack.length === 0) {
      hideBackdrop();
    }

    const cleanup = () => {
      // ZENTRAL: Unlock body scroll via .modal-open class
      // Only unlock if no more modals are open
      if (state.modalStack.length === 0) {
        document.body.classList.remove(
          "modal-open",
          "bg-dimmed",
          "scrim-active",
        );
        document.documentElement.classList.remove(
          "modal-open",
          "bg-dimmed",
          "scrim-active",
        );
      }

      // Reset display to none AFTER transition completes
      if (modal) {
        modal.style.display = "";
      }

      // Clean up any leftover elements from old systems
      document
        .querySelectorAll(".flip-phantom, .flip-scrim")
        .forEach((el) => el.remove());

      // Reset app container filters
      const appContainer =
        document.getElementById("app-container") ||
        document.getElementById("app") ||
        document.querySelector("main");
      if (appContainer) {
        appContainer.style.filter = "";
        appContainer.style.transform = "";
      }

      state.activeModalId =
        state.modalStack[state.modalStack.length - 1] || null;
      state.isAnimating = false;
    };

    if (silent) {
      cleanup();
    } else {
      // Use CSS variable timing from design-tokens
      setTimeout(cleanup, CONFIG.transitionDuration);
    }
  }

  /**
   * Close all modals (clears entire stack)
   */
  function closeAll() {
    // Close all modals in reverse order
    while (state.modalStack.length > 0) {
      closeActiveModal(true); // silent close
    }
    // Final cleanup
    hideBackdrop();
    document.body.classList.remove("modal-open", "bg-dimmed", "scrim-active");
    document.documentElement.classList.remove(
      "modal-open",
      "bg-dimmed",
      "scrim-active",
    );
    state.isAnimating = false;
  }

  // ===========================================
  // CARD INTERACTIONS
  // ===========================================

  /**
   * Handle card press (mouse down / touch start)
   * Adds the .is-active class for press effect
   *
   * @param {HTMLElement} card - The card element
   */
  function handleCardPress(card) {
    card.classList.add("is-active");
  }

  /**
   * Handle card release (mouse up / touch end)
   * Removes the .is-active class
   *
   * @param {HTMLElement} card - The card element
   */
  function handleCardRelease(card) {
    card.classList.remove("is-active");
  }

  // ===========================================
  // EVENT DELEGATION - Single listener pattern
  // ===========================================

  /**
   * Initialize the Master UI Controller
   * Sets up event delegation on document.body
   */
  function init() {
    // Prevent double initialization
    if (global.MasterUIController?._initialized) {
      console.log("[MasterUI] Already initialized");
      return;
    }

    console.log("[MasterUI] Initializing Master UI Controller (Phase 4)");

    // Initialize single backdrop element
    getOrCreateBackdrop();

    // ===========================================
    // CLICK DELEGATION
    // ===========================================
    document.addEventListener(
      "click",
      (e) => {
        // Check for modal triggers
        const trigger =
          e.target.closest("[data-bottom-sheet]") ||
          e.target.closest("[data-bottom-sheet-target]") ||
          e.target.closest("[data-modal]");

        if (trigger) {
          const targetId =
            trigger.getAttribute("data-bottom-sheet") ||
            trigger.getAttribute("data-bottom-sheet-target") ||
            trigger.getAttribute("data-modal");
          if (targetId) {
            e.preventDefault();
            openModal(targetId, trigger);
            return;
          }
        }

        // Check for close buttons
        if (
          e.target.closest("[data-close-sheet]") ||
          e.target.closest("[data-close-modal]") ||
          e.target.closest(".standard-modal__close") ||
          e.target.closest(".bottom-sheet__close")
        ) {
          closeActiveModal();
          return;
        }

        // Check for card clicks that should open modals
        const card = e.target.closest(".standard-card[data-detail-type]");
        if (card) {
          const detailType = card.getAttribute("data-detail-type");
          if (detailType) {
            openModal(detailType, card);
          }
        }
      },
      { capture: false },
    );

    // ===========================================
    // PRESS EFFECT (mousedown/touchstart)
    // ===========================================
    document.addEventListener(
      "mousedown",
      (e) => {
        const card = e.target.closest(".standard-card");
        if (card) {
          handleCardPress(card);
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "touchstart",
      (e) => {
        const card = e.target.closest(".standard-card");
        if (card) {
          handleCardPress(card);
        }
      },
      { passive: true },
    );

    // ===========================================
    // RELEASE EFFECT (mouseup/touchend/mouseleave)
    // ===========================================
    document.addEventListener(
      "mouseup",
      (e) => {
        const card = e.target.closest(".standard-card");
        if (card) {
          handleCardRelease(card);
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "touchend",
      (e) => {
        const card = e.target.closest(".standard-card");
        if (card) {
          handleCardRelease(card);
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        const card = e.target.closest(".standard-card");
        if (card) {
          handleCardRelease(card);
        }
      },
      { passive: true, capture: true },
    );

    // ===========================================
    // KEYBOARD SUPPORT
    // ===========================================
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.activeModalId) {
        closeActiveModal();
      }
    });

    // ===========================================
    // BACKDROP CLICK - Already handled in getOrCreateBackdrop()
    // ===========================================

    // Mark as initialized
    global.MasterUIController._initialized = true;

    console.log(
      "[MasterUI] Initialization complete (Phase 4 - Single Backdrop)",
    );
  }

  // ===========================================
  // LEGACY COMPATIBILITY
  // ===========================================

  /**
   * Open a sheet (legacy ModalController compatibility)
   */
  function openSheet(idOrMetric, sourceElement) {
    openModal(idOrMetric, sourceElement);
  }

  /**
   * Close the current sheet (legacy ModalController compatibility)
   */
  function closeSheet() {
    closeActiveModal();
  }

  /**
   * Initialize (legacy ModalController compatibility)
   */
  function initModalController() {
    init();
  }

  // ===========================================
  // CLEANUP / DESTROY
  // ===========================================

  /**
   * Completely destroy the controller and clean up (Phase 4)
   */
  function destroy() {
    // Close all open modals
    closeAll();

    // Remove backdrop
    destroyBackdrop();

    // Remove body classes
    document.body.classList.remove("modal-open", "bg-dimmed", "scrim-active");
    document.documentElement.classList.remove(
      "modal-open",
      "bg-dimmed",
      "scrim-active",
    );

    // Reset state
    state = {
      activeModalId: null,
      modalStack: [],
      isAnimating: false,
      backdropElement: null,
      currentZIndex: 1000,
    };

    global.MasterUIController._initialized = false;
  }

  // ===========================================
  // EXPORT (Phase 4 - Extended API)
  // ===========================================
  global.MasterUIController = {
    // Main API
    init,
    openModal,
    closeActiveModal,
    closeAll,
    destroy,

    // Legacy compatibility (ModalController API)
    openSheet,
    closeSheet,
    initModalController,
    open: openModal,

    // State accessors
    isModalOpen: () => !!state.activeModalId,
    getActiveModalId: () => state.activeModalId,
    getModalStack: () => [...state.modalStack],

    // Internal flag
    _initialized: false,
  };

  // Also expose as ModalController for backwards compatibility
  global.ModalController = global.MasterUIController;
})(window);
