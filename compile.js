(function () {
  var REFUSALS = [
    { label: "未成年", re: /(未成年|小學生|小学生|幼女|loli|shota|兒童|儿童|小孩|underage|\b1[0-7]\s*歲)/i },
    { label: "真實私人", re: /(同學|同事|前任|鄰居|偷拍|實名|深偽|deepfake)/i },
    { label: "非合意", re: /(迷姦|迷奸|睡姦|睡奸|下藥|非自願|強姦|强奸)/i },
  ];
  var LEVELS = {
    l1: "著衣剪影，袍或洋裝穿好繫上，遮胸遮髖",
    l2: "仍穿著，單肩滑落或領口走光一處，髖仍蓋住",
    l3: "半裸：上身解開或褪到肘，髖仍裹住",
    l4: "高暴露但仍有布料：胸可讀、下身沿腰帶可讀，不寫解剖",
    l5: "無穿在身上的衣服；私處用光與姿態暗示，不寫解剖名詞",
  };
  var STYLES = {
    anime: { zh: "動漫／插畫風格，線條清楚，成人角色", en: "anime illustration, adult character, clean linework" },
    photo: { zh: "寫實攝影，成人角色，電影感光", en: "photoreal cinematic still, adult character" },
  };

  function refuse(text) {
    var i;
    for (i = 0; i < REFUSALS.length; i += 1) {
      if (REFUSALS[i].re.test(text)) return "拒絕：" + REFUSALS[i].label + "。不出提示詞。";
    }
    return "";
  }

  function guessLevel(text) {
    var t = String(text || "").toLowerCase();
    var denied = /(不要|別|别|非).{0,4}(全裸|脫光|脱光)/.test(t);
    if (/\bl5\b/.test(t) || (/(全裸|脫光|脱光)/.test(t) && !denied)) return "l5";
    if (/\bl4\b|高暴露|半遮/.test(t)) return "l4";
    if (/\bl3\b|半裸|露胸/.test(t)) return "l3";
    if (/\bl1\b|著衣|着衣|剪影|封面/.test(t)) return "l1";
    return "l2";
  }

  function guessStyle(text) {
    if (/寫實|写实|攝影|摄影|photo/i.test(text || "")) return "photo";
    return "anime";
  }

  function guessLang(text) {
    if (/全中文|只要中文/.test(text || "")) return "zh";
    if (/全英文|只要英文/.test(text || "")) return "en";
    return "mix";
  }

  function compile(brief, level, style, lang) {
    var hit = refuse(brief || "");
    if (hit) return { ok: false, text: hit, level: "", style: "", lang: "" };
    level = String(level || guessLevel(brief)).toLowerCase();
    style = String(style || guessStyle(brief)).toLowerCase();
    lang = String(lang || guessLang(brief)).toLowerCase();
    if (!LEVELS[level]) level = "l2";
    if (!STYLES[style]) style = "anime";
    var body = String(brief || "").replace(/\b(l[1-5]|全中文|只要中文|全英文|只要英文)\b/gi, "");
    body = body.replace(/動漫|动漫|寫實|写实|攝影|摄影/g, "");
    body = body.replace(/(不要|別|别)\s*(全裸|脫光|脱光)/g, "");
    body = body.replace(/[，,]{2,}/g, "，").replace(/\s+/g, " ").replace(/^[，,\s]+|[，,\s]+$/g, "");
    if (!body) body = "虛構成年女性，站姿，看向鏡頭";
    var wardrobe = LEVELS[level];
    var st = STYLES[style];
    var zh = "虛構成年角色。" + body + "。服裝檔 " + level.toUpperCase() + "：" + wardrobe + "。" + st.zh + "。柔和側光，半身近景，構圖清楚，手與腳數量正確。僅限合意的虛構成人。";
    var en = "Fictional adult character. " + body + ". Wardrobe " + level.toUpperCase() + ": " + wardrobe + ". " + st.en + ", soft side light, medium close-up, coherent anatomy, exactly two hands. Consensual fictional adult only.";
    var mix = body + "。服裝檔 " + level.toUpperCase() + "：" + wardrobe + "。" + st.en + ", soft side light, medium close-up, coherent anatomy. 虛構合意成人。";
    var text = lang === "zh" ? zh : lang === "en" ? en : mix;
    return { ok: true, text: text, level: level, style: style, lang: lang, brief: body };
  }

  window.YPromptCompile = { compile: compile, guessLevel: guessLevel, guessStyle: guessStyle, guessLang: guessLang, LEVELS: LEVELS };
})();
