/* ============================================
   HALOVN — News detail page
   Đọc ?slug=... từ URL, tra HALOVN_NEWS,
   render bài viết + danh sách bài liên quan.
   ============================================ */
(() => {
  'use strict';

  const root = document.getElementById('news-detail-root');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');

  if (!slug) return renderNotFound('Thiếu mã bài viết.');
  const article = window.HALOVN_findArticle(slug);
  if (!article) return renderNotFound(`Không tìm thấy bài viết "${slug}".`);

  // SEO
  document.title = article.title + ' — HALOVN';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', article.excerpt);

  const fmtDate = window.HALOVN_formatDate;
  const icon = window.HALOVN_NEWS_ICONS[article.icon] || window.HALOVN_NEWS_ICONS.book;

  // Lấy 3 bài khác (loại trừ bài hiện tại) làm "Bài viết khác"
  const related = window.HALOVN_NEWS.filter(a => a.slug !== article.slug).slice(0, 3);

  root.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Trang chủ</a>
      <span class="breadcrumb__sep">/</span>
      <a href="news.html">Tin tức</a>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">${esc(article.title)}</span>
    </nav>

    <article class="news-article">
      <header class="news-article__head">
        <span class="news-article__cat">${esc(article.category || 'Tin tức')}</span>
        <h1 class="news-article__title">${esc(article.title)}</h1>
        <div class="news-article__meta">
          <span>📅 ${fmtDate(article.date)}</span>
          ${article.author ? `<span>· ✍️ ${esc(article.author)}</span>` : ''}
        </div>
      </header>

      <div class="news-article__hero">
        ${article.heroImage
          ? `<img src="${esc(article.heroImage)}" alt="${esc(article.title)}" loading="lazy" data-fallback-icon="${esc(article.icon || 'book')}" />`
          : `<div class="news-article__hero-fallback">${icon}</div>`
        }
      </div>

      <div class="news-article__body">
        ${article.content.map(item => {
          if (typeof item === 'object' && item.type === 'image') {
            return `<figure class="news-article__figure"><img src="${esc(item.src)}" alt="${esc(item.alt || '')}" loading="lazy" /></figure>`;
          }
          if (typeof item === 'object' && item.type === 'heading') {
            return `<h2 class="news-article__h2">${esc(item.text)}</h2>`;
          }
          if (typeof item === 'object' && item.type === 'list') {
            return `<ul class="news-article__list">${item.items.map(li => `<li>${esc(li)}</li>`).join('')}</ul>`;
          }
          return `<p>${esc(item)}</p>`;
        }).join('')}
      </div>

      <footer class="news-article__foot">
        <div class="news-article__share">
          <a href="news.html" class="btn btn--outline" data-i18n="news.backToList">← Về danh sách tin tức</a>
          <a href="contact.html" class="btn btn--primary" data-i18n="news.contactCta">Liên hệ HALOVN →</a>
        </div>
      </footer>
    </article>

    ${related.length ? `
    <section class="news-related">
      <h2 data-i18n="news.related">Bài viết khác</h2>
      <div class="grid grid--3">
        ${related.map(renderCard).join('')}
      </div>
    </section>
    ` : ''}
  `;

  function renderCard(a) {
    const aIcon = window.HALOVN_NEWS_ICONS[a.icon] || window.HALOVN_NEWS_ICONS.book;
    return `
      <article class="news-card">
        <a href="news-detail.html?slug=${esc(a.slug)}" class="news-card__img">
          ${a.heroImage
            ? `<img src="${esc(a.heroImage)}" alt="${esc(a.title)}" loading="lazy" data-fallback-icon="${esc(a.icon || 'book')}" />`
            : aIcon}
        </a>
        <div class="news-card__body">
          <div class="news-card__date">${fmtDate(a.date)}</div>
          <h3 class="news-card__title"><a href="news-detail.html?slug=${esc(a.slug)}">${esc(a.title)}</a></h3>
          <p style="font-size:.9rem; color:var(--c-muted)">${esc(a.excerpt)}</p>
          <a href="news-detail.html?slug=${esc(a.slug)}" class="news-card__cta" data-i18n="news.readMore">Đọc tiếp →</a>
        </div>
      </article>
    `;
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
  }, true);

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderNotFound(msg) {
    root.innerHTML = `
      <section style="padding: 64px 0; text-align:center;">
        <h1 style="color:var(--c-navy)">Không tìm thấy bài viết</h1>
        <p style="color:var(--c-muted); max-width:480px; margin: 12px auto 28px;">${esc(msg)}</p>
        <a href="news.html" class="btn btn--primary" data-i18n="news.backToList">← Về danh sách tin tức</a>
      </section>
    `;
  }
})();
