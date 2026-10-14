/* Profile page: skills, certifications, resume check, validation | Owner: Student 2 */
let skills = ['HTML', 'CSS', 'Java'];
let certs = ['NPTEL - Database Management'];
function renderSkills() {
  skillList.innerHTML = skills.map((s, i) =>
    `<span class="tag">${s}<button type="button" aria-label="Remove ${s}" data-i="${i}">&times;</button></span>`).join('');
}
function renderCerts() { certList.innerHTML = certs.map(c => `<li>${c}</li>`).join(''); }
skillList.addEventListener('click', e => {
  if (e.target.dataset.i !== undefined) { skills.splice(e.target.dataset.i, 1); renderSkills(); }
});
skillInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const v = skillInput.value.trim();
    if (v && !skills.includes(v)) { skills.push(v); renderSkills(); }
    skillInput.value = '';
  }
});
certInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (certInput.value.trim()) { certs.push(certInput.value.trim()); renderCerts(); certInput.value = ''; }
  }
});
resume.addEventListener('change', () => {
  const f = resume.files[0]; resumeErr.textContent = '';
  if (!f) return;
  if (f.type !== 'application/pdf') { resumeErr.textContent = 'Only PDF files are allowed.'; resume.value = ''; return; }
  if (f.size > 2 * 1024 * 1024) { resumeErr.textContent = 'File must be smaller than 2 MB.'; resume.value = ''; return; }
  resumeName.textContent = 'Selected: ' + f.name;
});
profileForm.addEventListener('submit', e => {
  e.preventDefault();
  const phoneOk = /^[6-9][0-9]{9}$/.test(pphone.value.trim());
  const cgpaOk = pcgpa.value !== '' && pcgpa.value >= 0 && pcgpa.value <= 10;
  pphoneErr.textContent = phoneOk ? '' : 'Enter a valid 10-digit mobile number.';
  pcgpaErr.textContent = cgpaOk ? '' : 'CGPA must be between 0 and 10.';
  if (phoneOk && cgpaOk) showToast('Profile saved (demo).');
});
renderSkills(); renderCerts();
