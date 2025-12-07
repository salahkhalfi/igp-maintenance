import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { Bindings } from '../types';
import { sendPushNotification } from './push';
import { hashPassword } from '../utils/password';
import { chatGuests } from '../db/schema'; // Assuming schema export
import { eq } from 'drizzle-orm';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware: All chat routes require authentication
app.use('*', authMiddleware);

// 1. GET /api/v2/chat/conversations - List user's conversations
app.get('/conversations', async (c) => {
    const user = c.get('user');
    const userId = user.userId;
    let debugLog = `UID: ${userId} (${user.email}). `;

        // AUTO-JOIN and UPDATE LAST_SEEN
        // Update last_seen for current user (handle guest vs employee)
        try {
            const isGuest = user.isGuest || user.is_guest;
            if (isGuest) {
                await c.env.DB.prepare(`UPDATE chat_guests SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`).bind(Math.abs(userId)).run();
            } else {
                await c.env.DB.prepare(`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`).bind(userId).run();
            }
        } catch (e) {
            // Ignore error if column doesn't exist yet or DB is busy
            console.error("Update last_seen error", e);
        }

        try {
            // AUTO-JOIN: Si l'utilisateur n'a AUCUNE conversation, on l'ajoute automatiquement au groupe "Général"
        const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM chat_participants WHERE user_id = ?`).bind(userId).first();
        const count = countResult ? (countResult.count as number) : 0;
        
        debugLog += `Chats: ${count}. `;
        
        if (count === 0) {
            debugLog += `Joining General... `;
            try {
                await c.env.DB.prepare(`
                    INSERT OR IGNORE INTO chat_participants (conversation_id, user_id, role) 
                    VALUES ('general-group-uuid', ?, 'member')
                `).bind(userId).run();
                debugLog += `Joined! `;
            } catch (err) {
                console.error("Auto-join failed:", err);
                debugLog += `Join Err: ${err}. `;
            }
        }

        // Fetch conversations where user is a participant
        // Join with last message for preview
        const conversations = await c.env.DB.prepare(`
            SELECT 
                c.id, 
                c.type, 
                c.name,
                c.avatar_key, 
                c.updated_at,
                (
                    SELECT content FROM chat_messages 
                    WHERE conversation_id = c.id 
                    ORDER BY created_at DESC LIMIT 1
                ) as last_message,
                (
                    SELECT type FROM chat_messages 
                    WHERE conversation_id = c.id 
                    ORDER BY created_at DESC LIMIT 1
                ) as last_message_type,
                (
                    SELECT created_at FROM chat_messages 
                    WHERE conversation_id = c.id 
                    ORDER BY created_at DESC LIMIT 1
                ) as last_message_time,
                (
                    SELECT COUNT(*) FROM chat_participants cp_count
                    WHERE cp_count.conversation_id = c.id
                ) as participant_count,
                (
                    SELECT COUNT(*)
                    FROM chat_participants cp_online
                    LEFT JOIN users u_online ON cp_online.user_id = u_online.id AND cp_online.user_id > 0
                    LEFT JOIN chat_guests g_online ON ABS(cp_online.user_id) = g_online.id AND cp_online.user_id < 0
                    WHERE cp_online.conversation_id = c.id
                    AND (
                        u_online.last_seen > datetime('now', '-5 minutes') OR 
                        g_online.last_seen > datetime('now', '-5 minutes')
                    )
                ) as online_count,
                (
                    SELECT COUNT(*) FROM chat_messages cm
                    WHERE cm.conversation_id = c.id 
                    AND cm.created_at > (
                        SELECT COALESCE(last_read_at, '1970-01-01') 
                        FROM chat_participants 
                        WHERE conversation_id = c.id AND user_id = ?
                    )
                ) as unread_count
            FROM chat_conversations c
            JOIN chat_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
            ORDER BY c.updated_at DESC
        `).bind(userId, userId).all();

        // Resolve names/avatars for Direct Chats
        const enhancedConversations = await Promise.all((conversations.results || []).map(async (conv: any) => {
            if (conv.type === 'direct' && !conv.name) {
                // Find the OTHER participant
                const otherUser = await c.env.DB.prepare(`
                    SELECT 
                        COALESCE(u.full_name, g.full_name) as full_name, 
                        u.avatar_key 
                    FROM chat_participants cp
                    LEFT JOIN users u ON cp.user_id = u.id AND cp.user_id > 0
                    LEFT JOIN chat_guests g ON ABS(cp.user_id) = g.id AND cp.user_id < 0
                    WHERE cp.conversation_id = ? AND cp.user_id != ?
                `).bind(conv.id, userId).first();

                if (otherUser) {
                    return { ...conv, name: otherUser.full_name, avatar_key: otherUser.avatar_key };
                }
            }
            return conv;
        }));

        return c.json({ conversations: enhancedConversations, debug: debugLog });
    } catch (e) {
        return c.json({ error: 'Failed to load conversations', debug: debugLog + ` ERR: ${e}` }, 500);
    }
});

// 2. GET /api/v2/chat/conversations/:id - Get messages for a conversation
app.get('/conversations/:id/messages', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const limit = 50; // Pagination limit
    const offset = Number(c.req.query('offset') || 0);

    // Security: Ensure user is participant
    const isParticipant = await c.env.DB.prepare(`
        SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    if (!isParticipant) return c.json({ error: 'Access denied' }, 403);

    // Updated Query: Support Guests (Negative IDs)
    const messages = await c.env.DB.prepare(`
        SELECT 
            m.id, 
            m.sender_id, 
            COALESCE(u.full_name, g.full_name) as sender_name,
            u.avatar_key as sender_avatar_key,
            m.type, 
            m.content, 
            m.media_key, 
            m.created_at 
        FROM chat_messages m
        LEFT JOIN users u ON m.sender_id = u.id AND m.sender_id > 0
        LEFT JOIN chat_guests g ON ABS(m.sender_id) = g.id AND m.sender_id < 0
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    `).bind(conversationId, limit, offset).all();

    // Récupérer le statut de lecture ET les infos des participants
    // Updated Query: Support Guests
    const participants = await c.env.DB.prepare(`
        SELECT 
            cp.user_id, 
            cp.last_read_at, 
            cp.role, 
            COALESCE(u.full_name, g.full_name) as full_name, 
            COALESCE(u.last_seen, g.last_seen) as last_seen, 
            u.avatar_key
        FROM chat_participants cp
        LEFT JOIN users u ON cp.user_id = u.id AND cp.user_id > 0
        LEFT JOIN chat_guests g ON ABS(cp.user_id) = g.id AND cp.user_id < 0
        WHERE cp.conversation_id = ?
    `).bind(conversationId).all();

    // Récupérer les infos de la conversation
    const conversation = await c.env.DB.prepare(`
        SELECT id, type, name, avatar_key, created_by, created_at 
        FROM chat_conversations 
        WHERE id = ?
    `).bind(conversationId).first();

    return c.json({ 
        messages: messages.results.reverse(),
        participants: participants.results,
        conversation: conversation
    });
});

// 7. POST /api/v2/chat/conversations/:id/read - Mark conversation as read
app.post('/conversations/:id/read', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    
    await c.env.DB.prepare(`
        UPDATE chat_participants
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).run();

    return c.json({ success: true });
});

// 8. GET /api/v2/chat/users - List all available users for chat (Employees + Guests)
app.get('/users', async (c) => {
    const user = c.get('user');
    
    // 1. Employees
    const employees = await c.env.DB.prepare(`
        SELECT id, full_name, role, email, avatar_key
        FROM users 
        WHERE id != ? 
        ORDER BY first_name ASC
    `).bind(user.userId).all();

    // 2. Guests
    const guests = await c.env.DB.prepare(`
        SELECT id, full_name, role, email, company
        FROM chat_guests 
        WHERE is_active = 1
        ORDER BY full_name ASC
    `).all();

    // Map guests to negative IDs and add company info
    const mappedGuests = (guests.results || []).map((g: any) => ({
        id: -Math.abs(g.id), // Negative ID
        full_name: `${g.full_name} (${g.company || 'Externe'})`,
        role: 'guest',
        email: g.email,
        is_guest: true
    }));

    // Filter out current user if they are a guest
    const filteredGuests = mappedGuests.filter((g: any) => g.id !== user.userId);

    return c.json({ users: [...(employees.results || []), ...filteredGuests] });
});

// --- GUEST MANAGEMENT (ADMIN ONLY) ---

// GET /api/v2/chat/guests - List guests
app.get('/guests', async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403);

    const guests = await c.env.DB.prepare(`SELECT * FROM chat_guests ORDER BY created_at DESC`).all();
    return c.json({ guests: guests.results });
});

// POST /api/v2/chat/guests - Create guest
app.post('/guests', async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403);

    const { email, password, full_name, company } = await c.req.json();

    // Check duplicate email in both tables
    const existingUser = await c.env.DB.prepare(`SELECT 1 FROM users WHERE email = ?`).bind(email).first();
    const existingGuest = await c.env.DB.prepare(`SELECT 1 FROM chat_guests WHERE email = ?`).bind(email).first();

    if (existingUser || existingGuest) {
        return c.json({ error: 'Email déjà utilisé' }, 409);
    }

    const passwordHash = await hashPassword(password);

    await c.env.DB.prepare(`
        INSERT INTO chat_guests (email, password_hash, full_name, company)
        VALUES (?, ?, ?, ?)
    `).bind(email, passwordHash, full_name, company).run();

    return c.json({ success: true });
});

// DELETE /api/v2/chat/guests/:id - Delete guest
app.delete('/guests/:id', async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403);

    const guestId = c.req.param('id');
    
    // 1. Remove from all conversations (Cascade handled by DB ideally, but we use negative IDs so we must be careful)
    // Actually, in chat_participants, the user_id is the negative ID.
    // The guest table ID is positive.
    const negativeGuestId = -Math.abs(Number(guestId));

    // Clean up participants
    await c.env.DB.prepare(`DELETE FROM chat_participants WHERE user_id = ?`).bind(negativeGuestId).run();
    
    // Anonymize messages
    await c.env.DB.prepare(`UPDATE chat_messages SET sender_id = 0 WHERE sender_id = ?`).bind(negativeGuestId).run();

    // Delete guest
    await c.env.DB.prepare(`DELETE FROM chat_guests WHERE id = ?`).bind(guestId).run();

    return c.json({ success: true });
});

// 9. POST /api/v2/chat/conversations/:id/participants - Add participant to group
app.post('/conversations/:id/participants', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const { userId } = await c.req.json();

    // Vérifier si c'est un groupe
    const conv = await c.env.DB.prepare('SELECT type FROM chat_conversations WHERE id = ?').bind(conversationId).first();
    if (!conv) return c.json({ error: 'Conversation introuvable' }, 404);

    if (conv.type !== 'group') {
        // GOD MODE: Admin can convert direct to group
        if (user.role === 'admin' && conv.type === 'direct') {
             await c.env.DB.prepare("UPDATE chat_conversations SET type = 'group', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(conversationId).run();
             
             // Message système de conversion
             const sysId = crypto.randomUUID();
             await c.env.DB.prepare(`
                INSERT INTO chat_messages (id, conversation_id, sender_id, type, content)
                VALUES (?, ?, ?, 'system', ?)
             `).bind(sysId, conversationId, user.userId, 'a converti cette discussion en groupe').run();
             
        } else {
             return c.json({ error: 'Seuls les groupes peuvent accepter de nouveaux membres' }, 400);
        }
    }

    // Vérifier si déjà dedans
    const existing = await c.env.DB.prepare('SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?')
        .bind(conversationId, userId).first();
    
    if (existing) return c.json({ error: 'Déjà membre' }, 400);

    // Ajouter
    await c.env.DB.prepare(`
        INSERT INTO chat_participants (conversation_id, user_id, role) 
        VALUES (?, ?, 'member')
    `).bind(conversationId, userId).run();

    // Message système (facultatif, pour dire "X a ajouté Y")
    const messageId = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO chat_messages (id, conversation_id, sender_id, type, content)
        VALUES (?, ?, ?, 'system', ?)
    `).bind(messageId, conversationId, user.userId, 'a ajouté un participant').run();

    return c.json({ success: true });
});

