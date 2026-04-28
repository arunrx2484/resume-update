import fs from "node:fs";
import path from "node:path";

export type LoginData = {
  validUser: {
    username: string;
    password: string;
  };
  invalidUser: {
    username: string;
    password: string;
  };
};

export function readLoginData(): LoginData {
  const filePath = path.resolve(process.cwd(), "testdata/login-test-data.json");
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as LoginData;
}
