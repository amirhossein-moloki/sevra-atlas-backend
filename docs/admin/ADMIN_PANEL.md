# AdminJS Backoffice: Implementation & Security

## 1. Overview
AdminJS was chosen as the administrative backbone for Sevra Atlas to provide a highly customizable, rapid-development interface for database management. It allows staff to manage complex entities (Salons, Artists, Blog) without custom-built dashboards.

## 2. Technical Hardening

### 2.1. ESM vs. CommonJS (The Bridge)
AdminJS and its modern ecosystem are strictly ESM. Since this project is CommonJS-based, we use **dynamic imports** in `src/adminjs/index.ts` to bridge the environments.
- All AdminJS dependencies are loaded asynchronously during the `initAdminJS` phase.
- `@ts-ignore` is utilized for types that lack proper CJS/ESM interop definitions.

### 2.2. Prisma 5 Compatibility Fix
The default AdminJS Prisma adapter struggles with Prisma 5's internal `_runtimeDataModel` structure. We implemented a custom `getModelResource` helper that:
1. Manually extracts model metadata (DMMF).
2. Provides a `name` and `fields` array explicitly to satisfy the `isAdapterFor` checks.
3. This ensures reliable resource discovery even when Prisma's internal structure changes.

### 2.3. Tiptap Rich Text Integration
We replaced the default editor with a custom **Tiptap** implementation (`RichTextEditor.tsx`).
- **Feature Set**: H1-H3, Bold, Italic, Lists, and horizontal rules.
- **Sanitization**: Every save triggers a server-side sanitization using `sanitize-html`.
- **Policy**: Whitelist-based (tags only, no attributes) to prevent XSS.

## 3. Security Architecture

### 3.1. Content Security Policy (CSP)
Helmet is configured to allow AdminJS to function while maintaining strict security:
- `scriptSrc`: Includes `'unsafe-inline'` and `'unsafe-eval'` (required by AdminJS/React runtime) and `cdn.jsdelivr.net`.
- `styleSrc`: Includes Google Fonts and JSDelivr for AdminJS UI consistency.
- **Note**: The `/backoffice` path is explicitly excluded from OpenAPI validation to allow dynamic asset loading.

### 3.2. Authentication & Authorization
- **Model**: Session-based auth using `express-session` with `SESSION_SECRET`.
- **Gatekeeping**: Restrict login to `User.role === 'ADMIN'`.
- **RBAC**: Currently, all admins have full access. Future versions will implement granular `ResourceOptions` based on moderator roles.

### 3.3. User Password Migration
The system uses OTP for the mobile app, but AdminJS requires a standard password.
- **Strategy**: Admin users have a hashed `password` field (bcrypt).
- **Setup**: Initial admins must have their password set via raw SQL or a seed script.
- **Verification**: The `auth.authenticate` logic in `src/adminjs/index.ts` performs a bcrypt comparison.

## 4. Operational Guidelines
- **Resource Mounting**: New models must be added to the `resources` array in `adminOptions`.
- **Validation**: Use `ResourceOptions` to define field visibility and custom validation logic within the admin panel.
