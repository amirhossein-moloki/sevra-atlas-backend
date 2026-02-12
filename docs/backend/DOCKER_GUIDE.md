# راهنمای اجرای پروژه با استفاده از Docker

این راهنما برای توسعه‌دهندگانی است که می‌خواهند پروژه Sevra Atlas را در محیط‌های ایزوله داکر اجرا کنند.

## ۱. پیش‌نیازها
مطمئن شوید که موارد زیر روی سیستم شما نصب هستند:
- **Docker** (نسخه ۲۰ به بالا)
- **Docker Compose** (نسخه ۲ به بالا)

## ۲. تنظیمات اولیه
پروژه برای اجرا به متغیرهای محیطی نیاز دارد. ابتدا فایل نمونه را کپی کنید:

```bash
cp .env.example .env
```

سپس فایل `.env` را ویرایش کرده و مقادیر زیر را حتماً مقداردهی کنید:
- `JWT_ACCESS_SECRET`: یک رشته تصادفی و امن
- `JWT_REFRESH_SECRET`: یک رشته تصادفی و امن دیگر

*نکته: مقادیر مربوط به دیتابیس و ردیس در فایل `docker-compose.yml` به صورت پیش‌فرض تنظیم شده‌اند و با تنظیمات داخلی کانتینرها هماهنگ هستند.*

## ۳. راه‌اندازی سرویس‌ها
برای شروع فرآیند ساخت ایمیج‌ها و اجرای کانتینرها، دستور زیر را در ریشه پروژه اجرا کنید:

```bash
docker-compose up -d
```

این دستور سرویس‌های زیر را بالا می‌آورد:
- `postgres`: پایگاه داده اصلی (پورت ۵۴۳۲)
- `redis_cache`: برای کش و مدیریت OTP (پورت ۶۳۷۹)
- `redis_queue`: برای صف‌های پس‌زمینه (پورت ۶۳۸۰)
- `app`: سرور اصلی Express (پورت ۳۰۰۰)
- `worker`: پردازشگر کارهای پس‌زمینه

## ۴. آماده‌سازی دیتابیس
پس از اینکه کانتینرها با موفقیت بالا آمدند، باید ساختار دیتابیس را ایجاد کنید:

```bash
# ایجاد جداول
docker-compose exec app npx prisma migrate dev --name init

# ریختن داده‌های اولیه (اختیاری)
docker-compose exec app npm run prisma:seed
```

## ۵. دسترسی به اپلیکیشن
- **API اصلی:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **مستندات Swagger:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **پنل مدیریت (AdminJS):** [http://localhost:3000/backoffice](http://localhost:3000/backoffice)

## ۶. دستورات پرکاربرد

### مشاهده وضعیت کانتینرها
```bash
docker-compose ps
```

### مشاهده لاگ‌های اپلیکیشن
```bash
docker-compose logs -f app
```

### متوقف کردن همه سرویس‌ها
```bash
docker-compose down
```

### بازسازی ایمیج‌ها (بعد از تغییر در package.json)
```bash
docker-compose up -d --build
```

### اجرای دستورات داخل کانتینر
```bash
docker-compose exec app <command>
```
