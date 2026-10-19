let exps = C2C.read('c2c-experiences', []);
if (!Array.isArray(exps)) exps = [];
function stars(n) { return '&#9733;'.repeat(n) + '&#9734;'.repeat(5 - n); }
function render() {
  const q = sq.value.toLowerCase();
  const list = exps.filter(e => (e.c + ' ' + e.n).toLowerCase().includes(q) && (!sd.value || e.d === sd.value));
  const cls = {Easy: 'b-green', Medium: 'b-yellow', Hard: 'b-red'};
  expList.innerHTML = list.length ? list.map(e => `<article class="card">
    <div class="row"><h2 style="font-size:1.2rem;margin:0">${C2C.escape(e.c)}</h2><span class="badge ${cls[e.d] || 'b-grey'}">${C2C.escape(e.d)}</span></div>
    <p style="margin:2px 0">${C2C.escape(e.r)} &bull; ${C2C.escape(e.n)}, ${C2C.escape(e.b)} Batch</p>
    <p aria-label="Rating ${e.s} out of 5" style="color:#92400e;margin:2px 0">${stars(e.s)}</p>
    <details><summary>Read experience</summary><p>${C2C.escape(e.t)}</p></details></article>`).join('') :
    (exps.length ? '<p class="card">No experiences match your search. Try a different company or difficulty.</p>' :
      '<p class="card">No experiences have been shared yet. Be the first to share yours below.</p>');
}
[sq, sd].forEach(el => el.addEventListener('input', render));
shareForm.addEventListener('submit', e => {
  e.preventDefault();
  const chk = (el, err, ok, msg) => { document.getElementById(err).textContent = ok ? '' : msg; return ok; };
  const r = [
    chk(xn, 'xnErr', xn.value.trim().length >= 2, 'Enter your name.'),
    chk(xb, 'xbErr', /^20[0-9]{2}$/.test(xb.value.trim()), 'Enter a valid year like 2025.'),
    chk(xc, 'xcErr', xc.value.trim() !== '', 'Enter the company name.'),
    chk(xt, 'xtErr', xt.value.trim().length >= 30, 'Please write at least 30 characters.')
  ];
  if (r.every(Boolean)) {
    exps.unshift({n: xn.value.trim(), b: xb.value.trim(), c: xc.value.trim(), r: xr.value.trim() || 'Role not provided', d: xd.value, s: +xs.value, t: xt.value.trim()});
    if (C2C.write('c2c-experiences', exps)) {
      render(); shareForm.reset(); showToast('Thank you! Your experience has been added.');
    } else {
      exps.shift();
    }
  }
});
render();