// 3. POST /api/v2/chat/send - Send a message
app.post('/send', async (c) => {
    const user = c.get('user');
    const { conversationId, content, type = 'text', mediaKey, mediaMeta } = await c.req.json();
    const messageId = crypto.randomUUID();

    try {
        // Security check
        const isParticipant = await c.env.DB.prepare(`
            SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?
        `).bind(conversationId, user.userId).first();

        if (!isParticipant) {
            console.warn(`[CHAT-SEND-DENIED] User ${user.userId} denied access to conv ${conversationId}`);
            return c.json({ error: 'Access denied' }, 403);
        }

        await c.env.DB.prepare(`
            INSERT INTO chat_messages (id, conversation_id, sender_id, type, content, media_key, media_meta)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            messageId, 
            conversationId, 
            user.userId, 
            type, 
            content, 
            mediaKey || null, 
            mediaMeta ? JSON.stringify(mediaMeta) : null
        ).run();

        // Update conversation timestamp
        await c.env.DB.prepare(`
            UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(conversationId).run();

        // Trigger Push Notifications asynchronously
        c.executionCtx.waitUntil((async () => {
            try {
                // Get other participants
                const { results: participants } = await c.env.DB.prepare(`
                    SELECT user_id FROM chat_participants 
                    WHERE conversation_id = ? AND user_id != ?
                `).bind(conversationId, user.userId).all();

                const pushTitle = user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Nouveau message';
                const pushBody = type === 'image' ? '📷 Photo envoyée' : content;

                for (const p of participants) {
                    await sendPushNotification(c.env, p.user_id as number, {
                        title: pushTitle,
                        body: pushBody,
                        icon: '/icon-192.png',
                        data: {
                            url: 'https://mecanique.igpglass.ca/messenger',
                            conversationId: conversationId
                        }
                    });
                }
            } catch (err) {
                console.error("Push chat error", err);
            }
        })());

        return c.json({ success: true, messageId });
    } catch (e) {
        return c.json({ error: `Failed to send message: ${e}` }, 500);
    }
});

// 4. POST /api/v2/chat/conversations - Create new conversation (Direct or Group)
app.post('/conversations', async (c) => {
    try {
        const user = c.get('user');
        const { type, participantIds, name } = await c.req.json();
        
        // Basic Validation
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return c.json({ error: 'Liste des participants invalide ou vide' }, 400);
        }

        const conversationId = crypto.randomUUID();

        // RESTRICTION: Seuls les Admin, Superviseurs, et Techniciens peuvent créer des groupes
        // Les Opérateurs (role='operator' ou 'furnace_operator') ne peuvent pas.
        if (type === 'group' && (user.role === 'operator' || user.role === 'furnace_operator')) {
            return c.json({ error: 'Non autorisé: Seuls les superviseurs et techniciens peuvent créer des groupes' }, 403);
        }

        // GET OR CREATE for Direct Chats
        if (type === 'direct') {
            const targetId = participantIds[0];
            
            // Prevent self-chat loop if frontend check fails
            if (targetId === user.userId) {
                 return c.json({ error: 'Impossible de discuter avec soi-même' }, 400);
            }

            // Find existing conversation between these 2 users
            // Note: This query looks for a direct conversation having BOTH users
            const existing = await c.env.DB.prepare(`
                SELECT c.id 
                FROM chat_conversations c
                JOIN chat_participants cp1 ON c.id = cp1.conversation_id
                JOIN chat_participants cp2 ON c.id = cp2.conversation_id
                WHERE c.type = 'direct' 
                AND cp1.user_id = ? 
                AND cp2.user_id = ?
            `).bind(user.userId, targetId).first();

            if (existing) {
                return c.json({ success: true, conversationId: existing.id });
            }
        }

        // Add creator to participants
        const allParticipants = [...new Set([...participantIds, user.userId])];

        // Transaction to create conv and add participants
        // IMPORTANT: Ensure all bound values are valid (undefined -> null)
        const batch = [
            c.env.DB.prepare(`INSERT INTO chat_conversations (id, type, name, created_by) VALUES (?, ?, ?, ?)`).bind(conversationId, type, name || null, user.userId)
        ];

        for (const uid of allParticipants) {
            // Le créateur est 'admin' du groupe, les autres sont 'member'
            const role = (uid === user.userId) ? 'admin' : 'member';
            batch.push(
                c.env.DB.prepare(`INSERT INTO chat_participants (conversation_id, user_id, role) VALUES (?, ?, ?)`).bind(conversationId, uid, role)
            );
        }

        await c.env.DB.batch(batch);

        return c.json({ success: true, conversationId });
    } catch (e: any) {
        console.error("Create conversation error:", e);
        // Return the specific error message to the frontend
        return c.json({ error: `Erreur serveur: ${e.message || e}` }, 500);
    }
});

