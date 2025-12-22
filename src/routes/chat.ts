import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { getCookie } from 'hono/cookie';
import { extractToken, verifyToken } from '../utils/jwt';
import { Bindings } from '../types';
import { sendPushNotification } from './push';
import { hashPassword } from '../utils/password';
import { chatGuests, systemSettings } from '../db/schema'; // Assuming schema export
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { 
  conversationIdParamSchema, 
  messageIdParamSchema, 
  userIdParamSchema,
  guestIdParamSchema,
  createConversationSchema,
  updateConversationSchema,
  sendMessageSchema,
  addParticipantSchema,
  createGuestSchema,
  updateTranscriptionSchema,
  createActionCardSchema
} from '../schemas/chat';

// Helper for Vision Analysis
async function analyzeImageWithOpenAI(arrayBuffer: ArrayBuffer, contentType: string, apiKey: string): Promise<string | null> {
    try {
        // FIX: Safe Base64 encoding for large files (prevents Stack Overflow)
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Image = btoa(binary);
        
        const dataUrl = `data:${contentType};base64,${base64Image}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Describe this technical image in detail for a blind industrial expert. Focus on machines, error codes, safety signs, or schematics. Be precise and technical. If it's text/pdf screenshot, transcribe the key parts." },
                            { type: "image_url", image_url: { url: dataUrl } }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        if (response.ok) {
            const data = await response.json() as any;
            return data.choices[0].message.content;
        } else {
            console.error("OpenAI Vision Error:", await response.text());
            return null;
        }
    } catch (e) {
        console.error("OpenAI Vision Exception:", e);
        return null;
    }
}

const app = new Hono<{ Bindings: Bindings }>();

// 6. GET /api/v2/chat/asset - Securely serve chat assets (Moved up for Public Access to Avatars)
app.get('/asset', async (c) => {
    const key = c.req.query('key');
    if (!key) return c.text('Missing key', 400);

    // Special Case: Default AI Avatar
    if (key === 'ai_avatar') {
        const aiAvatarSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" rx="20" fill="#4F46E5"/>
                <path d="M50 20a30 30 0 0 1 30 30v20a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V50a30 30 0 0 1 30-30z" fill="#E0E7FF"/>
                <circle cx="35" cy="45" r="5" fill="#4F46E5"/>
                <circle cx="65" cy="45" r="5" fill="#4F46E5"/>
                <path d="M40 65a10 10 0 0 0 20 0" stroke="#4F46E5" stroke-width="4" fill="none"/>
            </svg>
        `;
        return new Response(aiAvatarSvg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=31536000'
            }
        });
    }

    // SECURITY CHECK: Resource Isolation
    // 1. Avatars (User or Group) -> PUBLIC ACCESS (No Auth Required)
    // This fixes "Avatar images disappeared" issues due to strict auth or cookie policies on images
    if (key.startsWith('avatars/') || key.startsWith('groups/')) {
        // Public Access Granted
    } 
    // 2. Chat Attachments -> Strict Participant Check (REQUIRES AUTH)
    else if (key.startsWith('chat/')) {
        // MANUAL AUTHENTICATION CHECK since this route is now before global middleware
        const cookieToken = getCookie(c, 'auth_token');
        const authHeader = c.req.header('Authorization');
        const token = cookieToken || extractToken(authHeader);
        
        if (!token) return c.text('Access Denied: No Token', 401);
        
        const user = await verifyToken(token);
        if (!user) return c.text('Access Denied: Invalid Token', 401);

        // FIX: RACE CONDITION & OWNERSHIP CHECK
        // If the user is the uploader (based on key path), they own it.
        // Format: chat/{userId}/...
        // This solves "Failed to load resource: 403" when image is loaded before message is saved.
        const keyParts = key.split('/');
        // keyParts[1] is the userId from the path
        if (keyParts.length >= 2 && keyParts[1] === String(user.userId)) {
             // Access Granted (Owner)
        } else {
            // FIX: Allow access if user is participant OR if conversation is 'expert_ai'
            const hasAccess = await c.env.DB.prepare(`
                SELECT 1 
                FROM chat_messages m
                LEFT JOIN chat_participants cp ON m.conversation_id = cp.conversation_id AND cp.user_id = ?
                WHERE m.media_key = ? 
                AND (cp.user_id IS NOT NULL OR m.conversation_id = 'expert_ai')
            `).bind(user.userId, key).first();

            if (!hasAccess) {
                console.warn(`[SECURITY] Unauthorized asset access attempt by ${user.userId} for ${key}`);
                return c.text('Access Denied', 403);
            }
        }
    } 
    // 3. Unknown paths -> Block by default (Paranoid Mode)
    else {
        console.warn(`[SECURITY] Blocked access to unknown path format: ${key}`);
        return c.text('Access Denied', 403);
    }

    const object = await c.env.MEDIA_BUCKET.get(key);
    if (!object) return c.text('Not found', 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 year

    return new Response(object.body, { headers });
});

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
        
        // 1. Base Query (Lightweight)
        const conversations = await c.env.DB.prepare(`
            SELECT 
                c.id, 
                cp.display_order,
                c.type, 
                c.name, 
                c.avatar_key, 
                c.updated_at,
                (SELECT content FROM chat_messages WHERE conversation_id = c.id AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT type FROM chat_messages WHERE conversation_id = c.id AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 1) as last_message_type,
                (SELECT created_at FROM chat_messages WHERE conversation_id = c.id AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY created_at DESC LIMIT 1) as last_message_time
            FROM chat_conversations c
            JOIN chat_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
            ORDER BY c.updated_at DESC
        `).bind(userId).all();

        // 2. Hydrate with Real-Time Counts (Parallel Execution to prevent Timeout)
        const enhancedConversations = await Promise.all((conversations.results || []).map(async (conv: any) => {
            
            // Execute counts in parallel for max speed
            const [pCount, online, unread, otherUser] = await Promise.all([
                // Participant Count
                c.env.DB.prepare(`SELECT COUNT(*) as c FROM chat_participants WHERE conversation_id = ?`).bind(conv.id).first(),
                
                // Online Count (Optimized)
                c.env.DB.prepare(`
                    SELECT COUNT(*) as c
                    FROM chat_participants cp
                    LEFT JOIN users u ON cp.user_id = u.id AND cp.user_id > 0
                    LEFT JOIN chat_guests g ON ABS(cp.user_id) = g.id AND cp.user_id < 0
                    WHERE cp.conversation_id = ?
                    AND (u.last_seen > datetime('now', '-5 minutes') OR g.last_seen > datetime('now', '-5 minutes'))
                `).bind(conv.id).first(),
                
                // Unread Count (excluding deleted messages)
                c.env.DB.prepare(`
                    SELECT COUNT(*) as c FROM chat_messages cm
                    WHERE cm.conversation_id = ? 
                    AND (cm.is_deleted = 0 OR cm.is_deleted IS NULL)
                    AND cm.created_at > (
                        SELECT COALESCE(last_read_at, '1970-01-01') 
                        FROM chat_participants 
                        WHERE conversation_id = ? AND user_id = ?
                    )
                `).bind(conv.id, conv.id, userId).first(),

                // Name Resolution (Only for direct chats)
                (conv.type === 'direct' && !conv.name) 
                    ? c.env.DB.prepare(`
                        SELECT COALESCE(u.full_name, g.full_name) as full_name, u.avatar_key 
                        FROM chat_participants cp
                        LEFT JOIN users u ON cp.user_id = u.id AND cp.user_id > 0
                        LEFT JOIN chat_guests g ON ABS(cp.user_id) = g.id AND cp.user_id < 0
                        WHERE cp.conversation_id = ? AND cp.user_id != ?
                      `).bind(conv.id, userId).first()
                    : Promise.resolve(null)
            ]);

            const finalConv = { 
                ...conv,
                participant_count: pCount?.c || 0,
                online_count: online?.c || 0,
                unread_count: unread?.c || 0
            };

            if (otherUser) {
                finalConv.name = (otherUser as any).full_name;
                finalConv.avatar_key = (otherUser as any).avatar_key;
            }

            return finalConv;
        }));

        return c.json({ conversations: enhancedConversations, debug: debugLog });
    } catch (e) {
        return c.json({ error: `Failed to load conversations: ${e.message || e}`, debug: debugLog + ` ERR: ${e}` }, 500);
    }
});

