import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { ClassService } from '../services/classService.js';

const gymParams = z.object({ gymId: z.string().min(1) });
const classParams = z.object({ classId: z.string().min(1) });
const cancelParams = z.object({ classId: z.string().min(1), memberId: z.string().min(1) });

const listQuery = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
    .refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().startsWith(d), 'Not a real calendar date')
    .optional(),
  type: z.enum(['yoga', 'hiit', 'spin']).optional(),
});

const bookBody = z.object({ memberId: z.string().min(1) });

export function classRoutes(classes: ClassService): FastifyPluginAsyncZod {
  return async (app) => {
    // Not in the brief: the app needs the gym list for its gym picker.
    app.get('/gyms', async () => ({ gyms: classes.listGyms() }));

    app.get('/gyms/:gymId/classes', { schema: { params: gymParams, querystring: listQuery } }, async (req) => ({
      classes: classes.listForGym(req.params.gymId, req.query),
    }));

    app.post('/classes/:classId/book', { schema: { params: classParams, body: bookBody } }, async (req, reply) => {
      const result = classes.book(req.params.classId, req.body.memberId);
      return reply.status(201).send(result);
    });

    app.delete('/classes/:classId/book/:memberId', { schema: { params: cancelParams } }, async (req, reply) => {
      classes.cancel(req.params.classId, req.params.memberId);
      return reply.status(204).send();
    });
  };
}
