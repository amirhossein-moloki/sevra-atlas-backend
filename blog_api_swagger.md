# Blog API Documentation (Swagger-like)

> Base path: `/api/blog/`  
> Framework: Django REST Framework (DRF), routers + nested routers. Routes are defined in `blog/urls.py` fileciteturn3file4L1-L39  
> Pagination: `CustomPageNumberPagination` (page_size=10, `page_size` query param, max 100) fileciteturn3file5L1-L7  
> Schema/UI endpoints exist at `/api/schema/`, `/api/schema/swagger-ui/`, `/api/schema/redoc/` fileciteturn2file4L11-L13

---

## Authentication & Permissions (Global Notes)

### Auth
Many endpoints allow read-only access for anonymous users but require authentication for writes (`IsAuthenticatedOrReadOnly`) fileciteturn1file1L38-L43.

### Blog-specific permissions
- **`IsAuthorOrAdminOrReadOnly`**:  
  - Safe methods: allowed for everyone.  
  - Write methods: require authenticated user; allowed if staff OR user has `AuthorProfile`.  
  - Object-level: allowed if staff OR post author equals request user. fileciteturn3file6L6-L42
- **`IsAdminUserOrReadOnly`**: read for everyone; writes only for staff. fileciteturn3file6L72-L80
- **`IsOwnerOrReadOnly`**: write allowed only if request user is owner via `user`, `author`, or `uploaded_by` attributes. fileciteturn3file6L44-L69

(Some viewsets also use `users.permissions.IsOwnerOrAdmin` / `IsOwnerOrAdmin` which gates writes to owner or staff; see imports in `blog/views.py` fileciteturn1file1L23-L25.)

---

## Common Query Parameters

### Pagination
- `page` (int, default 1)
- `page_size` (int, default 10, max 100) fileciteturn3file5L3-L7

### Ordering
Where enabled:
- `ordering` (string; can be `-field` for desc). Example: `ordering=-published_at`  
Post ordering fields: `published_at`, `views_count`, `id` fileciteturn1file1L45-L47  
PostComment ordering fields: `created_at`, `likes_count` fileciteturn1file3L24-L27

### Search (Posts)
- `search` (string) searches in `title`, `content`, `excerpt` fileciteturn1file1L44-L45

### Filtering (Posts)
Implemented by `PostFilter` fileciteturn1file0L13-L38:
- `published_after` (datetime, gte `published_at`)
- `published_before` (datetime, lte `published_at`)
- `category` (string: category slug)
- `tags` (repeatable or comma-separated depending on client; filter is ModelMultipleChoice on `tags__slug`, conjoined=True so ALL tags must match) fileciteturn1file0L17-L22
- `is_hot` (bool; computed: published within last 30 days and views_count > 1000) fileciteturn1file0L9-L33
- also supports: `series`, `visibility` fileciteturn1file0L35-L38

### `fields` optimization param (Posts)
`GET /posts/` and other post actions accept `fields` query param to optimize select/prefetch.  
- On **list**, default fields (if `fields` omitted): `slug,title,excerpt,author,category,cover_media,tags,likes_count,comments_count` fileciteturn1file1L57-L79  
- On **retrieve/others**, `fields=all` is default; you can request specific groups like `author,tags,comments,media_attachments` etc. fileciteturn1file2L16-L42

---

# Endpoints

## 1) Posts

### 1.1 List Posts
**GET** `/api/blog/posts/`

**Permissions**
- Public (read-only); results differ by user:
  - Staff: all posts. fileciteturn1file1L85-L88  
  - Authenticated non-staff: published posts + own drafts/review posts. fileciteturn1file1L88-L93  
  - Anonymous: published posts with `published_at <= now`. fileciteturn1file2L10-L15  

**Query params**
- Pagination: `page`, `page_size`
- Filtering: `published_after`, `published_before`, `category`, `tags`, `is_hot`, `series`, `visibility` fileciteturn1file0L13-L38
- Search: `search` (title/content/excerpt) fileciteturn1file1L44-L45
- Ordering: `ordering` in `{published_at,views_count,id}` (default `-published_at,-id`) fileciteturn1file1L45-L47
- Optimization: `fields`

**Response (200)**
Paginated list of `PostListSerializer` fileciteturn3file1L85-L101  
Fields:
- `id`, `slug`, `title`, `excerpt`, `reading_time_sec`, `status`, `is_hot`
- `published_at` (Jalali formatted string), `author{display_name,avatar}`, `category` (string related), `cover_media`, `tags[]`
- `views_count`, `likes_count`, `comments_count`

---

### 1.2 Create Post
**POST** `/api/blog/posts/`

