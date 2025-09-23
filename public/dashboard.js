document.addEventListener("DOMContentLoaded",()=>{
    const username = localStorage.getItem("username");
    if(!username) window.location.href="index.html";
    document.getElementById("username").innerText = username;
});

function startQuiz(){ window.location.href="quiz.html"; }
function viewLeaderboard(){ window.location.href="leaderboard.html"; }
function viewAchievements(){ window.location.href="achievements.html"; }
function logout(){ localStorage.clear(); window.location.href="index.html"; }
