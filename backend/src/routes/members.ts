import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { CheckInService } from '../services/checkInService.js';
import type { MemberService } from '../services/memberService.js';
import type { ClassService } from '../services/classService.js';

const idParams = z.object({ id: z.string().min(1) });

const preferencesBody = z
  .object({
    preferredGymId: z.string().min(1).optional(),
    notifications: z.object({ classReminders: z.boolean(), streakAlerts: z.boolean() }).strict().optional(),
  })
  .strict()
  .refine((b) => b.preferredGymId !== undefined || b.notifications !== undefined, {
    message: 'Provide preferredGymId and/or notifications',
  });

export function memberRoutes(members: MemberService, checkIns: CheckInService, classes: ClassService): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/members/:id', { schema: { params: idParams } }, async (req) => members.get(req.params.id));

    app.get('/members/:id/stats', { schema: { params: idParams } }, async (req) => members.stats(req.params.id));

    app.put('/members/:id/preferences', { schema: { params: idParams, body: preferencesBody } }, async (req) =>
      members.updatePreferences(req.params.id, req.body),
    );

    app.get('/members/:id/bookings', { schema: { params: idParams } }, async (req) => ({
      bookings: classes.upcomingBookings(req.params.id),
    }));

    app.get('/members/:id/check-ins', { schema: { params: idParams } }, async (req) => checkIns.history(req.params.id));
  };
}
