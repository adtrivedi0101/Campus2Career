const latestExperiences = document.getElementById('latestExperiences');
const storedExperiences = C2C.read('c2c-experiences', []);
const experiences = Array.isArray(storedExperiences) ? storedExperiences : [];
const difficultyClasses = {Easy: 'b-green', Medium: 'b-yellow', Hard: 'b-red'};

latestExperiences.innerHTML = experiences.length
  ? experiences.slice(0, 2).map(experience => `
    <article class="card">
      <h3>${C2C.escape(experience.c)}${experience.r ? ' &ndash; ' + C2C.escape(experience.r) : ''}</h3>
      <p>${C2C.escape(experience.t)}</p>
      <p><span class="badge ${difficultyClasses[experience.d] || 'b-grey'}">${C2C.escape(experience.d)}</span>
        &mdash; ${C2C.escape(experience.n)}, ${C2C.escape(experience.b)} Batch</p>
    </article>`).join('')
  : '<p class="card">No experiences have been shared yet. Sign in and be the first to share your story.</p>';
