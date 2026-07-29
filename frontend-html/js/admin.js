/* =========================================================
   Admin Dashboard Logic
   ========================================================= */

let allApplications = [];
let currentAppId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Guard - Admin only
  if (!auth.requireAuth('admin')) return;

  document.getElementById('admin-email').textContent = auth.getEmail();

  // Navigation
  setupTabs();

  // Load Data
  await loadData();

  // Setup Event Listeners
  setupFilters();
  setupModal();
  document.getElementById('btn-export').addEventListener('click', exportCSV);
  document.getElementById('btn-calc-scores').addEventListener('click', async () => {
    try {
      await api.post('/admin/applications/calculate-scores');
      toast.success('Scores recalculés avec succès.');
      await loadData();
    } catch (e) {
      toast.error('Erreur lors du calcul des scores.');
    }
  });
});

/* ─── TABS ───────────────────────────────────────────── */
function setupTabs() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      // Remove active
      navItems.forEach(n => n.classList.remove('active'));
      tabContents.forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
      // Set active
      item.classList.add('active');
      const targetId = `tab-${item.dataset.tab}`;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('active');
      }
      
      // Close mobile sidebar if open
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Mobile menu button
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
}

/* ─── DATA LOADING ───────────────────────────────────── */
async function loadData() {
  try {
    allApplications = await api.get('/admin/applications');
    renderStats();
    renderTables();
  } catch (err) {
    console.error('Admin load error:', err);
    toast.error('Impossible de charger les données.');
  }
}

/* ─── RENDER STATS ───────────────────────────────────── */
function renderStats() {
  const total = allApplications.length;
  const pending = allApplications.filter(a => ['Soumis', 'En attente'].includes(a.status)).length;
  const admitted = allApplications.filter(a => a.status === 'Admis').length;
  const rejected = allApplications.filter(a => a.status === 'Refusé').length;

  document.getElementById('badge-pending').textContent = pending;

  const statsContainer = document.getElementById('admin-stats');
  statsContainer.innerHTML = `
    <div class="card p-6 border-l-4" style="border-left-color: var(--primary);">
      <div class="text-xs font-bold text-muted uppercase tracking-wide">Total</div>
      <div class="text-3xl font-black mt-2">${total}</div>
    </div>
    <div class="card p-6 border-l-4" style="border-left-color: #f59e0b;">
      <div class="text-xs font-bold text-muted uppercase tracking-wide">En attente</div>
      <div class="text-3xl font-black mt-2">${pending}</div>
    </div>
    <div class="card p-6 border-l-4" style="border-left-color: #10b981;">
      <div class="text-xs font-bold text-muted uppercase tracking-wide">Admis</div>
      <div class="text-3xl font-black mt-2">${admitted}</div>
    </div>
    <div class="card p-6 border-l-4" style="border-left-color: #ef4444;">
      <div class="text-xs font-bold text-muted uppercase tracking-wide">Refusés</div>
      <div class="text-3xl font-black mt-2">${rejected}</div>
    </div>
  `;
}

/* ─── RENDER TABLES ──────────────────────────────────── */
function getStatusBadge(status) {
  const map = {
    'Soumis': 'badge-info',
    'En attente': 'badge-warning',
    'Liste d\'attente': 'badge-warning',
    'Admis': 'badge-success',
    'Refusé': 'badge-danger'
  };
  const cls = map[status] || 'badge-info';
  return `<span class="badge ${cls}">${status}</span>`;
}

function renderTables(filteredData = allApplications) {
  // Recent Table (max 5)
  const recentHtml = allApplications.slice(0, 5).map(app => `
    <tr>
      <td>${formatDateShort(app.created_at)}</td>
      <td><strong>${app.user.first_name} ${app.user.last_name}</strong></td>
      <td class="text-muted text-xs">${app.filiere}</td>
      <td><strong>${app.score || 0}</strong></td>
      <td>${getStatusBadge(app.status)}</td>
    </tr>
  `).join('');
  document.getElementById('recent-table-body').innerHTML = recentHtml || '<tr><td colspan="5" class="text-center text-muted">Aucune candidature</td></tr>';

  // Full Table
  const appsHtml = filteredData.map(app => `
    <tr>
      <td class="text-muted text-xs">#${app.id}</td>
      <td>
        <div><strong>${app.user.first_name} ${app.user.last_name}</strong></div>
        <div class="text-xs text-muted">${app.user.email}</div>
      </td>
      <td>${app.parents_revenue} MAD</td>
      <td class="text-primary font-bold">${app.score || 0}</td>
      <td>${getStatusBadge(app.status)}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openModal(${app.id})">Gérer</button>
      </td>
    </tr>
  `).join('');
  document.getElementById('apps-table-body').innerHTML = appsHtml || '<tr><td colspan="6" class="text-center text-muted">Aucun résultat</td></tr>';
}

