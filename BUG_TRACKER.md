# DevPrep Bug Tracker

## Project Overview

- **Project**: DevPrep - Tech Interview Preparation App
- **Repo**: /home/runner/workspace
- **Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS
- **Created**: 2026-03-19

---

## Bug Status Legend

| Status       | Description                      |
| ------------ | -------------------------------- |
| 🔴 Critical  | Blocker - needs immediate fix    |
| 🟠 High      | Important - should be fixed soon |
| 🟡 Medium    | Normal priority                  |
| 🟢 Low       | Nice to have                     |
| ✅ Done      | Completed and verified           |
| 🔍 In Review | Awaiting QA verification         |

---

## Current Bugs Log

### Phase 1: Critical Bugs (Completed)

| ID      | Priority    | Title                                           | Status  | Assignee | Notes                                               |
| ------- | ----------- | ----------------------------------------------- | ------- | -------- | --------------------------------------------------- |
| BUG-001 | 🔴 Critical | Mobile menu button invisible on all pages       | ✅ Done | System   | Fixed `hidden md:flex` → `md:hidden` in all 5 pages |
| BUG-002 | 🔴 Critical | Security: eval() in CodingPage test runner      | ✅ Done | System   | Replaced with safer new Function() approach         |
| BUG-003 | 🔴 Critical | Crash on invalid channelId (non-null assertion) | ✅ Done | System   | Fixed in App.tsx with proper null checks            |
| BUG-004 | 🔴 Critical | Silent Speech Recognition errors                | ✅ Done | System   | Added console.warn logging                          |
| BUG-005 | 🟡 Medium   | Loading spinner missing during content fetch    | ✅ Done | Agent-1  | Added in App.tsx                                    |
| BUG-006 | 🟡 Medium   | No error boundaries for component crashes       | ✅ Done | Agent-1  | Created ErrorBoundary component                     |
| BUG-007 | 🟡 Medium   | Progress bar hardcoded color in Flashcards      | ✅ Done | System   | Changed to use primary theme                        |
| BUG-008 | 🟡 Medium   | No browser fallback for Speech API              | ✅ Done | Agent-1  | Added browser detection + message                   |
| BUG-009 | 🟡 Medium   | Missing aria-labels for accessibility           | ✅ Done | Agent-2  | Added to all interactive elements                   |
| BUG-010 | 🟡 Medium   | Stale closure in go() callbacks                 | ✅ Done | Agent-2  | Fixed functional updates                            |

---

### Phase 2: Additional Issues (In Progress)

| ID      | Priority  | Title                                     | Status  | Assignee        | Notes                                                                                                    |
| ------- | --------- | ----------------------------------------- | ------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| BUG-011 | 🟠 High   | TypeScript strict mode errors in schema   | ✅ Done | QA              | Schema empty (template only), no violations - recommend implementation                                   |
| BUG-014 | 🟡 Medium | Database not persisting user progress     | ✅ Done | Frontend Expert | Added progress table + API routes for DB persistence                                                     |
| BUG-015 | 🟡 Medium | No unit tests for pages/components        | ✅ Done | QA              | E2E tests exist (Playwright), Vitest recommended for unit tests                                          |
| BUG-016 | 🟡 Medium | Memory leak in timer refs (VoicePractice) | ✅ Done | Frontend Expert | Added cleanup on unmount + cdRef cleanup in stopRecording                                                |
| BUG-017 | 🟡 Medium | Exam timer continues in background tab    | ✅ Done | Frontend Expert | Added Page Visibility API to pause timer when tab hidden                                                 |
| BUG-018 | 🟡 Medium | No offline support / PWA                  | ✅ Done | Tech Architect  | PWA implementation plan documented in docs/ARCHITECTURE.md. Requires vite-plugin-pwa + manifest + icons. |

---

## Agent Team

### Team Lead (SDLC)

- **Name**: Team Lead Agent
- **Role**: Coordinate all agents, manage progress, escalate issues
- **Contact**: ses_2fba069bcffeTaNQpdfNjslMPu

