import React, { useRef } from 'react';
import { Message, Participant } from '../types';
import { getInitials, getAvatarGradient, formatTime } from '../utils';
import AudioPlayer from './AudioPlayer';
import ActionCardComponent from './ActionCardComponent';

// --- HELPER: Process content using Markdown (with robust fallback) ---
// Defined outside component to prevent recreation on every render
const processMarkdown = (content: string) => {
        let text = content;

        // 1. SECURITY FIRST: Escape HTML characters from the raw text to prevent XSS
        // We do this BEFORE generating our own HTML tags so we don't escape our own tables/images.
        text = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 2. Table Parser (Simple & Robust)
        const tableRegex = /(?:^|\n)(\|.*\|(?:\n|$))(\|[-:| ]+\|(?:\n|$))((?:\|.*\|(?:\n|$))+)/g;
        const processTable = (match: string, header: string, separator: string, body: string) => {
            const parseRow = (row: string) => row.trim().split('|').filter(c => c !== '').map(c => c.trim());
            const headers = parseRow(header);
            const rows = body.trim().split('\n').map(parseRow);
            let html = '<div class="overflow-x-auto my-3 rounded-lg border border-gray-200 shadow-sm"><table class="min-w-full divide-y divide-gray-200 text-sm">';
            html += '<thead class="bg-gray-50"><tr>';
            headers.forEach(h => {
                 const safeHeader = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                 html += `<th class="px-3 py-3 text-left font-bold text-gray-900 tracking-wider whitespace-nowrap">${safeHeader}</th>`;
            });
            html += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
            rows.forEach(row => {
                html += '<tr class="hover:bg-gray-50 transition-colors">';
                row.forEach(cell => {
                    let cellContent = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline">$1</a>');
                    html += `<td class="px-3 py-3 whitespace-normal text-gray-700 min-w-[120px] leading-relaxed">${cellContent}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            return html;
        };
        // Apply Table Parser
        text = text.replace(tableRegex, (match, h, s, b) => processTable(match, h, s, b));

        text = text
            // Bold (**text**)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic (*text*)
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headers (H2-H4)
        .replace(/^#### (.*)$/gm, '<h4 class="font-bold text-base mt-2 mb-1 text-gray-800">$1</h4>')
        .replace(/^### (.*)$/gm, '<h3 class="font-bold text-lg mt-3 mb-1 text-gray-900">$1</h3>')
        .replace(/^## (.*)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2 text-gray-900 border-b border-gray-200 pb-1">$1</h2>')
        // Lists (- or * Item)
        .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc mb-0.5">$1</li>')
        // Images ![Alt](URL) - Robust regex to handle spaces and special chars in URL if encoded
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            let validUrl = url.trim();
            // Fix AI hallucination of absolute 'api' domain (handles any domain prefix for internal api routes)
            validUrl = validUrl.replace(/^https?:\/\/(?:www\.)?[\w.-]+\/api\//, '/api/');
            return `<img src="${validUrl}" alt="${alt}" class="rounded-lg max-w-full h-auto my-2 shadow-md border border-gray-200" />`;
        })
        // Links [Text](URL)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            let validUrl = url.trim();
            // Fix AI hallucination of absolute 'api' domain (handles any domain prefix for internal api routes)
            validUrl = validUrl.replace(/^https?:\/\/(?:www\.)?[\w.-]+\/api\//, '/api/');
            // Fix .com hallucination
            validUrl = validUrl.replace(/igpglass\.com/g, 'igpglass.ca');
            
            const isInternal = validUrl.includes('app.igpglass.ca') || validUrl.startsWith('/');
            const target = isInternal ? '_self' : '_blank';
            
            return `<a href="${validUrl}" target="${target}" class="text-blue-600 hover:underline font-medium">${text}</a>`;
        })
        // Blockquotes (> text)
        .replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
        // Fix: Remove newlines immediately after headers and list items to prevent double spacing (gap reduction)
        .replace(/(<\/h[2-4]>|<\/li>)\n/g, '$1')
        // Newlines to BR
        .replace(/\n/g, '<br/>');
    return text;
};

// --- MEMOIZED SUB-COMPONENT: AI Message Content ---
// This prevents regex reprocessing on every keystroke when parent re-renders
const AIMessageContent = React.memo(({ content }: { content: string }) => {
    const html = processMarkdown(content);
    return (
        <div 
            className="text-[15px] leading-snug break-words pr-10 pb-1 font-medium tracking-wide prose-sm"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
});

interface MessageListProps {
    messages: Message[];
    participants: Participant[];
    currentUserId: number | null;
    currentUserRole: string;
    conversationType: string;
    loadingMessages: boolean;
    searchMode: boolean;
    searchKeyword: string;
    onPrivateChat: (userId: number) => void;
    onUpdateCardStatus: (msgId: string, status: 'open' | 'in_progress' | 'resolved') => void;
    onCreateActionCard: (msgId: string) => void;
    onDeleteMessage: (msgId: string) => void;
    onSaveTranscription: (msgId: string, text: string) => void;
    onDownload: (key: string, type: 'image' | 'audio') => void;
    setViewImage: (data: any) => void;
    setTriggerAddMember: (val: boolean) => void;
    setShowInfo: (val: boolean) => void;
    editingTranscriptionId: string | null;
    setEditingTranscriptionId: (id: string | null) => void;
    editingTranscriptionText: string;
    setEditingTranscriptionText: (val: string) => void;
    messagesContainerRef: React.RefObject<HTMLDivElement>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    participants,
    currentUserId,
    currentUserRole,
    conversationType,
    loadingMessages,
    searchMode,
    searchKeyword,
    onPrivateChat,
    onUpdateCardStatus,
    onCreateActionCard,
    onDeleteMessage,
    onSaveTranscription,
    onDownload,
    setViewImage,
    setTriggerAddMember,
    setShowInfo,
    editingTranscriptionId,
    setEditingTranscriptionId,
    editingTranscriptionText,
    setEditingTranscriptionText,
    messagesContainerRef,
    messagesEndRef
}) => {

    const renderContent = () => {
        if (loadingMessages) {
             return (
                <div className="flex justify-center items-center h-full animate-fade-in">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                    </div>
                </div>
             );
        }

        if (messages.length === 0 && conversationType === 'group') {
            const hasMembers = participants.length > 1; 
            
            return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in p-8 text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-gray-800 to-black flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                        <i className="fas fa-users text-gray-600 text-4xl"></i>
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-3 font-display">
                        {hasMembers ? "La discussion est ouverte" : "Le groupe est prêt"}
                    </h3>
                    <p className="text-gray-400 mb-10 max-w-sm mx-auto text-lg font-light">
                        {hasMembers 
                            ? "Il n'y a pas encore de messages. Lancez la conversation avec vos collègues." 
                            : "Il n'y a pas encore de messages. Ajoutez des collègues pour commencer la discussion."}
                    </p>
                    
                    {hasMembers ? (
                         <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6 max-w-xs w-full backdrop-blur-md">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 text-left">Membres présents</div>
                            <div className="flex flex-wrap gap-3">
                                {participants.map(p => (
                                    <div key={p.user_id} className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-xs text-white border border-gray-600 shadow-lg font-bold" title={p.full_name}>
                                        {getInitials(p.full_name)}
                                    </div>
                                )).slice(0, 5)}
                                {participants.length > 5 && <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xs text-gray-400 border border-gray-700 font-bold">+{participants.length - 5}</div>}
                            </div>
                         </div>
                    ) : (
                        <button 
                            onClick={() => { setShowInfo(true); setTriggerAddMember(true); }}
                            className="glass-button-primary text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 transition-transform text-base"
                        >
                            <i className="fas fa-user-plus"></i> Ajouter des membres
                        </button>
                    )}
                </div>
            );
        }

        const result: React.ReactNode[] = [];
        let lastDate = '';

        // SEARCH FILTERING
        const messagesToDisplay = searchMode && searchKeyword.trim() 
            ? messages.filter(m => m.content.toLowerCase().includes(searchKeyword.toLowerCase()))
            : messages;

        if (searchMode && messagesToDisplay.length === 0 && searchKeyword.trim()) {
             return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in opacity-50 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <i className="fas fa-search text-2xl"></i>
                    </div>
                    <p className="font-bold">Aucun message trouvé</p>
                    <p className="text-xs mt-1">"{searchKeyword}"</p>
                </div>
             );
        }

        for (let i = 0; i < messagesToDisplay.length; i++) {
            const msg = messagesToDisplay[i];
            const dateObj = new Date(msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z');
            
            // Timezone Adjustment Logic
            const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
            const shiftedDateObj = new Date(dateObj.getTime() + (offset * 3600000));
            const dateStr = shiftedDateObj.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });

            if (dateStr !== lastDate) {
                let displayDate = dateStr;
                
                const now = new Date();
                const shiftedNow = new Date(now.getTime() + (offset * 3600000));
                const yesterday = new Date(shiftedNow);
                yesterday.setDate(shiftedNow.getDate() - 1);
                
                const shiftedDateISO = shiftedDateObj.toISOString().slice(0, 10);
                const shiftedNowISO = shiftedNow.toISOString().slice(0, 10);
                const yesterdayISO = yesterday.toISOString().slice(0, 10);

                if (shiftedDateISO === shiftedNowISO) displayDate = "Aujourd'hui";
                else if (shiftedDateISO === yesterdayISO) displayDate = "Hier";

                result.push(
                    <div key={`date-${dateStr}`} className="flex justify-center my-8">
                        <span className="bg-black/40 border border-white/10 backdrop-blur-md text-gray-400 text-[11px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest shadow-lg">
                            {displayDate}
                        </span>
                    </div>
                );
                lastDate = dateStr;
            }

            const isMe = currentUserId === msg.sender_id;
            const otherParticipants = participants.filter(p => p.user_id !== currentUserId);
            const isGlobalAdmin = currentUserRole === 'admin';
            let isRead = false;
            if (otherParticipants.length > 0) {
                isRead = otherParticipants.every(p => {
                    if (!p.last_read_at) return false;
                    const readTime = new Date(p.last_read_at.endsWith('Z') ? p.last_read_at : p.last_read_at + 'Z');
                    return readTime > dateObj;
                });
            }

            // Avatar rendering logic
            const avatarUrl = msg.sender_avatar_key 
                ? `/api/auth/avatar/${msg.sender_id}?v=${msg.sender_avatar_key}` // Stable cache busting
                : null;
            
            const isAI = msg.sender_avatar_key === 'ai_avatar';
            const bubbleClass = isMe 
                ? 'message-bubble-me text-white rounded-tr-sm' 
                : isAI 
                    ? 'bg-white text-gray-900 border border-gray-200 shadow-md rounded-tl-sm' // AI Light Mode
                    : 'message-bubble-them text-gray-100 rounded-tl-sm'; // Dark Mode for humans

            result.push(
                <div key={msg.id} className={`flex mb-6 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in group items-end gap-3`}>
                    
                    {/* Avatar for OTHERS (Left) - HIDDEN FOR AI */ }
                    {!isMe && !isAI && (
                        <div className="flex-shrink-0 mb-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={msg.sender_name}
                                    className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => onPrivateChat(msg.sender_id)}
                                    title={msg.sender_name}
                                />
                            ) : (
                                <div 
                                    className={`w-8 h-8 rounded-xl ${getAvatarGradient(msg.sender_name)} flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10 cursor-pointer hover:scale-110 transition-transform`}
                                    onClick={() => onPrivateChat(msg.sender_id)}
                                    title={msg.sender_name}
                                >
                                    {getInitials(msg.sender_name)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isAI ? 'max-w-full w-full pr-4' : 'max-w-[75%] md:max-w-[65%]'} min-w-0`}>
                        {!isMe && (
                            <div 
                                onClick={() => onPrivateChat(msg.sender_id)}
                                className={`text-[11px] font-bold mb-1.5 ml-1 ${getAvatarGradient(msg.sender_name).replace('bg-gradient-to-br', '').replace('from-', 'text-').replace('to-', 'text-opacity-100')} cursor-pointer hover:underline transition-colors flex items-center gap-1.5`}
                                title="Envoyer un message privé"
                            >
                                {msg.sender_name} 
                            </div>
                        )}
                        
                        <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-md relative transition-all ${bubbleClass}`}>
                            {(isGlobalAdmin || isMe) && (
                                <>
                                    {!msg.action_card && (
                                        <div className="absolute -top-3 -right-2 z-20 transition-all">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onCreateActionCard(msg.id); }}
                                                className="w-7 h-7 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-[#0b141a] hover:scale-110 active:scale-95 transition-transform"
                                                title="Transformer en ticket"
                                            >
                                                <i className="fas fa-bolt text-xs"></i>
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute -top-3 -left-2 z-20 transition-all opacity-0 group-hover:opacity-100">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id); }}
                                            className="w-7 h-7 bg-red-500 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-[#0b141a] hover:scale-110 active:scale-95 transition-transform"
                                            title="Supprimer le message"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </>
                            )}
                            {msg.type === 'image' && msg.media_key ? (
                                <div className="overflow-hidden rounded-xl border border-white/10 relative group/image">
                                    <img 
                                        src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} 
                                        alt="Photo" 
                                        className="max-h-96 object-cover w-full cursor-pointer hover:scale-105 transition-transform duration-700"
                                        onClick={() => setViewImage({
                                            src: `/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key!)}`,
                                            msgId: msg.id,
                                            canDelete: isMe || isGlobalAdmin,
                                            mediaKey: msg.media_key!,
                                            createdAt: msg.created_at
                                        })}
                                    />
                                    {/* Download Button Overlay */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDownload(msg.media_key!, 'image'); }}
                                        className="absolute bottom-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover/image:opacity-100 shadow-lg border border-white/10 md:hidden"
                                        title="Télécharger l'image"
                                    >
                                        <i className="fas fa-download text-xs"></i>
                                    </button>
                                </div>
                            ) : msg.type === 'audio' && msg.media_key ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <AudioPlayer src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} isMe={isMe} />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDownload(msg.media_key!, 'audio'); }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMe ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-black/10'}`}
                                            title="Télécharger l'audio"
                                        >
                                            <i className="fas fa-download text-xs"></i>
                                        </button>
                                    </div>
                                    {msg.transcription && (
                                        editingTranscriptionId === msg.id ? (
                                            <div className="flex flex-col gap-2 mt-2 w-full min-w-[200px]">
                                                <textarea
                                                    value={editingTranscriptionText}
                                                    onChange={(e) => setEditingTranscriptionText(e.target.value)}
                                                    className="w-full bg-black/20 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-emerald-500 outline-none resize-y min-h-[60px]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingTranscriptionId(null); }}
                                                        className="text-[10px] uppercase font-bold text-gray-400 hover:text-white px-2 py-1"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onSaveTranscription(msg.id, editingTranscriptionText); }}
                                                        className="text-[10px] uppercase font-bold bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600 shadow-lg"
                                                    >
                                                        Enregistrer
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`text-[11px] italic font-medium tracking-wide flex items-start gap-1.5 p-2 rounded-lg ${isMe ? 'bg-black/10 text-emerald-100/90' : 'bg-white/5 text-gray-300'} relative`}>
                                                <i className="fas fa-robot text-[10px] mt-0.5 opacity-70 flex-shrink-0"></i>
                                                <span className="flex-1 whitespace-pre-wrap">{msg.transcription}</span>
                                                
                                                {isMe && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTranscriptionId(msg.id);
                                                            setEditingTranscriptionText(msg.transcription || '');
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-white hover:scale-110"
                                                        title="Éditer la transcription"
                                                    >
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                isAI ? (
                                    <AIMessageContent content={msg.content} />
                                ) : (
                                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-10 pb-1 font-medium tracking-wide">
                                        {msg.content}
                                    </div>
                                )
                            )}

                            {msg.action_card && (
                                <ActionCardComponent 
                                    card={msg.action_card} 
                                    isSender={isMe} 
                                    onUpdateStatus={(status) => onUpdateCardStatus(msg.id, status)} 
                                    content={msg.content}
                                    imageUrl={msg.type === 'image' && msg.media_key ? `/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}` : undefined}
                                />
                            )}
                            
                            <div className={`text-[10px] absolute bottom-1.5 right-3 flex items-center gap-1.5 font-bold tracking-wide ${isMe ? 'text-emerald-100/60' : isAI ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isMe && (
                                    <i className={`fas fa-check-double text-[10px] ${isRead ? 'text-white' : 'text-emerald-200/40'}`}></i>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Avatar for ME (Right) */}
                    {isMe && (
                        <div className="flex-shrink-0 mb-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt="Me"
                                    className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10"
                                />
                            ) : (
                                <div className={`w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10`}>
                                    {getInitials(msg.sender_name)}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            );
        }
        return result;
    };

    return (
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 z-10 custom-scrollbar relative scroll-smooth">
            {renderContent()}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
