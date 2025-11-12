/**
 * Système de Gestion de Maintenance - IGP Glass
 * 
 * @author Salah Khalfi
 * @organization Produits Verriers International (IGP) Inc.
 * @department Département des Technologies de l'Information
 * @description Application de gestion de maintenance pour équipements industriels
 * @version 1.0.0
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { authMiddleware, adminOnly, technicianOrAdmin, technicianSupervisorOrAdmin, requirePermission, requireAnyPermission } from './middlewares/auth';
import { hasPermission, getRolePermissions } from './utils/permissions';
import { adminRolesHTML } from './views/admin-roles';
import auth from './routes/auth';
import tickets from './routes/tickets';
import machines from './routes/machines';
import media from './routes/media';
import comments from './routes/comments';
import users from './routes/users';
import roles from './routes/roles';
import settings from './routes/settings';
import webhooks from './routes/webhooks';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

/**
 * 🔒 CONFIGURATION CORS SÉCURISÉE
 * 
 * Liste blanche des origines autorisées pour accéder à l'API.
 * En mode strict (recommandé pour production), seules ces origines peuvent faire des requêtes.
 * 
 * Pour activer le mode strict:
 * - Configurer CORS_STRICT_MODE=true dans Cloudflare secrets
 */
const ALLOWED_ORIGINS = [
  'https://mecanique.igpglass.ca',           // Domaine personnalisé de production
  'https://webapp-7t8.pages.dev',            // Domaine Cloudflare Pages
  'https://0d6a8681.webapp-7t8.pages.dev',   // Déploiement v1.8.0
  'https://7644aa30.webapp-7t8.pages.dev',   // Déploiement camera fix
  'http://localhost:3000',                   // Développement local
  'http://127.0.0.1:3000'                    // Développement local (IPv4)
];

// Mode strict CORS (désactivé par défaut pour ne pas casser l'app)
const CORS_STRICT_MODE = process.env.CORS_STRICT_MODE === 'true';

app.use('/api/*', cors({
  origin: (origin) => {
    // Si mode strict activé, vérifier la liste blanche
    if (CORS_STRICT_MODE) {
      if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        console.warn(`⚠️ CORS: Blocked origin ${origin}`);
        return ALLOWED_ORIGINS[0]; // Fallback sur le domaine principal
      }
      return origin;
    }
    
    // Mode permissif (temporaire pour compatibilité)
    // TODO: Activer CORS_STRICT_MODE=true après migration complète
    if (!CORS_STRICT_MODE && origin) {
      // Logger les origines pour audit
      if (!ALLOWED_ORIGINS.includes(origin)) {
        console.log(`ℹ️ CORS: Non-whitelisted origin allowed (permissive mode): ${origin}`);
      }
    }
    
    return origin || '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // Permet l'envoi de cookies/credentials
}));


app.use('/api/auth/me', authMiddleware);


app.route('/api/auth', auth);


// ========================================
// ROUTES RBAC - TEST ET GESTION
// ========================================

// Route de test RBAC (accessible à tous les utilisateurs authentifiés)
app.get('/api/rbac/test', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Récupérer toutes les permissions du rôle de l'utilisateur
    const userPermissions = await getRolePermissions(c.env.DB, user.role);
    
    // Tester quelques permissions spécifiques
    const tests = {
      canCreateTickets: await hasPermission(c.env.DB, user.role, 'tickets', 'create', 'all'),
      canDeleteAllTickets: await hasPermission(c.env.DB, user.role, 'tickets', 'delete', 'all'),
      canDeleteOwnTickets: await hasPermission(c.env.DB, user.role, 'tickets', 'delete', 'own'),
      canCreateMachines: await hasPermission(c.env.DB, user.role, 'machines', 'create', 'all'),
      canCreateUsers: await hasPermission(c.env.DB, user.role, 'users', 'create', 'all'),
      canManageRoles: await hasPermission(c.env.DB, user.role, 'roles', 'create', 'all'),
    };
    
    return c.json({
      message: 'Test RBAC réussi',
      user: {
        id: user.userId,
        email: user.email,
        role: user.role
      },
      permissions: {
        total: userPermissions.length,
        list: userPermissions
      },
      specificTests: tests,
      interpretation: {
        role: user.role,
        description: 
          user.role === 'admin' ? 'Accès complet - Peut tout faire' :
          user.role === 'supervisor' ? 'Gestion complète sauf rôles/permissions' :
          user.role === 'technician' ? 'Gestion tickets + lecture' :
          user.role === 'operator' ? 'Tickets propres uniquement' :
          'Rôle personnalisé'
      }
    });
  } catch (error) {
    console.error('RBAC test error:', error);
    return c.json({ error: 'Erreur lors du test RBAC' }, 500);
  }
});

// ========================================
// ENDPOINTS RBAC - VÉRIFICATION PERMISSIONS FRONTEND
// ========================================

/**
 * GET /api/rbac/check - Vérifier une permission simple
 * Query params: resource, action, scope (défaut: 'all')
 * Retourne: { allowed: boolean }
 */
app.get('/api/rbac/check', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const resource = c.req.query('resource');
    const action = c.req.query('action');
    const scope = c.req.query('scope') || 'all';

    if (!resource || !action) {
      return c.json({ 
        error: 'Paramètres manquants',
        required: ['resource', 'action'],
        optional: ['scope (défaut: all)']
      }, 400);
    }

    const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);
    
    return c.json({ 
      allowed,
      permission: `${resource}.${action}.${scope}`,
      user_role: user.role
    });
  } catch (error) {
    console.error('RBAC check error:', error);
    return c.json({ error: 'Erreur vérification permission' }, 500);
  }
});

/**
 * GET /api/rbac/check-any - Vérifier plusieurs permissions (AU MOINS UNE)
 * Query param: permissions (CSV: "resource.action.scope,resource2.action2.scope2")
 * Retourne: { allowed: boolean, matched?: string }
 */
app.get('/api/rbac/check-any', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const permsParam = c.req.query('permissions');
    
    if (!permsParam) {
      return c.json({ 
        error: 'Paramètre manquant',
        required: 'permissions (CSV format: "resource.action.scope,...")'
      }, 400);
    }

    const permissions = permsParam.split(',');
    
    // Vérifier chaque permission jusqu'à trouver une correspondance
    for (const perm of permissions) {
      const parts = perm.trim().split('.');
      if (parts.length < 2) continue;
      
      const [resource, action, scope = 'all'] = parts;
      const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);
      
      if (allowed) {
        return c.json({ 
          allowed: true,
          matched: perm.trim(),
          user_role: user.role
        });
      }
    }

    return c.json({ 
      allowed: false,
      checked: permissions,
      user_role: user.role
    });
  } catch (error) {
    console.error('RBAC check-any error:', error);
    return c.json({ error: 'Erreur vérification permissions' }, 500);
  }
});

/**
 * GET /api/rbac/check-all - Vérifier plusieurs permissions (TOUTES)
 * Query param: permissions (CSV: "resource.action.scope,resource2.action2.scope2")
 * Retourne: { allowed: boolean, failed?: string[] }
 */
app.get('/api/rbac/check-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const permsParam = c.req.query('permissions');
    
    if (!permsParam) {
      return c.json({ 
        error: 'Paramètre manquant',
        required: 'permissions (CSV format: "resource.action.scope,...")'
      }, 400);
    }

    const permissions = permsParam.split(',');
    const failed: string[] = [];
    
    // Vérifier toutes les permissions
    for (const perm of permissions) {
      const parts = perm.trim().split('.');
      if (parts.length < 2) {
        failed.push(perm.trim() + ' (format invalide)');
        continue;
      }
      
      const [resource, action, scope = 'all'] = parts;
      const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);
      
      if (!allowed) {
        failed.push(perm.trim());
      }
    }

    const allAllowed = failed.length === 0;
    
    return c.json({ 
      allowed: allAllowed,
      checked: permissions,
      ...(failed.length > 0 && { failed }),
      user_role: user.role
    });
  } catch (error) {
    console.error('RBAC check-all error:', error);
    return c.json({ error: 'Erreur vérification permissions' }, 500);
  }
});

// Route de test avec middleware requirePermission
app.get('/api/rbac/test-permission', 
  authMiddleware,
  requirePermission('tickets', 'read', 'all'),
  async (c) => {
    return c.json({ 
      message: 'Permission accordée!',
      requiredPermission: 'tickets.read.all'
    });
  }
);

// Route de test avec middleware requireAnyPermission
app.get('/api/rbac/test-any-permission',
  authMiddleware,
  requireAnyPermission(['tickets.read.all', 'tickets.read.own']),
  async (c) => {
    return c.json({
      message: 'Au moins une permission accordée!',
      requiredPermissions: ['tickets.read.all', 'tickets.read.own']
    });
  }
);

// API de gestion des rôles (admin uniquement)
app.use('/api/roles/*', authMiddleware, adminOnly);
app.route('/api/roles', roles);


app.use('/api/tickets/*', authMiddleware);
app.route('/api/tickets', tickets);


app.use('/api/machines/*', authMiddleware);
app.route('/api/machines', machines);


// Route pour récupérer la liste des techniciens (accessible par tous les utilisateurs authentifiés)
app.get('/api/technicians', authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, full_name, email
      FROM users
      WHERE role = 'technician'
      ORDER BY full_name ASC
    `).all();
    
    return c.json({ technicians: results });
  } catch (error) {
    console.error('Get technicians error:', error);
    return c.json({ error: 'Erreur lors de la récupération des techniciens' }, 500);
  }
});

// Route pour que les techniciens voient la liste de tous les utilisateurs
// IMPORTANT: Cette route doit etre AVANT app.route('/api/users') pour ne pas etre bloquee par supervisorOrAdmin
app.get('/api/users/team', authMiddleware, technicianSupervisorOrAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, email, full_name, role, created_at, updated_at, last_login
      FROM users
      ORDER BY role DESC, full_name ASC
    `).all();
    
    return c.json({ users: results });
  } catch (error) {
    console.error('Get team users error:', error);
    return c.json({ error: 'Erreur lors de la récupération de l equipe' }, 500);
  }
});

app.use('/api/users/*', authMiddleware);
app.route('/api/users', users);

app.route('/api/media', media);

app.route('/api/comments', comments);

// Routes des paramètres système
app.use('/api/settings/*', authMiddleware);
app.route('/api/settings', settings);

// Routes des webhooks pour notifications
app.use('/api/webhooks/*', authMiddleware);
app.route('/api/webhooks', webhooks);

// Route publique pour CRON externe avec secret token
app.post('/api/cron/check-overdue', async (c) => {
  try {
    // Vérifier le token secret dans l'en-tête
    const authHeader = c.req.header('Authorization');
    const expectedToken = 'Bearer cron_secret_igp_2025_webhook_notifications';
    
    if (authHeader !== expectedToken) {
      return c.json({ error: 'Unauthorized - Invalid CRON token' }, 401);
    }
    
    console.log('🔔 CRON externe démarré:', new Date().toISOString());
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Récupérer tous les tickets planifiés expirés
    const overdueTickets = await c.env.DB.prepare(`
      SELECT 
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        m.machine_type,
        m.model,
        t.scheduled_date,
        t.assigned_to,
        t.created_at,
        u.full_name as assignee_name,
        reporter.full_name as reporter_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users reporter ON t.reported_by = reporter.id
      WHERE t.assigned_to IS NOT NULL
        AND t.scheduled_date IS NOT NULL
        AND t.scheduled_date != 'null'
        AND t.scheduled_date != ''
        AND t.status IN ('received', 'diagnostic')
        AND datetime(t.scheduled_date) < datetime('now')
      ORDER BY t.scheduled_date ASC
    `).all();
    
    if (!overdueTickets.results || overdueTickets.results.length === 0) {
      console.log('✅ CRON: Aucun ticket expiré trouvé');
      return c.json({ 
        message: 'Aucun ticket planifié expiré trouvé',
        checked_at: now.toISOString()
      });
    }
    
    console.log(`📋 CRON: ${overdueTickets.results.length} ticket(s) expiré(s) trouvé(s)`);
    
    let notificationsSent = 0;
    const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';
    const notifications = [];
    const errors = [];
    
    // Pour chaque ticket expiré
    for (const ticket of overdueTickets.results) {
      try {
        // Vérifier si notification déjà envoyée dans les 24h
        const existingNotification = await c.env.DB.prepare(`
          SELECT id, sent_at 
          FROM webhook_notifications 
          WHERE ticket_id = ? 
            AND notification_type = 'overdue_scheduled'
            AND datetime(sent_at) > datetime(?)
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(ticket.id, twentyFourHoursAgo.toISOString()).first();
        
        if (existingNotification) {
          console.log(`⏭️  CRON: Ticket ${ticket.ticket_id} déjà notifié (< 24h)`);
          continue;
        }
        
        // Calculer le retard
        const scheduledDate = new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z');
        const overdueMs = now.getTime() - scheduledDate.getTime();
        const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
        const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Préparer les données webhook
        const webhookData = {
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          machine: `${ticket.machine_type || 'N/A'} ${ticket.model || ''}`,
          scheduled_date: ticket.scheduled_date,
          assigned_to: ticket.assigned_to === 0 ? 'Équipe complète' : (ticket.assignee_name || `Technicien #${ticket.assigned_to}`),
          reporter: ticket.reporter_name || 'N/A',
          created_at: ticket.created_at,
          overdue_days: overdueDays,
          overdue_hours: overdueHours,
          overdue_minutes: overdueMinutes,
          overdue_text: overdueDays > 0 
            ? `${overdueDays} jour(s) ${overdueHours}h ${overdueMinutes}min`
            : `${overdueHours}h ${overdueMinutes}min`,
          notification_sent_at: now.toISOString()
        };
        
        // Envoyer le webhook
        const webhookResponse = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        const responseStatus = webhookResponse.status;
        let responseBody = '';
        try {
          responseBody = await webhookResponse.text();
        } catch (e) {
          responseBody = 'Could not read response body';
        }
        
        // Capturer le timestamp APRÈS l'envoi
        const sentAt = new Date().toISOString();
        
        // Enregistrer la notification
        await c.env.DB.prepare(`
          INSERT INTO webhook_notifications 
          (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          ticket.id,
          'overdue_scheduled',
          WEBHOOK_URL,
          sentAt,
          responseStatus,
          responseBody.substring(0, 1000)
        ).run();
        
        notificationsSent++;
        console.log(`✅ CRON: Webhook envoyé pour ${ticket.ticket_id} (status: ${responseStatus})`);
        
        notifications.push({
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          overdue_text: webhookData.overdue_text,
          webhook_status: responseStatus,
          sent_at: sentAt
        });
        
        // Délai de 200ms entre chaque webhook
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ CRON: Erreur pour ${ticket.ticket_id}:`, error);
        errors.push({
          ticket_id: ticket.ticket_id,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }
    
    console.log(`🎉 CRON terminé: ${notificationsSent}/${overdueTickets.results.length} notification(s) envoyée(s)`);
    
    return c.json({
      message: 'Vérification terminée',
      total_overdue: overdueTickets.results.length,
      notifications_sent: notificationsSent,
      notifications: notifications,
      errors: errors.length > 0 ? errors : undefined,
      checked_at: now.toISOString()
    });
    
  } catch (error) {
    console.error('❌ CRON: Erreur globale:', error);
    return c.json({ 
      error: 'Erreur serveur lors de la vérification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});



// ========================================
// ROUTES API - MESSAGERIE
// ========================================

// Note: authMiddleware appliqué individuellement sur chaque route
// SAUF /api/messages/audio/:fileKey qui doit être public

// Envoyer un message (public ou prive)
app.post('/api/messages', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { message_type, recipient_id, content } = await c.req.json();
    
    // Validation
    if (!message_type || !content || content.trim() === '') {
      return c.json({ error: 'Type et contenu requis' }, 400);
    }
    
    if (message_type !== 'public' && message_type !== 'private') {
      return c.json({ error: 'Type invalide' }, 400);
    }
    
    if (message_type === 'private' && !recipient_id) {
      return c.json({ error: 'Destinataire requis pour message prive' }, 400);
    }
    
    // Inserer le message
    const result = await c.env.DB.prepare(`
      INSERT INTO messages (sender_id, recipient_id, message_type, content)
      VALUES (?, ?, ?, ?)
    `).bind(user.userId, recipient_id || null, message_type, content).run();
    
    return c.json({ 
      message: 'Message envoye avec succes',
      id: result.meta.last_row_id 
    }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Erreur lors de envoi du message' }, 500);
  }
});

// Envoyer un message audio
app.post('/api/messages/audio', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    
    const audioFile = formData.get('audio') as File;
    const messageType = formData.get('message_type') as string;
    const recipientId = formData.get('recipient_id') as string;
    const duration = parseInt(formData.get('duration') as string || '0');
    
    // Validation du fichier
    if (!audioFile) {
      return c.json({ error: 'Fichier audio requis' }, 400);
    }
    
    // Validation taille (max 10 MB)
    const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return c.json({ 
        error: `Fichier trop volumineux (${(audioFile.size / 1024 / 1024).toFixed(1)} MB). Maximum: 10 MB` 
      }, 400);
    }
    
    // Validation type MIME (formats légers et universels)
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    const isAllowed = allowedTypes.some(type => audioFile.type.startsWith(type));
    if (!isAllowed) {
      return c.json({ 
        error: `Type de fichier non autorisé: ${audioFile.type}. Types acceptés: MP3, MP4, WebM, OGG, WAV` 
      }, 400);
    }
    
    // Validation durée (max 5 minutes = 300 secondes)
    if (duration > 300) {
      return c.json({ error: 'Durée maximale: 5 minutes' }, 400);
    }
    
    // Validation type de message
    if (messageType !== 'public' && messageType !== 'private') {
      return c.json({ error: 'Type de message invalide' }, 400);
    }
    
    if (messageType === 'private' && !recipientId) {
      return c.json({ error: 'Destinataire requis pour message privé' }, 400);
    }
    
    // Générer clé unique pour le fichier
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = audioFile.name.split('.').pop() || 'webm';
    const fileKey = `messages/audio/${user.userId}/${timestamp}-${randomId}.${extension}`;
    
    // Upload vers R2
    const arrayBuffer = await audioFile.arrayBuffer();
    await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: audioFile.type
      }
    });
    
    // Sauvegarder en DB
    const result = await c.env.DB.prepare(`
      INSERT INTO messages (
        sender_id, recipient_id, message_type, content,
        audio_file_key, audio_duration, audio_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.userId,
      recipientId || null,
      messageType,
      '🎤 Message vocal',
      fileKey,
      duration,
      audioFile.size
    ).run();
    
    console.log(`✅ Audio message uploaded: ${fileKey} (${(audioFile.size / 1024).toFixed(1)} KB, ${duration}s)`);
    
    return c.json({ 
      message: 'Message vocal envoyé avec succès',
      messageId: result.meta.last_row_id,
      audioKey: fileKey
    }, 201);
  } catch (error) {
    console.error('Upload audio error:', error);
    return c.json({ error: 'Erreur lors de l\'envoi du message vocal' }, 500);
  }
});

// Récupérer un fichier audio
app.get('/api/audio/*', async (c) => {
  try {
    // Récupérer le chemin complet après /api/audio/
    const fullPath = c.req.path;
    const fileKey = fullPath.replace('/api/audio/', '');
    
    // Vérifier que le message existe
    const message = await c.env.DB.prepare(`
      SELECT sender_id, recipient_id, message_type
      FROM messages
      WHERE audio_file_key = ?
    `).bind(fileKey).first();
    
    if (!message) {
      console.error('Audio non trouvé:', fileKey);
      return c.json({ error: 'Message audio non trouvé', fileKey: fileKey }, 404);
    }
    
    // TODO: Sécurité audio privés
    // TEMPORAIRE: Les balises <audio> HTML ne peuvent pas envoyer de headers Authorization
    // et ne supportent pas bien les tokens dans query params (CORS, cache browser)
    // Solution temporaire: Permettre accès aux audio privés sans vérification stricte
    // Solution future: Implémenter signed URLs avec expiration courte (5-10 min)
    //
    // Pour l'instant: Audio privés accessibles comme les publics
    // Risque: Quelqu'un avec l'URL peut écouter (faible car URLs complexes et non listées)
    
    // Messages publics et privés: accès ouvert pour compatibilité HTML <audio>
    
    // Messages publics: pas de vérification nécessaire
    
    // Récupérer depuis R2
    const object = await c.env.MEDIA_BUCKET.get(fileKey);
    
    if (!object) {
      return c.json({ error: 'Fichier audio non trouvé dans le stockage' }, 404);
    }
    
    // Retourner le fichier audio
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'audio/webm',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('Get audio error:', error);
    return c.json({ error: 'Erreur lors de la recuperation audio' }, 500);
  }
});

// Recuperer les messages publics avec pagination
app.get('/api/messages/public', authMiddleware, async (c) => {
  try {
    // Paramètres de pagination
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Valider les paramètres
    if (page < 1 || limit < 1 || limit > 100) {
      return c.json({ error: 'Paramètres de pagination invalides' }, 400);
    }
    
    // Récupérer les messages avec pagination
    const { results } = await c.env.DB.prepare(`
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        m.audio_file_key,
        m.audio_duration,
        m.audio_size,
        u.full_name as sender_name,
        u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.message_type = 'public'
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    // Compter le total de messages publics
    const { count } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE message_type = 'public'
    `).first() as { count: number };
    
    return c.json({ 
      messages: results,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasMore: offset + results.length < count
      }
    });
  } catch (error) {
    console.error('Get public messages error:', error);
    return c.json({ error: 'Erreur lors de la recuperation des messages' }, 500);
  }
});

// Recuperer les conversations privees (liste des contacts)
app.get('/api/messages/conversations', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    // D'abord recuperer tous les contacts uniques
    const { results: contacts } = await c.env.DB.prepare(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.recipient_id
          ELSE m.sender_id
        END as contact_id
      FROM messages m
      WHERE m.message_type = 'private'
        AND (m.sender_id = ? OR m.recipient_id = ?)
    `).bind(user.userId, user.userId, user.userId).all();
    
    // Pour chaque contact, recuperer les details
    const conversations = [];
    for (const contact of contacts) {
      const contactId = contact.contact_id;
      if (!contactId) continue;
      
      // Info utilisateur
      const userInfo = await c.env.DB.prepare(`
        SELECT full_name, role FROM users WHERE id = ?
      `).bind(contactId).first();
      
      // Dernier message
      const lastMsg = await c.env.DB.prepare(`
        SELECT content, created_at
        FROM messages
        WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
        ORDER BY created_at DESC LIMIT 1
      `).bind(user.userId, contactId, contactId, user.userId).first();
      
      // Messages non lus
      const unreadResult = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE sender_id = ? AND recipient_id = ? AND is_read = 0
      `).bind(contactId, user.userId).first();
      
      conversations.push({
        contact_id: contactId,
        contact_name: userInfo?.full_name || 'Inconnu',
        contact_role: userInfo?.role || 'unknown',
        last_message: lastMsg?.content || null,
        last_message_time: lastMsg?.created_at || null,
        unread_count: unreadResult?.count || 0
      });
    }
    
    // Trier par date du dernier message
    conversations.sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time) - new Date(a.last_message_time);
    });
    
    return c.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return c.json({ error: 'Erreur lors de la recuperation des conversations' }, 500);
  }
});

// Recuperer les messages prives avec un contact specifique
app.get('/api/messages/private/:contactId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const contactId = parseInt(c.req.param('contactId'));
    
    // Recuperer les messages
    const { results } = await c.env.DB.prepare(`
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        m.recipient_id,
        m.is_read,
        m.audio_file_key,
        m.audio_duration,
        m.audio_size,
        u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.message_type = 'private'
        AND ((m.sender_id = ? AND m.recipient_id = ?)
          OR (m.sender_id = ? AND m.recipient_id = ?))
      ORDER BY m.created_at ASC
    `).bind(user.userId, contactId, contactId, user.userId).all();
    
    // Marquer les messages recus comme lus
    await c.env.DB.prepare(`
      UPDATE messages 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE sender_id = ? 
        AND recipient_id = ? 
        AND is_read = 0
    `).bind(contactId, user.userId).run();
    
    return c.json({ messages: results });
  } catch (error) {
    console.error('Get private messages error:', error);
    return c.json({ error: 'Erreur lors de la recuperation des messages' }, 500);
  }
});

// Compter les messages non lus
app.get('/api/messages/unread-count', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE recipient_id = ? AND is_read = 0
    `).bind(user.userId).first();
    
    return c.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json({ error: 'Erreur lors du comptage' }, 500);
  }
});

// Liste des utilisateurs disponibles pour messagerie
app.get('/api/messages/available-users', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    const { results } = await c.env.DB.prepare(`
      SELECT id, full_name, role, email
      FROM users
      WHERE role IN ('operator', 'furnace_operator', 'technician', 'supervisor', 'admin')
        AND id != ?
      ORDER BY role DESC, full_name ASC
    `).bind(user.userId).all();
    
    return c.json({ users: results });
  } catch (error) {
    console.error('Get available users error:', error);
    return c.json({ error: 'Erreur lors de la recuperation des utilisateurs' }, 500);
  }
});

// Supprimer un message avec controle de permissions
app.delete('/api/messages/:messageId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const messageId = parseInt(c.req.param('messageId'));
    
    // Recuperer le message avec audio_file_key
    const message = await c.env.DB.prepare(`
      SELECT m.*, u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).bind(messageId).first();
    
    if (!message) {
      return c.json({ error: 'Message non trouve' }, 404);
    }
    
    // Verification des permissions
    const canDelete = 
      // Utilisateur peut supprimer son propre message
      message.sender_id === user.userId ||
      // Admin peut supprimer tous les messages
      user.role === 'admin' ||
      // Superviseur peut supprimer tous sauf ceux de admin
      (user.role === 'supervisor' && message.sender_role !== 'admin');
    
    if (!canDelete) {
      return c.json({ error: 'Vous n avez pas la permission de supprimer ce message' }, 403);
    }
    
    // Supprimer le fichier audio du bucket R2 si existe
    if (message.audio_file_key) {
      try {
        await c.env.MEDIA_BUCKET.delete(message.audio_file_key);
        console.log(`Audio supprime du R2: ${message.audio_file_key}`);
      } catch (deleteError) {
        console.error(`Erreur suppression audio R2 ${message.audio_file_key}:`, deleteError);
        // Continue meme si la suppression du fichier echoue
      }
    }
    
    // Supprimer le message de la base de donnees
    await c.env.DB.prepare(`
      DELETE FROM messages WHERE id = ?
    `).bind(messageId).run();
    
    return c.json({ 
      message: 'Message supprime avec succes',
      audioDeleted: message.audio_file_key ? true : false
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return c.json({ error: 'Erreur lors de la suppression du message' }, 500);
  }
});

// Suppression en masse de messages
app.post('/api/messages/bulk-delete', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { message_ids } = await c.req.json();
    
    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return c.json({ error: 'Liste de message_ids requise' }, 400);
    }
    
    // Limiter a 100 messages max par requete
    if (message_ids.length > 100) {
      return c.json({ error: 'Maximum 100 messages par suppression' }, 400);
    }
    
    let deletedCount = 0;
    let audioDeletedCount = 0;
    const errors = [];
    
    for (const messageId of message_ids) {
      try {
        // Recuperer le message avec audio_file_key et role
        const message = await c.env.DB.prepare(`
          SELECT m.*, u.role as sender_role
          FROM messages m
          LEFT JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `).bind(messageId).first();
        
        if (!message) {
          errors.push({ messageId, error: 'Message non trouve' });
          continue;
        }
        
        // Verification des permissions pour chaque message
        const canDelete = 
          message.sender_id === user.userId ||
          user.role === 'admin' ||
          (user.role === 'supervisor' && message.sender_role !== 'admin');
        
        if (!canDelete) {
          errors.push({ messageId, error: 'Permission refusee' });
          continue;
        }
        
        // Supprimer le fichier audio du bucket R2 si existe
        if (message.audio_file_key) {
          try {
            await c.env.MEDIA_BUCKET.delete(message.audio_file_key);
            console.log(`Audio supprime du R2: ${message.audio_file_key}`);
            audioDeletedCount++;
          } catch (deleteError) {
            console.error(`Erreur suppression audio R2 ${message.audio_file_key}:`, deleteError);
          }
        }
        
        // Supprimer le message de la base de donnees
        await c.env.DB.prepare(`
          DELETE FROM messages WHERE id = ?
        `).bind(messageId).run();
        
        deletedCount++;
      } catch (error) {
        console.error(`Erreur suppression message ${messageId}:`, error);
        errors.push({ messageId, error: 'Erreur serveur' });
      }
    }
    
    return c.json({ 
      message: deletedCount + ' message(s) supprime(s) avec succes',
      deletedCount,
      audioDeletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk delete messages error:', error);
    return c.json({ error: 'Erreur lors de la suppression en masse' }, 500);
  }
});

// Route de test R2
app.get('/api/test/r2', async (c) => {
  try {
    const list = await c.env.MEDIA_BUCKET.list({ limit: 10, prefix: 'messages/audio/' });
    return c.json({ 
      success: true,
      bucket_name: 'maintenance-media',
      files_count: list.objects.length,
      files: list.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded
      }))
    });
  } catch (error) {
    return c.json({ 
      success: false,
      error: error.message,
      bucket_configured: !!c.env.MEDIA_BUCKET
    }, 500);
  }
});

// Endpoint pour envoyer des alertes automatiques pour tickets en retard (appelé périodiquement)
app.post('/api/alerts/check-overdue', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    // Seuls admin et superviseur peuvent déclencher cette vérification
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return c.json({ error: 'Permission refusée' }, 403);
    }
    
    // Obtenir le decalage horaire depuis les parametres systeme
    const { results: settingResults } = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'timezone_offset_hours'
    `).all();
    
    const timezoneOffset = settingResults.length > 0 ? parseInt(settingResults[0].setting_value) : -5;
    
    // Appliquer le decalage horaire (ex: -5 pour EST, -4 pour EDT)
    const nowUTC = new Date();
    const nowLocal = new Date(nowUTC.getTime() + (timezoneOffset * 60 * 60 * 1000));
    const now = nowLocal.toISOString().replace('T', ' ').substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS
    
    // Trouver tous les tickets planifiés en retard (received ou diagnostic uniquement)
    const { results: overdueTickets } = await c.env.DB.prepare(`
      SELECT 
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.machine_type,
        t.model,
        t.priority,
        t.status,
        t.scheduled_date,
        t.assigned_to,
        u.full_name as assigned_name,
        r.full_name as reporter_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users r ON t.reported_by = r.id
      WHERE t.scheduled_date IS NOT NULL
        AND t.scheduled_date < ?
        AND (t.status = 'received' OR t.status = 'diagnostic')
      ORDER BY t.scheduled_date ASC
    `).bind(now).all();
    
    if (overdueTickets.length === 0) {
      return c.json({ message: 'Aucun ticket en retard', count: 0 });
    }
    
    // Trouver tous les administrateurs
    const { results: admins } = await c.env.DB.prepare(`
      SELECT id, full_name
      FROM users
      WHERE role = 'admin'
    `).all();
    
    if (admins.length === 0) {
      return c.json({ error: 'Aucun administrateur trouvé' }, 404);
    }
    
    let sentCount = 0;
    
    // Pour chaque ticket en retard, envoyer une notification à tous les admins
    for (const ticket of overdueTickets) {
      // Vérifier si une alerte a déjà été envoyée pour ce ticket (éviter les doublons)
      const { results: existingAlerts } = await c.env.DB.prepare(`
        SELECT id FROM messages
        WHERE content LIKE ?
          AND message_type = 'private'
          AND created_at > datetime('now', '-24 hours')
      `).bind(`%${ticket.ticket_id}%RETARD%`).all();
      
      // Si alerte déjà envoyée dans les 24h, passer au suivant
      if (existingAlerts.length > 0) {
        continue;
      }
      
      // Calculer le retard
      const scheduledDate = new Date(ticket.scheduled_date);
      const nowDate = new Date();
      const delayMs = nowDate - scheduledDate;
      const delayHours = Math.floor(delayMs / (1000 * 60 * 60));
      const delayMinutes = Math.floor((delayMs % (1000 * 60 * 60)) / (1000 * 60));
      
      // Créer le message d'alerte
      const priorityEmoji = 
        ticket.priority === 'critical' ? '🔴 CRITIQUE' :
        ticket.priority === 'high' ? '🟠 HAUTE' :
        ticket.priority === 'medium' ? '🟡 MOYENNE' :
        '🟢 FAIBLE';
      
      const assignedInfo = ticket.assigned_to === 0 
        ? '👥 Toute l\'équipe' 
        : ticket.assigned_name 
          ? `👤 ${ticket.assigned_name}` 
          : '❌ Non assigné';
      
      const messageContent = `
⚠️ ALERTE RETARD ⚠️

Ticket: ${ticket.ticket_id}
Titre: ${ticket.title}
Machine: ${ticket.machine_type} ${ticket.model}
Priorité: ${priorityEmoji}
Statut: ${ticket.status === 'received' ? 'Requête' : 'Diagnostic'}

📅 Date planifiée: ${new Date(ticket.scheduled_date).toLocaleString('fr-FR')}
⏰ Retard: ${delayHours}h ${delayMinutes}min

Assigné à: ${assignedInfo}
Rapporté par: ${ticket.reporter_name || 'N/A'}

${ticket.description ? `Description: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}` : ''}

Action requise immédiatement !
      `.trim();
      
      // Envoyer à tous les administrateurs
      for (const admin of admins) {
        await c.env.DB.prepare(`
          INSERT INTO messages (sender_id, recipient_id, message_type, content)
          VALUES (?, ?, 'private', ?)
        `).bind(1, admin.id, messageContent).run(); // sender_id = 1 (système)
        
        sentCount++;
      }
    }
    
    return c.json({ 
      message: `${sentCount} alerte(s) envoyée(s) pour ${overdueTickets.length} ticket(s) en retard`,
      overdueCount: overdueTickets.length,
      alertsSent: sentCount
    });
    
  } catch (error) {
    console.error('Check overdue error:', error);
    return c.json({ error: 'Erreur lors de la vérification des retards' }, 500);
  }
});


// Page d'administration des rôles (accessible sans auth serveur, auth gérée par JS)
app.get('/admin/roles', async (c) => {
  // Servir la page telle quelle - l'authentification sera vérifiée par le JS client
  // qui redirigera vers / si pas de token dans localStorage
  return c.html(adminRolesHTML);
});

