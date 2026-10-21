setupTabs();
if (location.hash === '#register-panel') document.getElementById('registerTab').click();

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginStatus = document.getElementById('loginStatus');
const registerStatus = document.getElementById('registerStatus');

const setError = (fieldId, errorId, message) => {
  document.getElementById(errorId).textContent = message;
  const field = document.getElementById(fieldId);
  field.setAttribute('aria-invalid', String(Boolean(message)));
};

const setStatus = (element, message, type = '') => {
  element.textContent = message;
  element.classList.toggle('is-success', type === 'success');
  element.classList.toggle('is-error', type === 'error');
};

const emailIsValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const nameIsValid = value => /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,119}$/u.test(value);
const registrationNumberIsValid = value => /^[A-Za-z0-9-]{4,20}$/.test(value);
const passwordRequirements = password => ({
  length: password.length >= 8 && password.length <= 72,
  lowercase: /[a-z]/.test(password),
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password)
});
const passwordIsValid = password => Object.values(passwordRequirements(password)).every(Boolean);

document.querySelectorAll('[data-switch]').forEach(button => {
  button.addEventListener('click', () => {
    const tab = document.querySelector(`[data-panel="${button.dataset.switch}"]`);
    if (tab) tab.click();
  });
});

document.getElementById('showPass').addEventListener('change', event => {
  document.getElementById('lpass').type = event.currentTarget.checked ? 'text' : 'password';
});

const registerPassword = document.getElementById('rpass');
const confirmPassword = document.getElementById('rconf');
const strengthMeter = document.querySelector('.strength-meter');
const strengthFill = document.getElementById('passwordStrengthFill');
const strengthText = document.getElementById('passwordStrengthText');

function updatePasswordStrength() {
  const password = registerPassword.value;
  const requirements = passwordRequirements(password);
  const score = Object.values(requirements).filter(Boolean).length;
  const label = score === 5 ? 'Strong' : score >= 3 ? 'Fair' : password ? 'Weak' : '';
  strengthMeter.setAttribute('aria-valuenow', String(score));
  strengthMeter.dataset.level = label.toLowerCase();
  strengthFill.style.width = `${score * 20}%`;
  strengthText.textContent = password
    ? `${label} password (${score}/5 requirements met). Use at least 8 characters, including uppercase, lowercase, a number, and a special character.`
    : 'Use at least 8 characters with uppercase, lowercase, number, and special character.';
}

function validateLoginEmail() {
  const email = document.getElementById('lemail').value.trim();
  const valid = emailIsValid(email);
  setError('lemail', 'lemailErr', valid ? '' : email ? 'Enter a valid email address.' : 'Enter your email address.');
  return valid;
}

function validateLoginPassword() {
  const password = document.getElementById('lpass').value;
  const valid = password.length >= 8 && password.length <= 72;
  setError('lpass', 'lpassErr', valid ? '' : password ? 'Password must be 8-72 characters.' : 'Enter your password.');
  return valid;
}

function validateRegistrationName() {
  const name = document.getElementById('rname').value.trim();
  const valid = nameIsValid(name);
  setError('rname', 'rnameErr', valid ? '' : 'Enter a valid name (2-120 characters).');
  return valid;
}

function validateRegistrationNumber() {
  const registrationNumber = document.getElementById('rreg').value.trim();
  const valid = registrationNumberIsValid(registrationNumber);
  setError('rreg', 'rregErr', valid ? '' : 'Use 4-20 letters, numbers, or hyphens.');
  return valid;
}

function validateRegistrationEmail() {
  const email = document.getElementById('remail').value.trim();
  const valid = emailIsValid(email) && email.length <= 190;
  setError('remail', 'remailErr', valid ? '' : 'Enter a valid email address.');
  return valid;
}

function validateRegistrationPassword() {
  const valid = passwordIsValid(registerPassword.value);
  setError('rpass', 'rpassErr', valid ? '' : 'Use 8-72 characters with uppercase, lowercase, a number, and a special character.');
  return valid;
}

