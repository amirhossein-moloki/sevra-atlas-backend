const fs = require('fs');
const path = require('path');

function parsePrismaSchema() {
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) return { models: [], relations: [] };
    const content = fs.readFileSync(schemaPath, 'utf8');

    const models = [];
    const modelBlocks = content.match(/model\s+\w+\s+{[^}]+}/g) || [];

    modelBlocks.forEach(block => {
        const nameMatch = block.match(/model\s+(\w+)\s+{/);
        if (!nameMatch) return;
        const modelName = nameMatch[1];

        const fields = [];
        const lines = block.split('\n');
        lines.forEach(line => {
            const fieldMatch = line.trim().match(/^(\w+)\s+([\w\[\]]+)(\?)?\s+(.*)$/);
            if (fieldMatch) {
                fields.push({
                    name: fieldMatch[1],
                    type: fieldMatch[2],
                    isNullable: !!fieldMatch[3],
                    attributes: fieldMatch[4]
                });
            }
        });

        models.push({ name: modelName, fields });
    });

    return models;
}

function getBaseUrlFromCompose(filePath, defaultPort = '3000') {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');

    // Look for nginx ports
    const nginxBlock = content.match(/nginx:[\s\S]+?ports:[\s\S]+?- "(\d+):/);
    if (nginxBlock) return `http://localhost:${nginxBlock[1]}`;

    // Fallback to api ports
    const apiBlock = content.match(/api:[\s\S]+?ports:[\s\S]+?- "(\d+):/);
    if (apiBlock) return `http://localhost:${apiBlock[1]}`;

    return `http://localhost:${defaultPort}`;
}

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    lines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
        if (match) {
            env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

function parseDbUrl(url) {
    if (!url) return {};
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (match) {
        return {
            dbHost: match[3].replace('${', '').replace('}', ''),
            dbPort: match[4],
            dbName: match[5].replace('${', '').replace('}', ''),
            dbUser: match[1].replace('${', '').replace('}', '')
        };
    }
    return {};
}

function buildEnvironment(name, envFile, composeFile, fallbackUrl) {
    const env = parseEnv(envFile);
    const baseUrl = getBaseUrlFromCompose(composeFile) || env.BASE_URL || fallbackUrl;

    let dbInfo = {};
    if (env.DATABASE_URL) {
        dbInfo = parseDbUrl(env.DATABASE_URL);
    }

    const prismaModels = parsePrismaSchema();

    const values = [
        { key: 'baseUrl', value: baseUrl, enabled: true },
        { key: 'accessToken', value: '', enabled: true },
        { key: 'refreshToken', value: '', enabled: true },
        { key: 'testPhoneNumber', value: '09120000000', enabled: true },
        { key: 'testOtpCode', value: '123456', enabled: true },
        { key: 'uniqueSuffix', value: Math.random().toString(36).substring(2, 7), enabled: true },
        { key: 'errorLog', value: '[]', enabled: true },
        { key: 'lastRequestId', value: '', enabled: true }
    ];

    // Add Slugs
    const slugs = ['provinceSlug', 'citySlug', 'salonSlug', 'artistSlug', 'postSlug', 'serviceSlug'];
    slugs.forEach(s => values.push({ key: s, value: '', enabled: true }));

    prismaModels.forEach(model => {
        const varName = model.name.charAt(0).toLowerCase() + model.name.slice(1) + 'Id';
        values.push({ key: varName, value: '', enabled: true });
    });

    return {
        name: `Sevra Atlas - ${name}`,
        values: values,
        _postman_variable_scope: 'environment'
    };
}

const local = buildEnvironment('Local', '.env.example', 'docker-compose.yml', 'http://localhost:3000');
const dev = buildEnvironment('Dev', '.env.development.example', 'docker-compose.dev.yml', 'http://localhost:3000');
const prod = buildEnvironment('Prod', '.env.production.example', 'docker-compose.prod.yml', 'https://api.sevra.com');

fs.writeFileSync('local.env.json', JSON.stringify(local, null, 2));
fs.writeFileSync('dev.env.json', JSON.stringify(dev, null, 2));
fs.writeFileSync('prod.env.json', JSON.stringify(prod, null, 2));

console.log('Advanced environments built successfully.');