// 2. GET /api/v2/chat/conversations/:id - Get messages for a conversation
app.get('/conversations/:id/messages', async (c) => {
    const user = c.get('user');
    let conversationId = c.req.param('id');
    const limit = 50; // Pagination limit
    const offset = Number(c.req.query('offset') || 0);

    // --- HANDLE VIRTUAL IDs (direct_XX) ---
    // Fixes the 403 error when opening a chat from User Management
    if (conversationId.startsWith('direct_')) {
        const targetId = parseInt(conversationId.replace('direct_', ''), 10);
        
        if (!isNaN(targetId)) {
            // Try to find the REAL conversation ID
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
                // Found it! Use the real ID
                conversationId = existing.id as string;
            } else {
                // No conversation yet. Return empty list instead of 403.
                // This allows the UI to load an empty chat window.
                // The actual conversation will be created on the first POST /send
                return c.json({ 
                    messages: [],
                    participants: [], // Frontend might need basic info here, but empty is safe for now
                    conversation: { id: conversationId, type: 'direct', name: 'Nouveau message' } // Virtual stub
                });
            }
        }
    }

    // Security: Ensure user is participant
    const isParticipant = await c.env.DB.prepare(`
        SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    // FIX: Allow expert_ai to be viewed by anyone (Virtual Conversation)
    if (!isParticipant && conversationId !== 'expert_ai') return c.json({ error: 'Access denied' }, 403);

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
            m.transcription,
            m.created_at,
            ac.id as card_id,
            ac.status as card_status,
            ac.priority as card_priority,
            ac.assignee_id as card_assignee_id,
            ac.created_by as card_created_by,
            ac.updated_at as card_updated_at
        FROM chat_messages m
        LEFT JOIN users u ON m.sender_id = u.id AND m.sender_id > 0
        LEFT JOIN chat_guests g ON ABS(m.sender_id) = g.id AND m.sender_id < 0
        LEFT JOIN chat_action_cards ac ON m.id = ac.message_id
        WHERE m.conversation_id = ? AND (m.is_deleted = 0 OR m.is_deleted IS NULL)
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    `).bind(conversationId, limit, offset).all();

    const formattedMessages = (messages.results || []).map((m: any) => {
        const msg: any = {
            id: m.id,
            sender_id: m.sender_id,
            sender_name: m.sender_name,
            sender_avatar_key: m.sender_avatar_key,
            type: m.type,
            content: m.content,
            media_key: m.media_key,
            transcription: m.transcription,
            created_at: m.created_at
        };
        
        if (m.card_id) {
            msg.action_card = {
                id: m.card_id,
                status: m.card_status,
                priority: m.card_priority,
                assignee_id: m.card_assignee_id,
                created_by: m.card_created_by,
                updated_at: m.card_updated_at
            };
        }
        
        return msg;
    });

    // Récupérer le statut de lecture ET les infos des participants
    // Updated Query: Support Guests + SuperAdmin displayed as "SUPPORT"
    const participants = await c.env.DB.prepare(`
        SELECT 
            cp.user_id, 
            cp.last_read_at, 
            CASE WHEN u.is_super_admin = 1 THEN 'support' ELSE cp.role END as role, 
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
        messages: formattedMessages.reverse(),
        participants: participants.results,
        conversation: conversation
    });
});

// 7. POST /api/v2/chat/conversations/:id/read - Mark conversation as read
app.post('/conversations/:id/read', zValidator('param', conversationIdParamSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId } = c.req.valid('param');
    
    await c.env.DB.prepare(`
        UPDATE chat_participants
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).run();

    return c.json({ success: true });
});