function validatePasswordMatch() {
  const valid = confirmPassword.value !== '' && confirmPassword.value === registerPassword.value;
  setError('rconf', 'rconfErr', valid ? '' : 'Passwords must match.');
  return valid;
}

function validateTerms() {
  const accepted = document.getElementById('termsAccepted').checked;
  setError('termsAccepted', 'termsErr', accepted ? '' : 'Accept the Terms and Conditions to register.');
  return accepted;
}

document.getElementById('lemail').addEventListener('input', () => {
  validateLoginEmail();
  setStatus(loginStatus, '');
});
document.getElementById('lpass').addEventListener('input', () => {
  validateLoginPassword();
  setStatus(loginStatus, '');
});
document.getElementById('rname').addEventListener('input', validateRegistrationName);
document.getElementById('rreg').addEventListener('input', validateRegistrationNumber);
document.getElementById('remail').addEventListener('input', () => {
  validateRegistrationEmail();
  setStatus(registerStatus, '');
});
registerForm.querySelectorAll('input, select').forEach(field => {
  field.addEventListener('input', () => setStatus(registerStatus, ''));
  field.addEventListener('change', () => setStatus(registerStatus, ''));
});
registerPassword.addEventListener('input', () => {
  updatePasswordStrength();
  validateRegistrationPassword();
  if (confirmPassword.value) validatePasswordMatch();
});
confirmPassword.addEventListener('input', validatePasswordMatch);
document.getElementById('termsAccepted').addEventListener('change', validateTerms);
document.getElementById('showRegisterPass').addEventListener('change', event => {
  const type = event.currentTarget.checked ? 'text' : 'password';
  registerPassword.type = type;
  confirmPassword.type = type;
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  setStatus(loginStatus, '');
  const validEmail = validateLoginEmail();
  const validPassword = validateLoginPassword();
  if (!validEmail || !validPassword) {
    document.getElementById(validEmail ? 'lpass' : 'lemail').focus();
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const result = await api('login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('lemail').value.trim(),
        password: document.getElementById('lpass').value,
        role: document.getElementById('lrole').value,
        remember: document.getElementById('rememberMe').checked
      })
    });
    csrfToken = result.csrf;
    setStatus(loginStatus, 'Login successful. Redirecting to your dashboard…', 'success');
    showToast('Login successful.');
    window.setTimeout(() => {
      location.href = result.user.role === 'admin' ? 'admin.html' : 'student-dashboard.html';
    }, 500);
  } catch (error) {
    setStatus(loginStatus, error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  setStatus(registerStatus, '');
  const checks = [
    ['rname', validateRegistrationName()],
    ['rreg', validateRegistrationNumber()],
    ['remail', validateRegistrationEmail()],
    ['rpass', validateRegistrationPassword()],
    ['rconf', validatePasswordMatch()],
    ['termsAccepted', validateTerms()]
  ];
  const firstInvalid = checks.find(([fieldId, valid]) => !valid);
  if (firstInvalid) {
    document.getElementById(firstInvalid[0]).focus();
    return;
  }

  const submitButton = registerForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  const email = document.getElementById('remail').value.trim();
  try {
    await api('register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('rname').value.trim(),
        registration_number: document.getElementById('rreg').value.trim(),
        department: document.getElementById('rdept').value,
        email,
        password: registerPassword.value,
        terms_accepted: document.getElementById('termsAccepted').checked
      })
    });
    registerForm.reset();
    updatePasswordStrength();
    document.querySelector('[data-panel="login-panel"]').click();
    document.getElementById('lemail').value = email;
    setStatus(loginStatus, 'Registration successful. You can now log in.', 'success');
    showToast('Account created successfully.');
  } catch (error) {
    setStatus(registerStatus, error.message, 'error');
    if (error.message.includes('already registered')) {
      setError('remail', 'remailErr', error.message);
    }
  } finally {
    submitButton.disabled = false;
  }
});

updatePasswordStrength();
