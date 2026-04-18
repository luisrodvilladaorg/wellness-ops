const express = require("express");

// Logger
const logger = require("./logger");

// Middlewares
const metricsMiddleware = require("./middleware/metrics");


// Routes
const authRoutes = require("./routes/auth.routes");
const entriesRoutes = require("./routes/entries.routes");
const healthRoutes = require("./routes/health.routes");
const metricsRoutes = require("./routes/metrics.routes");

const app = express();

// ==========================
// Global middlewares
// ==========================
app.use(express.json());
app.use(metricsMiddleware);

// HTTP request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        logger.info("HTTP request", {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration_ms: Date.now() - start,
            ip: req.ip
        });
    });
    next();
});

// ==========================
// Routes
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/health", healthRoutes);
app.use("/metrics", metricsRoutes);

// Simple health check for Docker / orchestrators
app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});


// ==========================
// 404 handler
// ==========================
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

module.exports = app;