// 10. PUT /api/v2/chat/conversations/:id - Update conversation (Name, Avatar) - Admin only
app.put('/conversations/:id', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const { name, avatar_key } = await c.req.json();

    // Vérifier si l'utilisateur est admin du groupe ou Admin Global
    const participant = await c.env.DB.prepare(`
        SELECT role FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    const isGroupAdmin = participant && participant.role === 'admin';
    const isGlobalAdmin = user.role === 'admin';

    if (!isGroupAdmin && !isGlobalAdmin) {
        return c.json({ error: 'Seul l\'administrateur du groupe peut modifier les infos' }, 403);
    }

    if (name !== undefined) {
        await c.env.DB.prepare(`UPDATE chat_conversations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(name, conversationId).run();
    }
    
    if (avatar_key !== undefined) {
        await c.env.DB.prepare(`UPDATE chat_conversations SET avatar_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(avatar_key, conversationId).run();
    }

    return c.json({ success: true });
});

// POST /api/v2/chat/conversations/:id/avatar - Upload group avatar
app.post('/conversations/:id/avatar', async (c) => {
    try {
        const user = c.get('user');
        const conversationId = c.req.param('id');
        
        // Check permissions
        const participant = await c.env.DB.prepare(`
            SELECT role FROM chat_participants WHERE conversation_id = ? AND user_id = ?
        `).bind(conversationId, user.userId).first();

        const isGroupAdmin = participant && participant.role === 'admin';
        const isGlobalAdmin = user.role === 'admin';

        if (!isGroupAdmin && !isGlobalAdmin) {
            return c.json({ error: 'Admin only' }, 403);
        }

        const formData = await c.req.formData();
        const file = formData.get('file') as File;

        if (!file) return c.json({ error: 'No file provided' }, 400);
        
        // Basic validation
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return c.json({ error: `Invalid file type (${file.type}). Only images allowed.` }, 400);
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return c.json({ error: 'File too large (max 5MB)' }, 400);
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const key = `groups/${conversationId}/avatar-${timestamp}-${randomStr}`;

        // Upload to R2
        await c.env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        // Update Conversation Record
        await c.env.DB.prepare(`UPDATE chat_conversations SET avatar_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .bind(key, conversationId).run();

        return c.json({ success: true, avatar_key: key });
    } catch (e: any) {
        console.error("Group avatar upload error", e);
        return c.json({ error: `Upload failed: ${e.message}` }, 500);
    }
});

