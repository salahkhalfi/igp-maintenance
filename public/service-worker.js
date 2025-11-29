/**
 * Service Worker pour PWA Maintenance IGP
 * Gère le cache offline et les notifications push
 */

const CACHE_VERSION = 'v1.0.2';
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
    // Use unique tag to prevent notification grouping
    // - For tickets: use ticketId (allows grouping per ticket)
    // - For messages: use messageId (each message separate)
    // - Fallback: timestamp (always unique)
    tag: data.data?.ticketId 
      ? `ticket-${data.data.ticketId}` 
      : data.data?.messageId 
        ? `message-${data.data.messageId}` 
        : `notif-${Date.now()}`,
    requireInteraction: false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action || notificationData.action; // Handle button click (event.action) or data action
  
  // Construire l'URL appropriée selon le type de notification
  let urlToOpen = notificationData.url || '/';
  
  // Pour les tickets: ouvrir le modal du ticket directement
  if ((action === 'view_ticket' || action === 'view') && notificationData.ticketId) {
    urlToOpen = `/?ticket=${notificationData.ticketId}`;
  }
  // Action rapide "J'y vais" -> ouvre ticket et change statut auto
  else if (action === 'acknowledge' && notificationData.ticketId) {
    urlToOpen = `/?ticket=${notificationData.ticketId}&auto_action=acknowledge`;
  }
  // Pour les messages audio, ajouter paramètres pour auto-play
  else if (action === 'new_audio_message' && notificationData.messageId) {
    urlToOpen = `/?openAudioMessage=${notificationData.messageId}&sender=${notificationData.senderId}`;
  }
  // Pour les messages texte privés
  else if (action === 'new_private_message' && notificationData.senderId) {
    urlToOpen = `/?openMessages=${notificationData.senderId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Pour les interactions boutons, on préfère TOUJOURS ouvrir une fenêtre
      // C'est la SEULE méthode fiable pour fermer le panneau de notification sur Android
      if (action === 'view_ticket' || action === 'view' || action === 'acknowledge' || action === 'new_audio_message' || action === 'new_private_message') {
          if (clients.openWindow) {
              return clients.openWindow(urlToOpen);
          }
      }

      // Comportement standard pour le clic sur le corps (qui ferme déjà le shade nativement)
      // Chercher un client existant
      const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];

      if (client) {
        // 1. Naviguer vers l'URL (Action critique)
        // Note: On ne chaîne PAS après focus() car focus() peut échouer pour les boutons d'action
        // sur certaines versions d'Android, ce qui bloquerait la navigation.
        const navigatePromise = client.navigate(urlToOpen);

        // 2. Tenter de mettre la fenêtre au premier plan (Best effort)
        if ('focus' in client) {
          client.focus().catch(err => console.log('[SW] Focus denied (non-critical):', err));
        }
        
        // 3. Envoyer un message (Support legacy/Reactivité immédiate)
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

      // Sinon, ouvrir nouvelle fenêtre avec URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
