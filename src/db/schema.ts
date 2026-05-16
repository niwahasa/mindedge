import { pgTable, serial, text, timestamp, integer, boolean, decimal, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  plan: text('plan').default('free'),
  streak: integer('streak').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  pair: text('pair').notNull(),
  direction: text('direction').notNull(),
  setup: text('setup').notNull(),
  session: text('session').notNull(),
  riskAmount: decimal('risk_amount', { precision: 10, scale: 2 }),
  rrRatio: decimal('rr_ratio', { precision: 10, scale: 2 }).notNull(),
  result: text('result').notNull(),
  emotionBefore: text('emotion_before'),
  emotionAfter: text('emotion_after'),
  notes: text('notes'),
  chartLink: text('chart_link'),
  tradedAt: timestamp('traded_at').notNull().defaultNow(),
});

export const coachMessages = pgTable('coach_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const analyticsPatterns = pgTable('analytics_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  patternText: text('pattern_text').notNull(),
  patternType: text('pattern_type').notNull(),
  severity: text('severity').default('medium'),
  generatedAt: timestamp('generated_at').defaultNow(),
});

export const usersRegistry = pgTable('users_registry', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
});

export const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountPercent: integer('discount_percent').notNull(), // 100 for free
  usageLimit: integer('usage_limit').default(100),
  usedCount: integer('used_count').default(0),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').notNull(), // active, trialing, canceled, past_due
  currentPeriodEnd: timestamp('current_period_end'),
});

export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  text: text('text').notNull(),
  isDefault: boolean('is_default').default(false),
  position: integer('position').notNull(),
});
