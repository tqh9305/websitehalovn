/* ============================================
   HALOVN — News listing + homepage preview renderer
   Render danh sách bài viết từ HALOVN_NEWS vào:
     [data-news-grid]            → full list (news.html)
     [data-news-grid][data-limit] → preview limited (index.html)
   ============================================ */
(() => {
  'use strict';

  const news = window.HALOVN_NEWS || [];
  const fmtDate = window.HALOVN_formatDate;

  document.querySelectorAll('[data-news-grid]').forEach(grid => {
    const limit = parseInt(grid.dataset.limit, 10) || news.length;
    grid.innerHTML = news.slice(0, limit).map(renderCard).join('');
  });

  function renderCard(a) {
    const icon = window.HALOVN_NEWS_ICONS[a.icon] || window.HALOVN_NEWS_ICONS.book;
    const href = `news-detail.html?slug=${esc(a.slug)}`;
    return `
      <article class="news-card reveal">
        <a href="${href}" class="news-card__img" aria-label="${esc(a.title)}">
          ${a.heroImage
            ? `<img src="${esc(a.heroImage)}" alt="${esc(a.title)}" loading="lazy" data-fallback-icon="${esc(a.icon || 'book')}" />`
            : icon}
        </a>
        <div class="news-card__body">
          <div class="news-card__date">${fmtDate(a.date)}</div>
          <h3 class="news-card__title"><a href="${href}">${esc(a.title)}</a></h3>
          ${a.excerpt ? `<p style="font-size:.9rem; color:var(--c-muted)">${esc(a.excerpt)}</p>` : ''}
          <a href="${href}" class="news-card__cta" data-i18n="news.readMore">Đọc tiếp →</a>
        </div>
      </article>
    `;
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Event delegation: thay ảnh lỗi bằng SVG fallback an toàn */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.dataset.fallbackIcon) return;
    const iconKey = img.dataset.fallbackIcon;
    const iconSvg = (window.HALOVN_NEWS_ICONS && window.HALOVN_NEWS_ICONS[iconKey]) ||
                    window.HALOVN_NEWS_ICONS.book;
    const wrapper = document.createElement('span');
    wrapper.innerHTML = iconSvg;
    const svg = wrapper.firstElementChild;
    if (svg) img.replaceWith(svg);
  }, true); // capture phase — vì error event không bubble
})();
