// Edit these details. They appear on printed quotations.
const COMPANY = {
  name: 'Your Company Name',
  address: 'Plot 12, Industrial Area, City',
  phone: '+256 000 000 000',
  email: 'info@example.com'
};

const KEY = 'job-manager-demo-v2';
const STATUS = ['Quoted', 'Approved', 'In progress', 'Completed'];
const VAT = 0.18;
const NOW = new Date();
const iso = d => d.toISOString().slice(0, 10);
const TODAY = iso(NOW);
const inDays = n => iso(new Date(NOW.getTime() + n * 864e5));

const seed = {
  n: 50, jn: 107, qn: 4,
  jobs: [
    {id:1, ref:'JOB-0101', client:'Lakeside Sugar Works', title:'Molasses storage tank, 50 m3', site:'Workshop A', crew:'Tank crew 1', priority:'High', status:'In progress', due:inDays(25), value:20296, cur:'USD'},
    {id:2, ref:'JOB-0102', client:'Riverside Beverages', title:'Process piping for bottling line', site:'Workshop B', crew:'Piping crew', priority:'High', status:'In progress', due:inDays(-3), value:42000000, cur:'UGX'},
    {id:3, ref:'JOB-0103', client:'Coastal Cement', title:'Conveyor frame fabrication', site:'Workshop A', crew:'Fabrication 2', priority:'Medium', status:'Approved', due:inDays(40), value:36000000, cur:'TZS'},
    {id:4, ref:'JOB-0104', client:'Brightwave Plastics', title:'Steel platform and stairs', site:'Workshop B', crew:'', priority:'Medium', status:'Quoted', due:inDays(18), value:15694000, cur:'UGX'},
    {id:5, ref:'JOB-0105', client:'Highland Dairy Co-op', title:'Stainless pipework, 120 m', site:'Workshop B', crew:'Piping crew', priority:'Low', status:'Completed', due:inDays(-20), value:24000000, cur:'UGX'},
    {id:6, ref:'JOB-0106', client:'Savanna Mills', title:'Pressure vessel inspection and repair', site:'Workshop A', crew:'', priority:'Medium', status:'Quoted', due:inDays(12), value:6200, cur:'USD'}
  ],
  quotes: [
    {id:11, no:'QT-2026-0001', date:inDays(-30), client:'Lakeside Sugar Works', title:'Molasses storage tank, 50 m3', cur:'USD', vat:true, accepted:true,
     notes:'Payment: 50% on approval, 50% on completion.\nValid for 30 days.',
     items:[{d:'Tank fabrication, 50 m3', q:1, p:14000}, {d:'Installation crew (days)', q:10, p:250}, {d:'Testing and certification', q:1, p:700}]},
    {id:12, no:'QT-2026-0002', date:inDays(-6), client:'Savanna Mills', title:'Pressure vessel inspection and repair', cur:'USD', vat:true, accepted:false,
     notes:'Payment: 50% on approval, 50% on completion.\nValid for 30 days.',
     items:[{d:'Inspection and report', q:1, p:900}, {d:'Repair welding and materials', q:1, p:3400}, {d:'Pressure test', q:1, p:940}]},
    {id:13, no:'QT-2026-0003', date:inDays(-2), client:'Brightwave Plastics', title:'Steel platform and stairs', cur:'UGX', vat:true, accepted:false,
     notes:'Payment: 50% on approval, 50% on completion.\nValid for 30 days.',
     items:[{d:'Mild steel supply', q:1, p:8500000}, {d:'Fabrication labour (days)', q:12, p:250000}, {d:'Painting and finish', q:1, p:1800000}]}
  ]
};

let db = load();
function load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {} return structuredClone(seed); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money = (n, c) => c + ' ' + Math.round(n).toLocaleString('en-US');
const opts = (arr, sel) => arr.map(o => `<option ${o === sel ? 'selected' : ''}>${o}</option>`).join('');
const nextRef = () => 'JOB-' + String(db.jn++).padStart(4, '0');
const isLate = j => j.status !== 'Completed' && j.due < TODAY;
const qt = q => { const sub = q.items.reduce((a, i) => a + i.q * i.p, 0); const vat = q.vat ? sub * VAT : 0; return {sub, vat, total: sub + vat}; };
const sums = (list, val, cur) => { const o = {}; list.forEach(x => o[cur(x)] = (o[cur(x)] || 0) + val(x)); return Object.entries(o).map(([c, v]) => money(v, c)).join(' + ') || '0'; };
const dueText = j => {
  if (!isLate(j)) return 'Due ' + j.due;
  const d = Math.round((new Date(TODAY) - new Date(j.due)) / 864e5);
  return d + ' day' + (d === 1 ? '' : 's') + ' overdue';
};
const state = {view: 'dashboard', q: '', site: ''};
const hit = s => !state.q || s.toLowerCase().includes(state.q);
const TITLES = {dashboard: 'Dashboard', jobs: 'Jobs', quotes: 'Quotations'};
const NEWLBL = {dashboard: 'New job', jobs: 'New job', quotes: 'New quotation'};

