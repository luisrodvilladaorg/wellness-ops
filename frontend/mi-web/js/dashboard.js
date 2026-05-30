// =========================
// AUTH GUARD
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // Show username in navbar
    const userInfo = document.getElementById("user-info");
    if (userInfo) {
        userInfo.innerText = `Logged in as ${getUsername()}`;
    }

    // Show navbar user section
    const navbarUser = document.getElementById("navbar-user");
    if (navbarUser) {
        navbarUser.classList.remove("d-none");
    }

    // Load entries on init
    loadEntries();

    // Bind form submit
    const form = document.getElementById("entry-form");
    if (form) {
        form.addEventListener("submit", createEntry);
    }
});
