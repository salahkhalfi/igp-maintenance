/**
 * Push Notifications Frontend Logic
 * Gère l'abonnement et les permissions push
 * REWRITTEN TO USE FETCH (No Axios dependency)
 */

// Convertir clé VAPID publique de base64url en Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Détecter type et nom d'appareil
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  let deviceName = 'Unknown Device';
  
  if (/iPhone|iPad|iPod/.test(ua)) {
    deviceType = 'ios';
    deviceName = ua.match(/\(([^)]+)\)/)?.[1] || 'iPhone';
  } else if (/Android/.test(ua)) {
    deviceType = 'android';
    deviceName = ua.match(/\(([^)]+)\)/)?.[1] || 'Android';
  } else {
    deviceName = navigator.platform || 'Desktop';
  }
  
  return { deviceType, deviceName };
}

// Helper pour les requêtes API avec auth
async function apiRequest(url, method = 'GET', body = null) {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Auth token missing');

    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
        // Tenter de lire le message d'erreur JSON
        let errorMsg = response.statusText;
        try {
            const data = await response.json();
            if (data && data.error) errorMsg = data.error;
        } catch(e) {}
        
        const error = new Error(errorMsg);
        error.status = response.status;
        throw error;
    }

    return await response.json();
}

// S'abonner aux notifications push
async function subscribeToPush() {
  try {
    console.log('[SUBSCRIBE] Debut subscription push');
    
    // Vérifier support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[SUBSCRIBE] Push notifications non supportees');
      return { success: false, error: 'not_supported' };
    }
    
    // Verifier authentification (localStorage uniquement)
    const authToken = localStorage.getItem('auth_token');
    
    if (!authToken) {
      console.error('[SUBSCRIBE] ERREUR: Token auth manquant');
      // On n'affiche plus d'alerte ici, car cette fonction peut être appelée automatiquement
      return { success: false, error: 'not_authenticated' };
    }
    
    console.log('[SUBSCRIBE] Token trouve via localStorage');
    
    // Attendre que service worker soit VRAIMENT ready
    console.log('[SUBSCRIBE] Attente service worker...');
    let swReady = false;
    for (let i = 0; i < 20; i++) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        swReady = true;
        console.log('[SUBSCRIBE] Service Worker est actif');
        break;
      }
      console.log('[SUBSCRIBE] Waiting for SW... (' + (i + 1) + '/20)');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!swReady) {
      console.log('[SUBSCRIBE] SW not ready after 10s, trying anyway...');
    }
    
    const registration = await navigator.serviceWorker.ready;
    console.log('[SUBSCRIBE] Service worker ready');
    
    // Verifier si deja abonne
    const existingSubscription = await registration.pushManager.getSubscription();
    let wasUpdated = false;
    
    if (existingSubscription) {
      console.log('[SUBSCRIBE] Subscription existante trouvée');
      
      // Vérifier si cette subscription appartient à CET utilisateur
      const isMySubscription = await isPushSubscribed();
      console.log('[SUBSCRIBE] Cette subscription m\'appartient?', isMySubscription);
      
      // IMPORTANT: Désabonner d'abord pour éviter les conflits multi-utilisateurs
      console.log('[SUBSCRIBE] Désabonnement de la subscription existante...');
      await existingSubscription.unsubscribe();
      console.log('[SUBSCRIBE] Ancienne subscription révoquée');
      
      // Wait for Service Worker to process unsubscribe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // C'est une "mise à jour" seulement si c'était MA subscription
      wasUpdated = isMySubscription;
    }
    
    // Recuperer cle VAPID publique
    console.log('[SUBSCRIBE] Fetching VAPID public key...');
    const { publicKey } = await apiRequest('/api/push/vapid-public-key');
    console.log('[SUBSCRIBE] Public key:', publicKey.substring(0, 20) + '...');
    
    // S'abonner (toujours créer une NOUVELLE subscription)
    console.log('[SUBSCRIBE] Creating NEW browser push subscription...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    console.log('[SUBSCRIBE] Browser subscription created');
    
    // Envoyer au serveur
    const deviceInfo = getDeviceInfo();
    console.log('[SUBSCRIBE] Sending subscription to server...');
    
    await apiRequest('/api/push/subscribe', 'POST', {
      subscription: subscription.toJSON(),
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName
    });
    
    console.log('[SUBSCRIBE] SUCCESS! Backend updated');
    
    if (wasUpdated) {
      return { success: true, updated: true };
    } else {
      return { success: true, updated: false };
    }
    
  } catch (error) {
    console.error('[SUBSCRIBE] ERREUR push subscription:', error);
    
    if (error.status === 401) {
        // Seulement alerter si c'est une vraie erreur 401 serveur
        // Si c'est juste "token missing" (déjà géré plus haut), on n'alerte pas
        alert('Session expirée. Veuillez vous reconnecter.');
    }
    
    return { success: false, error: error.message };
  }
}