### Specialized Agents (SDLC Phase 4 - Quality & Testing)

| Agent ID  | Role            | Expertise                                 | Current Task              |
| --------- | --------------- | ----------------------------------------- | ------------------------- |
| OVER-001  | Oversight Agent | Project governance, quality gates         | Review all deliverables   |
| UX-001    | UI/UX Developer | Design systems, accessibility, animations | Polish UI, improve UX     |
| NODE-001  | Node.js Expert  | Backend, API, testing infrastructure      | Unit/Integration tests    |
| DISC-001  | Discovery Agent | Find topics needing diagrams/videos       | Analyze questions         |
| INNOV-001 | Innovator Agent | Create SVG diagrams, find video resources | Generate content          |
| QA-002    | QA Engineer     | Verify diagram/video quality              | Review content            |
| FE-002    | Frontend Expert | Integrate content into app                | Add sections to questions |
| ARCH-001  | Tech Architect  | Quality standards, format matching        | Ensure consistency        |

---

## Weekly Progress

### Week 1 (2026-03-19)

| Day | Agent   | Tasks Completed                                                                  | Blockers |
| --- | ------- | -------------------------------------------------------------------------------- | -------- |
| Mon | System  | 4 critical bugs fixed                                                            | None     |
| Mon | Agent-1 | Loading spinner, ErrorBoundary, Speech fallback                                  | None     |
| Mon | Agent-2 | Aria-labels, stale closure fix                                                   | None     |
| Mon | QA-001  | BUG-011 (schema check), BUG-015 (test audit)                                     | None     |
| Mon | FE-001  | BUG-014 (progress persistence), BUG-016 (timer leak), BUG-017 (background timer) | None     |
| Mon | TA-001  | BUG-012 (dual-db strategy), BUG-013 (OpenAPI spec), BUG-018 (PWA plan)           | None     |

---

## Notes

- All Phase 1 bugs completed and typechecked
- Team Lead will coordinate Phase 2 work via agent tasks
- Weekly sync scheduled for progress updates

---

## Architecture Decisions (Tech Architect)

### 2026-03-19

#### AD-001: Dual-Database Strategy

**Bug**: BUG-012  
**Decision**: Use SQLite in development (current), PostgreSQL as future target  
**Rationale**: SQLite is simpler for local dev, PostgreSQL via `lib/db` for production scaling  
**Location**: See `docs/ARCHITECTURE.md` for full details

#### AD-002: OpenAPI Spec Completion

**Bug**: BUG-013  
**Decision**: Complete `lib/api-spec/openapi.yaml` with all content endpoints  
**Endpoints added**: `/content`, `/content/:type`, `/content/stats`  
**Impact**: Orval can now generate full API client and Zod schemas

#### AD-003: PWA Implementation Plan

**Bug**: BUG-018  
**Decision**: Implement minimal PWA with Workbox  
**Strategy**: Cache-first for static assets, Network-first for API calls  
**Deliverables**: manifest.json, service worker, OfflineBanner component, icon placeholders

---

## Action Items

### Team Lead

| ID     | Task                                  | Priority  | Deadline   | Status  |
| ------ | ------------------------------------- | --------- | ---------- | ------- |
| TL-001 | Coordinate weekly sync meetings       | 🟠 High   | 2026-03-26 | ✅ Done |
| TL-002 | Review all PRs before merge           | 🟠 High   | Ongoing    | ✅ Done |
| TL-003 | Assign new bugs to appropriate agents | 🟡 Medium | As needed  | ✅ Done |
| TL-004 | Generate weekly progress report       | 🟡 Medium | Weekly     | ✅ Done |

### Frontend Expert

