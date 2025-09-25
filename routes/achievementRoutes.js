const token = localStorage.getItem('token');
const container = document.getElementById('achievements-container');

fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } })
.then(res => res.json())
.then(data => {
    container.innerHTML = data.achievements.map(a => {
        const unlocked = data.userAchievements.some(u => u._id === a._id);
        return `
        <div class="achievement ${unlocked ? 'unlocked' : ''}">
            <img src="${a.icon}" alt="${a.title}" />
            <h3>${a.title}</h3>
            <p>${a.description}</p>
        </div>`;
    }).join('');
});
