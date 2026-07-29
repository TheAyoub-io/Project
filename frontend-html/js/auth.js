/* =========================================================
   Auth Module — JWT management, login/register, page guards
   ========================================================= */

const auth = {
  /** Decode JWT payload (no library needed) */
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  /** Get stored token */
  getToken() {
    return localStorage.getItem('token');
  },

  /** Check if user is logged in with a valid (non-expired) token */
  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.parseJwt(token);
    if (!payload) return false;
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return false;
    }
    return true;
  },

  /** Get current user's role from token */
  getRole() {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.parseJwt(token);
    return payload?.role || null;
  },

  /** Get current user's email from token */
  getEmail() {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.parseJwt(token);
    return payload?.sub || null;
  },

  /** Logout — clear token and redirect */
  logout() {
    localStorage.removeItem('token');
    window.location.href = '/frontend-html/login.html';
  },

  /**
   * Page guard: require authentication.
   * Call this at the top of protected pages (dashboard, apply, admin).
   * @param {string} [requiredRole] - Optional role check ('admin')
   */
  requireAuth(requiredRole) {
    if (!this.isLoggedIn()) {
      window.location.href = '/frontend-html/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    if (requiredRole && this.getRole() !== requiredRole) {
      window.location.href = '/frontend-html/index.html';
      return false;
    }
    return true;
  },

  /**
   * Redirect if already logged in.
   * Call this on login/register pages.
   */
  redirectIfLoggedIn() {
    if (!this.isLoggedIn()) return;
    const role = this.getRole();
    if (role === 'admin') {
      window.location.href = '/frontend-html/admin.html';
    } else {
      window.location.href = '/frontend-html/dashboard.html';
    }
  },

  /** Login via API */
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.access_token);
    return data;
  },

  /** Register via API */
  async register(email, password) {
    return await api.post('/auth/register', { email, password });
  },

  /** Forgot password */
  async forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email });
  },

  /** Reset password */
  async resetPassword(token, newPassword) {
    return await api.post('/auth/reset-password', { token, new_password: newPassword });
  },
};

window.auth = auth;
