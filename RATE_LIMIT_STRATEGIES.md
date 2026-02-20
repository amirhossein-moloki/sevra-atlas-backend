# Rate Limit Strategies

This file documents the rate limiting strategies used in the project before they were globally disabled. Use this as a reference to restore or modify rate limiting in the future.

## Global Rate Limit
- **Applied in**: `src/app.ts`
- **Prefix**: `global`
- **Limit**: `GLOBAL_RATE_LIMIT_MAX` (Default: 100)
- **Window**: `GLOBAL_RATE_LIMIT_WINDOW_S` (Default: 60s)

## Auth Module
- **OTP Request**: `otp_request`
  - **Limit**: `OTP_RATE_LIMIT_PER_IP` (Default: 10)
  - **Window**: 60s
  - **File**: `src/modules/auth/auth.routes.ts`
- **OTP Verify**: `otp_verify`
  - **Limit**: 10
  - **Window**: 60s
  - **File**: `src/modules/auth/auth.routes.ts`
- **Token Refresh**: `refresh`
  - **Limit**: 30
  - **Window**: 60s
  - **File**: `src/modules/auth/auth.routes.ts`
- **Logout**: `logout`
  - **Limit**: 20 (and 10 in another place)
  - **Window**: 60s
  - **File**: `src/modules/auth/auth.routes.ts`

## Verification Module
- **Verification Request**: `verification_request`
  - **Limit**: 5
  - **Window**: 3600s (1 hour)
  - **File**: `src/modules/verification/verification.routes.ts`

## Growth Module
- **Create Invites**: `growth_invite`
  - **Limit**: 5
  - **Window**: 84600s (24 hours)
  - **File**: `src/modules/growth/growth.routes.ts`

## Payments Module
- **Payment Initiation**: `payment_init`
  - **Limit**: 5
  - **Window**: 60s
  - **Key Generator**: `(req) => req.user?.id.toString() || req.ip || 'anonymous'`
  - **File**: `src/modules/payments/payments.routes.ts`

## Reviews Module
- **Create Review**: `create_review`
  - **Limit**: 5
  - **Window**: 600s (10 minutes)
  - **File**: `src/modules/reviews/reviews.routes.ts`
- **Vote Review**: `vote_review`
  - **Limit**: 20
  - **Window**: 60s
  - **File**: `src/modules/reviews/reviews.routes.ts`

## Media Module
- **Media Register**: `media_register`
  - **Limit**: 20
  - **Window**: 600s (10 minutes)
  - **File**: `src/modules/media/media.routes.ts`
- **Media Upload**: `media_upload`
  - **Limit**: 10
  - **Window**: 600s (10 minutes)
  - **File**: `src/modules/media/media.routes.ts`

## Reports Module
- **Create Report**: `create_report`
  - **Limit**: 10
  - **Window**: 600s (10 minutes)
  - **File**: `src/modules/reports/reports.routes.ts`
