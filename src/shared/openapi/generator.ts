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

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Sevra Atlas API',
      description: 'Unified Directory + Blog API - Automatically generated and enforced.',
    },
    servers: [{ url: '/api/v1' }],
  });
}

export function writeOpenApiSpec() {
  const spec = generateOpenApiSpec();
  const filePath = path.join(process.cwd(), 'openapi.json');
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`OpenAPI spec written to ${filePath}`);
}
