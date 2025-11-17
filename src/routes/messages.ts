// Routes pour la messagerie (messages publics/privés, audio)

import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const messages = new Hono<{ Bindings: Bindings }>();

// POST /api/messages - Envoyer un message (public ou privé)
messages.post('/', authMiddleware, async (c) => {
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

    // 🔔 Envoyer push notification si message privé
    if (message_type === 'private' && recipient_id) {
      try {
        const { sendPushNotification } = await import('./push');
        
        // Obtenir le nom de l'expéditeur
        const senderName = user.full_name || user.email || 'Un utilisateur';
        
        // Préparer le contenu pour la notification (max 100 caractères)
        const notificationBody = content.length > 100 
          ? content.substring(0, 97) + '...'
          : content;
        
        await sendPushNotification(c.env, recipient_id, {
          title: `💬 Message de ${senderName}`,
          body: notificationBody,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          data: {
            url: `/messages/private/${user.userId}`,
            action: 'new_private_message',
            senderId: user.userId,
            senderName: senderName,
            messageId: result.meta.last_row_id
          }
        });
        
        console.log(`✅ Push notification sent to user ${recipient_id} for message from ${user.userId}`);
      } catch (pushError) {
        // Fail-safe: si push échoue, le message est quand même envoyé
        console.error('❌ Push notification failed (non-blocking):', pushError);
      }
    }

    return c.json({
      message: 'Message envoye avec succes',
      id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Erreur lors de envoi du message' }, 500);
  }
});

// POST /api/messages/audio - Envoyer un message audio
messages.post('/audio', authMiddleware, async (c) => {
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

    // 🔔 Envoyer push notification si message privé
    if (messageType === 'private' && recipientId) {
      try {
        const { sendPushNotification } = await import('./push');
        
        // Obtenir le nom de l'expéditeur
        const senderName = user.full_name || user.email || 'Un utilisateur';
        
        // Formatter la durée pour affichage (ex: "2:35")
        const durationMin = Math.floor(duration / 60);
        const durationSec = duration % 60;
        const durationText = durationSec > 0 
          ? `${durationMin}:${durationSec.toString().padStart(2, '0')}`
          : `${durationMin}min`;
        
        await sendPushNotification(c.env, parseInt(recipientId), {
          title: `🎤 Message audio de ${senderName}`,
          body: `Message vocal (${durationText}) - Appuyez pour écouter`,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          data: {
            url: `/messages/private/${user.userId}`,
            action: 'new_audio_message',
            senderId: user.userId,
            senderName: senderName,
            messageId: result.meta.last_row_id,
            audioKey: fileKey,
            duration: duration
          }
        });
        
        console.log(`✅ Push notification sent to user ${recipientId} for audio message from ${user.userId}`);
      } catch (pushError) {
        // Fail-safe: si push échoue, le message est quand même envoyé
        console.error('❌ Push notification failed (non-blocking):', pushError);
      }
    }

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

// GET /api/messages/public - Récupérer les messages publics avec pagination
messages.get('/public', authMiddleware, async (c) => {
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

// GET /api/messages/conversations - Récupérer les conversations privées (liste des contacts)
messages.get('/conversations', authMiddleware, async (c) => {
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
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    return c.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return c.json({ error: 'Erreur lors de la recuperation des conversations' }, 500);
  }
});

// GET /api/messages/private/:contactId - Récupérer les messages privés avec un contact spécifique
messages.get('/private/:contactId', authMiddleware, async (c) => {
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

// GET /api/messages/unread-count - Compter les messages non lus
messages.get('/unread-count', authMiddleware, async (c) => {
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

// GET /api/messages/available-users - Liste des utilisateurs disponibles pour messagerie
messages.get('/available-users', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const { results } = await c.env.DB.prepare(`
      SELECT id, full_name, role, email
      FROM users
      WHERE role IN ('operator', 'furnace_operator', 'technician', 'supervisor', 'admin')
        AND id != ?
        AND id != 0
      ORDER BY role DESC, full_name ASC
    `).bind(user.userId).all();

    return c.json({ users: results });
  } catch (error) {
    console.error('Get available users error:', error);
    return c.json({ error: 'Erreur lors de la recuperation des utilisateurs' }, 500);
  }
});

// DELETE /api/messages/:messageId - Supprimer un message avec contrôle de permissions
messages.delete('/:messageId', authMiddleware, async (c) => {
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

// POST /api/messages/bulk-delete - Suppression en masse de messages
messages.post('/bulk-delete', authMiddleware, async (c) => {
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

// GET /api/messages/test/r2 - Route de test R2
messages.get('/test/r2', async (c) => {
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
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
      bucket_configured: !!c.env.MEDIA_BUCKET
    }, 500);
  }
});

export default messages;
