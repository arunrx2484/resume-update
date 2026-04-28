import dotenv from "dotenv";
import path from "node:path";
import { FRAMEWORK_CONSTANTS } from "../constants/framework-constants";

export type RuntimeConfig = {
  env: string;
  browser: string;
  baseUrl: string;
  apiBaseUrl: string;
  headless: boolean;
};

let cachedConfig: RuntimeConfig | null = null;

export function getConfig(): RuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = (process.env.ENV ?? FRAMEWORK_CONSTANTS.DEFAULT_ENV).toLowerCase();
  const envFilePath = path.resolve(process.cwd(), FRAMEWORK_CONSTANTS.ENV_DIR, `${env}.env`);
  dotenv.config({ path: envFilePath });

  cachedConfig = {
    env,
    browser: (process.env.BROWSER ?? FRAMEWORK_CONSTANTS.DEFAULT_BROWSER).toLowerCase(),
    baseUrl: process.env.BASE_URL ?? "https://qa.example.com/login",
    apiBaseUrl: process.env.API_BASE_URL ?? "https://qa.example.com/api",
    headless: (process.env.HEADLESS ?? "false").toLowerCase() === "true"
  };

  return cachedConfig;
}
