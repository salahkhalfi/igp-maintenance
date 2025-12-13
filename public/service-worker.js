/**
 * Service Worker pour PWA Maintenance IGP
 * Gère le cache des assets statiques et les notifications push
 * Version: v1.1.3 (Online First - Performance Optimized)
 */

const CACHE_VERSION = 'v1.1.3';
const CACHE_NAME = `maintenance-igp-${CACHE_VERSION}`;

// Fichiers critiques à mettre en cache pour la performance (App Shell)
const STATIC_ASSETS = [
    '/',
    '/static/styles.css',
    '/static/maintenance-bg-premium.jpg',
    '/favicon.ico',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json',
    '/static/logo-igp.png',
    '/static/js/utils.js',
    '/push-notifications.js',
    '/static/js/components/App.js',
    '/static/js/components/MainApp.js',
    '/static/js/components/AppHeader.js',
    '/static/js/components/LoginForm.js',
    '/static/js/components/TicketDetailsModal.js',
    '/static/js/components/CreateTicketModal.js',
    '/static/js/components/MessagingSidebar.js',
    '/static/js/components/MessagingChatWindow.js'
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
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2|ico)$/) ||
    url.pathname.includes('/static/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Mise à jour du cache si succès
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
        }).catch(err => {
            // Erreur silencieuse en background
            // console.log('[SW] Background update failed', err);
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
      event.respondWith(fetch(event.request));
      return;
  }

  // Par défaut: Network Only
  event.respondWith(fetch(event.request));
});

// Réception de notifications push
self.addEventListener('push', (event) => {
  // ... (Code existant conservé)
  console.log('[SW] Push received');
  
  let data = { title: 'Maintenance IGP', body: 'Nouvelle notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const isCall = data.data?.isCall === true;

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: data.data || {},
    vibrate: isCall ? [500, 200, 500, 200, 500] : [200, 100, 200],
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
    requireInteraction: isCall, 
    actions: data.actions || []
  };
  
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
              client.postMessage({
                  type: 'PLAY_NOTIFICATION_SOUND',
                  isCall: isCall
              });
          });
      })
    ])
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
