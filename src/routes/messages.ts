// Routes pour la messagerie (messages publics/privés, audio)
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { eq, and, or, desc, asc, sql, getTableColumns, ne, inArray } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db';
import { messages, users, pushLogs, pushSubscriptions } from '../db/schema';
import { authMiddleware, requirePermission } from '../middlewares/auth';
import { checkModule } from '../utils/modules';
import { hasPermission } from '../utils/permissions';
import { formatUserName } from '../utils/userFormatter';
import { sendMessageSchema, bulkDeleteMessagesSchema, getMessagesQuerySchema, contactIdParamSchema, messageIdParamSchema } from '../schemas/messages';
import { requirePermission } from '../middlewares/auth';
import type { Bindings } from '../types';

const messagesRoute = new Hono<{ Bindings: Bindings }>();

// Middleware: Check if Messaging Module is enabled
messagesRoute.use('*', checkModule('messaging'));

// Check permissions for all routes
messagesRoute.use('*', requirePermission('messages', 'use'));

// POST /api/messages - Envoyer un message (public ou privé)
messagesRoute.post('/', authMiddleware, zValidator('json', sendMessageSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const currentUserId = Number(user.userId);
    const { message_type, recipient_id, content } = c.req.valid('json');
    const db = getDb(c.env);

    // Inserer le message
    const result = await db.insert(messages).values({
      sender_id: currentUserId,
      recipient_id: recipient_id || null,
      message_type: message_type as 'public' | 'private',
      content,
      is_read: 0
    }).returning();

    const newMessage = result[0];

    // 🔔 Envoyer push notification si message privé
    if (message_type === 'private' && recipient_id) {
      try {
        const { sendPushNotification } = await import('./push');
        
        // Obtenir le nom de l'expéditeur
        const senderName = formatUserName(user, 'Un utilisateur');
        
        // Préparer le contenu pour la notification (max 100 caractères)
        const notificationBody = content.length > 100 
          ? content.substring(0, 97) + '...'
          : content;
        
        const pushResult = await sendPushNotification(c.env, recipient_id, {
          title: `💬 ${senderName}`,
          body: notificationBody,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          data: {
            url: '/',
            action: 'new_private_message',
            senderId: user.userId,
            senderName: senderName,
            messageId: newMessage.id
          }
        });
        
        // Logger le résultat
        await db.insert(pushLogs).values({
          user_id: recipient_id,
          ticket_id: null,
          status: pushResult.success ? 'success' : 'failed',
          error_message: pushResult.success ? null : JSON.stringify(pushResult)
        });
        
        console.log(`✅ Push notification sent to user ${recipient_id} for message from ${user.userId}`);
      } catch (pushError: any) {
        // Logger l'erreur
        try {
          await db.insert(pushLogs).values({
            user_id: recipient_id,
            ticket_id: null,
            status: 'error',
            error_message: pushError.message || String(pushError)
          });
        } catch (logError) {
          console.error('Failed to log push error:', logError);
        }
        console.error('❌ Push notification failed (non-blocking):', pushError);
      }
    }

    return c.json({
      message: 'Message envoyé avec succès',
      id: newMessage.id
    }, 201);
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Erreur lors de l\'envoi du message' }, 500);
  }
});

