# مستندات فیلدهای دایرکتوری (سالن و آرتیست)

این فایل حاوی لیست کامل فیلدهای تعریف شده در دیتابیس برای مدل‌های **سالن (Salon)** و **آرتیست (Artist)** می‌باشد.

---

### ۱. فیلدهای مدل سالن (Salon)
این فیلدها در جدول `salons` ذخیره می‌شوند و مربوط به اطلاعات آرایشگاه‌ها و مجموعه‌های زیبایی هستند.

| نام فیلد (Technical Name) | نوع داده (Type) | توضیح فارسی |
| :--- | :--- | :--- |
| `id` | BigInt | شناسه عددی و خودکار (Primary Key) |
| `name` | String | نام سالن |
| `slug` | String | شناسه متنی برای URL (یکتا) |
| `summary` | String (Text) | خلاصه معرفی کوتاه |
| `description` | String (Text) | توضیحات کامل و بیوگرافی سالن |
| `phone` | String | شماره تماس ثابت یا همراه سالن |
| `instagram` | String | آدرس صفحه اینستاگرام |
| `website` | String | آدرس وب‌سایت سالن |
| `provinceId` | BigInt | شناسه استان (ارتباط با جدول Province) |
| `cityId` | BigInt | شناسه شهر (ارتباط با جدول City) |
| `neighborhoodId` | BigInt | شناسه محله (ارتباط با جدول Neighborhood) |
| `addressLine` | String (Text) | آدرس دقیق پستی |
| `postalCode` | String | کد پستی ۱۰ رقمی |
| `lat` / `lng` | Float | مختصات جغرافیایی (عرض و طول) |
| `openingHoursId` | BigInt | شناسه مربوط به جدول ساعات کاری |
| `isWomenOnly` | Boolean | وضعیت "مخصوص بانوان" (True/False) |
| `priceTier` | Int | رده قیمتی (مثلاً ۱ تا ۴) |
| `avatarMediaId` | BigInt | شناسه تصویر پروفایل (لوگو) |
| `coverMediaId` | BigInt | شناسه تصویر کاور (سربرگ) |
| `seoMetaId` | BigInt | شناسه تنظیمات سئو (Meta Title/Desc) |
| `verification` | Enum | وضعیت تایید (NONE, PENDING, VERIFIED, REJECTED) |
| `status` | Enum | وضعیت اکانت (ACTIVE, SUSPENDED, DELETED) |
| `planId` | BigInt | شناسه پلن اشتراک (Free/Pro/VIP) |
| `subscriptionStatus`| Enum | وضعیت اشتراک فعلی |
| `visibilityScore` | Float | امتیاز نمایش در جستجوها |
| `avgRating` | Float | میانگین امتیاز کاربران |
| `reviewCount` | Int | تعداد کل نظرات ثبت شده |
| `primaryOwnerId` | BigInt | شناسه کاربر مالک اصلی سالن |
| `createdAt` | DateTime | زمان ایجاد رکورد |
| `updatedAt` | DateTime | زمان آخرین ویرایش |

---

### ۲. فیلدهای مدل آرتیست (Artist)
این فیلدها در جدول `artists` ذخیره می‌شوند و مربوط به متخصصین و هنرمندان زیبایی هستند.

| نام فیلد (Technical Name) | نوع داده (Type) | توضیح فارسی |
| :--- | :--- | :--- |
| `id` | BigInt | شناسه عددی و خودکار |
| `fullName` | String | نام و نام خانوادگی کامل آرتیست |
| `slug` | String | شناسه متنی برای URL (یکتا) |
| `summary` | String (Text) | خلاصه رزومه |
| `bio` | String (Text) | بیوگرافی کامل و توضیحات تخصصی |
| `phone` | String | شماره تماس |
| `instagram` | String | آدرس اینستاگرام |
| `website` | String | وب‌سایت شخصی |
| `cityId` | BigInt | شناسه شهر محل فعالیت |
| `neighborhoodId` | BigInt | شناسه محله |
| `avatarMediaId` | BigInt | شناسه تصویر پروفایل |
| `coverMediaId` | BigInt | شناسه تصویر کاور |
| `seoMetaId` | BigInt | تنظیمات سئو |
| `verification` | Enum | وضعیت تایید تخصص و هویت |
| `status` | Enum | وضعیت اکانت در سامانه |
| `planId` | BigInt | شناسه پلن عضویت |
| `subscriptionStatus`| Enum | وضعیت اشتراک |
| `visibilityScore` | Float | امتیاز اولویت در نمایش |
| `avgRating` | Float | میانگین امتیاز |
| `reviewCount` | Int | تعداد نظرات |
| `primaryOwnerId` | BigInt | شناسه کاربر صاحب این پروفایل |
| `createdAt` | DateTime | زمان ثبت‌نام در سامانه |
| `updatedAt` | DateTime | زمان آخرین تغییر اطلاعات |

---

### ۳. فیلدهای تکمیلی و روابط

#### گواهینامه‌های آرتیست (ArtistCertification)
| نام فیلد | توضیح |
| :--- | :--- |
| `title` | عنوان گواهینامه |
| `issuer` | صادرکننده (موسسه/استاد) |
| `isVerified` | تایید شده توسط سیستم |

#### همکاری سالن و آرتیست (SalonArtist)
| نام فیلد | توضیح |
| :--- | :--- |
| `roleTitle` | سمت آرتیست در سالن |
| `isActive` | وضعیت فعلی همکاری |
| `startedAt` | تاریخ شروع همکاری |
