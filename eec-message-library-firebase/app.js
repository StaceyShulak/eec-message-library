// EEC Message Library - Firebase Realtime Database
// Works with Firebase compat SDK

const DEFAULT_TEMPLATES = [
  {
    id: "onix-passive",
    name: "Passive Candidate — Startup Pitch",
    category: "recruitment",
    purpose: "First message to a passive candidate, selling the company and role.",
    body: `Hi {{first_name}},\n\n{{company_name}} is a growing, well-funded start-up based in {{city}}. Let me know if interested!`
  },
  {
    id: "smartpixel-intro",
    name: "Quick LinkedIn / Indeed Intro",
    category: "recruitment",
    purpose: "Short first-touch message naming the open role.",
    body: `Hi {{first_name}},\n\nI came across your profile. Are you looking for a new challenge?\n\nI am hiring a {{job_title}}.\n\n{{sender_name}}`
  },
  {
    id: "bd-launch",
    name: "New Company Launch — BD Outreach",
    category: "bizdev",
    purpose: "Congratulate a founder on launching.",
    body: `Hi {{first_name}},\n\nCongrats on launching {{company_name}}! I specialize in recruitment and HR strategy.\n\nWould you be open to a short chat?`
  }
];

let db = null;
let templates = DEFAULT_TEMPLATES;

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
    renderTemplates();
    document.getElementById('loading').style.display = 'none';
  }, (error) => {
    console.error('Load error:', error);
    showError('Failed to load templates: ' + error.message);
  });
}

// Render templates in UI
function renderTemplates() {
  const container = document.getElementById('templates-list');
  container.innerHTML = '';

  if (!Array.isArray(templates)) {
    templates = DEFAULT_TEMPLATES;
  }

  templates.forEach((template) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <h3>${escapeHtml(template.name)}</h3>
      <p class="category">${escapeHtml(template.category)}</p>
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

// Copy template to clipboard
function copyToClipboard(id) {
  const template = templates.find(t => t.id === id);
  if (template) {
    navigator.clipboard.writeText(template.body).then(() => {
      alert('Copied!');
    });
  }
}

// Edit template
function editTemplate(id) {
  const template = templates.find(t => t.id === id);
  if (!template) return;

  const newBody = prompt('Edit template body:', template.body);
  if (newBody !== null && newBody !== template.body) {
    template.body = newBody;
    saveTemplates();
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
      renderTemplates();
    }
  });
}

// Utility: escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show error
function showError(msg) {
  document.getElementById('loading').innerHTML = '❌ ' + msg;
  document.getElementById('loading').style.display = 'block';
}

// Start on page load
window.addEventListener('DOMContentLoaded', initFirebase);
