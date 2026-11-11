(function () {
  var KEY_RE = /^[A-Za-z0-9_-]{8,128}$/;
  var STORE = "yprompt.viewKey";
  var INSTALLED = "yprompt.installed";

  function typingField(target) {
    var el = target && target.nodeType === 3 ? target.parentElement : target;
    if (!el) return false;
    if (el.closest && el.closest("input, textarea, [contenteditable='true']")) return true;
    var ae = document.activeElement;
    return !!(ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable));
  }

  function blockWebChrome() {
    document.addEventListener("contextmenu", function (e) {
      if (typingField(e.target)) return;
      e.preventDefault();
    }, true);
    document.addEventListener("selectstart", function (e) {
      if (typingField(e.target)) return;
      e.preventDefault();
    }, true);
    document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  }

  function bindKeyboard() {
    var vv = window.visualViewport;
    if (!vv) return;
    var painted = -1;
    var kbOn = false;
    function apply() {
      var lift = Math.max(0, window.innerHeight - vv.height);
      document.documentElement.style.setProperty("--vvh", Math.round(vv.height) + "px");
      document.documentElement.style.setProperty("--vv-top", Math.round(vv.offsetTop) + "px");
      if (Math.abs(lift - painted) >= 8) {
        painted = lift;
        document.documentElement.style.setProperty("--kb", Math.round(lift) + "px");
      }
      if (lift > 100) kbOn = true;
      else if (lift < 40) kbOn = false;
      document.documentElement.classList.toggle("kb-up", kbOn);
    }
    vv.addEventListener("resize", apply);
    window.addEventListener("orientationchange", function () {
      apply();
      setTimeout(apply, 160);
      setTimeout(apply, 480);
    });
    apply();
  }

  function lockSheetPage(mask) {
    if (!mask || mask.dataset.sheetLock) return;
    mask.dataset.sheetLock = "1";
    var lastY = 0;
    function paintOpen() {
      var open = !!document.querySelector(".batch-tag-mask:not([hidden]), .ask-mask:not([hidden]), .list-tag-mask:not([hidden])");
      document.documentElement.classList.toggle("tag-modal-open", open);
    }
    paintOpen();
    if (window.MutationObserver) {
      new MutationObserver(paintOpen).observe(mask, { attributes: true, attributeFilter: ["hidden"] });
    }
    mask.addEventListener("touchstart", function (ev) {
      if (ev.touches && ev.touches[0]) lastY = ev.touches[0].clientY;
    }, { passive: true });
    mask.addEventListener("touchmove", function (ev) {
      var node = ev.target && ev.target.nodeType === 1 ? ev.target : ev.target && ev.target.parentElement;
      var scroller = node && node.closest && node.closest(".list-tag-body, .tag-picker-suggest, .prompt-out");
      var y = ev.touches && ev.touches[0] ? ev.touches[0].clientY : lastY;
      var dy = y - lastY;
      lastY = y;
      if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
        var atTop = scroller.scrollTop <= 0 && dy > 0;
        var atBot = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 && dy < 0;
        if (!atTop && !atBot) return;
      }
      ev.preventDefault();
    }, { passive: false });
  }

  function needsSafari() {
    var ua = navigator.userAgent || "";
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
    return ios && !safari && !window.navigator.standalone;
  }

  function isIPhone() {
    return /iPhone|iPod/.test(navigator.userAgent || "");
  }

  function savePersonal(token) {
    if (!KEY_RE.test(token || "")) return;
    try { localStorage.setItem(STORE, token); } catch (e) {}
  }

  window.FamiGate = {
    KEY_RE: KEY_RE,
    STORE: STORE,
    INSTALLED: INSTALLED,
    blockWebChrome: blockWebChrome,
    bindKeyboard: bindKeyboard,
    lockSheetPage: lockSheetPage,
    needsSafari: needsSafari,
    isIPhone: isIPhone,
    savePersonal: savePersonal,
  };
})();
