/* =========================================================
   Home Page — Interactive Logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if logged in
  auth.redirectIfLoggedIn();

  // ── Animated Counters ────────────────────────────
  const statsGrid = document.getElementById('stats-grid');
  if (statsGrid) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const values = statsGrid.querySelectorAll('.stat-value');
          values.forEach(el => {
            const target = parseInt(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            animateCounter(el, target, 2000, suffix);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(statsGrid);
  }

  // ── Testimonial Carousel ─────────────────────────
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.testimonial-dot');
  let currentSlide = 0;
  let autoTimer;

  function showSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[index]?.classList.add('active');
    dots[index]?.classList.add('active');
    currentSlide = index;
  }

  function nextSlide() {
    showSlide((currentSlide + 1) % slides.length);
  }

  function startAutoRotate() {
    autoTimer = setInterval(nextSlide, 5000);
  }

  // Dot clicks
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(autoTimer);
      showSlide(parseInt(dot.dataset.index));
      startAutoRotate();
    });
  });

  if (slides.length > 0) startAutoRotate();

  // ── Update navbar based on auth state ────────────
  updateNavLinks();
});

function updateNavLinks() {
  const linksContainer = document.getElementById('nav-links');
  if (!linksContainer) return;

  if (auth.isLoggedIn()) {
    const role = auth.getRole();
    linksContainer.innerHTML = `
      <a href="index.html" class="active">Accueil</a>
      ${role === 'admin'
        ? '<a href="admin.html">Administration</a>'
        : '<a href="dashboard.html">Mon Espace</a><a href="apply.html">Candidature</a>'
      }
      <a href="#" onclick="auth.logout(); return false;">Déconnexion</a>
    `;
  }
}