// 8. GET /api/v2/chat/users - List all available users for chat (Employees + Guests)
// NOTE: SuperAdmins are visible in chat but with role displayed as "SUPPORT"
app.get('/users', async (c) => {
    const user = c.get('user');
    
    // 1. Employees (SuperAdmins appear as "SUPPORT" role)
    const employees = await c.env.DB.prepare(`
        SELECT id, full_name, 
               CASE WHEN is_super_admin = 1 THEN 'support' ELSE role END as role, 
               email, avatar_key
        FROM users 
        WHERE id != ? AND id != 0 AND deleted_at IS NULL
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
app.post('/guests', zValidator('json', createGuestSchema), async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403);

    const { email, password, name: full_name } = c.req.valid('json');
    const company = (await c.req.json()).company; // Optional field

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
app.delete('/guests/:id', zValidator('param', guestIdParamSchema), async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403);

    const { id: guestId } = c.req.valid('param');
    
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
app.post('/conversations/:id/participants', zValidator('param', conversationIdParamSchema), zValidator('json', addParticipantSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId } = c.req.valid('param');
    const { user_id: userId } = c.req.valid('json');

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
app.post('/send', zValidator('json', sendMessageSchema), async (c) => {
    const user = c.get('user');
    const validated = c.req.valid('json');
    let conversationId = validated.conversation_id;
    let content = validated.content;
    const type = validated.type || 'text';
    // Additional fields from raw body (not in schema - optional media fields)
    const rawBody = await c.req.json().catch(() => ({}));
    const { mediaKey, mediaMeta, isCall, transcription } = rawBody;
    const messageId = crypto.randomUUID();

    try {
        // --- HANDLE VIRTUAL IDs (direct_XX) - LAZY CREATION ---
        // If sending to a virtual ID, we must create the conversation first
        if (conversationId.startsWith('direct_')) {
            const targetId = parseInt(conversationId.replace('direct_', ''), 10);
            
            if (!isNaN(targetId)) {
                // 1. Check if conversation already exists (Race condition check)
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
                    // Use existing ID
                    conversationId = existing.id;
                } else {
                    // 2. Create NEW conversation on the fly
                    conversationId = crypto.randomUUID();
                    console.log(`[CHAT] Auto-creating direct chat between ${user.userId} and ${targetId}`);

                    const batch = [
                        c.env.DB.prepare(`INSERT INTO chat_conversations (id, type, name, created_by) VALUES (?, 'direct', null, ?)`).bind(conversationId, user.userId),
                        c.env.DB.prepare(`INSERT INTO chat_participants (conversation_id, user_id, role) VALUES (?, ?, 'admin')`).bind(conversationId, user.userId),
                        c.env.DB.prepare(`INSERT INTO chat_participants (conversation_id, user_id, role) VALUES (?, ?, 'member')`).bind(conversationId, targetId)
                    ];
                    
                    await c.env.DB.batch(batch);
                }
            } else {
                return c.json({ error: 'Invalid direct target ID' }, 400);
            }
        }

        // Security check
        const isParticipant = await c.env.DB.prepare(`
            SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?
        `).bind(conversationId, user.userId).first();

        // EXCEPTION: Allow 'expert_ai' conversation to be used freely (it's virtual/special)
        if (!isParticipant && conversationId !== 'expert_ai') {
            console.warn(`[CHAT-SEND-DENIED] User ${user.userId} denied access to conv ${conversationId}`);
            return c.json({ error: 'Access denied' }, 403);
        }

        // --- AI TRANSCRIPTION (AUDIO) ---
        // Fire and Forget strategy via waitUntil
        // Only run Server AI if no client-side transcription is provided
        if (type === 'audio' && mediaKey && !transcription) {
             c.executionCtx.waitUntil((async () => {
                try {
                    // 1. Get Audio File
                    const object = await c.env.MEDIA_BUCKET.get(mediaKey);
                    if (!object) return;
                    
                    const arrayBuffer = await object.arrayBuffer();
                    // 2. Run Transcription (Priority: Groq > OpenAI V3 > Fallback: Cloudflare)
                    let originalText = "";

                    // --- STRATEGY A: GROQ (Fast & Free-ish) ---
                    if (c.env.GROQ_API_KEY) {
                        try {
                            const formData = new FormData();
                            // Groq requires a file object/blob
                            const blob = new Blob([arrayBuffer], { type: object.httpMetadata?.contentType || 'audio/webm' });
                            formData.append('file', blob, 'audio.webm');
                            formData.append('model', 'whisper-large-v3'); 
                            
                            // Context prompt matching the industrial/Quebec focus
                            formData.append('prompt', "Technicien de maintenance industrielle. Accent québécois. Termes techniques, milieu bruyant.");
                            
                            const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${c.env.GROQ_API_KEY}` },
                                body: formData
                            });

                            if (resp.ok) {
                                const data = await resp.json() as any;
                                if (data.text && data.text.length > 0) {
                                    originalText = data.text;
                                    console.log("[AI] Groq Whisper V3 Success");
                                }
                            } else {
                                console.warn("[AI] Groq Error:", await resp.text());
                            }
                        } catch (e) {
                            console.warn("[AI] Groq Exception:", e);
                        }
                    }

                    // --- STRATEGY B: OPENAI (Reliable Fallback) ---
                    if (!originalText && c.env.OPENAI_API_KEY) {
                        try {
                            const formData = new FormData();
                            const blob = new Blob([arrayBuffer], { type: object.httpMetadata?.contentType || 'audio/webm' });
                            formData.append('file', blob, 'audio.webm');
                            formData.append('model', 'whisper-1');
                            formData.append('language', 'fr');
                            // Prompt "Secret Weapon" pour l'accent québécois et le contexte industriel
                            formData.append('prompt', "Technicien de maintenance industrielle. Accent québécois. Termes techniques, milieu bruyant.");

                            const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}` },
                                body: formData
                            });

                            if (resp.ok) {
                                const data = await resp.json() as any;
                                originalText = data.text || "";
                                console.log("[AI] OpenAI Whisper V3 Success");
                            } else {
                                console.error("[AI] OpenAI Error:", await resp.text());
                            }
                        } catch (e) {
                            console.error("[AI] OpenAI Exception:", e);
                        }
                    }

                    // Fallback to Cloudflare if OpenAI failed or missing key
                    if (!originalText) {
                        const inputs = {
                            audio: [...new Uint8Array(arrayBuffer)],
                            language: 'fr'
                        };
                        try {
                            const response = await c.env.AI.run('@cf/openai/whisper', inputs);
                            if (response && response.text) originalText = response.text;
                        } catch (e) {
                             console.error("[AI] Cloudflare Whisper failed:", e);
                        }
                    }
                    
                    // 3. Update DB (Step 1: Transcription pure et immédiate)
                    if (originalText) {
                        originalText = originalText.trim();
                        
                        // Anti-Hallucination Whisper (Simple filter)
                        const HALLUCINATIONS = [
                            'Sous-titres réalisés par', 
                            'Sous-titres par',
                            'Amara.org',
                            'MBC',
                            'Al Jazeera'
                        ];
                        
                        // New: Detect Asian characters (Common Whisper hallucination on silent audio)
                        const hasAsianChars = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]/.test(originalText);

                        const isHallucination = !originalText || 
                                              HALLUCINATIONS.some(h => originalText.includes(h)) || 
                                              hasAsianChars;

                        if (isHallucination) {
                             console.log(`[AI] Ignored hallucination: ${originalText}`);
                             return;
                        }

                        // Sauvegarde immédiate pour affichage rapide
                        let baseTranscription = "🎤 " + originalText;
                        await c.env.DB.prepare(`
                            UPDATE chat_messages 
                            SET transcription = ? 
                            WHERE id = ?
                        `).bind(baseTranscription, messageId).run();

                        // Step 2: Traduction (En différé)
                        if (originalText.length > 2) {
                            try {
                                // V1 Prompt Strategy (Restored)
                                const prompt = `Role: Industrial Translator.
Task: Translate the input text.
Logic:
- IF source is French -> Target is English.
- IF source is NOT French -> Target is French.
Constraint: Output ONLY the translated text. No "Here is" or quotes.

Input: "${originalText}"`;

                                const translationRes = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
                                    messages: [{ role: 'system', content: prompt }]
                                });

                                if (translationRes && translationRes.response) {
                                    const translation = translationRes.response.trim();
                                    
                                    // Anti-Hallucination & Repetition Check
                                    if (
                                        translation && 
                                        translation.toLowerCase() !== originalText.toLowerCase() && 
                                        translation.length > 2 &&
                                        !translation.startsWith("Here is")
                                    ) {
                                        const finalTranscription = baseTranscription + "\n\n🔄 " + translation;
                                        
                                        await c.env.DB.prepare(`
                                            UPDATE chat_messages 
                                            SET transcription = ? 
                                            WHERE id = ?
                                        `).bind(finalTranscription, messageId).run();
                                    }
                                }
                            } catch (aiErr) {
                                console.error("[AI] Translation failed (silent fail):", aiErr);
                            }
                        }
                        
                        console.log(`[AI] Processed message ${messageId}`);
                    }
                } catch (e) {
                    console.error("[AI] Transcription failed", e);
                }
             })());
        }

        await c.env.DB.prepare(`
            INSERT INTO chat_messages (id, conversation_id, sender_id, type, content, media_key, media_meta, transcription)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            messageId, 
            conversationId, 
            user.userId, 
            type, 
            content, 
            mediaKey || null, 
            mediaMeta ? JSON.stringify(mediaMeta) : null,
            transcription || null
        ).run();

        // Update conversation timestamp
        await c.env.DB.prepare(`
            UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(conversationId).run();

        // Trigger Push Notifications asynchronously
        c.executionCtx.waitUntil((async () => {
            try {
                // EXCEPTION: Pas de push pour le chat avec l'IA (expert_ai)
                // On évite de spammer l'utilisateur quand l'IA "répond" ou qu'un audio est traité
                if (conversationId === 'expert_ai') return;

                // Fetch Base URL (using ConfigService pattern - no hardcoded fallback)
                const baseSetting = await c.env.DB.prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?').bind('app_base_url').first<{setting_value: string}>();
                const baseUrl = baseSetting?.setting_value || 'https://example.com';

                // Get other participants WITH NAMES for personalized push titles
                const { results: participants } = await c.env.DB.prepare(`
                    SELECT 
                        cp.user_id,
                        COALESCE(u.first_name, g.full_name) as recipient_name
                    FROM chat_participants cp
                    LEFT JOIN users u ON cp.user_id = u.id AND cp.user_id > 0
                    LEFT JOIN chat_guests g ON ABS(cp.user_id) = g.id AND cp.user_id < 0
                    WHERE cp.conversation_id = ? AND cp.user_id != ?
                `).bind(conversationId, user.userId).all();

                const senderName = user.first_name || user.email.split('@')[0];
                
                const pushBody = isCall
                    ? "Sonnerie en cours... Appuyez pour répondre"
                    : (type === 'image' ? '📷 Photo envoyée' : content);

                for (const p of participants) {
                    // PERSONNALISATION DU TITRE: "Laurent pour Ali"
                    const recipientName = (p as any).recipient_name || 'Utilisateur';
                    
                    const dynamicTitle = isCall 
                        ? `📞 APPEL DE ${senderName.toUpperCase()}`
                        : `${senderName} pour ${recipientName}`;

                    const payload: any = {
                        title: dynamicTitle,
                        body: pushBody,
                        icon: '/icon-192.png',
                        data: {
                            url: `${baseUrl}/messenger?conversationId=${conversationId}`,
                            conversationId: conversationId,
                            isCall: isCall 
                        }
                    };

                    if (isCall) {
                        payload.actions = [
                            { action: 'open', title: '📞 Répondre' }
                        ];
                    }

                    await sendPushNotification(c.env, (p as any).user_id as number, payload);
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
app.post('/conversations', zValidator('json', createConversationSchema), async (c) => {
    try {
        const user = c.get('user');
        const { type, participant_ids: participantIds, name } = c.req.valid('json');
        
        // Basic Validation (Zod ensures array format)
        if (!participantIds || participantIds.length === 0) {
            return c.json({ error: 'Au moins un participant requis' }, 400);
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
app.put('/conversations/:id', zValidator('param', conversationIdParamSchema), zValidator('json', updateConversationSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId } = c.req.valid('param');
    const { name } = c.req.valid('json');
    const rawBody = await c.req.json().catch(() => ({}));
    const avatar_key = rawBody.avatar_key; // Optional, not in schema

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
app.delete('/conversations/:id/participants/:userId', zValidator('param', userIdParamSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId, userId: targetUserId } = c.req.valid('param');

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



// 12. DELETE /api/v2/chat/conversations/:id - Delete entire conversation (Global Admin only)
app.delete('/conversations/:id', zValidator('param', conversationIdParamSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId } = c.req.valid('param');

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

// 13. DELETE /api/v2/chat/conversations/:id/messages/:messageId - Delete single message
app.delete('/conversations/:id/messages/:messageId', zValidator('param', messageIdParamSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId, messageId } = c.req.valid('param');

    // 1. Get message metadata to verify ownership
    // MODIFICATION: We search by ID only, ignoring conversation_id mismatch to fix "ghost" message deletions
    const message = await c.env.DB.prepare(`
        SELECT sender_id, media_key, conversation_id FROM chat_messages WHERE id = ?
    `).bind(messageId).first();

    if (!message) {
        return c.json({ error: 'Message introuvable' }, 404);
    }

    // 2. Check Permissions: Admin OR Author
    const isAuthor = message.sender_id === user.userId;
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
        return c.json({ error: 'Action non autorisée' }, 403);
    }

    // 3. Soft delete message (keep media for potential recovery)
    // Note: Media is NOT deleted to allow recovery. Use scheduled cleanup for old deleted messages.
    await c.env.DB.prepare(`UPDATE chat_messages SET is_deleted = 1 WHERE id = ?`).bind(messageId).run();

    return c.json({ success: true });
});

// 14. DELETE /api/v2/chat/conversations/:id/messages - Clear all messages (Admin or Group Admin)
app.delete('/conversations/:id/messages', zValidator('param', conversationIdParamSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId } = c.req.valid('param');

    // Check permissions (Global Admin or Group Admin)
    const participant = await c.env.DB.prepare(`
        SELECT role FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    const isGroupAdmin = participant && participant.role === 'admin';
    const isGlobalAdmin = user.role === 'admin';

    if (!isGroupAdmin && !isGlobalAdmin) {
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
        // Delete in batches if necessary, but Promise.all is okay for reasonable amounts
        await Promise.all(keysToDelete.map((key: string) => c.env.MEDIA_BUCKET.delete(key)));
    }

    // 3. Delete messages
    await c.env.DB.prepare(`DELETE FROM chat_messages WHERE conversation_id = ?`).bind(conversationId).run();

    // 4. System message removed (Silent clear per user request)

    return c.json({ success: true });
});

