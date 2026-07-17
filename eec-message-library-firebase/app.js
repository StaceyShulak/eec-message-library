// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA9ozbmuuY5eWiZPHErbRZ0ZD21MndH8Rs",
  authDomain: "eec-message-library.firebaseapp.com",
  databaseURL: "https://eec-message-library-default-rtdb.firebaseio.com",
  projectId: "eec-message-library",
  storageBucket: "eec-message-library.firebasestorage.app",
  messagingSenderId: "440036903502",
  appId: "1:440036903502:web:20c610ffd417d5fab6111f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const FIELD_LABELS = {
  first_name: "First name",
  company_name: "Company name",
  city: "City",
  office_location: "Office location",
  job_title: "Job title",
  company_url: "Company URL",
  sender_name: "Signed as"
};
const FIELD_DEFAULTS = {
  city: "Montreal",
  office_location: "Old Montreal",
  sender_name: "Stacey"
};
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "recruitment", label: "Recruitment" },
  { id: "bizdev", label: "Business Dev" }
];
const PASSCODE_KEY = "eecEditPasscode";

// Default templates
const DEFAULT_TEMPLATES = [
  { id: "onix-passive", name: "Passive Candidate — Startup Pitch", category: "recruitment", purpose: "First message to a passive candidate, selling the company and role.", body: "Hi {{first_name}},\n\n{{company_name}} is a growing, well-funded start-up based in {{city}} and is looking for talent. The team works onsite in a nice office in {{office_location}}. Let me know if you would like to discuss further! :)" },
  { id: "smartpixel-intro", name: "Quick LinkedIn / Indeed Intro", category: "recruitment", purpose: "Short first-touch message naming the open role and company.", body: "Hi {{first_name}},\n\nI came across your profile on Indeed. Are you looking for a new challenge?\n\nI am hiring a {{job_title}} for this company: {{company_url}}\n\nI can share the job description and we can discuss from there!\n\n{{sender_name}}" },
  { id: "layoff-referral", name: "Layoff Outreach — Ask for Referrals", category: "recruitment", purpose: "General reach-out after layoffs, no specific company named.", body: "Hi {{first_name}},\n\nI hire talent across multiple companies. I came across your profile on LinkedIn. Sorry to hear about the layoffs. Feel free to follow my pages here for future job postings:\n\nhttps://www.facebook.com/shulak.stacey\nhttps://www.linkedin.com/company/e-plus-e-consulting-consultation/" },
  { id: "bd-launch", name: "New Company Launch — BD Outreach", category: "bizdev", purpose: "Congratulate a founder on launching and pitch recruiting/HR support.", body: "Hi {{first_name}},\n\nCongrats on launching {{company_name}}, very exciting! I specialize in supporting growing companies like yours with both recruitment and HR strategy.\n\nI've been running my own consulting business for the past 8 years and bring close to 20 years of experience overall, partnering with teams across video games, software, and increasingly AI.\n\nWould you be open to a short chat next week?" },
  { id: "bd-hiring", name: "Active Hiring — BD Outreach", category: "bizdev", purpose: "Reach out to a company that's actively hiring to offer recruiting/HR support.", body: "Hi {{first_name}}, I see {{company_name}} is hiring for a number of positions. I've been running my own consulting business partnering with teams across video games, software, and increasingly AI. Do you need any help on the recruitment or HR side of things?" }
];

let TEMPLATES = [];
let activeCategory = "all";
let searchTerm = "";
let activeTemplateId = null;
let editMode = false;
let creatingNew = false;
let editDraft = null;
let fieldValues = {};
let loadError = false;

function setStatus(state, text){
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  dot.className = 'dot' + (state === 'error' ? ' err' : state === 'loading' ? ' loading' : '');
  txt.textContent = text;
}

