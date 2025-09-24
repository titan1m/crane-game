/* quiz.js — full quiz logic: settings-aware, lifelines, timer, popups, vibration, streaks, server update
   Place this in public/ and include in quiz.html after DOM elements.
*/

/* --------- Configuration & Helpers --------- */
const QUESTIONS_POOL = [
  { q: "Which color is used for errors in Crane Game?", opts: ["Red","Green","Blue","Yellow"], ans: 0 },
  { q: "Crane moves in which direction?", opts: ["Up/Down","Left/Right","Both","None"], ans: 2 },
  { q: "What decreases when you miss an error?", opts: ["Score","Lives","Coins","Speed"], ans: 1 },
  { q: "Which shape used for errors in demo?", opts: ["Square","Circle","Triangle","Hexagon"], ans: 0 },
  { q: "What happens on collision with error?", opts: ["Score +1","Life -1","Nothing","Level Up"], ans: 0 },
  { q: "What lifeline removes two wrong options?", opts: ["Skip","50-50","ExtraTime","Double"], ans: 1 },
  { q: "Where are scores saved?", opts: ["Local","MongoDB","Cookies","None"], ans: 1 },
  { q: "Best practice to avoid overload?", opts: ["Ignore","Check weight","Overload","Rush"], ans: 1 },
  { q: "Streak increases when you ...", opts: ["Skip","Answer correct","Close tab","Refresh"], ans: 1 },
  { q: "Which page shows top players?", opts: ["Profile","Leaderboard","Settings","Home"], ans: 1 }
];

// DOM lookups (defensive)
const el = id => document.getElementById(id);
const exists = id => !!el(id);

// get settings
function getSettings(){
  const difficulty = localStorage.getItem("difficulty") || "Easy";
  const timerOn = localStorage.getItem("timer") !== "false"; // default true
  const vibrate = localStorage.getItem("vibrate") !== "false"; // default true
  return { difficulty, timerOn, vibrate };
}

// popup & vibrate & shake helpers
function showPopup(msg, type = "correct"){ // type: 'correct' | 'wrong'
  const p = document.createElement("div");
  p.className = "popup " + (type === "wrong" ? "wrong" : "correct");
  p.innerText = msg;
  document.body.appendChild(p);
  p.style.display = "block";
  setTimeout(()=> { p.remove(); }, 1200);
}

function tryVibrate(ms = 200){
  const s = getSettings();
  if(!s.vibrate) return;
  if(navigator.vibrate) navigator.vibrate(ms);
}

function shakeCard(){
  const c = document.querySelector(".container, .quiz-container");
  if(!c) return;
  c.classList.remove("shake");
  // force reflow to restart
  void c.offsetWidth;
  c.classList.add("shake");
  setTimeout(()=> c.classList.remove("shake"), 600);
}

/* --------- Quiz State --------- */
let questions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let streak = 0;
let timer = 0;
let timerInterval = null;
let userId = localStorage.getItem("userId") || null;
let totalQuestions = 10;

// lifelines availability
let lifelines = {
  fifty: true,
  skip: true,
  extraTime: true
};

/* --------- Difficulty mapping --------- */
function difficultyParams(level){
  if(level === "Easy") return { timePerQ: 20, lives: 5 };
  if(level === "Medium") return { timePerQ: 15, lives: 3 };
  return { timePerQ: 10, lives: 2 }; // Hard
}

/* --------- Init quiz UI if present --------- */
function initQuizIfPresent(){
  if(!exists("question")) return; // not on quiz page
  // pick randomized questions from pool (no duplicates)
  questions = QUESTIONS_POOL.slice().sort(()=>0.5-Math.random()).slice(0, totalQuestions);

  // load settings
  const { difficulty, timerOn } = getSettings();
  const params = difficultyParams(difficulty);
  lives = params.lives;
  timer = params.timePerQ;
  // update UI initial
  if(exists("lives")) el("lives").innerText = lives;
  if(exists("score")) el("score").innerText = score;
  // hook lifeline buttons if present
  if(exists("fifty")) el("fifty").addEventListener("click", useFifty);
  if(exists("skip")) el("skip").addEventListener("click", useSkip);
  if(exists("extraTime")) el("extraTime").addEventListener("click", useExtraTime);

  // render first question
  currentIndex = 0;
  renderQuestion();
}

/* --------- Render question --------- */
function renderQuestion(){
  if(currentIndex >= questions.length){
    finishQuiz();
    return;
  }
  const q = questions[currentIndex];
  if(exists("question")) el("question").innerText = `Q${currentIndex+1}. ${q.q}`;
  // render options
  if(exists("options")){
    const container = el("options");
    container.innerHTML = "";
    q.opts.forEach((opt,i)=>{
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerText = opt;
      btn.dataset.index = i;
      btn.addEventListener("click", onOptionClick);
      container.appendChild(btn);
    });
  }
  // progress
  if(exists("progress-bar")) el("progress-bar").style.width = `${(currentIndex/totalQuestions)*100}%`;

  // set/reset timer
  resetTimerForCurrentQuestion();
}

/* --------- Timer functions --------- */
function resetTimerForCurrentQuestion(){
  const { difficulty, timerOn } = getSettings();
  const params = difficultyParams(difficulty);
  timer = params.timePerQ;
  if(timerOn) startTimer();
  else {
    clearInterval(timerInterval);
    if(exists("timer")) el("timer").innerText = "Timer: Off";
  }
  // update small UI
  if(exists("lives")) el("lives").innerText = lives;
  if(exists("score")) el("score").innerText = score;
}