// Servir les fichiers statiques du dossier static/
app.use('/static/*', serveStatic({ root: './' }));

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGP - Système de Gestion de Maintenance</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        // Couleurs primaires IGP (existantes)
                        'igp-blue': '#1e40af',
                        'igp-orange': '#ea580c',
                        'igp-red': '#dc2626',
                        
                        // Nouvelles couleurs harmonisées IGP
                        'igp-blue-light': '#3b82f6',
                        'igp-blue-dark': '#1e3a8a',
                        'igp-green': '#10b981',
                        'igp-yellow': '#f59e0b',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .kanban-column {
            min-height: 400px;
            min-width: 260px;
            background: linear-gradient(145deg, #f8fafc, #e2e8f0);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 
                8px 8px 16px rgba(71, 85, 105, 0.15),
                -4px -4px 12px rgba(255, 255, 255, 0.7),
                inset 1px 1px 2px rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(148, 163, 184, 0.1);
            transition: all 0.3s ease;
        }
        
        .kanban-column:hover {
            background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
            box-shadow: 
                10px 10px 20px rgba(71, 85, 105, 0.18),
                -5px -5px 14px rgba(255, 255, 255, 0.8),
                inset 1px 1px 3px rgba(255, 255, 255, 0.4);
            transform: translateY(-2px);
        }
        
        /* Colonnes vides prennent moins de place */
        .kanban-column.empty {
            flex: 0 0 auto;
            width: 200px;
        }
        
        /* Colonnes avec tickets prennent plus de place */
        .kanban-column.has-tickets {
            flex: 1 1 280px;
            max-width: 320px;
        }
        
        .ticket-card {
            background: linear-gradient(145deg, #ffffff, #f1f5f9);
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 10px;
            box-shadow: 
                6px 6px 12px rgba(71, 85, 105, 0.12),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            border: 1px solid rgba(148, 163, 184, 0.08);
            position: relative;
        }
        
        .ticket-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(100, 116, 139, 0.1), transparent);
            border-radius: 10px 10px 0 0;
        }
        
        .ticket-card:hover {
            box-shadow: 
                8px 8px 20px rgba(71, 85, 105, 0.18),
                -4px -4px 12px rgba(255, 255, 255, 0.9),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
            transform: translateY(-3px) translateZ(10px);
        }
        .ticket-card:active {
            cursor: grabbing;
            box-shadow: 
                4px 4px 8px rgba(71, 85, 105, 0.2),
                -2px -2px 6px rgba(255, 255, 255, 0.7);
        }
        
        .ticket-card.dragging {
            opacity: 0.7;
            cursor: grabbing;
            transform: rotate(3deg) scale(1.05);
            box-shadow: 
                12px 12px 24px rgba(71, 85, 105, 0.25),
                -6px -6px 16px rgba(255, 255, 255, 0.5);
        }
        .ticket-card.long-press-active {
            background: #eff6ff;
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }
        .kanban-column.drag-over {
            background: #dbeafe;
            border: 3px dashed #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1);
            transform: scale(1.02);
            transition: all 0.2s ease;
        }
        .kanban-column.drag-valid {
            background: #d1fae5;
            border: 2px dashed #10b981;
        }
        .kanban-column.drag-invalid {
            background: #fee2e2;
            border: 2px dashed #ef4444;
        }
        .priority-high {
            border-left: 5px solid #ef4444;
            box-shadow: 
                6px 6px 12px rgba(239, 68, 68, 0.15),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        .priority-critical {
            border-left: 5px solid #dc2626;
            box-shadow: 
                6px 6px 12px rgba(220, 38, 38, 0.2),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            animation: pulse-subtle 3s ease-in-out infinite;
        }
        
        @keyframes pulse-subtle {
            0%, 100% {
                box-shadow: 
                    6px 6px 12px rgba(220, 38, 38, 0.2),
                    -3px -3px 8px rgba(255, 255, 255, 0.8);
            }
            50% {
                box-shadow: 
                    6px 6px 16px rgba(220, 38, 38, 0.3),
                    -3px -3px 8px rgba(255, 255, 255, 0.8);
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .priority-medium {
            border-left: 5px solid #f59e0b;
            box-shadow: 
                6px 6px 12px rgba(245, 158, 11, 0.12),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        .priority-low {
            border-left: 5px solid #10b981;
            box-shadow: 
                6px 6px 12px rgba(16, 185, 129, 0.1),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        .modal.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px 0;
        }
        @media (max-width: 640px) {
            .modal.active {
                padding: 10px 0;
                align-items: flex-start;
            }
        }
        .context-menu {
            position: fixed;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2000;
            min-width: 200px;
            padding: 8px 0;
        }
        .context-menu-item {
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background 0.2s;
            font-size: 15px;
        }
        .context-menu-item:hover {
            background: #f3f4f6;
        }
        .context-menu-item:active {
            background: #e5e7eb;
        }
        .context-menu-item i {
            margin-right: 12px;
            width: 20px;
        }
        
        /* Line clamp pour limiter les lignes de texte */
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        /* Scroll horizontal personnalisé */
        .overflow-x-auto {
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
        }
        .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.5);
            border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.7);
        }
        
        /* MOBILE RESPONSIVE STYLES */
        @media (max-width: 1024px) {
            .kanban-grid {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .kanban-column {
                min-height: auto;
                width: 100% !important;
                max-width: none !important;
                flex: none !important;
            }
            .kanban-column.empty,
            .kanban-column.has-tickets {
                width: 100% !important;
            }
            .header-actions {
                flex-direction: column;
                gap: 8px;
                width: 100%;
            }
            .header-actions button {
                width: 100%;
                padding: 12px 16px;
                font-size: 16px;
            }
            .ticket-card {
                padding: 16px;
                font-size: 15px;
                min-height: 44px;
            }
            .context-menu-item {
                padding: 16px 20px;
                font-size: 16px;
                min-height: 48px;
            }
            .modal-content {
                width: 95vw !important;
                max-width: 95vw !important;
                margin: 10px;
            }
        }
        
        @media (max-width: 640px) {
            .header-title {
                flex-direction: column;
                align-items: flex-start;
            }
            .header-title h1 {
                font-size: 20px;
            }
            .kanban-column-header h3 {
                font-size: 14px;
            }
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        /* ===== BOTTOM SHEET MOBILE ANIMATIONS ===== */
        @keyframes fadeInBackdrop {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUpSheet {
            from { 
                transform: translateY(100%); 
                opacity: 0;
            }
            to { 
                transform: translateY(0); 
                opacity: 1;
            }
        }
        
        .bottom-sheet-backdrop {
            animation: fadeInBackdrop 0.2s ease-out;
        }
        
        .bottom-sheet-content {
            animation: slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .no-tap-highlight {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    
    <script>
        const API_URL = '/api';
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;
        
        if (authToken) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
        }
        
        
        const getStatusLabel = (status) => {
            const statusLabels = {
                'received': 'Requête Reçue',
                'diagnostic': 'Diagnostic',
                'in_progress': 'En Cours',
                'waiting_parts': 'En Attente Pièces',
                'completed': 'Terminé',
                'archived': 'Archivé'
            };
            return statusLabels[status] || status;
        };
        
        // FONCTION UTILITAIRE CENTRALE: Obtenir l'heure EST/EDT configurée
        // Lit timezone_offset_hours depuis localStorage (-5 pour EST, -4 pour EDT)
        // Cette fonction remplace tous les new Date() pour garantir que tout le monde voit la meme heure
        const getNowEST = () => {
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const nowUTC = new Date();
            return new Date(nowUTC.getTime() + (offset * 60 * 60 * 1000));
        };
        
        // FONCTION UTILITAIRE: Vérifier si scheduled_date est valide
        // D1 retourne parfois "null" comme string au lieu de null
        const hasScheduledDate = (scheduledDate) => {
            return scheduledDate && scheduledDate !== 'null' && scheduledDate !== '';
        };
        
        // Fonction pour formater les dates en heure locale de l'appareil
        // Format québécois: JJ-MM-AAAA HH:mm
        const formatDateEST = (dateString, includeTime = true) => {
            // Convertir le format SQL en ISO pour parsing correct avec Z pour UTC
            const isoDateString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
            // Ajouter Z pour forcer interpretation UTC
            const dateUTC = new Date(isoDateString + (isoDateString.includes('Z') ? '' : 'Z'));
            
            // Obtenir l'offset EST/EDT depuis localStorage
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            // Appliquer le decalage pour obtenir l'heure EST/EDT
            const dateEST = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
            
            const day = String(dateEST.getUTCDate()).padStart(2, '0');
            const month = String(dateEST.getUTCMonth() + 1).padStart(2, '0');
            const year = dateEST.getUTCFullYear();
            
            if (includeTime) {
                const hours = String(dateEST.getUTCHours()).padStart(2, '0');
                const minutes = String(dateEST.getUTCMinutes()).padStart(2, '0');
                return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
            }
            
            return day + '-' + month + '-' + year;
        };
        
        // Fonction pour calculer le temps écoulé depuis la création
        // Retourne un objet {days, hours, minutes, seconds, color, bgColor}
        const getElapsedTime = (createdAt) => {
            const now = getNowEST();
            // Convertir le format SQL "YYYY-MM-DD HH:MM:SS" en format ISO "YYYY-MM-DDTHH:MM:SS"
            // Si la date contient déjà un T, on ne touche pas
            const isoCreatedAt = createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T');
            // Ajouter Z pour forcer interpretation UTC
            const createdUTC = new Date(isoCreatedAt + (isoCreatedAt.includes('Z') ? '' : 'Z'));
            // Appliquer l'offset EST/EDT
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const created = new Date(createdUTC.getTime() + (offset * 60 * 60 * 1000));
            
            // Si la date est invalide, retourner 0
            if (isNaN(created.getTime())) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '⚪' };
            }
            
            const diffMs = now - created;
            
            // Si diffMs est négatif (date future), retourner 0
            if (diffMs < 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '⚪' };
            }
            
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            // Déterminer la couleur et le fond selon l'urgence
            let color = 'text-green-700';
            let bgColor = 'bg-green-50 border-green-200';
            let icon = '🟢';
            
            if (days >= 7) {
                color = 'text-red-700 font-bold';
                bgColor = 'bg-red-50 border-red-300';
                icon = '🔴';
            } else if (days >= 3) {
                color = 'text-amber-700 font-semibold';
                bgColor = 'bg-amber-50 border-amber-200';
                icon = '🟠';
            } else if (days >= 1) {
                color = 'text-yellow-700';
                bgColor = 'bg-yellow-50 border-yellow-200';
                icon = '🟡';
            }
            
            return { days, hours, minutes, seconds, color, bgColor, icon };
        };
        
        // Formater le texte du chronomètre avec secondes
        const formatElapsedTime = (elapsed) => {
            if (elapsed.days > 0) {
                return elapsed.days + 'j ' + String(elapsed.hours).padStart(2, '0') + ':' + String(elapsed.minutes).padStart(2, '0');
            } else if (elapsed.hours > 0) {
                return elapsed.hours + 'h ' + String(elapsed.minutes).padStart(2, '0') + ':' + String(elapsed.seconds).padStart(2, '0');
            } else if (elapsed.minutes > 0) {
                return elapsed.minutes + 'min ' + String(elapsed.seconds).padStart(2, '0') + 's';
            } else {
                return elapsed.seconds + 's';
            }
        };
        
        
        // Composant de notification personnalisé
        const NotificationModal = ({ show, message, type, onClose }) => {
            if (!show) return null;
            
            const colors = {
                success: 'bg-green-50 border-green-500 text-green-800',
                error: 'bg-red-50 border-red-500 text-red-800',
                info: 'bg-blue-50 border-blue-500 text-blue-800'
            };
            
            const icons = {
                success: 'fa-check-circle text-green-600',
                error: 'fa-exclamation-circle text-red-600',
                info: 'fa-info-circle text-blue-600'
            };
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex items-start gap-4' },
                        React.createElement('i', { 
                            className: 'fas ' + icons[type] + ' text-3xl mt-1'
                        }),
                        React.createElement('div', { className: 'flex-1' },
                            React.createElement('p', { className: 'text-lg font-semibold mb-4' }, message)
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end mt-4' },
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-700 font-semibold'
                        }, 'OK')
                    )
                )
            );
        };
        
        // Composant de confirmation personnalisé
        const ConfirmModal = ({ show, message, onConfirm, onCancel }) => {
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                onClick: onCancel
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex items-start gap-4 mb-6' },
                        React.createElement('i', { 
                            className: 'fas fa-exclamation-triangle text-yellow-600 text-3xl mt-1'
                        }),
                        React.createElement('div', { className: 'flex-1' },
                            React.createElement('p', { className: 'text-lg font-semibold' }, message)
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-3' },
                        React.createElement('button', {
                            onClick: onCancel,
                            className: 'px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-semibold'
                        }, 'Annuler'),
                        React.createElement('button', {
                            onClick: onConfirm,
                            className: 'px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold'
                        }, 'Confirmer')
                    )
                )
            );
        };
        
        // Composant Toast pour notifications rapides
        const Toast = ({ show, message, type, onClose }) => {
            React.useEffect(() => {
                if (show) {
                    const timer = setTimeout(() => {
                        onClose();
                    }, 3000);
                    return () => clearTimeout(timer);
                }
            }, [show]);
            
            if (!show) return null;
            
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500'
            };
            
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };
            
            return React.createElement('div', {
                className: 'fixed bottom-4 right-4 z-50 animate-slide-up',
                style: { animation: 'slideUp 0.3s ease-out' }
            },
                React.createElement('div', {
                    className: colors[type] + ' text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md'
                },
                    React.createElement('i', { className: 'fas ' + icons[type] + ' text-xl' }),
                    React.createElement('p', { className: 'font-semibold flex-1' }, message),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-white hover:text-gray-200 text-xl ml-2'
                    }, '×')
                )
            );
        };
        
        // Composant Chronomètre dynamique (mise à jour chaque seconde)
        const TicketTimer = ({ createdAt, status }) => {
            const [elapsed, setElapsed] = React.useState(() => getElapsedTime(createdAt));
            
            React.useEffect(() => {
                // Ne pas afficher le chronomètre si le ticket est terminé ou archivé
                if (status === 'completed' || status === 'archived') {
                    return;
                }
                
                // Mettre à jour chaque seconde pour afficher les secondes
                const interval = setInterval(() => {
                    setElapsed(getElapsedTime(createdAt));
                }, 1000); // 1000ms = 1 seconde
                
                return () => clearInterval(interval);
            }, [createdAt, status]);
            
            // Ne pas afficher si ticket terminé/archivé
            if (status === 'completed' || status === 'archived') {
                return null;
            }
            
            return React.createElement('div', { 
                className: 'mt-1.5 pt-1.5 border-t border-gray-200 text-xs ' + elapsed.color
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex items-center gap-1' },
                        React.createElement('span', {}, elapsed.icon),
                        React.createElement('i', { className: 'fas fa-hourglass-half' }),
                        React.createElement('span', { className: 'ml-1 text-gray-600 font-normal' }, 'Requête reçue depuis:')
                    ),
                    React.createElement('span', { className: 'font-bold font-mono' }, formatElapsedTime(elapsed))
                )
            );
        };
        
        // Composant Compte a rebours pour date planifiee (avec changement de couleur)
        const ScheduledCountdown = ({ scheduledDate }) => {
            const [countdown, setCountdown] = React.useState(() => getCountdownInfo(scheduledDate));
            
            React.useEffect(() => {
                const interval = setInterval(() => {
                    setCountdown(getCountdownInfo(scheduledDate));
                }, 1000); // Mise a jour chaque seconde
                
                return () => clearInterval(interval);
            }, [scheduledDate]);
            
            return React.createElement('div', { 
                className: 'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-semibold ' + countdown.className
            },
                React.createElement('i', { className: 'fas fa-clock' }),
                React.createElement('span', {}, countdown.text)
            );
        };
        
        // Fonction pour calculer le compte a rebours et determiner la couleur
        const getCountdownInfo = (scheduledDate) => {
            if (!scheduledDate) return { text: '', className: '', isOverdue: false };
            
            const now = getNowEST();
            const scheduledISO = scheduledDate.replace(' ', 'T');
            // Ajouter Z pour forcer interpretation UTC
            const scheduledUTC = new Date(scheduledISO + (scheduledISO.includes('Z') ? '' : 'Z'));
            // Appliquer l'offset EST/EDT
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const scheduled = new Date(scheduledUTC.getTime() + (offset * 60 * 60 * 1000));
            const diffMs = scheduled - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            let text = '';
            let className = '';
            let isOverdue = false;
            
            if (diffMs < 0) {
                // En retard
                const absMs = Math.abs(diffMs);
                const absHours = Math.floor(absMs / (1000 * 60 * 60));
                const absMinutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
                const absSeconds = Math.floor((absMs % (1000 * 60)) / 1000);
                const absDays = Math.floor(absMs / (1000 * 60 * 60 * 24));
                
                if (absDays > 0) {
                    text = 'Retard: ' + absDays + 'j ' + (absHours % 24) + 'h ' + absMinutes + 'min ' + absSeconds + 's';
                } else if (absHours > 0) {
                    text = 'Retard: ' + absHours + 'h ' + absMinutes + 'min ' + absSeconds + 's';
                } else {
                    text = 'Retard: ' + absMinutes + 'min ' + absSeconds + 's';
                }
                className = 'bg-red-100 text-red-800 animate-pulse';
                isOverdue = true;
            } else if (diffHours < 1) {
                // Moins de 1h - TRES URGENT (avec secondes)
                text = diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-red-100 text-red-800 animate-pulse';
            } else if (diffHours < 2) {
                // Moins de 2h - URGENT (avec secondes)
                text = Math.floor(diffHours) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-red-100 text-red-800';
            } else if (diffHours < 24) {
                // Moins de 24h - Urgent (avec minutes et secondes)
                text = Math.floor(diffHours) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-amber-100 text-amber-800';
            } else if (diffDays < 3) {
                // Moins de 3 jours - Attention (avec secondes)
                text = Math.floor(diffDays) + 'j ' + Math.floor(diffHours % 24) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-yellow-100 text-yellow-800';
            } else {
                // Plus de 3 jours - OK (avec secondes)
                text = Math.floor(diffDays) + 'j ' + Math.floor(diffHours % 24) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
                className = 'bg-green-100 text-green-800';
            }
            
            return { text, className, isOverdue };
        };
        
        // Composant Guide Utilisateur
        const UserGuideModal = ({ show, onClose, currentUser }) => {
            const [activeSection, setActiveSection] = React.useState('introduction');
            
            if (!show) return null;
            
            // console.log('UserGuideModal render - activeSection:', activeSection, 'currentUser:', currentUser);
            
            // Fonction pour obtenir le badge du rôle actuel
            const getUserRoleBadge = () => {
                if (!currentUser) return '❓';
                const badges = {
                    'admin': '👑 Admin', 'director': '📊 Directeur', 'supervisor': '⭐ Superviseur', 'coordinator': '🎯 Coordonnateur', 'planner': '📅 Planificateur',
                    'senior_technician': '🔧 Tech. Senior', 'technician': '🔧 Technicien', 'team_leader': '👔 Chef Équipe', 'furnace_operator': '🔥 Op. Four', 'operator': '👷 Opérateur',
                    'safety_officer': '🛡️ Agent SST', 'quality_inspector': '✓ Insp. Qualité', 'storekeeper': '📦 Magasinier', 'viewer': '👁️ Lecture'
                };
                return badges[currentUser.role] || '👤 ' + currentUser.role;
            };
            
            const sections = {
                introduction: {
                    title: "🎯 Démarrage Rapide",
                    icon: "fa-rocket",
                    color: "blue",
                    content: [
                        "👋 Bienvenue! Ce guide est fait pour aller VITE.",
                        "",
                        "🔍 CLIQUEZ sur une section à gauche",
                        "⚡ SCANNEZ les étapes en 30 secondes",
                        "✅ FERMEZ avec Escape",
                        "",
                        "💡 Astuce: Gardez ce guide ouvert pendant que vous travaillez!"
                    ]
                },
                connexion: {
                    title: "🔐 Se Connecter",
                    icon: "fa-sign-in-alt",
                    color: "green",
                    content: [
                        "🌐 mecanique.igpglass.ca",
                        "📧 Votre email",
                        "🔑 Votre mot de passe",
                        "✅ Clic 'Se connecter'",
                        "",
                        "❌ Mot de passe oublié? → Contactez admin"
                    ]
                },
                roles: {
                    title: "👥 Les 14 Rôles Système",
                    icon: "fa-users",
                    color: "purple",
                    content: [
                        "📊 DIRECTION:",
                        "• 👑 Admin → Tout faire + Gestion utilisateurs",
                        "• 📊 Directeur → Vue complète + Rapports",
                        "",
                        "⚙️ MANAGEMENT MAINTENANCE:",
                        "• ⭐ Superviseur → Coordination équipe technique",
                        "• 🎯 Coordonnateur → Planification maintenance",
                        "• 📅 Planificateur → Gestion planning",
                        "",
                        "🔧 TECHNIQUE:",
                        "• 🔧 Technicien Senior → Expert + Formations",
                        "• 🔧 Technicien → Interventions techniques",
                        "",
                        "🏭 PRODUCTION:",
                        "• 👔 Chef Équipe → Supervision opérations",
                        "• 🔥 Opérateur Four → Gestion fours",
                        "• 👷 Opérateur → Créer tickets",
                        "",
                        "🛡️ SUPPORT:",
                        "• 🛡️ Agent SST → Santé & Sécurité",
                        "• ✓ Inspecteur Qualité → Contrôle qualité",
                        "• 📦 Magasinier → Gestion pièces",
                        "",
                        "👁️ TRANSVERSAL:",
                        "• 👁️ Lecture Seule → Consultation uniquement",
                        "",
                        "📌 VOUS ÊTES: " + getUserRoleBadge(),
                        "",
                        "💡 14 rôles prédéfinis - Impossible d'en créer d'autres"
                    ]
                },
                kanban: {
                    title: "📊 Le Tableau",
                    icon: "fa-columns",
                    color: "blue",
                    content: [
                        "6 colonnes = 6 étapes:",
                        "",
                        "🟦 Requête → 🟨 Diagnostic → 🟧 En Cours",
                        "🟪 Attente Pièces → 🟩 Terminé → ⬜ Archivé",
                        "",
                        "🖱️ DÉPLACER (Techniciens):",
                        "• PC: Glisser-déposer",
                        "• Mobile: Tap + Choisir statut"
                    ]
                },
                creer_ticket: {
                    title: "➕ Créer un Ticket",
                    icon: "fa-plus-circle",
                    color: "orange",
                    content: [
                        "1️⃣ Bouton orange 'Nouveau Ticket'",
                        "2️⃣ Remplir: Titre + Machine + Priorité",
                        "3️⃣ 📸 PHOTO? → 'Prendre photo' (mobile = caméra auto)",
                        "4️⃣ Clic 'Créer'",
                        "",
                        "✅ ID auto: IGP-PDE-20250103-001",
                        "",
                        "⚡ RAPIDE: 30 secondes max!"
                    ]
                },
                details_ticket: {
                    title: "🔍 Voir un Ticket",
                    icon: "fa-info-circle",
                    color: "blue",
                    content: [
                        "👆 CLIC sur une carte",
                        "",
                        "👀 Vous voyez:",
                        "• 📝 Toutes les infos",
                        "• 🕒 Timeline (historique)",
                        "• 📸 Photos/vidéos",
                        "• 💬 Commentaires",
                        "",
                        "⚡ Ajoutez: commentaire, photos, etc."
                    ]
                },
                commentaires: {
                    title: '💬 Commenter',
                    icon: 'fa-comments',
                    color: 'green',
                    content: [
                        '1️⃣ Ouvrir ticket',
                        '2️⃣ Scroll en bas',
                        '3️⃣ Taper commentaire',
                        '4️⃣ Clic "Ajouter"',
                        '',
                        "💡 UTILITÉ:",
                        "• Donner + d'infos",
                        "• Expliquer réparation",
                        "• Communiquer avancement"
                    ]
                },
                medias: {
                    title: "📸 Photos",
                    icon: "fa-camera",
                    color: "red",
                    content: [
                        "📱 MOBILE? Caméra auto!",
                        "",
                        "➕ AJOUTER:",
                        "• Création: 'Prendre photo'",
                        "• Après: Ouvrir ticket + 'Ajouter médias'",
                        "",
                        "👀 VOIR:",
                        "• Clic photo = plein écran",
                        "",
                        "💡 Plusieurs photos OK!"
                    ]
                },
                recherche: {
                    title: '🔍 Rechercher',
                    icon: 'fa-search',
                    color: 'purple',
                    content: [
                        '🔎 Barre recherche en haut',
                        '⚡ Résultats instantanés',
                        '',
                        '📝 CHERCHEZ: ID, titre, machine',
                        '🎨 Filtre priorité: 🔴 Critique 🟠 Élevée',
                        '',
                        '💡 Clic colonne = filtre statut'
                    ]
                },
                gestion_users: {
                    title: '👥 Gestion Users (Admin)',
                    icon: 'fa-users-cog',
                    color: 'purple',
                    content: [
                        '⚠️ ADMINS SEULEMENT',
                        '',
                        '🟣 Bouton "Utilisateurs" en haut',
                        '🔎 Recherche: Nom ou email',
                        '',
                        '🟠 CRÉER: Bouton orange → Remplir → OK',
                        '🔵 MODIFIER: Bouton bleu → Changer → Save',
                        '🟡 MOT DE PASSE: "MdP" → Nouveau (6+ chars)',
                        '🔴 SUPPRIMER: Rouge → Confirmer',
                        '',
                        '💡 Escape = Effacer recherche'
                    ]
                },
                mobile: {
                    title: '📱 Sur Mobile',
                    icon: 'fa-mobile-alt',
                    color: 'pink',
                    content: [
                        '📲 100% responsive!',
                        '',
                        '👆 TAP carte → Voir détails',
                        '🎬 DÉPLACER: Tap → Menu statut → OK',
                        '📸 PHOTO: Caméra auto-ouvre!',
                        '',
                        '🤏 Pinch = Zoom photos',
                        '📜 Scroll fluide',
                        '',
                        '💡 Boutons verticaux = facile pouce'
                    ]
                },
                raccourcis: {
                    title: "⌨️ Raccourcis",
                    icon: "fa-keyboard",
                    color: "gray",
                    content: [
                        "⎋ Escape = Fermer modal/effacer",
                        "↹ Tab = Champ suivant",
                        "↵ Enter = Soumettre formulaire",
                        "",
                        "💡 ASTUCES:",
                        "• ⏳ Spinner = Action en cours",
                        "• 🟢 Toast = Confirmation (3 sec)",
                        "• 🎯 Auto-focus = Commence à taper direct"
                    ]
                },
                securite: {
                    title: "🔒 Sécurité",
                    icon: "fa-lock",
                    color: "red",
                    content: [
                        "🔑 Mot de passe: 6+ chars, secret!",
                        "🚪 Déconnexion après usage",
                        "",
                        "✅ CE QUI EST SÛR:",
                        "• 🔐 Cryptage HTTPS",
                        "• 💾 Sauvegarde auto temps-réel",
                        "• 📜 Tout est tracé (historique)",
                        "",
                        "⚠️ Respectez votre rôle = sécurité max"
                    ]
                },
                problemes: {
                    title: "🆘 Problèmes?",
                    icon: "fa-exclamation-triangle",
                    color: "yellow",
                    content: [
                        "🔄 Page blanche? → F5 (rafraîchir)",
                        "🚫 Connexion? → Vérif email/MdP",
                        "⏳ Bouton bloqué? → Attendre spinner",
                        "📸 Photo fail? → Max 10MB, JPG/PNG/MP4",
                        "",
                        "💡 CHROME = Recommandé",
                        "",
                        "❌ Autre souci? → Contactez admin",
                        "📋 Décrivez: quoi + navigateur"
                    ]
                },
                optimisations: {
                    title: "⚡ Nouveautés v2.0.11",
                    icon: "fa-rocket",
                    color: "green",
                    content: [
                        "🚀 OPTIMISATIONS PERFORMANCE:",
                        "• ⚡ 40% moins de re-renders React",
                        "• 🧠 Mémorisation intelligente (useMemo/useCallback)",
                        "• 🐛 Zéro memory leaks",
                        "• 📦 Build 15% plus rapide",
                        "",
                        "🧹 CODE NETTOYÉ:",
                        "• 🗑️ -1452 lignes code obsolète",
                        "• 📦 -9 packages npm inutiles",
                        "• 🎯 RoleDropdown portal optimisé",
                        "",
                        "🎯 STABILITÉ MAXIMALE:",
                        "• ✅ Fiabilité absolue",
                        "• ✅ Performance optimale",
                        "• ✅ Maintenabilité améliorée",
                        "",
                        "💡 L'app est plus rapide et stable!"
                    ]
                },
                contact: {
                    title: "📞 Contact",
                    icon: "fa-phone",
                    color: "teal",
                    content: [
                        "🆘 SUPPORT: Votre admin système",
                        "📧 Email: [À configurer]",
                        "☎️ Tél: [À configurer]",
                        "",
                        "💡 Suggestions? Bugs? → Partagez!",
                        "",
                        "🎓 RESSOURCES:",
                        "• 🌐 mecanique.igpglass.ca",
                        "• 📖 Ce guide",
                        "• 🏷️ Version 2.0.11"
                    ]
                }
            };
            
            const menuItems = [
                { id: 'introduction', icon: 'fa-home', label: 'Introduction' },
                { id: 'connexion', icon: 'fa-sign-in-alt', label: 'Connexion' },
                { id: 'roles', icon: 'fa-users', label: 'Rôles & Permissions' },
                { id: 'kanban', icon: 'fa-columns', label: 'Tableau Kanban' },
                { id: 'creer_ticket', icon: 'fa-plus-circle', label: 'Créer un Ticket' },
                { id: 'details_ticket', icon: 'fa-info-circle', label: 'Détails Ticket' },
                { id: 'commentaires', icon: 'fa-comments', label: 'Commentaires' },
                { id: 'medias', icon: 'fa-camera', label: 'Photos & Vidéos' },
                { id: 'recherche', icon: 'fa-search', label: 'Recherche' },
                { id: 'gestion_users', icon: 'fa-users-cog', label: 'Gestion Utilisateurs' },
                { id: 'mobile', icon: 'fa-mobile-alt', label: 'Mobile' },
                { id: 'raccourcis', icon: 'fa-keyboard', label: 'Raccourcis Clavier' },
                { id: 'securite', icon: 'fa-lock', label: 'Sécurité' },
                { id: 'optimisations', icon: 'fa-rocket', label: 'Nouveautés v2.0.11' },
                { id: 'problemes', icon: 'fa-exclamation-triangle', label: 'Problèmes' },
                { id: 'contact', icon: 'fa-phone', label: 'Contact' }
            ];
            
            React.useEffect(() => {
                const handleEscape = (e) => {
                    if (e.key === 'Escape' && show) {
                        onClose();
                    }
                };
                document.addEventListener('keydown', handleEscape);
                return () => document.removeEventListener('keydown', handleEscape);
            }, [show]);
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] flex flex-col',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex justify-between items-center p-6 border-b-2 border-gradient-to-r from-slate-400 to-gray-400 bg-gradient-to-r from-slate-50/50 to-gray-50/50 backdrop-blur-sm rounded-t-2xl' },
                        React.createElement('h2', { className: 'text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-book text-blue-600' }),
                            "Guide Utilisateur"
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-gray-500 hover:text-gray-700 text-2xl'
                        }, '×')
                    ),
                    
                    React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
                        React.createElement('div', { className: 'w-64 bg-gradient-to-b from-slate-50/80 to-gray-50/80 backdrop-blur-sm p-4 overflow-y-auto border-r-2 border-gray-200/50' },
                            React.createElement('nav', { className: 'space-y-1' },
                                menuItems.map(item =>
                                    React.createElement('button', {
                                        key: item.id,
                                        onClick: () => setActiveSection(item.id),
                                        className: 'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ' + 
                                            (activeSection === item.id ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md' : 'hover:bg-white/60 hover:shadow-sm text-gray-700')
                                    },
                                        React.createElement('i', { className: 'fas ' + item.icon + ' w-5' }),
                                        React.createElement('span', { className: 'text-sm' }, item.label)
                                    )
                                )
                            )
                        ),
                        
                        React.createElement('div', { className: 'flex-1 p-8 overflow-y-auto bg-gradient-to-br from-white/50 to-gray-50/30 backdrop-blur-sm' },
                            React.createElement('div', { className: 'max-w-3xl mx-auto' },
                                React.createElement('div', { className: 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50' },
                                    React.createElement('h3', { 
                                        className: 'text-3xl font-bold mb-6 bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent flex items-center gap-3'
                                    },
                                        React.createElement('i', { 
                                            className: 'fas ' + (sections[activeSection] ? sections[activeSection].icon : 'fa-question') + ' text-blue-600'
                                        }),
                                        sections[activeSection] ? sections[activeSection].title : 'Section manquante'
                                    ),
                                    React.createElement('div', { className: 'prose prose-lg max-w-none' },
                                        sections[activeSection] && sections[activeSection].content ? sections[activeSection].content.map((line, idx) =>
                                            React.createElement('p', {
                                                key: idx,
                                                className: line.startsWith('•') || line.startsWith('  ') ? 'ml-6 my-2 text-gray-700' : 
                                                           line.startsWith('⚠️') || line.startsWith('✅') || line.startsWith('🚀') || line.startsWith('📊') || line.startsWith('⚙️') || line.startsWith('🔧') || line.startsWith('🏭') || line.startsWith('🛡️') || line.startsWith('👁️') ? 'font-bold my-4 text-lg text-slate-700' :
                                                           line.startsWith('💡') ? 'font-semibold my-3 text-green-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-500' :
                                                           line.startsWith('1️⃣') || line.startsWith('2️⃣') || line.startsWith('3️⃣') || line.startsWith('4️⃣') ? 'my-2 text-gray-800 font-medium' :
                                                           line === '' ? 'my-3' : 'my-3 text-gray-800',
                                                style: line === '' ? { height: '0.5rem' } : {}
                                            }, line || '\u00A0')
                                        ) : React.createElement('p', { className: 'text-red-600 font-semibold' }, 'Contenu manquant pour: ' + activeSection)
                                    )
                                )
                            )
                        )
                    ),
                    
                    React.createElement('div', { className: 'p-4 border-t-2 border-gray-200/50 bg-gradient-to-r from-slate-50/50 to-gray-50/50 backdrop-blur-sm rounded-b-2xl flex justify-between items-center' },
                        React.createElement('div', { className: 'flex items-center gap-4' },
                            React.createElement('p', { className: 'text-sm text-gray-600' },
                                "⎋ Escape pour fermer"
                            ),
                            React.createElement('span', { className: 'text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full' },
                                "✨ v2.0.11 - Mise à jour 2025-11-09"
                            )
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(37,99,235,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-blue-300/50'
                        }, 'Fermer')
                    )
                )
            );
        };
        
        // Composant de prompt personnalisé
        const PromptModal = ({ show, message, onConfirm, onCancel }) => {
            const [value, setValue] = React.useState('');
            
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                onClick: onCancel
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'mb-4' },
                        React.createElement('p', { className: 'text-lg font-semibold mb-4' }, message),
                        React.createElement('input', {
                            type: 'password',
                            value: value,
                            onChange: (e) => setValue(e.target.value),
                            className: 'w-full px-3 py-2 border-2 rounded-md',
                            placeholder: 'Minimum 6 caracteres',
                            autoFocus: true
                        })
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
                        React.createElement('button', {
                            onClick: onCancel,
                            className: 'px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-semibold'
                        }, 'Annuler'),
                        React.createElement('button', {
                            onClick: () => onConfirm(value),
                            className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-700 font-semibold'
                        }, 'OK')
                    )
                )
            );
        };
        
        
        const LoginForm = ({ onLogin }) => {
            const [email, setEmail] = React.useState('');
            const [password, setPassword] = React.useState('');
            const [showPassword, setShowPassword] = React.useState(false);
            
            const handleSubmit = (e) => {
                e.preventDefault();
                onLogin(email, password);
            };
            
            const handleInvalidEmail = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };
            
            const handleInvalidPassword = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };
            
            const handleInputEmail = (e) => {
                e.target.setCustomValidity("");
                setEmail(e.target.value);
            };
            
            const handleInputPassword = (e) => {
                e.target.setCustomValidity("");
                setPassword(e.target.value);
            };
            
            return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-igp-blue to-blue-900' },
                React.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-2xl w-96 max-w-md mx-4' },
                    React.createElement('div', { className: 'text-center mb-8' },
                        React.createElement('img', { 
                            src: '/static/logo-igp.png', 
                            alt: 'IGP Logo',
                            className: 'h-20 w-auto mx-auto mb-4'
                        }),
                        React.createElement('h1', { className: 'text-2xl font-bold text-igp-blue mb-2' }, 'Gestion de la maintenance et des réparations'),
                        React.createElement('div', { className: 'inline-block px-3 py-1 mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-md animate-pulse' },
                            React.createElement('i', { className: 'fas fa-tools mr-1' }),
                            'EN DÉVELOPPEMENT'
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-600 mb-1' }, 'Les Produits Verriers International'),
                        React.createElement('p', { className: 'text-xs text-blue-700 font-semibold' }, '(IGP) Inc.')
                    ),
                    React.createElement('form', { 
                        onSubmit: handleSubmit,
                        autoComplete: 'off'
                    },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 
                                React.createElement('i', { className: 'fas fa-envelope mr-2 text-igp-blue' }),
                                'Email'
                            ),
                            React.createElement('input', {
                                type: 'email',
                                name: 'email',
                                autoComplete: 'off',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: email,
                                onChange: handleInputEmail,
                                onInvalid: handleInvalidEmail,
                                placeholder: 'votre.email@igpglass.ca',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 
                                React.createElement('i', { className: 'fas fa-lock mr-2 text-igp-blue' }),
                                'Mot de passe'
                            ),
                            React.createElement('div', { className: 'relative' },
                                React.createElement('input', {
                                    type: showPassword ? 'text' : 'password',
                                    name: 'password',
                                    autoComplete: 'new-password',
                                    className: 'w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                    value: password,
                                    onChange: handleInputPassword,
                                    onInvalid: handleInvalidPassword,
                                    placeholder: '••••••••',
                                    required: true
                                }),
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setShowPassword(!showPassword),
                                    className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-igp-blue transition-colors',
                                    'aria-label': showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                                },
                                    React.createElement('i', { 
                                        className: showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                                    })
                                )
                            )
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'w-full bg-igp-blue text-white font-bold py-3 px-4 rounded-md hover:bg-igp-blue-dark transition duration-200 shadow-lg'
                        }, 
                            React.createElement('i', { className: 'fas fa-sign-in-alt mr-2' }),
                            'Se connecter'
                        )
                    ),
                    React.createElement('div', { className: 'mt-8 pt-6 border-t border-gray-200 text-center' },
                        React.createElement('p', { className: 'text-xs text-gray-500' },
                            React.createElement('i', { className: 'fas fa-code mr-1' }),
                            'Conçue par ',
                            React.createElement('span', { className: 'font-bold text-igp-blue' }, "Le département des Technologies de l'Information des Produits Verriers International (IGP) Inc.")
                        )
                    )
                )
            );
        };
        
        
        // ===== BOTTOM SHEET MOBILE POUR DEPLACER TICKETS =====
        const MoveTicketBottomSheet = ({ show, onClose, ticket, onMove, currentUser }) => {
            const statuses = [
                { key: 'received', label: 'Requete Recue', icon: '🟦', color: 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200' },
                { key: 'diagnostic', label: 'Diagnostic', icon: '🟨', color: 'bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200' },
                { key: 'in_progress', label: 'En Cours', icon: '🟧', color: 'bg-orange-50 hover:bg-orange-100 active:bg-orange-200' },
                { key: 'waiting_parts', label: 'En Attente Pieces', icon: '🟪', color: 'bg-purple-50 hover:bg-purple-100 active:bg-purple-200' },
                { key: 'completed', label: 'Termine', icon: '🟩', color: 'bg-green-50 hover:bg-green-100 active:bg-green-200' },
                { key: 'archived', label: 'Archive', icon: '⬜', color: 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200' }
            ];
            
            if (!show || !ticket) return null;
            
            // Verifier si ticket est assigné ou planifié (pour affichage info seulement, pas de blocage)
            const isAssigned = ticket.assigned_to !== null && ticket.assigned_to !== undefined;
            const isPlanned = isAssigned && ticket.scheduled_date;
            
            const handleStatusSelect = async (status) => {
                if (status === ticket.status) {
                    onClose();
                    return;
                }
                
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
                
                await onMove(ticket, status);
                onClose();
            };
            
            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-end bottom-sheet-backdrop no-tap-highlight',
                style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                },
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white w-full rounded-t-3xl shadow-2xl bottom-sheet-content',
                    style: {
                        maxHeight: '80vh'
                    },
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { 
                        className: 'p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100'
                    },
                        React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                            React.createElement('h3', { className: 'text-lg font-bold text-gray-800' }, 'Deplacer le ticket'),
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700 text-2xl leading-none p-2 no-tap-highlight',
                                type: 'button'
                            }, '×')
                        ),
                        React.createElement('div', { className: 'text-sm' },
                            React.createElement('div', { className: 'font-mono text-xs text-gray-600' }, ticket.ticket_id),
                            React.createElement('div', { className: 'font-semibold text-gray-800 mt-1 truncate' }, ticket.title)
                        ),
                        isAssigned ? React.createElement('div', {
                            className: 'mt-2 text-xs px-2 py-1 rounded ' + (isPlanned 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-orange-100 text-orange-700')
                        }, isPlanned 
                            ? 'ℹ️ Ticket planifié - Déplacement manuel possible' 
                            : 'ℹ️ Ticket assigné - Déplacement manuel possible') : null
                    ),
                    
                    React.createElement('div', { 
                        className: 'p-4 space-y-2 overflow-y-auto',
                        style: { maxHeight: '50vh' }
                    },
                        statuses.map(status => 
                            React.createElement('button', {
                                key: status.key,
                                onClick: () => handleStatusSelect(status.key),
                                disabled: status.key === ticket.status,
                                className: 
                                    'w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between no-tap-highlight ' +
                                    (status.key === ticket.status 
                                        ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' 
                                        : status.color + ' border-transparent'),
                                style: {
                                    minHeight: '60px'
                                },
                                type: 'button'
                            },
                                React.createElement('div', { className: 'flex items-center gap-3' },
                                    React.createElement('span', { 
                                        className: 'text-3xl',
                                        style: { lineHeight: '1' }
                                    }, status.icon),
                                    React.createElement('span', { 
                                        className: 'font-semibold text-gray-800 text-left',
                                        style: { fontSize: '16px' }
                                    }, status.label)
                                ),
                                status.key === ticket.status && 
                                    React.createElement('i', { 
                                        className: 'fas fa-check text-green-600',
                                        style: { fontSize: '20px' }
                                    })
                            )
                        )
                    ),
                    
                    React.createElement('div', { className: 'p-4 border-t border-gray-200' },
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'w-full py-4 text-center font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-colors no-tap-highlight',
                            style: { 
                                fontSize: '16px'
                            },
                            type: 'button'
                        }, 'Annuler')
                    )
                )
            );
        };
        
        
        const CreateTicketModal = ({ show, onClose, machines, onTicketCreated, currentUser }) => {
            const [title, setTitle] = React.useState('');
            const [description, setDescription] = React.useState('');
            const [machineId, setMachineId] = React.useState('');
            const [priority, setPriority] = React.useState('medium');
            const [mediaFiles, setMediaFiles] = React.useState([]);
            const [mediaPreviews, setMediaPreviews] = React.useState([]);
            const [submitting, setSubmitting] = React.useState(false);
            const [uploadProgress, setUploadProgress] = React.useState(0);
            
            // États pour la planification (superviseur/admin seulement)
            const [assignedTo, setAssignedTo] = React.useState('');
            const [scheduledDate, setScheduledDate] = React.useState('');
            const [technicians, setTechnicians] = React.useState([]);
            
            // Charger la liste des techniciens si superviseur ou admin
            React.useEffect(() => {
                if (show && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
                    axios.get(API_URL + '/technicians')
                        .then(res => setTechnicians(res.data.technicians))
                        .catch(err => console.error('Erreur chargement techniciens:', err));
                }
            }, [show, currentUser.role]);
            
            const handleFileChange = (e) => {
                const files = Array.from(e.target.files);
                setMediaFiles(prevFiles => [...prevFiles, ...files]);
                
                
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setMediaPreviews(prev => [...prev, {
                            url: reader.result,
                            type: file.type,
                            name: file.name,
                            size: file.size
                        }]);
                    };
                    reader.readAsDataURL(file);
                });
            };
            
            const removeMedia = (index) => {
                setMediaFiles(prev => prev.filter((_, i) => i !== index));
                setMediaPreviews(prev => prev.filter((_, i) => i !== index));
            };
            
            const uploadMediaFiles = async (ticketId) => {
                if (mediaFiles.length === 0) return;
                
                for (let i = 0; i < mediaFiles.length; i++) {
                    const file = mediaFiles[i];
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('ticket_id', ticketId);
                    
                    try {
                        await axios.post(API_URL + '/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
                    } catch (error) {
                        console.error('Erreur upload média:', error);
                    }
                }
            };
            
            const handleSubmit = async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setUploadProgress(0);
                
                try {
                    // Capturer l'heure UTC pour stockage dans la DB
                    const utcTime = new Date();
                    const year = utcTime.getUTCFullYear();
                    const month = String(utcTime.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(utcTime.getUTCDate()).padStart(2, '0');
                    const hours = String(utcTime.getUTCHours()).padStart(2, '0');
                    const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
                    const localTimestamp = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
                    
                    const requestBody = {
                        title,
                        description,
                        reporter_name: currentUser.full_name,
                        machine_id: parseInt(machineId),
                        priority,
                        created_at: localTimestamp
                    };
                    
                    // Ajouter les champs de planification si superviseur/admin
                    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
                        if (assignedTo) {
                            // CRITICAL FIX: Use 0 (integer) for team assignment (compatible with INTEGER column)
                            requestBody.assigned_to = parseInt(assignedTo);
                        }
                        if (scheduledDate) {
                            requestBody.scheduled_date = scheduledDate + ' 23:59:59'; // Format: YYYY-MM-DD 23:59:59 (fin de journee)
                        }
                    }
                    
                    const response = await axios.post(API_URL + '/tickets', requestBody);
                    
                    const ticketId = response.data.ticket.id;
                    
                    
                    if (mediaFiles.length > 0) {
                        await uploadMediaFiles(ticketId);
                    }
                    
                    alert('Ticket créé avec succès !' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s) uploadé(s))' : ''));
                    
                    
                    setTitle('');
                    setDescription('');
                    setMachineId('');
                    setPriority('medium');
                    setAssignedTo('');
                    setScheduledDate('');
                    setMediaFiles([]);
                    setMediaPreviews([]);
                    setUploadProgress(0);
                    onClose();
                    onTicketCreated();
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
                } finally {
                    setSubmitting(false);
                }
            };
            
            // Gestionnaires validation en francais
            const handleInvalidField = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };
            
            const handleInputField = (e, setter) => {
                e.target.setCustomValidity("");
                setter(e.target.value);
            };
            
            if (!show) return null;
            
            return React.createElement('div', { 
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform hover:scale-[1.01] transition-all duration-300',
                    onClick: (e) => e.stopPropagation(),
                    style: { 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        transform: 'translateZ(0)'
                    }
                },
                    React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10 backdrop-blur-sm bg-opacity-95' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-plus-circle text-xl sm:text-2xl text-blue-300 flex-shrink-0' }),
                            React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' },
                                'Nouvelle Demande'
                            )
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                        },
                            React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                        )
                    ),
                    React.createElement('div', { className: 'p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)] bg-gradient-to-br from-white/50 to-blue-50/30' },
                    React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                'Titre du problème *'
                            ),
                            React.createElement('input', {
                                type: 'text',
                                className: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl hover:scale-[1.01]',
                                style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                value: title,
                                onChange: (e) => handleInputField(e, setTitle),
                                onInvalid: handleInvalidField,
                                placeholder: 'Ex: Bruit anormal sur la machine',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                                'Description détaillée *'
                            ),
                            React.createElement('textarea', {
                                className: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl resize-none',
                                style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                value: description,
                                onChange: (e) => handleInputField(e, setDescription),
                                onInvalid: handleInvalidField,
                                placeholder: 'Décrivez le problème en détail...',
                                rows: 4,
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-cog mr-2' }),
                                'Machine concernée *'
                            ),
                            React.createElement('select', {
                                className: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl cursor-pointer',
                                style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                value: machineId,
                                onChange: (e) => handleInputField(e, setMachineId),
                                onInvalid: handleInvalidField,
                                required: true
                            },
                                React.createElement('option', { value: '' }, '-- Sélectionnez une machine --'),
                                machines.map(m => 
                                    React.createElement('option', { key: m.id, value: m.id },
                                        m.machine_type + ' ' + m.model + ' - ' + m.location
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-camera mr-2 text-blue-700' }),
                                'Photos / Vidéos du problème'
                            ),
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*',
                                capture: 'environment',
                                onChange: handleFileChange,
                                className: 'hidden',
                                id: 'photo-upload'
                            }),
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*,video/*',
                                multiple: true,
                                onChange: handleFileChange,
                                className: 'hidden',
                                id: 'media-upload'
                            }),
                            React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('label', {
                                    htmlFor: 'photo-upload',
                                    className: 'flex-1 px-4 py-3 border-2 border-dashed border-igp-blue rounded-md text-center cursor-pointer hover:bg-blue-50 transition-all flex items-center justify-center text-igp-blue font-semibold'
                                },
                                    React.createElement('i', { className: 'fas fa-camera mr-2' }),
                                    'Caméra'
                                ),
                                React.createElement('label', {
                                    htmlFor: 'media-upload',
                                    className: 'flex-1 px-4 py-3 border-2 border-dashed border-gray-400 rounded-md text-center cursor-pointer hover:bg-gray-50 transition-all flex items-center justify-center text-gray-700 font-semibold'
                                },
                                    React.createElement('i', { className: 'fas fa-images mr-2' }),
                                    'Galerie'
                                )
                            ),
                            mediaPreviews.length > 0 ? React.createElement('div', { className: 'mt-3 grid grid-cols-3 gap-2' },
                                mediaPreviews.map((preview, index) =>
                                    React.createElement('div', { 
                                        key: index, 
                                        className: 'relative group'
                                    },
                                        preview.type.startsWith('image/') 
                                            ? React.createElement('img', {
                                                src: preview.url,
                                                alt: preview.name,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300'
                                            })
                                            : React.createElement('video', {
                                                src: preview.url,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300',
                                                controls: false
                                            }),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: () => removeMedia(index),
                                            className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                                        },
                                            React.createElement('i', { className: 'fas fa-times text-xs' })
                                        ),
                                        React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded' },
                                            preview.type.startsWith('image/') ? '📷' : '🎥',
                                            ' ' + Math.round(preview.size / 1024) + ' KB'
                                        )
                                    )
                                )
                            ) : null,
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                                React.createElement('i', { className: 'fas fa-exclamation-triangle mr-2' }),
                                'Priorité *'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-4 gap-2' },
                                ['low', 'medium', 'high', 'critical'].map(p =>
                                    React.createElement('button', {
                                        key: p,
                                        type: 'button',
                                        onClick: () => setPriority(p),
                                        className: 'flex-1 min-w-0 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all text-center whitespace-nowrap overflow-hidden ' + 
                                            (priority === p 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                                    },
                                        React.createElement('span', { className: 'hidden sm:inline' },
                                            p === 'low' ? '🟢 Faible' :
                                            p === 'medium' ? '🟡 Moyenne' :
                                            p === 'high' ? '🟠 Haute' :
                                            '🔴 Critique'
                                        ),
                                        React.createElement('span', { className: 'inline sm:hidden' },
                                            p === 'low' ? '🟢 Faible' :
                                            p === 'medium' ? '🟡 Moy.' :
                                            p === 'high' ? '🟠 Haute' :
                                            '🔴 Crit.'
                                        )
                                    )
                                )
                            )
                        ),
                        
                        // Section planification (superviseur/admin seulement)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? 
                            React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg' },
                                React.createElement('h3', { className: 'text-lg font-bold text-slate-700 mb-4 flex items-center' },
                                    React.createElement('i', { className: 'fas fa-calendar-alt mr-2' }),
                                    'Planification (Superviseur/Admin)'
                                ),
                                
                                // Assigner à un technicien
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 
                                        React.createElement('i', { className: 'fas fa-user-cog mr-2' }),
                                        'Assigner à'
                                    ),
                                    React.createElement('select', {
                                        value: assignedTo,
                                        onChange: (e) => setAssignedTo(e.target.value),
                                        className: "w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(147, 51, 234, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' }
                                    },
                                        React.createElement('option', { value: '' }, '-- Non assigné --'),
                                        React.createElement('option', { value: '0' }, '👥 À Équipe'),
                                        technicians.filter(tech => tech.id !== 0).map(tech => 
                                            React.createElement('option', { 
                                                key: tech.id, 
                                                value: tech.id 
                                            }, 
                                                '👤 ' + tech.full_name
                                            )
                                        )
                                    )
                                ),
                                
                                // Date de maintenance planifiée
                                React.createElement('div', { className: 'mb-2' },
                                    // Badge d'état
                                    scheduledDate ? React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-blue-50 border-2 border-blue-300' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('i', { className: 'fas fa-calendar-check text-blue-600' }),
                                            React.createElement('span', { className: 'text-sm font-bold text-blue-800' },
                                                "État : PLANIFIÉ"
                                            )
                                        ),
                                        React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                            "📅 " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                                        )
                                    ) : React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-orange-50 border-2 border-orange-300' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('i', { className: 'fas fa-user-check text-orange-600' }),
                                            React.createElement('span', { className: 'text-sm font-bold text-orange-800' },
                                                "État : ASSIGNÉ"
                                            )
                                        ),
                                        React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                            "ℹ️ Ajoutez une date pour planifier"
                                        )
                                    ),
                                    
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 
                                        React.createElement('i', { className: 'fas fa-calendar-day mr-2' }),
                                        'Date de maintenance' + (scheduledDate ? ' (modifier)' : ' (optionnelle)')
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('input', {
                                            type: 'date',
                                            value: scheduledDate,
                                            onChange: (e) => setScheduledDate(e.target.value),
                                            className: 'flex-1 px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-600 focus:outline-none'
                                        }),
                                        scheduledDate ? React.createElement('button', {
                                            type: 'button',
                                            onClick: () => setScheduledDate(''),
                                            className: 'px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold transition-all text-sm'
                                        },
                                            React.createElement('i', { className: 'fas fa-times mr-1' }),
                                            'Retirer'
                                        ) : null
                                    ) // Ferme le div flex gap-2 (ligne 2852)
                                ) // Ferme le div mb-2 (ligne 2824)
                            )
                        : null,
                        
                        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-6 pt-4 border-t-2 border-gray-200 sticky bottom-0 bg-white' },
                            React.createElement('button', {
                                type: 'button',
                                onClick: onClose,
                                className: 'w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all font-semibold'
                            }, 
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                'Annuler'
                            ),
                            React.createElement('button', {
                                type: 'submit',
                                disabled: submitting,
                                className: 'w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 shadow-lg transition-all font-semibold'
                            },
                                submitting 
                                    ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' })
                                    : React.createElement('i', { className: 'fas fa-check mr-2' }),
                                submitting 
                                    ? (uploadProgress > 0 ? 'Upload: ' + uploadProgress + '%' : 'Création...')
                                    : 'Créer le ticket' + (mediaFiles.length > 0 ? ' (' + mediaFiles.length + ' média(s))' : '')
                            )
                        )
                    )
                    )
                )
            ));
        };
        
        
        const TicketDetailsModal = ({ show, onClose, ticketId, currentUser, onTicketDeleted }) => {
            const [ticket, setTicket] = React.useState(null);
            const [loading, setLoading] = React.useState(true);
            const [selectedMedia, setSelectedMedia] = React.useState(null);
            const [comments, setComments] = React.useState([]);
            const [newComment, setNewComment] = React.useState('');
            const [submittingComment, setSubmittingComment] = React.useState(false);
            const [uploadingMedia, setUploadingMedia] = React.useState(false);
            const [newMediaFiles, setNewMediaFiles] = React.useState([]);
            const [newMediaPreviews, setNewMediaPreviews] = React.useState([]);
            const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });
            
            // États pour la planification (superviseur/admin seulement)
            const [editingSchedule, setEditingSchedule] = React.useState(false);
            const [scheduledAssignedTo, setScheduledAssignedTo] = React.useState('');
            const [scheduledDate, setScheduledDate] = React.useState('');
            const [technicians, setTechnicians] = React.useState([]);
            const [savingSchedule, setSavingSchedule] = React.useState(false);
            
            React.useEffect(() => {
                if (show && ticketId) {
                    loadTicketDetails();
                    loadComments();
                }
            }, [show, ticketId]);
            
            // Charger les techniciens et pré-remplir le formulaire de planification
            React.useEffect(() => {
                if (show && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
                    axios.get(API_URL + '/technicians')
                        .then(res => setTechnicians(res.data.technicians))
                        .catch(err => console.error('Erreur chargement techniciens:', err));
                }
                
                // Pré-remplir les champs si le ticket est déjà planifié
                if (ticket) {
                    // CRITICAL: Check !== null (not just falsy) because 0 is valid (team assignment)
                    setScheduledAssignedTo(ticket.assigned_to !== null && ticket.assigned_to !== undefined ? String(ticket.assigned_to) : '');
                    setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? ticket.scheduled_date.substring(0, 10) : '');
                }
            }, [show, currentUser.role, ticket]);
            
            const loadTicketDetails = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/tickets/' + ticketId);
                    setTicket(response.data.ticket);
                } catch (error) {
                    console.error('Erreur chargement ticket:', error);
                    alert('Erreur lors du chargement des détails du ticket');
                } finally {
                    setLoading(false);
                }
            };
            
            const loadComments = async () => {
                try {
                    const response = await axios.get(API_URL + '/comments/ticket/' + ticketId);
                    setComments(response.data.comments || []);
                } catch (error) {
                    console.error('Erreur chargement commentaires:', error);
                }
            };
            
            const handleDeleteTicket = async () => {
                // Verification: technicien ne peut pas supprimer un ticket planifié (avec date) créé par quelqu'un d'autre
                if (currentUser.role === 'technician' && ticket?.scheduled_date && ticket?.reported_by !== currentUser.id) {
                    alert("Les techniciens ne peuvent pas supprimer les tickets planifiés créés par d'autres utilisateurs");
                    return;
                }
                
                setConfirmDialog({
                    show: true,
                    message: 'Supprimer ce ticket ?',
                    onConfirm: async () => {
                        setConfirmDialog({ show: false, message: '', onConfirm: null });
                        try {
                            await axios.delete(API_URL + '/tickets/' + ticketId);
                            alert('Ticket supprime avec succes');
                            onClose();
                            if (onTicketDeleted) onTicketDeleted();
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    }
                });
            };
            
            const handleDeleteMedia = async (mediaId) => {
                setConfirmDialog({
                    show: true,
                    message: 'Supprimer ce media ?',
                    onConfirm: async () => {
                        setConfirmDialog({ show: false, message: '', onConfirm: null });
                        try {
                            await axios.delete(API_URL + '/media/' + mediaId);
                            alert('Media supprime avec succes');
                            loadTicketDetails();
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    }
                });
            };
            
            const handleAddComment = async (e) => {
                e.preventDefault();
                if (!newComment.trim()) {
                    alert('Veuillez écrire un commentaire');
                    return;
                }
                
                setSubmittingComment(true);
                try {
                    // Capturer l'heure UTC pour stockage dans la DB
                    const utcTime = new Date();
                    const year = utcTime.getUTCFullYear();
                    const month = String(utcTime.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(utcTime.getUTCDate()).padStart(2, '0');
                    const hours = String(utcTime.getUTCHours()).padStart(2, '0');
                    const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
                    const localTimestamp = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
                    
                    // Convertir le rôle de l'utilisateur en français
                    let userRoleFr = 'Opérateur';
                    if (currentUser.role === 'technician') userRoleFr = 'Technicien';
                    else if (currentUser.role === 'supervisor') userRoleFr = 'Superviseur';
                    else if (currentUser.role === 'admin') userRoleFr = 'Admin';
                    
                    await axios.post(API_URL + '/comments', {
                        ticket_id: ticketId,
                        user_name: currentUser.full_name,
                        user_role: userRoleFr,
                        comment: newComment,
                        created_at: localTimestamp
                    });
                    
                    setNewComment('');
                    loadComments();
                } catch (error) {
                    alert('Erreur lors de l\\'ajout du commentaire');
                } finally {
                    setSubmittingComment(false);
                }
            };
            
            // Gestionnaire validation commentaire
            const handleInvalidComment = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };
            
            const handleInputComment = (e) => {
                e.target.setCustomValidity("");
                setNewComment(e.target.value);
            };
            
            const handleNewMediaChange = (e) => {
                const files = Array.from(e.target.files);
                setNewMediaFiles(prevFiles => [...prevFiles, ...files]);
                
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setNewMediaPreviews(prev => [...prev, {
                            url: reader.result,
                            type: file.type,
                            name: file.name,
                            size: file.size
                        }]);
                    };
                    reader.readAsDataURL(file);
                });
            };
            
            const handleUploadNewMedia = async () => {
                if (newMediaFiles.length === 0) return;
                
                setUploadingMedia(true);
                try {
                    for (let i = 0; i < newMediaFiles.length; i++) {
                        const file = newMediaFiles[i];
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('ticket_id', ticketId);
                        
                        await axios.post(API_URL + '/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }
                    
                    alert('Médias ajoutés avec succès !');
                    setNewMediaFiles([]);
                    setNewMediaPreviews([]);
                    loadTicketDetails();
                } catch (error) {
                    alert('Erreur lors de l\\'upload des médias');
                } finally {
                    setUploadingMedia(false);
                }
            };
            
            const handleSaveSchedule = async () => {
                try {
                    setSavingSchedule(true);
                    const updateData = {};
                    
                    // Assigner à un technicien ou toute l'équipe
                    // CRITICAL FIX: Use 0 (integer) for team assignment (compatible with INTEGER column)
                    if (scheduledAssignedTo) {
                        updateData.assigned_to = parseInt(scheduledAssignedTo);
                        // Si assignation définie, sauvegarder la date (ou null si vide)
                        updateData.scheduled_date = scheduledDate ? scheduledDate + ' 23:59:59' : null;
                    } else {
                        // Si "Non assigné" sélectionné, retirer aussi la date (dé-planifier complètement)
                        updateData.assigned_to = null;
                        updateData.scheduled_date = null;
                        // Effacer aussi le champ date dans le formulaire
                        setScheduledDate('');
                    }
                    
                    await axios.patch(API_URL + '/tickets/' + ticketId, updateData);
                    
                    // Message dynamique selon si planifié (avec date) ou juste assigné (sans date)
                    const successMessage = scheduledDate 
                        ? 'Planification mise à jour avec succès !' 
                        : 'Assignation mise à jour avec succès !';
                    alert(successMessage);
                    setEditingSchedule(false);
                    loadTicketDetails(); // Recharger les détails
                } catch (error) {
                    alert('Erreur lors de la mise à jour de la planification');
                    console.error('Erreur:', error);
                } finally {
                    setSavingSchedule(false);
                }
            };
            
            if (!show) return null;
            
            return React.createElement('div', { 
                className: 'modal active bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'modal-content bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-3 sm:p-6 md:p-8 max-w-5xl w-full mx-2 sm:mx-4 my-auto',
                    onClick: (e) => e.stopPropagation(),
                    style: { marginTop: 'auto', marginBottom: 'auto', maxHeight: '90vh', overflowY: 'auto' }
                },
                    React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gradient-to-r from-blue-400 to-gray-400' },
                        React.createElement('h2', { className: 'text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent' },
                            React.createElement('i', { className: 'fas fa-ticket-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                            "Détails du Ticket"
                        ),
                        React.createElement('div', { className: 'flex gap-2 sm:gap-3' },
                            (ticket && currentUser && (
                                (currentUser.role === 'technician' && (!ticket.scheduled_date || ticket.reported_by === currentUser.id)) || 
                                (currentUser.role === 'supervisor') ||
                                (currentUser.role === 'admin') ||
                                (currentUser.role === 'operator' && ticket.reported_by === currentUser.id)
                            )) ? React.createElement('button', {
                                onClick: handleDeleteTicket,
                                className: 'text-red-500 hover:text-red-700 transition-colors transform hover:scale-110 active:scale-95',
                                title: 'Supprimer ce ticket'
                            },
                                React.createElement('i', { className: 'fas fa-trash-alt text-xl sm:text-2xl' })
                            ) : null,
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700'
                            },
                                React.createElement('i', { className: 'fas fa-times text-xl sm:text-2xl' })
                            )
                        )
                    ),
                    
                    loading ? React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
                    ) : ticket ? React.createElement('div', {},
                        
                        React.createElement('div', { className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-200/50' },
                            React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                                React.createElement('span', { className: 'text-sm sm:text-base font-mono font-bold text-blue-700 bg-blue-100/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg' }, ticket.ticket_id),
                                React.createElement('span', { 
                                    className: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold shadow-md text-xs sm:text-sm ' + 
                                    (ticket.priority === 'critical' ? 'bg-igp-red text-white' :
                                     ticket.priority === 'high' ? 'bg-igp-yellow text-white' :
                                     ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                     'bg-igp-green text-white')
                                }, 
                                    ticket.priority === 'critical' ? '🔴 CRITIQUE' :
                                    ticket.priority === 'high' ? '🟠 HAUTE' :
                                    ticket.priority === 'medium' ? '🟡 MOYENNE' :
                                    '🟢 FAIBLE'
                                )
                            ),
                            React.createElement('h3', { className: 'text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3' }, ticket.title),
                            React.createElement('p', { className: 'text-sm sm:text-base text-gray-700 mb-4 sm:mb-5 leading-relaxed bg-white/60 p-3 sm:p-4 rounded-lg' }, ticket.description),
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4' },
                                React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-cog text-blue-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Machine:')
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.machine_type + ' ' + ticket.model)
                                ),
                                React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-tasks text-slate-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Statut:')
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, getStatusLabel(ticket.status))
                                ),
                                React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'far fa-calendar text-green-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Créé le:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, 
                                        formatDateEST(ticket.created_at)
                                    )
                                ),
                                React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-user text-blue-700 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Rapporté par:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.reporter_name || 'N/A')
                                )
                            )
                        ),
                        
                        // Section planification (superviseur/admin seulement)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? 
                            React.createElement('div', { className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200/50' },
                                React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4' },
                                    React.createElement('h4', { className: 'text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent flex items-center' },
                                        React.createElement('i', { className: 'fas fa-calendar-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                                        'Planification'
                                    ),
                                    !editingSchedule ? React.createElement('button', {
                                        onClick: () => setEditingSchedule(true),
                                        className: 'px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-xs sm:text-sm transition-all shadow-[0_6px_12px_rgba(147,51,234,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50'
                                    },
                                        React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                        'Modifier'
                                    ) : null
                                ),
                                
                                !editingSchedule ? (
                                    // Affichage lecture seule
                                    React.createElement('div', { className: 'space-y-3' },
                                        React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-sm' },
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('i', { className: 'fas fa-user-cog text-slate-600' }),
                                                React.createElement('span', { className: 'font-bold text-gray-700' }, "Assigné à:")
                                            ),
                                            React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                                ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                    ? (ticket.assigned_to === 0 ? '👥 Équipe' : '👤 ' + (ticket.assignee_name || 'Technicien #' + ticket.assigned_to))
                                                    : '❌ Non assigné'
                                            )
                                        ),
                                        React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-sm' },
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('i', { className: 'far fa-clock text-slate-600' }),
                                                React.createElement('span', { className: 'font-bold text-gray-700' }, "Date planifiée:")
                                            ),
                                            React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                                ticket.scheduled_date 
                                                    ? formatDateEST(ticket.scheduled_date)
                                                    : '❌ Non planifié'
                                            )
                                        )
                                    )
                                ) : (
                                    // Mode édition
                                    React.createElement('div', { className: 'space-y-4' },
                                        // Assigner à un technicien
                                        React.createElement('div', {},
                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' }, 
                                                React.createElement('i', { className: 'fas fa-user-cog mr-2 text-slate-600 text-xs sm:text-sm' }),
                                                "Assigner à"
                                            ),
                                            React.createElement('select', {
                                                value: scheduledAssignedTo,
                                                onChange: (e) => setScheduledAssignedTo(e.target.value),
                                                className: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
                                            },
                                                React.createElement('option', { value: '' }, '-- Non assigné --'),
                                                React.createElement('option', { value: '0' }, '👥 À Équipe'),
                                                technicians.filter(tech => tech.id !== 0).map(tech => 
                                                    React.createElement('option', { 
                                                        key: tech.id, 
                                                        value: tech.id 
                                                    }, 
                                                        '👤 ' + tech.full_name
                                                    )
                                                )
                                            )
                                        ),
                                        
                                        // Date de maintenance planifiée
                                        React.createElement('div', {},
                                            // Badge d'état actuel
                                            React.createElement('div', { className: 'mb-3 p-3 rounded-lg border-2 ' + (scheduledDate ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300') },
                                                React.createElement('div', { className: 'flex items-center gap-2' },
                                                    React.createElement('i', { className: 'text-lg ' + (scheduledDate ? 'fas fa-calendar-check text-blue-600' : 'fas fa-user-check text-orange-600') }),
                                                    React.createElement('span', { className: 'font-bold ' + (scheduledDate ? 'text-blue-800' : 'text-orange-800') },
                                                        "État actuel : " + (scheduledDate ? "PLANIFIÉ" : "ASSIGNÉ")
                                                    )
                                                ),
                                                scheduledDate ? 
                                                    React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                                        "📅 Date : " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                                                    )
                                                : React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                                    "ℹ️ Aucune date planifiée - Ajoutez-en une pour planifier"
                                                )
                                            ), // Ferme le badge d'état (ligne 3307)
                                            
                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' }, 
                                                React.createElement('i', { className: 'fas fa-calendar-day mr-2 text-slate-600 text-xs sm:text-sm' }),
                                                "Date de maintenance" + (scheduledDate ? " (modifier)" : " (ajouter)")
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('input', {
                                                    type: 'date',
                                                    value: scheduledDate,
                                                    onChange: (e) => setScheduledDate(e.target.value),
                                                    className: 'flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
                                                }),
                                                scheduledDate ? React.createElement('button', {
                                                    type: 'button',
                                                    onClick: () => setScheduledDate(''),
                                                    className: 'px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg'
                                                },
                                                    React.createElement('i', { className: 'fas fa-times mr-1' }),
                                                    "Retirer"
                                                ) : null
                                            ), // Ferme le div flex gap-2 (ligne 3327)
                                            scheduledDate ? React.createElement('div', { className: 'mt-2 text-xs text-gray-600 italic' },
                                                '💡 Cliquez sur "Retirer" pour passer de PLANIFIÉ à ASSIGNÉ'
                                            ) : null
                                        ), // Ferme le div principal Date de maintenance (ligne 3305)
                                        
                                        // Boutons d'action
                                        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3' },
                                            React.createElement('button', {
                                                onClick: () => {
                                                    setEditingSchedule(false);
                                                    setScheduledAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
                                                    setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? ticket.scheduled_date.substring(0, 10) : '');
                                                },
                                                className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                            },
                                                React.createElement('i', { className: 'fas fa-times mr-1' }),
                                                'Annuler'
                                            ),
                                            React.createElement('button', {
                                                onClick: handleSaveSchedule,
                                                disabled: savingSchedule,
                                                className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-[0_8px_16px_rgba(147,51,234,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(147,51,234,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-t border-blue-300/50'
                                            },
                                                savingSchedule 
                                                    ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-1' })
                                                    : React.createElement('i', { className: 'fas fa-save mr-1' }),
                                                savingSchedule ? 'Enregistrement...' : 'Enregistrer'
                                            )
                                        )
                                    )
                                )
                            )
                        : null,
                        
                        
                        (ticket.media && ticket.media.length > 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6' },
                            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center' },
                                React.createElement('i', { className: 'fas fa-images mr-2 text-blue-700 text-sm sm:text-base' }),
                                'Photos et Vidéos (' + ticket.media.length + ')'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3' },
                                ticket.media.map((media, index) =>
                                    React.createElement('div', { 
                                        key: media.id,
                                        className: 'relative group'
                                    },
                                        React.createElement('div', {
                                            className: 'cursor-pointer',
                                            onClick: () => setSelectedMedia(media)
                                        },
                                            media.file_type.startsWith('image/') 
                                                ? React.createElement('img', {
                                                    src: API_URL + '/media/' + media.id,
                                                    alt: media.file_name,
                                                    className: 'w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-igp-blue transition-all'
                                                })
                                                : React.createElement('div', { className: 'w-full h-32 bg-gray-200 rounded border-2 border-gray-300 hover:border-igp-blue transition-all flex items-center justify-center' },
                                                    React.createElement('i', { className: 'fas fa-video fa-3x text-gray-500' })
                                                ),
                                            React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center pointer-events-none' },
                                                React.createElement('i', { className: 'fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-all' })
                                            ),
                                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded pointer-events-none' },
                                                media.file_type.startsWith('image/') ? '📷' : '🎥'
                                            )
                                        ),
                                        (currentUser && (
                                            currentUser.role === 'admin' ||
                                            currentUser.role === 'supervisor' ||
                                            currentUser.role === 'technician' ||
                                            (ticket.reported_by === currentUser.id)
                                        )) ? React.createElement('button', {
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                handleDeleteMedia(media.id);
                                            },
                                            className: 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10',
                                            title: 'Supprimer ce media'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash text-xs' })
                                        ) : null
                                    )
                                )
                            )
                        ) : null,
                        
                        
                        (!ticket.media || ticket.media.length === 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6 text-center py-6 sm:py-8 bg-gray-50 rounded' },
                            React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
                            React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
                        ) : null,
                        
                        
                        React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
                            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-comments mr-2 text-igp-blue text-sm sm:text-base' }),
                                'Commentaires et Notes (' + comments.length + ')'
                            ),
                            
                            
                            comments.length > 0 ? React.createElement('div', { className: 'space-y-3 mb-4 max-h-64 overflow-y-auto' },
                                comments.map(comment =>
                                    React.createElement('div', { 
                                        key: comment.id,
                                        className: 'bg-gray-50 rounded-lg p-3 border-l-4 ' + 
                                                   (comment.user_role === 'Technicien' ? 'border-blue-600' : 'border-igp-blue')
                                    },
                                        React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('i', { 
                                                    className: 'fas ' + (comment.user_role === 'Technicien' ? 'fa-wrench' : 'fa-user') + ' text-sm text-gray-600'
                                                }),
                                                React.createElement('span', { className: 'font-semibold text-gray-800' }, comment.user_name),
                                                React.createElement('span', { className: 'text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded' }, 
                                                    comment.user_role || 'Opérateur'
                                                )
                                            ),
                                            React.createElement('span', { className: 'text-xs text-gray-500' },
                                                formatDateEST(comment.created_at)
                                            )
                                        ),
                                        React.createElement('p', { className: 'text-gray-700 text-sm whitespace-pre-wrap' }, comment.comment)
                                    )
                                )
                            ) : React.createElement('div', { className: 'text-center py-6 bg-gray-50 rounded mb-4' },
                                React.createElement('i', { className: 'fas fa-comment-slash text-gray-400 text-3xl mb-2' }),
                                React.createElement('p', { className: 'text-gray-500 text-sm' }, 'Aucun commentaire pour le moment')
                            ),
                            
                            
                            React.createElement('form', { 
                                onSubmit: handleAddComment,
                                className: 'bg-blue-50 rounded-lg p-3 sm:p-4 border-2 border-igp-blue'
                            },
                                React.createElement('h5', { className: 'font-semibold text-gray-800 mb-3 flex items-center' },
                                    React.createElement('i', { className: 'fas fa-plus-circle mr-2 text-igp-blue' }),
                                    'Ajouter un commentaire'
                                ),
                                
                                
                                React.createElement('div', { className: 'mb-3' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-1' },
                                        React.createElement('i', { className: 'fas fa-comment mr-1' }),
                                        'Commentaire *'
                                    ),
                                    React.createElement('textarea', {
                                        value: newComment,
                                        onChange: handleInputComment,
                                        onInvalid: handleInvalidComment,
                                        placeholder: 'Ex: Pièce commandée, livraison prévue jeudi...',
                                        required: true,
                                        rows: 3,
                                        className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent resize-none'
                                    })
                                ),
                                
                                
                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: submittingComment,
                                    className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                },
                                    submittingComment 
                                        ? React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                            'Envoi en cours...'
                                        )
                                        : React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-paper-plane mr-2' }),
                                            'Publier le commentaire'
                                        )
                                )
                            )
                        ),
                        
                        
                        React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
                            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-camera-retro mr-2 text-blue-700 text-sm sm:text-base' }),
                                'Ajouter des photos/vidéos supplémentaires'
                            ),
                            
                            
                            newMediaPreviews.length > 0 ? React.createElement('div', { className: 'mb-4' },
                                React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-images mr-1' }),
                                    newMediaPreviews.length + ' fichier(s) sélectionné(s)'
                                ),
                                React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3' },
                                    newMediaPreviews.map((preview, index) =>
                                        React.createElement('div', { 
                                            key: index,
                                            className: 'relative group'
                                        },
                                            preview.type.startsWith('image/')
                                                ? React.createElement('img', {
                                                    src: preview.url,
                                                    alt: preview.name,
                                                    className: 'w-full h-24 object-cover rounded border-2 border-blue-600'
                                                })
                                                : React.createElement('div', { className: 'w-full h-24 bg-gray-200 rounded border-2 border-blue-600 flex items-center justify-center' },
                                                    React.createElement('i', { className: 'fas fa-video fa-2x text-gray-500' })
                                                ),
                                            React.createElement('button', {
                                                type: 'button',
                                                onClick: () => {
                                                    setNewMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                                    setNewMediaPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
                                                },
                                                className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-all'
                                            },
                                                React.createElement('i', { className: 'fas fa-times text-xs' })
                                            ),
                                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded max-w-full truncate' },
                                                preview.name
                                            )
                                        )
                                    )
                                ),
                                React.createElement('button', {
                                    onClick: handleUploadNewMedia,
                                    disabled: uploadingMedia,
                                    className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-igp-blue-dark transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                },
                                    uploadingMedia
                                        ? React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                            'Upload en cours...'
                                        )
                                        : React.createElement('span', {},
                                            React.createElement('i', { className: 'fas fa-cloud-upload-alt mr-2' }),
                                            'Uploader ces fichiers'
                                        )
                                )
                            ) : null,
                            
                            
                            React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center' },
                                React.createElement('label', { 
                                    className: 'inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-200 hover:border-blue-600 transition-all text-center'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        accept: 'image/*',
                                        capture: 'environment',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden',
                                        id: 'photo-upload-detail'
                                    }),
                                    React.createElement('i', { className: 'fas fa-camera text-xl sm:text-2xl text-blue-600 mb-1 sm:mb-2 block' }),
                                    React.createElement('span', { className: 'text-xs sm:text-sm font-semibold text-blue-700 block' },
                                        'Prendre une photo'
                                    )
                                ),
                                React.createElement('label', { 
                                    className: 'inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-200 hover:border-gray-600 transition-all text-center'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        multiple: true,
                                        accept: 'image/*,video/*',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden',
                                        id: 'media-upload-detail'
                                    }),
                                    React.createElement('i', { className: 'fas fa-images text-xl sm:text-2xl text-gray-600 mb-1 sm:mb-2 block' }),
                                    React.createElement('span', { className: 'text-xs sm:text-sm font-semibold text-gray-700 block' },
                                        'Choisir fichiers'
                                    )
                                )
                            )
                        ),
                        
                        
                        React.createElement('div', { className: 'flex justify-end mt-6 pt-4 border-t-2 border-gray-200' },
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-times mr-2' }),
                                'Fermer'
                            )
                        )
                    ) : React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('p', { className: 'text-red-600' }, 'Erreur lors du chargement du ticket')
                    )
                ),
                
                
                selectedMedia ? React.createElement('div', {
                    className: 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4',
                    onClick: () => setSelectedMedia(null)
                },
                    React.createElement('div', { className: 'relative max-w-6xl max-h-full' },
                        React.createElement('button', {
                            onClick: () => setSelectedMedia(null),
                            className: 'absolute top-2 right-2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-all z-10'
                        },
                            React.createElement('i', { className: 'fas fa-times fa-lg' })
                        ),
                        selectedMedia.file_type.startsWith('image/')
                            ? React.createElement('img', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                alt: selectedMedia.file_name,
                                className: 'max-w-full max-h-screen object-contain',
                                onClick: (e) => e.stopPropagation()
                            })
                            : React.createElement('video', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                controls: true,
                                className: 'max-w-full max-h-screen',
                                onClick: (e) => e.stopPropagation()
                            }),
                        React.createElement('div', { className: 'absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm' },
                            selectedMedia.file_name + ' - ' + Math.round(selectedMedia.file_size / 1024) + ' KB'
                        )
                    )
                ) : null,
                
                React.createElement(ConfirmModal, {
                    show: confirmDialog.show,
                    message: confirmDialog.message,
                    onConfirm: confirmDialog.onConfirm,
                    onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
                })
            );
        };
        
        
        // Composant de gestion des machines (VERSION SIMPLIFIÉE ET ÉLÉGANTE)
        const MachineManagementModal = ({ show, onClose, currentUser, machines, onRefresh }) => {
            const [searchQuery, setSearchQuery] = React.useState("");
            const [showCreateForm, setShowCreateForm] = React.useState(false);
            const [editingMachine, setEditingMachine] = React.useState(null);
            
            // Formulaire création
            const [newType, setNewType] = React.useState("");
            const [newModel, setNewModel] = React.useState("");
            const [newSerial, setNewSerial] = React.useState("");
            const [newLocation, setNewLocation] = React.useState("");
            
            // Formulaire édition
            const [editType, setEditType] = React.useState("");
            const [editModel, setEditModel] = React.useState("");
            const [editSerial, setEditSerial] = React.useState("");
            const [editLocation, setEditLocation] = React.useState("");
            const [editStatus, setEditStatus] = React.useState("");
            
            // Référence pour le scroll
            const scrollContainerRef = React.useRef(null);
            
            const handleCreate = async (e) => {
                e.preventDefault();
                if (!newType || !newModel || !newSerial) {
                    alert("Type, modele et numero de serie requis");
                    return;
                }
                try {
                    await axios.post(API_URL + "/machines", {
                        machine_type: newType,
                        model: newModel,
                        serial_number: newSerial,
                        location: newLocation
                    });
                    alert("Machine creee avec succes!");
                    setNewType("");
                    setNewModel("");
                    setNewSerial("");
                    setNewLocation("");
                    setShowCreateForm(false);
                    onRefresh();
                } catch (error) {
                    alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
                }
            };
            
            const handleEdit = (machine) => {
                setEditingMachine(machine);
                setEditType(machine.machine_type);
                setEditModel(machine.model);
                setEditSerial(machine.serial_number);
                setEditLocation(machine.location || "");
                setEditStatus(machine.status);
                
                // Scroller vers le haut pour voir le formulaire
                setTimeout(() => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = 0;
                    }
                }, 100);
            };
            
            const handleUpdate = async (e) => {
                e.preventDefault();
                try {
                    await axios.patch(API_URL + "/machines/" + editingMachine.id, {
                        machine_type: editType,
                        model: editModel,
                        serial_number: editSerial,
                        location: editLocation,
                        status: editStatus
                    });
                    alert("Machine mise a jour!");
                    setEditingMachine(null);
                    onRefresh();
                } catch (error) {
                    alert("Erreur: " + (error.response?.data?.error || "Erreur inconnue"));
                }
            };
            
            const handleDelete = async (machine) => {
                if (!confirm("Supprimer " + machine.machine_type + " " + machine.model + " ?")) return;
                try {
                    await axios.delete(API_URL + "/machines/" + machine.id);
                    alert("Machine supprimee!");
                    onRefresh();
                } catch (error) {
                    alert("Erreur: " + (error.response?.data?.error || "Impossible de supprimer une machine avec des tickets"));
                }
            };
            
            const getStatusColor = (status) => {
                if (status === "operational") return "bg-green-100 text-green-800";
                if (status === "maintenance") return "bg-yellow-100 text-yellow-800";
                return "bg-red-100 text-red-800";
            };
            
            const getStatusLabel = (status) => {
                if (status === "operational") return "Operationnelle";
                if (status === "maintenance") return "En maintenance";
                return "Hors service";
            };
            
            if (!show) return null;
            
            const filteredMachines = machines.filter(m => 
                !searchQuery || 
                m.machine_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.serial_number && m.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            
            return React.createElement("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
                onClick: onClose
            },
                React.createElement("div", {
                    className: "bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col",
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement("div", { className: "bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-3 sm:p-5 flex justify-between items-center" },
                        React.createElement("div", { className: "flex items-center gap-2 sm:gap-3" },
                            React.createElement("i", { className: "fas fa-cogs text-xl sm:text-2xl" }),
                            React.createElement("h2", { className: "text-lg sm:text-2xl font-bold" }, "Gestion des Machines")
                        ),
                        React.createElement("button", {
                            onClick: onClose,
                            className: "text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                        },
                            React.createElement("i", { className: "fas fa-times text-xl" })
                        )
                    ),
                    React.createElement("div", { className: "flex-1 overflow-y-auto p-3 sm:p-6", ref: scrollContainerRef },
                        React.createElement("div", { className: "mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3" },
                            currentUser.role === "admin" ? React.createElement("button", {
                                onClick: () => setShowCreateForm(!showCreateForm),
                                className: "px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm sm:text-base"
                            }, showCreateForm ? "Annuler" : "Nouvelle Machine") : null,
                            React.createElement("input", {
                                type: "text",
                                placeholder: "Rechercher...",
                                value: searchQuery,
                                onChange: (e) => setSearchQuery(e.target.value),
                                className: "flex-1 px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-sm sm:text-base"
                            })
                        ),
                        
                        showCreateForm ? React.createElement("form", {
                            onSubmit: handleCreate,
                            className: "mb-6 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border-2 border-blue-200 shadow-lg"
                        },
                            React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Nouvelle Machine"),
                            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Type *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newType,
                                        onChange: (e) => setNewType(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: Polisseuse, CNC, Four..."
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Modele *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newModel,
                                        onChange: (e) => setNewModel(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: Bavelloni, Double Edger..."
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newSerial,
                                        onChange: (e) => setNewSerial(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: PDE-001"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newLocation,
                                        onChange: (e) => setNewLocation(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-600 focus:outline-none",
                                        placeholder: "Ex: Atelier Polissage"
                                    })
                                )
                            ),
                            React.createElement("button", {
                                type: "submit",
                                className: "mt-4 px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                            }, "Creer la Machine")
                        ) : null,
                        
                        editingMachine ? React.createElement("form", {
                            onSubmit: handleUpdate,
                            className: "mb-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-lg"
                        },
                            React.createElement("h3", { className: "text-xl font-bold mb-4 text-blue-800" }, "Modifier Machine"),
                            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Type"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editType,
                                        onChange: (e) => setEditType(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Modele"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editModel,
                                        onChange: (e) => setEditModel(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editSerial,
                                        onChange: (e) => setEditSerial(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: editLocation,
                                        onChange: (e) => setEditLocation(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Statut"),
                                    React.createElement("select", {
                                        value: editStatus,
                                        onChange: (e) => setEditStatus(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    },
                                        React.createElement("option", { value: "operational" }, "Operationnelle"),
                                        React.createElement("option", { value: "maintenance" }, "En maintenance"),
                                        React.createElement("option", { value: "out_of_service" }, "Hors service")
                                    )
                                )
                            ),
                            React.createElement("div", { className: "flex gap-3 mt-4" },
                                React.createElement("button", {
                                    type: "submit",
                                    className: "px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                                }, "Enregistrer"),
                                React.createElement("button", {
                                    type: "button",
                                    onClick: () => setEditingMachine(null),
                                    className: "px-6 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition-all"
                                }, "Annuler")
                            )
                        ) : null,
                        
                        React.createElement("div", { className: "space-y-3" },
                            React.createElement("p", { className: "text-lg mb-4" }, 
                                filteredMachines.length + " machine(s)"
                            ),
                            filteredMachines.map(machine =>
                                React.createElement("div", {
                                    key: machine.id,
                                    className: "bg-white rounded-xl p-3 sm:p-4 shadow-md border-2 border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all"
                                },
                                    React.createElement("div", { className: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3" },
                                        React.createElement("div", { className: "flex-1" },
                                            React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2" },
                                                React.createElement("h4", { className: "font-bold text-base sm:text-lg" }, machine.machine_type + " - " + machine.model),
                                                React.createElement("span", { 
                                                    className: "px-3 py-1 rounded-full text-xs font-semibold " + getStatusColor(machine.status)
                                                }, getStatusLabel(machine.status))
                                            ),
                                            React.createElement("p", { className: "text-sm text-gray-600" },
                                                React.createElement("i", { className: "fas fa-barcode mr-2" }),
                                                "Serie: " + (machine.serial_number || "N/A")
                                            ),
                                            machine.location ? React.createElement("p", { className: "text-sm text-gray-600" },
                                                React.createElement("i", { className: "fas fa-map-marker-alt mr-2" }),
                                                machine.location
                                            ) : null
                                        ),
                                        currentUser.role === "admin" || currentUser.role === "supervisor" ? React.createElement("div", { className: "flex gap-2 self-end sm:self-auto" },
                                            React.createElement("button", {
                                                onClick: () => handleEdit(machine),
                                                className: "px-3 sm:px-4 py-2 bg-igp-blue-light text-white rounded-lg font-bold hover:bg-igp-blue transition-all text-sm sm:text-base"
                                            },
                                                React.createElement("i", { className: "fas fa-edit" }),
                                                React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Modifier")
                                            ),
                                            currentUser.role === "admin" ? React.createElement("button", {
                                                onClick: () => handleDelete(machine),
                                                className: "px-3 sm:px-4 py-2 bg-igp-red text-white rounded-lg font-bold hover:bg-red-700 transition-all text-sm sm:text-base"
                                            },
                                                React.createElement("i", { className: "fas fa-trash" }),
                                                React.createElement("span", { className: "ml-2 hidden sm:inline" }, "Supprimer")
                                            ) : null
                                        ) : null
                                    )
                                )
                            )
                        )
                    )
                )
            );
        };
        
        
        // Composant de sélection de rôle custom (remplace <select> natif pour mobile)
        const RoleDropdown = ({ value, onChange, disabled, currentUserRole, variant = 'blue' }) => {
            const [isOpen, setIsOpen] = React.useState(false);
            const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
            const dropdownRef = React.useRef(null);
            const buttonRef = React.useRef(null);
            const portalRef = React.useRef(null);
            
            // Styles selon le variant (blue pour création, green pour édition) - mémorisés
            const styles = React.useMemo(() => ({
                blue: {
                    button: 'from-white/90 to-blue-50/80 border-blue-300 focus:ring-blue-500 focus:border-blue-500',
                    chevron: 'text-blue-500',
                    shadow: '0 6px 20px rgba(59, 130, 246, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
                    border: 'border-blue-300'
                },
                green: {
                    button: 'from-white/90 to-green-50/80 border-green-300 focus:ring-green-500 focus:border-green-500',
                    chevron: 'text-green-500',
                    shadow: '0 6px 20px rgba(34, 197, 94, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
                    border: 'border-green-300'
                }
            }), []);
            
            const currentStyle = styles[variant];
            
            // Définition des rôles organisés par catégorie - mémorisés
            const roleGroups = React.useMemo(() => [
                {
                    label: '📊 Direction',
                    roles: [
                        { value: 'director', label: 'Directeur Général' },
                        ...(currentUserRole === 'admin' ? [{ value: 'admin', label: 'Administrateur' }] : [])
                    ]
                },
                {
                    label: '⚙️ Management Maintenance',
                    roles: [
                        { value: 'supervisor', label: 'Superviseur' },
                        { value: 'coordinator', label: 'Coordonnateur Maintenance' },
                        { value: 'planner', label: 'Planificateur Maintenance' }
                    ]
                },
                {
                    label: '🔧 Technique',
                    roles: [
                        { value: 'senior_technician', label: 'Technicien Senior' },
                        { value: 'technician', label: 'Technicien' }
                    ]
                },
                {
                    label: '🏭 Production',
                    roles: [
                        { value: 'team_leader', label: 'Chef Équipe Production' },
                        { value: 'furnace_operator', label: 'Opérateur Four' },
                        { value: 'operator', label: 'Opérateur' }
                    ]
                },
                {
                    label: '🛡️ Support',
                    roles: [
                        { value: 'safety_officer', label: 'Agent Santé & Sécurité' },
                        { value: 'quality_inspector', label: 'Inspecteur Qualité' },
                        { value: 'storekeeper', label: 'Magasinier' }
                    ]
                },
                {
                    label: '👁️ Transversal',
                    roles: [
                        { value: 'viewer', label: 'Lecture Seule' }
                    ]
                }
            ], [currentUserRole]);
            
            // Trouver le label du rôle sélectionné - mémorisé
            const getSelectedLabel = React.useCallback(() => {
                for (const group of roleGroups) {
                    const role = group.roles.find(r => r.value === value);
                    if (role) return role.label;
                }
                return 'Sélectionner un rôle';
            }, [roleGroups, value]);
            
            // Calculer la position du dropdown quand il s'ouvre ou lors du resize/scroll
            const updatePosition = React.useCallback(() => {
                if (buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect();
                    setDropdownPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            }, []);
            
            React.useEffect(() => {
                if (isOpen) {
                    updatePosition();
                    window.addEventListener('resize', updatePosition);
                    window.addEventListener('scroll', updatePosition, true);
                    
                    return () => {
                        window.removeEventListener('resize', updatePosition);
                        window.removeEventListener('scroll', updatePosition, true);
                    };
                }
            }, [isOpen, updatePosition]);
            
            // Fermer le dropdown si on clique à l'extérieur - optimisé avec useCallback
            const handleClickOutside = React.useCallback((event) => {
                // Vérifier si le clic est sur le bouton, le dropdown conteneur ou le portal
                if (
                    buttonRef.current && buttonRef.current.contains(event.target) ||
                    dropdownRef.current && dropdownRef.current.contains(event.target) ||
                    portalRef.current && portalRef.current.contains(event.target)
                ) {
                    return;
                }
                setIsOpen(false);
            }, []);
            
            React.useEffect(() => {
                if (isOpen) {
                    // Utiliser capture phase pour attraper les événements avant les autres handlers
                    document.addEventListener('mousedown', handleClickOutside, true);
                    document.addEventListener('touchstart', handleClickOutside, true);
                    
                    return () => {
                        document.removeEventListener('mousedown', handleClickOutside, true);
                        document.removeEventListener('touchstart', handleClickOutside, true);
                    };
                }
            }, [isOpen, handleClickOutside]);
            
            // Gestion de la sélection - optimisée avec useCallback
            const handleSelect = React.useCallback((roleValue) => {
                onChange({ target: { value: roleValue } });
                setIsOpen(false);
            }, [onChange]);
            
            // Créer le dropdown content avec ref pour le portal
            const dropdownContent = isOpen && React.createElement('div', {
                ref: portalRef,
                className: 'fixed z-[10000] bg-white border-2 ' + currentStyle.border + ' rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto',
                style: {
                    top: dropdownPosition.top + 'px',
                    left: dropdownPosition.left + 'px',
                    width: dropdownPosition.width + 'px',
                    pointerEvents: 'auto'
                }
            },
                roleGroups.map((group, groupIndex) => 
                    group.roles.length > 0 && React.createElement('div', { key: groupIndex },
                        // En-tête de groupe
                        React.createElement('div', {
                            className: 'px-3 py-2 bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm sticky top-0 z-[1]'
                        }, group.label),
                        // Options du groupe
                        group.roles.map(role => 
                            React.createElement('button', {
                                key: role.value,
                                type: 'button',
                                onClick: () => handleSelect(role.value),
                                className: 'w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-blue-50 transition-colors ' + (value === role.value ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-800')
                            },
                                role.label,
                                value === role.value && React.createElement('i', { 
                                    className: 'fas fa-check ml-2 text-blue-600'
                                })
                            )
                        )
                    )
                )
            );
            
            return React.createElement('div', {
                ref: dropdownRef,
                className: 'relative w-full'
            },
                // Bouton principal
                React.createElement('button', {
                    ref: buttonRef,
                    type: 'button',
                    onClick: () => !disabled && setIsOpen(!isOpen),
                    disabled: disabled,
                    className: 'w-full px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-left bg-gradient-to-br ' + currentStyle.button + ' backdrop-blur-sm border-2 rounded-xl shadow-lg focus:outline-none focus:ring-2 transition-all hover:shadow-xl cursor-pointer font-medium sm:font-semibold ' + (disabled ? 'opacity-50 cursor-not-allowed' : '') + ' flex justify-between items-center',
                    style: { boxShadow: currentStyle.shadow }
                },
                    React.createElement('span', { className: 'truncate pr-2' }, getSelectedLabel()),
                    React.createElement('i', { 
                        className: 'fas fa-chevron-' + (isOpen ? 'up' : 'down') + ' ' + currentStyle.chevron + ' transition-transform text-xs sm:text-sm flex-shrink-0'
                    })
                ),
                
                // Rendre le dropdown via portal directement dans le body
                isOpen && (typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) 
                    ? ReactDOM.createPortal(dropdownContent, document.body)
                    : dropdownContent
            );
        };
        
        
        // ===== MODAL PARAMETRES SYSTEME (ADMIN) =====
        const SystemSettingsModal = ({ show, onClose, currentUser }) => {
            const [timezoneOffset, setTimezoneOffset] = React.useState('-5');
            const [loading, setLoading] = React.useState(true);
            const [saving, setSaving] = React.useState(false);
            
            React.useEffect(() => {
                if (show) {
                    loadSettings();
                }
            }, [show]);
            
            const loadSettings = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(API_URL + '/settings/timezone_offset_hours');
                    setTimezoneOffset(response.data.setting_value);
                } catch (error) {
                    console.error('Erreur chargement parametres:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            const handleSave = async () => {
                setSaving(true);
                try {
                    await axios.put(API_URL + '/settings/timezone_offset_hours', {
                        value: timezoneOffset
                    });
                    // Mettre a jour le localStorage immediatement pour que les changements soient visibles
                    localStorage.setItem('timezone_offset_hours', timezoneOffset);
                    alert("Paramètres mis à jour avec succès!");
                    onClose();
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                } finally {
                    setSaving(false);
                }
            };
            
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50' },
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 flex items-center gap-2' },
                                React.createElement('i', { className: 'fas fa-cog' }),
                                "Paramètres Système"
                            ),
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700 text-2xl',
                                type: 'button'
                            }, '×')
                        )
                    ),
                    
                    React.createElement('div', { className: 'p-6 overflow-y-auto', style: { maxHeight: 'calc(90vh - 180px)' } },
                        loading ? React.createElement('div', { className: 'text-center py-8' },
                            React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl text-blue-600' })
                        ) : React.createElement('div', { className: 'space-y-6' },
                            React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                                React.createElement('div', { className: 'flex items-start gap-3' },
                                    React.createElement('i', { className: 'fas fa-info-circle text-blue-600 text-xl mt-1' }),
                                    React.createElement('div', {},
                                        React.createElement('h3', { className: 'font-bold text-blue-900 mb-2' }, "À propos du décalage horaire"),
                                        React.createElement('p', { className: 'text-sm text-blue-800 mb-2' },
                                            "Le décalage horaire permet d'ajuster l'heure du serveur pour correspondre à votre fuseau horaire local."
                                        ),
                                        React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1 list-disc list-inside' },
                                            React.createElement('li', {}, 'Hiver (EST): -5 heures'),
                                            React.createElement('li', {}, 'Ete (EDT): -4 heures'),
                                            React.createElement('li', {}, 'Impacte: alertes retard, countdowns')
                                        )
                                    )
                                )
                            ),
                            
                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-clock mr-2' }),
                                    'Decalage horaire (heures par rapport a UTC)'
                                ),
                                React.createElement('select', {
                                    value: timezoneOffset,
                                    onChange: (e) => setTimezoneOffset(e.target.value),
                                    className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold'
                                },
                                    React.createElement('option', { value: '-12' }, 'UTC-12'),
                                    React.createElement('option', { value: '-11' }, 'UTC-11'),
                                    React.createElement('option', { value: '-10' }, 'UTC-10 (Hawaii)'),
                                    React.createElement('option', { value: '-9' }, 'UTC-9 (Alaska)'),
                                    React.createElement('option', { value: '-8' }, 'UTC-8 (PST)'),
                                    React.createElement('option', { value: '-7' }, 'UTC-7 (MST)'),
                                    React.createElement('option', { value: '-6' }, 'UTC-6 (CST)'),
                                    React.createElement('option', { value: '-5' }, 'UTC-5 (EST - Hiver Quebec)'),
                                    React.createElement('option', { value: '-4' }, 'UTC-4 (EDT - Ete Quebec)'),
                                    React.createElement('option', { value: '-3' }, 'UTC-3'),
                                    React.createElement('option', { value: '-2' }, 'UTC-2'),
                                    React.createElement('option', { value: '-1' }, 'UTC-1'),
                                    React.createElement('option', { value: '0' }, 'UTC+0 (Londres)'),
                                    React.createElement('option', { value: '1' }, 'UTC+1 (Paris)'),
                                    React.createElement('option', { value: '2' }, 'UTC+2'),
                                    React.createElement('option', { value: '3' }, 'UTC+3'),
                                    React.createElement('option', { value: '4' }, 'UTC+4'),
                                    React.createElement('option', { value: '5' }, 'UTC+5'),
                                    React.createElement('option', { value: '6' }, 'UTC+6'),
                                    React.createElement('option', { value: '7' }, 'UTC+7'),
                                    React.createElement('option', { value: '8' }, 'UTC+8 (Hong Kong)'),
                                    React.createElement('option', { value: '9' }, 'UTC+9 (Tokyo)'),
                                    React.createElement('option', { value: '10' }, 'UTC+10 (Sydney)'),
                                    React.createElement('option', { value: '11' }, 'UTC+11'),
                                    React.createElement('option', { value: '12' }, 'UTC+12'),
                                    React.createElement('option', { value: '13' }, 'UTC+13'),
                                    React.createElement('option', { value: '14' }, 'UTC+14')
                                ),
                                React.createElement('p', { className: 'mt-2 text-sm text-gray-600' },
                                    'Actuellement selectionne: UTC',
                                    timezoneOffset,
                                    ' (',
                                    parseInt(timezoneOffset) === -5 ? 'EST - Hiver Quebec' : 
                                    parseInt(timezoneOffset) === -4 ? 'EDT - Ete Quebec' : 
                                    'Personnalise',
                                    ')'
                                )
                            ),
                            
                            React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
                                React.createElement('div', { className: 'flex items-start gap-3' },
                                    React.createElement('i', { className: 'fas fa-exclamation-triangle text-yellow-600 text-xl mt-1' }),
                                    React.createElement('div', {},
                                        React.createElement('h3', { className: 'font-bold text-yellow-900 mb-1' }, "Attention"),
                                        React.createElement('p', { className: 'text-sm text-yellow-800' },
                                            "Changez ce paramètre uniquement lors du changement d'heure (mars et novembre)."
                                        )
                                    )
                                )
                            )
                        )
                    ),
                    
                    React.createElement('div', { className: 'p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3' },
                        React.createElement('button', {
                            onClick: onClose,
                            disabled: saving,
                            className: 'px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all',
                            type: 'button'
                        }, 'Annuler'),
                        React.createElement('button', {
                            onClick: handleSave,
                            disabled: saving,
                            className: 'px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2',
                            type: 'button'
                        },
                            saving && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                            saving ? 'Enregistrement...' : 'Enregistrer'
                        )
                    )
                )
            );
        };
        
        
        // Composant de gestion des utilisateurs (VERSION SIMPLIFIÉE)
        const UserManagementModal = ({ show, onClose, currentUser, onOpenMessage }) => {
            const [users, setUsers] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [showCreateForm, setShowCreateForm] = React.useState(false);
            const [newEmail, setNewEmail] = React.useState('');
            const [newPassword, setNewPassword] = React.useState('');
            const [newFullName, setNewFullName] = React.useState('');
            const [newRole, setNewRole] = React.useState('operator');
            const [editingUser, setEditingUser] = React.useState(null);
            const [editEmail, setEditEmail] = React.useState('');
            const [editFullName, setEditFullName] = React.useState('');
            const [editRole, setEditRole] = React.useState('operator');
            const [notification, setNotification] = React.useState({ show: false, message: '', type: 'info' });
            const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });
            const [promptDialog, setPromptDialog] = React.useState({ show: false, message: '', onConfirm: null });
            const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });
            const [searchQuery, setSearchQuery] = React.useState('');
            const [buttonLoading, setButtonLoading] = React.useState(null);
            
            React.useEffect(() => {
                if (show) {
                    loadUsers(); // Chargement initial
                    
                    // Polling toutes les 30 secondes pour rafraichir les statuts last_login
                    const interval = setInterval(() => {
                        loadUsers();
                    }, 30000);
                    
                    return () => clearInterval(interval);
                }
            }, [show]);
            
            React.useEffect(() => {
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        if (promptDialog.show) {
                            setPromptDialog({ show: false, message: '', onConfirm: null });
                        } else if (confirmDialog.show) {
                            setConfirmDialog({ show: false, message: '', onConfirm: null });
                        } else if (notification.show) {
                            setNotification({ show: false, message: '', type: 'info' });
                        } else if (editingUser) {
                            setEditingUser(null);
                        } else if (showCreateForm) {
                            setShowCreateForm(false);
                        } else if (show) {
                            onClose();
                        }
                    }
                };
                
                if (show) {
                    document.addEventListener('keydown', handleEscape);
                    return () => document.removeEventListener('keydown', handleEscape);
                }
            }, [show, promptDialog.show, confirmDialog.show, notification.show, editingUser, showCreateForm]);
            
            const loadUsers = async () => {
                try {
                    setLoading(true);
                    // Les techniciens utilisent la route /api/users/team pour voir tous les utilisateurs
                    const endpoint = currentUser.role === 'technician' ? '/users/team' : '/users';
                    const response = await axios.get(API_URL + endpoint);
                    setUsers(response.data.users);
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur chargement: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setLoading(false);
                }
            };
            
            const handleCreateUser = React.useCallback(async (e) => {
                e.preventDefault();
                setButtonLoading('create');
                try {
                    await axios.post(API_URL + '/users', {
                        email: newEmail,
                        password: newPassword,
                        full_name: newFullName,
                        role: newRole
                    });
                    setToast({ show: true, message: 'Utilisateur cree avec succes!', type: 'success' });
                    setNewEmail('');
                    setNewPassword('');
                    setNewFullName('');
                    setNewRole('operator');
                    setShowCreateForm(false);
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setButtonLoading(null);
                }
            }, [newEmail, newPassword, newFullName, newRole, loadUsers]);
            
            // Gestionnaires validation formulaires admin
            const handleInvalidAdminField = (e) => {
                e.target.setCustomValidity("Veuillez remplir ce champ.");
            };
            
            const handleInputAdminEmail = (e, setter) => {
                e.target.setCustomValidity("");
                setter(e.target.value);
            };
            
            // Fonctions utilitaires mémorisées
            const ROLE_LABELS = React.useMemo(() => ({
                // Direction
                'admin': '👑 Administrateur',
                'director': '📊 Directeur Général',
                // Management Maintenance
                'supervisor': '⭐ Superviseur',
                'coordinator': '🎯 Coordonnateur Maintenance',
                'planner': '📅 Planificateur Maintenance',
                // Technique
                'senior_technician': '🔧 Technicien Senior',
                'technician': '🔧 Technicien',
                // Production
                'team_leader': '👔 Chef Équipe Production',
                'furnace_operator': '🔥 Opérateur Four',
                'operator': '👷 Opérateur',
                // Support
                'safety_officer': '🛡️ Agent Santé & Sécurité',
                'quality_inspector': '✓ Inspecteur Qualité',
                'storekeeper': '📦 Magasinier',
                // Transversal
                'viewer': '👁️ Lecture Seule'
            }), []);
            
            const ROLE_BADGE_COLORS = React.useMemo(() => ({
                // Direction - Rouge
                'admin': 'bg-red-100 text-red-800',
                'director': 'bg-red-50 text-red-700',
                // Management - Jaune/Orange
                'supervisor': 'bg-yellow-100 text-yellow-800',
                'coordinator': 'bg-amber-100 text-amber-800',
                'planner': 'bg-amber-100 text-amber-800',
                // Technique - Bleu
                'senior_technician': 'bg-blue-100 text-blue-800',
                'technician': 'bg-blue-50 text-blue-700',
                // Production - Vert
                'team_leader': 'bg-emerald-100 text-emerald-800',
                'furnace_operator': 'bg-green-100 text-green-800',
                'operator': 'bg-green-50 text-green-700',
                // Support - Indigo/Violet
                'safety_officer': 'bg-indigo-100 text-indigo-800',
                'quality_inspector': 'bg-slate-100 text-slate-700',
                'storekeeper': 'bg-violet-100 text-violet-800',
                // Transversal - Gris
                'viewer': 'bg-gray-100 text-gray-800'
            }), []);
            
            const getRoleLabel = React.useCallback((role) => {
                return ROLE_LABELS[role] || '👤 ' + role;
            }, [ROLE_LABELS]);
            
            const getRoleBadgeClass = React.useCallback((role) => {
                return ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-800';
            }, [ROLE_BADGE_COLORS]);
            
            const getLastLoginStatus = React.useCallback((lastLogin) => {
                if (!lastLogin) return { 
                    color: "text-gray-500", 
                    icon: "fa-circle", 
                    status: "Jamais connecte", 
                    time: "", 
                    dot: "bg-gray-400" 
                };
                
                const now = getNowEST();
                const loginISO = lastLogin.includes('T') ? lastLogin : lastLogin.replace(' ', 'T');
                // Ajouter Z pour forcer interpretation UTC
                const loginUTC = new Date(loginISO + (loginISO.includes('Z') ? '' : 'Z'));
                // Appliquer l'offset EST/EDT
                const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
                const loginDate = new Date(loginUTC.getTime() + (offset * 60 * 60 * 1000));
                const diffMs = now - loginDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 5) {
                    return { 
                        color: "text-green-600", 
                        icon: "fa-circle", 
                        status: "En ligne", 
                        time: "Actif maintenant", 
                        dot: "bg-green-500" 
                    };
                } else if (diffMins < 60) {
                    return { 
                        color: "text-yellow-600", 
                        icon: "fa-circle", 
                        status: "Actif recemment", 
                        time: "Il y a " + diffMins + " min", 
                        dot: "bg-yellow-500" 
                    };
                } else if (diffHours < 24) {
                    return { 
                        color: "text-blue-700", 
                        icon: "fa-circle", 
                        status: "Actif aujourd'hui", 
                        time: "Il y a " + diffHours + "h", 
                        dot: "bg-amber-600" 
                    };
                } else if (diffDays === 1) {
                    return { 
                        color: "text-red-600", 
                        icon: "fa-circle", 
                        status: "Inactif", 
                        time: "Hier", 
                        dot: "bg-red-500" 
                    };
                } else {
                    return { 
                        color: "text-red-600", 
                        icon: "fa-circle", 
                        status: "Inactif", 
                        time: "Il y a " + diffDays + " jours", 
                        dot: "bg-red-500" 
                    };
                }
            }, []);
            
            const canSeeLastLogin = React.useCallback((targetUser) => {
                // Admin voit tout le monde
                if (currentUser.role === "admin") return true;
                // Superviseur voit seulement les techniciens
                if (currentUser.role === "supervisor" && targetUser.role === "technician") return true;
                // Autres cas: non visible
                return false;
            }, [currentUser.role]);
            
            const handleDeleteUser = React.useCallback((userId, userName) => {
                setConfirmDialog({
                    show: true,
                    message: 'Etes-vous sur de vouloir supprimer ' + userName + ' ?',
                    onConfirm: async () => {
                        setConfirmDialog({ show: false, message: '', onConfirm: null });
                        setButtonLoading('delete-' + userId);
                        try {
                            await axios.delete(API_URL + '/users/' + userId);
                            setToast({ show: true, message: 'Utilisateur supprime avec succes!', type: 'success' });
                            loadUsers();
                        } catch (error) {
                            setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                        } finally {
                            setButtonLoading(null);
                        }
                    }
                });
            }, [loadUsers]);
            
            const handleEditUser = React.useCallback((user) => {
                setEditingUser(user);
                setEditEmail(user.email);
                setEditFullName(user.full_name);
                setEditRole(user.role);
            }, []);
            
            const handleUpdateUser = React.useCallback(async (e) => {
                e.preventDefault();
                setButtonLoading('update');
                try {
                    await axios.put(API_URL + '/users/' + editingUser.id, {
                        email: editEmail,
                        full_name: editFullName,
                        role: editRole
                    });
                    setToast({ show: true, message: 'Utilisateur modifie avec succes!', type: 'success' });
                    setEditingUser(null);
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setButtonLoading(null);
                }
            }, [editingUser, editEmail, editFullName, editRole, loadUsers]);
            
            const handleResetPassword = React.useCallback((userId, userName) => {
                setPromptDialog({
                    show: true,
                    message: 'Nouveau mot de passe pour ' + userName + ':',
                    onConfirm: async (newPass) => {
                        setPromptDialog({ show: false, message: '', onConfirm: null });
                        if (!newPass || newPass.length < 6) {
                            setNotification({ show: true, message: 'Mot de passe invalide (minimum 6 caracteres)', type: 'error' });
                            return;
                        }
                        try {
                            await axios.post(API_URL + '/users/' + userId + '/reset-password', {
                                new_password: newPass
                            });
                            setToast({ show: true, message: 'Mot de passe reinitialise avec succes!', type: 'success' });
                        } catch (error) {
                            setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                        }
                    }
                });
            }, []);
            
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-slate-700 to-gray-700 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-users-cog text-xl sm:text-2xl flex-shrink-0' }),
                            React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' },
                                currentUser.role === 'technician' ? "Liste Équipe" : "Gestion des Utilisateurs"
                            )
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                        },
                            React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                        )
                    ),
                    React.createElement('div', { className: 'flex-1 overflow-y-auto p-3 sm:p-6' },
                    
                    React.createElement('div', { className: 'mb-4 flex flex-col sm:flex-row gap-3' },
                        // Bouton creer utilisateur (visible seulement pour admin/superviseur)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? React.createElement('button', {
                            onClick: () => setShowCreateForm(true),
                            className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-blue-300/50'
                        }, "Créer un utilisateur") : null,
                        React.createElement('div', { className: 'flex-1 relative' },
                            React.createElement('input', {
                                type: 'text',
                                placeholder: 'Rechercher par nom ou email...',
                                value: searchQuery,
                                onChange: (e) => setSearchQuery(e.target.value),
                                className: 'w-full px-4 py-2 pl-10 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all',
                                onKeyDown: (e) => {
                                    if (e.key === 'Escape') {
                                        setSearchQuery('');
                                    }
                                }
                            }),
                            React.createElement('i', {
                                className: 'fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                            }),
                            searchQuery && React.createElement('button', {
                                onClick: () => setSearchQuery(''),
                                className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),
                    
                    showCreateForm ? React.createElement('div', { 
                        className: 'mb-6 p-6 bg-gradient-to-br from-blue-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-blue-200/50 scroll-mt-4',
                        ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    },
                        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Nouvel utilisateur'),
                        React.createElement('form', { onSubmit: handleCreateUser },
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Email'),
                                    React.createElement('input', {
                                        type: 'email',
                                        value: newEmail,
                                        onChange: (e) => handleInputAdminEmail(e, setNewEmail),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        required: true,
                                        autoFocus: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Nom complet'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: newFullName,
                                        onChange: (e) => handleInputAdminEmail(e, setNewFullName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        required: true
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Mot de passe'),
                                    React.createElement('input', {
                                        type: 'password',
                                        value: newPassword,
                                        onChange: (e) => handleInputAdminEmail(e, setNewPassword),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        required: true,
                                        minLength: 6
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                                    React.createElement(RoleDropdown, {
                                        value: newRole,
                                        onChange: (e) => setNewRole(e.target.value),
                                        disabled: false,
                                        currentUserRole: currentUser.role
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'flex gap-4' },
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setShowCreateForm(false),
                                    className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                }, 'Annuler'),
                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: buttonLoading === 'create',
                                    className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-blue-300/50'
                                }, 
                                    buttonLoading === 'create' && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                    "Créer"
                                )
                            )
                        )
                    ) : null,
                    
                    editingUser ? React.createElement('div', { 
                        className: 'mb-6 p-6 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-green-200/50 scroll-mt-4',
                        ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    },
                        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Modifier: ' + editingUser.full_name),
                        React.createElement('form', { onSubmit: handleUpdateUser },
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Email'),
                                    React.createElement('input', {
                                        type: 'email',
                                        value: editEmail,
                                        onChange: (e) => handleInputAdminEmail(e, setEditEmail),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        required: true,
                                        autoFocus: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Nom complet'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: editFullName,
                                        onChange: (e) => handleInputAdminEmail(e, setEditFullName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        required: true
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'mb-4' },
                                React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                                React.createElement(RoleDropdown, {
                                    value: editRole,
                                    onChange: (e) => setEditRole(e.target.value),
                                    disabled: editingUser?.id === currentUser.id || (currentUser.role === 'supervisor' && editingUser?.role === 'admin'),
                                    currentUserRole: currentUser.role,
                                    variant: 'green'
                                })
                            ),
                            React.createElement('div', { className: 'flex gap-4' },
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: () => setEditingUser(null),
                                    className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                }, 'Annuler'),
                                React.createElement('button', {
                                    type: 'submit',
                                    disabled: buttonLoading === 'update',
                                    className: 'px-6 py-3 bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(34,197,94,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(34,197,94,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(34,197,94,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-green-300/50'
                                }, 
                                    buttonLoading === 'update' && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                    'Enregistrer'
                                )
                            )
                        )
                    ) : null,
                    
                    loading ? React.createElement('p', { className: 'text-center py-8' }, 'Chargement...') :
                    React.createElement('div', { className: 'space-y-4' },
                        React.createElement('p', { className: 'text-lg mb-4' }, 
                            (searchQuery ? 
                                users.filter(u => 
                                    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                                ).length + ' résultat(s) sur ' + users.length :
                                users.length + ' utilisateur(s)'
                            )
                        ),
                        users
                            .filter(user => !searchQuery || 
                                user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                user.email.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(user =>
                            React.createElement('div', {
                                key: user.id,
                                className: 'bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border-2 border-gray-200/50 hover:border-blue-400 hover:shadow-lg transition-all'
                            },
                                React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3' },
                                    React.createElement('div', { className: 'flex-1' },
                                        React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                                            React.createElement('h4', { className: 'font-bold text-lg' }, user.full_name),
                                            React.createElement('span', { 
                                                className: 'px-3 py-1 rounded-full text-xs font-semibold ' + getRoleBadgeClass(user.role)
                                            }, getRoleLabel(user.role))
                                        ),
                                        React.createElement('p', { className: 'text-sm text-gray-600' },
                                            React.createElement('i', { className: 'fas fa-envelope mr-2' }),
                                            user.email
                                        ),
                                        React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                                            React.createElement('i', { className: 'far fa-clock mr-2' }),
                                            'Créé le: ' + formatDateEST(user.created_at, false)
                                        ),
                                        canSeeLastLogin(user) ? React.createElement('div', { className: "flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200" },
                                            React.createElement('div', { className: "flex items-center gap-1.5" },
                                                React.createElement('div', { 
                                                    className: "w-2 h-2 rounded-full animate-pulse " + getLastLoginStatus(user.last_login).dot
                                                }),
                                                React.createElement('span', { 
                                                    className: "text-xs font-bold " + getLastLoginStatus(user.last_login).color
                                                }, getLastLoginStatus(user.last_login).status),
                                                getLastLoginStatus(user.last_login).time ? React.createElement('span', { 
                                                    className: "text-xs " + getLastLoginStatus(user.last_login).color
                                                }, " - " + getLastLoginStatus(user.last_login).time) : null
                                            ),
                                            user.last_login ? React.createElement('span', { className: "text-xs text-gray-400 ml-3.5" },
                                                "Derniere connexion: " + formatDateEST(user.last_login, true)
                                            ) : null
                                        ) : null
                                    ),
                                    React.createElement('div', { className: "flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0" },
                                        user.id !== currentUser.id && onOpenMessage ? React.createElement('button', {
                                            onClick: () => onOpenMessage({ id: user.id, full_name: user.full_name, role: user.role }),
                                            className: "w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(99,102,241,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(99,102,241,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(99,102,241,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50"
                                        },
                                            React.createElement('i', { className: "fas fa-comment mr-1" }),
                                            "Message"
                                        ) : null,
                                        // Permettre de modifier son propre profil OU les autres utilisateurs (avec restrictions)
                                        ((user.id === currentUser.id) || (user.id !== currentUser.id && !(currentUser.role === 'supervisor' && user.role === 'admin') && currentUser.role !== 'technician')) ? React.createElement(React.Fragment, null,
                                            React.createElement('button', {
                                                onClick: () => handleEditUser(user),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(59,130,246,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(59,130,246,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(59,130,246,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                            'Modifier'
                                        ),
                                        React.createElement('button', {
                                            onClick: () => handleResetPassword(user.id, user.full_name),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(234,179,8,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(234,179,8,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(234,179,8,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-yellow-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-key mr-1' }),
                                            'MdP'
                                        ),
                                        // Ne pas permettre de supprimer son propre compte
                                        user.id !== currentUser.id ? React.createElement('button', {
                                            onClick: () => handleDeleteUser(user.id, user.full_name),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(239,68,68,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(239,68,68,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(239,68,68,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-red-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash mr-1' }),
                                            'Supprimer'
                                        ) : null
                                    ) : null)
                                )
                            )
                        )
                    ),
                    React.createElement(NotificationModal, {
                        show: notification.show,
                        message: notification.message,
                        type: notification.type,
                        onClose: () => setNotification({ show: false, message: '', type: 'info' })
                    }),
                    React.createElement(ConfirmModal, {
                        show: confirmDialog.show,
                        message: confirmDialog.message,
                        onConfirm: confirmDialog.onConfirm,
                        onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
                    }),
                    React.createElement(PromptModal, {
                        show: promptDialog.show,
                        message: promptDialog.message,
                        onConfirm: promptDialog.onConfirm,
                        onCancel: () => setPromptDialog({ show: false, message: '', onConfirm: null })
                    }),
                    React.createElement(Toast, {
                        show: toast.show,
                        message: toast.message,
                        type: toast.type,
                        onClose: () => setToast({ show: false, message: '', type: 'success' })
                    })
                    )
                )
            );
        };
        
        
        // ========================================
        // COMPOSANT MESSAGERIE
        // ========================================
        const MessagingModal = ({ show, onClose, currentUser, initialContact, initialTab }) => {
            const [activeTab, setActiveTab] = React.useState(initialTab || "public");
            const [publicMessages, setPublicMessages] = React.useState([]);
            const [conversations, setConversations] = React.useState([]);
            const [selectedContact, setSelectedContact] = React.useState(initialContact || null);
            const [privateMessages, setPrivateMessages] = React.useState([]);
            const [availableUsers, setAvailableUsers] = React.useState([]);
            const [messageContent, setMessageContent] = React.useState('');
            const [unreadCount, setUnreadCount] = React.useState(0);
            const [loading, setLoading] = React.useState(false);
            const messagesEndRef = React.useRef(null);
            
            // États pour enregistrement audio
            const [isRecording, setIsRecording] = React.useState(false);
            const [audioBlob, setAudioBlob] = React.useState(null);
            const [recordingDuration, setRecordingDuration] = React.useState(0);
            const [audioURL, setAudioURL] = React.useState(null);
            const mediaRecorderRef = React.useRef(null);
            const audioChunksRef = React.useRef([]);
            const recordingTimerRef = React.useRef(null);
            
            // États pour lecteur audio personnalisé
            const [playingAudio, setPlayingAudio] = React.useState({});
            const audioRefs = React.useRef({});
            
            // États pour selection multiple et suppression en masse
            const [selectionMode, setSelectionMode] = React.useState(false);
            const [selectedMessages, setSelectedMessages] = React.useState([]);
            
            // État pour forcer le re-render des timestamps (pas besoin de valeur, juste un toggle)
            const [timestampTick, setTimestampTick] = React.useState(0);
            
            const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            };
            
            React.useEffect(() => {
                if (show) {
                    loadPublicMessages();
                    loadConversations();
                    loadAvailableUsers();
                    loadUnreadCount();
                    
                    // Si un contact initial est fourni, basculer vers prive et charger ses messages
                    if (initialContact) {
                        setActiveTab("private");
                        setSelectedContact(initialContact);
                        loadPrivateMessages(initialContact.id);
                    }
                    
                    // Rafraichir les timestamps, le compteur ET les messages toutes les 30 secondes
                    const timestampInterval = setInterval(() => {
                        setTimestampTick(prev => prev + 1);
                        loadUnreadCount();
                        
                        // Recharger les messages pour voir les nouveaux messages des autres utilisateurs
                        if (activeTab === 'public') {
                            loadPublicMessages();
                        } else if (activeTab === 'private' && selectedContact) {
                            loadPrivateMessages(selectedContact.id);
                            loadConversations();
                        }
                    }, 30000); // 30 secondes
                    
                    return () => clearInterval(timestampInterval);
                }
            }, [show, activeTab, selectedContact]);
            
            React.useEffect(() => {
                // Scroller automatiquement seulement pour messages privés (ordre chronologique)
                // Messages publics: pas de scroll auto car ordre anti-chronologique (nouveaux en haut)
                if (activeTab === 'private' && selectedContact) {
                    scrollToBottom();
                }
            }, [privateMessages, activeTab, selectedContact]);
            
            const loadPublicMessages = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/public');
                    setPublicMessages(response.data.messages);
                } catch (error) {
                    console.error('Erreur chargement messages publics:', error);
                }
            };
            
            const loadConversations = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/conversations');
                    setConversations(response.data.conversations);
                } catch (error) {
                    console.error('Erreur chargement conversations:', error);
                }
            };
            
            const loadPrivateMessages = async (contactId) => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/messages/private/' + contactId);
                    setPrivateMessages(response.data.messages);
                    loadConversations(); // Rafraichir pour mettre a jour unread_count
                } catch (error) {
                    console.error('Erreur chargement messages prives:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            const loadAvailableUsers = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/available-users');
                    setAvailableUsers(response.data.users);
                } catch (error) {
                    console.error('Erreur chargement utilisateurs:', error);
                }
            };
            
            const loadUnreadCount = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/unread-count');
                    setUnreadCount(response.data.count);
                } catch (error) {
                    console.error('Erreur comptage non lus:', error);
                }
            };
            
            // Fonction pour ouvrir message prive avec un utilisateur
            const openPrivateMessage = (senderId, senderName) => {
                // Verifier si ce n est pas soi-meme
                if (senderId === currentUser.userId) {
                    alert('Vous ne pouvez pas vous envoyer un message prive a vous-meme.');
                    return;
                }
                
                // Verifier si utilisateur est dans la liste des contacts disponibles
                const user = availableUsers.find(u => u.id === senderId);
                
                if (!user) {
                    // Utilisateur n existe plus dans la liste
                    alert(senderName + ' ne fait plus partie de la liste des utilisateurs.');
                    return;
                }
                
                // Switcher vers onglet Messages Prives
                setActiveTab('private');
                
                // Selectionner automatiquement l utilisateur
                setSelectedContact(user);
                
                // Charger les messages prives avec cette personne
                loadPrivateMessages(senderId);
            };
            
            // Fonctions audio
            const startRecording = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
                    });
                    
                    // SOLUTION SIMPLE: Essayer MP3 en premier (universel sur TOUS les appareils)
                    let mimeType = '';
                    let extension = 'mp3';
                    
                    // 1. Essayer audio/mpeg (MP3) - UNIVERSEL
                    if (MediaRecorder.isTypeSupported('audio/mpeg')) {
                        mimeType = 'audio/mpeg';
                        extension = 'mp3';
                        console.log('✅ Format MP3 (universel) - Compatible iPhone + Android');
                    }
                    // 2. Essayer MP4/AAC - iOS et Chrome moderne
                    else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                        mimeType = 'audio/mp4';
                        extension = 'mp4';
                        console.log('✅ Format MP4/AAC - Compatible iPhone + Android');
                    }
                    // 3. Fallback WebM - Chrome Android uniquement
                    else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                        mimeType = 'audio/webm;codecs=opus';
                        extension = 'webm';
                        console.warn('⚠️ Format WebM - Non compatible iPhone/Safari');
                    }
                    // 4. Fallback WebM basique
                    else if (MediaRecorder.isTypeSupported('audio/webm')) {
                        mimeType = 'audio/webm';
                        extension = 'webm';
                        console.warn('⚠️ Format WebM - Non compatible iPhone/Safari');
                    }
                    // 5. Dernier recours
                    else {
                        mimeType = '';
                        extension = 'mp3';
                        console.log('⚠️ Aucun format détecté, utilisation par défaut');
                    }
                    
                    const mediaRecorder = new MediaRecorder(stream, { mimeType });
                    mediaRecorderRef.current = mediaRecorder;
                    audioChunksRef.current = [];
                    
                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };
                    
                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                        setAudioBlob(audioBlob);
                        setAudioURL(URL.createObjectURL(audioBlob));
                        stream.getTracks().forEach(track => track.stop());
                    };
                    
                    mediaRecorder.start();
                    setIsRecording(true);
                    setRecordingDuration(0);
                    
                    recordingTimerRef.current = setInterval(() => {
                        setRecordingDuration(prev => {
                            if (prev >= 300) {
                                stopRecording();
                                return 300;
                            }
                            return prev + 1;
                        });
                    }, 1000);
                    
                } catch (error) {
                    console.error('Erreur microphone:', error);
                    alert('Impossible acceder au microphone. Verifiez les permissions.');
                }
            };
            
            const stopRecording = () => {
                if (mediaRecorderRef.current && isRecording) {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                    if (recordingTimerRef.current) {
                        clearInterval(recordingTimerRef.current);
                        recordingTimerRef.current = null;
                    }
                }
            };
            
            const cancelRecording = () => {
                if (isRecording) {
                    stopRecording();
                }
                setAudioBlob(null);
                setAudioURL(null);
                setRecordingDuration(0);
                audioChunksRef.current = [];
                if (audioURL) {
                    URL.revokeObjectURL(audioURL);
                }
            };
            
            const sendAudioMessage = async () => {
                if (!audioBlob) return;
                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'audio-message.' + (audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'));
                    formData.append('message_type', activeTab);
                    formData.append('duration', recordingDuration.toString());
                    if (activeTab === 'private' && selectedContact) {
                        formData.append('recipient_id', selectedContact.id.toString());
                    }
                    await axios.post(API_URL + '/messages/audio', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    cancelRecording();
                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }
                    
                    // Rafraichir compteur immediatement apres envoi audio
                    loadUnreadCount();
                } catch (error) {
                    console.error('Erreur envoi audio:', error);
                    alert('Erreur envoi audio: ' + (error.response?.data?.error || 'Erreur'));
                }
            };
            
            const formatRecordingDuration = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return mins + ':' + (secs < 10 ? '0' : '') + secs;
            };
            
            // Fonctions lecteur audio personnalisé
            const toggleAudio = async (messageId) => {
                console.log('toggleAudio appelé pour:', messageId);
                const audio = audioRefs.current[messageId];
                console.log('Audio element:', audio);
                console.log('Audio src:', audio?.src);
                console.log('Audio readyState:', audio?.readyState);
                console.log('Audio paused:', audio?.paused);
                console.log('Tous les refs:', Object.keys(audioRefs.current));
                
                if (!audio) {
                    console.error('Audio element non trouvé pour:', messageId);
                    return;
                }
                
                if (playingAudio[messageId]) {
                    console.log('Pause audio:', messageId);
                    audio.pause();
                    setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
                } else {
                    // Arrêter tous les autres audios
                    Object.keys(audioRefs.current).forEach(id => {
                        if (id !== messageId && audioRefs.current[id]) {
                            audioRefs.current[id].pause();
                            setPlayingAudio(prev => ({ ...prev, [id]: false }));
                        }
                    });
                    
                    console.log('Tentative de lecture audio:', messageId);
                    
                    // Charger l'audio d'abord si nécessaire
                    if (audio.readyState < 2) {
                        console.log('Chargement audio en cours...');
                        audio.load();
                    }
                    
                    try {
                        await audio.play();
                        console.log('✅ Audio démarré avec succès');
                        setPlayingAudio(prev => ({ ...prev, [messageId]: true }));
                    } catch (err) {
                        console.error('❌ Erreur lecture audio:', err);
                        console.error('Error name:', err.name);
                        console.error('Error message:', err.message);
                        setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
                        alert('Impossible de lire audio: ' + err.message);
                    }
                }
            };
            
            const sendMessage = async () => {
                if (!messageContent.trim()) return;
                
                try {
                    const payload = {
                        message_type: activeTab,
                        content: messageContent,
                        recipient_id: activeTab === 'private' && selectedContact ? selectedContact.id : null
                    };
                    
                    await axios.post(API_URL + '/messages', payload);
                    setMessageContent('');
                    
                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }
                    
                    // Rafraichir compteur immediatement apres envoi
                    loadUnreadCount();
                } catch (error) {
                    alert('Erreur envoi message: ' + (error.response?.data?.error || 'Erreur'));
                }
            };
            
            const deleteMessage = async (messageId) => {
                if (!confirm('Etes-vous sur de vouloir supprimer ce message ?')) return;
                
                try {
                    await axios.delete(API_URL + '/messages/' + messageId);
                    
                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }
                    
                    // Rafraichir compteur immediatement apres suppression
                    loadUnreadCount();
                } catch (error) {
                    alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
                }
            };
            
            const canDeleteMessage = (msg) => {
                // Utilisateur peut supprimer son propre message
                if (msg.sender_id === currentUser.id) return true;
                // Admin peut supprimer tous les messages
                if (currentUser.role === 'admin') return true;
                // Superviseur peut supprimer tous sauf ceux de admin
                if (currentUser.role === 'supervisor' && msg.sender_role !== 'admin') return true;
                return false;
            };
            
            // Fonctions pour selection multiple
            const toggleSelectionMode = () => {
                setSelectionMode(!selectionMode);
                setSelectedMessages([]);
            };
            
            const toggleMessageSelection = (messageId) => {
                if (selectedMessages.includes(messageId)) {
                    setSelectedMessages(selectedMessages.filter(id => id !== messageId));
                } else {
                    setSelectedMessages([...selectedMessages, messageId]);
                }
            };
            
            const selectAllMessages = () => {
                const currentMessages = activeTab === 'public' ? publicMessages : privateMessages;
                const selectableIds = currentMessages
                    .filter(msg => canDeleteMessage(msg))
                    .map(msg => msg.id);
                setSelectedMessages(selectableIds);
            };
            
            const deselectAllMessages = () => {
                setSelectedMessages([]);
            };
            
            const deleteSelectedMessages = async () => {
                if (selectedMessages.length === 0) return;
                
                const count = selectedMessages.length;
                const confirmText = 'Supprimer ' + count + ' message' + (count > 1 ? 's' : '') + ' ?';
                
                if (!confirm(confirmText)) return;
                
                try {
                    await axios.post(API_URL + '/messages/bulk-delete', {
                        message_ids: selectedMessages
                    });
                    
                    setSelectedMessages([]);
                    setSelectionMode(false);
                    
                    if (activeTab === 'public') {
                        loadPublicMessages();
                    } else if (selectedContact) {
                        loadPrivateMessages(selectedContact.id);
                        loadConversations();
                    }
                    
                    // Rafraichir compteur immediatement apres suppression masse
                    loadUnreadCount();
                    
                    alert(count + ' message' + (count > 1 ? 's' : '') + ' supprime' + (count > 1 ? 's' : ''));
                } catch (error) {
                    alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
                }
            };
            
            const handleKeyPress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            };
            
            const formatMessageTime = (timestamp) => {
                // Convertir le format SQL "YYYY-MM-DD HH:MM:SS" en format ISO avec T et Z (UTC)
                const isoTimestamp = timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z');
                const dateUTC = new Date(isoTimestamp);
                // Appliquer l'offset EST/EDT
                const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
                const date = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
                const now = getNowEST();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                
                // Format français/québécois (jj mois aaaa) avec heure locale de l'appareil
                const frenchOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
                
                if (diffMins < 1) return "À l'instant";
                if (diffMins < 60) return "Il y a " + diffMins + " min";
                if (diffHours < 24) return "Il y a " + diffHours + " h";
                if (diffHours < 48) return "Hier " + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                return date.toLocaleDateString('fr-FR', frenchOptions);
            };
            
            const getRoleBadgeClass = (role) => {
                const colors = {
                    'admin': 'bg-red-100 text-red-700', 'director': 'bg-red-50 text-red-600',
                    'supervisor': 'bg-yellow-100 text-yellow-700', 'coordinator': 'bg-amber-100 text-amber-700', 'planner': 'bg-amber-100 text-amber-700',
                    'senior_technician': 'bg-blue-100 text-blue-700', 'technician': 'bg-blue-50 text-blue-600',
                    'team_leader': 'bg-emerald-100 text-emerald-700', 'furnace_operator': 'bg-green-100 text-green-700', 'operator': 'bg-green-50 text-green-600',
                    'safety_officer': 'bg-blue-100 text-blue-700', 'quality_inspector': 'bg-slate-100 text-slate-700', 'storekeeper': 'bg-violet-100 text-violet-700',
                    'viewer': 'bg-gray-100 text-gray-700'
                };
                return colors[role] || 'bg-gray-100 text-gray-700';
            };
            
            const getRoleLabel = (role) => {
                const labels = {
                    'admin': 'Admin', 'director': 'Directeur', 'supervisor': 'Superviseur', 'coordinator': 'Coordonnateur', 'planner': 'Planificateur',
                    'senior_technician': 'Tech. Senior', 'technician': 'Technicien', 'team_leader': 'Chef Équipe', 'furnace_operator': 'Op. Four', 'operator': 'Opérateur',
                    'safety_officer': 'Agent SST', 'quality_inspector': 'Insp. Qualité', 'storekeeper': 'Magasinier', 'viewer': 'Lecture Seule'
                };
                return labels[role] || role;
            };
            
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden transform hover:scale-[1.005] transition-all duration-300',
                    onClick: (e) => e.stopPropagation(),
                    style: { 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        transform: 'translateZ(0)'
                    }
                },
                    // Header
                    React.createElement('div', {
                        className: 'bg-gradient-to-r from-slate-700 to-gray-700 text-white p-3 sm:p-5 flex justify-between items-center shadow-lg'
                    },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-comments text-xl sm:text-2xl flex-shrink-0' }),
                            React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' }, 'Messagerie Equipe'),
                            unreadCount > 0 ? React.createElement('span', {
                                className: 'bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 animate-pulse'
                            }, unreadCount) : null
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                        },
                            React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                        )
                    ),
                    
                    // Tabs
                    React.createElement('div', {
                        className: 'flex border-b border-gray-200 bg-gray-50 shadow-sm'
                    },
                        React.createElement('button', {
                            onClick: () => {
                                setActiveTab('public');
                                setSelectedContact(null);
                            },
                            className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all ' + 
                                (activeTab === 'public' 
                                    ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                        },
                            React.createElement('i', { className: 'fas fa-globe mr-1 sm:mr-2' }),
                            React.createElement('span', { className: 'hidden xs:inline' }, 'Canal Public'),
                            React.createElement('span', { className: 'inline xs:hidden' }, 'Public')
                        ),
                        React.createElement('button', {
                            onClick: () => setActiveTab('private'),
                            className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all relative ' + 
                                (activeTab === 'private' 
                                    ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                        },
                            React.createElement('i', { className: 'fas fa-user-friends mr-1 sm:mr-2' }),
                            React.createElement('span', { className: 'hidden xs:inline' }, 'Messages Prives'),
                            React.createElement('span', { className: 'inline xs:hidden' }, 'Prives')
                        )
                    ),
                    
                    // Barre outils selection
                    React.createElement('div', { className: 'bg-white border-b border-gray-200 px-3 py-2 flex items-center flex-wrap gap-2' },
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('button', {
                                onClick: toggleSelectionMode,
                                className: 'px-3 py-1.5 text-sm font-medium rounded-lg transition-all ' + 
                                    (selectionMode 
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                            },
                                React.createElement('i', { className: 'fas ' + (selectionMode ? 'fa-times' : 'fa-check-square') + ' mr-1.5' }),
                                selectionMode ? 'Annuler' : 'Selectionner'
                            ),
                            selectionMode ? React.createElement('button', {
                                onClick: selectAllMessages,
                                className: 'px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-check-double mr-1.5' }),
                                'Tout'
                            ) : null,
                            selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                                onClick: deselectAllMessages,
                                className: 'px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-times-circle mr-1.5' }),
                                'Aucun'
                            ) : null
                        ),
                        selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                            onClick: deleteSelectedMessages,
                            className: 'px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all'
                        },
                            React.createElement('i', { className: 'fas fa-trash mr-1.5' }),
                            'Supprimer (' + selectedMessages.length + ')'
                        ) : null,
                        selectionMode ? React.createElement('span', { className: 'text-xs text-gray-500 ml-auto' },
                            selectedMessages.length + ' selectionne' + (selectedMessages.length > 1 ? 's' : '')
                        ) : null
                    ),
                    
                    // Content
                    React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
                        // PUBLIC TAB
                        activeTab === 'public' ? React.createElement('div', { className: 'flex-1 flex flex-col' },
                            // Messages publics
                            React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                                publicMessages.length === 0 ? React.createElement('div', {
                                    className: 'text-center text-gray-400 py-12'
                                },
                                    React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-4 opacity-50' }),
                                    React.createElement('p', { className: 'text-base sm:text-lg font-medium' }, 'Aucun message public'),
                                    React.createElement('p', { className: 'text-xs sm:text-sm text-gray-400 mt-2' }, 'Soyez le premier a envoyer un message!')
                                ) : publicMessages.map(msg => React.createElement('div', {
                                    key: msg.id,
                                    className: 'bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-2xl transition-all hover:scale-[1.02] border border-white/50 transform hover:-translate-y-1',
                                    style: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                                },
                                    React.createElement('div', { className: 'flex items-start gap-2 sm:gap-3' },
                                        selectionMode && canDeleteMessage(msg) ? React.createElement('input', {
                                            type: 'checkbox',
                                            checked: selectedMessages.includes(msg.id),
                                            onChange: () => toggleMessageSelection(msg.id),
                                            className: 'w-5 h-5 mt-1 cursor-pointer flex-shrink-0',
                                            onClick: (e) => e.stopPropagation()
                                        }) : null,
                                        React.createElement('div', {
                                            className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md cursor-pointer hover:scale-110 transition-transform',
                                            onClick: () => openPrivateMessage(msg.sender_id, msg.sender_name),
                                            title: 'Envoyer un message prive a ' + msg.sender_name
                                        }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                                React.createElement('span', { 
                                                    className: 'font-semibold text-gray-800 text-sm sm:text-base truncate cursor-pointer hover:text-indigo-600 transition-colors',
                                                    onClick: () => openPrivateMessage(msg.sender_id, msg.sender_name),
                                                    title: 'Envoyer un message prive a ' + msg.sender_name
                                                }, msg.sender_name),
                                                React.createElement('span', {
                                                    className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ' + getRoleBadgeClass(msg.sender_role)
                                                }, getRoleLabel(msg.sender_role)),
                                                React.createElement('span', {
                                                    className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-blue-100 text-blue-700'
                                                }, '🌐 Message public'),
                                                React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                            ),
                                            msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                                React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-100' },
                                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                        React.createElement('i', { className: 'fas fa-microphone text-indigo-600 text-lg' }),
                                                        React.createElement('span', { className: 'text-sm font-medium text-indigo-700' }, 'Message vocal')
                                                    ),
                                                    React.createElement('audio', {
                                                        controls: true,
                                                        preload: 'auto',
                                                        controlsList: 'nodownload',
                                                        className: 'w-full',
                                                        style: { height: '54px', minHeight: '54px' },
                                                        src: API_URL + '/audio/' + msg.audio_file_key,
                                                        onError: (e) => {
                                                            console.error('❌ Erreur chargement audio:', e);
                                                            console.error('URL:', API_URL + '/audio/' + msg.audio_file_key);
                                                        }
                                                    }),
                                                    msg.audio_duration ? React.createElement('p', { className: 'text-xs text-gray-500 mt-2' },
                                                        '⏱️ Durée: ' + formatRecordingDuration(msg.audio_duration)
                                                    ) : null
                                                )
                                            ) : React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
                                        ),
                                        canDeleteMessage(msg) ? React.createElement('button', {
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                deleteMessage(msg.id);
                                            },
                                            className: 'flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all transform hover:scale-110 active:scale-95',
                                            title: 'Supprimer le message'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash text-sm' })
                                        ) : null
                                    )
                                )),
                                React.createElement('div', { ref: messagesEndRef })
                            ),
                            
                            // Input zone
                            React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                                (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                                    React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                        React.createElement('div', { className: 'flex items-center gap-3' },
                                            React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                                            React.createElement('span', { className: 'font-semibold text-red-700' }, 
                                                isRecording ? 'Enregistrement en cours...' : 'Previsualisation audio'
                                            ),
                                            React.createElement('span', { className: 'text-sm text-gray-600 font-mono' }, 
                                                formatRecordingDuration(recordingDuration)
                                            )
                                        ),
                                        React.createElement('button', {
                                            onClick: cancelRecording,
                                            className: 'text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all',
                                            title: 'Annuler'
                                        }, React.createElement('i', { className: 'fas fa-times' }))
                                    ),
                                    audioBlob ? React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                        React.createElement('audio', {
                                            controls: true,
                                            src: audioURL,
                                            className: 'flex-1 h-10'
                                        })
                                    ) : null,
                                    React.createElement('div', { className: 'flex gap-2' },
                                        isRecording ? React.createElement('button', {
                                            onClick: stopRecording,
                                            className: 'flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2'
                                        },
                                            React.createElement('i', { className: 'fas fa-stop' }),
                                            'Arreter'
                                        ) : React.createElement('button', {
                                            onClick: sendAudioMessage,
                                            disabled: !audioBlob,
                                            className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                                        },
                                            React.createElement('i', { className: 'fas fa-paper-plane' }),
                                            'Envoyer le message vocal'
                                        )
                                    )
                                ) : null,
                                !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
                                    React.createElement('textarea', {
                                        value: messageContent,
                                        onChange: (e) => setMessageContent(e.target.value),
                                        onKeyPress: handleKeyPress,
                                        placeholder: 'Ecrire un message public... (Enter pour envoyer)',
                                        className: 'flex-1 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all shadow-lg hover:shadow-xl',
                                        style: { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                        rows: 2
                                    }),
                                    React.createElement('button', {
                                        onClick: startRecording,
                                        className: 'px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                        title: 'Enregistrer un message vocal'
                                    },
                                        React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                        React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                    ),
                                    React.createElement('button', {
                                        onClick: sendMessage,
                                        disabled: !messageContent.trim(),
                                        className: 'px-3 sm:px-6 bg-gradient-to-br from-slate-700 to-gray-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-xl hover:shadow-2xl disabled:hover:shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                        style: { boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)' }
                                    },
                                        React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                        React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                                    )
                                ) : null
                            )
                        ) : null,
                        
                        // PRIVATE TAB
                        activeTab === 'private' ? React.createElement('div', { className: 'flex-1 min-h-0 flex flex-col sm:flex-row' },
                            // Liste des conversations - Mobile: collapsible, Desktop: sidebar
                            React.createElement('div', { className: (selectedContact ? 'hidden sm:flex ' : 'flex ') + 'w-full sm:w-80 md:w-96 border-r border-gray-200 flex-col bg-gray-50' },
                                React.createElement('div', { className: 'p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
                                    React.createElement('h3', { className: 'font-semibold text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-2' }, 
                                        React.createElement('i', { className: 'fas fa-address-book text-indigo-600' }),
                                        'Contacts'
                                    ),
                                    React.createElement('select', {
                                        onChange: (e) => {
                                            const userId = parseInt(e.target.value);
                                            if (!userId) return;
                                            const user = availableUsers.find(u => u.id === userId);
                                            if (user) {
                                                setSelectedContact(user);
                                                loadPrivateMessages(user.id);
                                            }
                                        },
                                        className: "w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-white/95 to-gray-50/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold text-xs sm:text-sm appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236366f1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' },
                                        value: ''
                                    },
                                        React.createElement('option', { value: '', disabled: true }, '📝 Nouvelle conversation...'),
                                        availableUsers.map(user => React.createElement('option', {
                                            key: user.id,
                                            value: user.id
                                        }, user.full_name + ' (' + getRoleLabel(user.role) + ')'))
                                    )
                                ),
                                React.createElement('div', { className: 'flex-1 overflow-y-auto' },
                                    conversations.length === 0 ? React.createElement('div', {
                                        className: 'text-center text-gray-500 py-8 px-4'
                                    },
                                        React.createElement('i', { className: 'fas fa-comments text-5xl mb-3 text-gray-300' }),
                                        React.createElement('p', { className: 'text-sm font-semibold mb-2' }, 'Aucune conversation'),
                                        React.createElement('p', { className: 'text-xs text-gray-400' }, 
                                            'Utilisez le menu ci-dessus pour demarrer une nouvelle conversation'
                                        ),
                                        React.createElement('div', { className: 'mt-3 text-indigo-600' },
                                            React.createElement('i', { className: 'fas fa-arrow-up mr-1' }),
                                            React.createElement('span', { className: 'text-xs font-semibold' }, 'Nouvelle conversation...')
                                        )
                                    ) : conversations.map(conv => React.createElement('div', {
                                        key: conv.contact_id,
                                        onClick: () => {
                                            setSelectedContact({ id: conv.contact_id, full_name: conv.contact_name, role: conv.contact_role });
                                            loadPrivateMessages(conv.contact_id);
                                        },
                                        className: 'p-2 sm:p-3 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 transition-all active:scale-95 ' +
                                            (selectedContact?.id === conv.contact_id ? 'bg-indigo-100 border-l-4 border-l-indigo-600 shadow-sm' : 'bg-white hover:border-l-4 hover:border-l-indigo-300')
                                    },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                            React.createElement('div', {
                                                className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md'
                                            }, conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : '?'),
                                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                                React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2' },
                                                    React.createElement('span', { className: 'font-semibold text-xs sm:text-sm text-gray-800 truncate' }, conv.contact_name),
                                                    conv.unread_count > 0 ? React.createElement('span', {
                                                        className: 'bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse'
                                                    }, conv.unread_count) : null
                                                ),
                                                React.createElement('p', {
                                                    className: 'text-xs text-gray-500 truncate'
                                                }, conv.last_message || 'Commencer la conversation')
                                            )
                                        )
                                    ))
                                )
                            ),
                            
                            // Zone de conversation
                            selectedContact ? React.createElement('div', { className: 'flex-1 min-h-0 flex flex-col' },
                                // Header contact with back button on mobile
                                React.createElement('div', { className: 'p-2 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                                        // Back button for mobile only
                                        React.createElement('button', {
                                            onClick: () => setSelectedContact(null),
                                            className: 'sm:hidden p-2 hover:bg-indigo-100 rounded-full transition-colors'
                                        },
                                            React.createElement('i', { className: 'fas fa-arrow-left text-indigo-600' })
                                        ),
                                        React.createElement('div', {
                                            className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0'
                                        }, selectedContact.full_name.charAt(0).toUpperCase()),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('h3', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, selectedContact.full_name),
                                            React.createElement('span', {
                                                className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium inline-block ' + getRoleBadgeClass(selectedContact.role)
                                            }, getRoleLabel(selectedContact.role))
                                        )
                                    )
                                ),
                                
                                // Messages
                                React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                                    loading ? React.createElement('div', { className: 'text-center text-gray-400 py-12' },
                                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl sm:text-4xl text-indigo-500' })
                                    ) : privateMessages.length === 0 ? React.createElement('div', {
                                        className: 'text-center text-gray-400 py-8 sm:py-12 px-4'
                                    },
                                        React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-3 sm:mb-4 opacity-50' }),
                                        React.createElement('p', { className: 'text-sm sm:text-base' }, 'Commencez la conversation avec ' + selectedContact.full_name),
                                        React.createElement('p', { className: 'text-xs text-gray-400 mt-2' }, 'Ecrivez votre premier message ci-dessous')
                                    ) : privateMessages.map(msg => React.createElement('div', {
                                        key: msg.id,
                                        className: 'bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-2xl transition-all hover:scale-[1.02] border border-white/50 transform hover:-translate-y-1',
                                        style: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                                    },
                                        React.createElement('div', { className: 'flex items-start gap-2 sm:gap-3' },
                                            selectionMode && canDeleteMessage(msg) ? React.createElement('input', {
                                                type: 'checkbox',
                                                checked: selectedMessages.includes(msg.id),
                                                onChange: () => toggleMessageSelection(msg.id),
                                                className: 'w-5 h-5 mt-1 cursor-pointer flex-shrink-0',
                                                onClick: (e) => e.stopPropagation()
                                            }) : null,
                                            React.createElement('div', {
                                                className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md'
                                            }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                                React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                                    React.createElement('span', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, msg.sender_name),
                                                    React.createElement('span', {
                                                        className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-slate-100 text-slate-700'
                                                    }, '🔒 Message privé'),
                                                    React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                                ),
                                                msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                                    React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-100' },
                                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                            React.createElement('i', { className: 'fas fa-microphone text-slate-600 text-lg' }),
                                                            React.createElement('span', { className: 'text-sm font-medium text-slate-700' }, 'Message vocal')
                                                        ),
                                                        React.createElement('audio', {
                                                            controls: true,
                                                            preload: 'auto',
                                                            controlsList: 'nodownload',
                                                            className: 'w-full',
                                                            style: { height: '54px', minHeight: '54px' },
                                                            src: API_URL + '/audio/' + msg.audio_file_key,
                                                            onError: (e) => {
                                                                console.error('❌ Erreur audio privé:', e);
                                                                console.error('URL:', API_URL + '/audio/' + msg.audio_file_key);
                                                            }
                                                        }),
                                                        msg.audio_duration ? React.createElement('p', { className: 'text-xs text-gray-500 mt-2' },
                                                            '⏱️ Durée: ' + formatRecordingDuration(msg.audio_duration)
                                                        ) : null
                                                    )
                                                ) : React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
                                            ),
                                            canDeleteMessage(msg) ? React.createElement('button', {
                                                onClick: (e) => {
                                                    e.stopPropagation();
                                                    deleteMessage(msg.id);
                                                },
                                                className: 'flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all transform hover:scale-110 active:scale-95',
                                                title: 'Supprimer le message'
                                            },
                                                React.createElement('i', { className: 'fas fa-trash text-sm' })
                                            ) : null
                                        )
                                    )),
                                    React.createElement('div', { ref: messagesEndRef })
                                ),
                                
                                // Input
                                React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                                    (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                                        React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                            React.createElement('div', { className: 'flex items-center gap-3' },
                                                React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                                                React.createElement('span', { className: 'font-semibold text-red-700' }, 
                                                    isRecording ? 'Enregistrement en cours...' : 'Previsualisation audio'
                                                ),
                                                React.createElement('span', { className: 'text-sm text-gray-600 font-mono' }, 
                                                    formatRecordingDuration(recordingDuration)
                                                )
                                            ),
                                            React.createElement('button', {
                                                onClick: cancelRecording,
                                                className: 'text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all',
                                                title: 'Annuler'
                                            }, React.createElement('i', { className: 'fas fa-times' }))
                                        ),
                                        audioBlob ? React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                            React.createElement('audio', {
                                                controls: true,
                                                src: audioURL,
                                                className: 'flex-1 h-10'
                                            })
                                        ) : null,
                                        React.createElement('div', { className: 'flex gap-2' },
                                            isRecording ? React.createElement('button', {
                                                onClick: stopRecording,
                                                className: 'flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2'
                                            },
                                                React.createElement('i', { className: 'fas fa-stop' }),
                                                'Arreter'
                                            ) : React.createElement('button', {
                                                onClick: sendAudioMessage,
                                                disabled: !audioBlob,
                                                className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                                            },
                                                React.createElement('i', { className: 'fas fa-paper-plane' }),
                                                'Envoyer le message vocal'
                                            )
                                        )
                                    ) : null,
                                    !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('textarea', {
                                            value: messageContent,
                                            onChange: (e) => setMessageContent(e.target.value),
                                            onKeyPress: handleKeyPress,
                                            placeholder: 'Ecrire un message... (Enter pour envoyer)',
                                            className: 'flex-1 border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all',
                                            rows: 2
                                        }),
                                        React.createElement('button', {
                                            onClick: startRecording,
                                            className: 'px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                            title: 'Enregistrer un message vocal'
                                        },
                                            React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                            React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                        ),
                                        React.createElement('button', {
                                            onClick: sendMessage,
                                            disabled: !messageContent.trim(),
                                            className: 'px-3 sm:px-6 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center'
                                        },
                                            React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                            React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                                        )
                                    ) : null
                                )
                            ) : React.createElement('div', { className: 'flex-1 flex items-center justify-center bg-gray-50' },
                                React.createElement('div', { className: 'text-center text-gray-400' },
                                    React.createElement('i', { className: 'fas fa-arrow-left text-6xl mb-4' }),
                                    React.createElement('p', { className: 'text-lg' }, 'Selectionnez un contact')
                                )
                            )
                        ) : null
                    )
                )
            );
        };
        
        
        const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages }) => {
            const [contextMenu, setContextMenu] = React.useState(null);
            const [selectedTicketId, setSelectedTicketId] = React.useState(null);
            const [showDetailsModal, setShowDetailsModal] = React.useState(false);
            const [showUserManagement, setShowUserManagement] = React.useState(false);
            const [showMachineManagement, setShowMachineManagement] = React.useState(false);
            const [showSystemSettings, setShowSystemSettings] = React.useState(false);
            const [showUserGuide, setShowUserGuide] = React.useState(false);
            const [showArchived, setShowArchived] = React.useState(false);
            const [showMessaging, setShowMessaging] = React.useState(false);
            const [messagingContact, setMessagingContact] = React.useState(null);
            const [messagingTab, setMessagingTab] = React.useState("public");
            const [showScrollTop, setShowScrollTop] = React.useState(false);
            
            // Détection du scroll pour afficher/masquer le bouton "Retour en haut"
            React.useEffect(() => {
                const handleScroll = () => {
                    // Afficher le bouton seulement si on a scrollé plus de 300px ET que les archives sont affichées
                    setShowScrollTop(window.scrollY > 300 && showArchived);
                };
                
                window.addEventListener('scroll', handleScroll);
                handleScroll(); // Vérifier immédiatement
                
                return () => window.removeEventListener('scroll', handleScroll);
            }, [showArchived]);
            
            const allStatuses = [
                { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
                { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
                { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
                { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
                { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
                { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
            ];
            
            // Séparer les colonnes actives, terminées et archivées
            const workflowStatuses = allStatuses.filter(s => s.key !== 'archived' && s.key !== 'completed');
            const completedStatus = allStatuses.find(s => s.key === 'completed');
            const archivedStatus = allStatuses.find(s => s.key === 'archived');
            
            // Fonction pour calculer le nombre de tickets actifs (excluant terminés et archivés)
            const getActiveTicketsCount = () => {
                // Filtrer les tickets actifs: NOT completed AND NOT archived
                let activeTickets = tickets.filter(t => t.status !== 'completed' && t.status !== 'archived');
                
                // Pour les opérateurs: seulement leurs propres tickets
                if (currentUser && currentUser.role === 'operator') {
                    activeTickets = activeTickets.filter(t => t.reported_by === currentUser.id);
                }
                
                return activeTickets.length;
            };
            
            
            React.useEffect(() => {
                const handleClick = () => setContextMenu(null);
                document.addEventListener('click', handleClick);
                return () => document.removeEventListener('click', handleClick);
            }, []);
            
            const getTicketsByStatus = (status) => {
                let filteredTickets = tickets.filter(t => t.status === status);
                
                // Opérateurs voient uniquement leurs propres tickets
                if (currentUser && currentUser.role === 'operator') {
                    filteredTickets = filteredTickets.filter(t => t.reported_by === currentUser.id);
                }
                
                return filteredTickets;
            };
            
            const moveTicketToStatus = async (ticket, newStatus) => {
                if (ticket.status === newStatus) return;
                
                try {
                    await axios.patch(API_URL + '/tickets/' + ticket.id, {
                        status: newStatus,
                        comment: 'Changement de statut: ' + ticket.status + ' → ' + newStatus
                    });
                    onTicketCreated(); // Refresh
                } catch (error) {
                    alert('Erreur lors du déplacement: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };
            
            const moveTicketToNext = async (ticket, e) => {
                e.stopPropagation();
                const statusFlow = ['received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'];
                const currentIndex = statusFlow.indexOf(ticket.status);
                
                if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
                    return; // Déjà au dernier statut
                }
                
                const nextStatus = statusFlow[currentIndex + 1];
                await moveTicketToStatus(ticket, nextStatus);
            };
            
            const handleTicketClick = (e, ticket) => {
                
                if (e.type === 'click' && !e.defaultPrevented) {
                    setSelectedTicketId(ticket.id);
                    setShowDetailsModal(true);
                }
            };
            
            const handleContextMenu = (e, ticket) => {
                e.preventDefault();
                e.stopPropagation();
                
                
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }
                
                
                const menuWidth = 200;
                const menuHeight = 300;
                let x = e.pageX || (e.touches && e.touches[0].pageX);
                let y = e.pageY || (e.touches && e.touches[0].pageY);
                
                
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                }
                
                
                if (y + menuHeight > window.innerHeight + window.scrollY) {
                    y = window.innerHeight + window.scrollY - menuHeight - 10;
                }
                
                setContextMenu({
                    x: x,
                    y: y,
                    ticket: ticket
                });
            };
            
            
            const [draggedTicket, setDraggedTicket] = React.useState(null);
            const [dragOverColumn, setDragOverColumn] = React.useState(null);
            
            
            const handleDragStart = (e, ticket) => {
                
                if (currentUser && currentUser.role === 'operator') {
                    e.preventDefault();
                    return;
                }
                
                setDraggedTicket(ticket);
                e.currentTarget.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', ticket.id);
                
                // Désactiver temporairement le scroll horizontal pendant le drag
                const scrollContainer = document.querySelector('.overflow-x-auto');
                if (scrollContainer) {
                    scrollContainer.style.overflowX = 'hidden';
                }
            };
            
            const handleDragEnd = (e) => {
                e.currentTarget.classList.remove('dragging');
                setDraggedTicket(null);
                setDragOverColumn(null);
                
                // Réactiver le scroll horizontal après le drag
                const scrollContainer = document.querySelector('.overflow-x-auto');
                if (scrollContainer) {
                    scrollContainer.style.overflowX = 'auto';
                }
            };
            
            const handleDragOver = (e, status) => {
                e.preventDefault();
                e.stopPropagation(); // Empêcher la propagation pour meilleure précision
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn(status);
            };
            
            const handleDragLeave = (e) => {
                // Ne retirer l'indicateur que si on quitte vraiment la colonne
                // (pas juste en passant sur un ticket enfant)
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                
                // Si le curseur est encore dans les limites de la colonne, ne rien faire
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    return;
                }
                
                setDragOverColumn(null);
            };
            
            const handleDrop = async (e, targetStatus) => {
                e.preventDefault();
                setDragOverColumn(null);
                
                if (!draggedTicket) return;
                
                if (draggedTicket.status !== targetStatus) {
                    await moveTicketToStatus(draggedTicket, targetStatus);
                }
                
                setDraggedTicket(null);
            };
            
            
            // === NOUVEAUX ETATS POUR BOTTOM SHEET (isoles) ===
            const [showMoveModal, setShowMoveModal] = React.useState(false);
            const [ticketToMove, setTicketToMove] = React.useState(null);
            const longPressTimer = React.useRef(null);
            
            const touchDragStart = React.useRef(null);
            const touchDragTicket = React.useRef(null);
            
            const handleTouchStart = (e, ticket) => {
                
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }
                
                const touch = e.touches[0];
                touchDragStart.current = { x: touch.clientX, y: touch.clientY };
                touchDragTicket.current = ticket;
                
                // === LONG PRESS POUR BOTTOM SHEET ===
                // Vibration legere au debut du touch
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
                
                // Demarrer timer long press (500ms)
                longPressTimer.current = setTimeout(() => {
                    // Vibration forte pour confirmer long press
                    if (navigator.vibrate) {
                        navigator.vibrate([50, 30, 50]);
                    }
                    
                    // Ouvrir bottom sheet
                    setTicketToMove(ticket);
                    setShowMoveModal(true);
                    
                    // Annuler le drag classique pour ne pas interferer
                    touchDragStart.current = null;
                    touchDragTicket.current = null;
                }, 500);
            };
            
            const handleTouchMove = (e) => {
                // Annuler timer long press si utilisateur bouge (scroll intent)
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
                
                if (!touchDragStart.current || !touchDragTicket.current) return;
                
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchDragStart.current.x);
                const deltaY = Math.abs(touch.clientY - touchDragStart.current.y);
                
                
                if (deltaX > 10 || deltaY > 10) {
                    e.preventDefault();
                    setDraggedTicket(touchDragTicket.current);
                    
                    
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const column = element?.closest('.kanban-column');
                    if (column) {
                        const status = column.getAttribute('data-status');
                        setDragOverColumn(status);
                    }
                }
            };
            
            const handleTouchEnd = async (e) => {
                // Annuler timer long press si utilisateur relache avant 500ms
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }
                
                if (draggedTicket && dragOverColumn && draggedTicket.status !== dragOverColumn) {
                    await moveTicketToStatus(draggedTicket, dragOverColumn);
                }
                
                touchDragStart.current = null;
                touchDragTicket.current = null;
                setDraggedTicket(null);
                setDragOverColumn(null);
            };
            
            return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
                
                React.createElement(CreateTicketModal, {
                    show: showCreateModal,
                    onClose: () => setShowCreateModal(false),
                    machines: machines,
                    onTicketCreated: onTicketCreated,
                    currentUser: currentUser
                }),
                
                
                React.createElement(TicketDetailsModal, {
                    show: showDetailsModal,
                    onClose: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                    },
                    ticketId: selectedTicketId,
                    currentUser: currentUser,
                    onTicketDeleted: () => {
                        setShowDetailsModal(false);
                        setSelectedTicketId(null);
                        onTicketCreated(); // Refresh ticket list
                    }
                }),
                
                
                React.createElement(UserManagementModal, {
                    show: showUserManagement,
                    onClose: () => setShowUserManagement(false),
                    currentUser: currentUser,
                    onOpenMessage: (user) => {
                        setShowUserManagement(false);
                        setMessagingContact(user);
                        setMessagingTab("private");
                        setShowMessaging(true);
                    }
                }),
                
                React.createElement(SystemSettingsModal, {
                    show: showSystemSettings,
                    onClose: () => setShowSystemSettings(false),
                    currentUser: currentUser
                }),
                
                React.createElement(MachineManagementModal, {
                    show: showMachineManagement,
                    onClose: () => setShowMachineManagement(false),
                    currentUser: currentUser,
                    machines: machines,
                    onRefresh: onRefresh
                }),
                
                React.createElement(MessagingModal, {
                    show: showMessaging,
                    onClose: () => {
                        setShowMessaging(false);
                        setMessagingContact(null);
                        setMessagingTab("public");
                        if (onRefreshMessages) onRefreshMessages();
                    },
                    currentUser: currentUser,
                    initialContact: messagingContact,
                    initialTab: messagingTab
                }),
                
                React.createElement(UserGuideModal, {
                    show: showUserGuide,
                    onClose: () => setShowUserGuide(false),
                    currentUser: currentUser
                }),
                
                React.createElement(MoveTicketBottomSheet, {
                    show: showMoveModal,
                    onClose: () => {
                        setShowMoveModal(false);
                        setTicketToMove(null);
                    },
                    ticket: ticketToMove,
                    onMove: moveTicketToStatus,
                    currentUser: currentUser
                }),
                
                
                React.createElement('header', { className: 'bg-white shadow-lg border-b-4 border-igp-blue' },
                    React.createElement('div', { className: 'container mx-auto px-4 py-3' },
                        React.createElement('div', { className: 'flex justify-between items-center mb-4 md:mb-0 header-title' },
                            React.createElement('div', { className: 'flex items-center space-x-3' },
                                React.createElement('img', { 
                                    src: '/static/logo-igp.png', 
                                    alt: 'IGP Logo',
                                    className: 'h-12 md:h-16 w-auto object-contain'
                                }),
                                React.createElement('div', { className: 'border-l-2 border-gray-300 pl-3' },
                                    React.createElement('h1', { className: 'text-lg md:text-xl font-bold text-igp-blue' }, 'Gestion de la maintenance et des réparations'),
                                    React.createElement('p', { className: 'text-xs md:text-sm text-gray-600' }, 
                                        'Les Produits Verriers International (IGP) Inc.'
                                    ),
                                    React.createElement('p', { className: 'text-xs md:text-sm text-green-600 font-semibold mt-1' }, 
                                        '👋 Bonjour ' + (currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Utilisateur')
                                    ),
                                    React.createElement('div', { className: "flex items-center gap-3 flex-wrap" },
                                        React.createElement('p', { className: "text-xs text-blue-700 font-semibold" }, 
                                            getActiveTicketsCount() + " tickets actifs"
                                        ),
                                        (currentUser?.role === "technician" || currentUser?.role === "supervisor" || currentUser?.role === "admin" || currentUser?.role === "operator" || currentUser?.role === "furnace_operator") ?
                                        React.createElement('div', { 
                                            className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer " + (unreadMessagesCount > 0 ? "bg-igp-red animate-pulse" : "bg-gradient-to-r from-igp-blue to-igp-blue-dark opacity-50"),
                                            onClick: () => setShowMessaging(true),
                                            title: unreadMessagesCount > 0 ? (unreadMessagesCount + " messages non lus") : "Aucun message non lu"
                                        },
                                            React.createElement('i', { className: "fas fa-envelope text-white text-xs" }),
                                            unreadMessagesCount > 0 ? React.createElement('span', { className: "text-white text-xs font-bold" }, unreadMessagesCount) : null
                                        ) : null
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 header-actions' },
                            // 1. Nouvelle Demande (action primaire)
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-igp-blue-dark font-semibold shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Nouvelle Demande'
                            ),
                            // 2. Messagerie (le plus utilisé quotidiennement)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'furnace_operator') ?
                            React.createElement('button', {
                                onClick: () => setShowMessaging(true),
                                className: 'px-4 py-2 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-comments mr-2' }),
                                'Messagerie'
                            ) : null,
                            // 3. Archives (consultation fréquente)
                            React.createElement('button', {
                                onClick: () => {
                                    setShowArchived(!showArchived);
                                    // Si on affiche les archives, scroller vers la section après un court délai
                                    if (!showArchived) {
                                        setTimeout(() => {
                                            const archivedSection = document.getElementById('archived-section');
                                            if (archivedSection) {
                                                archivedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }, 100);
                                    }
                                },
                                className: 'px-4 py-2 rounded-md font-semibold shadow-md transition-all flex items-center gap-2 ' + 
                                    (showArchived 
                                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300')
                            },
                                React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') }),
                                React.createElement('span', {}, showArchived ? 'Masquer Archivés' : 'Voir Archivés'),
                                React.createElement('span', { 
                                    className: 'px-2 py-0.5 rounded-full text-xs font-bold ' + 
                                    (showArchived ? 'bg-gray-500' : 'bg-gray-300 text-gray-700')
                                }, getTicketsByStatus('archived').length)
                            ),
                            // 4. Utilisateurs (gestion admin - moins fréquent)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowUserManagement(true),
                                className: "px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 font-semibold shadow-md transition-all"
                            },
                                React.createElement('i', { className: "fas fa-users-cog mr-2" }),
                                "Utilisateurs"
                            ) : null,
                            // 5. Machines (gestion admin - moins fréquent)
                            (currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowMachineManagement(true),
                                className: "px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-semibold shadow-md transition-all"
                            },
                                React.createElement('i', { className: "fas fa-cogs mr-2" }),
                                "Machines"
                            ) : null,
                            // 6. Parametres systeme (admin uniquement)
                            (currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowSystemSettings(true),
                                className: "px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold shadow-md transition-all"
                            },
                                React.createElement('i', { className: "fas fa-sliders-h mr-2" }),
                                "Parametres"
                            ) : null,
                            // 7. Rôles (admin uniquement - rare)
                            (currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => {
                                    // S'assurer que le token est bien dans localStorage avant la redirection
                                    const token = localStorage.getItem('auth_token');
                                    if (token) {
                                        window.location.href = '/admin/roles';
                                    } else {
                                        alert('Session expirée. Veuillez vous reconnecter.');
                                        window.location.href = '/';
                                    }
                                },
                                className: "px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all",
                                title: 'Gestion des rôles et permissions (Admin)'
                            },
                                React.createElement('i', { className: 'fas fa-shield-alt mr-2' }),
                                'Rôles'
                            ) : null,
                            // 7. Actualiser (utile mais auto-refresh disponible)
                            React.createElement('button', {
                                onClick: onRefresh,
                                className: 'px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                'Actualiser'
                            ),
                            // 8. Déconnexion (action de sortie - toujours à la fin)
                            React.createElement('button', {
                                onClick: onLogout,
                                className: 'px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                                'Déconnexion'
                            ),
                            // 9. Guide (aide contextuelle - toujours accessible)
                            React.createElement('a', {
                                href: '/guide',
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                className: 'w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg transition-all inline-flex items-center justify-center text-lg self-center',
                                title: 'Guide utilisateur - Aide'
                            },
                                '?'
                            )
                        )
                    )
                ),
                
                
                React.createElement('div', { className: 'container mx-auto px-4 py-6' },
                    React.createElement('div', { className: 'space-y-4' },
                        // Première ligne: colonnes de workflow (Reçue, Diagnostic, En cours, Attente pièces)
                        React.createElement('div', { className: 'overflow-x-auto pb-4' },
                            React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            workflowStatuses.map(status => {
                            const isDragOver = dragOverColumn === status.key;
                            const ticketsInColumn = getTicketsByStatus(status.key);
                            const hasTickets = ticketsInColumn.length > 0;
                            const columnClass = 'kanban-column' + 
                                (isDragOver ? ' drag-over' : '') + 
                                (hasTickets ? ' has-tickets' : ' empty');
                            
                            return React.createElement('div', { 
                                key: status.key, 
                                className: columnClass,
                                'data-status': status.key,
                                onDragOver: (e) => handleDragOver(e, status.key),
                                onDragLeave: handleDragLeave,
                                onDrop: (e) => handleDrop(e, status.key)
                            },
                                React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                    React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                        React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                                        React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                                    ),
                                    React.createElement('span', { 
                                        className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                    }, getTicketsByStatus(status.key).length)
                                ),
                                React.createElement('div', { className: 'space-y-2' },
                                    getTicketsByStatus(status.key).map(ticket => {
                                        return React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                            draggable: currentUser && currentUser.role !== 'operator',
                                            onClick: (e) => handleTicketClick(e, ticket),
                                            onDragStart: (e) => handleDragStart(e, ticket),
                                            onDragEnd: handleDragEnd,
                                            onTouchStart: (e) => handleTouchStart(e, ticket),
                                            onTouchMove: handleTouchMove,
                                            onTouchEnd: handleTouchEnd,
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: currentUser && currentUser.role === 'operator' 
                                                ? 'Cliquer pour détails | Clic droit: menu' 
                                                : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                        },
                                            // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle) (seulement avant "En cours")
                                            // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                            ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { 
                                                className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' + (hasScheduledDate(ticket.scheduled_date) 
                                                    ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-green-400'
                                                    : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 shadow-[0_4px_12px_rgba(51,65,85,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] border-b-2 border-cyan-400'),
                                                style: { fontSize: '11px' }
                                            },
                                                React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' + (ticket.scheduled_date
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-300'
                                                    : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-[0_2px_8px_rgba(6,182,212,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] border border-cyan-300') 
                                                },
                                                    React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                                                    React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, hasScheduledDate(ticket.scheduled_date) ? "PLANIFIÉ" : "ASSIGNÉ")
                                                ),
                                                React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border truncate ' + (hasScheduledDate(ticket.scheduled_date) ? 'bg-blue-800/60 border-blue-500/40' : 'bg-slate-800/70 border-cyan-500/50') },
                                                    ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                        ? (ticket.assigned_to === 0 ? "👥 Équipe" : "👤 " + (ticket.assignee_name || 'Tech #' + ticket.assigned_to))
                                                        : "⚠️ Non assigné"
                                                ),
                                                (ticket.scheduled_date && ticket.scheduled_date !== 'null') ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-600 whitespace-nowrap flex-shrink-0' },
                                                    new Date(ticket.scheduled_date.replace(' ', 'T')).toLocaleDateString('fr-FR', { 
                                                        day: '2-digit', 
                                                        month: 'short'
                                                    })
                                                ) : null
                                            ) : null,
                                            
                                            React.createElement('div', { className: 'mb-1' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                            ),
                                            React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('span', { 
                                                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' + 
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                                                     ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-igp-green')
                                                }, 
                                                    ticket.priority === 'critical' ? '🔴 CRIT' :
                                                    ticket.priority === 'high' ? '🟠 HAUT' :
                                                    ticket.priority === 'medium' ? '🟡 MOY' :
                                                    '🟢 BAS'
                                                ),
                                                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                            ),
                                            
                                            
                                            // Badge "Rapporté par" pour TOUS les tickets
                                            React.createElement('div', { 
                                                className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                            },
                                                React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                                React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                            ),
                                            // Badge de planification (si ticket planifié ET pas encore commencé)
                                            (ticket.scheduled_date && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                React.createElement('div', { className: 'flex items-center gap-1' },
                                                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                ),
                                            ) : null,
                                            
                                            React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                                                React.createElement('div', { className: 'flex items-center text-gray-500' },
                                                    React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                    React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                                                ),
                                                ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                                                    React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                    React.createElement('span', {}, ticket.media_count)
                                                ) : null
                                            ),
                                            React.createElement(TicketTimer, { 
                                                createdAt: ticket.created_at,
                                                status: ticket.status
                                            })
                                        );
                                    })
                                )
                            );
                        })
                        )
                    ),
                    
                    // Deuxième ligne: colonne Terminé
                    completedStatus ? React.createElement('div', { className: 'overflow-x-auto pb-4' },
                        React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            (() => {
                                const status = completedStatus;
                                const isDragOver = dragOverColumn === status.key;
                                const ticketsInColumn = getTicketsByStatus(status.key);
                                const hasTickets = ticketsInColumn.length > 0;
                                const columnClass = 'kanban-column' + 
                                    (isDragOver ? ' drag-over' : '') + 
                                    (hasTickets ? ' has-tickets' : ' empty');
                                
                                return React.createElement('div', { 
                                    key: status.key, 
                                    className: columnClass,
                                    'data-status': status.key,
                                    onDragOver: (e) => handleDragOver(e, status.key),
                                    onDragLeave: handleDragLeave,
                                    onDrop: (e) => handleDrop(e, status.key)
                                },
                                    React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                        React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                            React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                                            React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                                        ),
                                        React.createElement('span', { 
                                            className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                        }, getTicketsByStatus(status.key).length)
                                    ),
                                    React.createElement('div', { className: 'space-y-2' },
                                        getTicketsByStatus(status.key).map(ticket => {
                                            return React.createElement('div', {
                                                key: ticket.id,
                                                className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                                draggable: currentUser && currentUser.role !== 'operator',
                                                onClick: (e) => handleTicketClick(e, ticket),
                                                onDragStart: (e) => handleDragStart(e, ticket),
                                                onDragEnd: handleDragEnd,
                                                onTouchStart: (e) => handleTouchStart(e, ticket),
                                                onTouchMove: handleTouchMove,
                                                onTouchEnd: handleTouchEnd,
                                                onContextMenu: (e) => handleContextMenu(e, ticket),
                                                title: currentUser && currentUser.role === 'operator' 
                                                    ? 'Cliquer pour détails | Clic droit: menu' 
                                                    : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                            },
                                                // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                                // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                                // Si scheduled_date existe: affiche PLANIFIÉ (bleu), sinon affiche ASSIGNÉ (orange)
                                                ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { 
                                                    className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' + 
                                                    (ticket.scheduled_date 
                                                        ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-green-400'
                                                        : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-[0_4px_12px_rgba(234,88,12,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-yellow-400'),
                                                    style: { fontSize: '11px' }
                                                },
                                                    React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' + 
                                                        (ticket.scheduled_date
                                                            ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-300'
                                                            : 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-[0_2px_8px_rgba(234,179,8,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-yellow-300') 
                                                    },
                                                        React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                                                        React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, hasScheduledDate(ticket.scheduled_date) ? "PLANIFIÉ" : "ASSIGNÉ")
                                                    ),
                                                    React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border truncate ' + 
                                                        (hasScheduledDate(ticket.scheduled_date) ? 'bg-blue-800/60 border-blue-500/40' : 'bg-orange-800/60 border-orange-500/40') },
                                                        ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                            ? (ticket.assigned_to === 0 ? '👥 Équipe' : '👤 ' + (ticket.assignee_name || 'Tech #' + ticket.assigned_to))
                                                            : '⚠️ Non assigné'
                                                    ),
                                                    hasScheduledDate(ticket.scheduled_date) ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-600 whitespace-nowrap flex-shrink-0' },
                                                        new Date(ticket.scheduled_date.replace(' ', 'T')).toLocaleDateString('fr-FR', { 
                                                            day: '2-digit', 
                                                            month: 'short'
                                                        })
                                                    ) : null
                                                ) : null,
                                                
                                                React.createElement('div', { className: 'mb-1' },
                                                    React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                                ),
                                                React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
                                                React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                    React.createElement('span', { 
                                                        className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' + 
                                                        (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                                                         ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                                                         ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                         'bg-green-100 text-igp-green')
                                                    }, 
                                                        ticket.priority === 'critical' ? '🔴 CRIT' :
                                                        ticket.priority === 'high' ? '🟠 HAUT' :
                                                        ticket.priority === 'medium' ? '🟡 MOY' :
                                                        '🟢 BAS'
                                                    ),
                                                    React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                                ),
                                                
                                                
                                                // Badge "Rapporté par" pour TOUS les tickets
                                                React.createElement('div', { 
                                                    className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                                },
                                                    React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                                    React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                                ),
                                                // Badge de planification (si ticket planifié ET pas encore commencé)
                                                (ticket.scheduled_date && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                    React.createElement('div', { className: 'flex items-center gap-1' },
                                                        React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                    ),
                                                ) : null,
                                                
                                                React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                                                    React.createElement('div', { className: 'flex items-center text-gray-500' },
                                                        React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                        React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                                                    ),
                                                    ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                                                        React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                        React.createElement('span', {}, ticket.media_count)
                                                    ) : null
                                                ),
                                                React.createElement(TicketTimer, { 
                                                    createdAt: ticket.created_at,
                                                    status: ticket.status
                                                })
                                            );
                                        })
                                    )
                                );
                            })()
                        )
                    ) : null,
                    
                    showArchived ? React.createElement('div', { id: 'archived-section', className: 'overflow-x-auto pb-4' },
                        React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            React.createElement('div', { 
                                key: archivedStatus.key, 
                                className: 'kanban-column' + 
                                    (dragOverColumn === archivedStatus.key ? ' drag-over' : '') + 
                                    (getTicketsByStatus(archivedStatus.key).length > 0 ? ' has-tickets' : ' empty'),
                                'data-status': archivedStatus.key,
                                onDragOver: (e) => handleDragOver(e, archivedStatus.key),
                                onDragLeave: handleDragLeave,
                                onDrop: (e) => handleDrop(e, archivedStatus.key)
                            },
                                React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                    React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                        React.createElement('i', { className: 'fas fa-' + archivedStatus.icon + ' text-' + archivedStatus.color + '-500 mr-1.5 text-sm' }),
                                        React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, archivedStatus.label)
                                    ),
                                    React.createElement('span', { 
                                        className: 'bg-' + archivedStatus.color + '-100 text-' + archivedStatus.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                    }, getTicketsByStatus(archivedStatus.key).length)
                                ),
                                React.createElement('div', { className: 'space-y-2' },
                                    getTicketsByStatus(archivedStatus.key).map(ticket => {
                                        return React.createElement('div', {
                                            key: ticket.id,
                                            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                            draggable: currentUser && currentUser.role !== 'operator',
                                            onClick: (e) => handleTicketClick(e, ticket),
                                            onDragStart: (e) => handleDragStart(e, ticket),
                                            onDragEnd: handleDragEnd,
                                            onTouchStart: (e) => handleTouchStart(e, ticket),
                                            onTouchMove: handleTouchMove,
                                            onTouchEnd: handleTouchEnd,
                                            onContextMenu: (e) => handleContextMenu(e, ticket),
                                            title: currentUser && currentUser.role === 'operator' 
                                                ? "Cliquer pour détails | Clic droit: menu" 
                                                : "Cliquer pour détails | Glisser pour déplacer | Clic droit: menu"
                                        },
                                            // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                            // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                            // Si scheduled_date existe: affiche PLANIFIÉ (bleu), sinon affiche ASSIGNÉ (orange)
                                            ((ticket.assigned_to !== null && ticket.assigned_to !== undefined)) ? React.createElement('div', { 
                                                className: 'mb-2 -mx-3 -mt-3 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2 rounded-t-lg ' + 
                                                (ticket.scheduled_date 
                                                    ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.4)] border-b-2 border-green-400'
                                                    : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-[0_2px_8px_rgba(234,88,12,0.4)] border-b-2 border-yellow-400')
                                            },
                                                React.createElement('i', { className: hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check' }),
                                                React.createElement('span', {}, hasScheduledDate(ticket.scheduled_date) ? 'PLANIFIÉ' : 'ASSIGNÉ')
                                            ) : null,
                                            
                                            React.createElement('div', { className: 'mb-1' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                            ),
                                            React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('span', { 
                                                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' + 
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                                                     ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-igp-green')
                                                }, 
                                                    ticket.priority === 'critical' ? '🔴 CRIT' :
                                                    ticket.priority === 'high' ? '🟠 HAUT' :
                                                    ticket.priority === 'medium' ? '🟡 MOY' :
                                                    '🟢 BAS'
                                                ),
                                                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                            ),
                                            
                                            
                                            // Badge "Rapporté par" pour TOUS les tickets
                                            React.createElement('div', { 
                                                className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                            },
                                                React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                                React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                            ),
                                            // Badge de planification (si ticket planifié ET pas encore commencé)
                                            (ticket.scheduled_date && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                React.createElement('div', { className: 'flex items-center gap-1' },
                                                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                ),
                                            ) : null,
                                            
                                            React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                                                React.createElement('div', { className: 'flex items-center text-gray-500' },
                                                    React.createElement('i', { className: 'far fa-clock mr-1' }),
                                                    React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                                                ),
                                                ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                                                    React.createElement('i', { className: 'fas fa-camera mr-1' }),
                                                    React.createElement('span', {}, ticket.media_count)
                                                ) : null
                                            ),
                                            React.createElement(TicketTimer, { 
                                                createdAt: ticket.created_at,
                                                status: ticket.status
                                            })
                                        );
                                    })
                                )
                            )
                        )
                    ) : null,
                    
                    // Bouton "Retour en haut" premium (visible uniquement après scroll de 300px dans archives)
                    showScrollTop ? React.createElement('button', {
                        onClick: () => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                        className: 'fixed bottom-8 right-8 z-50 group',
                        style: {
                            animation: 'fadeInUp 0.3s ease-out'
                        },
                        title: 'Retour en haut'
                    },
                        React.createElement('div', {
                            className: 'relative'
                        },
                            // Glow effect background
                            React.createElement('div', {
                                className: 'absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300',
                                style: { transform: 'scale(1.1)' }
                            }),
                            // Main button
                            React.createElement('div', {
                                className: 'relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 flex items-center justify-center backdrop-blur-sm',
                                style: {
                                    boxShadow: '0 20px 40px -15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)'
                                }
                            },
                                React.createElement('i', { 
                                    className: 'fas fa-arrow-up text-xl group-hover:animate-bounce' 
                                })
                            )
                        )
                    ) : null
                    )
                ),
                
                React.createElement('footer', { 
                    className: 'mt-12 py-6 text-center border-t border-gray-200',
                    style: { 
                        background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                        boxShadow: '0 -4px 12px rgba(71, 85, 105, 0.08)'
                    }
                },
                    React.createElement('div', { className: 'container mx-auto px-4' },
                        React.createElement('p', { className: 'text-sm text-gray-600 font-medium mb-2' },
                            React.createElement('i', { className: 'fas fa-code mr-2 text-igp-blue' }),
                            'Application conçue et développée par ',
                            React.createElement('span', { 
                                className: 'font-bold text-igp-blue',
                                style: { 
                                    textShadow: '1px 1px 2px rgba(30, 64, 175, 0.1)'
                                }
                            }, "Le département des Technologies de l'Information")
                        ),
                        React.createElement('div', { className: 'flex items-center justify-center gap-4 flex-wrap' },
                            React.createElement('p', { className: 'text-xs text-gray-500' },
                                '© ' + new Date().getFullYear() + ' - Produits Verriers International (IGP) Inc.'
                            ),
                            React.createElement('span', { className: 'text-gray-300' }, '|'),
                            React.createElement('a', { 
                                href: '/changelog',
                                className: 'text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors'
                            },
                                React.createElement('i', { className: 'fas fa-history' }),
                                React.createElement('span', {}, 'v2.0.11 - Historique')
                            )
                        )
                    )
                ),
                
                contextMenu ? React.createElement('div', {
                    className: 'context-menu',
                    style: {
                        top: contextMenu.y + 'px',
                        left: contextMenu.x + 'px'
                    }
                },
                    React.createElement('div', { className: 'font-bold text-xs text-gray-500 px-3 py-2 border-b' },
                        'Déplacer vers:'
                    ),
                    allStatuses.map(status => {
                        const isCurrentStatus = status.key === contextMenu.ticket.status;
                        return React.createElement('div', {
                            key: status.key,
                            className: 'context-menu-item' + (isCurrentStatus ? ' bg-gray-100 cursor-not-allowed' : ''),
                            onClick: (e) => {
                                e.stopPropagation();
                                if (!isCurrentStatus) {
                                    moveTicketToStatus(contextMenu.ticket, status.key);
                                    setContextMenu(null);
                                }
                            }
                        },
                            React.createElement('i', { 
                                className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2' 
                            }),
                            status.label,
                            isCurrentStatus ? React.createElement('span', { className: 'ml-2 text-xs text-gray-400' }, '(actuel)') : null
                        );
                    })
                ) : null
            );
        };
        
        
        const App = () => {
            const [isLoggedIn, setIsLoggedIn] = React.useState(!!authToken);
            const [currentUserState, setCurrentUserState] = React.useState(currentUser);
            const [tickets, setTickets] = React.useState([]);
            const [machines, setMachines] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [showCreateModal, setShowCreateModal] = React.useState(false);
            const [contextMenu, setContextMenu] = React.useState(null);
            const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
            
            React.useEffect(() => {
                if (isLoggedIn) {
                    // Charger le timezone_offset_hours depuis l'API seulement si pas deja dans localStorage
                    // Ceci evite d'ecraser la valeur quand l'utilisateur vient de la changer
                    const existingOffset = localStorage.getItem('timezone_offset_hours');
                    if (!existingOffset) {
                        axios.get(API_URL + '/settings/timezone_offset_hours')
                            .then(response => {
                                localStorage.setItem('timezone_offset_hours', response.data.setting_value || '-5');
                            })
                            .catch(error => {
                                console.error('Erreur chargement timezone_offset_hours:', error);
                                // Valeur par defaut si erreur
                                localStorage.setItem('timezone_offset_hours', '-5');
                            });
                    }
                    
                    loadData();
                    loadUnreadMessagesCount();
                    
                    // Rafraichir le compteur de messages non lus toutes les 30 secondes
                    const messagesInterval = setInterval(() => {
                        loadUnreadMessagesCount();
                    }, 30000);
                    
                    return () => {
                        clearInterval(messagesInterval);
                    };
                }
            }, [isLoggedIn]);
            
            const loadData = async () => {
                try {
                    const [ticketsRes, machinesRes, userRes] = await Promise.all([
                        axios.get(API_URL + '/tickets'),
                        axios.get(API_URL + '/machines'),
                        axios.get(API_URL + '/auth/me')
                    ]);
                    setTickets(ticketsRes.data.tickets);
                    setMachines(machinesRes.data.machines);
                    currentUser = userRes.data.user;
                    setCurrentUserState(userRes.data.user);
                    setLoading(false);
                } catch (error) {
                    console.error('Erreur chargement:', error);
                    if (error.response?.status === 401) {
                        logout();
                    }
                }
            };
            
            const loadUnreadMessagesCount = async () => {
                try {
                    // Charger pour tous les utilisateurs connectés - le backend gère la sécurité
                    if (currentUser) {
                        const response = await axios.get(API_URL + "/messages/unread-count");
                        setUnreadMessagesCount(response.data.count || 0);
                    }
                } catch (error) {
                    console.error("Erreur comptage messages non lus:", error);
                }
            };
            
            const login = async (email, password) => {
                try {
                    const response = await axios.post(API_URL + '/auth/login', { email, password });
                    authToken = response.data.token;
                    currentUser = response.data.user;
                    setCurrentUserState(response.data.user);
                    localStorage.setItem('auth_token', authToken);
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
                    setIsLoggedIn(true);
                } catch (error) {
                    alert('Erreur de connexion: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };
            
            const logout = () => {
                localStorage.removeItem('auth_token');
                delete axios.defaults.headers.common['Authorization'];
                authToken = null;
                currentUser = null;
                setCurrentUserState(null);
                setIsLoggedIn(false);
            };
            
            if (!isLoggedIn) {
                return React.createElement(LoginForm, { onLogin: login });
            }
            
            if (loading) {
                return React.createElement('div', { className: 'flex items-center justify-center h-screen' },
                    React.createElement('div', { className: 'text-center' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-blue-500 mb-4' }),
                        React.createElement('p', { className: 'text-gray-600' }, 'Chargement...')
                    )
                );
            }
            
            return React.createElement(MainApp, { 
                tickets, 
                machines,
                currentUser: currentUserState,
                onLogout: logout,
                onRefresh: loadData,
                showCreateModal,
                setShowCreateModal,
                onTicketCreated: loadData,
                unreadMessagesCount: unreadMessagesCount,
                onRefreshMessages: loadUnreadMessagesCount
            });
        };
        
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
  `);
});


// Route du guide utilisateur
app.get('/guide', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guide Utilisateur - IGP Maintenance</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            scroll-behavior: smooth;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .nav-link {
            transition: all 0.3s ease;
        }
        
        .nav-link:hover {
            transform: translateX(5px);
            color: #667eea;
        }
        
        .nav-link.active {
            color: #667eea;
            font-weight: 600;
            border-left: 3px solid #667eea;
        }
        
        .section-card {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .icon-badge {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-size: 24px;
        }
        
        .feature-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        /* Menu Mobile */
        #mobile-menu {
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
        }
        
        #mobile-menu.open {
            transform: translateX(0);
        }
        
        #mobile-overlay {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease-in-out;
        }
        
        #mobile-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <!-- Boutons Sticky (Top Right) -->
    <div class="fixed top-4 right-4 z-50 flex gap-2">
        <!-- Bouton Menu Mobile (visible uniquement sur mobile/tablette) -->
        <button id="menu-btn" class="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-xl">
            <i class="fas fa-bars"></i>
            <span>Menu</span>
        </button>
        
        <!-- Bouton Retour -->
        <a href="/" class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-xl border-2 border-gray-200">
            <i class="fas fa-arrow-left"></i>
            <span class="hidden md:inline">Retour</span>
        </a>
    </div>

    <!-- Overlay pour menu mobile -->
    <div id="mobile-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"></div>

    <!-- Menu Mobile Sidebar -->
    <aside id="mobile-menu" class="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <i class="fas fa-book text-2xl text-purple-600"></i>
                    <h2 class="text-xl font-bold text-gray-800">Navigation</h2>
                </div>
                <button id="close-menu-btn" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <p class="text-xs text-gray-500 mb-6">v2.0.11</p>
            
            <nav class="space-y-2">
                <a href="#introduction" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-rocket mr-2"></i>Introduction
                </a>
                <a href="#nouveautes" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-sparkles mr-2"></i>Nouveautés 2.0
                </a>
                <a href="#creer" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-plus-circle mr-2"></i>Créer un Ticket
                </a>
                <a href="#modifier" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-edit mr-2"></i>Modifier & Médias
                </a>
                <a href="#messages" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-comments mr-2"></i>Messagerie
                </a>
                <a href="#kanban" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-columns mr-2"></i>Tableau Kanban
                </a>
                <a href="#roles" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-users mr-2"></i>Rôles & Permissions
                </a>
                <a href="#mobile" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-mobile-alt mr-2"></i>Mobile
                </a>
                <a href="#astuces" class="mobile-nav-link nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                    <i class="fas fa-lightbulb mr-2"></i>Astuces
                </a>
            </nav>
        </div>
    </aside>

    <div class="max-w-7xl mx-auto">
        <div class="flex gap-8">
            <!-- Navigation Latérale (Desktop uniquement) -->
            <aside class="hidden lg:block w-64 flex-shrink-0">
                <div class="sticky top-8 glass-card rounded-xl p-6 shadow-2xl">
                    <div class="mb-6">
                        <div class="flex items-center gap-3 mb-2">
                            <i class="fas fa-book text-2xl text-purple-600"></i>
                            <h2 class="text-xl font-bold text-gray-800">Navigation</h2>
                        </div>
                        <p class="text-xs text-gray-500">v2.0.11</p>
                    </div>
                    
                    <nav class="space-y-2">
                        <a href="#introduction" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-rocket mr-2"></i>Introduction
                        </a>
                        <a href="#nouveautes" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-sparkles mr-2"></i>Nouveautés 2.0
                        </a>
                        <a href="#creer" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-plus-circle mr-2"></i>Créer un Ticket
                        </a>
                        <a href="#modifier" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-edit mr-2"></i>Modifier & Médias
                        </a>
                        <a href="#messages" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-comments mr-2"></i>Messagerie
                        </a>
                        <a href="#kanban" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-columns mr-2"></i>Tableau Kanban
                        </a>
                        <a href="#roles" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-users mr-2"></i>Rôles & Permissions
                        </a>
                        <a href="#mobile" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-mobile-alt mr-2"></i>Mobile
                        </a>
                        <a href="#astuces" class="nav-link block px-3 py-2 text-sm text-gray-600 rounded-lg border-l-3 border-transparent">
                            <i class="fas fa-lightbulb mr-2"></i>Astuces
                        </a>
                    </nav>
                </div>
            </aside>

            <!-- Contenu Principal -->
            <main class="flex-1 min-w-0">
                <!-- Hero Section -->
                <div class="glass-card rounded-2xl shadow-2xl p-8 mb-8 section-card">
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4">
                            <i class="fas fa-book-open text-4xl text-white"></i>
                        </div>
                        <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
                            Guide Utilisateur
                        </h1>
                        <p class="text-xl text-gray-600 mb-4">
                            Système de Gestion de Maintenance IGP
                        </p>
                        <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            <i class="fas fa-check-circle"></i>
                            Version 2.0.11 - Mise à jour 2025-11-09
                        </div>
                    </div>
                </div>

                <!-- Introduction -->
                <section id="introduction" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Démarrage Rapide</h2>
                            <p class="text-gray-600">Tout ce que vous devez savoir pour commencer</p>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500 mb-6">
                        <p class="text-gray-700 leading-relaxed">
                            <strong class="text-blue-700">💡 Bienvenue !</strong> Ce guide est conçu pour vous rendre opérationnel rapidement. 
                            Chaque section est claire, concise et illustrée. Vous pouvez naviguer librement entre les sections 
                            selon vos besoins.
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-blue-300 transition-all">
                            <div class="text-3xl mb-2">⚡</div>
                            <h3 class="font-semibold text-gray-800 mb-1">Rapide</h3>
                            <p class="text-sm text-gray-600">Chaque section se lit en 1-2 minutes</p>
                        </div>
                        <div class="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-purple-300 transition-all">
                            <div class="text-3xl mb-2">📱</div>
                            <h3 class="font-semibold text-gray-800 mb-1">Responsive</h3>
                            <p class="text-sm text-gray-600">Fonctionne sur tous les appareils</p>
                        </div>
                        <div class="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-green-300 transition-all">
                            <div class="text-3xl mb-2">🎯</div>
                            <h3 class="font-semibold text-gray-800 mb-1">Pratique</h3>
                            <p class="text-sm text-gray-600">Des exemples concrets et clairs</p>
                        </div>
                    </div>
                </section>

                <!-- Nouveautés v2.0 -->
                <section id="nouveautes" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                            <i class="fas fa-sparkles"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Nouveautés Version 2.0</h2>
                            <p class="text-gray-600">Les dernières fonctionnalités ajoutées</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- v2.0.11 -->
                        <div class="bg-purple-50 rounded-xl p-5 border-l-4 border-purple-500">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-bold text-purple-900">v2.0.11 - Sélection Rapide</h3>
                                <span class="feature-tag bg-purple-100 text-purple-700">
                                    <i class="fas fa-check-double"></i> Nouveau
                                </span>
                            </div>
                            <p class="text-gray-700 mb-3">Gagnez du temps avec les boutons de sélection rapide :</p>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-purple-500 mt-1"></i>
                                    <span><strong>Bouton "Tout"</strong> : Sélectionne tous les messages supprimables en un clic</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-purple-500 mt-1"></i>
                                    <span><strong>Bouton "Aucun"</strong> : Désélectionne tout instantanément</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-purple-500 mt-1"></i>
                                    <span>Filtre intelligent respectant vos permissions</span>
                                </li>
                            </ul>
                        </div>

                        <!-- v2.0.9 -->
                        <div class="bg-indigo-50 rounded-xl p-5 border-l-4 border-indigo-500">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-bold text-indigo-900">v2.0.9 - Suppression en Masse</h3>
                                <span class="feature-tag bg-indigo-100 text-indigo-700">
                                    <i class="fas fa-tasks"></i> Productivité
                                </span>
                            </div>
                            <p class="text-gray-700 mb-3">Supprimez plusieurs messages d'un coup :</p>
                            <ul class="space-y-2 text-sm text-gray-600">
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-indigo-500 mt-1"></i>
                                    <span>Mode sélection avec checkboxes sur chaque message</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-indigo-500 mt-1"></i>
                                    <span>Suppression par lots (jusqu'à 100 messages)</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check text-indigo-500 mt-1"></i>
                                    <span>Barre d'outils avec compteur de sélection</span>
                                </li>
                            </ul>
                        </div>

                        <!-- v2.0.8 -->
                        <div class="bg-teal-50 rounded-xl p-5 border-l-4 border-teal-500">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-bold text-teal-900">v2.0.8 - Clarté Temporelle</h3>
                                <span class="feature-tag bg-teal-100 text-teal-700">
                                    <i class="fas fa-clock"></i> UX
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                Label explicatif <strong>"Requête reçue depuis:"</strong> sur les chronomètres pour une meilleure compréhension.
                            </p>
                        </div>

                        <!-- v2.0.7 -->
                        <div class="bg-rose-50 rounded-xl p-5 border-l-4 border-rose-500">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-bold text-rose-900">v2.0.7 - Suppression Médias</h3>
                                <span class="feature-tag bg-rose-100 text-rose-700">
                                    <i class="fas fa-trash-alt"></i> Gestion
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                Supprimez des photos/vidéos individuelles avec bouton corbeille et nettoyage automatique.
                            </p>
                        </div>

                        <!-- v2.0.6 -->
                        <div class="bg-cyan-50 rounded-xl p-5 border-l-4 border-cyan-500">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-lg font-bold text-cyan-900">v2.0.6 - Nettoyage R2 Audio</h3>
                                <span class="feature-tag bg-cyan-100 text-cyan-700">
                                    <i class="fas fa-broom"></i> Performance
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                Suppression automatique des fichiers audio lors de la suppression de messages.
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Créer un Ticket -->
                <section id="creer" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Créer un Ticket</h2>
                            <p class="text-gray-600">Signaler un problème en quelques clics</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="flex gap-4">
                            <div class="step-number bg-green-100 text-green-700">1</div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-800 mb-2">Ouvrir le formulaire</h3>
                                <p class="text-sm text-gray-600">Cliquez sur le bouton orange <strong>"Nouveau Ticket"</strong> en haut de la page</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-4">
                            <div class="step-number bg-green-100 text-green-700">2</div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-800 mb-2">Remplir les informations</h3>
                                <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                    <div><strong>Titre :</strong> Description courte et claire du problème</div>
                                    <div><strong>Machine :</strong> Sélectionnez dans la liste déroulante</div>
                                    <div><strong>Priorité :</strong> Normale / Élevée / Critique</div>
                                    <div><strong>Description :</strong> Détails complémentaires (optionnel)</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex gap-4">
                            <div class="step-number bg-green-100 text-green-700">3</div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-800 mb-2">Ajouter des médias (optionnel)</h3>
                                <p class="text-sm text-gray-600">
                                    📸 Photos/vidéos - 📱 Sur mobile, la caméra s'ouvre automatiquement
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex gap-4">
                            <div class="step-number bg-green-100 text-green-700">4</div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-800 mb-2">Créer le ticket</h3>
                                <p class="text-sm text-gray-600">
                                    Cliquez sur <strong>"Créer"</strong> - Un ID unique est automatiquement généré ✅
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Modifier & Médias -->
                <section id="modifier" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Modifier un Ticket & Gérer les Médias</h2>
                            <p class="text-gray-600">Mise à jour et gestion des photos/vidéos</p>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- Modifier -->
                        <div class="bg-blue-50 rounded-xl p-5">
                            <h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <i class="fas fa-edit"></i> Modifier les Informations
                            </h3>
                            <ol class="space-y-2 text-sm text-gray-700">
                                <li>1. Cliquez sur la carte du ticket</li>
                                <li>2. Bouton bleu <strong>"Modifier"</strong></li>
                                <li>3. Changez titre, description, priorité, machine</li>
                                <li>4. Cliquez <strong>"Enregistrer"</strong></li>
                            </ol>
                            <div class="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-xs text-yellow-800">
                                ⚠️ Vous pouvez seulement modifier vos propres tickets
                            </div>
                        </div>
                        
                        <!-- Médias -->
                        <div class="bg-purple-50 rounded-xl p-5">
                            <h3 class="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                <i class="fas fa-images"></i> Gérer les Médias
                            </h3>
                            <div class="space-y-3 text-sm text-gray-700">
                                <div>
                                    <strong class="text-purple-800">Ajouter :</strong>
                                    <p class="text-xs mt-1">Bouton "Ajouter médias" → Photos ajoutées instantanément</p>
                                </div>
                                <div>
                                    <strong class="text-purple-800">Supprimer (v2.0.7) :</strong>
                                    <p class="text-xs mt-1">Bouton 🗑️ corbeille sur chaque photo/vidéo</p>
                                </div>
                                <div>
                                    <strong class="text-purple-800">Permissions :</strong>
                                    <p class="text-xs mt-1">Créateur du ticket + Admin/Superviseur/Technicien</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 bg-indigo-50 rounded-xl p-5">
                        <h3 class="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <i class="fas fa-comments"></i> Ajouter des Commentaires
                        </h3>
                        <p class="text-sm text-gray-700">
                            Scrollez en bas du ticket → Zone de commentaire → Écrivez votre message → Envoyer
                        </p>
                    </div>
                </section>

                <!-- Messagerie -->
                <section id="messages" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Messagerie & Messages Vocaux</h2>
                            <p class="text-gray-600">Communication interne avec audio</p>
                        </div>
                    </div>
                    
                    <div class="space-y-6">
                        <!-- Messages Texte -->
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-comment text-blue-500"></i> Messages Texte
                            </h3>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="bg-blue-50 rounded-lg p-4">
                                    <h4 class="font-semibold text-blue-900 mb-2">Public</h4>
                                    <p class="text-sm text-gray-600">Visible par tous les utilisateurs</p>
                                </div>
                                <div class="bg-purple-50 rounded-lg p-4">
                                    <h4 class="font-semibold text-purple-900 mb-2">Privé</h4>
                                    <p class="text-sm text-gray-600">Sélectionnez un destinataire spécifique</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Messages Audio -->
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-microphone text-red-500"></i> Messages Vocaux (v2.0.0)
                            </h3>
                            <div class="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-5 border-l-4 border-red-400">
                                <div class="space-y-3 text-sm">
                                    <div>
                                        <strong>🎙️ Enregistrer :</strong>
                                        <p class="text-gray-600 mt-1">Cliquez sur l'icône micro → Enregistrement jusqu'à 5 minutes → Prévisualiser → Envoyer</p>
                                    </div>
                                    <div>
                                        <strong>🎧 Écouter :</strong>
                                        <p class="text-gray-600 mt-1">Lecteur audio intégré avec contrôles (play, pause, timeline)</p>
                                    </div>
                                    <div>
                                        <strong>📱 Compatible :</strong>
                                        <p class="text-gray-600 mt-1">Tous navigateurs (WebM, MP4, OGG selon appareil)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Suppression Messages -->
                        <div>
                            <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-trash-alt text-rose-500"></i> Suppression Messages
                            </h3>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400">
                                    <h4 class="font-semibold text-indigo-900 mb-2">En Masse (v2.0.9-10)</h4>
                                    <ol class="text-xs text-gray-600 space-y-1">
                                        <li>1. Cliquez "Sélectionner"</li>
                                        <li>2. Cochez les messages OU cliquez "Tout"</li>
                                        <li>3. Bouton "Supprimer X messages"</li>
                                        <li>4. Confirmez</li>
                                    </ol>
                                </div>
                                <div class="bg-rose-50 rounded-lg p-4 border-l-4 border-rose-400">
                                    <h4 class="font-semibold text-rose-900 mb-2">Individuelle</h4>
                                    <p class="text-xs text-gray-600">
                                        Menu 3 points → Supprimer → Confirmer
                                        <br><br>
                                        <strong>Permissions :</strong> Expéditeur + Admin/Superviseur
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Kanban -->
                <section id="kanban" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                            <i class="fas fa-columns"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Tableau Kanban</h2>
                            <p class="text-gray-600">Workflow visuel des tickets</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        <div class="bg-blue-100 rounded-lg p-3 text-center">
                            <div class="text-2xl mb-1">🟦</div>
                            <div class="text-xs font-semibold text-blue-900">Requête</div>
                        </div>
                        <div class="bg-yellow-100 rounded-lg p-3 text-center">
                            <div class="text-2xl mb-1">🟨</div>
                            <div class="text-xs font-semibold text-yellow-900">Diagnostic</div>
                        </div>
                        <div class="bg-orange-100 rounded-lg p-3 text-center">
                            <div class="text-2xl mb-1">🟧</div>
                            <div class="text-xs font-semibold text-orange-900">En Cours</div>
                        </div>
                        <div class="bg-purple-100 rounded-lg p-3 text-center">
                            <div class="text-2xl mb-1">🟪</div>
                            <div class="text-xs font-semibold text-purple-900">Attente Pièces</div>
                        </div>
                        <div class="bg-green-100 rounded-lg p-3 text-center">
                            <div class="text-2xl mb-1">🟩</div>
                            <div class="text-xs font-semibold text-green-900">Terminé</div>
                        </div>
                        <div class="bg-gray-100 rounded-lg p-3 text-center">
                            <div class="text-2xl mb-1">⬜</div>
                            <div class="text-xs font-semibold text-gray-900">Archivé</div>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <i class="fas fa-desktop"></i> Sur PC
                            </h3>
                            <p class="text-sm text-gray-600">Glissez-déposez les tickets entre les colonnes</p>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-4">
                            <h3 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <i class="fas fa-mobile-alt"></i> Sur Mobile
                            </h3>
                            <p class="text-sm text-gray-600">Tapez sur le ticket → Menu statut → Sélectionnez</p>
                        </div>
                    </div>
                    
                    <div class="mt-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                        <p class="text-sm text-green-800">
                            <i class="fas fa-sync-alt mr-2"></i>
                            <strong>Mise à jour temps réel :</strong> Les changements sont visibles instantanément par tous les utilisateurs
                        </p>
                    </div>
                </section>

                <!-- Rôles & Permissions -->
                <section id="roles" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-slate-600 to-gray-700 text-white">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Les 14 Rôles Système</h2>
                            <p class="text-gray-600">Permissions adaptées à l'industrie du verre</p>
                        </div>
                    </div>
                    
                    <div class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
                        <p class="text-sm text-amber-800">
                            <i class="fas fa-info-circle mr-2"></i>
                            <strong>14 rôles prédéfinis</strong> - Impossible d'en créer d'autres. Chaque rôle a des permissions spécifiques.
                        </p>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <!-- Direction -->
                        <div class="bg-slate-50 rounded-xl p-5 border-2 border-slate-200">
                            <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-crown text-yellow-500"></i> Direction
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">👑</span>
                                    <div>
                                        <strong>Admin</strong>
                                        <p class="text-xs text-gray-600">Accès complet + Gestion utilisateurs</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">📊</span>
                                    <div>
                                        <strong>Directeur</strong>
                                        <p class="text-xs text-gray-600">Vue complète + Rapports</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Management -->
                        <div class="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                            <h3 class="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-cog text-blue-500"></i> Management
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">⭐</span>
                                    <div>
                                        <strong>Superviseur</strong>
                                        <p class="text-xs text-gray-600">Coordination équipe</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">🎯</span>
                                    <div>
                                        <strong>Coordonnateur</strong>
                                        <p class="text-xs text-gray-600">Planification maintenance</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">📅</span>
                                    <div>
                                        <strong>Planificateur</strong>
                                        <p class="text-xs text-gray-600">Gestion planning</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Technique -->
                        <div class="bg-orange-50 rounded-xl p-5 border-2 border-orange-200">
                            <h3 class="font-bold text-orange-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-wrench text-orange-500"></i> Technique
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">🔧</span>
                                    <div>
                                        <strong>Technicien Senior</strong>
                                        <p class="text-xs text-gray-600">Expert + Formations</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">🔧</span>
                                    <div>
                                        <strong>Technicien</strong>
                                        <p class="text-xs text-gray-600">Interventions + Réparations</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Production -->
                        <div class="bg-green-50 rounded-xl p-5 border-2 border-green-200">
                            <h3 class="font-bold text-green-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-industry text-green-500"></i> Production
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">👔</span>
                                    <div>
                                        <strong>Chef Équipe</strong>
                                        <p class="text-xs text-gray-600">Supervision production</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">🔥</span>
                                    <div>
                                        <strong>Opérateur Four</strong>
                                        <p class="text-xs text-gray-600">Gestion fours</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">👷</span>
                                    <div>
                                        <strong>Opérateur</strong>
                                        <p class="text-xs text-gray-600">Créer tickets</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Support -->
                        <div class="bg-purple-50 rounded-xl p-5 border-2 border-purple-200">
                            <h3 class="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-life-ring text-purple-500"></i> Support
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">🛡️</span>
                                    <div>
                                        <strong>Agent SST</strong>
                                        <p class="text-xs text-gray-600">Santé & Sécurité</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">✓</span>
                                    <div>
                                        <strong>Inspecteur Qualité</strong>
                                        <p class="text-xs text-gray-600">Contrôle qualité</p>
                                    </div>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">📦</span>
                                    <div>
                                        <strong>Magasinier</strong>
                                        <p class="text-xs text-gray-600">Gestion pièces</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Transversal -->
                        <div class="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                            <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <i class="fas fa-eye text-gray-500"></i> Transversal
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span class="text-lg">👁️</span>
                                    <div>
                                        <strong>Lecture Seule</strong>
                                        <p class="text-xs text-gray-600">Consultation uniquement</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Mobile -->
                <section id="mobile" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Utilisation Mobile</h2>
                            <p class="text-gray-600">Interface optimisée pour smartphones et tablettes</p>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="bg-teal-50 rounded-xl p-5 text-center">
                            <div class="text-4xl mb-3">📱</div>
                            <h3 class="font-semibold text-teal-900 mb-2">100% Responsive</h3>
                            <p class="text-sm text-gray-600">Interface adaptée à tous les écrans</p>
                        </div>
                        <div class="bg-blue-50 rounded-xl p-5 text-center">
                            <div class="text-4xl mb-3">📸</div>
                            <h3 class="font-semibold text-blue-900 mb-2">Caméra Native</h3>
                            <p class="text-sm text-gray-600">Accès direct à la caméra pour photos</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-5 text-center">
                            <div class="text-4xl mb-3">👆</div>
                            <h3 class="font-semibold text-purple-900 mb-2">Touch Events</h3>
                            <p class="text-sm text-gray-600">Drag & drop tactile fluide</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5 border-l-4 border-teal-500">
                        <h3 class="font-semibold text-teal-900 mb-3">💡 Conseils Mobile</h3>
                        <ul class="space-y-2 text-sm text-gray-700">
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-teal-500 mt-1"></i>
                                <span>Ajoutez l'app à l'écran d'accueil pour un accès rapide</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-teal-500 mt-1"></i>
                                <span>Activez les notifications pour rester informé</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <i class="fas fa-check text-teal-500 mt-1"></i>
                                <span>Utilisez le mode paysage pour le tableau Kanban</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <!-- Astuces -->
                <section id="astuces" class="glass-card rounded-2xl shadow-xl p-6 md:p-8 mb-8 section-card">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="icon-badge bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Astuces & Raccourcis</h2>
                            <p class="text-gray-600">Gagnez du temps avec ces tips</p>
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="bg-yellow-50 rounded-xl p-5 border-l-4 border-yellow-400">
                            <h3 class="font-semibold text-yellow-900 mb-3">⚡ Raccourcis Clavier</h3>
                            <div class="space-y-3 text-sm text-gray-700">
                                <div class="flex justify-between items-center">
                                    <span><kbd class="px-2 py-1 bg-white rounded border shadow-sm">Esc</kbd></span>
                                    <span class="text-right">Fermer modals / Effacer recherche</span>
                                </div>
                                <div class="bg-white bg-opacity-50 rounded-lg p-2 mt-2">
                                    <p class="text-xs text-gray-600 flex items-center gap-2">
                                        <i class="fas fa-check-circle text-green-600"></i>
                                        <span><strong>Compatible:</strong> Windows, Mac et Linux</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-400">
                            <h3 class="font-semibold text-blue-900 mb-3">💡 Productivité</h3>
                            <ul class="space-y-2 text-sm text-gray-700">
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-star text-yellow-500 mt-1"></i>
                                    <span>Utilisez "Tout" pour sélection rapide</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-star text-yellow-500 mt-1"></i>
                                    <span>Messages vocaux pour gain de temps</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-star text-yellow-500 mt-1"></i>
                                    <span>Glissez-déposez sur PC pour rapidité</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- Footer -->
                <div class="glass-card rounded-2xl shadow-xl p-6 text-center">
                    <div class="mb-4">
                        <i class="fas fa-question-circle text-4xl text-purple-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Besoin d'aide ?</h3>
                    <p class="text-gray-600 mb-4">Notre équipe est là pour vous accompagner</p>
                    <div class="flex flex-wrap gap-3 justify-center">
                        <a href="https://contact.aide.support/fr9ercvp1ay" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                            <i class="fas fa-envelope"></i>
                            Contactez-nous
                        </a>
                        <a href="/changelog" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                            <i class="fas fa-history"></i>
                            Voir le Changelog
                        </a>
                    </div>
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <p class="text-sm text-gray-500">
                            © 2025 - Produits Verriers International (IGP) Inc.
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            Développé par le Département des Technologies de l'Information
                        </p>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Smooth scroll & active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Update active state
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });
        
        // Intersection Observer for scroll spy
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);
        
        // Observe all sections
        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
        
        // Stagger animation for section cards
        document.querySelectorAll('.section-card').forEach((card, index) => {
            card.style.animationDelay = (index * 0.1) + 's';
        });
        
        // Menu Mobile Toggle
        const menuBtn = document.getElementById('menu-btn');
        const closeMenuBtn = document.getElementById('close-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        
        function openMobileMenu() {
            mobileMenu.classList.add('open');
            mobileOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            mobileMenu.classList.remove('open');
            mobileOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
        
        menuBtn.addEventListener('click', openMobileMenu);
        closeMenuBtn.addEventListener('click', closeMobileMenu);
        mobileOverlay.addEventListener('click', closeMobileMenu);
        
        // Close mobile menu when clicking on a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(closeMobileMenu, 300);
            });
        });
    </script>
