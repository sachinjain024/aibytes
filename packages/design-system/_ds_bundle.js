/* @ds-bundle: {"format":4,"namespace":"LedgerAiBytesDesignSystem_b1be4f","components":[{"name":"SourceMark","sourcePath":"components/brand/SourceMark.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"SOURCE_NAMES","sourcePath":"components/content/Card.jsx"},{"name":"Signals","sourcePath":"components/content/Card.jsx"},{"name":"LangDot","sourcePath":"components/content/Card.jsx"},{"name":"Card","sourcePath":"components/content/Card.jsx"},{"name":"CardMenu","sourcePath":"components/content/CardMenu.jsx"},{"name":"EmptyState","sourcePath":"components/content/EmptyState.jsx"},{"name":"EndCard","sourcePath":"components/content/EndCard.jsx"},{"name":"ListRow","sourcePath":"components/content/ListRow.jsx"},{"name":"SaveBanner","sourcePath":"components/content/SaveBanner.jsx"},{"name":"SaveStar","sourcePath":"components/content/SaveStar.jsx"},{"name":"SectionHeading","sourcePath":"components/content/SectionHeading.jsx"},{"name":"Tag","sourcePath":"components/content/Tag.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"CalendarPopover","sourcePath":"components/navigation/CalendarPopover.jsx"},{"name":"Chip","sourcePath":"components/navigation/Chip.jsx"},{"name":"EditionBar","sourcePath":"components/navigation/EditionBar.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"Header","sourcePath":"components/navigation/Header.jsx"},{"name":"SideNavItem","sourcePath":"components/navigation/SideNav.jsx"},{"name":"SideNav","sourcePath":"components/navigation/SideNav.jsx"}],"sourceHashes":{"components/brand/SourceMark.jsx":"996a93033d44","components/brand/Wordmark.jsx":"9f398aa6c0da","components/content/Card.jsx":"2f5edfad269b","components/content/CardMenu.jsx":"607dc46ce42d","components/content/EmptyState.jsx":"6953327f3db4","components/content/EndCard.jsx":"6e50dfaff8ba","components/content/ListRow.jsx":"ffa86199049b","components/content/SaveBanner.jsx":"b30aef20be2d","components/content/SaveStar.jsx":"95c03f851b4d","components/content/SectionHeading.jsx":"3a975261fc5f","components/content/Tag.jsx":"bb96e2c6a1bb","components/forms/Button.jsx":"5fe93df06780","components/forms/Input.jsx":"cce052313a11","components/navigation/CalendarPopover.jsx":"1c0ed003baba","components/navigation/Chip.jsx":"a160bf1bae7f","components/navigation/EditionBar.jsx":"a377c10b4218","components/navigation/Footer.jsx":"e6e1af773745","components/navigation/Header.jsx":"424417ad84f7","components/navigation/SideNav.jsx":"0e7fd44716b3","ui_kits/aibytes-app/App.jsx":"c97df293aa4c","ui_kits/aibytes-app/data.js":"cb716a1ed472","ui_kits/aibytes-app/tweaks-panel.jsx":"d259e3a86f73"},"inlinedExternals":[],"unexposedExports":[{"name":"bubble","sourcePath":"components/content/Card.jsx"},{"name":"fmtNum","sourcePath":"components/content/Card.jsx"}]} */

(() => {

const __ds_ns = (window.LedgerAiBytesDesignSystem_b1be4f = window.LedgerAiBytesDesignSystem_b1be4f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/SourceMark.jsx
try { (() => {
const NAMES = {
  producthunt: "Product Hunt",
  hackernews: "Hacker News",
  github: "GitHub",
  techcrunch: "TechCrunch"
};
function SourceMark({
  source,
  size = 40,
  className = ""
}) {
  const r = size * 0.2,
    title = NAMES[source] || source;
  if (source === "hackernews") return /*#__PURE__*/React.createElement("svg", {
    className: className,
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    role: "img",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("rect", {
    width: "40",
    height: "40",
    rx: "8",
    fill: "var(--hot)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12.5 10.5 20 22.5m7.5-12L20 22.5m0 0V30",
    fill: "none",
    stroke: "#FFF",
    strokeWidth: "4"
  }));
  if (source === "github") return /*#__PURE__*/React.createElement("svg", {
    className: className,
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    role: "img",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("g", {
    transform: "translate(8 8)"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "var(--text)",
    d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
  })));
  if (source === "techcrunch") return /*#__PURE__*/React.createElement("svg", {
    className: className,
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    role: "img",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("rect", {
    width: "40",
    height: "40",
    rx: "8",
    fill: "#FFF"
  }), /*#__PURE__*/React.createElement("rect", {
    x: ".5",
    y: ".5",
    width: "39",
    height: "39",
    rx: "7.5",
    fill: "none",
    stroke: "var(--border)"
  }), /*#__PURE__*/React.createElement("g", {
    fill: "#0A9928"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 12h13v5h-4v11H11V17H7z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 12h11v5h-6v6h6v5H22z"
  })));
  return /*#__PURE__*/React.createElement("svg", {
    className: className,
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    role: "img",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("rect", {
    width: "40",
    height: "40",
    rx: "8",
    fill: "#FFF"
  }), /*#__PURE__*/React.createElement("rect", {
    x: ".5",
    y: ".5",
    width: "39",
    height: "39",
    rx: "7.5",
    fill: "none",
    stroke: "var(--border)"
  }), /*#__PURE__*/React.createElement("g", {
    transform: "translate(8 8)"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#FF6154",
    d: "M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.8 0-.995-.806-1.8-1.801-1.8zm0 6h-3.405V18H7.801V6h5.803c2.319 0 4.2 1.88 4.2 4.2 0 2.319-1.881 4.2-4.2 4.2zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0z"
  })));
}
Object.assign(__ds_scope, { SourceMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SourceMark.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function Wordmark({
  variant = "full",
  href = "/"
}) {
  if (variant === "icon") return /*#__PURE__*/React.createElement("span", {
    className: "ldg-wordmark ldg-wordmark--icon",
    role: "img",
    "aria-label": "aiBytes_"
  }, "aB", /*#__PURE__*/React.createElement("em", null, "_"));
  const cls = "ldg-wordmark ldg-wordmark--" + variant;
  return /*#__PURE__*/React.createElement("a", {
    className: cls,
    href: href,
    "aria-label": "aiBytes_ \u2014 latest edition"
  }, "\u26A1 aiBytes", /*#__PURE__*/React.createElement("em", null, "_"));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/content/CardMenu.jsx
try { (() => {
const enc = (t, u) => encodeURIComponent('Read and discuss: "' + t + '" — ' + (u && u !== "#" ? u : ""));
const iKebab = /*#__PURE__*/React.createElement("svg", {
  width: "14",
  height: "14",
  viewBox: "0 0 16 16",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "8",
  cy: "3",
  r: "1.4",
  fill: "currentColor"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "8",
  cy: "8",
  r: "1.4",
  fill: "currentColor"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "8",
  cy: "13",
  r: "1.4",
  fill: "currentColor"
}));
const iChatGPT = /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  fill: "currentColor",
  d: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.0615v5.5826a4.504 4.504 0 0 1-4.4945 4.4849zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
}));
const iClaude = /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("g", {
  stroke: "#D97757",
  strokeWidth: "2.2",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 2.5v4.2M12 17.3v4.2M2.5 12h4.2M17.3 12h4.2M5.3 5.3l3 3M15.7 15.7l3 3M18.7 5.3l-3 3M8.3 15.7l-3 3"
})));
const iGemini = /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  fill: "#4E86FF",
  d: "M12 0c.7 6.5 5.5 11.3 12 12-6.5.7-11.3 5.5-12 12-.7-6.5-5.5-11.3-12-12C6.5 11.3 11.3 6.5 12 0z"
}));
const TARGETS = [{
  label: "ChatGPT",
  icon: iChatGPT,
  href: it => "https://chatgpt.com/?q=" + enc(it.title, it.url)
}, {
  label: "Claude",
  icon: iClaude,
  href: it => "https://claude.ai/new?q=" + enc(it.title, it.url)
}, {
  label: "Gemini",
  icon: iGemini,
  href: () => "https://gemini.google.com/app"
}];
function CardMenu({
  item,
  up = true
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    className: "ldg-menu"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-menu__btn",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-label": "More actions for " + item.title,
    onClick: () => setOpen(o => !o)
  }, iKebab), open && /*#__PURE__*/React.createElement("span", {
    className: "ldg-menu__panel" + (up ? " ldg-menu__panel--up" : ""),
    role: "menu"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ldg-menu__item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ldg-menu__label"
  }, "Open in"), /*#__PURE__*/React.createElement("span", {
    className: "ldg-menu__icons"
  }, TARGETS.map(t => /*#__PURE__*/React.createElement("a", {
    key: t.label,
    className: "ldg-menu__icon",
    role: "menuitem",
    "aria-label": "Open in " + t.label,
    title: t.label,
    href: t.href(item),
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => setOpen(false)
  }, t.icon))))));
}
Object.assign(__ds_scope, { CardMenu });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/CardMenu.jsx", error: String((e && e.message) || e) }); }

