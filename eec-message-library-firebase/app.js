// EEC Message Library - Firebase Realtime Database
// Works with Firebase compat SDK

const DEFAULT_TEMPLATES = [
  {
    id: "onix-passive",
    name: "Passive Candidate — Startup Pitch",
    category: "recruitment",
    purpose: "First message to a passive candidate, selling the company and role.",
    body: `Hi {{first_name}},\n\n{{company_name}} is a growing, well-funded start-up based in {{city}}. Let me know if interested!`,
    updatedAt: null
  },
  {
    id: "smartpixel-intro",
    name: "Quick LinkedIn / Indeed Intro",
    category: "recruitment",
    purpose: "Short first-touch message naming the open role.",
    body: `Hi {{first_name}},\n\nI came across your profile. Are you looking for a new challenge?\n\nI am hiring a {{job_title}}.\n\n{{sender_name}}`,
    updatedAt: null
  },
  {
    id: "bd-launch",
    name: "New Company Launch — BD Outreach",
    category: "bizdev",
    purpose: "Congratulate a founder on launching.",
    body: `Hi {{first_name}},\n\nCongrats on launching {{company_name}}! I specialize in recruitment and HR strategy.\n\nWould you be open to a short chat?`,
    updatedAt: null
  }
];

let db = null;
let templates = DEFAULT_TEMPLATES;
let searchQuery = '';
let activeCategory = 'all';
let editingId = null; // null means the modal is creating a new template

// Initialize Firebase
function initFirebase() {
  if (!window.firebaseConfig) {
    console.error('Firebase config not found. Check firebase-config.js');
    showError('Config missing');
    return;
  }

  try {
    firebase.initializeApp(window.firebaseConfig);
    db = firebase.database();
    loadTemplates();
  } catch (error) {
    console.error('Firebase init error:', error);
    showError('Firebase init failed: ' + error.message);
  }
}

// Load templates from Firebase
function loadTemplates() {
  if (!db) return;

  db.ref('templates').on('value', (snapshot) => {
    if (snapshot.val()) {
      templates = snapshot.val();
    } else {
      templates = DEFAULT_TEMPLATES;
    }
    renderControls();
    renderTemplates();
    document.getElementById('loading').style.display = 'none';
  }, (error) => {
    console.error('Load error:', error);
    showError('Failed to load templates: ' + error.message);
  });
}

