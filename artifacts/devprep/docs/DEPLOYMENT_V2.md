# DevPrep V2 Deployment Guide

## Overview

This document outlines the deployment configuration for DevPrep V2 UI, including build targets, environment setup, CI/CD pipelines, and production optimization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT PIPELINE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ Development │───▶│  Staging    │───▶│ Production  │              │
│  │  (Local)    │    │  (Preview)  │    │  (Live)     │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│        │                   │                   │                     │
│        ▼                   ▼                   ▼                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  vite dev   │    │  Netlify/   │    │   Nginx     │              │
│  │  :5173      │    │  Vercel     │    │   Docker    │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│        │                   │                   │                     │
│        ▼                   ▼                   ▼                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  HMR Fast   │    │  Preview    │    │   CDN       │              │
│  │  Refresh    │    │  Branch     │    │   Cached    │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Build Targets

### 1. Development (Local)

```bash
# Standard development
pnpm run dev

# V2 development with new config
pnpm run dev:v2

# V2 with staging environment
pnpm run dev:v2:staging
```

### 2. Staging

```bash
# Build for staging environment
pnpm run build:staging

# Preview staging build
pnpm run serve:v2
```

**Environment Variables:**
- `STAGING=true`
- `NODE_ENV=production`
- Sourcemaps enabled
- Console logging preserved

### 3. Production

```bash
# Production build
pnpm run build:production

# GitHub Pages build
pnpm run build:github:v2

# Local production build
pnpm run build:local:v2
```

**Environment Variables:**
- `NODE_ENV=production`
- Sourcemaps disabled
- Console logging removed
- Terser minification enabled

### 4. GitHub Pages

```bash
# Build for GitHub Pages
pnpm run build:github:v2

# Deploy to GitHub Pages
pnpm run deploy:v2
```

**Configuration:**
- Base path: `/DevPrep/`
- Static asset optimization
- PWA service worker disabled for GH Pages

## Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `BASE_PATH` | Base URL path | `/` | `/DevPrep/` |
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` | `https://api.devprep.com` |
| `CDN_URL` | CDN base URL | - | `https://cdn.devprep.com` |
| `STAGING` | Staging mode flag | `false` | `true` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Dev server port | `5173` | `3000` |
| `ENABLE_PWA_DEV` | Enable PWA in dev | `false` | `true` |
| `GITHUB_PAGES` | GitHub Pages mode | `false` | `true` |
| `SENTRY_DSN` | Error tracking | - | `https://...@sentry.io/...` |

### Creating Environment Files

```bash
# Development
cp .env.example .env.local

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

## Docker Deployment

### Build Docker Image

```bash
# Build V2 image
pnpm run docker:build:v2

# Build with custom arguments
docker build \
  -f Dockerfile.v2 \
  --build-arg BASE_PATH=/ \
  --build-arg NODE_ENV=production \
  --build-arg CDN_URL=https://cdn.devprep.com \
  -t devprep:v2 .
```

### Run Docker Container

```bash
# Run with default settings
pnpm run docker:run:v2

# Run with custom environment
docker run -d \
  -p 3000:3000 \
  -e VITE_API_URL=https://api.devprep.com \
  -e CDN_URL=https://cdn.devprep.com \
  --name devprep-v2 \
  devprep:v2
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.v2
      args:
        - BASE_PATH=/
        - NODE_ENV=production
        - CDN_URL=https://cdn.devprep.com
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=https://api.devprep.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## CDN Configuration

### Asset Optimization

V2 builds are optimized for CDN delivery:

1. **Static Assets**: All static assets include content hashes for cache busting
2. **Chunk Splitting**: Vendor and page chunks are separated for optimal caching
3. **Gzip Compression**: Nginx configured with gzip for text assets
4. **Cache Headers**: Long-term caching for immutable assets

### CDN Environment Setup

```bash
# Set CDN URL for production
export CDN_URL=https://cdn.devprep.com
export VITE_API_URL=https://api.devprep.com

# Build with CDN support
pnpm run build:production
```

### Nginx CDN Configuration

The included `v2-optimizations.conf` provides:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;

# Cache control
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

## PWA Configuration

### Production PWA Setup

V2 includes enhanced PWA support:

1. **Service Worker**: Auto-generated with Workbox
2. **Manifest**: Complete manifest with icons
3. **Offline Support**: Critical assets cached
4. **Update Strategy**: Prompt-based updates

### PWA Build

```bash
# Build with PWA enabled
pnpm run build:pwa

# Generate PWA icons
pnpm run pwa:generate-icons
```

### PWA Caching Strategy

