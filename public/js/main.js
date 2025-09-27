const apiBase = "/api";

// --- Auth Functions ---
async function signup(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${apiBase}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    alert(data.message || data.error);
}

async function login(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
    } else {
        alert(data.error);
    }
}

// --- Search Error ---
async function searchError(event) {
    event.preventDefault();
    const code = document.getElementById("error-code").value;
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first");

    const res = await fetch(`${apiBase}/error?code=${code}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    const resultDiv = document.getElementById("error-result");
    if (data.message) {
        resultDiv.innerHTML = `<p>${data.message}</p>`;
    } else {
        resultDiv.innerHTML = `
            <p><b>Code:</b> ${data.code}</p>
            <p><b>Description:</b> ${data.description}</p>
            <p><b>Type:</b> ${data.type}</p>
            <p><b>Severity:</b> ${data.severity}</p>
        `;
    }
}

// --- Add Error (for Admin) ---
async function addError(event) {
    event.preventDefault();
    const code = document.getElementById("add-code").value;
    const description = document.getElementById("add-desc").value;
    const type = document.getElementById("add-type").value;
    const severity = document.getElementById("add-severity").value;
    const token = localStorage.getItem("token");

    const res = await fetch(`${apiBase}/error`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code, description, type, severity })
    });
    const data = await res.json();
    alert(data.message || data.error);
}
