/**
 * Service Worker pour PWA MaintenanceOS
 * 
 * ⚠️ AVERTISSEMENT IMPORTANT:
 * Ce Service Worker NE FOURNIT PAS de fonctionnalité hors-ligne pour l'application.
 * Il cache UNIQUEMENT les assets statiques (JS, CSS, images) pour la performance.
 * Les données métier (tickets, machines, utilisateurs) NÉCESSITENT une connexion internet.
 * 
 * 🚫 NE PAS TENTER D'IMPLÉMENTER LE MODE OFFLINE - Les tentatives passées ont causé des instabilités.
 * 
 * Version: v3.1.6 (Online First - NO OFFLINE MODE)
 */

const CACHE_VERSION = 'v3.1.9-tv-button';
const CACHE_NAME = `maintenance-os-${CACHE_VERSION}`;

// Fichiers critiques à mettre en cache pour la performance (App Shell)
// NOTE: Ne lister QUE les fichiers qui existent réellement
const STATIC_ASSETS = [
    '/',
    '/static/styles.css',
    '/static/maintenance-bg-premium.jpg',
    '/favicon.ico',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json',
    '/static/logo.png',
    '/push-notifications.js',
    // Core App Components (verified to exist)
    '/static/js/components/App.js',
    '/static/js/components/MainApp.js',
    '/static/js/components/AppHeader.js',
    '/static/js/components/LoginForm.js',
    '/static/js/components/KanbanBoard.js',
    '/static/js/components/CreateTicketModal.js',
    '/static/js/components/TicketDetailsModal.js',
    '/static/js/components/MachineManagementModal.js',
    '/static/js/components/AIChatModal_v4.js',
    '/static/js/components/OfflineBanner.js'
    // NOTE: MessagingSidebar & MessagingChatWindow are bundled in /messenger/
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      // Tentative de cache des assets critiques
      // Utilisation de map + catch pour qu'un seul échec ne bloque pas tout
      const promises = STATIC_ASSETS.map(url => 
        cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
      );
      return Promise.all(promises);
    })
  );
  
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Stratégie de cache:
// 1. Navigation (HTML) -> Network First, Fallback Cache
// 2. Assets statiques (JS, CSS, IMG) -> Stale-While-Revalidate (Cache First, puis update background)
// 3. API -> Network First, Fallback Cache (pour lecture seule)
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. NAVIGATION (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            if (response) return response;
            // Fallback générique si offline et pas de cache spécifique (ex: /messenger -> /messenger/index.html)
            if (url.pathname.startsWith('/messenger')) {
                return caches.match('/messenger');
            }
            return caches.match('/');
          });
        })
    );
    return;
  }

  // 2. ASSETS STATIQUES (JS, CSS, Images, Fonts)
  // Utilisation de Stale-While-Revalidate pour rapidité + mise à jour
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2|ico|mp3|json)$/) ||
    url.pathname.includes('/static/') ||
    url.pathname.includes('/messenger/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Mise à jour du cache si succès
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
        }).catch(err => {
            // Erreur silencieuse en background
            // console.log('[SW] Background update failed', err);
            
            // CRITICAL FIX: If both cache and network fail (offline + no cache), return 404 or basic response
            // This prevents "Failed to convert value to Response"
            return new Response('', { status: 404, statusText: 'Not Found (Offline)' });
        });

        // Retourner le cache immédiatement s'il existe, sinon attendre le réseau
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2.5 IMAGES/ASSETS API (Cache First / Stale-While-Revalidate)
  if (url.pathname.includes('/api/auth/avatar') || url.pathname.includes('/api/v2/chat/asset')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Return cached response immediately if available (Cache First)
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            // Network failed - Just rely on cache or fail gracefully
            console.log('[SW] Avatar/Asset fetch offline fallback');
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. API (Network Only - No Cache for Online First AI)
  // On ne met JAMAIS en cache les réponses API pour éviter les conflits avec le mode Online
  if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(event.request).catch(error => {
            console.log('[SW] API Fetch failed (offline):', url.pathname);
            // CRITICAL FIX: Ensure we ALWAYS return a Response object
            return new Response(JSON.stringify({ 
                error: 'offline', 
                message: 'Vous êtes hors ligne. Veuillez vérifier votre connexion.' 
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        })
      );
      return;
  }

  // Par défaut: Network Only
  event.respondWith(
    fetch(event.request).catch(() => {
        // Fallback ultime pour éviter le crash "Failed to convert value to Response"
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

// Réception de notifications push
self.addEventListener('push', (event) => {
  // ... (Code existant conservé)
  console.log('[SW] Push received');
  
  let data = { title: 'MaintenanceOS', body: 'Nouvelle notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const isCall = data.data?.isCall === true;
  const isCritical = data.data?.priority === 'critical' || data.data?.priority === 'high';
  const isTicket = data.data?.ticketId || data.data?.ticket_id;

  // INDUSTRIAL MODE: Stronger vibration patterns for noisy environments
  // Format: [vibrate, pause, vibrate, pause, ...] in milliseconds
  let vibratePattern;
  if (isCall) {
    // Appel: vibration longue et répétée (5 cycles)
    vibratePattern = [500, 200, 500, 200, 500, 200, 500, 200, 500];
  } else if (isCritical && isTicket) {
    // Ticket CRITIQUE: vibration très forte et insistante (attention urgente)
    vibratePattern = [800, 200, 800, 200, 800, 400, 300, 100, 300, 100, 300];
  } else if (isTicket) {
    // Ticket normal: vibration modérée mais notable
    vibratePattern = [400, 150, 400, 150, 400];
  } else {
    // Message standard: vibration légère
    vibratePattern = [200, 100, 200];
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: data.data || {},
    vibrate: vibratePattern,
    tag: isCall 
      ? `call-${Date.now()}`
      : data.data?.conversationId // Use conversation ID to group messages correctly (prevent stacking issues)
        ? `conv-${data.data.conversationId}` 
        : `notif-${Date.now()}`,
    renotify: true, // IMPORTANT: Allows sound/vibrate for subsequent messages in same conversation
    silent: false,  
    sound: '/static/notification.mp3', // Note: Only works on some browsers/Android versions
    timestamp: Date.now(), 
    priority: 2, 
    requireInteraction: isCall || isCritical, // Keep critical notifications visible until acknowledged
    actions: data.actions || []
  };
  
  event.waitUntil(
    (async () => {
      // 1. Show the notification
      await self.registration.showNotification(data.title, options);
      
      // 2. Try to play sound via existing clients
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      
      if (clients.length > 0) {
        // App is open - send message to play sound
        clients.forEach(client => {
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            isCall: isCall,
            isCritical: isCritical
          });
        });
      } else {
        // APP IS CLOSED - Try to open a minimal window to play sound (experimental)
        // This works on some browsers when the PWA is installed
        console.log('[SW] No clients found, attempting sound wake-up...');
        try {
          // Open a minimal sound player page that auto-closes
          // Only for critical/high priority to avoid spam
          if (isCritical || isCall) {
            const soundUrl = `/sound-player.html?priority=${isCritical ? 'critical' : 'normal'}&autoclose=true`;
            await self.clients.openWindow(soundUrl);
          }
        } catch (e) {
          console.log('[SW] Could not open sound window:', e.message);
        }
      }
    })()
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action || notificationData.action; 
  
  let urlToOpen = notificationData.url || '/';
  
  if (notificationData.conversationId) {
    urlToOpen = `/messenger?conversationId=${notificationData.conversationId}`;
  }
  else if ((action === 'view_ticket' || action === 'view') && (notificationData.ticketId || notificationData.ticket_id)) {
    const tid = notificationData.ticketId || notificationData.ticket_id;
    urlToOpen = `/?ticket=${tid}`;
  }
  else if (action === 'acknowledge' && notificationData.ticketId) {
    urlToOpen = `/?ticket=${notificationData.ticketId}&auto_action=acknowledge`;
  }
  else if (action === 'new_audio_message' && notificationData.messageId) {
    urlToOpen = `/?openAudioMessage=${notificationData.messageId}&sender=${notificationData.senderId}`;
  }
  else if (action === 'new_private_message' && notificationData.senderId) {
    urlToOpen = `/?openMessages=${notificationData.senderId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (action === 'view_ticket' || action === 'view' || action === 'acknowledge' || action === 'new_audio_message' || action === 'new_private_message' || action === 'open') {
          if (clients.openWindow) {
              return clients.openWindow(urlToOpen);
          }
      }

      const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];

      if (client) {
        const navigatePromise = client.navigate(urlToOpen);

        if ('focus' in client) {
          client.focus().catch(err => console.log('[SW] Focus denied (non-critical):', err));
        }
        
        client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: action,
            data: { 
                ...notificationData, 
                auto_action: action === 'acknowledge' ? 'acknowledge' : null 
            }
        });

        return navigatePromise;
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
