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
    error.classList.add("d-none");

    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        error.innerText = "Invalid username or password";
        error.classList.remove("d-none");
        return;
    }

    const data = await res.json();
    saveSession(data.token, username);
    window.location.href = "dashboard.html";
}

// =========================
// REGISTER PAGE
// =========================
async function register() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const error = document.getElementById("register-error");
    const success = document.getElementById("register-success");

    if (!usernameInput || !passwordInput || !error) {
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    error.innerText = "";
    error.classList.add("d-none");

    if (success) {
        success.innerText = "";
        success.classList.add("d-none");
    }

    if (!username) {
        error.innerText = "Username is required";
        error.classList.remove("d-none");
        return;
    }
    if (password.length < 6) {
        error.innerText = "Password must be at least 6 characters";
        error.classList.remove("d-none");
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
        error.classList.remove("d-none");
        return;
    }

    localStorage.setItem("lastRegisteredUsername", username);
    sessionStorage.setItem("justRegistered", "1");

    if (success) {
        success.innerText = "Account created! Redirecting to login...";
        success.classList.remove("d-none");
    }

    window.location.href = "/login.html";
}

function applyLoginPageHints() {
    const loginError = document.getElementById("login-error");
    if (!loginError) return;

    if (sessionStorage.getItem("justRegistered") !== "1") return;

    const lastUser = localStorage.getItem("lastRegisteredUsername") || "";
    const usernameInput = document.getElementById("username");
    if (lastUser && usernameInput) {
        usernameInput.value = lastUser;
    }

    loginError.innerText = "Account created. You can log in now.";
    loginError.classList.remove("d-none");
    sessionStorage.removeItem("justRegistered");
}

document.addEventListener("DOMContentLoaded", applyLoginPageHints);

// =========================
// LOGOUT
// =========================
function logout() {
    clearSession();
    window.location.href = "index.html";
}
