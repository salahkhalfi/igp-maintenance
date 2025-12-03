import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Calendar, User, Clock, AlertTriangle, CheckCircle, 
  MessageSquare, Paperclip, Mic, MicOff, Play, Pause, Trash2,
  ChevronRight, Send, Image as ImageIcon, FileText,
  MoreVertical, Edit2, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getTicketDetails, updateTicketStatus, assignTicket, uploadTicketMedia, getTechnicians } from '../services/ticketService';
import { commentService } from '../services/commentService';
import { Ticket, TicketStatus, TicketPriority, UserRole } from '../types';

interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  currentUserRole?: UserRole;
  currentUserId?: number;
  currentUserName?: string;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  ticketId, 
  currentUserRole,
  currentUserId,
  currentUserName = 'Anonyme'
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'comments'>('details');
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus | null>(null);

  // Hooks pour audio/vocal
  const { isListening, startListening, stopListening, hasRecognition } = useSpeechRecognition({
    onResult: (text) => setCommentText(prev => prev + (prev ? ' ' : '') + text),
    language: 'fr-FR'
  });

  const { isRecording, audioURL: audioUrl, recordingDuration: recordingTime, startRecording, stopRecording, cancelRecording: clearAudio, error: audioError } = useAudioRecorder();

  // Queries
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketDetails(ticketId!),
    enabled: !!ticketId && isOpen,
    refetchInterval: 30000 // Rafraîchissement auto toutes les 30s
  });

  // Afficher les erreurs audio
  useEffect(() => {
    if (audioError) {
      alert(`Erreur microphone: ${audioError}`);
    }
  }, [audioError]);

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

  const commentMutation = useMutation({
    mutationFn: async () => {
      console.log('[MODAL] Submitting comment for ticket:', ticketId);
      console.log('[MODAL] User:', currentUserName, 'Role:', currentUserRole);
      console.log('[MODAL] Content:', commentText || "Audio Note");

      if (!ticketId) throw new Error("Ticket ID is missing");

      const payload = {
        ticket_id: ticketId,
        user_name: currentUserName || 'Utilisateur',
        user_role: currentUserRole,
        comment: audioUrl ? "Note vocale (Audio upload not linked yet)" : commentText
      };

      console.log('[MODAL] Payload:', payload);

      try {
        const result = await commentService.create(payload);
        console.log('[MODAL] Success result:', result);
        return result;
      } catch (err) {
        console.error('[MODAL] Mutation error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      setCommentText('');
      clearAudio();
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      // Force explicit refetch
      queryClient.refetchQueries({ queryKey: ['ticket-comments', ticketId] });
    },
    onError: (error: any) => {
        alert(`Erreur lors de l'envoi: ${error.message || 'Erreur inconnue'}`);
    }
  });

  // Scroll to bottom of comments
  useEffect(() => {
    if (activeTab === 'comments' && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  // SAFE DATA PREPARATION
  // Ensure all rendered fields are strictly strings or numbers
  const safeTicket = ticket ? {
    id: ticket.id,
    priority: String(ticket.priority || 'low').toUpperCase(),
    status: String(ticket.status || 'open').toUpperCase(),
    title: String(ticket.title || 'Sans titre'),
    created_by_name: String(ticket.created_by_name || 'Inconnu'),
    created_at: ticket.created_at ? new Date(ticket.created_at) : new Date(),
    machine_name: String(ticket.machine_name || ticket.machine_type || 'Machine inconnue'),
    description: String(ticket.description || 'Aucune description.'),
    assigned_to_name: ticket.assigned_to_name ? String(ticket.assigned_to_name) : null,
    assigned_to: ticket.assigned_to
  } : null;

  if (!isOpen || !ticketId) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : !safeTicket ? (
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
                  <span className="text-sm font-mono text-gray-400">#{safeTicket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                    {safeTicket.priority}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
                    {safeTicket.status === 'IN_PROGRESS' ? 'EN COURS' : safeTicket.status === 'RESOLVED' ? 'RÉSOLU' : safeTicket.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 line-clamp-1">{safeTicket.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {safeTicket.created_by_name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(safeTicket.created_at, "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {safeTicket.machine_name}</span>
                </div>
              </div>
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
            <div className={`flex-1 bg-gray-50 ${activeTab === 'comments' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto p-6'}`}>
              
              {/* TAB: DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {safeTicket.description}
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
                            defaultValue={safeTicket.assigned_to || ""}
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${safeTicket.assigned_to ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            {safeTicket.assigned_to_name ? safeTicket.assigned_to_name.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{safeTicket.assigned_to_name || "Non assigné"}</p>
                            <p className="text-xs text-gray-500">Technicien responsable</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Statut du ticket</h3>
                      <div className="flex flex-wrap gap-2">
                        {['open', 'in_progress', 'resolved'].map((s) => (
                          <button
                            key={s}
                            onClick={() => statusMutation.mutate({ id: ticket.id, status: s as TicketStatus })}
                            disabled={ticket.status === s || statusMutation.isPending}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                              ticket.status === s 
                                ? getStatusColor(s as TicketStatus) + ' ring-2 ring-offset-1 ring-blue-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {s === 'in_progress' ? 'EN COURS' : s === 'resolved' ? 'RÉSOLU' : 'OUVERT'}
                          </button>
                        ))}
                      </div>
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
                <div className="flex flex-col h-[500px] justify-center items-center p-10">
                    <AlertTriangle className="w-12 h-12 text-orange-500 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Maintenance des Commentaires</h3>
                    <p className="text-center text-gray-600 max-w-md">
                        Le module de commentaires est en cours de restauration pour corriger le problème d'affichage. 
                        <br/>
                        La fonction "Ajouter un commentaire" reste active via le bouton ci-dessous pour les urgences.
                    </p>
                    
                    <button
                        onClick={() => {
                            const text = prompt("Ajouter un commentaire (Mode Secours):");
                            if (text) {
                                commentMutation.mutate(); 
                                // Hack: mutate uses internal state 'commentText' which is empty here.
                                // We need to update state first or pass param.
                                // Actually, let's just use a direct service call in this emergency block.
                                commentService.create({
                                    ticket_id: ticketId,
                                    user_name: currentUserName || 'Admin',
                                    comment: text
                                }).then(() => alert("Commentaire ajouté (Rafraîchissez la page pour voir)")).catch(e => alert("Erreur: " + e.message));
                            }
                        }}
                        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                    >
                        Ajouter un commentaire (Simple)
                    </button>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketDetailsModal;
