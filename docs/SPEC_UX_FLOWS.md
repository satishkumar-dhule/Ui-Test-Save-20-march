# DevPrep UX Flow Specifications

**Version**: 1.0.0  
**Author**: UX_FLOW_ARCHITECT  
**Last Updated**: 2026-03-22

## Overview

This document specifies detailed user interaction flows for DevPrep - a developer preparation platform. Each flow includes user steps, decision points, error handling, success metrics, and animation specifications.

---

## Table of Contents

1. [Onboarding Flow](#1-onboarding-flow)
2. [Content Consumption Flow](#2-content-consumption-flow)
3. [Study Session Flow](#3-study-session-flow)
4. [Flashcard Flow](#4-flashcard-flow)
5. [Exam Flow](#5-exam-flow)
6. [Voice Practice Flow](#6-voice-practice-flow)
7. [Coding Challenge Flow](#7-coding-challenge-flow)

---

## 1. Onboarding Flow

### 1.1 First Visit Detection

**Trigger**: User visits site for first time (no localStorage `onboarding-completed` flag)

**Flow Diagram**:

```
[First Visit] → [Show Welcome Screen]
                      ↓
              [Theme Selection]
                      ↓
              [Profile Setup]
                      ↓
              [Channel Selection]
                      ↓
              [Dashboard Customization]
                      ↓
              [Complete → Dashboard]
```

### 1.2 Theme Selection Step

**Screen Description**: Full-screen centered card with DevPrep logo and three theme cards.

**Visual Elements**:

- DevPrep logo (top center, 48px)
- Heading: "Choose your look" (2xl, bold)
- Subheading: "Select a theme that suits you" (text-muted)
- Three theme cards in horizontal row (responsive to vertical on mobile)
  - Light card: Sun icon, white background preview
  - Dark card: Moon icon, dark background preview
  - High Contrast card: Eye icon, black/white contrast preview
- "Skip for now" link (bottom, subtle)
- Primary CTA: "Continue" button

**Interactions**:

- Click theme card → Highlight with primary border + checkmark badge
- Hover theme card → Scale 1.02 + shadow elevation
- Keyboard: Tab between themes, Enter to select

**Animations**:

- Card selection: 200ms scale(1.02) + border-color transition
- Theme preview: 300ms background-color crossfade on theme switch
- Page load: Staggered fade-in (logo → heading → cards), 100ms delay each

**State Storage**: Save to `user-store` → `preferences.theme`

### 1.3 Profile Setup Step

**Screen Description**: Form with profile inputs in centered card.

**Visual Elements**:

- Heading: "Tell us about yourself" (xl, bold)
- Subheading: "Help us personalize your experience" (text-muted)
- Form fields:
  - Full Name (text input, required)
  - Current Role (text input with placeholder "e.g., Frontend Developer")
  - Experience Level (select: 0-2, 3-5, 6-10, 10+ years)
- Progress dots (3 dots, current step highlighted)

**Interactions**:

- Focus input → Border changes to primary + subtle glow
- Invalid input → Red border + error message below field
- Tab navigation between fields

**Validations**:

- Name: Min 2 characters, max 50
- Role: Max 100 characters
- Experience: Required selection

**Error States**:

- Empty required field: "Please enter your [field name]"
- Network error: Toast notification with retry option

**Animations**:

- Field focus: 150ms border-color + shadow transition
- Error message: Slide-down + fade-in (200ms)
- Progress dots: Scale pulse on step change

### 1.4 Channel Selection Step

**Screen Description**: Grid of channel selection cards.

**Visual Elements**:

- Heading: "What do you want to learn?" (xl, bold)
- Subheading: "Select topics to customize your content" (text-muted)
- Channel grid (2 columns on desktop, 1 on mobile):
  - JavaScript (📜) - ES6+, async/await, patterns
  - React (⚛️) - Hooks, state, performance
  - Python (🐍) - Data structures, algorithms
  - DevOps (🔄) - Docker, CI/CD, cloud
  - System Design (🏗️) - Architecture, scalability
  - Database (🗄️) - SQL, NoSQL, optimization
- Selected count badge: "X topics selected"
- Minimum selection: 1 channel required

**Interactions**:

- Click card → Toggle selection state
- Selected state: Primary border + "Selected" badge + subtle background tint
- Deselect: Click again or click "X" on badge

**Decision Point**:

```
[Min 1 Selected?] → NO → [Show validation message, disable Continue]
                          ↓
                         YES → [Enable Continue button]
```

**Animations**:

- Card toggle: 150ms scale(0.98) → scale(1) + border-color transition
- Badge appear: Scale from 0 → 1 with bounce (300ms)
- Count update: Number counter animation

### 1.5 Dashboard Customization Step

**Screen Description**: Content type preference cards.

**Visual Elements**:

- Heading: "How do you learn best?" (xl, bold)
- Subheading: "Choose content types to feature on your dashboard" (text-muted)
- Content type cards:
  - Questions (❓) - Multiple choice and open-ended
  - Flashcards (🎴) - Quick review cards
  - Exams (📝) - Simulated interview tests
  - Voice Practice (🎤) - Speaking practice
  - Coding (💻) - Code challenges
- All selected by default (optional selection)

**Interactions**:

- Click card → Toggle selection (similar to channels)
- "Select All" / "Clear All" quick actions

**Animations**:

- Same as channel selection cards

### 1.6 Completion Step

**Screen Description**: Success celebration screen.

**Visual Elements**:

- Large checkmark animation (confetti optional)
- Heading: "You're all set!" (3xl, bold)
- Summary card showing:
  - Selected theme (with icon)
  - Selected channels (as tags)
  - Content preferences (as icons)
- Two CTAs:
  - Primary: "Start Learning" → Navigate to dashboard
  - Secondary: "Explore Library" → Navigate to content page

**Animations**:

- Checkmark: Draw animation (500ms)
- Confetti: Particle explosion (if enabled)
- Cards: Staggered slide-up + fade-in

### 1.7 Success Metrics

| Metric                     | Target             |
| -------------------------- | ------------------ |
| Onboarding completion rate | > 80%              |
| Average time to complete   | < 2 minutes        |
| Theme selection rate       | > 90%              |
| Channel selection          | Average 3 channels |

### 1.8 Error Handling

| Error                    | Handling                             |
| ------------------------ | ------------------------------------ |
| localStorage unavailable | Fallback to session storage          |
| Form validation fail     | Inline error messages                |
| Network timeout          | Retry with exponential backoff       |
| Interrupted (tab close)  | Auto-save progress, resume on return |

---

## 2. Content Consumption Flow

### 2.1 Browse Phase

**Flow Diagram**:

```
[Content Library] → [Browse Grid]
                         ↓
              [Filter by Type/Channel]
                         ↓
                 [Sort Results]
                         ↓
                  [Select Item]
```

**Screen Description**: Grid view of content cards with sidebar filters.

**Visual Elements**:

- Page header: "Content Library" (2xl, bold) + result count
- Sidebar (left, collapsible on mobile):
  - Content Type filter (checkboxes)
  - Channel filter (checkboxes)
  - Difficulty filter (Easy/Medium/Hard)
  - Tags filter (searchable)
- Content grid (3 columns desktop, 2 tablet, 1 mobile):
  - Card: Title, description snippet, tags, difficulty badge, "Study →" link

**Interactions**:

- Filter checkbox → Instant filter with fade animation
- Hover card → Elevation + border highlight
- Click card → Navigate to detail/study view

**Animations**:

- Filter change: 200ms fade out → filter → fade in
- Card hover: 150ms translateY(-2px) + shadow increase
- Empty state: Fade in with "No results" message

### 2.2 Filter Phase

**Filter Options**:

- Content Type: Questions, Flashcards, Exams, Voice, Coding
- Channel: JavaScript, React, Python, DevOps, System Design, Database
- Difficulty: Easy, Medium, Hard
- Status: All, Completed, In Progress
- Tags: Multi-select from available tags

**Decision Points**:

```
[Filters Applied?] → NO → [Show all available content]
                         ↓
                        YES → [Apply filters, update URL params]
```

**URL Sync**: Filter state persists in URL (`?type=question&channel=react&difficulty=medium`)

### 2.3 Select Phase

**Card Click** → Navigate to content detail view based on type:

- Question → QuestionStudyPage
- Flashcard → FlashcardFlow
- Exam → ExamFlow
- Voice → VoicePracticeFlow
- Coding → CodingChallengeFlow

### 2.4 Consume Phase

Content-specific consumption (see individual flows below)

### 2.5 Complete Phase

**On Content Completion**:

1. Update progress in contentStore
2. Show completion celebration (checkmark + confetti for exams)
3. Display "What's Next" recommendations
4. Offer to continue or return to library

### 2.6 Progress Tracking

**Progress Bar**: Visual indicator on each content card

- Not started: Empty circle
- In progress: Half-filled circle
- Completed: Filled circle + checkmark

**Statistics Dashboard**:

- Total items completed
- Streak counter (consecutive days)
- Time spent learning
- Mastery level per channel

### 2.7 Next Recommendation Algorithm

```
[Completed Content] → [Find similar content by tags/channel]
                              ↓
                    [Prioritize: uncompleted → same difficulty]
                              ↓
                    [Display "Recommended for you" section]
```

### 2.8 Success Metrics

| Metric                | Target       |
| --------------------- | ------------ |
| Content library CTR   | > 15%        |
| Filter usage rate     | > 40%        |
| Completion rate       | > 60%        |
| Time to first content | < 30 seconds |

---

## 3. Study Session Flow

### 3.1 Start Session

**Screen Description**: Session configuration modal/card.

**Flow Diagram**:

```
[Start Session] → [Select Content Type]
                         ↓
              [Configure: Count, Difficulty, Timer]
                         ↓
                    [Begin Session]
                         ↓
              [Present Content Items]
                         ↓
                 [Track Progress]
                         ↓
                [Session Summary]
```

**Visual Elements**:

- Modal overlay with card
- Heading: "Start Study Session"
- Content type selector (radio buttons with icons)
- Configuration options:
  - Number of items: 5, 10, 20, All
  - Difficulty: Any, Easy, Medium, Hard
  - Timer: Off, 5min, 10min, 15min
- "Start" button (primary)
- "Cancel" button (secondary)

**Interactions**:

- Select type → Show type-specific options
- Configure settings → Update session preview
- Start → Close modal, begin session

### 3.2 Session Timer

**Timer Display**: Fixed position top bar (desktop) or floating (mobile)

**Visual Elements**:

- Time remaining: MM:SS format
- Progress ring around timer
- Pause button
- End session button (with confirmation)

**States**:

- Running: Normal color, animated ring
- Paused: Yellow color, paused animation
- Warning (<1min): Red color, pulse animation
- Expired: Modal auto-triggered

**Interactions**:

- Click pause → Freeze timer + blur content
- Resume → Unblur + continue
- Time up → Auto-submit with "Time's up!" modal

### 3.3 Question/Card Presentation

**Visual Elements**:

- Question number: "Question 3 of 10"
- Difficulty badge
- Progress bar
- Question content (varies by type)
- Navigation hints (previous/next)

**Content Types**:

- Multiple Choice: Question + 4 options
- True/False: Statement + True/False buttons
- Open-ended: Question + textarea

**Animations**:

- Question entrance: Slide from right (300ms, ease-out)
- Question exit: Slide to left (200ms, ease-in)
- Progress update: Width transition (300ms)

### 3.4 Answer/Submit

**Multiple Choice**:

- Click option → Highlight with primary border
- Click again → Deselect (allow change)
- Submit → Confirm selection + advance

**Open-ended**:

- Auto-save draft every 5 seconds
- Character count
- Submit → Move to next (no going back)

**Decision Point**:

```
[Can change answer?] → YES → [Allow click to change]
                            ↓
                           NO → [Show "Are you sure?" if different selection]
```

### 3.5 Session Summary

**Screen Description**: Results card with statistics.

**Visual Elements**:

- Session header: "Session Complete!" or "Session Summary"
- Score display: "X / Y correct" with percentage
- Time stats: Total time, average per question
- Performance breakdown:
  - By difficulty
  - By content type
  - Weak areas
- Recommendations for improvement
- Actions:
  - Review answers
  - Retry missed
  - Start new session
  - Return to dashboard

**Animations**:

- Score reveal: Counter animation from 0 to final
- Progress ring: Animated fill
- Confetti for >80% score

### 3.6 Success Metrics

| Metric                   | Target                  |
| ------------------------ | ----------------------- |
| Session start → complete | > 70%                   |
| Average session length   | 5-15 minutes            |
| Question accuracy trend  | Improving over sessions |

### 3.7 Error Handling

| Error                      | Handling                          |
| -------------------------- | --------------------------------- |
| Timer expires              | Auto-submit, show timeout message |
| Browser close mid-session  | Auto-save progress, offer resume  |
| Network error              | Offline mode with local storage   |
| No content matches filters | Suggest broadening criteria       |

---

## 4. Flashcard Flow

### 4.1 Flow Overview

**Flow Diagram**:

```
[Show Question] → [Think/Recall]
                        ↓
                 [Flip Card]
                        ↓
               [Show Answer]
                        ↓
              [Rate Difficulty]
                        ↓
        [Next Card] ← [Spaced Repetition Logic]
                        ↓
              [Deck Complete]
```

### 4.2 Show Question

**Visual Elements**:

- Card container (centered, max-width 600px)
- Card face (front):
  - Question/prompt text (lg, centered)
  - Tags (bottom, subtle)
  - "Tap to flip" hint (mobile) or "Press Space" hint (desktop)
  - Card number: "Card 5 of 20"

**Interactions**:

- Click/tap card → Flip animation
- Press Space → Flip animation
- Keyboard: R for "Again", E for "Easy", H for "Hard"

**Animations**:

- Card entrance: Slide up + fade in (300ms)
- Flip: 3D Y-axis rotation (400ms, ease-in-out)

### 4.3 Think/Recall Phase

**Duration**: User-controlled (no timer by default)

**Visual Elements**:

- Question displayed
- Subtle pulsing border (indicating "thinking" state)
- Optional: "Show Hint" button (if hints available)

**Interactions**:

- User mentally recalls answer
- Flip when ready

### 4.4 Flip to Reveal Answer

**Animation Sequence**:

1. Card rotates 90° on Y-axis (half flip)
2. Content switches from question to answer at 90°
3. Complete rotation to 180°
4. Answer revealed

**Visual Elements**:

- Card face (back):
  - Answer text (lg, centered)
  - Source/reference link (if available)
  - Difficulty rating buttons:
    - Again (red) - Review in 1 minute
    - Hard (orange) - Review in 10 minutes
    - Easy (green) - Review tomorrow

**Keyboard Shortcuts**:

- Space: Flip card
- 1: Again
- 2: Hard
- 3: Good
- 4: Easy

### 4.5 Rate Difficulty

**Spaced Repetition Algorithm** (SM-2 variant):

```javascript
// Intervals based on rating
const intervals = {
  again: 1 * 60 * 1000, // 1 minute
  hard: 10 * 60 * 1000, // 10 minutes
  good: calculateGoodInterval(lastInterval, easeFactor),
  easy: calculateEasyInterval(lastInterval, easeFactor),
};

// Update ease factor based on rating
const newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - rating) * 0.08));
```

**Visual Feedback**:

- Again: Red highlight, "See you soon!"
- Hard: Orange highlight, "Review soon"
- Good: Green highlight, "Got it!"
- Easy: Blue highlight, "Perfect!"

### 4.6 Spaced Repetition Logic

**Queue Management**:

1. Cards sorted by due date
2. New cards introduced based on daily limit (default: 20)
3. Review cards shown until queue empty or session ends

**State Persistence**:

```javascript
// Card progress stored per card
{
  id: string,
  easeFactor: number,        // Default: 2.5
  interval: number,           // Days until next review
  repetitions: number,       // Successful reviews in a row
  dueDate: timestamp,
  lastReviewed: timestamp
}
```

### 4.7 Deck Complete

**Visual Elements**:

- Celebration animation
- Stats summary:
  - Cards reviewed
  - Time spent
  - Accuracy (again/hard/good/easy breakdown)
- "You're done for now!" message
- Due cards count for later

**Actions**:

- "Review Again" → Restart with due cards
- "Take a Break" → Return to dashboard
- "See Statistics" → Detailed stats page

### 4.8 Success Metrics

| Metric                | Target             |
| --------------------- | ------------------ |
| Card completion rate  | > 75%              |
| Retention rate        | > 85% after 7 days |
| Average time per card | 15-30 seconds      |
| "Easy" rating %       | > 50% (improving)  |

---

## 5. Exam Flow

### 5.1 Flow Overview

**Flow Diagram**:

```
[Start Exam] → [Time Limit Display]
                        ↓
                 [Instructions]
                        ↓
              [Question Navigation]
                        ↓
              [Flag for Review]
                        ↓
                 [Submit Exam]
                        ↓
              [Results Breakdown]
```

### 5.2 Start Exam

**Pre-Exam Screen**:

**Visual Elements**:

- Exam header: Title + difficulty level
- Exam details card:
  - Total questions
  - Time limit (e.g., "30 minutes")
  - Passing score
  - Question types included
- Instructions panel:
  - "Read each question carefully"
  - "Click an option to select"
  - "Flag questions to review"
  - "Submit when ready"
- "Are you ready?" confirmation
- "Begin Exam" button (primary, large)
- "Practice Mode" link (no timer)

**Timer Warning Modal**:

- Appears if time < 5 minutes remaining
- "5 minutes left" prominent display
- Options: "Continue" or "Submit Now"

### 5.3 Time Limit Display

**Visual Elements**:

- Fixed header bar:
  - Timer (large, monospace): MM:SS
  - Progress: "Question X of Y"
  - Submit button (right side)
- Timer colors:
  - Normal: Default text color
  - Warning (<5min): Warning color
  - Critical (<1min): Error color, pulsing

**Countdown Behavior**:

```
[Time > 5 min] → Normal display
[Time <= 5 min] → Warning state + modal
[Time <= 1 min] → Critical state + pulse
[Time = 0] → Auto-submit + "Time's Up" modal
```

### 5.4 Question Navigation

**Question Card**:

**Visual Elements**:

- Question number + difficulty badge
- Question text (lg)
- Options (A, B, C, D):
  - Radio button style
  - Full-width clickable areas
  - Selected state: Primary border + background tint
- Navigation footer:
  - Previous button (if not first)
  - Next button (if not last)
  - "Flag for Review" toggle

**Option Interactions**:

- Click option → Select (radio fills)
- Click different option → Change selection
- Selected option shows checkmark

### 5.5 Flag Questions for Review

**Flag Toggle**:

- Icon button with flag
- Unflagged: Outline flag (muted)
- Flagged: Filled flag (warning color)

**Flagged Questions**:

- Yellow border on navigator button
- Listed separately in "Flagged for Review" section
- Filter view: "Show flagged only"

**Navigator Grid**:

```
[1][2][3][🔶4][5]
[6][7][8][9][10]
[11][12][🔶13][14][15]
```

### 5.6 Submit Exam

**Pre-Submit Modal**:

**Visual Elements**:

- Warning icon
- Question count: "You have answered X of Y questions"
- Unanswered: "X questions unanswered"
- Flagged: "X questions flagged for review"
- Options:
  - "Review Questions" → Close modal, go to first unanswered
  - "Submit Exam" → Confirm submission
  - "Cancel" → Return to exam

**Confirmation Dialog**:

- "Are you sure you want to submit?"
- "This action cannot be undone"
- "Submit" and "Cancel" buttons

**Auto-Submit**:

- Triggered when timer reaches 0
- Shows "Time's Up!" overlay
- Auto-navigates to results

### 5.7 Results Breakdown

**Results Screen**:

**Visual Elements**:

- Score header:
  - Large percentage (e.g., "85%")
  - Pass/Fail badge
  - "X of Y correct"
- Stats grid:
  - Time taken
  - Questions answered
  - Accuracy by difficulty
  - Accuracy by topic
- Question review:
  - Expandable accordion
  - Each question shows:
    - Question text
    - Your answer
    - Correct answer
    - Explanation (if available)
    - Status: ✓ Correct / ✗ Incorrect

**Score Thresholds**:

- < 60%: Fail (red)
- 60-79%: Pass (yellow)
- 80-100%: Pass with distinction (green)

### 5.8 Success Metrics

| Metric                  | Target              |
| ----------------------- | ------------------- |
| Exam completion rate    | > 85%               |
| Average score           | 70% (growing)       |
| Time utilization        | 80-95% of time used |
| Improvement per attempt | > 5%                |

---

## 6. Voice Practice Flow

### 6.1 Flow Overview

**Flow Diagram**:

```
[Prompt Display] → [Record Answer]
                        ↓
                [Playback Recording]
                        ↓
                [Self-Evaluate]
                        ↓
           [AI Feedback / Tips]
                        ↓
                  [Next Prompt]
```

### 6.2 Prompt Display

**Visual Elements**:

- Split layout:
  - Left: Prompt list (sidebar)
  - Right: Practice area
- Practice card:
  - Title (e.g., "Explain Closures")
  - Prompt text (lg, prominent)
  - Duration target (e.g., "⏱️ 60 seconds")
  - Difficulty badge
  - Tips toggle

**Prompt Card States**:

- Available: Default style
- Recording: Red border, pulsing
- Completed: Green checkmark, muted
- In Progress: Yellow dot

### 6.3 Record Answer

**Recording Interface**:

**Visual Elements**:

- Large timer display: MM:SS
- Recording indicator: Pulsing red dot + "Recording..."
- Waveform visualization (optional)
- Control buttons:
  - Start/Stop (large, centered)
  - Pause (secondary)

**States**:

```
[Ready] → [Recording] → [Paused] → [Complete]
  ↓          ↓             ↓
[Start]   [Stop/Pause]  [Resume/Stop]
```

**Permissions**:

- Request microphone access
- Handle denial gracefully:
  - Show instructions
  - Offer text-based alternative

**Error Handling**:

- Microphone denied: "Enable microphone to practice"
- Recording fails: Retry button + error message

### 6.4 Playback Recording

**Playback Controls**:

- Play/Pause button
- Progress bar with scrubber
- Time display: Current / Total
- Speed control: 0.5x, 1x, 1.5x, 2x

**Visual Feedback**:

- Waveform display of recording
- Current position indicator
- Highlights as audio plays

**Interactions**:

- Play → Animate play button to pause
- Scrub → Jump to position
- Speed → Update playback rate

### 6.5 Self-Evaluate

**Self-Evaluation Form**:

**Visual Elements**:

- Rating questions:
  - How clear was your explanation? (1-5 stars)
  - How confident did you sound? (1-5 stars)
  - How well did you structure your answer? (1-5 stars)
- Notes field (optional)
- "Compare to Tips" button

**Rating Interaction**:

- Click star → Fill stars up to clicked
- Hover → Preview rating
- Stars animate on selection

### 6.6 AI Feedback / Tips

**Feedback Display**:

**Visual Elements**:

- Score bars:
  - Clarity (0-100%)
  - Speaking Speed (0-100%)
  - Confidence (0-100%)
- Animated fill on reveal
- Improvement suggestions:
  - Bulleted list
  - Specific, actionable tips
- Overall assessment card:
  - Performance summary
  - Key strength
  - Focus area

**Reference Materials**:

- Link to related content
- Example transcripts
- Video tutorials (if available)

### 6.7 Tips/References

**Tips Card**:

**Visual Elements**:

- Expandable sections:
  - "What to Include"
  - "Common Mistakes"
  - "Structure Guide"
- Example answer (audio or transcript)
- "Practice Again" button

**Content Examples**:

- "Start with a definition"
- "Use a simple example"
- "Explain the 'why' not just the 'what'"

### 6.8 Success Metrics

| Metric                   | Target              |
| ------------------------ | ------------------- |
| Recordings per session   | 3-5                 |
| Average recording length | 45-90 seconds       |
| Self-evaluation accuracy | Improving over time |
| Feedback utilization     | > 70% read tips     |

---

## 7. Coding Challenge Flow

### 7.1 Flow Overview

**Flow Diagram**:

```
[Read Problem] → [Code in Editor]
                        ↓
                   [Run Tests]
                        ↓
                [View Results]
                        ↓
           [Submit / View Solution]
                        ↓
              [Analysis & Next]
```

### 7.2 Read Problem

**Problem Display**:

**Visual Elements**:

- Two-panel layout:
  - Left: Problem description
  - Right: Code editor
- Problem card:
  - Title (e.g., "Two Sum")
  - Difficulty badge (Easy/Medium/Hard)
  - Acceptance rate (e.g., "45% accepted")
  - Tags (e.g., Array, Hash Table)
  - Description (markdown rendered)
  - Examples (input/output pairs)
  - Constraints
  - Hints (collapsible)

**Description Sections**:

- Problem statement
- Examples (with syntax highlighting)
- Constraints
- Follow-up (optional)

### 7.3 Code in Editor

**Editor Interface**:

**Visual Elements**:

- Monaco editor (VS Code style)
- Language selector: JavaScript, Python, TypeScript, Go, etc.
- Theme: Matches app theme (light/dark)
- Line numbers
- Syntax highlighting
- Auto-complete suggestions

**Toolbar**:

- Run Tests button
- Reset Code button
- Settings (font size, tab size)
- Fullscreen toggle

**Default Code**:

```javascript
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // Your code here
}
```

**Interactions**:

- Type code → Syntax validation in real-time
- Ctrl+Enter → Run tests
- Ctrl+S → Save (local storage)
- Format button → Auto-format code

### 7.4 Run Tests

**Execution Flow**:

```
[Run Tests] → [Show Loading]
                    ↓
           [Execute Code (sandbox)]
                    ↓
            [Compare Output]
                    ↓
         [Display Results]
```

**Loading State**:

- Overlay: "Running tests..."
- Progress indicator
- Test count: "Running 3/10..."

**Test Results Panel**:

**Visual Elements**:

- Test case list:
  - ✓ Test 1: Passed
  - ✗ Test 2: Failed (Expected X, Got Y)
  - ✓ Test 3: Passed
- Summary:
  - X/Y tests passed
  - Execution time: Xms
  - Memory: Xmb

**Test Case Display**:

- Input
- Expected Output
- Your Output
- Status (Pass/Fail)
- Expandable for details

### 7.5 Error States

**Runtime Error**:

- Error message highlighted
- Line number indicated
- Stack trace (simplified)

**Timeout**:

- "Time limit exceeded"
- Suggest optimization

**Syntax Error**:

- Line and column indicated
- Error description

**Wrong Answer**:

- Show expected vs actual
- Highlight differences

### 7.6 Submit Solution

**Submission States**:

```
[All Tests Pass] → [Submit] → [Accepted! ✓]
        ↓
[Some Tests Fail] → [Try Again] or [View Hints]
        ↓
[Edge Cases] → [View Solution]
```

**Acceptance Modal**:

- "Accepted!" celebration
- Stats:
  - Runtime
  - Memory
  - Ranking (percentile)
- Options:
  - "View Solution"
  - "Next Challenge"
  - "Share"

### 7.7 View Solution/Analysis

**Solution Page**:

**Visual Elements**:

- Your solution (collapsible)
- Best solution (if available)
- Comparison view (side-by-side)
- Complexity analysis:
  - Time: O(n)
  - Space: O(1)
- Community solutions (upvote/sort)

**Analysis Features**:

- Code explanation
- Alternative approaches
- Trade-offs
- Related problems

### 7.8 Success Metrics

| Metric                   | Target                  |
| ------------------------ | ----------------------- |
| First-attempt success    | > 30%                   |
| Problems completed/week  | 5-10                    |
| Average time per problem | 15-30 minutes           |
| Improvement trend        | Solving harder problems |

---

## Appendix A: Animation Specifications

### A.1 Transition Timing

| Type                      | Duration | Easing            |
| ------------------------- | -------- | ----------------- |
| Micro (hover, focus)      | 150ms    | ease-out          |
| Small (expand, collapse)  | 200ms    | ease-in-out       |
| Medium (page transitions) | 300ms    | ease-out          |
| Large (modals, drawers)   | 400ms    | spring(1, 80, 10) |

### A.2 Reduced Motion

All animations respect `prefers-reduced-motion`:

- Instant transitions when enabled
- No parallax effects
- No auto-playing animations

### A.3 Loading States

| Component      | Animation                   |
| -------------- | --------------------------- |
| Skeleton       | Pulse opacity (1 → 0.5 → 1) |
| Spinner        | Rotate 360° continuous      |
| Progress       | Width transition            |
| Skeleton cards | Staggered fade              |

### A.4 Success/Error Feedback

| Event   | Animation                         |
| ------- | --------------------------------- |
| Success | Scale 1 → 1.1 → 1 + checkmark     |
| Error   | Shake (translateX -5px → 5px → 0) |
| Warning | Pulse border                      |
| Loading | Fade + skeleton                   |

---

## Appendix B: Error Handling Matrix

| Flow       | Error Type        | User Message                      | Recovery Action              |
| ---------- | ----------------- | --------------------------------- | ---------------------------- |
| Onboarding | localStorage fail | "Progress saved for this session" | Continue without persistence |
| Content    | API timeout       | "Content taking longer to load"   | Retry button                 |
| Flashcard  | Save fail         | "Couldn't save progress"          | Auto-retry + manual save     |
| Exam       | Timer fail        | "Timer paused"                    | Resume on interaction        |
| Voice      | Mic denied        | "Microphone access required"      | Instructions + settings link |
| Coding     | Run fail          | "Execution error"                 | Show error details           |

---

## Appendix C: Keyboard Shortcuts

| Flow      | Shortcut     | Action             |
| --------- | ------------ | ------------------ |
| Global    | `/`          | Focus search       |
| Global    | `Esc`        | Close modal/drawer |
| Flashcard | `Space`      | Flip card          |
| Flashcard | `1-4`        | Rate difficulty    |
| Exam      | `1-4`        | Select answer      |
| Exam      | `F`          | Flag question      |
| Coding    | `Ctrl+Enter` | Run tests          |
| Coding    | `Ctrl+S`     | Save code          |

---

**End of Document**
