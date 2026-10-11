// Research Opportunity Portal - frontend
// All data comes from the REST API; nothing is hard-coded here.
const API = location.protocol === 'file:'
  ? 'http://localhost:5000/api/opportunities'
  : '/api/opportunities';

const $ = (id) => document.getElementById(id);
const list = $('list'), stateEl = $('state');
const dlgDetails = $('dlgDetails'), dlgForm = $('dlgForm'), dlgDelete = $('dlgDelete');
const form = $('form'), formError = $('formError');

const FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department',
                'required_skills', 'available_positions', 'application_deadline', 'status'];
const LABELS = {
  title: 'Research title', description: 'Description', research_area: 'Research area',
  faculty_name: 'Faculty member', department: 'Department', required_skills: 'Required skills',
  available_positions: 'Available positions', application_deadline: 'Application deadline', status: 'Status'
};

let items = [];
let filter = 'All';
let deleteId = null;

/* ---------- helpers ---------- */
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  kids.forEach((c) => n.append(c));
  return n;
}

function toast(message, type = 'success') {
  const t = el('div', { class: `toast ${type}`, text: message });
  $('toasts').append(t);
  setTimeout(() => t.remove(), type === 'error' ? 6000 : 3500);
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Wrapper around fetch: returns parsed JSON or throws Error with a readable message
async function api(path = '', options = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' }, ...options
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }
  return data;
}

/* ---------- list ---------- */
async function load() {
  try {
    items = await api();
    stateEl.hidden = false;
    render();
  } catch (e) {
    items = [];
    list.replaceChildren();
    stateEl.hidden = false;
    stateEl.className = 'state error';
    stateEl.textContent = e.message;
    toast(e.message, 'error');
  }
}

function render() {
  $('cAll').textContent = items.length;
  $('cOpen').textContent = items.filter((o) => o.status === 'Open').length;
  $('cClosed').textContent = items.filter((o) => o.status === 'Closed').length;

  const shown = items.filter((o) => filter === 'All' || o.status === filter);
  list.replaceChildren(...shown.map(card));

  stateEl.className = 'state';
  if (!items.length) { stateEl.hidden = false; stateEl.textContent = 'No research opportunities yet. Post the first one.'; }
  else if (!shown.length) { stateEl.hidden = false; stateEl.textContent = `No ${filter.toLowerCase()} opportunities.`; }
  else stateEl.hidden = true;
}

function card(o) {
  const closed = o.status === 'Closed';
  const li = el('li', { class: 'item' + (closed ? ' closed' : '') });

  const main = el('div', {},
    el('h3', { class: 'i-title', text: o.title }),
    el('p', { class: 'i-meta', text: `${o.faculty_name} \u2014 ${o.department}` }),
    el('div', { class: 'i-facts' },
      el('span', {}, 'Area: ', el('b', { text: o.research_area })),
      el('span', {}, 'Positions: ', el('b', { text: String(o.available_positions) })),
      el('span', {}, 'Deadline: ', el('b', { text: fmtDate(o.application_deadline) }))
    )
  );
  const side = el('div', { class: 'i-side' }, el('span', { class: `pill ${o.status}`, text: o.status }));

  const actions = el('div', { class: 'actions' },
    el('button', { class: 'btn small', text: 'View details', onclick: () => showDetails(o.id) }),
    el('button', { class: 'btn small', text: 'Edit', onclick: () => openForm(o) }),
    el('button', { class: 'btn small', text: closed ? 'Reopen' : 'Close opportunity', onclick: () => setStatus(o, closed ? 'Open' : 'Closed') }),
    el('button', { class: 'btn small link-danger', text: 'Delete', onclick: () => askDelete(o) })
  );

  li.append(main, side, actions);
  return li;
}