**Permissions**
- Authenticated; must be staff OR have `AuthorProfile`; otherwise denied. fileciteturn3file6L12-L28  
Additionally, on create it enforces author profile existence and saves `author=AuthorProfile(user=request.user)`; otherwise raises PermissionDenied. fileciteturn1file2L49-L55

**Request body (JSON)** — `PostCreateUpdateSerializer` fileciteturn3file2L19-L56
Writable fields:
- `title` (string, required)
- `excerpt` (string, required)
- `content` (string, required)
- `status` (enum string: draft/review/scheduled/published/archived)
- `visibility` (enum string: public/private/unlisted)
- `is_hot` (bool)
- `slug` (optional; if omitted server may auto-generate per model logic; serializer marks not required fileciteturn3file2L54-L56)
- `canonical_url` (string|null)
- `seo_title` (string)
- `seo_description` (string)
- Relationships (IDs):
  - `category_id` (int, optional)
  - `tag_ids` (int[], optional)
  - `cover_media_id` (int|null, optional)
  - `og_image_id` (int|null, optional)
  - `series` (int|null; comes from model field included in serializer fileciteturn3file2L44-L49)
- Publication helper:
  - `publish_at` (datetime|null, optional). If provided, serializer may set status to `scheduled` or `published` depending on date and requested status fileciteturn3file2L58-L88

Read-only fields (ignored if sent):
- `views_count`, `reading_time_sec` fileciteturn3file2L51-L53

**Behavior**
- `_handle_publication_date()` adjusts `status/published_at/scheduled_at` based on `publish_at` and status transitions fileciteturn3file2L58-L88.
- Actual post author is set in `perform_create()` in viewset, not from request body fileciteturn1file2L49-L55.

**Response (201)**
Created post serialized (DRF standard create response).

---

### 1.3 Retrieve Post (by slug)
**GET** `/api/blog/posts/{slug}/`

**Permissions / visibility**
Uses same queryset rules as other actions; plus increments views:
- On retrieve, it increments `views_count += 1` and saves update_fields=['views_count'] fileciteturn1file2L56-L61

**Response (200)** — `PostDetailSerializer`
Extends list response with:
- `content` (normalized: HTML->Markdown, strips script/style, preserves breaks) fileciteturn3file0L30-L50
- `canonical_url`, `series`, `seo_title`, `seo_description`, `og_image`
- `media_attachments` array derived from `PostMediaSerializer` (`media` + `attachment_type`) fileciteturn3file1L103-L118 fileciteturn3file2L11-L17

---

### 1.4 Update Post (full)
**PUT** `/api/blog/posts/{slug}/`

**Permissions**
- Only post author or admin can modify (object permission) fileciteturn3file6L30-L42

**Request body**
Same as Create (PostCreateUpdateSerializer) fileciteturn3file2L19-L56

**Behavior**
- Publication date handling applies on update too fileciteturn3file3L16-L18

**Response (200)** updated post

---

### 1.5 Partial Update
**PATCH** `/api/blog/posts/{slug}/`  
Same rules as PUT.

---

### 1.6 Delete Post
**DELETE** `/api/blog/posts/{slug}/`  
Author or admin only fileciteturn3file6L30-L42.

---

### 1.7 Similar Posts
**GET** `/api/blog/posts/{slug}/similar/` (DRF action) fileciteturn1file2L63-L79

**Behavior**
- Loads current post; if not found => NotFound fileciteturn1file2L65-L69
- If post has no category => returns empty list fileciteturn1file2L70-L72
- Otherwise: returns up to 5 latest published posts in same category excluding current fileciteturn1file2L73-L79

**Response (200)**
Array of `PostListSerializer`.

---

### 1.8 Same Category (paginated)
**GET** `/api/blog/posts/{slug}/same-category/` (DRF action, url_path=`same-category`) fileciteturn1file2L81-L97

**Behavior**
- If no category => empty paginated response fileciteturn1file2L86-L88
- Else: fetch published posts in same category with `published_at <= now` excluding current; paginate and return fileciteturn1file2L89-L97

---

### 1.9 Get Post by slug (alternate route)
**GET** `/api/blog/posts/slug/{slug}` (DRF action with regex url_path) fileciteturn1file3L9-L17  
Same output as detail; uses `PostDetailSerializer` fileciteturn1file3L16-L17.

---

### 1.10 Publish Post (explicit endpoint)
**POST** `/api/blog/posts/{slug}/publish/` (function-based view) fileciteturn3file4L33-L36

**Permissions**
- `IsAuthenticated` + `IsOwnerOrReadOnly` declared, plus explicit check inside: only author or staff allowed fileciteturn1file3L38-L49

**Behavior**
- Allowed only if status in `{draft, scheduled}`; otherwise 400 fileciteturn1file3L50-L54
- Sets `status='published'`, `published_at=now`, clears `scheduled_at`, saves fileciteturn1file3L56-L60

