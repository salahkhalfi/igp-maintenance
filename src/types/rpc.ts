import { Hono } from 'hono';
import tickets from '../routes/tickets';
import messages from '../routes/messages';
import comments from '../routes/comments';
import auth from '../routes/auth';
import users from '../routes/users';
import machines from '../routes/machines';
import type { Bindings } from './index';

// Dummy app to generate the type for RPC Client
// We only include routes that have been refactored to use Zod Validator
// This ensures the client has proper typing for these endpoints.
// Other endpoints can be added here as they are refactored.

const app = new Hono<{ Bindings: Bindings }>();

const routes = app
  .route('/api/tickets', tickets)
  .route('/api/messages', messages)
  .route('/api/comments', comments)
  .route('/api/auth', auth)
  .route('/api/users', users)
  .route('/api/machines', machines);

export type AppType = typeof routes;
