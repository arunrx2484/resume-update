import path from "node:path";
import { createLogger, format, transports } from "winston";
import { FRAMEWORK_CONSTANTS } from "../constants/framework-constants";

const logFile = path.resolve(process.cwd(), FRAMEWORK_CONSTANTS.LOG_DIR, "automation.log");

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
