/* =========================================================
   KATSUHARA - Common scripts
   ========================================================= */
(function () {
  'use strict';

  /* Fade-in on scroll */
  const fadeEls = document.querySelectorAll('.fade');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fadeEls.forEach(el => io.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('in'));
  }

  /* Animated counters */
  const countEls = document.querySelectorAll('.count');
  if (countEls.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const target = +e.target.dataset.t;
          const start = performance.now();
          const tick = now => {
            const p = Math.min((now - start) / 1000, 1);
            const v = Math.floor((1 - Math.pow(1 - p, 3)) * target);
            e.target.textContent = v;
            if (p < 1) requestAnimationFrame(tick);
            else e.target.textContent = target;
          };
          requestAnimationFrame(tick);
          co.unobserve(e.target);
        });
      },
      { threshold: 0.5 }
    );
    countEls.forEach(el => co.observe(el));
  }

  /* Mobile menu toggle */
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.site-header nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('is-open');
      nav.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        nav.classList.remove('is-open');
      })
    );
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq__item').forEach(item => {
    const q = item.querySelector('.faq__q');
    if (!q) return;
    q.addEventListener('click', () => item.classList.toggle('is-open'));
  });

  /* News filter (client side) */
  const filterButtons = document.querySelectorAll('[data-news-filter]');
  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const target = btn.dataset.newsFilter;
        filterButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        document.querySelectorAll('[data-news-item]').forEach(item => {
          const cat = item.dataset.newsItem;
          item.style.display = target === 'all' || target === cat ? '' : 'none';
        });
      });
    });
  }
})();
