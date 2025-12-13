import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Mic, MicOff, Image as ImageIcon, Loader2, AlertCircle, CheckCircle, Calendar, User as UserIcon } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { createTicket, getMachines, getTechnicians, uploadTicketMedia } from '../services/ticketService';
import { UserRole, TicketPriority } from '../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: UserRole;
  initialDescription?: string;
  initialImageUrl?: string;
  initialTitle?: string;
  initialPriority?: TicketPriority;
  initialMachineId?: number | null;
  initialMachineName?: string;
  initialAssignedToName?: string;
  initialAssignedToId?: number | null;
  initialScheduledDate?: string;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ 
    isOpen, 
    onClose, 
    currentUserRole, 
    initialDescription, 
    initialImageUrl,
    initialTitle,
    initialPriority,
    initialMachineId,
    initialMachineName,
    initialAssignedToName,
    initialAssignedToId,
    initialScheduledDate
}) => {
  const queryClient = useQueryClient();
  
  // États du formulaire
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  
  // Reset form when modal opens with new initial data
  useEffect(() => {
    if (isOpen) {
        if (initialTitle) setTitle(initialTitle);
        if (initialDescription) setDescription(initialDescription);
        if (initialPriority) setPriority(initialPriority.toLowerCase() as TicketPriority);
        if (initialMachineId) setMachineId(initialMachineId);
        
        // Handle Scheduled Date (Robust parsing)
        if (initialScheduledDate) {
            try {
                // Force parse assuming ISO string from AI
                const date = new Date(initialScheduledDate);
                if (!isNaN(date.getTime())) {
                    // Manual formatting to YYYY-MM-DDTHH:mm to avoid timezone shifts
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    
                    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
                    setScheduledDate(formatted);
                }
            } catch (e) {
                console.warn("Invalid date format", initialScheduledDate);
            }
        }
    }
  }, [isOpen, initialTitle, initialDescription, initialPriority, initialMachineId, initialScheduledDate]);
  
  // Update description if initialDescription changes (e.g. when opening from URL)
  useEffect(() => {
    if (initialDescription) {
        setDescription(initialDescription);
        // Auto-generate title from first 50 chars if empty
        if (!title) {
            setTitle(initialDescription.slice(0, 50) + (initialDescription.length > 50 ? '...' : ''));
        }
    }
  }, [initialDescription]);

  // Handle initial image from URL (Deep Linking from Chat)
  useEffect(() => {
    const fetchImage = async () => {
        if (initialImageUrl && isOpen && selectedFiles.length === 0) {
            try {
                const response = await fetch(initialImageUrl);
                const blob = await response.blob();
                const filename = 'chat-attachment.jpg'; // Generic name
                const file = new File([blob], filename, { type: blob.type });
                setSelectedFiles([file]);
            } catch (error) {
                console.error("Failed to fetch initial image from URL", error);
            }
        }
    };
    fetchImage();
  }, [initialImageUrl, isOpen]);
  const [machineId, setMachineId] = useState<number | ''>('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  
  // Gestion des médias
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks personnalisés
  const { 
    isListening: isListeningTitle, 
    startListening: startListeningTitle, 
    stopListening: stopListeningTitle,
    hasRecognition: hasRecognitionSupport
  } = useSpeechRecognition({
    onResult: (text) => setTitle(prev => prev + (prev ? ' ' : '') + text),
    language: 'fr-FR'
  });

  const { 
    isListening: isListeningDesc, 
    startListening: startListeningDesc, 
    stopListening: stopListeningDesc 
  } = useSpeechRecognition({
    onResult: (text) => setDescription(prev => prev + (prev ? ' ' : '') + text),
    language: 'fr-FR'
  });

  // Récupération des données (Machines et Techniciens)
  const { data: machines = [] } = useQuery({
    queryKey: ['machines'],
    queryFn: getMachines,
    enabled: isOpen,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // ROBUST MACHINE AUTO-SELECTION (ID Priority -> Name Fallback)
  useEffect(() => {
    if (!isOpen || !machines || machines.length === 0) return;

    // 1. If we have an ID, try to set it
    if (initialMachineId) {
        setMachineId(Number(initialMachineId));
    }

    // 2. Fallback: Fuzzy Name Match if ID matches nothing or was missing
    // Logic: If current machineId is set, check if it's in the list.
    const currentId = initialMachineId ? Number(initialMachineId) : null;
    const exists = currentId ? machines.find((m: any) => m.id === currentId) : null;

    if (!exists && initialMachineName) {
        console.warn(`Machine ID ${initialMachineId} not found or missing. Trying fallback with Name: ${initialMachineName}`);
        const lowerInit = initialMachineName.toLowerCase();
        
        // Exact match first
        let match = machines.find((m: any) => 
            (m.machine_type + ' ' + (m.model||'')).toLowerCase() === lowerInit
        );
        
        // Then contains match
        if (!match) {
            match = machines.find((m: any) => 
                (m.machine_type + ' ' + (m.model||'')).toLowerCase().includes(lowerInit) ||
                lowerInit.includes((m.machine_type||'').toLowerCase())
            );
        }

        if (match) {
            console.log("🎯 [Modal] Machine fuzzy matched:", match.id, match.machine_type);
            setMachineId(match.id);
        }
    }
  }, [isOpen, machines, initialMachineId, initialMachineName]);

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
    enabled: isOpen, // CHARGEMENT SYSTÉMATIQUE (Comme les machines) - Fixe le bug de l'IA
    staleTime: 1000 * 60 * 5
  });

  // Auto-select technician with Retry/Sync logic
  // This ensures we set the value ONLY when both the ID is available AND the list is loaded
  useEffect(() => {
    if (!isOpen) return;

    // A. Priority: Direct ID
    if (initialAssignedToId) {
        // Force number conversion just in case
        const targetId = Number(initialAssignedToId);
        
        // Trust the ID if provided, even if list not fully loaded yet (it will sync)
        setAssignedTo(targetId);
        
        // Double check existence for debug
        const exists = technicians.find((t: any) => t.id === targetId);
        if (!exists && technicians.length > 0) {
             console.warn(`AI provided ID ${targetId} but not found in loaded technicians list.`);
        }
    }
    // B. Fallback: Name matching
    else if (initialAssignedToName && technicians.length > 0) {
        const lowerName = initialAssignedToName.toLowerCase();
        // ... (existing name matching logic)
        const target = technicians.find((t: any) => {
            const tFull = (t.full_name || '').toLowerCase();
            const searchParts = lowerName.split(' ').filter(p => p.length > 1);
            if (tFull.includes(lowerName)) return true;
            if (searchParts.length > 0) return searchParts.every(part => tFull.includes(part));
            return false;
        });

        if (target) setAssignedTo(target.id);
    }
  }, [isOpen, technicians, initialAssignedToName, initialAssignedToId]); // <--- Re-runs when 'technicians' list finally arrives!

  // Mutation pour la création
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      // 1. Créer le ticket
      const response = await createTicket({
        title,
        description,
        machine_id: Number(machineId),
        priority,
        assigned_to: assignedTo ? Number(assignedTo) : undefined,
        scheduled_date: scheduledDate || undefined
      });

      // 2. Uploader les médias si nécessaire
      if (selectedFiles.length > 0 && response.ticketId) {
        await Promise.all(selectedFiles.map(file => 
          uploadTicketMedia(file, response.ticketId)
        ));
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      resetForm();
      onClose();
      // Idéalement remplacer par un Toast
      alert('Ticket créé avec succès !'); 
    },
    onError: (error) => {
      console.error('Erreur création ticket:', error);
      alert("Une erreur est survenue lors de la création du ticket.");
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMachineId('');
    setPriority('medium');
    setAssignedTo('');
    setScheduledDate('');
    setSelectedFiles([]);
    setUploadProgress({});
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validation basique (taille/type)
      const validFiles = newFiles.filter(file => {
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
        return isValidSize && isValidType;
      });
      
      if (validFiles.length !== newFiles.length) {
        alert("Certains fichiers ont été ignorés (trop volumineux ou format incorrect).");
      }
      
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  // DEBUG: Temporarily allow everyone to see assignment fields to verify AI pre-filling
  // const canAssign = currentUserRole === 'admin' || currentUserRole === 'supervisor';
  const canAssign = true;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="modal-title"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 id="modal-title" className="text-2xl font-bold text-gray-800">Nouveau Ticket</h2>
            <p className="text-sm text-gray-500 mt-1">Signaler un problème ou une demande de maintenance</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* DEBUG INFO - MOVED TO TOP FOR VISIBILITY */}
        <div className="bg-red-100 border-l-4 border-red-500 text-red-900 p-4 m-4 mb-0 rounded shadow-md">
             <strong className="font-bold text-lg">🔧 DEBUG MODE v3.0 (FORCE UPDATE)</strong>
             <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                 <div>
                    <strong>AI Inputs:</strong><br/>
                    ID: {String(initialAssignedToId)}<br/>
                    Name: {initialAssignedToName || '(none)'}<br/>
                    Date: {initialScheduledDate || '(none)'}<br/>
                    Priority: {initialPriority || '(none)'}
                 </div>
                 <div>
                    <strong>System State:</strong><br/>
                    Role: {currentUserRole}<br/>
                    Can Assign: {canAssign ? 'YES' : 'NO (Role blocked)'}<br/>
                    Techs Loaded: {technicians.length}<br/>
                    Current Priority: {priority}
                 </div>
             </div>
        </div>

        {/* Corps du formulaire (défilable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Titre avec reconnaissance vocale */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Titre du problème <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Fuite d'huile sur la presse hydraulique"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
              {hasRecognitionSupport && (
                <button
                  type="button"
                  onClick={isListeningTitle ? stopListeningTitle : startListeningTitle}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                    isListeningTitle 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                  title="Dictée vocale"
                >
                  {isListeningTitle ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* Machine et Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Machine concernée <span className="text-red-500">*</span>
              </label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Sélectionner une machine...</option>
                {machines.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_type} {m.model ? `- ${m.model}` : ''} ({m.location || 'Non localisé'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Priorité
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'critical'] as TicketPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all border ${
                      priority === p 
                        ? p === 'critical' ? 'bg-red-100 border-red-500 text-red-700'
                        : p === 'high' ? 'bg-orange-100 border-orange-500 text-orange-700'
                        : p === 'medium' ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : p === 'high' ? 'Haute' : 'Critique'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème, les bruits anormaux, ou les circonstances..."
              rows={4}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            />
            {hasRecognitionSupport && (
              <button
                type="button"
                onClick={isListeningDesc ? stopListeningDesc : startListeningDesc}
                className={`absolute right-2 top-2 p-2 rounded-full transition-all ${
                  isListeningDesc 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                {isListeningDesc ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>

          {/* Zone Admin/Superviseur: Assignation */}
          {canAssign && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Planification (Optionnel)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Assigner à</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    <option value="">-- Sélectionner un technicien --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Date prévue</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                  </input>
                </div>
              </div>
            </div>
          )}

          {/* Upload Photos/Vidéos */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Photos ou Vidéos
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*,video/*"
                className="hidden"
              />
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Cliquez pour ajouter des fichiers</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, MP4 (Max 10Mo)</p>
            </div>

            {/* Liste des fichiers sélectionnés */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group bg-gray-50 rounded-lg p-2 border border-gray-200 flex items-center gap-2 overflow-hidden">
                    <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">VID</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pied de page (Actions) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={createTicketMutation.isPending}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => {
                if (!title) {
                    alert("Veuillez entrer un titre.");
                    return;
                }
                if (!machineId) {
                    alert("Veuillez sélectionner une machine concernée.");
                    return;
                }
                createTicketMutation.mutate();
            }}
            disabled={createTicketMutation.isPending}
            className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 
                ${(!title || !machineId) 
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-70' 
                    : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5'
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
          >
            {createTicketMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Créer le ticket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;