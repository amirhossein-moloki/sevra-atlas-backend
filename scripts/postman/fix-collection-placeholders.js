const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.join(process.cwd(), 'sevra-atlas-full.postman_collection.json');
const OUTPUT_PATH = path.join(process.cwd(), 'sevra-atlas-full.postman_collection.json'); // Overwrite or save as new

if (!fs.existsSync(COLLECTION_PATH)) {
    console.error('Collection not found at ' + COLLECTION_PATH);
    process.exit(1);
}

const col = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf8'));

// 1. Placeholder Replacement Map
// Map specific path patterns or request names to variable names
const placeholderMap = {
    'cityId': '{{cityId}}',
    'provinceId': '{{provinceId}}',
    'provinceSlug': '{{provinceSlug}}',
    'citySlug': '{{citySlug}}',
    'salonId': '{{salonId}}',
    'salonSlug': '{{salonSlug}}',
    'artistId': '{{artistId}}',
    'artistSlug': '{{artistSlug}}',
    'serviceId': '{{serviceId}}',
    'serviceSlug': '{{serviceSlug}}',
    'postId': '{{postId}}',
    'postSlug': '{{postSlug}}',
    'reviewId': '{{reviewId}}',
    'categoryId': '{{serviceCategoryId}}'
};

function fixPlaceholders(text, context = '') {
    if (typeof text !== 'string') return text;

    let fixed = text;

    // 1. Specific ID/Slug replacements based on key
    const idKeys = ['cityId', 'citySlug', 'provinceId', 'provinceSlug', 'salonId', 'salonSlug', 'artistId', 'artistSlug', 'serviceId', 'serviceSlug', 'postId', 'postSlug', 'reviewId', 'userId', 'categoryId'];
    idKeys.forEach(key => {
        const regex = new RegExp(`["\\\\]+${key}["\\\\]+:\\s*["\\\\]+<(string|number|integer)>["\\\\]+`, 'g');
        const envVar = key === 'categoryId' ? 'serviceCategoryId' : key;
        fixed = fixed.replace(regex, `"${key}": "{{${envVar}}}"`);
    });

    // 2. Auth & User specific
    fixed = fixed.replace(/["\\]+phoneNumber["\\]+:\s*["\\]+<string>["\\]+/g, '"phoneNumber": "{{testPhoneNumber}}"');
    fixed = fixed.replace(/["\\]+code["\\]+:\s*["\\]+<string>["\\]+/g, '"code": "{{testOtpCode}}"');
    fixed = fixed.replace(/["\\]+refreshToken["\\]+:\s*["\\]+<string>["\\]+/g, '"refreshToken": "{{refreshToken}}"');
    fixed = fixed.replace(/["\\]+firstName["\\]+:\s*["\\]+<string>["\\]+/g, '"firstName": "TestUser"');
    fixed = fixed.replace(/["\\]+lastName["\\]+:\s*["\\]+<string>["\\]+/g, '"lastName": "{{uniqueSuffix}}"');

    // 3. Generic type-based replacements for remaining placeholders in JSON
    fixed = fixed.replace(/:\s*["\\]+<string>["\\]+/g, ': "test"');
    fixed = fixed.replace(/:\s*["\\]+<number>["\\]+/g, ': 1');
    fixed = fixed.replace(/:\s*["\\]+<integer>["\\]+/g, ': 1');
    fixed = fixed.replace(/:\s*["\\]+<boolean>["\\]+/g, ': true');
    fixed = fixed.replace(/:\s*["\\]+<dateTime>["\\]+/g, `: "${new Date().toISOString()}"`);

    // Also handle non-quoted placeholders if any
    fixed = fixed.replace(/:\s*<(number|integer)>/g, ': 1');
    fixed = fixed.replace(/:\s*<boolean>/g, ': true');

    return fixed;
}