function detectFields(body){
  const matches = [...body.matchAll(/{{(.*?)}}/g)].map(m => m[1].trim()).filter(Boolean);
  return [...new Set(matches)];
}
function slugify(name){
  let base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'template';
  let id = base, n = 1;
  while(TEMPLATES.some(t => t.id === id)){ id = `${base}-${++n}`; }
  return id;
}
function categoryLabel(cat){ return cat === 'recruitment' ? 'Recruitment' : 'Business Dev'; }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function saveToFirebase(){
  return db.ref('templates').set(TEMPLATES);
}

async function ensurePasscode(){
  let stored = sessionStorage.getItem(PASSCODE_KEY);
  if(stored) return stored;
  const entered = prompt('Enter the edit passcode to save changes:');
  if(entered === null || entered.trim() === '') return null;
  sessionStorage.setItem(PASSCODE_KEY, entered.trim());
  return entered.trim();
}

function renderTabs(){
  const wrap = document.getElementById('tabs');
  wrap.innerHTML = '';
  CATEGORIES.forEach(c => {
    const el = document.createElement('div');
    el.className = 'tab' + (activeCategory === c.id ? ' active' : '');
    el.textContent = c.label;
    el.onclick = () => { activeCategory = c.id; renderList(); };
    wrap.appendChild(el);
  });
}

function filteredTemplates(){
  return TEMPLATES.filter(t => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const s = searchTerm.trim().toLowerCase();
    const matchesSearch = !s || t.name.toLowerCase().includes(s) || t.purpose.toLowerCase().includes(s);
    return matchesCat && matchesSearch;
  });
}

function renderList(){
  renderTabs();
  const list = document.getElementById('tplList');
  const items = filteredTemplates();
  document.getElementById('countLabel').textContent = `${items.length} message${items.length === 1 ? '' : 's'}`;
  list.innerHTML = '';
  if(items.length === 0){
    const el = document.createElement('div');
    el.style.padding = '20px 14px';
    el.style.fontSize = '13px';
    el.style.color = 'var(--light)';
    el.textContent = TEMPLATES.length ? 'No messages match your search.' : (loadError ? 'Could not load templates.' : 'No templates yet.');
    list.appendChild(el);
    return;
  }
  items.forEach(t => {
    const card = document.createElement('div');
    const active = t.id === activeTemplateId && !creatingNew;
    card.className = 'tpl-card' + (active ? ' active' : '');
    card.innerHTML = `
      <p class="tpl-name">${escapeHtml(t.name)}</p>
      <p class="tpl-purpose">${escapeHtml(t.purpose)}</p>
      <span class="badge">${categoryLabel(t.category)}</span>
    `;
    card.onclick = () => { activeTemplateId = t.id; editMode = false; creatingNew = false; renderList(); renderPanel(); };
    list.appendChild(card);
  });
}