// 11. DELETE /api/v2/chat/conversations/:id/participants/:userId - Remove participant (Kick)
app.delete('/conversations/:id/participants/:userId', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const targetUserId = Number(c.req.param('userId'));

    // Vérifier droits: Admin du groupe requis
    const participant = await c.env.DB.prepare(`
        SELECT role FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    if (!participant || participant.role !== 'admin') {
        // Exception: On peut se retirer soi-même (Quitter le groupe)
        if (user.userId !== targetUserId) {
            return c.json({ error: 'Seul l\'administrateur du groupe peut retirer des membres' }, 403);
        }
    }

    // Empêcher de retirer le dernier admin (ou soi-même si on est le seul admin ?)
    // Simplification: On exécute la suppression
    await c.env.DB.prepare(`DELETE FROM chat_participants WHERE conversation_id = ? AND user_id = ?`)
        .bind(conversationId, targetUserId).run();

    // Message système
    const messageId = crypto.randomUUID();
    const content = (user.userId === targetUserId) ? 'a quitté le groupe' : 'a retiré un participant';
    
    await c.env.DB.prepare(`
        INSERT INTO chat_messages (id, conversation_id, sender_id, type, content)
        VALUES (?, ?, ?, 'system', ?)
    `).bind(messageId, conversationId, user.userId, content).run();

    return c.json({ success: true });
});

// 5. POST /api/v2/chat/profile/avatar - Update user avatar
app.post('/profile/avatar', async (c) => {
    try {
        const user = c.get('user');
        const formData = await c.req.formData();
        const file = formData.get('file') as File;

        if (!file) return c.json({ error: 'No file provided' }, 400);
        
        // Basic validation
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return c.json({ error: `Invalid file type (${file.type}). Only images allowed.` }, 400);
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit for avatars
            return c.json({ error: 'File too large (max 5MB)' }, 400);
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const key = `avatars/${user.userId}-${timestamp}-${randomStr}`;

        // Upload to R2
        await c.env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        // Update User Record
        await c.env.DB.prepare(`UPDATE users SET avatar_key = ? WHERE id = ?`)
            .bind(key, user.userId).run();

        return c.json({ success: true, avatar_key: key });
    } catch (e: any) {
        console.error("Avatar upload error", e);
        return c.json({ error: `Upload failed: ${e.message}` }, 500);
    }
});

// 5. POST /api/v2/chat/upload - Upload chat attachment
app.post('/upload', async (c) => {
    try {
        const user = c.get('user');
        const formData = await c.req.formData();
        const file = formData.get('file') as File;

        if (!file) return c.json({ error: 'No file provided' }, 400);
        
        // Basic validation
        const ALLOWED_TYPES = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-m4a'
        ];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return c.json({ error: `Invalid file type (${file.type}). Only images and audio allowed.` }, 400);
        }
        if (file.size > 25 * 1024 * 1024) { // 25MB limit for audio/video
            return c.json({ error: 'File too large (max 25MB)' }, 400);
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        // Safe filename
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `chat/${user.userId}/${timestamp}-${randomStr}-${cleanName}`;

        await c.env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        return c.json({ success: true, key });
    } catch (e: any) {
        console.error("Chat upload error", e);
        return c.json({ error: `Upload failed: ${e.message}` }, 500);
    }
});

// 6. GET /api/v2/chat/asset - Securely serve chat assets
app.get('/asset', async (c) => {
    const key = c.req.query('key');
    if (!key) return c.text('Missing key', 400);

    // TODO: Add permission check (is user part of conversation that has this file?)
    // For now, relying on AuthMiddleware (valid user) + obscure key

    const object = await c.env.MEDIA_BUCKET.get(key);
    if (!object) return c.text('Not found', 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 year

    return new Response(object.body, { headers });
});

// 12. DELETE /api/v2/chat/conversations/:id - Delete entire conversation (Global Admin only)
app.delete('/conversations/:id', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');

    // Check if Global Admin
    if (user.role !== 'admin') {
        return c.json({ error: 'Admin only' }, 403);
    }

    // 1. Find all media keys to delete
    const mediaMessages = await c.env.DB.prepare(`
        SELECT media_key FROM chat_messages 
        WHERE conversation_id = ? AND media_key IS NOT NULL
    `).bind(conversationId).all();

    // 2. Delete from R2
    const keysToDelete = (mediaMessages.results || []).map((m: any) => m.media_key).filter((k: any) => k);
    if (keysToDelete.length > 0) {
        await Promise.all(keysToDelete.map((key: string) => c.env.MEDIA_BUCKET.delete(key)));
    }

    // 3. Delete DB records
    await c.env.DB.batch([
        c.env.DB.prepare(`DELETE FROM chat_messages WHERE conversation_id = ?`).bind(conversationId),
        c.env.DB.prepare(`DELETE FROM chat_participants WHERE conversation_id = ?`).bind(conversationId),
        c.env.DB.prepare(`DELETE FROM chat_conversations WHERE id = ?`).bind(conversationId)
    ]);

    return c.json({ success: true });
});

// 13. DELETE /api/v2/chat/conversations/:id/messages/:messageId - Delete single message (Global Admin only)
app.delete('/conversations/:id/messages/:messageId', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const messageId = c.req.param('messageId');

    // Check if Global Admin
    if (user.role !== 'admin') {
        return c.json({ error: 'Admin only' }, 403);
    }

    // 1. Get message media key
    const message = await c.env.DB.prepare(`
        SELECT media_key FROM chat_messages WHERE id = ? AND conversation_id = ?
    `).bind(messageId, conversationId).first();

    if (message && message.media_key) {
        await c.env.MEDIA_BUCKET.delete(message.media_key as string);
    }

    // 2. Delete message
    await c.env.DB.prepare(`DELETE FROM chat_messages WHERE id = ?`).bind(messageId).run();

    return c.json({ success: true });
});

export default app;
