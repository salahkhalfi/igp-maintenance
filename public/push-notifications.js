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
    
    // Attendre que service worker soit VRAIMENT ready (same logic as initPushNotifications)
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
      console.log('[SUBSCRIBE] Existing endpoint:', existingSubscription.endpoint.substring(0, 50) + '...');
      
      // IMPORTANT: Désabonner d'abord pour éviter les conflits multi-utilisateurs
      console.log('[SUBSCRIBE] Désabonnement de la subscription existante...');
      await existingSubscription.unsubscribe();
      console.log('[SUBSCRIBE] Ancienne subscription révoquée');
      
      // Wait for Service Worker to process unsubscribe (critical for multi-user devices)
      console.log('[SUBSCRIBE] Waiting 1s for SW to process unsubscribe...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      wasUpdated = true;
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
    
    // S'abonner (toujours créer une NOUVELLE subscription)
    console.log('[SUBSCRIBE] Creating NEW browser push subscription...');
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
    
    if (wasUpdated) {
      console.log('[SUBSCRIBE] SUCCESS! Subscription mise a jour (ancienne revoquee + nouvelle creee)');
      return { success: true, updated: true };
    } else {
      console.log('[SUBSCRIBE] SUCCESS! Push notifications activees (nouvelle subscription)');
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
// IMPORTANT: Vérifie à la fois le navigateur ET la base de données
// pour éviter les conflits multi-utilisateurs sur un même appareil
async function isPushSubscribed() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    // Si aucune subscription dans le navigateur, retourner false
    if (!subscription) {
      console.log('[IS_SUBSCRIBED] No browser subscription found');
      return false;
    }
    
    console.log('[IS_SUBSCRIBED] Browser subscription exists, verifying with backend...');
    
    // Vérifier si cette subscription appartient à l'utilisateur actuel
    // en interrogeant le backend
    try {
      let authToken = null;
      
      // Essayer d'abord axios.defaults
      if (window.axios && window.axios.defaults && window.axios.defaults.headers && window.axios.defaults.headers.common) {
        const authHeader = window.axios.defaults.headers.common['Authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7);
        }
      }
      
      // Sinon essayer localStorage
      if (!authToken) {
        authToken = localStorage.getItem('auth_token');
      }
      
      if (!authToken) {
        console.log('[IS_SUBSCRIBED] No auth token, cannot verify');
        return false;
      }
      
      // Appeler le backend pour vérifier
      const response = await axios.post('/api/push/verify-subscription', {
        endpoint: subscription.endpoint
      }, {
        headers: {
          'Authorization': 'Bearer ' + authToken
        }
      });
      
      const isValid = response.data && response.data.isSubscribed;
      console.log('[IS_SUBSCRIBED] Backend verification result:', isValid);
      return isValid;
      
    } catch (error) {
      console.error('[IS_SUBSCRIBED] Backend verification failed:', error);
      // En cas d'erreur backend, considérer comme non abonné pour forcer réabonnement
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
    
    // Si déjà autorisé, vérifier ownership AVANT de subscribe
    if (Notification.permission === 'granted') {
      console.log('✅ [INIT] Permission déjà accordée, vérification abonnement...');
      const isSubscribed = await isPushSubscribed();
      console.log('🔔 [INIT] Déjà abonné?', isSubscribed);
      
      // IMPORTANT: Ne pas subscribe si appartient à un autre user
      if (!isSubscribed) {
        console.log('⚠️ [INIT] Subscription absente ou appartient à autre user - NE PAS auto-subscribe');
      }
      
      // Always update button color based on ACTUAL ownership
      await updatePushButtonColor();
      return;
    }
    
    // Update button color for denied/default states
    await updatePushButtonColor();
    
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

// Update push button color based on subscription ownership
async function updatePushButtonColor() {
  try {
    console.log('[UPDATE-BTN] Checking subscription ownership...');
    
    // Wait for button to exist in DOM - find button containing bell icon text
    let button = null;
    for (let i = 0; i < 10; i++) {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent || '';
        if (text.includes('Notifications')) {
          button = btn;
          break;
        }
      }
      if (button) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (!button) {
      console.log('[UPDATE-BTN] Push button not found in DOM');
      return;
    }
    
    console.log('[UPDATE-BTN] Button found:', button.textContent);
    
    // Check if user is subscribed for THIS user
    const isSubscribed = await isPushSubscribed();
    console.log('[UPDATE-BTN] Subscription status:', isSubscribed);
    
    // Update button classes based on ownership
    if (Notification.permission === 'granted' && isSubscribed) {
      // GREEN - subscribed for this user
      button.className = 'px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 shadow-md transition-all flex items-center';
      console.log('[UPDATE-BTN] Button set to GREEN (subscribed)');
    } else if (Notification.permission === 'denied') {
      // RED - denied
      button.className = 'px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 shadow-md transition-all animate-pulse flex items-center';
      console.log('[UPDATE-BTN] Button set to RED (denied)');
    } else {
      // ORANGE - not subscribed or belongs to another user
      button.className = 'px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 shadow-md transition-all animate-pulse flex items-center';
      console.log('[UPDATE-BTN] Button set to ORANGE (not subscribed)');
    }
    
  } catch (error) {
    console.error('[UPDATE-BTN] Error updating button:', error);
  }
}

// Exposer les fonctions pour l'app React
window.initPushNotifications = initPushNotifications;
window.requestPushPermission = requestPushPermission;
window.isPushSubscribed = isPushSubscribed;
window.subscribeToPush = subscribeToPush;
window.updatePushButtonColor = updatePushButtonColor;
