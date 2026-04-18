const { createLogger, format, transports } = require("winston");

const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    defaultMeta: {
        service: "wellness-backend",
        environment: process.env.NODE_ENV || "dev"
    },
    transports: [
        new transports.Console()
    ]
});

module.exports = logger;