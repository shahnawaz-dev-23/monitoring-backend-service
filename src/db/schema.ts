import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const urls = pgTable('urls', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  url: text('url').notNull(),
  name: text('name').notNull(),
  checkInterval: integer('check_interval').notNull().default(300), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const urlChecks = pgTable('url_checks', {
  id: serial('id').primaryKey(),
  urlId: integer('url_id').references(() => urls.id, { onDelete: 'cascade' }).notNull(),
  status: boolean('status').notNull(), // true for online, false for offline
  responseTime: integer('response_time'), // in milliseconds
  statusCode: integer('status_code'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
}); 