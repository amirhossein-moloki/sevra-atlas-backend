# Phase 3 — Semantic Mapping Table

| Model Field | Semantic Rule | Source / Logic |
|---|---|---|
| `User.phoneNumber` | `+989` + 9 digits | Deterministic based on index. |
| `Salon.name` | Prefix + Name | Mixed from `salon_names.json`. |
| `Salon.addressLine` | Persian address pattern | "خیابان" + Name + "پلاک" + Number. |
| `City.nameFa` | Persian City Name | `geo_fa.json`. |
| `Post.slug` | Kebab-case Persian-to-English | Pinned slugs for stability. |
| `Media.url` | Pinned Image URLs | `media_assets.json` (Phase 4). |

## Localization Strategy
- **fa-IR**: All UI-visible strings (names, bios, descriptions, addresses) use Persian characters and syntax.
- **Consistency**: Salon cities will match their Province; Artist neighborhoods will exist within their Cities.
