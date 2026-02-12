# AdminJS Backoffice Documentation

This project uses **AdminJS** for the administrative backend, providing a user-friendly interface to manage database records.

## Access
- **Path**: `/backoffice`
- **Login**: Use your account email and password.
- **Authorization**: Only users with the `ADMIN` role are permitted to log in.

## Configuration
The following environment variables are required for AdminJS:

- `SESSION_SECRET`: A secret string used to sign the session cookie. (Minimum 32 characters recommended for production).
- `DATABASE_URL`: Standard Prisma connection string.

## Features

### Supported Resources
- **Users**: Manage accounts, roles, and status.
- **Posts**: Create and edit blog content with a Rich Text Editor.
- **Pages**: Manage static content pages.
- **Comments**: Moderate user discussions.

### Rich Text Editor
Fields such as `Post.content` and `Page.content` use a custom **Tiptap** editor. It supports:
- Basic formatting (Bold, Italic)
- Headings (H1, H2)
- Lists (Bullet points)

### Security & Sanitization
All Rich Text content is **sanitized on the server side** before being saved to the database. We use `sanitize-html` with a strict whitelist to prevent XSS attacks.

**Whitelisted Tags**: `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `br`.
**Whitelisted Attributes**: None (attributes are stripped for maximum safety).

## Technical Notes

### Development & Build
AdminJS and its plugins are ESM-based. Since this project uses CommonJS, they are loaded using **dynamic imports** in `src/adminjs/index.ts`.

To build the project including AdminJS components:
```bash
npm run build
```

### Prisma 5 Integration
Due to changes in Prisma 5's internal metadata (DMMF), the AdminJS Prisma adapter requires manual model metadata mapping. This is handled automatically in the `getModelResource` helper within `src/adminjs/index.ts`.
