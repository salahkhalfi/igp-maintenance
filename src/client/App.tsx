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
import { User, TicketPriority } from './types'
import { client, getAuthToken } from './api'

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

    return <div ref={containerRef} id="legacy-root" style={{ minHeight: '100vh' }} />;
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
  const [importTab, setImportTab] = useState<'users' | 'machines'>('users');

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

  // Fetch Tickets
  const { data: rawTickets, refetch: refetchTickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
       try {
           const res = await fetch('/api/tickets', {
               headers: { 'Authorization': `Bearer ${getAuthToken()}` }
           });
           if (!res.ok) return [];
           const data = await res.json();
           // Ensure we extract the array
           return Array.isArray(data.tickets) ? data.tickets : [];
       } catch (e) {
           console.error("Fetch tickets failed", e);
           return [];
       }
    }
  });
  
  // Safe array guarantee
  const tickets = Array.isArray(rawTickets) ? rawTickets : [];

  // Fetch Machines
  const { data: rawMachines } = useQuery({
      queryKey: ['machines'],
      queryFn: async () => {
          try {
              const res = await fetch('/api/machines', {
                  headers: { 'Authorization': `Bearer ${getAuthToken()}` }
              });
              if (!res.ok) return [];
              const data = await res.json();
              return Array.isArray(data.machines) ? data.machines : [];
          } catch (e) {
              console.error("Fetch machines failed", e);
              return [];
          }
      }
  });

  // Safe array guarantee
  const machines = Array.isArray(rawMachines) ? rawMachines : [];

  // Bridge Functions
  const handleMoveTicket = async (id: number, status: string, log: string) => {
      await fetch(`/api/tickets/${id}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ status, log })
      });
      refetchTickets();
  };

  const handleDeleteTicket = async (id: number) => {
      await fetch(`/api/tickets/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      refetchTickets();
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

  if (!realUser && !getAuthToken()) {
      // If not logged in, MainApp usually handles login form or we can redirect
      // For now let MainApp handle it or show loading
      // return <div className="flex h-screen items-center justify-center">Veuillez vous connecter...</div>;
  }

  return (
    <>
        {/* MAIN DASHBOARD (LEGACY BRIDGE) */}
        <LegacyMainAppBridge 
            tickets={tickets}
            machines={machines}
            currentUser={currentUser}
            onRefresh={refetchTickets}
            onTicketCreated={refetchTickets}
            moveTicket={handleMoveTicket}
            deleteTicket={handleDeleteTicket}
            onLogout={() => {
                localStorage.removeItem('auth_token');
                window.location.reload();
            }}
            // Legacy props
            headerTitle="Gestion de la maintenance"
            headerSubtitle="Système de Maintenance Universel"
            unreadMessagesCount={0}
            onRefreshMessages={() => {}}
            showCreateModal={false} 
            setShowCreateModal={() => {}} 
        />

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
