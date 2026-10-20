setupTabs();
const deadlineInput = document.getElementById('dl');
const today = new Date();
deadlineInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const companyBody = document.getElementById('compBody');
const applicationBody = document.getElementById('appBody');
const statusColors = { Applied: 'b-blue', Shortlisted: 'b-green', Interview: 'b-yellow', Selected: 'b-green', Rejected: 'b-red' };

async function loadCompanies() {
  const companies = await api('companies');
  companyBody.innerHTML = companies.length ? companies.map(company => `<tr><td>${escapeHtml(company.name)}</td><td>${escapeHtml(company.sector)}</td>
    <td><button class="btn btn-red btn-sm" data-delete="${Number(company.id)}" aria-label="Delete ${escapeHtml(company.name)}">Delete</button></td></tr>`).join('') :
    '<tr><td colspan="3">No companies yet.</td></tr>';
}
async function loadApplications() {
  const applications = await api('applications');
  applicationBody.innerHTML = applications.length ? applications.map(application => `<tr><td>${escapeHtml(application.student)}</td>
    <td>${escapeHtml(application.company)} - ${escapeHtml(application.role)}</td><td>${escapeHtml(application.cgpa ?? 'Not set')}</td>
    <td><span class="badge ${statusColors[application.status] || 'b-grey'}">${escapeHtml(application.status)}</span></td>
    <td><select data-status="${Number(application.id)}" aria-label="Update status for ${escapeHtml(application.student)}">
      ${['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map(status => `<option ${status === application.status ? 'selected' : ''}>${status}</option>`).join('')}
    </select></td></tr>`).join('') : '<tr><td colspan="5">No applications yet.</td></tr>';
}
async function loadSummary() {
  const summary = await api('admin-summary');
  document.querySelectorAll('.grid-4 .stat strong').forEach((item, index) =>
    item.textContent = [summary.students, summary.companies, summary.drives, summary.applications][index]
  );
}

companyBody.addEventListener('click', async event => {
  const button = event.target.closest('button[data-delete]');
  if (!button || !confirm('Delete this company and its drives?')) return;
  try {
    await api(`company&id=${button.dataset.delete}`, { method: 'DELETE' });
    await Promise.all([loadCompanies(), loadSummary()]);
    showToast('Company deleted.');
  } catch (error) { showToast(error.message); }
});
applicationBody.addEventListener('change', async event => {
  const select = event.target.closest('select[data-status]');
  if (!select) return;
  try {
    await api('application-status', { method: 'POST', body: JSON.stringify({ id: Number(select.dataset.status), status: select.value }) });
    showToast('Application status updated.');
  } catch (error) { showToast(error.message); }
});
document.getElementById('compForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = document.getElementById('cn').value.trim();
  const sector = document.getElementById('cs').value.trim();
  document.getElementById('compErr').textContent = '';
  try {
    await api('company', { method: 'POST', body: JSON.stringify({ name, sector }) });
    form.reset();
    await Promise.all([loadCompanies(), loadSummary()]);
    showToast('Company added.');
  } catch (error) { document.getElementById('compErr').textContent = error.message; }
});
document.getElementById('driveForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = {
    company: document.getElementById('dc').value.trim(),
    role: document.getElementById('dr').value.trim(),
    min_cgpa: document.getElementById('dg').value,
    max_backlogs: document.getElementById('db').value,
    deadline: document.getElementById('dl').value,
    package: document.getElementById('dp').value.trim(),
    drive_type: document.getElementById('dt').value
  };
  document.getElementById('driveErr').textContent = '';
  try {
    await api('drive', { method: 'POST', body: JSON.stringify(data) });
    form.reset();
    document.getElementById('driveErr').textContent = '';
    await loadSummary();
    showToast('Drive posted.');
  } catch (error) { document.getElementById('driveErr').textContent = error.message; }
});
document.getElementById('noteForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await api('notification', { method: 'POST', body: JSON.stringify({
      audience: document.getElementById('nt').value,
      message: document.getElementById('nm').value.trim()
    }) });
    form.reset();
    document.getElementById('nmErr').textContent = '';
    showToast('Notification sent.');
  } catch (error) { document.getElementById('nmErr').textContent = error.message; }
});
Promise.all([loadCompanies(), loadApplications(), loadSummary()]).catch(error => showToast(error.message));
