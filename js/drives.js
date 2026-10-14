/* Drives list, eligibility check, apply popup | Owner: Student 3 */
const me = {cgpa: 7.8, backlogs: 0};
const drives = [
  {id: 1, co: 'Infosys', role: 'Systems Engineer', pkg: '4.5 LPA', cgpa: 6.5, bl: 0, type: 'Full-time', last: '18 Oct 2026'},
  {id: 2, co: 'Wipro', role: 'Project Engineer', pkg: '4.0 LPA', cgpa: 6.0, bl: 1, type: 'Full-time', last: '22 Oct 2026'},
  {id: 3, co: 'TCS Digital', role: 'Digital Engineer', pkg: '7.0 LPA', cgpa: 7.5, bl: 0, type: 'Full-time', last: '24 Oct 2026'},
  {id: 4, co: 'Amazon', role: 'SDE-1', pkg: '24 LPA', cgpa: 8.5, bl: 0, type: 'Full-time', last: '30 Oct 2026'},
  {id: 5, co: 'Zoho', role: 'Software Developer', pkg: '8.0 LPA', cgpa: 7.0, bl: 0, type: 'Full-time', last: '28 Oct 2026'},
  {id: 6, co: 'Capgemini', role: 'Intern Analyst', pkg: '25k / month', cgpa: 6.0, bl: 0, type: 'Internship', last: '26 Oct 2026'}
];
const applied = new Set();
let pending = null;
const eligible = d => me.cgpa >= d.cgpa && me.backlogs <= d.bl;

function render() {
  const text = q.value.toLowerCase();
  const list = drives.filter(d =>
    (d.co + ' ' + d.role).toLowerCase().includes(text) &&
    (!fType.value || d.type === fType.value) &&
    (fElig.value !== 'yes' || eligible(d)));
  count.textContent = list.length + ' drive(s) found';
  driveList.innerHTML = list.map(d => {
    const ok = eligible(d), done = applied.has(d.id);
    return `<article class="card">
      <h2 style="font-size:1.2rem;margin:0">${d.co}</h2><p style="margin:2px 0">${d.role}</p>
      <p><span class="badge b-blue">${d.type}</span> <span class="badge b-grey">${d.pkg}</span></p>
      <p>Min CGPA: <strong>${d.cgpa}</strong><br>Max backlogs: <strong>${d.bl}</strong><br>Last date: ${d.last}</p>
      <p><span class="badge ${ok ? 'b-green' : 'b-red'}">${ok ? 'You are eligible' : 'Not eligible'}</span></p>
      <button class="btn btn-sm" data-id="${d.id}" ${ok && !done ? '' : 'disabled'}>${done ? 'Applied' : 'Apply Now'}</button></article>`;
  }).join('');
}
driveList.addEventListener('click', e => {
  if (e.target.dataset.id) {
    pending = drives.find(d => d.id == e.target.dataset.id);
    dText.textContent = 'Apply for ' + pending.role + ' at ' + pending.co + '?';
    applyDialog.showModal();
  }
});
cancelApply.addEventListener('click', () => applyDialog.close());
confirmApply.addEventListener('click', () => {
  applied.add(pending.id); applyDialog.close(); render(); showToast('Applied to ' + pending.co + ' (demo).');
});
[q, fType, fElig].forEach(el => el.addEventListener('input', render));
render();