function startTimer(){
  clearInterval(timerInterval);
  if(!exists("timer")) return;
  el("timer").innerText = `Time: ${timer}s`;
  timerInterval = setInterval(()=>{
    timer--;
    if(exists("timer")) el("timer").innerText = `Time: ${timer}s`;
    if(timer <= 0){
      clearInterval(timerInterval);
      // time up: treat as wrong
      handleWrongAnswer("Time's up");
    }
  }, 1000);
}

/* --------- Option click --------- */
function onOptionClick(e){
  const btn = e.currentTarget;
  const chosen = Number(btn.dataset.index);
  const q = questions[currentIndex];
  // disable options
  document.querySelectorAll(".option-btn").forEach(b=> b.classList.add("disabled"));
  clearInterval(timerInterval);

  if(chosen === q.ans){
    // correct
    streak++;
    const gained = 1 * (1 + Math.floor(streak/3)); // small multiplier: every 3 in streak +1
    score += gained;
    showPopup("+ Correct", "correct");
    // visually mark
    btn.classList.add("correct");
    // advance after small delay
    setTimeout(()=> { currentIndex++; renderQuestion(); }, 700);
  } else {
    // wrong
    handleWrongAnswer("Wrong Answer");
  }
  // update score UI
  if(exists("score")) el("score").innerText = score;
}

/* --------- Wrong answer handler --------- */
function handleWrongAnswer(message = "Wrong"){
  // deduct life and time
  lives = Math.max(0, lives - 1);
  streak = 0;
  // deduct time penalty (5s)
  timer = Math.max(0, timer - 5);
  if(exists("lives")) el("lives").innerText = lives;

  // show popup/wrong animation/vibrate/shake
  showPopup("✖ " + message, "wrong");
  tryVibrate(220);
  shakeCard();

  // mark correct option visually for user
  markCorrectOption();

  // continue to next question after delay
  setTimeout(()=> { currentIndex++; renderQuestion(); }, 900);
}

/* --------- Mark correct option (visual aid) --------- */
function markCorrectOption(){
  const q = questions[currentIndex];
  document.querySelectorAll(".option-btn").forEach(b=>{
    const idx = Number(b.dataset.index);
    b.classList.add("disabled");
    if(idx === q.ans) b.classList.add("correct");
    else if(!b.classList.contains("correct")) b.classList.add("wrong");
  });
}

/* --------- Lifelines: 50-50, Skip, +5s --------- */
function useFifty(){
  if(!lifelines.fifty) return;
  lifelines.fifty = false;
  if(exists("fifty")) el("fifty").disabled = true;

  // remove two wrong options
  const q = questions[currentIndex];
  const wrongIndices = [];
  for(let i=0;i<q.opts.length;i++) if(i!==q.ans) wrongIndices.push(i);
  // shuffle and remove first two
  wrongIndices.sort(()=>0.5-Math.random());
  const toDisable = wrongIndices.slice(0,2);
  document.querySelectorAll(".option-btn").forEach(b=>{
    if(toDisable.includes(Number(b.dataset.index))){
      b.classList.add("disabled");
      b.disabled = true;
    }
  });
}

function useSkip(){
  if(!lifelines.skip) return;
  lifelines.skip = false;
  if(exists("skip")) el("skip").disabled = true;
  // skip question (no penalty)
  currentIndex++;
  renderQuestion();
}

function useExtraTime(){
  if(!lifelines.extraTime) return;
  lifelines.extraTime = false;
  if(exists("extraTime")) el("extraTime").disabled = true;
  // add 5 sec to current timer
  timer += 5;
  if(exists("timer")) el("timer").innerText = `Time: ${timer}s`;
}

/* --------- Finish quiz & persist score --------- */
async function finishQuiz(){
  clearInterval(timerInterval);
  // final progress bar 100%
  if(exists("progress-bar")) el("progress-bar").style.width = "100%";

  // notify
  showPopup(`Quiz Finished! Score: ${score}`, "correct");
  // save to server if logged in
  if(userId){
    try {
      await fetch("/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, score, streak })
      });
    } catch (err){
      console.error("Could not update score:", err);
    }
  } else {
    // fallback local
    localStorage.setItem("lastLocalScore", score);
  }

  // redirect to dashboard after short time
  setTimeout(()=> {
    window.location.href = "dashboard.html";
  }, 1200);
}

/* --------- Init on load if quiz.html present --------- */
document.addEventListener("DOMContentLoaded", ()=>{
  // attach option to global if quiz UI elements present
  if(exists("question") && exists("options")){
    // map lifeline buttons if exist in older markup (IDs: fifty, skip, extraTime)
    if(exists("fifty")) el("fifty").addEventListener("click", useFifty);
    if(exists("skip")) el("skip").addEventListener("click", useSkip);
    if(exists("extraTime")) el("extraTime").addEventListener("click", useExtraTime);

    // initialize quiz using settings
    initQuizIfPresent();
  }
});

/* --------- Exported for console testing (optional) --------- */
window._craneQuiz = {
  restart: () => { score = 0; streak = 0; currentIndex = 0; initQuizIfPresent(); },
  getState: () => ({ score, streak, lives, currentIndex })
};
