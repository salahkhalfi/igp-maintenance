import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    X, Users, UserPlus, Search, Mail, Clock, 
    Edit, Trash2, Key, Download, Upload,
    CheckCircle, AlertTriangle, Shield
} from 'lucide-react';
import { client, getAuthToken } from '../api';
import { User, UserRole } from '../types';
import RoleDropdown from './RoleDropdown';
import ConfirmModal from './ConfirmModal';

// Inline date formatter if not imported
const formatLoginDate = (dateStr?: string) => {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-CA', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).format(date);
};

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, currentUser }) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
    
    // New User Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'operator'
    });

    // Fetch Users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await client.api.users.team.$get();
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            return data.users;
        },
        enabled: isOpen
    });

    // Mutations
    const createUser = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur création');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateMode(false);
            setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'operator' });
            alert("Utilisateur créé !");
        },
        onError: (err) => alert(err.message)
    });

    const updateUser = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/users/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erreur modification');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUser(null);
        }
    });

    const deleteUser = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            if (!res.ok) throw new Error('Erreur suppression');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setConfirmDelete(null);
        }
    });

    // Handlers
    const handleExport = async () => {
        // Trigger the export flow via window function or direct call
        // Since we are modernizing, let's use the window bridge for now to reuse DataImportModal logic
        // But ideally we should have explicit functions.
        // For now, let's open the Import Modal in 'users' mode which has the Export button.
        if ((window as any).openDataImport) {
            (window as any).openDataImport('users');
        } else {
            alert("Module d'import non chargé");
        }
    };

    const filteredUsers = users.filter((u: User) => 
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                
                {/* Header */}
                <div className="bg-slate-900 p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Gestion des Utilisateurs</h3>
                            <p className="text-xs text-slate-400">Administration de l'équipe</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setIsCreateMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm text-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            Nouveau
                        </button>
                        
                        {/* THE MISSING LINK: Explicit Import/Export Buttons */}
                        <div className="h-8 w-px bg-slate-300 mx-1"></div>
                        
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-bold hover:bg-slate-100 transition-colors text-sm"
                            title="Ouvrir le menu Import/Export CSV"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Import / Export CSV</span>
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un membre..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    
                    {/* Create/Edit Form (Inline for simplicity) */}
                    {(isCreateMode || editingUser) && (
                        <div className="mb-6 p-4 bg-white rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-800">{isCreateMode ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'}</h4>
                                <button onClick={() => { setIsCreateMode(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (isCreateMode) createUser.mutate(formData);
                                else if (editingUser) updateUser.mutate({ ...formData, id: editingUser.id });
                            }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Prénom</label>
                                    <input required type="text" className="w-full p-2 border rounded" value={isCreateMode ? formData.first_name : (editingUser?.first_name || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, first_name: e.target.value}) : setEditingUser({...editingUser!, first_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nom</label>
                                    <input type="text" className="w-full p-2 border rounded" value={isCreateMode ? formData.last_name : (editingUser?.last_name || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, last_name: e.target.value}) : setEditingUser({...editingUser!, last_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                    <input required type="email" className="w-full p-2 border rounded" value={isCreateMode ? formData.email : (editingUser?.email || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, email: e.target.value}) : setEditingUser({...editingUser!, email: e.target.value})} 
                                        disabled={!!editingUser} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Rôle</label>
                                    <RoleDropdown 
                                        value={isCreateMode ? formData.role : (editingUser?.role || 'operator')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, role: e.target.value}) : setEditingUser({...editingUser!, role: e.target.value})}
                                        currentUserRole={currentUser.role}
                                    />
                                </div>
                                {isCreateMode && (
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Mot de passe</label>
                                        <input required type="password" className="w-full p-2 border rounded" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                    </div>
                                )}
                                <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => { setIsCreateMode(false); setEditingUser(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Users List */}
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400">Chargement...</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user: User) => (
                                <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                                            user.role === 'admin' ? 'bg-red-500' : 
                                            user.role === 'technician' ? 'bg-blue-500' : 'bg-green-500'
                                        }`}>
                                            {user.first_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                {user.full_name}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                    user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatLoginDate(user.last_login)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Modifier">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => alert("Fonction Reset Password à implémenter si besoin")} className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Réinitialiser MDP">
                                            <Key className="w-4 h-4" />
                                        </button>
                                        {user.id !== currentUser.id && (
                                            <button onClick={() => setConfirmDelete(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Supprimer">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Delete Modal */}
                {confirmDelete && (
                    <ConfirmModal 
                        isOpen={true}
                        title="Supprimer l'utilisateur ?"
                        message={`Voulez-vous vraiment supprimer ${confirmDelete.full_name} ? Cette action est irréversible.`}
                        onConfirm={() => deleteUser.mutate(confirmDelete.id)}
                        onClose={() => setConfirmDelete(null)}
                        isDestructive={true}
                    />
                )}
            </div>
        </div>
    );
};

export default UserManagementModal;
