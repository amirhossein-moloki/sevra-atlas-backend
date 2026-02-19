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
  return p.replace(/:(\w+)/g, '{$1}').replace(/\/$/, '') || '/';
}

function normalizeOpenApiPath(p: string) {
  return p.replace(/\/$/, '') || '/';
}

describe('Contract Drift & Route Parity', () => {
  it('should have parity between implemented routes and OpenAPI spec', () => {
    const expressEndpoints = listEndpoints(app);
    const openapiPath = path.join(process.cwd(), 'openapi.json');
    const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

    const openapiEndpoints: { method: string; path: string }[] = [];
    const serverPrefix = openapi.servers?.[0]?.url || '';
    const paths = openapi.paths as Record<string, Record<string, unknown>>;

    for (const [pathKey, pathItem] of Object.entries(paths)) {
      for (const method of Object.keys(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          openapiEndpoints.push({
            method: method.toUpperCase(),
            path: normalizeOpenApiPath(serverPrefix + pathKey)
          });
        }
      }
    }

    const normalizedExpress = expressEndpoints.map(e => ({
      ...e,
      normalizedPath: normalizeExpressPath(e.path)
    }));

    const normalizedOpenApi = openapiEndpoints.map(e => ({
      ...e,
      normalizedPath: normalizeOpenApiPath(e.path)
    }));

    // Check for missing implementation
    const missingImplementation = normalizedOpenApi.filter(oe =>
        !normalizedExpress.some(ee => ee.method === oe.method && ee.normalizedPath === oe.normalizedPath)
    );

    // Check for undocumented
    const ignorePatterns = [/^\/api-docs/, /^\/docs/, /^\/metrics/, /^\/backoffice/];
    const undocumented = normalizedExpress.filter(ee => {
        if (ignorePatterns.some(regex => regex.test(ee.path))) return false;
        return !normalizedOpenApi.some(oe => oe.method === ee.method && oe.normalizedPath === ee.normalizedPath);
    });

    expect(missingImplementation).toHaveLength(0);
    expect(undocumented).toHaveLength(0);
  });
});
