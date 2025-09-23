const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Initial crane position
let craneX = 200, craneY = 50;

// User & level
let userId = localStorage.getItem("userId");
let level = localStorage.getItem("level") || "Easy";

// Set timer & lives by difficulty
let score = 0, lives, time;
if(level === "Easy"){ lives = 3; time = 60; }
else if(level === "Medium"){ lives = 2; time = 45; }
else if(level === "Hard"){ lives = 1; time = 30; }

// Red object (error) position
let errorX = Math.floor(Math.random() * 450), errorY = 300;

// Lifeline objects
let lifelines = [
    {x: Math.random()*450, y: Math.random()*300+50, type:"extraLife"}, 
    {x: Math.random()*450, y: Math.random()*300+50, type:"freezeTime"},
    {x: Math.random()*450, y: Math.random()*300+50, type:"doubleScore"}
];
let doubleScoreActive = false;
let freezeTimeActive = false;

// Draw crane
function drawCrane() {
    ctx.fillStyle = "blue";
    ctx.fillRect(craneX, craneY, 50, 20);
    ctx.fillRect(craneX + 20, craneY + 20, 10, 50);
}

// Draw error
function drawError() {
    ctx.fillStyle = "red";
    ctx.fillRect(errorX, errorY, 40, 40);
}

// Draw lifelines
function drawLifelines() {
    lifelines.forEach(l=>{
        if(l.type==="extraLife") ctx.fillStyle="green";
        else if(l.type==="freezeTime") ctx.fillStyle="yellow";
        else if(l.type==="doubleScore") ctx.fillStyle="purple";
        ctx.fillRect(l.x, l.y, 30, 30);
    });
}

// Draw game & status
function drawGame() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCrane();
    drawError();
    drawLifelines();
    document.getElementById("status").innerText = 
        `Score: ${score} | Lives: ${lives} | Time: ${time}s | Level: ${level}` + 
        (doubleScoreActive ? " | Double Score Active!" : "") + 
        (freezeTimeActive ? " | Timer Frozen!" : "");
}

// Check collision with error
function checkCollision() {
    if(craneX < errorX+40 && craneX+50>errorX && craneY<errorY+40 && craneY+20>errorY){
        score += doubleScoreActive ? 2 : 1;
        errorX = Math.floor(Math.random()*450);
        errorY = Math.floor(Math.random()*300)+50;
        fetch("/update-score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,score,level})});
    }

    // Check lifelines
    lifelines.forEach(l=>{
        if(craneX < l.x+30 && craneX+50>l.x && craneY<l.y+30 && craneY+20>l.y){
            if(l.type==="extraLife"){ lives++; alert("Extra Life Gained!"); }
            if(l.type==="freezeTime"){ freezeTimeActive=true; alert("Time Frozen for 5s!"); setTimeout(()=>freezeTimeActive=false,5000);}
            if(l.type==="doubleScore"){ doubleScoreActive=true; alert("Double Score Active for 5s!"); setTimeout(()=>doubleScoreActive=false,5000);}
            // Move lifeline to new random position
            l.x = Math.random()*450; l.y = Math.random()*300+50;
        }
    });
}

// Handle movement
document.addEventListener("keydown",(e)=>{
    if(e.key==="ArrowLeft" && craneX>0) craneX-=20;
    if(e.key==="ArrowRight" && craneX<canvas.width-50) craneX+=20;
    if(e.key==="ArrowUp" && craneY>0) craneY-=20;
    if(e.key==="ArrowDown" && craneY<canvas.height-20) craneY+=20;
    checkCollision();
    drawGame();
});

// Timer countdown
let timerInterval = setInterval(()=>{
    if(!freezeTimeActive) time--;
    if(time<=0 || lives<=0){
        clearInterval(timerInterval);
        alert(`Game Over! Score: ${score}`);
        localStorage.setItem("score", score);
        window.location.href="home.html";
    }
    drawGame();
},1000);

drawGame();
