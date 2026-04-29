import fs from "node:fs";
import path from "node:path";
import { createLogger, format, transports } from "winston";
import { getReportsArtifactRoot } from "./artifacts-paths";

const logFile = path.join(getReportsArtifactRoot(), "logs", "automation.log");
fs.mkdirSync(path.dirname(logFile), { recursive: true });

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFile })
  ]
});
