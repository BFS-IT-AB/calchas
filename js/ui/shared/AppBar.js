(function (global) {
  function initAppBar() {
    const appBar = document.getElementById("app-bar");
    if (!appBar) return;

    // expect markup already in HTML; here we only wire dynamic bits later if needed
  }

  global.AppBar = { initAppBar };
})(window);
