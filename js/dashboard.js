let dashboardLoading = false;
const dashboard = async () => {
  if (dashboardLoading) return;
  dashboardLoading = true;
  try {
    const [data, notificationData, session] = await Promise.all([api('dashboard'), api('notifications'), api('session')]);
    const name = document.querySelector('.page-title');
    name.textContent = `Welcome, ${session.user.full_name}`;
    const applicationCount = data.application_count;
    const shortlisted = data.statuses.filter(row => row.status === 'Shortlisted').reduce((sum, row) => sum + Number(row.total), 0);
    const interviews = data.statuses.filter(row => row.status === 'Interview').reduce((sum, row) => sum + Number(row.total), 0);
    const selected = data.statuses.filter(row => row.status === 'Selected').reduce((sum, row) => sum + Number(row.total), 0);
    const stats = document.querySelectorAll('.grid-4 .stat strong');
    [applicationCount, shortlisted, interviews, selected].forEach((value, index) => { stats[index].textContent = value; });
    const profile = data.profile;
    document.querySelector('.lead').textContent = `${session.user.department || 'Department not set'} - CGPA ${profile.cgpa ?? 'not set'}`;
    const hasSkills = JSON.parse(profile.skills || '[]').length > 0;
    const hasCertifications = JSON.parse(profile.certifications || '[]').length > 0;
    const completionFields = [
      Boolean(profile.phone), profile.tenth_percent !== null, profile.twelfth_percent !== null,
      profile.cgpa !== null, hasSkills, hasCertifications, Boolean(Number(profile.resume_uploaded))
    ];
    const completion = Math.round(completionFields.filter(Boolean).length / completionFields.length * 100);
    document.querySelector('.progress span').style.width = `${completion}%`;
    document.querySelector('.progress').setAttribute('aria-valuenow', String(completion));
    document.querySelector('.progress').previousElementSibling.textContent = `${completion}% complete`;
    const notifications = notificationData.items;
    const alert = document.getElementById('notificationAlert');
    const unreadCount = notificationData.unread_count;
    alert.hidden = unreadCount === 0;
    alert.innerHTML = unreadCount
      ? `<strong>${unreadCount} new notification${unreadCount === 1 ? '' : 's'}</strong><span>${escapeHtml(notifications.find(note => !Number(note.is_read))?.message || 'Open Notifications below to see the latest updates.')}</span>`
      : '';
    document.querySelector('#notifList').innerHTML = notifications.length ? notifications.map(note =>
      `<li class="${Number(note.is_read) ? '' : 'unread'}"><span>${escapeHtml(note.message)}</span><small>${escapeHtml(new Date(note.created_at.replace(' ', 'T')).toLocaleDateString())}</small></li>`
    ).join('') : '<li>No notifications yet.</li>';
    const rows = data.drives.map(drive => `<tr><td>${escapeHtml(drive.company)}</td><td>${escapeHtml(drive.role)}</td><td>${escapeHtml(drive.deadline)}</td>
      <td><span class="badge ${profile.cgpa !== null && Number(profile.cgpa) >= Number(drive.min_cgpa) && Number(profile.backlogs) <= Number(drive.max_backlogs) ? 'b-green' : 'b-red'}">
      ${profile.cgpa !== null && Number(profile.cgpa) >= Number(drive.min_cgpa) && Number(profile.backlogs) <= Number(drive.max_backlogs) ? 'Yes' : 'No'}</span></td></tr>`).join('');
    document.querySelector('.table-wrap tbody').innerHTML = rows || '<tr><td colspan="4">No upcoming drives.</td></tr>';
  } catch (error) {
    showToast(error.message);
  } finally {
    dashboardLoading = false;
  }
};
document.getElementById('markRead').addEventListener('click', async () => {
  try {
    await api('notifications-read', { method: 'POST', body: '{}' });
    document.querySelectorAll('#notifList .unread').forEach(item => item.classList.remove('unread'));
    document.getElementById('notificationAlert').hidden = true;
    showToast('Notifications marked as read.');
  } catch (error) { showToast(error.message); }
});
dashboard();
window.addEventListener('focus', dashboard);
window.setInterval(dashboard, 30000);
