const fs = require('fs');
const path = require('path');

const fullCollectionPath = path.join(process.cwd(), 'sevra-atlas-full.postman_collection.json');
if (!fs.existsSync(fullCollectionPath)) {
    console.error('sevra-atlas-full.postman_collection.json not found.');
    process.exit(1);
}

const fullCollection = JSON.parse(fs.readFileSync(fullCollectionPath, 'utf8'));

const smokeModules = [
    '00-setup',
    '01-auth',
    'health',
    'geo',
    'services',
    'specialties',
    'search'
];

const smokeCollection = {
    ...fullCollection,
    info: {
        ...fullCollection.info,
        name: "Sevra Atlas - Smoke Suite",
        description: "Public and low-risk endpoints for quick verification."
    },
    item: fullCollection.item.filter(item => smokeModules.includes(item.name))
};

// Also keep only GET requests in the actual modules (geo, services, etc) for smoke if they are too large
// but for now, keeping the whole folders is probably fine since they are mostly list endpoints.

fs.writeFileSync('sevra-atlas-smoke.postman_collection.json', JSON.stringify(smokeCollection, null, 2));
console.log('Smoke suite generated: sevra-atlas-smoke.postman_collection.json');
