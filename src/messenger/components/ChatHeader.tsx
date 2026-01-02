import React, { useState } from 'react';
import axios from 'axios';
import { Participant, User } from '../types';
import { getInitials, getAvatarGradient, getRoleDisplayName } from '../utils';

interface ChatHeaderProps {
    searchMode: boolean;
    setSearchMode: (mode: boolean) => void;
    searchKeyword: string;
    setSearchKeyword: (keyword: string) => void;
    isSearchFocused: boolean;
    setIsSearchFocused: (focused: boolean) => void;
    allUsers: User[];
    setAllUsers: (users: User[]) => void;
    currentUserId: number | null;
    handlePrivateChat: (userId: number) => void;
    onBack: () => void;
    setShowInfo: (show: boolean) => void;
    handleAudioCall: (e: React.MouseEvent) => void;
    messengerName: string;
    participants: Participant[];
    conversationName: string | null;
    conversationType: 'direct' | 'group';
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    searchMode,
    setSearchMode,
    searchKeyword,
    setSearchKeyword,
    isSearchFocused,
    setIsSearchFocused,
    allUsers,
    setAllUsers,
    currentUserId,
    handlePrivateChat,
    onBack,
    setShowInfo,
    handleAudioCall,
    messengerName,
    participants,
    conversationName,
    conversationType
}) => {
    
    const ensureAllUsersLoaded = () => {
        if (allUsers.length === 0) {
            axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
        }
    };

    return (
        <header onClick={() => !searchMode && setShowInfo(true)} className="min-h-[5rem] h-auto py-3 glass-header px-4 md:px-8 flex flex-wrap items-center justify-between z-20 flex-shrink-0 cursor-pointer hover:bg-white/5 transition-all duration-300 shadow-2xl shadow-black/40 sticky top-0 w-full group/header backdrop-blur-xl border-b border-white/5 gap-y-2">
            {searchMode ? (
                <div className="flex-1 flex items-center gap-4 animate-fade-in w-full">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSearchMode(false); setSearchKeyword(''); }}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-500 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-3 border border-emerald-500/30 shadow-inner relative group/search min-w-0">
                        <i className="fas fa-search text-gray-500 mr-3 flex-shrink-0"></i>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Chercher..." 
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 font-medium min-w-0"
                            onKeyDown={(e) => e.key === 'Escape' && setSearchMode(false)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {searchKeyword && (
                            <i onClick={(e) => {e.stopPropagation(); setSearchKeyword('');}} className="fas fa-times-circle text-gray-500 hover:text-white cursor-pointer ml-2 flex-shrink-0"></i>
                        )}

                        {/* SMART USER DROPDOWN (In-Chat) */}
                        {(searchKeyword || isSearchFocused) && allUsers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-slide-up max-h-60 overflow-y-auto custom-scrollbar">
                                <div className="px-3 py-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-black/20">
                                    {searchKeyword ? 'Aller vers...' : 'Contacts rapides'}
                                </div>
                                {allUsers
                                    .filter(u => u.id !== currentUserId)
                                    .filter(u => !searchKeyword || u.full_name.toLowerCase().includes(searchKeyword.toLowerCase()))
                                    .map(user => (
                                    <div 
                                        key={user.id}
                                        onClick={(e) => { e.stopPropagation(); handlePrivateChat(user.id); setSearchMode(false); }}
                                        className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                    >
                                        {user.avatar_key ? (
                                            <img src={`/api/auth/avatar/${user.id}`} className="w-8 h-8 rounded-full object-cover shadow-sm" alt={user.full_name} />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full ${getAvatarGradient(user.full_name)} flex items-center justify-center text-white text-xs font-bold`}>{getInitials(user.full_name)}</div>
                                        )}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="text-white font-bold text-sm truncate">{user.full_name}</div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold">{getRoleDisplayName(user.role)}</div>
                                        </div>
                                        <i className="fas fa-comment-alt text-emerald-500/50"></i>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                {/* Bouton Retour / Sortir Renforcé */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onBack(); }} 
                    className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 transition-all shadow-lg flex-shrink-0"
                    title="Sortir de la discussion"
                >
                    <i className="fas fa-chevron-left text-emerald-500 group-hover:text-white transition-colors text-xl"></i>
                </button>

                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-xl border border-white/10 group-hover/header:scale-105 transition-transform duration-300">
                        <i className="fas fa-users text-gray-400 text-sm md:text-lg group-hover/header:text-emerald-400 transition-colors"></i>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-[#050505] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                <div className="flex flex-col">
                    <h1 className="text-lg font-display font-bold text-gray-900 tracking-tight leading-none text-white truncate max-w-[150px] md:max-w-[250px]" title={conversationName || (conversationType === 'group' ? 'Groupe' : 'Discussion')}>
                        {conversationName || (conversationType === 'group' ? 'Groupe' : 'Discussion')}
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                            v3.0.2
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                            {participants.length} membres
                        </span>
                    </div>
                </div>
            </div>
            )}
            
            {/* HEADER FIX MOBILE - Phone Icon Force Visible & Button Group */}
            <div className="flex gap-2 items-center flex-shrink-0">
                <button 
                    onClick={handleAudioCall}
                    className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl md:rounded-2xl hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-all border border-transparent hover:border-emerald-500/30 group/phone z-50 relative"
                    title="Appel Audio (Envoie une sonnerie)"
                    style={{ display: 'flex' }}
                >
                    <i className="fas fa-phone-alt text-base md:text-lg group-hover/phone:scale-110 transition-transform"></i>
                </button>

                {!searchMode && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setSearchMode(true); 
                            setIsSearchFocused(true);
                            ensureAllUsersLoaded();
                        }}
                        onMouseEnter={ensureAllUsersLoaded}
                        className="flex hover:text-white transition-colors w-10 h-10 md:w-12 md:h-12 items-center justify-center rounded-xl md:rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 flex-shrink-0"
                        title="Rechercher dans la discussion"
                    >
                        <i className="fas fa-search text-base md:text-lg"></i>
                    </button>
                )}
                
                {/* Bouton Fermer Explicite (X) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onBack(); }} 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 hover:border-red-500 flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/20 flex-shrink-0"
                    title="Fermer la discussion"
                >
                    <i className="fas fa-times text-lg md:text-xl"></i>
                </button>
            </div>
        </header>
    );
};

export default ChatHeader;