// Countdown timer
let time = 30; // seconds per question
const timerEl = document.getElementById("timer");

let timerInterval = setInterval(()=>{
    if(timerEl) timerEl.innerText = `Time: ${time}s`;
    time--;
    if(time < 0){
        clearInterval(timerInterval);
        showPopup("Time's up!", false);
        nextQuestion();
    }
},1000);

// Popup for correct/wrong
function showPopup(message, correct=true){
    const popup = document.createElement("div");
    popup.className = "popup";
    if(!correct) popup.classList.add("wrong");
    popup.innerText = message;
    document.body.appendChild(popup);
    popup.style.display="block";
    setTimeout(()=>{
        popup.remove();
    },1500);
}

// Quiz options click
document.querySelectorAll(".options button").forEach(btn=>{
    btn.addEventListener("click",(e)=>{
        const correct = btn.dataset.correct==="true";
        if(correct){
            showPopup("Correct!", true);
        } else {
            showPopup("Wrong!", false);
            shakeContainer();
            time -= 5; // deduct time for wrong answer
        }
        nextQuestion();
    });
});

// Shake container animation
function shakeContainer(){
    const container = document.querySelector(".container");
    container.classList.add("shake");
    setTimeout(()=>{container.classList.remove("shake");}, 500);
}

// Update progress bar
function updateProgressBar(current, total){
    const bar = document.getElementById("progress-bar");
    if(bar) bar.style.width = (current/total*100) + "%";
}

// Button ripple effect
document.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
        let ripple = document.createElement("span");
        ripple.className="ripple";
        btn.appendChild(ripple);
        ripple.style.left=e.offsetX+"px";
        ripple.style.top=e.offsetY+"px";
        setTimeout(()=>{ripple.remove();},600);
    });
});
