// Routes pour la gestion des médias (upload vers R2)

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';

const media = new Hono<{ Bindings: Bindings }>();

// Configuration de sécurité pour les uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Formater la taille de fichier pour les messages d'erreur
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// POST /api/media/upload - Upload un fichier vers R2 (protégé)
media.post('/upload', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const formData = await c.req.formData();
    
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticket_id') as string;
    
    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }
    
    if (!ticketId) {
      return c.json({ error: 'ID du ticket requis' }, 400);
    }
    
    // 🔒 VALIDATION DE SÉCURITÉ: Taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ 
        error: `Fichier trop volumineux. Taille: ${formatFileSize(file.size)}, Maximum autorisé: ${formatFileSize(MAX_FILE_SIZE)}` 
      }, 400);
    }
    
    // 🔒 VALIDATION DE SÉCURITÉ: Type MIME du fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ 
        error: `Type de fichier non autorisé: ${file.type}. Types acceptés: images (JPEG, PNG, WebP, GIF) et vidéos (MP4, WebM, QuickTime)` 
      }, 400);
    }
    
    // Vérifier que le ticket existe
    const ticket = await c.env.DB.prepare(
      'SELECT id FROM tickets WHERE id = ?'
    ).bind(ticketId).first();
    
    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }
    
    // Générer une clé unique pour le fichier
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileKey = `tickets/${ticketId}/${timestamp}-${randomStr}-${file.name}`;
    
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
    `).bind(ticketId, fileKey, file.name, file.type, file.size, url, user.userId).run();
    
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

// GET /api/media/:id - Récupérer un fichier depuis R2 (PUBLIC pour charger les images)
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
media.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    
    // Récupérer les infos du média
    const mediaInfo = await c.env.DB.prepare(
      'SELECT * FROM media WHERE id = ?'
    ).bind(id).first() as any;
    
    if (!mediaInfo) {
      return c.json({ error: 'Média non trouvé' }, 404);
    }
    
    // Supprimer de R2
    await c.env.MEDIA_BUCKET.delete(mediaInfo.file_key);
    
    // Supprimer de la base de données
    await c.env.DB.prepare(
      'DELETE FROM media WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: 'Média supprimé avec succès' });
  } catch (error) {
    console.error('Delete media error:', error);
    return c.json({ error: 'Erreur lors de la suppression du média' }, 500);
  }
});

// GET /api/media/ticket/:ticketId - Liste les médias d'un ticket (protégé)
media.get('/ticket/:ticketId', authMiddleware, async (c) => {
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

export default media;
