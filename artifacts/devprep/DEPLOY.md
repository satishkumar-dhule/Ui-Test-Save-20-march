# GitHub Pages Deployment Guide

## Overview

This guide covers deploying DevPrep to GitHub Pages.

## Configuration

### Repository Settings

1. Go to **Settings > Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on push to `main`

### Environment Variables

The build uses these environment variables:

| Variable       | Default                                   | Description                               |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| `BASE_PATH`    | `/DevPrep/` (if GITHUB_PAGES=true) or `/` | Base path for assets                      |
| `GITHUB_PAGES` | `false`                                   | Set to `true` to enable GitHub Pages mode |
| `VITE_API_URL` | -                                         | API endpoint URL for production           |

## Build Commands

```bash
# Build for local development
pnpm run build:local

# Build for GitHub Pages (outputs to dist/)
pnpm run build:github

# Preview GitHub Pages build locally
pnpm run preview:github
```

## Local Testing

Test the GitHub Pages build locally:

```bash
pnpm run build:github
pnpm run preview:github
```

Access at: `http://localhost:4173/DevPrep/`

## GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`):

1. Triggers on push to `main` or manual workflow dispatch
2. Builds with `BASE_PATH=/DevPrep/`
3. Deploys to GitHub Pages

## API Configuration

For production API access, set the `API_URL` repository variable in GitHub:

1. Go to **Settings > Variables > Actions**
2. Add `API_URL` with your production API endpoint

## Troubleshooting

### 404 on Navigation

If routes show 404, ensure `base` is correctly set in `vite.config.ts`:

```typescript
const basePath = process.env.BASE_PATH || '/'
```

### Assets Not Loading

Check browser console for 404 errors on JS/CSS files. The base path should match your repository name.

### API Calls Failing

Verify `VITE_API_URL` is set correctly in repository variables.
