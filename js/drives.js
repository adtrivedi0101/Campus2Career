let drives = [];
let profile = null;

function renderDrives() {
  const query = document.getElementById('q').value.toLowerCase();
  const type = document.getElementById('fType').value;
  const eligibleOnly = document.getElementById('fElig').value === 'yes';
  const shown = drives.filter(drive => {
    const eligible = profile && profile.cgpa !== null && Number(profile.cgpa) >= Number(drive.min_cgpa) &&
      Number(profile.backlogs) <= Number(drive.max_backlogs);
    return `${drive.company} ${drive.role}`.toLowerCase().includes(query) &&
      (!type || drive.drive_type === type) && (!eligibleOnly || eligible);
  });
  document.getElementById('count').textContent = `${shown.length} drive(s) found`;
  document.getElementById('driveList').innerHTML = shown.length ? shown.map(drive => {
    const eligible = profile && profile.cgpa !== null && Number(profile.cgpa) >= Number(drive.min_cgpa) &&
      Number(profile.backlogs) <= Number(drive.max_backlogs);
    return `<article class="card">
      <h2 style="font-size:1.2rem;margin:0">${escapeHtml(drive.company)}</h2>
      <p style="margin:2px 0">${escapeHtml(drive.role)}</p>
      <p><span class="badge b-blue">${escapeHtml(drive.drive_type)}</span> <span class="badge b-grey">${escapeHtml(drive.package || 'Package not specified')}</span></p>
      <p>Minimum CGPA: <strong>${escapeHtml(drive.min_cgpa)}</strong><br>Maximum backlogs: <strong>${escapeHtml(drive.max_backlogs)}</strong><br>Apply by: ${escapeHtml(drive.deadline)}</p>
      <p><span class="badge ${eligible ? 'b-green' : 'b-red'}">${eligible ? 'You are eligible' : 'Complete your profile to check eligibility'}</span></p>
      <button class="btn btn-sm" data-id="${Number(drive.id)}" ${eligible && !Number(drive.applied) ? '' : 'disabled'}>${Number(drive.applied) ? 'Applied' : 'Apply Now'}</button></article>`;
  }).join('') : '<p class="card">No placement drives are available yet.</p>';
}

async function loadDrives() {
  try {
    [drives, profile] = await Promise.all([api('drives'), api('profile')]);
    renderDrives();
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById('driveList').addEventListener('click', async event => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  button.disabled = true;
  try {
    await api('apply', { method: 'POST', body: JSON.stringify({ drive_id: Number(button.dataset.id) }) });
    showToast('Application submitted.');
    loadDrives();
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
});
['q', 'fType', 'fElig'].forEach(id => document.getElementById(id).addEventListener('input', renderDrives));
loadDrives();
