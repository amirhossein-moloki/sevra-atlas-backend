# گزارش بحران مستندسازی API و اعتبارسنجی قرارداد (API Documentation & Contract Validation Crisis Report)

## وضعیت فعلی (Current Status)
در حال حاضر، پروژه از `express-openapi-validator` با تنظیمات سخت‌گیرانه (`ignoreUndocumented: false`) استفاده می‌کند. این به این معنی است که هر مسیری (Route) که در مشخصات OpenAPI ثبت نشده باشد، توسط سیستم ریجکت می‌شود.

**مشکل اصلی:** بیش از ۸۰ مسیر عملیاتی در کد پیاده‌سازی شده‌اند اما در مشخصات OpenAPI ثبت نشده‌اند. این موضوع باعث شده است که بخش‌های حیاتی محصول (سالن‌ها، هنرمندان، بخش عمده بلاگ و سئو) در محیط‌هایی که این اعتبارسنج فعال است، عملاً غیرقابل استفاده باشند.

---

## ۱. لیست ماژول‌های فاقد مستندات (Undocumented Modules)
بر اساس خروجی اسکریپت `audit-routes` در حال حاضر مسیرهای زیر کاملاً مستند نشده‌اند:

- **Directory:**
    - `Salons` (تمامی مسیرها: ایجاد، ویرایش، حذف، گالری، خدمات و غیره)
    - `Artists` (تمامی مسیرها: ایجاد، پروفایل، گواهی‌نامه‌ها، تخصص‌ها و غیره)
    - `Specialties`
- **Blog (Major Gaps):**
    - `Taxonomy` (دسته بندی ها، تگ ها، سری ها)
    - `Authors` (مدیریت پروفایل نویسندگان)
    - `Comments` (مدیریت کامنت ها و وضعیت آن ها)
    - `Misc` (صفحات ایستا، منوها، ریویژن ها)
- **Shared Features:**
    - `Reviews` (ثبت نظر و رای‌دهی)
    - `Follows` & `Saves` (سیستم دنبال کردن و ذخیره‌سازی)
    - `Reports` (گزارش تخلفات)
    - `Verification` (درخواست‌های احراز هویت)
- **SEO:**
    - `Redirects` و `Meta Tags`

---

## ۲. ایرادات شناسایی شده (Identified Flaws)

### الف) عدم ثبت مسیرها (Missing Registration)
اکثر ماژول‌ها دارای فایل `routes.ts` و `validators.ts` هستند و حتی از متد `.openapi()` در Zod استفاده کرده‌اند، اما فراخوانی کلیدی `registry.registerPath()` را انجام نداده‌اند.

