// Click Debug Script - Minimal
(function () {
  console.log(
    "%c=== CLICK DEBUG LOADED ===",
    "background: blue; color: white; font-size: 16px;",
  );

  // Expose test function
  window.testSheet = function () {
    const overlay = document.getElementById("bottom-sheet-overlay");
    const sheet = document.querySelector(".bottom-sheet");

    console.log("=== TEST SHEET ===");
    console.log("Overlay:", overlay);
    console.log("Sheet:", sheet);

    if (overlay) {
      overlay.classList.add("is-open");
      console.log("Added is-open class to overlay");
      console.log("Overlay classes:", overlay.className);
      console.log("Overlay display:", getComputedStyle(overlay).display);
    }

    if (sheet) {
      sheet.classList.add("bottom-sheet--visible");
      console.log("Added bottom-sheet--visible class to sheet");
      console.log("Sheet display:", getComputedStyle(sheet).display);
      console.log("Sheet opacity:", getComputedStyle(sheet).opacity);
    }
  };

  // Log all clicks
  document.addEventListener(
    "click",
    function (e) {
      console.log(
        "Click:",
        e.target.tagName,
        e.target.id || e.target.className,
      );
    },
    true,
  );

  console.log("%c💡 Type testSheet() to test", "color: cyan;");
})();
