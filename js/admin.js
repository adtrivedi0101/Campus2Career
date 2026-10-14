/* Admin panel: companies, applications, drives, notifications | Owner: Student 4 */
setupTabs();
const comps = [{n: 'Infosys', s: 'IT Services'}, {n: 'Amazon', s: 'E-commerce'}, {n: 'Zoho', s: 'Software Products'}];
const appl = [
  {s: 'Rahul Sharma', c: 'Infosys', g: 7.8, st: 'Applied'},
  {s: 'Meera Nair', c: 'Amazon', g: 8.9, st: 'Applied'},
  {s: 'Arjun Das', c: 'Zoho', g: 7.2, st: 'Shortlisted'}
];
const sc = {Applied: 'b-blue', Shortlisted: 'b-green', Rejected: 'b-red'};
function renderComps() {
  compBody.innerHTML = comps.map((c, i) => `<tr><td>${c.n}</td><td>${c.s}</td><td><button class="btn btn-red btn-sm" data-del="${i}" aria-label="Delete ${c.n}">Delete</button></td></tr>`).join('');
}
function renderApps() {
  appBody.innerHTML = appl.map((a, i) => `<tr><td>${a.s}</td><td>${a.c}</td><td>${a.g}</td><td><span class="badge ${sc[a.st]}">${a.st}</span></td>
    <td><button class="btn btn-green btn-sm" data-st="Shortlisted" data-i="${i}">Shortlist</button> <button class="btn btn-red btn-sm" data-st="Rejected" data-i="${i}">Reject</button></td></tr>`).join('');
}
compBody.addEventListener('click', e => {
  if (e.target.dataset.del !== undefined) { comps.splice(e.target.dataset.del, 1); renderComps(); showToast('Company deleted (demo).'); }
});
appBody.addEventListener('click', e => {
  if (e.target.dataset.st) { appl[e.target.dataset.i].st = e.target.dataset.st; renderApps(); showToast('Status updated to ' + e.target.dataset.st + '.'); }
});
compForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!cn.value.trim() || !cs.value.trim()) { compErr.textContent = 'Enter both company name and sector.'; return; }
  compErr.textContent = ''; comps.push({n: cn.value.trim(), s: cs.value.trim()}); compForm.reset(); renderComps(); showToast('Company added (demo).');
});
driveForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!dc.value.trim() || !dr.value.trim() || dg.value === '' || !dl.value) { driveErr.textContent = 'Please fill all drive details.'; return; }
  driveErr.textContent = ''; driveForm.reset(); showToast('Drive posted with eligibility criteria (demo).');
});
noteForm.addEventListener('submit', e => {
  e.preventDefault();
  if (nm.value.trim().length < 5) { nmErr.textContent = 'Message is too short.'; return; }
  nmErr.textContent = ''; noteForm.reset(); showToast('Notification sent (demo).');
});
renderComps(); renderApps();
