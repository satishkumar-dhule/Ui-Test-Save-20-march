# Contributing

Thank you for your interest in contributing to this project!

## Development Setup

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Docker and Docker Compose (for local services)
- Git

### Initial Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/satishkumar-dhule/Ui-Test-Save-20-march.git
   cd Ui-Test-Save-20-march
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start local services (Redis):

   ```bash
   docker compose -f docker-compose.redis.yml up -d
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

### Project Structure

```
├── artifacts/
│   └── devprep/        # Main React application
├── content-gen/       # Content generation scripts
├── docs/              # Documentation
├── e2e/               # End-to-end tests
├── lib/               # Shared libraries
└── scripts/           # Build and utility scripts
```

## Code Style

### Prettier

This project uses Prettier for code formatting. Configuration is in `artifacts/devprep/.prettierrc`.

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Run formatting:

```bash
bun run format
```

### TypeScript

- Use strict TypeScript with explicit types
- Avoid `any` type
- Use interfaces for object shapes
- Export types for public APIs

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type     | Description                     |
| -------- | ------------------------------- |
| feat     | New feature                     |
| fix      | Bug fix                         |
| docs     | Documentation changes           |
| style    | Formatting, missing semi colons |
| refactor | Code restructuring              |
| perf     | Performance improvements        |
| test     | Adding or updating tests        |
| chore    | Maintenance, dependencies       |

### Examples

```
feat(content): add new question generator
fix(api): handle JSON parse errors gracefully
docs(readme): update installation instructions
refactor(dashboard): extract widget components
```

## Pull Request Process

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** following the code style guidelines

3. **Write tests** for new functionality

4. **Run checks**:

   ```bash
   bun run typecheck
   bun run lint
   bun run test
   ```

5. **Commit** using conventional format

6. **Push and create PR**:

   ```bash
   git push origin feat/my-feature
   ```

7. **Describe changes** in the PR:
   - What problem does it solve?
   - How is it tested?
   - Any breaking changes?

## Testing

### Run All Tests

```bash
bun test
```

### Run E2E Tests

```bash
bun run e2e
```

### Run with UI

```bash
bun run e2e:ui
```

## Build and Deployment

### Build for Production

```bash
bun run build
```

### Deploy to Cloudflare

Preview deployment:

```bash
bun run deploy:cf:preview
```

Production deployment:

```bash
bun run deploy:cf:build
```

### Local Production Preview

```bash
bun run cf:dev
```

## Additional Resources

- [Project Documentation](./docs/)
- [V2 Documentation](./README-V2.md)
- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Content Standards](./CONTENT_STANDARDS.md)
