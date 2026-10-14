/* Login and Register validation | Owner: Student 1 */
setupTabs();
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function setErr(id, msg) { document.getElementById(id).textContent = msg; return msg === ''; }

document.getElementById('showPass').addEventListener('change', e => {
  document.getElementById('lpass').type = e.target.checked ? 'text' : 'password';
});
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const a = setErr('lemailErr', emailOk(lemail.value.trim()) ? '' : 'Enter a valid email address.');
  const b = setErr('lpassErr', lpass.value.length >= 8 ? '' : 'Password must be at least 8 characters.');
  if (a && b) {
    showToast('Login successful (demo). Redirecting...');
    const target = lrole.value === 'admin' ? 'admin.html' : 'student-dashboard.html';
    setTimeout(() => location.href = target, 1200);
  }
});
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const r = [
    setErr('rnameErr', rname.value.trim().length >= 3 ? '' : 'Enter your full name.'),
    setErr('rregErr', /^[0-9A-Za-z]{6,12}$/.test(rreg.value.trim()) ? '' : 'Enter a valid registration number (6-12 letters/digits).'),
    setErr('remailErr', emailOk(remail.value.trim()) ? '' : 'Enter a valid email address.'),
    setErr('rpassErr', rpass.value.length >= 8 ? '' : 'Password must be at least 8 characters.'),
    setErr('rconfErr', rconf.value === rpass.value && rconf.value !== '' ? '' : 'Passwords do not match.')
  ];
  if (r.every(Boolean)) { showToast('Account created (demo). Please login.'); e.target.reset(); }
});
