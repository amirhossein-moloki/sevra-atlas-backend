import '../src/types/express';
import '../src/routes'; // This triggers all registrations
import { registry } from '../src/shared/openapi/registry';

async function main() {
  const definitions = registry.definitions;
  const routes = definitions.filter(d => d.type === 'route');

  console.log(JSON.stringify(routes, null, 2));
}

main().catch(console.error);
