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
    item: fullCollection.item
        .filter(item => smokeModules.includes(item.name))
        .map(folder => {
            if (['00-setup', '01-auth'].includes(folder.name)) return folder;

            // For other modules, only keep GET requests and subfolders that don't look like "create"
            const filterRequests = (items) => {
                return items.filter(item => {
                    if (item.item) {
                        item.item = filterRequests(item.item);
                        return item.item.length > 0;
                    }
                    return item.request && item.request.method === 'GET';
                });
            };

            return {
                ...folder,
                item: filterRequests(folder.item)
            };
        })
};

fs.writeFileSync('sevra-atlas-smoke.postman_collection.json', JSON.stringify(smokeCollection, null, 2));
console.log('Smoke suite generated: sevra-atlas-smoke.postman_collection.json');