// 15. POST /api/v2/chat/stress-test - Simulate Heavy Load (Admin Only)
app.post('/stress-test', async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403);
    
    const startTime = Date.now();
    const results: any = {};
    const LOG = [];
    
    try {
        // 1. Create Stress Group
        const conversationId = `stress-test-${Date.now()}`;
        const t1 = Date.now();
        await c.env.DB.prepare(`
            INSERT INTO chat_conversations (id, type, name, created_by)
            VALUES (?, 'group', '⚡ STRESS TEST', ?)
        `).bind(conversationId, user.userId).run();
        
        // Add current user
        await c.env.DB.prepare(`
            INSERT INTO chat_participants (conversation_id, user_id, role)
            VALUES (?, ?, 'admin')
        `).bind(conversationId, user.userId).run();
        
        results.create_group_ms = Date.now() - t1;
        LOG.push(`Created group ${conversationId} in ${results.create_group_ms}ms`);

        // 2. Insert 100 Messages (Batch)
        const t2 = Date.now();
        const MESSAGES_COUNT = 100;
        const batchStmts = [];
        
        for (let i = 0; i < MESSAGES_COUNT; i++) {
            const msgId = crypto.randomUUID();
            batchStmts.push(
                c.env.DB.prepare(`
                    INSERT INTO chat_messages (id, conversation_id, sender_id, type, content, created_at)
                    VALUES (?, ?, ?, 'text', ?, datetime('now', '-${MESSAGES_COUNT - i} seconds'))
                `).bind(msgId, conversationId, user.userId, `Message stress test #${i}`)
            );
        }
        
        // D1 Batch Execution (simulate rapid fire)
        // Cloudflare D1 batch limit is typically ~100 statements
        await c.env.DB.batch(batchStmts);
        
        results.insert_100_msgs_ms = Date.now() - t2;
        results.write_throughput_msg_per_sec = Math.round(MESSAGES_COUNT / (results.insert_100_msgs_ms / 1000));
        LOG.push(`Inserted ${MESSAGES_COUNT} messages in ${results.insert_100_msgs_ms}ms (${results.write_throughput_msg_per_sec} msg/s)`);

        // 3. Read History (Simulate 5 users fetching concurrently)
        const t3 = Date.now();
        const READ_ITERATIONS = 5;
        const readPromises = [];
        
        for (let i = 0; i < READ_ITERATIONS; i++) {
            readPromises.push(c.env.DB.prepare(`
                SELECT * FROM chat_messages 
                WHERE conversation_id = ? 
                ORDER BY created_at DESC 
                LIMIT 50
            `).bind(conversationId).all());
        }
        
        await Promise.all(readPromises);
        
        results.read_5x_history_ms = Date.now() - t3;
        results.avg_read_latency_ms = Math.round(results.read_5x_history_ms / READ_ITERATIONS);
        LOG.push(`Read history ${READ_ITERATIONS} times in ${results.read_5x_history_ms}ms (Avg: ${results.avg_read_latency_ms}ms)`);

        // 4. Cleanup
        const t4 = Date.now();
        await c.env.DB.prepare(`DELETE FROM chat_messages WHERE conversation_id = ?`).bind(conversationId).run();
        await c.env.DB.prepare(`DELETE FROM chat_participants WHERE conversation_id = ?`).bind(conversationId).run();
        await c.env.DB.prepare(`DELETE FROM chat_conversations WHERE id = ?`).bind(conversationId).run();
        results.cleanup_ms = Date.now() - t4;

        results.total_time_ms = Date.now() - startTime;
        
        return c.json({
            success: true,
            metrics: results,
            log: LOG,
            status: results.avg_read_latency_ms < 200 ? '✅ EXCELLENT' : (results.avg_read_latency_ms < 500 ? '🟡 ACCEPTABLE' : '🔴 SLOW')
        });

    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

// 16. PUT /api/v2/chat/conversations/:id/messages/:messageId/transcription - Update transcription
app.put('/conversations/:id/messages/:messageId/transcription', zValidator('param', messageIdParamSchema), zValidator('json', updateTranscriptionSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId, messageId } = c.req.valid('param');
    const { transcription } = c.req.valid('json');

    // 1. Get message metadata to verify ownership
    const message = await c.env.DB.prepare(`
        SELECT sender_id FROM chat_messages WHERE id = ? AND conversation_id = ?
    `).bind(messageId, conversationId).first();

    if (!message) {
        return c.json({ error: 'Message introuvable' }, 404);
    }

    // 2. Check Permissions: Author only (or Admin)
    const isAuthor = message.sender_id === user.userId;
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
        return c.json({ error: 'Action non autorisée' }, 403);
    }

    // 3. Update DB
    await c.env.DB.prepare(`
        UPDATE chat_messages 
        SET transcription = ? 
        WHERE id = ?
    `).bind(transcription, messageId).run();

    return c.json({ success: true });
});

