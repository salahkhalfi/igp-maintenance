import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { User, UserRole } from '../types';
import { userService } from '../services/userService';
import { getLastLoginStatus, formatDateEST } from '../utils/dateUtils';
import RoleDropdown from './RoleDropdown';
import NotificationModal from './NotificationModal';
import ConfirmModal from './ConfirmModal';
import PromptModal from './PromptModal';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenMessage?: (user: { id: number; full_name: string; role: UserRole }) => void;
}

const ROLE_LABELS: Record<string, string> = {
  'admin': '👑 Administrateur',
  'director': '📊 Directeur Général',
  'supervisor': '⭐ Superviseur',
  'coordinator': '🎯 Coordonnateur Maintenance',
  'planner': '📅 Planificateur Maintenance',
  'senior_technician': '🔧 Technicien Senior',
  'technician': '🔧 Technicien',
  'team_leader': '👔 Chef Équipe Production',
  'furnace_operator': '🔥 Opérateur Four',
  'operator': '👷 Opérateur',
  'safety_officer': '🛡️ Agent Santé & Sécurité',
  'quality_inspector': '✓ Inspecteur Qualité',
  'storekeeper': '📦 Magasinier',
  'viewer': '👁️ Lecture Seule'
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  'admin': 'bg-red-100 text-red-800',
  'director': 'bg-red-50 text-red-700',
  'supervisor': 'bg-yellow-100 text-yellow-800',
  'coordinator': 'bg-amber-100 text-amber-800',
  'planner': 'bg-amber-100 text-amber-800',
  'senior_technician': 'bg-blue-100 text-blue-800',
  'technician': 'bg-blue-50 text-blue-700',
  'team_leader': 'bg-emerald-100 text-emerald-800',
  'furnace_operator': 'bg-green-100 text-green-800',
  'operator': 'bg-green-50 text-green-700',
  'safety_officer': 'bg-indigo-100 text-indigo-800',
  'quality_inspector': 'bg-slate-100 text-slate-700',
  'storekeeper': 'bg-violet-100 text-violet-800',
  'viewer': 'bg-gray-100 text-gray-800'
};

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, currentUser, onOpenMessage }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Modal States
  const [notification, setNotification] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [confirm, setConfirm] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);
  const [prompt, setPrompt] = useState<{ isOpen: boolean, message: string, onConfirm: (val: string) => void } | null>(null);

  // Data Fetching
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
    enabled: isOpen,
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: isOpen ? 1000 * 60 * 2 : false // Poll every 2 mins if open
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNotification({ isOpen: true, type: 'success', message: 'Utilisateur créé avec succès!' });
      setShowCreateForm(false);
    },
    onError: (err: any) => setNotification({ isOpen: true, type: 'error', message: err.message })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNotification({ isOpen: true, type: 'success', message: 'Utilisateur mis à jour avec succès!' });
      setEditingUser(null);
    },
    onError: (err: any) => setNotification({ isOpen: true, type: 'error', message: err.message })
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNotification({ isOpen: true, type: 'success', message: 'Utilisateur supprimé avec succès!' });
    },
    onError: (err: any) => setNotification({ isOpen: true, type: 'error', message: err.message })
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: number, pass: string }) => userService.resetPassword(id, { new_password: pass }),
    onSuccess: () => setNotification({ isOpen: true, type: 'success', message: 'Mot de passe réinitialisé avec succès!' }),
    onError: (err: any) => setNotification({ isOpen: true, type: 'error', message: err.message })
  });

  // Filtering
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const lower = searchQuery.toLowerCase();
    return users.filter(u => 
      (u.full_name || '').toLowerCase().includes(lower) || 
      (u.email || '').toLowerCase().includes(lower)
    );
  }, [users, searchQuery]);

  // Row Component for React Window
  const UserRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const user = filteredUsers[index];
    const loginStatus = getLastLoginStatus(user.last_login);
    const showLogin = currentUser.role === 'admin' || (currentUser.role === 'supervisor' && user.role === 'technician');
    
    return (
      <div style={style} className="px-2 py-2">
        <div className="bg-white rounded-lg p-3 border border-gray-200 hover:bg-gray-50 transition-colors h-full flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-base truncate">{user.full_name || user.first_name}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${ROLE_BADGE_COLORS[user.role] || 'bg-gray-100'}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="truncate"><i className="fas fa-envelope mr-1"></i>{user.email}</span>
                {showLogin && (
                    <span className={`flex items-center gap-1 ml-2 ${loginStatus.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${loginStatus.dot}`}></span>
                        {loginStatus.status}
                    </span>
                )}
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            {user.id !== currentUser.id && onOpenMessage && (
              <button 
                onClick={() => onOpenMessage(user)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-comment sm:mr-1"></i><span className="sm:inline hidden">Msg</span>
              </button>
            )}
            
            {(user.id === currentUser.id || (currentUser.role !== 'technician' && !(currentUser.role === 'supervisor' && user.role === 'admin'))) && (
              <>
                <button 
                  onClick={() => setEditingUser(user)}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600 transition-colors"
                >
                  <i className="fas fa-edit sm:mr-1"></i><span className="sm:inline hidden">Edit</span>
                </button>
                <button 
                  onClick={() => setPrompt({
                    isOpen: true,
                    message: `Nouveau mot de passe pour ${user.full_name}:`,
                    onConfirm: (val) => {
                        if (val.length < 6) return setNotification({isOpen: true, type: 'error', message: 'Min 6 caractères'});
                        resetPasswordMutation.mutate({ id: user.id, pass: val });
                    }
                  })}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-yellow-500 text-white rounded text-xs font-bold hover:bg-yellow-600 transition-colors"
                >
                  <i className="fas fa-key sm:mr-1"></i><span className="sm:inline hidden">MdP</span>
                </button>
                {user.id !== currentUser.id && (
                  <button 
                    onClick={() => setConfirm({
                      isOpen: true,
                      message: `Supprimer ${user.full_name}?`,
                      onConfirm: () => deleteMutation.mutate(user.id)
                    })}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    <i className="fas fa-trash sm:mr-1"></i><span className="sm:inline hidden">Sup</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 font-sans">
        <div className="absolute inset-0 bg-black/75" onClick={onClose}></div>
        
        {/* MAIN CONTAINER - OPTIMIZED RENDERING (NO GPU TRANSFORM, NO SHADOW) */}
        <div 
            className="relative bg-white rounded-xl border border-gray-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <i className="fas fa-users-cog text-xl"></i>
                    <h2 className="text-xl font-bold">Gestion Utilisateurs (v2 Fast)</h2>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                    <i className="fas fa-times"></i>
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3 shrink-0 z-10">
                {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                    <button 
                        onClick={() => setShowCreateForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <i className="fas fa-plus mr-2"></i>Nouveau
                    </button>
                )}
                <div className="relative flex-1">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-gray-100 p-2">
                {isLoading && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>}
                {isError && <div className="p-8 text-center text-red-500">Erreur de chargement des données.</div>}
                
                {!showCreateForm && !editingUser && !isLoading && (
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                itemCount={filteredUsers.length}
                                itemSize={85} // Fixed row height
                            >
                                {UserRow}
                            </List>
                        )}
                    </AutoSizer>
                )}

                {/* Forms would act as "Overlays" or replace content in this area */}
                {(showCreateForm || editingUser) && (
                    <div className="absolute inset-0 bg-gray-100 p-4 overflow-y-auto z-20 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto border border-gray-200">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {showCreateForm ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'}
                                </h3>
                                <button onClick={() => { setShowCreateForm(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            
                            <UserForm 
                                initialData={editingUser || { role: 'operator' }}
                                isEditing={!!editingUser}
                                currentUserRole={currentUser.role}
                                onSubmit={(data) => {
                                    if (showCreateForm) createMutation.mutate(data as any);
                                    else if (editingUser) updateMutation.mutate({ id: editingUser.id, data });
                                }}
                                onCancel={() => { setShowCreateForm(false); setEditingUser(null); }}
                                isLoading={createMutation.isPending || updateMutation.isPending}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Modals */}
        <NotificationModal 
            isOpen={!!notification?.isOpen}
            onClose={() => setNotification(null)}
            type={notification?.type}
            message={notification?.message || ''}
        />
        <ConfirmModal 
            isOpen={!!confirm?.isOpen}
            onClose={() => setConfirm(null)}
            onConfirm={confirm?.onConfirm || (() => {})}
            message={confirm?.message || ''}
            isDestructive={true}
        />
        <PromptModal 
            isOpen={!!prompt?.isOpen}
            onClose={() => setPrompt(null)}
            onConfirm={prompt?.onConfirm || (() => {})}
            message={prompt?.message}
            inputType="password"
            placeholder="Nouveau mot de passe"
        />
    </div>
  );
};

// Sub-component for Form (Internal)
const UserForm = ({ initialData, isEditing, currentUserRole, onSubmit, onCancel, isLoading }: any) => {
    const [formData, setFormData] = useState({
        email: initialData.email || '',
        password: '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        role: initialData.role || 'operator'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prénom</label>
                    <input name="first_name" type="text" required value={formData.first_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                    <input name="last_name" type="text" value={formData.last_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {!isEditing && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                        <input name="password" type="password" required minLength={6} value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Rôle</label>
                    <RoleDropdown 
                        value={formData.role} 
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        currentUserRole={currentUserRole}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Annuler</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                    {isLoading && <i className="fas fa-spinner fa-spin"></i>}
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                </button>
            </div>
        </form>
    );
};

export default UserManagementModal;
