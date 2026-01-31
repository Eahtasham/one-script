import {
    pgTable,
    uuid,
    text,
    timestamp,
    varchar,
    boolean,
    pgEnum,
    jsonb,
    index,
    primaryKey,
    integer,
    vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * User roles within an organization
 * - admin: Full access to organization settings, billing, team management
 * - member: Can manage knowledge base, view conversations, use playground
 */
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);

/**
 * Invitation status
 */
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired', 'cancelled']);

/**
 * Knowledge source status
 */
export const sourceStatusEnum = pgEnum('source_status', ['pending', 'processing', 'active', 'failed']);

/**
 * Subscription tier
 */
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'enterprise']);

// =============================================================================
// AUTH.JS TABLES (NextAuth)
// =============================================================================

/**
 * Users table - Auth.js compatible
 */
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
    image: text('image'),
    password: text('password'), // For credentials auth
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('users_email_idx').on(table.email),
]);

/**
 * Accounts table - Auth.js OAuth accounts
 */
export const accounts = pgTable('accounts', {
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
}, (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index('accounts_user_id_idx').on(table.userId),
]);

/**
 * Sessions table - Auth.js sessions
 */
export const sessions = pgTable('sessions', {
    sessionToken: text('session_token').primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (table) => [
    index('sessions_user_id_idx').on(table.userId),
]);

/**
 * Verification tokens - Auth.js email verification
 */
export const verificationTokens = pgTable('verification_tokens', {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
]);

// =============================================================================
// PROFILES TABLE (extends users with additional info)
// =============================================================================

/**
 * User profiles - extends users table with additional information
 */
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    preferences: jsonb('preferences').$type<{
        theme?: 'light' | 'dark' | 'system';
        notifications?: boolean;
        emailDigest?: 'daily' | 'weekly' | 'never';
    }>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('profiles_email_idx').on(table.email),
]);

// =============================================================================
// ORGANIZATIONS TABLE
// =============================================================================

/**
 * Organizations - represents a company/team using OneScript
 */
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    widgetId: uuid('widget_id').defaultRandom().notNull().unique(),
    widgetConfig: jsonb('widget_config').$type<{
        primaryColor?: string;
        welcomeMessage?: string;
        position?: 'bottom-right' | 'bottom-left';
        botName?: string;
    }>().default({}),
    subscriptionTier: subscriptionTierEnum('subscription_tier').default('free').notNull(),
    subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
    onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('organizations_slug_idx').on(table.slug),
    index('organizations_widget_id_idx').on(table.widgetId),
]);

// =============================================================================
// ORGANIZATION MEMBERS TABLE (Junction with roles)
// =============================================================================

/**
 * Organization members - links users to organizations with roles
 */
export const organizationMembers = pgTable('organization_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('org_members_org_id_idx').on(table.organizationId),
    index('org_members_user_id_idx').on(table.userId),
]);

// =============================================================================
// INVITATIONS TABLE
// =============================================================================

/**
 * Team invitations - for inviting new members to organizations
 */
export const invitations = pgTable('invitations', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('member').notNull(),
    status: invitationStatusEnum('status').default('pending').notNull(),
    invitedById: uuid('invited_by_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (table) => [
    index('invitations_org_id_idx').on(table.organizationId),
    index('invitations_email_idx').on(table.email),
    index('invitations_token_idx').on(table.token),
]);

// =============================================================================
// KNOWLEDGE SOURCES TABLE
// =============================================================================

/**
 * Knowledge sources - URLs, files, and manual text for RAG
 */
export const knowledgeSources = pgTable('knowledge_sources', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    content: text('content'),
    embedding: vector('embedding', { dimensions: 768 }), // Gemini Pro embedding dimensions
    status: sourceStatusEnum('status').default('pending').notNull(),
    errorMessage: text('error_message'),
    metadata: jsonb('metadata').$type<{
        fileSize?: number;
        mimeType?: string;
        pageCount?: number;
        wordCount?: number;
        url?: string;
        localPath?: string;
        originalName?: string;
    }>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => [
    index('knowledge_sources_org_id_idx').on(table.organizationId),
    index('knowledge_sources_status_idx').on(table.status),
]);

// =============================================================================
// CONVERSATIONS TABLE
// =============================================================================

/**
 * Conversations - chat sessions from the widget
 */
export const conversations = pgTable('conversations', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    visitorId: varchar('visitor_id', { length: 255 }).notNull(),
    visitorIp: varchar('visitor_ip', { length: 45 }),
    visitorUserAgent: text('visitor_user_agent'),
    isResolved: boolean('is_resolved').default(false).notNull(),
    isEscalated: boolean('is_escalated').default(false).notNull(),
    metadata: jsonb('metadata').$type<{
        pageUrl?: string;
        section?: string;
        country?: string;
        city?: string;
    }>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
}, (table) => [
    index('conversations_org_id_idx').on(table.organizationId),
    index('conversations_visitor_id_idx').on(table.visitorId),
    index('conversations_created_at_idx').on(table.createdAt),
]);

// =============================================================================
// MESSAGES TABLE
// =============================================================================

/**
 * Messages - individual chat messages
 */
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').$type<{
        tokensUsed?: number;
        model?: string;
        sourcesUsed?: string[];
    }>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),
    index('messages_created_at_idx').on(table.createdAt),
]);

// =============================================================================
// SECTIONS TABLE (Smart Routing)
// =============================================================================

/**
 * Sections - contextual bots for different areas
 */
export const sections = pgTable('sections', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    tone: varchar('tone', { length: 50 }).default('neutral').notNull(),
    systemPrompt: text('system_prompt'),
    allowedTopics: jsonb('allowed_topics').$type<string[]>().default([]),
    blockedTopics: jsonb('blocked_topics').$type<string[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('sections_org_id_idx').on(table.organizationId),
]);

// =============================================================================
// RELATIONS
// =============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    organizationMembers: many(organizationMembers),
    invitationsSent: many(invitations),
    profile: one(profiles, {
        fields: [users.id],
        references: [profiles.id],
    }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.id],
        references: [users.id],
    }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
    members: many(organizationMembers),
    invitations: many(invitations),
    knowledgeSources: many(knowledgeSources),
    conversations: many(conversations),
    sections: many(sections),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [organizationMembers.organizationId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [organizationMembers.userId],
        references: [users.id],
    }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
    organization: one(organizations, {
        fields: [invitations.organizationId],
        references: [organizations.id],
    }),
    invitedBy: one(users, {
        fields: [invitations.invitedById],
        references: [users.id],
    }),
}));

export const knowledgeSourcesRelations = relations(knowledgeSources, ({ one }) => ({
    organization: one(organizations, {
        fields: [knowledgeSources.organizationId],
        references: [organizations.id],
    }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [conversations.organizationId],
        references: [organizations.id],
    }),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));

export const sectionsRelations = relations(sections, ({ one }) => ({
    organization: one(organizations, {
        fields: [sections.organizationId],
        references: [organizations.id],
    }),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type NewKnowledgeSource = typeof knowledgeSources.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;

export type UserRole = 'admin' | 'member';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
