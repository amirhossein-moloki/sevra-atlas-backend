import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger/logger';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { requestIdMiddleware } from './shared/middlewares/requestId.middleware';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(requestIdMiddleware);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sevra Atlas API',
      version: '1.0.0',
      description: 'API documentation for Sevra Atlas Directory + Blog',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', routes);

app.use(errorMiddleware);

export default app;