// components/content/EmptyState.jsx
try { (() => {
function EmptyState({
  category,
  prevLabel,
  prevCount,
  onPrev
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ldg-endcard",
    role: "status"
  }, "No ", category, " in this edition.", prevLabel != null && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("a", {
    href: "#prev",
    onClick: e => {
      e.preventDefault();
      onPrev && onPrev();
    }
  }, "\u2190 ", prevLabel, " had ", prevCount, ".")));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/content/EndCard.jsx
try { (() => {
function EndCard({
  dateLabel,
  prevLabel,
  onPrev
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ldg-endcard",
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      marginRight: 20
    }
  }, "Thank you for reading. That's it for today."), prevLabel != null && /*#__PURE__*/React.createElement("a", {
    href: "#prev",
    onClick: e => {
      e.preventDefault();
      onPrev && onPrev();
    }
  }, "View Yesterday's bites"));
}
Object.assign(__ds_scope, { EndCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/EndCard.jsx", error: String((e && e.message) || e) }); }

// components/content/SaveBanner.jsx
try { (() => {
function SaveBanner({
  onSignIn,
  onDismiss
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ldg-banner",
    role: "status"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-banner__in"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Saved items are stored in this browser only. ", /*#__PURE__*/React.createElement("a", {
    href: "#signin",
    onClick: e => {
      e.preventDefault();
      onSignIn && onSignIn();
    }
  }, "Sign in with Google"), " to keep them across devices."), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-iconbtn",
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      width: 24,
      height: 24
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 2l8 8M10 2l-8 8",
    stroke: "currentColor",
    strokeWidth: "1.5"
  })))));
}
Object.assign(__ds_scope, { SaveBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SaveBanner.jsx", error: String((e && e.message) || e) }); }

// components/content/SaveStar.jsx
try { (() => {
function SaveStar({
  saved = false,
  onToggle,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-star" + (saved ? " ldg-star--saved" : "") + (className ? " " + className : ""),
    "aria-label": saved ? "Saved" : "Save",
    "aria-pressed": saved,
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.6 6.1 20.8l1.3-6.5L2.5 9.8 9.1 9z",
    fill: saved ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinejoin: "round"
  })));
}
Object.assign(__ds_scope, { SaveStar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SaveStar.jsx", error: String((e && e.message) || e) }); }

// components/content/Card.jsx
try { (() => {
const SOURCE_NAMES = {
  producthunt: "Product Hunt",
  hackernews: "Hacker News",
  github: "GitHub",
  techcrunch: "TechCrunch"
};
const LANG = {
  Python: "var(--lang-python)",
  TypeScript: "var(--lang-ts)",
  JavaScript: "var(--lang-ts)",
  Rust: "var(--lang-rust)",
  Go: "var(--lang-go)",
  "C++": "var(--lang-cpp)",
  Shell: "var(--lang-shell)",
  "Jupyter Notebook": "var(--lang-jupyter)"
};
const fmtNum = n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
const bubble = /*#__PURE__*/React.createElement("svg", {
  width: "11",
  height: "11",
  viewBox: "0 0 16 16",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M2.5 2.5h11v8h-6l-3 2.5v-2.5h-2z",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinejoin: "round"
}));
function Signals({
  signals = {},
  ariaHidden
}) {
  const parts = [];
  const pts = signals.upvotes ?? signals.points;
  if (pts != null) parts.push(/*#__PURE__*/React.createElement("span", {
    key: "p",
    title: "Upvotes"
  }, "\u25B2", fmtNum(pts)));
  if (signals.stars_gained != null) parts.push(/*#__PURE__*/React.createElement("span", {
    key: "s",
    title: "Stars gained today"
  }, "+", fmtNum(signals.stars_gained), " \u2605"));
  if (signals.comments != null) parts.push(/*#__PURE__*/React.createElement("span", {
    key: "c",
    title: "Comments"
  }, bubble, " ", fmtNum(signals.comments)));
  if (!parts.length) return null;
  return /*#__PURE__*/React.createElement("span", {
    className: "ldg-signals",
    "aria-hidden": ariaHidden
  }, parts);
}
function LangDot({
  language
}) {
  if (!language) return null;
  return /*#__PURE__*/React.createElement("span", {
    className: "ldg-lang"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: LANG[language] || "var(--lang-other)"
    }
  }), language);
}
function Card({
  item,
  topToday = false,
  saved = false,
  onToggleSave,
  signalsPos = "logo",
  tagStyle = "dots",
  maxTags = 3
}) {
  const sig = item.signals ? {
    upvotes: item.signals.upvotes,
    points: item.signals.points,
    stars_gained: item.signals.stars_gained
  } : undefined;
  const img = item.image || {};
  const hasImg = img.url && img.type !== "none";
  const circle = img.type === "avatar";
  const corner = signalsPos !== "bottom";
  const tags = (item.tags || []).slice(0, maxTags);
  const lang = item.meta && item.meta.language;
  const tagsEl = tagStyle === "pills" ? /*#__PURE__*/React.createElement("span", {
    className: "ldg-tagpills"
  }, lang ? /*#__PURE__*/React.createElement(LangDot, {
    language: lang
  }) : null, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "ldg-tagpill"
  }, t))) : tagStyle === "hash" ? /*#__PURE__*/React.createElement("span", {
    className: "ldg-tags ldg-tags--hash"
  }, lang ? /*#__PURE__*/React.createElement(LangDot, {
    language: lang
  }) : null, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "ldg-taghash"
  }, "#", t))) : /*#__PURE__*/React.createElement("span", {
    className: "ldg-tags"
  }, lang ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LangDot, {
    language: lang
  }), tags.length ? " · " : "") : null, tags.join(" · "));
  return /*#__PURE__*/React.createElement("article", {
    className: "ldg-card" + (topToday ? " ldg-card--top" : "") + (corner ? " ldg-card--corner" : "")
  }, /*#__PURE__*/React.createElement("span", {
    className: "ldg-card__left" + (signalsPos === "bottom" ? " ldg-card__left--stretch" : "")
  }, hasImg ? /*#__PURE__*/React.createElement("img", {
    className: "ldg-card__img" + (circle ? " ldg-card__img--circle" : ""),
    src: img.url,
    alt: "",
    width: "40",
    height: "40",
    loading: "lazy"
  }) : /*#__PURE__*/React.createElement(__ds_scope.SourceMark, {
    source: item.source,
    size: 40,
    className: "ldg-card__img" + (item.source === "github" ? " ldg-card__img--circle" : "")
  }), signalsPos === "bottom" && /*#__PURE__*/React.createElement(Signals, {
    signals: sig
  }), signalsPos === "logo" && sig && (sig.upvotes ?? sig.points) != null && /*#__PURE__*/React.createElement("span", {
    title: "Upvotes",
    style: {
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      letterSpacing: 'var(--tracking-mono)'
    }
  }, "\u25B2", fmtNum(sig.upvotes ?? sig.points)), signalsPos === "logo" && sig && sig.stars_gained != null && /*#__PURE__*/React.createElement(Signals, {
    signals: {
      stars_gained: sig.stars_gained
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "ldg-card__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-card__srcrow"
  }, topToday && /*#__PURE__*/React.createElement("span", {
    className: "ldg-top-label",
    title: "Top today"
  }, "TOP"), /*#__PURE__*/React.createElement("a", {
    href: item.source_url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, SOURCE_NAMES[item.source] || item.source), signalsPos === "source" && /*#__PURE__*/React.createElement(Signals, {
    signals: sig
  })), /*#__PURE__*/React.createElement("h3", {
    className: "ldg-card__title"
  }, /*#__PURE__*/React.createElement("a", {
    href: item.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, item.title)), /*#__PURE__*/React.createElement("p", {
    className: "ldg-card__summary"
  }, item.summary), signalsPos === "row" && /*#__PURE__*/React.createElement("div", {
    className: "ldg-card__sigrow"
  }, /*#__PURE__*/React.createElement(Signals, {
    signals: sig
  })), /*#__PURE__*/React.createElement("div", {
    className: "ldg-card__meta"
  }, tagsEl, !corner && /*#__PURE__*/React.createElement("span", {
    className: "ldg-card__actions"
  }, /*#__PURE__*/React.createElement(__ds_scope.CardMenu, {
    item: item
  })))), corner ? /*#__PURE__*/React.createElement("span", {
    className: "ldg-card__corner"
  }, /*#__PURE__*/React.createElement(__ds_scope.CardMenu, {
    item: item
  }), /*#__PURE__*/React.createElement(__ds_scope.SaveStar, {
    saved: saved,
    onToggle: () => onToggleSave && onToggleSave(item.id)
  })) : /*#__PURE__*/React.createElement(__ds_scope.SaveStar, {
    className: "ldg-card__star",
    saved: saved,
    onToggle: () => onToggleSave && onToggleSave(item.id)
  }));
}
Object.assign(__ds_scope, { SOURCE_NAMES, fmtNum, bubble, Signals, LangDot, Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Card.jsx", error: String((e && e.message) || e) }); }

// components/content/ListRow.jsx
try { (() => {
function ListRow({
  item,
  saved = false,
  onToggleSave
}) {
  const img = item.image || {};
  const hasImg = img.url && img.type !== "none";
  const sig = item.signals || {};
  const pts = sig.upvotes ?? sig.points;
  return /*#__PURE__*/React.createElement("div", {
    className: "ldg-row"
  }, hasImg ? /*#__PURE__*/React.createElement("img", {
    className: "ldg-row__img" + (img.type === "avatar" ? " ldg-row__img--circle" : ""),
    src: img.url,
    alt: "",
    width: "24",
    height: "24",
    loading: "lazy"
  }) : /*#__PURE__*/React.createElement(__ds_scope.SourceMark, {
    source: item.source,
    size: 24,
    className: "ldg-row__img"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ldg-row__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ldg-row__top"
  }, /*#__PURE__*/React.createElement("a", {
    className: "ldg-row__title",
    href: item.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, item.title)), /*#__PURE__*/React.createElement("span", {
    className: "ldg-row__summary"
  }, item.summary)), /*#__PURE__*/React.createElement("span", {
    className: "ldg-row__meta"
  }, __ds_scope.SOURCE_NAMES[item.source], pts != null && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 \u25B2", __ds_scope.fmtNum(pts)), sig.stars_gained != null && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 +", __ds_scope.fmtNum(sig.stars_gained), " \u2605"), sig.comments != null && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", __ds_scope.bubble, " ", __ds_scope.fmtNum(sig.comments))), /*#__PURE__*/React.createElement(__ds_scope.SaveStar, {
    saved: saved,
    onToggle: () => onToggleSave && onToggleSave(item.id)
  }), /*#__PURE__*/React.createElement(__ds_scope.CardMenu, {
    item: item,
    up: false
  }));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionHeading.jsx
try { (() => {
function SectionHeading({
  name,
  count,
  id
}) {
  return /*#__PURE__*/React.createElement("h2", {
    className: "ldg-section-h",
    id: id
  }, name, " ", /*#__PURE__*/React.createElement("span", {
    className: "ldg-count"
  }, "\xB7 ", count));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/content/Tag.jsx
try { (() => {
function Tag({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "ldg-tags"
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const G = /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 48 48",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  fill: "#EA4335",
  d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#4285F4",
  d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#FBBC05",
  d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#34A853",
  d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
}));
function Button({
  variant = "primary",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: "ldg-btn ldg-btn--" + variant,
    type: "button"
  }, rest), variant === "google" && G, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input(props) {
  return /*#__PURE__*/React.createElement("input", _extends({
    className: "ldg-input"
  }, props));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CalendarPopover.jsx
try { (() => {
function CalendarPopover({
  editions = [],
  currentDate,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ldg-cal",
    role: "listbox",
    "aria-label": "Available editions"
  }, editions.map(e => /*#__PURE__*/React.createElement("button", {
    key: e.date,
    type: "button",
    role: "option",
    "aria-selected": e.date === currentDate,
    className: "ldg-cal__row" + (e.date === currentDate ? " ldg-cal__row--current" : ""),
    onClick: () => onSelect && onSelect(e.date)
  }, /*#__PURE__*/React.createElement("span", null, e.label), /*#__PURE__*/React.createElement("span", {
    className: "ldg-count"
  }, e.count, " items"))));
}
Object.assign(__ds_scope, { CalendarPopover });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CalendarPopover.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Chip.jsx
try { (() => {
function Chip({
  label,
  active = false,
  disabled = false,
  count,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-chip",
    "aria-pressed": active,
    disabled: disabled,
    onClick: onClick
  }, label, count != null && /*#__PURE__*/React.createElement("span", {
    className: "ldg-chip__count"
  }, count));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Chip.jsx", error: String((e && e.message) || e) }); }

// components/navigation/EditionBar.jsx
try { (() => {
function EditionBar({
  dateLabel,
  itemCount,
  updatedAgo,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  onDateClick,
  calendarOpen = false,
  editions,
  currentDate,
  onSelectEdition,
  asH1 = true,
  compact = false
}) {
  const H = asH1 ? "h1" : "span";
  return /*#__PURE__*/React.createElement("div", {
    className: "ldg-edbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-edbar__in"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-edbar__nav",
    onClick: onPrev,
    disabled: !prevLabel,
    "aria-label": prevLabel ? "Previous edition, " + prevLabel : "No previous edition"
  }, "\u2190", !compact && prevLabel ? " " + prevLabel : ""), /*#__PURE__*/React.createElement(H, {
    style: {
      margin: 0,
      font: "inherit",
      letterSpacing: "inherit",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-edbar__date",
    onClick: onDateClick,
    "aria-haspopup": "listbox",
    "aria-expanded": calendarOpen
  }, /*#__PURE__*/React.createElement("strong", null, dateLabel), itemCount != null && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "ldg-edbar__sep"
  }, "\xB7"), itemCount, " items"), !compact && updatedAgo && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "ldg-edbar__sep"
  }, "\xB7"), "updated ", updatedAgo))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-edbar__nav",
    onClick: onNext,
    disabled: !nextLabel,
    "aria-label": nextLabel ? "Next edition, " + nextLabel : "This is the latest edition"
  }, !compact && nextLabel ? nextLabel + " " : "", "\u2192"), calendarOpen && editions && /*#__PURE__*/React.createElement(__ds_scope.CalendarPopover, {
    editions: editions,
    currentDate: currentDate,
    onSelect: onSelectEdition
  })));
}
Object.assign(__ds_scope, { EditionBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/EditionBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
const DEFAULT_LINKS = [{
  label: "Chrome Extension",
  href: "#extension"
}, {
  label: "GitHub",
  href: "#github"
}, {
  label: "X",
  href: "#x"
}, {
  label: "Advertise",
  href: "mailto:sachinjain.hq@gmail.com"
}];
function Footer({
  links = DEFAULT_LINKS,
  blurb = "Join 1K+ developers reading aiBytes_ weekly",
  onSubscribe
}) {
  return /*#__PURE__*/React.createElement("footer", {
    className: "ldg-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-footer__in"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "ldg-footer__links",
    "aria-label": "Footer"
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href
  }, l.label))), /*#__PURE__*/React.createElement("form", {
    className: "ldg-footer__sub",
    onSubmit: e => {
      e.preventDefault();
      onSubscribe && onSubscribe();
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "center",
      marginRight: 4
    }
  }, blurb), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    type: "submit"
  }, "Subscribe"))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Header.jsx
try { (() => {
const iGrid = /*#__PURE__*/React.createElement("svg", {
  width: "14",
  height: "14",
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z",
  fill: "currentColor"
}));
const iList = /*#__PURE__*/React.createElement("svg", {
  width: "14",
  height: "14",
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M1 2.5h12M1 7h12M1 11.5h12",
  stroke: "currentColor",
  strokeWidth: "1.8"
}));
const iSun = /*#__PURE__*/React.createElement("svg", {
  width: "15",
  height: "15",
  viewBox: "0 0 24 24",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4.5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8",
  stroke: "currentColor",
  strokeWidth: "1.7"
}));
const iMoon = /*#__PURE__*/React.createElement("svg", {
  width: "15",
  height: "15",
  viewBox: "0 0 24 24",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.7",
  strokeLinejoin: "round"
}));
function Header({
  categories = [],
  activeCategory = "all",
  onCategory,
  savedCount = 0,
  savedActive = false,
  onSaved,
  tagCount = 0,
  onOpenTags,
  sourceCount = 0,
  onOpenSources,
  view = "grid",
  onView,
  theme = "light",
  onToggleTheme,
  signedIn = false,
  userInitial = "S",
  onSignIn,
  compact = false,
  mode = "ranked",
  onMode,
  showCategories = true,
  tagline
}) {
  const brand = tagline ? /*#__PURE__*/React.createElement("span", {
    className: "ldg-header__brand"
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    variant: "compact"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ldg-header__tagline"
  }, tagline)) : /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    variant: "compact"
  });
  const chips = !showCategories ? null : /*#__PURE__*/React.createElement("nav", {
    className: "ldg-header__chips",
    "aria-label": "Categories"
  }, /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    label: "All",
    active: activeCategory === "all" && !savedActive,
    onClick: () => onCategory && onCategory("all")
  }), categories.map(c => /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    key: c.key,
    label: c.label,
    count: c.count,
    active: activeCategory === c.key && !savedActive,
    onClick: () => onCategory && onCategory(c.key)
  })), savedCount > 0 && /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    label: "Saved",
    count: savedCount,
    active: savedActive,
    onClick: onSaved
  }));
  const tools = /*#__PURE__*/React.createElement("div", {
    className: "ldg-header__tools"
  }, onMode && /*#__PURE__*/React.createElement("span", {
    className: "ldg-seg",
    role: "group",
    "aria-label": "Feed order"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-seg__btn",
    "aria-pressed": mode === "ranked",
    onClick: () => onMode("ranked")
  }, "Ranked"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-seg__btn",
    "aria-pressed": mode === "grouped",
    onClick: () => onMode("grouped")
  }, "Grouped")), !compact && /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    label: "Tags \u25BE",
    count: tagCount || undefined,
    active: tagCount > 0,
    onClick: onOpenTags
  }), !compact && /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    label: "Sources \u25BE",
    count: sourceCount || undefined,
    active: sourceCount > 0,
    onClick: onOpenSources
  }), /*#__PURE__*/React.createElement("span", {
    className: "ldg-seg",
    role: "group",
    "aria-label": "View"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-iconbtn",
    "aria-pressed": view === "grid",
    "aria-label": "Grid view",
    onClick: () => onView && onView("grid")
  }, iGrid), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-iconbtn",
    "aria-pressed": view === "list",
    "aria-label": "List view",
    onClick: () => onView && onView("list")
  }, iList)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-iconbtn",
    "aria-label": theme === "light" ? "Switch to dark theme" : "Switch to light theme",
    onClick: onToggleTheme
  }, theme === "light" ? iMoon : iSun), signedIn ? /*#__PURE__*/React.createElement("span", {
    className: "ldg-avatar",
    title: "Signed in"
  }, userInitial) : /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    onClick: onSignIn
  }, "Sign in"));
  if (compact) return /*#__PURE__*/React.createElement("header", {
    className: "ldg-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-header__in",
    style: {
      paddingBottom: chips ? 6 : undefined
    }
  }, brand, tools), chips && /*#__PURE__*/React.createElement("div", {
    className: "ldg-header__in",
    style: {
      paddingTop: 0
    }
  }, chips));
  return /*#__PURE__*/React.createElement("header", {
    className: "ldg-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-header__in"
  }, brand, chips, tools));
}
Object.assign(__ds_scope, { Header });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Header.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SideNav.jsx
try { (() => {
function SideNavItem({
  label,
  count,
  active,
  onClick,
  star
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-nav__item",
    "aria-current": active || undefined,
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    className: "ldg-nav__text"
  }, star ? active ? "\u2605 " : "\u2606 " : "", label), count != null && count > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ldg-nav__count"
  }, count));
}
function SideNav({
  categories = [],
  activeCategory = "all",
  onCategory,
  allCount,
  savedLabel = "My Starred",
  savedCount = 0,
  savedActive = false,
  onSaved,
  dateMain,
  dateNote,
  dateSub,
  prevLabel,
  onPrev,
  nextLabel,
  onNext,
  editions = [],
  currentDate,
  onSelectEdition,
  calendarOpen,
  onToggleCalendar,
  children
}) {
  const [openU, setOpenU] = React.useState(false);
  const open = calendarOpen != null ? calendarOpen : openU;
  const toggleCal = onToggleCalendar || (() => setOpenU(o => !o));
  return /*#__PURE__*/React.createElement("aside", {
    className: "ldg-sidenav",
    "aria-label": "Categories"
  }, dateMain && /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__date"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__date-main"
  }, dateMain, dateNote && /*#__PURE__*/React.createElement("span", {
    className: "ldg-nav__date-sub",
    style: {
      fontWeight: 400,
      marginLeft: 6
    }
  }, dateNote)), dateSub && /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__date-sub"
  }, dateSub), /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__date-links"
  }, prevLabel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-nav__link",
    onClick: onPrev
  }, "\u2190 ", prevLabel), nextLabel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-nav__link",
    onClick: onNext
  }, nextLabel, " \u2192"), editions.length > 0 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ldg-nav__link",
    style: {
      marginLeft: "auto"
    },
    "aria-expanded": open,
    onClick: toggleCal
  }, "Pick a date ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: 9,
      verticalAlign: 1
    }
  }, open ? "▲" : "▼"))), open && editions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__dates",
    role: "listbox",
    "aria-label": "Editions"
  }, editions.map(e => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: e.date,
    className: "ldg-nav__item",
    "aria-current": e.date === currentDate || undefined,
    onClick: () => onSelectEdition && onSelectEdition(e.date)
  }, /*#__PURE__*/React.createElement("span", {
    className: "ldg-nav__text"
  }, e.label), /*#__PURE__*/React.createElement("span", {
    className: "ldg-nav__count"
  }, e.count))))), /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__label"
  }, "Categories"), /*#__PURE__*/React.createElement(SideNavItem, {
    label: "All",
    count: allCount,
    active: activeCategory === "all",
    onClick: () => onCategory && onCategory("all")
  }), categories.map(c => /*#__PURE__*/React.createElement(SideNavItem, {
    key: c.key,
    label: c.label,
    count: c.count,
    active: activeCategory === c.key,
    onClick: () => onCategory && onCategory(c.key)
  })), (onSaved || savedCount > 0) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ldg-nav__label"
  }, "Library"), /*#__PURE__*/React.createElement(SideNavItem, {
    label: savedLabel,
    count: savedCount,
    active: savedActive,
    onClick: onSaved,
    star: true
  })), children);
}
Object.assign(__ds_scope, { SideNavItem, SideNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SideNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aibytes-app/App.jsx
try { (() => {
/* aiBytes_ app — loaded as text/babel; composes Ledger bundle components. */
const NS = window.LedgerAiBytesDesignSystem_b1be4f || {};
if (!NS.Header) document.body.insertAdjacentHTML("afterbegin", '<p style="font-family:monospace;font-size:13px;padding:16px">Ledger bundle not compiled yet — reload in a moment (_ds_bundle.js missing).</p>');
const {
  Header,
  EditionBar,
  SaveBanner,
  Card,
  ListRow,
  SectionHeading,
  EmptyState,
  EndCard,
  Footer,
  Chip,
  SourceMark,
  SideNav
} = NS;
const D = window.LEDGER_DATA;
function TagPanel({
  selected,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "app-pop",
    role: "group",
    "aria-label": "Filter by tag"
  }, Object.entries(D.tagGroups).map(([group, tags]) => /*#__PURE__*/React.createElement("div", {
    key: group
  }, /*#__PURE__*/React.createElement("div", {
    className: "app-pop__label"
  }, group), /*#__PURE__*/React.createElement("div", {
    className: "app-pop__chips",
    style: {
      marginTop: 6
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    label: t,
    active: selected.has(t),
    onClick: () => onToggle(t)
  }))))));
}
function SourcePanel({
  selected,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "app-pop",
    style: {
      width: 300
    },
    role: "group",
    "aria-label": "Filter by source"
  }, /*#__PURE__*/React.createElement("div", {
    className: "app-pop__label"
  }, "Sources"), /*#__PURE__*/React.createElement("div", {
    className: "app-pop__chips"
  }, D.sources.map(s => /*#__PURE__*/React.createElement(Chip, {
    key: s.key,
    label: s.label,
    active: selected.has(s.key),
    onClick: () => onToggle(s.key)
  }))));
}
function AiBytesApp(props) {
  const [edition, setEdition] = React.useState(props.edition0 || D.order[D.order.length - 1]);
  const [theme, setTheme] = React.useState(props.theme0 || "light");
  const [view, setView] = React.useState(props.view0 || "grid");
  const [cat, setCat] = React.useState(props.cat0 || "all");
  const [tags, setTags] = React.useState(new Set(props.tags0 || []));
  const [sources, setSources] = React.useState(new Set(props.sources0 || []));
  const [saved, setSaved] = React.useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("aibytes-saved") || "[]");
      return new Set(s.length ? s : props.saved0 || []);
    } catch (e) {
      return new Set(props.saved0 || []);
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("aibytes-saved", JSON.stringify([...saved]));
    } catch (e) {}
  }, [saved]);
  const [savedView, setSavedView] = React.useState(!!props.savedView0);
  const [calOpen, setCalOpen] = React.useState(!!props.calOpen0);
  const [signedIn, setSignedIn] = React.useState(!!props.signedIn0);
  const [bannerGone, setBannerGone] = React.useState(false);
  const [tagsOpen, setTagsOpen] = React.useState(!!props.tagsOpen0);
  const [mode, setMode] = React.useState(props.mode0 || "ranked");
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const compact = !!props.compact;
  const shellRef = React.useRef(null);
  React.useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const cluster = shell.querySelector(".app-sticky");
    if (!cluster) return;
    const set = () => shell.style.setProperty("--ldg-header-h", cluster.offsetHeight + "px");
    set();
    const ro = new ResizeObserver(set);
    ro.observe(cluster);
    return () => ro.disconnect();
  });
  const sideNav = props.nav === "side" && !compact;
  const ed = D.editions[edition];
  const idx = D.order.indexOf(edition);
  const prevKey = D.order[idx - 1],
    nextKey = D.order[idx + 1];
  const editionsList = D.order.slice().reverse().map(k => ({
    date: k,
    label: D.editions[k].mid,
    count: D.editions[k].items.length
  }));
  const inSet = (set, setter) => v => setter(s => {
    const n = new Set(s);
    n.has(v) ? n.delete(v) : n.add(v);
    return n;
  });
  const match = it => (cat === "all" || it.category === cat) && (!tags.size || (it.tags || []).some(t => tags.has(t))) && (!sources.size || sources.has(it.source));
  const catCount = k => ed.items.filter(i => i.category === k).length;
  const prevWith = key => {
    for (let i = idx - 1; i >= 0; i--) {
      const c = D.editions[D.order[i]].items.filter(x => x.category === key).length;
      if (c > 0) return {
        short: D.editions[D.order[i]].short,
        count: c,
        date: D.order[i]
      };
    }
    return null;
  };
  const renderItems = its => view === "grid" ? /*#__PURE__*/React.createElement("div", {
    className: "app-grid" + (compact ? " app-grid--one" : "")
  }, its.map(i => /*#__PURE__*/React.createElement(Card, {
    key: i.id,
    item: i,
    topToday: !!i.top,
    saved: saved.has(i.id),
    onToggleSave: inSet(saved, setSaved),
    signalsPos: props.cardSignals,
    tagStyle: props.cardTags
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "app-rows"
  }, its.map(i => /*#__PURE__*/React.createElement(ListRow, {
    key: i.id,
    item: i,
    saved: saved.has(i.id),
    onToggleSave: inSet(saved, setSaved)
  })));
  let body;
  if (savedView) {
    const groups = D.order.slice().reverse().map(k => ({
      k,
      its: D.editions[k].items.filter(i => saved.has(i.id))
    })).filter(g => g.its.length);
    body = groups.length ? groups.map(g => /*#__PURE__*/React.createElement("section", {
      className: "app-sec",
      key: g.k
    }, /*#__PURE__*/React.createElement(SectionHeading, {
      name: D.editions[g.k].mid,
      count: g.its.length
    }), " ", renderItems(g.its))) : /*#__PURE__*/React.createElement("div", {
      className: "ldg-endcard"
    }, "Nothing saved yet. Tap \u2606 on any card to keep it here.");
  } else if (mode === "ranked") {
    const sig = i => Math.max(i.signals?.upvotes || 0, i.signals?.points || 0, (i.signals?.stars_gained || 0) / 8);
    const its = ed.items.filter(match).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || sig(b) - sig(a));
    body = its.length ? /*#__PURE__*/React.createElement("section", {
      className: "app-sec"
    }, renderItems(its)) : /*#__PURE__*/React.createElement("section", {
      className: "app-sec"
    }, /*#__PURE__*/React.createElement(EmptyState, {
      category: "items matching this filter",
      prevLabel: prevKey ? D.editions[prevKey].short : undefined,
      prevCount: prevKey ? D.editions[prevKey].items.length : undefined,
      onPrev: () => setEdition(prevKey)
    }));
  } else {
    const cats = D.categories.filter(c => cat === "all" || c.key === cat);
    body = cats.map(c => {
      const its = ed.items.filter(i => i.category === c.key).filter(match);
      if (!its.length && cat !== "all") {
        const p = prevWith(c.key);
        return /*#__PURE__*/React.createElement("section", {
          className: "app-sec",
          key: c.key
        }, /*#__PURE__*/React.createElement(EmptyState, {
          category: c.label,
          prevLabel: p && p.short,
          prevCount: p && p.count,
          onPrev: () => {
            p && setEdition(p.date);
          }
        }));
      }
      if (!its.length) return null;
      return /*#__PURE__*/React.createElement("section", {
        className: "app-sec",
        key: c.key
      }, /*#__PURE__*/React.createElement(SectionHeading, {
        name: c.label,
        count: its.length,
        id: c.key
      }), renderItems(its));
    });
  }
  const cluster = /*#__PURE__*/React.createElement("div", {
    className: "app-sticky"
  }, /*#__PURE__*/React.createElement(Header, {
    compact: compact,
    showCategories: !sideNav,
    tagline: props.tagline,
    categories: D.categories.map(c => ({
      ...c,
      count: catCount(c.key)
    })),
    activeCategory: cat,
    onCategory: k => {
      setCat(k);
      setSavedView(false);
    },
    savedCount: saved.size,
    savedActive: savedView,
    onSaved: () => setSavedView(v => !v),
    mode: mode,
    onMode: setMode,
    tagCount: tags.size,
    onOpenTags: () => {
      setTagsOpen(o => !o);
      setSourcesOpen(false);
    },
    sourceCount: sources.size,
    onOpenSources: () => {
      setSourcesOpen(o => !o);
      setTagsOpen(false);
    },
    view: view,
    onView: setView,
    theme: theme,
    onToggleTheme: () => setTheme(t => t === "light" ? "dark" : "light"),
    signedIn: signedIn,
    userInitial: "S",
    onSignIn: () => setSignedIn(true)
  }), !savedView && !sideNav && /*#__PURE__*/React.createElement(EditionBar, {
    compact: compact,
    dateLabel: compact ? ed.mid : ed.label,
    itemCount: ed.items.length,
    updatedAgo: ed.updated || undefined,
    prevLabel: prevKey ? D.editions[prevKey].short : undefined,
    nextLabel: nextKey ? D.editions[nextKey].short : undefined,
    onPrev: () => setEdition(prevKey),
    onNext: () => setEdition(nextKey),
    onDateClick: () => setCalOpen(o => !o),
    calendarOpen: calOpen,
    editions: editionsList,
    currentDate: edition,
    onSelectEdition: d => {
      setEdition(d);
      setCalOpen(false);
    }
  }), tagsOpen && /*#__PURE__*/React.createElement(TagPanel, {
    selected: tags,
    onToggle: inSet(tags, setTags)
  }), sourcesOpen && /*#__PURE__*/React.createElement(SourcePanel, {
    selected: sources,
    onToggle: inSet(sources, setSources)
  }));
  const isLatest = idx === D.order.length - 1;
  const daysAgo = D.order.length - 1 - idx;
  const sidenav = sideNav && /*#__PURE__*/React.createElement(SideNav, {
    dateMain: savedView ? undefined : isLatest ? "Today" : ed.short,
    dateNote: isLatest ? `(${ed.mid})` : undefined,
    dateSub: isLatest ? undefined : `${ed.mid} · ${daysAgo}${daysAgo === 1 ? " day ago" : " days ago"}`,
    prevLabel: prevKey ? isLatest ? "Yesterday" : D.editions[prevKey].short : undefined,
    onPrev: () => setEdition(prevKey),
    nextLabel: nextKey ? "Latest" : undefined,
    onNext: () => setEdition(D.order[D.order.length - 1]),
    editions: editionsList,
    currentDate: edition,
    onSelectEdition: d => {
      setEdition(d);
      setCalOpen(false);
    },
    calendarOpen: calOpen,
    onToggleCalendar: () => setCalOpen(o => !o),
    categories: D.categories.map(c => ({
      ...c,
      count: catCount(c.key)
    })),
    activeCategory: savedView ? "" : cat,
    onCategory: k => {
      setCat(k);
      setSavedView(false);
    },
    allCount: ed.items.length,
    savedLabel: "My Starred",
    savedCount: saved.size,
    savedActive: savedView,
    onSaved: () => setSavedView(v => !v)
  });
  const banner = saved.size > 0 && !signedIn && /*#__PURE__*/React.createElement(SaveBanner, {
    onSignIn: () => setSignedIn(true)
  });
  if (props.headerOnly) return /*#__PURE__*/React.createElement("div", {
    className: "app-shell",
    "data-theme": theme === "dark" ? "dark" : undefined,
    style: {
      minHeight: 0
    }
  }, cluster, banner);
  return /*#__PURE__*/React.createElement("div", {
    ref: shellRef,
    className: "app-shell" + (compact ? " app-phone" : "") + (sideNav ? " app-shell--full" : ""),
    "data-theme": theme === "dark" ? "dark" : undefined
  }, cluster, banner, /*#__PURE__*/React.createElement("div", {
    className: sideNav ? "app-cols" : undefined
  }, sidenav, /*#__PURE__*/React.createElement("main", {
    className: "app-main",
    style: compact ? {
      padding: "16px 20px"
    } : undefined
  }, body, !savedView && /*#__PURE__*/React.createElement(EndCard, {
    dateLabel: ed.short,
    prevLabel: prevKey ? D.editions[prevKey].short : undefined,
    onPrev: () => setEdition(prevKey)
  }))), /*#__PURE__*/React.createElement(Footer, null));
}
window.AiBytesApp = AiBytesApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aibytes-app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aibytes-app/data.js
try { (() => {
window.LEDGER_DATA = (() => {
  const editions = {
    "2026-08-27": {
      label: "Wed, Aug 27, 2026",
      mid: "Wed, Aug 27",
      short: "Aug 27",
      updated: "4h ago",
      items: [{
        id: "ph-chatcut",
        rank: 1,
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "ChatCut",
        summary: "AI video editor inside ChatGPT with a real timeline and XML export.",
        tags: ["Video", "Dev Tool"],
        signals: {
          upvotes: 776,
          comments: 42
        },
        top: true
      }, {
        id: "ph-relay",
        rank: 4,
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "Relay Agents",
        summary: "Build and deploy browser agents from plain-English runbooks.",
        tags: ["Agents", "Dev Tool"],
        signals: {
          upvotes: 431,
          comments: 23
        }
      }, {
        id: "ph-voiceloop",
        rank: 13,
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "VoiceLoop",
        summary: "Real-time voice agents with barge-in, built from a single prompt.",
        tags: ["Voice / Speech", "SDK"],
        signals: {
          upvotes: 254,
          comments: 11
        }
      }, {
        id: "hn-tinyeval",
        rank: 11,
        category: "launches",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Show HN: TinyEval – an eval harness in a single Python file",
        summary: "300 lines, no dependencies, runs against any OpenAI-compatible endpoint.",
        tags: ["Show HN", "Eval"],
        signals: {
          points: 212,
          comments: 87
        }
      }, {
        id: "gh-officecli",
        rank: 2,
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "OfficeCLI",
        summary: "Create and edit Word, Excel, and PowerPoint files from the command line.",
        tags: ["CLI", "Open Source"],
        signals: {
          stars_gained: 6400
        },
        meta: {
          language: "Python"
        }
      }, {
        id: "gh-inference-lite",
        rank: 6,
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "inference-lite",
        summary: "Single-binary inference server for Mistral models on consumer GPUs.",
        tags: ["Inference", "Local LLM"],
        signals: {
          stars_gained: 2100
        },
        meta: {
          language: "Rust"
        }
      }, {
        id: "gh-agent-traces",
        rank: 10,
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "agent-traces",
        summary: "Record, replay, and diff agent runs across model versions.",
        tags: ["Agents", "Eval"],
        signals: {
          stars_gained: 1300
        },
        meta: {
          language: "TypeScript"
        }
      }, {
        id: "gh-awesome-mcp",
        rank: 14,
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "awesome-mcp-servers",
        summary: "A curated list of MCP servers, updated daily.",
        tags: ["MCP", "Open Source"],
        signals: {
          stars_gained: 900
        }
      }, {
        id: "tc-apple",
        rank: 7,
        category: "news",
        source: "techcrunch",
        source_url: "#tc",
        url: "#",
        title: "Apple holds talks with OpenAI over a revamped Siri",
        summary: "The deal would put a long-context model behind Siri as soon as next spring.",
        tags: ["Apple", "OpenAI"]
      }, {
        id: "tc-anthropic",
        rank: 9,
        category: "news",
        source: "techcrunch",
        source_url: "#tc",
        url: "#",
        title: "Anthropic ships sandboxed execution for Claude Code teams",
        summary: "Enterprise plans get isolated runtimes and audit logs for agent sessions.",
        tags: ["Anthropic", "Claude Code", "Security"]
      }, {
        id: "tc-euact",
        rank: 15,
        category: "news",
        source: "techcrunch",
        source_url: "#tc",
        url: "#",
        title: "EU begins enforcing AI Act rules for foundation models",
        summary: "Model providers now face documentation and incident-reporting duties.",
        tags: ["Policy"]
      }, {
        id: "hn-claudecode",
        rank: 3,
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Claude Code sends 33k tokens before you type anything",
        summary: "A teardown of the system prompt, tool schemas, and what they cost you.",
        tags: ["Claude Code", "Hot Take"],
        signals: {
          points: 699,
          comments: 412
        }
      }, {
        id: "hn-sqlite",
        rank: 5,
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "SQLite as a vector database is fine, actually",
        summary: "Benchmarks against pgvector and a case for boring infrastructure.",
        tags: ["Embeddings", "Opinion"],
        signals: {
          points: 512,
          comments: 233
        }
      }, {
        id: "hn-postmortem",
        rank: 8,
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Postmortem: our agent deleted the staging database",
        summary: "What over-broad tool permissions cost us, and the guardrails we added.",
        tags: ["Agents", "Deep Dive"],
        signals: {
          points: 441,
          comments: 301
        }
      }, {
        id: "hn-offline",
        rank: 12,
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Ask HN: Who runs LLMs fully offline in production?",
        summary: "Air-gapped deployments, quantization tradeoffs, and what breaks first.",
        tags: ["Local LLM"],
        signals: {
          points: 358,
          comments: 190
        }
      }]
    },
    "2026-08-26": {
      label: "Tue, Aug 26, 2026",
      mid: "Tue, Aug 26",
      short: "Aug 26",
      updated: null,
      items: [{
        id: "ph-plancast",
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "Plancast",
        summary: "Turn a product spec into a clickable prototype with one prompt.",
        tags: ["Dev Tool", "Agents"],
        signals: {
          upvotes: 389,
          comments: 31
        },
        top: true
      }, {
        id: "ph-datale",
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "Datale",
        summary: "Natural-language SQL sessions that compile to dbt models.",
        tags: ["Dev Tool", "Code Gen"],
        signals: {
          upvotes: 276,
          comments: 18
        }
      }, {
        id: "hn-ragmail",
        category: "launches",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Show HN: I built a local-first RAG for my email",
        summary: "Everything on-device: embeddings, index, and a tiny reranker.",
        tags: ["Show HN", "RAG", "Local LLM"],
        signals: {
          points: 189,
          comments: 96
        }
      }, {
        id: "tc-openai-hw",
        category: "news",
        source: "techcrunch",
        source_url: "#tc",
        url: "#",
        title: "OpenAI's hardware team shows first device prototypes internally",
        summary: "A screenless companion device, according to two people familiar.",
        tags: ["OpenAI"]
      }, {
        id: "tc-nvidia",
        category: "news",
        source: "techcrunch",
        source_url: "#tc",
        url: "#",
        title: "Nvidia earnings: data-center revenue up 64% on inference demand",
        summary: "Inference now outweighs training in hyperscaler orders, the company says.",
        tags: ["Nvidia"]
      }, {
        id: "hn-context",
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Context engineering is just cache management",
        summary: "An argument for treating prompts like a memory hierarchy.",
        tags: ["LLM", "Opinion"],
        signals: {
          points: 421,
          comments: 187
        }
      }, {
        id: "hn-agentbill",
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "The bill for our agents came due",
        summary: "Six months of agent infra in production: costs, failures, wins.",
        tags: ["Agents", "Deep Dive"],
        signals: {
          points: 533,
          comments: 264
        }
      }, {
        id: "hn-quant",
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Quantization-aware training, explained with pictures",
        summary: "From fp16 to int4 without the hand-waving.",
        tags: ["Fine-tuning", "Tutorial"],
        signals: {
          points: 302,
          comments: 88
        }
      }]
    },
    "2026-08-25": {
      label: "Mon, Aug 25, 2026",
      mid: "Mon, Aug 25",
      short: "Aug 25",
      updated: null,
      items: [{
        id: "gh-llmlint",
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "llmlint",
        summary: "Static analysis for prompts: catch injection risks in CI.",
        tags: ["Security", "CLI"],
        signals: {
          stars_gained: 1800
        },
        meta: {
          language: "Python"
        },
        top: true
      }, {
        id: "gh-vecpack",
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "vecpack",
        summary: "Compress embedding indexes 4x with product quantization.",
        tags: ["Embeddings", "Library"],
        signals: {
          stars_gained: 1100
        },
        meta: {
          language: "Rust"
        }
      }, {
        id: "gh-mcp-kit",
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "mcp-kit",
        summary: "Batteries-included TypeScript SDK for building MCP servers.",
        tags: ["MCP", "SDK"],
        signals: {
          stars_gained: 740
        },
        meta: {
          language: "TypeScript"
        }
      }, {
        id: "ph-briefly",
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "Briefly",
        summary: "Meeting notes that write themselves into your issue tracker.",
        tags: ["Dev Tool"],
        signals: {
          upvotes: 512,
          comments: 29
        }
      }, {
        id: "hn-goodhart",
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Your evals are Goodharting you",
        summary: "Why leaderboard gains keep failing to show up in production.",
        tags: ["Eval", "Opinion"],
        signals: {
          points: 468,
          comments: 211
        }
      }]
    },
    "2026-08-22": {
      label: "Fri, Aug 22, 2026",
      mid: "Fri, Aug 22",
      short: "Aug 22",
      updated: null,
      items: [{
        id: "ph-stackpilot",
        category: "launches",
        source: "producthunt",
        source_url: "#ph",
        url: "#",
        title: "Stackpilot",
        summary: "AI code review that comments like your strictest teammate.",
        tags: ["Code Gen", "Dev Tool"],
        signals: {
          upvotes: 603,
          comments: 48
        },
        top: true
      }, {
        id: "gh-tokencost",
        category: "repos",
        source: "github",
        source_url: "#gh",
        url: "#",
        title: "tokencost",
        summary: "Track LLM spend per feature with one decorator.",
        tags: ["SDK", "Open Source"],
        signals: {
          stars_gained: 950
        },
        meta: {
          language: "Python"
        }
      }, {
        id: "tc-meta",
        category: "news",
        source: "techcrunch",
        source_url: "#tc",
        url: "#",
        title: "Meta releases open weights for a 7B on-device model",
        summary: "Benchmarks put it ahead of last year's mid-tier cloud models.",
        tags: ["Meta", "Model Release", "Open Source"]
      }, {
        id: "hn-localgood",
        category: "hn",
        source: "hackernews",
        source_url: "#hn",
        url: "#",
        title: "Local models are good enough now",
        summary: "A working developer's honest audit of a cloud-free month.",
        tags: ["Local LLM", "Opinion"],
        signals: {
          points: 387,
          comments: 245
        }
      }]
    }
  };
  return {
    editions,
    order: ["2026-08-22", "2026-08-25", "2026-08-26", "2026-08-27"],
    categories: [{
      key: "launches",
      label: "New Products"
    }, {
      key: "repos",
      label: "Trending Dev Projects"
    }, {
      key: "news",
      label: "AI News"
    }, {
      key: "hn",
      label: "HN Threads"
    }],
    sources: [{
      key: "producthunt",
      label: "Product Hunt"
    }, {
      key: "hackernews",
      label: "Hacker News"
    }, {
      key: "github",
      label: "GitHub"
    }, {
      key: "techcrunch",
      label: "TechCrunch"
    }],
    tagGroups: {
      "What it is": ["Model Release", "Open Source", "Paper", "Benchmark", "Dataset", "Framework", "Library", "Dev Tool", "CLI", "SDK", "API"],
      "Domain": ["LLM", "Agents", "RAG", "Fine-tuning", "Inference", "Local LLM", "Vision", "Voice / Speech", "Video", "Image Gen", "Code Gen", "Embeddings", "Eval"],
      "Ecosystem": ["OpenAI", "Anthropic", "Google", "Meta", "Nvidia", "Hugging Face", "Mistral", "xAI", "Apple", "Microsoft", "Claude Code", "Cursor", "MCP"],
      "Business": ["Funding", "Acquisition", "Launch", "Pricing", "Policy", "Legal", "Security", "Privacy"],
      "Format": ["Show HN", "Tutorial", "Deep Dive", "Opinion", "Interview", "Hot Take"]
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aibytes-app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/aibytes-app/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aibytes-app/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.SourceMark = __ds_scope.SourceMark;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.SOURCE_NAMES = __ds_scope.SOURCE_NAMES;

__ds_ns.Signals = __ds_scope.Signals;

__ds_ns.LangDot = __ds_scope.LangDot;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardMenu = __ds_scope.CardMenu;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.EndCard = __ds_scope.EndCard;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.SaveBanner = __ds_scope.SaveBanner;

__ds_ns.SaveStar = __ds_scope.SaveStar;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.CalendarPopover = __ds_scope.CalendarPopover;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.EditionBar = __ds_scope.EditionBar;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Header = __ds_scope.Header;

__ds_ns.SideNavItem = __ds_scope.SideNavItem;

__ds_ns.SideNav = __ds_scope.SideNav;

})();
