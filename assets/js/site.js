/* =========================================================
   KATSUHARA SEISAKUSHO - Shared site script
   ========================================================= */
(function(){
  'use strict';

  /* ---- header scroll state + page progress + to-top ---- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const toTop = document.getElementById('toTop');
  function onScroll(){
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 60);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (progress){
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = Math.max(0, Math.min(1, y / h)) * 100 + '%';
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  /* ---- reveal on scroll ---- */
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* ---- numbers: static (C-tone hybrid — no count-up animation) ---- */
  document.querySelectorAll('[data-count]').forEach(el => { el.textContent = el.dataset.count; });

  /* ---- capabilities steps: click to highlight ---- */
  document.querySelectorAll('#flowSteps .step').forEach(step => {
    step.addEventListener('click', () => {
      document.querySelectorAll('#flowSteps .step').forEach(s => s.classList.remove('active'));
      step.classList.add('active');
    });
  });

  /* ---- hamburger mobile menu ---- */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu){
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('is-open');
      navMenu.classList.toggle('is-open');
    });
    navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      hamburger.classList.remove('is-open');
      navMenu.classList.remove('is-open');
    }));
  }

  /* ---- works carousel (responsive visible count) ---- */
  const rail = document.getElementById('worksRail');
  if (rail && rail.children.length){
    const works = rail.children;
    const cardW = () => works[0].getBoundingClientRect().width + 18;
    const visibleCount = () => {
      const w = window.innerWidth;
      if (w <= 760) return 1;
      if (w <= 1024) return 2;
      if (w <= 1280) return 4;
      return 5;
    };
    let idx = 0;
    let maxIdx = Math.max(0, works.length - visibleCount());
    const prev = document.getElementById('workPrev');
    const next = document.getElementById('workNext');
    function updateRail(){
      rail.style.transform = `translateX(${-idx * cardW()}px)`;
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= maxIdx;
    }
    if (prev) prev.addEventListener('click', () => { idx = Math.max(0, idx-1); updateRail(); });
    if (next) next.addEventListener('click', () => { idx = Math.min(maxIdx, idx+1); updateRail(); });
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        maxIdx = Math.max(0, works.length - visibleCount());
        idx = Math.min(idx, maxIdx);
        updateRail();
      }, 120);
    });
    updateRail();
  }

  /* ---- news tabs ---- */
  const newsTabs = document.getElementById('newsTabs');
  if (newsTabs){
    newsTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      newsTabs.querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const cat = btn.dataset.cat;
      document.querySelectorAll('[data-news-row], #newsList .row').forEach(row => {
        const rowCat = row.dataset.cat || row.dataset.newsRow;
        row.classList.toggle('hidden', !(cat === 'all' || rowCat === cat));
      });
    });
  }

  /* ---- works page filter ---- */
  const worksFilter = document.getElementById('worksFilter');
  if (worksFilter){
    worksFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      worksFilter.querySelectorAll('button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const cat = btn.dataset.filter;
      document.querySelectorAll('[data-work-item]').forEach(item => {
        const cats = (item.dataset.workItem || '').split(',');
        item.style.display = (cat === 'all' || cats.includes(cat)) ? '' : 'none';
      });
    });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq__item').forEach(item => {
    const q = item.querySelector('.faq__q');
    if (!q) return;
    q.addEventListener('click', () => item.classList.toggle('is-open'));
  });

  /* ---- WordPress news loader (headless) ---- */
  const newsListEl = document.getElementById('newsList');
  if (newsListEl) {
    const WP_API = 'https://www.katsuhara.co.jp/wp-json/wp/v2/posts';
    const limit = parseInt(newsListEl.dataset.limit || '5', 10);
    // map WP category slug -> chip color class
    const catClass = {
      'news': 'news',
      'recruit': 'recruit',
      'corporate-events': 'release',
      'outside-events': 'release',
      'club-activities': 'release',
      'other': 'news'
    };
    const decode = (html) => {
      const t = document.createElement('textarea');
      t.innerHTML = html;
      return t.value;
    };
    const fmtDate = (iso) => {
      const d = new Date(iso);
      const p = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
    };
    const wpNewsUrl = 'https://www.katsuhara.co.jp/news/';

    newsListEl.innerHTML = '<div style="padding:30px 0;color:var(--mute);font-size:13px">お知らせを読み込み中…</div>';

    fetch(`${WP_API}?per_page=${limit}&_embed`)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(posts => {
        if (!Array.isArray(posts) || !posts.length) throw new Error('empty');
        newsListEl.innerHTML = posts.map(p => {
          let catName = 'お知らせ', catSlug = 'news';
          try {
            const term = p._embedded['wp:term'][0][0];
            if (term) { catName = term.name; catSlug = term.slug; }
          } catch (e) {}
          const cls = catClass[catSlug] || 'news';
          const title = decode(p.title && p.title.rendered ? p.title.rendered : '(無題)');
          return `<a class="row" data-cat="${catSlug}" href="${p.link}" target="_blank" rel="noopener">`
            + `<span class="date">${fmtDate(p.date)}</span>`
            + `<span class="cat ${cls}">${catName}</span>`
            + `<span class="title">${title}</span>`
            + `<span class="arr">→</span></a>`;
        }).join('');
      })
      .catch(() => {
        newsListEl.innerHTML = `<div style="padding:30px 0;color:var(--mute);font-size:13px;line-height:1.9">`
          + `お知らせを読み込めませんでした。`
          + `<a href="${wpNewsUrl}" target="_blank" rel="noopener" style="color:var(--blue);text-decoration:underline">こちらのお知らせ一覧</a>`
          + `をご覧ください。</div>`;
      });
  }

  /* ---- parallax removed (C-tone hybrid: calm, fade-only motion) ---- */
})();
