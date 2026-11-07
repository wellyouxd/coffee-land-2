(() => {
  'use strict';

  const CATS = window.CATS;
  const ARTS = window.ARTICLES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е');
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const byId = {};
  ARTS.forEach((a) => { byId[a.id] = a; });
  const inCat = (c) => ARTS.filter((a) => a.cat === c);

  function plural(n, f) {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return f[0];
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return f[1];
    return f[2];
  }

  /* ---------- Подготовка текста для поиска ---------- */
  ARTS.forEach((a) => {
    const body = [a.short, a.intro];
    (a.sections || []).forEach((s) => {
      body.push(s.h);
      [].concat(s.p || [], s.list || [], s.steps || []).forEach((x) => body.push(x));
    });
    (a.mistakes || []).forEach((x) => body.push(x));
    (a.facts || []).forEach((f) => body.push(f[0] + ' ' + f[1]));
    a._body = body.filter(Boolean).join(' . ');
    a._bodyN = norm(a._body);
    a._title = norm(a.title + ' ' + a.alt);
    a._text = a._title + ' ' + a._bodyN;
    a._min = Math.max(2, Math.round(a._body.split(/\s+/).length / 140));
  });

  /* ---------- Иконки ---------- */
  const PATHS = {
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3"/>',
    bean: '<ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(35 12 12)"/><path d="M8.5 6.5c4 2.2 3 6.5 7 11"/>',
    grinder: '<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M8 10 6.5 4h11L16 10"/><path d="M12 4V2m0 0h4"/><path d="M10 15h4"/>',
    drip: '<path d="M4 4h16l-5 10H9z"/><path d="M9 14h6v2H9z"/><path d="M7 20h10"/><path d="M8 17v3m8-3v3"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    home: '<path d="M4 11 12 4l8 7v8H4z"/>',
    back: '<path d="M19 12H5m5-5-5 5 5 5"/>'
  };
  const ic = (name, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

  const SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="bean" viewBox="0 0 40 56"><ellipse cx="20" cy="28" rx="17" ry="26" fill="currentColor"/><ellipse cx="14" cy="16" rx="5" ry="9" fill="#fff" opacity=".12"/><path d="M20 4c-9 14 9 34 0 48" stroke="#000" stroke-opacity=".45" fill="none" stroke-width="3" stroke-linecap="round"/></symbol></svg>';

  /* ---------- Фото: пробуем img/<id>.jpg, потом png, webp ---------- */
  const EXTS = ['jpg', 'png', 'webp', 'jpeg'];
  window.coffeeImg = function (img) {
    const next = Number(img.dataset.e || 0) + 1;
    if (next < EXTS.length) {
      img.dataset.e = next;
      img.src = 'img/' + img.dataset.id + '.' + EXTS[next];
    } else {
      img.remove();
    }
  };
  const ph = (a, cls) => `<div class="ph ph-${a.cat} ${cls || ''}"><span class="ph-ic">${ic(CATS[a.cat].icon)}</span><span class="ph-name">img/${a.id}.jpg</span><img src="img/${a.id}.jpg" data-id="${a.id}" data-e="0" alt="${esc(a.title)}" loading="lazy" onerror="coffeeImg(this)"></div>`;

  /* ---------- Каркас: шапка, меню, поиск, подвал ---------- */
  function buildShell() {
    document.body.insertAdjacentHTML('afterbegin', SPRITE);

    $('#site-header').outerHTML = `
      <header class="site-header">
        <div class="wrap bar">
          <a class="logo" href="index.html" aria-label="Coffee Land — на главную">
            <span class="logo-mark"><svg viewBox="0 0 40 56" aria-hidden="true"><use href="#bean"/></svg></span>
            coffee<b>land</b>
          </a>
          <div class="bar-actions">
            <button class="icon-btn" type="button" data-open-search aria-label="Поиск">${ic('search')}</button>
            <button class="burger" id="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
          </div>
        </div>
      </header>

      <div class="overlay" id="menu" aria-hidden="true">
        <div class="wrap">
          <ul class="menu-list">
            ${Object.keys(CATS).map((k) => {
              const c = CATS[k], n = inCat(k).length;
              return `<li><a href="${c.file}"><span class="menu-num">${c.num}</span><span class="menu-title">${esc(c.title)}<span class="menu-lead">${esc(c.lead)}</span></span><span class="menu-count">${n} ${plural(n, ['статья', 'статьи', 'статей'])}</span></a></li>`;
            }).join('')}
          </ul>
          <a class="menu-home" href="index.html">${ic('home')} На главную</a>
        </div>
      </div>

      <div class="overlay" id="search" role="dialog" aria-modal="true" aria-label="Поиск по сайту" aria-hidden="true">
        <div class="wrap">
          <div class="search-box">
            ${ic('search')}
            <input id="search-input" type="search" placeholder="Например: воронка" autocomplete="off" aria-label="Что ищем?">
            <button class="icon-btn" type="button" id="search-close" aria-label="Закрыть поиск">✕</button>
          </div>
          <div class="chips" id="chips">
            ${['воронка', 'эспрессо', 'арабика', 'помол', 'кофемолка', 'молоко'].map((w) => `<button class="chip" type="button" data-q="${w}">${w}</button>`).join('')}
          </div>
          <div class="results" id="results" aria-live="polite"></div>
        </div>
      </div>`;

    $('#site-footer').outerHTML = `
      <footer class="site-footer">
        <div class="wrap foot">
          <a class="logo" href="index.html"><span class="logo-mark"><svg viewBox="0 0 40 56" aria-hidden="true"><use href="#bean"/></svg></span>coffee<b>land</b></a>
          <nav aria-label="Разделы">${Object.keys(CATS).map((k) => `<a href="${CATS[k].file}">${esc(CATS[k].title)}</a>`).join('')}</nav>
          <small>© ${new Date().getFullYear()} Coffee Land · учебный проект</small>
        </div>
      </footer>`;
  }

  /* ---------- Меню и поиск ---------- */
  const menuEl = () => $('#menu');
  const searchEl = () => $('#search');

  function setOverlay(el, open) {
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', String(!open));
  }
  function syncLock() {
    document.body.classList.toggle('lock', menuEl().classList.contains('is-open') || searchEl().classList.contains('is-open'));
  }
  function toggleMenu(open) {
    const burger = $('#burger');
    if (open) setOverlay(searchEl(), false);
    setOverlay(menuEl(), open);
    burger.setAttribute('aria-expanded', String(open));
    syncLock();
  }
  function openSearch() {
    toggleMenu(false);
    setOverlay(searchEl(), true);
    syncLock();
    setTimeout(() => $('#search-input').focus(), 60);
  }
  function closeSearch() {
    setOverlay(searchEl(), false);
    syncLock();
  }

  const stem = (w) => (w.length > 5 ? w.slice(0, -2) : w.length > 3 ? w.slice(0, -1) : w);
  const tokens = (q) => norm(q).split(/[^a-zа-я0-9]+/).filter(Boolean).map(stem);

  function searchArticles(words) {
    const out = [];
    ARTS.forEach((a) => {
      let score = 0;
      for (const w of words) {
        if (a._title.includes(w)) score += 10;
        else if (a._bodyN.includes(w)) score += 3;
        else return;
        if (norm(a.title).startsWith(w)) score += 5;
      }
      out.push({ a, score });
    });
    return out.sort((x, y) => y.score - x.score).slice(0, 10).map((x) => x.a);
  }

  function highlight(text, words) {
    const safe = esc(text);
    if (!words.length) return safe;
    const re = new RegExp('(' + words.map(reEsc).join('|') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function snippet(a, words) {
    let idx = -1;
    for (const w of words) { idx = a._bodyN.indexOf(w); if (idx >= 0) break; }
    if (idx < 0) return a.short.length > 140 ? a.short.slice(0, 140) + '…' : a.short;
    const start = Math.max(0, idx - 50);
    const end = Math.min(a._body.length, idx + 110);
    return (start > 0 ? '…' : '') + a._body.slice(start, end).trim() + (end < a._body.length ? '…' : '');
  }

  function renderResults(q) {
    const box = $('#results');
    const words = tokens(q);
    if (!words.length) { box.innerHTML = ''; return; }
    const found = searchArticles(words);
    box.innerHTML = found.length
      ? found.map((a) => `<a class="res" href="article.html?id=${a.id}"><span class="tag">${esc(CATS[a.cat].title)}</span><strong>${highlight(a.title, words)}</strong><span class="snip">${highlight(snippet(a, words), words)}</span></a>`).join('')
      : `<p class="res-empty">Ничего не нашлось по запросу «${esc(q.trim())}». Попробуй другое слово, например «воронка» или «эспрессо».</p>`;
  }

  function bindShell() {
    $('#burger').addEventListener('click', () => toggleMenu(!menuEl().classList.contains('is-open')));
    $$('[data-open-search]').forEach((b) => b.addEventListener('click', openSearch));
    $('#search-close').addEventListener('click', closeSearch);

    const input = $('#search-input');
    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = $('#results .res');
        if (first) location.href = first.getAttribute('href');
      } else if (e.key === 'ArrowDown') {
        const first = $('#results .res');
        if (first) { e.preventDefault(); first.focus(); }
      }
    });
    $('#results').addEventListener('keydown', (e) => {
      const items = $$('#results .res');
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) items[i - 1].focus(); else input.focus(); }
    });
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      input.value = b.dataset.q;
      renderResults(b.dataset.q);
      input.focus();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (searchEl().classList.contains('is-open')) closeSearch();
        if (menuEl().classList.contains('is-open')) toggleMenu(false);
      }
      const t = e.target.tagName;
      if (e.key === '/' && t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); openSearch(); }
    });
  }

  /* ---------- Появление при скролле ---------- */
  let revealIO = null;
  function reveal() {
    const els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
    }
    els.forEach((e) => revealIO.observe(e));
  }

  /* ---------- Карточка статьи ---------- */
  const card = (a, i) => `
    <a class="card glass reveal" href="article.html?id=${a.id}" style="transition-delay:${Math.min(i || 0, 6) * 60}ms">
      ${ph(a)}
      <div class="card-body">
        <div class="meta"><span>${esc(a.level)}</span><span>${ic('clock')} ${a._min} мин</span></div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.short)}</p>
        <span class="more">Читать ${ic('arrow')}</span>
      </div>
    </a>`;

  /* ---------- Главная ---------- */
  function renderHome() {
    $('#hero-search-ic').innerHTML = ic('search');

    const drinks = inCat('drinks').map((a) => esc(a.title));
    const line = drinks.concat(['V60', 'Френч-пресс', 'Аэропресс']).map((t) => `<span>${t}</span>`).join('');
    $('#marquee').innerHTML = line + line;

    $('#cats').innerHTML = Object.keys(CATS).map((k, i) => {
      const c = CATS[k], n = inCat(k).length;
      return `<a class="cat-card glass reveal" href="${c.file}" style="transition-delay:${i * 70}ms">
        <span class="big-num" aria-hidden="true">${c.num}</span>
        ${ic(c.icon, 'cat-ic')}
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.desc)}</p>
        <span class="cat-foot"><span>${n} ${plural(n, ['статья', 'статьи', 'статей'])}</span>${ic('arrow')}</span>
      </a>`;
    }).join('');

    const steps = [
      ['arabica-robusta', 'Узнай, что такое кофе'],
      ['choose-beans', 'Научись выбирать зёрна'],
      ['grind-size', 'Пойми, что такое помол'],
      ['v60', 'Сделай первую чашку'],
      ['cappuccino', 'Освой напитки с молоком']
    ];
    $('#path-list').innerHTML = steps.filter((s) => byId[s[0]]).map((s, i) => {
      const a = byId[s[0]];
      return `<a class="glass reveal" href="article.html?id=${a.id}" style="transition-delay:${i * 60}ms"><span><strong>${esc(s[1])}</strong><small>${esc(a.title)} · ${esc(CATS[a.cat].title)} · ${a._min} мин</small></span>${ic('arrow')}</a>`;
    }).join('');

    $('#popular').innerHTML = ARTS.filter((a) => a.featured).slice(0, 4).map(card).join('');
    reveal();
  }

  /* ---------- Страница раздела ---------- */
  function renderCategory() {
    const key = document.body.dataset.cat;
    const c = CATS[key];
    const list = inCat(key);
    $('#filter-ic').innerHTML = ic('search');
    $('#cat-hero').innerHTML = `<span class="big-num" aria-hidden="true">${c.num}</span><p class="eyebrow">Раздел ${c.num}</p><h1>${esc(c.title)}</h1><p>${esc(c.desc)}</p>`;

    const draw = (q) => {
      const words = tokens(q);
      const items = words.length ? list.filter((a) => words.every((w) => a._text.includes(w))) : list;
      $('#grid').innerHTML = items.map(card).join('');
      $('#none').hidden = items.length > 0;
      $('#count').textContent = `${items.length} ${plural(items.length, ['статья', 'статьи', 'статей'])}`;
      reveal();
    };
    $('#filter').addEventListener('input', (e) => draw(e.target.value));
    draw('');
  }

  /* ---------- Страница статьи ---------- */
  function ytId(v) {
    if (!v) return '';
    const m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : String(v).trim();
  }

  function renderSection(s, i) {
    let html = `<h2 id="sec-${i}">${esc(s.h)}</h2>`;
    (s.p || []).forEach((t) => { html += `<p>${esc(t)}</p>`; });
    if (s.list) html += `<ul>${s.list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    if (s.steps) html += `<ol>${s.steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`;
    return html;
  }

  function renderArticle() {
    const id = new URLSearchParams(location.search).get('id');
    const a = byId[id];
    const root = $('#article');

    if (!a) {
      document.title = 'Статья не найдена — Coffee Land';
      root.innerHTML = `<div class="not-found"><h1>Такой статьи нет</h1><p>Возможно, ссылка устарела. Попробуй найти нужное через поиск.</p><a class="btn" href="index.html">На главную</a></div>`;
      return;
    }

    const c = CATS[a.cat];
    document.title = `${a.title} — Coffee Land`;
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute('content', a.short);

    const toc = (a.sections || []).map((s, i) => [`sec-${i}`, s.h]);
    toc.push(['video', 'Видеоурок']);
    if (a.mistakes && a.mistakes.length) toc.push(['mistakes', 'Частые ошибки']);

    const vid = ytId(a.video);
    const video = vid
      ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(vid)}" title="Видеоурок: ${esc(a.title)}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
      : `<div class="video video-empty">${ic('play')}<strong>Видеоурок скоро</strong><span>Здесь появится видео: «${esc(a.title)}»</span></div>`;

    const list = inCat(a.cat);
    const idx = list.indexOf(a);
    const prev = list[(idx - 1 + list.length) % list.length];
    const next = list[(idx + 1) % list.length];
    const related = (a.related || []).map((r) => byId[r]).filter(Boolean).slice(0, 3);

    root.innerHTML = `
      <nav class="crumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span>/</span><a href="${c.file}">${esc(c.title)}</a><span>/</span><span>${esc(a.title)}</span></nav>
      <header class="article-head">
        <h1>${esc(a.title)}</h1>
        <p class="lead">${esc(a.short)}</p>
        <div class="chip-row">
          <a class="pill cat" href="${c.file}">${esc(c.title)}</a>
          <span class="pill">${ic('clock')} ${a._min} мин чтения</span>
          <span class="pill">${esc(a.level)}</span>
        </div>
      </header>
      <div class="cover">${ph(a, 'wide')}</div>
      <div class="article-layout">
        <aside class="toc" aria-label="Содержание"><b>Содержание</b>${toc.map((t) => `<a href="#${t[0]}">${esc(t[1])}</a>`).join('')}</aside>
        <article class="prose">
          <p class="intro">${esc(a.intro)}</p>
          ${a.facts && a.facts.length ? `<dl class="facts-box">${a.facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>` : ''}
          ${(a.sections || []).map(renderSection).join('')}
          <h2 id="video">Видеоурок</h2>
          ${video}
          ${a.mistakes && a.mistakes.length ? `<div class="mistakes" id="mistakes"><h2>Частые ошибки</h2><ul>${a.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
          ${related.length ? `<section class="related" style="margin-top:56px"><h3>Читай дальше</h3><div class="grid">${related.map(card).join('')}</div></section>` : ''}
          ${list.length > 1 ? `<div class="pager-nav"><a class="glass" href="article.html?id=${prev.id}"><small>← Назад</small><strong>${esc(prev.title)}</strong></a><a class="glass next" href="article.html?id=${next.id}"><small>Дальше →</small><strong>${esc(next.title)}</strong></a></div>` : ''}
        </article>
      </div>`;

    /* подсветка пункта содержания */
    const links = $$('.toc a');
    if ('IntersectionObserver' in window && links.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      toc.forEach((t) => { const el = document.getElementById(t[0]); if (el) io.observe(el); });
    }
    reveal();
  }

  /* ---------- Старт ---------- */
  buildShell();
  bindShell();
  const page = document.body.dataset.page;
  if (page === 'home') renderHome();
  else if (page === 'category') renderCategory();
  else if (page === 'article') renderArticle();
})();
