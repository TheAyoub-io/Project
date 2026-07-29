/* =========================================================
   Dashboard Page Logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // Guard
  if (!auth.requireAuth('user')) return;

  const email = auth.getEmail();
  document.getElementById('current-date').textContent = formatDateShort(new Date());

  try {
    // 1. Fetch User Data
    const userData = await api.get('/auth/me');
    document.getElementById('user-name').textContent = userData.first_name || userData.email.split('@')[0];

    // Build Profile
    renderProfile(userData);

    // 2. Fetch Application Data
    const appData = await api.get('/applications/my-application');
    
    hide(document.getElementById('loader-container'));
    show(document.getElementById('dashboard-content'));

    if (appData && appData.id) {
      // User has an application
      show(document.getElementById('app-status-container'));
      renderApplication(appData, userData);
    } else {
      // No application
      show(document.getElementById('no-app-msg'));
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
    toast.error('Erreur de chargement des données.');
    hide(document.getElementById('loader-container'));
  }
});

/* ─── RENDER PROFILE ─────────────────────────────────── */
function renderProfile(user) {
  const container = document.getElementById('profile-info');
  container.innerHTML = `
    <div class="profile-item">
      <div class="profile-item-label">Nom complet</div>
      <div class="profile-item-value"><span class="icon">👤</span> ${user.first_name} ${user.last_name}</div>
    </div>
    <div class="profile-item">
      <div class="profile-item-label">Email</div>
      <div class="profile-item-value"><span class="icon">✉</span> ${user.email}</div>
    </div>
    <div class="profile-item">
      <div class="profile-item-label">CIN / Massar</div>
      <div class="profile-item-value"><span class="icon">🪪</span> ${user.cin_massar || 'Non renseigné'}</div>
    </div>
    <div class="profile-item">
      <div class="profile-item-label">Date de naissance</div>
      <div class="profile-item-value"><span class="icon">🎂</span> ${formatDate(user.date_of_birth) || 'Non renseignée'}</div>
    </div>
  `;
}

/* ─── RENDER APPLICATION ─────────────────────────────── */
function renderApplication(app, user) {
  document.getElementById('app-score').textContent = app.score || 0;

  // Render Badge
  const badgeContainer = document.getElementById('current-status-badge');
  const statusMap = {
    'Brouillon': { cls: 'badge-info', txt: 'Brouillon' },
    'Soumis': { cls: 'badge-warning', txt: 'En cours d\'examen' },
    'En attente': { cls: 'badge-warning', txt: 'En cours d\'examen' },
    'Admis': { cls: 'badge-success', txt: 'Admis' },
    'Refusé': { cls: 'badge-danger', txt: 'Refusé' },
    'Liste d\'attente': { cls: 'badge-warning', txt: 'Liste d\'attente' }
  };
  const st = statusMap[app.status] || { cls: 'badge-info', txt: app.status };
  badgeContainer.innerHTML = `<div class="badge ${st.cls}" style="font-size:0.875rem;padding:0.4rem 1rem;">${st.txt}</div>`;

  // Render Timeline Tracker
  renderTracker(app.status, app.created_at, app.updated_at);

  // Render Documents
  const docsContainer = document.getElementById('docs-list');
  docsContainer.innerHTML = '';
  const expectedDocs = [
    { key: 'bulletins_file_path', name: 'Bulletins de notes' },
    { key: 'parent_revenue_file_path', name: 'Attestation de revenu' },
    { key: 'residence_cert_file_path', name: 'Certificat de résidence' }
  ];
  let docsHtml = '';
  expectedDocs.forEach(d => {
    const isUploaded = !!app[d.key];
    docsHtml += `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;border:1px solid var(--card-border);border-radius:var(--r-lg);background:var(--surface);">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="width:2rem;height:2rem;border-radius:var(--r-md);background:${isUploaded ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'};color:${isUploaded ? '#10b981' : '#f59e0b'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
            ${isUploaded ? '📄' : '⚠️'}
          </div>
          <div>
            <div style="font-size:0.875rem;font-weight:700;">${d.name}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">${isUploaded ? 'Document fourni' : 'Non fourni'}</div>
          </div>
        </div>
      </div>
    `;
  });
  docsContainer.innerHTML = docsHtml;

  // Handle Admission specific logic
  if (app.status === 'Admis') {
    show(document.getElementById('attestation-btn-container'));
    show(document.getElementById('room-card'));
    // Generate random room number for demo
    const randomRoom = Math.floor(Math.random() * 50) + 100;
    document.getElementById('room-number').textContent = `Chambre ${randomRoom}`;

    // Setup PDF button
    document.getElementById('btn-download-pdf').addEventListener('click', () => generatePDF(app, user));
  }
}

/* ─── TIMELINE TRACKER ───────────────────────────────── */
function renderTracker(status, createdAt, updatedAt) {
  const container = document.getElementById('status-tracker');
  
  // Define steps
  const steps = [
    { key: 'submit', title: 'Dossier déposé', desc: 'Votre candidature a été enregistrée.' },
    { key: 'review', title: 'En cours d\'examen', desc: 'L\'administration étudie votre dossier.' },
    { key: 'decision', title: 'Décision finale', desc: 'Admission, Refus ou Liste d\'attente.' }
  ];

  // Determine state
  let currentStepIndex = 1; // At least submitted
  if (['Brouillon'].includes(status)) currentStepIndex = 0;
  if (['Soumis', 'En attente'].includes(status)) currentStepIndex = 1;
  if (['Admis', 'Refusé', 'Liste d\'attente'].includes(status)) currentStepIndex = 2;

  let html = '';
  steps.forEach((step, idx) => {
    let stateCls = 'pending';
    let dateStr = '';
    
    if (idx < currentStepIndex) {
      stateCls = 'completed';
      dateStr = (idx === 0) ? formatDate(createdAt) : '';
    } else if (idx === currentStepIndex) {
      stateCls = 'active';
      dateStr = 'En cours';
    }

    if (idx === 2 && currentStepIndex === 2) {
      stateCls = 'completed';
      dateStr = formatDate(updatedAt);
      step.desc = `Résultat: ${status}`;
    }

    html += `
      <div class="status-step ${stateCls}">
        <div class="status-step-dot"></div>
        <div class="status-step-content">
          <h4>${step.title}</h4>
          <p>${step.desc}</p>
          ${dateStr ? `<span style="font-size:0.7rem;color:var(--text-subtle);font-weight:700;">${dateStr}</span>` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/* ─── PDF GENERATION ─────────────────────────────────── */
function generatePDF(app, user) {
  // Populate hidden template
  document.getElementById('attest-name').textContent = `${user.first_name} ${user.last_name}`;
  document.getElementById('attest-dob').textContent = formatDate(user.date_of_birth) || 'N/A';
  document.getElementById('attest-pob').textContent = user.place_of_birth || 'N/A';
  document.getElementById('attest-gender').textContent = user.gender === 'M' ? 'Masculin' : (user.gender === 'F' ? 'Féminin' : 'N/A');
  document.getElementById('attest-filiere').textContent = app.filiere || 'N/A';
  document.getElementById('attest-date').textContent = formatDate(app.updated_at);
  document.getElementById('attest-today').textContent = formatDate(new Date());

  const element = document.getElementById('attestation-content');
  element.style.left = '0'; // Bring to viewport for render
  
  const opt = {
    margin: 10,
    filename: `Attestation_Admission_${user.first_name}_${user.last_name}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    element.style.left = '-9999px'; // Hide again
    toast.success('Attestation téléchargée avec succès.');
  });
}