/* ─── FILTERS & SEARCH ───────────────────────────────── */
function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const statusSelect = document.getElementById('filter-status');

  const filterData = () => {
    const term = searchInput.value.toLowerCase();
    const status = statusSelect.value;

    const filtered = allApplications.filter(app => {
      const matchSearch = `${app.user.first_name} ${app.user.last_name} ${app.user.email}`.toLowerCase().includes(term);
      const matchStatus = status ? app.status === status : true;
      return matchSearch && matchStatus;
    });
    
    renderTables(filtered);
  };

  searchInput.addEventListener('input', filterData);
  statusSelect.addEventListener('change', filterData);
}

/* ─── MODAL MANAGEMENT ───────────────────────────────── */
function setupModal() {
  const modal = document.getElementById('app-modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    currentAppId = null;
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  // Update Status Button
  document.getElementById('btn-update-status').addEventListener('click', async () => {
    if (!currentAppId) return;
    const newStatus = document.getElementById('modal-action-select').value;
    if (!newStatus) return;

    try {
      await api.patch(`/admin/applications/${currentAppId}/status`, { status: newStatus });
      toast.success('Statut mis à jour.');
      modal.classList.remove('open');
      await loadData();
    } catch (e) {
      toast.error('Erreur lors de la mise à jour.');
    }
  });
}

window.openModal = function(id) {
  const app = allApplications.find(a => a.id === id);
  if (!app) return;
  
  currentAppId = app.id;
  document.getElementById('modal-title').textContent = `Candidature #${app.id}`;
  document.getElementById('modal-status-badge').innerHTML = getStatusBadge(app.status);
  
  // Build Body
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div class="grid grid-2 gap-4">
      <div class="card p-4">
        <h4 class="text-sm font-bold text-primary mb-2 uppercase">Candidat</h4>
        <p><strong>Nom:</strong> ${app.user.first_name} ${app.user.last_name}</p>
        <p><strong>CIN/Massar:</strong> ${app.user.cin_massar || 'N/A'}</p>
        <p><strong>Sexe:</strong> ${app.user.gender}</p>
        <p><strong>Email:</strong> <a href="mailto:${app.user.email}" class="text-primary">${app.user.email}</a></p>
        <p><strong>Téléphone:</strong> ${app.phone_number || 'N/A'}</p>
        <p><strong>Ville ID:</strong> ${app.city_id}</p>
      </div>

      <div class="card p-4">
        <h4 class="text-sm font-bold text-primary mb-2 uppercase">Dossier Académique</h4>
        <p><strong>Filière:</strong> ${app.filiere}</p>
        <p><strong>Revenu Parents:</strong> ${app.parents_revenue} MAD</p>
        <p><strong>Père:</strong> ${app.father_name || 'N/A'} (${app.father_profession || 'N/A'})</p>
        <p><strong>Mère:</strong> ${app.mother_name || 'N/A'} (${app.mother_profession || 'N/A'})</p>
        <p><strong>Score Système:</strong> <span class="text-xl font-black text-primary">${app.score || 0}</span></p>
      </div>
      
      <div class="card p-4" style="grid-column: 1 / -1;">
        <h4 class="text-sm font-bold text-primary mb-2 uppercase">Documents Justificatifs</h4>
        <div class="flex gap-4 flex-wrap">
          ${docLink('Bulletins', app.bulletins_file_path)}
          ${docLink('Revenu', app.parent_revenue_file_path)}
          ${docLink('Résidence', app.residence_cert_file_path)}
        </div>
      </div>
    </div>
  `;

  document.getElementById('app-modal').classList.add('open');
};

function docLink(label, path) {
  if (!path) return `<div class="badge badge-danger">${label} (Manquant)</div>`;
  // Construct full URL (assuming path is relative to backend root or media folder)
  const url = window.APP_CONFIG?.API_URL ? `${window.APP_CONFIG.API_URL}/${path}` : `http://localhost:8000/${path}`;
  return `<a href="${url}" target="_blank" class="badge badge-info" style="text-decoration:none;">📄 ${label} (Voir)</a>`;
}

/* ─── EXPORT CSV ─────────────────────────────────────── */
function exportCSV() {
  if (!allApplications.length) {
    toast.info('Aucune donnée à exporter.');
    return;
  }

  const headers = ['ID', 'Nom', 'Prenom', 'Email', 'CIN', 'Filiere', 'Revenu', 'Score', 'Statut', 'Date'];
  const rows = allApplications.map(app => [
    app.id,
    `"${app.user.last_name}"`,
    `"${app.user.first_name}"`,
    app.user.email,
    app.user.cin_massar,
    `"${app.filiere}"`,
    app.parents_revenue,
    app.score || 0,
    app.status,
    formatDateShort(app.created_at)
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + '\n' 
    + rows.map(r => r.join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `export_candidatures_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
