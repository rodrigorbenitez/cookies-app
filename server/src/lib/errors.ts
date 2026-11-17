import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { config } from '../config.js';

export class NotFoundError extends HTTPException {
  constructor(message = 'Not found') {
    super(404, { message });
  }
}

export class BadRequestError extends HTTPException {
  constructor(message = 'Bad request') {
    super(400, { message });
  }
}

/**
 * Turns any thrown error into a JSON response. In production the client never sees
 * stack traces, SQL or connection errors – only a generic message.
 */
export function handleError(err: Error, c: Context) {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Invalid input',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      400,
    );
  }
  if (err instanceof HTTPException) {
    return c.json({ error: err.message || 'Request failed' }, err.status);
  }

  // Log server-side only (message + stack, never configuration or env vars).
  console.error(`[error] ${c.req.method} ${c.req.path}:`, config.isProduction ? err.message : err);
  return c.json(
    { error: config.isProduction ? 'Internal server error' : err.message || 'Internal server error' },
    500,
  );
}
