# Load & Stress Testing

This directory contains scripts for performing load and stress tests on sensitive routes like OTP and Auth.

## Prerequisites

- Node.js installed
- The application running in a production-like environment (with real Redis and PostgreSQL for meaningful results)
- `autocannon` installed (already added as a dev dependency)

## Running the tests

To run the full suite of load tests:

```bash
npm run test:load
```

By default, it targets `http://localhost:3000`. You can override this using the `TARGET_URL` environment variable:

```bash
TARGET_URL=https://api.example.com npm run test:load
```

## Scenarios

### 1. OTP Request (`/api/v1/auth/otp/request`)
Tests the performance of the OTP request endpoint. This route is typically protected by rate limiting and involves sending SMS (mocked or real).

### 2. OTP Verify (`/api/v1/auth/otp/verify`)
Tests the performance of the OTP verification endpoint.

### 3. Token Refresh (`/api/v1/auth/refresh`)
Tests the performance of JWT token refresh.

## Interpreting Results

- **Req/Sec**: The number of requests the server handled per second.
- **Latency**: The time it took to get a response. Pay attention to the `p99` latency.
- **Errors**: Non-2xx responses. If you see many 429s, it means the rate limiter is working as expected under load. If you see 5xx errors or timeouts, the server might be buckling under the load.

## Customizing Tests

You can modify the scripts in `tests/load/scripts/` to change the number of concurrent connections, pipelining, or duration of the tests.
