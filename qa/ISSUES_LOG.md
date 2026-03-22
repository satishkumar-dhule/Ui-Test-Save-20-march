# QA Issues Log - Apple Glass Migration (Open)

- [QA-01] Define E2E test plan for Apple Glass migration
  - Description: Establish the end-to-end testing strategy for the Apple Glass theme migration; include scope, success criteria, and risk mitigation.
  - Labels: QA, E2E, AppleGlass
  - Assignee: QAL
  - Status: Open
  - Link: qa/END2END_PLAN.md

- [QA-02] Set up Playwright framework and CI integration
  - Description: Initialize Playwright config, install dependencies, and wire tests to CI.
  - Labels: QA, E2E, CI
  - Assignee: AUE
  - Status: Open
  - Link: tests/e2e/playwright.config.ts

- [QA-03] Create test scripts for agent groups 1-3
  - Description: Write automated tests for onboarding and work-item creation for engineers 1-3.
  - Labels: QA, E2E
  - Assignee: SQA1
  - Status: Open
  - Link: tests/e2e/devprep.qa.spec.ts

- [QA-04] Create test scripts for agent groups 4-6
  - Description: Write automated tests for onboarding and work-item creation for engineers 4-6.
  - Labels: QA, E2E
  - Assignee: SQA2
  - Status: Open
  - Link: tests/e2e/devprep.qa.spec.ts

- [QA-05] Create test scripts for agent groups 7-9
  - Description: Write automated tests for onboarding and work-item creation for engineers 7-9.
  - Labels: QA, E2E
  - Assignee: JQA1
  - Status: Open
  - Link: tests/e2e/devprep.qa.spec.ts

- [QA-06] Create test scripts for agent group 10 + coordinator
  - Description: Write automated tests for onboarding and work-item creation for engineer 10 and coordinator.
  - Labels: QA, E2E
  - Assignee: JQA2
  - Status: Open
  - Link: tests/e2e/devprep.qa.spec.ts

- [QA-07] Integrate E2E tests into CI (GitHub Actions)
  - Description: Add CI workflow steps to run Playwright tests on PRs and push results.
  - Labels: CI, QA, E2E
  - Assignee: AUE
  - Status: Open
  - Link: .github/workflows/e2e.yml

- [QA-08] Run full E2E suite and publish results
  - Description: Execute the full set of E2E tests and publish pass/fail metrics.
  - Labels: QA, E2E
  - Assignee: QAL
  - Status: Open
  - Link: QA_TRACKER.md

- [QA-09] Track defects and assign to agents
  - Description: Create defects for any failures, assign to responsible agent owners, and track status.
  - Labels: QA, Defects
  - Assignee: JQA5
  - Status: Open
  - Link: QA_TRACKER.md

- [QA-10] Documentation and evidence collection
  - Description: Document test results, evidence, and reusability considerations.
  - Labels: QA, Docs
  - Assignee: JQA6
  - Status: Open
  - Link: QA_TRACKER.md
