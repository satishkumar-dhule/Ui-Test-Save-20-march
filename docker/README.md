# DevPrep Docker Setup

This directory contains Docker configuration for local development and production deployment of DevPrep.

## Quick Start

### Development Environment

```bash
# Start all services for development
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment

```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d --build

# Scale API server
docker-compose up -d --scale api=3
```

## Services

| Service  | Port | Description                    |
| -------- | ---- | ------------------------------ |
| api      | 4000 | Express API server             |
| frontend | 8080 | Production frontend (nginx)    |
| postgres | 5432 | PostgreSQL database (optional) |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL` - PostgreSQL connection string (optional)
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password

## Docker Commands

### Build Images

```bash
# Build API server
docker build -f artifacts/api-server/Dockerfile -t devprep-api .

# Build frontend
docker build -f artifacts/devprep/Dockerfile -t devprep-frontend .
```

### Run Containers

```bash
# Run API server
docker run -p 4000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  devprep-api

# Run frontend
docker run -p 8080:3000 \
  -e BASE_PATH=/ \
  devprep-frontend
```

### Using Docker Compose Profiles

```bash
# Start with PostgreSQL
docker-compose --profile with-db up -d

# Start with nginx reverse proxy
docker-compose --profile with-proxy up -d
```

## Health Checks

All services include health checks:

- **API**: `GET /api/healthz`
- **Frontend**: `GET /` (nginx)

Check health status:

```bash
docker-compose ps
```

## Troubleshooting

### View container logs

```bash
docker-compose logs api
docker-compose logs frontend
```

### Access container shell

```bash
docker-compose exec api sh
docker-compose exec frontend sh
```

### Rebuild after changes

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

For production:

1. Set up PostgreSQL database
2. Configure environment variables
3. Use nginx reverse proxy for HTTPS
4. Set up CI/CD pipeline using GitHub Actions

See `.github/workflows/deploy.yml` for automated deployment to GitHub Pages.