/* ---------- details (fetches the single record via GET /:id) ---------- */
async function showDetails(id) {
  try {
    const o = await api('/' + id);
    $('dTitle').textContent = o.title;
    const rows = [
      ['Status', o.status], ['Faculty member', o.faculty_name], ['Department', o.department],
      ['Research area', o.research_area], ['Required skills', o.required_skills],
      ['Open positions', String(o.available_positions)], ['Deadline', fmtDate(o.application_deadline)],
      ['Posted', o.created_at], ['ID', String(o.id)]
    ];
    const dl = el('dl', { class: 'detail-grid' });
    dl.append(el('dt', { text: 'Description' }), el('dd', { class: 'detail-desc', text: o.description }));
    rows.forEach(([k, v]) => dl.append(el('dt', { text: k }), el('dd', { text: v })));
    $('dBody').replaceChildren(dl);
    dlgDetails.showModal();
  } catch (e) {
    toast(e.message, 'error');
    if (e.status === 404) load(); // record vanished: refresh list
  }
}

/* ---------- create / edit ---------- */
function clearErrors() {
  formError.hidden = true;
  form.querySelectorAll('.field').forEach((f) => { f.classList.remove('invalid'); f.querySelector('.err').textContent = ''; });
}
function fieldError(name, msg) {
  const f = $(name).closest('.field');
  f.classList.add('invalid');
  f.querySelector('.err').textContent = msg;
}

function openForm(o) {
  clearErrors();
  form.reset();
  $('fId').value = o ? o.id : '';
  $('fTitle').textContent = o ? 'Edit opportunity' : 'Post an opportunity';
  $('btnSave').textContent = o ? 'Save changes' : 'Create opportunity';
  FIELDS.forEach((f) => { $(f).value = o ? o[f] : ''; });
  if (!o) $('status').value = 'Open';
  dlgForm.showModal();
  $('title').focus();
}

function validateForm(isEdit) {
  let ok = true;
  const bad = (n, m) => { fieldError(n, m); ok = false; };

  FIELDS.filter((f) => !['available_positions', 'application_deadline', 'status'].includes(f)).forEach((f) => {
    if (!$(f).value.trim()) bad(f, `${LABELS[f]} is required`);
  });

  const pos = $('available_positions').value.trim();
  if (!pos) bad('available_positions', 'Available positions is required');
  else if (!/^\d+$/.test(pos) || Number(pos) < 1) bad('available_positions', 'Enter a whole number of 1 or more');

  const dl = $('application_deadline').value;
  if (!dl) bad('application_deadline', 'Application deadline is required');
  else if (!isEdit && dl < new Date().toLocaleDateString('en-CA')) bad('application_deadline', 'Deadline cannot be in the past');

  return ok;
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  clearErrors();
  const id = $('fId').value;
  if (!validateForm(!!id)) { formError.textContent = 'Please fix the highlighted fields.'; formError.hidden = false; return; }

  const body = {};
  FIELDS.forEach((f) => { body[f] = $(f).value.trim(); });
  body.available_positions = Number(body.available_positions);

  $('btnSave').disabled = true;
  try {
    await api(id ? '/' + id : '', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    dlgForm.close();
    toast(id ? 'Opportunity updated successfully.' : 'Opportunity created successfully.');
    await load();
  } catch (e) {
    // Show server-side validation messages inside the form
    formError.textContent = e.details ? `${e.message}: ${e.details.join('; ')}` : e.message;
    formError.hidden = false;
  } finally {
    $('btnSave').disabled = false;
  }
});

/* ---------- close / reopen ---------- */
async function setStatus(o, status) {
  try {
    await api('/' + o.id, { method: 'PUT', body: JSON.stringify({ status }) });
    toast(`"${o.title}" is now ${status}.`);
    await load();
  } catch (e) {
    toast(e.message, 'error');
    if (e.status === 404) load();
  }
}

/* ---------- delete ---------- */
function askDelete(o) {
  deleteId = o.id;
  $('delText').textContent = `"${o.title}" will be permanently removed. This cannot be undone.`;
  dlgDelete.showModal();
}
$('btnConfirmDelete').addEventListener('click', async () => {
  try {
    await api('/' + deleteId, { method: 'DELETE' });
    dlgDelete.close();
    toast('Opportunity deleted successfully.');
  } catch (e) {
    dlgDelete.close();
    toast(e.message, 'error');
  }
  await load();
});

/* ---------- wiring ---------- */
$('btnNew').addEventListener('click', () => openForm(null));
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((d) =>
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); })); // click on backdrop
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  filter = t.dataset.filter;
  render();
}));

load();
