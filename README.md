# LMS App Automation

Maestro end-to-end automation workspace for the Android LMS application.

## Test Coverage

The suite contains 44 automated Maestro flows (`TC-01` through `TC-44`) covering authentication, team creation, and team joining. Shared flows keep common navigation and form actions reusable. See [`test-cases/test-cases.csv`](test-cases/test-cases.csv) for the complete test inventory.

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
│   ├── assets/
│   │   └── team-logo.png          # Team logo upload fixture
│   ├── flows/
│   │   ├── auth/
│   │   │   ├── login/            # TC-01 through TC-10
│   │   │   ├── forgot-password/  # TC-11 through TC-14
│   │   │   ├── check-mail/       # TC-15 through TC-17
│   │   │   └── create-account/   # TC-18 through TC-31
│   │   ├── createTeam/            # TC-32 through TC-38
│   │   ├── joinTeam/              # TC-39 through TC-44
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
│   ├── create-team-country-region-search.md # Approved search cases
│   └── test-cases.csv              # Canonical test-case inventory
└── README.md
```

## Test Case Inventory

`test-cases/test-cases.csv` is the source of truth for approved, automated, planned, and blocked test cases. Each row records the application navigation path, preconditions, test data, steps, expected result, priority, suite, tags, automation status, and corresponding Maestro flow.

The `app_route` column describes observed screen navigation rather than a technical deep-link or internal route. Automated cases must reference an existing repository-relative YAML file in `flow_path`; blocked cases leave that field empty and explain the blocker in `blocked_reason`.

## Configuration

Copy `.env.example` to `.env` and set the User 1 test account:

```dotenv
USER1_EMAIL=
USER1_PASSWORD=
USER2_EMAIL=
USER2_PASSWORD=
```

The runner requires User 1 credentials for the suite. TC-39 and TC-40 log in with User 2 and require `USER2_EMAIL` and `USER2_PASSWORD`. The runner loads `.env` when present and passes the configured credentials to Maestro. Do not commit `.env`.

## Run Tests

Run all cases sequentially:

```bash
.maestro/scripts/run-auth-tests.sh
```

Run one case:

```bash
.maestro/scripts/run-auth-tests.sh \
  .maestro/flows/auth/login/tc-05-invalid-email.yaml
```

The suite runs flows sequentially by test-case number and displays each Maestro command live in the terminal. The runner generates a JUnit file after each flow while also preserving console logs, Maestro debug output, per-flow recordings, failure screenshots, and Allure results under `artifacts/`.

TC-32 generates the team fixture used by TC-33, TC-39 through TC-42, and TC-44. After TC-32 completes, the runner extracts the displayed code and writes the latest name and code to `artifacts/extracted_data/team-data.json`, replacing the previous values. Dependent cases receive those values directly, and they can also be run separately using the latest saved data. Override `TEAM_NAME`, `TEAM_CODE`, `BANGLADESH_TEAM_NAME`, or `INVALID_TEAM_CODE` in the environment when a fixed value is required.

Each flow is displayed with its position in the suite, test name, result, and duration. A final summary lists the total, passed and failed counts, artifact errors, total duration, failed flow names, and report locations. Interactive terminals use colored output; set `NO_COLOR=1` to force plain output.

Simultaneous Maestro sessions conflict on one emulator. Close Maestro Studio and avoid Maestro MCP interactions while the CLI suite is running.

The runner expects Maestro at `$HOME/.maestro/bin/maestro`. Set `MAESTRO_BIN` to use another installation path, or set `MAESTRO_ARTIFACTS_DIR` to change the output directory.

To generate an Allure HTML report locally after a run:

```bash
npm install --global allure@3.14.3
allure generate artifacts/allure-results
```

## GitHub Actions

The `CI/CD` workflow runs only when manually dispatched. Merging or pushing to `main` does not trigger it. The workflow starts an Android API 30 emulator, installs the APK, runs every flow sequentially, and uploads JUnit, Allure, screenshot, and debug artifacts for seven days.

### Repository Setup

1. Create a GitHub Release.
2. Upload the APK to the release with the exact asset name `app-development-debug.apk`.
3. Add `USER1_EMAIL`, `USER1_PASSWORD`, `USER2_EMAIL`, and `USER2_PASSWORD` under **Settings > Secrets and variables > Actions**.
4. Add `SMTP_USERNAME` with the Gmail sender address and `SMTP_PASSWORD` with that account's Google App Password. All six secrets are required by the workflow.
5. Set `REPORT_RECIPIENT` in `.github/workflows/maestro-ci.yml` if the report should be sent to a different email address.

GitHub's **Run workflow** form does not support file-upload inputs. Upload the APK as a GitHub Release asset first, then open **Actions > CI/CD > Run workflow**, select the Git branch, and optionally enter that release tag. Leaving the release tag empty uses the latest release.

### Reports

Each workflow run includes a pass/fail table in the GitHub Actions summary. Every Allure test result includes its screen recording, and failed results also include a screenshot of the failure state. Download the `maestro-results-*` artifact for the Allure HTML report, JUnit XML files, recordings, screenshots, console logs, and debug output. Open `artifacts/allure-report/index.html` from the downloaded artifact to view the report locally.

The workflow also publishes the latest Allure report to GitHub Pages. Before the first run, open **Settings > Pages** and set **Source** to **GitHub Actions**. After deployment, the report URL appears in the `Deploy Allure report to GitHub Pages` job and in the repository's **Deployments** section.

Console logs and Maestro debug files remain in the downloadable workflow artifact and are not embedded in the public Pages report. Test credentials are redacted from text-based artifacts before upload. Recordings and failure screenshots are embedded in Allure and therefore published with the Pages report.
