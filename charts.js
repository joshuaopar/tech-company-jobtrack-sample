// Approximate rates, used only to compare values on the charts. Edit as needed.
const RATE = {USD: 1, UGX: 3700, TZS: 2600};
const toUsd = (v, c) => v / (RATE[c] || 1);
const short = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'k' : '$' + Math.round(n);

views.dashboard = function () {
  const active = db.jobs.filter(j => j.status === 'Approved' || j.status === 'In progress');
  const late = db.jobs.filter(isLate);
  const open = db.quotes.filter(q => !q.accepted);
  const attention = db.jobs.filter(j => j.status !== 'Completed' && j.due <= inDays(7)).sort((a, b) => a.due.localeCompare(b.due));

  const counts = STATUS.map(s => db.jobs.filter(j => j.status === s).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const C = 2 * Math.PI * 40;
  let off = 0;
  const segs = counts.map((n, i) => {
    const len = total ? n / total * C : 0;
    const el = `<circle class="seg c${i}" cx="60" cy="60" r="40" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"/>`;
    off += len;
    return el;
  }).join('');
  const legend = STATUS.map((s, i) => `<li><i class="bg${i}"></i>${s}<b>${counts[i]}</b></li>`).join('');

  const val = STATUS.map(s => db.jobs.filter(j => j.status === s).reduce((a, j) => a + toUsd(j.value || 0, j.cur), 0));
  const vmax = Math.max(1, ...val);
  const bars = STATUS.map((s, i) => `<div class="hbar"><div>${s}<span>${short(val[i])}</span></div><div class="t"><i class="bg${i}" style="width:${val[i] / vmax * 100}%"></i></div></div>`).join('');

  const labels = ['Overdue', 'This week', 'Week 2', 'Week 3', 'Week 4', 'Later'];
  const wk = [0, 0, 0, 0, 0, 0];
  db.jobs.filter(j => j.status !== 'Completed').forEach(j => {
    const d = Math.round((new Date(j.due) - new Date(TODAY)) / 864e5);
    wk[d < 0 ? 0 : d >= 28 ? 5 : Math.floor(d / 7) + 1]++;
  });
  const wmax = Math.max(1, ...wk);
  const cols = wk.map((n, i) => `<div class="wkc ${i === 0 ? 'late' : ''}"><b>${n}</b><div class="wkbar"><i style="height:${n / wmax * 100}%"></i></div><small>${labels[i]}</small></div>`).join('');

  return `<div class="stats">
    <div class="stat"><span>Active jobs</span><b>${active.length}</b></div>
    <div class="stat bad"><span>Overdue jobs</span><b>${late.length}</b></div>
    <div class="stat"><span>Open quotations</span><b>${open.length}</b></div>
    <div class="stat val"><span>Value of open quotations</span><b>${esc(sums(open, q => qt(q).total, q => q.cur))}</b></div>
  </div>
  <div class="charts">
    <section class="panel"><h2>Jobs by stage</h2><p class="sub">${total} jobs in total</p>
      <div class="donutwrap"><svg class="donut" viewBox="0 0 120 120" role="img" aria-label="Jobs by stage"><circle class="ring" cx="60" cy="60" r="40"/>${segs}<text class="dn" x="60" y="62">${total}</text><text class="dl" x="60" y="76">jobs</text></svg><ul class="legend">${legend}</ul></div>
    </section>
    <section class="panel"><h2>Pipeline value</h2><p class="sub">By stage, in USD equivalent</p>${bars}</section>
    <section class="panel"><h2>Workload by due date</h2><p class="sub">Jobs not yet completed</p><div class="wk">${cols}</div></section>
  </div>
  <section class="panel" style="margin-top:16px"><h2>Needs attention</h2><ul class="list">${attention.map(j =>
    `<li><button class="rowbtn" data-edit="${j.id}"><span><b>${esc(j.title)}</b><small>${esc(j.client)} | ${esc(j.site)}</small></span><span class="due ${isLate(j) ? 'late' : ''}">${dueText(j)}</span></button></li>`).join('')
    || '<li class="empty">Nothing is overdue or due this week.</li>'}</ul></section>`;
};
render();
