(function () {
  var statusEl = document.getElementById("status");
  var waitEl = document.getElementById("invite-wait");
  var safariNote = document.getElementById("invite-safari");
  var heyEl = document.getElementById("invite-hey");
  var dotsEl = document.getElementById("gate-dots");
  var padEl = document.getElementById("gate-pad");
  var HASH_STORE = "yprompt.pinHash";
  var LOCK_STORE = "yprompt.gateLock";
  var FAIL_STORE = "yprompt.gateFails";
  var typed = "";
  var pending = "";
  var need = 6;
  var busy = false;
  var lockedUntil = 0;
  var lockTimer = 0;
  var phase = "enter";

  function hasHash() {
    try { return !!(localStorage.getItem(HASH_STORE) || ""); } catch (e) { return false; }
  }

  function paintHey() {
    if (!heyEl) return;
    if (!hasHash()) heyEl.textContent = phase === "confirm" ? "再輸入一次" : "請設定數字門";
    else heyEl.textContent = "請輸入密碼";
  }

  function startWait() {
    if (heyEl) heyEl.hidden = true;
    if (padEl) padEl.hidden = true;
    if (dotsEl) dotsEl.hidden = true;
    if (waitEl) waitEl.hidden = false;
    if (statusEl) statusEl.textContent = "";
  }

  function paintDots() {
    if (!dotsEl) return;
    var html = "";
    var i;
    for (i = 0; i < need; i += 1) html += i < typed.length ? '<span class="is-on"></span>' : "<span></span>";
    dotsEl.innerHTML = html;
  }

  function lockLeft() { return Math.max(0, lockedUntil - Date.now()); }

  function paintLock() {
    var left = lockLeft();
    if (padEl) padEl.classList.toggle("is-off", left > 0 || busy);
    if (left <= 0) {
      if (statusEl && (statusEl.textContent || "").indexOf("分鐘") >= 0) statusEl.textContent = "";
      return;
    }
    if (statusEl) statusEl.textContent = "請" + Math.max(1, Math.ceil(left / 60000)) + "分鐘後再試";
  }

  function setLock(sec) {
    lockedUntil = Date.now() + Math.max(0, Number(sec) || 0) * 1000;
    try { localStorage.setItem(LOCK_STORE, String(lockedUntil)); } catch (e) {}
    paintLock();
    if (lockTimer) clearInterval(lockTimer);
    if (lockLeft() > 0) {
      lockTimer = setInterval(function () {
        if (lockLeft() <= 0) {
          clearInterval(lockTimer);
          lockTimer = 0;
          try { localStorage.removeItem(LOCK_STORE); } catch (e) {}
        }
        paintLock();
      }, 1000);
    }
  }

  function restoreLock() {
    var until = 0;
    try { until = Number(localStorage.getItem(LOCK_STORE) || 0) || 0; } catch (e) {}
    if (until > Date.now()) setLock((until - Date.now()) / 1000);
  }

  function clearTyped() { typed = ""; paintDots(); }

  function shake() {
    if (!dotsEl) return;
    dotsEl.classList.remove("is-bad");
    void dotsEl.offsetWidth;
    dotsEl.classList.add("is-bad");
  }

  function sha256(text) {
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest("SHA-256", enc).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function tokenFromPin(pin) {
    return "yp" + pin.split("").reverse().join("") + "k";
  }

  function goHome(token) {
    try { sessionStorage.setItem("yprompt.gateOk", "1"); } catch (e) {}
    window.FamiGate.savePersonal(token);
    window.YPROMPT_VIEW_KEY = token;
    window.YPROMPT_NEED_GATE = false;
    document.documentElement.classList.remove("need-gate");
    document.documentElement.classList.add("gate-ok");
    startWait();
    if (window.YPromptDesk && window.YPromptDesk.enterAfterGate) {
      window.YPromptDesk.enterAfterGate(token);
    }
  }

  function failPin() {
    var n = 0;
    try { n = Number(localStorage.getItem(FAIL_STORE) || 0) || 0; } catch (e) {}
    n += 1;
    try { localStorage.setItem(FAIL_STORE, String(n)); } catch (e) {}
    if (n >= 3) {
      try { localStorage.setItem(FAIL_STORE, "0"); } catch (e) {}
      setLock(600);
    }
    clearTyped();
    shake();
    busy = false;
    paintLock();
  }

  function submit() {
    if (lockLeft() > 0) return;
    if (typed.length !== need) return;
    if (busy) return;
    busy = true;
    paintLock();
    if (!hasHash()) {
      if (phase !== "confirm") {
        pending = typed;
        phase = "confirm";
        typed = "";
        busy = false;
        paintHey();
        paintDots();
        paintLock();
        return;
      }
      if (typed !== pending) {
        phase = "set";
        pending = "";
        failPin();
        paintHey();
        return;
      }
      sha256(typed).then(function (hash) {
        try { localStorage.setItem(HASH_STORE, hash); } catch (e) {}
        try { localStorage.setItem(FAIL_STORE, "0"); } catch (e) {}
        goHome(tokenFromPin(typed));
      }).catch(function () {
        busy = false;
        paintLock();
        if (statusEl) statusEl.textContent = "這台瀏覽器無法設定門";
      });
      return;
    }
    var stored = "";
    try { stored = localStorage.getItem(HASH_STORE) || ""; } catch (e) {}
    sha256(typed).then(function (hash) {
      if (hash === stored) {
        try { localStorage.setItem(FAIL_STORE, "0"); } catch (e) {}
        goHome(tokenFromPin(typed));
        return;
      }
      failPin();
    }).catch(function () {
      busy = false;
      paintLock();
      if (statusEl) statusEl.textContent = "這台瀏覽器無法開門";
    });
  }

  function pushDigit(n) {
    if (busy || lockLeft() > 0) return;
    if (!/^\d$/.test(n)) return;
    if (typed.length >= need) return;
    typed += n;
    paintDots();
    if (typed.length >= need) submit();
  }

  function popDigit() {
    if (busy || lockLeft() > 0) return;
    if (!typed) return;
    typed = typed.slice(0, -1);
    paintDots();
  }

  if (safariNote && window.FamiGate && window.FamiGate.needsSafari()) safariNote.hidden = false;
  if (window.FamiGate) {
    window.FamiGate.blockWebChrome();
    window.FamiGate.bindKeyboard();
  }
  restoreLock();
  phase = hasHash() ? "enter" : "set";
  paintHey();
  paintDots();
  paintLock();

  if (padEl) {
    padEl.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest(".gate-key") : null;
      if (!btn) return;
      if (btn.getAttribute("data-del") === "1") popDigit();
      else pushDigit(btn.getAttribute("data-num") || "");
    });
  }
})();