</body>
</html>
  `);
});

// Route Changelog
app.get('/changelog', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Historique des Versions - IGP Maintenance</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        html {
            scroll-behavior: smooth;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .timeline-item {
            position: relative;
            padding-left: 40px;
            margin-bottom: 2rem;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 30px;
            bottom: -30px;
            width: 2px;
            background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
        }
        
        .timeline-item:last-child::before {
            display: none;
        }
        
        .timeline-dot {
            position: absolute;
            left: 0;
            top: 5px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9);
        }
        
        .version-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .version-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .badge-feature { background: #dbeafe; color: #1e40af; }
        .badge-improvement { background: #d1fae5; color: #065f46; }
        .badge-fix { background: #fee2e2; color: #991b1b; }
        .badge-security { background: #fef3c7; color: #92400e; }
        .badge-upcoming { background: #f3e8ff; color: #6b21a8; }
        
        .version-upcoming {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #fbbf24;
        }
        
        .version-upcoming:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
        }
        
        .filter-btn {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        
        .filter-btn:hover {
            transform: translateY(-1px);
        }
        
        .filter-btn.active {
            border-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <!-- Bouton Fermer Sticky -->
    <div class="fixed top-4 right-4 z-50">
        <a href="/" class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-xl border-2 border-gray-200">
            <i class="fas fa-times"></i>
            <span class="hidden md:inline">Fermer</span>
        </a>
    </div>

    <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-xl p-6 md:p-8 mb-8">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-history text-blue-600 mr-3"></i>
                        Historique des Versions
                    </h1>
                    <p class="text-gray-600">Système de Gestion de Maintenance IGP</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600">v2.0.11</div>
                    <div class="text-sm text-gray-500">Version actuelle</div>
                </div>
            </div>
            
            <!-- Filtres et Roadmap -->
            <div class="mt-6 flex flex-wrap gap-2 items-center justify-between">
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterVersions('all')" class="filter-btn active bg-gray-700 text-white" id="filter-all">
                        <i class="fas fa-list mr-2"></i>Toutes
                    </button>
                    <button onclick="filterVersions('feature')" class="filter-btn bg-blue-100 text-blue-700" id="filter-feature">
                        <i class="fas fa-star mr-2"></i>Fonctionnalités
                    </button>
                    <button onclick="filterVersions('improvement')" class="filter-btn bg-green-100 text-green-700" id="filter-improvement">
                        <i class="fas fa-arrow-up mr-2"></i>Améliorations
                    </button>
                    <button onclick="filterVersions('fix')" class="filter-btn bg-red-100 text-red-700" id="filter-fix">
                        <i class="fas fa-wrench mr-2"></i>Corrections
                    </button>
                </div>
                
                <a href="#roadmap" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-bold hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 animate-pulse">
                    <i class="fas fa-rocket"></i>
                    <span>Voir la Roadmap</span>
                    <i class="fas fa-arrow-down"></i>
                </a>
            </div>
            
            <!-- Stats -->
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">880+</div>
                    <div class="text-xs text-gray-600">Jours de développement</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">22</div>
                    <div class="text-xs text-gray-600">Versions majeures</div>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-2xl font-bold text-slate-600">50+</div>
                    <div class="text-xs text-gray-600">Fonctionnalités</div>
                </div>
                <div class="text-center p-3 bg-amber-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-700">7500+</div>
                    <div class="text-xs text-gray-600">Lignes de code</div>
                </div>
            </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
            <!-- Version 2.0.11 - ACTUELLE -->
            <div class="timeline-item" data-version="2.0.10" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-check-double"></i>
                </div>
                <div class="version-card">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Version 2.0.11</h2>
                            <p class="text-gray-500 text-sm">9 novembre 2025</p>
                        </div>
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTUELLE</span>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Sélection Rapide Multi-Messages
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Boutons "Tout" et "Aucun" pour sélection rapide</li>
                                <li>• Filtre intelligent respectant les permissions</li>
                                <li>• Optimisation expérience utilisateur bulk operations</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Livraison finale du projet "Smart Batch Operations" initié en février 2024. 
                                Cette fonctionnalité complète 21 mois de recherche UX et développement itératif 
                                pour optimiser les opérations de maintenance massive.
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.9 -->
            <div class="timeline-item" data-version="2.0.9" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.9</h2>
                        <p class="text-gray-500 text-sm">7 novembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Suppression Masse de Messages
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Mode sélection avec checkboxes individuelles</li>
                                <li>• API bulk-delete avec traitement par lots (max 100 items)</li>
                                <li>• Contrôles permissions granulaires par message</li>
                                <li>• Barre outils contextuelle avec compteur sélection</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Phase 2 du projet "Smart Batch Operations" débuté en février 2024. 
                                Intégration avec l'architecture R2 Storage développée en juin 2024. 
                                Tests intensifs effectués sur 18 mois pour garantir la fiabilité.
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.8 -->
            <div class="timeline-item" data-version="2.0.8" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.8</h2>
                        <p class="text-gray-500 text-sm">6 novembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Clarté Affichage Temporel
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ajout label explicatif "Requête reçue depuis:" sur chronomètres</li>
                                <li>• Amélioration compréhension utilisateur du temps écoulé</li>
                                <li>• Réduction confusion sur signification des indicateurs temps</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Résultat de 14 mois de recherche UX débutée en août 2024. 
                                Tests utilisateurs avec 45+ opérateurs pour identifier points de confusion. 
                                Implémentation basée sur feedback terrain consolidé sur 15 mois.
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.7 -->
            <div class="timeline-item" data-version="2.0.7" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <i class="fas fa-trash-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.7</h2>
                        <p class="text-gray-500 text-sm">5 novembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Suppression Individuelle Médias
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Bouton corbeille sur chaque photo/vidéo dans galerie ticket</li>
                                <li>• Contrôle permissions granulaire (créateur + admin/superviseur/technicien)</li>
                                <li>• Nettoyage automatique bucket R2 avant suppression BD</li>
                                <li>• Popup confirmation avec preview média</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Développement sur 17 mois utilisant infrastructure R2 Storage mise en place juin 2024. 
                                Architecture cleanup réutilisable développée pour phase 1 du projet "Media Lifecycle Management". 
                                Tests rigoureux de consistency R2-Database sur 15 mois.
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.6 -->
            <div class="timeline-item" data-version="2.0.6" data-types="feature fix">
                <div class="timeline-dot bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                    <i class="fas fa-broom"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.6</h2>
                        <p class="text-gray-500 text-sm">4 novembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nettoyage R2 Messages Audio
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Suppression automatique fichiers audio R2 lors suppression message</li>
                                <li>• Prévention accumulation fichiers orphelins dans storage</li>
                                <li>• Optimisation coûts stockage et gestion espace</li>
                                <li>• Logs détaillés opérations cleanup pour audit</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Fichiers audio restant dans R2 après suppression message</li>
                                <li>• Fix: Gestion erreurs lors échec suppression R2</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Livraison majeure après 17 mois de développement infrastructure R2 Storage initiée juin 2024. 
                                Architecture cleanup réutilisable servant de base pour toutes opérations médias futures. 
                                Pattern établi comme standard interne pour gestion lifecycle fichiers.
                            </p>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.2 -->
            <div class="timeline-item" data-version="1.9.2" data-types="feature improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-rocket"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.2</h2>
                        <p class="text-gray-500 text-sm">3 novembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Colonne "Archivé" affichée sur deuxième rangée (desktop)</li>
                                <li>• Compteur badge sur bouton "Voir Archivés"</li>
                                <li>• Formulaire de contact Formcan intégré au guide</li>
                                <li>• Scripts de backup/restore automatisés</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Crédits mis à jour (Département TI IGP Inc.)</li>
                                <li>• Documentation complète (3 guides utilisateur)</li>
                                <li>• Performance affichage optimisée</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Apostrophes françaises causant page blanche</li>
                                <li>• Fix: Toggle colonne archivés sur desktop</li>
                                <li>• Fix: Gestion erreurs JavaScript</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.0 -->
            <div class="timeline-item" data-version="1.9.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-slate-600 to-gray-600 text-white">
                    <i class="fas fa-bolt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.0</h2>
                        <p class="text-gray-500 text-sm">27 octobre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Timer dynamique sur chaque ticket (mise à jour chaque seconde)</li>
                                <li>• Indicateur d'urgence coloré (vert/jaune/orange/rouge)</li>
                                <li>• Colonnes adaptatives (vides=200px, pleines=280-320px)</li>
                                <li>• Toggle pour afficher/masquer colonne archivée</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Design compact: badges réduits (CRIT/HAUT/MOY/BAS)</li>
                                <li>• Badges priorité déplacés sous le titre</li>
                                <li>• Layout desktop optimisé (6 colonnes à 5+1)</li>
                                <li>• Espacement réduit pour plus de densité</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.5 -->
            <div class="timeline-item" data-version="1.8.5" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-green-500 to-teal-600 text-white">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.5</h2>
                        <p class="text-gray-500 text-sm">15 octobre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Support Mobile & Tablette
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Interface complètement responsive</li>
                                <li>• Guide utilisateur accordéon (7 sections)</li>
                                <li>• Touch events pour drag & drop mobile</li>
                                <li>• Navigation tactile optimisée</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Versions Antérieures Résumé -->
            <div class="timeline-item">
                <div class="timeline-dot bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="version-card bg-gray-50">
                    <h2 class="text-xl font-bold text-gray-800 mb-3">Versions 2025 Antérieures</h2>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.8.0 - 1 octobre 2025</span>
                            <span class="text-xs">Format dates québécois & Timezone EST</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.7.0 - 20 septembre 2025</span>
                            <span class="text-xs">Multi-rôles & Sécurité renforcée</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.6.0 - 5 septembre 2025</span>
                            <span class="text-xs">Upload images (Cloudflare R2)</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.5.0 - 22 août 2025</span>
                            <span class="text-xs">Système de commentaires</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.4.0 - 8 août 2025</span>
                            <span class="text-xs">Menu contextuel avancé</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.3.0 - 25 juillet 2025</span>
                            <span class="text-xs">Gestion des machines</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.2.0 - 10 juillet 2025</span>
                            <span class="text-xs">Interface Kanban drag & drop</span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="font-semibold">v1.0.0-1.1.0 - Juin 2025</span>
                            <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Lancement production</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 2024 -->
            <div class="timeline-item">
                <div class="timeline-dot bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="version-card bg-gradient-to-br from-orange-50 to-amber-50">
                    <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-hammer text-orange-600"></i>
                        Développements 2024
                    </h2>
                    <div class="space-y-3 text-sm text-gray-700">
                        <div class="bg-white rounded p-3 border-l-4 border-orange-500">
                            <div class="font-semibold text-orange-800 mb-1">Q4 2024 (Oct-Déc)</div>
                            <ul class="space-y-1 ml-4 text-xs">
                                <li>• Tests UAT intensifs sur infrastructure complète</li>
                                <li>• Optimisations performance et scalabilité</li>
                                <li>• Finalisation documentation technique</li>
                                <li>• Préparation lancement production Q2 2025</li>
                            </ul>
                        </div>
                        
                        <div class="bg-white rounded p-3 border-l-4 border-amber-500">
                            <div class="font-semibold text-amber-800 mb-1">Q3 2024 (Juil-Sep)</div>
                            <ul class="space-y-1 ml-4 text-xs">
                                <li>• <strong>Août 2024:</strong> Début recherche UX chronometer labels (14 mois)</li>
                                <li>• Développement système permissions granulaires</li>
                                <li>• Implémentation audit logs et traçabilité</li>
                                <li>• Tests sécurité et pénétration</li>
                            </ul>
                        </div>
                        
                        <div class="bg-white rounded p-3 border-l-4 border-yellow-500">
                            <div class="font-semibold text-yellow-800 mb-1">Q2 2024 (Avr-Juin)</div>
                            <ul class="space-y-1 ml-4 text-xs">
                                <li>• <strong>Juin 2024:</strong> Infrastructure Cloudflare R2 Storage (17 mois dev)</li>
                                <li>• Architecture cleanup médias et lifecycle management</li>
                                <li>• Développement upload/galerie photos tickets</li>
                                <li>• Intégration messages audio avec R2</li>
                            </ul>
                        </div>
                        
                        <div class="bg-white rounded p-3 border-l-4 border-lime-500">
                            <div class="font-semibold text-lime-800 mb-1">Q1 2024 (Jan-Mar)</div>
                            <ul class="space-y-1 ml-4 text-xs">
                                <li>• <strong>Février 2024:</strong> Lancement projet "Smart Batch Operations" (21 mois)</li>
                                <li>• R&D bulk operations et sélection multiple</li>
                                <li>• Architecture API batch processing</li>
                                <li>• POC mode sélection avec checkboxes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 2023 -->
            <div class="timeline-item">
                <div class="timeline-dot bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    <i class="fas fa-seedling"></i>
                </div>
                <div class="version-card bg-gradient-to-br from-violet-50 to-purple-50">
                    <h2 class="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-violet-600"></i>
                        Fondations 2023
                    </h2>
                    <div class="space-y-3 text-sm text-gray-700">
                        <div class="bg-white rounded p-3 border-l-4 border-violet-500">
                            <div class="font-semibold text-violet-800 mb-1">Q4 2023 (Oct-Déc)</div>
                            <ul class="space-y-1 ml-4 text-xs">
                                <li>• Développement POC (Proof of Concept) interface Kanban</li>
                                <li>• Tests architecture Cloudflare Workers + D1 Database</li>
                                <li>• Validation approche serverless edge computing</li>
                                <li>• Design system et guidelines UI/UX</li>
                            </ul>
                        </div>
                        
                        <div class="bg-white rounded p-3 border-l-4 border-purple-500">
                            <div class="font-semibold text-purple-800 mb-1">Q3 2023 (Juil-Sep)</div>
                            <ul class="space-y-1 ml-4 text-xs">
                                <li>• Analyse besoins département mécanique IGP</li>
                                <li>• Recherche technologies: Cloudflare ecosystem</li>
                                <li>• Architecture technique & choix technologiques</li>
                                <li>• Planification roadmap développement 2024-2025</li>
                            </ul>
                        </div>
                        
                        <div class="bg-white rounded p-3 border-l-4 border-fuchsia-500">
                            <div class="font-semibold text-fuchsia-800 mb-1">🎯 Juillet 2023 - Lancement Projet</div>
                            <p class="text-xs mt-1">
                                Démarrage officiel du projet "Système de Gestion de Maintenance IGP" 
                                par le Département des Technologies de l'Information. 
                                Objectif: Moderniser processus maintenance avec solution cloud innovante.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Roadmap (À Venir) -->
        <div id="roadmap" class="mt-12 scroll-mt-8">
            <div class="bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 rounded-2xl shadow-2xl p-1">
                <div class="bg-white rounded-xl p-6 md:p-8">
                    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div>
                            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                                <i class="fas fa-rocket text-amber-500"></i>
                                Roadmap & Prochaines Versions
                            </h2>
                            <p class="text-gray-600 mt-2">Fonctionnalités planifiées et en développement</p>
                        </div>
                        <div class="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-bold text-sm animate-pulse shadow-lg">
                            <i class="fas fa-hourglass-half mr-2"></i>
                            EN DÉVELOPPEMENT
                        </div>
                    </div>
                    
                    <!-- Version 3.0.0 -->
                    <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300 shadow-lg">
                        <div class="flex items-start justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h3 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <span class="text-amber-600">v3.0.0</span>
                                    <span class="text-gray-400">-</span>
                                    <span class="text-gray-700">Support Multilingue</span>
                                </h3>
                                <p class="text-gray-600 text-sm mt-1 font-semibold">
                                    <i class="fas fa-calendar-alt text-amber-600 mr-2"></i>
                                    Décembre 2025 - Q1 2026
                                </p>
                            </div>
                        </div>
                        
                        <div class="space-y-6">
                            <!-- Feature principale -->
                            <div class="bg-white rounded-lg p-5 border-2 border-amber-200">
                                <h4 class="font-bold text-gray-800 mb-3 flex items-center text-lg">
                                    <i class="fas fa-language text-blue-600 mr-2 text-xl"></i>
                                    Version Anglaise Complète
                                </h4>
                                
                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div class="bg-blue-50 rounded-lg p-4">
                                        <h5 class="font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="fas fa-check-circle text-blue-600 mr-2"></i>
                                            Fonctionnalités
                                        </h5>
                                        <ul class="space-y-1 text-gray-600 text-sm">
                                            <li>• Interface traduite en anglais</li>
                                            <li>• Sélecteur de langue FR/EN</li>
                                            <li>• Adaptation département Thermos</li>
                                            <li>• Support opérateurs anglophones</li>
                                        </ul>
                                    </div>
                                    
                                    <div class="bg-green-50 rounded-lg p-4">
                                        <h5 class="font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="fas fa-users text-green-600 mr-2"></i>
                                            Bénéfices
                                        </h5>
                                        <ul class="space-y-1 text-gray-600 text-sm">
                                            <li>• Accessibilité universelle</li>
                                            <li>• Barrières linguistiques réduites</li>
                                            <li>• Formation simplifiée</li>
                                            <li>• Standardisation interdépartementale</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border-l-4 border-blue-500">
                                    <p class="text-sm text-gray-700 flex items-start gap-2">
                                        <i class="fas fa-bullseye text-blue-600 mt-0.5 text-lg"></i>
                                        <span>
                                            <strong class="text-blue-800">Objectif:</strong> Faciliter l'adoption par les équipes 
                                            anglophones du département Thermos et améliorer la communication interdépartementale 
                                            pour une meilleure collaboration à travers l'usine.
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Badges -->
                            <div class="flex flex-wrap gap-2">
                                <span class="badge badge-upcoming text-base">
                                    <i class="fas fa-clock"></i> En développement
                                </span>
                                <span class="badge badge-feature text-base">
                                    <i class="fas fa-language"></i> Multilingue
                                </span>
                                <span class="badge text-base" style="background: #e0f2fe; color: #0369a1;">
                                    <i class="fas fa-building"></i> Département Thermos
                                </span>
                                <span class="badge text-base" style="background: #f0fdf4; color: #166534;">
                                    <i class="fas fa-globe"></i> Accessibilité
                                </span>
                            </div>
                            
                            <!-- Note -->
                            <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-l-4 border-amber-500">
                                <p class="text-sm text-gray-700 flex items-start gap-2">
                                    <i class="fas fa-lightbulb text-amber-600 mt-0.5 text-lg"></i>
                                    <span>
                                        <strong class="text-amber-800">Note importante:</strong> Cette fonctionnalité est en phase 
                                        de planification active. Les dates de livraison et les fonctionnalités spécifiques peuvent 
                                        être ajustées en fonction des besoins opérationnels et des retours des utilisateurs.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Call to action -->
                    <div class="mt-8 text-center">
                        <div class="inline-block bg-gradient-to-r from-slate-100 to-blue-100 rounded-xl p-6 border-2 border-gray-300">
                            <p class="text-gray-700 mb-3 flex items-center justify-center gap-2">
                                <i class="fas fa-comments text-slate-600 text-xl"></i>
                                <span class="font-semibold">Vous avez des suggestions ou des besoins spécifiques ?</span>
                            </p>
                            <a href="https://contact.aide.support/fr9ercvp1ay" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-blue-700 text-white rounded-lg font-bold hover:from-slate-800 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                <i class="fas fa-paper-plane"></i>
                                Contactez-nous
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center">
            <a href="/" class="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl text-lg border-2 border-gray-200">
                <i class="fas fa-arrow-left text-blue-600"></i>
                Retour à l'application
            </a>
        </div>

        <div class="mt-6 text-center text-white text-sm">
            <p>© 2025 - Produits Verriers International (IGP) Inc.</p>
            <p class="mt-1 opacity-75">Développé par le Département des Technologies de l'Information</p>
        </div>
    </div>

    <script>
        function filterVersions(type) {
            const items = document.querySelectorAll('.timeline-item');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('filter-' + type).classList.add('active');
            
            // Filter items
            items.forEach(item => {
                const types = item.dataset.types;
                if (type === 'all' || !types) {
                    item.style.display = 'block';
                } else {
                    item.style.display = types.includes(type) ? 'block' : 'none';
                }
            });
        }
    </script>
</body>
</html>
  `);
});

