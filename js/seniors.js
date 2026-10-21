let experiences = [];
const stars = rating => '&#9733;'.repeat(Number(rating)) + '&#9734;'.repeat(5 - Number(rating));

function renderExperiences() {
  const query = document.getElementById('sq').value.toLowerCase();
  const difficulty = document.getElementById('sd').value;
  const shown = experiences.filter(item =>
    `${item.company} ${item.name}`.toLowerCase().includes(query) &&
    (!difficulty || item.difficulty === difficulty));
  document.getElementById('experienceCount').textContent = `${shown.length} experience${shown.length === 1 ? '' : 's'} found`;
  const colors = { Easy: 'b-green', Medium: 'b-yellow', Hard: 'b-red' };
  document.getElementById('expList').innerHTML = shown.length ? shown.map(item => `<article class="card">
    <div class="row"><h2 style="font-size:1.2rem;margin:0">${escapeHtml(item.company)}</h2><span class="badge ${colors[item.difficulty]}">${escapeHtml(item.difficulty)}</span></div>
    <p style="margin:2px 0">${escapeHtml(item.role || 'Role not specified')} &bull; ${escapeHtml(item.name)}, ${escapeHtml(item.batch)} Batch</p>
    <p aria-label="Rating ${Number(item.rating)} out of 5" style="color:#92400e;margin:2px 0">${stars(item.rating)}</p>
    <details><summary>Read experience</summary><p>${escapeHtml(item.experience)}</p></details></article>`).join('') :
    '<p class="card">No experiences match your search.</p>';
}

async function loadExperiences() {
  try {
    experiences = await api('experiences');
    renderExperiences();
  } catch (error) { showToast(error.message); }
}
['sq', 'sd'].forEach(id => document.getElementById(id).addEventListener('input', renderExperiences));
document.getElementById('shareForm').addEventListener('submit', async event => {
  event.preventDefault();
  const data = {
    name: document.getElementById('xn').value.trim(),
    batch: document.getElementById('xb').value.trim(),
    company: document.getElementById('xc').value.trim(),
    role: document.getElementById('xr').value.trim(),
    difficulty: document.getElementById('xd').value,
    rating: Number(document.getElementById('xs').value),
    experience: document.getElementById('xt').value.trim()
  };
  const errors = [
    ['xn', 'xnErr', data.name.length >= 2, 'Enter your name.'],
    ['xb', 'xbErr', /^20[0-9]{2}$/.test(data.batch), 'Enter a valid year like 2025.'],
    ['xc', 'xcErr', data.company.length >= 2, 'Enter the company name.'],
    ['xt', 'xtErr', data.experience.length >= 30, 'Please write at least 30 characters.']
  ];
  errors.forEach(([fieldId, errorId, valid, message]) => {
    document.getElementById(errorId).textContent = valid ? '' : message;
    document.getElementById(fieldId).setAttribute('aria-invalid', String(!valid));
  });
  const firstInvalid = errors.find(([, , valid]) => !valid);
  if (firstInvalid) {
    document.getElementById(firstInvalid[0]).focus();
    return;
  }
  try {
    await api('experience', { method: 'POST', body: JSON.stringify(data) });
    event.currentTarget.reset();
    await loadExperiences();
    showToast('Thank you. Your experience has been shared.');
  } catch (error) { showToast(error.message); }
});
loadExperiences();