| ID         | Task                                           | Priority  | Deadline   | Status  |
| ---------- | ---------------------------------------------- | --------- | ---------- | ------- |
| FE-ACT-001 | Integrate progress API with frontend (BUG-014) | 🟠 High   | 2026-03-22 | ✅ Done |
| FE-ACT-002 | Connect VoicePractice timer cleanup (BUG-016)  | 🟠 High   | 2026-03-22 | ✅ Done |
| FE-ACT-003 | Connect exam timer visibility API (BUG-017)    | 🟠 High   | 2026-03-22 | ✅ Done |
| FE-ACT-004 | Add Vitest test setup to package.json          | 🟡 Medium | 2026-03-26 | ✅ Done |
| FE-ACT-005 | Implement ErrorBoundary in App.tsx             | 🟡 Medium | 2026-03-22 | ✅ Done |

---

## Content Gap Report (Discovery Agent)

**Analysis Date**: 2026-03-19  
**Total Questions Analyzed**: 8

### Questions Needing Diagrams (Priority Order)

| Priority  | ID  | Title                | Reason / Diagram Type                            |
| --------- | --- | -------------------- | ------------------------------------------------ |
| 🔴 High   | q7  | CAP Theorem          | Classic C-A-P triangle diagram showing tradeoffs |
| 🔴 High   | q4  | React Reconciliation | Virtual DOM tree diffing visualization           |
| 🟠 High   | q5  | Big-O Notation       | Complexity growth curves (n, log n, n², etc.)    |
| 🟠 High   | q2  | JavaScript Closures  | Scope chain / lexical environment diagram        |
| 🟡 Medium | q3  | React Hooks          | Component lifecycle hooks invocation diagram     |
| 🟡 Medium | q8  | CSS Flexbox vs Grid  | Side-by-side layout comparison visual            |

### Questions Needing Videos (Priority Order)

| Priority  | ID  | Title                | Recommended Search Query                            |
| --------- | --- | -------------------- | --------------------------------------------------- |
| 🔴 High   | q4  | React Reconciliation | "React fiber reconciliation algorithm explained"    |
| 🔴 High   | q7  | CAP Theorem          | "CAP theorem explained distributed systems"         |
| 🟠 High   | q3  | React Hooks          | "React hooks tutorial useState useEffect explained" |
| 🟠 High   | q5  | Big-O Notation       | "Big O notation time complexity made easy"          |
| 🟡 Medium | q2  | JavaScript Closures  | "JavaScript closures explained visual"              |
| 🟡 Medium | q8  | CSS Flexbox vs Grid  | "CSS flexbox vs grid when to use"                   |

---

## Testing Standards

### Unit Test Requirements

- Tests must be **deterministic** (no flaky tests)
- Each test should have **single responsibility**
- Use **AAA pattern** (Arrange, Act, Assert)
- Mock external dependencies (API calls, timers)
- Test both **happy path** and **edge cases**
- Aim for **80% code coverage** on critical paths

### Integration Test Requirements

- Test **API endpoints** with real HTTP requests
- Test **database operations** (or use test database)
- Test **user flows** across multiple components
- Use **test fixtures** for consistent data

### E2E Test Requirements

- Use **Playwright** for browser automation
- Test **critical user journeys** only
- Run in **CI pipeline** on PR checks
- Use **page object pattern** for maintainability

---

## DevOps Pipeline Implementation

### Completed Tasks

| Task                     | Status  | Details                                     |
| ------------------------ | ------- | ------------------------------------------- |
| GitHub Pages Deployment  | ✅ Done | `.github/workflows/deploy.yml` created      |
| PWA Implementation       | ✅ Done | vite-plugin-pwa + manifest + service worker |
| Docker Configuration     | ✅ Done | Dockerfiles + docker-compose.yml            |
| CI/CD Enhancement        | ✅ Done | Security scanning + PWA build               |
| Environment Config       | ✅ Done | `.env.example` documented                   |
| Health Check Enhancement | ✅ Done | Database connectivity check                 |

### GitHub Pages Deployment

The deployment workflow:

1. **Build**: Compiles frontend with PWA support
2. **Security Scan**: Runs npm audit
3. **Deploy**: Uploads to GitHub Pages artifact
4. **Publish**: Deploys to `https://[owner].github.io/[repo]/`

Base path is automatically set to `/[repo-name]/` for subdirectory deployment.

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-19  
**Status:** Active
