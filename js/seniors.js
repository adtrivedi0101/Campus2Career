/* Seniors' experience cards, filter and share form | Owner: Student 4 */
const exps = [
  {n: 'Ankit R.', b: 2025, c: 'Infosys', r: 'Systems Engineer', d: 'Easy', s: 4, t: 'Aptitude, technical interview and HR. Focus on DBMS, OOPs and basic coding. Be honest about what you do not know.'},
  {n: 'Sneha K.', b: 2025, c: 'TCS Digital', r: 'Digital Engineer', d: 'Medium', s: 4, t: 'Prepare your final-year project well. Questions came from project tech stack, SQL and one simple coding problem.'},
  {n: 'Vivek M.', b: 2024, c: 'Amazon', r: 'SDE-1', d: 'Hard', s: 5, t: 'Online test with two DSA problems, then three interviews on data structures, system basics and leadership principles. Practice daily.'},
  {n: 'Priya S.', b: 2024, c: 'Zoho', r: 'Software Developer', d: 'Hard', s: 4, t: 'Five rounds including programming rounds without internet. Logic and clean code matter more than the language.'}
];
function stars(n) { return '&#9733;'.repeat(n) + '&#9734;'.repeat(5 - n); }
function render() {
  const q = sq.value.toLowerCase();
  const list = exps.filter(e => (e.c + ' ' + e.n).toLowerCase().includes(q) && (!sd.value || e.d === sd.value));
  const cls = {Easy: 'b-green', Medium: 'b-yellow', Hard: 'b-red'};
  expList.innerHTML = list.length ? list.map(e => `<article class="card">
    <div class="row"><h2 style="font-size:1.2rem;margin:0">${e.c}</h2><span class="badge ${cls[e.d]}">${e.d}</span></div>
    <p style="margin:2px 0">${e.r} &bull; ${e.n}, ${e.b} Batch</p>
    <p aria-label="Rating ${e.s} out of 5" style="color:#92400e;margin:2px 0">${stars(e.s)}</p>
    <details><summary>Read experience</summary><p>${e.t}</p></details></article>`).join('') : '<p>No experiences match your search.</p>';
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
    exps.unshift({n: xn.value.trim(), b: xb.value.trim(), c: xc.value.trim(), r: xr.value.trim() || 'Not mentioned', d: xd.value, s: +xs.value, t: xt.value.trim()});
    render(); shareForm.reset(); showToast('Thank you! Your experience was added (demo).');
  }
});
render();