const views = {
  dashboard() {
    const active = db.jobs.filter(j => j.status === 'Approved' || j.status === 'In progress');
    const late = db.jobs.filter(isLate);
    const open = db.quotes.filter(q => !q.accepted);
    const attention = db.jobs.filter(j => j.status !== 'Completed' && j.due <= inDays(7)).sort((a, b) => a.due.localeCompare(b.due));
    const max = Math.max(1, ...STATUS.map(s => db.jobs.filter(j => j.status === s).length));
    return `<div class="stats">
      <div class="stat"><span>Active jobs</span><b>${active.length}</b></div>
      <div class="stat bad"><span>Overdue jobs</span><b>${late.length}</b></div>
      <div class="stat"><span>Open quotations</span><b>${open.length}</b></div>
      <div class="stat val"><span>Value of open quotations</span><b>${esc(sums(open, q => qt(q).total, q => q.cur))}</b></div>
    </div>
    <div class="two">
      <section class="panel"><h2>Needs attention</h2><ul class="list">${attention.map(j =>
        `<li><button class="rowbtn" data-edit="${j.id}"><span><b>${esc(j.title)}</b><small>${esc(j.client)} | ${esc(j.site)}</small></span><span class="due ${isLate(j) ? 'late' : ''}">${dueText(j)}</span></button></li>`).join('')
        || '<li class="empty">Nothing is overdue or due this week.</li>'}</ul></section>
      <section class="panel"><h2>Jobs by stage</h2>${STATUS.map(s => {
        const n = db.jobs.filter(j => j.status === s).length;
        return `<div class="stage"><span>${s}</span><div class="track"><i style="width:${n / max * 100}%"></i></div><b>${n}</b></div>`;
      }).join('')}</section>
    </div>`;
  },
  jobs() {
    const sites = [...new Set(db.jobs.map(j => j.site))].filter(Boolean);
    const list = db.jobs.filter(j => (!state.site || j.site === state.site) && hit(j.ref + ' ' + j.title + ' ' + j.client + ' ' + j.crew));
    const card = (j, i) => `<article class="job ${isLate(j) ? 'late' : ''}" draggable="true" data-id="${j.id}">
      <div class="jh"><span class="ref">${esc(j.ref)}</span><span class="pri ${j.priority}">${j.priority}</span></div>
      <button class="jt" data-edit="${j.id}">${esc(j.title)}</button>
      <small>${esc(j.client)}</small>
      <small>${esc(j.site)}${j.crew ? ' | ' + esc(j.crew) : ''}</small>
      <div class="jf"><span class="due ${isLate(j) ? 'late' : ''}">${dueText(j)}</span><b>${j.value ? money(j.value, j.cur) : ''}</b></div>
      <div class="acts">${i > 0 ? `<button class="btn ghost sm" data-mv="${j.id}:-1">Back</button>` : ''}${i < 3 ? `<button class="btn sm" data-mv="${j.id}:1">Next stage</button>` : ''}</div>
    </article>`;
    return `<div class="toolbar"><select id="siteSel" aria-label="Filter by site"><option value="">All sites</option>${sites.map(s => `<option ${s === state.site ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><button class="btn ghost" id="exportBtn">Export CSV</button></div>
    <div class="board">${STATUS.map((s, i) => {
      const col = list.filter(j => j.status === s);
      return `<div class="col" data-status="${s}"><h3>${s} <small>${col.length}</small></h3>${col.map(j => card(j, i)).join('') || '<p class="empty">No jobs here.</p>'}</div>`;
    }).join('')}</div>`;
  },
  quotes() {
    const list = db.quotes.filter(q => hit(q.no + ' ' + q.client + ' ' + q.title));
    const rows = list.map(q => `<tr>
      <td><b>${esc(q.no)}</b></td><td>${esc(q.client)}</td><td>${esc(q.title)}</td><td>${q.date}</td>
      <td class="r">${money(qt(q).total, q.cur)}</td>
      <td><span class="tag ${q.accepted ? 'Accepted' : 'Open'}">${q.accepted ? 'Accepted' : 'Open'}</span></td>
      <td><div class="acts"><button class="btn ghost sm" data-qedit="${q.id}">Edit</button><button class="btn ghost sm" data-qprint="${q.id}">Print</button>${q.accepted ? '' : `<button class="btn sm" data-qacc="${q.id}">Accept</button>`}<button class="btn ghost sm danger" data-qdel="${q.id}">Delete</button></div></td></tr>`).join('');
    return `<div class="tablewrap"><table><thead><tr><th>Number</th><th>Client</th><th>Work</th><th>Date</th><th class="r">Total incl. VAT</th><th>Status</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty">No quotations found. Create one with the button above.</td></tr>'}</tbody></table></div>`;
  }
};

function render() {
  $('#title').textContent = TITLES[state.view];
  $('#newBtn').textContent = NEWLBL[state.view];
  $('#search').hidden = state.view === 'dashboard';
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === state.view));
  $('#view').innerHTML = views[state.view]();
}

