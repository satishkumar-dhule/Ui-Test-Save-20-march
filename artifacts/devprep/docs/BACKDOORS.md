# Query String Backdoors

> **⚠️ TESTING-ONLY FEATURE**
> These backdoors are only active in **development mode** (`import.meta.env.DEV`).
> They are completely stripped from production builds.

Query string backdoors allow testers and developers to jump directly to specific pages, states, or features without going through the normal user flow.

---

## Quick Reference

| Query String           | Effect                       | Example                 |
| ---------------------- | ---------------------------- | ----------------------- |
| `?page=dashboard`      | Navigate to dashboard        | `/?page=dashboard`      |
| `?page=content`        | Navigate to content page     | `/?page=content`        |
| `?page=exam`           | Navigate to exam page        | `/?page=exam`           |
| `?page=coding`         | Navigate to coding challenge | `/?page=coding`         |
| `?page=voice`          | Navigate to voice practice   | `/?page=voice`          |
| `?page=onboarding`     | Show onboarding page         | `/?page=onboarding`     |
| `?channel=devops`      | Pre-select channel           | `/?channel=devops`      |
| `?content=question`    | Pre-select content type      | `/?content=question`    |
| `?tab=questions`       | Pre-select tab               | `/?tab=questions`       |
| `?generate=true`       | Auto-open generate modal     | `/?generate=true`       |
| `?theme=dark`          | Set theme                    | `/?theme=dark`          |
| `?skipOnboarding=true` | Skip onboarding              | `/?skipOnboarding=true` |

---

## Available Channels

Use these channel IDs with the `?channel=` parameter:

| Channel ID      | Name                       | Type |
| --------------- | -------------------------- | ---- |
| `javascript`    | JavaScript                 | Tech |
| `typescript`    | TypeScript                 | Tech |
| `react`         | React                      | Tech |
| `vue`           | Vue.js                     | Tech |
| `angular`       | Angular                    | Tech |
| `node`          | Node.js                    | Tech |
| `python`        | Python                     | Tech |
| `java`          | Java                       | Tech |
| `go`            | Go                         | Tech |
| `rust`          | Rust                       | Tech |
| `algorithms`    | Algorithms                 | Tech |
| `system-design` | System Design              | Tech |
| `devops`        | DevOps                     | Tech |
| `kubernetes`    | Kubernetes                 | Tech |
| `networking`    | Networking                 | Tech |
| `sql`           | SQL                        | Tech |
| `postgresql`    | PostgreSQL                 | Tech |
| `docker`        | Docker                     | Tech |
| `aws-saa`       | AWS Solutions Architect    | Cert |
| `aws-dev`       | AWS Developer              | Cert |
| `aws-ai`        | AWS AI Practitioner        | Cert |
| `cka`           | Certified Kubernetes Admin | Cert |
| `terraform`     | HashiCorp Terraform        | Cert |

---

## Content Types

Use with `?content=` parameter:

| Value       | Description    |
| ----------- | -------------- |
| `question`  | Q&A questions  |
| `flashcard` | Flashcards     |
| `exam`      | Exam questions |

---

## Tabs

Use with `?tab=` parameter:

| Value       | Maps To            |
| ----------- | ------------------ |
| `questions` | Q&A section        |
| `cards`     | Flashcards section |
| `exams`     | Exam section       |

---

## Themes

Use with `?theme=` parameter:

| Value           | Description        |
| --------------- | ------------------ |
| `light`         | Light theme        |
| `dark`          | Dark theme         |
| `high-contrast` | High contrast mode |

---

## Usage Examples

### Jump to DevOps Dashboard

```
http://localhost:5173/?page=dashboard&channel=devops
```

### Test AWS Exam with Dark Mode

```
http://localhost:5173/?page=exam&channel=aws-saa&theme=dark
```

### Skip Onboarding with Specific Channels

```
http://localhost:5173/?skipOnboarding=true&channel=javascript&channel=react
```

### Test Generate Modal

```
http://localhost:5173/?page=content&generate=true
```

### Quick Start with Multiple Filters

```
http://localhost:5173/?page=dashboard&channel=devops&content=question&tab=questions
```

