import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { getConfig } from "./config-reader";
import { logger } from "./logger";

type RequiredEnv = "NAUKRI_USER" | "NAUKRI_PASS" | "RESUME_PATH";

function readRequiredEnv(name: RequiredEnv): string {
  const value = process.env[name];
  assert.ok(value && value.trim().length > 0, `Missing required environment variable: ${name}`);
  return value;
}

function validateNodeVersion(): void {
  const major = Number(process.versions.node.split(".")[0]);
  const isSupported = major === 18 || major >= 20;
  assert.ok(
    isSupported,
    `Unsupported Node.js version: ${process.version}. Use Node 18 or Node 20+ to run Cucumber.`
  );
}

export function validateNaukriRunConfig(): void {
  validateNodeVersion();
  const config = getConfig();
  const user = readRequiredEnv("NAUKRI_USER");
  readRequiredEnv("NAUKRI_PASS");
  const resumePath = readRequiredEnv("RESUME_PATH");
  const absoluteResumePath = path.resolve(resumePath);

  assert.ok(fs.existsSync(absoluteResumePath), `Resume file does not exist: ${absoluteResumePath}`);

  logger.info("Pre-run validation summary:");
  logger.info(`- env: ${config.env}`);
  logger.info(`- browser: ${config.browser}`);
  logger.info(`- headless: ${config.headless}`);
  logger.info(`- baseUrl: ${config.baseUrl}`);
  logger.info(`- naukri user: ${user}`);
  logger.info(`- resume path: ${absoluteResumePath}`);
}
