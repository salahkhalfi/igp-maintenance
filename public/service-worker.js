/**
 * Service Worker pour PWA Maintenance IGP
 * Gère le cache offline et les notifications push
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `maintenance-igp-${CACHE_VERSION}`;

// Fichiers à mettre en cache pour mode offline (optionnel - désactivé pour éviter erreurs)
// Le cache dynamique sera utilisé automatiquement lors de la navigation
const STATIC_CACHE = [];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  // Pas de cache statique initial - utilisation du cache dynamique uniquement
  // Cela évite les erreurs si des fichiers n'existent pas
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache ready (dynamic caching enabled)');
      // Ne pas cacher de fichiers au démarrage
      return Promise.resolve();
    })
  );
  
  // Activer immédiatement le nouveau service worker
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
  
  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

// Stratégie de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse si succès et type approprié
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          }).catch((err) => {
            // Ignorer les erreurs de cache silencieusement
            console.log('[SW] Cache write failed (non-critical):', err.message);
          });
        }
        return response;
      })
      .catch((error) => {
        // Si réseau échoue, essayer le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si pas de cache, retourner une erreur réseau normale
          // (ne pas afficher de popup d'erreur)
          console.log('[SW] Network failed, no cache available:', event.request.url);
          throw error;
        });
      })
  );
});

// Réception de notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'Maintenance IGP', body: 'Nouvelle notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: data.data?.ticketId || 'default',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  // Ouvrir l'URL du ticket si disponible
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, l'utiliser
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
