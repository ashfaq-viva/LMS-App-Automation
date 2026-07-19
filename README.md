# LMS App Automation

Maestro end-to-end automation workspace for the Android LMS application.

## Test Coverage

The authentication suite contains 24 automated Maestro flows covering login, password reset, check-mail, and account creation. Two additional approved cases are blocked by missing accessibility identifiers. Shared flows keep common navigation and form actions reusable. See [`test-cases/test-cases.csv`](test-cases/test-cases.csv) for the complete test inventory.

Flows use the Android application ID `com.lms.app.dev`. Smoke, regression, and validation coverage is identified by each flow's `tags`; the `smoke/` and `regression/` directories are placeholders for future standalone suites.

## Prerequisites

- Java 17 or newer
- [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli)
- Node.js 20 or newer for Allure result generation
- An Android emulator or device with the development APK installed

## APK Location

Place the Android development APK in `apps/`:

```text
apps/app-development-debug.apk
```

APK and AAB files under `apps/` are ignored by Git so application binaries are not committed accidentally. The test runner does not install the APK; install it before running local tests:

```bash
adb install -r apps/app-development-debug.apk
```

## Structure

```text
.
├── .github/
│   └── workflows/                # GitHub Actions workflows
├── .maestro/
│   ├── flows/
│   │   ├── auth/
│   │   │   ├── login/            # TC-01 through TC-06, plus TC-28
│   │   │   ├── forgot-password/  # TC-07 through TC-10
│   │   │   ├── check-mail/       # TC-11 through TC-13
│   │   │   └── create-account/   # Automated create-account cases
│   │   ├── components/            # Shared navigation and form actions
│   │   ├── regression/            # Reserved standalone suite
│   │   └── smoke/                 # Reserved standalone suite
│   ├── screenshots/               # Maestro-generated screenshots
│   └── scripts/                   # Runner and reporting utilities
├── apps/                           # Local Android application builds
├── artifacts/                      # Generated reports and test output
├── .env.example                    # Credential template
├── allurerc.json                   # Allure report configuration
├── test-cases/
│   └── test-cases.csv              # Canonical test-case inventory
└── README.md
```

## Test Case Inventory

`test-cases/test-cases.csv` is the source of truth for approved, automated, planned, and blocked test cases. Each row records the application navigation path, preconditions, test data, steps, expected result, priority, suite, tags, automation status, and corresponding Maestro flow.

The `app_route` column describes observed screen navigation rather than a technical deep-link or internal route. Automated cases must reference an existing repository-relative YAML file in `flow_path`; blocked cases leave that field empty and explain the blocker in `blocked_reason`.

## Configuration

Copy `.env.example` to `.env` and set the valid test account:

```dotenv
VALID_EMAIL=
VALID_PASSWORD=
```

The runner loads `.env` when present and passes credentials to Maestro. It also accepts credentials exported in the environment. Do not commit `.env`.

## Run Tests

Run all authentication cases sequentially:

```bash
.maestro/scripts/run-auth-tests.sh
```

Run one case:

```bash
.maestro/scripts/run-auth-tests.sh \
  .maestro/flows/auth/login/tc-05-invalid-email.yaml
```

The suite runs flows sequentially because simultaneous Maestro CLI sessions conflict on one emulator. Close Maestro Studio before running the CLI suite. Generated JUnit files, logs, Maestro debug output, and Allure results are written under `artifacts/`.

The runner expects Maestro at `$HOME/.maestro/bin/maestro`. Set `MAESTRO_BIN` to use another installation path, or set `MAESTRO_ARTIFACTS_DIR` to change the output directory.

To generate an Allure HTML report locally after a run:

```bash
npm install --global allure@3.14.3
allure generate artifacts/allure-results
```

## GitHub Actions

The `CI/CD` workflow runs on pull requests to `main`, pushes to `main`, and manual dispatches. It starts an Android API 30 emulator, installs the APK, runs every authentication flow sequentially, and uploads JUnit, Allure, screenshot, and debug artifacts for seven days.

### Repository Setup

1. Create a GitHub Release.
2. Upload the APK to the release with the exact asset name `app-development-debug.apk`.
3. Add `VALID_EMAIL` and `VALID_PASSWORD` under **Settings > Secrets and variables > Actions**.
4. Add `SMTP_USERNAME` and `SMTP_PASSWORD` for the email notification step, and configure its recipient in `.github/workflows/maestro-ci.yml`.

Automatic runs use the APK from the latest release. For a manual run, open **Actions > CI/CD > Run workflow**, select the Git branch, and optionally enter a release tag. Leaving the release tag empty uses the latest release.

Pull requests from forks do not run the emulator job because GitHub does not expose repository secrets to forked workflows.

### Reports

Each workflow run includes a pass/fail table in the GitHub Actions summary. Download the `maestro-results-*` artifact for the Allure HTML report, JUnit XML files, Maestro screenshots, console logs, and debug output. Open `artifacts/allure-report/index.html` from the downloaded artifact to view the report locally.