// POST /api/messages/audio - Envoyer un message audio
messagesRoute.post('/audio', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const currentUserId = Number(user.userId);
    const formData = await c.req.formData();
    const db = getDb(c.env);

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

    // Validation type MIME
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    const isAllowed = allowedTypes.some(type => audioFile.type.startsWith(type));
    if (!isAllowed) {
      return c.json({
        error: `Type de fichier non autorisé: ${audioFile.type}. Types acceptés: MP3, MP4, WebM, OGG, WAV`
      }, 400);
    }

    // Validation durée
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
    const result = await db.insert(messages).values({
      sender_id: currentUserId,
      recipient_id: recipientId ? parseInt(recipientId) : null,
      message_type: messageType as 'public' | 'private',
      content: '🎤 Message vocal',
      audio_file_key: fileKey,
      audio_duration: duration,
      audio_size: audioFile.size,
      is_read: 0
    }).returning();

    const newMessage = result[0];

    console.log(`✅ Audio message uploaded: ${fileKey} (${(audioFile.size / 1024).toFixed(1)} KB, ${duration}s)`);

    // 🔔 Envoyer push notification si message privé
    if (messageType === 'private' && recipientId) {
      try {
        const { sendPushNotification } = await import('./push');
        const recipientIdNum = parseInt(recipientId);
        
        const senderName = formatUserName(user, 'Un utilisateur');
        
        const durationMin = Math.floor(duration / 60);
        const durationSec = duration % 60;
        const durationText = durationSec > 0 
          ? `${durationMin}:${durationSec.toString().padStart(2, '0')}`
          : `${durationMin}min`;
        
        const pushResult = await sendPushNotification(c.env, recipientIdNum, {
          title: `🎤 ${senderName}`,
          body: `Message vocal (${durationText})`,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          data: {
            url: '/',
            action: 'new_audio_message',
            senderId: user.userId,
            senderName: senderName,
            messageId: newMessage.id,
            audioKey: fileKey,
            duration: duration
          }
        });
        
        await db.insert(pushLogs).values({
          user_id: recipientIdNum,
          ticket_id: null,
          status: pushResult.success ? 'success' : 'failed',
          error_message: pushResult.success ? null : JSON.stringify(pushResult)
        });
        
        console.log(`✅ Push notification sent to user ${recipientId} for audio message from ${user.userId}`);
      } catch (pushError: any) {
        try {
          await db.insert(pushLogs).values({
            user_id: parseInt(recipientId),
            ticket_id: null,
            status: 'error',
            error_message: pushError.message || String(pushError)
          });
        } catch (logError) {
          console.error('Failed to log push error:', logError);
        }
        console.error('❌ Push notification failed (non-blocking):', pushError);
      }
    }

    return c.json({
      message: 'Message vocal envoyé avec succès',
      messageId: newMessage.id,
      audioKey: fileKey
    }, 201);
  } catch (error) {
    console.error('Upload audio error:', error);
    return c.json({ error: 'Erreur lors de l\'envoi du message vocal' }, 500);
  }
});

// GET /api/messages/public - Récupérer les messages publics avec pagination
messagesRoute.get('/public', authMiddleware, zValidator('query', getMessagesQuerySchema), async (c) => {
  try {
    const { page, limit } = c.req.valid('query');
    const offset = (page - 1) * limit;
    const db = getDb(c.env);

    // page, limit validation handled by Zod now

    const results = await db
      .select({
        ...getTableColumns(messages),
        sender_name: users.full_name,
        sender_role: users.role
      })
      .from(messages)
      .leftJoin(users, eq(messages.sender_id, users.id))
      .where(eq(messages.message_type, 'public'))
      .orderBy(desc(messages.created_at))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.message_type, 'public'))
      .get();
    
    const count = countResult?.count || 0;

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
    return c.json({ error: 'Erreur lors de la récupération des messages' }, 500);
  }
});

