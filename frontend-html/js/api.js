/* =========================================================
   API Client — Native fetch() wrapper with JWT interceptor
   Replaces Axios from the React version
   ========================================================= */

const API_BASE_URL = window.APP_CONFIG?.API_URL || 'http://localhost:8000';

const api = {
  /**
   * Core request method
   */
  async request(method, endpoint, { body, headers = {}, isFormData = false } = {}) {
    const token = localStorage.getItem('token');
    const config = {
      method,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 — expired/invalid token
    if (response.status === 401) {
      const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
      if (!isAuthEndpoint && token) {
        localStorage.removeItem('token');
        const publicPaths = ['/', '/login.html', '/register.html', '/forgot-password.html', '/reset-password.html', '/index.html'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login.html?session=expired';
        }
      }
    }

    // Parse response
    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); } catch { errorData = { detail: response.statusText }; }
      const err = new Error(errorData.detail || 'Request failed');
      err.status = response.status;
      err.data = errorData;
      throw err;
    }

    // Some endpoints might return empty body (204)
    if (response.status === 204) return null;

    try {
      return await response.json();
    } catch {
      return null;
    }
  },

  get(endpoint, params) {
    let url = endpoint;
    if (params) {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
      ).toString();
      if (qs) url += `?${qs}`;
    }
    return this.request('GET', url);
  },

  post(endpoint, body) {
    return this.request('POST', endpoint, { body });
  },

  put(endpoint, body) {
    return this.request('PUT', endpoint, { body });
  },

  patch(endpoint, body) {
    return this.request('PATCH', endpoint, { body });
  },

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  },

  /** Upload multipart/form-data */
  upload(endpoint, formData, method = 'POST') {
    return this.request(method, endpoint, { body: formData, isFormData: true });
  },
};

// Make globally available
window.api = api;
