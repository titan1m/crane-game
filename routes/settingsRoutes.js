const token = localStorage.getItem('token');
const darkToggle = document.getElementById('dark-mode-toggle');
const soundToggle = document.getElementById('sound-toggle');
const saveBtn = document.getElementById('save-btn');

// Load current settings
fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
.then(res => res.json())
.then(data => {
    darkToggle.checked = data.darkMode;
    soundToggle.checked = data.sound;
});

// Save settings
saveBtn.addEventListener('click', () => {
    fetch('/api/settings', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ darkMode: darkToggle.checked, sound: soundToggle.checked })
    }).then(() => alert('Settings saved!'));
});
