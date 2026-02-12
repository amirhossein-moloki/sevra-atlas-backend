# AdminJS Backoffice Documentation

This project now includes an AdminJS-powered backoffice available at `/backoffice`.

## Features
- **Resources**: Manage `User`, `Post`, `Page`, and `Comment` models.
- **Rich Text Editor**: Custom Tiptap-based editor for `Post.content` and `Page.content`.
- **Security**:
  - Only users with `ADMIN` role can log in.
  - Server-side sanitization of HTML content using `sanitize-html`.
  - Password hashing for admin users using `bcrypt`.

## Configuration

### Environment Variables
The following environment variables are used:
- `SESSION_SECRET`: Secret key for session encryption (defaulted if not set).
- `DATABASE_URL`: Connection string for PostgreSQL.

### Authentication
Login is restricted to users where `role === 'ADMIN'`.
Since the main app uses OTP, you may need to manually set a password for an admin user in the database or via the AdminJS panel (if you already have an admin account).

To create an initial admin user, you can use a script or manually insert into the `users_user` table:
```sql
UPDATE users_user SET password = 'hashed_password', role = 'ADMIN' WHERE email = 'admin@example.com';
```
*(Use bcrypt to hash the password)*

## Implementation Details
- **AdminJS Path**: `/backoffice`
- **Sanitization**: Uses a whitelist approach. Allowed tags include basic formatting (`b`, `i`, `em`, `strong`, `a`) plus `img`, `h1`, `h2`, `span`, and `div`.
- **Custom Component**: Located in `src/adminjs/components/RichTextEditor.tsx`.

## Troubleshooting
- If styles or scripts don't load, ensure `helmet` is configured correctly (CSP is currently disabled for compatibility).
- If sessions are lost on restart, it's because it currently uses `MemoryStore`. For production, consider using `connect-pg-simple`.
