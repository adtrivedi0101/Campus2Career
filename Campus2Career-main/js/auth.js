setupTabs();

const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const authStatus = document.getElementById('authStatus');
function setStatus(message, state) {
  authStatus.textContent = message;
  authStatus.dataset.state = state || 'success';
  authStatus.hidden = message === '';
}

function setErr(id, message) {
  document.getElementById(id).textContent = message;
  return message === '';
}

function focusFirstInvalid(ids) {
  const first = ids.find(id => document.getElementById(id).textContent);
  if (first) {
    const input = document.getElementById(first.replace('Err', ''));
    if (input) input.focus();
  }
}

function setSubmitting(button, submitting, label) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = submitting;
  button.textContent = submitting ? label : button.dataset.label;
}

async function passwordHash(password, salt) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Secure password verification requires HTTPS or localhost.');
  }
  const material = await window.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await window.crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt,
    iterations: 100000,
    hash: 'SHA-256'
  }, material, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
  return new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
}

function redirectFor(user) {
  const studentPages = new Set([
    'student-dashboard.html', 'profile.html', 'drives.html', 'applications.html',
    'seniors.html'
  ]);
  const requested = new URLSearchParams(location.search).get('next');
  const destination = user.role === 'admin' ? 'admin.html' :
    (requested && studentPages.has(requested) ? requested : 'student-dashboard.html');
  location.assign(destination);
}

document.getElementById('showPass').addEventListener('change', event => {
  document.getElementById('lpass').type = event.target.checked ? 'text' : 'password';
});

document.getElementById('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('lemail').value.trim().toLowerCase();
  const password = document.getElementById('lpass').value;
  const validEmail = setErr('lemailErr', emailOk(email) ? '' : 'Enter a valid email address.');
  const validPassword = setErr('lpassErr', password.length >= 8 ? '' : 'Password must be at least 8 characters.');
  if (!validEmail || !validPassword) {
    setStatus('Check the highlighted fields and try again.', 'error');
    focusFirstInvalid(['lemailErr', 'lpassErr']);
    return;
  }

  const button = event.submitter;
  setSubmitting(button, true, 'Signing in…');
  setStatus('Checking your account…', 'pending');
  const user = C2C.getUsers().find(account => account.email === email);
  const salt = user && hexToBytes(user.salt);
  if (!user || !salt) {
    setErr('lpassErr', 'Email, password, or account type is incorrect.');
    setStatus('We couldn’t sign you in. Check your email and password, or create an account.', 'error');
    setSubmitting(button, false);
    return;
  }
  try {
    const candidate = await passwordHash(password, salt);
    if (candidate !== user.passwordHash) {
      setErr('lpassErr', 'Email, password, or account type is incorrect.');
      setStatus('We couldn’t sign you in. Check your email and password, or create an account.', 'error');
      setSubmitting(button, false);
      return;
    }
    if (!C2C.write('c2c-session', {email: user.email, role: user.role})) {
      setStatus('Your account was verified, but this browser could not save the sign-in. Check browser storage settings and try again.', 'error');
      setSubmitting(button, false);
      return;
    }
    setStatus('Signed in. Opening your account…', 'success');
    redirectFor(user);
  } catch (error) {
    setErr('lpassErr', error.message || 'Could not verify your password.');
    setStatus(error.message || 'Could not verify your password. Please try again.', 'error');
    setSubmitting(button, false);
  }
});

document.getElementById('registerForm').addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('rname').value.trim();
  const regNumber = document.getElementById('rreg').value.trim();
  const department = document.getElementById('rdept').value;
  const email = document.getElementById('remail').value.trim().toLowerCase();
  const password = document.getElementById('rpass').value;
  const confirmation = document.getElementById('rconf').value;
  const role = document.getElementById('rrole').value;
  const valid = [
    setErr('rnameErr', name.length >= 3 ? '' : 'Enter your full name.'),
    setErr('rregErr', /^[0-9A-Za-z]{6,12}$/.test(regNumber) ? '' : 'Enter a valid registration number (6-12 letters/digits).'),
    setErr('remailErr', emailOk(email) ? '' : 'Enter a valid email address.'),
    setErr('rpassErr', password.length >= 8 ? '' : 'Password must be at least 8 characters.'),
    setErr('rconfErr', confirmation === password && confirmation !== '' ? '' : 'Passwords do not match.')
  ];
  if (!valid.every(Boolean)) {
    setStatus('Check the highlighted fields and try again.', 'error');
    focusFirstInvalid(['rnameErr', 'rregErr', 'remailErr', 'rpassErr', 'rconfErr']);
    return;
  }

  const users = C2C.getUsers();
  if (users.some(account => account.email === email ||
      (account.regNumber || '').toLowerCase() === regNumber.toLowerCase())) {
    setErr('remailErr', 'An account with this email already exists. Please log in.');
    setStatus('An account already exists with this email or registration number. Please sign in.', 'error');
    return;
  }

  const button = event.submitter;
  setSubmitting(button, true, 'Creating account…');
  setStatus('Creating your account…', 'pending');
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const user = {
      name,
      regNumber,
      department,
      email,
      role,
      salt: bytesToHex(salt),
      passwordHash: await passwordHash(password, salt)
    };
    if (!C2C.write('c2c-users', [...users, user])) {
      setStatus('Could not save your account in this browser. Check storage settings and try again.', 'error');
      setSubmitting(button, false);
      return;
    }
    const profile = {
      pname: name,
      pphone: '',
      pemail: email,
      pdept: department,
      p10: '',
      p12: '',
      pcgpa: '',
      pback: ''
    };
    if (!C2C.writeUser('c2c-profile', profile, email)) {
      setStatus('Your account was created, but its profile could not be saved. Please sign in to continue.', 'error');
      setSubmitting(button, false);
      return;
    }
    if (!C2C.write('c2c-session', {email, role})) {
      setStatus('Your account was created, but this browser could not save the sign-in. Please sign in to continue.', 'error');
      setSubmitting(button, false);
      return;
    }
    setStatus('Account created. Opening your account…', 'success');
    redirectFor(user);
  } catch (error) {
    setErr('rpassErr', error.message || 'Could not create your account.');
    setStatus(error.message || 'Could not create your account. Please try again.', 'error');
    setSubmitting(button, false);
  }
});

if (new URLSearchParams(location.search).get('logout') === '1') {
  localStorage.removeItem('c2c-session');
}