// Demander permission notifications
async function requestPushPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await subscribeToPush();
      return { success: true, permission };
    } else {
      return { success: false, permission };
    }
  } catch (error) {
    console.error('❌ Erreur permission:', error);
    return { success: false, error: error.message };
  }
}

// Vérifier si déjà abonné
async function isPushSubscribed() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    // Si aucune subscription dans le navigateur, retourner false
    if (!subscription) {
      return false;
    }
    
    // Vérifier avec le backend
    try {
      const result = await apiRequest('/api/push/verify-subscription', 'POST', {
        endpoint: subscription.endpoint
      });
      return result && result.isSubscribed;
    } catch (error) {
      // Ignorer l'erreur "Auth token missing" silencieusement
      if (error.message === 'Auth token missing') {
        return false;
      }
      
      console.error('[IS_SUBSCRIBED] Backend verification failed:', error);
      return false;
    }
    
  } catch (error) {
    console.error('[IS_SUBSCRIBED] Error:', error);
    return false;
  }
}

// Initialiser push notifications après login
async function initPushNotifications() {
  try {
    // Vérifier si l'utilisateur est connecté avant tout
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.log('🔕 [INIT] Pas de token d\'authentification, initialisation push ignorée.');
        return;
    }
  
    console.log('🔔 [INIT] Starting push notification initialization...');
    
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('❌ Notifications non supportées');
      return;
    }
    
    let swReady = false;
    try {
        for (let i = 0; i < 20; i++) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.active) {
            swReady = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (e) {}
    
    // Si déjà autorisé, vérifier ownership
    if (Notification.permission === 'granted') {
      let isSubscribed = false;
      try {
          isSubscribed = await isPushSubscribed();
      } catch (e) {
          isSubscribed = false;
      }

      if (!isSubscribed) {
        console.log('🔄 [INIT] Récupération automatique des notifications...');
        await subscribeToPush();
        window.dispatchEvent(new CustomEvent('push-notification-changed'));
        return;
      }
      
      window.dispatchEvent(new CustomEvent('push-notification-changed'));
      return;
    }
    
    window.dispatchEvent(new CustomEvent('push-notification-changed'));
    
  } catch (error) {
    console.error('❌ [INIT] Erreur initialisation:', error);
  }
}

// Exposer les fonctions
window.initPushNotifications = initPushNotifications;
window.requestPushPermission = requestPushPermission;
window.isPushSubscribed = isPushSubscribed;
window.subscribeToPush = subscribeToPush;

// Écouteur global pour les messages du Service Worker (pour jouer le son en fallback)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
            console.log('🔊 [SW-MSG] Demande de son reçue du Service Worker');
            // Tenter de jouer le son via un Audio global
            try {
                const audio = new Audio('/static/notification.mp3');
                audio.volume = 1.0;
                audio.play().catch(e => {
                    console.log('❌ [SW-MSG] Impossible de jouer le son (Autoplay bloqué ?):', e);
                });
                
                // Si c'est un appel, vibrer aussi via JS
                if (event.data.isCall && 'vibrate' in navigator) {
                    navigator.vibrate([500, 200, 500]);
                }
            } catch (e) {
                console.error(e);
            }
        }
    });
}
