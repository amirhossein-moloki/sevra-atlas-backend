# Newman Automation Guide

This project uses a non-blocking error capture system. Tests do not "fail" the Newman run, but instead log details to an `errorLog` environment variable.

## 1. Prerequisites
Ensure you have `newman` and `newman-reporter-html` installed:
```bash
npm install -g newman newman-reporter-html
```

## 2. Running the Collection

### Local Environment
```bash
newman run sevra-atlas-full.postman_collection.json -e local.env.json \
  --reporters cli,json,html \
  --reporter-json-export reports/newman-report.json \
  --reporter-html-export reports/report.html
```

### CI Safe Mode
```bash
newman run sevra-atlas-full.postman_collection.json -e prod.env.json \
  --reporters cli,json \
  --reporter-json-export reports/newman-report.json || true
```

## 3. Extracting Errors
After the run, use the extraction script to generate a readable error report:
```bash
node scripts/postman/extract-errors.js reports/newman-report.json
```

This will produce:
- `reports/errors.json`: Raw error data.
- `reports/errors.md`: Human-readable summary table.

## 4. Environment Variables
The following variables are automatically updated during the run:
- `salonId`, `artistId`, `postId`, `reviewId`, `userId`: Captured from successful `POST` responses.
- `errorLog`: Accumulated JSON array of all non-2xx responses.
