import cors from '@fastify/cors';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { AppError } from './errors.js';
import { checkInRoutes } from './routes/checkIns.js';
import { classRoutes } from './routes/classes.js';
import { memberRoutes } from './routes/members.js';
import { createCheckInService } from './services/checkInService.js';
import { createClassService } from './services/classService.js';
import { createMemberService } from './services/memberService.js';
import { createSeededStore } from './store/seed.js';
import type { Clock, Store } from './types.js';

export interface AppOptions {
  clock?: Clock;
  store?: Store;
}

export interface ErrorBody {
  error: { code: string; message: string; details?: Array<{ path: string; message: string }> };
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const clock: Clock = options.clock ?? (() => new Date());
  const store = options.store ?? createSeededStore(clock());

  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  void app.register(cors, { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE'] });

  app.setErrorHandler((err: FastifyError | AppError, _req, reply) => {
    if (err instanceof AppError) {
      const body: ErrorBody = { error: { code: err.code, message: err.message } };
      return reply.status(err.statusCode).send(body);
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      const details = err.validation.map((v) => ({
        path: v.instancePath.replace(/^\//, '').replace(/\//g, '.'),
        message: v.message ?? 'Invalid value',
      }));
      const body: ErrorBody = { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details } };
      return reply.status(400).send(body);
    }
    // Fastify's own 4xx (malformed JSON, unsupported media type, ...)
    const status = (err as FastifyError).statusCode;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      const body: ErrorBody = { error: { code: 'BAD_REQUEST', message: err.message } };
      return reply.status(status).send(body);
    }
    app.log.error(err);
    const body: ErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } };
    return reply.status(500).send(body);
  });

  app.setNotFoundHandler((_req, reply) => {
    const body: ErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    return reply.status(404).send(body);
  });

  const typed = app.withTypeProvider<ZodTypeProvider>();
  const services = {
    members: createMemberService(store, clock),
    classes: createClassService(store, clock),
    checkIns: createCheckInService(store, clock),
  };
  void typed.register(memberRoutes(services.members, services.checkIns, services.classes), { prefix: '/api' });
  void typed.register(classRoutes(services.classes), { prefix: '/api' });
  void typed.register(checkInRoutes(services.checkIns), { prefix: '/api' });

  return app;
}
