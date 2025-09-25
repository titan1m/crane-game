const token = localStorage.getItem('token');
const quizContainer = document.getElementById('quiz-container');
const submitBtn = document.getElementById('submit-btn');
let questions = [];

fetch('/api/quiz', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    questions = data;
    renderQuiz();
});

function renderQuiz() {
    quizContainer.innerHTML = '';
    questions.forEach(q => {
        const qDiv = document.createElement('div');
        qDiv.classList.add('question');
        qDiv.innerHTML = `<h3>${q.question}</h3>
            ${q.options.map(o => `
                <label>
                    <input type="radio" name="${q.id}" value="${o}"> ${o}
                </label>
            `).join('')}`;
        quizContainer.appendChild(qDiv);
    });
}

submitBtn.addEventListener('click', () => {
    const answers = {};
    questions.forEach(q => {
        const selected = document.querySelector(`input[name="${q.id}"]:checked`);
        answers[q.id] = selected ? selected.value : null;
    });

    fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
    })
    .then(res => res.json())
    .then(data => alert(`Score: ${data.score}/${data.total}`));
});
