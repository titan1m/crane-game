// ---------------- Quiz Data ----------------
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
  },
  {
    question: "What should be done if the load moment indicator shows overload?",
    options: ["Reduce load weight", "Extend boom", "Ignore it", "Speed up lift"],
    answer: "Reduce load weight"
  },
  {
    question: "Why would a mobile crane boom not extend fully?",
    options: ["Hydraulic failure", "Mechanical jam", "Control error", "All of the above"],
    answer: "All of the above"
  },
  {
    question: "What is the first step if crane tilts unexpectedly?",
    options: ["Stop operation", "Sound horn", "Increase load", "Raise boom quickly"],
    answer: "Stop operation"
  },
  {
    question: "What causes crane engine overheating?",
    options: ["Low coolant", "Continuous heavy lifting", "Fan malfunction", "All of the above"],
    answer: "All of the above"
  },
  {
    question: "If the crane’s wire rope is frayed, what should be done?",
    options: ["Continue operation carefully", "Replace the wire rope", "Lubricate rope", "Ignore"],
    answer: "Replace the wire rope"
  }
];

// ---------------- Variables ----------------
let currentQuestion = 0;
let score = 0;
let lives = 3;
let streak = 0;
let userId = localStorage.getItem("userId");
let timer = 15;
let timerInterval;

// ---------------- DOM Elements ----------------
const questionText = document.getElementById("questionText");
const optionsDiv = document.getElementById("options");
const status = document.getElementById("status");
const timerFill = document.getElementById("timerFill");
const lifelineBtn = document.getElementById("lifelineBtn");

// ---------------- Display Question ----------------
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

// ---------------- Timer ----------------
function updateTimer(){
  timer--;
  timerFill.style.width = (timer/15*100) + "%";
  if(timer<=0){
    clearInterval(timerInterval);
    wrongAnswer("Time's up!");
  }
}

// ---------------- Check Answer ----------------
function checkAnswer(option){
  clearInterval(timerInterval);
  const correct = questions[currentQuestion].answer;
  if(option === correct){
    score++;
    streak++;
    alert("✅ Correct!");
  } else {
    streak = 0;
    lives--;
    alert(`❌ Wrong! Correct answer: ${correct}`);
  }
  updateStatus();
  if(lives<=0){
    endQuiz();
    return;
  }
  currentQuestion++;
  displayQuestion();
}

// ---------------- Update Status ----------------
function updateStatus(){
  status.textContent = `Score: ${score} | Lives: ${lives} | Streak: ${streak}`;
}

// ---------------- Lifeline ----------------
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

// ---------------- End Quiz ----------------
function endQuiz(){
  alert(`Game Over!\nScore: ${score}`);
  fetch("/update-score",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({userId, score, streak})
  }).then(()=> window.location.href="dashboard.html");
}

// ---------------- Initialize ----------------
updateStatus();
displayQuestion();
