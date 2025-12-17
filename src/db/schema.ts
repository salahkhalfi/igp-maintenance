import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- USERS TABLE ---
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  first_name: text('first_name'), // Added in later migration
  last_name: text('last_name'),   // Added in later migration
  role: text('role').notNull(), // 'admin', 'supervisor', 'technician', 'operator', 'furnace_operator'
  is_super_admin: integer('is_super_admin').default(0), // Added in migration 0015
  last_login: text('last_login'), // Added in migration 0009
  avatar_key: text('avatar_key'), // Added in migration 0007
  deleted_at: text('deleted_at'), // Soft delete
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- CHAT CONVERSATIONS TABLE ---
export const chatConversations = sqliteTable('chat_conversations', {
  id: text('id').primaryKey(), // UUID
  type: text('type').notNull(), // 'direct' or 'group'
  name: text('name'),
  created_by: integer('created_by').references(() => users.id),
  avatar_key: text('avatar_key'), // Added in migration
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- CHAT PARTICIPANTS TABLE ---
export const chatParticipants = sqliteTable('chat_participants', {
  conversation_id: text('conversation_id').notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull(), // Can be negative for guests, so no strict foreign key to users.id
  role: text('role').default('member'), // 'admin', 'member'
  last_read_at: text('last_read_at').default(sql`CURRENT_TIMESTAMP`),
  display_order: integer('display_order').default(0),
  joined_at: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    pk: index('pk_chat_participants').on(table.conversation_id, table.user_id),
    userIdx: index('idx_chat_participants_user').on(table.user_id),
  };
});

// --- CHAT MESSAGES TABLE ---
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(), // UUID
  conversation_id: text('conversation_id').notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
  sender_id: integer('sender_id').notNull(),
  type: text('type').default('text'), // 'text', 'image', 'audio', 'system'
  content: text('content'),
  media_key: text('media_key'),
  media_meta: text('media_meta'), // JSON string
  transcription: text('transcription'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    convIdx: index('idx_chat_messages_conv').on(table.conversation_id),
    createdIdx: index('idx_chat_messages_created').on(table.created_at),
  };
});

// --- CHAT ACTION CARDS TABLE ---
export const chatActionCards = sqliteTable('chat_action_cards', {
  id: text('id').primaryKey(), // UUID
  message_id: text('message_id').notNull().references(() => chatMessages.id, { onDelete: 'cascade' }),
  conversation_id: text('conversation_id').notNull(),
  status: text('status').default('open'), // 'open', 'in_progress', 'resolved', 'cancelled'
  priority: text('priority').default('normal'),
  assignee_id: integer('assignee_id'),
  created_by: integer('created_by').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  resolved_at: text('resolved_at'),
}, (table) => {
  return {
    msgIdx: index('idx_chat_cards_message').on(table.message_id),
    statusIdx: index('idx_chat_cards_status').on(table.status),
  };
});
export const chatGuests = sqliteTable('chat_guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  company: text('company'),
  role: text('role').default('guest'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    emailIdx: index('idx_chat_guests_email').on(table.email),
  };
});

// --- MACHINES TABLE ---
export const machines = sqliteTable('machines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machine_type: text('machine_type').notNull(),
  model: text('model'),
  manufacturer: text('manufacturer'),
  year: integer('year'),
  serial_number: text('serial_number').unique(),
  location: text('location'),
  technical_specs: text('technical_specs'),
  status: text('status').default('operational'), // 'operational', 'maintenance', 'out_of_service'
  deleted_at: text('deleted_at'), // Soft delete
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- TICKETS TABLE ---
export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticket_id: text('ticket_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  machine_id: integer('machine_id').notNull().references(() => machines.id),
  status: text('status').notNull().default('received'),
  priority: text('priority').notNull().default('medium'),
  reported_by: integer('reported_by').notNull().references(() => users.id),
  assigned_to: integer('assigned_to').references(() => users.id),
  reporter_name: text('reporter_name'), // Added in migration 0003
  assignee_name: text('assignee_name'), // Added in migration 0003
  scheduled_date: text('scheduled_date'), // Added in migration 0004
  is_machine_down: integer('is_machine_down', { mode: 'boolean' }).default(false), // Added in migration 20251215000001
  deleted_at: text('deleted_at'), // Soft delete
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  completed_at: text('completed_at'),
}, (table) => {
  return {
    statusIdx: index('idx_tickets_status').on(table.status),
    machineIdx: index('idx_tickets_machine').on(table.machine_id),
    assignedIdx: index('idx_tickets_assigned').on(table.assigned_to),
    createdIdx: index('idx_tickets_created').on(table.created_at),
  };
});

