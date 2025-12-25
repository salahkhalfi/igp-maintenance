/**
 * Service Worker pour PWA Connect (Messenger)
 * 
 * Ce SW est SÉPARÉ de l'app principale pour permettre l'installation indépendante
 * 
 * Version: v1.0.0 (Online First)
 */

const CACHE_VERSION = 'v1.0.0-messenger';
const CACHE_NAME = `connect-messenger-${CACHE_VERSION}`;

// Fichiers critiques à mettre en cache pour le messenger
const STATIC_ASSETS = [
    '/messenger/',
    '/messenger/index.html',
    '/messenger/manifest.messenger.json',
    '/messenger/messenger/messenger-icon-192.png',
    '/messenger/messenger/messenger-icon-512.png',
    '/messenger/static/styles.css',
    '/messenger/push-notifications.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW Messenger] Installing service worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW Messenger] Pre-caching static assets');
      const promises = STATIC_ASSETS.map(url => 
        cache.add(url).catch(err => console.warn(`[SW Messenger] Failed to cache ${url}:`, err))
      );
      return Promise.all(promises);
    })
  );
  
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW Messenger] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer uniquement les anciens caches du messenger
          if (cacheName.startsWith('connect-messenger-') && cacheName !== CACHE_NAME) {
            console.log('[SW Messenger] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Stratégie: Network First (toujours essayer le réseau d'abord)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorer les requêtes API
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Ignorer les requêtes externes
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Network First pour tout le reste
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si succès, mettre en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utiliser le cache
        return caches.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }
          // Si pas de cache, retourner une réponse offline pour les pages HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            return new Response(
              '<html><body><h1>Hors ligne</h1><p>Veuillez vérifier votre connexion internet.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});
