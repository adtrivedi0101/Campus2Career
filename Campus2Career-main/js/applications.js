if (!window.C2C_AUTH_BLOCKED) {
const steps = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
let apps = C2C.readUser('c2c-applications', []);
if (!Array.isArray(apps)) apps = [];
const sf = document.getElementById('sf');
const sum = document.getElementById('sum');
const appList = document.getElementById('appList');
const badge = {Applied: 'b-blue', Shortlisted: 'b-yellow', Interview: 'b-yellow', Selected: 'b-green', Rejected: 'b-red'};
function render() {
  const list = apps.filter(a => !sf.value || a.st === sf.value);
  sum.textContent = list.length + ' of ' + apps.length + ' applications shown';
  appList.innerHTML = list.length ? list.map(a => {
    const idx = steps.indexOf(a.st);
    const items = steps.map((s, i) => {
      const cls = a.st === 'Rejected' ? (i === 0 ? 'done fail' : '') : (i <= idx ? 'done' : '');
      return `<li class="${cls}">${s}</li>`;
    }).join('');
    return `<article class="card"><div class="row"><h2 style="font-size:1.2rem;margin:0">${C2C.escape(a.co)}</h2><span class="badge ${badge[a.st] || 'b-grey'}">${C2C.escape(a.st)}</span></div>
      <p style="margin:4px 0">${C2C.escape(a.role)} &bull; Applied on ${C2C.escape(a.date)}</p>
      <ol class="stepper" aria-label="Application progress for ${C2C.escape(a.co)}">${items}</ol>
      ${a.st === 'Rejected' ? '<p class="error" style="margin-top:8px">Not selected for the next round.</p>' : ''}</article>`;
  }).join('') : '<p class="card">No applications have this status.</p>';
}
sf.addEventListener('change', render);
render();
}
