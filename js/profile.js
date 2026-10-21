let skills = [];
let certifications = [];
let resumeUploaded = false;
function renderSkills() {
  document.getElementById('skillList').innerHTML = skills.map((skill, index) =>
    `<span class="tag">${escapeHtml(skill)}<button type="button" aria-label="Remove ${escapeHtml(skill)}" data-index="${index}">&times;</button></span>`
  ).join('');
}
function renderCertifications() {
  document.getElementById('certList').innerHTML = certifications.map((item, index) =>
    `<li>${escapeHtml(item)} <button class="btn btn-sm btn-outline" type="button" data-index="${index}">Remove</button></li>`
  ).join('');
}
function addTextItem(input, list, render, maxLength) {
  const value = input.value.trim();
  if (!value || value.length > maxLength || list.length >= 50) {
    input.setCustomValidity(!value ? '' : list.length >= 50 ? 'You can add at most 50 items.' : `Use no more than ${maxLength} characters.`);
    input.reportValidity();
    input.setCustomValidity('');
    return;
  }
  if (!list.some(item => item.toLowerCase() === value.toLowerCase())) list.push(value);
  input.value = '';
  render();
}
document.getElementById('skillList').addEventListener('click', event => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  const index = Number(button.dataset.index);
  skills.splice(index, 1);
  renderSkills();
  (document.querySelectorAll('#skillList button')[Math.min(index, skills.length - 1)] ||
    document.getElementById('skillInput')).focus();
});
document.getElementById('certList').addEventListener('click', event => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  const index = Number(button.dataset.index);
  certifications.splice(index, 1);
  renderCertifications();
  (document.querySelectorAll('#certList button')[Math.min(index, certifications.length - 1)] ||
    document.getElementById('certInput')).focus();
});
document.getElementById('skillInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); addTextItem(event.currentTarget, skills, renderSkills, 60); }
});
document.getElementById('certInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); addTextItem(event.currentTarget, certifications, renderCertifications, 150); }
});

api('profile').then(profile => {
  document.getElementById('pname').value = profile.full_name;
  document.getElementById('pemail').value = profile.email;
  document.getElementById('pdept').value = profile.department;
  document.getElementById('pphone').value = profile.phone || '';
  document.getElementById('p10').value = profile.tenth_percent ?? '';
  document.getElementById('p12').value = profile.twelfth_percent ?? '';
  document.getElementById('pcgpa').value = profile.cgpa ?? '';
  document.getElementById('pback').value = profile.backlogs ?? 0;
  skills = JSON.parse(profile.skills || '[]');
  certifications = JSON.parse(profile.certifications || '[]');
  resumeUploaded = Number(profile.resume_uploaded) === 1;
  if (resumeUploaded) {
    document.getElementById('resumeName').textContent = 'Saved resume: PDF uploaded.';
    document.getElementById('resumeCurrent').hidden = false;
    document.getElementById('resumeDownload').hidden = false;
  }
  renderSkills();
  renderCertifications();
}).catch(error => showToast(error.message));

document.getElementById('resume').addEventListener('change', async event => {
  const file = event.currentTarget.files[0];
  const error = document.getElementById('resumeErr');
  error.textContent = '';
  event.currentTarget.setAttribute('aria-invalid', 'false');
  if (!file) return;
  if (file.type !== 'application/pdf' || file.size > 2 * 1024 * 1024) {
    error.textContent = file.type !== 'application/pdf' ? 'Only PDF files are allowed.' : 'File must be smaller than 2 MB.';
    event.currentTarget.setAttribute('aria-invalid', 'true');
    event.currentTarget.value = '';
    return;
  }
  document.getElementById('resumeName').textContent = `Selected: ${file.name}`;
  const formData = new FormData();
  formData.append('resume', file);
  try {
    await api('resume', { method: 'POST', body: formData });
    resumeUploaded = true;
    document.getElementById('resumeName').textContent = `Saved resume: ${file.name}`;
    document.getElementById('resumeCurrent').hidden = false;
    document.getElementById('resumeDownload').hidden = false;
    showToast('Resume uploaded.');
  } catch (uploadError) {
    error.textContent = uploadError.message;
    event.currentTarget.setAttribute('aria-invalid', 'true');
    event.currentTarget.value = '';
    document.getElementById('resumeName').textContent = resumeUploaded
      ? 'Saved resume: PDF uploaded.'
      : 'No resume uploaded yet. Choose a PDF file to upload.';
  }
});

document.getElementById('profileForm').addEventListener('submit', async event => {
  event.preventDefault();
  const phone = document.getElementById('pphone').value.trim();
  const cgpa = document.getElementById('pcgpa').value;
  const phoneOk = /^[6-9][0-9]{9}$/.test(phone);
  const cgpaOk = cgpa === '' || (Number(cgpa) >= 0 && Number(cgpa) <= 10);
  document.getElementById('pphoneErr').textContent = phoneOk ? '' : 'Enter a valid 10-digit mobile number.';
  document.getElementById('pcgpaErr').textContent = cgpaOk ? '' : 'CGPA must be between 0 and 10.';
  document.getElementById('pphone').setAttribute('aria-invalid', String(!phoneOk));
  document.getElementById('pcgpa').setAttribute('aria-invalid', String(!cgpaOk));
  if (!phoneOk || !cgpaOk) {
    document.getElementById(phoneOk ? 'pcgpa' : 'pphone').focus();
    return;
  }
  try {
    await api('profile', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        tenth_percent: document.getElementById('p10').value,
        twelfth_percent: document.getElementById('p12').value,
        cgpa,
        backlogs: document.getElementById('pback').value,
        skills,
        certifications
      })
    });
    showToast('Profile saved.');
  } catch (error) { showToast(error.message); }
});
