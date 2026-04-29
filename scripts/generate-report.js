const fs = require("node:fs");
const path = require("node:path");
const reporter = require("multiple-cucumber-html-reporter");

const reportDir = process.env.CUCUMBER_REPORT_DIR
  ? path.resolve(process.env.CUCUMBER_REPORT_DIR)
  : path.resolve(process.cwd(), "reports/cucumber-html-report");
const jsonFile = path.join(reportDir, "cucumber.json");

if (!fs.existsSync(jsonFile) || fs.statSync(jsonFile).size === 0) {
  console.error(`Cucumber JSON report not found or empty: ${jsonFile}`);
  process.exit(1);
}

reporter.generate({
  jsonDir: reportDir,
  reportPath: reportDir,
  openReportInBrowser: false,
  pageTitle: "Naukri Automation Report",
  reportName: "Cucumber BDD Execution Report",
  displayDuration: true,
  metadata: {
    browser: {
      name: process.env.BROWSER || "chromium",
      version: "latest"
    },
    device: "Local machine",
    platform: {
      name: process.platform,
      version: process.version
    }
  },
  customData: {
    title: "Execution Info",
    data: [
      { label: "Environment", value: process.env.ENV || "qa" },
      { label: "Generated", value: new Date().toLocaleString() }
    ]
  }
});

console.log(`HTML report generated: ${path.join(reportDir, "index.html")}`);