let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); }

const dlg = $('#dlg');

function openJob(id) {
  const j = id ? db.jobs.find(x => x.id === id) : {client:'', title:'', site: state.site || '', crew:'', due: inDays(30), status:'Quoted', priority:'Medium', cur:'UGX', value:''};
  const sites = [...new Set(db.jobs.map(x => x.site))].filter(Boolean);
  dlg.innerHTML = `<form id="jobForm" data-id="${id || ''}">
    <div class="dh"><h2>${id ? 'Edit job ' + esc(j.ref) : 'New job'}</h2><button type="button" class="x" data-close aria-label="Close">&times;</button></div>
    <div class="body"><div class="grid">
      <label>Client<input name="client" required value="${esc(j.client)}"></label>
      <label>Job title<input name="title" required value="${esc(j.title)}"></label>
      <label>Site<input name="site" list="siteList" value="${esc(j.site)}"><datalist id="siteList">${sites.map(s => `<option value="${esc(s)}">`).join('')}</datalist></label>
      <label>Crew or supervisor<input name="crew" value="${esc(j.crew)}"></label>
      <label>Due date<input type="date" name="due" required value="${j.due}"></label>
      <label>Stage<select name="status">${opts(STATUS, j.status)}</select></label>
      <label>Priority<select name="priority">${opts(['High', 'Medium', 'Low'], j.priority)}</select></label>
      <label>Value<span class="pair"><select name="cur">${opts(['UGX', 'TZS', 'USD'], j.cur)}</select><input name="value" type="number" min="0" step="any" value="${j.value}"></span></label>
    </div></div>
    <div class="df">${id ? '<button type="button" class="btn ghost danger" data-deljob>Delete job</button>' : ''}<span></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Save job</button></div>
  </form>`;
  dlg.showModal();
}

const lineHtml = i => `<div class="line"><input class="d" placeholder="Item or service" aria-label="Item" value="${esc(i.d)}"><input class="q" type="number" min="0" step="any" aria-label="Quantity" value="${i.q}"><input class="p" type="number" min="0" step="any" placeholder="Unit price" aria-label="Unit price" value="${i.p}"><button type="button" class="btn ghost sm" data-rmline>Remove</button></div>`;

function openQuote(id) {
  const q = id ? db.quotes.find(x => x.id === id) : {client:'', title:'', cur:'UGX', vat:true, notes:'Payment: 50% on approval, 50% on completion.\nValid for 30 days.', items:[{d:'', q:1, p:''}]};
  dlg.innerHTML = `<form id="quoteForm" data-id="${id || ''}">
    <div class="dh"><h2>${id ? 'Edit ' + esc(q.no) : 'New quotation'}</h2><button type="button" class="x" data-close aria-label="Close">&times;</button></div>
    <div class="body"><div class="grid">
      <label>Client<input name="client" required value="${esc(q.client)}"></label>
      <label>Work description<input name="title" required value="${esc(q.title)}"></label>
      <label>Currency<select name="cur">${opts(['UGX', 'TZS', 'USD'], q.cur)}</select></label>
      <label class="chk"><input type="checkbox" name="vat" ${q.vat ? 'checked' : ''}> Add VAT (18%)</label>
    </div>
    <h3>Line items</h3>
    <div id="lines">${q.items.map(lineHtml).join('')}</div>
    <button type="button" class="btn ghost sm" id="addLine">Add line</button>
    <label class="full" style="margin-top:14px">Notes and terms<textarea name="notes" rows="3">${esc(q.notes)}</textarea></label>
    <p class="totals" id="totals"></p></div>
    <div class="df"><span></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Save quotation</button></div>
  </form>`;
  dlg.showModal();
  calcTotals();
}

