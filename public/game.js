const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let craneX=200, craneY=50;
let score=0, lives=3;
let userId=localStorage.getItem("userId");
let level=localStorage.getItem("level") || "Easy";
let errorX=Math.floor(Math.random()*450), errorY=300;
let time = level==="Easy"?60 : level==="Medium"?45:30;

// Adjust lives by level
if(level==="Easy") lives=3;
if(level==="Medium") lives=2;
if(level==="Hard") lives=1;

function drawCrane(){ctx.fillStyle="blue"; ctx.fillRect(craneX,craneY,50,20); ctx.fillRect(craneX+20,craneY+20,10,50);}
function drawError(){ctx.fillStyle="red"; ctx.fillRect(errorX,errorY,40,40);}
function drawGame(){ctx.clearRect(0,0,canvas.width,canvas.height); drawCrane(); drawError(); document.getElementById("status").innerText=`Score: ${score} | Lives: ${lives} | Time: ${time}s | Level: ${level}`;}
function checkCollision(){
  if(craneX<errorX+40 && craneX+50>errorX && craneY<errorY+40 && craneY+20>errorY){
    score++; errorX=Math.floor(Math.random()*450); errorY=300;
    fetch("/update-score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,score,level})});
  }
}

document.addEventListener("keydown",(e)=>{
  if(e.key==="ArrowLeft"&&craneX>0) craneX-=20;
  if(e.key==="ArrowRight"&&craneX<canvas.width-50) craneX+=20;
  if(e.key==="ArrowUp"&&craneY>0) craneY-=20;
  if(e.key==="ArrowDown"&&craneY<canvas.height-20) craneY+=20;
  checkCollision(); drawGame();
});

// Timer
let timerInterval=setInterval(()=>{
  time--; if(time<=0||lives<=0){clearInterval(timerInterval); alert(`Game Over! Score: ${score}`); window.location.href="home.html";}
  drawGame();
},1000);

drawGame();
