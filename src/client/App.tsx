import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import RoleDropdown from './components/RoleDropdown'
import NotificationModal from './components/NotificationModal'
import ConfirmModal from './components/ConfirmModal'
import PromptModal from './components/PromptModal'
import UserManagementModal from './components/UserManagementModal'
// import MessagingModal from './components/MessagingModal' // DEPRECATED: Old Messaging removed
import { CreateTicketModal } from './components/CreateTicketModal'
import TicketDetailsModal from './components/TicketDetailsModal'
import RPCStatus from './components/RPCStatus'
import VoiceTicketFab from './components/VoiceTicketFab'
import DataImportModal from './components/DataImportModal'
import MachineManagementModal from './components/MachineManagementModal'
import AppHeader from './components/AppHeader'
import KanbanBoard from './components/KanbanBoard'
import LoginForm from './components/LoginForm'
import { User, TicketPriority } from './types'
import { client, getAuthToken } from './api'
import { useTickets, useTicketMutations } from './hooks/useTickets'
import { useMachines } from './hooks/useMachines'
import { useSettings } from './hooks/useSettings'

// Create a client
const queryClient = new QueryClient()

// --- LEGACY BRIDGE COMPONENT ---
// Ce composant sert de pont entre le React Bundlé (Vite) et le React Global (CDN) utilisé par MainApp.js
const LegacyMainAppBridge = (props: any) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && (window as any).MainApp && (window as any).ReactDOM && (window as any).React) {
            console.log("🌉 Mounting Legacy MainApp Bridge...");
            const LegacyReact = (window as any).React;
            const LegacyReactDOM = (window as any).ReactDOM;
            const MainApp = (window as any).MainApp;

            // STRANGLER PATTERN: Disable Legacy Header by replacing it with a null component
            // This forces MainApp to render without its internal header
            // (window as any).AppHeader = () => null; // ROLLBACK: Re-enable Legacy Header

            // On utilise createElement de la version GLOBALE pour que les Hooks fonctionnent
            const element = LegacyReact.createElement(MainApp, props);
            
            // On rend dans la div conteneur gérée par le React moderne
            // Note: On utilise render (React 17 style) car c'est ce que le CDN fournit souvent, 
            // ou createRoot si dispo sur window.
            if (LegacyReactDOM.createRoot) {
                const root = LegacyReactDOM.createRoot(containerRef.current);
                root.render(element);
                return () => root.unmount();
            } else {
                LegacyReactDOM.render(element, containerRef.current);
                return () => LegacyReactDOM.unmountComponentAtNode(containerRef.current);
            }
        }
    }, [props]); // Re-render si les props changent (ex: tickets mis à jour)

    return <div ref={containerRef} id="legacy-root" />;
};

const MOCK_USER: User = {
    id: 0,
    email: 'guest@example.com',
    first_name: 'Visiteur',
    last_name: '',
    role: 'guest',
    full_name: 'Visiteur'
};

