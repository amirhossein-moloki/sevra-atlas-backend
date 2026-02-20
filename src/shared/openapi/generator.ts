import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import * as fs from 'fs';
import * as path from 'path';

export function generateOpenApiSpec() {
  // Register security schemes
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Sevra Atlas API',
      description: 'Unified Directory + Blog API - Automatically generated and enforced.',
    },
    servers: [{ url: '/api/v1' }],
  });

  // Fix OAS 3.0 "nullable" issues
  fixNullableSchemas(document);

  // Inject common error responses (400, 401, 403, 404, 415)
  injectCommonResponses(document);

  return document;
}

/**
 * Injects common error responses into all paths.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function injectCommonResponses(document: any) {
  const errorResponse = (description: string) => ({
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiFailure' },
      },
    },
  });

  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const operation = document.paths[path][method];
      operation.responses = operation.responses || {};

      // 400 Bad Request
      if (!operation.responses['400']) {
        operation.responses['400'] = errorResponse('Bad Request / Validation Error');
      }

      // 401/403 for protected routes
      if (operation.security) {
        if (!operation.responses['401']) operation.responses['401'] = errorResponse('Unauthorized');
        if (!operation.responses['403']) operation.responses['403'] = errorResponse('Forbidden');
      }

      // 404 for routes with path parameters
      if (path.includes('{') && !operation.responses['404']) {
        operation.responses['404'] = errorResponse('Resource Not Found');
      }

      // 415 for write methods
      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && !operation.responses['415']) {
        operation.responses['415'] = errorResponse('Unsupported Media Type');
      }

      // 301/302 for GET methods (often used for redirects)
      if (method.toLowerCase() === 'get') {
        if (!operation.responses['301']) operation.responses['301'] = { description: 'Permanent Redirect' };
        if (!operation.responses['302']) operation.responses['302'] = { description: 'Temporary Redirect' };
      }
    }
  }
}

/**
 * Recursively traverses the OpenAPI document to fix OAS 3.0 nullable issues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fixNullableSchemas(obj: any) {
  if (typeof obj !== 'object' || obj === null) return;

  if (Array.isArray(obj)) {
    obj.forEach(fixNullableSchemas);
    return;
  }

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      fixNullableSchemas(obj[key]);
    }
  }

  // Handle allOf with nullable referenced schemas
  if (obj.allOf && Array.isArray(obj.allOf)) {
    const nullablePart = obj.allOf.find((item: any) => item.nullable === true);
    if (nullablePart) {
      obj.nullable = true;
      delete nullablePart.nullable;

      // Clean up empty or type-only parts
      if (
        Object.keys(nullablePart).length === 0 ||
        (Object.keys(nullablePart).length === 1 && nullablePart.type === 'object')
      ) {
        obj.allOf = obj.allOf.filter((item: any) => item !== nullablePart);
      }

      // If only one $ref remains, pull it up
      if (obj.allOf.length === 1 && obj.allOf[0].$ref) {
        obj.$ref = obj.allOf[0].$ref;
        delete obj.allOf;
      }
    }
  }

  // If we find nullable: true without a type, and it's not a $ref/union itself,
  // we add type: 'object' because in this codebase, registered schemas are objects.
  if (
    obj.nullable === true &&
    !obj.type &&
    !obj.$ref &&
    !obj.oneOf &&
    !obj.anyOf &&
    !obj.allOf
  ) {
    obj.type = 'object';
  }
}

export function writeOpenApiSpec() {
  const spec = generateOpenApiSpec();
  const filePath = path.join(process.cwd(), 'openapi.json');
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`OpenAPI spec written to ${filePath}`);
}
