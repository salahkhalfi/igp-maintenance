import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../services/messageService';
import { User, Message, MessageType } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { formatDateEST, getNowEST } from '../utils/dateUtils';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialContact?: { id: number; full_name: string; role: string; first_name?: string; last_name?: string; email?: string };
  initialContactId?: number;
}

const MessagingModal: React.FC<MessagingModalProps> = ({ isOpen, onClose, currentUser, initialContact, initialContactId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MessageType>('public');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    isRecording, audioBlob, audioURL, recordingDuration, error: audioError,
    startRecording, stopRecording, cancelRecording 
  } = useAudioRecorder();
  
  const {
    isDictating, isSupported: isSpeechSupported, transcript, setTranscript, toggleDictation
  } = useSpeechRecognition();

  // --- Effects ---
  
  // Update message content when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessageContent(prev => (prev ? `${prev} ${transcript}` : transcript));
      setTranscript('');
    }
  }, [transcript, setTranscript]);

  // Handle initial contact
  useEffect(() => {
    if (isOpen) {
        if (initialContact) {
            setActiveTab('private');
            setSelectedContactId(initialContact.id);
        } else if (initialContactId) {
            setActiveTab('private');
            setSelectedContactId(initialContactId);
        }
    }
  }, [isOpen, initialContact, initialContactId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'private') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeTab, selectedContactId]); // Dependencies might need adjustment based on data

  // --- Queries ---

  const { data: publicData, refetch: refetchPublic } = useQuery({
    queryKey: ['messages', 'public'],
    queryFn: messageService.getPublicMessages,
    enabled: isOpen && activeTab === 'public',
    refetchInterval: 30000,
  });

  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.getConversations,
    enabled: isOpen,
    refetchInterval: 30000,
  });

  const { data: privateData, refetch: refetchPrivate } = useQuery({
    queryKey: ['messages', 'private', selectedContactId],
    queryFn: () => selectedContactId ? messageService.getPrivateMessages(selectedContactId) : Promise.resolve({ messages: [] }),
    enabled: isOpen && activeTab === 'private' && !!selectedContactId,
    refetchInterval: 30000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['available-users'],
    queryFn: messageService.getAvailableUsers,
    enabled: isOpen,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: messageService.getUnreadCount,
    enabled: isOpen,
    refetchInterval: 30000,
  });

  // --- Mutations ---

  const sendMessageMutation = useMutation({
    mutationFn: messageService.sendMessage,
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeTab === 'public') refetchPublic();
      if (activeTab === 'private') refetchPrivate();
    }
  });

  const sendAudioMutation = useMutation({
    mutationFn: messageService.sendAudioMessage,
    onSuccess: () => {
      cancelRecording();
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (activeTab === 'public') refetchPublic();
      if (activeTab === 'private') refetchPrivate();
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: messageService.deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (activeTab === 'public') refetchPublic();
      if (activeTab === 'private') refetchPrivate();
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: messageService.bulkDeleteMessages,
    onSuccess: () => {
      setSelectedMessages([]);
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (activeTab === 'public') refetchPublic();
      if (activeTab === 'private') refetchPrivate();
    }
  });

  // --- Handlers ---

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({
      message_type: activeTab,
      content: messageContent,
      recipient_id: activeTab === 'private' && selectedContactId ? selectedContactId : undefined
    });
  };

  const handleSendAudio = () => {
    if (!audioBlob) return;
    sendAudioMutation.mutate({
      message_type: activeTab,
      audio: audioBlob,
      duration: recordingDuration,
      recipient_id: activeTab === 'private' && selectedContactId ? selectedContactId : undefined
    });
  };

  const handleDeleteMessage = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      deleteMessageMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedMessages.length === 0) return;
    if (confirm(`Supprimer ${selectedMessages.length} messages ?`)) {
      bulkDeleteMutation.mutate(selectedMessages);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Helpers ---

  const getContact = useMemo(() => {
    if (!selectedContactId || !usersData?.users) return null;
    return usersData.users.find(u => u.id === selectedContactId);
  }, [selectedContactId, usersData]);

  const canDelete = (msg: Message) => {
    if (msg.sender_id === currentUser.id) return true;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'supervisor' && msg.sender_role !== 'admin') return true;
    return false;
  };

  // --- Derived State ---
  
  const messages = activeTab === 'public' ? (publicData?.messages || []) : (privateData?.messages || []);

  // Sort private messages chronologically (oldest at top, newest at bottom) for chat flow
  // Sort public messages anti-chronologically (newest at top) or keep as is?
  // Legacy: Public (newest at top), Private (newest at bottom)
  const sortedMessages = useMemo(() => {
    if (activeTab === 'private') {
      // Assuming API returns generic order, ensure chronological
      return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return messages; // Legacy public messages come sorted desc
  }, [messages, activeTab]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 font-sans" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/80"></div>
      
      <div 
        className="relative bg-white rounded-xl border border-gray-200 w-full max-w-6xl h-[85vh] sm:h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 text-white p-3 sm:p-4 flex justify-between items-center shrink-0 z-10">
           <div className="flex items-center gap-3">
             <i className="fas fa-comments text-xl text-blue-400"></i>
             <h2 className="text-lg sm:text-xl font-bold">Messagerie Équipe</h2>
             {(unreadData?.count || 0) > 0 && (
               <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                 {unreadData?.count}
               </span>
             )}
           </div>
           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
             <i className="fas fa-times"></i>
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button 
            onClick={() => { setActiveTab('public'); setSelectedContactId(null); }}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'public' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-globe"></i> Public
          </button>
          <button 
            onClick={() => setActiveTab('private')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'private' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-user-friends"></i> Privé
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar (Private Only) - Responsive: Hidden on mobile if chat open */}
          {activeTab === 'private' && (
            <div className={`${selectedContactId ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 border-r border-gray-200 flex-col bg-gray-50`}>
               {/* Contact Select */}
               <div className="p-3 border-b border-gray-200 bg-white">
                 <select 
                   className="w-full p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                   onChange={(e) => {
                     const id = Number(e.target.value);
                     if (id) setSelectedContactId(id);
                     e.target.value = '';
                   }}
                   value=""
                 >
                   <option value="" disabled>Start conversation...</option>
                   {usersData?.users?.map(u => (
                     <option key={u.id} value={u.id}>{u.full_name}</option>
                   ))}
                 </select>
               </div>

               {/* Conversation List */}
               <div className="flex-1 overflow-y-auto">
                 {conversationsData?.conversations?.map(conv => (
                   <div 
                     key={conv.contact_id}
                     onClick={() => setSelectedContactId(conv.contact_id)}
                     className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                       selectedContactId === conv.contact_id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                     }`}
                   >
                     <div className="flex justify-between items-start">
                       <div className="font-bold text-gray-800">{conv.contact_name}</div>
                       {conv.unread_count > 0 && (
                         <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{conv.unread_count}</span>
                       )}
                     </div>
                     <div className="text-xs text-gray-500 truncate mt-1">{conv.last_message || 'No messages'}</div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Message Area */}
          {(!activeTab || activeTab === 'public' || (activeTab === 'private' && selectedContactId)) ? (
             <div className={`flex-1 flex flex-col min-w-0 ${activeTab === 'private' && !selectedContactId ? 'hidden sm:flex' : 'flex'}`}>
               
               {/* Header for Private Chat */}
               {activeTab === 'private' && selectedContactId && (
                 <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
                   <button onClick={() => setSelectedContactId(null)} className="sm:hidden text-gray-500">
                     <i className="fas fa-arrow-left"></i>
                   </button>
                   <div className="font-bold text-lg text-gray-800">
                     {getContact?.full_name || 'Utilisateur inconnu'}
                   </div>
                   <span className={`px-2 py-0.5 rounded-full text-xs ${getContact?.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                     {getContact?.role}
                   </span>
                 </div>
               )}

               {/* Bulk Actions */}
               {selectionMode && (
                 <div className="bg-blue-50 p-2 flex items-center justify-between px-4 border-b border-blue-100">
                   <span className="text-sm font-bold text-blue-800">{selectedMessages.length} selected</span>
                   <div className="flex gap-2">
                      <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-500 text-white rounded text-xs font-bold">Delete</button>
                      <button onClick={() => { setSelectionMode(false); setSelectedMessages([]); }} className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-bold">Cancel</button>
                   </div>
                 </div>
               )}

               {/* Messages List */}
               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {sortedMessages.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                      <i className="fas fa-comments text-4xl mb-2"></i>
                      <p>Aucun message</p>
                    </div>
                  )}
                  
                  {sortedMessages.map(msg => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}>
                        {selectionMode && canDelete(msg) && (
                          <input 
                            type="checkbox" 
                            checked={selectedMessages.includes(msg.id)}
                            onChange={() => toggleSelection(msg.id)}
                            className="mr-2 mt-2"
                          />
                        )}
                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm relative ${
                          isMe ? 'bg-blue-100 rounded-tr-sm' : 'bg-white rounded-tl-sm border border-gray-200'
                        }`}>
                          {/* Metadata */}
                          <div className={`flex items-center gap-2 mb-1 text-xs ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <span 
                                className="font-bold text-gray-700 cursor-pointer hover:text-blue-600"
                                onClick={() => {
                                   if (activeTab === 'public') {
                                     setActiveTab('private');
                                     setSelectedContactId(msg.sender_id);
                                   }
                                }}
                              >
                                {msg.sender_name}
                              </span>
                            )}
                            <span className="text-gray-400">{formatDateEST(msg.created_at, true)}</span>
                          </div>

                          {/* Content */}
                          {msg.audio_file_key ? (
                             <div className="bg-white/50 p-2 rounded-lg flex items-center gap-2 min-w-[200px]">
                               <audio controls src={`/api/audio/${msg.audio_file_key}`} className="h-8 w-full" />
                             </div>
                          ) : (
                             <p className={`whitespace-pre-wrap break-words text-sm ${isMe ? 'text-blue-900' : 'text-gray-800'}`}>
                               {msg.content}
                             </p>
                          )}

                          {/* Actions */}
                          {!selectionMode && canDelete(msg) && (
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`absolute -top-2 ${isMe ? '-left-2' : '-right-2'} w-6 h-6 bg-white rounded-full shadow text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
               </div>

               {/* Input Area */}
               <div className="p-3 bg-white border-t border-gray-200 shadow-lg z-20">
                 {isRecording || audioBlob ? (
                   <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      {audioBlob ? (
                        <audio controls src={audioURL!} className="flex-1 h-8" />
                      ) : (
                        <div className="flex items-center gap-2 flex-1 text-red-600 animate-pulse font-bold">
                          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                          Recording... {recordingDuration}s
                        </div>
                      )}
                      
                      {isRecording ? (
                        <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"><i className="fas fa-stop"></i></button>
                      ) : (
                        <>
                          <button onClick={handleSendAudio} className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-sm">Send</button>
                          <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-gray-700"><i className="fas fa-times"></i></button>
                        </>
                      )}
                   </div>
                 ) : (
                   <div className="flex gap-2 items-end">
                      {!selectionMode ? (
                        <button 
                          onClick={() => setSelectionMode(true)} 
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Select messages"
                        >
                          <i className="fas fa-check-square"></i>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectionMode(false)} 
                          className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                      
                      <div className="flex-1 relative">
                        <textarea
                          value={messageContent}
                          onChange={e => setMessageContent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message..."
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none text-sm"
                          rows={1}
                        />
                        {isSpeechSupported && (
                          <button 
                            onClick={toggleDictation}
                            className={`absolute right-2 bottom-2 p-1 rounded-full transition-colors ${isDictating ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-500'}`}
                          >
                            <i className={`fas ${isDictating ? 'fa-stop-circle' : 'fa-microphone-alt'}`}></i>
                          </button>
                        )}
                      </div>
                      
                      <button 
                        onClick={startRecording}
                        className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Record audio"
                      >
                        <i className="fas fa-microphone"></i>
                      </button>
                      
                      <button 
                        onClick={handleSendMessage}
                        disabled={!messageContent.trim()}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all transform active:scale-95"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                   </div>
                 )}
               </div>

             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
               <i className="fas fa-comments text-6xl mb-4 opacity-20"></i>
               <h3 className="text-xl font-bold text-gray-600">Select a conversation</h3>
               <p className="text-sm max-w-xs mx-auto mt-2">Choose a contact from the list to start messaging.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MessagingModal;