**Response (200)**
`PostDetailSerializer` payload fileciteturn1file3L60-L61

---

### 1.11 Related Posts (by shared tags)
**GET** `/api/blog/posts/{slug}/related/` (function-based view) fileciteturn3file4L34-L36

**Behavior**
- Loads current post or 404 fileciteturn1file3L65-L70
- Reads current post tag ids; if none => empty queryset fileciteturn1file3L71-L76
- Else: find published posts sharing tags, exclude current; annotate `common_tags` count and order by `-common_tags, -published_at, -id` fileciteturn1file3L77-L84
- Paginated response using `CustomPageNumberPagination` fileciteturn1file3L71-L87

---

## 2) Nested Post Comments (Approved only)

### 2.1 List approved comments for a post (nested router)
**GET** `/api/blog/posts/{post_slug}/comments/` (nested router) fileciteturn3file4L18-L20

**Permissions**
Read-only viewset + `IsAuthenticatedOrReadOnly` fileciteturn1file3L20-L24

**Query params**
- Pagination
- Ordering: `ordering` in `{created_at, likes_count}` (default `-created_at`) fileciteturn1file3L24-L27

**Behavior**
- Filters: only `status='approved'` for the post slug fileciteturn1file3L28-L33
- Annotates `likes_count` = number of reactions with `reaction='like'` fileciteturn1file3L33-L35
- `select_related('user__authorprofile')` for performance fileciteturn1file3L34-L36

**Response (200)** — `CommentListSerializer`
Fields: `id,user{username,profile_picture},content,created_at,parent,likes_count` fileciteturn3file1L75-L83

---

## 3) Media

### 3.1 List media
**GET** `/api/blog/media/`

**Permissions**
`IsAuthenticatedOrReadOnly` + `IsOwnerOrAdmin` fileciteturn1file4L5-L9

**Behavior**
- Ordered by newest `-created_at` fileciteturn1file4L5-L9

**Response (200)** — `MediaDetailSerializer` fields include `storage_key,url,type,mime,width,height,duration,size_bytes,alt_text,title,uploaded_by,created_at(Jalali)` fileciteturn3file0L52-L62

---

### 3.2 Upload media
**POST** `/api/blog/media/`

**Request**
Multipart form-data:
- `file` (required; validated by `validate_file`) fileciteturn3file0L63-L68
- `alt_text` (optional)
- `title` (optional; if missing defaults to sanitized filename) fileciteturn3file0L88-L91

**Behavior**
- Detects image by MIME; images are converted to AVIF (`convert_image_to_avif`) and mime forced to `image/avif` fileciteturn3file0L75-L80
- Sanitizes filename, saves via `default_storage`, stores `storage_key`, `url`, `size_bytes` fileciteturn3file0L83-L96
- For images attempts to read width/height with PIL; otherwise type is `video` or `file` fileciteturn3file0L97-L111
- View sets `uploaded_by=request.user` and sets title to uploaded filename if available fileciteturn1file4L19-L23
- Custom create response serializes with detail serializer fileciteturn1file4L24-L33

**Response (201)** MediaDetailSerializer

---

### 3.3 Retrieve / Update / Delete media
**GET/PUT/PATCH/DELETE** `/api/blog/media/{id}/`

**Permissions**
Owner or admin for writes (via `IsOwnerOrAdmin`) and read for everyone authenticated or not fileciteturn1file4L5-L9

---

### 3.4 Download media file (binary)
**GET** `/api/blog/media/{media_id}/download/` fileciteturn3file4L36-L37

**Behavior**
- Opens `Media.storage_key` from `default_storage` and streams as attachment (`FileResponse` with filename=media.title) fileciteturn1file5L18-L22

**Response**
Binary file download.

---

## 4) Authors

### 4.1 List / Create authors
**GET/POST** `/api/blog/authors/` fileciteturn3file4L21-L22

**Serializer**
`AuthorProfileSerializer` fields: `user, display_name, bio, avatar` fileciteturn3file1L18-L22

**Permissions**
`IsAuthenticatedOrReadOnly` + `IsOwnerOrAdmin` fileciteturn1file4L36-L40

### 4.2 Retrieve / Update / Delete author
**GET/PUT/PATCH/DELETE** `/api/blog/authors/{id}/`

---

## 5) Categories
**GET/POST** `/api/blog/categories/`  
**GET/PUT/PATCH/DELETE** `/api/blog/categories/{id}/`

**Permissions**
Admin-only for writes (`IsAdminUserOrReadOnly`) fileciteturn1file4L42-L46

**Serializer**
`CategorySerializer` fields: `id,slug,name,parent` and response expands parent into object when exists fileciteturn3file1L32-L46

---

