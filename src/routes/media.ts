// Routes pour la gestion des médias (upload vers R2)

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware, internalUserOnly } from '../middlewares/auth';
import { LIMITS, validateFileUpload } from '../utils/validation';

const media = new Hono<{ Bindings: Bindings }>();

// Configuration de sécurité pour les uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/m4a', 'audio/x-aac'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES];

/**
 * Formater la taille de fichier pour les messages d'erreur
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// POST /api/media/upload - Upload un fichier vers R2 (protégé)
media.post('/upload', authMiddleware, internalUserOnly, async (c) => {
  try {
    const user = c.get('user') as any;
    const formData = await c.req.formData();

    const file = formData.get('file') as File;
    const ticketId = formData.get('ticket_id') as string;

    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }

    // Validation de l'ID du ticket
    if (!ticketId) {
      return c.json({ error: 'ID du ticket requis' }, 400);
    }
    const ticketIdNum = parseInt(ticketId);
    if (isNaN(ticketIdNum) || ticketIdNum <= 0) {
      return c.json({ error: 'ID de ticket invalide' }, 400);
    }

    // 🔒 VALIDATION DE SÉCURITÉ: Utiliser la fonction de validation centralisée
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.valid) {
      return c.json({ error: fileValidation.error }, 400);
    }

    // Validation supplémentaire du nom de fichier
    if (file.name.length > 255) {
      return c.json({ error: 'Nom de fichier trop long (max 255 caractères)' }, 400);
    }

    // Vérifier que le ticket existe
    const ticket = await c.env.DB.prepare(
      'SELECT id FROM tickets WHERE id = ?'
    ).bind(ticketIdNum).first();

    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }

    // Générer une clé unique pour le fichier (nettoyer le nom de fichier)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `tickets/${ticketIdNum}/${timestamp}-${randomStr}-${sanitizedFileName}`;

    // Upload vers R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Générer l'URL publique (à adapter selon votre configuration R2)
    const url = `https://maintenance-media.your-account.r2.cloudflarestorage.com/${fileKey}`;

    // Enregistrer dans la base de données
    const result = await c.env.DB.prepare(`
      INSERT INTO media (ticket_id, file_key, file_name, file_type, file_size, url, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(ticketIdNum, fileKey, sanitizedFileName, file.type, file.size, url, user.userId).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de l\'enregistrement du média' }, 500);
    }

    // Récupérer le média créé
    const newMedia = await c.env.DB.prepare(
      'SELECT * FROM media WHERE file_key = ?'
    ).bind(fileKey).first();

    return c.json({ media: newMedia }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Erreur lors de l\'upload du fichier' }, 500);
  }
});

// POST /api/media/broadcast/upload - Upload un fichier pour la diffusion TV (Admin/Supervisor/Planner/Coordinator)
media.post('/broadcast/upload', authMiddleware, async (c) => {
    try {
        const user = c.get('user') as any;
        
        // Vérification permissions étendue (Admin, Supervisor, Planner, Coordinator)
        const allowedRoles = ['admin', 'supervisor', 'planner', 'coordinator'];
        if (!allowedRoles.includes(user.role)) {
            return c.json({ error: 'Permission refusée' }, 403);
        }

        const formData = await c.req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return c.json({ error: 'Aucun fichier fourni' }, 400);
        }

        // Validation basique
        if (file.size > 10 * 1024 * 1024) { // 10MB
            console.error(`[Upload] Fichier trop gros: ${file.size} bytes`);
            return c.json({ error: 'Fichier trop volumineux (max 10MB)' }, 400);
        }

        if (!file.type.startsWith('image/')) {
            console.error(`[Upload] Type invalide: ${file.type}`);
            return c.json({ error: 'Seules les images sont autorisées' }, 400);
        }

        // Générer clé R2
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `broadcast/${timestamp}-${randomStr}-${sanitizedFileName}`;

        // Upload vers R2
        const arrayBuffer = await file.arrayBuffer();
        await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // URL publique via Query Param (Plus robuste que path encoded)
        const publicUrl = `/api/media/public?key=${encodeURIComponent(fileKey)}`;

        return c.json({ 
            success: true,
            url: publicUrl,
            file_key: fileKey
        });

    } catch (error) {
        console.error('Broadcast upload error:', error);
        return c.json({ error: 'Erreur upload broadcast: ' + String(error) }, 500);
    }
});

// GET /api/media/public - Servir un fichier R2 via sa clé (Query Param)
// Route plus sûre pour éviter les problèmes d'encodage de slashes dans l'URL
media.get('/public', async (c) => {
    try {
        const key = c.req.query('key');
        
        if (!key) {
            return c.text('Clé manquante', 400);
        }
        
        const object = await c.env.MEDIA_BUCKET.get(key);
        if (!object) {
            return c.text('Fichier non trouvé', 404);
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000'); 

        return new Response(object.body, {
            headers,
        });
    } catch (e) {
        console.error('Media public fetch error:', e);
        return c.text('Erreur serveur', 500);
    }
});

// Legacy route support (redirect or handle) - Wildcard to capture full path including slashes
media.get('/public/*', async (c) => {
    try {
        const path = c.req.path;
        // Prefix length to strip: /api/media/public/
        // Assuming this router is mounted at /api/media
        // The path inside this handler might be /public/... or full path depending on Hono setup.
        // Let's assume absolute path for safety check.
        
        // Find "public/" segment
        const marker = '/public/';
        const idx = path.indexOf(marker);
        
        if (idx === -1) {
            // Check query param case just in case this handler caught it (unlikely if order preserved)
            const queryKey = c.req.query('key');
            if (queryKey) {
                 const object = await c.env.MEDIA_BUCKET.get(queryKey);
                 if (!object) return c.text('Fichier non trouvé', 404);
                 const headers = new Headers();
                 object.writeHttpMetadata(headers);
                 headers.set('Cache-Control', 'public, max-age=31536000');
                 return new Response(object.body, { headers });
            }
            return c.text('Invalid path', 400);
        }
        
        const rawKey = path.substring(idx + marker.length);
        const fileKey = decodeURIComponent(rawKey);
        
        const object = await c.env.MEDIA_BUCKET.get(fileKey);
        if (!object) return c.text('Not found', 404);
        
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=31536000');
        return new Response(object.body, { headers });
    } catch (e) {
        return c.text('Error', 500);
    }
});

// GET /api/media/ticket/:ticketId - Liste les médias d'un ticket (protégé)
media.get('/ticket/:ticketId', authMiddleware, internalUserOnly, async (c) => {
  try {
    const ticketId = c.req.param('ticketId');

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM media WHERE ticket_id = ? ORDER BY created_at DESC'
    ).bind(ticketId).all();

    return c.json({ media: results });
  } catch (error) {
    console.error('Get ticket media error:', error);
    return c.json({ error: 'Erreur lors de la récupération des médias' }, 500);
  }
});

// GET /api/media/:id - Récupérer un fichier depuis R2 (PUBLIC pour charger les images)
// MOVED TO BOTTOM: This acts as a catch-all for ID-based lookups
media.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Récupérer les infos du média
    const mediaInfo = await c.env.DB.prepare(
      'SELECT * FROM media WHERE id = ?'
    ).bind(id).first() as any;

    if (!mediaInfo) {
      return c.json({ error: 'Média non trouvé' }, 404);
    }

    // Récupérer le fichier depuis R2
    const object = await c.env.MEDIA_BUCKET.get(mediaInfo.file_key);

    if (!object) {
      return c.json({ error: 'Fichier non trouvé dans le stockage' }, 404);
    }

    // Retourner le fichier
    return new Response(object.body, {
      headers: {
        'Content-Type': mediaInfo.file_type,
        'Content-Disposition': `inline; filename="${mediaInfo.file_name}"`,
      },
    });
  } catch (error) {
    console.error('Get media error:', error);
    return c.json({ error: 'Erreur lors de la récupération du fichier' }, 500);
  }
});

// DELETE /api/media/:id - Supprimer un fichier (protégé)
media.delete('/:id', authMiddleware, internalUserOnly, async (c) => {
  try {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    // Récupérer les infos du média avec le créateur du ticket
    const mediaInfo = await c.env.DB.prepare(`
      SELECT m.*, t.reported_by as ticket_creator
      FROM media m
      LEFT JOIN tickets t ON m.ticket_id = t.id
      WHERE m.id = ?
    `).bind(id).first() as any;

    if (!mediaInfo) {
      return c.json({ error: 'Media non trouve' }, 404);
    }

    // Vérification des permissions:
    // - Admin: peut tout supprimer
    // - Supervisor: peut tout supprimer
    // - Technician: peut tout supprimer
    // - Operator: peut supprimer uniquement les médias de ses propres tickets
    const canDelete =
      user.role === 'admin' ||
      user.role === 'supervisor' ||
      user.role === 'technician' ||
      (user.role === 'operator' && mediaInfo.ticket_creator === user.userId);

    if (!canDelete) {
      return c.json({ error: 'Vous n avez pas la permission de supprimer ce media' }, 403);
    }

    // Supprimer de R2
    try {
      await c.env.MEDIA_BUCKET.delete(mediaInfo.file_key);
      console.log(`Media supprime du R2: ${mediaInfo.file_key}`);
    } catch (deleteError) {
      console.error(`Erreur suppression R2 ${mediaInfo.file_key}:`, deleteError);
      // Continue pour supprimer de la base de donnees
    }

    // Supprimer de la base de données
    await c.env.DB.prepare(
      'DELETE FROM media WHERE id = ?'
    ).bind(id).run();

    // Suppression en cascade : Supprimer le commentaire associé si c'est un message vocal
    if (mediaInfo.file_type.startsWith('audio/')) {
      try {
        // Chercher les commentaires contenant ce tag audio
        const tag = `[audio:${id}]`;
        await c.env.DB.prepare(
          'DELETE FROM comments WHERE ticket_id = ? AND comment LIKE ?'
        ).bind(mediaInfo.ticket_id, `%${tag}%`).run();
        console.log(`Commentaire audio associé supprimé pour media ${id}`);
      } catch (commentError) {
        console.error('Erreur lors de la suppression du commentaire audio associé', commentError);
      }
    }

    return c.json({
      message: 'Media supprime avec succes',
      fileDeleted: true
    });
  } catch (error) {
    console.error('Delete media error:', error);
    return c.json({ error: 'Erreur lors de la suppression du media' }, 500);
  }
});

export default media;
