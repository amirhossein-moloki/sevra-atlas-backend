import jestOpenAPI from 'jest-openapi';
import path from 'path';
import * as fs from 'fs';

const openapiPath = path.join(__dirname, '../openapi.json');

if (fs.existsSync(openapiPath)) {
  jestOpenAPI(openapiPath);
} else {
  console.warn('openapi.json not found, toSatisfyApiSpec() will not work.');
}