### ب) ناهماهنگی در ساختار پاسخ (Response Envelope Mismatch)
سیستم از `responseMiddleware` برای بسته‌بندی پاسخ‌ها در یک Envelope استاندارد استفاده می‌کند:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "..." }
}
```
اما اکثر مستندات موجود (مانند Media یا Auth)، این Envelope را در طرح (Schema) خود لحاظ نکرده‌اند.
**نتیجه:** حتی پس از مستندسازی مسیر، اعتبارسنج OpenAPI به دلیل وجود فیلدهای اضافی (`success`, `meta`) خطای ۵۰۰ صادر خواهد کرد.

### ج) استفاده از `z.any()`
در بسیاری از مسیرهای "مستند شده"، برای پاسخ‌ها از `z.any()` استفاده شده است. این کار عملاً هدف "تست قرارداد" (Contract Testing) را از بین می‌برد و اجازه می‌دهد داده‌های ناصحیح بدون هیچ خطایی از سیستم خارج شوند.

### د) ناهماهنگی در آدرس مسیرها (Path Inconsistency)
در برخی موارد، آدرس تعریف شده در Express با آدرس ثبت شده در OpenAPI تفاوت جزئی دارد (مثلاً `/slug/:slug` در مقابل `{slug}`). این تفاوت باعث می‌شود اعتبارسنج نتواند مسیر را پیدا کند.

### ه) فقدان تعاریف امنیتی (Security Definitions)
بسیاری از مسیرهایی که نیاز به توکن دارند (`requireAuth`)، در مستندات فاقد تعریف `security: [{ bearerAuth: [] }]` هستند.

---

## ۳. تأثیرات بیزینسی و فنی (Impact)
- **مسدود شدن عملیات (Blocker):** ۹۰٪ قابلیت‌های پنل مدیریت و اپلیکیشن در حالت استیکت کار نمی‌کنند.
- **توقف تست‌های E2E:** تست‌های خودکار که بر اساس مشخصات API کار می‌کنند با شکست مواجه می‌شوند.
- **ریسک تولید (Production Risk):** فعال کردن این اعتبارسنج در محیط تولید بدون حل این مشکل باعث Down شدن کل سرویس می‌شود.

---

## ۴. نقشه راه پیشنهادی برای رفع مشکل (Roadmap)

1. **استانداردسازی طرح پاسخ (Response Wrapping):** ایجاد یک Utility در Zod برای بسته‌بندی خودکار تمامی Schemaها در Envelope موفقیت/شکست.
2. **مستندسازی فازبندی شده:**
    - فاز ۱: Directory (Salons, Artists) - اولویت بالا
    - فاز ۲: Blog Taxonomy & Management - اولویت متوسط
    - فاز ۳: SEO & Misc - اولویت پایین
3. **اصلاح مستندات موجود:** جایگزینی `z.any()` با مدلهای واقعی در ماژول‌های Media و Auth.
4. **یکپارچه‌سازی اسکریپت Audit در CI/CD:** جلوگیری از Merge شدن کدهایی که مسیر جدید ایجاد می‌کنند اما مستندات آن را ارائه نمی‌دهند.
5. **اصلاح `app.ts` (موقت):** تا زمان تکمیل فاز ۱، می‌توان `ignoreUndocumented: true` را در محیط‌های غیر از Development تنظیم کرد تا جلوی از کار افتادن کل سیستم گرفته شود.

---
*این گزارش به عنوان مرجع اصلی برای اصلاحات آتی در فایل `API_CRISIS_REPORT.md` ثبت شد.*
\n\n## ۵. پیوست: قالب‌های آماده برای مستندسازی (Appendix: Documentation Templates)\n
--- Documentation Templates for Module: seo ---

registry.registerPath({
  method: 'get',
  path: '/seo/redirects/resolve',
  summary: 'GET /seo/redirects/resolve',
  tags: ['Seo'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/seo/meta',
  summary: 'POST /seo/meta',
  tags: ['Seo'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/seo/redirects',
  summary: 'POST /seo/redirects',
  tags: ['Seo'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/seo/sitemap/rebuild',
  summary: 'POST /seo/sitemap/rebuild',
  tags: ['Seo'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: salons ---

registry.registerPath({
  method: 'get',
  path: '/salons',
  summary: 'GET /salons',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/salons/{slug}',
  summary: 'GET /salons/:slug',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/salons/{slug}/reviews',
  summary: 'GET /salons/:slug/reviews',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/salons',
  summary: 'POST /salons',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/salons/{id}',
  summary: 'PATCH /salons/:id',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/salons/{id}',
  summary: 'DELETE /salons/:id',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/salons/{id}/services',
  summary: 'POST /salons/:id/services',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/salons/{id}/services/{serviceId}',
  summary: 'DELETE /salons/:id/services/:serviceId',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/salons/{id}/avatar',
  summary: 'POST /salons/:id/avatar',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/salons/{id}/cover',
  summary: 'POST /salons/:id/cover',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/salons/{id}/gallery',
  summary: 'POST /salons/:id/gallery',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/salons/{id}/artists',
  summary: 'POST /salons/:id/artists',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/salons/{id}/artists/{artistId}',
  summary: 'DELETE /salons/:id/artists/:artistId',
  tags: ['Salons'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: artists ---

registry.registerPath({
  method: 'get',
  path: '/artists',
  summary: 'GET /artists',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/artists/specialties',
  summary: 'GET /artists/specialties',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/artists/{slug}',
  summary: 'GET /artists/:slug',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/artists/{slug}/reviews',
  summary: 'GET /artists/:slug/reviews',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/artists',
  summary: 'POST /artists',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/artists/{id}',
  summary: 'PATCH /artists/:id',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/artists/{id}',
  summary: 'DELETE /artists/:id',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/artists/{id}/avatar',
  summary: 'POST /artists/:id/avatar',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/artists/{id}/cover',
  summary: 'POST /artists/:id/cover',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/artists/{id}/gallery',
  summary: 'POST /artists/:id/gallery',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/artists/{id}/certifications',
  summary: 'POST /artists/:id/certifications',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/artists/{id}/certifications/{certId}',
  summary: 'PATCH /artists/:id/certifications/:certId',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/artists/{id}/certifications/{certId}',
  summary: 'DELETE /artists/:id/certifications/:certId',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/artists/{id}/certifications/{certId}/verify',
  summary: 'PATCH /artists/:id/certifications/:certId/verify',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/artists/{id}/specialties',
  summary: 'POST /artists/:id/specialties',
  tags: ['Artists'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: specialties ---

registry.registerPath({
  method: 'get',
  path: '/specialties',
  summary: 'GET /specialties',
  tags: ['Specialties'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/specialties',
  summary: 'POST /specialties',
  tags: ['Specialties'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/specialties/{id}',
  summary: 'PATCH /specialties/:id',
  tags: ['Specialties'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/specialties/{id}',
  summary: 'DELETE /specialties/:id',
  tags: ['Specialties'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: blog ---

registry.registerPath({
  method: 'get',
  path: '/blog/posts/slug/{slug}',
  summary: 'GET /blog/posts/slug/:slug',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/categories',
  summary: 'GET /blog/taxonomy/categories',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/taxonomy/categories',
  summary: 'POST /blog/taxonomy/categories',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/categories/{id}',
  summary: 'GET /blog/taxonomy/categories/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/taxonomy/categories/{id}',
  summary: 'PATCH /blog/taxonomy/categories/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/taxonomy/categories/{id}',
  summary: 'DELETE /blog/taxonomy/categories/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/tags',
  summary: 'GET /blog/taxonomy/tags',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/taxonomy/tags',
  summary: 'POST /blog/taxonomy/tags',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/tags/{id}',
  summary: 'GET /blog/taxonomy/tags/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/taxonomy/tags/{id}',
  summary: 'PATCH /blog/taxonomy/tags/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/taxonomy/tags/{id}',
  summary: 'DELETE /blog/taxonomy/tags/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/series',
  summary: 'GET /blog/taxonomy/series',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/taxonomy/series',
  summary: 'POST /blog/taxonomy/series',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/series/{id}',
  summary: 'GET /blog/taxonomy/series/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/taxonomy/series/{id}',
  summary: 'PATCH /blog/taxonomy/series/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/taxonomy/series/{id}',
  summary: 'DELETE /blog/taxonomy/series/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/misc/revisions/{postId}',
  summary: 'GET /blog/misc/revisions/:postId',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/misc/reactions',
  summary: 'POST /blog/misc/reactions',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/misc/pages',
  summary: 'GET /blog/misc/pages',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/misc/pages/{slug}',
  summary: 'GET /blog/misc/pages/:slug',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/misc/pages',
  summary: 'POST /blog/misc/pages',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/misc/pages/{id}',
  summary: 'PATCH /blog/misc/pages/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/misc/pages/{id}',
  summary: 'DELETE /blog/misc/pages/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/misc/menus/{location}',
  summary: 'GET /blog/misc/menus/:location',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/misc/menus',
  summary: 'POST /blog/misc/menus',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/misc/menus/{id}',
  summary: 'PATCH /blog/misc/menus/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/misc/menus/{id}',
  summary: 'DELETE /blog/misc/menus/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/misc/menu-items',
  summary: 'POST /blog/misc/menu-items',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/misc/menu-items/{id}',
  summary: 'PATCH /blog/misc/menu-items/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/misc/menu-items/{id}',
  summary: 'DELETE /blog/misc/menu-items/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/authors',
  summary: 'GET /blog/authors',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/authors/{id}',
  summary: 'GET /blog/authors/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/blog/authors',
  summary: 'POST /blog/authors',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/authors/{id}',
  summary: 'PATCH /blog/authors/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/authors/{id}',
  summary: 'DELETE /blog/authors/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/blog/comments',
  summary: 'GET /blog/comments',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/blog/comments/{id}/status',
  summary: 'PATCH /blog/comments/:id/status',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/blog/comments/{id}',
  summary: 'DELETE /blog/comments/:id',
  tags: ['Blog'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: reviews ---

registry.registerPath({
  method: 'post',
  path: '/reviews',
  summary: 'POST /reviews',
  tags: ['Reviews'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'post',
  path: '/reviews/{id}/vote',
  summary: 'POST /reviews/:id/vote',
  tags: ['Reviews'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/reviews/{id}',
  summary: 'DELETE /reviews/:id',
  tags: ['Reviews'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: follow ---

registry.registerPath({
  method: 'post',
  path: '/follow',
  summary: 'POST /follow',
  tags: ['Follow'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/follow',
  summary: 'DELETE /follow',
  tags: ['Follow'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/follow/me',
  summary: 'GET /follow/me',
  tags: ['Follow'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: save ---

registry.registerPath({
  method: 'post',
  path: '/save',
  summary: 'POST /save',
  tags: ['Save'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'delete',
  path: '/save',
  summary: 'DELETE /save',
  tags: ['Save'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/save/me',
  summary: 'GET /save/me',
  tags: ['Save'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: reports ---

registry.registerPath({
  method: 'post',
  path: '/reports',
  summary: 'POST /reports',
  tags: ['Reports'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/reports',
  summary: 'GET /reports',
  tags: ['Reports'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/reports/{id}/status',
  summary: 'PATCH /reports/:id/status',
  tags: ['Reports'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});



--- Documentation Templates for Module: verification ---

registry.registerPath({
  method: 'post',
  path: '/verification/request',
  summary: 'POST /verification/request',
  tags: ['Verification'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'get',
  path: '/verification/requests',
  summary: 'GET /verification/requests',
  tags: ['Verification'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});


registry.registerPath({
  method: 'patch',
  path: '/verification/{id}',
  summary: 'PATCH /verification/:id',
  tags: ['Verification'],
  responses: {
    200: {
      description: 'OK',
      content: { 'application/json': { schema: z.any() } }
    }
  }
});
