# API Contract Testing Proposal

To ensure the API implementation stays aligned with the specification and to prevent breaking changes, we propose the following automated contract testing strategy.

## 1. Automated Route Audit (Implemented)
We have implemented a route audit script that ensures the code and the specification are in sync.

- **Script**: `scripts/audit-routes.ts`
- **Execution**: `npm run test:contract`
- **Guards**:
    - **Fails** if a documented endpoint in `openapi.json` is missing from the Express application.
    - **Warns** (can be configured to fail) if an endpoint exists in the code but is not documented.
    - Detects Method/Path mismatches.

This script should be run in the CI/CD pipeline to prevent endpoint drift.

## 2. Response Validation (Implemented)
We use `jest-openapi` to automatically validate API responses against the OpenAPI spec in integration tests.

- **Setup**: `tests/setup-after-env.ts`
- **Usage**:
```typescript
it('should match the openapi spec', async () => {
  const res = await request(app).get('/api/v1/auth/otp/request');
  expect(res).toSatisfyApiSpec();
});
```
The `expect(res).toSatisfyApiSpec()` matcher will fail the test if the response structure, status code, or content-type does not match the specification.

## 3. Runtime Enforcement (Implemented)
Integrate `express-openapi-validator` as middleware in development/staging environments:
- It automatically validates incoming requests and outgoing responses against the OpenAPI spec.
- Throws errors if a mismatch is detected, providing immediate feedback to developers.

## 4. CI Integration
- Add a job `test:contract` that runs the Route Audit script.
- Ensure integration tests include `toSatisfyApiSpec()` checks.
- CI will block PRs that introduce discrepancies between the code and the contract.

## 5. Risk of Ignoring
- **Client Breakage**: Frontend or mobile apps might depend on documented behavior that doesn't exist or has changed.
- **Maintenance Overhead**: Manual audits are error-prone and slow down development.
- **Inaccurate Documentation**: Stale documentation leads to confusion and bugs.
