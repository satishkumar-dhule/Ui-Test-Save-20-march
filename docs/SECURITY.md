# DevPrep Security Configuration

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-03-19  
> **CISO:** Adrian Blackwood

---

## Overview

This document outlines security configurations for DevPrep deployment on Replit.

---

## Required Environment Variables

| Variable          | Required | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `DATABASE_URL`    | Yes      | PostgreSQL connection string                    |
| `JWT_SECRET`      | Yes      | Secret key for JWT token signing (min 32 chars) |
| `API_PORT`        | No       | API server port (default: 3000)                 |
| `ALLOWED_ORIGINS` | Yes      | Comma-separated list of allowed CORS origins    |

---

## Secret Management in Replit

### Setting Secrets

1. Go to your Replit project
2. Click on the **Secrets** (lock icon) in the sidebar
3. Add each secret as a key-value pair

### Required Secrets for Deployment

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secure-random-string-min-32-chars
ALLOWED_ORIGINS=https://your-project.your-username.repl.co
```

### Security Best Practices

- Never commit `.env` files to version control
- Use unique `JWT_SECRET` for each environment
- Rotate secrets periodically
- Use strong, randomly generated values

---

## Authentication Flow

### Token Structure

```typescript
interface JWTPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
```

### Authorization Header Format

```
Authorization: Bearer <base64-encoded-token>
```

### Protected Routes

Routes under `/api/content/*` require authentication:

```typescript
// Token validation flow
1. Extract Bearer token from Authorization header
2. Decode base64 payload
3. Attach user to request object
4. Continue to route handler
```

### Role-Based Access Control

| Role    | Permissions                |
| ------- | -------------------------- |
| `user`  | Read/write own content     |
| `admin` | Full access to all content |

---

## CORS Configuration

### Current Configuration

```typescript
app.use(cors());
```

### Recommended Production Configuration

```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

### Replit-Specific Settings

For Replit deployments, set `ALLOWED_ORIGINS` to include:

- Your Replit preview URL: `https://*.replit.dev`
- Your custom domain (if configured)
- `http://localhost:5173` for local development

---

## Rate Limiting

### Configuration

| Setting      | Value      | Description                      |
| ------------ | ---------- | -------------------------------- |
| Window       | 15 minutes | Time window for request counting |
| Max Requests | 100        | Maximum requests per window      |

### Implementation

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);
```

---

## Security Headers

### Recommended Headers

```typescript
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  next();
});
```

---

## Development vs Production

| Setting       | Development        | Production              |
| ------------- | ------------------ | ----------------------- |
| CORS          | Open (all origins) | Restricted origins only |
| Rate Limiting | Disabled           | Enabled                 |
| Error Logging | Verbose            | Sanitized               |
| JWT Secret    | Any string         | Strong random value     |

---

## Security Checklist

- [ ] Set `JWT_SECRET` to a strong random value (min 32 characters)
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Enable rate limiting in production
- [ ] Add security headers
- [ ] Use HTTPS in production
- [ ] Rotate secrets periodically
- [ ] Monitor authentication failures

---

## Incident Response

### If JWT_SECRET is Compromised

1. Immediately rotate to a new secret
2. Invalidate all existing sessions
3. Audit access logs for unauthorized activity
4. Notify affected users

### If Unauthorized Access Detected

1. Review authentication logs
2. Identify the breach vector
3. Implement additional security measures
4. Report to appropriate authorities if required

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT.io](https://jwt.io/)

---

**Document Classification:** Internal Use Only  
**Review Schedule:** Quarterly
