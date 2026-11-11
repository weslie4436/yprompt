(function () {
  var LOG_KEY = "yprompt.logs";
  var FACE_KEY = "yprompt.face";
  var BG_KEY = "yprompt.backdrop";
  var hall = document.getElementById("hall");
  var homeHead = document.getElementById("home-head");
  var cabHud = document.getElementById("cab-hud");
  var desk = document.getElementById("prompt-desk");
  var feed = document.getElementById("feed");
  var briefEl = document.getElementById("prompt-brief");
  var outEl = document.getElementById("prompt-out");
  var copyBtn = document.getElementById("prompt-copy");
  var level = "l2";
  var style = "anime";
  var lang = "mix";
  var mode = "compile";
  var current = null;
  var selected = {};

  function logs() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveLogs(rows) {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(rows.slice(0, 80))); } catch (e) {}
  }

  function showHome() {
    if (hall) {
      hall.classList.remove("is-invite", "is-booting");
    }
    if (homeHead) homeHead.hidden = false;
    if (cabHud) cabHud.hidden = false;
    var wait = document.getElementById("invite-wait");
    if (wait) wait.hidden = true;
    paintFace();
    paintBg();
    setMode(mode);
    maybeInstall();
  }

  function paintFace() {
    var img = document.getElementById("face-img");
    var data = "";
    try { data = localStorage.getItem(FACE_KEY) || ""; } catch (e) {}
    if (img && data) img.src = data;
  }

  function paintBg() {
    var bg = document.getElementById("stage-bg");
    var data = "";
    try { data = localStorage.getItem(BG_KEY) || ""; } catch (e) {}
    if (!bg) return;
    if (data) {
      bg.hidden = false;
      bg.style.backgroundImage = "url(" + data + ")";
    } else {
      bg.hidden = true;
      bg.style.backgroundImage = "";
    }
  }

  function setPills(name, value) {
    document.querySelectorAll('[data-group="' + name + '"]').forEach(function (btn) {
      btn.classList.toggle("is-on", btn.getAttribute("data-val") === value);
    });
  }

  function runCompile() {
    var brief = (briefEl && briefEl.value) || "";
    var result = window.YPromptCompile.compile(brief, level, style, lang);
    current = result;
    if (outEl) {
      outEl.hidden = false;
      outEl.textContent = result.text;
    }
    if (copyBtn) copyBtn.hidden = !result.ok;
    document.getElementById("prompt-verdict").hidden = !result.ok;
    return result;
  }

  function remember(verdict) {
    if (!current || !current.ok) return;
    var rows = logs();
    rows.unshift({
      id: String(Date.now()),
      brief: current.brief,
      prompt: current.text,
      level: current.level,
      style: current.style,
      lang: current.lang,
      verdict: verdict || "",
      fav: false,
      ts: Date.now(),
    });
    saveLogs(rows);
    if (mode !== "compile") paintFeed();
  }

  function paintFeed() {
    if (!feed) return;
    var rows = logs();
    if (mode === "fav") rows = rows.filter(function (r) { return r.fav; });
    feed.innerHTML = "";
    rows.forEach(function (row) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.setAttribute("data-id", row.id);
      if (selected[row.id]) tile.classList.add("is-on");
      var title = document.createElement("span");
      title.className = "tile-name";
      title.textContent = row.brief || "提示詞";
      tile.appendChild(title);
      if (row.fav) {
        var heart = document.createElement("span");
        heart.className = "tile-heart";
        heart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20C10.5 18.4 7.3 15.8 5.4 11.9C4 9.1 5.2 6 8.4 6c1.8 0 3 1.1 3.6 2.2C12.6 7.1 13.8 6 15.6 6c3.2 0 4.4 3.1 3 5.9C16.7 15.8 13.5 18.4 12 20Z"/></svg>';
        tile.appendChild(heart);
      }
      feed.appendChild(tile);
    });
    var add = document.createElement("button");
    add.type = "button";
    add.className = "tile tile-add";
    add.id = "tile-add";
    add.innerHTML = '<span class="tile-plus">+</span>';
    feed.appendChild(add);
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll("#mode-bar .mode-btn").forEach(function (btn) {
      btn.classList.toggle("is-on", btn.getAttribute("data-mode") === mode);
    });
    var compiling = mode === "compile";
    if (desk) desk.hidden = !compiling;
    if (feed) feed.hidden = compiling;
    if (!compiling) paintFeed();
    closeRail();
  }

  function openRow(id) {
    var row = logs().filter(function (r) { return r.id === id; })[0];
    if (!row) return;
    if (briefEl) briefEl.value = row.brief;
    level = row.level || "l2";
    style = row.style || "anime";
    lang = row.lang || "mix";
    setPills("level", level);
    setPills("style", style);
    setPills("lang", lang);
    setMode("compile");
    runCompile();
  }

  function maybeInstall() {
    var layer = document.getElementById("home-install");
    if (!layer) return;
    var installed = "";
    try { installed = localStorage.getItem(window.FamiGate.INSTALLED) || ""; } catch (e) {}
    var iphone = window.FamiGate && window.FamiGate.isIPhone && window.FamiGate.isIPhone();
    var stand = window.navigator.standalone;
    if (iphone && stand !== true && installed !== "1") layer.hidden = false;
    else layer.hidden = true;
  }

  function closeRail() {
    selected = {};
    var rail = document.getElementById("photo-rail");
    if (rail) rail.hidden = true;
    if (feed) feed.querySelectorAll(".tile.is-on").forEach(function (t) { t.classList.remove("is-on"); });
  }

  function enterAfterGate() {
    showHome();
  }

  setPills("level", level);
  setPills("style", style);
  setPills("lang", lang);

  document.getElementById("mode-bar").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".mode-btn");
    if (!btn) return;
    setMode(btn.getAttribute("data-mode") || "compile");
  });
  document.querySelectorAll("[data-group]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.getAttribute("data-group");
      var val = btn.getAttribute("data-val");
      if (group === "level") level = val;
      if (group === "style") style = val;
      if (group === "lang") lang = val;
      setPills(group, val);
    });
  });
  document.getElementById("prompt-go").addEventListener("click", function () {
    runCompile();
  });
  copyBtn.addEventListener("click", function () {
    if (!current || !current.ok) return;
    var text = current.text;
    function ok() { remember(""); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, ok);
    } else ok();
  });
  document.getElementById("prompt-verdict").addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-verdict]");
    if (!btn) return;
    remember(btn.getAttribute("data-verdict") || "");
    document.querySelectorAll("#prompt-verdict .mode-btn").forEach(function (b) {
      b.classList.toggle("is-on", b === btn);
    });
  });
  feed.addEventListener("click", function (ev) {
    if (ev.target.closest("#tile-add")) {
      setMode("compile");
      return;
    }
    var tile = ev.target.closest(".tile");
    if (!tile || !tile.getAttribute("data-id")) return;
    var id = tile.getAttribute("data-id");
    if (Object.keys(selected).length) {
      if (selected[id]) delete selected[id];
      else selected[id] = true;
      tile.classList.toggle("is-on", !!selected[id]);
      document.getElementById("photo-rail").hidden = !Object.keys(selected).length;
      return;
    }
    openRow(id);
  });
  var holdTimer = 0;
  feed.addEventListener("pointerdown", function (ev) {
    var tile = ev.target.closest(".tile[data-id]");
    if (!tile) return;
    holdTimer = setTimeout(function () {
      selected[tile.getAttribute("data-id")] = true;
      tile.classList.add("is-on");
      document.getElementById("photo-rail").hidden = false;
    }, 520);
  });
  feed.addEventListener("pointerup", function () { clearTimeout(holdTimer); });
  feed.addEventListener("pointercancel", function () { clearTimeout(holdTimer); });
  feed.addEventListener("contextmenu", function (ev) {
    var tile = ev.target.closest(".tile[data-id]");
    if (!tile) return;
    ev.preventDefault();
  });
  document.getElementById("rail-heart").addEventListener("click", function () {
    var rows = logs();
    rows.forEach(function (r) {
      if (selected[r.id]) r.fav = !r.fav;
    });
    saveLogs(rows);
    closeRail();
    paintFeed();
  });
  document.getElementById("settingsToggle").addEventListener("click", function () {
    var menu = document.getElementById("settingsMenu");
    var open = menu.hidden;
    menu.hidden = !open;
    document.getElementById("settingsCatch").hidden = !open;
    document.getElementById("settingsToggle").setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.getElementById("settingsCatch").addEventListener("click", function () {
    document.getElementById("settingsMenu").hidden = true;
    document.getElementById("settingsCatch").hidden = true;
  });
  document.getElementById("settingsMenu").addEventListener("click", function (ev) {
    var job = ev.target.closest("[data-job]");
    if (!job) return;
    document.getElementById("settingsMenu").hidden = true;
    document.getElementById("settingsCatch").hidden = true;
    if (job.getAttribute("data-job") === "cover") document.getElementById("cover-input").click();
    if (job.getAttribute("data-job") === "backdrop") document.getElementById("backdrop-input").click();
  });
  function readFile(input, key, done) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try { localStorage.setItem(key, String(reader.result || "")); } catch (e) {}
      done();
    };
    reader.readAsDataURL(file);
    input.value = "";
  }
  document.getElementById("cover-input").addEventListener("change", function () {
    readFile(this, FACE_KEY, paintFace);
  });
  document.getElementById("backdrop-input").addEventListener("change", function () {
    readFile(this, BG_KEY, paintBg);
  });
  document.getElementById("home-installed").addEventListener("click", function () {
    try { localStorage.setItem(window.FamiGate.INSTALLED, "1"); } catch (e) {}
    document.getElementById("home-install").hidden = true;
  });

  if (!window.YPROMPT_NEED_GATE) showHome();

  window.YPromptDesk = { enterAfterGate: enterAfterGate };
})();
