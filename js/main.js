/* Campus2Career - shared script | Owner: Student 1 (used by all pages) */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
document.getElementById('year').textContent = new Date().getFullYear();

// Small message popup used by all pages
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, 3000);
}
// Tab switching (used on login and admin pages)
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
    document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== tab.dataset.panel);
  }));
}
