# Domain Detection & Schema Intelligence Report

## PHASE 0 — Autonomous Domain Detection

### 1. Domain Classification
- **Primary Domain**: Marketplace / Service Directory (specifically Beauty & Wellness).
- **Secondary Domain**: CMS / Content Platform (Blog).
- **Tertiary Domain**: SaaS / Subscription (Monetization for listings).

### 2. Confidence Level
- **95%**

### 3. Justification Reasoning
- **Model Names**: `Salon`, `Artist`, `ArtistCertification`, `SalonArtist`, `ServiceDefinition`, `OpeningHours`. These are highly specific to a service-based marketplace.
- **Field Names**: `isWomenOnly`, `priceTier`, `avgRating`, `reviewCount`, `lat`/`lng` (geospatial search), `nameFa` (Iranian locale).
- **Financial Indicators**: `Payment`, `Plan`, `Subscription`, `BillingHistory`, `price` in `BigInt` (typical for Iranian Rial - IRR).
- **SEO Focus**: Extensive SEO models (`SeoMeta`, `RedirectRule`, `SitemapUrl`, `SlugHistory`) indicate a platform where organic traffic is a primary growth driver.

### 4. Risk of Misclassification
- **Low**. The structure is clearly designed for a two-sided marketplace (Owners vs. Customers) with a strong content layer.

---

## PHASE 1 — Deep Schema Intelligence

### 1. Structural Analysis
- **Core Entities**:
    - `User`: Central identity with roles (USER, SALON, ARTIST, AUTHOR, ADMIN).
    - `Salon` & `Artist`: Primary service providers.
    - `Post`: Content entity for the blog.
- **Taxonomy**: `ServiceCategory` -> `ServiceDefinition`, `Specialty`, `Category`, `Tag`, `Series`.
- **Geographic**: `Province` -> `City` -> `Neighborhood`.
- **Engagement**: `Review`, `Comment`, `Follow`, `Save`, `Reaction`.
- **Infrastructure**: `Media`, `SeoMeta`, `AnalyticsEvent`.
- **Monetization**: `Plan`, `Subscription`, `Payment`.

### 2. Dependency Graph & Insertion Order
To maintain referential integrity, data must be inserted in the following order:
1. **Level 0 (Independent)**: `Province`, `OpeningHours`, `Media`, `Plan`, `Specialty`, `ServiceCategory`.
2. **Level 1**: `City` (Province), `User` (City), `ServiceDefinition` (ServiceCategory), `Category` (SeoMeta).
3. **Level 2**: `Neighborhood` (City), `AuthorProfile` (User), `Salon` (User, City, OpeningHours, Plan), `Artist` (User, City, Plan), `Tag`, `Series`.
4. **Level 3**: `SalonArtist` (Salon, Artist), `SalonService` (Salon, ServiceDefinition), `ArtistSpecialty` (Artist, Specialty), `ArtistCertification` (Artist), `Post` (AuthorProfile, Category, Series, Media).
5. **Level 4**: `Review` (User, Salon/Artist), `Comment` (Post, User), `Subscription` (Plan, Salon/Artist), `PostTag` (Post, Tag).
6. **Level 5**: `Payment` (User, Plan, Salon/Artist), `BillingHistory` (Subscription), `Save`, `Follow`, `Report`, `ReviewVote`.

### 3. Constraint Risk Map
- **Unique Slugs**: `Salon`, `Artist`, `Post`, `Category`, `Tag`, `Series`, `Province`, `City`, `ServiceDefinition`, `Specialty` all require unique slugs.
- **Composite Uniques**:
    - `User.phoneNumber` (E164 format).
    - `User.username`.
    - `SalonArtist` (salonId + artistId).
    - `Follow` (followerId + targetType + salonId + artistId).
    - `Save` (userId + targetType + salonId + artistId + postId).
- **Polymorphic Relations**: `Media`, `SeoMeta`, `Report`, `Save`, `Follow` use `EntityType` or `TargetType` enums, requiring strict application-level enforcement of relational integrity.

### 4. Referential Integrity Map
- **Cascade Deletes**:
    - `User` -> `AuthorProfile`, `Revision`, `Comment`, `Reaction`, `Review`, `Report`, `Follow`, `Save`, `VerificationRequest`, `RefreshToken`.
    - `Salon`/`Artist` -> `SalonArtist`, `SalonService`, `ArtistSpecialty`, `Review`, `Save`, `Follow`, `Report`, `VerificationRequest`, `Subscription`.
    - `Post` -> `PostTag`, `Revision`, `Comment`, `PostMedia`, `Save`.
- **SetNull**:
    - `User` (inviter) -> `invitedBy`.
    - `Media` (uploader) -> `uploadedBy`.
    - `City` (province) -> `provinceId`.
    - `Salon`/`Artist` (city/neighborhood) -> `SetNull` (Actually `City` is required in some cases? No, `cityId` is optional in `Salon`/`Artist` but usually needed for SEO).
