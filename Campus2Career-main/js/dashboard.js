if (!window.C2C_AUTH_BLOCKED) {
/* Student dashboard: account-specific application and notification summaries. */
const account = C2C.getSession();
const profile = C2C.readUser('c2c-profile', {});
const profileData = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
const applications = C2C.readUser('c2c-applications', []);
const validApps = Array.isArray(applications) ? applications : [];

document.getElementById('welcomeName').textContent = 'Welcome, ' + (profileData.pname || account.name);
document.getElementById('welcomeDetails').textContent =
  (profileData.pdept || account.department) + ' • CGPA ' + (profileData.pcgpa || 'Add your CGPA');
document.getElementById('applicationCount').textContent = validApps.length;
document.getElementById('shortlistCount').textContent = validApps.filter(app => app.st === 'Shortlisted').length;
document.getElementById('interviewCount').textContent = validApps.filter(app => app.st === 'Interview').length;
document.getElementById('offerCount').textContent = validApps.filter(app => app.st === 'Selected').length;

const profileFields = ['pname', 'pphone', 'pemail', 'pdept', 'p10', 'p12', 'pcgpa', 'pback'];
const skills = C2C.readUser('c2c-skills', []);
const certifications = C2C.readUser('c2c-certs', []);
const resume = C2C.readUser('c2c-resume', null);
const completedFields = profileFields.filter(field => String(profileData[field] || '').trim()).length +
  (Array.isArray(skills) && skills.length ? 1 : 0) +
  (Array.isArray(certifications) && certifications.length ? 1 : 0) +
  (resume && resume.data ? 1 : 0);
const completion = Math.round(completedFields / (profileFields.length + 3) * 100);
const progress = document.querySelector('[role="progressbar"]');
progress.setAttribute('aria-valuenow', completion);
progress.querySelector('span').style.width = completion + '%';
progress.previousElementSibling.textContent = completion + '% complete';

const savedDrives = C2C.read('c2c-drives', []);
const drives = Array.isArray(savedDrives) ? savedDrives : [];
const activeDrives = drives.filter(drive =>
  !drive.deadline || drive.deadline >= new Date().toISOString().slice(0, 10));
const cgpa = Number(profileData.pcgpa);
const backlogs = Number(profileData.pback);
const hasEligibilityData = String(profileData.pcgpa || '').trim() !== '' &&
  String(profileData.pback || '').trim() !== '';
const driveRows = document.getElementById('upcomingDrives');
driveRows.innerHTML = activeDrives.length ? activeDrives.map(drive => {
  const eligible = hasEligibilityData && Number.isFinite(cgpa) && Number.isFinite(backlogs) &&
    cgpa >= Number(drive.cgpa) && backlogs <= Number(drive.bl);
  const eligibility = !hasEligibilityData ? 'Add profile details' : (eligible ? 'Yes' : 'No');
  return `<tr><td>${C2C.escape(drive.co)}</td><td>${C2C.escape(drive.role)}</td>
    <td>${C2C.escape(drive.last)}</td><td><span class="badge ${!hasEligibilityData ? 'b-grey' : (eligible ? 'b-green' : 'b-red')}">${eligibility}</span></td></tr>`;
}).join('') : '<tr><td colspan="4">No active drives have been posted yet.</td></tr>';

const notesList = document.getElementById('notifList');
const notificationStore = C2C.read('c2c-notifications', []);
let notifications = Array.isArray(notificationStore) ? notificationStore : [];
function eligibleForAnyDrive() {
  return hasEligibilityData && Number.isFinite(cgpa) && Number.isFinite(backlogs) &&
    activeDrives.some(drive => cgpa >= Number(drive.cgpa) && backlogs <= Number(drive.bl));
}
function renderNotes() {
  const visible = notifications.filter(note =>
    note.audience === 'all' ||
    (note.audience === 'eligible' && eligibleForAnyDrive()) ||
    (note.audience === 'shortlisted' && validApps.some(app => app.st === 'Shortlisted')));
  notesList.innerHTML = visible.length ? visible.map(note => {
    const unread = !Array.isArray(note.readBy) || !note.readBy.includes(account.email);
    return `<li class="${unread ? 'unread' : ''}"><span>${C2C.escape(note.message)}</span><small>${C2C.escape(note.date)}</small></li>`;
  }).join('') : '<li>No notifications yet.</li>';
}
document.getElementById('markRead').addEventListener('click', () => {
  notifications = notifications.map(note => {
    const readBy = Array.isArray(note.readBy) ? note.readBy : [];
    return {...note, readBy: readBy.includes(account.email) ? readBy : [...readBy, account.email]};
  });
  if (C2C.write('c2c-notifications', notifications)) {
    renderNotes();
    showToast('All notifications marked as read.');
  }
});
renderNotes();
}
