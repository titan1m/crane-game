// Sign Up handler
function signupFormHandler(formId,msgId){
    const form = document.getElementById(formId);
    const msgBox = document.getElementById(msgId);
    form.addEventListener('submit', async e=>{
        e.preventDefault();
        const username = form.username.value.trim();
        const password = form.password.value.trim();
        if(password.length<6){
            msgBox.style.color='salmon';
            msgBox.innerText='❌ Password must be at least 6 characters';
            return;
        }
        try{
            const res = await fetch('/api/auth/signup',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({username,password})
            });
            const data = await res.json();
            if(res.status===201){
                msgBox.style.color='lightgreen';
                msgBox.innerText='✅ Registered successfully. Redirecting...';
                setTimeout(()=>window.location.href='login.html',1500);
            }else{
                msgBox.style.color='salmon';
                msgBox.innerText=`❌ ${data.message}`;
            }
        }catch(err){
            msgBox.style.color='salmon';
            msgBox.innerText='❌ Server error';
            console.error(err);
        }
    });
}

// Login handler
function loginFormHandler(formId,msgId){
    const form = document.getElementById(formId);
    const msgBox = document.getElementById(msgId);
    form.addEventListener('submit', async e=>{
        e.preventDefault();
        const username=form.username.value.trim();
        const password=form.password.value.trim();
        try{
            const res = await fetch('/api/auth/login',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({username,password})
            });
            const data = await res.json();
            if(res.status===200){
                msgBox.style.color='lightgreen';
                msgBox.innerText='✅ Login successful. Redirecting...';
                localStorage.setItem('token',data.token);
                setTimeout(()=>window.location.href='dashboard.html',1000);
            }else{
                msgBox.style.color='salmon';
                msgBox.innerText=`❌ ${data.message}`;
            }
        }catch(err){
            msgBox.style.color='salmon';
            msgBox.innerText='❌ Server error';
            console.error(err);
        }
    });
}

// Lookup crane manually
async function lookupCrane(inputId,msgId,infoId){
    const code = document.getElementById(inputId).value.trim();
    const msgBox = document.getElementById(msgId);
    const infoBox = document.getElementById(infoId);
    if(!code){msgBox.innerText='❌ Please enter crane code'; return;}
    try{
        const res = await fetch(`/api/crane/${code}`);
        const data = await res.json();
        if(res.status===200){
            msgBox.innerText='';
            infoBox.style.display='block';
            infoBox.innerHTML=`
                <h3>${data.model}</h3>
                <p><b>Code:</b> ${data.code}</p>
                <p><b>Description:</b> ${data.description}</p>
                <p><b>Severity:</b> ${data.severity}</p>
                <h4>Steps:</h4>
                <ul>${data.steps.map(s=>`<li><b>${s.title}:</b> ${s.description}</li>`).join('')}</ul>
            `;
        }else{
            infoBox.style.display='none';
            msgBox.style.color='salmon';
            msgBox.innerText=`❌ ${data.message}`;
        }
    }catch(err){
        infoBox.style.display='none';
        msgBox.style.color='salmon';
        msgBox.innerText='❌ Server error';
        console.error(err);
    }
}

// Mock QR scan
function mockQRScan(infoId,msgId){
    const code = prompt("Enter simulated QR crane code:");
    if(!code)return;
    lookupCraneCode(code,infoId,msgId);
}

// Helper for QR scan
async function lookupCraneCode(code,infoId,msgId){
    const msgBox = document.getElementById(msgId);
    const infoBox = document.getElementById(infoId);
    try{
        const res = await fetch(`/api/crane/${code}`);
        const data = await res.json();
        if(res.status===200){
            msgBox.innerText='';
            infoBox.style.display='block';
            infoBox.innerHTML=`
                <h3>${data.model}</h3>
                <p><b>Code:</b> ${data.code}</p>
                <p><b>Description:</b> ${data.description}</p>
                <p><b>Severity:</b> ${data.severity}</p>
                <h4>Steps:</h4>
                <ul>${data.steps.map(s=>`<li><b>${s.title}:</b> ${s.description}</li>`).join('')}</ul>
            `;
        }else{
            infoBox.style.display='none';
            msgBox.style.color='salmon';
            msgBox.innerText=`❌ ${data.message}`;
        }
    }catch(err){
        infoBox.style.display='none';
        msgBox.style.color='salmon';
        msgBox.innerText='❌ Server error';
        console.error(err);
    }
}

// Settings - Change password
function changePassword(inputId,msgId){
    const newPass = document.getElementById(inputId).value.trim();
    const msgBox = document.getElementById(msgId);
    if(newPass.length<6){msgBox.style.color='salmon'; msgBox.innerText='❌ Password too short'; return;}
    msgBox.style.color='lightgreen';
    msgBox.innerText='✅ Password updated (mock)';
}
