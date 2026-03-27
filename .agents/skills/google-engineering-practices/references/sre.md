# Site Reliability Engineering (SRE) at Google

## What is SRE?

SRE is what you get when you treat operations as if it's a software problem. SREs use software engineering principles to solve operations problems.

## Core Concepts

### SLIs (Service Level Indicators)

Quantitative measures of some aspect of the level of service being provided.

**Common SLIs:**

| Type         | Description                   | Example     |
| ------------ | ----------------------------- | ----------- |
| Latency      | Time to process requests      | p99 < 200ms |
| Availability | % of requests that succeed    | 99.9%       |
| Throughput   | Requests processed per second | > 1000 rps  |
| Error Rate   | % of requests that fail       | < 0.1%      |

### SLOs (Service Level Objectives)

Target values or ranges for SLIs that define the acceptable service level.

**Example SLOs:**

- "99.9% of requests complete in under 200ms"
- "99.99% availability per month"
- "99% of API calls return within 500ms"

### Error Budgets

The allowed amount of unreliability (100% - SLO target).

**Example:**

- SLO: 99.9% availability
- Error Budget: 0.1%
- Per month: 43 minutes of allowed downtime

### Error Budget Policy

What happens when error budget is depleted:

1. Stop feature development
2. Focus on reliability
3. No new launches until fixed

## The Toil Definition

Work that is:

- Manual
- Repetitive
- Automatable
- Tactical (not strategic)
- Devoid of enduring value

**SRE Golden Rule:**

- SREs should spend at most 50% of time on toil
- The rest should be on engineering and improvements

## Incident Management

### Roles

1. **Incident Commander (IC)**: Leads the response
2. **Communications Lead**: Handles external comms
3. **Ops Lead**: Manages technical work

### Blameless Postmortems

Focus on:

- What happened
- Why it happened
- How to prevent recurrence

NOT on:

- Who to blame
- Punishing individuals

### Postmortem Template

```
Summary
Impact
Root Cause
Trigger
Resolution
Action Items
```

## Monitoring

### The Four Golden Signals

1. **Latency**: Response time
2. **Traffic**: Request rate
3. **Errors**: Failure rate
4. **Saturation**: Resource utilization

### Monitoring Principles

- Monitor symptoms, not causes
- Have actionable alerts
- Keep dashboards simple
- SLO-based alerting

## Reliability Engineering

### Error Budgets in Practice

```
If error budget > 0:
  - Can ship new features

If error budget depleted:
  - Freeze new releases
  - Focus on reliability
```

### Tradeoffs

- Reliability vs. feature velocity
- Complexity vs. resilience
- Cost vs. performance

## Practical SRE

### Runbooks

- Document how to diagnose issues
- Keep them updated
- Test them regularly

### SLO Example Calculation

```
Month: 30 days = 43,200 minutes
SLO: 99.9% = 0.1% error budget
Allowed downtime: 43.2 minutes

If you have 3 incidents:
- 10 min + 15 min + 5 min = 30 min
- Remaining budget: 13.2 minutes
```

### SLI Implementation

```yaml
# Example SLI specification
- name: request_latency
  type: ratio
  numerator: requests with latency > 200ms
  denominator: total requests
  threshold: 0.01 # 1%
```

## Key Takeaways

1. Define SLIs based on user experience
2. Set SLOs based on user needs
3. Use error budgets to balance velocity and reliability
4. Automate toil away
5. Focus on blameless learning
6. Monitor what matters (the four golden signals)
