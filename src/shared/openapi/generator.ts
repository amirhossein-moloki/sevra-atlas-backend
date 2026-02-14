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

  // Fix OAS 3.0 "nullable" without "type" issue
  fixNullableSchemas(document);

  return document;
}

/**
 * Recursively traverses the OpenAPI document to fix instances where "nullable: true"
 * is used without an explicit "type". AJV (used by express-openapi-validator)
 * requires a "type" alongside "nullable" in OAS 3.0 mode.
 *
 * This pattern typically occurs when zod-to-openapi generates an allOf for
 * a nullable referenced schema ($ref).
 */
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
