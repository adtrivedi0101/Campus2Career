let dashboardLoading = false;
let dashboardDrives = [];
let pendingDashboardDrive = null;

const applicationStatuses = [
  { name: 'Applied', color: '#3b82f6' },
  { name: 'Shortlisted', color: '#128477' },
  { name: 'Interview', color: '#f59e0b' },
  { name: 'Selected', color: '#2345b5' },
  { name: 'Rejected', color: '#ef4444' }
];

const driveIcon = name => {
  const first = String(name || '?').trim()[0] || '?';
  return `<span class="drive-company-mark" aria-hidden="true">${escapeHtml(first.toUpperCase())}</span>`;
};

const daysUntil = value => {
  const [year, month, day] = value.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((deadline - today) / 86400000));
};

const formatDeadline = value => {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, day));
};

const formatRelativeTime = value => {
  const timestamp = new Date(value.replace(' ', 'T'));
  const elapsedDays = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 86400000));
  if (elapsedDays === 0) return 'Today';
  if (elapsedDays === 1) return 'Yesterday';
  if (elapsedDays < 7) return `${elapsedDays} days ago`;
  return timestamp.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const initialsFor = name => String(name || 'Student')
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map(part => part[0])
  .join('')
  .toUpperCase();

function renderStatistics(data, statusCounts) {
  document.getElementById('statApplications').textContent = data.application_count;
  document.getElementById('statInterviews').textContent = statusCounts.Interview;
  document.getElementById('statOffers').textContent = statusCounts.Selected;
  document.getElementById('statDrives').textContent = data.analytics.eligible_drives;
  document.getElementById('statApplicationsHint').textContent =
    `${statusCounts.Applied} awaiting an update`;
}

function renderApplicationAnalytics(applicationCount, statusCounts, eligibleDrives) {
  const legend = document.getElementById('applicationLegend');
  const donut = document.getElementById('applicationDonut');
  let angle = 0;
  const segments = applicationStatuses.map(status => {
    const share = applicationCount ? statusCounts[status.name] / applicationCount * 100 : 0;
    const nextAngle = angle + share * 3.6;
    const segment = `${status.color} ${angle}deg ${nextAngle}deg`;
    angle = nextAngle;
    return segment;
  });
  donut.style.setProperty('--donut-segments', segments.length
    ? `conic-gradient(${segments.join(', ')})`
    : 'conic-gradient(#e8eeff 0deg 360deg)');
  donut.setAttribute('aria-label', `${applicationCount} total applications across five statuses`);
  document.getElementById('donutTotal').textContent = applicationCount;
  legend.innerHTML = applicationStatuses.map(status =>
    `<li><span class="legend-label"><i style="--legend-color:${status.color}"></i>${status.name}</span><strong>${statusCounts[status.name]}</strong></li>`
  ).join('');

  const responded = applicationCount - statusCounts.Applied;
  const responseRate = applicationCount ? Math.round(responded / applicationCount * 100) : 0;
  document.getElementById('analyticsSummary').textContent = applicationCount
    ? `${responseRate}% of your applications have received an update. ${eligibleDrives} matching opportunit${eligibleDrives === 1 ? 'y is' : 'ies are'} open.`
    : `Apply to a drive to start your application tracker. ${eligibleDrives} matching opportunit${eligibleDrives === 1 ? 'y is' : 'ies are'} open.`;
}

function renderProfile(profile) {
  const skills = JSON.parse(profile.skills || '[]');
  const certifications = JSON.parse(profile.certifications || '[]');
  const checks = [
    ['Personal Details', Boolean(profile.phone)],
    ['Academic Details', profile.tenth_percent !== null && profile.twelfth_percent !== null && profile.cgpa !== null],
    ['Technical Skills', skills.length > 0],
    ['Resume Upload', Boolean(Number(profile.resume_uploaded))],
    ['Certifications', certifications.length > 0]
  ];
  const completion = Math.round(checks.filter(([, complete]) => complete).length / checks.length * 100);
  const ring = document.getElementById('profileRing');
  ring.style.setProperty('--ring-progress', `${completion * 3.6}deg`);
  ring.setAttribute('aria-label', `Profile ${completion}% complete`);
  document.getElementById('profilePercent').textContent = `${completion}%`;
  document.getElementById('profileChecklist').innerHTML = checks.map(([label, complete]) =>
    `<li class="${complete ? 'is-complete' : ''}"><span aria-hidden="true">${complete ? '&#10003;' : '&#9675;'}</span>${label}</li>`
  ).join('');

  const readiness = [
    ['Resume', Number(profile.resume_uploaded) ? 100 : 0],
    ['Technical skills', Math.min(100, Math.round(skills.length / 5 * 100))],
    ['Aptitude preparation', 60],
    ['Interview preparation', 50]
  ];
  const score = Math.round(readiness.reduce((sum, [, value]) => sum + value, 0) / readiness.length);
  const readinessRing = document.getElementById('readinessRing');
  readinessRing.style.setProperty('--ring-progress', `${score * 3.6}deg`);
  readinessRing.setAttribute('aria-label', `Placement readiness score ${score} out of 100`);
  document.getElementById('readinessScore').textContent = score;
  document.getElementById('readinessBars').innerHTML = readiness.map(([label, value]) =>
    `<div class="readiness-item"><div><span>${label}</span><strong>${value}%</strong></div><div class="readiness-track"><span class="${value === 100 ? 'is-complete' : ''}" style="width:${value}%"></span></div></div>`
  ).join('');

  return { checks, completion };
}