function readLines() {
  return [...dlg.querySelectorAll('.line')].map(l => ({d: l.querySelector('.d').value.trim(), q: +l.querySelector('.q').value || 0, p: +l.querySelector('.p').value || 0})).filter(i => i.d);
}
function calcTotals() {
  const f = $('#quoteForm'); if (!f) return;
  const t = qt({items: readLines(), vat: f.vat.checked});
  $('#totals').innerHTML = `Subtotal ${money(t.sub, f.cur.value)} | VAT ${money(t.vat, f.cur.value)}<br>Total <b>${money(t.total, f.cur.value)}</b>`;
}
dlg.addEventListener('input', calcTotals);

dlg.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  if (f.id === 'jobForm') {
    const data = {client: d.client.trim(), title: d.title.trim(), site: d.site.trim(), crew: d.crew.trim(), due: d.due, status: d.status, priority: d.priority, cur: d.cur, value: +d.value || 0};
    if (f.dataset.id) Object.assign(db.jobs.find(x => x.id === +f.dataset.id), data);
    else db.jobs.push({id: db.n++, ref: nextRef(), ...data});
    toast('Job saved');
  } else if (f.id === 'quoteForm') {
    const items = readLines();
    if (!items.length) { toast('Add at least one line item.'); return; }
    const data = {client: d.client.trim(), title: d.title.trim(), cur: d.cur, vat: f.vat.checked, notes: d.notes, items};
    if (f.dataset.id) Object.assign(db.quotes.find(x => x.id === +f.dataset.id), data);
    else db.quotes.unshift({id: db.n++, no: 'QT-' + NOW.getFullYear() + '-' + String(db.qn++).padStart(4, '0'), date: TODAY, accepted: false, ...data});
    toast('Quotation saved');
  }
  dlg.close(); save(); render();
});

function accept(id) {
  const q = db.quotes.find(x => x.id === id);
  q.accepted = true;
  db.jobs.push({id: db.n++, ref: nextRef(), client: q.client, title: q.title, site: db.jobs[0] ? db.jobs[0].site : 'Workshop A', crew: '', priority: 'Medium', status: 'Approved', due: inDays(30), value: qt(q).total, cur: q.cur});
  save(); render(); toast('Quotation accepted and job created');
}

function exportCsv() {
  const rows = [['Ref', 'Client', 'Job', 'Site', 'Crew', 'Priority', 'Stage', 'Due', 'Value', 'Currency'], ...db.jobs.map(j => [j.ref, j.client, j.title, j.site, j.crew, j.priority, j.status, j.due, j.value, j.cur])];
  const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
  a.download = 'jobs.csv';
  a.click();
}

