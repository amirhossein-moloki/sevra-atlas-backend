# Sevra Atlas API - Postman Testing Suite

This repository contains a professional-grade Postman collection and environment for automated testing of the Sevra Atlas API.

## 📁 Files
- `Sevra-Atlas-API.postman_collection.json`: The full API collection with automated tests, schema validation, and data chaining.
- `Sevra-Atlas-Dev.postman_environment.json`: The development environment configuration with required variables.

## 🚀 Getting Started

### 1. Import into Postman
1. Open Postman.
2. Click **Import**.
3. Select both the collection and environment JSON files.

### 2. Configure Environment
1. Select the **Sevra-Atlas-Dev** environment from the dropdown.
2. Update the `baseUrl` if your local server is running on a different port.
3. Update `testPhoneNumber` if needed (default is `09120000000`).
4. **Admin Access**: If you want to run the Admin module tests, manually paste an admin token into the `adminAccessToken` variable.

### 3. Manual Steps (Important)
- **Media Upload**: The `POST /media/upload` request requires you to manually select a file in the Body -> form-data tab before running, as Postman does not save file paths in exports for security reasons.

### 4. Run the Collection
1. Open the **Collection Runner**.
2. Select **Sevra-Atlas-API**.
3. Ensure the order is correct (Auth -> Users -> Geo -> ... -> Cleanup).
4. Click **Run Sevra-Atlas-API**.

## 🛠 Features
- **Automated Auth**: The `Verify OTP` request automatically saves `accessToken` and `refreshToken` to the environment.
- **Dynamic Data**: Uses timestamps and unique suffixes to ensure tests are idempotent and don't collide.
- **Schema Validation**: Global `utils.validateSchema()` helper for contract testing.
- **Data Chaining**: Automatically extracts IDs from creation responses (e.g., `salonId`) and uses them in subsequent GET/PATCH/DELETE requests.
- **Cleanup**: Dedicated folder to remove resources created during testing.

## 📊 Coverage Matrix

| Module | Endpoints Tested | Automated? | Notes |
|--------|------------------|------------|-------|
| Health | GET /health, /ready | ✅ Yes | |
| Auth | Request, Verify, Refresh, Logout | ✅ Yes | Tokens saved automatically |
| Users | Get Profile, Update Profile | ✅ Yes | |
| Geo | Provinces, Cities, Neighborhoods | ✅ Yes | Chained slugs |
| Salons | Create, Get, Update, Assign Services | ✅ Yes | Uses created ID |
| Artists | Create, Get, Assign Specialties | ✅ Yes | Uses created ID |
| Blog | Posts, Taxonomy, Comments | ✅ Yes | |
| Interaction | Reviews, Follows, Saves, Reports | ✅ Yes | |
| Admin | Dashboard, Users, Queues | ✅ Yes | Requires Admin role |

## 💻 Running via Newman (CLI)
Ensure you have `newman` installed:
```bash
npm install -g newman
```

Run the tests:
```bash
newman run Sevra-Atlas-API.postman_collection.json -e Sevra-Atlas-Dev.postman_environment.json
```

## ⚠️ Assumptions
- The server is running and accessible at the specified `baseUrl`.
- For OTP verification, the system is in a mode where the default code `123456` works (common in dev/test) OR the code is manually updated in the environment.
- The user has permissions to create salons/artists/posts for those specific modules.
- Admin endpoints require the `accessToken` associated with an Admin user.
