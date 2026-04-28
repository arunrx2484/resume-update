# Salesforce CPQ BDD Automation Framework (TypeScript)

Production-ready Cucumber BDD framework using TypeScript, npm, and Playwright.

## 1. Project overview

This framework provides:
- Cucumber feature files and step definitions
- Page Object Model for UI automation
- Environment-based configuration (`dev`, `qa`, `staging`, `prod`)
- Browser selection from runtime variables
- Hooks for setup/teardown
- Failure screenshots attached to Cucumber reports
- Logging with file + console output
- Cucumber HTML and JSON reporting

## 2. Folder structure

```text
src
├── constants
│   └── framework-constants.ts
├── features
│   └── login.feature
├── hooks
│   └── hooks.ts
├── pages
│   └── login.page.ts
├── step-definitions
│   └── login.steps.ts
├── support
│   └── world.ts
└── utils
    ├── api-client.ts
    ├── browser-manager.ts
    ├── config-reader.ts
    ├── logger.ts
    ├── screenshot-utils.ts
    ├── test-data-reader.ts
    └── wait-utils.ts

config
└── env
    ├── dev.env
    ├── qa.env
    ├── staging.env
    └── prod.env

testdata
└── login-test-data.json

reports
├── cucumber-html-report
├── screenshots
└── logs
```

## 3. Prerequisites

- Node.js 20+ (recommended)
- npm 9+
- Browsers supported by Playwright (Chromium/Firefox/WebKit)

## 4. How to install dependencies

```bash
npm install
```

## 5. How to run all tests

```bash
npm test
```

## 6. How to run tests by tag

```bash
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@regression and @login"
```

## 7. How to run tests for a specific environment

Default environment is `qa`.

```bash
ENV=staging npm test
```

## 8. How to run tests on a specific browser

Default browser is `chromium`.

```bash
BROWSER=firefox npm test
```

## 9. Where to find the Cucumber HTML report

- HTML: `reports/cucumber-html-report/cucumber.html`
- JSON: `reports/cucumber-html-report/cucumber.json`

## 10. Where screenshots are stored

- Failed scenario screenshots: `reports/screenshots`

## 11. Example commands

```bash
npm install
npm test
ENV=qa BROWSER=chromium npm test
npx cucumber-js --tags "@smoke"
ENV=staging BROWSER=webkit npm test
```

### Naukri resume update run

Set secure credentials and resume file path via environment variables:

```bash
export NAUKRI_USER="your-email-or-username"
export NAUKRI_PASS="your-password"
export RESUME_PATH="/absolute/path/to/resume.pdf"
npx cucumber-js --tags "@naukri and @resume"
```

## GitHub Actions scheduled runs (always-on)

Workflow file added:

- `.github/workflows/naukri-resume.yml`

It runs at IST times:

- 12:00 AM, 3:00 AM, 6:00 AM, 9:00 AM, 12:00 PM, 3:00 PM, 6:00 PM, 9:00 PM

Required GitHub repository secrets:

- `NAUKRI_USER`
- `NAUKRI_PASS`
- `RESUME_B64` (base64 content of resume PDF)

Create `RESUME_B64` locally:

```bash
base64 "/absolute/path/to/resume.pdf" | pbcopy
```

Then paste into GitHub secret `RESUME_B64`.

## Configuration behavior

- `ENV=qa` loads `config/env/qa.env`
- `BROWSER=chromium` selects Playwright Chromium
- `HEADLESS=true|false` can be set in env files

## Notes for application integration

- Update `BASE_URL` and `API_BASE_URL` in env files.
- Replace placeholder selectors in `src/pages/login.page.ts`.
- Replace sample credentials in `testdata/login-test-data.json`.

## Troubleshooting

- **Element not found/timeouts:** update locators in `src/pages/login.page.ts`.
- **No scenarios executed:** verify feature path and tag expression.
- **Config not loading:** ensure `ENV` value maps to existing env file.
- **Browser launch issues:** run `npx playwright install`.
- **TypeScript compile errors:** run `npm run build` and fix reported types.