// Build the search bar + category filter buttons
function renderControls() {
  const controls = document.getElementById('controls');
  if (!controls) return;

  if (!Array.isArray(templates)) {
    templates = DEFAULT_TEMPLATES;
  }

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean))).sort();

  const categoryButtons = ['all', ...categories].map(cat => {
    const label = cat === 'all' ? 'All' : cat;
    const isActive = cat === activeCategory;
    return `<button type="button" class="filter-btn${isActive ? ' active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
  }).join('');

  controls.innerHTML = `
    <input type="text" id="search-input" placeholder="Search templates..." value="${escapeHtml(searchQuery)}" />
    <div class="filter-row">${categoryButtons}</div>
  `;

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTemplates();
  });

  controls.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderControls();
      renderTemplates();
    });
  });
}

// Apply search + category filter to the template list
function getFilteredTemplates() {
  if (!Array.isArray(templates)) return [];

  const q = searchQuery.trim().toLowerCase();

  return templates.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    if (!matchesCategory) return false;
    if (!q) return true;

    const haystack = [t.name, t.category, t.purpose, t.body].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

// Render templates in UI
function renderTemplates() {
  const container = document.getElementById('templates-list');
  container.innerHTML = '';

  if (!Array.isArray(templates)) {
    templates = DEFAULT_TEMPLATES;
  }

  // Add "New Template" card first
  const addCard = document.createElement('div');
  addCard.className = 'template-card add-card';
  addCard.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 2.5em; margin-bottom: 10px;">+</div>
      <button onclick="openAddModal()" style="width: 100%; padding: 12px; background: #505050; color: white; border: 1px solid #707070; border-radius: 6px; cursor: pointer; font-size: 1em;">Add New Template</button>
    </div>
  `;
  container.appendChild(addCard);

  const filtered = getFilteredTemplates();

  if (templates.length === 0) {
    showEmptyState('No templates yet. Add your first one above.');
    return;
  }

  if (filtered.length === 0) {
    showEmptyState('No templates match your search or filter.');
    return;
  }

  hideEmptyState();

  // Add filtered templates
  filtered.forEach((template) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    const lastEdited = template.updatedAt
      ? `<p class="last-edited">Last edited ${formatDate(template.updatedAt)}</p>`
      : '';
    card.innerHTML = `
      <h3>${escapeHtml(template.name)}</h3>
      <p class="category">${escapeHtml(template.category)}</p>
      ${lastEdited}
      <div class="template-body">${escapeHtml(template.body).replace(/\n/g, '<br>')}</div>
      <div class="buttons">
        <button onclick="copyToClipboard('${template.id}')">Copy</button>
        <button onclick="editTemplate('${template.id}')">Edit</button>
        <button onclick="deleteTemplate('${template.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function showEmptyState(message) {
  let empty = document.getElementById('empty-state');
  const container = document.getElementById('templates-list');
  if (!empty) {
    empty = document.createElement('div');
    empty.id = 'empty-state';
    container.parentNode.insertBefore(empty, container.nextSibling);
  }
  empty.textContent = message;
  empty.style.display = 'block';
}

function hideEmptyState() {
  const empty = document.getElementById('empty-state');
  if (empty) empty.style.display = 'none';
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Open modal to create a new template
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Template';
  document.getElementById('field-name').value = '';
  document.getElementById('field-category').value = '';
  document.getElementById('field-purpose').value = '';
  document.getElementById('field-body').value = '';
  document.getElementById('template-modal').classList.add('open');
}

// Open modal to edit an existing template
function editTemplate(id) {
  const template = templates.find(t => t.id === id);
  if (!template) return;

  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Template';
  document.getElementById('field-name').value = template.name || '';
  document.getElementById('field-category').value = template.category || '';
  document.getElementById('field-purpose').value = template.purpose || '';
  document.getElementById('field-body').value = template.body || '';
  document.getElementById('template-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('template-modal').classList.remove('open');
  editingId = null;
}

// Save whichever template the modal is currently editing (or create one)
function saveModal() {
  const name = document.getElementById('field-name').value.trim();
  const category = document.getElementById('field-category').value.trim();
  const purpose = document.getElementById('field-purpose').value.trim();
  const body = document.getElementById('field-body').value;

  if (!name) {
    alert('Name is required.');
    return;
  }
  if (!category) {
    alert('Category is required.');
    return;
  }

  if (editingId) {
    const template = templates.find(t => t.id === editingId);
    if (!template) return;
    template.name = name;
    template.category = category;
    template.purpose = purpose;
    template.body = body;
    template.updatedAt = new Date().toISOString();
  } else {
    templates.push({
      id: 'template-' + Date.now(),
      name: name,
      category: category,
      purpose: purpose,
      body: body,
      updatedAt: new Date().toISOString()
    });
  }

  closeModal();
  saveTemplates();
}

// Copy template to clipboard
function copyToClipboard(id) {
  const template = templates.find(t => t.id === id);
  if (template) {
    navigator.clipboard.writeText(template.body).then(() => {
      alert('Copied!');
    });
  }
}

// Delete template
function deleteTemplate(id) {
  if (confirm('Delete this template?')) {
    templates = templates.filter(t => t.id !== id);
    saveTemplates();
  }
}

// Save to Firebase
function saveTemplates() {
  if (!db) {
    alert('Firebase not connected');
    return;
  }

  db.ref('templates').set(templates, (error) => {
    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      alert('Saved!');
      renderControls();
      renderTemplates();
    }
  });
}

// Utility: escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// Show error
function showError(msg) {
  document.getElementById('loading').innerHTML = '❌ ' + msg;
  document.getElementById('loading').style.display = 'block';
}

// Start on page load
window.addEventListener('DOMContentLoaded', initFirebase);
