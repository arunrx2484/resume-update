const path = require("node:path");

/** When cron cannot write under Documents, set `CUCUMBER_REPORT_DIR` (see run-naukri-scheduled.sh). */
const cucumberReportDir = process.env.CUCUMBER_REPORT_DIR
  ? path.resolve(process.env.CUCUMBER_REPORT_DIR)
  : path.resolve(process.cwd(), "reports/cucumber-html-report");

module.exports = {
  default: {
    paths: ["src/features/**/*.feature"],
    require: ["src/**/*.ts"],
    requireModule: ["ts-node/register"],
    format: [
      "progress-bar",
      "summary",
      `json:${path.join(cucumberReportDir, "cucumber.json")}`
    ]
  }
};
