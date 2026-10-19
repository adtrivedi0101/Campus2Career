if (!window.C2C_AUTH_BLOCKED) {
/* Placement-cell tools backed by shared browser storage. */
setupTabs();
let companies = C2C.read('c2c-companies', []);
if (!Array.isArray(companies)) companies = [];
let applications = C2C.readAllUserApplications();
const statusClasses = {Applied: 'b-blue', Shortlisted: 'b-green', Interview: 'b-yellow', Selected: 'b-green', Rejected: 'b-red'};

function renderCompanies() {
  compBody.innerHTML = companies.length ? companies.map((company, index) => `<tr>
    <td>${C2C.escape(company.n)}</td><td>${C2C.escape(company.s)}</td>
    <td><button class="btn btn-red btn-sm" data-del="${index}" aria-label="Delete ${C2C.escape(company.n)}">Delete</button></td>
  </tr>`).join('') : '<tr><td colspan="3">No companies have been added yet.</td></tr>';
}

function renderApplications() {
  applications = C2C.readAllUserApplications();
  appBody.innerHTML = applications.length ? applications.map((application, index) => {
    const profile = C2C.readUser('c2c-profile', {}, application.studentEmail);
    const cgpa = profile && profile.pcgpa ? profile.pcgpa : '—';
    return `<tr><td>${C2C.escape((profile && profile.pname) || application.studentName || application.studentEmail)}</td>
      <td>${C2C.escape(application.co)}</td><td>${C2C.escape(cgpa)}</td>
      <td><span class="badge ${statusClasses[application.st] || 'b-grey'}">${C2C.escape(application.st)}</span></td>
      <td><button class="btn btn-green btn-sm" data-st="Shortlisted" data-i="${index}">Shortlist</button>
      <button class="btn btn-sm" data-st="Interview" data-i="${index}">Interview</button>
      <button class="btn btn-green btn-sm" data-st="Selected" data-i="${index}">Select</button>
      <button class="btn btn-red btn-sm" data-st="Rejected" data-i="${index}">Reject</button></td></tr>`;
  }).join('') : '<tr><td colspan="5">No student applications yet.</td></tr>';
}

function renderSummary() {
  const users = C2C.getUsers();
  const drives = C2C.read('c2c-drives', []);
  const driveCount = Array.isArray(drives) ? drives.filter(drive =>
    !drive.deadline || drive.deadline >= new Date().toISOString().slice(0, 10)).length : 0;
  const studentUsers = users.filter(user => user.role === 'student');
  const placedStudents = new Set(applications
    .filter(application => application.st === 'Selected')
    .map(application => application.studentEmail));
  const placementRate = studentUsers.length ? Math.round(placedStudents.size / studentUsers.length * 100) : 0;
  document.getElementById('adminStudents').textContent = users.filter(user => user.role === 'student').length;
  document.getElementById('adminCompanies').textContent = companies.length;
  document.getElementById('adminDrives').textContent = driveCount;
  document.getElementById('adminPlaced').textContent = placementRate + '%';
  const departments = ['CSE', 'IT', 'ECE', 'MCA', 'Mechanical'];
  document.getElementById('departmentStats').innerHTML = departments.map(department => {
    const departmentUsers = studentUsers.filter(user => {
      const profile = C2C.readUser('c2c-profile', {}, user.email);
      return ((profile && profile.pdept) || user.department) === department;
    });
    const departmentPlaced = departmentUsers.filter(user => placedStudents.has(user.email)).length;
    const percentage = departmentUsers.length ? Math.round(departmentPlaced / departmentUsers.length * 100) : 0;
    return `<div class="bar-row"><span>${C2C.escape(department)}</span>
      <div class="bar"><span style="width:${percentage}%"></span></div>
      <span>${percentage}%</span></div>`;
  }).join('');
}

compBody.addEventListener('click', event => {
  const button = event.target.closest('button[data-del]');
  if (!button) return;
  companies.splice(Number(button.dataset.del), 1);
  if (C2C.write('c2c-companies', companies)) {
    renderCompanies();
    renderSummary();
    showToast('Company removed from the list.');
  }
});

appBody.addEventListener('click', event => {
  const button = event.target.closest('button[data-st]');
  if (!button) return;
  const application = applications[Number(button.dataset.i)];
  if (!application) return;
  const userApplications = C2C.readUser('c2c-applications', [], application.studentEmail);
  const target = userApplications.find(item => item.id === application.id &&
    item.co === application.co && item.role === application.role);
  if (!target) {
    showToast('Could not find the selected application. Refresh and try again.');
    return;
  }
  target.st = button.dataset.st;
  if (C2C.writeUser('c2c-applications', userApplications, application.studentEmail)) {
    renderApplications();
    renderSummary();
    showToast('Status updated to ' + button.dataset.st + '.');
  }
});

compForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!cn.value.trim() || !cs.value.trim()) {
    compErr.textContent = 'Enter both company name and sector.';
    return;
  }
  compErr.textContent = '';
  companies.push({n: cn.value.trim(), s: cs.value.trim()});
  if (C2C.write('c2c-companies', companies)) {
    compForm.reset();
    renderCompanies();
    renderSummary();
    showToast('Company added to the list.');
  }
});

driveForm.addEventListener('submit', event => {
  event.preventDefault();
  const cgpa = Number(dg.value);
  const backlogs = Number(db.value);
  if (!dc.value.trim() || !dr.value.trim() || !dp.value.trim() || !dl.value ||
      !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10 ||
      !Number.isInteger(backlogs) || backlogs < 0) {
    driveErr.textContent = 'Enter a company, role, package, valid CGPA (0-10), non-negative whole-number backlog limit and deadline.';
    return;
  }
  driveErr.textContent = '';
  const drives = C2C.read('c2c-drives', []);
  const savedDrives = Array.isArray(drives) ? drives : [];
  const deadline = dl.value;
  if (deadline < new Date().toISOString().slice(0, 10)) {
    driveErr.textContent = 'Choose a deadline that is today or later.';
    return;
  }
  savedDrives.push({
    id: 'admin-' + Date.now(),
    co: dc.value.trim(),
    role: dr.value.trim(),
    pkg: dp.value.trim(),
    cgpa,
    bl: backlogs,
    type: dt.value,
    deadline,
    last: new Date(deadline + 'T00:00:00').toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
  });
  if (C2C.write('c2c-drives', savedDrives)) {
    driveForm.reset();
    db.value = '0';
    renderSummary();
    showToast('Drive posted. It is now visible in Placement Drives.');
  }
});

noteForm.addEventListener('submit', event => {
  event.preventDefault();
  if (nm.value.trim().length < 5) {
    nmErr.textContent = 'Message must be at least 5 characters.';
    return;
  }
  nmErr.textContent = '';
  const stored = C2C.read('c2c-notifications', []);
  const notifications = Array.isArray(stored) ? stored : [];
  notifications.unshift({
    id: 'notice-' + Date.now(),
    message: nm.value.trim(),
    audience: nt.value,
    date: new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}),
    readBy: []
  });
  if (C2C.write('c2c-notifications', notifications)) {
    noteForm.reset();
    showToast('Notification sent to the selected students.');
  }
});

renderCompanies();
renderApplications();
renderSummary();
}
