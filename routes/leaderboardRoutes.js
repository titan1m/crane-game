const token = localStorage.getItem('token');
const leaderboardList = document.getElementById('leaderboard-list');

fetch('/api/leaderboard', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    leaderboardList.innerHTML = data.map((u, idx) => `
        <li>${idx+1}. ${u.username} - ${u.score} pts</li>
    `).join('');
});
