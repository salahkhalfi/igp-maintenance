import React from 'react';
import { Conversation } from '../types';
import { getInitials, getAvatarGradient, formatTime } from '../utils';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onSelect: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isActive, onSelect }) => {
    const avatarGradient = conversation.name ? getAvatarGradient(conversation.name) : 'bg-gray-800';

    return (
        <div 
            onClick={() => onSelect(conversation.id)} 
            className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-500 border backdrop-blur-sm
                ${isActive 
                    ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-900/5 border-emerald-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] translate-x-2' 
                    : 'bg-[#111111]/90 border-white/5 hover:bg-[#161616] hover:border-white/10 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1'
                }`}
        >
            {/* Glowing Active Border */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
            )}

            <div className="flex items-start gap-4">
                <div className="relative">
                    {conversation.avatar_key === 'ai_avatar' ? (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg text-2xl border border-white/10 group-hover:scale-105 transition-transform duration-300">
                            <i className="fas fa-robot"></i>
                        </div>
                    ) : conversation.avatar_key ? (
                        <img 
                            src={`/api/v2/chat/asset?key=${encodeURIComponent(conversation.avatar_key)}`} 
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                            className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className={`w-14 h-14 rounded-2xl ${avatarGradient} flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg text-lg border border-white/10 group-hover:scale-105 transition-transform duration-300`}>
                            {conversation.type === 'group' ? <i className="fas fa-users text-white/80"></i> : getInitials(conversation.name || '')}
                        </div>
                    )}
                    {conversation.unread_count > 0 && (
                        <div className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 bg-emerald-500 rounded-full border-[3px] border-[#080808] flex items-center justify-center text-[10px] font-bold shadow-sm text-black animate-bounce">
                            {conversation.unread_count}
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className={`font-bold text-base truncate transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                {conversation.name || (conversation.type === 'group' ? 'Groupe sans nom' : 'Discussion Privée')}
                            </h3>
                            
                            {/* BADGE PREMIUM PUBLIC/PRIVÉ */}
                            {conversation.type === 'group' && (
                                (conversation.participant_count && conversation.participant_count <= 1) ? (
                                    <div className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1 shrink-0">
                                        <i className="fas fa-globe text-[8px] text-cyan-400"></i>
                                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wide">Public</span>
                                    </div>
                                ) : (
                                    <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                                        <i className="fas fa-lock text-[8px] text-emerald-400"></i>
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide">Privé</span>
                                    </div>
                                )
                            )}
                        </div>

                        <span className={`text-[10px] font-bold tracking-wide whitespace-nowrap ml-2 ${isActive ? 'text-emerald-400' : 'text-gray-600 group-hover:text-gray-500'}`}>
                            {formatTime(conversation.last_message_time)}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <p className={`text-sm truncate w-[75%] font-medium ${isActive ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'} ${conversation.unread_count > 0 ? 'text-white font-semibold' : ''}`}>
                            {conversation.last_message ? (
                                conversation.last_message.startsWith('🎤') ? <span className="text-emerald-400 italic">{conversation.last_message}</span> :
                                conversation.last_message.startsWith('📷') ? <span className="text-blue-400 italic">{conversation.last_message}</span> :
                                conversation.last_message
                            ) : <span className="opacity-50 italic">Nouvelle discussion</span>}
                        </p>
                        
                        {/* COMPTEUR PARTICIPANTS (GROUPE) OU ONLINE (DIRECT) */}
                        {conversation.type === 'group' ? (
                            <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-1.5 py-0.5 border border-white/5">
                                {/* Online Count */}
                                {conversation.online_count !== undefined && conversation.online_count > 0 && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.8)]"></div>
                                        <span className="text-[9px] font-bold text-emerald-400 font-mono">{conversation.online_count}</span>
                                    </div>
                                )}
                                
                                {/* Separator if both exist */}
                                {conversation.online_count !== undefined && conversation.online_count > 0 && (
                                    <div className="w-px h-2 bg-white/10"></div>
                                )}

                                {/* Total Count */}
                                <div className="flex items-center gap-1">
                                    <i className="fas fa-user text-[8px] text-gray-500"></i>
                                    <span className="text-[9px] font-bold text-gray-500 font-mono">{conversation.participant_count || 1}</span>
                                </div>
                            </div>
                        ) : (
                            /* Pour Direct Message : Juste le point vert si en ligne */
                            conversation.online_count !== undefined && conversation.online_count > 0 && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationItem;
