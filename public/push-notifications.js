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
    // Vérifier support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications non supportees');
      return { success: false, error: 'not_supported' };
    }
    
    // Verifier authentification - PRIORITE 1: axios.defaults, PRIORITE 2: localStorage
    let authToken = null;
    
    // Essayer d'abord axios.defaults
    if (window.axios && window.axios.defaults && window.axios.defaults.headers && window.axios.defaults.headers.common) {
      const authHeader = window.axios.defaults.headers.common['Authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7); // Enlever 'Bearer '
        console.log('Auth token from axios.defaults');
      }
    }
    
    // Sinon essayer localStorage
    if (!authToken) {
      authToken = localStorage.getItem('auth_token');
      if (authToken) {
        console.log('Auth token from localStorage');
      }
    }
    
    if (!authToken) {
      console.error('Token auth manquant');
      return { success: false, error: 'not_authenticated' };
    }
    
    // Attendre que service worker soit ready
    const registration = await navigator.serviceWorker.ready;
    
    // Recuperer cle VAPID publique (avec auth)
    const response = await axios.get('/api/push/vapid-public-key', {
      headers: {
        'Authorization': 'Bearer ' + authToken
      }
    });
    const { publicKey } = response.data;
    
    // S'abonner
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    // Envoyer au serveur (avec auth)
    const deviceInfo = getDeviceInfo();
    await axios.post('/api/push/subscribe', {
      subscription: subscription.toJSON(),
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName
    }, {
      headers: {
        'Authorization': 'Bearer ' + authToken
      }
    });
    
    console.log('Push notifications activees');
    return { success: true };
    
  } catch (error) {
    console.error('Erreur push subscription:', error);
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
