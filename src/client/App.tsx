import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import RoleDropdown from './components/RoleDropdown'
import NotificationModal from './components/NotificationModal'
import ConfirmModal from './components/ConfirmModal'
import PromptModal from './components/PromptModal'
import UserManagementModal from './components/UserManagementModal'
import MessagingModal from './components/MessagingModal'
import { CreateTicketModal } from './components/CreateTicketModal'
import TicketDetailsModal from './components/TicketDetailsModal'
import RPCStatus from './components/RPCStatus'
import VoiceTicketFab from './components/VoiceTicketFab'
import { User, TicketPriority } from './types'
import { client, getAuthToken } from './api'

// Create a client
const queryClient = new QueryClient()

const MOCK_USER: User = {
    id: 1,
    email: 'admin@igpglass.ca',
    first_name: 'Admin',
    last_name: 'System',
    role: 'admin',
    full_name: 'Admin System'
};

const AppContent = () => {
  const [role, setRole] = useState('operator');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [initialContactId, setInitialContactId] = useState<number | null>(null);
  const [initialTicketDescription, setInitialTicketDescription] = useState<string>('');
  const [initialImageUrl, setInitialImageUrl] = useState<string>('');
  const [initialTicketTitle, setInitialTicketTitle] = useState<string>('');
  const [initialTicketPriority, setInitialTicketPriority] = useState<TicketPriority>('medium');
  const [initialTicketMachineId, setInitialTicketMachineId] = useState<number | null>(null);
  const [initialAssignedToName, setInitialAssignedToName] = useState<string>('');
  const [initialAssignedToId, setInitialAssignedToId] = useState<number | null>(null);
  const [initialScheduledDate, setInitialScheduledDate] = useState<string>('');
  
  // Modal States
  const [notification, setNotification] = useState<{isOpen: boolean, type: 'success'|'error'|'info', message: string} | null>(null);
  const [confirm, setConfirm] = useState<{isOpen: boolean, message: string} | null>(null);
  const [prompt, setPrompt] = useState<{isOpen: boolean, message: string} | null>(null);

  // Fetch real user
  const { data: realUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      const res = await client.api.auth.me.$get();
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    },
    retry: false
  });

  const currentUser = realUser ? { 
      ...realUser, 
      full_name: `${realUser.first_name} ${realUser.last_name || ''}`.trim() 
  } as User : MOCK_USER;

  const openTicketDetails = (id: number) => {
    setSelectedTicketId(id);
    setIsTicketDetailsOpen(true);
  };

  const handleVoiceTicketDetected = (data: any) => {
    console.log("🎤 Voice Ticket Detected:", data);
    setInitialTicketTitle(data.title || '');
    setInitialTicketDescription(data.description || '');
    // Normalize priority to lowercase to ensure UI matches
    setInitialTicketPriority((data.priority?.toLowerCase() as TicketPriority) || 'medium');
    setInitialTicketMachineId(data.machine_id || null);
    
    // New fields
    if (data.assigned_to_name) setInitialAssignedToName(data.assigned_to_name);
    if (data.assigned_to_id) setInitialAssignedToId(data.assigned_to_id);
    if (data.scheduled_date) setInitialScheduledDate(data.scheduled_date);
    
    setIsCreateTicketOpen(true);
  };

  // Handle URL parameters and Service Worker messages
  useEffect(() => {
    console.log("App mounted, checking params:", window.location.search);
    // 1. Handle URL parameters on load (e.g. from notification click)
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('ticket');
    const createTicket = params.get('createTicket'); // New param
    const openMessages = params.get('openMessages');
    const openAudio = params.get('openAudioMessage');
    
    if (ticketId) {
      console.log('[App] Opening ticket from URL:', ticketId);
      openTicketDetails(Number(ticketId));
      window.history.replaceState({}, '', '/');
    } 
    else if (createTicket) {
        console.log('[App] Opening create ticket from URL');
        
        setIsCreateTicketOpen(true);
        const description = params.get('description');
        const imageUrl = params.get('imageUrl');
        const title = params.get('title');
        const priority = params.get('priority');
        const machineId = params.get('machineId');
        const assignedToName = params.get('assignedToName');
        const scheduledDate = params.get('scheduledDate');
        
        if (description) setInitialTicketDescription(description);
        if (imageUrl) setInitialImageUrl(imageUrl);
        if (title) setInitialTicketTitle(title);
        if (priority) setInitialTicketPriority(priority as TicketPriority);
        if (machineId) setInitialTicketMachineId(Number(machineId));
        if (assignedToName) setInitialAssignedToName(assignedToName);
        if (scheduledDate) setInitialScheduledDate(scheduledDate);
        
        // On nettoie l'URL proprement
        setTimeout(() => {
            window.history.replaceState({}, '', '/');
        }, 500);
    }
    else if (openMessages) {
       console.log('[App] Opening messages from URL:', openMessages);
       setInitialContactId(Number(openMessages));
       setIsMsgModalOpen(true);
       window.history.replaceState({}, '', '/');
    }
    else if (openAudio) {
        // Similar to messages but might want to auto-play in future
        console.log('[App] Opening audio message from URL:', openAudio);
        const senderId = params.get('sender');
        if (senderId) setInitialContactId(Number(senderId));
        setIsMsgModalOpen(true);
        window.history.replaceState({}, '', '/');
    }

    // 2. Listen for messages from Service Worker (when app is already open)
    const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
            console.log('[App] Received SW message:', event.data);
            const { action, data } = event.data;
            
            if ((action === 'view_ticket' || action === 'view') && (data.ticketId || data.ticket_id)) {
                openTicketDetails(Number(data.ticketId || data.ticket_id));
            }
            else if (action === 'new_private_message' && data.senderId) {
                setInitialContactId(Number(data.senderId));
                setIsMsgModalOpen(true);
            }
            else if (action === 'new_audio_message' && data.senderId) {
                setInitialContactId(Number(data.senderId));
                setIsMsgModalOpen(true);
            }
        }
    };

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
  }, []);

  return (
    <>
        {/* CONTROL PANEL & WIDGETS (Bottom Left) */}
        <div className="fixed bottom-4 left-4 z-[9998] group font-sans">
            {/* DEBUG PANEL */}
            <div className="bg-red-100 border-2 border-red-500 p-2 rounded mb-2 text-xs text-red-800 font-bold opacity-50 hover:opacity-100 transition-opacity">
                <p>DEBUG MODE v2.18.1 (Fix Micro)</p>
                <p>URL: {window.location.search || '(empty)'}</p>
                <p>Modal Open: {isCreateTicketOpen ? 'YES' : 'NO'}</p>
                <button 
                    className="mt-1 bg-red-600 text-white px-2 py-1 rounded w-full hover:bg-red-700"
                    onClick={() => {
                        console.log("Force open clicked");
                        setIsCreateTicketOpen(true);
                    }}
                >
                    FORCE OPEN MODAL
                </button>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-blue-200 p-4 rounded-xl shadow-2xl transition-all hover:shadow-blue-500/20 max-w-sm max-h-[90vh] overflow-y-auto">
                <div className="mb-3">
                    <RPCStatus />
                </div>
                <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Modern Frontend Active</h3>
                        <p className="text-xs text-slate-500">Phase 6: Ticket Workflow</p>
                    </div>
                </div>
                
                {/* User Management */}
                <div className="mb-2">
                    <button 
                        onClick={() => setIsUserModalOpen(true)}
                        className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-all"
                    >
                        <i className="fas fa-users-cog mr-2"></i>
                        User Manager
                    </button>
                </div>

                {/* Messaging */}
                <div className="mb-2">
                    <button 
                        onClick={() => setIsMsgModalOpen(true)}
                        className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all"
                    >
                        <i className="fas fa-comments mr-2"></i>
                        Messaging
                    </button>
                </div>

                {/* Ticket Workflow */}
                <div className="mb-4 space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Maintenance Tickets</p>
                    <button 
                        onClick={() => setIsCreateTicketOpen(true)}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold shadow-lg hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        <i className="fas fa-plus-circle mr-2"></i>
                        Créer un Ticket
                    </button>
                    
                    <div className="flex gap-2">
                         <button 
                            onClick={() => openTicketDetails(1)}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                        >
                            Ticket #1
                        </button>
                        <button 
                            onClick={() => openTicketDetails(2)}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                        >
                            Ticket #2
                        </button>
                    </div>
                </div>

                {/* Role Dropdown Test */}
                <div className="mb-4 pt-2 border-t border-slate-100">
                    <RoleDropdown 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        currentUserRole="admin"
                        variant="blue"
                    />
                </div>
            </div>
        </div>

        {/* VOICE TICKET FAB (Magic Button) - Positioned Independently */}
        <VoiceTicketFab onTicketDetected={handleVoiceTicketDetected} />

        {/* Render Modals */}
        <MessagingModal 
            isOpen={isMsgModalOpen}
            onClose={() => setIsMsgModalOpen(false)}
            currentUser={currentUser}
            initialContactId={initialContactId || undefined}
        />

        <UserManagementModal 
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            currentUser={currentUser}
            onOpenMessage={(user) => setNotification({isOpen: true, type: 'info', message: `Open message for ${user.full_name}`})}
        />

        <CreateTicketModal
            isOpen={isCreateTicketOpen}
            onClose={() => setIsCreateTicketOpen(false)}
            currentUserRole={currentUser.role as any}
            initialDescription={initialTicketDescription}
            initialImageUrl={initialImageUrl}
            initialTitle={initialTicketTitle}
            initialPriority={initialTicketPriority}
            initialMachineId={initialTicketMachineId}
            initialAssignedToName={initialAssignedToName}
            initialAssignedToId={initialAssignedToId}
            initialScheduledDate={initialScheduledDate}
        />

        <TicketDetailsModal
            isOpen={isTicketDetailsOpen}
            onClose={() => setIsTicketDetailsOpen(false)}
            ticketId={selectedTicketId}
            currentUserRole={currentUser.role as any}
            currentUserId={currentUser.id}
        />

        <NotificationModal 
            isOpen={!!notification?.isOpen} 
            onClose={() => setNotification(null)}
            type={notification?.type || 'info'}
            message={notification?.message || ''}
        />
        
        <ConfirmModal
            isOpen={!!confirm?.isOpen}
            onClose={() => setConfirm(null)}
            onConfirm={() => {
                setConfirm(null);
                setTimeout(() => setNotification({isOpen: true, type: 'success', message: 'Action confirmed!'}), 300);
            }}
            title="Confirmation Needed"
            message={confirm?.message || ''}
            isDestructive={true}
        />

        <PromptModal
            isOpen={!!prompt?.isOpen}
            onClose={() => setPrompt(null)}
            onConfirm={(val) => {
                setPrompt(null);
                setTimeout(() => setNotification({isOpen: true, type: 'info', message: `Input: ${val}`}), 300);
            }}
            title="Input Required"
            message={prompt?.message || ''}
            placeholder="Type something..."
        />
    </>
  )
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
