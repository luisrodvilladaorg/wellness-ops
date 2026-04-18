const app = require("./app");
const logger = require("./logger");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info("Backend started", { port: PORT });
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down");
    server.close(() => process.exit(0));
});