import express, { Request, Response, NextFunction, RequestHandler } from 'express';
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
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { generateOpenApiSpec } from './shared/openapi/generator';
import { config } from './config';

const app = express();

if (config.isProduction) {
  app.set('trust proxy', config.server.trustProxy);
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
  hsts: config.security.hsts.enabled ? {
    maxAge: config.security.hsts.maxAge,
    includeSubDomains: true,
    preload: true,
  } : false,
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
  hsts: config.security.hsts.enabled ? {
    maxAge: config.security.hsts.maxAge,
    includeSubDomains: true,
    preload: true,
  } : false,
});

// Apply CSP conditionally: strict by default, relaxed for /backoffice
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/backoffice')) {
    adminCSP(req, res, next);
  } else {
    strictCSP(req, res, next);
  }
});
app.use(cors({
  origin: config.cors.allowedOrigins,
  methods: config.cors.allowedMethods,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  credentials: config.cors.allowCredentials,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limit
app.use(rateLimit('global', config.security.rateLimit.max, config.security.rateLimit.windowS));

app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => {
      if ('requestId' in req && typeof req.requestId === 'string') {
        return req.requestId;
      }
      const xRequestId = req.headers['x-request-id'];
      if (typeof xRequestId === 'string') return xRequestId;
      if (Array.isArray(xRequestId)) return xRequestId[0];
      return `req-${Date.now()}`;
    },
  })
);
app.use(responseMiddleware);

// Serve uploads if local storage is used
if (config.storage.provider === 'local') {
  app.use(`/${config.storage.uploadDir}`, express.static(path.join(process.cwd(), config.storage.uploadDir)));
}

// Generate OpenAPI Spec dynamically
const swaggerSpec = generateOpenApiSpec();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// OpenAPI Validation
app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerSpec as OpenAPIV3.DocumentV3,
    validateRequests: {
      allErrors: true,
      coerceTypes: true,
    },
    validateResponses: config.isTest ? false : {
      allErrors: true,
      coerceTypes: true,
    },
    ignoreUndocumented: false,
    ignorePaths: /^\/backoffice/, // Ignore AdminJS routes from OpenAPI validation
  })
);

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;
