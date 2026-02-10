# Blog API Documentation (Swagger-like)

> Base path: `/api/v1/blog/`
> Framework: Express (Node.js) + Prisma.
> Pagination: `page`, `pageSize` query params.

---

## Authentication & Permissions (Global Notes)

### Roles (RBAC)
- `USER` — normal users
- `AUTHOR` — blog post authors (requires `AuthorProfile`)
- `MODERATOR` — moderation
- `ADMIN` — full privileges

### Permissions
- Public (Read-only)
- `requireAuth()` + `requireRole(['AUTHOR', 'ADMIN'])` for writes.

---

## Common Query Parameters

### Pagination
- `page` (int, default 1)
- `pageSize` (int, default 20, max 100)

---

# Endpoints

## 1) Posts

### 1.1 List Posts
**GET** `/api/v1/blog/posts/`

**Query params**
- `page`, `pageSize`
- `q` (search)
- `category` (slug)
- `tag` (slug)
- `status` (admin only)
- `authorId`

**Response (200)**
```json
{
  "data": [
    {
      "id": "1",
      "slug": "title",
      "title": "...",
      "excerpt": "...",
      "status": "published",
      "publishedAt": "...",
      "author": { "displayName": "...", "avatar": { "url": "..." } },
      "category": { "name": "...", "slug": "..." },
      "tags": [{ "name": "...", "slug": "..." }],
      "viewsCount": 10
    }
  ],
  "meta": { "total": 100, "page": 1, "pageSize": 20 }
}
```

---

### 1.2 Create Post
**POST** `/api/v1/blog/posts/`
(Requires `AUTHOR` or `ADMIN`)

---

### 1.3 Retrieve Post (by slug)
**GET** `/api/v1/blog/posts/:slug`
*Alias:* **GET** `/api/v1/blog/posts/slug/:slug`

---

### 1.4 Update Post
**PATCH** `/api/v1/blog/posts/:slug`
(Author or Admin)

---

### 1.5 Delete Post
**DELETE** `/api/v1/blog/posts/:slug`
(Author or Admin)

---

### 1.6 Similar Posts
**GET** `/api/v1/blog/posts/:slug/similar`

---

### 1.7 Same Category
**GET** `/api/v1/blog/posts/:slug/same-category`

---

### 1.8 Related Posts
**GET** `/api/v1/blog/posts/:slug/related`

---

### 1.9 Publish Post
**POST** `/api/v1/blog/posts/:slug/publish`

---

## 2) Comments

### 2.1 List comments for a post
**GET** `/api/v1/blog/posts/:slug/comments`

### 2.2 Add comment to a post
**POST** `/api/v1/blog/posts/:slug/comments`

---

## 3) Media (using global media)
*See Atlas API spec for `/api/v1/media`*

---

## 4) Authors

### 4.1 List Authors
**GET** `/api/v1/blog/authors`

### 4.2 Create/Update/Delete Author
**POST/PATCH/DELETE** `/api/v1/blog/authors/:id`

---

## 5) Taxonomy (Categories & Tags)

### 5.1 Categories
- **GET** `/api/v1/blog/taxonomy/categories` (List)
- **POST** `/api/v1/blog/taxonomy/categories` (Create - Admin)
- **GET/PATCH/DELETE** `/api/v1/blog/taxonomy/categories/:id` (Retrieve/Update/Delete - Admin)

### 5.2 Tags
- **GET** `/api/v1/blog/taxonomy/tags` (List)
- **POST** `/api/v1/blog/taxonomy/tags` (Create - Admin)
- **GET/PATCH/DELETE** `/api/v1/blog/taxonomy/tags/:id` (Retrieve/Update/Delete - Admin)

### 5.3 Series
- **GET** `/api/v1/blog/taxonomy/series` (List)
- **POST** `/api/v1/blog/taxonomy/series` (Create - Admin)
- **GET/PATCH/DELETE** `/api/v1/blog/taxonomy/series/:id` (Retrieve/Update/Delete - Admin)

---

## 6) Misc (Pages, Menus, Revisions, Reactions)

### 6.1 Revisions
- **GET** `/api/v1/blog/misc/revisions/:postId`

### 6.2 Reactions
- **POST** `/api/v1/blog/misc/reactions`

### 6.3 Pages
- **GET** `/api/v1/blog/misc/pages` (List)
- **GET** `/api/v1/blog/misc/pages/:slug` (Retrieve)
- **POST/PATCH/DELETE** `/api/v1/blog/misc/pages/:id` (Admin CRUD)

### 6.4 Menus
- **GET** `/api/v1/blog/misc/menus/:location` (Retrieve by location)
- **POST/PATCH/DELETE** `/api/v1/blog/misc/menus/:id` (Admin CRUD)

### 6.5 Menu Items
- **POST/PATCH/DELETE** `/api/v1/blog/misc/menu-items/:id` (Admin CRUD)
