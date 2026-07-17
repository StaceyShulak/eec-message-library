// Firebase Realtime Database Template Library
// Loads config from firebase-config.js

// Wait for Firebase SDK and config to load
let firebaseDB;
let editPasscode = localStorage.getItem('editPasscode');

async function initializeFirebase() {
  // Wait for config to be available
  if (!window.firebaseConfig) {
    console.error('Firebase config not loaded. Make sure firebase-config.js is included in index.html');
    return;
  }

  // Initialize Firebase
  firebase.initializeApp(window.firebaseConfig);
  firebaseDB = firebase.database();

  // Load templates
  loadTemplates();
}

// Call on page load
document.addEventListener('DOMContentLoaded', initializeFirebase);

// Load templates from Firebase
function loadTemplates() {
  firebaseDB.ref('templates').on('value', (snapshot) => {
    const data = snapshot.val();
    const templates = data || DEFAULT_TEMPLATES;
    renderTemplates(templates);
    saveToLocal(templates);
  });
}

// Render templates in UI
function renderTemplates(templates) {
  const container = document.getElementById('templates-list');
  if (!container) return;

  container.innerHTML = '';

  templates.forEach((template) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <h3>${template.name}</h3>
      <p class="category">${template.category}</p>
      <p class="purpose">${template.purpose}</p>
      <div class="template-body">${template.body}</div>
      <div class="buttons">
        <button onclick="editTemplate('${template.id}')">Edit</button>
        <button onclick="copyTemplate('${template.id}')">Copy</button>
        <button onclick="deleteTemplate('${template.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Copy template to clipboard
function copyTemplate(id) {
  const templates = JSON.parse(localStorage.getItem('templates') || '[]');
  const template = templates.find(t => t.id === id);
  if (template) {
    navigator.clipboard.writeText(template.body);
    alert('Copied to clipboard!');
  }
}

// Edit template
function editTemplate(id) {
  if (!editPasscode) {
    editPasscode = prompt('Enter edit passcode:');
    if (!editPasscode) return;
    localStorage.setItem('editPasscode', editPasscode);
  }

  const templates = JSON.parse(localStorage.getItem('templates') || '[]');
  const template = templates.find(t => t.id === id);
  if (!template) return;

  const newBody = prompt('Edit template:', template.body);
  if (newBody !== null) {
    template.body = newBody;
    saveTemplates(templates);
  }
}

// Delete template
function deleteTemplate(id) {
  if (!confirm('Delete this template?')) return;

  const templates = JSON.parse(localStorage.getItem('templates') || '[]');
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);
}

// Save templates to Firebase
function saveTemplates(templates) {
  firebaseDB.ref('templates').set(templates, (error) => {
    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      alert('Saved!');
    }
  });
}

// Save to local storage
function saveToLocal(templates) {
  localStorage.setItem('templates', JSON.stringify(templates));
}

// Default templates
const DEFAULT_TEMPLATES = [
  {
    id: "onix-passive",
    name: "Passive Candidate — Startup Pitch",
    category: "recruitment",
    purpose: "First message to a passive candidate, selling the company and role.",
    body: `Hi {{first_name}},

{{company_name}} is a growing, well-funded start-up based in {{city}} and is looking for talent. The team works onsite in a nice office in {{office_location}}. Let me know if you would like to discuss further! :)`
  },
  {
    id: "smartpixel-intro",
    name: "Quick LinkedIn / Indeed Intro",
    category: "recruitment",
    purpose: "Short first-touch message naming the open role and company.",
    body: `Hi {{first_name}},

I came across your profile on Indeed. Are you looking for a new challenge?

I am hiring a {{job_title}} for this company: {{company_url}}

I can share the job description and we can discuss from there!

{{sender_name}}`
  },
  {
    id: "layoff-referral",
    name: "Layoff Outreach — Ask for Referrals",
    category: "recruitment",
    purpose: "General reach-out after layoffs, no specific company named.",
    body: `Hi {{first_name}},

I hire talent across multiple companies. I came across your profile on LinkedIn. Sorry to hear about the layoffs. Feel free to follow my pages here for future job postings:

https://www.facebook.com/shulak.stacey
https://www.linkedin.com/company/e-plus-e-consulting-consultation/`
  }
];
