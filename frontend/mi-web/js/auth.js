// =========================
// Token helpers
// =========================
function getToken() {
    return localStorage.getItem("token");
}

function getUsername() {
    return localStorage.getItem("username");
}

function saveSession(token, username) {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
}

// =========================
// LOGIN
// =========================
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("login-error");

    error.innerText = "";

    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        error.innerText = "Invalid username or password";
        return;
    }

    const data = await res.json();
    saveSession(data.token, username);
    window.location.href = "dashboard.html";
}

// =========================
// REGISTER
// =========================
async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("register-error");

    error.innerText = "";

    if (password.length < 6) {
        error.innerText = "Password must be at least 6 characters";
        return;
    }

    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        const data = await res.json();
        error.innerText = data.error || "Registration failed";
        return;
    }

    window.location.href = "index.html";
}

// =========================
// LOGOUT
// =========================
function logout() {
    clearSession();
    window.location.href = "index.html";
}
