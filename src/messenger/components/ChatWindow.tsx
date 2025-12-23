import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Message, Participant, Conversation, User } from '../types';
import { SoundManager } from '../sound';
import ImageViewer from './ImageViewer';
import GroupInfo from './GroupInfo';

// Lazy load Native Annotation Editor (zero dependencies, replaces Konva)
const AnnotationEditor = React.lazy(() => import('../NativeAnnotationEditor'));

import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({ conversationId, currentUserId, currentUserRole, onBack, onNavigate, initialShowInfo, onConsumeInfo, initialMessage, onMessageConsumed }: { conversationId: string, currentUserId: number | null, currentUserRole: string, onBack: () => void, onNavigate: (id: string) => void, initialShowInfo: boolean, onConsumeInfo: () => void, initialMessage?: string, onMessageConsumed?: () => void }) => {
    // --- STATE ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messengerName, setMessengerName] = useState('Connect');
    
    // AI Customization
    const [aiName, setAiName] = useState('Expert Industriel (IA)');
    const [aiAvatarKey, setAiAvatarKey] = useState('ai_avatar');
    
    const [input, setInput] = useState(initialMessage || '');
    const [editingTranscriptionId, setEditingTranscriptionId] = useState<string | null>(null);
    const [editingTranscriptionText, setEditingTranscriptionText] = useState('');

    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null); // File awaiting user choice
    const [uploading, setUploading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [triggerAddMember, setTriggerAddMember] = useState(false);
    const [viewImage, setViewImage] = useState<{ src: string; msgId: string; canDelete: boolean; mediaKey: string; createdAt: string } | null>(null);
    const [loadingMessages, setLoadingMessages] = useState(true);
    
    // Search In-Chat Logic
    const [searchMode, setSearchMode] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const initialFetchDone = useRef(false);

    // --- EFFECTS ---
    useEffect(() => {
        axios.get('/api/settings/messenger_app_name').then(res => {
            if(res.data?.setting_value) setMessengerName(res.data.setting_value);
        }).catch(() => {});
        
        // Fetch AI Settings
        axios.get('/api/settings/ai_expert_name').then(res => {
            if(res.data?.setting_value) setAiName(res.data.setting_value);
        }).catch(() => {});
        axios.get('/api/settings/ai_expert_avatar_key').then(res => {
            if(res.data?.setting_value) setAiAvatarKey(res.data.setting_value);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (searchMode && allUsers.length === 0) {
            axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
        }
    }, [searchMode]);

    useEffect(() => {
        if (initialMessage && initialMessage !== input) {
            setInput(initialMessage);
            if (onMessageConsumed) onMessageConsumed();
        }
    }, [initialMessage]);

    useEffect(() => {
        setLoadingMessages(true);
        setMessages([]);
        setParticipants([]);
        setShowInfo(false);
        initialFetchDone.current = false;

        // --- EXPERT AI LOGIC ---
        if (conversationId === 'expert_ai') {
            const rawHistory = JSON.parse(localStorage.getItem(`ai_chat_history_${currentUserId}`) || '[]');
            
            // 🛡️ SANITIZE HISTORY ON LOAD (Fix old bad links + ensure AI avatar key for proper formatting)
            const history = rawHistory.map((msg: Message) => ({
                ...msg,
                // 🔧 FIX: Ensure AI messages have sender_avatar_key for proper Markdown rendering
                // Old localStorage entries may lack this field, causing formatting loss
                sender_avatar_key: msg.sender_id === 0 ? 'ai_avatar' : msg.sender_avatar_key,
                content: msg.content
                    // Fix AI hallucinated domains - redirect to current origin
                    .replace(/https?:\/\/(?:www\.)?(?:example\.com)/gi, window.location.origin)
                    .replace(/\/ticket\/([a-zA-Z0-9-]+)/g, '/?ticket=$1')
            }));

            setMessages(history);
            setParticipants([
                { user_id: 0, full_name: aiName, role: 'ai', last_read_at: new Date().toISOString() },
                { user_id: currentUserId || 999, full_name: 'Moi', role: currentUserRole, last_read_at: new Date().toISOString() }
            ]);
            setConversation({
                id: 'expert_ai',
                type: 'direct',
                name: aiName,
                avatar_key: aiAvatarKey,
                last_message: history.length > 0 ? history[history.length - 1].content : 'Bonjour',
                last_message_time: new Date().toISOString(),
                unread_count: 0,
                participant_count: 2,
                online_count: 1
            });
            setLoadingMessages(false);
            initialFetchDone.current = true;
            setTimeout(scrollToBottom, 100);
            return; // No interval for AI
        }

        fetchMessages();
        markAsRead();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [conversationId, aiName, aiAvatarKey]);

    useEffect(() => {
        if (initialShowInfo) {
            setShowInfo(true);
            onConsumeInfo();
        }
    }, [initialShowInfo, onConsumeInfo]);

    // --- FUNCTIONS ---
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const markAsRead = async () => {
        try { await axios.post(`/api/v2/chat/conversations/${conversationId}/read`); } catch (e) { console.error(e); }
    };

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`/api/v2/chat/conversations/${conversationId}/messages`);
            const newMessages = res.data.messages || [];
            
            setParticipants(prev => {
                const newParticipants = res.data.participants || [];
                return JSON.stringify(prev) !== JSON.stringify(newParticipants) ? newParticipants : prev;
            });

            setConversation(prev => {
                const newConv = res.data.conversation || null;
                return JSON.stringify(prev) !== JSON.stringify(newConv) ? newConv : prev;
            });

            const isFirstLoad = !initialFetchDone.current;

            setMessages(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(newMessages)) {
                    if (prev.length !== newMessages.length) {
                        if (!isFirstLoad && newMessages.length > prev.length) {
                            const lastMsg = newMessages[newMessages.length - 1];
                            if (lastMsg.sender_id !== currentUserId) {
                                SoundManager.play().catch(e => console.error("Sound error:", e));
                            }
                        }
                        setTimeout(scrollToBottom, 100);
                        markAsRead();
                    }
                    return newMessages;
                }
                return prev;
            });
            
            if (isFirstLoad) initialFetchDone.current = true;
        } catch (err) { console.error(err); }
        finally { setLoadingMessages(false); }
    };

    const handlePrivateChat = async (targetUserId: number) => {
        if (!targetUserId || targetUserId === currentUserId) return;
        
        if (conversation?.type === 'direct' && participants.some(p => p.user_id === targetUserId)) {
            textareaRef.current?.focus();
            return;
        }

        try {
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'direct',
                participantIds: [targetUserId]
            });
            if (res.data.conversationId) {
                onNavigate(res.data.conversationId);
                setShowInfo(false);
            }
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || "Impossible d'ouvrir la discussion privée";
            alert(`Erreur: ${errorMsg}`);
        }
    };

    const handleAudioCall = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Envoyer une SONNERIE d'appel à ce groupe/utilisateur ?\n\nCela enverra une notification push immédiate.")) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    conversationId,
                    content: `📞 SONNERIE: Je tente de vous joindre sur ${messengerName} ! (Ouvrez le chat)`,
                    type: 'text',
                    isCall: true 
                })
            });
            alert("📳 Sonnerie envoyée avec succès !");
            fetchMessages(); 
        } catch (err) {
            alert("Erreur lors de l'envoi de la sonnerie");
        }
    };

    const handleUpdateCardStatus = async (messageId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
        setMessages(prev => prev.map(m => {
            if (m.id === messageId && m.action_card) {
                return { ...m, action_card: { ...m.action_card, status: newStatus } };
            }
            return m;
        }));

        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/v2/chat/conversations/${conversationId}/messages/${messageId}/card/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const handleCreateActionCard = async (messageId: string) => {
        if (!confirm("Transformer ce message en carte d'action (Ticket) ?")) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/v2/chat/conversations/${conversationId}/messages/${messageId}/card`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ priority: 'normal' })
            });
            
            if (res.ok) {
                fetchMessages(); 
            } else {
                const data = await res.json();
                alert(data.error || "Impossible de créer la carte");
            }
        } catch (e) {
            console.error("Failed to create card", e);
            alert("Erreur réseau");
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        // --- MASS DELETION (CLEAR ALL) INTERCEPT ---
        // If msgId is special flag OR if called from a clear-all button (logic adaptation)
        // But wait, the UI calls this function for single messages.
        // Let's check where "Clear All" logic resides.
        // It seems "Clear All" is likely handled by a different function or missing in this view context.
        // Actually, looking at GroupInfo.tsx or ChatHeader might be where "Clear Chat" is.
        // Assuming the user is clicking "Supprimer" on individual messages?
        // Ah, user said "Vider les interactions" (Clear All).
        
        if(!confirm("Supprimer ce message définitivement ?")) return;
        
        // Optimistic UI update for AI Chat (remove immediately)
        if (conversationId === 'expert_ai') {
             const newHistory = messages.filter(m => m.id !== msgId);
             setMessages(newHistory);
             localStorage.setItem(`ai_chat_history_${currentUserId}`, JSON.stringify(newHistory));
             return;
        }

        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/messages/${msgId}`);
            fetchMessages();
        } catch(e: any) { 
            // If 404, it's already gone, so just refresh
            if (e.response && e.response.status === 404) {
                 fetchMessages();
            } else {
                 alert("Erreur suppression"); 
            }
        }
    };

    // --- NEW FUNCTION: CLEAR AI HISTORY ---
    // This function needs to be exposed to ChatHeader via props or handled internally if the header emits an event
    // Inspecting ChatHeader usage... it receives `participants` but likely handles the menu internally.
    // If ChatHeader triggers a "Clear" action, it likely calls an API.
    // For AI, we need to intercept that API call or event.
    
    // Let's check if there is an existing "Clear All" handler.
    // Searching for "vide" or "clear" in this file... none found.
    // It must be in `GroupInfo` or `ChatHeader`.
    
    // HYPOTHESIS: The user is using the "Vider la discussion" button in the Group Info menu.
    // That button probably calls `axios.delete('/api/v2/chat/conversations/:id/messages')`.
    // Since 'expert_ai' doesn't really exist on the server (or is empty), that call succeeds (200 OK) but does nothing to the LOCAL storage.
    
    // FIX STRATEGY: We need to listen for that specific deletion event or hook into the clear action.
    // Since `GroupInfo` is a child, we can pass a `onClearHistory` prop to it?
    // Or simpler: We watch the messages list. If the SERVER returns empty list, we clear local?
    // No, AI messages are local-only.
    
    // Let's modify `GroupInfo.tsx` to handle `expert_ai` specifically?
    // NO, better to keep logic in `ChatWindow`.
    
    // Let's check `GroupInfo.tsx` to see how it clears chat.

    const handleSaveTranscription = async (messageId: string, newText: string) => {
        try {
            await axios.put(`/api/v2/chat/conversations/${conversationId}/messages/${messageId}/transcription`, {
                transcription: newText
            });
            
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, transcription: newText } : msg
            ));
            
            setEditingTranscriptionId(null);
            setEditingTranscriptionText('');
        } catch (e) {
            console.error("Failed to save transcription", e);
            alert("Erreur lors de la sauvegarde de la transcription");
        }
    };

    const handleDownload = async (mediaKey: string, type: 'image' | 'audio') => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v2/chat/asset?key=${encodeURIComponent(mediaKey)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error("Erreur réseau");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = type === 'image' ? 'jpg' : 'webm';
            a.download = `maintenance-${type}-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert("Impossible de télécharger le fichier.");
            console.error(e);
        }
    };

    const handleAnnotateExisting = async (src: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(src, {
                 headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const blob = await response.blob();
            const file = new File([blob], "annotation_edit.jpg", { type: blob.type });
            
            setViewImage(null); 
            setPreviewFile(file); 
        } catch (e) {
            alert("Impossible de charger l'image pour l'édition");
        }
    };

    // --- MAGIC TICKET HANDLER ---
    const handleTicketDetected = (data: any) => {
        if (data) {
            const params = new URLSearchParams();
            params.set('createTicket', 'true');
            if (data.title) params.set('title', data.title);
            if (data.description) params.set('description', data.description);
            if (data.priority) params.set('priority', data.priority.toLowerCase());
            if (data.machine_id) params.set('machineId', String(data.machine_id));
            if (data.machine_name) params.set('machineName', data.machine_name);
            if (data.assigned_to_id) params.set('assignedToId', String(data.assigned_to_id));
            if (data.assigned_to_name) params.set('assignedToName', data.assigned_to_name);
            if (data.scheduled_date) params.set('scheduledDate', data.scheduled_date);
            
            const token = localStorage.getItem('auth_token');
            if (token) params.set('token', token);
            
            const targetUrl = '/?' + params.toString();
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isPWA || isMobile) {
                window.location.href = targetUrl;
            } else {
                window.open(targetUrl, '_blank');
            }
        }
    };

    // --- SENDING LOGIC ---
    const sendMessage = async () => {
        if (!input.trim()) return;

        // --- EXPERT AI INTERCEPT ---
        if (conversationId === 'expert_ai') {
            const userMsg: Message = {
                id: Date.now().toString(),
                sender_id: currentUserId || 999,
                sender_name: 'Moi',
                content: input,
                created_at: new Date().toISOString(),
                type: 'text'
            };
            
            // Optimistic UI
            const newHistory = [...messages, userMsg];
            
            // OPTIMIZATION: Keep only last 20 messages in local storage to prevent "Heavy" feeling
            const trimmedHistory = newHistory.length > 20 ? newHistory.slice(newHistory.length - 20) : newHistory;
            
            setMessages(trimmedHistory);
            localStorage.setItem(`ai_chat_history_${currentUserId}`, JSON.stringify(trimmedHistory));
            setInput('');
            setIsSending(true);
            setTimeout(scrollToBottom, 100);

            try {
                const token = localStorage.getItem('auth_token');
                
                // Call AI API with Authorization header
                // OPTIMIZATION: Only send the last 6 messages as context, not the whole history
                const contextHistory = newHistory.length > 6 ? newHistory.slice(newHistory.length - 6) : newHistory;
                
                const res = await axios.post('/api/ai/chat', { 
                    message: userMsg.content, 
                    history: contextHistory.map(m => ({ 
                        role: (m.sender_id === 0 || m.sender_name === 'Expert Industriel' || m.sender_name === 'Expert Industriel (IA)' || m.sender_name === aiName) ? 'assistant' : 'user', 
                        content: m.content 
                    }))
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    sender_id: 0, // AI ID
                    sender_name: aiName,
                    sender_avatar_key: aiAvatarKey,
                    content: res.data.reply,
                    created_at: new Date().toISOString(),
                    type: 'text'
                };
                
                const finalHistory = [...trimmedHistory, aiMsg];
                // Double trim to be safe
                const finalTrimmed = finalHistory.length > 20 ? finalHistory.slice(finalHistory.length - 20) : finalHistory;
                
                setMessages(finalTrimmed);
                localStorage.setItem(`ai_chat_history_${currentUserId}`, JSON.stringify(finalTrimmed));
                setTimeout(scrollToBottom, 100);
                
            } catch (e) {
                alert("Erreur AI: Impossible de joindre l'expert.");
            } finally {
                setIsSending(false);
            }
            return;
        }

        if (!navigator.onLine) {
            alert("⚠️ Vous êtes hors ligne. Impossible d'envoyer le message.");
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        setIsSending(true);
        try {
            const response = await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId, content: input, type: 'text' })
            });
            
            if (response.ok) { 
                setInput(''); 
                fetchMessages();
            } else {
                const data = await response.json();
                throw new Error(data.error || "Erreur serveur");
            }
        } catch (err: any) { 
            console.error(err);
            alert(`❌ Erreur d'envoi: ${err.message || "Problème de connexion"}`);
        } finally {
            setIsSending(false);
        }
    };

    const sendAudio = async (file: File, transcription?: string) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/v2/chat/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);
            
            const finalTranscription = transcription ? "🎤 " + transcription : null;

            await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    conversationId, 
                    content: '🎤 Message vocal', 
                    type: 'audio', 
                    mediaKey: uploadData.key,
                    transcription: finalTranscription
                })
            });
            fetchMessages();
        } catch (err: any) { alert(`Erreur: ${err.message}`); } finally { setUploading(false); }
    };

    const handleNewEditorSend = async (file: File, caption: string) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/v2/chat/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);
            
            const msgContent = caption && caption.trim().length > 0 ? caption : '📷 Photo annotée';
            
            await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId, content: msgContent, type: 'image', mediaKey: uploadData.key })
            });
            setPreviewFile(null);
            fetchMessages();
        } catch (err: any) { alert(`Erreur: ${err.message}`); } finally { setUploading(false); }
    };

    return (
        <div className="flex-1 flex flex-col bg-[#050505] relative h-full overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div>
            <div className="bg-noise absolute inset-0 opacity-[0.03] pointer-events-none z-0"></div>

            {uploading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="flex flex-col items-center gap-4 p-6 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl">
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                        <div className="text-white font-bold tracking-wider">ENVOI EN COURS...</div>
                    </div>
                </div>
            )}

            {viewImage && (
                <ImageViewer 
                    src={viewImage.src} 
                    createdAt={viewImage.createdAt}
                    onClose={() => setViewImage(null)} 
                    canDelete={viewImage.canDelete}
                    onDelete={() => {
                        handleDeleteMessage(viewImage.msgId);
                        setViewImage(null);
                    }}
                    onDownload={() => handleDownload(viewImage.mediaKey, 'image')}
                    onAnnotate={() => handleAnnotateExisting(viewImage.src)}
                />
            )}
            
            {showInfo && <GroupInfo participants={participants} conversationId={conversationId} conversationName={conversation?.name || null} conversationAvatarKey={conversation?.avatar_key || null} conversationType={conversation?.type || 'group'} currentUserId={currentUserId} currentUserRole={currentUserRole} onClose={() => { setShowInfo(false); setTriggerAddMember(false); }} onPrivateChat={handlePrivateChat} autoOpenAddMember={triggerAddMember} />}
            
            {/* Image Choice Modal */}
            {pendingFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1a1a1a] rounded-2xl p-5 mx-4 w-full max-w-sm shadow-2xl border border-white/10">
                        {/* Preview thumbnail */}
                        <div className="mb-4 rounded-xl overflow-hidden bg-black/50 flex items-center justify-center h-32">
                            <img 
                                src={URL.createObjectURL(pendingFile)} 
                                alt="Preview" 
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                        
                        <h3 className="text-white font-bold text-center mb-4">Que voulez-vous faire ?</h3>
                        
                        <div className="flex flex-col gap-2">
                            {/* Send directly */}
                            <button
                                onClick={() => {
                                    const file = pendingFile;
                                    setPendingFile(null);
                                    handleNewEditorSend(file, '');
                                }}
                                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                            >
                                <i className="fas fa-paper-plane"></i>
                                Envoyer directement
                            </button>
                            
                            {/* Annotate */}
                            <button
                                onClick={() => {
                                    const file = pendingFile;
                                    setPendingFile(null);
                                    setPreviewFile(file);
                                }}
                                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                            >
                                <i className="fas fa-pencil-alt"></i>
                                Annoter l'image
                            </button>
                            
                            {/* Create ticket */}
                            <button
                                onClick={async () => {
                                    const file = pendingFile;
                                    setPendingFile(null);
                                    // Upload image first to get URL
                                    const token = localStorage.getItem('auth_token');
                                    if (!token) return;
                                    try {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const uploadRes = await fetch('/api/v2/chat/upload', {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` },
                                            body: formData
                                        });
                                        const uploadData = await uploadRes.json();
                                        if (!uploadRes.ok) throw new Error(uploadData.error);
                                        // Redirect to ticket creation with image
                                        const params = new URLSearchParams();
                                        params.set('createTicket', 'true');
                                        params.set('imageUrl', `/api/media/${uploadData.key}`);
                                        window.open('/?' + params.toString(), '_blank');
                                    } catch (err: any) {
                                        alert(`Erreur upload: ${err.message}`);
                                    }
                                }}
                                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                            >
                                <i className="fas fa-ticket-alt"></i>
                                Créer un ticket
                            </button>
                            
                            {/* Cancel */}
                            <button
                                onClick={() => setPendingFile(null)}
                                className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors mt-1"
                            >
                                <i className="fas fa-times"></i>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewFile && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                            <div className="text-white font-bold tracking-wider">CHARGEMENT ÉDITEUR...</div>
                        </div>
                    </div>
                }>
                    <AnnotationEditor 
                        file={previewFile} 
                        onClose={() => {
                            if (confirm("Quitter sans envoyer ?")) {
                                setPreviewFile(null);
                            }
                        }}
                        onSend={handleNewEditorSend}
                    />
                </React.Suspense>
            )}

            <ChatHeader 
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
                allUsers={allUsers}
                setAllUsers={setAllUsers}
                currentUserId={currentUserId}
                handlePrivateChat={handlePrivateChat}
                onBack={onBack}
                setShowInfo={setShowInfo}
                handleAudioCall={handleAudioCall}
                messengerName={messengerName}
                participants={participants}
            />

            <MessageList 
                messages={messages}
                participants={participants}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                conversationType={conversation?.type || 'direct'}
                loadingMessages={loadingMessages}
                searchMode={searchMode}
                searchKeyword={searchKeyword}
                onPrivateChat={handlePrivateChat}
                onUpdateCardStatus={handleUpdateCardStatus}
                onCreateActionCard={handleCreateActionCard}
                onDeleteMessage={handleDeleteMessage}
                onSaveTranscription={handleSaveTranscription}
                onDownload={handleDownload}
                setViewImage={setViewImage}
                setTriggerAddMember={setTriggerAddMember}
                setShowInfo={setShowInfo}
                editingTranscriptionId={editingTranscriptionId}
                setEditingTranscriptionId={setEditingTranscriptionId}
                editingTranscriptionText={editingTranscriptionText}
                setEditingTranscriptionText={setEditingTranscriptionText}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
            />

            <MessageInput 
                input={input}
                setInput={setInput}
                onSendText={sendMessage}
                onSendAudio={sendAudio}
                onFileSelect={(file) => setPendingFile(file)}
                isSending={isSending}
                onTicketDetected={handleTicketDetected}
                textareaRef={textareaRef}
            />
        </div>
    );
};

export default ChatWindow;
