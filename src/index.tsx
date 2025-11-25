/**
 * Système de Gestion de Maintenance - IGP Glass
 *
 * @author Salah Khalfi
 * @organization Produits Verriers International (IGP) Inc.
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
import { authMiddleware, adminOnly, technicianOrAdmin, technicianSupervisorOrAdmin, requirePermission, requireAnyPermission } from './middlewares/auth';
import { hasPermission, getRolePermissions } from './utils/permissions';
import { adminRolesHTML } from './views/admin-roles';
import { guideHTML } from './views/guide';
import { historiqueHTML } from './views/historique';
import auth from './routes/auth';
import tickets from './routes/tickets';
import machines from './routes/machines';
import media from './routes/media';
import comments from './routes/comments';
import search from './routes/search';
import users from './routes/users';
import roles from './routes/roles';
import settings from './routes/settings';
import webhooks from './routes/webhooks';
import push from './routes/push';
import rbac from './routes/rbac';
import technicians from './routes/technicians';
import messages from './routes/messages';
import audio from './routes/audio';
import cron from './routes/cron';
import alerts from './routes/alerts';
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


app.use('/api/tickets/*', authMiddleware);
app.route('/api/tickets', tickets);


// Routes des machines
app.use('/api/machines/*', authMiddleware);
app.route('/api/machines', machines);

// Routes des techniciens et équipes
app.route('/api/technicians', technicians);

// Routes des utilisateurs
app.use('/api/users/*', authMiddleware);
app.route('/api/users', users);

app.route('/api/media', media);

app.route('/api/comments', comments);

app.use('/api/search/*', authMiddleware);
app.route('/api/search', search);

// Routes des paramètres système
// NOTE: Pas d'authMiddleware global ici car chaque route gère sa propre auth:
// - GET /logo : public (pour afficher le logo)
// - GET /:key : public (pour timezone_offset_hours)
// - POST /upload-logo : authMiddleware + super admin check
// - DELETE /logo : authMiddleware + super admin check
// - PUT /:key : adminOnly middleware
app.route('/api/settings', settings);

// Routes des webhooks pour notifications
app.use('/api/webhooks/*', authMiddleware);
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

// Routes Alerts - Alertes tickets en retard (authentifiées)
app.route('/api/alerts', alerts);

// Page d'administration des rôles (accessible sans auth serveur, auth gérée par JS)
app.get('/admin/roles', async (c) => {
  // Servir la page telle quelle - l'authentification sera vérifiée par le JS client
  // qui redirigera vers / si pas de token dans localStorage
  return c.html(adminRolesHTML);
});

// Servir les fichiers statiques du dossier static/
app.use('/static/*', serveStatic({ root: './' }));

// Servir les fichiers HTML statiques à la racine (guide.html, etc.)
app.use('/*.html', serveStatic({ root: './' }));

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGP - Système de Gestion de Maintenance</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#003B73">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Maintenance IGP">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
    <style>
        /* Background avec photo d'atelier IGP pour toutes les pages */
        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }

        .kanban-column {
            min-height: 400px;
            min-width: 260px;
            background: rgba(255, 255, 255, 0.50);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }

        .kanban-column:hover {
            background: rgba(255, 255, 255, 0.60);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.22);
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
                6px 6px 16px rgba(71, 85, 105, 0.30),
                -3px -3px 10px rgba(255, 255, 255, 0.9),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                0 2px 8px rgba(0, 0, 0, 0.15);
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            border: 1px solid rgba(203, 213, 225, 0.6);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-left: 1px solid rgba(255, 255, 255, 0.5);
            position: relative;
        }

        .ticket-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg,
                transparent,
                rgba(255, 255, 255, 0.9) 20%,
                rgba(255, 255, 255, 0.9) 80%,
                transparent
            );
            border-radius: 10px 10px 0 0;
        }

        .ticket-card::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 10px;
            padding: 1px;
            background: linear-gradient(145deg,
                rgba(255, 255, 255, 0.4),
                rgba(255, 255, 255, 0.1) 30%,
                transparent 50%,
                rgba(71, 85, 105, 0.1)
            );
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }

        .ticket-card:hover {
            box-shadow:
                8px 8px 24px rgba(71, 85, 105, 0.35),
                -4px -4px 14px rgba(255, 255, 255, 1),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                0 4px 12px rgba(0, 0, 0, 0.20);
            transform: translateY(-3px) translateZ(10px);
        }
        .ticket-card:active {
            cursor: grabbing;
            box-shadow:
                4px 4px 10px rgba(71, 85, 105, 0.35),
                -2px -2px 8px rgba(255, 255, 255, 0.8),
                0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .ticket-card.dragging {
            opacity: 0.7;
            cursor: grabbing;
            transform: rotate(3deg) scale(1.05);
            box-shadow:
                12px 12px 32px rgba(71, 85, 105, 0.40),
                -6px -6px 18px rgba(255, 255, 255, 0.7),
                0 6px 16px rgba(0, 0, 0, 0.25);
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
            z-index: 10000;
            min-width: 200px;
            padding: 8px 0;
            max-height: calc(100vh - 20px);
            overflow-y: auto;
            overflow-x: hidden;
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

        /* Titres de colonnes plus visibles */
        .kanban-column-header h3 {
            font-weight: 800;
            font-size: 16px;
            color: #1f2937;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .kanban-column-header span {
            font-weight: 700;
            font-size: 14px;
            color: #1f2937;
        }

        .ticket-card {
            color: #1f2937;
        }


        /* Header principal avec meilleure visibilit\u00e9 */
        @media (max-width: 640px) {
            /* Keep empty for structure */
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
<body>
    <div id="root">
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <svg style="width: 80px; height: 80px; margin: 0 auto 20px; animation: spin 1s linear infinite;" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#667eea" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round"/>
                </svg>
                <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">Chargement de l'application</h2>
                <p style="color: #666; font-size: 14px;">Veuillez patienter...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </div>

    <script>
        const API_URL = '/api';
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;

        // Variables globales pour titre et sous-titre personnalisés
        let companyTitle = 'Gestion de la maintenance et des réparations';
        let companySubtitle = 'Les Produits Verriers International (IGP) Inc.';

        // ✅ Configure axios to send cookies with every request (for HttpOnly auth_token)
        axios.defaults.withCredentials = true;

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

        // ============================================================================
        // NOUVELLES FONCTIONS UTILITAIRES: Conversion datetime-local ↔ UTC ↔ SQL
        // ============================================================================

        /**
         * Convertir datetime-local (format: "2025-11-15T14:30") vers UTC SQL
         * @param {string} localDateTime - Format: "YYYY-MM-DDTHH:MM" (heure locale saisie)
         * @returns {string} Format SQL: "YYYY-MM-DD HH:MM:SS" (en UTC)
         *
         * Exemple avec offset -5 (EST):
         * Input:  "2025-11-15T14:30" (14h30 locale)
         * Output: "2025-11-15 19:30:00" (19h30 UTC)
         */
        const localDateTimeToUTC = (localDateTime) => {
            if (!localDateTime) return null;

            // localDateTime = "2025-11-15T14:30"
            // IMPORTANT: Parser manuellement pour éviter interprétation du fuseau navigateur
            const parts = localDateTime.split('T');
            const dateParts = parts[0].split('-');
            const timeParts = parts[1].split(':');

            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Mois commence à 0
            const day = parseInt(dateParts[2]);
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);

            // Créer une date UTC avec ces valeurs (sans interprétation timezone)
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');

            // Calculer l'heure UTC en soustrayant l'offset
            // offset = -5 signifie "UTC-5", donc pour convertir local → UTC: UTC = local - offset
            // Exemple: 14:30 local avec offset -5 → UTC = 14:30 - (-5) = 14:30 + 5 = 19:30
            const utcHours = hours - offset;

            // Créer la date UTC directement
            const utcDate = new Date(Date.UTC(year, month, day, utcHours, minutes, 0));

            // Format SQL: YYYY-MM-DD HH:MM:SS
            const utcYear = utcDate.getUTCFullYear();
            const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
            const utcDay = String(utcDate.getUTCDate()).padStart(2, '0');
            const utcHoursStr = String(utcDate.getUTCHours()).padStart(2, '0');
            const utcMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
            const seconds = '00';

            return utcYear + '-' + utcMonth + '-' + utcDay + ' ' + utcHoursStr + ':' + utcMinutes + ':' + seconds;
        };

        /**
         * Convertir UTC SQL vers datetime-local (format: "2025-11-15T14:30")
         * @param {string} sqlDateTime - Format: "YYYY-MM-DD HH:MM:SS" (en UTC)
         * @returns {string} Format datetime-local: "YYYY-MM-DDTHH:MM" (heure locale)
         *
         * Exemple avec offset -5 (EST):
         * Input:  "2025-11-15 19:30:00" (19h30 UTC)
         * Output: "2025-11-15T14:30" (14h30 locale)
         */
        const utcToLocalDateTime = (sqlDateTime) => {
            if (!sqlDateTime || sqlDateTime === 'null' || sqlDateTime === '') return '';

            // sqlDateTime = "2025-11-15 19:30:00" (UTC)
            const utcDateStr = sqlDateTime.replace(' ', 'T') + 'Z'; // "2025-11-15T19:30:00Z"
            const utcDate = new Date(utcDateStr);

            // Appliquer l'offset pour obtenir l'heure locale
            // offset = -5 signifie "UTC-5", donc pour convertir UTC → local: local = UTC + offset
            // Exemple: 19:30 UTC avec offset -5 → local = 19:30 + (-5) = 14:30
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const localDate = new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));

            // Format datetime-local: YYYY-MM-DDTHH:MM (utiliser UTC methods car on a déjà appliqué l'offset)
            const year = localDate.getUTCFullYear();
            const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(localDate.getUTCDate()).padStart(2, '0');
            const hours = String(localDate.getUTCHours()).padStart(2, '0');
            const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');

            return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        };

        /**
         * Convertir une date SQL UTC vers un objet Date JavaScript
         * @param {string} sqlDateTime - Format: "YYYY-MM-DD HH:MM:SS" (UTC dans la DB)
         * @returns {Date} Objet Date parsé en UTC
         * 
         * CRITICAL: Les dates dans la DB sont stockées en UTC.
         * JavaScript's new Date("YYYY-MM-DD HH:MM:SS") les interprète comme LOCAL TIME.
         * On doit ajouter 'Z' pour forcer l'interprétation UTC.
         */
        const parseUTCDate = (sqlDateTime) => {
            if (!sqlDateTime || sqlDateTime === 'null' || sqlDateTime === '') return null;
            
            // Convertir "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SSZ"
            const isoFormat = sqlDateTime.replace(' ', 'T');
            const utcFormat = isoFormat + (isoFormat.includes('Z') ? '' : 'Z');
            return new Date(utcFormat);
        };

        // ============================================================================

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
                    title: "⚡ Nouveautés v2.8.1",
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
                        "• 🏷️ Version 2.8.1"
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
                { id: 'optimisations', icon: 'fa-rocket', label: 'Nouveautés v2.8.1' },
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
                                "✨ v2.8.1 - Mise à jour 2025-11-19"
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
            const [rememberMe, setRememberMe] = React.useState(false);
            const [loginTitle, setLoginTitle] = React.useState(companyTitle);
            const [loginSubtitle, setLoginSubtitle] = React.useState(companySubtitle);

            // Charger dynamiquement le titre et sous-titre à chaque affichage du login
            React.useEffect(() => {
                const loadLoginSettings = async () => {
                    try {
                        const titleRes = await axios.get(API_URL + '/settings/company_title');
                        if (titleRes.data.setting_value) {
                            setLoginTitle(titleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Titre par défaut utilisé
                    }

                    try {
                        const subtitleRes = await axios.get(API_URL + '/settings/company_subtitle');
                        if (subtitleRes.data.setting_value) {
                            setLoginSubtitle(subtitleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Sous-titre par défaut utilisé
                    }
                };

                loadLoginSettings();
            }, []); // Exécuter une fois au montage du composant

            const handleSubmit = (e) => {
                e.preventDefault();
                onLogin(email, password, rememberMe);
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

            return React.createElement('div', {
                className: 'min-h-screen flex items-center justify-center',
                style: {
                    backgroundImage: 'url(/static/login-background.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }
            },
                React.createElement('div', {
                    className: 'p-8 rounded-2xl w-96 max-w-md mx-4',
                    style: {
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                        border: '1px solid rgba(255, 255, 255, 0.18)'
                    }
                },
                    React.createElement('div', { className: 'text-center mb-8' },
                        React.createElement('img', {
                            src: '/api/settings/logo?t=' + Date.now(),
                            alt: 'IGP Logo',
                            className: 'h-20 w-auto mx-auto mb-4',
                            onError: (e) => {
                                e.target.src = '/static/logo-igp.png';
                            }
                        }),
                        React.createElement('h1', {
                            className: 'text-lg sm:text-xl md:text-2xl font-bold mb-2 px-2 break-words',
                            style: {
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                color: '#003B73',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.8)'
                            }
                        }, loginTitle),
                        React.createElement('div', { className: 'inline-block px-3 py-1 mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-md animate-pulse' },
                            React.createElement('i', { className: 'fas fa-tools mr-1' }),
                            'ENVIRONNEMENT DE TEST'
                        ),
                        React.createElement('p', {
                            className: 'text-xs sm:text-sm px-4 break-words font-semibold',
                            style: {
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                color: '#1f2937',
                                textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.9)'
                            }
                        }, loginSubtitle)
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
                        React.createElement('div', { className: 'mb-6' },
                            React.createElement('label', { className: 'flex items-center cursor-pointer' },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: rememberMe,
                                    onChange: (e) => setRememberMe(e.target.checked),
                                    className: 'mr-2 h-4 w-4 text-igp-blue border-gray-300 rounded focus:ring-2 focus:ring-igp-blue'
                                }),
                                React.createElement('span', { className: 'text-sm text-white font-semibold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' },
                                    React.createElement('i', { className: 'fas fa-clock mr-1 text-blue-300' }),
                                    'Se souvenir de moi (30 jours)'
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
        const MoveTicketBottomSheet = ({ show, onClose, ticket, onMove, onDelete, currentUser }) => {
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

                    React.createElement('div', { className: 'p-4 border-t border-gray-200 space-y-2' },
                        // Bouton Supprimer (admin/supervisor/technicien peuvent tout supprimer, opérateur seulement ses propres tickets)
                        (() => {
                            const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'technician' ||
                                (currentUser?.role === 'operator' && ticket.reported_by === currentUser?.id);
                            return canDelete;
                        })() ?
                        React.createElement('button', {
                            onClick: () => {
                                if (navigator.vibrate) navigator.vibrate(50);
                                onDelete(ticket.id);
                                onClose();
                            },
                            className: 'w-full py-4 text-center font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-colors no-tap-highlight flex items-center justify-center gap-2',
                            style: {
                                fontSize: '16px'
                            },
                            type: 'button'
                        },
                            React.createElement('i', { className: 'fas fa-trash-alt' }),
                            'Supprimer le ticket'
                        ) : null,
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
                        .catch(err => {});
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
                        // Erreur silencieuse
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
                        reporter_name: currentUser.first_name || currentUser.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
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
                            // NOUVEAU: Conversion datetime-local → UTC SQL
                            // scheduledDate = "2025-11-15T14:30" (heure locale)
                            requestBody.scheduled_date = localDateTimeToUTC(scheduledDate);
                            // Résultat: "2025-11-15 19:30:00" (UTC avec offset -5)
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
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300 pointer-events-none'
                                            })
                                            : React.createElement('video', {
                                                src: preview.url,
                                                className: 'w-full h-24 object-cover rounded border-2 border-gray-300 pointer-events-none',
                                                controls: false
                                            }),
                                        React.createElement('button', {
                                            type: 'button',
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                removeMedia(index);
                                            },
                                            className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20',
                                            style: { opacity: 1 }
                                        },
                                            React.createElement('i', { className: 'fas fa-times text-sm' })
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
                                                '👤 ' + tech.first_name
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
                                            "📅 " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        )
                                    ) : assignedTo ? React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-orange-50 border-2 border-orange-300' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('i', { className: 'fas fa-user-check text-orange-600' }),
                                            React.createElement('span', { className: 'text-sm font-bold text-orange-800' },
                                                "État : ASSIGNÉ"
                                            )
                                        ),
                                        React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                            "ℹ️ Ajoutez une date pour planifier"
                                        )
                                    ) : null,

                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-calendar-day mr-2' }),
                                        'Date et heure de maintenance' + (scheduledDate ? ' (modifier)' : ' (optionnelle)'),
                                        React.createElement('span', { className: 'ml-2 text-xs text-gray-500 font-normal' },
                                            '(heure locale EST/EDT)'
                                        )
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('input', {
                                            type: 'datetime-local',
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
                        .catch(err => {});
                }

                // Pré-remplir les champs si le ticket est déjà planifié
                if (ticket) {
                    // CRITICAL: Check !== null (not just falsy) because 0 is valid (team assignment)
                    setScheduledAssignedTo(ticket.assigned_to !== null && ticket.assigned_to !== undefined ? String(ticket.assigned_to) : '');
                    // NOUVEAU: Conversion UTC SQL → datetime-local
                    setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? utcToLocalDateTime(ticket.scheduled_date) : '');
                }
            }, [show, currentUser.role, ticket]);

            const loadTicketDetails = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/tickets/' + ticketId);
                    setTicket(response.data.ticket);
                } catch (error) {
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
                    // Erreur silencieuse
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
                        user_name: currentUser.first_name,
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
                        // NOUVEAU: Conversion datetime-local → UTC SQL
                        updateData.scheduled_date = scheduledDate ? localDateTimeToUTC(scheduledDate) : null;
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
                        React.createElement('div', { className: 'flex gap-4 sm:gap-5' },
                            (ticket && currentUser && (
                                (currentUser.role === 'technician' && (!ticket.scheduled_date || ticket.reported_by === currentUser.id)) ||
                                (currentUser.role === 'supervisor') ||
                                (currentUser.role === 'admin') ||
                                (currentUser.role === 'operator' && ticket.reported_by === currentUser.id)
                            )) ? React.createElement('button', {
                                onClick: handleDeleteTicket,
                                className: 'text-red-500 hover:text-red-700 transition-colors transform hover:scale-110 active:scale-95 p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
                                title: 'Supprimer ce ticket',
                                'aria-label': 'Supprimer ce ticket'
                            },
                                React.createElement('i', { className: 'fas fa-trash-alt text-xl sm:text-2xl' })
                            ) : null,
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'text-gray-500 hover:text-gray-700 p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
                                'aria-label': 'Fermer'
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

                        // Badge "En retard" si ticket expiré (visible pour tous)
                        (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived' && parseUTCDate(ticket.scheduled_date) < new Date()) ?
                            React.createElement('div', { className: 'mb-4 sm:mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl shadow-lg p-4 sm:p-6' },
                                React.createElement('div', { className: 'flex flex-col sm:flex-row items-start gap-4' },
                                    React.createElement('div', { className: 'text-4xl sm:text-5xl flex-shrink-0' }, '⏰'),
                                    React.createElement('div', { className: 'flex-1 w-full' },
                                        React.createElement('h4', { className: 'font-bold text-orange-900 text-lg sm:text-xl mb-2 flex items-center gap-2' },
                                            React.createElement('span', {}, 'Ticket en retard'),
                                            React.createElement('span', { className: 'text-sm sm:text-base font-normal text-orange-700' },
                                                ' - ',
                                                (() => {
                                                    const scheduledUTC = parseUTCDate(ticket.scheduled_date);
                                                    const delay = new Date().getTime() - scheduledUTC.getTime();
                                                    const hours = Math.floor(delay / (1000 * 60 * 60));
                                                    const minutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
                                                    return hours > 0 ? hours + 'h ' + minutes + 'min' : minutes + 'min';
                                                })()
                                            )
                                        ),
                                        React.createElement('p', { className: 'text-sm sm:text-base text-orange-800 mb-4' },
                                            'En attente de pièces, validation externe, ou autre blocage?'
                                        ),
                                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                                            React.createElement('button', {
                                                onClick: () => {
                                                    setEditingSchedule(true);
                                                    // Scroll vers section planification
                                                    setTimeout(() => {
                                                        const section = document.querySelector('[data-section="planning"]');
                                                        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }, 100);
                                                },
                                                className: 'bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                                            },
                                                React.createElement('i', { className: 'fas fa-calendar-alt mr-2' }),
                                                'Modifier la date planifiée'
                                            ) :
                                            React.createElement('p', { className: 'text-xs sm:text-sm text-orange-700 italic bg-orange-100/50 px-3 py-2 rounded-lg border border-orange-300' },
                                                React.createElement('i', { className: 'fas fa-info-circle mr-2' }),
                                                'Contactez un superviseur ou administrateur pour modifier la date planifiée'
                                            )
                                    )
                                )
                            ) : null,

                        // Section planification (superviseur/admin seulement)
                        (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                            React.createElement('div', { 
                                className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200/50',
                                'data-section': 'planning'
                            },
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
                                                        '👤 ' + tech.first_name
                                                    )
                                                )
                                            )
                                        ),

                                        // Date de maintenance planifiée
                                        React.createElement('div', {},
                                            // Badge d'état actuel
                                            scheduledDate || scheduledAssignedTo ? React.createElement('div', { className: 'mb-3 p-3 rounded-lg border-2 ' + (scheduledDate ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300') },
                                                React.createElement('div', { className: 'flex items-center gap-2' },
                                                    React.createElement('i', { className: 'text-lg ' + (scheduledDate ? 'fas fa-calendar-check text-blue-600' : 'fas fa-user-check text-orange-600') }),
                                                    React.createElement('span', { className: 'font-bold ' + (scheduledDate ? 'text-blue-800' : 'text-orange-800') },
                                                        "État actuel : " + (scheduledDate ? "PLANIFIÉ" : "ASSIGNÉ")
                                                    )
                                                ),
                                                scheduledDate ?
                                                    React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                                        "📅 Date : " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    )
                                                : React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                                    "ℹ️ Aucune date planifiée - Ajoutez-en une pour planifier"
                                                )
                                            ) : null, // Ferme le badge d'état (ligne 3307)

                                            React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' },
                                                React.createElement('i', { className: 'fas fa-calendar-day mr-2 text-slate-600 text-xs sm:text-sm' }),
                                                "Date et heure de maintenance" + (scheduledDate ? " (modifier)" : " (ajouter)"),
                                                React.createElement('span', { className: 'ml-2 text-xs text-gray-500 font-normal' },
                                                    '(heure locale EST/EDT)'
                                                )
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('input', {
                                                    type: 'datetime-local',
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
                                            className: 'cursor-pointer sm:cursor-pointer',
                                            onClick: () => setSelectedMedia(media)
                                        },
                                            media.file_type.startsWith('image/')
                                                ? React.createElement('img', {
                                                    src: API_URL + '/media/' + media.id,
                                                    alt: media.file_name,
                                                    className: 'w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-igp-blue transition-all pointer-events-none sm:pointer-events-auto'
                                                })
                                                : React.createElement('div', { className: 'w-full h-32 bg-gray-200 rounded border-2 border-gray-300 hover:border-igp-blue transition-all flex items-center justify-center pointer-events-none sm:pointer-events-auto' },
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
                                            className: 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg z-20',
                                            style: { opacity: 1 },
                                            title: 'Supprimer ce media'
                                        },
                                            React.createElement('i', { className: 'fas fa-trash text-sm' })
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

            // États pour l'upload du logo (admin uniquement)
            const [logoFile, setLogoFile] = React.useState(null);
            const [logoPreview, setLogoPreview] = React.useState(null);
            const [uploadingLogo, setUploadingLogo] = React.useState(false);
            const [currentLogoUrl, setCurrentLogoUrl] = React.useState('/api/settings/logo');
            const [logoRefreshKey, setLogoRefreshKey] = React.useState(Date.now());
            const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);

            // États pour titre/sous-titre (admin uniquement)
            const [companyTitle, setCompanyTitle] = React.useState('Gestion de la maintenance et des réparations');
            const [companySubtitle, setCompanySubtitle] = React.useState('Les Produits Verriers International (IGP) Inc.');
            const [editingTitle, setEditingTitle] = React.useState(false);
            const [editingSubtitle, setEditingSubtitle] = React.useState(false);
            const [tempTitle, setTempTitle] = React.useState('');
            const [tempSubtitle, setTempSubtitle] = React.useState('');
            const [savingTitle, setSavingTitle] = React.useState(false);
            const [savingSubtitle, setSavingSubtitle] = React.useState(false);

            React.useEffect(() => {
                if (show) {
                    loadSettings();
                    checkSuperAdmin();
                }
            }, [show]);

            const checkSuperAdmin = async () => {
                try {
                    // Vérifier si l'utilisateur actuel est admin
                    // Tous les admins (role='admin') peuvent modifier le logo, titre et sous-titre
                    // Le backend vérifie avec adminOnly middleware
                    if (currentUser && currentUser.role === 'admin') {
                        setIsSuperAdmin(true);
                    } else {
                        setIsSuperAdmin(false);
                    }
                } catch (error) {
                    setIsSuperAdmin(false);
                }
            };

            const loadSettings = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(API_URL + '/settings/timezone_offset_hours');
                    setTimezoneOffset(response.data.setting_value);

                    // Charger titre et sous-titre (super admin uniquement)
                    if (isSuperAdmin) {
                        try {
                            const titleResponse = await axios.get(API_URL + '/settings/company_title');
                            if (titleResponse.data.setting_value) {
                                setCompanyTitle(titleResponse.data.setting_value);
                            }
                        } catch (error) {
                            // Titre par défaut
                        }

                        try {
                            const subtitleResponse = await axios.get(API_URL + '/settings/company_subtitle');
                            if (subtitleResponse.data.setting_value) {
                                setCompanySubtitle(subtitleResponse.data.setting_value);
                            }
                        } catch (error) {
                            // Sous-titre par défaut
                        }
                    }
                } catch (error) {
                    // Erreur silencieuse
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

            // Fonction pour gérer la sélection de fichier logo
            const handleLogoFileChange = (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Validation du type
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Type de fichier non autorisé. Utilisez PNG, JPEG ou WEBP.');
                    return;
                }

                // Validation de la taille (500 KB max)
                if (file.size > 500 * 1024) {
                    alert('Fichier trop volumineux (' + (file.size / 1024).toFixed(0) + ' KB). Maximum: 500 KB');
                    return;
                }

                setLogoFile(file);

                // Créer une preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoPreview(reader.result);
                };
                reader.readAsDataURL(file);
            };

            // Fonction pour uploader le logo
            const handleUploadLogo = async () => {
                if (!logoFile) {
                    alert('Veuillez sélectionner un fichier');
                    return;
                }

                setUploadingLogo(true);
                try {
                    const formData = new FormData();
                    formData.append('logo', logoFile);

                    const response = await axios.post(API_URL + '/settings/upload-logo', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    // Rafraîchir le logo affiché
                    setLogoRefreshKey(Date.now());
                    setLogoFile(null);
                    setLogoPreview(null);

                    alert('Logo uploadé avec succès! La page va se recharger pour afficher le nouveau logo...');

                    // Forcer le rechargement de la page pour voir le nouveau logo partout
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                    setUploadingLogo(false);
                }
            };

            // Fonction pour réinitialiser le logo
            const handleResetLogo = async () => {
                if (!confirm('Voulez-vous vraiment réinitialiser le logo au logo par défaut?')) {
                    return;
                }

                setUploadingLogo(true);
                try {
                    await axios.delete(API_URL + '/settings/logo');

                    // Rafraîchir le logo
                    setLogoRefreshKey(Date.now());
                    setLogoFile(null);
                    setLogoPreview(null);

                    alert('Logo réinitialisé avec succès! La page va se recharger pour afficher le logo par défaut...');

                    // Forcer le rechargement de la page
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                    setUploadingLogo(false);
                }
            };

            // Fonctions pour gérer le titre
            const handleStartEditTitle = () => {
                setTempTitle(companyTitle);
                setEditingTitle(true);
            };

            const handleCancelEditTitle = () => {
                setTempTitle('');
                setEditingTitle(false);
            };

            const handleSaveTitle = async () => {
                if (!tempTitle.trim()) {
                    alert('Le titre ne peut pas être vide');
                    return;
                }

                if (tempTitle.trim().length > 100) {
                    alert('Le titre ne peut pas dépasser 100 caractères');
                    return;
                }

                setSavingTitle(true);
                try {
                    await axios.put(API_URL + '/settings/title', {
                        value: tempTitle.trim()
                    });

                    setCompanyTitle(tempTitle.trim());
                    setEditingTitle(false);
                    setTempTitle('');

                    alert('Titre mis à jour avec succès! La page va se recharger...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                } finally {
                    setSavingTitle(false);
                }
            };

            // Fonctions pour gérer le sous-titre
            const handleStartEditSubtitle = () => {
                setTempSubtitle(companySubtitle);
                setEditingSubtitle(true);
            };

            const handleCancelEditSubtitle = () => {
                setTempSubtitle('');
                setEditingSubtitle(false);
            };

            const handleSaveSubtitle = async () => {
                if (!tempSubtitle.trim()) {
                    alert('Le sous-titre ne peut pas être vide');
                    return;
                }

                if (tempSubtitle.trim().length > 150) {
                    alert('Le sous-titre ne peut pas dépasser 150 caractères');
                    return;
                }

                setSavingSubtitle(true);
                try {
                    await axios.put(API_URL + '/settings/subtitle', {
                        value: tempSubtitle.trim()
                    });

                    setCompanySubtitle(tempSubtitle.trim());
                    setEditingSubtitle(false);
                    setTempSubtitle('');

                    alert('Sous-titre mis à jour avec succès! La page va se recharger...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } catch (error) {
                    alert('Erreur: ' + (error.response?.data?.error || 'Erreur serveur'));
                } finally {
                    setSavingSubtitle(false);
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
                            ),

                            // Section Logo de l'entreprise (ADMIN UNIQUEMENT)
                            isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                                React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4' },
                                    React.createElement('div', { className: 'flex items-start gap-3' },
                                        React.createElement('i', { className: 'fas fa-image text-purple-600 text-xl mt-1' }),
                                        React.createElement('div', {},
                                            React.createElement('h3', { className: 'font-bold text-purple-900 mb-2 flex items-center gap-2' },
                                                "Logo de l'entreprise",
                                                React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                            ),
                                            React.createElement('p', { className: 'text-sm text-purple-800 mb-2' },
                                                "Personnalisez le logo affiché dans l'application."
                                            ),
                                            React.createElement('ul', { className: 'text-sm text-purple-800 space-y-1 list-disc list-inside' },
                                                React.createElement('li', {}, 'Format: PNG transparent recommandé'),
                                                React.createElement('li', {}, 'Dimensions: 200×80 pixels (ratio 2.5:1)'),
                                                React.createElement('li', {}, 'Taille max: 500 KB')
                                            )
                                        )
                                    )
                                ),

                                // Logo actuel
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-eye mr-2' }),
                                        'Logo actuel'
                                    ),
                                    React.createElement('div', { className: 'bg-gray-100 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-center' },
                                        React.createElement('img', {
                                            src: currentLogoUrl + '?t=' + logoRefreshKey,
                                            alt: 'Logo actuel',
                                            className: 'max-h-20 max-w-full object-contain',
                                            onError: (e) => {
                                                e.target.src = '/static/logo-igp.png';
                                            }
                                        })
                                    )
                                ),

                                // Upload nouveau logo
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-upload mr-2' }),
                                        'Uploader un nouveau logo'
                                    ),
                                    // Bouton personnalisé pour sélectionner le fichier (en français)
                                    React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                        React.createElement('label', {
                                            className: 'cursor-pointer px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg border-2 border-purple-300 transition-all flex items-center gap-2 ' + (uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''),
                                            style: { pointerEvents: uploadingLogo ? 'none' : 'auto' }
                                        },
                                            React.createElement('i', { className: 'fas fa-folder-open' }),
                                            React.createElement('span', {}, 'Choisir un fichier'),
                                            React.createElement('input', {
                                                type: 'file',
                                                accept: 'image/png,image/jpeg,image/jpg,image/webp',
                                                onChange: handleLogoFileChange,
                                                disabled: uploadingLogo,
                                                className: 'hidden'
                                            })
                                        ),
                                        React.createElement('span', { className: 'text-sm text-gray-600' },
                                            logoFile ? logoFile.name : 'Aucun fichier sélectionné'
                                        )
                                    ),
                                    logoPreview && React.createElement('div', { className: 'mt-3 bg-white border-2 border-purple-300 rounded-lg p-3 sm:p-4' },
                                        React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' }, 'Aperçu:'),
                                        React.createElement('div', { className: 'flex items-center justify-center' },
                                            React.createElement('img', {
                                                src: logoPreview,
                                                alt: 'Aperçu',
                                                className: 'max-h-20 max-w-full object-contain'
                                            })
                                        )
                                    )
                                ),

                                // Boutons d'action
                                React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3' },
                                    React.createElement('button', {
                                        onClick: handleUploadLogo,
                                        disabled: !logoFile || uploadingLogo,
                                        className: 'flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base',
                                        type: 'button'
                                    },
                                        uploadingLogo && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                        uploadingLogo ? 'Upload en cours...' : 'Uploader le logo'
                                    ),
                                    React.createElement('button', {
                                        onClick: handleResetLogo,
                                        disabled: uploadingLogo,
                                        className: 'px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base',
                                        type: 'button',
                                        title: 'Réinitialiser au logo par défaut'
                                    },
                                        React.createElement('i', { className: 'fas fa-undo' }),
                                        React.createElement('span', { className: 'hidden sm:inline' }, 'Réinitialiser'),
                                        React.createElement('span', { className: 'sm:hidden' }, 'Reset')
                                    )
                                )
                            ),

                            // Section Titre et Sous-titre (ADMIN UNIQUEMENT)
                            isSuperAdmin && React.createElement('div', { className: 'border-t border-gray-300 pt-6 mt-6' },
                                React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4' },
                                    React.createElement('div', { className: 'flex items-start gap-3' },
                                        React.createElement('i', { className: 'fas fa-heading text-blue-600 text-xl mt-1' }),
                                        React.createElement('div', {},
                                            React.createElement('h3', { className: 'font-bold text-blue-900 mb-2 flex items-center gap-2' },
                                                "Titre et Sous-titre de l'application",
                                                React.createElement('span', { className: 'text-xs bg-blue-600 text-white px-2 py-1 rounded' }, 'ADMIN')
                                            ),
                                            React.createElement('p', { className: 'text-sm text-blue-800 mb-2' },
                                                "Personnalisez le titre et le sous-titre affichés dans l'en-tête de l'application."
                                            ),
                                            React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1 list-disc list-inside' },
                                                React.createElement('li', {}, 'Titre: maximum 100 caractères'),
                                                React.createElement('li', {}, 'Sous-titre: maximum 150 caractères'),
                                                React.createElement('li', {}, 'Les caractères spéciaux sont supportés (é, è, à, ç, etc.)')
                                            )
                                        )
                                    )
                                ),

                                // Édition du titre
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-heading mr-2' }),
                                        'Titre principal'
                                    ),
                                    !editingTitle ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                        React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                            companyTitle
                                        ),
                                        React.createElement('button', {
                                            onClick: handleStartEditTitle,
                                            className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                            type: 'button'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit' }),
                                            'Modifier'
                                        )
                                    ) : React.createElement('div', { className: 'space-y-3' },
                                        React.createElement('input', {
                                            type: 'text',
                                            value: tempTitle,
                                            onChange: (e) => setTempTitle(e.target.value),
                                            placeholder: 'Entrez le nouveau titre',
                                            maxLength: 100,
                                            className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                            disabled: savingTitle
                                        }),
                                        React.createElement('div', { className: 'flex items-center justify-between' },
                                            React.createElement('span', { className: 'text-xs text-gray-600' },
                                                tempTitle.length + '/100 caractères'
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('button', {
                                                    onClick: handleCancelEditTitle,
                                                    disabled: savingTitle,
                                                    className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                                    type: 'button'
                                                }, 'Annuler'),
                                                React.createElement('button', {
                                                    onClick: handleSaveTitle,
                                                    disabled: !tempTitle.trim() || savingTitle,
                                                    className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                                    type: 'button'
                                                },
                                                    savingTitle && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                                    savingTitle ? 'Enregistrement...' : 'Enregistrer'
                                                )
                                            )
                                        )
                                    )
                                ),

                                // Édition du sous-titre
                                React.createElement('div', { className: 'mb-0' },
                                    React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                        React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                                        'Sous-titre'
                                    ),
                                    !editingSubtitle ? React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 items-start sm:items-center' },
                                        React.createElement('div', { className: 'flex-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 text-gray-800' },
                                            companySubtitle
                                        ),
                                        React.createElement('button', {
                                            onClick: handleStartEditSubtitle,
                                            className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm',
                                            type: 'button'
                                        },
                                            React.createElement('i', { className: 'fas fa-edit' }),
                                            'Modifier'
                                        )
                                    ) : React.createElement('div', { className: 'space-y-3' },
                                        React.createElement('input', {
                                            type: 'text',
                                            value: tempSubtitle,
                                            onChange: (e) => setTempSubtitle(e.target.value),
                                            placeholder: 'Entrez le nouveau sous-titre',
                                            maxLength: 150,
                                            className: 'w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500',
                                            disabled: savingSubtitle
                                        }),
                                        React.createElement('div', { className: 'flex items-center justify-between' },
                                            React.createElement('span', { className: 'text-xs text-gray-600' },
                                                tempSubtitle.length + '/150 caractères'
                                            ),
                                            React.createElement('div', { className: 'flex gap-2' },
                                                React.createElement('button', {
                                                    onClick: handleCancelEditSubtitle,
                                                    disabled: savingSubtitle,
                                                    className: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-all text-sm disabled:opacity-50',
                                                    type: 'button'
                                                }, 'Annuler'),
                                                React.createElement('button', {
                                                    onClick: handleSaveSubtitle,
                                                    disabled: !tempSubtitle.trim() || savingSubtitle,
                                                    className: 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                                                    type: 'button'
                                                },
                                                    savingSubtitle && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                                                    savingSubtitle ? 'Enregistrement...' : 'Enregistrer'
                                                )
                                            )
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


        // Composant de performance des techniciens (ÉTAPE 2: VERSION BASIQUE)
        const PerformanceModal = ({ show, onClose }) => {
            const [loading, setLoading] = React.useState(true);
            const [performanceData, setPerformanceData] = React.useState(null);

            React.useEffect(() => {
                if (show) {
                    loadPerformanceData();
                }
            }, [show]);

            const loadPerformanceData = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('/api/stats/technicians-performance', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    const data = await response.json();
                    setPerformanceData(data);
                } catch (error) {
                    console.error('Erreur chargement performance:', error);
                } finally {
                    setLoading(false);
                }
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    // Header with gradient
                    React.createElement('div', { 
                        className: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 sm:p-6'
                    },
                        React.createElement('div', { className: 'flex justify-between items-center' },
                            React.createElement('div', {},
                                React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-chart-line' }),
                                    'Tableau de Performance'
                                ),
                                React.createElement('p', { className: 'text-slate-200 text-xs sm:text-sm mt-1' }, 
                                    'Analyse des performances sur les 30 derniers jours'
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                                onClick: onClose
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    // Content
                    React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                        loading ? 
                            React.createElement('div', { className: 'text-center py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-slate-500 mb-4' }),
                                React.createElement('p', { className: 'text-gray-600' }, 'Chargement des données...')
                            ) :
                            React.createElement('div', { className: 'space-y-3 sm:space-y-6' },
                                // Top Performers Section
                                React.createElement('div', {},
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-3 sm:mb-4' },
                                        React.createElement('i', { className: 'fas fa-trophy text-yellow-500 text-xl' }),
                                        React.createElement('h3', { className: 'text-base sm:text-lg font-bold text-gray-800' }, 
                                            'Top Performers'
                                        ),
                                        React.createElement('span', { className: 'text-xs sm:text-sm text-gray-500' }, 
                                            '(Meilleurs techniciens)'
                                        )
                                    ),
                                    
                                    // Performance Cards
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4' },
                                        performanceData?.topTechnicians?.slice(0, 3).map((tech, index) => {
                                            const rankColors = [
                                                { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', border: 'border-amber-400', icon: 'fa-medal text-amber-600', badge: 'bg-amber-600' },
                                                { bg: 'bg-gradient-to-br from-slate-50 to-slate-100', border: 'border-slate-300', icon: 'fa-medal text-slate-500', badge: 'bg-slate-500' },
                                                { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-400', icon: 'fa-medal text-orange-700', badge: 'bg-orange-700' }
                                            ];
                                            const colors = rankColors[index] || rankColors[2];
                                            
                                            return React.createElement('div', {
                                                key: tech.id,
                                                className: 'border-2 rounded-lg p-3 sm:p-4 ' + colors.bg + ' ' + colors.border + ' hover:shadow-lg transition-shadow'
                                            },
                                                React.createElement('div', { className: 'flex items-start justify-between mb-3' },
                                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                                        React.createElement('i', { className: 'fas ' + colors.icon + ' text-2xl' }),
                                                        React.createElement('span', { className: 'text-xs font-semibold text-gray-600' }, 
                                                            '#' + (index + 1)
                                                        )
                                                    ),
                                                    React.createElement('span', { 
                                                        className: 'px-2 py-1 rounded-full text-white text-xs font-bold ' + colors.badge 
                                                    }, tech.completed_count + ' tickets')
                                                ),
                                                React.createElement('div', {},
                                                    React.createElement('p', { className: 'font-bold text-gray-800 mb-1' }, 
                                                        tech.full_name || (tech.first_name + ' ' + tech.last_name)
                                                    ),
                                                    React.createElement('div', { className: 'flex items-center gap-2 text-xs text-gray-600' },
                                                        React.createElement('i', { className: 'fas fa-check-circle text-green-500' }),
                                                        React.createElement('span', {}, tech.completed_count + ' interventions réussies')
                                                    )
                                                )
                                            );
                                        })
                                    )
                                ),

                                // Stats Summary
                                performanceData?.topTechnicians?.length > 0 && React.createElement('div', { 
                                    className: 'bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4'
                                },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                        React.createElement('i', { className: 'fas fa-info-circle text-slate-600' }),
                                        React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                    ),
                                    React.createElement('p', { className: 'text-xs sm:text-sm text-gray-700' },
                                        'Total de ',
                                        React.createElement('span', { className: 'font-bold' }, 
                                            performanceData.topTechnicians.reduce((sum, t) => sum + t.completed_count, 0)
                                        ),
                                        ' tickets complétés par les ',
                                        React.createElement('span', { className: 'font-bold' }, 
                                            performanceData.topTechnicians.length
                                        ),
                                        ' meilleurs techniciens au cours des 30 derniers jours.'
                                    )
                                ),

                                // Empty state
                                performanceData?.topTechnicians?.length === 0 && React.createElement('div', {
                                    className: 'text-center py-12 bg-gray-50 rounded-lg'
                                },
                                    React.createElement('i', { className: 'fas fa-inbox text-5xl text-gray-300 mb-4' }),
                                    React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                        'Aucune donnée de performance disponible'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                        'Les statistiques apparaîtront une fois que les techniciens auront complété des tickets.'
                                    )
                                )
                            )
                    )
                )
            );
        };


        // Composant modal des tickets en retard
        const OverdueTicketsModal = ({ show, onClose, currentUser }) => {
            const [loading, setLoading] = React.useState(true);
            const [overdueTickets, setOverdueTickets] = React.useState([]);
            const [ticketComments, setTicketComments] = React.useState({});

            React.useEffect(() => {
                if (show) {
                    loadOverdueTickets();
                }
            }, [show]);

            const loadOverdueTickets = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('/api/tickets', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    const data = await response.json();
                    
                    // Filter overdue tickets
                    const now = new Date();
                    const overdue = (data.tickets || []).filter(ticket => {
                        if (ticket.status === 'completed' || ticket.status === 'cancelled' || ticket.status === 'archived') {
                            return false;
                        }
                        // Handle both null and string "null" from database
                        if (!ticket.scheduled_date || ticket.scheduled_date === 'null') {
                            return false;
                        }
                        // CRITICAL FIX: Force UTC interpretation to avoid timezone issues
                        // Replace space with 'T' and add 'Z' for consistent ISO 8601 UTC format
                        // "2025-11-25 10:16:00" → "2025-11-25T10:16:00Z"
                        const isoDate = ticket.scheduled_date.replace(' ', 'T') + 'Z';
                        const scheduledDate = new Date(isoDate);
                        return scheduledDate < now;
                    });
                    
                    // Sort by scheduled date (oldest first)
                    overdue.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
                    
                    setOverdueTickets(overdue);
                    
                    // Load comments for all overdue tickets
                    if (overdue.length > 0) {
                        const commentsMap = {};
                        for (const ticket of overdue) {
                            try {
                                const commentsResponse = await fetch('/api/comments/ticket/' + ticket.id, {
                                    headers: {
                                        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                                    }
                                });
                                const commentsData = await commentsResponse.json();
                                commentsMap[ticket.id] = commentsData.comments || [];
                            } catch (err) {
                                console.error('Erreur chargement commentaires ticket ' + ticket.id + ':', err);
                                commentsMap[ticket.id] = [];
                            }
                        }
                        setTicketComments(commentsMap);
                    }
                } catch (error) {
                    console.error('Erreur chargement tickets en retard:', error);
                } finally {
                    setLoading(false);
                }
            };

            const getDaysOverdue = (scheduledDate) => {
                const now = new Date();
                const scheduled = new Date(scheduledDate);
                const diffTime = Math.abs(now - scheduled);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
            };

            const getPriorityColor = (priority) => {
                const colors = {
                    'critical': 'bg-red-100 text-red-800 border-red-300',
                    'high': 'bg-orange-100 text-orange-800 border-orange-300',
                    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    'low': 'bg-green-100 text-green-800 border-green-300'
                };
                return colors[priority] || colors.medium;
            };

            const getPriorityLabel = (priority) => {
                const labels = {
                    'critical': 'Critique',
                    'high': 'Haute',
                    'medium': 'Moyenne',
                    'low': 'Basse'
                };
                return labels[priority] || priority;
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    // Header
                    React.createElement('div', { 
                        className: 'bg-gradient-to-r from-rose-800 to-rose-900 text-white p-4 sm:p-6'
                    },
                        React.createElement('div', { className: 'flex justify-between items-center' },
                            React.createElement('div', {},
                                React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-exclamation-triangle' }),
                                    'Tickets en Retard'
                                ),
                                React.createElement('p', { className: 'text-rose-200 text-xs sm:text-sm mt-1' }, 
                                    'Interventions nécessitant une attention immédiate'
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                                onClick: onClose
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    // Content
                    React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                        loading ? 
                            React.createElement('div', { className: 'text-center py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-rose-600 mb-4' }),
                                React.createElement('p', { className: 'text-gray-600' }, 'Chargement des tickets...')
                            ) :
                            overdueTickets.length > 0 ?
                                React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                                    // Stats summary
                                    React.createElement('div', { className: 'bg-rose-50 border border-rose-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6' },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                            React.createElement('i', { className: 'fas fa-info-circle text-rose-700' }),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                        ),
                                        React.createElement('p', { className: 'text-sm text-gray-700' },
                                            React.createElement('span', { className: 'font-bold text-rose-800' }, overdueTickets.length),
                                            ' ticket(s) en retard nécessitant une action urgente.'
                                        )
                                    ),

                                    // Tickets list
                                    overdueTickets.map((ticket) =>
                                        React.createElement('div', {
                                            key: ticket.id,
                                            className: 'border-2 border-rose-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white'
                                        },
                                            React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start mb-3 gap-2' },
                                                React.createElement('div', { className: 'flex-1' },
                                                    React.createElement('h3', { className: 'font-bold text-gray-800 mb-1' }, ticket.title),
                                                    React.createElement('p', { className: 'text-sm text-gray-600 mb-2' }, ticket.ticket_id)
                                                ),
                                                React.createElement('div', { className: 'flex flex-col items-end gap-2' },
                                                    React.createElement('span', { 
                                                        className: 'px-3 py-1 rounded-full text-xs font-bold border-2 ' + getPriorityColor(ticket.priority)
                                                    }, getPriorityLabel(ticket.priority)),
                                                    React.createElement('span', { 
                                                        className: 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border-2 border-red-300'
                                                    }, 
                                                        React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                                        getDaysOverdue(ticket.scheduled_date) + ' jours'
                                                    )
                                                )
                                            ),
                                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm' },
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Machine: '),
                                                    React.createElement('span', { className: 'font-medium ml-1' }, ticket.machine_type + ' - ' + ticket.model)
                                                ),
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Assigné à: '),
                                                    React.createElement('span', { className: 'font-medium ml-1 break-all' }, ticket.assignee_name || 'Non assigné')
                                                ),
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Date prévue: '),
                                                    React.createElement('span', { className: 'font-medium text-red-600 ml-1' }, 
                                                        new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z').toLocaleDateString('fr-FR')
                                                    )
                                                ),
                                                React.createElement('div', { className: 'flex flex-wrap' },
                                                    React.createElement('span', { className: 'text-gray-500' }, 'Lieu: '),
                                                    React.createElement('span', { className: 'font-medium ml-1' }, ticket.location)
                                                )
                                            ),
                                            // Comments section
                                            ticketComments[ticket.id] && ticketComments[ticket.id].length > 0 && 
                                            React.createElement('div', { className: 'mt-3 pt-3 border-t border-rose-100' },
                                                React.createElement('h4', { className: 'text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1' },
                                                    React.createElement('i', { className: 'fas fa-comment text-rose-600' }),
                                                    'Commentaires (' + ticketComments[ticket.id].length + ')'
                                                ),
                                                React.createElement('div', { className: 'space-y-2 max-h-32 overflow-y-auto' },
                                                    ticketComments[ticket.id].map((comment, idx) =>
                                                        React.createElement('div', { 
                                                            key: idx,
                                                            className: 'bg-gray-50 rounded p-2 text-xs'
                                                        },
                                                            React.createElement('div', { className: 'font-semibold text-rose-700 mb-1' },
                                                                'Commentaire de ' + comment.user_name + ':'
                                                            ),
                                                            React.createElement('div', { className: 'text-gray-700' },
                                                                comment.comment
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ) :
                                React.createElement('div', {
                                    className: 'text-center py-12 bg-gray-50 rounded-lg'
                                },
                                    React.createElement('i', { className: 'fas fa-check-circle text-5xl text-green-500 mb-4' }),
                                    React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                        'Aucun ticket en retard !'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                        'Toutes les interventions sont à jour.'
                                    )
                                )
                    )
                )
            );
        };


        // Composant modal des appareils push
        const PushDevicesModal = ({ show, onClose }) => {
            const [loading, setLoading] = React.useState(true);
            const [devices, setDevices] = React.useState([]);

            React.useEffect(() => {
                if (show) {
                    loadDevices();
                }
            }, [show]);

            const loadDevices = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('/api/push/subscriptions-list', {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    const data = await response.json();
                    setDevices(data.subscriptions || []);
                } catch (error) {
                    console.error('Erreur chargement appareils:', error);
                } finally {
                    setLoading(false);
                }
            };

            const getDeviceIcon = (deviceType) => {
                if (!deviceType) return 'fa-mobile-alt';
                const type = deviceType.toLowerCase();
                if (type.includes('mobile') || type.includes('phone')) return 'fa-mobile-alt';
                if (type.includes('tablet') || type.includes('ipad')) return 'fa-tablet-alt';
                if (type.includes('desktop') || type.includes('windows')) return 'fa-desktop';
                if (type.includes('laptop') || type.includes('mac')) return 'fa-laptop';
                return 'fa-mobile-alt';
            };

            const getDevicePlatform = (deviceType, deviceName) => {
                if (deviceName) return deviceName;
                if (!deviceType) return 'Appareil inconnu';
                return deviceType;
            };

            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
                onClick: onClose
            },
                React.createElement('div', {
                    className: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
                    onClick: (e) => e.stopPropagation()
                },
                    // Header
                    React.createElement('div', { 
                        className: 'bg-gradient-to-r from-teal-700 to-teal-800 text-white p-4 sm:p-6'
                    },
                        React.createElement('div', { className: 'flex justify-between items-center' },
                            React.createElement('div', {},
                                React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-bell' }),
                                    'Appareils Notifications Push'
                                ),
                                React.createElement('p', { className: 'text-teal-200 text-xs sm:text-sm mt-1' }, 
                                    'Appareils enregistrés pour recevoir les notifications'
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                                onClick: onClose
                            }, React.createElement('i', { className: 'fas fa-times' }))
                        )
                    ),

                    // Content
                    React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                        loading ? 
                            React.createElement('div', { className: 'text-center py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-teal-600 mb-4' }),
                                React.createElement('p', { className: 'text-gray-600' }, 'Chargement des appareils...')
                            ) :
                            devices.length > 0 ?
                                React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                                    // Stats summary
                                    React.createElement('div', { className: 'bg-teal-50 border border-teal-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6' },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                            React.createElement('i', { className: 'fas fa-info-circle text-teal-700' }),
                                            React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                        ),
                                        React.createElement('p', { className: 'text-xs sm:text-sm text-gray-700' },
                                            React.createElement('span', { className: 'font-bold text-teal-800' }, devices.length),
                                            ' appareil(s) enregistré(s) pour recevoir les notifications push.'
                                        )
                                    ),

                                    // Devices list
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4' },
                                        devices.map((device, index) =>
                                            React.createElement('div', {
                                                key: device.id,
                                                className: 'border-2 border-teal-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-white'
                                            },
                                                React.createElement('div', { className: 'flex items-start gap-3' },
                                                    React.createElement('div', { className: 'w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0' },
                                                        React.createElement('i', { 
                                                            className: 'fas ' + getDeviceIcon(device.device_type) + ' text-teal-700 text-xl'
                                                        })
                                                    ),
                                                    React.createElement('div', { className: 'flex-1' },
                                                        React.createElement('h3', { className: 'font-bold text-gray-800 mb-1' }, 
                                                            getDevicePlatform(device.device_type, device.device_name)
                                                        ),
                                                        React.createElement('p', { className: 'text-xs text-gray-500 mb-2' }, 
                                                            'Utilisateur: ' + (device.user_full_name || 'Inconnu')
                                                        ),
                                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                                            React.createElement('span', { 
                                                                className: 'px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700'
                                                            },
                                                                React.createElement('i', { className: 'fas fa-check-circle mr-1' }),
                                                                'Actif'
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ) :
                                React.createElement('div', {
                                    className: 'text-center py-12 bg-gray-50 rounded-lg'
                                },
                                    React.createElement('i', { className: 'fas fa-mobile-alt text-5xl text-gray-300 mb-4' }),
                                    React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                        'Aucun appareil enregistré'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                        'Les appareils apparaîtront ici une fois les notifications push activées.'
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
            const [newFirstName, setNewFirstName] = React.useState('');
            const [newLastName, setNewLastName] = React.useState('');
            const [newRole, setNewRole] = React.useState('operator');
            const [editingUser, setEditingUser] = React.useState(null);
            const [editEmail, setEditEmail] = React.useState('');
            const [editFirstName, setEditFirstName] = React.useState('');
            const [editLastName, setEditLastName] = React.useState('');
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

                    // Polling toutes les 2 minutes pour rafraichir les statuts last_login
                    const interval = setInterval(() => {
                        loadUsers();
                    }, 120000); // 2 minutes (au lieu de 30 secondes)

                    return () => clearInterval(interval);
                }
            }, [show]);

            // Reset edit form states when modal is closed
            React.useEffect(() => {
                if (!show) {
                    // Modal is closed - reset all edit form states
                    setEditingUser(null);
                    setEditEmail('');
                    setEditFirstName('');
                    setEditLastName('');
                    setEditRole('operator');
                    setShowCreateForm(false);
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
                    // Tous les utilisateurs utilisent la route /api/users/team pour voir tous les utilisateurs
                    const endpoint = '/users/team';
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
                        first_name: newFirstName,
                        last_name: newLastName,
                        role: newRole
                    });
                    setToast({ show: true, message: 'Utilisateur cree avec succes!', type: 'success' });
                    setNewEmail('');
                    setNewPassword('');
                    setNewFirstName('');
                    setNewLastName('');
                    setNewRole('operator');
                    setShowCreateForm(false);
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setButtonLoading(null);
                }
            }, [newEmail, newPassword, newFirstName, newLastName, newRole, loadUsers]);

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
                setEditFirstName(user.first_name || '');
                setEditLastName(user.last_name || '');
                setEditRole(user.role);
            }, []);

            const handleUpdateUser = React.useCallback(async (e) => {
                e.preventDefault();
                setButtonLoading('update');
                try {
                    await axios.put(API_URL + '/users/' + editingUser.id, {
                        email: editEmail,
                        first_name: editFirstName,
                        last_name: editLastName,
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
            }, [editingUser, editEmail, editFirstName, editLastName, editRole, loadUsers]);

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
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Prénom'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: newFirstName,
                                        onChange: (e) => handleInputAdminEmail(e, setNewFirstName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        placeholder: 'Jean',
                                        required: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Nom (optionnel)'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: newLastName,
                                        onChange: (e) => handleInputAdminEmail(e, setNewLastName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                        placeholder: 'Dupont'
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
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Prénom'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: editFirstName,
                                        onChange: (e) => handleInputAdminEmail(e, setEditFirstName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        placeholder: 'Jean',
                                        required: true
                                    })
                                ),
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold mb-2' }, 'Nom (optionnel)'),
                                    React.createElement('input', {
                                        type: 'text',
                                        value: editLastName,
                                        onChange: (e) => handleInputAdminEmail(e, setEditLastName),
                                        onInvalid: handleInvalidAdminField,
                                        className: 'w-full px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                        placeholder: 'Dupont'
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
                    // Erreur silencieuse
                }
            };

            const loadConversations = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/conversations');
                    setConversations(response.data.conversations);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const loadPrivateMessages = async (contactId) => {
                try {
                    setLoading(true);
                    const response = await axios.get(API_URL + '/messages/private/' + contactId);
                    setPrivateMessages(response.data.messages);
                    loadConversations(); // Rafraichir pour mettre a jour unread_count
                } catch (error) {
                    // Erreur silencieuse
                } finally {
                    setLoading(false);
                }
            };

            const loadAvailableUsers = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/available-users');
                    setAvailableUsers(response.data.users);
                } catch (error) {
                    // Erreur silencieuse
                }
            };

            const loadUnreadCount = async () => {
                try {
                    const response = await axios.get(API_URL + '/messages/unread-count');
                    setUnreadCount(response.data.count);
                } catch (error) {
                    // Erreur silencieuse
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
                    }
                    // 2. Essayer MP4/AAC - iOS et Chrome moderne
                    else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                        mimeType = 'audio/mp4';
                        extension = 'mp4';
                    }
                    // 3. Fallback WebM - Chrome Android uniquement
                    else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                        mimeType = 'audio/webm;codecs=opus';
                        extension = 'webm';
                    }
                    // 4. Fallback WebM basique
                    else if (MediaRecorder.isTypeSupported('audio/webm')) {
                        mimeType = 'audio/webm';
                        extension = 'webm';
                    }
                    // 5. Dernier recours
                    else {
                        mimeType = '';
                        extension = 'mp3';
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
                const audio = audioRefs.current[messageId];

                if (!audio) {
                    return;
                }

                if (playingAudio[messageId]) {
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

                    // Charger l'audio d'abord si nécessaire
                    if (audio.readyState < 2) {
                        audio.load();
                    }

                    try {
                        await audio.play();
                        setPlayingAudio(prev => ({ ...prev, [messageId]: true }));
                    } catch (err) {
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
                                                            // Erreur audio silencieuse
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
                                            if (!userId) {
                                                // Reset le select à la valeur par défaut
                                                e.target.value = '';
                                                return;
                                            }
                                            const user = availableUsers.find(u => u.id === userId);
                                            if (user) {
                                                setSelectedContact(user);
                                                loadPrivateMessages(user.id);
                                            }
                                            // Reset le select après sélection
                                            e.target.value = '';
                                        },
                                        className: "w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-white/95 to-gray-50/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold text-xs sm:text-sm appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236366f1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                        style: { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' },
                                        value: ''
                                    },
                                        React.createElement('option', { value: '', disabled: true }, '📝 Nouvelle conversation...'),
                                        React.createElement('option', { value: '0' }, '❌ Fermer ce menu'),
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
                                            setSelectedContact({ id: conv.contact_id, first_name: conv.contact_name, role: conv.contact_role });
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
                                        }, selectedContact.first_name.charAt(0).toUpperCase()),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('h3', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, selectedContact.first_name),
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
                                        React.createElement('p', { className: 'text-sm sm:text-base' }, 'Commencez la conversation avec ' + selectedContact.first_name),
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
                                                                // Erreur audio silencieuse
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
                                    React.createElement('p', { className: 'text-lg mb-6' }, 'Sélectionnez un contact'),
                                    React.createElement('button', {
                                        onClick: onClose,
                                        className: 'mt-4 px-6 py-3 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-slate-800 hover:to-gray-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto'
                                    },
                                        React.createElement('i', { className: 'fas fa-times' }),
                                        React.createElement('span', {}, 'Fermer')
                                    )
                                )
                            )
                        ) : null
                    )
                )
            );
        };


        const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages, headerTitle, headerSubtitle }) => {
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
            const [showPerformanceModal, setShowPerformanceModal] = React.useState(false);
            const [showOverdueModal, setShowOverdueModal] = React.useState(false);
            const [showPushDevicesModal, setShowPushDevicesModal] = React.useState(false);
            const [searchQuery, setSearchQuery] = React.useState('');
            const [searchResults, setSearchResults] = React.useState([]);
            const [showSearchResults, setShowSearchResults] = React.useState(false);
            const [searchLoading, setSearchLoading] = React.useState(false);
            const searchTimeoutRef = React.useRef(null);
            const searchInputRef = React.useRef(null);
            const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });

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

            // Recalculer la position du dropdown lors du redimensionnement
            React.useEffect(() => {
                const updateDropdownPosition = () => {
                    if (searchInputRef.current && showSearchResults) {
                        const rect = searchInputRef.current.getBoundingClientRect();
                        setSearchDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width
                        });
                    }
                };

                window.addEventListener('resize', updateDropdownPosition);
                window.addEventListener('orientationchange', updateDropdownPosition);

                return () => {
                    window.removeEventListener('resize', updateDropdownPosition);
                    window.removeEventListener('orientationchange', updateDropdownPosition);
                };
            }, [showSearchResults]);

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

                // Appliquer le tri selon l'option sélectionnée
                if (sortBy === 'urgency') {
                    // Tri par urgence (priorité + temps écoulé)
                    const priorityOrder = { critical: 400, high: 300, medium: 200, low: 100 };
                    filteredTickets.sort((a, b) => {
                        const now = new Date();
                        const hoursA = (now - new Date(a.created_at)) / (1000 * 60 * 60);
                        const hoursB = (now - new Date(b.created_at)) / (1000 * 60 * 60);
                        const scoreA = priorityOrder[a.priority] + hoursA;
                        const scoreB = priorityOrder[b.priority] + hoursB;
                        return scoreB - scoreA; // Score le plus élevé en premier
                    });
                } else if (sortBy === 'oldest') {
                    // Tri par ancienneté (plus ancien en premier)
                    filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                } else if (sortBy === 'scheduled') {
                    // Tri par date planifiée (aujourd'hui/proche en premier)
                    filteredTickets.sort((a, b) => {
                        const hasScheduledA = a.scheduled_date && a.scheduled_date !== 'null';
                        const hasScheduledB = b.scheduled_date && b.scheduled_date !== 'null';

                        // Tickets planifiés en premier
                        if (hasScheduledA && !hasScheduledB) return -1;
                        if (!hasScheduledA && hasScheduledB) return 1;
                        if (!hasScheduledA && !hasScheduledB) return 0;

                        // Comparer les dates planifiées
                        const dateA = parseUTCDate(a.scheduled_date);
                        const dateB = parseUTCDate(b.scheduled_date);
                        return dateA - dateB; // Plus proche en premier
                    });
                }
                // sortBy === 'default' : pas de tri, ordre original

                return filteredTickets;
            };

            // 🔊 Play celebration sound using Web Audio API (0 KB - synthesized)
            const playCelebrationSound = () => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Create three-note ascending ding (C-E-G chord)
                    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                    const now = audioContext.currentTime;
                    
                    notes.forEach((freq, i) => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = freq;
                        oscillator.type = 'sine'; // Smooth tone
                        
                        // Volume envelope: quick fade in/out
                        gainNode.gain.setValueAtTime(0, now + i * 0.08);
                        gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02); // Low volume
                        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
                        
                        oscillator.start(now + i * 0.08);
                        oscillator.stop(now + i * 0.08 + 0.3);
                    });
                } catch (error) {
                    // Silent fail - sound is optional
                    console.log('Audio not available:', error);
                }
            };

            const moveTicketToStatus = async (ticket, newStatus) => {
                if (ticket.status === newStatus) return;

                try {
                    await axios.patch(API_URL + '/tickets/' + ticket.id, {
                        status: newStatus,
                        comment: 'Changement de statut: ' + ticket.status + ' → ' + newStatus
                    });
                    onTicketCreated(); // Refresh
                    
                    // 🎉 Confetti celebration when ticket is completed!
                    if (newStatus === 'completed') {
                        // Visual: Confetti
                        if (typeof confetti !== 'undefined') {
                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 },
                                colors: ['#003B73', '#FFD700', '#C0C0C0', '#4CAF50', '#FF6B6B']
                            });
                        }
                        
                        // Audio: Pleasant "ding" sound
                        playCelebrationSound();
                    }
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

                // Bloquer le menu contextuel uniquement pour les opérateurs
                if (currentUser && currentUser.role === 'operator') {
                    return;
                }


                const menuWidth = 200;
                const menuHeightEstimate = 350; // Estimation hauteur menu (ajuster si besoin)
                // Use clientX/clientY instead of pageX/pageY for position:fixed portal
                let x = e.clientX || (e.touches && e.touches[0].clientX);
                let y = e.clientY || (e.touches && e.touches[0].clientY);
                let openUpward = false;

                // Ajuster horizontalement si déborde à droite
                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                }

                // Vérifier si assez d'espace en bas
                const spaceBelow = window.innerHeight - y;
                const spaceAbove = y;

                // Si pas assez d'espace en bas mais plus d'espace en haut, ouvrir vers le haut
                if (spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow) {
                    openUpward = true;
                    // Positionner le menu au-dessus du curseur
                    y = Math.max(10, y - Math.min(menuHeightEstimate, spaceAbove - 10));
                } else {
                    // Ouvrir vers le bas normalement, mais limiter à l'espace disponible
                    y = Math.min(y, window.innerHeight - 60); // Laisser 60px marge minimale
                }

                setContextMenu({
                    x: x,
                    y: y,
                    ticket: ticket,
                    openUpward: openUpward
                });
            };


            const [draggedTicket, setDraggedTicket] = React.useState(null);
            const [dragOverColumn, setDragOverColumn] = React.useState(null);
            const [sortBy, setSortBy] = React.useState('default'); // default, priority, date, machine


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

            return React.createElement('div', { className: 'min-h-screen' },

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


                React.createElement(PerformanceModal, {
                    show: showPerformanceModal,
                    onClose: () => setShowPerformanceModal(false)
                }),


                React.createElement(OverdueTicketsModal, {
                    show: showOverdueModal,
                    onClose: () => setShowOverdueModal(false),
                    currentUser: currentUser
                }),


                React.createElement(PushDevicesModal, {
                    show: showPushDevicesModal,
                    onClose: () => setShowPushDevicesModal(false)
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
                    onDelete: async (ticketId) => {
                        const confirmed = window.confirm('Supprimer ce ticket definitivement ? Cette action est irreversible.');
                        if (!confirmed) return;

                        try {
                            await axios.delete(API_URL + '/tickets/' + ticketId);
                            // Recharger les données AVANT d'afficher le message de succès
                            await onRefresh();
                            alert('Ticket supprime avec succes');
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    },
                    currentUser: currentUser
                }),


                React.createElement('header', {
                    className: 'shadow-lg border-b-4 border-igp-blue',
                    style: {
                        background: 'rgba(255, 255, 255, 0.40)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderBottom: '4px solid #003366'
                    }
                },
                    React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-3' },
                        React.createElement('div', { className: 'w-full max-w-md mx-auto mb-4' },
                            React.createElement('div', { className: 'relative w-full', style: { zIndex: 99999 } },
                                React.createElement('input', {
                                    ref: searchInputRef,
                                    type: 'text',
                                    placeholder: 'Rechercher ticket, machine, lieu...',
                                    className: 'w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm',
                                    value: searchQuery,
                                    onFocus: () => {
                                        if (searchInputRef.current) {
                                            const rect = searchInputRef.current.getBoundingClientRect();
                                            setSearchDropdownPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: rect.width
                                            });
                                        }
                                    },
                                    onChange: (e) => {
                                        const query = e.target.value;
                                        setSearchQuery(query);
                                        
                                        // Update dropdown position dynamically
                                        if (searchInputRef.current) {
                                            const rect = searchInputRef.current.getBoundingClientRect();
                                            setSearchDropdownPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: rect.width
                                            });
                                        }
                                        
                                        if (searchTimeoutRef.current) {
                                            clearTimeout(searchTimeoutRef.current);
                                        }
                                        if (query.trim().length >= 2) {
                                            setSearchLoading(true);
                                            searchTimeoutRef.current = setTimeout(async () => {
                                                try {
                                                    const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
                                                        headers: {
                                                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                                                        }
                                                    });
                                                    const data = await response.json();
                                                    setSearchResults(data.results || []);
                                                    setShowSearchResults(true);
                                                } catch (err) {
                                                    console.error('Erreur recherche:', err);
                                                } finally {
                                                    setSearchLoading(false);
                                                }
                                            }, 300);
                                        } else {
                                            setSearchResults([]);
                                            setShowSearchResults(false);
                                            setSearchLoading(false);
                                        }
                                    },
                                    onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                                }),
                                React.createElement('i', {
                                    className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                                }),
                                showSearchResults && searchResults.length > 0 && React.createElement('div', {
                                    className: 'fixed left-4 right-4 md:left-auto md:right-auto bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-96 overflow-y-auto',
                                    style: { 
                                        zIndex: 99999,
                                        top: searchDropdownPosition.top + 'px',
                                        left: window.innerWidth < 768 ? '1rem' : searchDropdownPosition.left + 'px',
                                        right: window.innerWidth < 768 ? '1rem' : 'auto',
                                        width: window.innerWidth < 768 ? 'auto' : searchDropdownPosition.width + 'px',
                                        minWidth: window.innerWidth < 768 ? 'auto' : '320px',
                                        maxWidth: '28rem'
                                    }
                                },
                                    searchResults.map((result) =>
                                        React.createElement('div', {
                                            key: result.id,
                                            className: 'p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100',
                                            onClick: (e) => {
                                                setSelectedTicketId(result.id);
                                                setShowDetailsModal(true);
                                                setSearchQuery('');
                                                setShowSearchResults(false);
                                            }
                                        },
                                            React.createElement('div', { className: 'flex justify-between items-start mb-1' },
                                                React.createElement('span', { className: 'font-bold text-gray-800 text-sm' }, result.title),
                                                React.createElement('span', { className: 'text-xs text-gray-500' }, result.ticket_id)
                                            ),
                                            React.createElement('div', { className: 'text-xs text-gray-600' },
                                                React.createElement('i', { className: 'fas fa-cog mr-1' }),
                                                result.machine_type + ' - ' + result.model
                                            ),
                                            React.createElement('div', { className: 'flex items-center gap-2 mt-1' },
                                                result.location && React.createElement('span', { className: 'text-xs text-gray-500' },
                                                    React.createElement('i', { className: 'fas fa-map-marker-alt mr-1' }),
                                                    result.location
                                                ),
                                                result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold' },
                                                    React.createElement('i', { className: 'fas fa-comment mr-1' }),
                                                    result.comments_count + ' commentaire' + (result.comments_count > 1 ? 's' : '')
                                                )
                                            )
                                        )
                                    )
                                ),
                                showSearchResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && !searchLoading && React.createElement('div', {
                                    className: 'fixed left-4 right-4 md:left-auto md:right-auto bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4',
                                    style: { 
                                        zIndex: 99999,
                                        top: searchDropdownPosition.top + 'px',
                                        left: window.innerWidth < 768 ? '1rem' : searchDropdownPosition.left + 'px',
                                        right: window.innerWidth < 768 ? '1rem' : 'auto',
                                        width: window.innerWidth < 768 ? 'auto' : searchDropdownPosition.width + 'px',
                                        minWidth: window.innerWidth < 768 ? 'auto' : '320px',
                                        maxWidth: '28rem'
                                    }
                                },
                                    React.createElement('p', { className: 'text-sm text-gray-500 text-center' },
                                        'Aucun résultat trouvé'
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-6' },
                            React.createElement('div', {
                                className: 'flex items-center space-x-2 md:space-x-3 flex-1 min-w-0',
                                style: {
                                    background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.85) 0%, rgba(224, 242, 254, 0.75) 50%, rgba(186, 230, 253, 0.8) 100%)',
                                    backdropFilter: 'blur(20px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 4px 16px rgba(0, 51, 102, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(186, 230, 253, 0.3)',
                                    border: '2px solid rgba(255, 255, 255, 0.6)',
                                    borderTop: '2px solid rgba(255, 255, 255, 0.9)',
                                    borderLeft: '2px solid rgba(255, 255, 255, 0.8)',
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden'
                                }
                            },
                                React.createElement('div', {
                                    style: {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '50%',
                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
                                        borderRadius: '16px 16px 0 0',
                                        pointerEvents: 'none'
                                    }
                                }),
                                React.createElement('img', {
                                    src: '/api/settings/logo?t=' + Date.now(),
                                    alt: 'IGP Logo',
                                    className: 'h-10 md:h-12 lg:h-16 w-auto object-contain flex-shrink-0',
                                    onError: (e) => {
                                        e.target.src = '/static/logo-igp.png';
                                    }
                                }),
                                React.createElement('div', { 
                                    className: 'pl-2 md:pl-3 flex-1 min-w-0',
                                    style: {
                                        borderLeft: '2px solid rgba(147, 197, 253, 0.5)',
                                        position: 'relative'
                                    }
                                },
                                    React.createElement('h1', {
                                        className: 'text-sm md:text-lg lg:text-xl font-bold break-words',
                                        style: {
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            color: '#1e3a8a',
                                            fontWeight: '900'
                                        },
                                        title: headerTitle
                                    }, headerTitle),
                                    React.createElement('p', {
                                        className: 'text-xs md:text-sm break-words',
                                        style: {
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            color: '#1a1a1a',
                                            fontWeight: '800',
                                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                        },
                                        title: headerSubtitle
                                    },
                                        headerSubtitle
                                    ),
                                    React.createElement('p', {
                                        className: 'text-xs md:text-sm font-semibold mt-1',
                                        style: {
                                            color: '#047857',
                                            fontWeight: '900',
                                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                        }
                                    },
                                        '👋 Bonjour ' + (currentUser?.first_name || currentUser?.email?.split('@')[0] || 'Utilisateur')
                                    ),
                                    React.createElement('div', { className: "flex items-center gap-3 flex-wrap" },
                                        React.createElement('p', {
                                            className: "text-xs font-semibold",
                                            style: {
                                                color: '#1e40af',
                                                fontWeight: '900',
                                                textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                            },
                                            id: 'active-tickets-count'
                                        },
                                            getActiveTicketsCount() + " tickets actifs"
                                        ),
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors',
                                            id: 'overdue-tickets-badge-wrapper',
                                            title: 'Tickets en retard - Cliquer pour voir détails',
                                            onClick: () => setShowOverdueModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                            React.createElement('span', { id: 'overdue-tickets-badge' }, '0 retard')
                                        ) : null,
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors',
                                            id: 'technicians-count-badge-wrapper',
                                            title: 'Techniciens actifs - Cliquer pour voir performance',
                                            onClick: () => setShowPerformanceModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-users mr-1' }),
                                            React.createElement('span', { id: 'technicians-count-badge' }, '0 techs')
                                        ) : null,
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 cursor-pointer hover:bg-green-200 transition-colors',
                                            id: 'push-devices-badge-wrapper',
                                            title: 'Appareils avec notifications push - Cliquer pour voir liste',
                                            onClick: () => setShowPushDevicesModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-mobile-alt mr-1' }),
                                            React.createElement('span', { id: 'push-devices-badge' }, '0 apps')
                                        ) : null,
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
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center md:justify-center gap-2 mt-4 header-actions' },
                            // 1. Nouvelle Demande (action primaire)
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-igp-blue-dark font-semibold shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Demande'
                            ),
                            // 2. Messagerie (le plus utilisé quotidiennement)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'furnace_operator') ?
                            React.createElement('button', {
                                onClick: () => setShowMessaging(true),
                                className: 'px-3 py-1.5 bg-gradient-to-r from-slate-700 to-gray-700 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all flex items-center'
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
                                className: 'px-3 py-1.5 text-sm rounded-md font-semibold shadow-md transition-all flex items-center gap-2 ' +
                                    (showArchived
                                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300')
                            },
                                React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') }),
                                React.createElement('span', {}, showArchived ? 'Masquer' : 'Archivés'),
                                React.createElement('span', {
                                    className: 'px-2 py-0.5 rounded-full text-xs font-bold ' +
                                    (showArchived ? 'bg-gray-500' : 'bg-gray-300 text-gray-700')
                                }, getTicketsByStatus('archived').length)
                            ),
                            // 4. Utilisateurs (gestion admin - moins fréquent)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowUserManagement(true),
                                className: "px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-users-cog mr-2" }),
                                "Utilisateurs"
                            ) : null,
                            // 5. Machines (gestion admin - moins fréquent)
                            (currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowMachineManagement(true),
                                className: "px-3 py-1.5 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-cogs mr-2" }),
                                "Machines"
                            ) : null,
                            // 6. Parametres systeme (admin uniquement)
                            (currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowSystemSettings(true),
                                className: "px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 font-semibold shadow-md transition-all flex items-center"
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
                                className: "px-3 py-1.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all flex items-center",
                                title: 'Gestion des rôles et permissions (Admin)'
                            },
                                React.createElement('i', { className: 'fas fa-shield-alt mr-2' }),
                                'Rôles'
                            ) : null,
                            // 7. Activer notifications push (PWA)
                            // DEBUG: Temporarily remove condition to always show button
                            React.createElement('button', {
                                onClick: async () => {
                                    try {
                                        if (!('Notification' in window)) {
                                            alert('Votre navigateur ne supporte pas les notifications push.');
                                            return;
                                        }

                                        const currentPerm = Notification.permission;

                                        if (currentPerm === 'granted') {
                                            if (!window.subscribeToPush || !window.isPushSubscribed) {
                                                alert('Chargement en cours... Reessayez dans 1 seconde.');
                                                return;
                                            }

                                            // Check if already subscribed for THIS user
                                            const isAlreadySubscribed = await window.isPushSubscribed();
                                            if (isAlreadySubscribed) {
                                                alert('Vous etes deja abonne aux notifications push!');
                                                // Update button color to green since user is subscribed
                                                if (window.updatePushButtonColor) {
                                                    setTimeout(() => window.updatePushButtonColor(), 100);
                                                }
                                                return;
                                            }

                                            const result = await window.subscribeToPush();
                                            if (result.success) {
                                                if (result.updated) {
                                                    alert('Abonnement push deja actif (mis a jour)');
                                                } else {
                                                    alert('Abonnement push enregistre avec succes!');
                                                }
                                                // Update button color after successful subscribe
                                                if (window.updatePushButtonColor) {
                                                    setTimeout(() => window.updatePushButtonColor(), 500);
                                                }
                                            } else {
                                                alert('Erreur: ' + result.error);
                                            }
                                            return;
                                        }

                                        if (currentPerm === 'denied') {
                                            alert('Les notifications ont ete refusees. Allez dans Parametres Android > Apps > IGP > Notifications pour les activer.');
                                            return;
                                        }

                                        const perm = await Notification.requestPermission();

                                        if (perm === 'granted') {
                                            alert('Notifications activees avec succes!');
                                            if (window.initPushNotifications) {
                                                setTimeout(() => window.initPushNotifications(), 1000);
                                            }
                                            window.location.reload();
                                        } else {
                                            alert('Notifications refusees.');
                                            window.location.reload();
                                        }
                                    } catch (e) {
                                        alert('Erreur: ' + e.message);
                                    }
                                },
                                className: (typeof Notification !== 'undefined' && Notification.permission === 'denied')
                                    ? 'px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 shadow-md transition-all animate-pulse flex items-center'
                                    : 'px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 shadow-md transition-all animate-pulse-orange-red flex items-center',
                                style: { minWidth: '155px' }
                            },
                                React.createElement('i', {
                                    className: 'fas fa-bell-slash mr-2'
                                }),
                                'Notifications'
                            ),
                            // 8. Actualiser (utile mais auto-refresh disponible)
                            React.createElement('button', {
                                onClick: onRefresh,
                                className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-blue-800 shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                                'Actualiser'
                            ),
                            // 9. Déconnexion (action de sortie - toujours à la fin)
                            React.createElement('button', {
                                onClick: onLogout,
                                className: 'px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 shadow-md transition-all flex items-center'
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


                React.createElement('div', {
                    className: 'max-w-[1600px] mx-auto px-4 py-6'
                },
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
                                // Dropdown de tri (visible uniquement si plus de 2 tickets)
                                ticketsInColumn.length > 2 ? React.createElement('div', { className: 'mb-3 flex items-center gap-2' },
                                    React.createElement('label', {
                                        className: 'text-xs text-gray-600 font-medium whitespace-nowrap flex items-center gap-1',
                                        htmlFor: 'sort-select-' + status.key
                                    },
                                        React.createElement('i', { className: 'fas fa-sort text-sm' }),
                                        React.createElement('span', { className: 'hidden sm:inline' }, 'Trier:')
                                    ),
                                    React.createElement('select', {
                                        id: 'sort-select-' + status.key,
                                        value: sortBy,
                                        onChange: (e) => setSortBy(e.target.value),
                                        className: 'flex-1 text-sm sm:text-xs px-3 py-2.5 sm:py-1.5 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-0',
                                        onClick: (e) => e.stopPropagation()
                                    },
                                        React.createElement('option', { value: 'default' }, 'Par défaut'),
                                        React.createElement('option', { value: 'urgency' }, '🔥 Urgence (priorité + temps)'),
                                        React.createElement('option', { value: 'oldest' }, '⏰ Plus ancien'),
                                        React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                                    )
                                ) : null,
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
                                            ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status !== 'completed' && ticket.status !== 'archived')) ? React.createElement('div', {
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
                                                    parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', {
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
                                            // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                            (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
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
                                    // Dropdown de tri (visible uniquement si plus de 2 tickets)
                                    ticketsInColumn.length > 2 ? React.createElement('div', { className: 'mb-2 flex items-center gap-2' },
                                        React.createElement('label', {
                                            className: 'text-xs text-gray-600 font-medium whitespace-nowrap',
                                            htmlFor: 'sort-select-' + status.key
                                        },
                                            React.createElement('i', { className: 'fas fa-sort mr-1' }),
                                            'Trier:'
                                        ),
                                        React.createElement('select', {
                                            id: 'sort-select-' + status.key,
                                            value: sortBy,
                                            onChange: (e) => setSortBy(e.target.value),
                                            className: 'flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer',
                                            onClick: (e) => e.stopPropagation()
                                        },
                                            React.createElement('option', { value: 'default' }, 'Par défaut'),
                                            React.createElement('option', { value: 'urgency' }, '🔥 Urgence (priorité + temps)'),
                                            React.createElement('option', { value: 'oldest' }, '⏰ Plus ancien'),
                                            React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                                        )
                                    ) : null,
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
                                                ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status !== 'completed' && ticket.status !== 'archived')) ? React.createElement('div', {
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
                                                        parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', {
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
                                                // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                                (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
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
                                            // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                            (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
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
                    className: 'mt-12 py-6 text-center border-t-4 border-igp-blue',
                    style: {
                        background: 'rgba(255, 255, 255, 0.40)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 -8px 32px 0 rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderTop: '4px solid #003366'
                    }
                },
                    React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4' },
                        React.createElement('p', {
                            className: 'text-sm mb-2',
                            style: {
                                color: '#1a1a1a',
                                fontWeight: '700',
                                textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                            }
                        },
                            React.createElement('i', {
                                className: 'fas fa-code mr-2',
                                style: { color: '#003366' }
                            }),
                            'Application conçue et développée par ',
                            React.createElement('span', {
                                style: {
                                    fontWeight: '900',
                                    color: '#003366',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                }
                            }, "Le département des Technologies de l'Information")
                        ),
                        React.createElement('div', { className: 'flex items-center justify-center gap-4 flex-wrap' },
                            React.createElement('p', {
                                className: 'text-xs',
                                style: {
                                    color: '#1a1a1a',
                                    fontWeight: '700',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                }
                            },
                                '© ' + new Date().getFullYear() + ' - Produits Verriers International (IGP) Inc.'
                            ),
                            React.createElement('span', {
                                style: {
                                    color: '#666666',
                                    fontWeight: '700'
                                }
                            }, '|'),
                            React.createElement('a', {
                                href: '/changelog',
                                className: 'text-xs flex items-center gap-1 transition-colors',
                                style: {
                                    color: '#1e40af',
                                    fontWeight: '800',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                }
                            },
                                React.createElement('i', { className: 'fas fa-history' }),
                                React.createElement('span', {}, 'v2.8.1 - Historique')
                            )
                        )
                    )
                ),

                contextMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
                    React.createElement('div', {
                        style: {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            zIndex: 9999
                        },
                        onClick: () => setContextMenu(null)
                    },
                        React.createElement('div', {
                            className: 'context-menu',
                            style: {
                                position: 'fixed',
                                top: contextMenu.y + 'px',
                                left: contextMenu.x + 'px',
                                zIndex: 10000
                            },
                            onClick: (e) => e.stopPropagation()
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
                        }),
                        // Séparateur avant Supprimer
                        React.createElement('div', { className: 'border-t my-1' }),
                        // Bouton Supprimer dans le menu contextuel (admin/supervisor/technicien, ou opérateur pour ses propres tickets)
                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'technician' ||
                         (currentUser?.role === 'operator' && contextMenu.ticket.reported_by === currentUser?.id)) ?
                        React.createElement('div', {
                            className: 'context-menu-item text-red-600 hover:bg-red-50 font-semibold',
                            onClick: async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Sauvegarder le ticket ID et fermer le menu AVANT la confirmation
                                const ticketId = contextMenu.ticket.id;
                                setContextMenu(null);

                                // Délai pour fermer le menu avant la confirmation
                                await new Promise(resolve => setTimeout(resolve, 100));

                                const confirmed = window.confirm('Supprimer ce ticket definitivement ? Cette action est irreversible.');
                                if (!confirmed) return;

                                try {
                                    await axios.delete(API_URL + '/tickets/' + ticketId);
                                    // Recharger les données AVANT d'afficher le message de succès
                                    await onRefresh();
                                    alert('Ticket supprime avec succes');
                                } catch (error) {
                                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                                }
                            }
                        },
                            React.createElement('i', { className: 'fas fa-trash-alt mr-2' }),
                            'Supprimer le ticket'
                        ) : null,
                        // Bouton Annuler
                        React.createElement('div', { className: 'border-t mt-1' }),
                        React.createElement('div', {
                            className: 'context-menu-item text-gray-600 hover:bg-gray-100 font-semibold text-center',
                            onClick: (e) => {
                                e.stopPropagation();
                                setContextMenu(null);
                            }
                        },
                            React.createElement('i', { className: 'fas fa-times mr-2' }),
                            'Annuler'
                        )
                        )
                    ),
                    document.body
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
            const [headerTitle, setHeaderTitle] = React.useState(companyTitle);
            const [headerSubtitle, setHeaderSubtitle] = React.useState(companySubtitle);

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
                                // Valeur par defaut si erreur
                                localStorage.setItem('timezone_offset_hours', '-5');
                            });
                    }

                    loadData();
                    loadUnreadMessagesCount();

                    // Rafraichir le compteur de messages non lus toutes les 60 secondes (optimisé pour performance Chrome)
                    const messagesInterval = setInterval(() => {
                        loadUnreadMessagesCount();
                    }, 60000);

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

                    // Charger titre et sous-titre personnalisés (public)
                    try {
                        const titleRes = await axios.get(API_URL + '/settings/company_title');
                        if (titleRes.data.setting_value) {
                            companyTitle = titleRes.data.setting_value;
                            setHeaderTitle(titleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Titre par défaut
                    }

                    try {
                        const subtitleRes = await axios.get(API_URL + '/settings/company_subtitle');
                        if (subtitleRes.data.setting_value) {
                            companySubtitle = subtitleRes.data.setting_value;
                            setHeaderSubtitle(subtitleRes.data.setting_value);
                        }
                    } catch (error) {
                        // Sous-titre par défaut
                    }

                    setLoading(false);
                    
                    // Update push button color after data is loaded and UI is ready
                    setTimeout(() => {
                        if (window.updatePushButtonColor) {
                            window.updatePushButtonColor();
                        }
                    }, 500);

                    // Update stats badges immediately after data refresh
                    // This ensures all badges (overdue, technicians, push devices) are instantly updated
                    // when tickets/machines/users change, maintaining consistency with active tickets count
                    setTimeout(() => {
                        if (window.loadSimpleStats) {
                            window.loadSimpleStats();
                        }
                    }, 600);
                } catch (error) {
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
                    // Erreur silencieuse
                }
            };

            const login = async (email, password, rememberMe = false) => {
                try {
                    const response = await axios.post(API_URL + '/auth/login', { email, password, rememberMe });
                    authToken = response.data.token;
                    currentUser = response.data.user;
                    setCurrentUserState(response.data.user);
                    
                    // ✅ Pour backward compatibility: garder le token en localStorage pour API calls
                    localStorage.setItem('auth_token', authToken);
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
                    
                    setIsLoggedIn(true);

                    // ✅ LAW #10: Fire-and-forget pattern (100% non-blocking)
                    // Demande permissions notifications en arrière-plan, ne bloque JAMAIS le login
                    initPushNotificationsSafely();
                    
                    // Update push button color after login to reflect ownership
                    setTimeout(() => {
                        if (window.updatePushButtonColor) {
                            window.updatePushButtonColor();
                        }
                    }, 3000);
                } catch (error) {
                    alert('Erreur de connexion: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            };

            // ✅ Initialiser l'état des notifications push après login (SANS demander permission)
            // Cette fonction vérifie uniquement l'état actuel et met à jour le bouton
            // L'utilisateur doit cliquer manuellement sur "Notifications" pour s'abonner
            const initPushNotificationsSafely = () => {
                setTimeout(() => {
                    // Vérifier que l'API existe
                    if (!('Notification' in window)) {
                        console.log('[PUSH] Notification API non disponible');
                        return;
                    }
                    
                    // Appeler initPushNotifications qui vérifie l'état et met à jour le bouton
                    // (ne demande PLUS automatiquement la permission)
                    if (window.initPushNotifications) {
                        console.log('[PUSH] Initialisation état push (vérification uniquement)');
                        setTimeout(() => window.initPushNotifications(), 2000);
                    }
                        
                }, 100);  // Petit délai pour garantir que le login est terminé
            };

            const logout = async () => {
                try {
                    // ✅ Appeler l'endpoint backend pour effacer le cookie HttpOnly
                    await axios.post(API_URL + '/auth/logout');
                } catch (error) {
                    // Erreur non-bloquante
                }
                
                // Nettoyage local
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
                onRefreshMessages: loadUnreadMessagesCount,
                headerTitle: headerTitle,
                headerSubtitle: headerSubtitle
            });
        };


        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));

        // Simple stats loader - no React state, just direct DOM update
        window.loadSimpleStats = function() {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            axios.get('/api/stats/active-tickets', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(response => {
                // Update active tickets count
                const activeCount = response.data.activeTickets;
                const activeElement = document.getElementById('active-tickets-count');
                if (activeElement && activeCount !== undefined) {
                    activeElement.textContent = activeCount + ' tickets actifs (Global)';
                }

                // Update overdue tickets badge
                const overdueCount = response.data.overdueTickets;
                const overdueElement = document.getElementById('overdue-tickets-badge');
                const overdueWrapper = document.getElementById('overdue-tickets-badge-wrapper');
                if (overdueElement && overdueCount !== undefined) {
                    overdueElement.textContent = overdueCount + ' retard';
                    // Change color if there are overdue tickets
                    if (overdueWrapper && overdueCount > 0) {
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 cursor-pointer hover:bg-red-200 transition-colors animate-pulse';
                    } else if (overdueWrapper) {
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors';
                    }
                }

                // Update technicians count badge
                const techCount = response.data.activeTechnicians;
                const techElement = document.getElementById('technicians-count-badge');
                if (techElement && techCount !== undefined) {
                    techElement.textContent = techCount + ' techs';
                }

                // Update push devices badge
                const pushCount = response.data.pushDevices;
                const pushElement = document.getElementById('push-devices-badge');
                if (pushElement && pushCount !== undefined) {
                    pushElement.textContent = pushCount + ' apps';
                }
            })
            .catch(error => {
                // Silently fail - keep showing local count
                console.log('[Stats] Could not load global stats');
            });
        };

        // Load stats once after a short delay (let app render first)
        setTimeout(() => {
            if (window.loadSimpleStats) {
                window.loadSimpleStats();
            }
        }, 2000);

        // Auto-refresh stats every 60 seconds for real-time updates
        // Uses same technique as unread messages counter (line 8051)
        // Direct DOM manipulation ensures no visual flickering
        setInterval(() => {
            if (window.loadSimpleStats) {
                window.loadSimpleStats();
            }
        }, 60000); // 60 seconds

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



// Route du guide utilisateur
app.get('/guide', (c) => {
  return c.html(guideHTML);
});

// Route historique (redirection vers changelog)
app.get('/historique', (c) => {
  return c.redirect('/changelog');
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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        html {
            scroll-behavior: smooth;
        }

        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
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
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }

        .version-card:hover {
            background: rgba(255, 255, 255, 0.65);
            transform: translateY(-2px);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.20);
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
        <a href="/" class="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold transition-all shadow-lg" style="background: linear-gradient(145deg, #3b82f6, #2563eb);">
            <i class="fas fa-times"></i>
            <span class="hidden md:inline">Fermer</span>
        </a>
    </div>

    <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="p-6 md:p-8 mb-8" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 12px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.6);">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-history text-blue-600 mr-3"></i>
                        Historique des Versions
                    </h1>
                    <p class="text-gray-600">Système de Gestion de Maintenance IGP</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600">v2.8.1</div>
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
            <!-- Version 2.8.1 - ACTUELLE -->
            <div class="timeline-item" data-version="2.8.1" data-types="feature design">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                    <i class="fas fa-sparkles"></i>
                </div>
                <div class="version-card">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Version 2.8.1</h2>
                        </div>
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTUELLE</span>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-book text-blue-500 mr-2"></i>
                                Guide Utilisateur Premium
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Table des matières avec design neomorphique</li>
                                <li>• Icônes FontAwesome professionnelles</li>
                                <li>• Navigation bidirectionnelle intelligente ⬆️⬇️</li>
                                <li>• Glassmorphism et animations premium</li>
                                <li>• 8 sections détaillées (tickets, kanban, messages, etc.)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-phone text-green-500 mr-2"></i>
                                Support & Contact
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Contact direct: Salah (514-462-2889)</li>
                                <li>• Formulaire Formcan intégré</li>
                                <li>• Documentation compatibilité audio/push iOS</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-mobile text-purple-500 mr-2"></i>
                                Améliorations UX Mobile
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Bouton scroll intelligent (adapte direction selon position)</li>
                                <li>• 7 breakpoints responsive (320px à 4K)</li>
                                <li>• Touch targets WCAG 2.1 AA (44x44px minimum)</li>
                                <li>• Gain temps navigation: 90%</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Design Premium</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.8.0 -->
            <div class="timeline-item" data-version="2.8.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.8.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Guide Utilisateur Complet
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Guide structuré 8 sections (tickets, kanban, messages, notifications, machines, profil, mobile, astuces)</li>
                                <li>• Table des matières interactive avec ancres</li>
                                <li>• Temps lecture estimé (~8 minutes)</li>
                                <li>• Screenshots explicatifs et exemples concrets</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations Documentation
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Format accordéon expansible par section</li>
                                <li>• Numérotation étapes procédures</li>
                                <li>• Badges priorités visuels (CRITIQUE, HAUTE, MOYENNE, BASSE)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.20 -->
            <!-- Version 2.7.0 -->
            <div class="timeline-item" data-version="2.7.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                    <i class="fas fa-compress"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.7.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Compression Images WebP
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Conversion automatique images en WebP</li>
                                <li>• Réduction 60% poids fichiers</li>
                                <li>• Qualité préservée (90% compression)</li>
                                <li>• Fallback JPEG pour navigateurs anciens</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="2.0.20" data-types="improvement fix">
            <!-- Version 2.6.0 -->
            <div class="timeline-item" data-version="2.6.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <i class="fas fa-tablet-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.6.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Responsive Design iPad
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Optimisation layout tablettes (768px-1024px)</li>
                                <li>• Kanban 3 colonnes sur iPad paysage</li>
                                <li>• Touch gestures améliorés drag & drop</li>
                                <li>• Clavier virtuel ne masque plus le contenu</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.5.0 -->
            <div class="timeline-item" data-version="2.5.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                    <i class="fas fa-mobile-screen"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.5.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                PWA et Service Worker
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Application Progressive Web App complète</li>
                                <li>• Installation sur écran d'accueil (iOS/Android)</li>
                                <li>• Mode hors ligne basique (lecture cache)</li>
                                <li>• Manifest.json avec icônes adaptatives</li>
                                <li>• Thème couleur IGP intégré</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.4.0 -->
            <div class="timeline-item" data-version="2.4.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.4.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Optimisations Performance
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Chargement lazy des images galeries</li>
                                <li>• Pagination conversations (50 messages/page)</li>
                                <li>• Cache local données machines (IndexedDB)</li>
                                <li>• Réduction 40% temps chargement initial</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.3.0 -->
            <div class="timeline-item" data-version="2.3.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.3.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Design Glassmorphism Kanban
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Colonnes Kanban avec effet vitreux (backdrop-filter blur)</li>
                                <li>• Cartes tickets redesignées (shadows premium)</li>
                                <li>• Animations transitions fluides</li>
                                <li>• Couleurs IGP harmonisées (bleu #1e40af, orange #ea580c)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.2.0 -->
            <div class="timeline-item" data-version="2.2.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-lime-600 to-lime-700 text-white">
                    <i class="fas fa-filter"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.2.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Filtres Kanban Avancés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Filtres persistants sauvegardés par utilisateur</li>
                                <li>• Vue personnalisée "Mes tickets"</li>
                                <li>• Filtre par machine avec multi-sélection</li>
                                <li>• Compteurs temps réel par filtre actif</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.1.0 -->
            <div class="timeline-item" data-version="2.1.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-search-plus"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.1.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Recherche Globale Avancée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Recherche multi-critères (tickets, machines, utilisateurs)</li>
                                <li>• Filtres avancés : statut, priorité, technicien, date</li>
                                <li>• Auto-complétion temps réel</li>
                                <li>• Historique 5 dernières recherches</li>
                                <li>• Insensible aux accents français</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-shield-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.20</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Sécurité Renforcée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Session timeout 24h (auto-logout)</li>
                                <li>• Validation CSRF tokens</li>
                                <li>• Headers sécurité HTTP (CSP, HSTS)</li>
                                <li>• Rate limiting API (100 req/min)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Faille XSS dans commentaires</li>
                                <li>• Fix: Permissions tickets partagés</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                        <span class="badge badge-security"><i class="fas fa-lock"></i> Sécurité</span>
                    </div>
                </div>
            </div>


            <!-- Version 2.0.19 -->
            <div class="timeline-item" data-version="2.0.19" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.19</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Étiquettes Personnalisées
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Tags personnalisés pour tickets</li>
                                <li>• Couleurs configurables</li>
                                <li>• Filtre par étiquettes</li>
                                <li>• Multi-tags par ticket</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.18 -->
            <div class="timeline-item" data-version="2.0.18" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-list-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.18</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Tri et Organisation Tickets
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Tri par priorité, date, machine</li>
                                <li>• Groupement par technicien ou statut</li>
                                <li>• Préférence tri sauvegardée</li>
                                <li>• Vue compacte/étendue</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.17 -->
            <div class="timeline-item" data-version="2.0.17" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-fuchsia-600 to-fuchsia-700 text-white">
                    <i class="fas fa-file-export"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.17</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Export Données
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Export tickets au format CSV</li>
                                <li>• Export historique machine PDF</li>
                                <li>• Filtres personnalisés avant export</li>
                                <li>• Téléchargement direct navigateur</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.16 -->
            <div class="timeline-item" data-version="2.0.16" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-palette"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.16</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Thème Sombre (Beta)
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Mode sombre expérimental</li>
                                <li>• Activation via paramètres profil</li>
                                <li>• Contraste optimisé WCAG AAA</li>
                                <li>• Préférence sauvegardée localement</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.15 -->
            <div class="timeline-item" data-version="2.0.15" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                    <i class="fas fa-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.15</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UI/UX
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Redesign badges priorité plus visibles</li>
                                <li>• Icônes statuts tickets harmonisées</li>
                                <li>• Tooltips informatifs sur hover</li>
                                <li>• Animations micro-interactions</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Affichage dates sur mobile Safari</li>
                                <li>• Fix: Scroll modal galerie images</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.14 -->
            <div class="timeline-item" data-version="2.0.14" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.14</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Raccourcis Clavier Améliorés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ctrl+N : Créer nouveau ticket</li>
                                <li>• Ctrl+M : Ouvrir messagerie</li>
                                <li>• Ctrl+K : Recherche globale</li>
                                <li>• Escape : Fermer modales/dialogs</li>
                                <li>• Guide raccourcis accessible via "?"</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.13 -->
            <div class="timeline-item" data-version="2.0.13" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                    <i class="fas fa-video"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.13</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Support Vidéos Tickets
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Upload vidéos (MP4, MOV, max 50MB)</li>
                                <li>• Prévisualisation vidéo intégrée (player HTML5)</li>
                                <li>• Compression automatique pour optimiser stockage</li>
                                <li>• Galerie médias unifiée (photos + vidéos)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.12 -->
            <div class="timeline-item" data-version="2.0.12" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-sky-600 to-sky-700 text-white">
                    <i class="fas fa-history"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.12</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Historique des Modifications
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Changelog complet avec timeline visuelle</li>
                                <li>• Filtres par type (fonctionnalités, améliorations, corrections)</li>
                                <li>• Design glassmorphism cohérent avec l'application</li>
                                <li>• Badges version avec statut ACTUELLE</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.11 -->
            <div class="timeline-item" data-version="2.0.10" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-check-double"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.11</h2>
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

            <!-- Version 2.0.10 -->
            <div class="timeline-item" data-version="2.0.10" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.10</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UX Bulk Operations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Animations fluides lors sélection/désélection multiple</li>
                                <li>• Feedback visuel améliored (highlights, transitions)</li>
                                <li>• Progress bar suppression batch (affichage X/Y messages)</li>
                                <li>• Confirmation modale avec récapitulatif avant suppression</li>
                                <li>• Raccourcis clavier : Ctrl+A (tout), Escape (annuler)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Désélection automatique après suppression batch</li>
                                <li>• Fix: Compteur sélection incorrect après filtrage</li>
                                <li>• Fix: Conflit permissions sur messages partagés multi-utilisateurs</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Itération UX basée sur feedback utilisateurs post-lancement v2.0.9.
                                Corrections issues critiques identifiées durant tests utilisateurs (15 opérateurs).
                                Phase finale avant lancement fonctionnalité sélection rapide v2.0.11.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
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

            <!-- Version 2.0.5 -->
            <div class="timeline-item" data-version="2.0.5" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.5</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Messagerie Avancée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Enregistrement messages vocaux (format adaptatif MP3/MP4/WebM)</li>
                                <li>• Player audio intégré avec contrôles lecture</li>
                                <li>• Upload fichiers multiples (documents, images)</li>
                                <li>• Prévisualisation médias avant envoi</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UX
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Interface messagerie redesignée (style glassmorphism)</li>
                                <li>• Auto-scroll vers nouveaux messages</li>
                                <li>• Horodatage format québécois (JJ-MM-AAAA HH:MM)</li>
                                <li>• Indicateurs lecture/non-lu par utilisateur</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.4 -->
            <div class="timeline-item" data-version="2.0.4" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.4</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Système de Notifications Push
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Notifications temps réel pour nouveaux tickets</li>
                                <li>• Alertes changements statut tickets assignés</li>
                                <li>• Notifications nouveaux messages conversations</li>
                                <li>• Support PWA (installation requise sur iOS)</li>
                                <li>• Badge compteur non-lus dans barre navigation</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-mobile-alt text-purple-500 mr-2"></i>
                                Configuration
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Activation/désactivation par utilisateur</li>
                                <li>• Paramètres granulaires par type notification</li>
                                <li>• Instructions installation PWA intégrées</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.3 -->
            <div class="timeline-item" data-version="2.0.3" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.3</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Optimisations Performance
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Chargement lazy des images galeries tickets</li>
                                <li>• Pagination conversations messagerie (50 messages/page)</li>
                                <li>• Cache local données machines (IndexedDB)</li>
                                <li>• Réduction 40% temps chargement initial</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Crash mobile lors upload vidéos volumineuses</li>
                                <li>• Fix: Doublons notifications push</li>
                                <li>• Fix: Perte focus champ recherche machines</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.2 -->
            <div class="timeline-item" data-version="2.0.2" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Profil Utilisateur Enrichi
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Page profil avec statistiques personnelles</li>
                                <li>• Tableau de bord : tickets créés/assignés/résolus</li>
                                <li>• Historique activités (30 derniers jours)</li>
                                <li>• Changement mot de passe sécurisé</li>
                                <li>• Paramètres préférences utilisateur (langue, thème)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Avatar utilisateur personnalisable</li>
                                <li>• Validation email format québécois</li>
                                <li>• Indicateur force mot de passe en temps réel</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.1 -->
            <div class="timeline-item" data-version="2.0.1" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-comments-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Messagerie Interne (MVP)
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Système conversations entre utilisateurs</li>
                                <li>• Messages texte temps réel</li>
                                <li>• Liste conversations avec preview dernier message</li>
                                <li>• Compteur messages non-lus</li>
                                <li>• Recherche conversations par nom utilisateur</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Lancement phase 1 messagerie après 3 mois développement infrastructure temps réel.
                                Base WebSocket établie pour futures features (notifications, collaboration temps réel).
                                MVP testé avec 20+ utilisateurs pilotes sur 2 semaines.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.2 -->
            <div class="timeline-item" data-version="1.9.2" data-types="feature improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-archive"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.2</h2>
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

            <!-- Version 1.9.1 -->
            <div class="timeline-item" data-version="1.9.1" data-types="fix">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-tools"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Hotfix Critique
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Timers se désynchronisant après 24h inactivité</li>
                                <li>• Fix: Indicateur urgence incorrect pour tickets créés manuellement</li>
                                <li>• Fix: Colonne archives ne s'affichant pas correctement sur iPad</li>
                                <li>• Fix: Performance dégradée avec plus de 50 tickets ouverts</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.0 -->
            <div class="timeline-item" data-version="1.9.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.0</h2>
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
                                <li>• Toggle pour afficher/masquer colonne archive</li>
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
                                <li>• Layout desktop optimisé (6 colonnes 5+1)</li>
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
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.5</h2>
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

            <!-- Version 1.8.4 -->
            <div class="timeline-item" data-version="1.8.4" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.4</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Raccourcis Clavier
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ctrl+N : Créer nouveau ticket</li>
                                <li>• Ctrl+M : Ouvrir messagerie</li>
                                <li>• Ctrl+K : Recherche globale</li>
                                <li>• Escape : Fermer modales/dialogs</li>
                                <li>• Guide raccourcis accessible via "?" (touche point d'interrogation)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.3 -->
            <div class="timeline-item" data-version="1.8.3" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.3</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations Visuelles
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Redesign cartes tickets (shadows, borders premium)</li>
                                <li>• Animations transitions fluides entre colonnes Kanban</li>
                                <li>• Icônes priorités redesignées (plus visibles)</li>
                                <li>• Couleurs IGP harmonisées (bleu #1e40af, orange #ea580c)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.2 -->
            <div class="timeline-item" data-version="1.8.2" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-yellow-600 to-yellow-700 text-white">
                    <i class="fas fa-search"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Recherche Améliorée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Recherche globale multi-critères (tickets, machines, utilisateurs)</li>
                                <li>• Filtres avancés : statut, priorité, technicien, date</li>
                                <li>• Suggestions auto-complétion temps réel</li>
                                <li>• Historique recherches récentes (5 dernières)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Recherche insensible aux accents français</li>
                                <li>• Fix: Résultats dupliqués sur critères multiples</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.1 -->
            <div class="timeline-item" data-version="1.8.1" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-lime-600 to-lime-700 text-white">
                    <i class="fas fa-filter"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Filtres Kanban Avancés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Filtres persistants (sauvegardés par utilisateur)</li>
                                <li>• Vue personnalisée par technicien ("Mes tickets")</li>
                                <li>• Filtre par machine avec multi-sélection</li>
                                <li>• Compteurs temps réel par filtre actif</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.0 -->
            <div class="timeline-item" data-version="1.8.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.0</h2>
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
            <div class="timeline-item" data-version="1.7.0" data-types="feature security">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.7.0</h2>
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
                                <i class="fas fa-lock text-red-500 mr-2"></i>
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
            <div class="timeline-item" data-version="1.6.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-images"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.6.0</h2>
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

            <!-- Versions antérieures -->
            <div class="timeline-item" data-version="1.5.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.5.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Système de commentaires</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.4.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.4.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Menu contextuel</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.3.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-cogs"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.3.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Gestion des machines</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.2.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-columns"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.2.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Interface Kanban drag & drop</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.1.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-plug"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.1.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• API REST complète</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.0.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-yellow-600 to-yellow-700 text-white">
                    <i class="fas fa-rocket"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.0.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Lancement initial</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
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
                            ENVIRONNEMENT DE TEST
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
app.get('/api/stats/active-tickets', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Only admins and supervisors can see stats
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
      return c.json({ error: 'Accès refusé' }, 403);
    }

    // Count active tickets (not completed, not cancelled, not archived)
    const activeResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
    `).first();

    // Count overdue tickets (scheduled_date in the past)
    const overdueResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
        AND scheduled_date IS NOT NULL
        AND datetime(scheduled_date) < datetime('now')
    `).first();

    // Count active technicians (only real technicians, exclude system team account)
    const techniciansResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'technician'
        AND id != 0
    `).first();

    // Count registered push notification devices
    const pushDevicesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM push_subscriptions
    `).first();

    return c.json({
      activeTickets: (activeResult as any)?.count || 0,
      overdueTickets: (overdueResult as any)?.count || 0,
      activeTechnicians: (techniciansResult as any)?.count || 0,
      pushDevices: (pushDevicesResult as any)?.count || 0
    });
  } catch (error) {
    console.error('[Stats API] Error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ========================================
// STATS API - Technicians Performance
// ========================================
app.get('/api/stats/technicians-performance', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Only admins and supervisors can see performance stats
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
      return c.json({ error: 'Accès refusé' }, 403);
    }

    // Get top 3 technicians by completed tickets (last 30 days)
    const topTechnicians = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.full_name,
        COUNT(t.id) as completed_count
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id 
        AND t.status = 'completed'
        AND t.completed_at >= datetime('now', '-30 days')
      WHERE u.role = 'technician' 
        AND u.id != 0
      GROUP BY u.id
      ORDER BY completed_count DESC
      LIMIT 3
    `).all();

    return c.json({
      topTechnicians: topTechnicians.results || []
    });
  } catch (error) {
    console.error('[Performance Stats API] Error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// API: Push subscriptions list
app.get('/api/push/subscriptions-list', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Only admins and supervisors can see subscriptions list
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
      return c.json({ error: 'Accès refusé' }, 403);
    }

    // Get all push subscriptions with user info
    const subscriptions = await c.env.DB.prepare(`
      SELECT 
        ps.id,
        ps.user_id,
        ps.endpoint,
        ps.device_type,
        ps.device_name,
        ps.created_at,
        u.full_name as user_full_name,
        u.email as user_email,
        u.role as user_role
      FROM push_subscriptions ps
      LEFT JOIN users u ON ps.user_id = u.id
      ORDER BY ps.created_at DESC
    `).all();

    return c.json({
      subscriptions: subscriptions.results || []
    });
  } catch (error) {
    console.error('[Push Subscriptions List API] Error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.8.0'
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
