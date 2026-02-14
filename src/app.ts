import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger/logger';
import { errorHandler } from './shared/middlewares/error.middleware';
import { requestIdMiddleware } from './shared/middlewares/requestId.middleware';
import { responseMiddleware } from './shared/middlewares/response.middleware';
import { rateLimit } from './shared/middlewares/rateLimit.middleware';
import './types/express';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';
import { generateOpenApiSpec } from './shared/openapi/generator';
import { env } from './shared/config/env';

const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Strict CSP for Public API
const strictCSP = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
});

// Relaxed CSP for AdminJS (Backoffice)
const adminCSP = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
});

// Apply CSP conditionally: strict by default, relaxed for /backoffice
app.use((req, res, next) => {
  if (req.path.startsWith('/backoffice')) {
    adminCSP(req, res, next);
  } else {
    strictCSP(req, res, next);
  }
});
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limit
app.use(rateLimit('global', 100, 60)); // 100 requests per minute per IP

app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req: any) => req.requestId || req.headers['x-request-id'] || `req-${Date.now()}`,
  })
);
app.use(responseMiddleware);

// Serve uploads if local storage is used
if (env.STORAGE_PROVIDER === 'local') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}

// Generate OpenAPI Spec dynamically
const swaggerSpec = generateOpenApiSpec();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// OpenAPI Validation
app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerSpec as any,
    validateRequests: true,
    validateResponses: env.NODE_ENV !== 'test', // Disable response validation in tests for speed and stability
    ignoreUndocumented: false,
    ignorePaths: /^\/backoffice/, // Ignore AdminJS routes from OpenAPI validation
    // @ts-ignore - ajvOptions is valid in express-openapi-validator 5.x but sometimes has type conflicts
    ajvOptions: {
      allErrors: true,
      strict: false, // Less strict to handle some zod-to-openapi quirks
    },
  })
);

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;
