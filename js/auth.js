setupTabs();
const setError = (id, message) => { document.getElementById(id).textContent = message; };
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
document.getElementById('showPass').addEventListener('change', event => {
  document.getElementById('lpass').type = event.target.checked ? 'text' : 'password';
});
const registerPassword = document.getElementById('rpass');
const confirmPassword = document.getElementById('rconf');
function validatePasswordMatch() {
  confirmPassword.setCustomValidity(confirmPassword.value === registerPassword.value ? '' : 'Passwords do not match.');
}
registerPassword.addEventListener('input', validatePasswordMatch);
confirmPassword.addEventListener('input', validatePasswordMatch);
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('lemail').value.trim();
  const password = document.getElementById('lpass').value;
  if (!email || !password) {
    setError('lemailErr', email ? '' : 'Enter your email address.');
    setError('lpassErr', password ? '' : 'Enter your password.');
    return;
  }
  setError('lemailErr', '');
  setError('lpassErr', '');
  try {
    const result = await api('login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: document.getElementById('lrole').value })
    });
    csrfToken = result.csrf;
    location.href = result.user.role === 'admin' ? 'admin.html' : 'student-dashboard.html';
  } catch (error) {
    setError('lpassErr', error.message);
  }
});
registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('rname').value.trim();
  const registrationNumber = document.getElementById('rreg').value.trim();
  const email = document.getElementById('remail').value.trim();
  const password = document.getElementById('rpass').value;
  const confirm = document.getElementById('rconf').value;
  const valid = [
    [ 'rnameErr', name.length >= 2, 'Enter your full name.' ],
    [ 'rregErr', /^[A-Za-z0-9-]{4,20}$/.test(registrationNumber), 'Use 4-20 letters, numbers, or hyphens.' ],
    [ 'remailErr', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email address.' ],
    [ 'rpassErr', password.length >= 8, 'Password must be at least 8 characters.' ],
    [ 'rconfErr', confirm === password && confirm !== '', 'Passwords do not match.' ]
  ];
  valid.forEach(([id, ok, message]) => setError(id, ok ? '' : message));
  if (!valid.every(([, ok]) => ok)) return;
  try {
    await api('register', {
      method: 'POST',
      body: JSON.stringify({
        name, registration_number: registrationNumber,
        department: document.getElementById('rdept').value,
        email, password
      })
    });
    registerForm.reset();
    document.querySelector('[data-panel="login-panel"]').click();
    document.getElementById('lemail').value = email;
    showToast('Account created. Please log in.');
  } catch (error) {
    setError('remailErr', error.message);
  }
});
