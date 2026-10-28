---
name: Bug Report
about: Create a report to help us improve IngestOS
title: "[BUG] <concise description of the issue>"
labels: ["bug", "triage"]
assignees: []
---

## Bug Description
<!-- A clear and concise description of what the bug is. -->

## Component Affected
- [ ] Backend API (`apps/api-core`)
- [ ] Ingestion Engine / Polars Worker (`apps/etl-worker`)
- [ ] Web Frontend (`apps/web`)
- [ ] Docker / Infrastructure (`docker-compose.yml`)
- [ ] Database Schema / Migrations

## Reproduction Steps
Steps to reproduce the behavior:
1. Start infrastructure via `docker compose up -d`
2. Run command / submit payload: `...`
3. Hit endpoint / navigate to page: `...`
4. Inspect error log or HTTP response: `...`

## Expected Behavior
<!-- A clear and concise description of what you expected to happen. -->

## Actual Behavior & Logs
<!-- Paste server terminal logs, browser console output, or stack traces below. -->
```
<paste stack trace or terminal logs here>
```

## Environment Details
- **Operating System:** (e.g., Windows 11, macOS Sequoia, Ubuntu 22.04)
- **Python Version:** (e.g., Python 3.12.8)
- **Node.js Version:** (e.g., Node v20.x, npm v10.x)
- **Docker Version:** (e.g., Docker Desktop 4.30.0)
- **Database Engine:** (e.g., PostgreSQL 15 on port 5434)
- **Branch / Commit SHA:** (e.g., `main` @ `6569d33`)

## Invariant Check
- [ ] Confirms the "Zero-Retention RAM Law" was not violated (no clean customer rows persisted to disk).
- [ ] Confirms issue persists after clearing cache / restarting containers.

## Additional Context
<!-- Add any other context, screenshots, sample CSV/JSON payloads (sanitized of sensitive data). -->