// 17. POST /api/v2/chat/conversations/:id/messages/:messageId/card
app.post('/conversations/:id/messages/:messageId/card', zValidator('param', messageIdParamSchema), async (c) => {
    const user = c.get('user');
    const { id: conversationId, messageId } = c.req.valid('param');
    const { assignee_id, priority = 'normal' } = await c.req.json();

    // Check participation
    const isParticipant = await c.env.DB.prepare(`
        SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    if (!isParticipant) return c.json({ error: 'Access denied' }, 403);

    // Check if card already exists
    const exists = await c.env.DB.prepare(`SELECT 1 FROM chat_action_cards WHERE message_id = ?`).bind(messageId).first();
    if (exists) return c.json({ error: 'Une carte existe déjà pour ce message' }, 409);

    const cardId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
        INSERT INTO chat_action_cards (id, message_id, conversation_id, status, priority, created_by, assignee_id)
        VALUES (?, ?, ?, 'open', ?, ?, ?)
    `).bind(cardId, messageId, conversationId, priority, user.userId, assignee_id || null).run();

    return c.json({ success: true, cardId });
});

// 18. PATCH /api/v2/chat/conversations/:id/messages/:messageId/card/status
app.patch('/conversations/:id/messages/:messageId/card/status', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('id');
    const messageId = c.req.param('messageId');
    const { status } = await c.req.json();

    if (!['open', 'in_progress', 'resolved', 'cancelled'].includes(status)) {
        return c.json({ error: 'Statut invalide' }, 400);
    }

    // Check participation
    const isParticipant = await c.env.DB.prepare(`
        SELECT 1 FROM chat_participants WHERE conversation_id = ? AND user_id = ?
    `).bind(conversationId, user.userId).first();

    if (!isParticipant) return c.json({ error: 'Access denied' }, 403);

    // Update
    const res = await c.env.DB.prepare(`
        UPDATE chat_action_cards 
        SET status = ?, updated_at = CURRENT_TIMESTAMP, resolved_at = ?
        WHERE message_id = ? AND conversation_id = ?
    `).bind(
        status, 
        status === 'resolved' ? new Date().toISOString() : null,
        messageId, 
        conversationId
    ).run();

    if (res.meta.changes === 0) {
        return c.json({ error: 'Carte introuvable ou déjà à jour' }, 404);
    }

    return c.json({ success: true });
});

export default app;