function renderPanel(){
  const panel = document.getElementById('panel');

  if(loadError && TEMPLATES.length === 0){
    panel.innerHTML = `<div class="empty-state"><div class="serif">Couldn't load templates</div><div>Check your Firebase config.</div></div>`;
    return;
  }

  if(creatingNew){ renderEditPanel(true); return; }

  const t = TEMPLATES.find(x => x.id === activeTemplateId);
  if(!t){
    panel.innerHTML = `
      <div class="empty-state">
        <div class="serif">Select a message on the left</div>
        <div>Fill in the fields and copy the finished message — or edit it to make it your own.</div>
        <button class="icon-btn" id="emptyNewBtn">+ New template</button>
      </div>`;
    document.getElementById('emptyNewBtn').onclick = startNewTemplate;
    return;
  }

  if(editMode){ renderEditPanel(false, t); return; }

  if(!fieldValues[t.id]) fieldValues[t.id] = {};
  const fields = detectFields(t.body);
  fields.forEach(f => {
    if(fieldValues[t.id][f] === undefined){
      fieldValues[t.id][f] = FIELD_DEFAULTS[f] || '';
    }
  });

  const fieldsHtml = fields.length ? `
    <div class="fields">
      ${fields.map(f => `
        <div class="field">
          <label for="f-${f}">${FIELD_LABELS[f] || f}</label>
          <input type="text" id="f-${f}" data-field="${f}" value="${escapeAttr(fieldValues[t.id][f])}" placeholder="${FIELD_LABELS[f] || f}">
        </div>
      `).join('')}
    </div>
  ` : '';

  panel.innerHTML = `
    <div class="panel-top">
      <div>
        <p class="panel-eyebrow">${categoryLabel(t.category)}</p>
        <h2>${escapeHtml(t.name)}</h2>
        <p class="purpose">${escapeHtml(t.purpose)}</p>
      </div>
      <div class="panel-actions">
        <button class="icon-btn" id="dupBtn">Duplicate</button>
        <button class="icon-btn" id="editBtn">Edit</button>
        <button class="icon-btn danger" id="delBtn">Delete</button>
      </div>
    </div>
    ${fieldsHtml}
    <div class="preview-label">
      <span>Preview</span>
      <span class="char-count" id="charCount"></span>
    </div>
    <div class="preview" id="previewBox"></div>
    <div class="actions">
      <button class="copy" id="copyBtn">Copy message</button>
    </div>
  `;

  panel.querySelectorAll('input[data-field]').forEach(inp => {
    inp.addEventListener('input', e => {
      fieldValues[t.id][e.target.dataset.field] = e.target.value;
      updatePreview(t);
    });
  });
  document.getElementById('copyBtn').addEventListener('click', () => copyPreview(t));
  document.getElementById('editBtn').addEventListener('click', () => { editMode = true; renderPanel(); });
  document.getElementById('dupBtn').addEventListener('click', () => duplicateTemplate(t));
  document.getElementById('delBtn').addEventListener('click', () => deleteTemplate(t));

  updatePreview(t);
}

function updatePreview(t){
  const box = document.getElementById('previewBox');
  let html = escapeHtml(t.body);
  const fields = detectFields(t.body);
  fields.forEach(f => {
    const val = (fieldValues[t.id] && fieldValues[t.id][f]) || '';
    const token = `{{${f}}}`;
    const replacement = val ? escapeHtml(val) : `<span class="missing">${FIELD_LABELS[f] || f}</span>`;
    html = html.split(token).join(replacement);
  });
  box.innerHTML = html;
  document.getElementById('charCount').textContent = `${buildMessage(t).length} characters`;
}

function buildMessage(t){
  let out = t.body;
  detectFields(t.body).forEach(f => {
    const val = (fieldValues[t.id] && fieldValues[t.id][f]) || '';
    out = out.split(`{{${f}}}`).join(val);
  });
  return out;
}

function copyPreview(t){
  navigator.clipboard.writeText(buildMessage(t)).then(() => {
    const btn = document.getElementById('copyBtn');
    const original = btn.textContent;
    btn.textContent = 'Copied ✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
  });
}

function startNewTemplate(){
  creatingNew = true;
  editMode = false;
  activeTemplateId = null;
  editDraft = { id: null, name: '', category: 'recruitment', purpose: '', body: '' };
  renderList();
  renderPanel();
}

function duplicateTemplate(t){
  editDraft = { id: null, name: t.name + ' (Copy)', category: t.category, purpose: t.purpose, body: t.body };
  creatingNew = true;
  editMode = false;
  renderList();
  renderPanel();
}

async function deleteTemplate(t){
  if(!confirm(`Delete "${t.name}"?`)) return;
  const next = TEMPLATES.filter(x => x.id !== t.id);
  try {
    await saveToFirebase();
    TEMPLATES = next;
    await saveToFirebase();
    activeTemplateId = null;
    renderList();
    renderPanel();
  } catch(e) {
    alert('Error saving: ' + e.message);
  }
}

