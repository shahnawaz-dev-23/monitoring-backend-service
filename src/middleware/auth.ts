import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { createDb } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

interface Variables {
  userId: number;
}

interface Env {
  JWT_SECRET: string;
  DATABASE_URL: string;
}

export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.sub as string;
    const db = createDb(c.env);
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId))
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    c.set('userId', parseInt(userId));
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}; 