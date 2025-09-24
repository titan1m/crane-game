const questions = [
  {
    question: "What does a boom overload error indicate in a mobile crane?",
    options: ["Boom is too extended", "Crane is stationary", "Operator error", "Hydraulic leak"],
    answer: "Boom is too extended"
  },
  {
    question: "What should you check if the crane engine fails to start?",
    options: ["Fuel level", "Battery connection", "Ignition switch", "All of the above"],
    answer: "All of the above"
  },
  {
    question: "What is the cause of crane swing vibration during lifting?",
    options: ["Uneven load", "High wind speed", "Incorrect counterweight", "All of the above"],
    answer: "All of the above"
  },
  {
    question: "If the crane displays 'Out of Level' warning, what should you do?",
    options: ["Continue lifting", "Stop and adjust outriggers", "Increase load", "Ignore"],
    answer: "Stop and adjust outriggers"
  },
  {
    question: "What does hydraulic pressure drop warning mean?",
    options: ["Low hydraulic fluid", "Pump malfunction", "Hose leak", "All of the above"],
    answer: "All of the above"
  }
];

let currentQuestion = 0;
let score = 0;
let lives = parseInt(localStorage.getItem("lives")) || 3;
let streak = 0;
let userId = localStorage.getItem("userId");
let timer = 15;
let timerInterval;

const questionText = document.getElementById("questionText");
const optionsDiv = document.getElementById("options");
const status = document.getElementById("status");
const timerFill = document.getElementById("timerFill");
const lifelineBtn = document.getElementById("lifelineBtn");

// Create popup
const popup = document.createElement("div");
popup.classList.add("popup");
document.body.appendChild(popup);

function showPopup(message, type){
  popup.textContent = message;
  popup.className = `popup show ${type}`;
  setTimeout(()=>{ popup.classList.remove("show"); }, 1200);
}

// Display question
function displayQuestion(){
  if(currentQuestion >= questions.length){
    endQuiz();
    return;
  }
  const q = questions[currentQuestion];
  questionText.textContent = q.question;
  optionsDiv.innerHTML = "";
  q.options.forEach(opt=>{
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.textContent = opt;
    btn.onclick = ()=>checkAnswer(opt);
    optionsDiv.appendChild(btn);
  });
  timer = 15;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

// Timer countdown
function updateTimer(){
  timer--;
  timerFill.style.width = (timer/15*100) + "%";
  if(timer<=0){
    clearInterval(timerInterval);
    wrongAnswer("Time's up!");
  }
}

// Check answer
function checkAnswer(option){
  clearInterval(timerInterval);
  const correct = questions[currentQuestion].answer;
  if(option === correct){
    score++;
    streak++;
    showPopup("✅ Correct!", "correct");
  } else {
    streak = 0;
    lives--;
    showPopup(`❌ Wrong! Correct: ${correct}`, "wrong");
  }
  updateStatus();
  if(lives<=0){
    endQuiz();
    return;
  }
  currentQuestion++;
  setTimeout(displayQuestion, 1000);
}

// Update score/lives display
function updateStatus(){
  status.textContent = `Score: ${score} | Lives: ${lives} | Streak: ${streak}`;
}

// Lifeline
lifelineBtn.addEventListener("click", ()=>{
  const q = questions[currentQuestion];
  const correct = q.answer;
  const wrongOptions = q.options.filter(opt=>opt!==correct);
  if(wrongOptions.length>1){
    const toRemove = wrongOptions[Math.floor(Math.random()*wrongOptions.length)];
    Array.from(optionsDiv.children).forEach(btn=>{
      if(btn.textContent === toRemove) btn.disabled = true;
    });
  }
});

// Wrong answer if timer ends
function wrongAnswer(msg){
  streak = 0;
  lives--;
  showPopup(msg, "wrong");
  updateStatus();
  if(lives<=0){
    endQuiz();
    return;
  }
  currentQuestion++;
  setTimeout(displayQuestion, 1000);
}

// End quiz
function endQuiz(){
  showPopup(`Game Over! Score: ${score}`, "wrong");
  fetch("/update-score",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({userId, score, streak})
  }).then(()=> setTimeout(()=>window.location.href="dashboard.html", 1500));
}

// Initialize
updateStatus();
displayQuestion();