// GET /api/messages/conversations - Récupérer les conversations privées
messagesRoute.get('/conversations', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const db = getDb(c.env);

    // Récupérer tous les messages privés de l'utilisateur pour extraire les contacts
    const userMessages = await db
      .select({
        sender_id: messages.sender_id,
        recipient_id: messages.recipient_id
      })
      .from(messages)
      .where(and(
        eq(messages.message_type, 'private'),
        or(eq(messages.sender_id, user.userId), eq(messages.recipient_id, user.userId))
      ));

    // Extraire les IDs uniques des contacts
    const currentUserId = Number(user.userId);
    const contactIdsSet = new Set<number>();
    
    userMessages.forEach(msg => {
      if (msg.sender_id === currentUserId && msg.recipient_id !== null) {
        contactIdsSet.add(msg.recipient_id);
      } else if (msg.recipient_id === currentUserId) {
        contactIdsSet.add(msg.sender_id);
      }
    });
    
    const contactIds = Array.from(contactIdsSet);

    const conversations = [];
    for (const contactId of contactIds) {
      // Ignorer l'utilisateur lui-même s'il s'est envoyé un message (cas rare mais possible)
      if (contactId === currentUserId) continue;

      // Info utilisateur
      const userInfo = await db
        .select({ full_name: users.full_name, role: users.role })
        .from(users)
        .where(eq(users.id, contactId))
        .get();

      // Si l'utilisateur n'existe plus, on ignore
      if (!userInfo) continue;

      // Dernier message
      const lastMsg = await db
        .select({ content: messages.content, created_at: messages.created_at })
        .from(messages)
        .where(and(
          eq(messages.message_type, 'private'),
          or(
            and(eq(messages.sender_id, currentUserId), eq(messages.recipient_id, contactId)),
            and(eq(messages.sender_id, contactId), eq(messages.recipient_id, currentUserId))
          )
        ))
        .orderBy(desc(messages.created_at))
        .limit(1)
        .get();

      // Messages non lus
      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.message_type, 'private'),
          eq(messages.sender_id, contactId),
          eq(messages.recipient_id, currentUserId),
          eq(messages.is_read, 0)
        ))
        .get();

      conversations.push({
        contact_id: contactId,
        contact_name: userInfo.full_name || 'Utilisateur inconnu',
        contact_role: userInfo.role || 'unknown',
        last_message: lastMsg?.content || null,
        last_message_time: lastMsg?.created_at || null,
        unread_count: unreadCount?.count || 0
      });
    }

    conversations.sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    return c.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return c.json({ error: 'Erreur lors de la récupération des conversations' }, 500);
  }
});

// GET /api/messages/private/:contactId - Récupérer les messages privés avec un contact
messagesRoute.get('/private/:contactId', authMiddleware, zValidator('param', contactIdParamSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const currentUserId = Number(user.userId);
    const { contactId } = c.req.valid('param');
    const db = getDb(c.env);

    // isNaN check not needed due to Zod

    const results = await db
      .select({
        ...getTableColumns(messages),
        sender_name: users.full_name
      })
      .from(messages)
      .leftJoin(users, eq(messages.sender_id, users.id))
      .where(and(
        eq(messages.message_type, 'private'),
        or(
          and(eq(messages.sender_id, currentUserId), eq(messages.recipient_id, contactId)),
          and(eq(messages.sender_id, contactId), eq(messages.recipient_id, currentUserId))
        )
      ))
      .orderBy(asc(messages.created_at));

    // Marquer comme lus
    await db
      .update(messages)
      .set({ is_read: 1, read_at: sql`CURRENT_TIMESTAMP` })
      .where(and(
        eq(messages.sender_id, contactId),
        eq(messages.recipient_id, currentUserId),
        eq(messages.is_read, 0)
      ));

    return c.json({ messages: results });
  } catch (error) {
    console.error('Get private messages error:', error);
    return c.json({ error: 'Erreur lors de la récupération des messages' }, 500);
  }
});

// GET /api/messages/unread-count
messagesRoute.get('/unread-count', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const currentUserId = Number(user.userId);
    const db = getDb(c.env);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.recipient_id, currentUserId),
        eq(messages.is_read, 0)
      ))
      .get();

    return c.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json({ error: 'Erreur lors du comptage' }, 500);
  }
});

// GET /api/messages/available-users
messagesRoute.get('/available-users', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const db = getDb(c.env);

    const results = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        full_name: users.full_name,
        role: users.role,
        email: users.email
      })
      .from(users)
      .where(and(
        ne(users.id, user.userId),
        ne(users.id, 0)
      ))
      .orderBy(desc(users.role), asc(users.first_name));

    return c.json({ users: results });
  } catch (error) {
    console.error('Get available users error:', error);
    return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
  }
});

