import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    X, Server, Plus, Search, Edit, Trash2, 
    Download, MapPin, Hash, Wrench, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { client, getAuthToken } from '../api';
import { User } from '../types';
import ConfirmModal from './ConfirmModal';

interface MachineManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

interface Machine {
    id: number;
    machine_type: string;
    model?: string;
    serial_number?: string;
    location?: string;
    manufacturer?: string;
    year?: number;
    status: 'operational' | 'maintenance' | 'out_of_service';
    technical_specs?: string;
}

const MachineManagementModal: React.FC<MachineManagementModalProps> = ({ isOpen, onClose, currentUser }) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Machine | null>(null);
    
    // Form State
    const [formData, setFormData] = useState<Partial<Machine>>({
        machine_type: '',
        model: '',
        serial_number: '',
        location: '',
        manufacturer: '',
        status: 'operational'
    });

    // Fetch Machines
    const { data: machines = [], isLoading } = useQuery({
        queryKey: ['machines'],
        queryFn: async () => {
            const res = await fetch('/api/machines', {
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            if (!res.ok) throw new Error('Failed to fetch machines');
            return res.json();
        },
        enabled: isOpen
    });

    // Mutations
    const createMachine = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/machines', {
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
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setIsCreateMode(false);
            setFormData({ machine_type: '', status: 'operational' });
            alert("Machine créée !");
        },
        onError: (err) => alert(err.message)
    });

    const updateMachine = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/machines/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erreur modification');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setEditingMachine(null);
        }
    });

    const deleteMachine = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/machines/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erreur suppression');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setConfirmDelete(null);
        },
        onError: (err) => alert(err.message)
    });

    const handleExport = () => {
        if ((window as any).openDataImport) {
            (window as any).openDataImport('machines');
        } else {
            alert("Module d'import non chargé");
        }
    };

    const filteredMachines = machines.filter((m: Machine) => 
        m.machine_type.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.model && m.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.serial_number && m.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational': return 'bg-green-100 text-green-700 border-green-200';
            case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'out_of_service': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'operational': return 'Opérationnelle';
            case 'maintenance': return 'En Maintenance';
            case 'out_of_service': return 'Hors Service';
            default: return status;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                
                {/* Header */}
                <div className="bg-slate-900 p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-500/20 p-2 rounded-full">
                            <Server className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Gestion du Parc Machines</h3>
                            <p className="text-xs text-slate-400">Inventaire technique</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
                    <div className="flex gap-2 w-full sm:w-auto">
                        {currentUser.role === 'admin' && (
                            <>
                                <button 
                                    onClick={() => setIsCreateMode(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-sm text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nouvelle Machine
                                </button>
                                <div className="h-8 w-px bg-slate-300 mx-1"></div>
                                <button 
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-bold hover:bg-slate-100 transition-colors text-sm"
                                >
                                    <Download className="w-4 h-4 text-emerald-600" />
                                    <span className="text-emerald-700">Import / Export CSV</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher (Nom, Modèle, S/N)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    
                    {/* Create/Edit Form */}
                    {(isCreateMode || editingMachine) && (
                        <div className="mb-6 p-6 bg-white rounded-xl border border-teal-100 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-800 text-lg">
                                    {isCreateMode ? 'Ajouter une Machine' : 'Modifier la Machine'}
                                </h4>
                                <button onClick={() => { setIsCreateMode(false); setEditingMachine(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const payload = isCreateMode ? formData : { ...editingMachine };
                                if (isCreateMode) createMachine.mutate(payload);
                                else updateMachine.mutate(payload);
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Type de Machine *</label>
                                    <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                        value={isCreateMode ? formData.machine_type : editingMachine?.machine_type} 
                                        onChange={e => isCreateMode ? setFormData({...formData, machine_type: e.target.value}) : setEditingMachine({...editingMachine!, machine_type: e.target.value})} 
                                        placeholder="Ex: Four de Trempe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Modèle</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                        value={isCreateMode ? formData.model : (editingMachine?.model || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, model: e.target.value}) : setEditingMachine({...editingMachine!, model: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Numéro de Série</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm" 
                                        value={isCreateMode ? formData.serial_number : (editingMachine?.serial_number || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, serial_number: e.target.value}) : setEditingMachine({...editingMachine!, serial_number: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Emplacement</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                        value={isCreateMode ? formData.location : (editingMachine?.location || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, location: e.target.value}) : setEditingMachine({...editingMachine!, location: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Fabricant</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                        value={isCreateMode ? formData.manufacturer : (editingMachine?.manufacturer || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, manufacturer: e.target.value}) : setEditingMachine({...editingMachine!, manufacturer: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Statut</label>
                                    <select 
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                        value={isCreateMode ? formData.status : editingMachine?.status}
                                        onChange={e => isCreateMode ? setFormData({...formData, status: e.target.value as any}) : setEditingMachine({...editingMachine!, status: e.target.value as any})}
                                    >
                                        <option value="operational">Opérationnelle</option>
                                        <option value="maintenance">En Maintenance</option>
                                        <option value="out_of_service">Hors Service</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Spécifications Techniques</label>
                                    <textarea 
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                        rows={3}
                                        value={isCreateMode ? formData.technical_specs : (editingMachine?.technical_specs || '')} 
                                        onChange={e => isCreateMode ? setFormData({...formData, technical_specs: e.target.value}) : setEditingMachine({...editingMachine!, technical_specs: e.target.value})} 
                                    />
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => { setIsCreateMode(false); setEditingMachine(null); }} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold">Annuler</button>
                                    <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold shadow-md hover:shadow-lg transition-all">
                                        {isCreateMode ? 'Créer la Machine' : 'Enregistrer les Modifications'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Machines List */}
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400">Chargement...</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMachines.map((machine: Machine) => (
                                <div key={machine.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all group">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-lg text-slate-800">{machine.machine_type}</h4>
                                                {machine.model && <span className="text-slate-500 font-medium">— {machine.model}</span>}
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(machine.status)}`}>
                                                    {getStatusLabel(machine.status)}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-6 text-sm text-slate-600">
                                                {machine.serial_number && (
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="w-4 h-4 text-slate-400" />
                                                        <span className="font-mono bg-slate-100 px-1 rounded text-xs">{machine.serial_number}</span>
                                                    </div>
                                                )}
                                                {machine.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        <span>{machine.location}</span>
                                                    </div>
                                                )}
                                                {machine.manufacturer && (
                                                    <div className="flex items-center gap-2">
                                                        <Wrench className="w-4 h-4 text-slate-400" />
                                                        <span>{machine.manufacturer}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {currentUser.role === 'admin' && (
                                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingMachine(machine)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setConfirmDelete(machine)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
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
                        title="Supprimer la machine ?"
                        message={`Voulez-vous vraiment supprimer "${confirmDelete.machine_type} ${confirmDelete.model || ''}" ? Attention, l'historique des tickets sera conservé mais orphelin.`}
                        onConfirm={() => deleteMachine.mutate(confirmDelete.id)}
                        onClose={() => setConfirmDelete(null)}
                        isDestructive={true}
                    />
                )}
            </div>
        </div>
    );
};

export default MachineManagementModal;
