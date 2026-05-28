const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// =========================
// REGISTER
// =========================
exports.register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
        const existing = await db.query(
            "SELECT id FROM users WHERE username = $1",
            [username]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Username already exists" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await db.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, role",
            [username, password_hash]
        );

        res.status(201).json({ user: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const result = await db.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};