// DELETE /api/messages/:messageId
messagesRoute.delete('/:messageId', authMiddleware, zValidator('param', messageIdParamSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const currentUserId = Number(user.userId);
    const { messageId } = c.req.valid('param');
    const db = getDb(c.env);

    // isNaN check not needed due to Zod

    const message = await db
      .select({
        ...getTableColumns(messages),
        sender_role: users.role
      })
      .from(messages)
      .leftJoin(users, eq(messages.sender_id, users.id))
      .where(eq(messages.id, messageId))
      .get();

    if (!message) {
      return c.json({ error: 'Message non trouvé' }, 404);
    }

    // RBAC Check
    const canDeleteAll = await hasPermission(c.env.DB, user.role, 'messages', 'delete', 'all');
    const canDeleteOwn = await hasPermission(c.env.DB, user.role, 'messages', 'delete', 'own');

    let canDelete = false;

    if (canDeleteAll) {
        canDelete = true;
    } else if (canDeleteOwn && message.sender_id === currentUserId) {
        canDelete = true;
    }

    if (!canDelete) {
      return c.json({ 
          error: 'Permission refusée',
          details: 'Nécessite messages.delete.all ou messages.delete.own (si expéditeur)'
      }, 403);
    }

    if (message.audio_file_key) {
      try {
        await c.env.MEDIA_BUCKET.delete(message.audio_file_key);
        console.log(`Audio supprimé du R2: ${message.audio_file_key}`);
      } catch (e) {
        console.error(`Erreur suppression audio R2:`, e);
      }
    }

    await db.delete(messages).where(eq(messages.id, messageId));

    return c.json({
      message: 'Message supprimé avec succès',
      audioDeleted: !!message.audio_file_key
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return c.json({ error: 'Erreur lors de la suppression du message' }, 500);
  }
});

// POST /api/messages/bulk-delete
messagesRoute.post('/bulk-delete', authMiddleware, zValidator('json', bulkDeleteMessagesSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const currentUserId = Number(user.userId);
    const { message_ids } = c.req.valid('json');
    const db = getDb(c.env);

    let deletedCount = 0;
    let audioDeletedCount = 0;
    const errors: any[] = [];

    // On ne peut pas facilement faire un "bulk delete" sécurisé en une requête SQL 
    // car on doit vérifier les permissions pour chaque message individuellement
    // ou faire une requête complexe. La boucle est acceptable pour < 100 items.

    for (const messageId of message_ids) {
      try {
        const message = await db
          .select({
            ...getTableColumns(messages),
            sender_role: users.role
          })
          .from(messages)
          .leftJoin(users, eq(messages.sender_id, users.id))
          .where(eq(messages.id, messageId))
          .get();

        if (!message) {
          errors.push({ messageId, error: 'Message non trouvé' });
          continue;
        }

        const canDeleteAll = await hasPermission(c.env.DB, user.role, 'messages', 'delete', 'all');
        const canDeleteOwn = await hasPermission(c.env.DB, user.role, 'messages', 'delete', 'own');

        let canDelete = false;
        if (canDeleteAll) {
            canDelete = true;
        } else if (canDeleteOwn && message.sender_id === currentUserId) {
            canDelete = true;
        }

        if (!canDelete) {
          errors.push({ messageId, error: 'Permission refusée' });
          continue;
        }

        if (message.audio_file_key) {
          try {
            await c.env.MEDIA_BUCKET.delete(message.audio_file_key);
            audioDeletedCount++;
          } catch (e) {
            console.error(`Erreur suppression audio R2:`, e);
          }
        }

        await db.delete(messages).where(eq(messages.id, messageId));
        deletedCount++;
      } catch (error) {
        console.error(`Erreur suppression message ${messageId}:`, error);
        errors.push({ messageId, error: 'Erreur serveur' });
      }
    }

    return c.json({
      message: `${deletedCount} message(s) supprimé(s) avec succès`,
      deletedCount,
      audioDeletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk delete messages error:', error);
    return c.json({ error: 'Erreur lors de la suppression en masse' }, 500);
  }
});

// GET /api/messages/test/r2
messagesRoute.get('/test/r2', async (c) => {
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

/**
 * 🔔 LOGIN SUMMARY NOTIFICATION (LAW #12)
 */
export async function sendLoginSummaryNotification(
  env: Bindings,
  userId: number
): Promise<void> {
  try {
    console.log(`[LOGIN-SUMMARY] Starting check for user ${userId}`);
    const db = getDb(env);
    
    // 1️⃣ Vérifier le throttling (max 1 fois par 24h)
    const lastSummary = await db
      .select({ created_at: pushLogs.created_at })
      .from(pushLogs)
      .where(and(
        eq(pushLogs.user_id, userId),
        eq(pushLogs.status, 'login_summary_sent')
      ))
      .orderBy(desc(pushLogs.created_at))
      .limit(1)
      .get();
    
    if (lastSummary) {
      const lastSummaryTime = new Date(lastSummary.created_at as string);
      const now = new Date();
      const hoursSinceLastSummary = (now.getTime() - lastSummaryTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSummary < 24) {
        console.log(`[LOGIN-SUMMARY] Throttled for user ${userId} (last summary: ${hoursSinceLastSummary.toFixed(1)}h ago)`);
        return;
      }
    }
    
    // 2️⃣ Compter les messages non lus
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.recipient_id, userId),
        eq(messages.is_read, 0)
      ))
      .get();
    
    const unreadCount = unreadResult?.count || 0;
    
    if (unreadCount === 0) {
      console.log(`[LOGIN-SUMMARY] No unread messages for user ${userId}`);
      return;
    }
    
    console.log(`[LOGIN-SUMMARY] User ${userId} has ${unreadCount} unread message(s)`);
    
    // 3️⃣ Vérifier que l'utilisateur a des push subscriptions actives
    const subscriptionResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId))
      .get();
    
    const subscriptionCount = subscriptionResult?.count || 0;
    
    if (subscriptionCount === 0) {
      console.log(`[LOGIN-SUMMARY] User ${userId} has no push subscriptions`);
      return;
    }
    
    // 4️⃣ Envoyer la notification de résumé
    const { sendPushNotification } = await import('./push');
    
    const messageText = unreadCount === 1 
      ? 'Vous avez 1 message non lu'
      : `Vous avez ${unreadCount} messages non lus`;
    
    const pushResult = await sendPushNotification(env, userId, {
      title: '📬 Messages en attente',
      body: messageText,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        url: '/',
        action: 'login_summary',
        unreadCount: unreadCount
      }
    });
    
    // 5️⃣ Logger le résultat
    await db.insert(pushLogs).values({
      user_id: userId,
      ticket_id: null,
      status: pushResult.success ? 'login_summary_sent' : 'login_summary_failed',
      error_message: pushResult.success ? null : JSON.stringify(pushResult)
    });
    
    if (pushResult.success) {
      console.log(`✅ [LOGIN-SUMMARY] Summary notification sent to user ${userId} (${unreadCount} unread)`);
    } else {
      console.log(`❌ [LOGIN-SUMMARY] Failed to send summary to user ${userId}`);
    }
    
  } catch (error: any) {
    console.error(`❌ [LOGIN-SUMMARY] Error for user ${userId} (non-blocking):`, error);
    
    // Tenter de logger l'erreur (best-effort)
    try {
      const db = getDb(env);
      await db.insert(pushLogs).values({
        user_id: userId,
        ticket_id: null,
        status: 'login_summary_error',
        error_message: error.message || String(error)
      });
    } catch (logError) {
      console.error('[LOGIN-SUMMARY] Failed to log error:', logError);
    }
  }
}

export default messagesRoute;
