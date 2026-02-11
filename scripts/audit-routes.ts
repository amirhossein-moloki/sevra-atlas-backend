import app from '../src/app';
import * as fs from 'fs';
import * as path from 'path';

function listEndpoints(app: any) {
  const routes: { method: string; path: string }[] = [];

  function iterate(stack: any[], prefix: string) {
    stack.forEach(function(stackItem: any) {
      if (stackItem.route) {
        const path = (prefix + stackItem.route.path).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        const methods = Object.keys(stackItem.route.methods).map(m => m.toUpperCase());
        methods.forEach(method => {
          routes.push({ method, path });
        });
      } else if (stackItem.name === 'router') {
        let routerPrefix = '';
        if (stackItem.regexp) {
            const source = stackItem.regexp.source;
            if (source !== '^\\/?$' && source !== '^$') {
                // Try to extract the prefix from the regex
                // Patterns like ^\/api\/v1(?=\/|$)
                const match = source.match(/^\^\\\/([^\(\?]+)/);
                if (match) {
                    routerPrefix = '/' + match[1].replace(/\\/g, '');
                }
            }
        }
        iterate(stackItem.handle.stack, prefix + routerPrefix);
      }
    });
  }

  if (app._router && app._router.stack) {
    iterate(app._router.stack, '');
  }
  return routes;
}

function normalizeExpressPath(p: string) {
  // Convert :param to {param}
  return p.replace(/:(\w+)/g, '{$1}').replace(/\/$/, '') || '/';
}

function normalizeOpenApiPath(p: string) {
  return p.replace(/\/$/, '') || '/';
}

async function audit() {
  const expressEndpoints = listEndpoints(app);
  const openapiPath = path.join(process.cwd(), 'openapi.json');

  if (!fs.existsSync(openapiPath)) {
    console.error('openapi.json not found. Run npm run openapi:generate first.');
    process.exit(1);
  }

  const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  const openapiEndpoints: { method: string; path: string }[] = [];

  const serverPrefix = openapi.servers?.[0]?.url || '';

  for (const [pathKey, pathItem] of Object.entries(openapi.paths)) {
    for (const method of Object.keys(pathItem as any)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
        openapiEndpoints.push({
          method: method.toUpperCase(),
          path: normalizeOpenApiPath(serverPrefix + pathKey)
        });
      }
    }
  }

  const missingImplementation: typeof openapiEndpoints = [];
  const undocumented: typeof expressEndpoints = [];

  const normalizedExpress = expressEndpoints.map(e => ({
    ...e,
    normalizedPath: normalizeExpressPath(e.path)
  }));

  const normalizedOpenApi = openapiEndpoints.map(e => ({
    ...e,
    normalizedPath: normalizeOpenApiPath(e.path)
  }));

  // Check for missing implementation
  for (const oe of normalizedOpenApi) {
    if (!normalizedExpress.some(ee => ee.method === oe.method && ee.normalizedPath === oe.normalizedPath)) {
      missingImplementation.push(oe);
    }
  }

  // Check for undocumented (excluding some common ones)
  const ignorePatterns = [
    /^\/api-docs/,
    /^\/docs/,
  ];

  for (const ee of normalizedExpress) {
      if (ignorePatterns.some(regex => regex.test(ee.path))) continue;

    if (!normalizedOpenApi.some(oe => oe.method === ee.method && oe.normalizedPath === ee.normalizedPath)) {
      undocumented.push(ee);
    }
  }

  console.log('--- Contract Audit Report ---');

  if (missingImplementation.length > 0) {
    console.error('\n❌ Missing implementation (In Spec but not in Code):');
    missingImplementation.forEach(e => console.error(`  ${e.method} ${e.path}`));
  } else {
    console.log('\n✅ All documented endpoints are implemented.');
  }

  if (undocumented.length > 0) {
    console.error('\n❌ Undocumented endpoints (In Code but not in Spec):');
    undocumented.forEach(e => console.error(`  ${e.method} ${e.path}`));
  } else {
    console.log('\n✅ All implemented endpoints are documented.');
  }

  if (missingImplementation.length > 0 || undocumented.length > 0) {
    process.exit(1);
  }

  console.log('\nAudit passed successfully!');
  process.exit(0);
}

audit().catch(err => {
  console.error(err);
  process.exit(1);
});
