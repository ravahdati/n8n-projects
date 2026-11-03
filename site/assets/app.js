(() => {
  'use strict';

  /* ---------- translations (UI text) ---------- */
  const I18N = {
    fa: {
      siteName: 'پروژه‌های n8n',
      heroTitle: 'نمونه ورک‌فلوهای n8n',
      heroText: 'مجموعه‌ای از اتوماسیون‌هایی که طراحی کرده‌ام؛ ببینید، دانلود کنید و در n8n خودتان اجرا کنید.',
      search: 'جستجوی پروژه…',
      all: 'همه',
      empty: 'پروژه‌ای پیدا نشد.',
      back: 'بازگشت به لیست',
      download: 'دانلود فایل n8n',
      copy: 'کپی ورک‌فلو',
      copied: 'ورک‌فلو کپی شد؛ در n8n با Ctrl+V پیست کنید.',
      copyFail: 'کپی انجام نشد؛ لطفاً فایل را دانلود کنید.',
      demo: 'نمایش زنده ورک‌فلو',
      preview: 'تصویر پروژه',
      about: 'توضیحات',
      nodes: 'نودهای استفاده‌شده',
      nodeCount: 'نود',
      featured: 'ویژه',
      notFound: 'این پروژه پیدا نشد.',
      loadError: 'خطا در بارگذاری لیست پروژه‌ها.',
      footer: 'ساخته‌شده با n8n',
      contactTitle: 'ارتباط با من',
      contactText: 'برای گفتگو درباره پروژه‌ها و همکاری، در ارتباط باشیم.',
      contactTelegram: 'تلگرام',
      contactLinkedin: 'لینکدین',
      contactGithub: 'گیت‌هاب',
      sourceCode: 'کد منبع پروژه',
    },
    en: {
      siteName: 'n8n Projects',
      heroTitle: 'n8n Workflow Showcase',
      heroText: 'A collection of automations I designed. Preview them, download them and run them in your own n8n.',
      search: 'Search projects…',
      all: 'All',
      empty: 'No projects found.',
      back: 'Back to list',
      download: 'Download n8n file',
      copy: 'Copy workflow',
      copied: 'Workflow copied. Paste it into n8n with Ctrl+V.',
      copyFail: 'Copy failed. Please download the file instead.',
      demo: 'Live workflow preview',
      preview: 'Project image',
      about: 'About',
      nodes: 'Nodes used',
      nodeCount: 'nodes',
      featured: 'Featured',
      notFound: 'Project not found.',
      loadError: 'Could not load the project list.',
      footer: 'Built with n8n',
      contactTitle: 'Get in touch',
      contactText: 'Let’s talk about projects and working together.',
      contactTelegram: 'Telegram',
      contactLinkedin: 'LinkedIn',
      contactGithub: 'GitHub',
      sourceCode: 'Project source code',
    },
  };

  /* ---------- state ---------- */
  const store = {
    get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  let lang = store.get('lang', 'fa');
  let theme = document.documentElement.dataset.theme || 'dark';
  let projects = [];
  let query = '';
  let activeTag = '';

  const $app = document.getElementById('app');
  const t = (k) => I18N[lang][k] || k;

  // value may be a plain string/array or {fa, en}
  const pick = (v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v[lang] ?? v.en ?? v.fa ?? '';
    return v ?? '';
  };
  const tagsOf = (p) => { const v = pick(p.tags); return Array.isArray(v) ? v : []; };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { dateStyle: 'medium' }).format(dt);
  };
  const num = (n) => new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n);

  /* ---------- chrome (lang / theme) ---------- */
  function applyChrome() {
    const h = document.documentElement;
    h.lang = lang; h.dir = lang === 'fa' ? 'rtl' : 'ltr'; h.dataset.theme = theme;
    document.getElementById('langBtn').textContent = lang === 'fa' ? 'EN' : 'فا';
    document.title = t('siteName');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  }
  document.getElementById('langBtn').addEventListener('click', () => {
    lang = lang === 'fa' ? 'en' : 'fa'; store.set('lang', lang); activeTag = ''; applyChrome(); render();
  });
  document.getElementById('themeBtn').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark'; store.set('theme', theme); applyChrome();
  });

  /* ---------- views ---------- */
  function cardHTML(p) {
    const tags = tagsOf(p).slice(0, 4).map((x) => `<span class="tag">${esc(x)}</span>`).join('');
    const img = p.image
      ? `<img src="${esc(p.image)}" alt="${esc(pick(p.title))}" loading="lazy">`
      : `<div class="ph">n8n</div>`;
    return `
      <a class="card" href="#/${encodeURIComponent(p.slug)}">
        <div class="thumb">${img}${p.featured ? `<span class="badge">★ ${t('featured')}</span>` : ''}</div>
        <div class="card-body">
          <h3>${esc(pick(p.title))}</h3>
          <p>${esc(pick(p.summary))}</p>
          <div class="tags">${tags}</div>
          <div class="meta"><span>${num(p.nodeCount)} ${t('nodeCount')}</span>${p.created ? `<span>${fmtDate(p.created)}</span>` : ''}</div>
        </div>
      </a>`;
  }

  function renderList() {
    const allTags = [...new Set(projects.flatMap(tagsOf))];
    const q = query.trim().toLowerCase();
    const shown = projects.filter((p) => {
      if (activeTag && !tagsOf(p).includes(activeTag)) return false;
      if (!q) return true;
      return [pick(p.title), pick(p.summary), ...tagsOf(p)].join(' ').toLowerCase().includes(q);
    });

    $app.innerHTML = `
      <section class="hero"><h1>${t('heroTitle')}</h1><p>${t('heroText')}</p></section>
      <div class="toolbar">
        <input id="q" class="search" type="search" placeholder="${t('search')}" value="${esc(query)}">
        <div class="chips">
          <button class="chip ${activeTag ? '' : 'on'}" data-tag="">${t('all')}</button>
          ${allTags.map((g) => `<button class="chip ${g === activeTag ? 'on' : ''}" data-tag="${esc(g)}">${esc(g)}</button>`).join('')}
        </div>
      </div>
      <div class="grid" id="grid">${shown.length ? shown.map(cardHTML).join('') : `<p class="empty">${t('empty')}</p>`}</div>`;

    const input = document.getElementById('q');
    input.addEventListener('input', (e) => {
      query = e.target.value;
      const pos = e.target.selectionStart;
      renderList();
      const n = document.getElementById('q'); n.focus(); n.setSelectionRange(pos, pos);
    });
    $app.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { activeTag = b.dataset.tag; renderList(); }));
  }

  async function copyWorkflow(p) {
    try {
      const txt = await (await fetch(p.workflow)).text();
      await navigator.clipboard.writeText(txt);
      toast(t('copied'));
    } catch (e) { toast(t('copyFail')); }
  }

  async function renderDetail(slug) {
    const p = projects.find((x) => x.slug === slug);
    if (!p) { $app.innerHTML = `<a class="back" href="#/"><span class="arr">←</span> ${t('back')}</a><p class="empty">${t('notFound')}</p>`; return; }

    document.title = `${pick(p.title)} · ${t('siteName')}`;
    const desc = String(pick(p.description) || '').split(/\n{1,}/).filter(Boolean).map((s) => `<p>${esc(s)}</p>`).join('');
    const tags = tagsOf(p).map((x) => `<span class="tag">${esc(x)}</span>`).join('');
    const nodes = (p.nodes || []).map((x) => `<span class="tag">${esc(x)}</span>`).join('');
    const diff = pick(p.difficulty);

    $app.innerHTML = `
      <article class="detail">
        <a class="back" href="#/"><span class="arr">←</span> ${t('back')}</a>
        <h1>${esc(pick(p.title))}</h1>
        <p class="lead">${esc(pick(p.summary))}</p>
        <div class="tags">${tags}</div>
        <div class="meta">
          <span>${num(p.nodeCount)} ${t('nodeCount')}</span>
          ${diff ? `<span>${esc(diff)}</span>` : ''}
          ${p.created ? `<span>${fmtDate(p.created)}</span>` : ''}
        </div>
        <div class="btns">
          <a class="btn primary" href="${esc(p.workflow)}" download>⬇ ${t('download')}</a>
          <button class="btn" id="copyBtn" type="button">⧉ ${t('copy')}</button>
        </div>

        <section class="panel">
          <h2>${t('demo')}</h2>
          <div class="demo-box" id="demoBox"></div>
        </section>

        <div class="cols">
          <section class="panel desc"><h2>${t('about')}</h2>${desc || '—'}</section>
          <div>
            ${p.image ? `<section class="panel"><h2>${t('preview')}</h2><img class="shot" src="${esc(p.image)}" alt="${esc(pick(p.title))}"></section>` : ''}
            ${nodes ? `<section class="panel"><h2>${t('nodes')}</h2><div class="tags">${nodes}</div></section>` : ''}
          </div>
        </div>
      </article>`;

    document.getElementById('copyBtn').addEventListener('click', () => copyWorkflow(p));
    mountDemo(p);
    window.scrollTo(0, 0);
  }

  async function mountDemo(p) {
    const box = document.getElementById('demoBox');
    try {
      const wf = await (await fetch(p.workflow)).text();
      JSON.parse(wf); // validate
      const el = document.createElement('n8n-demo');
      el.setAttribute('workflow', wf);
      el.setAttribute('frame', 'true');
      el.setAttribute('clicktointeract', 'true');
      box.appendChild(el);
    } catch (e) {
      box.innerHTML = p.image ? `<img class="shot" src="${esc(p.image)}" alt="">` : '';
    }
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ---------- router ---------- */
  function render() {
    const slug = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    document.title = t('siteName');
    if (slug) renderDetail(slug); else renderList();
  }
  window.addEventListener('hashchange', render);

  /* ---------- boot ---------- */
  applyChrome();
  fetch('projects.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((d) => { projects = d.projects || []; render(); })
    .catch(() => { $app.innerHTML = `<p class="empty">${t('loadError')}</p>`; });
})();
