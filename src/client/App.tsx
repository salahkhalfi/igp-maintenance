import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RoleDropdown from './components/RoleDropdown'
import NotificationModal from './components/NotificationModal'
import ConfirmModal from './components/ConfirmModal'
import PromptModal from './components/PromptModal'
import UserManagementModal from './components/UserManagementModal'
import { User } from './types'

// Create a client
const queryClient = new QueryClient()

const MOCK_USER: User = {
    id: 999,
    email: 'admin@igpglass.com',
    first_name: 'Admin',
    last_name: 'System',
    role: 'admin',
    full_name: 'Admin System'
};

const App = () => {
  const [role, setRole] = useState('operator');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Modal States
  const [notification, setNotification] = useState<{isOpen: boolean, type: 'success'|'error'|'info', message: string} | null>(null);
  const [confirm, setConfirm] = useState<{isOpen: boolean, message: string} | null>(null);
  const [prompt, setPrompt] = useState<{isOpen: boolean, message: string} | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
        <div className="fixed bottom-4 left-4 z-[9999] group font-sans">
            <div className="bg-white/95 backdrop-blur-md border border-blue-200 p-4 rounded-xl shadow-2xl transition-all hover:shadow-blue-500/20 max-w-sm">
                <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Modern Frontend Active</h3>
                        <p className="text-xs text-slate-500">Phase 4: User Management</p>
                    </div>
                </div>
                
                {/* Feature Test */}
                <div className="mb-4">
                    <button 
                        onClick={() => setIsUserModalOpen(true)}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <i className="fas fa-users-cog mr-2"></i>
                        Open User Manager
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Powered by React Window (Virtualization) & TanStack Query
                    </p>
                </div>

                {/* Role Dropdown Test */}
                <div className="mb-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Components</p>
                    <div className="w-full mb-3">
                        <RoleDropdown 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            currentUserRole="admin"
                            variant="blue"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setNotification({isOpen: true, type: 'success', message: 'Success!'})}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 text-xs"
                        >
                            Notify
                        </button>
                        <button 
                            onClick={() => setConfirm({isOpen: true, message: 'Confirm?'})}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>

            {/* Render Modals */}
            <UserManagementModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                currentUser={MOCK_USER}
                onOpenMessage={(user) => setNotification({isOpen: true, type: 'info', message: `Open message for ${user.full_name}`})}
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
        </div>
    </QueryClientProvider>
  )
}

export default App
