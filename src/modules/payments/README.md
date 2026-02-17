# Zibal Payment Integration

This module provides a production-ready integration with the Zibal payment gateway.

## Features
- **Idempotency**: Prevents duplicate payments using `idempotencyKey`.
- **Security**: Verifies payment amount and status from Zibal's server, not the client.
- **Observability**: Structured logging with redaction of sensitive data, and Prometheus metrics.
- **Resilience**: Handles race conditions using database transactions.
- **Validation**: Strict input validation using Zod.

## Setup

### Environment Variables
Add the following to your `.env` file:
```env
ZIBAL_MERCHANT=zibal # Use 'zibal' for sandbox/testing
ZIBAL_CALLBACK_URL=http://localhost:3000/api/payments/zibal/callback
ZIBAL_BASE_URL=https://gateway.zibal.ir/v1
ZIBAL_TIMEOUT_MS=10000
```

### Installation
The Zibal SDK is required:
```bash
npm install zibal
```

## API Endpoints

### 1. Initiate Payment
`POST /api/payments/zibal/init`

**Request Body:**
```json
{
  "amount": 10000,
  "planId": "1",
  "salonId": "10",
  "description": "Premium Plan",
  "idempotencyKey": "unique-request-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "12345",
    "trackId": "1000000",
    "paymentUrl": "https://gateway.zibal.ir/start/1000000"
  }
}
```

### 2. Callback Handler
`GET /api/payments/zibal/callback`

This endpoint is called by Zibal after the payment process. It verifies the transaction and activates the subscription.

## Payment State Machine

| Zibal Status | Internal Status | Description |
|--------------|-----------------|-------------|
| N/A          | PENDING         | Initial state before calling Zibal |
| 100 (Request)| INITIATED       | trackId received, user redirected |
| 1 (Callback) | PAID            | Callback received with success=1 (temporary state) |
| 100 (Verify) | VERIFIED        | Verification successful, subscription activated |
| Other        | FAILED          | Any error during the process |

## Testing
To test the integration in sandbox mode, ensure `ZIBAL_MERCHANT` is set to `zibal`.
You can use Zibal's test card numbers during the payment flow.
