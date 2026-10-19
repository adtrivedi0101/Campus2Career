const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('a') && nav.classList.contains('open')) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Small message popup used by all pages
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, 3000);
}

const userDataKeys = new Set(['c2c-profile', 'c2c-skills', 'c2c-certs', 'c2c-applications', 'c2c-resume']);
function userStorageKey(email, key) {
  return 'c2c-user:' + encodeURIComponent(email) + ':' + key;
}

window.C2C = {
  read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      showToast('Could not load saved portal information from this browser.');
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast('Could not save your changes in this browser.');
      return false;
    }
  },
  getUsers() {
    const users = this.read('c2c-users', []);
    return Array.isArray(users) ? users : [];
  },
  getSession() {
    const session = this.read('c2c-session', null);
    if (!session || typeof session.email !== 'string') return null;
    const user = this.getUsers().find(account => account.email === session.email);
    return user && user.role === session.role ? user : null;
  },
  readUser(key, fallback, email) {
    const user = email || (this.getSession() && this.getSession().email);
    if (!user || !userDataKeys.has(key)) return fallback;
    try {
      const value = localStorage.getItem(userStorageKey(user, key));
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      showToast('Could not load saved portal information from this browser.');
      return fallback;
    }
  },
  writeUser(key, value, email) {
    const session = this.getSession();
    const user = email || (session && session.email);
    if (!user || !userDataKeys.has(key)) {
      showToast('Could not save your changes because no account is active.');
      return false;
    }
    try {
      localStorage.setItem(userStorageKey(user, key), JSON.stringify(value));
      return true;
    } catch (error) {
      showToast('Could not save your changes in this browser.');
      return false;
    }
  },
  readAllUserApplications() {
    return this.getUsers().flatMap(user => {
      const applications = this.readUser('c2c-applications', [], user.email);
      return Array.isArray(applications)
        ? applications.map(application => ({...application, studentEmail: user.email, studentName: user.name}))
        : [];
    });
  },
  escape(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }
};

const authPage = document.body.dataset.authRequired;
window.C2C_AUTH_BLOCKED = false;
if (authPage) {
  const user = C2C.getSession();
  if (!user) {
    window.C2C_AUTH_BLOCKED = true;
    const destination = location.pathname.split('/').pop() || 'student-dashboard.html';
    location.replace('login.html?next=' + encodeURIComponent(destination));
  } else if (user.role !== authPage) {
    window.C2C_AUTH_BLOCKED = true;
    location.replace(user.role === 'admin' ? 'admin.html' : 'student-dashboard.html');
  }
}

const loginLink = nav && nav.querySelector('a[href="login.html"]');
const currentUser = C2C.getSession();
if (loginLink && currentUser) {
  loginLink.textContent = 'Logout';
  loginLink.href = 'login.html?logout=1';
  loginLink.addEventListener('click', event => {
    event.preventDefault();
    localStorage.removeItem('c2c-session');
    location.href = 'login.html';
  });
}

// Tab switching (used on login and admin pages)
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const activate = tab => {
    tabs.forEach(t => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== tab.dataset.panel);
  };
  tabs.forEach((tab, index) => {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 :
        (index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      tabs[next].focus();
      activate(tabs[next]);
    });
  });
}
