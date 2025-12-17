import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Calendar, User, Clock, AlertTriangle, CheckCircle, 
  MessageSquare, Paperclip, Mic, MicOff, Play, Pause, Trash2,
  ChevronRight, Send, Image as ImageIcon, FileText,
  MoreVertical, Edit2, Loader2, Bot
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { AIChatModal } from './AIChatModal';
import { getTicketDetails, updateTicketStatus, assignTicket, uploadTicketMedia, getTechnicians, updateTicketMachineStatus } from '../services/ticketService';
import { commentService } from '../services/commentService';
import { Ticket, TicketStatus, TicketPriority, UserRole } from '../types';

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  currentUserRole?: UserRole;
  currentUserId?: number;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  ticketId, 
  currentUserRole,
  currentUserId 
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'comments'>('details');
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Hooks pour audio/vocal
  const { isListening, startListening, stopListening, hasRecognition } = useSpeechRecognition({
    onResult: (text) => setCommentText(prev => prev + (prev ? ' ' : '') + text),
    language: 'fr-FR'
  });

  const { isRecording, audioURL: audioUrl, recordingDuration: recordingTime, startRecording, stopRecording, cancelRecording: clearAudio } = useAudioRecorder();

  // Queries
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketDetails(ticketId!),
    enabled: !!ticketId && isOpen,
    refetchInterval: 30000 // Rafraîchissement auto toutes les 30s
  });

  const { data: commentsData } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => commentService.getAllByTicketId(ticketId!),
    enabled: !!ticketId && isOpen,
    refetchInterval: 10000 // Chat plus réactif
  });
  const comments = commentsData?.comments || [];

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
    enabled: isOpen && (currentUserRole === 'admin' || currentUserRole === 'supervisor'),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: TicketStatus }) => updateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] }); // Rafraîchir la liste principale
      setNewStatus(null);
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, techId }: { id: number, techId: number | null }) => assignTicket(id, techId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setIsAssigning(false);
    }
  });

  const machineStatusMutation = useMutation({
    mutationFn: ({ id, isDown }: { id: number, isDown: boolean }) => updateTicketMachineStatus(id, isDown),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      // Note: Audio upload logic for comments is simplified here.
      // In a real scenario, we'd upload the blob to media service first, then link it.
      // For now, we'll just post text.
      if (audioUrl) {
         // Fallback for audio if not fully implemented in comment service
         return commentService.create({
            ticket_id: ticketId!,
            user_name: 'Moi', // Should use real name
            comment: "Note vocale (Audio upload not linked yet)"
         });
      }
      return commentService.create({
        ticket_id: ticketId!,
        user_name: 'Moi', // Should be dynamic based on user
        comment: commentText
      });
    },
    onSuccess: () => {
      setCommentText('');
      clearAudio();
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
    }
  });

  // Scroll to bottom of comments
  useEffect(() => {
    if (activeTab === 'comments' && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  if (!isOpen || !ticketId) return null;

  // Helpers pour l'UI
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'diagnostic': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'in_progress': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'waiting_parts': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case 'received': return 'OUVERT';
      case 'diagnostic': return 'DIAGNOSTIC';
      case 'in_progress': return 'EN COURS';
      case 'waiting_parts': return 'EN ATTENTE';
      case 'completed': return 'TERMINÉ';
      case 'archived': return 'ARCHIVÉ';
      default: return status.toUpperCase();
    }
  };

  const getPriorityColor = (p: TicketPriority) => {
    switch (p) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-100';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'low': return 'text-green-600 bg-green-50 border-green-100';
    }
  };

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'supervisor' || ticket?.created_by === currentUserId;
  const canAssign = currentUserRole === 'admin' || currentUserRole === 'supervisor';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : !ticket ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Ticket introuvable</h3>
            <button onClick={onClose} className="mt-4 text-blue-600 hover:underline">Fermer</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-white z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-400">#{ticket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 line-clamp-1">{ticket.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {ticket.created_by_name || 'Inconnu'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(ticket.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {ticket.machine_name}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="mr-2 flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Bot className="w-5 h-5" />
                <span className="text-sm font-bold hidden sm:inline">Demander conseil</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              {[
                { id: 'details', label: 'Détails', icon: FileText },
                { id: 'media', label: 'Photos / Vidéos', icon: ImageIcon },
                { id: 'comments', label: 'Commentaires', icon: MessageSquare },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              
              {/* TAB: DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Description</h3>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {ticket.description || "Aucune description fournie."}
                    </p>
                  </div>

                  {/* Actions Rapides (Assignation & Statut) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                        <span>Assignation</span>
                        {canAssign && (
                          <button 
                            onClick={() => setIsAssigning(!isAssigning)}
                            className="text-blue-600 text-xs hover:underline"
                          >
                            {isAssigning ? 'Annuler' : 'Modifier'}
                          </button>
                        )}
                      </h3>
                      
                      {isAssigning ? (
                        <div className="space-y-3">
                          <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            onChange={(e) => assignMutation.mutate({ id: ticket.id, techId: Number(e.target.value) || null })}
                            defaultValue={ticket.assigned_to || ""}
                          >
                            <option value="">Non assigné</option>
                            {technicians.map(t => (
                              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                            ))}
                          </select>
                          {assignMutation.isPending && <p className="text-xs text-blue-500 animate-pulse">Mise à jour...</p>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${ticket.assigned_to ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            {ticket.assigned_to_name ? ticket.assigned_to_name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{ticket.assigned_to_name || "Non assigné"}</p>
                            <p className="text-xs text-gray-500">Technicien responsable</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">Statut du ticket</h3>
                        {currentUserRole === 'operator' && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md font-medium">
                            Réservé aux techniciens
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: 'received', label: 'OUVERT' },
                          { val: 'in_progress', label: 'EN COURS' },
                          { val: 'waiting_parts', label: 'EN ATTENTE' },
                          { val: 'completed', label: 'TERMINÉ' }
                        ].map((s) => (
                          <button
                            key={s.val}
                            onClick={() => statusMutation.mutate({ id: ticket.id, status: s.val as TicketStatus })}
                            disabled={ticket.status === s.val || statusMutation.isPending || currentUserRole === 'operator'}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                              ticket.status === s.val 
                                ? getStatusColor(s.val as TicketStatus) + ' ring-2 ring-offset-1 ring-blue-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Machine Status Toggle removed from here - moved to dedicated block below */}
                    </div>
                  </div>

                  {/* Machine Status Block - Added explicitly to be visible on ALL tickets */}
                  <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-300 ${
                    ticket.is_machine_down 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${ticket.is_machine_down ? 'text-red-800' : 'text-gray-900'}`}>
                        {ticket.is_machine_down && <AlertTriangle className="w-4 h-4" />}
                        État de la machine
                      </h3>
                      {ticket.is_machine_down ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          MACHINE À L'ARRÊT
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          OPÉRATIONNELLE
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          ticket.is_machine_down ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {ticket.is_machine_down ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${ticket.is_machine_down ? 'text-red-900' : 'text-gray-900'}`}>
                            {ticket.is_machine_down ? 'Machine hors service' : 'Machine fonctionnelle'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {ticket.is_machine_down 
                              ? 'Cette machine est actuellement déclarée en panne.' 
                              : 'Aucun arrêt machine signalé pour ce ticket.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => machineStatusMutation.mutate({ id: ticket.id, isDown: !ticket.is_machine_down })}
                        disabled={machineStatusMutation.isPending}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-w-[180px] ${
                          ticket.is_machine_down
                            ? 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:shadow-md'
                            : 'bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:shadow-md'
                        }`}
                      >
                        {machineStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Traitement...
                          </>
                        ) : ticket.is_machine_down ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Remettre en service
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4" />
                            Déclarer HS
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MEDIA */}
              {activeTab === 'media' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                    <p>Aucune photo ou vidéo pour le moment.</p>
                    <p className="text-xs mt-2">(Fonctionnalité de galerie en cours de développement)</p>
                  </div>
                </div>
              )}

              {/* TAB: COMMENTS */}
              {activeTab === 'comments' && (
                <div className="flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-10">Aucun commentaire. Soyez le premier à écrire !</p>
                    ) : (
                      comments.map((c: any) => {
                        // 🛑 SAFE RENDER: Ensure we render simple strings or nothing
                        const contentText = typeof c.comment === 'string' ? c.comment : 
                                            typeof c.content === 'string' ? c.content : 
                                            typeof c.comment === 'object' ? JSON.stringify(c.comment) : 'Message non affichable';
                        
                        const userName = typeof c.user_name === 'string' ? c.user_name : 'U';

                        return (
                        <div key={c.id} className={`flex gap-3 ${c.user_id === currentUserId ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                            {userName.charAt(0)}
                          </div>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            c.user_id === currentUserId 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                          }`}>
                            {c.type === 'audio' ? (
                              <div className="flex items-center gap-2">
                                <button className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                                  <Play className="w-4 h-4" />
                                </button>
                                <span>Note vocale (0:15)</span>
                              </div>
                            ) : (
                              <p className="break-words">{contentText}</p>
                            )}
                            <p className={`text-[10px] mt-1 opacity-70 text-right`}>
                              {c.created_at ? format(new Date(c.created_at), 'HH:mm') : ''}
                            </p>
                          </div>
                        </div>
                      )})
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Input Zone */}
                  <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-end gap-2">
                    {isRecording ? (
                      <div className="flex-1 flex items-center justify-between bg-red-50 px-4 py-2 rounded-lg animate-pulse">
                        <span className="text-red-600 font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                          Enregistrement... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                        <button onClick={stopRecording} className="p-1.5 bg-red-200 text-red-700 rounded-full hover:bg-red-300">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : audioUrl ? (
                      <div className="flex-1 flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
                        <span className="text-blue-600 font-medium flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Note vocale prête
                        </span>
                        <button onClick={clearAudio} className="p-1.5 hover:bg-blue-200 rounded-full text-blue-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 relative">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Écrire un commentaire..."
                          className="w-full pl-3 pr-10 py-3 bg-transparent resize-none focus:outline-none text-sm max-h-20"
                          rows={1}
                        />
                        {hasRecognition && (
                          <button 
                            onClick={isListening ? stopListening : startListening}
                            className={`absolute right-2 top-2 p-1.5 rounded-full transition-colors ${
                              isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      {!commentText && !audioUrl && !isRecording && (
                        <button 
                          onClick={startRecording}
                          className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Enregistrer un message vocal"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}
                      {(commentText || audioUrl) && (
                        <button
                          onClick={() => commentMutation.mutate()}
                          disabled={commentMutation.isPending}
                          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
                        >
                          {commentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
        <AIChatModal 
          isOpen={isAIChatOpen} 
          onClose={() => setIsAIChatOpen(false)} 
          ticket={ticket} 
        />
      </div>
    </div>
  );
};

export default TicketDetailsModal;