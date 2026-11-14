import { debounce, parseRoute, docHref, wordCount, saveStatusLabel } from './lib/doc.js';

const VARIANT = 'Web';
const API = window.DUCTURA_API ?? '/api';
const AUTH = { authorization: 'Bearer ana@fpzg.hr' }; // razvoj; kasnije AAI@EduHr sesija

const view = document.getElementById('view');
document.getElementById('variant').textContent = VARIANT;

const api = {
  list: () => fetch(`${API}/documents`, { headers: AUTH }).then((r) => r.json()),
  get: (id) => fetch(`${API}/documents/${id}`, { headers: AUTH }).then((r) => (r.ok ? r.json() : null)),
  save: (doc) => fetch(`${API}/documents/${doc.id}`, {
    method: 'PUT', headers: { ...AUTH, 'content-type': 'application/json' }, body: JSON.stringify(doc),
  }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
};

async function renderList() {
  const docs = await api.list();
  view.innerHTML = `<h1>Moji dokumenti</h1><ul id="doc-list"></ul>`;
  const ul = view.querySelector('#doc-list');
  for (const d of docs) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = docHref(d.id); a.textContent = d.title;
    li.append(a); ul.append(li);
  }
}

async function renderDoc(id) {
  const doc = await api.get(id);
  if (!doc) { view.innerHTML = '<p role="alert">Dokument nije dostupan.</p>'; return; }
  view.innerHTML = `
    <input id="title" aria-label="Naslov" />
    <textarea id="editor" aria-label="Sadržaj"></textarea>
    <footer class="editor-bar">
      <span id="words"></span><span id="status" role="status"></span>
      <button id="save" type="button">Spremi</button>
    </footer>`;
  const title = view.querySelector('#title');
  const editor = view.querySelector('#editor');
  const status = view.querySelector('#status');
  const words = view.querySelector('#words');
  title.value = doc.title; editor.value = doc.content;

  const setState = (s) => { status.textContent = saveStatusLabel(s); status.dataset.state = s; };
  const updateWords = () => { words.textContent = `${wordCount(editor.value)} riječi`; };
  const save = debounce(async () => {
    setState('saving');
    try { await api.save({ id, title: title.value, content: editor.value }); setState('saved'); }
    catch { setState('error'); }
  }, 600);
  const onInput = () => { setState('dirty'); updateWords(); save(); };
  title.addEventListener('input', onInput);
  editor.addEventListener('input', onInput);
  view.querySelector('#save').addEventListener('click', () => save.flush());
  updateWords(); setState('idle');
}

function router() {
  const r = parseRoute(location.hash);
  return r.view === 'doc' ? renderDoc(r.id) : renderList();
}
window.addEventListener('hashchange', router);
router();