// 2. Comprehensive Test Script for Setup/Auth
const COMMON_TEST_SCRIPT = `
try {
    const status = pm.response.code;
    const requestName = pm.info.requestName;
    let response;
    try {
        response = pm.response.json();
    } catch(e) {
        response = { _raw: pm.response.text().substring(0, 500) };
    }

    if (status >= 200 && status < 300 && response.data) {
        const data = response.data;
        const pathStr = pm.request.url.getPath();

        const setIfFound = (field, envVar) => {
            const findIn = (obj) => {
                if (!obj) return null;
                if (obj[field]) return obj[field];
                if (Array.isArray(obj) && obj.length > 0) return obj[0][field];
                if (obj.data && Array.isArray(obj.data) && obj.data.length > 0) return obj.data[0][field];
                return null;
            };
            const val = findIn(data);
            if (val) {
                pm.environment.set(envVar, val);
                console.log("Set " + envVar + " to " + val);
            }
        };

        if (pathStr.includes('geo/provinces')) {
            setIfFound('id', 'provinceId'); setIfFound('slug', 'provinceSlug');
        }
        if (pathStr.includes('geo/cities')) {
            setIfFound('id', 'cityId'); setIfFound('slug', 'citySlug'); setIfFound('id', 'cityIdOrSlug');
        }
        if (pathStr.includes('salons')) {
            setIfFound('id', 'salonId'); setIfFound('slug', 'salonSlug'); setIfFound('slug', 'salonIdOrSlug');
        }
        if (pathStr.includes('artists')) {
            setIfFound('id', 'artistId'); setIfFound('slug', 'artistSlug'); setIfFound('slug', 'artistIdOrSlug');
        }
        if (pathStr.includes('services')) {
            setIfFound('id', 'serviceId'); setIfFound('slug', 'serviceSlug');
        }
        if (pathStr.includes('blog/posts')) { setIfFound('id', 'postId'); setIfFound('slug', 'postSlug'); }
        if (pathStr.includes('blog/taxonomy/categories')) { setIfFound('id', 'serviceCategoryId'); }

        // Special case for Auth
        if (pathStr.includes('auth/otp/verify')) {
            const tokens = data.tokens || data;
            if (tokens.accessToken) pm.environment.set("accessToken", tokens.accessToken);
            if (tokens.refreshToken) pm.environment.set("refreshToken", tokens.refreshToken);
        }
    }

    // Error Logging
    if (status >= 400) {
        let errorLog = pm.environment.get("errorLog") || "[]";
        let errors = JSON.parse(errorLog);
        errors.push({
            requestName: requestName,
            status: status,
            url: pm.request.url.toString(),
            response: JSON.stringify(response).substring(0, 500),
            timestamp: new Date().toISOString()
        });
        pm.environment.set("errorLog", JSON.stringify(errors));
    }
} catch (e) {
    console.error("Script Error:", e);
}
`;

// 3. Fail-Fast Pre-request Script
const FAIL_FAST_SCRIPT = `
const url = pm.request.url.toString();
const body = pm.request.body ? (pm.request.body.raw || "") : "";
const combined = url + body;
const matches = combined.match(/{{([^}]+)}}/g);

if (matches) {
    for (const m of matches) {
        const varName = m.replace(/{{|}}/g, '');
        const coreVars = ['baseUrl', 'accessToken', 'refreshToken', 'uniqueSuffix', 'testEmail', 'testPhoneNumber', 'testOtpCode', 'rateLimitBypassToken'];

        if (coreVars.includes(varName)) continue;

        if (!pm.environment.get(varName) && !pm.collectionVariables.get(varName)) {
            console.warn("Skipping " + pm.info.requestName + " due to missing dependency: " + varName);
            pm.execution.skip();
            break;
        }
    }
}

if (!pm.environment.get("uniqueSuffix")) {
    pm.environment.set("uniqueSuffix", Math.random().toString(36).substring(2, 7));
}
`;

