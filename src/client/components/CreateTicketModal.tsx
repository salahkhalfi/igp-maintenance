import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Machine, TicketPriority } from '../types';
import { ticketService } from '../services/ticketService';
import { localDateTimeToUTC } from '../utils/dateUtils';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTicketCreated?: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, currentUser, onTicketCreated }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [machineId, setMachineId] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: string; name: string; size: number }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningField, setListeningField] = useState<'title' | 'desc' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const recognitionRef = useRef<any>(null);

  // Data Fetching
  const { data: machines = [] } = useQuery({
    queryKey: ['machines'],
    queryFn: ticketService.getMachines,
    enabled: isOpen,
    staleTime: 1000 * 60 * 5
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: ticketService.getTechnicians,
    enabled: isOpen && (currentUser.role === 'admin' || currentUser.role === 'supervisor'),
    staleTime: 1000 * 60 * 5
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await ticketService.createTicket(data);
      const ticketId = result.ticket.id;

      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          await ticketService.uploadMedia(ticketId, mediaFiles[i]);
          setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      resetForm();
      onClose();
      if (onTicketCreated) onTicketCreated();
      alert('Ticket créé avec succès !'); // Using alert for parity with legacy, can be upgraded to Toast later
    },
    onError: (err: any) => {
      alert('Erreur: ' + err.message);
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMachineId('');
    setPriority('medium');
    setAssignedTo('');
    setScheduledDate('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setUploadProgress(0);
  };

  // Voice Recognition
  const startVoiceInput = (fieldSetter: React.Dispatch<React.SetStateAction<string>>, currentVal: string, fieldName: 'title' | 'desc') => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setListeningField(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setListeningField(fieldName);
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningField(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newValue = currentVal ? (currentVal + ' ' + transcript) : transcript;
      const formattedValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
      fieldSetter(formattedValue);
    };

    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreviews(prev => [...prev, {
            url: reader.result as string,
            type: file.type,
            name: file.name,
            size: file.size
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const utcTime = new Date();
    const localTimestamp = utcTime.getFullYear() + '-' + 
      String(utcTime.getMonth() + 1).padStart(2, '0') + '-' + 
      String(utcTime.getDate()).padStart(2, '0') + ' ' + 
      String(utcTime.getHours()).padStart(2, '0') + ':' + 
      String(utcTime.getMinutes()).padStart(2, '0') + ':' + 
      String(utcTime.getSeconds()).padStart(2, '0');

    const requestData: any = {
      title,
      description,
      reporter_name: currentUser.first_name || currentUser.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
      machine_id: parseInt(machineId),
      priority,
      created_at: localTimestamp
    };

    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      if (assignedTo) requestData.assigned_to = parseInt(assignedTo);
      if (scheduledDate) requestData.scheduled_date = localDateTimeToUTC(scheduledDate);
    }

    createTicketMutation.mutate(requestData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform-gpu translate-z-0 border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-3">
            <i className="fas fa-plus-circle text-2xl text-blue-300"></i>
            <h2 className="text-xl font-bold">Nouvelle Demande</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-white to-blue-50/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">
                  <i className="fas fa-heading mr-2 text-blue-600"></i>Titre du problème *
                </label>
                <button
                  type="button"
                  onClick={() => startVoiceInput(setTitle, title, 'title')}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                    isListening && listeningField === 'title'
                      ? 'bg-red-100 text-red-600 animate-pulse border border-red-200'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                  }`}
                >
                  <i className={`fas ${isListening && listeningField === 'title' ? 'fa-stop-circle' : 'fa-microphone'}`}></i>
                  {isListening && listeningField === 'title' ? 'Écoute...' : 'Dicter'}
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bruit anormal sur la machine"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">
                  <i className="fas fa-align-left mr-2 text-blue-600"></i>Description détaillée
                </label>
                <button
                  type="button"
                  onClick={() => startVoiceInput(setDescription, description, 'desc')}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                    isListening && listeningField === 'desc'
                      ? 'bg-red-100 text-red-600 animate-pulse border border-red-200'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                  }`}
                >
                  <i className={`fas ${isListening && listeningField === 'desc' ? 'fa-stop-circle' : 'fa-microphone'}`}></i>
                  {isListening && listeningField === 'desc' ? 'Écoute...' : 'Dicter'}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème (optionnel)..."
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
              />
            </div>

            {/* Machine */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <i className="fas fa-cog mr-2 text-blue-600"></i>Machine concernée *
              </label>
              <select
                required
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">-- Sélectionnez une machine --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.machine_type} {m.model} - {m.location}</option>
                ))}
              </select>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <i className="fas fa-camera mr-2 text-blue-600"></i>Photos / Vidéos
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input type="file" id="photo-upload" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <label htmlFor="photo-upload" className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors text-blue-600">
                  <i className="fas fa-camera text-xl mb-1"></i>
                  <span className="text-xs font-bold">Photo</span>
                </label>

                <input type="file" id="video-upload" accept="video/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <label htmlFor="video-upload" className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-red-300 rounded-xl bg-red-50 hover:bg-red-100 cursor-pointer transition-colors text-red-600">
                  <i className="fas fa-video text-xl mb-1"></i>
                  <span className="text-xs font-bold">Vidéo</span>
                </label>

                <input type="file" id="media-upload" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
                <label htmlFor="media-upload" className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-gray-600">
                  <i className="fas fa-images text-xl mb-1"></i>
                  <span className="text-xs font-bold">Galerie</span>
                </label>
              </div>

              {/* Previews */}
              {mediaPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      {preview.type.startsWith('image/') ? (
                        <img src={preview.url} alt={preview.name} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <video src={preview.url} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFiles(prev => prev.filter((_, i) => i !== index));
                          setMediaPreviews(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <i className="fas fa-exclamation-triangle mr-2 text-blue-600"></i>Priorité *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as TicketPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                      priority === p
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-1'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p === 'low' ? '🟢 Faible' :
                     p === 'medium' ? '🟡 Moy.' :
                     p === 'high' ? '🟠 Haute' : '🔴 Crit.'}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin/Supervisor Extra Fields */}
            {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                  <i className="fas fa-user-tie mr-2 text-purple-600"></i>Supervision
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Assigner à</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    >
                      <option value="">-- Non assigné --</option>
                      <option value="0">👥 Équipe</option>
                      {technicians.filter(t => t.id !== 0).map(t => (
                        <option key={t.id} value={t.id}>👤 {t.first_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Planification</label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {uploadProgress > 0 ? `Envoi ${uploadProgress}%` : 'Création...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Créer le ticket
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
