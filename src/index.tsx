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
  'https://02fd9e0f.webapp-7t8.pages.dev',   // Dernière version déployée
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
app.get('/api/messages/audio/:fileKey(*)', async (c) => {
  try {
    const fileKey = c.req.param('fileKey');
    
    // Vérifier que le message existe
    const message = await c.env.DB.prepare(`
      SELECT sender_id, recipient_id, message_type
      FROM messages
      WHERE audio_file_key = ?
    `).bind(fileKey).first();
    
    if (!message) {
      return c.json({ error: 'Message audio non trouvé' }, 404);
    }
    
    // TODO: Ajouter système de tokens pour sécuriser les messages privés
    // Pour l'instant, on autorise l'accès à tous les messages audio
    // car les balises <audio> ne peuvent pas envoyer de headers d'authentification
    
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

// Recuperer les messages publics
app.get('/api/messages/public', authMiddleware, async (c) => {
  try {
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
      LIMIT 100
    `).all();
    
    return c.json({ messages: results });
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
      WHERE role IN ('operator', 'technician', 'supervisor', 'admin')
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
    
    // Recuperer le message
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
    
    // Supprimer le message
    await c.env.DB.prepare(`
      DELETE FROM messages WHERE id = ?
    `).bind(messageId).run();
    
    return c.json({ message: 'Message supprime avec succes' });
  } catch (error) {
    console.error('Delete message error:', error);
    return c.json({ error: 'Erreur lors de la suppression du message' }, 500);
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
    
    const now = new Date().toISOString();
    
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
      
      const assignedInfo = ticket.assigned_to === 'all' 
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
                        'igp-blue': '#1e40af',
                        'igp-orange': '#ea580c',
                        'igp-red': '#dc2626',
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
            min-width: 240px;
            background: linear-gradient(145deg, #f8fafc, #e2e8f0);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 
                8px 8px 16px rgba(71, 85, 105, 0.15),
                -4px -4px 12px rgba(255, 255, 255, 0.7),
                inset 1px 1px 2px rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(148, 163, 184, 0.1);
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
            border: 2px dashed #3b82f6;
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
        
        // Fonction pour formater les dates en heure EST (America/Toronto)
        // Format québécois: JJ-MM-AAAA HH:mm
        const formatDateEST = (dateString, includeTime = true) => {
            const date = new Date(dateString);
            
            // Convertir en EST (America/Toronto)
            const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
            
            const day = String(estDate.getDate()).padStart(2, '0');
            const month = String(estDate.getMonth() + 1).padStart(2, '0');
            const year = estDate.getFullYear();
            
            if (includeTime) {
                const hours = String(estDate.getHours()).padStart(2, '0');
                const minutes = String(estDate.getMinutes()).padStart(2, '0');
                return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
            }
            
            return day + '-' + month + '-' + year;
        };
        
        // Fonction pour calculer le temps écoulé depuis la création
        // Retourne un objet {days, hours, minutes, seconds, color, bgColor}
        const getElapsedTime = (createdAt) => {
            const now = new Date();
            const created = new Date(createdAt);
            const diffMs = now - created;
            
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
                color = 'text-orange-700 font-semibold';
                bgColor = 'bg-orange-50 border-orange-200';
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
                className: 'mt-1.5 pt-1.5 border-t border-gray-200 flex items-center justify-between text-xs ' + elapsed.color
            },
                React.createElement('div', { className: 'flex items-center gap-1' },
                    React.createElement('span', {}, elapsed.icon),
                    React.createElement('i', { className: 'fas fa-hourglass-half' })
                ),
                React.createElement('span', { className: 'font-bold font-mono' }, formatElapsedTime(elapsed))
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
            
            const now = new Date();
            const scheduled = new Date(scheduledDate.replace(' ', 'T'));
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
                className = 'bg-orange-100 text-orange-800';
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
            
            console.log('UserGuideModal render - activeSection:', activeSection, 'currentUser:', currentUser);
            
            // Fonction pour obtenir le badge du rôle actuel
            const getUserRoleBadge = () => {
                if (!currentUser) return '❓';
                if (currentUser.role === 'admin') return '👑 Admin';
                if (currentUser.role === 'supervisor') return '⭐ Superviseur';
                if (currentUser.role === 'technician') return '🔧 Technicien';
                return '👷 Opérateur';
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
                    title: "👥 Les 4 Rôles",
                    icon: "fa-users",
                    color: "purple",
                    content: [
                        "👑 ADMIN → Tout faire",
                        "⭐ SUPERVISEUR → Comme admin sauf gestion admins",
                        "🔧 TECHNICIEN → Déplacer + modifier tickets",
                        "👷 OPÉRATEUR → Créer tickets uniquement",
                        "",
                        "📌 VOUS ÊTES: " + getUserRoleBadge(),
                        "",
                        "💡 Chaque rôle voit seulement ses permissions"
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
                        "• 🏷️ Version 1.9.2"
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
                className: 'fixed inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] flex flex-col',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'flex justify-between items-center p-6 border-b-2 border-gradient-to-r from-indigo-400 to-purple-400 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm rounded-t-2xl' },
                        React.createElement('h2', { className: 'text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-book text-purple-500' }),
                            "Guide Utilisateur"
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-gray-500 hover:text-gray-700 text-2xl'
                        }, '×')
                    ),
                    
                    React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
                        React.createElement('div', { className: 'w-64 bg-gradient-to-b from-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4 overflow-y-auto border-r-2 border-purple-200/50' },
                            React.createElement('nav', { className: 'space-y-1' },
                                menuItems.map(item =>
                                    React.createElement('button', {
                                        key: item.id,
                                        onClick: () => setActiveSection(item.id),
                                        className: 'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ' + 
                                            (activeSection === item.id ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md' : 'hover:bg-white/60 hover:shadow-sm text-gray-700')
                                    },
                                        React.createElement('i', { className: 'fas ' + item.icon + ' w-5' }),
                                        React.createElement('span', { className: 'text-sm' }, item.label)
                                    )
                                )
                            )
                        ),
                        
                        React.createElement('div', { className: 'flex-1 p-6 overflow-y-auto bg-gradient-to-br from-white/50 to-indigo-50/30 backdrop-blur-sm' },
                            React.createElement('div', {},
                                React.createElement('p', { style: { color: 'red', fontSize: '12px' } }, 
                                    'DEBUG - activeSection: ' + activeSection + ', sections keys: ' + Object.keys(sections).join(', ')
                                ),
                                React.createElement('h3', { className: 'text-2xl font-bold mb-4 text-igp-blue' },
                                    sections[activeSection] ? sections[activeSection].title : 'Section manquante: ' + activeSection
                                ),
                                React.createElement('div', { className: 'prose max-w-none' },
                                    sections[activeSection] && sections[activeSection].content ? sections[activeSection].content.map((line, idx) =>
                                        React.createElement('p', {
                                            key: idx,
                                            className: line.startsWith('•') || line.startsWith('  ') ? 'ml-4 my-2' : 
                                                       line.startsWith('⚠️') || line.startsWith('✅') ? 'font-semibold my-3' :
                                                       line === '' ? 'my-2' : 'my-3'
                                        }, line)
                                    ) : React.createElement('p', {}, 'Contenu manquant pour: ' + activeSection)
                                )
                            )
                        )
                    ),
                    
                    React.createElement('div', { className: 'p-4 border-t-2 border-purple-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm rounded-b-2xl flex justify-between items-center' },
                        React.createElement('p', { className: 'text-sm text-gray-600' },
                            "Appuyez sur Escape pour fermer • Version 1.9.2"
                        ),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'px-6 py-3 bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-600 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(99,102,241,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(99,102,241,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-indigo-300/50'
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
            
            const handleSubmit = (e) => {
                e.preventDefault();
                onLogin(email, password);
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
                        React.createElement('p', { className: 'text-sm text-gray-600 mb-1' }, 'Les Produits Verriers International'),
                        React.createElement('p', { className: 'text-xs text-igp-orange font-semibold' }, '(IGP) Inc.')
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
                                onChange: (e) => setEmail(e.target.value),
                                placeholder: 'votre.email@igpglass.ca',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 
                                React.createElement('i', { className: 'fas fa-lock mr-2 text-igp-blue' }),
                                'Mot de passe'
                            ),
                            React.createElement('input', {
                                type: 'password',
                                name: 'password',
                                autoComplete: 'new-password',
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent',
                                value: password,
                                onChange: (e) => setPassword(e.target.value),
                                placeholder: '••••••••',
                                required: true
                            })
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'w-full bg-igp-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-700 transition duration-200 shadow-lg'
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
                    // Capturer l'heure locale de l'appareil de l'utilisateur
                    const localTime = new Date();
                    const year = localTime.getFullYear();
                    const month = String(localTime.getMonth() + 1).padStart(2, '0');
                    const day = String(localTime.getDate()).padStart(2, '0');
                    const hours = String(localTime.getHours()).padStart(2, '0');
                    const minutes = String(localTime.getMinutes()).padStart(2, '0');
                    const seconds = String(localTime.getSeconds()).padStart(2, '0');
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
                            requestBody.assigned_to = parseInt(assignedTo);
                        }
                        if (scheduledDate) {
                            requestBody.scheduled_date = scheduledDate + ':00'; // Format: YYYY-MM-DDTHH:mm:ss
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
            
            if (!show) return null;
            
            return React.createElement('div', { 
                className: 'fixed inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
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
                    React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10 backdrop-blur-sm bg-opacity-95' },
                        React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                            React.createElement('i', { className: 'fas fa-plus-circle text-xl sm:text-2xl text-orange-400 flex-shrink-0' }),
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
                                onChange: (e) => setTitle(e.target.value),
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
                                onChange: (e) => setDescription(e.target.value),
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
                                onChange: (e) => setMachineId(e.target.value),
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
                                React.createElement('i', { className: 'fas fa-camera mr-2 text-igp-orange' }),
                                'Photos / Vidéos du problème'
                            ),
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*',
                                capture: 'environment',
                                multiple: true,
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
                                                ? 'bg-igp-orange text-white shadow-md' 
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
                            React.createElement('div', { className: 'mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg' },
                                React.createElement('h3', { className: 'text-lg font-bold text-purple-800 mb-4 flex items-center' },
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
                                        className: "w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-purple-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all hover:shadow-xl cursor-pointer font-semibold appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(147, 51, 234, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' }
                                    },
                                        React.createElement('option', { value: '' }, '-- Non assigné --'),
                                        React.createElement('option', { value: 'all' }, '👥 Toute equipe'),
                                        technicians.map(tech => 
                                            React.createElement('option', { 
                                                key: tech.id, 
                                                value: tech.id 
                                            }, 
                                                '👤 ' + tech.full_name
                                            )
                                        )
                                    )
                                ),
                                
                                // Date et heure planifiée
                                React.createElement('div', { className: 'mb-2' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 
                                        React.createElement('i', { className: 'fas fa-clock mr-2' }),
                                        'Date planifiée'
                                    ),
                                    React.createElement('input', {
                                        type: 'datetime-local',
                                        value: scheduledDate,
                                        onChange: (e) => setScheduledDate(e.target.value),
                                        className: 'w-full px-4 py-2 border-2 border-purple-300 rounded-md focus:border-purple-500 focus:outline-none'
                                    })
                                )
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
                                className: 'w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 shadow-lg transition-all font-semibold'
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
                    setScheduledAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
                    setScheduledDate(ticket.scheduled_date ? ticket.scheduled_date.substring(0, 16) : '');
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
                // Verification: technicien ne peut pas supprimer un ticket planifie cree par quelqu un d autre
                if (currentUser.role === 'technician' && ticket?.scheduled_date && ticket?.reported_by !== currentUser.id) {
                    alert('Les techniciens ne peuvent pas supprimer les tickets planifies crees par d autres utilisateurs');
                    return;
                }
                
                if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.')) {
                    return;
                }
                
                try {
                    await axios.delete(API_URL + '/tickets/' + ticketId);
                    alert('Ticket supprimé avec succès');
                    onClose();
                    if (onTicketDeleted) onTicketDeleted();
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };
            
            const handleAddComment = async (e) => {
                e.preventDefault();
                if (!newComment.trim()) {
                    alert('Veuillez écrire un commentaire');
                    return;
                }
                
                setSubmittingComment(true);
                try {
                    // Capturer l'heure locale de l'appareil
                    const localTime = new Date();
                    const year = localTime.getFullYear();
                    const month = String(localTime.getMonth() + 1).padStart(2, '0');
                    const day = String(localTime.getDate()).padStart(2, '0');
                    const hours = String(localTime.getHours()).padStart(2, '0');
                    const minutes = String(localTime.getMinutes()).padStart(2, '0');
                    const seconds = String(localTime.getSeconds()).padStart(2, '0');
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
                    if (scheduledAssignedTo) {
                        updateData.assigned_to = scheduledAssignedTo === 'all' ? null : parseInt(scheduledAssignedTo);
                    } else {
                        updateData.assigned_to = null;
                    }
                    
                    // Date planifiée
                    if (scheduledDate) {
                        updateData.scheduled_date = scheduledDate + ':00';
                    } else {
                        updateData.scheduled_date = null;
                    }
                    
                    await axios.patch(API_URL + '/tickets/' + ticketId, updateData);
                    
                    alert('Planification mise à jour avec succès !');
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
                className: 'modal active bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-sm',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'modal-content bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 md:p-8 max-w-4xl w-full mx-4 my-auto',
                    onClick: (e) => e.stopPropagation(),
                    style: { marginTop: 'auto', marginBottom: 'auto', maxHeight: '90vh', overflowY: 'auto' }
                },
                    React.createElement('div', { className: 'flex justify-between items-center mb-6 pb-4 border-b-2 border-gradient-to-r from-blue-400 to-purple-400' },
                        React.createElement('h2', { className: 'text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' },
                            React.createElement('i', { className: 'fas fa-ticket-alt mr-2 text-orange-500' }),
                            "Détails du Ticket"
                        ),
                        React.createElement('div', { className: 'flex gap-3' },
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
                                React.createElement('i', { className: 'fas fa-trash-alt fa-2x' })
                            ) : null,
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700'
                            },
                                React.createElement('i', { className: 'fas fa-times fa-2x' })
                            )
                        )
                    ),
                    
                    loading ? React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
                    ) : ticket ? React.createElement('div', {},
                        
                        React.createElement('div', { className: 'mb-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-blue-200/50' },
                            React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                                React.createElement('span', { className: 'text-sm sm:text-base font-mono font-bold text-blue-700 bg-blue-100/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg' }, ticket.ticket_id),
                                React.createElement('span', { 
                                    className: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold shadow-md text-xs sm:text-sm ' + 
                                    (ticket.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                     ticket.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                     ticket.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                                     'bg-gradient-to-r from-green-500 to-green-600 text-white')
                                }, 
                                    ticket.priority === 'critical' ? '🔴 CRITIQUE' :
                                    ticket.priority === 'high' ? '🟠 HAUTE' :
                                    ticket.priority === 'medium' ? '🟡 MOYENNE' :
                                    '🟢 FAIBLE'
                                )
                            ),
                            React.createElement('h3', { className: 'text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3' }, ticket.title),
                            React.createElement('p', { className: 'text-sm sm:text-base text-gray-700 mb-4 sm:mb-5 leading-relaxed bg-white/60 p-3 sm:p-4 rounded-lg' }, ticket.description),
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3' },
                                React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-cog text-blue-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Machine:')
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.machine_type + ' ' + ticket.model)
                                ),
                                React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-3 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-tasks text-purple-600 text-sm' }),
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
                                        React.createElement('i', { className: 'fas fa-user text-orange-600 text-sm' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Rapporté par:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.reporter_name || 'N/A')
                                )
                            )
                        ),
                        
                        // Section planification (superviseur/admin seulement)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? 
                            React.createElement('div', { className: 'mb-6 p-6 bg-gradient-to-br from-purple-50/90 to-pink-50/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-purple-200/50' },
                                React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                                    React.createElement('h4', { className: 'text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center' },
                                        React.createElement('i', { className: 'fas fa-calendar-alt mr-2 text-purple-500' }),
                                        'Planification'
                                    ),
                                    !editingSchedule ? React.createElement('button', {
                                        onClick: () => setEditingSchedule(true),
                                        className: 'px-4 py-2.5 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(147,51,234,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-purple-300/50'
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
                                                React.createElement('i', { className: 'fas fa-user-cog text-purple-600' }),
                                                React.createElement('span', { className: 'font-bold text-gray-700' }, "Assigné à:")
                                            ),
                                            React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                                ticket.assigned_to 
                                                    ? (ticket.assigned_to === 'all' ? '👥 Toute équipe' : '👤 Technicien #' + ticket.assigned_to)
                                                    : '❌ Non assigné'
                                            )
                                        ),
                                        React.createElement('div', { className: 'bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-sm' },
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('i', { className: 'far fa-clock text-purple-600' }),
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
                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2' }, 
                                                React.createElement('i', { className: 'fas fa-user-cog mr-2 text-purple-600' }),
                                                "Assigner à"
                                            ),
                                            React.createElement('select', {
                                                value: scheduledAssignedTo,
                                                onChange: (e) => setScheduledAssignedTo(e.target.value),
                                                className: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-purple-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-semibold'
                                            },
                                                React.createElement('option', { value: '' }, '-- Non assigné --'),
                                                React.createElement('option', { value: 'all' }, '👥 Toute équipe'),
                                                technicians.map(tech => 
                                                    React.createElement('option', { 
                                                        key: tech.id, 
                                                        value: tech.id 
                                                    }, 
                                                        '👤 ' + tech.full_name
                                                    )
                                                )
                                            )
                                        ),
                                        
                                        // Date et heure planifiée
                                        React.createElement('div', {},
                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2' }, 
                                                React.createElement('i', { className: 'fas fa-clock mr-2 text-purple-600' }),
                                                "Date planifiée"
                                            ),
                                            React.createElement('input', {
                                                type: 'datetime-local',
                                                value: scheduledDate,
                                                onChange: (e) => setScheduledDate(e.target.value),
                                                className: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-purple-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-semibold'
                                            })
                                        ),
                                        
                                        // Boutons d'action
                                        React.createElement('div', { className: 'flex justify-end gap-3 pt-3' },
                                            React.createElement('button', {
                                                onClick: () => {
                                                    setEditingSchedule(false);
                                                    setScheduledAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
                                                    setScheduledDate(ticket.scheduled_date ? ticket.scheduled_date.substring(0, 16) : '');
                                                },
                                                className: 'px-5 py-2.5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-lg font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                            },
                                                React.createElement('i', { className: 'fas fa-times mr-1' }),
                                                'Annuler'
                                            ),
                                            React.createElement('button', {
                                                onClick: handleSaveSchedule,
                                                disabled: savingSchedule,
                                                className: 'px-5 py-2.5 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 text-white rounded-lg font-bold transition-all shadow-[0_8px_16px_rgba(147,51,234,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(147,51,234,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-t border-purple-300/50'
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
                        
                        
                        (ticket.media && ticket.media.length > 0) ? React.createElement('div', { className: 'mb-6' },
                            React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mb-3 flex items-center' },
                                React.createElement('i', { className: 'fas fa-images mr-2 text-igp-orange' }),
                                'Photos et Vidéos (' + ticket.media.length + ')'
                            ),
                            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' },
                                ticket.media.map((media, index) =>
                                    React.createElement('div', { 
                                        key: media.id,
                                        className: 'relative group cursor-pointer',
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
                                        React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center' },
                                            React.createElement('i', { className: 'fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-all' })
                                        ),
                                        React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded' },
                                            media.file_type.startsWith('image/') ? '📷' : '🎥'
                                        )
                                    )
                                )
                            )
                        ) : null,
                        
                        
                        (!ticket.media || ticket.media.length === 0) ? React.createElement('div', { className: 'mb-6 text-center py-8 bg-gray-50 rounded' },
                            React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
                            React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
                        ) : null,
                        
                        
                        React.createElement('div', { className: 'mb-6 border-t-2 border-gray-200 pt-6' },
                            React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-comments mr-2 text-igp-blue' }),
                                'Commentaires et Notes (' + comments.length + ')'
                            ),
                            
                            
                            comments.length > 0 ? React.createElement('div', { className: 'space-y-3 mb-4 max-h-64 overflow-y-auto' },
                                comments.map(comment =>
                                    React.createElement('div', { 
                                        key: comment.id,
                                        className: 'bg-gray-50 rounded-lg p-3 border-l-4 ' + 
                                                   (comment.user_role === 'Technicien' ? 'border-igp-orange' : 'border-igp-blue')
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
                                className: 'bg-blue-50 rounded-lg p-4 border-2 border-igp-blue'
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
                                        onChange: (e) => setNewComment(e.target.value),
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
                        
                        
                        React.createElement('div', { className: 'mb-6 border-t-2 border-gray-200 pt-6' },
                            React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mb-4 flex items-center' },
                                React.createElement('i', { className: 'fas fa-camera-retro mr-2 text-igp-orange' }),
                                'Ajouter des photos/vidéos supplémentaires'
                            ),
                            
                            
                            newMediaPreviews.length > 0 ? React.createElement('div', { className: 'mb-4' },
                                React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' },
                                    React.createElement('i', { className: 'fas fa-images mr-1' }),
                                    newMediaPreviews.length + ' fichier(s) sélectionné(s)'
                                ),
                                React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-3' },
                                    newMediaPreviews.map((preview, index) =>
                                        React.createElement('div', { 
                                            key: index,
                                            className: 'relative group'
                                        },
                                            preview.type.startsWith('image/')
                                                ? React.createElement('img', {
                                                    src: preview.url,
                                                    alt: preview.name,
                                                    className: 'w-full h-24 object-cover rounded border-2 border-igp-orange'
                                                })
                                                : React.createElement('div', { className: 'w-full h-24 bg-gray-200 rounded border-2 border-igp-orange flex items-center justify-center' },
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
                                    className: 'w-full px-4 py-2 bg-igp-orange text-white rounded-md hover:bg-orange-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
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
                            
                            
                            React.createElement('div', { className: 'flex gap-3 justify-center' },
                                React.createElement('label', { 
                                    className: 'inline-block px-6 py-3 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-200 hover:border-blue-600 transition-all'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        multiple: true,
                                        accept: 'image/*',
                                        capture: 'environment',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden',
                                        id: 'photo-upload-detail'
                                    }),
                                    React.createElement('i', { className: 'fas fa-camera text-2xl text-blue-600 mb-2 block' }),
                                    React.createElement('span', { className: 'text-sm font-semibold text-blue-700 block' },
                                        'Prendre une photo'
                                    )
                                ),
                                React.createElement('label', { 
                                    className: 'inline-block px-6 py-3 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-200 hover:border-gray-600 transition-all'
                                },
                                    React.createElement('input', {
                                        type: 'file',
                                        multiple: true,
                                        accept: 'image/*,video/*',
                                        onChange: handleNewMediaChange,
                                        className: 'hidden',
                                        id: 'media-upload-detail'
                                    }),
                                    React.createElement('i', { className: 'fas fa-images text-2xl text-gray-600 mb-2 block' }),
                                    React.createElement('span', { className: 'text-sm font-semibold text-gray-700 block' },
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
                ) : null
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
                    React.createElement("div", { className: "bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5 flex justify-between items-center" },
                        React.createElement("div", { className: "flex items-center gap-3" },
                            React.createElement("i", { className: "fas fa-cogs text-2xl" }),
                            React.createElement("h2", { className: "text-2xl font-bold" }, "Gestion des Machines")
                        ),
                        React.createElement("button", {
                            onClick: onClose,
                            className: "text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                        },
                            React.createElement("i", { className: "fas fa-times text-xl" })
                        )
                    ),
                    React.createElement("div", { className: "flex-1 overflow-y-auto p-6", ref: scrollContainerRef },
                        React.createElement("div", { className: "mb-4 flex gap-3" },
                            currentUser.role === "admin" ? React.createElement("button", {
                                onClick: () => setShowCreateForm(!showCreateForm),
                                className: "px-6 py-3 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            }, showCreateForm ? "Annuler" : "Nouvelle Machine") : null,
                            React.createElement("input", {
                                type: "text",
                                placeholder: "Rechercher...",
                                value: searchQuery,
                                onChange: (e) => setSearchQuery(e.target.value),
                                className: "flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                            })
                        ),
                        
                        showCreateForm ? React.createElement("form", {
                            onSubmit: handleCreate,
                            className: "mb-6 p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-lg"
                        },
                            React.createElement("h3", { className: "text-xl font-bold mb-4 text-orange-800" }, "Nouvelle Machine"),
                            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Type *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newType,
                                        onChange: (e) => setNewType(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none",
                                        placeholder: "Ex: Polisseuse, CNC, Four..."
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Modele *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newModel,
                                        onChange: (e) => setNewModel(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none",
                                        placeholder: "Ex: Bavelloni, Double Edger..."
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Numero de serie *"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newSerial,
                                        onChange: (e) => setNewSerial(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none",
                                        placeholder: "Ex: PDE-001"
                                    })
                                ),
                                React.createElement("div", {},
                                    React.createElement("label", { className: "block font-semibold mb-2" }, "Emplacement"),
                                    React.createElement("input", {
                                        type: "text",
                                        value: newLocation,
                                        onChange: (e) => setNewLocation(e.target.value),
                                        className: "w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:outline-none",
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
                                    className: "bg-white rounded-xl p-4 shadow-md border-2 border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all"
                                },
                                    React.createElement("div", { className: "flex justify-between items-center" },
                                        React.createElement("div", { className: "flex-1" },
                                            React.createElement("div", { className: "flex items-center gap-3 mb-2" },
                                                React.createElement("h4", { className: "font-bold text-lg" }, machine.machine_type + " - " + machine.model),
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
                                        currentUser.role === "admin" || currentUser.role === "supervisor" ? React.createElement("div", { className: "flex gap-2" },
                                            React.createElement("button", {
                                                onClick: () => handleEdit(machine),
                                                className: "px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all"
                                            },
                                                React.createElement("i", { className: "fas fa-edit" })
                                            ),
                                            currentUser.role === "admin" ? React.createElement("button", {
                                                onClick: () => handleDelete(machine),
                                                className: "px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all"
                                            },
                                                React.createElement("i", { className: "fas fa-trash" })
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
                    loadUsers();
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
            
            const handleCreateUser = async (e) => {
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
            };
            
            const getRoleLabel = (role) => {
                if (role === 'admin') return '👑 Administrateur';
                if (role === 'supervisor') return '⭐ Superviseur';
                if (role === 'technician') return '🔧 Technicien';
                return '👷 Opérateur';
            };
            
            const getRoleBadgeClass = (role) => {
                if (role === 'admin') return 'bg-red-100 text-red-800';
                if (role === 'supervisor') return 'bg-yellow-100 text-yellow-800';
                if (role === 'technician') return 'bg-blue-100 text-blue-800';
                return 'bg-green-100 text-green-800';
            };
            
            const getLastLoginStatus = (lastLogin) => {
                if (!lastLogin) return { 
                    color: "text-gray-500", 
                    icon: "fa-circle", 
                    status: "Jamais connecte", 
                    time: "", 
                    dot: "bg-gray-400" 
                };
                
                const now = new Date();
                const loginDate = new Date(lastLogin);
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
                        color: "text-orange-600", 
                        icon: "fa-circle", 
                        status: "Actif aujourd'hui", 
                        time: "Il y a " + diffHours + "h", 
                        dot: "bg-orange-500" 
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
            };
            
            const canSeeLastLogin = (targetUser) => {
                // Admin voit tout le monde
                if (currentUser.role === "admin") return true;
                // Superviseur voit seulement les techniciens
                if (currentUser.role === "supervisor" && targetUser.role === "technician") return true;
                // Autres cas: non visible
                return false;
            };
            
            const handleDeleteUser = (userId, userName) => {
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
            };
            
            const handleEditUser = (user) => {
                setEditingUser(user);
                setEditEmail(user.email);
                setEditFullName(user.full_name);
                setEditRole(user.role);
            };
            
            const handleUpdateUser = async (e) => {
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
            };
            
            const handleResetPassword = (userId, userName) => {
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
            };
            
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-pink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10' },
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
                            className: 'px-6 py-3 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-orange-300/50'
                        }, "Créer un utilisateur") : null,
                        React.createElement('div', { className: 'flex-1 relative' },
                            React.createElement('input', {
                                type: 'text',
                                placeholder: 'Rechercher par nom ou email...',
                                value: searchQuery,
                                onChange: (e) => setSearchQuery(e.target.value),
                                className: 'w-full px-4 py-2 pl-10 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all',
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
                        className: 'mb-6 p-6 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-blue-200/50 scroll-mt-4',
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
                                        onChange: (e) => setNewEmail(e.target.value),
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
                                        onChange: (e) => setNewFullName(e.target.value),
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
                                        onChange: (e) => setNewPassword(e.target.value),
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        required: true,
                                        minLength: 6
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                                    React.createElement('select', {
                                        value: newRole,
                                        onChange: (e) => setNewRole(e.target.value),
                                        className: "w-full px-4 py-3 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl cursor-pointer font-semibold appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%233b82f6%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' }
                                    },
                                        React.createElement('option', { value: 'operator' }, 'Operateur'),
                                        React.createElement('option', { value: 'technician' }, 'Technicien'),
                                        React.createElement('option', { value: 'supervisor' }, 'Superviseur'),
                                        currentUser.role === 'admin' ? React.createElement('option', { value: 'admin' }, 'Administrateur') : null
                                    )
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
                                    className: 'px-6 py-3 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-orange-300/50'
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
                                        onChange: (e) => setEditEmail(e.target.value),
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
                                        onChange: (e) => setEditFullName(e.target.value),
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        required: true
                                    })
                                )
                            ),
                            React.createElement('div', { className: 'mb-4' },
                                React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                                React.createElement('select', {
                                    value: editRole,
                                    onChange: (e) => setEditRole(e.target.value),
                                    className: "w-full px-4 py-3 bg-gradient-to-br from-white/90 to-green-50/80 backdrop-blur-sm border-2 border-green-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:shadow-xl cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%2322c55e%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                    style: { boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' },
                                    disabled: currentUser.role === 'supervisor' && editingUser?.role === 'admin'
                                },
                                    React.createElement('option', { value: 'operator' }, "Opérateur"),
                                    React.createElement('option', { value: 'technician' }, 'Technicien'),
                                    React.createElement('option', { value: 'supervisor' }, 'Superviseur'),
                                    currentUser.role === 'admin' ? React.createElement('option', { value: 'admin' }, 'Administrateur') : null
                                )
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
                                className: 'bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border-2 border-gray-200/50 hover:border-purple-400 hover:shadow-lg transition-all'
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
                                            className: "w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(99,102,241,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(99,102,241,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(99,102,241,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-indigo-300/50"
                                        },
                                            React.createElement('i', { className: "fas fa-comment mr-1" }),
                                            "Message"
                                        ) : null,
                                        (user.id !== currentUser.id && !(currentUser.role === 'supervisor' && user.role === 'admin') && currentUser.role !== 'technician') ? React.createElement(React.Fragment, null,
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
                                        React.createElement('button', {
                                            onClick: () => handleDeleteUser(user.id, user.full_name),
                                            className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(239,68,68,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(239,68,68,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(239,68,68,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-red-300/50'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash mr-1' }),
                                            'Supprimer'
                                        )
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
                    
                    // Rafraichir toutes les 10 secondes
                    const interval = setInterval(() => {
                        if (activeTab === "public") {
                            loadPublicMessages();
                        } else if (selectedContact) {
                            loadPrivateMessages(selectedContact.id);
                        }
                        loadUnreadCount();
                    }, 10000);
                    
                    return () => clearInterval(interval);
                }
            }, [show, activeTab, selectedContact]);
            
            React.useEffect(() => {
                scrollToBottom();
            }, [publicMessages, privateMessages]);
            
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
            
            // Fonctions audio
            const startRecording = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
                    });
                    
                    let mimeType = 'audio/webm;codecs=opus';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        if (MediaRecorder.isTypeSupported('audio/mp4')) {
                            mimeType = 'audio/mp4';
                        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                            mimeType = 'audio/webm';
                        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                            mimeType = 'audio/ogg;codecs=opus';
                        }
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
            
            const handleKeyPress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            };
            
            const formatMessageTime = (timestamp) => {
                const date = new Date(timestamp);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins < 1) return 'A instant';
                if (diffMins < 60) return 'Il y a ' + diffMins + 'min';
                if (diffMins < 1440) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            };
            
            const getRoleBadgeClass = (role) => {
                if (role === 'admin') return 'bg-red-100 text-red-700';
                if (role === 'supervisor') return 'bg-blue-100 text-blue-700';
                if (role === 'technician') return 'bg-green-100 text-green-700';
                return 'bg-gray-100 text-gray-700';
            };
            
            const getRoleLabel = (role) => {
                if (role === 'admin') return 'Admin';
                if (role === 'supervisor') return 'Superviseur';
                if (role === 'technician') return 'Technicien';
                return 'Operateur';
            };
            
            if (!show) return null;
            
            return React.createElement('div', {
                className: 'fixed inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
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
                        className: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 sm:p-5 flex justify-between items-center shadow-lg'
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
                            React.createElement('span', { className: 'inline xs:hidden' }, 'Prives'),
                            unreadCount > 0 ? React.createElement('span', {
                                className: 'absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse'
                            }, unreadCount) : null
                        )
                    ),
                    
                    // Content
                    React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
                        // PUBLIC TAB
                        activeTab === 'public' ? React.createElement('div', { className: 'flex-1 flex flex-col' },
                            // Messages publics
                            React.createElement('div', { className: 'flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
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
                                        React.createElement('div', {
                                            className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md'
                                        }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                                React.createElement('span', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, msg.sender_name),
                                                React.createElement('span', {
                                                    className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ' + getRoleBadgeClass(msg.sender_role)
                                                }, getRoleLabel(msg.sender_role)),
                                                React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                            ),
                                            msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                                React.createElement('div', { className: 'bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100' },
                                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                        React.createElement('i', { className: 'fas fa-microphone text-indigo-600 text-lg' }),
                                                        React.createElement('span', { className: 'text-sm font-medium text-indigo-700' }, 'Message vocal')
                                                    ),
                                                    React.createElement('div', { className: 'flex items-center gap-3' },
                                                        React.createElement('button', {
                                                            onClick: () => toggleAudio(msg.id),
                                                            className: 'w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95',
                                                            style: { flexShrink: 0 }
                                                        },
                                                            React.createElement('i', { 
                                                                className: 'fas fa-' + (playingAudio[msg.id] ? 'pause' : 'play') + ' text-xl',
                                                                style: playingAudio[msg.id] ? {} : { marginLeft: '3px' }
                                                            })
                                                        ),
                                                        React.createElement('div', { className: 'flex-1' },
                                                            React.createElement('div', { className: 'h-2 bg-gray-200 rounded-full overflow-hidden' },
                                                                React.createElement('div', { 
                                                                    className: 'h-full bg-indigo-600 transition-all',
                                                                    style: { width: '0%' }
                                                                })
                                                            )
                                                        )
                                                    ),
                                                    React.createElement('audio', {
                                                        ref: (el) => { if (el) audioRefs.current[msg.id] = el; },
                                                        preload: 'auto',
                                                        src: API_URL + '/messages/audio/' + msg.audio_file_key,
                                                        onEnded: () => {
                                                            console.log('Audio terminé:', msg.id);
                                                            setPlayingAudio(prev => ({ ...prev, [msg.id]: false }));
                                                        },
                                                        onError: (e) => {
                                                            console.error('❌ Erreur chargement audio:', e);
                                                            console.error('URL:', API_URL + '/messages/audio/' + msg.audio_file_key);
                                                            console.error('Error details:', e.target?.error);
                                                        },
                                                        onLoadedMetadata: () => console.log('✅ Métadonnées chargées:', msg.id),
                                                        style: { display: 'none' }
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
                                (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200' },
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
                                            className: 'flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
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
                                        className: 'flex-1 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all shadow-lg hover:shadow-xl',
                                        style: { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                        rows: 2
                                    }),
                                    React.createElement('button', {
                                        onClick: startRecording,
                                        className: 'px-3 sm:px-4 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                        title: 'Enregistrer un message vocal'
                                    },
                                        React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                        React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                    ),
                                    React.createElement('button', {
                                        onClick: sendMessage,
                                        disabled: !messageContent.trim(),
                                        className: 'px-3 sm:px-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-xl hover:shadow-2xl disabled:hover:shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                        style: { boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)' }
                                    },
                                        React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                        React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                                    )
                                ) : null
                            )
                        ) : null,
                        
                        // PRIVATE TAB
                        activeTab === 'private' ? React.createElement('div', { className: 'flex-1 flex flex-col sm:flex-row' },
                            // Liste des conversations - Mobile: collapsible, Desktop: sidebar
                            React.createElement('div', { className: (selectedContact ? 'hidden sm:flex ' : 'flex ') + 'w-full sm:w-80 md:w-96 border-r border-gray-200 flex-col bg-gray-50' },
                                React.createElement('div', { className: 'p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm' },
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
                                        className: "w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-white/95 to-indigo-50/80 backdrop-blur-sm border-2 border-indigo-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:shadow-xl cursor-pointer font-semibold text-xs sm:text-sm appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236366f1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
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
                                                className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md'
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
                            selectedContact ? React.createElement('div', { className: 'flex-1 flex flex-col' },
                                // Header contact with back button on mobile
                                React.createElement('div', { className: 'p-2 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                                        // Back button for mobile only
                                        React.createElement('button', {
                                            onClick: () => setSelectedContact(null),
                                            className: 'sm:hidden p-2 hover:bg-indigo-100 rounded-full transition-colors'
                                        },
                                            React.createElement('i', { className: 'fas fa-arrow-left text-indigo-600' })
                                        ),
                                        React.createElement('div', {
                                            className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0'
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
                                React.createElement('div', { className: 'flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                                    loading ? React.createElement('div', { className: 'text-center text-gray-400 py-12' },
                                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl sm:text-4xl text-indigo-500' })
                                    ) : privateMessages.length === 0 ? React.createElement('div', {
                                        className: 'text-center text-gray-400 py-8 sm:py-12 px-4'
                                    },
                                        React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-3 sm:mb-4 opacity-50' }),
                                        React.createElement('p', { className: 'text-sm sm:text-base' }, 'Commencez la conversation avec ' + selectedContact.full_name),
                                        React.createElement('p', { className: 'text-xs text-gray-400 mt-2' }, 'Ecrivez votre premier message ci-dessous')
                                    ) : privateMessages.map(msg => {
                                        const isMe = msg.sender_id === currentUser.userId;
                                        return React.createElement('div', {
                                            key: msg.id,
                                            className: 'flex items-start gap-2 ' + (isMe ? 'justify-end' : 'justify-start') + ' animate-fadeIn group'
                                        },
                                            !isMe && canDeleteMessage(msg) ? React.createElement('button', {
                                                onClick: (e) => {
                                                    e.stopPropagation();
                                                    deleteMessage(msg.id);
                                                },
                                                className: 'opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5 transform hover:scale-110 active:scale-95',
                                                title: 'Supprimer'
                                            },
                                                React.createElement('i', { className: 'fas fa-trash text-xs' })
                                            ) : null,
                                            React.createElement('div', {
                                                className: (msg.audio_file_key ? 'max-w-[95%] sm:max-w-[85%]' : 'max-w-[85%] sm:max-w-[70%]') + ' rounded-2xl p-2.5 sm:p-3 shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] ' +
                                                    (isMe 
                                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm backdrop-blur-sm' 
                                                        : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-white/50 rounded-tl-sm'),
                                                style: isMe 
                                                    ? { boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)' }
                                                    : { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                                            },
                                                !isMe ? React.createElement('div', { className: 'text-xs font-semibold mb-1 text-gray-600' }, msg.sender_name) : null,
                                                msg.audio_file_key ? React.createElement('div', { className: 'my-1' },
                                                    React.createElement('div', { className: 'bg-white bg-opacity-10 rounded-lg p-2' },
                                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                            React.createElement('i', { className: (isMe ? 'text-white' : 'text-indigo-600') + ' fas fa-microphone text-sm' }),
                                                            React.createElement('span', { className: 'text-xs font-medium ' + (isMe ? 'text-white' : 'text-indigo-700') }, 'Audio')
                                                        ),
                                                        React.createElement('div', { className: 'flex items-center gap-3' },
                                                            React.createElement('button', {
                                                                onClick: () => toggleAudio('priv-' + msg.id),
                                                                className: 'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ' +
                                                                    (isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-600 hover:bg-indigo-700'),
                                                                style: { flexShrink: 0 }
                                                            },
                                                                React.createElement('i', { 
                                                                    className: 'fas fa-' + (playingAudio['priv-' + msg.id] ? 'pause' : 'play') + ' text-lg ' + (isMe ? 'text-white' : 'text-white'),
                                                                    style: playingAudio['priv-' + msg.id] ? {} : { marginLeft: '2px' }
                                                                })
                                                            ),
                                                            React.createElement('div', { className: 'flex-1' },
                                                                React.createElement('div', { className: 'h-2 rounded-full overflow-hidden ' + (isMe ? 'bg-white/20' : 'bg-gray-200') },
                                                                    React.createElement('div', { 
                                                                        className: 'h-full transition-all ' + (isMe ? 'bg-white' : 'bg-indigo-600'),
                                                                        style: { width: '0%' }
                                                                    })
                                                                )
                                                            )
                                                        ),
                                                        React.createElement('audio', {
                                                            ref: (el) => { if (el) audioRefs.current['priv-' + msg.id] = el; },
                                                            preload: 'auto',
                                                            src: API_URL + '/messages/audio/' + msg.audio_file_key,
                                                            onEnded: () => {
                                                                console.log('Audio terminé (privé):', msg.id);
                                                                setPlayingAudio(prev => ({ ...prev, ['priv-' + msg.id]: false }));
                                                            },
                                                            onError: (e) => {
                                                                console.error('❌ Erreur chargement audio (privé):', e);
                                                                console.error('URL:', API_URL + '/messages/audio/' + msg.audio_file_key);
                                                                console.error('Error details:', e.target?.error);
                                                            },
                                                            onLoadedMetadata: () => console.log('✅ Métadonnées chargées (privé):', msg.id),
                                                            style: { display: 'none' }
                                                        }),
                                                        msg.audio_duration ? React.createElement('p', { 
                                                            className: 'text-xs mt-2 ' + (isMe ? 'text-white opacity-75' : 'text-gray-500')
                                                        }, '⏱️ ' + formatRecordingDuration(msg.audio_duration)) : null
                                                    )
                                                ) : React.createElement('p', { className: 'whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content),
                                                React.createElement('div', { 
                                                    className: 'text-xs mt-1 flex items-center justify-between gap-2'
                                                },
                                                    React.createElement('span', {
                                                        className: isMe ? 'text-white text-opacity-90' : 'text-gray-400'
                                                    }, formatMessageTime(msg.created_at)),
                                                    isMe && canDeleteMessage(msg) ? React.createElement('button', {
                                                        onClick: (e) => {
                                                            e.stopPropagation();
                                                            deleteMessage(msg.id);
                                                        },
                                                        className: 'opacity-50 hover:opacity-100 transition-opacity ' + (isMe ? 'text-white hover:text-red-200' : 'text-red-500 hover:text-red-700'),
                                                        title: 'Supprimer'
                                                    },
                                                        React.createElement('i', { className: 'fas fa-trash text-xs' })
                                                    ) : null
                                                )
                                            )
                                        );
                                    }),
                                    React.createElement('div', { ref: messagesEndRef })
                                ),
                                
                                // Input
                                React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                                    (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200' },
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
                                                className: 'flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
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
                                            className: 'flex-1 border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all',
                                            rows: 2
                                        }),
                                        React.createElement('button', {
                                            onClick: startRecording,
                                            className: 'px-3 sm:px-4 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                            title: 'Enregistrer un message vocal'
                                        },
                                            React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                            React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                        ),
                                        React.createElement('button', {
                                            onClick: sendMessage,
                                            disabled: !messageContent.trim(),
                                            className: 'px-3 sm:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center'
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
            const [showUserGuide, setShowUserGuide] = React.useState(false);
            const [showArchived, setShowArchived] = React.useState(false);
            const [showMessaging, setShowMessaging] = React.useState(false);
            const [messagingContact, setMessagingContact] = React.useState(null);
            const [messagingTab, setMessagingTab] = React.useState("public");
            
            const allStatuses = [
                { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
                { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
                { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
                { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
                { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
                { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
            ];
            
            // Séparer les colonnes actives et la colonne archivée
            const activeStatuses = allStatuses.filter(s => s.key !== 'archived');
            const archivedStatus = allStatuses.find(s => s.key === 'archived');
            
            
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
            };
            
            const handleDragEnd = (e) => {
                e.currentTarget.classList.remove('dragging');
                setDraggedTicket(null);
                setDragOverColumn(null);
            };
            
            const handleDragOver = (e, status) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn(status);
            };
            
            const handleDragLeave = (e) => {
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
            
            
            const touchDragStart = React.useRef(null);
            const touchDragTicket = React.useRef(null);
            
            const handleTouchStart = (e, ticket) => {
                
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }
                
                const touch = e.touches[0];
                touchDragStart.current = { x: touch.clientX, y: touch.clientY };
                touchDragTicket.current = ticket;
            };
            
            const handleTouchMove = (e) => {
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
                                        '👋 Bonjour ' + (currentUser.full_name || currentUser.email.split('@')[0])
                                    ),
                                    React.createElement('div', { className: "flex items-center gap-3 flex-wrap" },
                                        React.createElement('p', { className: "text-xs text-igp-orange font-semibold" }, 
                                            (currentUser.role === "operator" 
                                                ? tickets.filter(t => t.reported_by === currentUser.id).length 
                                                : tickets.length) + " tickets actifs"
                                        ),
                                        (currentUser.role === "technician" || currentUser.role === "supervisor" || currentUser.role === "admin") ?
                                        React.createElement('div', { 
                                            className: "flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer" + (unreadMessagesCount > 0 ? "" : " opacity-50"),
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
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-4 py-2 bg-igp-orange text-white rounded-md hover:bg-orange-700 font-semibold shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Nouvelle Demande'
                            ),
                            React.createElement('button', {
                                onClick: onRefresh,
                                className: 'px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                'Actualiser'
                            ),
                            React.createElement('button', {
                                onClick: () => setShowArchived(!showArchived),
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
                            (currentUser.role === 'technician' || currentUser.role === 'supervisor' || currentUser.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowUserManagement(true),
                                className: "px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold shadow-md transition-all"
                            },
                                React.createElement('i', { className: "fas fa-users-cog mr-2" }),
                                "Utilisateurs"
                            ) : null,
                            (currentUser.role === 'supervisor' || currentUser.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowMachineManagement(true),
                                className: "px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-semibold shadow-md transition-all"
                            },
                                React.createElement('i', { className: "fas fa-cogs mr-2" }),
                                "Machines"
                            ) : null,
                            (currentUser.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => {
                                    // S'assurer que le token est bien dans localStorage avant la redirection
                                    const token = localStorage.getItem('auth_token');
                                    if (token) {
                                        localStorage.setItem('token', token); // Dupliquer pour compatibilité
                                        window.location.href = '/admin/roles';
                                    } else {
                                        alert('Session expirée. Veuillez vous reconnecter.');
                                        window.location.href = '/';
                                    }
                                },
                                className: "px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md transition-all",
                                title: 'Gestion des rôles et permissions (Admin)'
                            },
                                React.createElement('i', { className: 'fas fa-shield-alt mr-2' }),
                                'Rôles'
                            ) : null,
                            (currentUser.role === 'technician' || currentUser.role === 'supervisor' || currentUser.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowMessaging(true),
                                className: 'px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-comments mr-2' }),
                                'Messagerie'
                            ) : null,
                            React.createElement('a', {
                                href: '/guide',
                                className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold shadow-md transition-all inline-flex items-center justify-center',
                                title: 'Guide utilisateur - Aide'
                            },
                                React.createElement('i', { className: 'fas fa-book mr-2' }),
                                'Guide'
                            ),
                            React.createElement('button', {
                                onClick: onLogout,
                                className: 'px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 shadow-md transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                                'Déconnexion'
                            )
                        )
                    )
                ),
                
                
                React.createElement('div', { className: 'container mx-auto px-4 py-6' },
                    React.createElement('div', { className: 'space-y-4' },
                        React.createElement('div', { className: 'overflow-x-auto pb-4' },
                            React.createElement('div', { className: 'kanban-grid flex gap-3' },
                            activeStatuses.map(status => {
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
                                            // Banniere pour tickets planifies/assignes (seulement avant "En cours")
                                            (ticket.scheduled_date && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { 
                                                className: 'mb-2 -mx-3 -mt-3 px-3 py-2.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-xs font-bold flex items-center justify-between rounded-t-lg shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border-b border-amber-400/50'
                                            },
                                                React.createElement('div', { className: 'flex items-center gap-1.5 bg-gradient-to-br from-amber-500/90 to-amber-600/90 backdrop-blur-sm px-2.5 py-1 rounded shadow-[0_2px_8px_rgba(251,191,36,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border border-amber-300/30' },
                                                    React.createElement('i', { className: 'fas fa-calendar-check text-white drop-shadow-lg' }),
                                                    React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, "PLANIFIÉ")
                                                ),
                                                React.createElement('span', { className: 'text-amber-100 font-bold text-center flex-1 px-3 bg-gradient-to-br from-slate-600/50 to-slate-700/50 backdrop-blur-sm py-1 mx-2 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border border-slate-500/40' },
                                                    ticket.assigned_to 
                                                        ? (ticket.assigned_to === 'all' ? '👥 Équipe complète' : '👤 Tech #' + ticket.assigned_to)
                                                        : '⚠️ Non assigné'
                                                ),
                                                React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-slate-600/80 to-slate-700/80 backdrop-blur-sm px-2.5 py-1 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-500/40' },
                                                    new Date(ticket.scheduled_date).toLocaleDateString('fr-FR', { 
                                                        day: '2-digit', 
                                                        month: 'short'
                                                    })
                                                )
                                            ) : null,
                                            
                                            React.createElement('div', { className: 'mb-1' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                            ),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800 mb-1 text-sm line-clamp-2' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('span', { 
                                                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' + 
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                     ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-green-700')
                                                }, 
                                                    ticket.priority === 'critical' ? '🔴 CRIT' :
                                                    ticket.priority === 'high' ? '🟠 HAUT' :
                                                    ticket.priority === 'medium' ? '🟡 MOY' :
                                                    '🟢 BAS'
                                                ),
                                                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                            ),
                                            
                                            // Badge de planification (si ticket planifié ET pas encore commencé)
                                            (ticket.scheduled_date && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                React.createElement('div', { className: 'flex items-center gap-1' },
                                                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                ),
                                                React.createElement('div', { 
                                                    className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 overflow-hidden'
                                                },
                                                    React.createElement('i', { className: 'fas fa-user-check mr-1 text-blue-600' }),
                                                    React.createElement('span', { className: 'font-semibold truncate inline-block max-w-full' }, 
                                                        ticket.assigned_to 
                                                            ? 'Par ' + (ticket.reporter_name || 'N/A')
                                                            : (ticket.reporter_name || 'N/A')
                                                    )
                                                )
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
                    
                    showArchived ? React.createElement('div', { className: 'overflow-x-auto pb-4' },
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
                                            // Banniere pour tickets planifies/assignes
                                            ticket.scheduled_date ? React.createElement('div', { 
                                                className: 'mb-2 -mx-3 -mt-3 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-2 rounded-t-lg'
                                            },
                                                React.createElement('i', { className: 'fas fa-calendar-check' }),
                                                React.createElement('span', {}, 'PLANIFIE')
                                            ) : null,
                                            
                                            React.createElement('div', { className: 'mb-1' },
                                                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                            ),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800 mb-1 text-sm line-clamp-2' }, ticket.title),
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                                React.createElement('span', { 
                                                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' + 
                                                    (ticket.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                     ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-green-700')
                                                }, 
                                                    ticket.priority === 'critical' ? '🔴 CRIT' :
                                                    ticket.priority === 'high' ? '🟠 HAUT' :
                                                    ticket.priority === 'medium' ? '🟡 MOY' :
                                                    '🟢 BAS'
                                                ),
                                                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                            ),
                                            
                                            // Badge de planification (si ticket planifié ET pas encore commencé)
                                            (ticket.scheduled_date && (ticket.status === 'received' || ticket.status === 'diagnostic')) ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                                React.createElement('div', { className: 'flex items-center gap-1' },
                                                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                                ),
                                                React.createElement('div', { 
                                                    className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 overflow-hidden'
                                                },
                                                    React.createElement('i', { className: 'fas fa-user-check mr-1 text-blue-600' }),
                                                    React.createElement('span', { className: 'font-semibold truncate inline-block max-w-full' }, 
                                                        ticket.assigned_to 
                                                            ? 'Par ' + (ticket.reporter_name || 'N/A')
                                                            : (ticket.reporter_name || 'N/A')
                                                    )
                                                )
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
                                React.createElement('span', {}, 'v1.9.2 - Historique')
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
            const [tickets, setTickets] = React.useState([]);
            const [machines, setMachines] = React.useState([]);
            const [loading, setLoading] = React.useState(true);
            const [showCreateModal, setShowCreateModal] = React.useState(false);
            const [contextMenu, setContextMenu] = React.useState(null);
            const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
            
            React.useEffect(() => {
                if (isLoggedIn) {
                    loadData();
                    loadUnreadMessagesCount();
                    
                    // Rafraichir le compteur de messages non lus toutes les 30 secondes
                    const interval = setInterval(() => {
                        loadUnreadMessagesCount();
                    }, 30000);
                    
                    return () => clearInterval(interval);
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
                    // Seulement pour techniciens, superviseurs et admins
                    if (currentUser && (currentUser.role === "technician" || currentUser.role === "supervisor" || currentUser.role === "admin")) {
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
                currentUser: currentUser,
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
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .accordion-content.active {
            max-height: 2000px;
            transition: max-height 0.5s ease-in;
        }
        .accordion-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .rotate-180 {
            transform: rotate(180deg);
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen p-4">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-lg shadow-lg">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-book text-3xl"></i>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold">Guide Utilisateur</h1>
                            <p class="text-blue-200 text-sm">Système de Gestion de Maintenance IGP</p>
                        </div>
                    </div>
                    <button onclick="window.history.back()" class="px-4 py-2 bg-white text-blue-900 rounded-md hover:bg-gray-100 font-semibold">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="bg-white p-6 rounded-b-lg shadow-lg">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                    <p class="text-gray-700 text-sm md:text-base italic">
                        💡 <strong>Ça prend vraiment pas la tête à Papineau</strong> pour être capable d'utiliser cette application. Mais au cas où vous auriez mal dormi la veille...
                    </p>
                </div>
                <p class="text-gray-600 mb-4 text-center text-sm md:text-base">
                    👋 Cliquez sur les boutons colorés pour ouvrir chaque section
                </p>
                <div class="space-y-2">
                    <!-- Démarrage Rapide -->
                    <button onclick="toggleAccordion('intro')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-rocket text-lg"></i>
                            <span class="text-base md:text-lg font-bold">🎯 Démarrage Rapide</span>
                        </div>
                        <i id="intro-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="intro" class="accordion-content bg-gray-50 border-2 border-blue-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p>👋 Bienvenue! Ce guide est fait pour aller VITE.</p>
                            <p>📱 Cliquez sur les boutons colorés pour ouvrir chaque section</p>
                            <p>⚡ Chaque section se lit en 30 secondes</p>
                            <p class="text-gray-600 italic mt-3">💡 Conseil: Laissez ce guide ouvert pendant votre travail!</p>
                        </div>
                    </div>

                    <!-- Créer un Ticket -->
                    <button onclick="toggleAccordion('creer')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-plus-circle text-lg"></i>
                            <span class="text-base md:text-lg font-bold">➕ Créer un Ticket</span>
                        </div>
                        <i id="creer-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="creer" class="accordion-content bg-gray-50 border-2 border-orange-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p class="font-semibold text-orange-700">📝 ÉTAPES:</p>
                            <p><strong>1️⃣</strong> Bouton orange "Nouveau Ticket" en haut</p>
                            <p><strong>2️⃣</strong> Remplir les champs:</p>
                            <p class="ml-6">• <strong>Titre</strong>: Description courte du problème</p>
                            <p class="ml-6">• <strong>Machine</strong>: Sélectionnez dans la liste</p>
                            <p class="ml-6">• <strong>Priorité</strong>: Normale, Élevée, Critique</p>
                            <p class="ml-6">• <strong>Description</strong>: Détails (optionnel)</p>
                            <p><strong>3️⃣</strong> 📸 Photo optionnelle (mobile = caméra auto)</p>
                            <p><strong>4️⃣</strong> Clic "Créer"</p>
                            <p class="text-green-600 font-semibold mt-3">✅ ID automatique créé!</p>
                        </div>
                    </div>

                    <!-- Modifier un Ticket -->
                    <button onclick="toggleAccordion('modifier')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-edit text-lg"></i>
                            <span class="text-base md:text-lg font-bold">✏️ Modifier un Ticket</span>
                        </div>
                        <i id="modifier-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="modifier" class="accordion-content bg-gray-50 border-2 border-indigo-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p class="font-semibold text-indigo-700">👆 OUVRIR:</p>
                            <p class="ml-4">• Clic sur la carte du ticket</p>
                            <p class="font-semibold text-indigo-700 mt-3">✏️ MODIFIER:</p>
                            <p class="ml-4">• Bouton bleu "Modifier"</p>
                            <p class="ml-4">• Changez titre, description, priorité, machine</p>
                            <p class="ml-4">• Clic "Enregistrer"</p>
                            <p class="font-semibold text-indigo-700 mt-3">📸 AJOUTER PHOTOS:</p>
                            <p class="ml-4">• Bouton "Ajouter médias"</p>
                            <p class="ml-4">• Photos ajoutées immédiatement</p>
                            <p class="font-semibold text-indigo-700 mt-3">💬 AJOUTER COMMENTAIRES:</p>
                            <p class="ml-4">• Scroll en bas → Zone commentaire</p>
                            <p class="font-semibold text-indigo-700 mt-3">🗑️ SUPPRIMER:</p>
                            <p class="ml-4">• Bouton rouge "Supprimer" → Confirmer</p>
                            <p class="text-red-600 font-semibold mt-3">⚠️ Vous pouvez SEULEMENT modifier VOS propres tickets!</p>
                        </div>
                    </div>

                    <!-- Les 3 Rôles -->
                    <button onclick="toggleAccordion('roles')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-users text-lg"></i>
                            <span class="text-base md:text-lg font-bold">👥 Les 3 Rôles</span>
                        </div>
                        <i id="roles-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="roles" class="accordion-content bg-gray-50 border-2 border-purple-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p class="font-semibold text-purple-700">👑 ADMIN:</p>
                            <p class="ml-4">• Tout faire • Gérer users • Modifier TOUS tickets</p>
                            <p class="font-semibold text-purple-700 mt-3">🔧 TECHNICIEN:</p>
                            <p class="ml-4">• Déplacer tickets • Modifier TOUS tickets • Ajouter commentaires/photos</p>
                            <p class="font-semibold text-purple-700 mt-3">👷 OPÉRATEUR:</p>
                            <p class="ml-4">• Créer tickets • Voir tous • Modifier SEULEMENT ses propres tickets</p>
                        </div>
                    </div>

                    <!-- Tableau Kanban -->
                    <button onclick="toggleAccordion('kanban')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-columns text-lg"></i>
                            <span class="text-base md:text-lg font-bold">📊 Le Tableau Kanban</span>
                        </div>
                        <i id="kanban-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="kanban" class="accordion-content bg-gray-50 border-2 border-cyan-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p class="font-semibold text-cyan-700">6 COLONNES = Workflow:</p>
                            <p>🟦 Requête → 🟨 Diagnostic → 🟧 En Cours → 🟪 Attente Pièces → 🟩 Terminé → ⬜ Archivé</p>
                            <p class="font-semibold text-cyan-700 mt-3">🖱️ DÉPLACER (Techniciens/Admins):</p>
                            <p class="ml-4">• <strong>PC</strong>: Glisser-déposer</p>
                            <p class="ml-4">• <strong>Mobile</strong>: Tap → Menu statut</p>
                            <p class="text-cyan-600 font-semibold mt-3">💡 Mise à jour temps réel!</p>
                        </div>
                    </div>

                    <!-- Sur Mobile -->
                    <button onclick="toggleAccordion('mobile')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-mobile-alt text-lg"></i>
                            <span class="text-base md:text-lg font-bold">📱 Sur Mobile</span>
                        </div>
                        <i id="mobile-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="mobile" class="accordion-content bg-gray-50 border-2 border-pink-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p class="font-semibold text-pink-700">📲 100% responsive!</p>
                            <p>👆 TAP carte → Voir détails</p>
                            <p>📸 PHOTO: Caméra auto!</p>
                            <p>🤏 Pinch = Zoom photos</p>
                            <p>📜 Scroll fluide</p>
                        </div>
                    </div>

                    <!-- Contact -->
                    <button onclick="toggleAccordion('contact')" class="accordion-button w-full text-left px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg shadow-md flex items-center justify-between transition-all">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-phone text-lg"></i>
                            <span class="text-base md:text-lg font-bold">📞 Contact & Support</span>
                        </div>
                        <i id="contact-icon" class="fas fa-chevron-down transition-transform duration-300 text-sm"></i>
                    </button>
                    <div id="contact" class="accordion-content bg-gray-50 border-2 border-teal-200 rounded-lg p-4 md:p-6">
                        <div class="space-y-2 text-sm md:text-base">
                            <p class="font-semibold text-teal-700">🆘 SUPPORT: Votre admin système</p>
                            <p>🌐 mecanique.igpglass.ca</p>
                            <p>📖 Ce guide</p>
                            <p>🏷️ Version 1.9.2</p>
                        </div>
                        
                        <div class="mt-6 pt-6 border-t border-teal-200">
                            <h4 class="font-semibold text-teal-700 mb-4 text-base md:text-lg">📝 Formulaire de Contact</h4>
                            <div class="plato-form-widget" data-pf-id="fr9ercvp1ay" data-pf-host="form.formcan.com/"></div>
                            <script src="//static.formcan.com/assets/dist/formbuilder.js?v=20"></script>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function toggleAccordion(id) {
            const content = document.getElementById(id);
            const icon = document.getElementById(id + '-icon');
            const isActive = content.classList.contains('active');
            
            // Fermer tous les accordéons
            document.querySelectorAll('.accordion-content').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelectorAll('[id$="-icon"]').forEach(el => {
                el.classList.remove('rotate-180');
            });
            
            // Ouvrir l'accordéon cliqué si il était fermé
            if (!isActive) {
                content.classList.add('active');
                icon.classList.add('rotate-180');
            }
        }
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
                    <div class="text-2xl font-bold text-blue-600">v1.9.2</div>
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
                    <div class="text-2xl font-bold text-blue-600">144</div>
                    <div class="text-xs text-gray-600">Jours de dev</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">12</div>
                    <div class="text-xs text-gray-600">Versions</div>
                </div>
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">35+</div>
                    <div class="text-xs text-gray-600">Fonctionnalités</div>
                </div>
                <div class="text-center p-3 bg-orange-50 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">2800+</div>
                    <div class="text-xs text-gray-600">Lignes de code</div>
                </div>
            </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
            <!-- Version 1.9.2 -->
            <div class="timeline-item" data-version="1.9.2" data-types="feature improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <i class="fas fa-rocket"></i>
                </div>
                <div class="version-card">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Version 1.9.2</h2>
                            <p class="text-gray-500 text-sm">3 novembre 2025</p>
                        </div>
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTUELLE</span>
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
            <div class="timeline-item" data-version="1.9.0" data-types="feature improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-purple-500 to-pink-600 text-white">
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
                                <li>• Layout desktop optimisé (6 colonnes → 5+1)</li>
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
            <div class="timeline-item" data-version="1.8.5" data-types="feature improvement fix">
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
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Support complet mobile et tablette</li>
                                <li>• Guide utilisateur accordéon (7 sections)</li>
                                <li>• Touch events pour drag & drop mobile</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Design responsive optimisé</li>
                                <li>• Navigation simplifiée sur mobile</li>
                                <li>• Interface tactile intuitive</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.0 -->
            <div class="timeline-item" data-version="1.8.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                    <i class="fas fa-globe-americas"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.0</h2>
                        <p class="text-gray-500 text-sm">1 octobre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Format dates québécois (JJ-MM-AAAA)</li>
                                <li>• Timezone EST (America/Toronto)</li>
                                <li>• Affichage heure locale pour tous les timestamps</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.7.0 -->
            <div class="timeline-item" data-version="1.7.0" data-types="feature improvement security">
                <div class="timeline-dot bg-gradient-to-br from-red-500 to-pink-600 text-white">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.7.0</h2>
                        <p class="text-gray-500 text-sm">20 septembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Gestion utilisateurs multi-rôles (Admin/Technicien/Opérateur)</li>
                                <li>• Permissions granulaires par rôle</li>
                                <li>• Interface admin pour créer/modifier utilisateurs</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-lock text-yellow-500 mr-2"></i>
                                Sécurité
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Sécurité renforcée (JWT + bcrypt PBKDF2)</li>
                                <li>• Hash mots de passe avec 100,000 itérations</li>
                                <li>• Tokens expiration 24h</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-security"><i class="fas fa-lock"></i> Sécurité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.6.0 -->
            <div class="timeline-item" data-version="1.6.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <i class="fas fa-camera"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.6.0</h2>
                        <p class="text-gray-500 text-sm">5 septembre 2025</p>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Upload d'images sur tickets (Cloudflare R2)</li>
                                <li>• Galerie photos par ticket</li>
                                <li>• Indicateur compteur photos sur carte</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Versions précédentes (résumé) -->
            <div class="timeline-item">
                <div class="timeline-dot bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="version-card bg-gray-50">
                    <h2 class="text-xl font-bold text-gray-800 mb-3">Versions Antérieures</h2>
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.5.0 - 22 août 2025</span>
                            <span class="text-xs">Système de commentaires</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.4.0 - 8 août 2025</span>
                            <span class="text-xs">Menu contextuel</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.3.0 - 25 juillet 2025</span>
                            <span class="text-xs">Gestion des machines</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.2.0 - 10 juillet 2025</span>
                            <span class="text-xs">Interface Kanban drag & drop</span>
                        </div>
                        <div class="flex items-center justify-between py-2 border-b">
                            <span class="font-semibold">v1.1.0 - 26 juin 2025</span>
                            <span class="text-xs">API REST complète</span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="font-semibold">v1.0.0 - 12 juin 2025</span>
                            <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🎊 Lancement initial</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Roadmap (À Venir) -->
        <div id="roadmap" class="mt-12 scroll-mt-8">
            <div class="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-2xl shadow-2xl p-1">
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
                    
                    <!-- Version 2.0.0 -->
                    <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300 shadow-lg">
                        <div class="flex items-start justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h3 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <span class="text-amber-600">v2.0.0</span>
                                    <span class="text-gray-400">-</span>
                                    <span class="text-gray-700">Support Multilingue</span>
                                </h3>
                                <p class="text-gray-600 text-sm mt-1 font-semibold">
                                    <i class="fas fa-calendar-alt text-amber-600 mr-2"></i>
                                    Novembre 2025
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
                        <div class="inline-block bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 border-2 border-purple-300">
                            <p class="text-gray-700 mb-3 flex items-center justify-center gap-2">
                                <i class="fas fa-comments text-purple-600 text-xl"></i>
                                <span class="font-semibold">Vous avez des suggestions ou des besoins spécifiques ?</span>
                            </p>
                            <a href="/guide#contact" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105">
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

export default app;