| Asset Type | Strategy | Duration |
|------------|----------|----------|
| Fonts (Google) | CacheFirst | 1 year |
| Static Assets | CacheFirst | 30 days |
| API Requests | NetworkFirst | 1 day |
| Images | CacheFirst | 30 days |

## CI/CD Pipeline

### GitHub Actions Workflow

The `deploy-v2.yml` workflow includes:

1. **Multi-environment builds** (staging, production)
2. **Docker image building** and pushing
3. **GitHub Pages deployment** for PR previews
4. **Performance testing** with Lighthouse
5. **Security scanning** with Trivy

### Workflow Triggers

```yaml
on:
  push:
    branches: ['main', 'release/*']
  pull_request:
    branches: ['main']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
```

### Environment Secrets

| Secret | Description | Required |
|--------|-------------|----------|
| `DOCKER_USERNAME` | Docker Hub username | Yes |
| `DOCKER_PASSWORD` | Docker Hub password | Yes |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | No |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI token | No |

## Performance Optimization

### Build Optimizations

1. **Terser Minification**: Advanced compression with dead code elimination
2. **Code Splitting**: Vendor, pages, and components separated
3. **Asset Inlining**: Small assets inlined as base64
4. **Tree Shaking**: Unused code removed
5. **Source Maps**: Disabled in production

### Bundle Analysis

```bash
# Analyze bundle size
pnpm run analyze:bundle

# Check chunk sizes
ls -la dist/public/assets/
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ✅ |
| Largest Contentful Paint | < 2.5s | ✅ |
| Time to Interactive | < 3.5s | ✅ |
| Cumulative Layout Shift | < 0.1 | ✅ |
| Total Bundle Size | < 500KB | ✅ |

## Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] API endpoints updated
- [ ] Database migrations applied
- [ ] CDN configuration verified
- [ ] SSL certificates valid

### Build Verification

- [ ] TypeScript compilation passes
- [ ] Lint checks pass
- [ ] Tests pass
- [ ] Bundle size within limits
- [ ] PWA manifest valid

### Production Verification

- [ ] Health check endpoint responds
- [ ] Static assets load correctly
- [ ] API connectivity verified
- [ ] Service worker registered
- [ ] Error tracking active

### Post-deployment

- [ ] Smoke tests pass
- [ ] Performance monitoring active
- [ ] Error rates normal
- [ ] User feedback collected

## Monitoring and Analytics

### Health Checks

```bash
# Health endpoint
curl https://devprep.com/health

# Expected response
{"status": "healthy", "version": "2.0.0"}
```

### Performance Monitoring

1. **Core Web Vitals**: Monitored via `web-vitals`
2. **Error Tracking**: Sentry integration
3. **Analytics**: Optional integration points

### Logging

```javascript
// V2 build includes environment info
console.log(`DevPrep V2 (${__BUILD_ENV__}) - ${__BUILD_TIME__}`);
```

## Troubleshooting

### Common Issues

1. **Build fails with memory error**
   ```bash
   # Increase Node.js memory
   export NODE_OPTIONS="--max-old-space-size=4096"
   pnpm run build:v2
   ```

2. **CDN assets not loading**
   ```bash
   # Verify CDN_URL is set
   echo $CDN_URL
   # Check asset paths in build output
   ls -la dist/public/assets/
   ```

3. **PWA not registering**
   ```bash
   # Enable PWA in development
   ENABLE_PWA_DEV=true pnpm run dev:v2
   # Check service worker in DevTools
   ```

4. **Docker container health check failing**
   ```bash
   # Check container logs
   docker logs devprep-v2
   # Verify port mapping
   docker port devprep-v2
   ```

### Debug Commands

```bash
# Build with verbose output
DEBUG=* pnpm run build:v2

# Check environment variables
env | grep VITE

# Test production build locally
pnpm run build:production && pnpm run serve:v2
```

## Rollback Strategy

### Quick Rollback

```bash
# Revert to previous Docker image
docker pull devprep:previous
docker stop devprep-v2
docker run -d --name devprep-v2 devprep:previous
```

### GitHub Pages Rollback

```bash
# Revert to previous deployment
git checkout <previous-commit>
pnpm run deploy:v2
```

## Support and Maintenance

### Regular Tasks

1. **Weekly**: Review error logs, performance metrics
2. **Monthly**: Update dependencies, security patches
3. **Quarterly**: Full security audit, performance review

### Contact

For deployment issues, contact:
- **DevOps Team**: devops@devprep.com
- **Frontend Team**: frontend@devprep.com
- **On-call**: +1-XXX-XXX-XXXX