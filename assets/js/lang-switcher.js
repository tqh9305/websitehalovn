/* ============================================================
   HALOVN — Language Switcher
   - Inject VI/EN toggle button into every page header
   - Apply [data-i18n] translations on load + on toggle
   - Persist preference to localStorage (key: halovn_lang)
   - Expose window.halovnT(key) for JS-rendered content
   ============================================================ */
(() => {
  'use strict';

  const T = window.HALOVN_TRANSLATIONS;
  if (!T) { console.warn('[i18n] HALOVN_TRANSLATIONS not loaded'); return; }

  let domObserver = null;

  /* ─── Helpers ─────────────────────────────────────────── */
  function getLang() {
    return localStorage.getItem('halovn_lang') || 'vi';
  }

  function getVal(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
  }

  /* ─── Expose global translate fn (for JS templates) ───── */
  window.halovnT = function (key) {
    const lang = window.HALOVN_LANG || getLang();
    return getVal(T[lang], key) ?? getVal(T['vi'], key) ?? key;
  };

  /* ─── Apply [data-i18n] to DOM ─────────────────────────── */
  function applyTranslations(lang) {
    const tbl = T[lang];
    if (!tbl) return;

    /* Pause observer so our own DOM writes don't retrigger it (avoid loop) */
    if (domObserver) domObserver.disconnect();

    /* Per-element flag: skip if already in this lang.
       Needed because innerHTML round-trips ("&" → "&amp;") never compare
       equal, which otherwise causes endless re-writes / observer churn. */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.i18nLang === lang) return;
      const val = getVal(tbl, el.dataset.i18n);
      if (val !== undefined) { el.textContent = val; el.dataset.i18nLang = lang; }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      if (el.dataset.i18nLang === lang) return;
      const val = getVal(tbl, el.dataset.i18nHtml);
      if (val !== undefined) { el.innerHTML = val; el.dataset.i18nLang = lang; }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = getVal(tbl, el.dataset.i18nPlaceholder);
      if (val !== undefined && el.placeholder !== val) el.placeholder = val;
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const val = getVal(tbl, el.dataset.i18nTitle);
      if (val !== undefined && el.title !== val) el.title = val;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const val = getVal(tbl, el.dataset.i18nAria);
      if (val !== undefined && el.getAttribute('aria-label') !== val) el.setAttribute('aria-label', val);
    });

    document.documentElement.lang = lang;
    window.HALOVN_LANG = lang;

    /* Resume observing for future dynamically-rendered content */
    if (domObserver) domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /* ─── Update switcher button states ────────────────────── */
  function updateUI(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
  }

  /* ─── Set language (called on click) ───────────────────── */
  function setLang(lang) {
    localStorage.setItem('halovn_lang', lang);
    window.HALOVN_LANG = lang;
    applyTranslations(lang);
    updateUI(lang);

    /* Fire custom event so other scripts (cart, products) can react */
    document.dispatchEvent(new CustomEvent('halovn:langchange', { detail: { lang } }));
  }

  /* ─── Inject switcher HTML into header ─────────────────── */
  function injectSwitcher() {
    const headerInner = document.querySelector('.header__inner');
    if (!headerInner || headerInner.querySelector('.lang-switcher')) return;

    const lang = getLang();
    const div  = document.createElement('div');
    div.className = 'lang-switcher';
    div.innerHTML  =
      `<button class="lang-btn${lang === 'vi' ? ' is-active' : ''}" data-lang="vi" aria-label="Tiếng Việt">VI</button>` +
      `<span class="lang-sep" aria-hidden="true">|</span>` +
      `<button class="lang-btn${lang === 'en' ? ' is-active' : ''}" data-lang="en" aria-label="English">EN</button>`;

    /* Insert right before cart icon or mobile toggle */
    const anchor = headerInner.querySelector('.cart-link, .menu-toggle');
    if (anchor) headerInner.insertBefore(div, anchor);
    else headerInner.appendChild(div);

    div.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  /* ─── Expose public function for JS renderers ───────────── */
  window.halovnApplyI18n = function () {
    applyTranslations(window.HALOVN_LANG || getLang());
  };

  /* ─── MutationObserver: catch dynamically added [data-i18n] */
  function observeDom() {
    let timer;
    domObserver = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const lang = window.HALOVN_LANG || getLang();
        if (lang !== 'vi') applyTranslations(lang);
      }, 60);
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /* ─── Init ──────────────────────────────────────────────── */
  function init() {
    injectSwitcher();
    const lang = getLang();
    window.HALOVN_LANG = lang;
    applyTranslations(lang);
    observeDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
