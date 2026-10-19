const savedProfile = C2C.readUser('c2c-profile', {});
const profileData = savedProfile && typeof savedProfile === 'object' ? savedProfile : {};
const me = {
  cgpa: Number(profileData.pcgpa),
  backlogs: Number(profileData.pback)
};
const hasEligibilityData = String(profileData.pcgpa || '').trim() !== '' &&
  String(profileData.pback || '').trim() !== '';
const savedDrives = C2C.read('c2c-drives', []);
const drives = Array.isArray(savedDrives) ? savedDrives : [];
const activeDrives = drives.filter(drive => {
  if (!drive.deadline) return true;
  return drive.deadline >= new Date().toISOString().slice(0, 10);
});
let applications = C2C.readUser('c2c-applications', []);
if (!Array.isArray(applications)) applications = [];
let pending = null;
const q = document.getElementById('q');
const fType = document.getElementById('fType');
const fElig = document.getElementById('fElig');
const count = document.getElementById('count');
const driveList = document.getElementById('driveList');
const applyDialog = document.getElementById('applyDialog');
const dText = document.getElementById('dText');
const eligibilityDetails = document.getElementById('eligibilityDetails');
if (eligibilityDetails) {
  eligibilityDetails.textContent = hasEligibilityData
    ? `Your details for eligibility: CGPA ${me.cgpa}, ${me.backlogs} backlogs, ${profileData.pdept || 'CSE'}.`
    : 'Add your CGPA and backlog details in your profile to check eligibility and apply.';
}
const eligible = d => hasEligibilityData && me.cgpa >= Number(d.cgpa) && me.backlogs <= Number(d.bl);

function render() {
  const text = q.value.trim().toLowerCase();
  const list = activeDrives.filter(d =>
    (d.co + ' ' + d.role).toLowerCase().includes(text) &&
    (!fType.value || d.type === fType.value) &&
    (fElig.value !== 'yes' || eligible(d)));
  count.textContent = list.length + ' drive(s) found';
  driveList.innerHTML = list.length ? list.map(d => {
    const ok = eligible(d);
    const done = applications.some(a => a.id === 'drive-' + d.id || (a.co === d.co && a.role === d.role));
    return `<article class="card">
      <h2 style="font-size:1.2rem;margin:0">${C2C.escape(d.co)}</h2><p style="margin:2px 0">${C2C.escape(d.role)}</p>
      <p><span class="badge b-blue">${C2C.escape(d.type)}</span> <span class="badge b-grey">${C2C.escape(d.pkg)}</span></p>
      <p>Min CGPA: <strong>${C2C.escape(d.cgpa)}</strong><br>Max backlogs: <strong>${C2C.escape(d.bl)}</strong><br>Last date: ${C2C.escape(d.last)}</p>
      <p><span class="badge ${ok ? 'b-green' : 'b-red'}">${ok ? 'You are eligible' : 'Not eligible'}</span></p>
      <button class="btn btn-sm" data-id="${C2C.escape(d.id)}" ${ok && !done ? '' : 'disabled'}>${done ? 'Applied' : 'Apply Now'}</button></article>`;
  }).join('') : (activeDrives.length
    ? '<p class="card">No drives match these filters. Try changing your search.</p>'
    : '<p class="card">No active placement drives are available right now. Please check back later.</p>');
}

driveList.addEventListener('click', e => {
  const button = e.target.closest('button[data-id]');
  if (!button) return;
  if (!C2C.getSession()) {
    location.href = 'login.html?next=drives.html';
    return;
  }
  pending = drives.find(d => String(d.id) === button.dataset.id);
  if (!pending || !eligible(pending)) return;
  dText.textContent = 'Apply for ' + pending.role + ' at ' + pending.co + '?';
  applyDialog.showModal();
});
document.getElementById('cancelApply').addEventListener('click', () => {
  pending = null;
  applyDialog.close();
});
document.getElementById('confirmApply').addEventListener('click', () => {
  if (!pending || applications.some(a =>
    a.id === 'drive-' + pending.id || (a.co === pending.co && a.role === pending.role))) {
    pending = null;
    applyDialog.close();
    render();
    return;
  }
  const application = {
    id: 'drive-' + pending.id,
    co: pending.co,
    role: pending.role,
    date: new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}),
    st: 'Applied',
    student: C2C.getSession().email
  };
  applications.push(application);
  const saved = C2C.writeUser('c2c-applications', applications);
  const company = pending.co;
  pending = null;
  applyDialog.close();
  render();
  if (saved) showToast('Application submitted to ' + company + '. You can track it in My Applications.');
});
[q, fType, fElig].forEach(el => el.addEventListener('input', render));
render();
