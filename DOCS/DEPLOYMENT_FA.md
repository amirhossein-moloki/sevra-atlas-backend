# راهنمای استقرار (Deployment) پروژه Sevra Atlas

این راهنما مراحل گام‌به‌گام برای نصب و راه‌اندازی پروژه روی سرور لینوکس را توضیح می‌دهد.

## پیش‌نیازها
- یک سرور لینوکس (ترجیحاً Ubuntu 22.04 LTS)
- دسترسی SSH به سرور
- دامنه متصل شده به IP سرور (رکورد A)
- باز بودن پورت‌های 80 و 443 در فایروال

---

## مرحله ۱: آماده‌سازی سرور
ابتدا مخازن سیستم را به‌روزرسانی کرده و Docker را نصب کنید.

```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# اضافه کردن کاربر به گروه داکر (اختیاری - برای عدم نیاز به sudo)
sudo usermod -aG docker $USER
# سپس یک بار Logout و Login کنید
```

---

## مرحله ۲: دریافت کد پروژه
کد پروژه را از مخزن گیت کلون کنید.

```bash
git clone <URL_مخزن_پروژه> sevra-atlas
cd sevra-atlas
```

---

## مرحله ۳: تنظیم متغیرهای محیطی
فایل نمونه تنظیمات تولید را کپی کرده و مقادیر واقعی را در آن وارد کنید.

```bash
cp .env.production.example .env.production
nano .env.production
```

**نکات مهم در تنظیمات:**
- `DOMAIN`: نام دامنه خود را وارد کنید (مثلاً `api.sevra.ir`).
- `EMAIL`: ایمیل خود را برای گواهینامه SSL وارد کنید.
- `DATABASE_URL`: یک پسورد بسیار قوی برای دیتابیس انتخاب کنید.
- `JWT_ACCESS_SECRET` و سایر سکرت‌ها: از رشته‌های طولانی و تصادفی استفاده کنید.

---

## مرحله ۴: راه‌اندازی گواهینامه SSL
ما از یک اسکریپت آماده برای دریافت گواهینامه رایگان Let's Encrypt استفاده می‌کنیم.

```bash
chmod +x proxy/scripts/init-letsencrypt.sh
./proxy/scripts/init-letsencrypt.sh
```
این اسکریپت به صورت خودکار Nginx را بالا آورده و گواهینامه SSL را دریافت می‌کند.

---

## مرحله ۵: اجرای سرویس‌ها
حالا می‌توانید تمام سرویس‌ها (API, Worker, Database, Redis) را اجرا کنید.

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## مرحله ۶: بررسی وضعیت
برای اطمینان از صحت عملکرد، وضعیت کانتینرها و لاگ‌ها را بررسی کنید.

```bash
# مشاهده وضعیت کانتینرها
docker compose -f docker-compose.prod.yml ps

# مشاهده لاگ‌ها
docker compose -f docker-compose.prod.yml logs -f api
```

---

## دستورات کاربردی عملیاتی

### بک‌آپ گرفتن از دیتابیس
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U jules sevra_atlas > ./backups/backup_$(date +%F).sql
```

### آپدیت کردن پروژه به نسخه جدید
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
*نکته: مایگریشن‌های دیتابیس به صورت خودکار انجام می‌شوند.*

### ریختن داده‌های اولیه (Seed) - اختیاری
اگر می‌خواهید دیتابیس با داده‌های اولیه (مثل دسته‌بندی‌ها و تنظیمات پایه) پر شود:
```bash
docker compose -f docker-compose.prod.yml exec api npm run prisma:seed
```

### تست سلامت پیکربندی تولید
برای اطمینان از اینکه تمام متغیرهای محیطی و اتصال به دیتابیس/ردیس درست است:
```bash
docker compose -f docker-compose.prod.yml exec api npm run verify:prod
```

### مشاهده سلامت سیستم
می‌توانید به آدرس زیر در مرورگر بروید:
`https://your-domain.com/api/v1/health`

---

## امنیت (Security)
- حتماً فایروال سرور (UFW) را تنظیم کنید تا فقط پورت‌های ضروری باز باشند.
- دسترسی SSH را محدود کنید.
- از پسوردهای ضعیف در فایل `.env` اکیداً خودداری کنید.
