import '../routes'; // This triggers all registrations
import { writeOpenApiSpec } from '../shared/openapi/generator';

async function main() {
  try {
    writeOpenApiSpec();
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    process.exit(1);
  }
}

main();
