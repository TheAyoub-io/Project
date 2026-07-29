/* =========================================================
   Application Form Logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAuth('user')) return;

  // 1. Check if already applied
  try {
    const existing = await api.get('/applications/my-application');
    if (existing && existing.id) {
      show(document.getElementById('already-submitted-msg'));
      hide(document.getElementById('steps-progress'));
      hide(document.getElementById('apply-form'));
      return;
    }
  } catch (err) {
    // 404 is fine (not found = no app)
    if (err.status !== 404) {
      console.error(err);
      toast.error('Erreur lors de la vérification du statut.');
    }
  }

  // 2. Fetch Cities
  await fetchCities();

  // 3. Setup Wizard
  setupWizard();

  // 4. Setup File Uploads
  setupFiles();
});

/* ─── CITIES FETCH ───────────────────────────────────── */
async function fetchCities() {
  try {
    const data = await api.get('/data/cities');
    const select = document.getElementById('city_id');
    select.innerHTML = '<option value="">Sélectionner une ville</option>';
    data.forEach(c => {
      select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
  } catch (err) {
    console.error('Failed to load cities', err);
  }
}

/* ─── WIZARD LOGIC ───────────────────────────────────── */
let currentStep = 1;
const totalSteps = 4;

function setupWizard() {
  const nextBtns = document.querySelectorAll('.btn-next');
  const prevBtns = document.querySelectorAll('.btn-prev');
  const certifyCheckbox = document.getElementById('certify');
  const finalBtn = document.getElementById('submit-final-btn');
  const form = document.getElementById('apply-form');

  nextBtns.forEach(btn => btn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) populateSummary();
      currentStep++;
      updateUI();
    }
  }));

  prevBtns.forEach(btn => btn.addEventListener('click', () => {
    currentStep--;
    updateUI();
  }));

  certifyCheckbox?.addEventListener('change', (e) => {
    finalBtn.disabled = !e.target.checked;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return; // double check files
    if (!certifyCheckbox.checked) return;

    await submitApplication();
  });
}

function updateUI() {
  // Update Sections
  document.querySelectorAll('.form-section').forEach((sec, idx) => {
    sec.classList.toggle('active', idx + 1 === currentStep);
  });

  // Update Progress
  const indicators = document.querySelectorAll('.step-indicator');
  indicators.forEach((ind, idx) => {
    const stepNum = idx + 1;
    ind.classList.remove('active', 'completed');
    if (stepNum < currentStep) ind.classList.add('completed');
    if (stepNum === currentStep) ind.classList.add('active');
  });

  const progressFill = document.getElementById('progress-fill');
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  progressFill.style.width = `${percentage}%`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
  const section = document.getElementById(`step-${step}`);
  const inputs = section.querySelectorAll('input[required], select[required]');
  let valid = true;

  inputs.forEach(input => {
    if (!input.value) {
      valid = false;
      input.style.borderColor = '#ef4444';
      input.addEventListener('input', () => input.style.borderColor = '', { once: true });
    }
  });

  if (!valid) {
    toast.error('Veuillez remplir tous les champs obligatoires.');
  }
  return valid;
}

function populateSummary() {
  document.getElementById('sum-name').textContent = `${document.getElementById('first_name').value} ${document.getElementById('last_name').value}`;
  document.getElementById('sum-gender').textContent = document.getElementById('gender').value === 'M' ? 'Masculin' : 'Féminin';
  document.getElementById('sum-massar').textContent = document.getElementById('cin_massar').value;
  
  const citySelect = document.getElementById('city_id');
  document.getElementById('sum-city').textContent = citySelect.options[citySelect.selectedIndex].text;

  document.getElementById('sum-filiere').textContent = document.getElementById('filiere').value;
  document.getElementById('sum-revenue').textContent = document.getElementById('parents_revenue').value + ' MAD';

  const f1 = document.getElementById('bulletins_file').files[0];
  const f2 = document.getElementById('parent_revenue_file').files[0];
  const f3 = document.getElementById('residence_cert_file').files[0];

  if (f1) document.getElementById('sum-doc-1').textContent = f1.name;
  if (f2) document.getElementById('sum-doc-2').textContent = f2.name;
  if (f3) document.getElementById('sum-doc-3').textContent = f3.name;
}

