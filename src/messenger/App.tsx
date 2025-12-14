import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { getUserIdFromToken, getUserRoleFromToken, getNameFromToken } from './utils';
import { SoundManager } from './sound';
import GlobalStyles from './components/GlobalStyles';
import OfflineBanner from './components/OfflineBanner';

// Lazy load components
const LoginScreen = React.lazy(() => import('./components/LoginScreen'));
const ConversationList = React.lazy(() => import('./components/ConversationList'));
const ChatWindow = React.lazy(() => import('./components/ChatWindow'));
const EmptyState = React.lazy(() => import('./components/EmptyState'));

// Loading component for Suspense
const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
            <div className="text-emerald-500 text-sm font-bold tracking-widest uppercase animate-pulse">Chargement...</div>
        </div>
    </div>
);

const App = () => {
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [currentUserAvatarKey, setCurrentUserAvatarKey] = useState<string | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [autoOpenInfo, setAutoOpenInfo] = useState(false);
    
    useEffect(() => {
        axios.get('/api/settings/messenger_app_name').then(res => {
            if(res.data?.setting_value) document.title = res.data.setting_value;
        }).catch(() => {});
    }, []);
    
    // Magic Bridge State
    const [initialRecipientId, setInitialRecipientId] = useState<number | null>(null);
    const [initialMessage, setInitialMessage] = useState<string>('');
    
    const fetchUserInfo = async () => {
        try {
            // Force bypass cache with timestamp
            const res = await axios.get(`/api/auth/me?t=${Date.now()}`);
            if (res.data.user) {
                 setCurrentUserAvatarKey(res.data.user.avatar_key);
                 
                 // --- AUTO-MAINTENANCE (Admin Only) ---
                 // Remplacement du CRON Cloudflare manquant
                 if (res.data.user.role === 'admin') {
                     const lastRun = localStorage.getItem('last_maintenance_run');
                     const today = new Date().toDateString();
                     
                     if (lastRun !== today) {
                         console.log('🧹 Lancement de la maintenance journalière...');
                         axios.post('/api/maintenance/force-cleanup').then(() => {
                             console.log('✅ Maintenance terminée.');
                             localStorage.setItem('last_maintenance_run', today);
                         }).catch(err => console.error('Maintenance error:', err));
                     }
                 }
            }
        } catch (e) { console.error("Error fetching user info", e); }
    };

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            setCurrentUserId(getUserIdFromToken(token));
            setCurrentUserRole(getUserRoleFromToken(token));
            setCurrentUserName(getNameFromToken(token));
            fetchUserInfo();
            setShowLogin(false);
        }

        // --- PUSH NOTIFICATIONS ---
        // Auto-init on load
        if ((window as any).initPushNotifications) {
            (window as any).initPushNotifications();
        }

        // --- DEEP LINKING & SSO ---
        const params = new URLSearchParams(window.location.search);
        const conversationId = params.get('conversationId');
        const recipientId = params.get('recipientId');
        const message = params.get('message');
        const tokenParam = params.get('token');

        // SSO: Inject token if provided
        if (tokenParam) {
            console.log("🔐 SSO Token detected, auto-login...");
            localStorage.setItem('auth_token', tokenParam);
            // Force reload context with new token
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + tokenParam;
            
            // Update state immediately
            try {
                const payload = JSON.parse(atob(tokenParam.split('.')[1]));
                setCurrentUserId(payload.userId);
                setCurrentUserRole(payload.role || '');
                setCurrentUserName(payload.full_name || payload.name || 'Utilisateur');
                fetchUserInfo();
                setShowLogin(false);
            } catch(e) {
                console.error("Invalid SSO Token", e);
            }
        }
        
        if (conversationId) {
            console.log("🔗 Deep link detected:", conversationId);
            setSelectedConvId(conversationId);
        }
        
        if (recipientId) {
            console.log("🔗 Magic Bridge Recipient:", recipientId);
            setInitialRecipientId(parseInt(recipientId));
        }
        
        if (message) {
            console.log("🔗 Magic Bridge Message:", message);
            setInitialMessage(message);
        }

        if (conversationId || recipientId || message || tokenParam) {
            // Clean URL to prevent loop on refresh, but keep it clean
            window.history.replaceState({}, '', window.location.pathname);
        }

        // --- AUDIO UNLOCKER ---
        // Aggressive unlocking on any interaction
        const handleInteraction = () => {
            SoundManager.unlock();
            // We don't remove the listener to ensure we keep the session "warm" if needed
            // But usually once is enough for the session.
            // Let's keep it lightweight.
        };

        ['click', 'touchstart', 'keydown'].forEach(evt => 
            window.addEventListener(evt, handleInteraction, { once: true })
        );

        return () => {
            ['click', 'touchstart', 'keydown'].forEach(evt => 
                window.removeEventListener(evt, handleInteraction)
            );
        };
    }, []);

    if (showLogin) {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <GlobalStyles />
                <LoginScreen onLogin={() => {
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        setCurrentUserId(getUserIdFromToken(token));
                        setCurrentUserRole(getUserRoleFromToken(token));
                        setCurrentUserName(getNameFromToken(token));
                        fetchUserInfo();
                        setShowLogin(false);
                    }
                }} />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<LoadingScreen />}>
            <GlobalStyles />
            <OfflineBanner />
            <div className="flex h-[100dvh] bg-[#050505] overflow-hidden font-sans relative" style={{ backgroundImage: 'url(/static/maintenance-bg-premium.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-md pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[150px] mix-blend-overlay"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[150px] mix-blend-overlay"></div>
                </div>

                <div className={`${selectedConvId ? 'hidden md:flex' : 'flex'} w-full md:w-auto md:flex-none h-full z-20 relative shadow-[20px_0_50px_rgba(0,0,0,0.5)]`}>
                    <ConversationList 
                        onSelect={setSelectedConvId} 
                        selectedId={selectedConvId} 
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        currentUserAvatarKey={currentUserAvatarKey}
                        onOpenInfo={() => setAutoOpenInfo(true)} 
                        onAvatarUpdate={fetchUserInfo}
                        initialRecipientId={initialRecipientId}
                        onRecipientProcessed={() => setInitialRecipientId(null)}
                    />
                </div>

                {selectedConvId ? (
                    <div className="flex-1 flex w-full h-full z-10 relative">
                        <ChatWindow 
                            conversationId={selectedConvId} 
                            currentUserId={currentUserId} 
                            currentUserRole={currentUserRole}
                            onBack={() => setSelectedConvId(null)}
                            onNavigate={setSelectedConvId}
                            initialShowInfo={autoOpenInfo}
                            onConsumeInfo={() => setAutoOpenInfo(false)}
                            initialMessage={initialMessage}
                            onMessageConsumed={() => setInitialMessage('')}
                        />
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
        </Suspense>
    );
};

export default App;
