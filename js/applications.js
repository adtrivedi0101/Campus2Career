const steps = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
const badge = { Applied: 'b-blue', Shortlisted: 'b-yellow', Interview: 'b-yellow', Selected: 'b-green', Rejected: 'b-red' };
let applications = [];

function renderApplications() {
  const status = document.getElementById('sf').value;
  const shown = applications.filter(application => !status || application.status === status);
  document.getElementById('sum').textContent = `${shown.length} of ${applications.length} applications shown`;
  document.getElementById('appList').innerHTML = shown.length ? shown.map(application => {
    const position = steps.indexOf(application.status);
    const progress = steps.map((step, index) => {
      const complete = application.status === 'Rejected' ? index === 0 : index <= position;
      return `<li class="${complete ? 'done' : ''}">${step}</li>`;
    }).join('');
    const date = new Date(application.created_at.replace(' ', 'T')).toLocaleDateString();
    return `<article class="card"><div class="row"><h2 style="font-size:1.2rem;margin:0">${escapeHtml(application.company)}</h2>
      <span class="badge ${badge[application.status] || 'b-grey'}">${escapeHtml(application.status)}</span></div>
      <p style="margin:4px 0">${escapeHtml(application.role)} &bull; Applied ${escapeHtml(date)}</p>
      <ol class="stepper" aria-label="Application progress">${progress}</ol>
      ${application.status === 'Rejected' ? '<p class="error" style="margin-top:8px">Not selected for the next round.</p>' : ''}</article>`;
  }).join('') : '<p class="card">No applications match this filter.</p>';
}

document.getElementById('sf').addEventListener('change', renderApplications);
api('applications').then(data => { applications = data; renderApplications(); })
  .catch(error => showToast(error.message));
