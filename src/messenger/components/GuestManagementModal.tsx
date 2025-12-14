import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getInitials } from '../utils';

const GuestManagementModal = ({ onClose }: { onClose: () => void }) => {
    const [guests, setGuests] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '', company: '' });
    const [loading, setLoading] = useState(false);

    const fetchGuests = async () => {
        try {
            const res = await axios.get('/api/v2/chat/guests');
            setGuests(res.data.guests || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { fetchGuests(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/v2/chat/guests', formData);
            setShowForm(false);
            setFormData({ email: '', password: '', full_name: '', company: '' });
            fetchGuests();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erreur création');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cet invité ?')) return;
        try {
            await axios.delete(`/api/v2/chat/guests/${id}`);
            fetchGuests();
        } catch (e) {
            alert('Erreur suppression');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex flex-col animate-slide-up items-center justify-center p-4">
            <div className="w-full max-w-2xl glass-panel rounded-3xl flex flex-col max-h-[85vh] border border-white/10 shadow-2xl">
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5">
                    <div>
                        <div className="text-white font-bold text-xl font-display">Invités Externes</div>
                        <div className="text-gray-500 text-xs font-bold tracking-wide uppercase mt-1">Accès restreint au chat</div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowForm(true)} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-5 py-2.5 rounded-xl font-bold text-sm border border-emerald-500/20 transition-all shadow-lg shadow-emerald-900/20">
                            <i className="fas fa-plus mr-2"></i> Ajouter
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
                    </div>
                </div>

                {showForm && (
                    <div className="p-8 bg-white/5 border-b border-white/5">
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <input 
                                placeholder="Email (Identifiant)" 
                                className="col-span-1 md:col-span-2 glass-input rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required
                            />
                            <input 
                                placeholder="Mot de passe" 
                                className="glass-input rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
                            />
                            <input 
                                placeholder="Nom complet" 
                                className="glass-input rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required
                            />
                            <input 
                                placeholder="Entreprise / Rôle" 
                                className="col-span-1 md:col-span-2 glass-input rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                                value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                            />
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-400 hover:text-white text-sm font-bold transition-colors">Annuler</button>
                                <button type="submit" disabled={loading} className="glass-button-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all w-full md:w-auto text-sm">Créer</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {guests.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <i className="fas fa-user-clock text-gray-500 text-3xl"></i>
                            </div>
                            <p className="text-gray-400 font-medium">Aucun invité configuré</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {guests.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-lg">
                                            {getInitials(g.full_name)}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-lg">{g.full_name}</div>
                                            <div className="text-gray-400 text-sm flex items-center gap-2 mt-0.5 font-medium">
                                                <i className="fas fa-building text-xs opacity-70"></i> {g.company || 'Externe'} 
                                                <span className="text-gray-600 mx-1">•</span> 
                                                <span className="text-gray-500 font-mono text-xs tracking-tight">{g.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(g.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestManagementModal;
