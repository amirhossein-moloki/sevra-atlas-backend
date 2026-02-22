import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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

  // Recurse into all properties first
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      fixNullableSchemas(obj[key]);
    }
  }

  // 1. Handle $ref with nullable sibling (invalid in OAS 3.0)
  if (obj.$ref && obj.nullable === true) {
    const ref = obj.$ref;
    delete obj.$ref;
    // Use anyOf with a null-only branch to satisfy both OAS 3.0 and Ajv
    // allOf is avoided because null would need to satisfy the $ref branch (which rejects null)
    obj.anyOf = [
      { $ref: ref },
      { type: 'object', nullable: true, enum: [null] },
    ];
  }

  // 2. Handle unions (allOf, anyOf, oneOf) with nullable branches
  const unionKeywords = ['allOf', 'anyOf', 'oneOf'] as const;
  for (const keyword of unionKeywords) {
    if (obj[keyword] && Array.isArray(obj[keyword])) {
      const branches = obj[keyword];
      const nullableIndex = branches.findIndex((item: any) => item && item.nullable === true);

      if (nullableIndex !== -1) {
        obj.nullable = true;

        // If it's an allOf, we MUST convert it to anyOf to allow the null value
        // to skip the other branches that might reject it
        if (keyword === 'allOf') {
          const currentAllOf = [...branches];
          delete obj.allOf;
          obj.anyOf = [
            { allOf: currentAllOf.filter((_, i) => i !== nullableIndex) },
            { type: 'object', nullable: true, enum: [null] },
          ];
        } else {
          // For anyOf/oneOf, replace the nullable branch with a strict null-only branch
          obj[keyword][nullableIndex] = { type: 'object', nullable: true, enum: [null] };
        }
      }
    }
  }

  // 3. Final fix for Ajv: "nullable" cannot be used without "type"
  if (obj.nullable === true) {
    if (!obj.type) {
      // Try to infer type from unions
      for (const keyword of unionKeywords) {
        if (obj[keyword] && Array.isArray(obj[keyword])) {
          const typePart = obj[keyword].find((item: any) => item && item.type);
          if (typePart) {
            obj.type = typePart.type;
            break;
          }
        }
      }

      // Default to 'object' if still no type, as most registered schemas are objects
      if (!obj.type) {
        obj.type = 'object';
      }
    }
  }
}

export function writeOpenApiSpec() {
  const spec = generateOpenApiSpec();
  const jsonPath = path.join(process.cwd(), 'openapi.json');
  const yamlPath = path.join(process.cwd(), 'openapi.yaml');

  fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf-8');
  fs.writeFileSync(yamlPath, yaml.dump(spec), 'utf-8');

  console.log(`OpenAPI spec written to ${jsonPath} and ${yamlPath}`);
}