function renderDeadlines(drives, profile) {
  const deadlineList = document.getElementById('deadlineList');
  const upcoming = drives
    .filter(drive => !Number(drive.applied) && (
      profile.cgpa !== null &&
      Number(profile.cgpa) >= Number(drive.min_cgpa) &&
      Number(profile.backlogs) <= Number(drive.max_backlogs)
    ))
    .slice(0, 4);
  deadlineList.innerHTML = upcoming.length ? upcoming.map(drive => {
    const days = daysUntil(drive.deadline);
    const urgency = days <= 2 ? 'urgent' : days <= 5 ? 'soon' : 'upcoming';
    return `<li class="deadline-item"><span class="deadline-icon" aria-hidden="true">&#9719;</span><span class="deadline-copy"><strong>${escapeHtml(drive.company)} &middot; ${escapeHtml(drive.role)}</strong><small>Application deadline &middot; ${formatDeadline(drive.deadline)}</small></span><span class="countdown-badge ${urgency}">${days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`}</span></li>`;
  }).join('') : '<li class="empty-state">No matching application deadlines. Complete your profile or explore all drives.</li>';
}

function notificationPresentation(message) {
  if (/shortlist|interview|selected/i.test(message)) {
    return { title: 'Application update', icon: '&#10003;', type: 'success', description: message };
  }
  if (/company|drive|placement/i.test(message)) {
    return { title: 'New placement opportunity', icon: '&#9673;', type: 'opportunity', description: message };
  }
  if (/profile|resume|certification/i.test(message)) {
    return { title: 'Profile reminder', icon: '&#9998;', type: 'reminder', description: message };
  }
  return { title: 'Campus2Career update', icon: '&#9733;', type: 'default', description: message };
}

function renderNotifications(notificationData) {
  const items = notificationData.items;
  document.getElementById('notifList').innerHTML = items.length ? items.slice(0, 6).map(note => {
    const presentation = notificationPresentation(note.message);
    const unread = !Number(note.is_read);
    return `<li class="notification-item ${unread ? 'unread' : ''}"><span class="notification-icon ${presentation.type}" aria-hidden="true">${presentation.icon}</span><div class="notification-copy"><strong>${escapeHtml(presentation.title)}</strong><span>${escapeHtml(note.message)}</span><small>${formatRelativeTime(note.created_at)}</small></div>${unread ? '<i class="unread-dot" aria-label="Unread"></i>' : ''}</li>`;
  }).join('') : '<li class="empty-state">You are all caught up. New updates will appear here.</li>';

  const unreadCount = Number(notificationData.unread_count);
  const badge = document.getElementById('navUnread');
  badge.hidden = unreadCount === 0;
  badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
  badge.setAttribute('aria-label', `${unreadCount} unread notifications`);
  document.querySelector('.notification-mark-read').disabled = unreadCount === 0;

  const alert = document.getElementById('notificationAlert');
  alert.hidden = unreadCount === 0;
  alert.innerHTML = unreadCount
    ? `<strong>${unreadCount} new notification${unreadCount === 1 ? '' : 's'}</strong><span>${escapeHtml(items.find(note => !Number(note.is_read))?.message || 'Open Recent Notifications to see the latest updates.')}</span>`
    : '';
}

function profileMatch(drive, profile, skills) {
  if (profile.cgpa === null) return 0;
  const cgpaFit = Math.min(1, Number(profile.cgpa) / 10);
  const skillsFit = Math.min(1, skills.length / 5);
  const backlogMatch = Number(profile.backlogs) <= Number(drive.max_backlogs) ? 1 : 0;
  return Math.round((cgpaFit * 0.6 + skillsFit * 0.2 + backlogMatch * 0.2) * 100);
}

function renderRecommendedDrives(drives, profile) {
  const recommendations = document.getElementById('recommendedDrives');
  if (!drives.length) {
    recommendations.innerHTML = '<p class="empty-state">There are no open drives right now. Check back soon.</p>';
    return;
  }
  const skills = JSON.parse(profile.skills || '[]');
  recommendations.innerHTML = drives.slice(0, 4).map(drive => {
    const eligible = profile.cgpa !== null &&
      Number(profile.cgpa) >= Number(drive.min_cgpa) &&
      Number(profile.backlogs) <= Number(drive.max_backlogs);
    const match = profileMatch(drive, profile, skills);
    const applied = Number(drive.applied) === 1;
    return `<article class="drive-card">
      <div class="drive-card-top">${driveIcon(drive.company)}<span class="match-badge ${eligible ? '' : 'match-muted'}">${eligible ? `${match}% match` : 'Not eligible'}</span></div>
      <p class="drive-company">${escapeHtml(drive.company)}</p><h3>${escapeHtml(drive.role)}</h3>
      <p class="drive-sector">${escapeHtml(drive.sector || drive.drive_type)} &middot; ${escapeHtml(drive.drive_type)}</p>
      <ul class="drive-requirements"><li><span aria-hidden="true">&#9673;</span>${escapeHtml(profile.department || 'All departments')}</li><li><span aria-hidden="true">&#9733;</span>Minimum CGPA ${Number(drive.min_cgpa).toFixed(1)}+</li><li><span aria-hidden="true">&#9719;</span>Apply by ${formatDeadline(drive.deadline)}</li></ul>
      <details class="drive-details"><summary>View details</summary><p>${escapeHtml(drive.company)} is hiring for ${escapeHtml(drive.role)} (${escapeHtml(drive.drive_type)}). Package: ${escapeHtml(drive.package || 'Not specified')}. Maximum backlogs: ${Number(drive.max_backlogs)}.</p></details>
      <button class="btn drive-apply" type="button" data-apply-drive="${Number(drive.id)}" ${!eligible || applied ? 'disabled' : ''}>${applied ? 'Already applied' : eligible ? 'Apply now' : 'Not eligible'}</button>
    </article>`;
  }).join('');
}

const dashboard = async () => {
  if (dashboardLoading) return;
  dashboardLoading = true;
  try {
    const [data, notificationData, session] = await Promise.all([
      api('dashboard'),
      api('notifications'),
      api('session')
    ]);
    const fullName = session.user.full_name;
    document.getElementById('welcomeHeading').textContent = `Welcome back, ${fullName}!`;
    document.getElementById('welcomeMeta').textContent =
      `${session.user.department || data.profile.department || 'Student'} Student  ·  CGPA ${data.profile.cgpa ?? 'not set'}`;
    document.getElementById('navStudentName').textContent = fullName;
    document.getElementById('studentAvatar').textContent = initialsFor(fullName);

    const statusCounts = Object.fromEntries(applicationStatuses.map(status => [
      status.name,
      Number(data.statuses.find(row => row.status === status.name)?.total || 0)
    ]));
    renderStatistics(data, statusCounts);
    renderApplicationAnalytics(data.application_count, statusCounts, Number(data.analytics.eligible_drives));
    renderProfile(data.profile);
    renderNotifications(notificationData);

    dashboardDrives = data.drives;
    renderDeadlines(dashboardDrives, data.profile);
    renderRecommendedDrives(dashboardDrives, data.profile);
  } catch (error) {
    showToast(error.message);
  } finally {
    dashboardLoading = false;
  }
};

document.getElementById('markRead').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await api('notifications-read', { method: 'POST', body: '{}' });
    await dashboard();
    showToast('Notifications marked as read.');
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
});

document.getElementById('recommendedDrives').addEventListener('click', event => {
  const button = event.target.closest('[data-apply-drive]');
  if (!button || button.disabled) return;
  pendingDashboardDrive = dashboardDrives.find(drive => Number(drive.id) === Number(button.dataset.applyDrive));
  if (!pendingDashboardDrive) {
    showToast('This drive is no longer available. Refresh the dashboard.');
    return;
  }
  document.getElementById('dashboardApplyMessage').textContent =
    `Submit an application for ${pendingDashboardDrive.role} at ${pendingDashboardDrive.company}?`;
  document.getElementById('dashboardApplyDialog').showModal();
});

document.getElementById('dashboardApplyCancel').addEventListener('click', () => {
  document.getElementById('dashboardApplyDialog').close();
  pendingDashboardDrive = null;
});

document.getElementById('dashboardApplyConfirm').addEventListener('click', async event => {
  if (!pendingDashboardDrive) return;
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await api('apply', {
      method: 'POST',
      body: JSON.stringify({ drive_id: Number(pendingDashboardDrive.id) })
    });
    document.getElementById('dashboardApplyDialog').close();
    pendingDashboardDrive = null;
    await dashboard();
    showToast('Application submitted.');
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

dashboard();
window.addEventListener('focus', dashboard);
window.setInterval(dashboard, 30000);
