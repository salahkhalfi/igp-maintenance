/**
 * Système de Gestion de Maintenance - MaintenanceOS
 *
 * @author Salah Khalfi
 * @organization MaintenanceOS
 * @department Département des Technologies de l'Information
 * @description Application de gestion de maintenance pour équipements industriels
 * @version 2.0.0 - Refactored Architecture
 *
 * ARCHITECTURE MODULAIRE:
 * =======================
 * Routes modulaires (src/routes/):
 *   - auth.ts: Authentification (login, register, logout)
 *   - rbac.ts: Test et vérification des permissions RBAC
 *   - tickets.ts: Gestion complète des tickets
 *   - machines.ts: Gestion des machines et interventions
 *   - users.ts: Gestion des utilisateurs
 *   - technicians.ts: Routes spécifiques techniciens et équipes
 *   - roles.ts: Gestion des rôles et permissions
 *   - settings.ts: Paramètres système
 *   - media.ts: Upload et gestion des médias
 *   - comments.ts: Commentaires sur tickets
 *   - webhooks.ts: Webhooks externes
 *   - push.ts: Notifications push
 *
 * Routes inline (dans ce fichier):
 *   - Messagerie (/api/messages/*) - Système de messagerie audio/texte
 *   - Alertes (/api/alerts/*) - Alertes tickets en retard
 *   - CRON (/api/cron/*) - Tâches planifiées
 *   - Frontend (/, /guide, /changelog, /test) - Pages HTML
 *   - Admin HTML (/admin/roles) - Interface admin
 *
 * Middleware (src/middlewares/):
 *   - auth.ts: authMiddleware, adminOnly, requirePermission, etc.
 *
 * Utilitaires (src/utils/):
 *   - password.ts: Hashing PBKDF2
 *   - jwt.ts: Génération et validation JWT
 *   - permissions.ts: Système RBAC
 *   - validation.ts: Validation des données
 *   - formatters.ts: Formatage des données
 *   - ticket-id.ts: Génération des IDs de tickets
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { authMiddleware, adminOnly, internalUserOnly, technicianOrAdmin, technicianSupervisorOrAdmin, requirePermission, requireAnyPermission } from './middlewares/auth';
import { hasPermission, getRolePermissions } from './utils/permissions';
import { adminRolesHTML } from './views/admin-roles';
import { adminAiSettingsHTML } from './views/admin-ai-settings';
import { guideHTML } from './views/guide';
import { changelogHTML } from './views/changelog';
import { homeHTML } from './views/home';
import { historiqueHTML } from './views/historique';
import { tvHTML } from './views/tv';
import { tvAdminHTML } from './views/tv-admin';
import auth from './routes/auth';
import tickets from './routes/tickets';
import machines from './routes/machines';
import media from './routes/media';
import comments from './routes/comments';
import search from './routes/search';
import users from './routes/users';
import roles from './routes/roles';
import settings from './routes/settings';
import preferences from './routes/preferences';
import webhooks from './routes/webhooks';
import push from './routes/push';
import rbac from './routes/rbac';
import technicians from './routes/technicians';
import messages from './routes/messages';
import audio from './routes/audio';
import cron from './routes/cron';
import alerts from './routes/alerts';
import planning from './routes/planning';
import chat from './routes/chat';
import ai from './routes/ai';
import tv from './routes/tv';
import stats from './routes/stats';
import scheduledHandler from './scheduled';
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
  'https://app.igpglass.ca',           // Domaine personnalisé de production
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
        // Permissive mode - origin allowed
      }
    }

    return origin || '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // Permet l'envoi de cookies/credentials
}));

/**
 * 🛡️ SAFE SECURITY HEADERS
 * 
 * Headers qui NE cassent PAS GenSpark browser:
 * - X-Frame-Options: Protection clickjacking
 * - X-Content-Type-Options: Anti MIME sniffing
 * - Referrer-Policy: Contrôle Referer header
 * 
 * Headers ÉVITÉS (incompatibles GenSpark):
 * - Content-Security-Policy (casse CDN)
 * - Permissions-Policy (casse APIs browser)
 * - X-XSS-Protection (legacy, obsolète)
 */
