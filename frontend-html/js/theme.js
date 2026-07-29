/* =========================================================
   Theme Toggle — Dark / Light mode
   ========================================================= */

const theme = {
  init() {
    // Check stored preference or system preference
    const stored = localStorage.getItem('theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    this.updateIcon();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        this.updateIcon();
      }
    });
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.updateIcon();
  },

  isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  },

  updateIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = this.isDark() ? '☀️' : '🌙';
    btn.title = this.isDark() ? 'Mode clair' : 'Mode sombre';
  }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => theme.init());
window.theme = theme;
