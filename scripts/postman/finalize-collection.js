const fs = require('fs');
const path = require('path');

const collectionPath = path.join(process.cwd(), 'postman_collection.json');
if (!fs.existsSync(collectionPath)) {
    console.error('postman_collection.json not found.');
    process.exit(1);
}

let collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// 1. Define Setup & Auth Folders
const setupFolder = {
    name: "00-setup",
    item: [
        {
            name: "Setup: Get Provinces",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data && res.data.length > 0) {",
                        "        pm.environment.set('provinceSlug', res.data[0].slug);",
                        "        pm.environment.set('provinceId', res.data[0].id);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "geo", "provinces"] }
            }
        },
        {
            name: "Setup: Get Cities",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data && res.data.length > 0) {",
                        "        pm.environment.set('citySlug', res.data[0].slug);",
                        "        pm.environment.set('cityId', res.data[0].id);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "geo", "cities"], query: [{ key: "provinceSlug", value: "{{provinceSlug}}" }] }
            }
        },
        {
            name: "Setup: Get Services",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data && res.data.length > 0) {",
                        "        pm.environment.set('serviceId', res.data[0].id);",
                        "        pm.environment.set('serviceSlug', res.data[0].slug);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "services"] }
            }
        },
        {
            name: "Setup: Get Salons",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data && res.data.length > 0) {",
                        "        pm.environment.set('salonId', res.data[0].id);",
                        "        pm.environment.set('salonSlug', res.data[0].slug);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "salons"] }
            }
        },
        {
            name: "Setup: Get Artists",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data && res.data.length > 0) {",
                        "        pm.environment.set('artistId', res.data[0].id);",
                        "        pm.environment.set('artistSlug', res.data[0].slug);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "artists"] }
            }
        },
        {
            name: "Setup: Get Blog Posts",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data && res.data.length > 0) {",
                        "        pm.environment.set('postId', res.data[0].id);",
                        "        pm.environment.set('postSlug', res.data[0].slug);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "blog", "posts"] }
            }
        }
    ]
};

const authFolder = {
    name: "01-auth",
    item: [
        {
            name: "Auth: OTP Request",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "pm.test('OTP Requested', function() {",
                        "    pm.response.to.be.success;",
                        "});"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({ phoneNumber: "{{testPhoneNumber}}" })
                },
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "auth", "otp", "request"] }
            }
        },
        {
            name: "Auth: OTP Verify",
            event: [{
                listen: "test",
                script: {
                    exec: [
                        "try {",
                        "    const res = pm.response.json();",
                        "    if (res.success && res.data) {",
                        "        pm.environment.set('accessToken', res.data.accessToken);",
                        "        pm.environment.set('refreshToken', res.data.refreshToken);",
                        "        pm.environment.set('userId', res.data.user.id);",
                        "    }",
                        "} catch(e) { console.error(e); }"
                    ],
                    type: "text/javascript"
                }
            }],
            request: {
                method: "POST",
                header: [{ key: "Content-Type", value: "application/json" }],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({ phoneNumber: "{{testPhoneNumber}}", code: "{{testOtpCode}}" })
                },
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "auth", "otp", "verify"] }
            }
        }
    ]
};

const skipLogic = `
const url = pm.request.url.toString();
const body = pm.request.body ? (pm.request.body.raw || "") : "";
const combined = url + body;
const matches = combined.match(/{{([^}]+)}}/g);
if (matches) {
    for (const m of matches) {
        const varName = m.replace(/{{|}}/g, '');
        // Only ignore environment-seed variables, NOT entity IDs that should be captured
        const coreVars = ['baseUrl', 'accessToken', 'refreshToken', 'uniqueSuffix', 'testEmail', 'testPhoneNumber', 'testOtpCode'];
        if (coreVars.includes(varName)) continue;

        if (!pm.environment.get(varName) && !pm.collectionVariables.get(varName)) {
            console.log("Skipping request due to missing dependency: " + varName);
            let errorLog = pm.environment.get("errorLog") || "[]";
            let errors = JSON.parse(errorLog);
            errors.push({
                requestName: pm.info.requestName,
                method: pm.request.method,
                url: url,
                status: "SKIPPED",
                reason: "Missing dependency: " + varName,
                timestamp: new Date().toISOString()
            });
            pm.environment.set("errorLog", JSON.stringify(errors));
            pm.execution.skip();
            break;
        }
    }
}

if (!pm.environment.get("uniqueSuffix")) {
    pm.environment.set("uniqueSuffix", Math.random().toString(36).substring(2, 7));
}
`;

const testScriptContent = `
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
            if (data[field]) pm.environment.set(envVar, data[field]);
            else if (Array.isArray(data) && data.length > 0 && data[0][field]) pm.environment.set(envVar, data[0][field]);
        };

        if (pathStr.includes('salons')) {
            setIfFound('id', 'salonId');
            setIfFound('slug', 'salonSlug');
        }
        if (pathStr.includes('artists')) {
            setIfFound('id', 'artistId');
            setIfFound('slug', 'artistSlug');
        }
        if (pathStr.includes('posts')) {
            setIfFound('id', 'postId');
            setIfFound('slug', 'postSlug');
        }
        if (pathStr.includes('reviews')) setIfFound('id', 'reviewId');
        if (pathStr.includes('users') || pathStr.includes('me')) setIfFound('id', 'userId');
        if (pathStr.includes('geo/cities')) {
            setIfFound('id', 'cityId');
            setIfFound('slug', 'citySlug');
        }
        if (pathStr.includes('geo/provinces')) {
            setIfFound('id', 'provinceId');
            setIfFound('slug', 'provinceSlug');
        }
        if (pathStr.includes('services')) {
            setIfFound('id', 'serviceId');
            setIfFound('slug', 'serviceSlug');
        }
    }

    if (status < 200 || status >= 300) {
        let errorLog = pm.environment.get("errorLog") || "[]";
        let errors = JSON.parse(errorLog);
        errors.push({
            requestName: requestName,
            method: pm.request.method,
            url: pm.request.url.toString(),
            status: status,
            responseSnippet: JSON.stringify(response).substring(0, 1000),
            requestId: pm.response.headers.get("X-Request-ID") || pm.response.headers.get("x-request-id"),
            timestamp: new Date().toISOString()
        });
        pm.environment.set("errorLog", JSON.stringify(errors));
    }
} catch (e) {
    let errorLog = pm.environment.get("errorLog") || "[]";
    let errors = JSON.parse(errorLog);
    errors.push({
        requestName: pm.info.requestName,
        method: pm.request.method,
        url: pm.request.url.toString(),
        status: pm.response.code,
        error: e.message,
        timestamp: new Date().toISOString()
    });
    pm.environment.set("errorLog", JSON.stringify(errors));
}
`;

