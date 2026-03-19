# DevPrep - Product Recommendations

_Analysis by team of startup founders with SaaS experience_

---

## Overview

DevPrep is a developer interview preparation platform with 5 study modes:

- Q&A
- Flashcards
- Coding Challenges
- Mock Exams
- Voice Practice

The app uses React, TypeScript, Vite, and deploys as a static GitHub Pages site.

---

## Tier 1: High Priority

### 1. Progress Dashboard

- **What**: Unified dashboard showing all progress across sections with channel-level breakdowns
- **Why**: Users have no single view of progress. Surface analytics (streak, exam scores, flashcard mastery) to provide motivation
- **Priority**: HIGH

### 2. Achievement/Badge System

- **What**: Client-side achievements unlock based on activity: "First 10 flashcards", "3-day streak", "Completed a mock exam", "Solved 5 coding challenges"
- **Why**: Highest-impact gamification for static site - provides extrinsic motivation and clear goals. Store in localStorage
- **Priority**: HIGH

### 3. Spaced Repetition (SRS)

- **What**: Implement SM-2 style algorithm - "hard" cards appear more frequently, "known" cards less
- **Why**: Current flashcard system has no scheduling. True spaced repetition dramatically improves retention
- **Priority**: HIGH

### 4. Daily Streak + Push Notifications

- **What**: Persistent streak counter with flame icon, browser push notifications after 3rd return visit
- **Why**: Streaks are #1 retention mechanic in consumer apps. Notifications reach users even when tab is closed
- **Priority**: HIGH

### 5. Fix Failing Tests

- **What**: Fix failing tests, remove `|| true` from CI workflows
- **Why**: Test failures undermine confidence. CI should not ignore failures
- **Priority**: HIGH

### 6. Decompose Large Components

- **What**: Split 500-900 line page components (QAPage.tsx, FlashcardsPage.tsx, etc.) into smaller, focused sub-components
- **Why**: Single files are impossible to maintain, test, and reason about. Violates Single Responsibility Principle
- **Priority**: HIGH

---

## Tier 2: Medium Priority

### 7. Shareable Achievement Cards

- **What**: Generate shareable PNG showing progress (streak, badges, stats) for LinkedIn/Twitter
- **Why**: Test results are naturally shareable. Creates viral loop without auth
- **Priority**: MEDIUM

### 8. Mobile Toolbar Overhaul

- **What**: Condense toolbars on mobile. Reduce 44px heights. Collapse secondary actions into dropdown
- **Why**: On phones users see ~4 question cards before scrolling. Dense toolbars hurt quick study sessions
- **Priority**: MEDIUM

### 9. Swipe Gestures

- **What**: Add touch swipe handlers for flashcards and QA navigation
- **Why**: Mobile users expect swipe navigation. Currently only keyboard/desktop support
- **Priority**: MEDIUM

### 10. Weak Area Identification

- **What**: Show "Your Weak Spots" - which topics/domains user is struggling in
- **Why**: Users need guidance on what to study next. Data exists (exam wrong answers, hard flashcards)
- **Priority**: MEDIUM

### 11. Study Session Timer

- **What**: "Study Mode" with configurable timer (25min Pomodoro-style), track session time
- **Why**: Interview prep requires focused study sessions. Timer creates urgency and tracks total study time
- **Priority**: MEDIUM

### 12. Code Splitting

- **What**: Lazy load pages using React.lazy()
- **Why**: All 5 sections load simultaneously. Bundle size will grow. Implement route-based splitting
- **Priority**: MEDIUM

### 13. Consolidate useLocalStorage

- **What**: Choose one implementation (hooks/useLocalStorage or lib/useLocalStorage), delete the other
- **Why**: Two hooks with different APIs cause confusion. Violates DRY principle
- **Priority**: MEDIUM

---

## Tier 3: Lower Priority

### 14. Bookmark/Favorites System

- **What**: Bookmark specific questions, flashcards, coding challenges for later review
- **Why**: Users want to save important content they don't fully understand yet
- **Priority**: LOW

### 15. iOS PWA Enhancements

- **What**: Add proper meta tags, splash screen, `apple-mobile-web-app-status-bar-style`
- **Why**: Missing config causes white flash on iOS launch, lower install rate
- **Priority**: LOW

### 16. Background Sync

- **What**: Queue offline writes, sync when back online
- **Why**: Users lose progress when offline and close tab
- **Priority**: LOW

### 17. Social Proof

- **What**: "247 developers practiced JavaScript today" - aggregate anonymous stats
- **Why**: Social proof drives adoption. Works without auth
- **Priority**: LOW

### 18. Micro-animations

- **What**: Add select animations when marking flashcards, choosing exam answers
- **Why**: Creates "completion dopamine" - emotional satisfaction cues
- **Priority**: LOW

---

## Quick Wins

| Improvement            | File                 | Change                       |
| ---------------------- | -------------------- | ---------------------------- |
| Add touch-action CSS   | Interactive elements | `touch-action: manipulation` |
| Increase touch targets | MockExamPage.tsx     | `h-10` instead of `h-8`      |
| Add ARIA live region   | MockExamPage.tsx     | Wrap timer in aria-live      |
| Remove unused imports  | QAPage.tsx           | Remove `channels` import     |
| Fix TypeScript errors  | api-server/tests     | Fix unknown data types       |

---

## Technical Debt Summary

| Priority | Issue                     | Files                        |
| -------- | ------------------------- | ---------------------------- |
| HIGH     | Failing tests             | CI workflows                 |
| HIGH     | Duplicate useLocalStorage | hooks/ and lib/              |
| HIGH     | 500-900 line components   | QAPage, FlashcardsPage, etc. |
| MEDIUM   | Type errors               | api-server/**tests**         |
| LOW      | Dead code                 | Unused hooks, imports        |

---

## Summary

The foundation is solid - 5 distinct study modes, channel-based organization, and existing progress tracking. Focus first on:

1. **Retention mechanics** - streaks, achievements, SRS
2. **Technical debt** - tests, component decomposition
3. **Mobile experience** - swipe gestures, toolbar optimization

Then add features for engagement and viral growth.
