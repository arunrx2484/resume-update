module.exports = {
  default: {
    paths: ["src/features/**/*.feature"],
    require: ["src/**/*.ts"],
    requireModule: ["ts-node/register"],
    format: [
      "progress-bar",
      "summary",
      "json:reports/cucumber-html-report/cucumber.json"
    ]
  }
};
