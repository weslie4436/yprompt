(function () {
  var REFUSALS = [
    { label: "未成年", re: /(未成年|小學生|小学生|幼女|loli|shota|兒童|儿童|小孩|underage|\b1[0-7]\s*歲)/i },
    { label: "真實私人", re: /(同學|同事|前任|鄰居|偷拍|實名|深偽|deepfake)/i },
    { label: "非合意", re: /(迷姦|迷奸|睡姦|睡奸|下藥|非自願|強姦|强奸)/i },
  ];
  var EN = [
    ["色情的黑色綁帶暴露胸罩", "black strappy revealing bra"],
    ["黑色綁帶暴露胸罩", "black strappy revealing bra"],
    ["黑色蕾絲丁字褲", "black lace thong"],
    ["在攝影棚播報新聞", "presenting the news to camera in a television studio"],
    ["穿著日本主播的樣子", "dressed in Japanese TV announcer styling with earpiece and studio makeup"],
    ["穿著", "wearing "],
    ["日本主播的樣子", "Japanese TV announcer styling with earpiece and studio makeup"],
    ["露出奶頭", "nipples visible"],
    ["三立新聞主播", "TV news presenter at an anchor desk"],
    ["三立新聞", "TV news studio"],
    ["新聞主播", "TV news presenter"],
    ["攝影棚", "television studio"],
    ["播報新聞", "presenting the news to camera"],
    ["在棚播報新聞", "presenting the news to camera in the studio"],
    ["日本20歲女性", "20-year-old adult Japanese woman"],
    ["一個日本20歲女性", "a 20-year-old adult Japanese woman"],
    ["20歲女性", "20-year-old adult woman"],
    ["20歲", "20-year-old adult"],
    ["巨乳", "very large breasts"],
    ["主播", "news presenter"],
    ["胸罩", "bra"],
    ["丁字褲", "thong"],
    ["女性", "woman"],
    ["日本", "Japanese"],
  ];
  var FINISH = {
    anime: {
      zh: "動漫插畫，線條清楚。柔和側光，半身近景。",
      en: "anime illustration, clean linework, soft side light, medium close-up",
    },
    photo: {
      zh: "寫實電影感。攝影棚燈光，柔和側光，半身近景，85mm。",
      en: "photoreal cinematic still, studio key light, soft side light, medium close-up, 85mm",
    },
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
    if (/\bl4\b|高暴露|半遮|露出奶|露奶|丁字/.test(t)) return "l4";
    if (/\bl3\b|半裸|露胸/.test(t)) return "l3";
    if (/\bl1\b|著衣|着衣|剪影|封面/.test(t)) return "l1";
    return "l2";
  }

  function guessStyle(text) {
    if (/寫實|写实|photoreal|\bphoto\b/i.test(text || "")) return "photo";
    return "anime";
  }

  function guessLang(text) {
    if (/全中文|只要中文/.test(text || "")) return "zh";
    if (/全英文|只要英文/.test(text || "")) return "en";
    return "mix";
  }

  function cleanBrief(brief) {
    var body = String(brief || "");
    body = body.replace(/\b(l[1-5]|全中文|只要中文|全英文|只要英文)\b/gi, "");
    body = body.replace(/(不要|別|别)\s*(全裸|脫光|脱光)/g, "");
    body = body.replace(/[，,]{2,}/g, "，").replace(/\s+/g, " ").replace(/^[，,\s]+|[，,\s]+$/g, "");
    return body;
  }

  function toEnglish(body) {
    var out = body;
    var pairs = EN.slice().sort(function (a, b) { return b[0].length - a[0].length; });
    var i;
    for (i = 0; i < pairs.length; i += 1) {
      out = out.split(pairs[i][0]).join(pairs[i][1]);
    }
    out = out.replace(/[，]/g, ", ").replace(/。/g, ". ").replace(/、/g, ", ");
    out = out.replace(/([\u4e00-\u9fff])([A-Za-z])/g, "$1 $2");
    out = out.replace(/([A-Za-z])([\u4e00-\u9fff])/g, "$1 $2");
    out = out.replace(/\s+,/g, ",").replace(/,+/g, ",").replace(/\s+/g, " ").replace(/^[,\s.]+|[,\s.]+$/g, "");
    if (!out) out = "a fictional adult woman looking at camera";
    return out;
  }

  function compile(brief, level, style, lang) {
    var hit = refuse(brief || "");
    if (hit) return { ok: false, text: hit, level: "", style: "", lang: "" };
    level = String(level || guessLevel(brief)).toLowerCase();
    style = String(style || guessStyle(brief)).toLowerCase();
    lang = String(lang || guessLang(brief)).toLowerCase();
    if (!FINISH[style]) style = "anime";
    if (!/^(l[1-5])$/.test(level)) level = "l2";
    var body = cleanBrief(brief);
    if (!body) body = "虛構成年女性，站姿，看向鏡頭";
    var fin = FINISH[style];
    var zh = "虛構成年。" + body + "。" + fin.zh;
    var en = "Fictional adult. " + toEnglish(body) + ". " + fin.en + ".";
    var mix = "虛構成年。" + body + "。 " + fin.en + ".";
    var text = lang === "zh" ? zh : lang === "en" ? en : mix;
    return { ok: true, text: text, level: level, style: style, lang: lang, brief: body };
  }

  window.YPromptCompile = { compile: compile, guessLevel: guessLevel, guessStyle: guessStyle, guessLang: guessLang };
})();
