/**
 * Push Notifications Frontend Logic
 * Gère l'abonnement et les permissions push
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

// S'abonner aux notifications push
async function subscribeToPush() {
  try {
    console.log('[SUBSCRIBE] Debut subscription push');
    
    // Vérifier support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[SUBSCRIBE] Push notifications non supportees');
      return { success: false, error: 'not_supported' };
    }
    
    // Verifier authentification - PRIORITE 1: axios.defaults, PRIORITE 2: localStorage
    let authToken = null;
    
    console.log('[SUBSCRIBE] window.axios existe?', !!window.axios);
    console.log('[SUBSCRIBE] localStorage accessible?', !!localStorage);
    
    // Essayer d'abord axios.defaults
    if (window.axios && window.axios.defaults && window.axios.defaults.headers && window.axios.defaults.headers.common) {
      const authHeader = window.axios.defaults.headers.common['Authorization'];
      console.log('[SUBSCRIBE] axios.defaults.headers.common.Authorization:', authHeader ? 'EXISTS' : 'NULL');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7); // Enlever 'Bearer '
        console.log('[SUBSCRIBE] Auth token from axios.defaults (length:', authToken.length, ')');
      }
    }
    
    // Sinon essayer localStorage
    if (!authToken) {
      authToken = localStorage.getItem('auth_token');
      if (authToken) {
        console.log('[SUBSCRIBE] Auth token from localStorage (length:', authToken.length, ')');
      } else {
        console.log('[SUBSCRIBE] localStorage.auth_token est NULL');
      }
    }
    
    if (!authToken) {
      console.error('[SUBSCRIBE] ERREUR: Token auth manquant');
      alert('Token auth manquant. Reconnectez-vous.');
      return { success: false, error: 'not_authenticated' };
    }
    
    console.log('[SUBSCRIBE] Token trouve, longueur:', authToken.length);
    
    // Attendre que service worker soit ready
    console.log('[SUBSCRIBE] Attente service worker...');
    const registration = await navigator.serviceWorker.ready;
    console.log('[SUBSCRIBE] Service worker ready');
    
    // Verifier si deja abonne
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[SUBSCRIBE] Subscription deja existante, mise a jour...');
      console.log('[SUBSCRIBE] Existing endpoint:', existingSubscription.endpoint.substring(0, 50) + '...');
    }
    
    // Recuperer cle VAPID publique (avec auth)
    console.log('[SUBSCRIBE] Fetching VAPID public key avec Authorization header...');
    console.log('[SUBSCRIBE] Auth header sera:', 'Bearer ' + authToken.substring(0, 20) + '...');
    
    const response = await axios.get('/api/push/vapid-public-key', {
      headers: {
        'Authorization': 'Bearer ' + authToken
      }
    });
    console.log('[SUBSCRIBE] VAPID key recu, status:', response.status);
    const { publicKey } = response.data;
    console.log('[SUBSCRIBE] Public key:', publicKey.substring(0, 20) + '...');
    
    // S'abonner
    console.log('[SUBSCRIBE] Creating browser push subscription...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    console.log('[SUBSCRIBE] Browser subscription created');
    console.log('[SUBSCRIBE] Endpoint:', subscription.endpoint.substring(0, 50) + '...');
    
    // Envoyer au serveur (avec auth)
    const deviceInfo = getDeviceInfo();
    console.log('[SUBSCRIBE] Device info:', deviceInfo);
    console.log('[SUBSCRIBE] Sending subscription to /api/push/subscribe...');
    
    const subscribeResponse = await axios.post('/api/push/subscribe', {
      subscription: subscription.toJSON(),
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName
    }, {
      headers: {
        'Authorization': 'Bearer ' + authToken
      }
    });
    
    console.log('[SUBSCRIBE] Backend response:', subscribeResponse.status, subscribeResponse.data);
    
    if (existingSubscription) {
      console.log('[SUBSCRIBE] SUCCESS! Subscription mise a jour');
      return { success: true, updated: true };
    } else {
      console.log('[SUBSCRIBE] SUCCESS! Push notifications activees');
      return { success: true, updated: false };
    }
    
  } catch (error) {
    console.error('[SUBSCRIBE] ERREUR push subscription:', error);
    
    // Log détaillé de l'erreur
    if (error.response) {
      console.error('[SUBSCRIBE] Status:', error.response.status);
      console.error('[SUBSCRIBE] Data:', error.response.data);
      console.error('[SUBSCRIBE] Headers:', error.response.headers);
      
      if (error.response.status === 401) {
        console.error('[SUBSCRIBE] ERREUR 401 AUTHENTICATION!');
        console.error('[SUBSCRIBE] Le token auth est probablement invalide ou expire');
        alert('Erreur authentication (401). Reconnectez-vous.');
      }
    } else if (error.request) {
      console.error('[SUBSCRIBE] Pas de reponse du serveur:', error.request);
    } else {
      console.error('[SUBSCRIBE] Erreur setup requete:', error.message);
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
    
    return subscription !== null;
  } catch (error) {
    return false;
  }
}

// Initialiser push notifications après login
async function initPushNotifications() {
  try {
    console.log('🔔 [INIT] Starting push notification initialization...');
    
    // Vérifier support
    if (!('Notification' in window)) {
      console.log('❌ Notifications non supportées sur cet appareil');
      return;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker non supporté');
      return;
    }
    
    console.log('🔔 [INIT] Permission actuelle:', Notification.permission);
    
    // Attendre que le Service Worker soit vraiment prêt (max 10 secondes)
    let swReady = false;
    for (let i = 0; i < 20; i++) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        swReady = true;
        console.log('✅ [INIT] Service Worker est actif');
        break;
      }
      console.log(`⏳ [INIT] Attente Service Worker... (${i + 1}/20)`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!swReady) {
      console.log('⚠️ [INIT] Service Worker pas prêt, on continue quand même');
    }
    
    // Si déjà autorisé, s'abonner automatiquement
    if (Notification.permission === 'granted') {
      console.log('✅ [INIT] Permission déjà accordée, vérification abonnement...');
      const isSubscribed = await isPushSubscribed();
      console.log('🔔 [INIT] Déjà abonné?', isSubscribed);
      if (!isSubscribed) {
        await subscribeToPush();
      }
      return;
    }
    
    // Si permission non demandée, demander directement
    if (Notification.permission === 'default') {
      console.log('🔔 [INIT] Demande de permission...');
      await requestPushPermission();
    } else {
      console.log('⚠️ [INIT] Permission refusée:', Notification.permission);
    }
    
  } catch (error) {
    console.error('❌ [INIT] Erreur initialisation push notifications:', error);
  }
}

// Exposer les fonctions pour l'app React
window.initPushNotifications = initPushNotifications;
window.requestPushPermission = requestPushPermission;
window.isPushSubscribed = isPushSubscribed;
window.subscribeToPush = subscribeToPush;