function printQuote(q) {
  const t = qt(q);
  const rows = q.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.d)}</td><td class="r">${i.q}</td><td class="r">${money(i.p, q.cur)}</td><td class="r">${money(i.q * i.p, q.cur)}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(q.no)}</title><style>
    body{font:13px/1.5 Arial,sans-serif;color:#16202c;margin:0;padding:40px}
    .head{display:flex;justify-content:space-between;border-bottom:4px solid #d9480f;padding-bottom:14px}
    .head h1{margin:0;font-size:22px}.head p{margin:2px 0;color:#5b6878}
    .meta{text-align:right}.meta h2{margin:0;font-size:20px;letter-spacing:1px}
    .to{margin:24px 0}.to small{color:#5b6878;display:block}
    table{width:100%;border-collapse:collapse}
    th{background:#0e1f33;color:#fff;text-align:left;padding:8px}
    td{padding:8px;border-bottom:1px solid #dbe1e9}.r{text-align:right}
    .tot{margin:16px 0 0 auto;width:280px}.tot div{display:flex;justify-content:space-between;padding:4px 0}
    .tot .g{border-top:2px solid #0e1f33;font-weight:bold;font-size:15px;margin-top:4px;padding-top:8px}
    .notes{margin-top:30px;white-space:pre-line;color:#33404f}
    .sign{display:flex;gap:60px;margin-top:60px}.sign div{flex:1;border-top:1px solid #16202c;padding-top:6px;color:#5b6878}
  </style></head><body>
    <div class="head"><div><h1>${esc(COMPANY.name)}</h1><p>${esc(COMPANY.address)}</p><p>${esc(COMPANY.phone)} | ${esc(COMPANY.email)}</p></div>
    <div class="meta"><h2>QUOTATION</h2><p>No: <b>${esc(q.no)}</b></p><p>Date: ${q.date}</p></div></div>
    <div class="to"><small>Prepared for</small><b>${esc(q.client)}</b><br>${esc(q.title)}</div>
    <table><tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr>${rows}</table>
    <div class="tot"><div><span>Subtotal</span><span>${money(t.sub, q.cur)}</span></div>${q.vat ? `<div><span>VAT 18%</span><span>${money(t.vat, q.cur)}</span></div>` : ''}<div class="g"><span>Total</span><span>${money(t.total, q.cur)}</span></div></div>
    <div class="notes">${esc(q.notes)}</div>
    <div class="sign"><div>Prepared by</div><div>Accepted by (name, signature, date)</div></div>
  </body></html>`;
  const fr = document.createElement('iframe');
  fr.style.cssText = 'position:fixed;width:0;height:0;border:0';
  document.body.appendChild(fr);
  fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
  setTimeout(() => { fr.contentWindow.focus(); fr.contentWindow.print(); setTimeout(() => fr.remove(), 60000); }, 200);
}

document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const ds = t.dataset;
  if ('close' in ds) { dlg.close(); return; }
  if (ds.view) { state.view = ds.view; render(); return; }
  if (t.id === 'newBtn') { state.view === 'quotes' ? openQuote() : openJob(); return; }
  if (t.id === 'exportBtn') { exportCsv(); return; }
  if (t.id === 'addLine') { $('#lines').insertAdjacentHTML('beforeend', lineHtml({d: '', q: 1, p: ''})); return; }
  if ('rmline' in ds) { t.closest('.line').remove(); calcTotals(); return; }
  if (t.id === 'reset') { if (confirm('Reset all demo data?')) { db = structuredClone(seed); save(); render(); toast('Demo data restored'); } return; }
  if (ds.edit) { openJob(+ds.edit); return; }
  if ('deljob' in ds) { if (confirm('Delete this job?')) { db.jobs = db.jobs.filter(j => j.id !== +$('#jobForm').dataset.id); dlg.close(); save(); render(); toast('Job deleted'); } return; }
  if (ds.mv) { const [id, d] = ds.mv.split(':').map(Number); const j = db.jobs.find(x => x.id === id); j.status = STATUS[STATUS.indexOf(j.status) + d]; save(); render(); toast('Moved to ' + j.status); return; }
  if (ds.qedit) { openQuote(+ds.qedit); return; }
  if (ds.qprint) { printQuote(db.quotes.find(x => x.id === +ds.qprint)); return; }
  if (ds.qacc) { accept(+ds.qacc); return; }
  if (ds.qdel) { if (confirm('Delete this quotation?')) { db.quotes = db.quotes.filter(q => q.id !== +ds.qdel); save(); render(); toast('Quotation deleted'); } return; }
});

document.addEventListener('change', e => { if (e.target.id === 'siteSel') { state.site = e.target.value; render(); } });
$('#search').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); render(); });

document.addEventListener('dragstart', e => { const c = e.target.closest('.job'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.id); c.classList.add('drag'); } });
document.addEventListener('dragend', () => document.querySelectorAll('.drag,.over').forEach(x => x.classList.remove('drag', 'over')));
document.addEventListener('dragover', e => { const c = e.target.closest('.col'); if (c) { e.preventDefault(); document.querySelectorAll('.over').forEach(x => x.classList.remove('over')); c.classList.add('over'); } });
document.addEventListener('drop', e => {
  const c = e.target.closest('.col'); if (!c) return;
  e.preventDefault();
  const j = db.jobs.find(x => x.id === +e.dataTransfer.getData('text/plain'));
  if (j && j.status !== c.dataset.status) { j.status = c.dataset.status; save(); render(); toast('Moved to ' + j.status); }
  else render();
});

render();
