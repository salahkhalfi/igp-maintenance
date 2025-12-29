import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Conversation, User } from '../types';
import { getInitials, getRoleDisplayName, decodeJwtPayload } from '../utils';
import { SoundManager } from '../sound';
import UserSelect from './UserSelect';
import CreateGroupModal from './CreateGroupModal';
import GuestManagementModal from './GuestManagementModal';
import MessengerSettingsModal from './MessengerSettingsModal';
import ConversationItem from './ConversationItem';
import { getErrorMessage } from '../utils/errors';

const ConversationList = ({ onSelect, selectedId, currentUserId, currentUserName, currentUserAvatarKey, onOpenInfo, onAvatarUpdate, initialRecipientId, onRecipientProcessed }: { onSelect: (id: string) => void, selectedId: string | null, currentUserId: number | null, currentUserName: string, currentUserAvatarKey: string | null, onOpenInfo: () => void, onAvatarUpdate: () => void, initialRecipientId?: number | null, onRecipientProcessed?: () => void }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    // Auto-Start Direct Chat from URL
    useEffect(() => {
        if (initialRecipientId && !loading && conversations) {
            startDirectChat(initialRecipientId);
            if (onRecipientProcessed) onRecipientProcessed();
        }
    }, [initialRecipientId, loading]);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [currentUserRole, setCurrentUserRole] = useState<string>('operator');
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);

    useEffect(() => {
        // Load pinned conversations
        const savedPinned = localStorage.getItem(`pinned_conversations_${currentUserId}`);
        if (savedPinned) {
            try { setPinnedIds(JSON.parse(savedPinned)); } catch (e) {}
        }
    }, [currentUserId]);

    const handlePin = (id: string) => {
        setPinnedIds(prev => {
            const newPinned = prev.includes(id) 
                ? prev.filter(p => p !== id) 
                : [...prev, id];
            localStorage.setItem(`pinned_conversations_${currentUserId}`, JSON.stringify(newPinned));
            return newPinned;
        });
    };

    // AI Customization State
    const [aiName, setAiName] = useState('Expert Industriel (IA)');
    const [aiAvatarKey, setAiAvatarKey] = useState('ai_avatar');

    useEffect(() => {
        // Fetch AI Name
        axios.get('/api/settings/ai_expert_name').then(res => {
            if (res.data?.setting_value) setAiName(res.data.setting_value);
        }).catch(() => {});

        // Fetch AI Avatar Key
        axios.get('/api/settings/ai_expert_avatar_key').then(res => {
            if (res.data?.setting_value) setAiAvatarKey(res.data.setting_value);
        }).catch(() => {});
    }, []);
    
    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [currentUserAvatarKey]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validation client-side
            if (file.size > 5 * 1024 * 1024) {
                alert("L'image est trop volumineuse (maximum 5 Mo)");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            setUploadingAvatar(true);
            try {
                await axios.post('/api/auth/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                onAvatarUpdate(); // Refresh in App
            } catch (err) {
                alert("Erreur lors de l'upload de l'avatar");
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

    const handleDeleteAvatar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Voulez-vous supprimer votre photo de profil ?")) return;
        
        setUploadingAvatar(true);
        try {
            await axios.delete('/api/auth/avatar');
            onAvatarUpdate();
        } catch (err) {
            alert("Erreur lors de la suppression");
        } finally {
            setUploadingAvatar(false);
        }
    };
    
    // UI States
    const [showUserSelect, setShowUserSelect] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGuestManager, setShowGuestManager] = useState(false);
    const [showMessengerSettings, setShowMessengerSettings] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    
    // --- SMART SEARCH LOGIC ---
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [viewingList, setViewingList] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
    }, []);

    const startDirectChat = async (targetUserId: number) => {
        try {
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'direct',
                participantIds: [targetUserId]
            });
            if (res.data.conversationId) {
                onSelect(res.data.conversationId);
                setSearchTerm('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createBroadcastGroup = async () => {
        if (!confirm(`Créer un groupe avec TOUS les ${allUsers.length} utilisateurs ?`)) return;
        
        try {
            const allIds = allUsers.map(u => u.id).filter(id => id !== currentUserId);
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'group',
                name: `📢 Annonce Générale ${new Date().toLocaleDateString()}`,
                participantIds: allIds
            });
            if (res.data.conversationId) {
                onSelect(res.data.conversationId);
                setSearchTerm('');
            }
        } catch (err) {
            alert("Erreur création groupe global");
        }
    };
    // --------------------------

    // Sound logic
    const prevConversationsRef = useRef<Conversation[]>([]);
    
    // Push status check throttle (every 30s max, not every 5s)
    const lastPushCheckRef = useRef<number>(0);

    const firstName = currentUserName.split(' ')[0] || 'Utilisateur';

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const payload = decodeJwtPayload(token);
                if (payload.role) setCurrentUserRole(payload.role);
            } catch (e) { console.error(e); }
        }

        // Monitor Push Permission and Check Status
        if ('Notification' in window) {
            setPushPermission(Notification.permission);
        }
        
        // Listen for custom event from push-notifications.js
        const handlePushChange = () => {
            if ('Notification' in window) {
                setPushPermission(Notification.permission);
            }
            if ((window as any).isPushSubscribed) {
                (window as any).isPushSubscribed().then((isSubscribed: boolean) => {
                    setPushEnabled(isSubscribed);
                });
            }
        };
        
        window.addEventListener('push-notification-changed', handlePushChange);
        // Initial Check
        handlePushChange();

        // SERVICE WORKER SOUND LISTENER (For Background/Lock Screen sounds that SW sends to window if visible)
        const swSoundListener = (event: MessageEvent) => {
            if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
                SoundManager.play().catch(e => console.error("SW triggered sound blocked", e));
            }
        };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', swSoundListener);
        }
        
        const fetchConversations = async () => {
            // REMOVED isReordering check
            // No more grace period needed since reorder is gone
            
            try {
                // Add timestamp to prevent caching
                const res = await axios.get(`/api/v2/chat/conversations?t=${Date.now()}`);
                const newConvs = res.data.conversations || [];
                setConversations(newConvs);

                // Check for new unread messages in OTHER conversations
                const prevConvs = prevConversationsRef.current;
                
                // Only if we have history (not first load)
                if (prevConvs.length > 0) {
                    const hasNew = newConvs.some(nc => {
                        // Skip if this conversation is currently open (ChatWindow handles sound for active chat)
                        if (selectedId && nc.id === selectedId) return false;

                        const pc = prevConvs.find(p => p.id === nc.id);
                        // If unread count increased
                        if (pc && nc.unread_count > pc.unread_count) return true;
                        // If new conversation with unread messages
                        if (!pc && nc.unread_count > 0) return true;
                        return false;
                    });

                    if (hasNew) {
                        SoundManager.play().catch(e => {
                           console.error("Sound blocked by browser policy", e);
                        });
                    }
                }
                prevConversationsRef.current = newConvs;
                
                // Vérification push throttlée (toutes les 30s max)
                // Permet de détecter si l'utilisateur a été désabonné côté serveur
                const now = Date.now();
                if (now - lastPushCheckRef.current > 30000) {
                    lastPushCheckRef.current = now;
                    handlePushChange();
                }

            } catch (err: any) {
                console.error("Fetch conv error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [selectedId]);

    // REMOVED handleMove and saveOrder for stability

    const handleCreateGroup = async (name: string) => {
        try {
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'group',
                name: name,
                participantIds: selectedUsers
            });
            if (res.data.success) {
                setShowCreateGroup(false);
                setShowUserSelect(false);
                setSelectedUsers([]);
                onSelect(res.data.conversationId);
                const refreshRes = await axios.get('/api/v2/chat/conversations');
                setConversations(refreshRes.data.conversations || []);
            }
        } catch (err: any) {
            if (err.response && err.response.status === 403) {
                alert("⛔ Vous n'avez pas la permission de créer un groupe.");
            } else {
                console.error("Group creation error:", err);
                alert(`Erreur création groupe: ${getErrorMessage(err, "Erreur inconnue")}`);
            }
        }
    };

    const canCreateGroup = ['admin', 'supervisor', 'technician', 'coordinator', 'planner'].includes(currentUserRole);
    const isAdmin = currentUserRole === 'admin';

    const handleLogout = async () => {
        if (!confirm("Voulez-vous vous déconnecter ?")) return;

        try {
            // 1. DÉSABONNEMENT PUSH (Nettoyage Serveur)
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await axios.post('/api/push/unsubscribe', { endpoint: subscription.endpoint });
                }
            }
        } catch (e) {
            console.error("Erreur désabonnement push", e);
        } finally {
            // 2. NETTOYAGE LOCAL (Toujours exécuté)
            localStorage.removeItem('auth_token');
            window.location.reload();
        }
    };

    const handleSubscribe = async () => {
        // Diagnostic avant l'erreur
        if (!('serviceWorker' in navigator)) {
            alert("Votre navigateur ne supporte pas les Service Workers. Impossible d'activer les notifications.");
            return;
        }
        if (!('PushManager' in window)) {
            alert("Votre navigateur ne supporte pas le Push API (iOS: Ajoutez à l'écran d'accueil).");
            return;
        }
        
        if ((window as any).requestPushPermission) {
            const res = await (window as any).requestPushPermission();
            if (res && res.success) {
                setPushPermission('granted');
                setPushEnabled(true);
                alert("✅ Notifications activées avec succès !");
            } else {
                alert(`❌ Erreur d'activation: ${getErrorMessage(res, "Erreur inconnue")}`);
            }
        } else {
            alert("⚠️ Erreur système: Le script de notification n'est pas chargé. Rafraîchissez la page.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full glass-sidebar w-full md:w-[420px]">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                <div className="text-emerald-500 text-sm font-bold tracking-widest uppercase animate-pulse">Chargement...</div>
            </div>
        </div>
    );

    return (
        <div className="glass-sidebar w-full md:w-[320px] lg:w-[360px] xl:w-[420px] flex flex-col h-full z-20 relative bg-[#080808]">
            <div className="bg-noise absolute inset-0 opacity-10 pointer-events-none"></div>
            
            {showUserSelect && !showCreateGroup && (
                <UserSelect 
                    selectedIds={selectedUsers}
                    onClose={() => setShowUserSelect(false)}
                    onSelect={(ids) => {
                        if (ids.length > 1 && !canCreateGroup) {
                            alert("⛔ Seuls les Superviseurs et Techniciens peuvent créer des groupes.");
                            return; 
                        }
                        setSelectedUsers(ids);
                        if (ids.length === 1) setShowCreateGroup(true); 
                        else setShowCreateGroup(true);
                    }}
                />
            )}
            {showCreateGroup && (
                <CreateGroupModal 
                    selectedUserIds={selectedUsers}
                    onClose={() => setShowCreateGroup(false)}
                    onCreate={handleCreateGroup}
                />
            )}
            {showGuestManager && <GuestManagementModal onClose={() => setShowGuestManager(false)} />}
            {showMessengerSettings && <MessengerSettingsModal onClose={() => setShowMessengerSettings(false)} />}

            {/* PREMIUM HEADER - ID CARD STYLE */}
            <div className="px-4 md:px-6 pt-6 pb-4 flex-shrink-0 z-30 relative">
                {/* THE GLASS CARD CONTAINER */}
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f0f0f]/60 backdrop-blur-2xl shadow-2xl group/card transition-all duration-500 hover:border-white/15 hover:shadow-emerald-900/10">
                    
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center p-6">
                        
                        {/* 1. PROFILE SECTION */}
                        <div className="flex flex-row items-center gap-6 w-full cursor-pointer px-2" onClick={handleAvatarClick}>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                            
                            {/* Avatar with Animated Rings */}
                            <div className="relative group/avatar flex-shrink-0">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-20 group-hover/avatar:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                                
                                <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900 shadow-xl">
                                    <div className="w-full h-full rounded-full border-[3px] border-[#0a0a0a] overflow-hidden bg-[#0a0a0a] relative">
                                        {currentUserAvatarKey && !avatarError ? (
                                            <img 
                                                src={`/api/auth/avatar/${currentUserId}?v=${currentUserAvatarKey}`} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                                                alt="Avatar"
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold text-xl">
                                                {getInitials(currentUserName)}
                                            </div>
                                        )}
                                        
                                        {/* Camera Overlay on Hover */}
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                                            <i className="fas fa-camera text-white text-xs"></i>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    {currentUserAvatarKey && (
                                        <div 
                                            onClick={handleDeleteAvatar}
                                            className="absolute top-0 right-0 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] opacity-0 group-hover/avatar:opacity-100 transition-all hover:scale-110 shadow-lg z-20"
                                        >
                                            <i className="fas fa-times text-[8px] text-white"></i>
                                        </div>
                                    )}

                                    {/* Online Badge */}
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#0a0a0a] rounded-full flex items-center justify-center z-10">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Name & Role */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h2 className="text-white font-display font-bold text-lg tracking-wide leading-tight group-hover/card:text-emerald-400 transition-colors truncate">
                                    {firstName}
                                </h2>
                                <p className="text-emerald-500/70 text-[9px] font-bold uppercase tracking-wide mt-0.5 leading-tight whitespace-normal">Gestion Maintenance</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400 uppercase tracking-wider backdrop-blur-md truncate">
                                        {getRoleDisplayName(currentUserRole)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-5"></div>

                        {/* 2. DASHBOARD ACTIONS */}
                        <div className="flex items-center justify-between w-full px-2 gap-2">
                            <button 
                                onClick={handleSubscribe}
                                className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border backdrop-blur-md group/btn ${
                                    pushPermission === 'granted' && pushEnabled
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10' 
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover/btn:scale-110 ${pushPermission === 'granted' && pushEnabled ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                    <i className={`fas ${pushPermission === 'granted' && pushEnabled ? 'fa-bell' : 'fa-bell-slash'} text-sm`}></i>
                                </div>
                            </button>

                            <button 
                                onClick={() => SoundManager.play()}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-emerald-400 hover:bg-white/10 hover:text-white backdrop-blur-md group/btn"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110">
                                    <i className="fas fa-volume-up text-sm"></i>
                                </div>
                            </button>

                            {isAdmin && (
                                <>
                                    <button 
                                        onClick={() => setShowGuestManager(true)}
                                        className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-blue-400 hover:bg-white/10 hover:text-white backdrop-blur-md group/btn"
                                        title="Gérer les invités"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110">
                                            <i className="fas fa-user-shield text-sm"></i>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setShowMessengerSettings(true)}
                                        className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-purple-400 hover:bg-white/10 hover:text-white backdrop-blur-md group/btn"
                                        title="Personnaliser Connect"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110">
                                            <i className="fas fa-cog text-sm"></i>
                                        </div>
                                    </button>
                                </>
                            )}

                            {/* BOUTON RETOUR APPLICATION */}
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 backdrop-blur-md group/btn"
                                title="Retour à l'application principale"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110">
                                    <i className="fas fa-home text-sm"></i>
                                </div>
                            </button>

                            <button 
                                onClick={handleLogout}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 backdrop-blur-md group/btn"
                            >
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-90">
                                    <i className="fas fa-power-off text-sm"></i>
                                </div>
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div className="flex gap-3 relative z-50 px-4 md:px-6 mb-4">
                <div className="flex-1 relative group">
                    <i className="fas fa-search absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors"></i>
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Rechercher une personne..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => { setIsFocused(true); setViewingList(true); }}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="w-full bg-white/5 border border-white/5 text-white text-sm rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder-gray-600 shadow-inner font-medium" 
                    />
                    
                    {/* CHEVRON "Open List" Button (When collapsed and empty) */}
                    {(!searchTerm && !viewingList && !isFocused) && (
                        <button
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input focus
                                e.stopPropagation();
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setViewingList(true);
                                // Do NOT focus input
                            }}
                            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 hover:text-white transition-colors z-20"
                        >
                            <i className="fas fa-chevron-down"></i>
                        </button>
                    )}

                    {/* BOUTON D'ACTION SMART (CLAVIER/FERMER) */}
                    {(searchTerm || viewingList || isFocused) && (
                        <button
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                            onClick={(e) => {
                                e.stopPropagation();
                                if (searchTerm) {
                                    setSearchTerm('');
                                    searchInputRef.current?.focus();
                                } else {
                                    // Cas: Fermeture explicite de la liste (Blur + Close)
                                    setViewingList(false);
                                    setIsFocused(false);
                                    searchInputRef.current?.blur();
                                }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                    
                    {(searchTerm.length > 0 || isFocused || viewingList) && (
                        <div 
                            onTouchStart={() => {
                                // ZERO FRICTION: Toucher la liste ferme le clavier automatiquement
                                if (isFocused) {
                                    searchInputRef.current?.blur();
                                }
                            }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-96 overflow-y-auto custom-scrollbar animate-slide-up z-50"
                        >
                            <div className="p-2">
                                <div className="px-3 py-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                    {searchTerm ? 'Résultats' : 'Contacts'}
                                </div>
                                
                                {/* OPTION ADMIN: TOUT LE MONDE */}
                                {currentUserRole === 'admin' && (
                                    <div 
                                        onClick={createBroadcastGroup}
                                        className="flex items-center gap-3 p-3 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-colors group/item border border-transparent hover:border-emerald-500/30 mb-2 bg-emerald-500/5"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <i className="fas fa-bullhorn text-xs"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-emerald-400 font-bold text-sm">📢 TOUT LE MONDE</div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold">Créer un groupe avec tous ({allUsers.length})</div>
                                        </div>
                                        <i className="fas fa-arrow-right text-gray-600 group-hover/item:text-emerald-500 transition-colors"></i>
                                    </div>
                                )}

                                {allUsers
                                    .filter(u => u.id !== currentUserId)
                                    .filter(u => !searchTerm || u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(user => (
                                    <div 
                                        key={user.id}
                                        onClick={() => startDirectChat(user.id)}
                                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group/item"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md border border-white/10">
                                            {getInitials(user.full_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-bold text-sm truncate">{user.full_name}</div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold">{getRoleDisplayName(user.role)}</div>
                                        </div>
                                        <i className="fas fa-comment-alt text-gray-600 group-hover/item:text-emerald-500 transition-colors"></i>
                                    </div>
                                ))}
                                {allUsers.filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && u.id !== currentUserId).length === 0 && (
                                    <div className="px-3 py-2 text-gray-500 text-xs italic">Aucun utilisateur trouvé</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative group">
                    {/* REORDER BUTTON REMOVED FOR STABILITY */}
                </div>

                <div className="relative group">
                    <button className="w-12 h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:scale-105 flex items-center justify-center transition-all shadow-lg shadow-emerald-900/30 border border-emerald-400/20">
                        <i className="fas fa-plus text-lg"></i>
                    </button>
                    <div className="absolute right-0 top-full mt-3 w-64 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden hidden group-hover:block z-50 p-2 backdrop-blur-xl">
                        <button 
                            onClick={() => { setSelectedUsers([]); setShowUserSelect(true); }} 
                            className="w-full text-left px-4 py-3.5 hover:bg-white/5 rounded-xl text-white text-sm flex items-center gap-4 transition-colors group/item"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all"><i className="fas fa-comment-alt"></i></div>
                            <div>
                                <div className="font-bold text-gray-200 group-hover/item:text-white">Discussion Privée</div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Direct Message</div>
                            </div>
                        </button>
                        {canCreateGroup && (
                            <button 
                                onClick={() => { setSelectedUsers([]); setShowCreateGroup(true); setShowUserSelect(false); }} 
                                className="w-full text-left px-4 py-3.5 hover:bg-white/5 rounded-xl text-white text-sm flex items-center gap-4 transition-colors mt-1 group/item"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all"><i className="fas fa-users"></i></div>
                                <div>
                                    <div className="font-bold text-gray-200 group-hover/item:text-white">Nouveau Groupe</div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Team Chat</div>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
                {/* LISTE CONVERSATIONS - PREMIUM STYLE */}
            <div className="overflow-y-auto flex-1 custom-scrollbar px-4 pb-4 space-y-2 relative z-10">
                {/* 
                    INTEGRATION EXPERT IA (Pinned Contact) 
                    Only show if no search OR if search matches "Expert" or "IA" or custom name
                */}
                {(!searchTerm || aiName.toLowerCase().includes(searchTerm.toLowerCase()) || "expert industriel (ia)".includes(searchTerm.toLowerCase())) && (
                    <ConversationItem 
                        key="expert_ai"
                        conversation={{
                            id: 'expert_ai',
                            type: 'direct',
                            name: aiName,
                            avatar_key: aiAvatarKey,
                            last_message: 'Je suis là pour vous aider.',
                            last_message_time: new Date().toISOString(),
                            unread_count: 0,
                            participant_count: 2,
                            online_count: 1
                        }}
                        isActive={selectedId === 'expert_ai'}
                        onSelect={onSelect}
                        isPinned={true} // AI is always pinned visually
                    />
                )}

                {conversations.length === 0 && !searchTerm ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-40 mt-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center mb-6 border border-white/5">
                            <i className="fas fa-wind text-4xl text-gray-600"></i>
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Vide pour l'instant</p>
                    </div>
                ) : (
                    <>
                        {/* NORMAL MODE: Show Pinned + Normal (Sorted by Date) */}
                        {conversations
                            .filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(conv => (
                                <ConversationItem 
                                    key={conv.id} 
                                    conversation={conv} 
                                    isActive={selectedId === conv.id} 
                                    onSelect={onSelect} 
                                    isPinned={pinnedIds.includes(conv.id)} // Visual indicator only
                                    onPin={handlePin}
                                />
                            ))
                        }
                    </>
                )}
            </div>
        </div>
    );
};

export default ConversationList;