const AppContent = () => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [importTab, setImportTab] = useState<'users' | 'machines'>('users');
  
  // Ticket Modals State
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  
  // Create Ticket Initial State
  const [initialTicketDescription, setInitialTicketDescription] = useState<string>('');
  const [initialImageUrl, setInitialImageUrl] = useState<string>('');
  const [initialTicketTitle, setInitialTicketTitle] = useState<string>('');
  const [initialTicketPriority, setInitialTicketPriority] = useState<TicketPriority>('medium');
  const [initialTicketMachineId, setInitialTicketMachineId] = useState<number | null>(null);
  const [initialTicketMachineName, setInitialTicketMachineName] = useState<string>('');
  const [initialAssignedToName, setInitialAssignedToName] = useState<string>('');
  const [initialAssignedToId, setInitialAssignedToId] = useState<number | null>(null);
  const [initialScheduledDate, setInitialScheduledDate] = useState<string>('');

  // Fetch real user
  const { data: realUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      try {
          const res = await client.api.auth.me.$get();
          if (!res.ok) return null;
          const data = await res.json();
          return data.user;
      } catch (e) {
          return null;
      }
    },
    retry: false
  });

  // FIX: currentUser est null si pas connecté (Pas de MOCK_USER qui force le dashboard)
  const currentUser = realUser ? { 
      ...realUser, 
      full_name: `${realUser.first_name} ${realUser.last_name || ''}`.trim() 
  } as User : null;

  // --- MODERN DATA LAYER (PHASE 1) ---
  const { data: tickets = [], refetch: refetchTickets } = useTickets();
  const { data: machines = [] } = useMachines();
  const { data: settings } = useSettings();
  const { moveTicket, deleteTicket } = useTicketMutations();

  // Bridge Functions (Wrappers for Mutations)
  const handleMoveTicket = async (id: number, status: string, log: string) => {
      try {
        await moveTicket.mutateAsync({ id, status, log });
      } catch (e) {
          console.error("Move ticket failed", e);
          alert("Erreur lors du déplacement du ticket");
      }
  };

  const handleDeleteTicket = async (id: number) => {
      try {
        await deleteTicket.mutateAsync(id);
      } catch (e) {
          console.error("Delete ticket failed", e);
          alert("Erreur lors de la suppression");
      }
  };

  // Expose Bridges to Window for Legacy Calls
  useEffect(() => {
    (window as any).openUserManagement = () => setIsUserModalOpen(true);
    (window as any).openMachineManagement = () => setIsMachineModalOpen(true);
    (window as any).openDataImport = (type: 'users'|'machines') => {
        setImportTab(type);
        setIsImportModalOpen(true);
    };
  }, []);

  if (!currentUser && !getAuthToken()) {
      return <LoginForm onLogin={() => window.location.reload()} />;
  }

  return (
    <>
        {/* MODERN HEADER (DISABLED FOR ROLLBACK) */}
        {/* <AppHeader 
            currentUser={currentUser}
            activeTicketsCount={tickets.filter((t: any) => t.status !== 'completed' && t.status !== 'archived').length}
            
            // Dynamic Settings
            headerTitle={settings?.title}
            headerSubtitle={settings?.subtitle}
            messengerName={settings?.messengerName}
            activeModules={settings?.modules}
            logoUrl={settings?.logoUrl}

            onRefresh={refetchTickets}
            onLogout={() => {
                localStorage.removeItem('auth_token');
                window.location.reload();
            }}
            onOpenCreateModal={() => setIsCreateTicketOpen(true)}
            onOpenUserManagement={() => setIsUserModalOpen(true)}
            onOpenMachineManagement={() => setIsMachineModalOpen(true)}
            // State
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            // Legacy placeholders
            onOpenOverdue={() => alert("Module 'Retard' en cours de migration...")}
            onOpenPerformance={() => alert("Module 'Performance' en cours de migration...")}
            onOpenPlanning={() => alert("Module 'Planning' en cours de migration...")}
            onOpenManageColumns={() => alert("Configuration Colonnes : Bientôt disponible")}
            onOpenSystemSettings={() => alert("Paramètres Système : Bientôt disponible")}
            onOpenAdminRoles={() => alert("Gestion Rôles : Bientôt disponible")}
            onOpenTv={() => window.open('/tv', '_blank')}
            onOpenAIChat={() => alert("Assistant IA : Utilisez le bouton flottant")}
            onOpenPushDevices={() => alert("Gestion Appareils : Bientôt disponible")}
        /> */}

        {/* MAIN DASHBOARD (LEGACY BRIDGE - FULL RESTORE) */}
        <LegacyMainAppBridge 
            hideKanban={false} // ROLLBACK: Show Legacy Kanban
            tickets={tickets}
            machines={machines}
            currentUser={currentUser}
            onRefresh={refetchTickets}
            onTicketCreated={refetchTickets}
            moveTicket={handleMoveTicket}
            deleteTicket={handleDeleteTicket}
            // Sync State with Legacy
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            
            onLogout={() => {
                localStorage.removeItem('auth_token');
                window.location.reload();
            }}
            // Legacy props - FULLY DYNAMIC
            headerTitle={settings?.title || "Gestion de la maintenance"}
            headerSubtitle={settings?.subtitle || "Système de Maintenance Universel"}
            activeModules={settings?.modules} 
            unreadMessagesCount={0}
            onRefreshMessages={() => {}}
            showCreateModal={isCreateTicketOpen} // Sync with App state
            setShowCreateModal={setIsCreateTicketOpen} 
        />

        {/* MODERN KANBAN (DISABLED FOR ROLLBACK) */}
        {/* <div className="max-w-[1600px] mx-auto px-4 py-6">
            <KanbanBoard ... />
        </div> */}

        {/* MODERN REACT MODALS (Overlay) */}
        <UserManagementModal 
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            currentUser={currentUser}
        />

        <MachineManagementModal
            isOpen={isMachineModalOpen}
            onClose={() => setIsMachineModalOpen(false)}
            currentUser={currentUser}
        />

        <DataImportModal 
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            initialTab={importTab}
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
