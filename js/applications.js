/* Application tracker | Owner: Student 3 */
const steps = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
const apps = [
  {co: 'Infosys', role: 'Systems Engineer', date: '10 Oct 2026', st: 'Shortlisted'},
  {co: 'TCS Digital', role: 'Digital Engineer', date: '08 Oct 2026', st: 'Interview'},
  {co: 'Wipro', role: 'Project Engineer', date: '12 Oct 2026', st: 'Applied'},
  {co: 'Zoho', role: 'Software Developer', date: '01 Oct 2026', st: 'Rejected'},
  {co: 'Capgemini', role: 'Intern Analyst', date: '28 Sep 2026', st: 'Selected'}
];
const badge = {Applied: 'b-blue', Shortlisted: 'b-yellow', Interview: 'b-yellow', Selected: 'b-green', Rejected: 'b-red'};
function render() {
  const list = apps.filter(a => !sf.value || a.st === sf.value);
  sum.textContent = list.length + ' of ' + apps.length + ' applications shown';
  appList.innerHTML = list.map(a => {
    const idx = steps.indexOf(a.st);
    const items = steps.map((s, i) => {
      const cls = a.st === 'Rejected' ? (i === 0 ? 'done' : '') : (i <= idx ? 'done' : '');
      return `<li class="${cls}">${s}</li>`;
    }).join('');
    return `<article class="card"><div class="row"><h2 style="font-size:1.2rem;margin:0">${a.co}</h2><span class="badge ${badge[a.st]}">${a.st}</span></div>
      <p style="margin:4px 0">${a.role} &bull; Applied on ${a.date}</p>
      <ol class="stepper" aria-label="Progress">${a.st === 'Rejected' ? items.replace('<li class="done">Applied', '<li class="done">Applied') + '' : items}</ol>
      ${a.st === 'Rejected' ? '<p class="error" style="margin-top:8px">Not selected for the next round.</p>' : ''}</article>`;
  }).join('');
}
sf.addEventListener('change', render);
render();