### Test High Contrast Accessibility

```
http://localhost:5173/?theme=high-contrast
```

---

## API Reference

### `useQueryBackdoor(config?)`

Main hook for processing query backdoors.

```typescript
import { useQueryBackdoor } from '@/utils/queryBackdoor'

function MyComponent() {
  const { state, logs, clearParams } = useQueryBackdoor({
    clearAfterProcessing: true,
    logToConsole: true,
  })

  return (
    <>
      {/* Your component */}
      {state.active && <BackdoorIndicator log={logs} active={true} />}
    </>
  )
}
```

#### Parameters

| Name                   | Type      | Default | Description                         |
| ---------------------- | --------- | ------- | ----------------------------------- |
| `clearAfterProcessing` | `boolean` | `true`  | Clear query params after processing |
| `logToConsole`         | `boolean` | `true`  | Log activations to console          |
| `showIndicator`        | `boolean` | `true`  | Show visual indicator               |

#### Returns

| Property      | Type            | Description                        |
| ------------- | --------------- | ---------------------------------- |
| `state`       | `BackdoorState` | Current backdoor state             |
| `logs`        | `BackdoorLog[]` | Log entries of activated backdoors |
| `clearParams` | `() => void`    | Function to clear backdoor params  |

---

### `createBackdoorUrl(params)`

Create a backdoor URL programmatically.

```typescript
import { createBackdoorUrl } from '@/utils/queryBackdoor'

const url = createBackdoorUrl({
  page: 'dashboard',
  channel: 'devops',
  theme: 'dark',
})
// Returns: "http://localhost:5173/?page=dashboard&channel=devops&theme=dark"
```

---

### `BACKDOOR_SCENARIOS`

Predefined test scenarios for quick testing.

```typescript
import { BACKDOOR_SCENARIOS } from '@/utils/queryBackdoor'

// Jump to DevOps dashboard
BACKDOOR_SCENARIOS.devopsTest()

// Jump to AWS exam
BACKDOOR_SCENARIOS.awsExamTest()

// Skip onboarding with channels
BACKDOOR_SCENARIOS.quickStart(['javascript', 'react'])

// Test dark mode
BACKDOOR_SCENARIOS.darkModeTest()
```

#### Available Scenarios

| Function               | Description                            |
| ---------------------- | -------------------------------------- |
| `devopsTest()`         | Jump to DevOps dashboard               |
| `awsExamTest()`        | Jump to AWS exam prep                  |
| `codingTest()`         | Jump to coding challenges              |
| `voiceTest()`          | Jump to voice practice                 |
| `quickStart(channels)` | Skip onboarding with specific channels |
| `generateModalTest()`  | Open generate modal on content page    |
| `darkModeTest()`       | Test dark mode                         |
| `highContrastTest()`   | Test high contrast mode                |

---

## Visual Indicator

When a backdoor is active, a small indicator appears in the bottom-right corner:

- Shows "Dev Backdoor" with a lock icon
- Displays which backdoors were activated
- Expandable to see all activated parameters
- Auto-hides after 5 seconds (can be dismissed)
- **Only visible in development mode**

---

## How It Works

1. On app mount, `useQueryBackdoor` parses URL search params
2. Validates parameters against allowed values
3. Applies state changes to the store
4. Logs activation to console (in dev mode)
5. Shows visual indicator
6. Clears URL params (optional)

---

## Security Notes

- Backdoors are **completely disabled in production**
- Checked via `import.meta.env.DEV`
- No server-side validation needed
- Safe to leave in codebase

---

## File Structure

```
src/
├── utils/
│   └── queryBackdoor.ts          # Main backdoor utility
├── components/
│   └── debug/
│       └── BackdoorIndicator.tsx  # Visual indicator component
└── App.tsx                        # Integration point
```

---

## Extending Backdoors

To add new backdoor parameters:

1. Add to `VALID_PAGES`, `VALID_TABS`, etc. in `queryBackdoor.ts`
2. Add parsing in `parseBackdoorParams()`
3. Add application logic in `applyBackdoorState()`
4. Update TypeScript types
5. Document in this file
