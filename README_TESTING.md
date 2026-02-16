# Sevra Atlas - Automated Postman Testing Suite

این مجموعه (Collection) و محیط (Environment) برای تست کامل و اتوماتیک APIهای پروژه **Sevra Atlas** طراحی شده است.

## 🚀 محتویات
- `Sevra-Atlas.postman_collection.json`: شامل تمامی Endpointهای استخراج شده از OpenAPI با تست‌های اتوماتیک و زنجیره‌سازی داده‌ها (Chaining).
- `Sevra-Atlas.postman_environment.json`: متغیرهای مورد نیاز برای اجرای تست‌ها در محیط‌های مختلف.

## 🛠 پیش‌نیازها
1. نصب **Postman** یا استفاده از **Newman** برای اجرای خط فرمان.
2. دسترسی به سرور در حال اجرا (پیش‌فرض: `http://localhost:3000/api/v1`).
3. تنظیم بودن دیتابیس (ترجیحاً Seed شده).

## ⚙️ نحوه تنظیم Environment
قبل از اجرا، مقادیر زیر را در `Sevra-Atlas.postman_environment.json` یا در تب Environment در Postman چک کنید:
- `baseUrl`: آدرس پایه API.
- `testPhoneNumber`: شماره تستی برای دریافت OTP (مثلاً `09120000000`).
- `testOtpCode`: کد OTP تستی (اگر سیستم روی حالت Mock است، مقدار `123456` و اگر می‌خواهید مرحله Verify را رد کنید، مقدار `SKIP` را قرار دهید).
- `adminAccessToken`: توکن یک کاربر با نقش ADMIN (برای تست‌های بخش Admin الزامی است).

## 🏃 نحوه اجرا

### از طریق رابط کاربری Postman:
1. فایل‌های JSON را Import کنید.
2. محیط **Sevra-Atlas** را انتخاب کنید.
3. روی نام Collection راست کلیک کرده و **Run collection** را بزنید.
4. ترتیب فولدرها برای رعایت وابستگی‌ها (Chaining) تنظیم شده است.

### از طریق Newman (CLI):
```bash
newman run Sevra-Atlas.postman_collection.json -e Sevra-Atlas.postman_environment.json
```

## 📝 ویژگی‌های تست‌های اتوماتیک
- **Idempotency**: اکثر تست‌ها با استفاده از `uniqueSuffix` داده‌های یکتا می‌سازند تا با اجرای مجدد تداخل نداشته باشند.
- **Data Chaining**: آی‌دی‌های ایجاد شده در مراحل قبل (مانند `salonId` یا `postId`) به‌طور خودکار ذخیره شده و در درخواست‌های بعدی (GET/PATCH/DELETE) استفاده می‌شوند.
- **Validation**: ساختار پاسخ‌ها (success, data, error) و وضعیت کدهای HTTP در هر درخواست چک می‌شود.
- **Graceful Skip**: اگر مقدار `testOtpCode` برابر با `SKIP` باشد، درخواست Verify OTP اجرا نخواهد شد.

## ⚠️ نکات مهم
- برای تست آپلود فایل (`POST /media/upload`)، باید به‌صورت دستی در Postman یک فایل انتخاب کنید، زیرا Postman مسیر فایل‌ها را در Export ذخیره نمی‌کند.
- تست‌های بخش Admin نیازمند توکن معتبر ادمین در متغیر `adminAccessToken` هستند.