app.use('*', async (c, next) => {
  await next();
  
  // Protection clickjacking - empêche iframe malveillant
  c.header('X-Frame-Options', 'DENY');
  
  // Protection MIME sniffing - force respect Content-Type
  c.header('X-Content-Type-Options', 'nosniff');
  
  // Contrôle Referer - protège privacy utilisateur
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});


app.use('/api/auth/me', authMiddleware);

// ========================================
// ROUTES API MODULAIRES
// ========================================

// Routes d'authentification
app.route('/api/auth', auth);

// Routes RBAC - Test et vérification des permissions
app.route('/api/rbac', rbac);

// API de gestion des rôles (admin uniquement)
app.use('/api/roles/*', authMiddleware, adminOnly);
app.route('/api/roles', roles);


app.use('/api/tickets/*', authMiddleware, internalUserOnly);
app.route('/api/tickets', tickets);


// Routes des machines
app.use('/api/machines/*', authMiddleware, internalUserOnly);
app.route('/api/machines', machines);

// Routes des techniciens et équipes
app.route('/api/technicians', technicians);

// Routes des utilisateurs
app.use('/api/users/*', authMiddleware, internalUserOnly);
app.route('/api/users', users);

app.route('/api/media', media);

app.route('/api/comments', comments);

app.use('/api/search/*', authMiddleware, internalUserOnly);
app.route('/api/search', search);

// Routes des statistiques (Active tickets, Performance)
app.use('/api/stats/*', authMiddleware);
app.route('/api/stats', stats);

// Routes des paramètres système
// NOTE: Pas d'authMiddleware global ici car chaque route gère sa propre auth
app.route('/api/settings', settings);

// Routes des préférences utilisateur
app.route('/api/preferences', preferences);

// Routes des webhooks pour notifications
app.use('/api/webhooks/*', authMiddleware, internalUserOnly);
app.route('/api/webhooks', webhooks);

