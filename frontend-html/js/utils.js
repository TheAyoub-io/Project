/* =========================================================
   Utilities — Toast system, counters, date helpers, etc.
   ========================================================= */

/* ── Toast Notification System ─────────────────────── */
const toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = 'success', duration = 3500) {
    const container = this._getContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<span style="font-size:1.1rem;font-weight:900">${icons[type] || '•'}</span><span>${message}</span>`;

    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); },
};

window.toast = toast;


/* ── Animated Counter ──────────────────────────────── */
function animateCounter(element, target, duration = 2000, suffix = '') {
  let startTime = null;
  const start = 0;
  function step(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(ease * target);
    element.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.animateCounter = animateCounter;


/* ── Scroll Reveal (IntersectionObserver) ──────────── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '-40px' });

  reveals.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initScrollReveal);
window.initScrollReveal = initScrollReveal;


/* ── Date Helpers ──────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

window.formatDate = formatDate;
window.formatDateShort = formatDateShort;


/* ── Navbar Scroll Effect ─────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
});


/* ── Language Dropdown ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.lang-trigger');
  const menu = document.querySelector('.lang-menu');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => menu.classList.remove('open'));

  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.lang;
      document.documentElement.lang = code;
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      // Update active state
      menu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Remove dot from all, add to active
      menu.querySelectorAll('.dot').forEach(d => d.remove());
      const dot = document.createElement('span');
      dot.className = 'dot';
      btn.appendChild(dot);
      // Update trigger label
      trigger.querySelector('.lang-code').textContent = code.toUpperCase();
      menu.classList.remove('open');
    });
  });
});


/* ── Mobile Menu Toggle ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobile-menu-btn');
  const links = document.querySelector('.navbar-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    links.classList.toggle('mobile-open');
    btn.textContent = links.classList.contains('mobile-open') ? '✕' : '☰';
  });

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('mobile-open');
      btn.textContent = '☰';
    });
  });
});


/* ── Loading Overlay ──────────────────────────────── */
function showLoading(container) {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.7);z-index:50;border-radius:inherit;';
  container.style.position = 'relative';
  container.appendChild(overlay);
  return overlay;
}

function hideLoading(overlay) {
  if (overlay) overlay.remove();
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;


/* ── Helper: Show/Hide Element ────────────────────── */
function show(el) { if (el) el.style.display = ''; }
function hide(el) { if (el) el.style.display = 'none'; }
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

window.show = show;
window.hide = hide;
window.$ = $;
window.$$ = $$;