## 6) Tags
**GET/POST** `/api/blog/tags/`  
**GET/PUT/PATCH/DELETE** `/api/blog/tags/{id}/`

**Permissions**
Admin-only for writes (`IsAdminUserOrReadOnly`) fileciteturn1file4L48-L52

**Serializer**
`TagSerializer` fields: `id,slug,name` fileciteturn3file1L48-L52

---

## 7) Series
**GET/POST** `/api/blog/series/`  
**GET/PUT/PATCH/DELETE** `/api/blog/series/{id}/`

**Permissions**
Admin-only writes (`IsAdminUserOrReadOnly`) fileciteturn1file4L54-L58

**Serializer**
`SeriesSerializer` uses `__all__` fileciteturn3file1L54-L58

---

## 8) Revisions
**GET/POST** `/api/blog/revisions/`  
**GET/PUT/PATCH/DELETE** `/api/blog/revisions/{id}/`

**Permissions**
`IsAuthenticatedOrReadOnly` + `IsOwnerOrAdmin` fileciteturn1file4L60-L64

**Serializer**
`RevisionSerializer` uses `__all__` fileciteturn3file3L21-L25

---

## 9) Comments (Global)
**GET/POST** `/api/blog/comments/`  
**GET/PUT/PATCH/DELETE** `/api/blog/comments/{id}/` fileciteturn2file5L71-L73

**Permissions**
`IsAuthenticatedOrReadOnly` + `IsOwnerOrAdmin` fileciteturn1file4L66-L70

**Visibility rules**
- Staff sees all comments. fileciteturn1file4L75-L78
- Non-staff only sees approved comments. fileciteturn1file4L78-L79

**Create behavior**
- On create, sets `user=request.user` and triggers async notification task `notify_author_on_new_comment.delay(comment_id)` fileciteturn1file4L80-L83

**Serializer**
`CommentSerializer` fields: `id,post,user,parent,content,created_at,status` (user is read-only PK) fileciteturn3file3L27-L34

---

## 10) Reactions
**GET/POST** `/api/blog/reactions/`  
**GET/PUT/PATCH/DELETE** `/api/blog/reactions/{id}/` fileciteturn2file6L5-L6

**Permissions**
Requires authentication for all (`IsAuthenticated`) + owner/admin write policy; non-admin users only see their own reactions. fileciteturn1file4L85-L98

**Request body**
`ReactionSerializer` fields: `reaction`, `content_type`, `object_id` (+ user/created_at are server/read-only) fileciteturn3file3L38-L45

**Validation**
Checks that target object exists for given content_type and object_id; else validation error. fileciteturn3file3L46-L53

---

## 11) Pages
**GET/POST** `/api/blog/pages/`  
**GET/PUT/PATCH/DELETE** `/api/blog/pages/{id}/`

**Permissions**
Admin-only writes (`IsAdminUserOrReadOnly`) fileciteturn1file4L103-L107

**Serializer**
`PageSerializer` uses `__all__` fileciteturn3file3L57-L61

---

## 12) Menus
**GET/POST** `/api/blog/menus/`  
**GET/PUT/PATCH/DELETE** `/api/blog/menus/{id}/`

**Permissions**
Admin-only writes (`IsAdminUserOrReadOnly`) fileciteturn1file5L1-L5

**Serializer**
`MenuSerializer` uses `__all__` and nests read-only `items[]` fileciteturn3file3L69-L75

---

## 13) Menu Items
**GET/POST** `/api/blog/menu-items/`  
**GET/PUT/PATCH/DELETE** `/api/blog/menu-items/{id}/`

**Permissions**
Admin-only writes (`IsAdminUserOrReadOnly`) fileciteturn1file5L7-L10

**Serializer**
`MenuItemSerializer` uses `__all__` fileciteturn3file3L63-L67

---

# Background Tasks (Celery)

## Increment post view count (async)
`increment_post_view_count(post_id)` updates `views_count = views_count + 1` using F-expression fileciteturn3file7L10-L20.

> Note: In the current `PostViewSet.retrieve()` implementation, views are incremented synchronously (`views_count += 1` then save) fileciteturn1file2L56-L60. The async task exists as an alternative.

## Notify author on new comment
`notify_author_on_new_comment(comment_id)` loads comment with related post/author/user, then triggers `send_email_notification.delay(...)` if author email exists fileciteturn3file7L23-L44.

## Publish scheduled posts
`publish_scheduled_posts()` finds posts with `status='scheduled'` and `scheduled_at <= now`, then bulk updates to published, setting `published_at=scheduled_at` and clearing `scheduled_at` fileciteturn3file7L48-L66.

---

# Appendix: Known API Inventory
A high-level list of blog routes is also captured in `sitemap.md` under the Blog section fileciteturn2file5L52-L77.
