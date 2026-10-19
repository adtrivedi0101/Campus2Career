if (!window.C2C_AUTH_BLOCKED) {
const account = C2C.getSession();
const defaultProfile = {
  pname: account.name,
  pphone: '',
  pemail: account.email,
  pdept: account.department,
  p10: '',
  p12: '',
  pcgpa: '',
  pback: ''
};
const storedProfile = C2C.readUser('c2c-profile', defaultProfile);
const profile = storedProfile && typeof storedProfile === 'object' && !Array.isArray(storedProfile)
  ? storedProfile : defaultProfile;
Object.entries(defaultProfile).forEach(([id, value]) => {
  const input = document.getElementById(id);
  if (input) input.value = Object.prototype.hasOwnProperty.call(profile, id) ? profile[id] : value;
});
let skills = C2C.readUser('c2c-skills', []);
let certs = C2C.readUser('c2c-certs', []);
let savedResume = C2C.readUser('c2c-resume', null);
if (!Array.isArray(skills)) skills = [];
if (!Array.isArray(certs)) certs = [];
function renderSkills() {
  skillList.innerHTML = skills.map((s, i) =>
    `<span class="tag">${C2C.escape(s)}<button type="button" aria-label="Remove ${C2C.escape(s)}" data-i="${i}">&times;</button></span>`).join('');
}
function renderCerts() { certList.innerHTML = certs.map(c => `<li>${C2C.escape(c)}</li>`).join(''); }
function renderResume() {
  resumeName.replaceChildren();
  if (!savedResume || typeof savedResume.name !== 'string' || typeof savedResume.data !== 'string') {
    resumeName.textContent = 'No file uploaded yet.';
    return;
  }
  resumeName.append('Saved: ');
  const link = document.createElement('a');
  link.href = savedResume.data;
  link.download = savedResume.name;
  link.textContent = savedResume.name;
  resumeName.append(link);
}
skillList.addEventListener('click', e => {
  if (e.target.dataset.i !== undefined) { skills.splice(e.target.dataset.i, 1); C2C.writeUser('c2c-skills', skills); renderSkills(); }
});
skillInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const v = skillInput.value.trim();
    if (v && !skills.includes(v)) { skills.push(v); C2C.writeUser('c2c-skills', skills); renderSkills(); }
    skillInput.value = '';
  }
});
certInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (certInput.value.trim()) { certs.push(certInput.value.trim()); C2C.writeUser('c2c-certs', certs); renderCerts(); certInput.value = ''; }
  }
});
resume.addEventListener('change', () => {
  const f = resume.files[0]; resumeErr.textContent = '';
  if (!f) return;
  if (f.type !== 'application/pdf') { resumeErr.textContent = 'Only PDF files are allowed.'; resume.value = ''; return; }
  if (f.size > 2 * 1024 * 1024) { resumeErr.textContent = 'File must be smaller than 2 MB.'; resume.value = ''; return; }
  const reader = new FileReader();
  reader.onerror = () => { resumeErr.textContent = 'Could not read this file. Please try again.'; };
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      resumeErr.textContent = 'Could not read this file. Please try again.';
      return;
    }
    savedResume = {name: f.name, data: reader.result};
    if (C2C.writeUser('c2c-resume', savedResume)) {
      renderResume();
      showToast('Resume saved in this browser.');
    } else {
      savedResume = C2C.readUser('c2c-resume', null);
    }
  };
  reader.readAsDataURL(f);
});
profileForm.addEventListener('submit', e => {
  e.preventDefault();
  const phoneOk = /^[6-9][0-9]{9}$/.test(pphone.value.trim());
  const cgpaOk = pcgpa.value !== '' && pcgpa.value >= 0 && pcgpa.value <= 10;
  const p10Ok = p10.value !== '' && p10.value >= 0 && p10.value <= 100;
  const p12Ok = p12.value !== '' && p12.value >= 0 && p12.value <= 100;
  const backlogsOk = pback.value !== '' && Number.isInteger(Number(pback.value)) && Number(pback.value) >= 0;
  pphoneErr.textContent = phoneOk ? '' : 'Enter a valid 10-digit mobile number.';
  pcgpaErr.textContent = cgpaOk ? '' : 'CGPA must be between 0 and 10.';
  p10Err.textContent = p10Ok ? '' : 'Percentage must be between 0 and 100.';
  p12Err.textContent = p12Ok ? '' : 'Percentage must be between 0 and 100.';
  pbackErr.textContent = backlogsOk ? '' : 'Backlogs must be a non-negative whole number.';
  if (phoneOk && cgpaOk && p10Ok && p12Ok && backlogsOk) {
    const saved = {};
    Object.keys(defaultProfile).forEach(id => { saved[id] = document.getElementById(id).value; });
    if (C2C.writeUser('c2c-profile', saved)) showToast('Profile saved in this browser.');
  }
});
renderSkills(); renderCerts(); renderResume();
}