function processItems(items, parentName = '') {
    items.forEach(item => {
        const fullName = parentName + ' / ' + item.name;

        // Apply pre-request script to all requests
        if (item.request) {
            if (!item.event) item.event = [];

            // Remove old scripts
            item.event = item.event.filter(e => e.listen !== 'prerequest' && e.listen !== 'test');

            // Add new Pre-request
            item.event.push({
                listen: 'prerequest',
                script: { exec: FAIL_FAST_SCRIPT.split('\n'), type: 'text/javascript' }
            });

            // Add new Test script (Universal extractor for now, can be optimized)
            item.event.push({
                listen: 'test',
                script: { exec: COMMON_TEST_SCRIPT.split('\n'), type: 'text/javascript' }
            });

            // Fix Body placeholders
            if (item.request.body && item.request.body.raw) {
                const original = item.request.body.raw;
                item.request.body.raw = fixPlaceholders(item.request.body.raw, fullName);
                if (item.request.body.raw !== original) {
                    console.log(`Fixed body in: ${fullName}`);
                }
            }

            // Fix URL placeholders in path and query
            if (item.request.url) {
                if (item.request.url.path) {
                    item.request.url.path = item.request.url.path.map(p => {
                        if (p === '<string>' || p === '<integer>') {
                            // Try to infer from folder name or request name
                            if (fullName.includes('salons')) return '{{salonId}}';
                            if (fullName.includes('artists')) return '{{artistId}}';
                            if (fullName.includes('cities')) return '{{cityId}}';
                            if (fullName.includes('provinces')) return '{{provinceId}}';
                            if (fullName.includes('services')) return '{{serviceId}}';
                            if (fullName.includes('posts')) return '{{postId}}';
                        }
                        return p;
                    });
                }
                if (item.request.url.query) {
                    item.request.url.query.forEach(q => {
                        if (q.value === '<string>' || q.value === '<integer>') {
                            if (q.key.includes('Id')) q.value = '{{' + q.key + '}}';
                            else if (q.key.includes('Slug')) q.value = '{{' + q.key + '}}';
                            else if (q.key === 'province') q.value = '{{provinceSlug}}';
                            else if (q.key === 'city') q.value = '{{citySlug}}';
                        }
                    });
                }
                if (item.request.url.variable) {
                    item.request.url.variable.forEach(v => {
                        if (v.value === '<string>' || v.value === '<integer>') {
                            if (v.key === 'id') {
                                if (fullName.includes('salons')) v.value = '{{salonId}}';
                                else if (fullName.includes('artists')) v.value = '{{artistId}}';
                                else v.value = '{{id}}';
                            } else if (v.key === 'slug') {
                                if (fullName.includes('salons')) v.value = '{{salonSlug}}';
                                else if (fullName.includes('artists')) v.value = '{{artistSlug}}';
                                else v.value = '{{slug}}';
                            } else if (v.key === 'idOrSlug') {
                                if (fullName.includes('salons')) v.value = '{{salonIdOrSlug}}';
                                else if (fullName.includes('artists')) v.value = '{{artistIdOrSlug}}';
                                else v.value = '{{idOrSlug}}';
                            }
                        }
                    });
                }
            }
        }

        if (item.item) processItems(item.item, fullName);
    });
}

// Special check: ensure 00-setup has everything
const setupFolder = col.item.find(i => i.name === '00-setup');
if (setupFolder) {
    // Check if Service Categories is there
    const hasCategories = setupFolder.item.some(i => i.name.includes('Categories'));
    if (!hasCategories) {
        setupFolder.item.push({
            name: "Setup: Get Service Categories",
            request: {
                method: "GET",
                url: {
                    host: ["{{baseUrl}}"],
                    path: ["api", "v1", "blog", "taxonomy", "categories"]
                }
            }
        });
    }
}

processItems(col.item);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(col, null, 2));
console.log('Collection fixed and saved to ' + OUTPUT_PATH);
