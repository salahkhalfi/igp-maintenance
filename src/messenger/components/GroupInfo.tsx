import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Participant } from '../types';
import { getAvatarGradient, getInitials, getRoleDisplayName } from '../utils';
import UserSelect from './UserSelect';
import { getErrorMessage } from '../utils/errors';

const GroupInfo = ({ participants, conversationId, conversationName, conversationAvatarKey, conversationType, currentUserId, currentUserRole, onClose, onPrivateChat, autoOpenAddMember = false }: { participants: Participant[], conversationId: string, conversationName: string | null, conversationAvatarKey: string | null, conversationType: 'direct' | 'group', currentUserId: number | null, currentUserRole: string, onClose: () => void, onPrivateChat: (userId: number) => void, autoOpenAddMember?: boolean }) => {
    const [showAddMember, setShowAddMember] = useState(false);
    const [isManageMode, setIsManageMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(conversationName || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditName(conversationName || '');
    }, [conversationName]);
    
    useEffect(() => {
        if (autoOpenAddMember) setShowAddMember(true);
    }, [autoOpenAddMember]);

    const currentUserParticipant = participants.find(p => p.user_id === currentUserId);
    const isGroupAdmin = currentUserParticipant && currentUserParticipant.role === 'admin';
    const isGlobalAdmin = currentUserRole === 'admin';
    const isExpertAI = conversationId === 'expert_ai';
    // Allow editing for: groups (by group admin or global admin) OR expert_ai (by global admin only)
    const canEdit = ((isGroupAdmin || isGlobalAdmin) && conversationType === 'group') || (isExpertAI && isGlobalAdmin);

    // Fonction pour déterminer le statut de connexion d'un participant
    const getOnlineStatus = (participant: Participant): { isOnline: boolean; isActiveElsewhere: boolean; activeGroup: string | null } => {
        // L'utilisateur courant est toujours "en ligne"
        if (participant.user_id === currentUserId) {
            return { isOnline: true, isActiveElsewhere: false, activeGroup: null };
        }
        
        if (!participant.last_seen) {
            return { isOnline: false, isActiveElsewhere: false, activeGroup: null };
        }
        
        const lastSeen = new Date(participant.last_seen.includes('T') ? participant.last_seen : participant.last_seen.replace(' ', 'T') + 'Z');
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
        
        const isOnline = diffMinutes < 5;
        const isActiveElsewhere = isOnline && !!participant.active_in_conversation;
        
        return { 
            isOnline, 
            isActiveElsewhere, 
            activeGroup: participant.active_in_conversation || null 
        };
    };

    const handleSaveInfo = async () => {
        try {
            if (isExpertAI) {
                // For Expert AI, update the system setting
                await axios.put('/api/settings/ai_expert_name', { value: editName });
            } else {
                await axios.put(`/api/v2/chat/conversations/${conversationId}`, { name: editName });
            }
            setIsEditing(false);
            window.location.reload(); 
        } catch (e) {
            alert("Erreur lors de la modification");
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            setUploadingAvatar(true);
            try {
                if (isExpertAI) {
                    // For Expert AI, use the dedicated avatar endpoint
                    formData.append('avatar', file);
                    await axios.post('/api/settings/upload-ai-avatar', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    formData.append('file', file);
                    await axios.post(`/api/v2/chat/conversations/${conversationId}/avatar`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
                window.location.reload();
            } catch (err) {
                alert("Erreur upload avatar");
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("ATTENTION ADMIN : Voulez-vous supprimer DÉFINITIVEMENT ce groupe et tous ses messages/médias ?")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}`);
            window.location.reload();
        } catch (e) {
            alert('Erreur lors de la suppression du groupe');
        }
    };

    // Permission check for adding members
    const isSupervisor = currentUserRole === 'supervisor';
    const canAddMembers = isGroupAdmin || isGlobalAdmin || isSupervisor;

    const handleAddMember = async (ids: number[]) => {
        if (ids.length === 0) return;

        // Permission check
        if (!canAddMembers) {
            alert("Vous n'avez pas la permission d'ajouter des membres à ce groupe.\nSeuls les administrateurs du groupe peuvent ajouter des participants.");
            return;
        }

        // Blocage pour les non-admins sur les discussions privées
        if (conversationType === 'direct' && currentUserRole !== 'admin') {
            alert("Impossible d'ajouter des participants à une discussion privée.\nCréez un nouveau groupe pour discuter à plusieurs.");
            return;
        }

        try {
            for (const id of ids) {
                await axios.post(`/api/v2/chat/conversations/${conversationId}/participants`, { user_id: id });
            }
            alert(conversationType === 'direct' && currentUserRole === 'admin' ? 'Conversation convertie en groupe !' : 'Membres ajoutés avec succès !');
            setShowAddMember(false);
            onClose();
            // Force reload via window if needed, or rely on polling
            if (conversationType === 'direct') window.location.reload(); 
        } catch (err: any) {
            console.error("Add member error:", err);
            alert(`Erreur: ${getErrorMessage(err, "Erreur lors de l'ajout")}`);
        }
    };

    const handleRemoveMember = async (userId: number, userName: string) => {
        if (!confirm(`Confirmer le retrait de ${userName} ?`)) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/participants/${userId}`);
            onClose(); 
        } catch (err: any) {
            alert(`Erreur: ${getErrorMessage(err, "Erreur lors du retrait")}`);
        }
    };

    const handleLeaveGroup = async () => {
        if (!currentUserId || !confirm("Voulez-vous vraiment quitter ce groupe ?")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/participants/${currentUserId}`);
            onClose();
            window.location.reload(); // Force reload to clear state
        } catch (e) {
            alert("Erreur");
        }
    };

    const handleClearChat = async () => {
        const confirmMsg = conversationId === 'expert_ai' 
            ? "Voulez-vous réinitialiser votre conversation avec l'IA ?\n\nCela supprimera l'historique local et permettra de repartir à zéro avec des données actualisées."
            : "ATTENTION : Voulez-vous supprimer TOUS les messages de cette discussion ? Cette action est irréversible.";
        if (!confirm(confirmMsg)) return;
        
        // Optimistic UI for AI Chat
        if (conversationId === 'expert_ai') {
            localStorage.removeItem(`ai_chat_history_${currentUserId}`);
            // Force reload because we can't easily reach parent state from here without complex props
            // The user accepts a reload for a "Reset" action usually.
            window.location.reload();
            return;
        }

        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/messages`);
            onClose();
            window.location.reload(); 
        } catch (e) {
            alert('Erreur lors de la suppression des messages');
        }
    };

    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:absolute md:inset-y-0 md:right-0 md:left-auto md:w-[380px] flex justify-end">
            {showAddMember && (
                <UserSelect selectedIds={[]} onClose={() => setShowAddMember(false)} onSelect={handleAddMember} />
            )}

            <div className="w-full md:w-[380px] bg-[#0c0c0c] h-full flex flex-col animate-slide-in-right border-l border-white/10 shadow-2xl">
                {/* En-tête Panel */}
                <div className="h-20 bg-white/5 px-6 flex items-center justify-between flex-shrink-0 border-b border-white/5 backdrop-blur-xl">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex items-center gap-3 font-bold text-sm group">
                        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Retour
                    </button>
                    <div className="text-white font-bold font-display tracking-wide">DÉTAILS</div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 min-h-0 pb-10">
                    {/* Gros Icone de Groupe */}
                    <div className="flex flex-col items-center mb-10 relative group/avatar">
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        <div className="relative">
                            {conversationAvatarKey ? (
                                <img 
                                    src={`/api/v2/chat/asset?key=${encodeURIComponent(conversationAvatarKey)}`}
                                    className="w-28 h-28 rounded-3xl object-cover shadow-2xl border border-white/10"
                                    alt="Group"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl"></div>
                                    <i className={`fas ${conversationType === 'group' ? 'fa-users' : 'fa-user'} text-gray-200 text-4xl`}></i>
                                </div>
                            )}
                            
                            {canEdit && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-10 h-10 bg-gray-800 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-emerald-500 transition-colors shadow-lg z-10"
                                >
                                    {uploadingAvatar ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-camera text-xs"></i>}
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mt-6 w-full flex flex-col gap-2 animate-fade-in">
                                <input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-center font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="Nom du groupe"
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-center mt-2">
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold uppercase">Annuler</button>
                                    <button onClick={handleSaveInfo} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase shadow-lg">Sauvegarder</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mt-6 relative group/title">
                                <h2 className="text-white text-2xl font-bold text-center font-display flex items-center justify-center gap-3">
                                    {conversationName || (conversationType === 'group' ? 'Groupe sans nom' : 'Discussion Privée')}
                                    {canEdit && (
                                        <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition-colors ml-2">
                                            <i className="fas fa-pen text-sm"></i>
                                        </button>
                                    )}
                                </h2>
                                <div className="text-emerald-500 text-sm font-bold uppercase tracking-widest mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
                                    {participants.length} participant{participants.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Principales */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {/* Only show Add Member button if user has permission */}
                        {canAddMembers && (
                            <button 
                                onClick={() => setShowAddMember(true)}
                                className="flex flex-col items-center justify-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                                    <i className="fas fa-user-plus"></i>
                                </div>
                                <span className="text-xs font-bold text-gray-300 group-hover:text-white uppercase tracking-wide">Ajouter</span>
                            </button>
                        )}
                        
                        {isGroupAdmin && conversationType === 'group' && (
                            <button 
                                onClick={() => setIsManageMode(!isManageMode)}
                                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all group ${isManageMode ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${isManageMode ? 'bg-red-500 text-white' : 'bg-white/5 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'}`}>
                                    <i className={`fas ${isManageMode ? 'fa-check' : 'fa-cog'}`}></i>
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wide ${isManageMode ? 'text-red-400' : 'text-gray-300 group-hover:text-white'}`}>{isManageMode ? 'Terminer' : 'Gérer'}</span>
                            </button>
                        )}
                    </div>

                    {/* Liste des Membres */}
                    <div className="space-y-3">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 pl-1">
                            Membres du groupe
                        </div>
                        
                        {participants.map(p => {
                            const status = getOnlineStatus(p);
                            return (
                            <div key={p.user_id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group/member">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        {/* Avatar avec badge de statut en ligne */}
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-xl ${getAvatarGradient(p.full_name)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                {getInitials(p.full_name)}
                                            </div>
                                            {/* Badge vert si en ligne */}
                                            {status.isOnline && (
                                                <div 
                                                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0c0c0c] ${status.isActiveElsewhere ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    title={status.isActiveElsewhere ? `Actif dans: ${status.activeGroup}` : 'En ligne'}
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0 cursor-pointer" onClick={() => p.user_id !== currentUserId && onPrivateChat(p.user_id)}>
                                            <div className="text-white font-bold truncate text-sm flex items-center gap-2">
                                                {p.full_name}
                                                {p.user_id === currentUserId && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 border border-white/5">Moi</span>}
                                            </div>
                                            <div className="text-gray-500 text-xs font-medium mt-0.5 uppercase tracking-wide flex items-center gap-2">
                                                {getRoleDisplayName(p.role)}
                                                {/* Afficher le groupe actif si l'utilisateur est actif ailleurs */}
                                                {status.isActiveElsewhere && status.activeGroup && (
                                                    <span className="text-amber-500 text-[10px] normal-case">
                                                        • dans {status.activeGroup}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                        {/* Message Privé Button */}
                                        {p.user_id !== currentUserId && (
                                            <button 
                                                onClick={() => onPrivateChat(p.user_id)}
                                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-emerald-500 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                                                title="Message privé"
                                            >
                                                <i className="fas fa-comment-alt text-xs"></i>
                                            </button>
                                        )}

                                        {/* Bouton d'action contextuel */}
                                        {isManageMode && p.user_id !== currentUserId ? (
                                            <button 
                                                onClick={() => handleRemoveMember(p.user_id, p.full_name)}
                                                className="w-8 h-8 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                title="Retirer du groupe"
                                            >
                                                <i className="fas fa-minus"></i>
                                            </button>
                                        ) : (
                                            p.role === 'admin' && <i className="fas fa-crown text-amber-400 text-xs ml-1" title="Admin"></i>
                                        )}
                                    </div>
                            </div>
                        );})}
                    </div>
                </div>
                
                <div className="p-6 bg-[#0c0c0c] border-t border-white/10 flex-shrink-0 space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 relative">
                    {conversationType === 'group' && (
                        <button 
                            onClick={handleLeaveGroup}
                            className="w-full flex items-center justify-center gap-3 p-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm font-bold uppercase tracking-wide border border-transparent hover:border-white/10"
                        >
                            <i className="fas fa-sign-out-alt"></i> Quitter le groupe
                        </button>
                    )}

                    {/* Allow ALL users to clear AI chat (local storage), but only admins for regular chats */}
                    {(isExpertAI || isGroupAdmin || isGlobalAdmin) && (
                        <button 
                            onClick={handleClearChat}
                            className="w-full flex items-center justify-center gap-3 p-4 text-orange-500 hover:text-white hover:bg-orange-600 rounded-xl transition-all text-sm font-bold uppercase tracking-wide border border-orange-900/30 bg-orange-500/5"
                        >
                            <i className="fas fa-eraser"></i> {isExpertAI ? 'Réinitialiser la conversation IA' : 'Vider la discussion'}
                        </button>
                    )}

                    {isGlobalAdmin && (
                        <button 
                            onClick={handleDeleteGroup}
                            className="w-full flex items-center justify-center gap-3 p-4 text-red-500 hover:text-white hover:bg-red-600 rounded-xl transition-all text-sm font-bold uppercase tracking-wide border border-red-900/30 bg-red-500/5"
                        >
                            <i className="fas fa-trash-alt"></i> Supprimer (Admin)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupInfo;