// --- MEDIA TABLE ---
export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticket_id: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  file_key: text('file_key').notNull(),
  file_name: text('file_name').notNull(),
  file_type: text('file_type').notNull(),
  file_size: integer('file_size'),
  url: text('url').notNull(),
  uploaded_by: integer('uploaded_by').notNull().references(() => users.id),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    ticketIdx: index('idx_media_ticket').on(table.ticket_id),
  };
});

// --- TICKET TIMELINE TABLE ---
export const ticketTimeline = sqliteTable('ticket_timeline', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticket_id: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  old_status: text('old_status'),
  new_status: text('new_status'),
  comment: text('comment'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    ticketIdx: index('idx_timeline_ticket').on(table.ticket_id),
  };
});

// --- TICKET COMMENTS TABLE ---
export const ticketComments = sqliteTable('ticket_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticket_id: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  user_name: text('user_name').notNull(),
  user_role: text('user_role'),
  comment: text('comment').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    ticketIdx: index('idx_comments_ticket').on(table.ticket_id),
  };
});

// --- MESSAGES TABLE ---
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sender_id: integer('sender_id').notNull().references(() => users.id),
  recipient_id: integer('recipient_id').references(() => users.id), // Can be null for public messages
  message_type: text('message_type').notNull(), // 'public', 'private'
  content: text('content').notNull(),
  is_read: integer('is_read').default(0),
  read_at: text('read_at'),
  audio_file_key: text('audio_file_key'),
  audio_duration: integer('audio_duration'),
  audio_size: integer('audio_size'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- PUSH SUBSCRIPTIONS TABLE ---
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  device_type: text('device_type'),
  device_name: text('device_name'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  last_used: text('last_used').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    userIdx: index('idx_push_subscriptions_user_id').on(table.user_id),
    lastUsedIdx: index('idx_push_subscriptions_last_used').on(table.last_used),
  };
});

// --- PUSH LOGS TABLE ---
export const pushLogs = sqliteTable('push_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  ticket_id: integer('ticket_id'),
  status: text('status').notNull(), // 'success', 'failed', 'no_subscription'
  error_message: text('error_message'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- WEBHOOK NOTIFICATIONS TABLE ---
export const webhookNotifications = sqliteTable('webhook_notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticket_id: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  notification_type: text('notification_type').notNull(),
  webhook_url: text('webhook_url').notNull(),
  sent_at: text('sent_at').notNull(),
  response_status: integer('response_status'),
  response_body: text('response_body'),
  scheduled_date_notified: text('scheduled_date_notified'), // Added in later migration
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- SYSTEM SETTINGS TABLE ---
export const systemSettings = sqliteTable('system_settings', {
  setting_key: text('setting_key').primaryKey(),
  setting_value: text('setting_value').notNull(),
  description: text('description'),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- PENDING NOTIFICATIONS TABLE ---
export const pendingNotifications = sqliteTable('pending_notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  icon: text('icon'),
  badge: text('badge'),
  data: text('data'), // JSON string
  sent_to_endpoints: text('sent_to_endpoints'), // JSON string array
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- PLANNING CATEGORIES TABLE ---
export const planningCategories = sqliteTable('planning_categories', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- PLANNING EVENTS TABLE ---
export const planningEvents = sqliteTable('planning_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  type: text('type').notNull().references(() => planningCategories.id),
  status: text('status').default('confirmed'),
  title: text('title').notNull(),
  details: text('details'),
  time: text('time'),
  show_on_tv: integer('show_on_tv', { mode: 'boolean' }).default(true),
  image_url: text('image_url'),
  is_popup: integer('is_popup', { mode: 'boolean' }).default(false),
  display_duration: integer('display_duration').default(15),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
  return {
    dateIdx: index('idx_planning_events_date').on(table.date),
  };
});

// --- PLANNER NOTES TABLE ---
export const plannerNotes = sqliteTable('planner_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  time: text('time'),
  end_time: text('end_time'),
  date: text('date'),
  done: integer('done', { mode: 'boolean' }).default(false),
  priority: text('priority').default('medium'),
  notified: integer('notified', { mode: 'boolean' }).default(false),
  user_id: integer('user_id'), // Optional, for personal notes
  is_dashboard: integer('is_dashboard', { mode: 'boolean' }).default(false),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});