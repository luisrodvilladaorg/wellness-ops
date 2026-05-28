// =========================
// LOAD ENTRIES
// =========================
async function loadEntries() {
    const token = getToken();
    const list = document.getElementById("entries-list");

    const res = await fetch("/api/entries", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
        logout();
        return;
    }

    const entries = await res.json();
    list.innerHTML = "";

    entries.forEach(entry => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${entry.title} — ${entry.description || ""}`;
        list.appendChild(li);
    });
}

// =========================
// CREATE ENTRY
// =========================
async function createEntry(e) {
    e.preventDefault();

    const token = getToken();
    const title = document.getElementById("entry-title").value.trim();
    const description = document.getElementById("entry-description").value.trim();

    if (!title) {
        alert("Title is required");
        return;
    }

    const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
    });

    if (!res.ok) {
        alert("Error saving entry");
        return;
    }

    document.getElementById("entry-form").reset();
    loadEntries();
}
