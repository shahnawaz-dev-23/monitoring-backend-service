import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';
import { createDb } from './db/index';
import { users, urls, urlChecks } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from './middleware/auth';

// Define the environment variables type
interface Env {
  JWT_SECRET: string;
  DATABASE_URL: string;
}

// Define the context type
interface Variables {
  userId: number;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', cors());
app.use('/api/*', authMiddleware);

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const urlSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  checkInterval: z.number().min(60).default(300),
});

// Auth routes
app.post('/auth/register', async (c) => {
  const body = await c.req.json();
  const { email, password } = registerSchema.parse(body);
  const db = createDb(c.env);

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: 'Email already registered' }, 400);
  }

  const hashedPassword = await hash(password, 10);
  const [user] = await db.insert(users).values({
    email,
    password: hashedPassword,
  }).returning();

  const token = await sign({ sub: user.id }, c.env.JWT_SECRET);
  return c.json({ token });
});

app.post('/auth/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = loginSchema.parse(body);
  const db = createDb(c.env);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !(await compare(password, user.password))) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await sign({ sub: user.id }, c.env.JWT_SECRET);
  return c.json({ token });
});

// URL monitoring routes
app.post('/api/urls', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { url, name, checkInterval } = urlSchema.parse(body);
  const db = createDb(c.env);

  const [newUrl] = await db.insert(urls).values({
    userId,
    url,
    name,
    checkInterval,
  }).returning();

  return c.json(newUrl);
});

app.get('/api/urls', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env);

  const userUrls = await db.query.urls.findMany({
    where: eq(urls.userId, userId),
  });
  return c.json(userUrls);
});

app.put('/api/urls/:id', async (c) => {
  const userId = c.get('userId');
  const urlId = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const { url, name, checkInterval } = urlSchema.parse(body);
  const db = createDb(c.env);

  const [updatedUrl] = await db.update(urls)
    .set({ url, name, checkInterval, updatedAt: new Date() })
    .where(and(eq(urls.id, urlId), eq(urls.userId, userId)))
    .returning();

  if (!updatedUrl) {
    return c.json({ error: 'URL not found' }, 404);
  }

  return c.json(updatedUrl);
});

app.patch('/api/urls/:id', async (c) => {
  const userId = c.get('userId');
  const urlId = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const db = createDb(c.env);
  
  // Create a partial schema for PATCH
  const partialUrlSchema = urlSchema.partial();
  const updates = partialUrlSchema.parse(body);
  
  // Only update fields that were provided
  const [updatedUrl] = await db.update(urls)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(urls.id, urlId), eq(urls.userId, userId)))
    .returning();

  if (!updatedUrl) {
    return c.json({ error: 'URL not found' }, 404);
  }

  return c.json(updatedUrl);
});

app.delete('/api/urls/:id', async (c) => {
  const userId = c.get('userId');
  const urlId = parseInt(c.req.param('id'));
  const db = createDb(c.env);

  const [deletedUrl] = await db.delete(urls)
    .where(and(eq(urls.id, urlId), eq(urls.userId, userId)))
    .returning();

  if (!deletedUrl) {
    return c.json({ error: 'URL not found' }, 404);
  }

  return c.json({ message: 'URL deleted successfully' });
});

app.get('/api/urls/:id/checks', async (c) => {
  const userId = c.get('userId');
  const urlId = parseInt(c.req.param('id'));
  const db = createDb(c.env);

  const url = await db.query.urls.findFirst({
    where: and(eq(urls.id, urlId), eq(urls.userId, userId)),
  });

  if (!url) {
    return c.json({ error: 'URL not found' }, 404);
  }

  const checks = await db.query.urlChecks.findMany({
    where: eq(urlChecks.urlId, urlId),
    orderBy: (checks, { desc }) => [desc(checks.checkedAt)],
    limit: 100,
  });

  return c.json(checks);
});

// URL checking worker
async function checkUrls(env: Env) {
  const db = createDb(env);
  const urlsToCheck = await db.query.urls.findMany();

  for (const url of urlsToCheck) {
    try {
      const startTime = Date.now();
      const response = await fetch(url.url);
      const responseTime = Date.now() - startTime;

      await db.insert(urlChecks).values({
        urlId: url.id,
        status: response.ok,
        responseTime,
        statusCode: response.status,
      });
    } catch (error) {
      await db.insert(urlChecks).values({
        urlId: url.id,
        status: false,
        statusCode: 0,
      });
    }
  }
}

// Schedule URL checks using Cloudflare Workers cron trigger
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await checkUrls(env);
  },
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  }
}; 