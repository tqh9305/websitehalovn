/* ============================================
   HALOVN — Product list renderer
   Reads HALOVN_PRODUCTS, renders filters + grid
   into containers tagged data-products-grid /
   data-products-filters.
   ============================================ */

(() => {
  'use strict';

  const fmt = window.HALOVN_formatPrice;
  const products = window.HALOVN_PRODUCTS || [];

  const gridEl    = document.querySelector('[data-products-grid]');
  const filtersEl = document.querySelector('[data-products-filters]');

  if (!gridEl) return;

  // Allow ?limit=N or data-limit="N" for the homepage featured strip
  const limit = parseInt(gridEl.dataset.limit, 10) || products.length;

  // ---- Build filters by BRAND ----
  if (filtersEl) {
    // Giữ thứ tự xuất hiện đầu tiên trong data
    const brandSet = new Set();
    products.forEach((p) => brandSet.add(p.brand));
    const items = [['all', 'Tất cả'], ...[...brandSet].map((b) => [b, b])];
    filtersEl.innerHTML = items
      .map(
        ([val, label], i) =>
          `<button class="filter-btn ${i === 0 ? 'is-active' : ''}" data-filter="${esc(val)}">${esc(label)}</button>`
      )
      .join('');
  }

  // ---- Build product cards ----
  gridEl.innerHTML = products.slice(0, limit).map(renderCard).join('');

  // ---- Wire up filter clicks (re-bind in main.js style) ----
  if (filtersEl) {
    const cards = gridEl.querySelectorAll('[data-brand]');
    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filtersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const brand = btn.dataset.filter;
      cards.forEach((c) => {
        c.style.display = brand === 'all' || c.dataset.brand === brand ? '' : 'none';
      });
    });

    // Hỗ trợ #brand-name trên URL (ví dụ products.html#Marvis) — auto-apply filter
    const hash = decodeURIComponent((location.hash || '').replace('#', ''));
    if (hash) {
      const target = filtersEl.querySelector(`.filter-btn[data-filter="${cssEscape(hash)}"]`);
      if (target) target.click();
    }
  }

  // ---- Make cards clickable → detail page ----
  gridEl.querySelectorAll('.product').forEach((card) => {
    const href = card.dataset.href;
    if (!href) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.product__actions')) return;
      location.href = href;
    });
  });

  // ---- Helpers ----
  function renderCard(p) {
    const savePct =
      p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const detailHref = `product.html?slug=${encodeURIComponent(p.slug)}`;
    const placeholder = categoryPlaceholderSvg(p.category);
    const mainImg = p.images && p.images[0];

    return `
      <article class="product reveal" data-brand="${esc(p.brand)}" data-category="${esc(p.category)}" data-href="${esc(detailHref)}">
        <div class="product__img">
          ${
            mainImg
              ? `<img src="${esc(mainImg)}" alt="${esc(p.name)}" loading="lazy"
                  onerror="this.outerHTML='${placeholder.replace(/'/g, "\\'")}'" />`
              : placeholder
          }
        </div>
        <div class="product__body">
          <div class="product__cat">${esc(p.categoryLabel)}</div>
          <div class="product__name">${esc(p.name)}</div>
          <div class="product__price">
            <span class="product__price-current">${fmt(p.price)}</span>
            ${p.oldPrice ? `<span class="product__price-old">${fmt(p.oldPrice)}</span>` : ''}
            ${savePct ? `<span class="product__badge">-${savePct}%</span>` : ''}
          </div>
          <div class="product__actions">
            <a href="${esc(detailHref)}" class="product__buy" data-i18n="products.buyRetail">Mua lẻ</a>
            <a href="wholesale.html#register" class="product__wholesale" data-i18n="products.wholesale">Lấy giá sỉ</a>
          </div>
        </div>
      </article>
    `;
  }

  function categoryPlaceholderSvg(cat) {
    const colors = {
      'oral-care': '#00AEEF',
      'supplement': '#00AEEF',
      'mom-baby':  '#39B54A',
      'senior':    '#1A2B4A',
      'beauty':    '#39B54A',
    };
    const fill = colors[cat] || '#00AEEF';
    return `<svg viewBox="0 0 100 100" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="20" width="40" height="70" rx="6"/><rect x="35" y="10" width="30" height="15" rx="3" fill="#1A2B4A"/></svg>`;
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cssEscape(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
})();
