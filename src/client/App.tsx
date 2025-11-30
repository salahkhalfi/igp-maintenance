import React, { useState } from 'react'
import RoleDropdown from './components/RoleDropdown'
import NotificationModal from './components/NotificationModal'
import ConfirmModal from './components/ConfirmModal'
import PromptModal from './components/PromptModal'

const App = () => {
  const [role, setRole] = useState('operator');
  
  // Modal States
  const [notification, setNotification] = useState<{isOpen: boolean, type: 'success'|'error'|'info', message: string} | null>(null);
  const [confirm, setConfirm] = useState<{isOpen: boolean, message: string} | null>(null);
  const [prompt, setPrompt] = useState<{isOpen: boolean, message: string} | null>(null);

  return (
    <div className="fixed bottom-4 left-4 z-[9999] group font-sans">
        <div className="bg-white/95 backdrop-blur-md border border-blue-200 p-4 rounded-xl shadow-2xl transition-all hover:shadow-blue-500/20 max-w-sm">
            <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Modern Frontend Active</h3>
                    <p className="text-xs text-slate-500">Phase 3: Modal Infrastructure</p>
                </div>
            </div>
            
            {/* Role Dropdown Test */}
            <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Role Component</p>
                <div className="w-full">
                    <RoleDropdown 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        currentUserRole="admin"
                        variant="blue"
                    />
                </div>
            </div>

            {/* Modals Test */}
            <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Modal System</p>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setNotification({isOpen: true, type: 'success', message: 'Operation completed successfully!'})}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-200 hover:bg-green-100 transition-colors"
                    >
                        Notify Success
                    </button>
                    <button 
                        onClick={() => setNotification({isOpen: true, type: 'error', message: 'Something went wrong.'})}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-medium border border-red-200 hover:bg-red-100 transition-colors"
                    >
                        Notify Error
                    </button>
                    <button 
                        onClick={() => setConfirm({isOpen: true, message: 'Are you sure you want to delete this item?'})}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        Confirm
                    </button>
                    <button 
                        onClick={() => setPrompt({isOpen: true, message: 'Enter your reason:'})}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                        Prompt
                    </button>
                </div>
            </div>
        </div>

        {/* Render Modals */}
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
                setTimeout(() => setNotification({isOpen: true, type: 'info', message: `Input received: ${val}`}), 300);
            }}
            title="Input Required"
            message={prompt?.message || ''}
            placeholder="Type something..."
        />
    </div>
  )
}

export default App