function renderEditPanel(isNew, t){
  editDraft = isNew ? editDraft : { id: t.id, name: t.name, category: t.category, purpose: t.purpose, body: t.body };
  const panel = document.getElementById('panel');
  panel.innerHTML = `
    <p class="panel-eyebrow">${isNew ? 'New template' : 'Editing template'}</p>
    <div class="edit-form">
      <div class="edit-grid">
        <div class="field">
          <label>Name</label>
          <input type="text" id="d-name" value="${escapeAttr(editDraft.name)}" placeholder="e.g. Passive Candidate — Startup Pitch">
        </div>
        <div class="field">
          <label>Category</label>
          <select id="d-category">
            <option value="recruitment" ${editDraft.category === 'recruitment' ? 'selected' : ''}>Recruitment</option>
            <option value="bizdev" ${editDraft.category === 'bizdev' ? 'selected' : ''}>Business Dev</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Purpose</label>
        <input type="text" id="d-purpose" value="${escapeAttr(editDraft.purpose)}" placeholder="One line describing when to use this message">
      </div>
      <div class="field">
        <label>Message body</label>
        <textarea id="d-body" placeholder="Write the message…">${escapeHtml(editDraft.body)}</textarea>
      </div>
      <div class="edit-actions">
        <button class="save" id="saveBtn">Save template</button>
        <button class="cancel" id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;
  document.getElementById('saveBtn').onclick = saveDraft;
  document.getElementById('cancelBtn').onclick = () => {
    editMode = false; creatingNew = false;
    renderList(); renderPanel();
  };
}

async function saveDraft(){
  const name = document.getElementById('d-name').value.trim();
  const category = document.getElementById('d-category').value;
  const purpose = document.getElementById('d-purpose').value.trim();
  const body = document.getElementById('d-body').value;
  const saveBtn = document.getElementById('saveBtn');

  if(!name || !body.trim()){
    alert('Please give the template a name and body.');
    return;
  }

  const passcode = await ensurePasscode();
  if(!passcode) return;

  // Simple passcode check
  if(passcode !== sessionStorage.getItem('eecEditPasscodeVerified')){
    const stored = localStorage.getItem('eecAdminPasscode');
    if(!stored || passcode !== stored){
      sessionStorage.removeItem(PASSCODE_KEY);
      alert('That passcode was rejected.');
      return;
    }
    sessionStorage.setItem('eecEditPasscodeVerified', passcode);
  }

  let next;
  let newId = editDraft.id;
  if(creatingNew){
    newId = slugify(name);
    next = [...TEMPLATES, { id: newId, name, category, purpose, body }];
  }else{
    next = TEMPLATES.map(x => x.id === editDraft.id ? { ...x, name, category, purpose, body } : x);
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    TEMPLATES = next;
    await saveToFirebase();
    activeTemplateId = newId;
    editMode = false;
    creatingNew = false;
    renderList();
    renderPanel();
  } catch(e) {
    alert('Error saving: ' + e.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save template';
  }
}

async function restoreDefaults(){
  if(!confirm('This replaces every template with the original library. Continue?')) return;
  const passcode = await ensurePasscode();
  if(!passcode) return;

  try {
    TEMPLATES = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
    await saveToFirebase();
    activeTemplateId = null;
    editMode = false;
    creatingNew = false;
    renderList();
    renderPanel();
  } catch(e) {
    alert('Error: ' + e.message);
  }
}

document.getElementById('searchBox').addEventListener('input', e => {
  searchTerm = e.target.value;
  renderList();
});
document.getElementById('newTplBtn').addEventListener('click', startNewTemplate);
document.getElementById('restoreBtn').addEventListener('click', restoreDefaults);

// Initialize
db.ref('templates').on('value', (snapshot) => {
  if(snapshot.exists()){
    TEMPLATES = snapshot.val();
  } else {
    TEMPLATES = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
    saveToFirebase();
  }
  loadError = false;
  setStatus('ok', 'Synced');
  renderList();
  renderPanel();
}, (error) => {
  loadError = true;
  setStatus('error', 'Offline');
  console.error(error);
});
