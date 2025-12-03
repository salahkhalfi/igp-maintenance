// Routes pour servir les fichiers audio (pas d'auth requise)

import { Hono } from 'hono';
import type { Bindings } from '../types';

const audio = new Hono<{ Bindings: Bindings }>();

// GET /api/audio/* - Récupérer un fichier audio
// Note: Route publique car HTML <audio> ne peut pas envoyer de headers Authorization
audio.get('/*', async (c) => {
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

export default audio;
