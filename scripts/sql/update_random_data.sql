-- ۱. اختصاص ۲ تخصص (Specialty) به صورت تصادفی به هر آرتیست
INSERT INTO "ArtistSpecialty" ("artistId", "specialtyId", "isActive", "order")
SELECT a.id, s.id, true, 0
FROM "Artist" a
CROSS JOIN LATERAL (
  SELECT id FROM "Specialty"
  ORDER BY random()
  LIMIT 2
) s
ON CONFLICT ("artistId", "specialtyId") DO NOTHING;

-- ۲. اختصاص هر آرتیست به یک سالن تصادفی (هر آرتیست حداکثر در ۱ سالن)
INSERT INTO "SalonArtist" ("artistId", "salonId", "isActive", "createdAt", "roleTitle")
SELECT a.id, s.id, true, NOW(), 'آرتیست'
FROM "Artist" a
CROSS JOIN LATERAL (
  SELECT id FROM "Salon"
  ORDER BY random()
  LIMIT 1
) s
WHERE NOT EXISTS (SELECT 1 FROM "SalonArtist" sa WHERE sa."artistId" = a.id)
ON CONFLICT ("salonId", "artistId") DO NOTHING;

-- ۳. قرار دادن آدرس رندوم از تبریز برای تمام سالن‌ها
DO $$
DECLARE
    tabriz_city_id bigint;
    tabriz_province_id bigint;
BEGIN
    -- پیدا کردن آیدی شهر تبریز و استان آذربایجان شرقی
    SELECT id, "provinceId" INTO tabriz_city_id, tabriz_province_id
    FROM "City"
    WHERE "nameFa" = 'تبریز'
    LIMIT 1;

    -- اگر شهر تبریز در دیتابیس موجود بود
    IF tabriz_city_id IS NOT NULL THEN
        UPDATE "Salon" s
        SET
            "cityId" = tabriz_city_id,
            "provinceId" = tabriz_province_id,
            "neighborhoodId" = (
                SELECT n.id FROM "Neighborhood" n
                WHERE n."cityId" = tabriz_city_id
                ORDER BY random()
                LIMIT 1
            ),
            "addressLine" = 'تبریز، ' || (ARRAY['ولیعصر', 'آبرسان', 'ائل گلی', 'منصور', 'شهناز', 'دانشگاه', 'رشدیه', 'باغمیشه', 'یاغچیان', 'مرزداران'])[floor(random()*10)+1] || '، پلاک ' || floor(random()*100 + 1)
        WHERE s."deletedAt" IS NULL;
    END IF;
END $$;