/* ─── FILE UPLOAD LOGIC ──────────────────────────────── */
function setupFiles() {
  const setupZone = (id, fileId) => {
    const zone = document.getElementById(id);
    const input = document.getElementById(fileId);
    if (!zone || !input) return;

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        handleFileSelect(input, id);
      }
    });

    input.addEventListener('change', () => handleFileSelect(input, id));
  };

  setupZone('drop-bulletins', 'bulletins_file');
  setupZone('drop-revenue', 'parent_revenue_file');
  setupZone('drop-residence', 'residence_cert_file');
}

function handleFileSelect(input, zoneId) {
  const file = input.files[0];
  if (!file) return;

  const zone = document.getElementById(zoneId);
  const previewId = zoneId.replace('drop-', 'preview-');
  const preview = document.getElementById(previewId);

  // Validate size (< 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Le fichier est trop volumineux (Max 5Mo).');
    input.value = '';
    return;
  }

  zone.classList.add('hidden');
  preview.classList.remove('hidden');

  const mbSize = (file.size / (1024 * 1024)).toFixed(2);
  preview.innerHTML = `
    <div class="file-preview">
      <div class="icon">📄</div>
      <div class="file-preview-info">
        <div class="file-preview-name" title="${file.name}">${file.name}</div>
        <div class="file-preview-size">${mbSize} Mo</div>
      </div>
      <button type="button" class="file-preview-remove" onclick="removeFile('${input.id}', '${zoneId}')">✕</button>
    </div>
  `;
}

window.removeFile = function(inputId, zoneId) {
  document.getElementById(inputId).value = '';
  document.getElementById(zoneId).classList.remove('hidden');
  document.getElementById(zoneId.replace('drop-', 'preview-')).classList.add('hidden');
};

/* ─── SUBMISSION ─────────────────────────────────────── */
async function submitApplication() {
  const btn = document.getElementById('submit-final-btn');
  const alertContainer = document.getElementById('alert-container');
  const originalText = btn.innerHTML;
  
  btn.innerHTML = '<div class="spinner" style="width:1.25rem;height:1.25rem;border-width:2px;border-top-color:#fff;"></div>';
  btn.disabled = true;
  alertContainer.innerHTML = '';

  try {
    // 1. Update Profile (Step 1)
    await api.patch('/auth/me', {
      first_name: document.getElementById('first_name').value,
      last_name: document.getElementById('last_name').value,
      date_of_birth: document.getElementById('date_of_birth').value,
      place_of_birth: document.getElementById('place_of_birth').value || null,
      gender: document.getElementById('gender').value,
      cin_massar: document.getElementById('cin_massar').value
    });

    // 2. Submit Application JSON (Step 2)
    const appData = {
      address: document.getElementById('address').value,
      city_id: parseInt(document.getElementById('city_id').value),
      phone_number: document.getElementById('phone_number').value || null,
      filiere: document.getElementById('filiere').value,
      father_name: document.getElementById('father_name').value || null,
      father_profession: document.getElementById('father_profession').value || null,
      mother_name: document.getElementById('mother_name').value || null,
      mother_profession: document.getElementById('mother_profession').value || null,
      parents_revenue: parseFloat(document.getElementById('parents_revenue').value),
      illnesses: document.getElementById('illnesses').value || null,
      status: 'Soumis'
    };

    const appResponse = await api.post('/applications/my-application', appData);

    // 3. Upload Files (Step 3)
    const uploadFile = async (inputId, documentType) => {
      const file = document.getElementById(inputId).files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/applications/my-application/documents/${documentType}`, formData);
    };

    await Promise.all([
      uploadFile('bulletins_file', 'bulletins'),
      uploadFile('parent_revenue_file', 'parent_revenue'),
      uploadFile('residence_cert_file', 'residence_cert')
    ]);

    // Success
    document.getElementById('apply-form').innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">🎉</div>
        <h2 style="font-size:2rem;margin-bottom:1rem;">Candidature Soumise !</h2>
        <p style="color:var(--text-muted);margin-bottom:2rem;">Votre dossier a été enregistré avec succès et est maintenant en cours d'examen.</p>
        <a href="dashboard.html" class="btn btn-primary btn-lg">Accéder à mon espace</a>
      </div>
    `;

  } catch (err) {
    console.error(err);
    btn.innerHTML = originalText;
    btn.disabled = false;
    let detail = err.data?.detail || 'Une erreur est survenue lors de la soumission.';
    if (Array.isArray(detail)) detail = detail[0].msg;
    alertContainer.innerHTML = `<div class="alert alert-danger" style="margin-bottom:1.5rem">${detail}</div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