function processItems(items) {
    items.forEach(item => {
        if (item.request) {
            const path = (item.request.url.path || []).join('/');

            // 1. Replace placeholders in URL variables
            if (item.request.url && item.request.url.variable) {
                item.request.url.variable.forEach(v => {
                    if (v.value === '<string>' || v.value === '<integer>') {
                        if (v.key === 'id' || v.key === 'salonId') {
                            if (path.includes('salons')) v.value = '{{salonId}}';
                            else if (path.includes('artists')) v.value = '{{artistId}}';
                            else if (path.includes('posts')) v.value = '{{postId}}';
                            else if (path.includes('reviews')) v.value = '{{reviewId}}';
                            else v.value = '{{id}}';
                        }
                        else if (v.key === 'artistId') v.value = '{{artistId}}';
                        else if (v.key === 'postId') v.value = '{{postId}}';
                        else if (v.key === 'serviceId') v.value = '{{serviceId}}';
                        else if (v.key === 'cityId') v.value = '{{cityId}}';
                        else if (v.key === 'slug' || v.key === 'idOrSlug') {
                            // Order matters for nested routes
                            if (path.includes('provinces')) v.value = '{{provinceSlug}}';
                            else if (path.includes('salons')) v.value = '{{salonSlug}}';
                            else if (path.includes('artists')) v.value = '{{artistSlug}}';
                            else if (path.includes('posts')) v.value = '{{postSlug}}';
                            else if (path.includes('cities')) v.value = '{{citySlug}}';
                            else if (path.includes('services')) v.value = '{{serviceSlug}}';
                            else v.value = '{{slug}}';
                        }
                    }
                });
            }

            // 2. Replace placeholders in Body
            if (item.request.body && item.request.body.mode === 'raw' && item.request.body.raw) {
                let raw = item.request.body.raw;
                raw = raw.replace(/"phoneNumber":\s*"<string>"/g, '"phoneNumber": "{{testPhoneNumber}}"');
                raw = raw.replace(/"code":\s*"<string>"/g, '"code": "{{testOtpCode}}"');
                raw = raw.replace(/"refreshToken":\s*"<string>"/g, '"refreshToken": "{{refreshToken}}"');

                // Specific IDs with quotes
                raw = raw.replace(/"cityId":\s*"<number>"/g, '"cityId": "{{cityId}}"');
                raw = raw.replace(/"cityId":\s*"<string>"/g, '"cityId": "{{cityId}}"');
                raw = raw.replace(/"salonId":\s*"<string>"/g, '"salonId": "{{salonId}}"');
                raw = raw.replace(/"artistId":\s*"<string>"/g, '"artistId": "{{artistId}}"');
                raw = raw.replace(/"postId":\s*"<string>"/g, '"postId": "{{postId}}"');

                raw = raw.replace(/"id":\s*"<string>"/g, '"id": "{{id}}"');
                raw = raw.replace(/"slug":\s*"<string>"/g, '"slug": "test-slug-{{uniqueSuffix}}"');
                raw = raw.replace(/"nameFa":\s*"<string>"/g, '"nameFa": "نام تست {{uniqueSuffix}}"');
                raw = raw.replace(/"nameEn":\s*"<string>"/g, '"nameEn": "Test Name {{uniqueSuffix}}"');
                item.request.body.raw = raw;
            }

            if (!item.event) item.event = [];
            let preEvent = item.event.find(e => e.listen === 'prerequest');
            if (!preEvent) {
                preEvent = { listen: 'prerequest', script: { exec: [], type: 'text/javascript' } };
                item.event.push(preEvent);
            }
            preEvent.script.exec = [skipLogic];

            let testEvent = item.event.find(e => e.listen === 'test');
            if (!testEvent) {
                testEvent = { listen: 'test', script: { exec: [], type: 'text/javascript' } };
                item.event.push(testEvent);
            }
            testEvent.script.exec = [testScriptContent];

            if (item.request.url && item.request.url.host) {
                item.request.url.host = ["{{baseUrl}}"];
                item.request.url.protocol = "";
            }
        }
        if (item.item) {
            processItems(item.item);
        }
    });
}

processItems(setupFolder.item);
processItems(authFolder.item);

collection.item.unshift(authFolder);
collection.item.unshift(setupFolder);

processItems(collection.item);

const undocumentedFolder = {
    name: "Undocumented Endpoints",
    item: [
        {
            name: "GET /metrics",
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["metrics"] }
            }
        }
    ]
};
processItems(undocumentedFolder.item);
collection.item.push(undocumentedFolder);

fs.writeFileSync('sevra-atlas-full.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Collection finalized with improved logic and variable mapping.');
