/* Dashboard notifications | Owner: Student 2 */
const notes = [
  {t: 'You have been shortlisted for Infosys.', d: 'Today', unread: true},
  {t: 'New drive posted: Wipro Project Engineer.', d: 'Yesterday', unread: true},
  {t: 'Interview scheduled with TCS on 22 Oct, 10:00 AM.', d: '2 days ago', unread: false}
];
const list = document.getElementById('notifList');
function renderNotes() {
  list.innerHTML = notes.map(n => `<li class="${n.unread ? 'unread' : ''}"><span>${n.t}</span><small>${n.d}</small></li>`).join('');
}
document.getElementById('markRead').addEventListener('click', () => {
  notes.forEach(n => n.unread = false); renderNotes(); showToast('All notifications marked as read.');
});
renderNotes();
