import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { CheckInService } from '../services/checkInService.js';

const checkInBody = z.object({ memberId: z.string().min(1), gymId: z.string().min(1) });

export function checkInRoutes(checkIns: CheckInService): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/check-in', { schema: { body: checkInBody } }, async (req, reply) => {
      const result = checkIns.checkIn(req.body.memberId, req.body.gymId);
      return reply.status(201).send(result);
    });
  };
}
