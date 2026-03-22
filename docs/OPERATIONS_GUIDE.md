# Redis Operations Guide

This guide covers operational procedures for Redis in the DevPrep project.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Setup](#setup)
3. [Monitoring](#monitoring)
4. [Health Checks](#health-checks)
5. [Backups](#backups)
6. [Migrations](#migrations)
7. [Troubleshooting](#troubleshooting)
8. [Performance Tuning](#performance-tuning)

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker-compose -f docker-compose.redis.yml up -d` | Start Redis stack |
| `docker-compose -f docker-compose.redis.yml down` | Stop Redis stack |
| `redis-cli ping` | Check Redis connectivity |
| `redis-cli info` | View Redis info |
| `redis-cli info stats` | View command statistics |

---

## Setup

### Starting Redis Stack

```bash
# Start all Redis services
docker-compose -f docker-compose.redis.yml up -d

# Start with logs visible
docker-compose -f docker-compose.redis.yml up

# Start only Redis (without monitoring tools)
docker-compose -f docker-compose.redis.yml up -d redis
```

### Environment Variables

```bash
# Required for production
REDIS_PASSWORD=your-secure-password
REDIS_ADMIN_PASSWORD=admin-password-for-commander

# Optional overrides
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_BACKUP_DIR=/backups
```

### Configuration Files

- `redis.conf` - Main Redis configuration
- `sentinel.conf` - Sentinel configuration for failover

---

## Monitoring

### Using the Metrics Module

```typescript
import { getFullMetrics, getMemoryMetrics, getConnectionMetrics } from './services/redis/metrics'

// Get all metrics
const metrics = await getFullMetrics()

// Get specific metrics
const memory = await getMemoryMetrics()
const connections = await getConnectionMetrics()
const throughput = await getThroughputMetrics()
const keyspace = await getKeyspaceMetrics()
```

### Key Metrics to Watch

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory Usage | > 75% | > 90% |
| Connected Clients | > 75% of max | > 90% of max |
| Fragmentation Ratio | > 1.5 | > 3.0 |
| P99 Latency | > 50ms | > 100ms |
| Rejected Connections | > 0 | > 10 |

### Prometheus Integration

The `redis-exporter` container exposes metrics at `http://localhost:9121/metrics`.

Example Prometheus scrape config:

```yaml
scrape_configs:
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

---

## Health Checks

### Running Health Checks

```typescript
import { 
  runAllHealthChecks, 
  checkLiveness, 
  checkReadiness 
} from './services/redis/health'

// All health checks
const health = await runAllHealthChecks()
console.log(health.status) // 'healthy' | 'degraded' | 'unhealthy'

// Liveness probe (for Kubernetes)
const liveness = await checkLiveness()
console.log(liveness.alive) // true if Redis is responding

// Readiness probe
const readiness = await checkReadiness()
console.log(readiness.ready) // true if ready for traffic
```

### Health Check Types

1. **Connectivity** - Redis responds to PING
2. **Memory** - Memory usage within thresholds
3. **Connections** - Client connections within limits
4. **Persistence** - RDB/AOF operations functioning
5. **Replication** - Master/slave sync healthy
6. **Keyspace** - Key statistics available
7. **Fragmentation** - Memory fragmentation acceptable

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Backups

### Manual Backup

```typescript
import { createFullBackup, createRdbBackup, createAofBackup } from './services/redis/backup'

// Full backup (RDB + AOF)
const results = await createFullBackup({
  type: 'both',
  destination: '/backups',
  compression: true,
  retention: 7
})

// Individual backups
const rdb = await createRdbBackup('/backups/dump.rdb')
const aof = await createAofBackup('/backups/dump.aof')
```

### Scheduled Backups

```typescript
import { scheduleBackup, getScheduledBackups } from './services/redis/backup'

// Schedule daily backup at 2 AM
scheduleBackup('daily-backup', 'Daily Full Backup', {
  type: 'both',
  destination: '/backups',
  compression: true,
  retention: 7,
  schedule: '0 2 * * *'
})

// View scheduled backups
const schedules = getScheduledBackups()
```

### Restore from Backup

```typescript
import { restoreFromRdb, restoreFromAof, listBackups } from './services/redis/backup'

// List available backups
const backups = await listBackups()
console.log(backups)

// Restore from RDB
const result = await restoreFromRdb('/backups/dump-1699123456.rdb')

// Restore from AOF
const result = await restoreFromAof('/backups/dump-1699123456.aof')
```

### Backup Schedule

| Type | Frequency | Retention | Recommended |
|------|-----------|-----------|-------------|
| Full (RDB+AOF) | Daily 2 AM | 7 days | Development |
| Full (RDB+AOF) | Every 4 hours | 14 days | Production |
| AOF only | Every 15 min | 3 days | High-write env |

---

## Migrations

### Running Migrations

```typescript
import { runMigrations, getMigrationStatus, registerMigration } from './services/redis/migration'

// Run pending migrations
const result = await runMigrations()
console.log(result.success) // true if all succeeded

// Run to specific version
const result = await runMigrations(5)

// Check status
const status = await getMigrationStatus()
console.log(status.pendingMigrations)
```

### Registering Migrations

```typescript
import { registerMigration } from './services/redis/migration'

registerMigration({
  version: 3,
  description: 'Add user session tracking',
  up: async () => {
    const client = getRedisClient()
    await client.hset('devprep:meta:sessions', 'index', 'created')
  },
  down: async () => {
    const client = getRedisClient()
    await client.del('devprep:meta:sessions')
  }
})
```

### Rolling Back

```typescript
import { rollbackMigration } from './services/redis/migration'

// Rollback last migration
const result = await rollbackMigration()

// Rollback to specific version
const result = await rollbackMigration(2)
```

---

## Troubleshooting

### Common Issues

#### Connection Refused

```bash
# Check if Redis is running
docker ps | grep redis

# Check logs
docker logs devprep-redis

# Test connection
docker exec -it devprep-redis redis-cli ping
```

#### Out of Memory

```bash
# Check memory usage
redis-cli info memory

# View top keys by memory
redis-cli --bigkeys

# Identify large keys
redis-cli --scan | head -100 | xargs redis-cli memory usage
```

#### Slow Queries

```bash
# View slow commands
redis-cli slowlog get 10

# Monitor in real-time
redis-cli monitor
```

#### Fragmentation Issues

```bash
# Check fragmentation ratio
redis-cli info memory | grep mem_fragmentation_ratio

# Fix fragmentation (Redis 4.0+)
redis-cli MEMORY PURGE
```

### Runbook: Redis Outage

1. **Check if Redis is running**
   ```bash
   docker-compose -f docker-compose.redis.yml ps
   ```

2. **Check logs for errors**
   ```bash
   docker-compose -f docker-compose.redis.yml logs redis
   ```

3. **Verify connectivity**
   ```bash
   redis-cli -h localhost -p 6379 ping
   ```

4. **Check system resources**
   ```bash
   docker stats devprep-redis
   ```

5. **Restart if needed**
   ```bash
   docker-compose -f docker-compose.redis.yml restart redis
   ```

6. **Restore from backup if data loss occurred**
   ```bash
   # List backups
   ls -la ./backups/
   
   # Restore latest backup
   # See Restore from Backup section above
   ```

### Runbook: High Memory Usage

1. **Identify memory usage patterns**
   ```typescript
   const metrics = await getMemoryMetrics()
   console.log(metrics)
   ```

2. **Check for memory leaks in application**
   - Review cache invalidation logic
   - Check for unbounded key growth

3. **Consider eviction policies**
   ```bash
   redis-cli config get maxmemory-policy
   redis-cli config set maxmemory-policy allkeys-lru
   ```

4. **Scale vertically or horizontally**
   - Increase memory allocation
   - Implement Redis Cluster

### Runbook: Failover Detection

```typescript
import { detectFailover, getFailoverHistory } from './services/redis/health'

// Check for recent failover events
const events = await detectFailover()
if (events.length > 0) {
  console.log('Failover detected:', events)
}

// View failover history
const history = getFailoverHistory()
```

---

## Performance Tuning

### Recommended Settings

```conf
# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Networking
tcp-keepalive 300
timeout 0

# Performance
tcp-backlog 511
```

### Monitoring Slow Queries

```typescript
import { getMonitoringConfig } from './services/redis/config'

const config = getMonitoringConfig()
// Set slowQueryThreshold to log slow commands
```

### Connection Pool Settings

```typescript
import { getPoolConfig } from './services/redis/config'

const pool = getPoolConfig()
// Adjust min/max connections based on load
```

---

## Testing

### Using Mock Redis

```typescript
import { createMockRedis, createTestContext } from './services/redis/testing'

// Create mock client
const mock = createMockRedis({
  latency: 5,
  failureRate: 0
})

// Test with mock
await mock.set('key', 'value')
const value = await mock.get('key')

// Create test context with setup/teardown
const ctx = await createTestContext()
await ctx.setup()
// run tests
await ctx.teardown()
```

### Benchmarking

```typescript
import { benchmark, benchmarkSetGet } from './services/redis/testing'

// Run benchmark
const result = await benchmark(
  'SET operation',
  async () => {
    await client.set('key', 'value')
  },
  10000
)

console.log(`Ops/sec: ${result.opsPerSecond}`)
```

---

## Security

### Best Practices

1. **Use strong passwords**
   ```bash
   redis-cli config set requirepass "your-secure-password"
   ```

2. **Bind to internal interfaces**
   ```conf
   bind 127.0.0.1
   ```

3. **Enable TLS in production**
   ```bash
   redis-server --tls-port 6379 --tls-cert-file /path/to/cert.pem
   ```

4. **Regular security updates**
   ```bash
   docker pull redis:7-alpine
   ```

### Secrets Management

```typescript
import { initSecretsProvider, getRedisPassword } from './services/redis/config'

// Initialize with Vault
initSecretsProvider('vault', {
  address: 'http://vault:8200',
  token: process.env.VAULT_TOKEN,
  path: 'secret/devprep/redis'
})

// Get password
const password = await getRedisPassword()
```

---

## API Endpoints

The server exposes the following Redis-related endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Full health status |
| `/api/health/live` | GET | Liveness probe |
| `/api/health/ready` | GET | Readiness probe |
| `/api/redis/metrics` | GET | Full metrics |
| `/api/redis/memory` | GET | Memory metrics |
| `/api/redis/connections` | GET | Connection metrics |

---

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [Redis Sentinel Documentation](https://redis.io/topics/sentinel)
- [Redis Cluster Documentation](https://redis.io/topics/cluster-spec)
- [ioredis Documentation](https://github.com/luin/ioredis)
