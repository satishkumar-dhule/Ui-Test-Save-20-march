---
name: google-engineering-practices
description: Apply Google's engineering methodologies and best practices. Use when users ask about Google's code review process, testing practices, SRE principles, software engineering at Google, engineering leadership, or want to implement Google-style engineering practices in their team. Triggers on mentions of Google engineering, code review guidelines, Google's testing practices, SLIs/SLOs, error budgets, or technical leadership at scale.
---

# Google Engineering Practices

This skill provides comprehensive guidance on Google's engineering methodologies based on their publicly available documentation and books. Use the references section for detailed documentation.

## Core Principles

### 1. Code Review (The Google Way)

**The CL (Changelist) Concept**

- A CL is one self-contained change submitted for review
- Should be focused on one thing
- Must pass all tests and be lint-free before review

**The Standard of Code Review**

- Primary purpose: Ensure overall code health improves over time
- Primary criterion: Does this change make the code base better?
- Consider: Design, functionality, complexity, tests, naming, comments, style, documentation

**What Reviewers Should Look For**

1. **Design**: Is the code well-designed?
2. **Functionality**: Does it behave as the author intended? Is it good for users?
3. **Complexity**: Could the code be simpler? Is it more complex than needed?
4. **Tests**: Are there adequate automated tests?
5. **Naming**: Are names clear and descriptive?
6. **Comments**: Are comments useful and necessary?
7. **Style**: Does code follow style guides?
8. **Documentation**: Is relevant documentation updated?

**Speed Expectations**

- One business day response time for reviews
- Small CLs (under 400 lines): Review in 24 hours
- Large CLs: Respond within that time frame with timeline

**The LGTM Convention**

- "Looks Good to Me" - Reviewer approval
- Unless explicitly stated, LGTM means "I've reviewed this and think it's good to submit"
- Non-blocking comments should be marked as such

### 2. Testing at Google (Testing on the Toilet)

**What Makes a Good Test (From Google's Testing Blog)**

1. **Test one thing**: Each test should verify a single behavior
2. **Fast**: Tests should run quickly
3. **Independent**: Tests should not depend on each other
4. **Repeatable**: Tests should produce the same results every time
5. **Self-Validating**: Test should have clear pass/fail
6. **Timely**: Write tests before code (TDD when appropriate)

**Test Structure: Arrange-Act-Assert**

```javascript
// Arrange
const user = createTestUser();

// Act
const result = user.authenticate("correct-password");

// Assert
assert(result.isAuthenticated);
```

**Test Data Creation**

- Use factories or builders for test data
- Create minimal data needed for the test
- Avoid sharing complex fixtures between tests

**Narrow Assertions**

- Prefer specific assertions over general ones
- `assert.equal(actual, expected)` over `assert.ok(actual)`
- Makes failures easier to diagnose

### 3. Site Reliability Engineering (SRE)

**Core SRE Principles**

- SRE is what you get when you treat operations as a software problem
- Mission: Protect, provide for, and progress software and systems

**Key Concepts**

**SLIs (Service Level Indicators)**

- Quantitative measure of some aspect of the level of service
- Examples: Latency, Availability, Throughput, Error Rate
- Focus on user-facing metrics

**SLOs (Service Level Objectives)**

- Target values or ranges for SLIs
- "99.9% of requests complete in under 200ms"
- Should be achievable and aligned with user needs

**Error Budgets**

- 100% - SLO target = error budget
- Example: 99.9% SLO = 0.1% error budget
- What to do when error budget is depleted:
  - Freeze or slow down new feature work
  - Focus on reliability improvements

**Toil Definition**

- Work that tends to be manual, repetitive, automatable, tactical, devoid of enduring value
- If you do it, the system state changes but no permanent improvement
- SREs should spend max 50% time on toil

**Incident Management**

- Blameless postmortems - focus on systemic issues
- Clear roles: Incident Commander, Communications Lead, Ops Lead
- Runbooks for common issues

### 4. Software Engineering Philosophy at Google

**Key Distinctions**

- Programming: Writing code that works
- Software Engineering: Programming integrated with production over time

**The "Engineering" Mindset**

- Consider scale, long-term maintenance, tradeoffs
- Think about technical debt and compound costs
- Document the "why" not just the "what"

**Code Health**

- Code health is about the ongoing sustainability of the codebase
- Small improvements compound over time
- Technical debt compounds like interest

**Documentation Principles**

- Docs should answer questions a reader would have
- Keep docs close to the code they describe
- Treat documentation as code - review and test it

### 5. Technical Leadership at Google

**What Makes a Good Tech Lead**

1. **Technical breadth**: Understand enough to make decisions across areas
2. **Delegation**: Trust your team, let them make mistakes and learn
3. **Communication**: Translate between technical and non-technical
4. **Mentorship**: Grow the skills of those around you
5. **Decision making**: Make timely decisions with incomplete information

**Delegation Techniques**

- Start by doing things with team members, not for them
- Gradually increase autonomy as trust builds
- Still review important technical decisions
- Focus on what, not how (when appropriate)

**Running Effective Meetings**

- Have an agenda sent in advance
- Start on time, end on time
- Identify action items and owners
- Make decisions in meetings when possible

**One-on-Ones**

- Regular scheduled time with each team member
- Focus on them, not status updates
- Career growth, challenges, feedback
- Build trust and rapport

### 6. Project Management and Release Engineering

**Small Batches**

- Prefer many small changes over few large ones
- Easier to review, test, and roll back
- Reduces integration pain

**Continuous Integration**

- Keep the build green
- If the build breaks, it's a top priority to fix
- Small, frequent integrations

**Feature Flags**

- Ship incomplete features without breaking
- Gradual rollout
- Easy rollback
- A/B testing capability

**Launch Coordination**

- Have a clear launch checklist
- Include rollback procedures
- Define launch criteria
- Coordinate with dependent teams

## Practical Application

### When Helping with Code Review

1. Ask about the CL's purpose and scope first
2. Check for design issues before style nits
3. Distinguish between must-fix and nitpick comments
4. Suggest improvements without rewriting code yourself
5. Consider if the change is too large (>400 lines)

### When Helping with Testing

1. Start with the test structure (Arrange-Act-Assert)
2. Identify what behavior is being tested
3. Ensure test names describe the behavior
4. Check for test independence
5. Verify assertions are specific enough

### When Helping with SRE Questions

1. Start with user-facing SLIs
2. Set SLOs based on user needs, not internal targets
3. Define clear error budget policies
4. Focus on toil reduction through automation
5. Conduct blameless postmortems

### When Helping as a Tech Lead

1. Understand the full context before advising
2. Balance now vs. later tradeoffs
3. Document decisions and their rationale
4. Invest in team growth and mentorship
5. Protect team from unnecessary interruptions

## References

For more detailed information, consult these bundled references:

- `references/code-review.md` - Detailed code review guidelines
- `references/testing.md` - Google testing practices and patterns
- `references/sre.md` - SRE fundamentals and best practices
- `references/leadership.md` - Technical leadership guidance
