// Animate status bar
const statusBar = document.querySelector(".status-bar");
if(statusBar){
    statusBar.style.transition = "all 0.5s ease";
}

// Button click ripple effect
document.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
        let ripple = document.createElement("span");
        ripple.className = "ripple";
        btn.appendChild(ripple);
        ripple.style.left = e.offsetX + "px";
        ripple.style.top = e.offsetY + "px";
        setTimeout(()=>{ripple.remove();}, 600);
    });
});

// Quiz progress bar smooth update
function updateProgressBar(currentQ, totalQ){
    const bar = document.getElementById("progress-bar");
    if(bar) bar.style.width = ((currentQ)/totalQ)*100 + "%";
}

// Highlight correct and wrong option
function highlightOption(button, correct=true){
    button.style.background = correct ? "#06d6a0" : "#ef233c";
    setTimeout(()=>{button.style.background = "";}, 800);
}

// Example: shake animation for wrong answer
function shakeContainer(){
    const container = document.querySelector(".container");
    container.classList.add("shake");
    setTimeout(()=>{container.classList.remove("shake");}, 500);
}

/* Add the following CSS for shake effect in script.css or inside <style>
.shake{
    animation: shakeAnim 0.5s;
}
@keyframes shakeAnim{
    0% {transform: translateX(0);}
    25% {transform: translateX(-10px);}
    50% {transform: translateX(10px);}
    75% {transform: translateX(-10px);}
    100% {transform: translateX(0);}
}
*/
