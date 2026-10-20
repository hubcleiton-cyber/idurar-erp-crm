# Fiscal MVP audit and first increment

Audit date: 2026-10-19. Base revision: `e935dec13cf8b6082a7e7fc4736669e5151a80a3`.

## Prioritized findings

| Severity | Finding | Evidence | Treatment in this increment |
| --- | --- | --- | --- |
| Critical | A real-looking `JWT_SECRET` was tracked in `backend/.env`. Removing it from the current tree does not remove it from Git history. | `backend/.env` | Current value is neutralized; `.env` is ignored; rotation and history remediation remain mandatory. |
| High | The application has no tenant boundary. Admin has only the `owner` role and legacy CRUD queries are global. | `Admin.js`, generic CRUD controllers | Fiscal routes require an explicit tenant. Legacy routes are documented as out of scope and must not handle fiscal data. |
| High | Generic create/update paths spread the complete request body into database operations, enabling mass assignment. | `createCRUDController/create.js` and related controllers | The fiscal endpoint allowlists every accepted field and does not use generic CRUD. |
| High | Authentication stores bearer JWTs in MongoDB, supports one-year sessions and returns internal errors on token validation failures. | `authUser.js`, `isValidAuthToken.js` | No auth rewrite in this reversible increment. Remediation is required before production. |
| Medium | CORS reflects arbitrary origins while credentials are enabled. | `backend/src/app.js` | Must be replaced by an environment-specific allowlist before production. |
| Medium | No backend test script or quality CI exists. Existing workflows do not run application gates. | `backend/package.json`, `.github/workflows` | Adds focused `node:test` coverage. CI hardening remains pending. |
| Medium | Dependency risk has not been continuously checked; `html-pdf` and upload packages deserve immediate review. | `backend/package.json` | Run `npm audit` and replace unsupported packages in a separate dependency-focused change. |
| Medium | Package metadata says `Fair-code License`, while the repository contains GNU AGPL v3.0. | `backend/package.json`, `LICENSE` | Preserve AGPL notices and resolve metadata with the project owner. |

## Implemented boundary

- Adds `Tenant` and `FiscalQuery` models without changing legacy ERP behavior.
- Requires authenticated users to have a tenant before using fiscal routes.
- Requires explicit confirmation of legal authorization for each request.
- Uses an idempotency key scoped by tenant.
- Stores an HMAC fingerprint and only the last four CNPJ digits, never the full CNPJ.
- Separates mock adapters for Integra Contador and Active Debt.
- Records provider, service, requester, timestamps, protocol, source, status and a minimal summary.
- Returns only simulated responses. No official endpoint, credential or certificate is used.

## Production blockers

1. Rotate the exposed JWT secret and invalidate all existing sessions. Decide whether Git history must be rewritten with coordinated repository-owner approval.
2. Provision tenants and migrate every Admin/Client relation; then scope all legacy CRUD reads and writes by tenant.
3. Confirm official contracts, endpoints, authentication, authorization/procuration and homologation environments for each provider.
4. Put `JWT_SECRET`, `FISCAL_DATA_HASH_KEY`, certificates and provider credentials in a managed secret vault.
5. Define LGPD retention/deletion, incident response, audit access and document storage controls.
6. Add quality/security CI, dependency remediation and integration tests with MongoDB.

## Local verification

From `backend/` run `npm test`. The tests use only Node.js built-ins and simulated data.