// Routes des push notifications PWA
// IMPORTANT: VAPID public key DOIT être accessible sans auth (frontend en a besoin avant login)
app.get('/api/push/vapid-public-key', async (c) => {
  try {
    const publicKey = c.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return c.json({ error: 'Clé VAPID non configurée' }, 500);
    }
    return c.json({ publicKey });
  } catch (error) {
    console.error('❌ VAPID key error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});
// Appliquer auth middleware aux routes push (sauf send-test-to-salah)
app.use('/api/push/subscribe', authMiddleware);
app.use('/api/push/unsubscribe', authMiddleware);
app.use('/api/push/test', authMiddleware);
app.use('/api/push/verify-subscription', authMiddleware);
app.use('/api/push/vapid-public-key', authMiddleware);

// Enregistrer les routes push (send-test-to-salah sera accessible sans auth)
app.route('/api/push', push);

// Routes de la messagerie (messages publics/privés, audio)
app.route('/api/messages', messages);

// Routes audio (publiques - pour HTML <audio> tags)
app.route('/api/audio', audio);

// Routes CRON - Tâches planifiées (sécurisées par CRON_SECRET)
app.route('/api/cron', cron);

// Route de Maintenance Manuelle (Pseudo-Cron)
// Permet de déclencher le nettoyage sans CRON Cloudflare
app.post('/api/maintenance/force-cleanup', authMiddleware, adminOnly, async (c) => {
    try {
        console.log('🧹 Maintenance manuelle déclenchée par Admin');
        
        // Mock d'un ScheduledController
        const mockController = {
            cron: 'manual',
            scheduledTime: Date.now(),
            noRetry: () => {}
        } as any;

        // Exécuter la logique planifiée
        await scheduledHandler.scheduled(mockController, c.env, c.executionCtx);

        return c.json({ success: true, message: 'Maintenance exécutée avec succès' });
    } catch (e) {
        console.error('Erreur maintenance manuelle:', e);
        return c.json({ success: false, error: String(e) }, 500);
    }
});

// Routes Alerts - Alertes tickets en retard (authentifiées)
app.route('/api/alerts', alerts);

// Routes Planning - Gestion du planning de production
app.route('/api/planning', planning);

// Routes Messenger (V2) - Indépendantes
app.route('/api/v2/chat', chat);

// Routes AI (Analyses intelligentes)
app.use('/api/ai/*', authMiddleware);
app.route('/api/ai', ai);

// Routes TV - Affichage passif sécurisé par clé (Chromecast/TV)
app.route('/api/tv', tv);

// Servir la nouvelle app Messenger (Compilée par Vite)
// Version SPA avec contenu HTML injecté via ASSETS pour éviter les erreurs 500
app.get('/messenger/*', async (c) => {
  // Try to serve static asset first if it has extension
  if (c.req.path.includes('.')) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  // Otherwise serve index.html for SPA routing with NO CACHE
  const response = await c.env.ASSETS.fetch(new URL('/messenger/index.html', c.req.url));
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  newResponse.headers.set('Pragma', 'no-cache');
  newResponse.headers.set('Expires', '0');
  return newResponse;
});
app.get('/messenger', async (c) => {
  const response = await c.env.ASSETS.fetch(new URL('/messenger/index.html', c.req.url));
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  newResponse.headers.set('Pragma', 'no-cache');
  newResponse.headers.set('Expires', '0');
  return newResponse;
});

// Servir la vue TV via Hono pour éviter les 404 statiques
app.get('/tv.html', (c) => c.html(tvHTML));
app.get('/tv', (c) => c.html(tvHTML)); // Alias pour flexibilité

// Page d'administration TV (accessible sans auth serveur, auth gérée par JS)
app.get('/admin/tv', (c) => c.html(tvAdminHTML));

// Page d'administration des rôles (accessible sans auth serveur, auth gérée par JS)
app.get('/admin/roles', async (c) => {
  // Servir la page telle quelle - l'authentification sera vérifiée par le JS client
  // qui redirigera vers / si pas de token dans localStorage
  return c.html(adminRolesHTML);
});

// Page d'administration du Cerveau IA (accessible sans auth serveur, auth gérée par JS)
app.get('/admin/ai-settings', async (c) => {
  return c.html(adminAiSettingsHTML);
});

// Servir les fichiers statiques du dossier static/
app.use('/static/*', serveStatic({ root: './' }));

// Servir les fichiers HTML statiques à la racine (guide.html, etc.)
app.use('/*.html', serveStatic({ root: './' }));

app.get("/", (c) => {
  return c.html(homeHTML);
});



// Route du guide utilisateur
app.get('/guide', (c) => {
  return c.html(guideHTML);
});

// Route historique (redirection vers changelog)
app.get('/historique', (c) => {
  return c.redirect('/changelog');
});

// Route Changelog
app.get("/changelog", (c) => {
  return c.html(changelogHTML);
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

        // Enregistrer le Service Worker pour PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        // Service Worker enregistré
                    })
                    .catch(error => {
                        // Erreur silencieuse
                    });
            });
        }
    </script>
    <script src="/push-notifications.js"></script>
</body>
</html>
  `);
});

// ========================================
// STATS API - Simple active tickets count
// ========================================
// REPLACED BY src/routes/stats.ts
// Logic moved to src/routes/stats.ts

// ========================================
// STATS API - Technicians Performance
// ========================================
// REPLACED BY src/routes/stats.ts
// Logic moved to src/routes/stats.ts

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0-beta.4'
  });
});

// ========================================
// EXPORTS - Cloudflare Pages/Workers
// ========================================

// Export principal: Application Hono
export default app;

// Export du scheduled handler pour Cloudflare Workers CRON Triggers
// Ce handler s'exécute automatiquement selon le schedule dans wrangler.jsonc
// Schedule: "0 2 * * *" = Quotidien à 2h du matin UTC
// Tâches:
//   1. Cleanup subscriptions push inactives >30 jours
//   2. Vérification tickets expirés (scheduled_date dépassée)
export const scheduled = scheduledHandler.scheduled;
