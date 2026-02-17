import { Registry, collectDefaultMetrics, Histogram, Counter } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

export const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(dbQueryDuration);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    const route = req.route ? req.route.path : req.path;

    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(durationInSeconds);
  });

  next();
};
