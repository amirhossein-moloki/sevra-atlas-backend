const fs = require('fs');
const path = require('path');

const collectionPath = path.join(process.cwd(), 'postman_collection.json');
if (!fs.existsSync(collectionPath)) {
    console.error('postman_collection.json not found.');
    process.exit(1);
}

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

const skipLogic = `
const url = pm.request.url.toString();
const body = pm.request.body ? (pm.request.body.raw || "") : "";
const combined = url + body;
const matches = combined.match(/{{([^}]+)}}/g);
if (matches) {
    for (const m of matches) {
        const varName = m.replace(/{{|}}/g, '');
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

    // Auto-extract IDs from wrapped response { success, data, meta }
    if (status >= 200 && status < 300 && response.data && response.data.id) {
        const pathStr = pm.request.url.getPath();
        if (pathStr.includes('salons')) pm.environment.set('salonId', response.data.id);
        if (pathStr.includes('artists')) pm.environment.set('artistId', response.data.id);
        if (pathStr.includes('posts')) pm.environment.set('postId', response.data.id);
        if (pathStr.includes('reviews')) pm.environment.set('reviewId', response.data.id);
        if (pathStr.includes('users') || pathStr.includes('me')) pm.environment.set('userId', response.data.id);
        if (pathStr.includes('geo/cities')) pm.environment.set('cityId', response.data.id);
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
            if (!item.event) item.event = [];

            // Add Pre-request (Skip logic)
            let preEvent = item.event.find(e => e.listen === 'prerequest');
            if (!preEvent) {
                preEvent = { listen: 'prerequest', script: { exec: [], type: 'text/javascript' } };
                item.event.push(preEvent);
            }
            preEvent.script.exec = [skipLogic];

            // Add Test (Error logging)
            let testEvent = item.event.find(e => e.listen === 'test');
            if (!testEvent) {
                testEvent = { listen: 'test', script: { exec: [], type: 'text/javascript' } };
                item.event.push(testEvent);
            }
            testEvent.script.exec = [testScriptContent];

            // Fix baseUrl
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

processItems(collection.item);

// Add Undocumented folder
const undocumentedFolder = {
    name: "Undocumented Endpoints",
    item: [
        {
            name: "GET /metrics",
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["metrics"] }
            }
        },
        {
            name: "GET /subscriptions/plans",
            request: {
                method: "GET",
                url: { host: ["{{baseUrl}}"], path: ["api", "v1", "subscriptions", "plans"] }
            }
        }
    ]
};

processItems(undocumentedFolder.item);
collection.item.push(undocumentedFolder);

fs.writeFileSync('sevra-atlas-full.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Collection with SKIP logic generated.');
