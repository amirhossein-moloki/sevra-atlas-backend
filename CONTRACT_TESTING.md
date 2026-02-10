# API Contract Testing Proposal

To ensure the API implementation stays aligned with the specification and to prevent breaking changes, we propose the following automated contract testing strategy.

## 1. Automated Route Audit
Create a CI step that:
1.  **Extracts Runtime Routes**: Dynamically lists all routes registered in the Express application at startup.
2.  **Parses the Specification**: Reads the `openapi.json` (or parses the markdown specs) to list all documented endpoints.
3.  **Cross-Check**:
    - **Fails** if an endpoint exists in the code but is not in the spec (Undocumented).
    - **Fails** if an endpoint exists in the spec but is not implemented in the code (Missing implementation).
    - **Fails** on Method/Path mismatch.

## 2. Response Validation
Use `jest-openapi` to automatically validate API responses in integration tests:
```typescript
import execall from 'jest-openapi';
import swaggerSpec from './swagger.json';

execall(swaggerSpec);

describe('GET /salons', () => {
  it('should match the openapi spec', async () => {
    const res = await request(app).get('/api/v1/salons');
    expect(res).toSatisfyApiSpec();
  });
});
```

## 3. Runtime Enforcement (Optional but Recommended)
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
