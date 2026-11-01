## Summary of Changes

<!-- Provide a concise description of the motivation, architecture changes, and impact of this PR. -->

---

## Target Branch

Please select the intended destination branch:
- [ ] `dev` — Active integration branch (Default for features, enhancements, and non-critical bug fixes).
- [ ] `staging` — Release candidate verification & pre-production staging.
- [ ] `main` — Production emergency hotfix.

---

## Type of Change

- [ ] `feat`: New product feature or capability
- [ ] `fix`: Bug fix or error remediation
- [ ] `perf`: Vectorized performance optimization
- [ ] `refactor`: Structural codebase improvement without behavioral changes
- [ ] `docs`: Documentation, README, or ADR updates
- [ ] `ci`: Workflow, GitHub Actions, or dev tooling improvements

---

## Quality & Compliance Verification Checklist

All contributors must verify these checks locally before opening a pull request:

- [ ] **Zero-Retention RAM Invariant:** Valid customer records stream strictly in ephemeral memory (`io.BytesIO` / Polars DataFrames). Zero payload rows are written to persistent disk tables or staging buckets.
- [ ] **Ephemeral DLQ 60m TTL:** Quarantined records enforce strict `expires_at = created_at + 60 minutes` and support cryptographic zeroization (`0x00`).
- [ ] **Backend Pytest Suite (100% Green):** `pytest apps/api-core/tests -v` executed and all 20+ tests pass.
- [ ] **Frontend Lint Verification:** `npm --prefix apps/web run lint` completed with 0 warnings and 0 errors.
- [ ] **Frontend Production Build:** `npm --prefix apps/web run build` compiled successfully.
- [ ] **Conventional Commits:** All commit messages adhere to `type(scope): description`.

---

## Related Issues & ADR References

<!-- Closes #123 / References ADR-0002 -->
- Closes #
- References ADR: 
