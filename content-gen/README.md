# DevPrep Content Generator

Generates realistic study content using **opencode-ai** and stores it in a local SQLite database (`data/devprep.db`). The DevPrep API server reads from this database and exposes the content at `/api/content`. The frontend automatically merges generated + static content at runtime.

## Pipeline

```
opencode-ai CLI  →  content-gen/generate-content.mjs  →  data/devprep.db
                                                              ↓
                                          artifacts/api-server  →  /api/content
                                                              ↓
                                          artifacts/devprep frontend (merged)
```

## Setup

Install dependencies:

```bash
cd content-gen
npm install
```

Make sure `opencode` is configured on your machine. Run `opencode` interactively first to set up your provider (Anthropic, OpenAI, etc.).

## Local Usage

```bash
# Auto-detect the channel with the lowest content count, generate 1 item
node generate-content.mjs

# Generate a coding challenge for JavaScript
TARGET_CHANNEL=javascript CONTENT_TYPE=coding node generate-content.mjs

# Generate a flashcard for AWS SAA
TARGET_CHANNEL=aws-saa CONTENT_TYPE=flashcard node generate-content.mjs

# Generate 3 items for algorithms
TARGET_CHANNEL=algorithms COUNT=3 node generate-content.mjs
```

## Environment Variables

| Variable         | Default          | Description                                                                                                                                      |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CONTENT_TYPE`   | `auto`           | `auto`, `question`, `flashcard`, `exam`, `voice`, `coding`                                                                                       |
| `TARGET_CHANNEL` | _(lowest)_       | Channel ID: `javascript`, `react`, `algorithms`, `devops`, `kubernetes`, `networking`, `system-design`, `aws-saa`, `aws-dev`, `cka`, `terraform` |
| `COUNT`          | `1`              | Number of items to generate                                                                                                                      |
| `OPENCODE_MODEL` | opencode default | Override model e.g. `anthropic/claude-3-5-haiku`                                                                                                 |

## GitHub Actions

The workflow runs **daily at 3 AM UTC** and can be triggered manually from the Actions tab.

Required GitHub secrets:

- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (depending on your opencode provider)
- `OPENCODE_MODEL` (optional, defaults to `anthropic/claude-3-5-haiku`)

After each run, if new content was generated, the workflow commits `data/devprep.db` back to the repo.

## Content Types

| Type        | Description                           | Threshold       |
| ----------- | ------------------------------------- | --------------- |
| `question`  | Rich Q&A with code, ELI5              | 5 items/channel |
| `flashcard` | Flip cards with hints and code        | 5 items/channel |
| `exam`      | Scenario-based MCQ with explanation   | 5 items/channel |
| `voice`     | Interview prompts with key points     | 5 items/channel |
| `coding`    | Split-pane challenges with test cases | 5 items/channel |