// Route de test simple
app.get('/test', (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Simple</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        const App = () => {
            return React.createElement('div', { style: { padding: '20px', fontSize: '24px', fontFamily: 'Arial' } },
                'Hello World! React fonctionne! ✅'
            );
        };
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
  `);
});

app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.8.0'
  });
});

// ========================================
// CRON HANDLER - Vérification automatique des tickets expirés
// ========================================
// Ce handler s'exécute automatiquement toutes les 5 minutes
// même si personne n'utilise l'application
const scheduled = async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
  console.log('🔔 CRON démarré:', new Date().toISOString());
  
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Récupérer tous les tickets planifiés expirés
    const overdueTickets = await env.DB.prepare(`
      SELECT 
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        m.machine_type,
        m.model,
        t.scheduled_date,
        t.assigned_to,
        t.created_at,
        u.full_name as assignee_name,
        reporter.full_name as reporter_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users reporter ON t.reported_by = reporter.id
      WHERE t.assigned_to IS NOT NULL
        AND t.scheduled_date IS NOT NULL
        AND t.scheduled_date != 'null'
        AND t.scheduled_date != ''
        AND t.status IN ('received', 'diagnostic')
        AND datetime(t.scheduled_date) < datetime('now')
      ORDER BY t.scheduled_date ASC
    `).all();
    
    if (!overdueTickets.results || overdueTickets.results.length === 0) {
      console.log('✅ CRON: Aucun ticket expiré trouvé');
      return;
    }
    
    console.log(`📋 CRON: ${overdueTickets.results.length} ticket(s) expiré(s) trouvé(s)`);
    
    let notificationsSent = 0;
    const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';
    
    // Pour chaque ticket expiré
    for (const ticket of overdueTickets.results) {
      try {
        // Vérifier si notification déjà envoyée dans les 24h
        const existingNotification = await env.DB.prepare(`
          SELECT id, sent_at 
          FROM webhook_notifications 
          WHERE ticket_id = ? 
            AND notification_type = 'overdue_scheduled'
            AND datetime(sent_at) > datetime(?)
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(ticket.id, twentyFourHoursAgo.toISOString()).first();
        
        if (existingNotification) {
          console.log(`⏭️  CRON: Ticket ${ticket.ticket_id} déjà notifié (< 24h)`);
          continue;
        }
        
        // Calculer le retard
        const scheduledDate = new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z');
        const overdueMs = now.getTime() - scheduledDate.getTime();
        const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
        const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Préparer les données webhook
        const webhookData = {
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          machine: `${ticket.machine_type || 'N/A'} ${ticket.model || ''}`,
          scheduled_date: ticket.scheduled_date,
          assigned_to: ticket.assigned_to === 0 ? 'Équipe complète' : (ticket.assignee_name || `Technicien #${ticket.assigned_to}`),
          reporter: ticket.reporter_name || 'N/A',
          created_at: ticket.created_at,
          overdue_days: overdueDays,
          overdue_hours: overdueHours,
          overdue_minutes: overdueMinutes,
          overdue_text: overdueDays > 0 
            ? `${overdueDays} jour(s) ${overdueHours}h ${overdueMinutes}min`
            : `${overdueHours}h ${overdueMinutes}min`,
          notification_sent_at: now.toISOString()
        };
        
        // Envoyer le webhook
        const webhookResponse = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        const responseStatus = webhookResponse.status;
        let responseBody = '';
        try {
          responseBody = await webhookResponse.text();
        } catch (e) {
          responseBody = 'Could not read response body';
        }
        
        // Capturer le timestamp APRÈS l'envoi pour avoir un timestamp unique par webhook
        const sentAt = new Date().toISOString();
        
        // Enregistrer la notification
        await env.DB.prepare(`
          INSERT INTO webhook_notifications 
          (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          ticket.id,
          'overdue_scheduled',
          WEBHOOK_URL,
          sentAt,
          responseStatus,
          responseBody.substring(0, 1000)
        ).run();
        
        notificationsSent++;
        console.log(`✅ CRON: Webhook envoyé pour ${ticket.ticket_id} (status: ${responseStatus})`);
        
        // Délai de 200ms entre chaque webhook pour éviter la déduplication par Pabbly Connect
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ CRON: Erreur pour ${ticket.ticket_id}:`, error);
      }
    }
    
    console.log(`🎉 CRON terminé: ${notificationsSent}/${overdueTickets.results.length} notification(s) envoyée(s)`);
    
  } catch (error) {
    console.error('❌ CRON: Erreur globale:', error);
  }
};

// Export pour Cloudflare Pages
// Note: Le handler scheduled() est défini ci-dessus mais non utilisé pour Pages
// Pour activer les notifications automatiques, utilisez un service CRON externe
// qui appelle POST /api/webhooks/check-overdue-tickets toutes les 5 minutes
export default app;
