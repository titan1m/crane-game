let questions = [
    {q:"Which one is wrong crane movement?", options:["Move up","Move down","Move left","Fly"], answer:3},
    {q:"Which is the correct red error?", options:["Square","Circle","Triangle","None"], answer:0},
    {q:"What reduces lives?", options:["Wrong answer","Correct answer","Skip","None"], answer:0},
];

let currentQ = 0;
let score = 0;
let lives = 3;
let time = 60;
let streak = 0;
let userId = localStorage.getItem("userId");

const questionEl = document.getElementById("question");
const optionBtns = document.querySelectorAll(".option-btn");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const timeEl = document.getElementById("time");
const streakEl = document.getElementById("streak");
const progressBar = document.getElementById("progress-bar");

function loadQuestion() {
    if(currentQ >= questions.length) return finishQuiz();
    const q = questions[currentQ];
    questionEl.innerText = q.q;
    optionBtns.forEach((btn,i)=>{
        btn.innerText = q.options[i];
        btn.disabled = false;
    });
    progressBar.style.width = ((currentQ)/questions.length)*100 + "%";
}

optionBtns.forEach(btn=>{
    btn.addEventListener("click",()=>{
        checkAnswer(parseInt(btn.dataset.index));
    });
});

function checkAnswer(index){
    const q = questions[currentQ];
    if(index===q.answer){
        score += 10;
        streak++;
    } else {
        lives--;
        streak = 0;
    }
    updateStatus();
    currentQ++;
    loadQuestion();
}

function updateStatus(){
    scoreEl.innerText = "Score: "+score;
    livesEl.innerText = "Lives: "+lives;
    timeEl.innerText = "Time: "+time+"s";
    streakEl.innerText = "Streak: "+streak;
}

// Lifelines
document.getElementById("fifty").addEventListener("click",()=>{
    const q = questions[currentQ];
    let removed = 0;
    optionBtns.forEach((btn,i)=>{
        if(i!==q.answer && removed<2){
            btn.disabled = true;
            removed++;
        }
    });
    document.getElementById("fifty").disabled = true;
});
document.getElementById("skip").addEventListener("click",()=>{
    currentQ++;
    loadQuestion();
    document.getElementById("skip").disabled = true;
});
document.getElementById("extraTime").addEventListener("click",()=>{
    time +=5;
    updateStatus();
    document.getElementById("extraTime").disabled = true;
});

// Timer
let timerInterval = setInterval(()=>{
    time--;
    if(time<=0 || lives<=0) finishQuiz();
    updateStatus();
},1000);

function finishQuiz(){
    clearInterval(timerInterval);
    alert(`Quiz Finished! Score: ${score}`);
    // Update MongoDB
    fetch("/update-score",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId,score,streak})
    });
    window.location.href="dashboard.html";
}

// Initialize
loadQuestion();
updateStatus();
