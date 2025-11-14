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
      console.log('❌ Push notifications non supportées');
      return { success: false, error: 'not_supported' };
    }
    
    // Attendre que service worker soit ready
    const registration = await navigator.serviceWorker.ready;
    
    // Récupérer clé VAPID publique
    const response = await axios.get('/api/push/vapid-public-key');
    const { publicKey } = response.data;
    
    // S'abonner
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    // Envoyer au serveur
    const deviceInfo = getDeviceInfo();
    await axios.post('/api/push/subscribe', {
      subscription: subscription.toJSON(),
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName
    });
    
    console.log('✅ Push notifications activées');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur push subscription:', error);
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
    // Vérifier support
    if (!('Notification' in window)) {
      console.log('Notifications non supportées sur cet appareil');
      return;
    }
    
    // Si déjà autorisé, s'abonner automatiquement
    if (Notification.permission === 'granted') {
      const isSubscribed = await isPushSubscribed();
      if (!isSubscribed) {
        await subscribeToPush();
      }
      return;
    }
    
    // Si permission non demandée, afficher modal
    if (Notification.permission === 'default') {
      showPushPermissionModal();
    }
    
  } catch (error) {
    console.error('❌ Init push error:', error);
  }
}

// Afficher modal de demande permission (sera appelé depuis l'app React)
window.initPushNotifications = initPushNotifications;
window.requestPushPermission = requestPushPermission;
window.isPushSubscribed = isPushSubscribed;
