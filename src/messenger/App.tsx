import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- Global Styles & Utils ---

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Plus Jakarta Sans', sans-serif;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
            box-sizing: border-box;
        }

        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #0f172a;
        }

        /* Glass Scrollbar - High Contrast */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }

        .glass-panel {
            background: rgba(17, 24, 39, 0.7); /* Plus de transparence pour le glass */
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2); /* Bordure plus marquée */
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .glass-sidebar {
            background: rgba(17, 24, 39, 0.8); /* Transparence pour la sidebar */
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.15);
        }

        .glass-header {
            background: rgba(17, 24, 39, 0.75); /* Transparence pour le header */
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }

        .glass-input {
            background: rgba(0, 0, 0, 0.4); /* Fond sombre pour contraste avec texte blanc */
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            transition: all 0.2s ease;
        }
        .glass-input:focus {
            background: rgba(0, 0, 0, 0.6);
            border-color: #10b981; /* Emerald */
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }
        .glass-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .glass-button-primary {
            background: #10b981; /* Couleur solide pour lisibilité */
            border: 1px solid #059669;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .glass-button-primary:hover {
            background: #059669;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .message-bubble-me {
            background: #059669; /* Vert solide plus sombre */
            color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .message-bubble-them {
            background: #374151; /* Gris solide */
            color: white;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `}</style>
);

const getUserIdFromToken = (token: string | null) => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (e) {
        return null;
    }
};

const getUserRoleFromToken = (token: string | null) => {
    if (!token) return '';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || '';
    } catch (e) {
        return '';
    }
};

const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
        return 'Hier';
    } else {
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
};

const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarGradient = (name: string) => {
    // Couleurs plus saturées et sombres pour le contraste
    const colors = [
        'bg-red-700', 
        'bg-blue-700', 
        'bg-emerald-700', 
        'bg-orange-700', 
        'bg-purple-700', 
        'bg-pink-700', 
        'bg-cyan-700', 
        'bg-teal-700'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// --- Interfaces ---

interface User {
    id: number;
    full_name: string;
    role: string;
    email: string;
}

interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name: string | null;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
    participant_count?: number;
    online_count?: number;
}

interface Message {
    id: string;
    sender_id: number;
    sender_name: string;
    content: string;
    created_at: string;
    type: string;
    media_key?: string;
}

interface Participant {
    user_id: number;
    full_name: string;
    role: string;
    last_read_at: string;
}

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/auth/login', { email, password });
            if (res.data.token) {
                localStorage.setItem('auth_token', res.data.token);
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token;
                onLogin();
            } else {
                setError('Identifiants incorrects');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#111827] p-4 text-white relative overflow-hidden">
            {/* Background plus subtil et technique */}
            <div className="absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(#1f2937 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                opacity: 0.3 
            }}></div>
            
            <div className="w-full max-w-md z-10 animate-slide-up px-4">
                <div className="glass-panel p-6 md:p-10 rounded-xl border border-gray-700 shadow-2xl bg-[#1f2937]">
                    <div className="flex flex-col items-center mb-8 md:mb-10">
                        <img src="/logo-igp.png" alt="IGP Glass" className="h-24 object-contain mb-6 drop-shadow-lg" />
                        <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-wider">Messenger</h1>
                        <div className="h-1 w-16 bg-emerald-500 mt-4 rounded-full"></div>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-3">
                                <i className="fas fa-exclamation-triangle text-red-400"></i> {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <i className="fas fa-envelope absolute left-4 top-3.5 text-gray-400 z-10"></i>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full glass-input rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none font-medium"
                                    placeholder="votre.email@igpglass.ca"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Mot de passe</label>
                            <div className="relative group">
                                <i className="fas fa-lock absolute left-4 top-3.5 text-gray-400 z-10"></i>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full glass-input rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-gray-400 hover:text-emerald-400 transition-colors focus:outline-none z-10"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full glass-button-primary text-white font-bold py-4 rounded-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide text-sm shadow-lg"
                        >
                            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <>Connexion <i className="fas fa-arrow-right"></i></>}
                        </button>
                    </form>
                    
                    <div className="mt-10 text-center border-t border-gray-700 pt-6">
                        <p className="text-gray-500 text-xs font-semibold">
                            © 2025 IGP Glass Technology
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserSelect = ({ onSelect, selectedIds, onClose }: { onSelect: (ids: number[]) => void, selectedIds: number[], onClose: () => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>(selectedIds);

    useEffect(() => {
        axios.get('/api/v2/chat/users').then(res => setUsers(res.data.users));
    }, []);

    const toggleUser = (id: number) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col animate-fade-in">
            <div className="bg-[#0b141a] h-full w-full md:max-w-md md:border-r border-white/10 flex flex-col">
                <div className="h-16 glass-header px-4 flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-arrow-left text-lg"></i></button>
                    <div className="flex-1">
                        <div className="text-white font-bold text-lg">Nouveau message</div>
                        <div className="text-emerald-500 text-xs font-medium">{selected.length} participant(s)</div>
                    </div>
                </div>
                
                <div className="p-4 border-b border-white/5">
                    <div className="glass-input rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <i className="fas fa-search text-gray-500"></i>
                        <input 
                            type="text" 
                            placeholder="Rechercher un collègue..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent text-white w-full focus:outline-none placeholder-gray-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {filteredUsers.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => toggleUser(user.id)}
                            className={`flex items-center gap-4 p-3 mb-1 rounded-xl cursor-pointer transition-all ${selected.includes(user.id) ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full ${getAvatarGradient(user.full_name)} flex items-center justify-center text-white font-bold shadow-lg`}>
                                    {getInitials(user.full_name)}
                                </div>
                                {selected.includes(user.id) && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#0b141a] shadow-sm">
                                        <i className="fas fa-check text-white text-[10px]"></i>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className={`font-semibold ${selected.includes(user.id) ? 'text-emerald-400' : 'text-gray-200'}`}>{user.full_name}</div>
                                <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">{user.role}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {selected.length > 0 && (
                    <div className="p-4 border-t border-white/10 bg-[#0b141a]/90 backdrop-blur-md">
                        <button 
                            onClick={() => onSelect(selected)}
                            className="w-full glass-button-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                        >
                            <span>Continuer</span> <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CreateGroupModal = ({ selectedUserIds, onClose, onCreate }: { selectedUserIds: number[], onClose: () => void, onCreate: (name: string) => void }) => {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md glass-panel rounded-2xl overflow-hidden animate-slide-up">
                <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
                    <div className="text-white font-bold text-lg">Créer un groupe</div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                </div>

                <div className="p-8 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center mb-8 shadow-inner group cursor-pointer hover:from-emerald-900 hover:to-gray-800 transition-all">
                        <i className="fas fa-camera text-gray-400 text-3xl group-hover:text-emerald-400 transition-colors"></i>
                    </div>

                    <div className="w-full mb-2">
                        <input 
                            type="text" 
                            placeholder="Nom du groupe" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-transparent text-white text-xl font-medium text-center border-b-2 border-emerald-500/50 focus:border-emerald-500 py-2 focus:outline-none transition-colors placeholder-gray-600"
                            autoFocus
                        />
                    </div>
                    <div className="text-gray-500 text-xs w-full text-right mb-8 font-medium">{name.length}/25</div>

                    <button 
                        onClick={() => onCreate(name)}
                        disabled={!name.trim()}
                        className="w-full glass-button-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-check"></i> Créer le groupe
                    </button>
                </div>
            </div>
        </div>
    );
};

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
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex flex-col animate-slide-up items-center justify-center p-4">
            <div className="w-full max-w-2xl glass-panel rounded-2xl flex flex-col max-h-[85vh]">
                <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
                    <div>
                        <div className="text-white font-bold text-lg">Invités Externes</div>
                        <div className="text-gray-500 text-xs">Accès restreint au chat uniquement</div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowForm(true)} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 rounded-lg font-bold text-sm border border-emerald-500/20 transition-all">
                            <i className="fas fa-plus mr-2"></i> Ajouter
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><i className="fas fa-times text-xl"></i></button>
                    </div>
                </div>

                {showForm && (
                    <div className="p-6 bg-white/5 border-b border-white/5">
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                placeholder="Email (Identifiant)" 
                                className="col-span-1 md:col-span-2 glass-input rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none text-base"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required
                            />
                            <input 
                                placeholder="Mot de passe" 
                                className="glass-input rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none text-base"
                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
                            />
                            <input 
                                placeholder="Nom complet" 
                                className="glass-input rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none text-base"
                                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required
                            />
                            <input 
                                placeholder="Entreprise / Rôle" 
                                className="col-span-1 md:col-span-2 glass-input rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none text-base"
                                value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                            />
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium">Annuler</button>
                                <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all w-full md:w-auto">Créer l'accès</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                    {guests.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-user-clock text-gray-600 text-2xl"></i>
                            </div>
                            <p className="text-gray-500">Aucun invité configuré</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {guests.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                                            {getInitials(g.full_name)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{g.full_name}</div>
                                            <div className="text-gray-400 text-sm flex items-center gap-2">
                                                <i className="fas fa-building text-xs"></i> {g.company || 'Externe'} 
                                                <span className="text-gray-600">•</span> 
                                                <span className="text-gray-500 font-mono text-xs">{g.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(g.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
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

const ConversationList = ({ onSelect, selectedId, currentUserId, onOpenInfo }: { onSelect: (id: string) => void, selectedId: string | null, currentUserId: number | null, onOpenInfo: () => void }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('operator');
    
    // UI States
    const [showUserSelect, setShowUserSelect] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGuestManager, setShowGuestManager] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role) setCurrentUserRole(payload.role);
            } catch (e) { console.error(e); }
        }

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    setPushEnabled(!!subscription);
                });
            });
        }

        const fetchConversations = async () => {
            try {
                const res = await axios.get('/api/v2/chat/conversations');
                setConversations(res.data.conversations || []);
            } catch (err: any) {
                console.error("Fetch conv error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateGroup = async (name: string) => {
        try {
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'group',
                name: name,
                participantIds: selectedUsers
            });
            if (res.data.success) {
                setShowCreateGroup(false);
                setShowUserSelect(false);
                setSelectedUsers([]);
                onSelect(res.data.conversationId);
                const refreshRes = await axios.get('/api/v2/chat/conversations');
                setConversations(refreshRes.data.conversations || []);
            }
        } catch (err: any) {
            if (err.response && err.response.status === 403) {
                alert("⛔ Vous n'avez pas la permission de créer un groupe.");
            } else {
                alert('Erreur création groupe');
            }
        }
    };

    const enablePush = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const keyRes = await fetch('/api/push/vapid-public-key', { headers: { 'Authorization': `Bearer ${token}` } });
            const { publicKey } = await keyRes.json();
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ subscription, deviceType: 'mobile', deviceName: `Web (${navigator.userAgent})` })
            });

            setPushEnabled(true);
            alert('Notifications activées ! 🔔');
        } catch (err: any) {
            console.error(err);
        }
    };

    const canCreateGroup = ['admin', 'supervisor', 'technician', 'coordinator', 'planner'].includes(currentUserRole);
    const isAdmin = currentUserRole === 'admin';

    const handleLogout = () => {
        if (confirm("Voulez-vous vous déconnecter ?")) {
            localStorage.removeItem('auth_token');
            window.location.reload();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full glass-sidebar w-full md:w-[400px]">
            <div className="flex flex-col items-center gap-4">
                <i className="fas fa-circle-notch fa-spin text-emerald-500 text-3xl"></i>
                <div className="text-gray-500 text-sm font-medium">Chargement...</div>
            </div>
        </div>
    );

    return (
        <div className="glass-sidebar w-full md:w-[400px] flex flex-col h-full border-r border-white/5 z-20">
            {showUserSelect && !showCreateGroup && (
                <UserSelect 
                    selectedIds={selectedUsers}
                    onClose={() => setShowUserSelect(false)}
                    onSelect={(ids) => {
                        if (ids.length > 1 && !canCreateGroup) {
                            alert("⛔ Seuls les Superviseurs et Techniciens peuvent créer des groupes.");
                            return; 
                        }
                        setSelectedUsers(ids);
                        if (ids.length === 1) setShowCreateGroup(true); 
                        else setShowCreateGroup(true);
                    }}
                />
            )}
            {showCreateGroup && (
                <CreateGroupModal 
                    selectedUserIds={selectedUsers}
                    onClose={() => setShowCreateGroup(false)}
                    onCreate={handleCreateGroup}
                />
            )}
            {showGuestManager && <GuestManagementModal onClose={() => setShowGuestManager(false)} />}

            {/* Header Redesign: Plus grand, plus aéré */}
            <div className="p-5 bg-[#111827] border-b border-gray-800 flex flex-col gap-4 flex-shrink-0 shadow-xl z-30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <img src="/messenger-icon.svg" className="w-6 h-6" alt="Logo" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg tracking-tight leading-none">IGP Messenger</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-gray-400 text-xs font-medium">En ligne</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        {isAdmin && (
                            <button onClick={() => setShowGuestManager(true)} className="w-10 h-10 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white flex items-center justify-center transition-all border border-gray-700" title="Gérer les invités">
                                <i className="fas fa-user-shield"></i>
                            </button>
                        )}
                        <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-900/30" title="Déconnexion">
                            <i className="fas fa-power-off"></i>
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* Barre de recherche élargie */}
                    <div className="flex-1 relative">
                        <i className="fas fa-search absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" placeholder="Rechercher..." className="w-full bg-gray-800/50 border border-gray-700 text-white text-base md:text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-emerald-500 focus:bg-gray-800 transition-all placeholder-gray-500" />
                    </div>

                    {/* Menu Nouveau : Bouton Principal plus gros */}
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20">
                            <i className="fas fa-plus text-lg"></i>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50 p-1">
                            <button 
                                onClick={() => { setSelectedUsers([]); setShowUserSelect(true); }} 
                                className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-white text-sm flex items-center gap-3 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><i className="fas fa-user"></i></div>
                                <div>
                                    <div className="font-bold">Discussion Privée</div>
                                    <div className="text-xs text-gray-400">Contacter un collègue</div>
                                </div>
                            </button>
                            {canCreateGroup && (
                                <button 
                                    onClick={() => { setSelectedUsers([]); setShowUserSelect(true); setShowCreateGroup(true); }} 
                                    className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-lg text-white text-sm flex items-center gap-3 transition-colors mt-1"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><i className="fas fa-users"></i></div>
                                    <div>
                                        <div className="font-bold">Nouveau Groupe</div>
                                        <div className="text-xs text-gray-400">Créer une équipe</div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Conversation List: Plus d'espace */}
            <div className="overflow-y-auto flex-1 custom-scrollbar p-4 space-y-4 bg-[#0b141a]">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <i className="fas fa-inbox text-2xl text-gray-500"></i>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">Aucune conversation</p>
                    </div>
                ) : conversations.map(conv => {
                    const avatarGradient = conv.name ? getAvatarGradient(conv.name) : 'bg-gray-600';
                    const isActive = selectedId === conv.id;
                    
                    return (
                        <div 
                            key={conv.id} 
                            onClick={() => onSelect(conv.id)} 
                            className={`group relative flex items-center gap-3 p-3 md:gap-4 md:p-4 rounded-2xl cursor-pointer transition-all duration-300 border 
                                ${isActive 
                                    ? 'bg-gradient-to-r from-emerald-900/40 to-[#1f2937] border-emerald-500/50 shadow-lg shadow-emerald-900/20 translate-x-1 z-10' 
                                    : 'bg-[#161b22]/60 border-white/5 hover:bg-[#1f2937] hover:border-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50'
                                }`}
                            style={{ backdropFilter: 'blur(10px)' }}
                        >
                            {/* Active Indicator Strip */}
                            {isActive && <div className="absolute left-0 top-3 bottom-3 md:top-4 md:bottom-4 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}

                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${avatarGradient} flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg relative text-sm md:text-lg border border-white/10 group-hover:scale-105 transition-transform duration-300`}>
                                {conv.type === 'group' ? <i className="fas fa-users"></i> : getInitials(conv.name || '')}
                                {conv.unread_count > 0 && (
                                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full border-2 md:border-4 border-[#0b141a] flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm animate-bounce">
                                        {conv.unread_count}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col min-w-0 flex-1 mr-3">
                                        <span className={`font-bold text-base truncate transition-colors ${isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                                            {conv.name || (conv.type === 'group' ? 'Groupe sans nom' : 'Discussion Privée')}
                                        </span>
                                        {conv.type === 'group' && (
                                            <span 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(conv.id);
                                                    onOpenInfo();
                                                }}
                                                className="mt-1 text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer transition-all w-fit"
                                            >
                                                <i className={`fas ${conv.participant_count && conv.participant_count <= 1 ? 'fa-user-plus' : 'fa-users'}`}></i> 
                                                {conv.participant_count && conv.participant_count <= 1 ? 'Ajouter' : `${conv.participant_count} Membres`}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black/30 text-gray-500 group-hover:text-gray-300'}`}>
                                        {formatTime(conv.last_message_time)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm truncate w-[90%] block transition-colors ${isActive ? 'text-emerald-100/70' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                        {conv.last_message || 'Nouvelle discussion'}
                                    </span>
                                    {conv.online_count !== undefined && conv.online_count > 0 && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse"></div>
                                            {conv.online_count} en ligne
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ImageViewer = ({ src, onClose }: { src: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in" onClick={onClose}>
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-8">
                <img src={src} alt="Full view" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
        </div>
    );
};

const GroupInfo = ({ participants, conversationId, conversationName, conversationType, currentUserId, currentUserRole, onClose, onPrivateChat, autoOpenAddMember = false }: { participants: Participant[], conversationId: string, conversationName: string | null, conversationType: 'direct' | 'group', currentUserId: number | null, currentUserRole: string, onClose: () => void, onPrivateChat: (userId: number) => void, autoOpenAddMember?: boolean }) => {
    const [showAddMember, setShowAddMember] = useState(false);
    const [isManageMode, setIsManageMode] = useState(false);
    
    useEffect(() => {
        if (autoOpenAddMember) setShowAddMember(true);
    }, [autoOpenAddMember]);

    const currentUserParticipant = participants.find(p => p.user_id === currentUserId);
    const isAdminOrSupervisor = currentUserParticipant && (currentUserParticipant.role === 'admin' || currentUserParticipant.role === 'supervisor');
    const isGlobalAdmin = currentUserRole === 'admin';

    const handleDeleteGroup = async () => {
        if (!confirm("ATTENTION ADMIN : Voulez-vous supprimer DÉFINITIVEMENT ce groupe et tous ses messages/médias ?")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}`);
            window.location.reload();
        } catch (e) {
            alert('Erreur lors de la suppression du groupe');
        }
    };

    const handleAddMember = async (ids: number[]) => {
        if (ids.length === 0) return;

        // Blocage pour les non-admins sur les discussions privées
        if (conversationType === 'direct' && currentUserRole !== 'admin') {
            alert("Impossible d'ajouter des participants à une discussion privée.\nCréez un nouveau groupe pour discuter à plusieurs.");
            return;
        }

        try {
            for (const id of ids) {
                await axios.post(`/api/v2/chat/conversations/${conversationId}/participants`, { userId: id });
            }
            alert(conversationType === 'direct' && currentUserRole === 'admin' ? 'Conversation convertie en groupe !' : 'Membres ajoutés avec succès !');
            setShowAddMember(false);
            onClose();
            // Force reload via window if needed, or rely on polling
            if (conversationType === 'direct') window.location.reload(); 
        } catch (err: any) {
            console.error("Add member error:", err);
            const errorMsg = err.response?.data?.error || 'Erreur lors de l\'ajout';
            alert(`Erreur: ${errorMsg}`);
        }
    };

    const handleRemoveMember = async (userId: number, userName: string) => {
        if (!confirm(`Confirmer le retrait de ${userName} ?`)) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/participants/${userId}`);
            onClose(); 
        } catch (err: any) {
            alert(err.response?.data?.error || "Erreur");
        }
    };

    const handleLeaveGroup = async () => {
        if (!currentUserId || !confirm("Voulez-vous vraiment quitter ce groupe ?")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/participants/${currentUserId}`);
            onClose();
            window.location.reload(); // Force reload to clear state
        } catch (e) {
            alert("Erreur");
        }
    };

    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:absolute md:inset-y-0 md:right-0 md:left-auto md:w-[350px] flex justify-end">
            {showAddMember && (
                <UserSelect selectedIds={[]} onClose={() => setShowAddMember(false)} onSelect={handleAddMember} />
            )}

            <div className="w-full md:w-[350px] bg-[#111827] h-full flex flex-col animate-slide-in-right border-l border-gray-700 shadow-2xl">
                {/* En-tête Panel */}
                <div className="h-16 bg-[#1f2937] px-4 flex items-center justify-between flex-shrink-0 border-b border-gray-700">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <i className="fas fa-arrow-left"></i> Retour
                    </button>
                    <div className="text-white font-bold">{conversationType === 'group' ? 'Infos Groupe' : 'Infos Discussion'}</div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0 pb-10">
                    {/* Gros Icone de Groupe */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-[#1f2937] border-2 border-gray-600 flex items-center justify-center mb-4 shadow-lg">
                            <i className={`fas ${conversationType === 'group' ? 'fa-users' : 'fa-user'} text-white text-4xl`}></i>
                        </div>
                        <h2 className="text-white text-xl font-bold text-center">{conversationName || (conversationType === 'group' ? 'Groupe sans nom' : 'Discussion Privée')}</h2>
                        <div className="text-emerald-500 text-sm font-medium mt-1">{participants.length} participant{participants.length > 1 ? 's' : ''}</div>
                    </div>

                    {/* Actions Principales */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <button 
                            onClick={() => setShowAddMember(true)}
                            className="flex flex-col items-center justify-center p-4 bg-[#1f2937] rounded-xl border border-gray-600 hover:border-emerald-500 hover:text-emerald-500 transition-all text-gray-300"
                        >
                            <i className="fas fa-user-plus text-xl mb-2"></i>
                            <span className="text-xs font-bold">Ajouter</span>
                        </button>
                        
                        {isAdminOrSupervisor && conversationType === 'group' && (
                            <button 
                                onClick={() => setIsManageMode(!isManageMode)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isManageMode ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-[#1f2937] border-gray-600 hover:border-orange-500 hover:text-orange-500 text-gray-300'}`}
                            >
                                <i className={`fas ${isManageMode ? 'fa-check' : 'fa-cog'} text-xl mb-2`}></i>
                                <span className="text-xs font-bold">{isManageMode ? 'Terminer' : 'Gérer'}</span>
                            </button>
                        )}
                    </div>

                    {/* Liste des Membres */}
                    <div className="space-y-2">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">
                            Participants ({participants.length})
                        </div>
                        
                        {participants.map(p => (
                            <div key={p.user_id} className="flex items-center justify-between p-3 bg-[#1f2937] rounded-xl border border-gray-700/50">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-10 h-10 rounded-full ${getAvatarGradient(p.full_name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 relative`}>
                                            {getInitials(p.full_name)}
                                            {/* Status dot (simulated 'online' for now since they are in the list) */}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1f2937] rounded-full"></div>
                                        </div>
                                        <div className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => p.user_id !== currentUserId && onPrivateChat(p.user_id)}>
                                            <div className="text-white font-medium truncate text-sm flex items-center gap-2">
                                                {p.full_name}
                                                {p.user_id === currentUserId && <span className="text-xs bg-gray-700 px-1.5 rounded text-gray-300">Moi</span>}
                                            </div>
                                            <div className="text-gray-500 text-xs">{p.role === 'admin' ? 'Administrateur' : 'Membre'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Message Privé Button */}
                                        {p.user_id !== currentUserId && (
                                            <button 
                                                onClick={() => onPrivateChat(p.user_id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-all"
                                                title="Message privé"
                                            >
                                                <i className="fas fa-comment-alt text-xs"></i>
                                            </button>
                                        )}

                                        {/* Bouton d'action contextuel */}
                                        {isManageMode && p.user_id !== currentUserId ? (
                                            <button 
                                                onClick={() => handleRemoveMember(p.user_id, p.full_name)}
                                                className="w-8 h-8 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                                                title="Retirer du groupe"
                                            >
                                                <i className="fas fa-minus-circle"></i>
                                            </button>
                                        ) : (
                                            p.role === 'admin' && <i className="fas fa-crown text-yellow-500 text-xs ml-2" title="Admin"></i>
                                        )}
                                    </div>
                            </div>
                        ))}
                    </div>

                </div>
                
                <div className="p-4 bg-[#1f2937] border-t border-gray-700 flex-shrink-0 space-y-3 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10 relative">
                    {conversationType === 'group' && (
                        <button 
                            onClick={handleLeaveGroup}
                            className="w-full flex items-center justify-center gap-2 p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all text-sm font-bold"
                        >
                            <i className="fas fa-sign-out-alt"></i> Quitter le groupe
                        </button>
                    )}

                    {isGlobalAdmin && (
                        <button 
                            onClick={handleDeleteGroup}
                            className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-all text-sm font-bold border border-red-900/30"
                        >
                            <i className="fas fa-trash-alt"></i> {conversationType === 'group' ? 'SUPPRIMER LE GROUPE' : 'SUPPRIMER LA DISCUSSION'} (Admin)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatWindow = ({ conversationId, currentUserId, currentUserRole, onBack, onNavigate, initialShowInfo, onConsumeInfo }: { conversationId: string, currentUserId: number | null, currentUserRole: string, onBack: () => void, onNavigate: (id: string) => void, initialShowInfo: boolean, onConsumeInfo: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [input, setInput] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [triggerAddMember, setTriggerAddMember] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [loadingMessages, setLoadingMessages] = useState(true);
    
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉', '🤔', '✅', '❌', '👋'];

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const markAsRead = async () => {
        try { await axios.post(`/api/v2/chat/conversations/${conversationId}/read`); } catch (e) { console.error(e); }
    };

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`/api/v2/chat/conversations/${conversationId}/messages`);
            const newMessages = res.data.messages || [];
            setParticipants(res.data.participants || []);
            setConversation(res.data.conversation || null);
            setMessages(prev => {
                if (prev.length !== newMessages.length) {
                    setTimeout(scrollToBottom, 100);
                    markAsRead();
                }
                return newMessages;
            });
        } catch (err) { console.error(err); }
        finally { setLoadingMessages(false); }
    };

    useEffect(() => {
        setLoadingMessages(true);
        setMessages([]);
        setParticipants([]);
        setShowInfo(false);
        fetchMessages();
        markAsRead();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [conversationId]);

    useEffect(() => {
        if (initialShowInfo) {
            setShowInfo(true);
            onConsumeInfo();
        }
    }, [initialShowInfo, onConsumeInfo]);

    // Media handlers same as before, preserving logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) { alert("Impossible d'accéder au microphone."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "voice_message.webm", { type: 'audio/webm' });
                await sendAudio(audioFile);
                setIsRecording(false);
                setRecordingTime(0);
                clearInterval(timerRef.current);
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            };
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTime(0);
            clearInterval(timerRef.current);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const sendAudio = async (file: File) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/v2/chat/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);
            await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId, content: '🎤 Message vocal', type: 'audio', mediaKey: uploadData.key })
            });
            fetchMessages();
        } catch (err: any) { alert(`Erreur: ${err.message}`); } finally { setUploading(false); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setPreviewFile(e.target.files[0]);
    };

    const sendImage = async () => {
        if (!previewFile) return;
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', previewFile);
            const uploadRes = await fetch('/api/v2/chat/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);
            await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId, content: '📷 Photo', type: 'image', mediaKey: uploadData.key })
            });
            setPreviewFile(null);
            fetchMessages();
        } catch (err: any) { alert(`Erreur: ${err.message}`); } finally { setUploading(false); }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        try {
            const response = await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId, content: input, type: 'text' })
            });
            if (response.ok) { setInput(''); setShowEmoji(false); fetchMessages(); }
        } catch (err) { console.error(err); }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handlePrivateChat = async (targetUserId: number) => {
        if (!targetUserId || targetUserId === currentUserId) return;
        try {
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'direct',
                participantIds: [targetUserId]
            });
            if (res.data.conversationId) {
                onNavigate(res.data.conversationId);
                // Close modal/panels if open
                setShowInfo(false);
            }
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || "Impossible d'ouvrir la discussion privée";
            alert(`Erreur: ${errorMsg}`);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if(!confirm("Admin: Supprimer ce message ?")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/messages/${msgId}`);
            fetchMessages();
        } catch(e) { alert("Erreur suppression"); }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderMessages = () => {
        if (loadingMessages) {
             return (
                <div className="flex justify-center items-center h-full animate-fade-in">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                        <span className="text-emerald-500 font-medium text-sm animate-pulse">Chargement...</span>
                    </div>
                </div>
             );
        }

        if (messages.length === 0 && conversation?.type === 'group') {
            const hasMembers = participants.length > 1; // More than just me
            
            return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-lg">
                        <i className="fas fa-users text-gray-400 text-3xl"></i>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">
                        {hasMembers ? "La discussion est ouverte !" : "Le groupe est prêt !"}
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                        {hasMembers 
                            ? "Il n'y a pas encore de messages. Lancez la conversation avec vos collègues." 
                            : "Il n'y a pas encore de messages. Ajoutez des collègues pour commencer la discussion."}
                    </p>
                    
                    {hasMembers ? (
                         <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4 max-w-xs w-full">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3">Membres présents</div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {participants.map(p => (
                                    <div key={p.user_id} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white border border-gray-600" title={p.full_name}>
                                        {getInitials(p.full_name)}
                                    </div>
                                )).slice(0, 5)}
                                {participants.length > 5 && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">+{participants.length - 5}</div>}
                            </div>
                         </div>
                    ) : (
                        <button 
                            onClick={() => { setShowInfo(true); setTriggerAddMember(true); }}
                            className="glass-button-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                        >
                            <i className="fas fa-user-plus"></i> Ajouter des membres
                        </button>
                    )}
                </div>
            );
        }

        const result = [];
        let lastDate = '';

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const dateObj = new Date(msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z');
            const dateStr = dateObj.toLocaleDateString();

            if (dateStr !== lastDate) {
                let displayDate = dateStr;
                const now = new Date();
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                if (dateObj.toDateString() === now.toDateString()) displayDate = "Aujourd'hui";
                else if (dateObj.toDateString() === yesterday.toDateString()) displayDate = "Hier";

                result.push(
                    <div key={`date-${dateStr}`} className="flex justify-center my-6">
                        <span className="bg-white/5 border border-white/5 backdrop-blur-md text-gray-400 text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wider shadow-sm">
                            {displayDate}
                        </span>
                    </div>
                );
                lastDate = dateStr;
            }

            const isMe = currentUserId === msg.sender_id;
            const otherParticipants = participants.filter(p => p.user_id !== currentUserId);
            const isGlobalAdmin = currentUserRole === 'admin';
            let isRead = false;
            if (otherParticipants.length > 0) {
                isRead = otherParticipants.every(p => {
                    if (!p.last_read_at) return false;
                    const readTime = new Date(p.last_read_at.endsWith('Z') ? p.last_read_at : p.last_read_at + 'Z');
                    return readTime > dateObj;
                });
            }

            result.push(
                <div key={msg.id} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                        {!isMe && (
                            <div 
                                onClick={() => handlePrivateChat(msg.sender_id)}
                                className={`text-[10px] font-bold mb-1 ml-1 ${getAvatarGradient(msg.sender_name).replace('bg-gradient-to-br', '').replace('from-', 'text-').replace('to-', 'text-opacity-80')} cursor-pointer hover:underline hover:text-white transition-colors flex items-center gap-1`}
                                title="Envoyer un message privé"
                            >
                                {msg.sender_name} <i className="fas fa-comment-dots text-[9px] opacity-50"></i>
                            </div>
                        )}
                        
                        <div className={`p-3 rounded-2xl shadow-md backdrop-blur-sm relative group transition-all hover:shadow-lg ${isMe ? 'message-bubble-me text-white rounded-tr-sm' : 'message-bubble-them text-gray-100 rounded-tl-sm'}`}>
                            {isGlobalAdmin && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20 text-xs border-2 border-[#0b141a]"
                                    title="Supprimer (Admin)"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                            {msg.type === 'image' && msg.media_key ? (
                                <div className="mb-1 overflow-hidden rounded-lg">
                                    <img 
                                        src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} 
                                        alt="Photo" 
                                        className="max-h-80 object-cover w-full cursor-pointer hover:scale-105 transition-transform duration-500"
                                        onClick={() => setViewImage(`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`)}
                                    />
                                </div>
                            ) : msg.type === 'audio' && msg.media_key ? (
                                <div className="flex items-center gap-3 pr-2 min-w-[220px]">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-play text-xs pl-0.5"></i>
                                    </div>
                                    <audio controls src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} className="h-8 w-full opacity-90" />
                                </div>
                            ) : (
                                <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-8 pb-1">
                                    {msg.content}
                                </div>
                            )}
                            
                            <div className={`text-[10px] absolute bottom-1 right-3 flex items-center gap-1 font-medium ${isMe ? 'text-emerald-100/70' : 'text-gray-400'}`}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isMe && (
                                    <i className={`fas fa-check-double text-[10px] ${isRead ? 'text-white' : 'text-emerald-200/50'}`}></i>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return result;
    };

    return (
        <div className="flex-1 flex flex-col bg-[#0b141a] relative h-full overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-800/20 via-[#0b141a] to-[#0b141a]">
            {viewImage && <ImageViewer src={viewImage} onClose={() => setViewImage(null)} />}
            {showInfo && <GroupInfo participants={participants} conversationId={conversationId} conversationName={conversation?.name || null} conversationType={conversation?.type || 'group'} currentUserId={currentUserId} currentUserRole={currentUserRole} onClose={() => { setShowInfo(false); setTriggerAddMember(false); }} onPrivateChat={handlePrivateChat} autoOpenAddMember={triggerAddMember} />}
            
            {previewFile && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-lg glass-panel rounded-2xl p-6 flex flex-col items-center">
                        <h3 className="text-white font-bold text-lg mb-4">Envoyer une photo</h3>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 bg-black border border-white/10">
                            <img src={URL.createObjectURL(previewFile)} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex gap-4 w-full">
                            <button onClick={() => setPreviewFile(null)} className="flex-1 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium transition-colors">Annuler</button>
                            <button onClick={sendImage} disabled={uploading} className="flex-1 glass-button-primary text-white font-bold rounded-xl flex justify-center items-center shadow-lg">
                                {uploading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>Envoyer <i className="fas fa-paper-plane ml-2"></i></span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header onClick={() => setShowInfo(true)} className="h-20 glass-header px-4 md:px-6 flex items-center justify-between z-20 flex-shrink-0 cursor-pointer hover:bg-white/5 transition-colors shadow-lg shadow-black/20 sticky top-0 w-full">
                <div className="flex items-center gap-3">
                    {/* Bouton Retour / Sortir Renforcé */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onBack(); }} 
                        className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 transition-all mr-1"
                        title="Sortir de la discussion"
                    >
                        <i className="fas fa-chevron-left text-emerald-500 group-hover:text-white transition-colors text-lg"></i>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white hidden sm:inline">Retour</span>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-700 flex items-center justify-center shadow-lg border border-white/10">
                        <i className="fas fa-users text-white text-xs"></i>
                    </div>
                    <div className="min-w-0">
                        <div className="text-white font-bold text-base md:text-lg leading-tight truncate">Discussion</div>
                        <div className="text-emerald-500 text-[10px] md:text-xs font-medium truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="truncate max-w-[150px] md:max-w-xs">
                                {participants.length > 0 ? participants.map(p => p.full_name.split(' ')[0]).join(', ') : 'Infos'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 text-gray-400">
                    <button onClick={(e) => { e.stopPropagation(); }} className="hidden md:flex hover:text-white transition-colors w-10 h-10 items-center justify-center rounded-xl hover:bg-white/10"><i className="fas fa-search"></i></button>
                    
                    {/* Bouton Fermer Explicite (X) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onBack(); }} 
                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 flex items-center justify-center transition-all shadow-lg"
                        title="Fermer la discussion"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>
            </header>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 z-10 custom-scrollbar relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                {renderMessages()}
                <div ref={messagesEndRef} />
            </div>

            <footer className="glass-header p-4 z-10 flex-shrink-0">
                <div className="max-w-4xl mx-auto flex items-end gap-3 bg-[#161b22] border border-white/10 p-2 rounded-2xl shadow-lg relative">
                    {showEmoji && !isRecording && (
                        <div className="absolute bottom-full left-0 mb-4 bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl p-3 grid grid-cols-6 gap-2 w-72 animate-slide-up backdrop-blur-xl">
                            {commonEmojis.map(emoji => (
                                <button key={emoji} onClick={() => setInput(prev => prev + emoji)} className="text-2xl hover:bg-white/10 rounded-lg p-2 transition-colors">{emoji}</button>
                            ))}
                        </div>
                    )}

                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4 py-2 animate-pulse bg-red-500/5 rounded-xl border border-red-500/20">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                                <span className="font-mono text-lg text-red-400 font-bold">{formatDuration(recordingTime)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={cancelRecording} className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wide px-3">Annuler</button>
                                <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all transform hover:scale-105">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-1 pb-1">
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                                <button onClick={() => setShowEmoji(!showEmoji)} className={`w-10 h-10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center ${showEmoji ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <i className="far fa-smile text-lg"></i>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-emerald-400">
                                    <i className="fas fa-plus text-lg"></i>
                                </button>
                            </div>
                            <div className="flex-1 py-2">
                                <textarea 
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Écrivez un message..." 
                                    className="bg-transparent text-white w-full max-h-32 focus:outline-none placeholder-gray-500 resize-none text-base md:text-[15px] pt-1 leading-relaxed custom-scrollbar"
                                    rows={1}
                                    style={{ minHeight: '24px' }}
                                />
                            </div>
                            <div className="pb-1 pr-1">
                                {input.trim() ? (
                                    <button onClick={sendMessage} className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition-all transform hover:scale-105">
                                        <i className="fas fa-paper-plane text-sm"></i>
                                    </button>
                                ) : (
                                    <button onClick={startRecording} className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                                        <i className="fas fa-microphone text-lg"></i>
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
};

const EmptyState = () => (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#0b141a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] absolute pointer-events-none"></div>
        
        <div className="relative z-10 text-center p-8 backdrop-blur-sm bg-white/5 rounded-3xl border border-white/5 shadow-2xl max-w-md">
            <img src="/logo-igp.png" alt="IGP Logo" className="h-32 mx-auto mb-8 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
            <h1 className="text-white text-3xl font-bold mb-4 tracking-tight">IGP Messenger</h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 font-light">
                Plateforme de communication collaborative pour toutes les équipes. 
                <span className="block mt-2 text-emerald-500 font-medium">Connecté & Synchronisé.</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-mono border-t border-white/10 pt-6">
                <i className="fas fa-shield-alt text-emerald-500"></i>
                Chiffré de bout en bout • v2.14.194
            </div>
        </div>
    </div>
);

const App = () => {
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [showLogin, setShowLogin] = useState(true);
    const [autoOpenInfo, setAutoOpenInfo] = useState(false);
    
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            setCurrentUserId(getUserIdFromToken(token));
            setCurrentUserRole(getUserRoleFromToken(token));
            setShowLogin(false);
        }
    }, []);

    if (showLogin) {
        return (
            <>
                <GlobalStyles />
                <LoginScreen onLogin={() => {
                    const token = localStorage.getItem('auth_token');
                    if (token) {
                        setCurrentUserId(getUserIdFromToken(token));
                        setCurrentUserRole(getUserRoleFromToken(token));
                        setShowLogin(false);
                    }
                }} />
            </>
        );
    }

    return (
        <>
            <GlobalStyles />
            <div className="flex h-[100dvh] bg-[#0f172a] overflow-hidden font-sans relative">
                {/* Background Mesh Gradient for Glass Effect */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
                    <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]"></div>
                </div>

                <div className={`${selectedConvId ? 'hidden md:flex' : 'flex'} w-full md:w-auto md:flex-none h-full z-20 relative`}>
                    <ConversationList 
                        onSelect={setSelectedConvId} 
                        selectedId={selectedConvId} 
                        currentUserId={currentUserId}
                        onOpenInfo={() => setAutoOpenInfo(true)} 
                    />
                </div>

                {selectedConvId ? (
                    <div className="flex-1 flex w-full h-full z-10 relative">
                        <ChatWindow 
                            conversationId={selectedConvId} 
                            currentUserId={currentUserId} 
                            currentUserRole={currentUserRole}
                            onBack={() => setSelectedConvId(null)}
                            onNavigate={setSelectedConvId}
                            initialShowInfo={autoOpenInfo}
                            onConsumeInfo={() => setAutoOpenInfo(false)}
                        />
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
        </>
    );
};

export default App;
