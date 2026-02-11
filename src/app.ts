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
import './types/express';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';
import { generateOpenApiSpec } from './shared/openapi/generator';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req: any) => req.requestId || req.headers['x-request-id'] || `req-${Date.now()}`,
  })
);
app.use(responseMiddleware);

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
    validateResponses: true,
    ignoreUndocumented: true, // Don't break existing routes that are not yet documented
  })
);

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;
