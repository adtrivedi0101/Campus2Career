let csrfToken = '';
let csrfPromise = null;
const loadSession = async () => {
  const response = await fetch('api.php?action=session');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Your login session has expired.');
  csrfToken = result.csrf;
  return result;
};
const api = async (action, options = {}) => {
  const [actionName, query = ''] = action.split('&');
  if (options.method && options.method !== 'GET' && !['login', 'register'].includes(actionName) && !csrfToken) {
    csrfPromise = csrfPromise || loadSession().finally(() => { csrfPromise = null; });
    await csrfPromise;
  }
  const headers = {};
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (options.method && options.method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(`api.php?action=${encodeURIComponent(actionName)}${query ? `&${query}` : ''}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  if (actionName === 'session') csrfToken = result.csrf;
  return result;
};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
}
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
  skipLink.addEventListener('click', event => {
    const target = document.getElementById(skipLink.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.scrollIntoView();
    history.replaceState(null, '', skipLink.hash);
  });
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function setupTabs() {
  document.querySelectorAll('.tabs').forEach(tabList => {
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const activate = (selectedTab, moveFocus = false) => {
      tabs.forEach(tab => {
        const selected = tab === selectedTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(tab.dataset.panel);
        if (panel) panel.hidden = !selected;
      });
      if (moveFocus) selectedTab.focus();
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        const currentIndex = tabs.indexOf(tab);
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        activate(tabs[nextIndex], true);
      });
    });

    const selectedTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    if (selectedTab) activate(selectedTab);
  });
}

if (!document.getElementById('loginForm') && !document.body.classList.contains('public-home')) loadSession().then(({ user, csrf }) => {
  csrfToken = csrf;
  document.querySelectorAll('#nav a').forEach(link => {
    const adminLink = link.getAttribute('href') === 'admin.html';
    const studentLink = ['student-dashboard.html', 'profile.html', 'drives.html', 'applications.html', 'seniors.html'].includes(link.getAttribute('href'));
    if ((user.role === 'admin' && studentLink) || (user.role === 'student' && adminLink)) {
      link.closest('li').hidden = true;
    }
    if (link.getAttribute('href') === 'login.html') link.closest('li').hidden = true;
  });
  const list = nav && nav.querySelector('ul');
  if (list && !document.getElementById('logoutLink')) {
    const item = document.createElement('li');
    item.innerHTML = '<a href="#" id="logoutLink">Log out</a>';
    list.append(item);
  }
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink && !logoutLink.dataset.logoutBound) {
    logoutLink.dataset.logoutBound = 'true';
    logoutLink.addEventListener('click', async event => {
      event.preventDefault();
      try {
        await api('logout', { method: 'POST', body: '{}' });
        location.href = 'login.html';
      } catch (error) {
        showToast(error.message);
      }
    });
  }
}).catch(() => { location.href = 'login.html'; });
