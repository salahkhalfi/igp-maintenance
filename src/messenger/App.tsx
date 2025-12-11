import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- Sound Manager (Robust Fix) ---

const SoundManager = {
    audio: new Audio('/static/notification.mp3'),
    
    // Force browser to accept audio by playing a silent buffer via Web Audio API
    unlock: function() {
        // Method 1: HTML5 Audio Unlock
        this.audio.volume = 0;
        this.audio.play().then(() => {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = 1;
        }).catch(() => {});

        // Method 2: Web Audio API Unlock (IOS/Mobile specific)
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.value = 0; // Silent
                osc.start(0);
                osc.stop(0.001);
                console.log("🔊 Audio Engine Unlocked");
            }
        } catch (e) {
            console.error("Audio Context unlock failed", e);
        }
    },

    play: function() {
        // Always reset to ensure it plays from start
        this.audio.currentTime = 0;
        this.audio.volume = 1.0;
        
        const promise = this.audio.play();
        if (promise !== undefined) {
            promise.catch(error => {
                console.error("❌ Notification sound failed:", error);
            });
        }
        return promise;
    }
};

// --- Global Styles & Utils ---

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Inter', sans-serif;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
            box-sizing: border-box;
        }

        h1, h2, h3, .font-display {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #000000;
        }

        /* Glass Scrollbar - Ultra Thin */
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .glass-panel {
            background: rgba(15, 15, 15, 0.6);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .glass-sidebar {
            background: rgba(5, 5, 5, 0.65);
            backdrop-filter: blur(40px);
            border-right: 1px solid rgba(255, 255, 255, 0.04);
        }

        .glass-header {
            background: rgba(5, 5, 5, 0.65);
            backdrop-filter: blur(40px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .glass-input {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #ffffff;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-input:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(16, 185, 129, 0.5);
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .glass-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }

        .glass-button-primary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-button-primary:hover {
            transform: translateY(-1px) scale(1.02);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .message-bubble-me {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-bubble-them {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
        }

        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .hover-trigger .hover-target { opacity: 0; transform: translateX(-10px); transition: all 0.3s ease; }
        .hover-trigger:hover .hover-target { opacity: 1; transform: translateX(0); }

        .bg-noise {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        }
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

const getNameFromToken = (token: string | null) => {
    if (!token) return '';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.full_name || payload.name || 'Utilisateur';
    } catch (e) {
        return 'Utilisateur';
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

const getRetentionInfo = (createdAt: string) => {
    const created = new Date(createdAt.endsWith('Z') ? createdAt : createdAt + 'Z');
    const now = new Date();
    const retentionDays = 30;
    const deletionDate = new Date(created.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const diffTime = deletionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime <= 0) {
        return { text: "Suppression imminente", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: "fa-exclamation-triangle" };
    } else if (diffTime < 24 * 60 * 60 * 1000) {
        const hours = Math.ceil(diffTime / (1000 * 60 * 60));
        return { text: `Expire dans ${hours}h`, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: "fa-clock" };
    } else if (diffDays <= 7) {
        return { text: `Reste ${diffDays} jours`, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "fa-hourglass-half" };
    } else {
        return { text: `Reste ${diffDays} jours`, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "fa-shield-alt" };
    }
};

const getInitials = (name: string) => {
    if (!name) return '?';
    const initials = name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return initials || '?';
};

const getAvatarGradient = (name: string) => {
    const gradients = [
        'bg-gradient-to-br from-rose-500 to-red-700',
        'bg-gradient-to-br from-blue-500 to-indigo-700',
        'bg-gradient-to-br from-emerald-400 to-green-700',
        'bg-gradient-to-br from-amber-400 to-orange-700',
        'bg-gradient-to-br from-violet-500 to-purple-700',
        'bg-gradient-to-br from-fuchsia-500 to-pink-700',
        'bg-gradient-to-br from-cyan-400 to-blue-700',
        'bg-gradient-to-br from-teal-400 to-emerald-700'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
};

const getRoleDisplayName = (role: string) => {
    if (!role) return '';
    switch(role.toLowerCase()) {
        case 'admin': return 'Administrateur';
        case 'supervisor': return 'Superviseur';
        case 'technician': return 'Technicien';
        case 'operator': return 'Opérateur';
        case 'coordinator': return 'Coordinateur';
        case 'planner': return 'Planificateur';
        case 'guest': return 'Invité';
        default: return role;
    }
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
    avatar_key?: string | null;
}

interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name: string | null;
    avatar_key?: string | null;
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
    sender_avatar_key?: string | null;
    content: string;
    created_at: string;
    type: string;
    media_key?: string;
    transcription?: string;
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-900/10 blur-[150px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]"></div>
            </div>
            <div className="bg-noise absolute inset-0 z-0 opacity-20"></div>
            
            <div className="w-full max-w-md z-10 animate-slide-up px-4">
                <div className="glass-panel p-8 md:p-12 rounded-3xl shadow-2xl">
                    <div className="flex flex-col items-center mb-10">
                        <img src="/logo-igp.png" alt="IGP Glass" className="h-20 object-contain mb-4 drop-shadow-2xl" />
                        <p className="text-emerald-500/90 text-[10px] font-bold tracking-widest uppercase text-center mb-6 leading-relaxed max-w-[280px] mx-auto">
                            Les Produits Verriers<br/>International IGP Inc.
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white font-display">IGP Connect</h1>
                        <p className="text-gray-400 text-sm mt-2 font-medium tracking-wide uppercase">Connexion Sécurisée</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-3 backdrop-blur-md">
                                <i className="fas fa-exclamation-circle"></i> {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Professionnel</label>
                            <div className="relative group">
                                <i className="fas fa-envelope absolute left-4 top-3.5 text-gray-500 transition-colors group-focus-within:text-emerald-400 z-10"></i>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none font-medium"
                                    placeholder="nom@igpglass.ca"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
                            <div className="relative group">
                                <i className="fas fa-lock absolute left-4 top-3.5 text-gray-500 transition-colors group-focus-within:text-emerald-400 z-10"></i>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full glass-input rounded-xl py-3 pl-11 pr-10 text-white placeholder-gray-600 focus:outline-none font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-gray-500 hover:text-emerald-400 transition-colors focus:outline-none z-10"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full glass-button-primary text-white font-bold py-4 rounded-xl mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide text-sm"
                        >
                            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <>Se connecter</>}
                        </button>
                    </form>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-fade-in">
            <div className="bg-[#0a0a0a] h-full w-full md:max-w-md md:border-r border-white/10 flex flex-col shadow-2xl">
                <div className="h-20 glass-header px-6 flex items-center gap-4 flex-shrink-0">
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                    <div className="flex-1">
                        <div className="text-white font-bold text-xl font-display">Nouvelle discussion</div>
                        <div className="text-emerald-500 text-xs font-bold tracking-wide uppercase mt-0.5">{selected.length} sélectionné(s)</div>
                    </div>
                </div>
                
                <div className="p-6 border-b border-white/5">
                    <div className="glass-input rounded-2xl px-4 py-3 flex items-center gap-3 transition-all focus-within:bg-white/5">
                        <i className="fas fa-search text-gray-500"></i>
                        <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent text-white w-full focus:outline-none placeholder-gray-600 font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {filteredUsers.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => toggleUser(user.id)}
                            className={`group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${selected.includes(user.id) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="relative">
                                {user.avatar_key ? (
                                    <img 
                                        src={`/api/auth/avatar/${user.id}?v=${user.avatar_key}`}
                                        className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                                        alt={user.full_name}
                                    />
                                ) : (
                                    <div className={`w-12 h-12 rounded-2xl ${getAvatarGradient(user.full_name)} flex items-center justify-center text-white font-bold shadow-lg text-sm`}>
                                        {getInitials(user.full_name)}
                                    </div>
                                )}
                                {selected.includes(user.id) && (
                                    <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#0a0a0a] shadow-sm animate-scale-in">
                                        <i className="fas fa-check text-white text-[10px]"></i>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className={`font-semibold text-base ${selected.includes(user.id) ? 'text-emerald-400' : 'text-gray-200 group-hover:text-white'}`}>{user.full_name}</div>
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mt-0.5">{getRoleDisplayName(user.role)}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {selected.length > 0 && (
                    <div className="p-6 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl pb-8">
                        <button 
                            onClick={() => onSelect(selected)}
                            className="w-full glass-button-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl"
                        >
                            <span>Commencer</span> <i className="fas fa-arrow-right"></i>
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
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden animate-slide-up border border-white/10 shadow-2xl">
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5">
                    <div className="text-white font-bold text-xl font-display">Nouveau Groupe</div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>

                <div className="p-10 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center mb-8 shadow-inner group cursor-pointer hover:from-gray-800 hover:to-gray-900 transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fas fa-camera text-gray-500 text-3xl group-hover:text-emerald-400 transition-colors z-10"></i>
                    </div>

                    <div className="w-full mb-3 relative group">
                        <input 
                            type="text" 
                            placeholder="Nom du groupe" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-transparent text-white text-2xl font-bold text-center border-b-2 border-white/10 focus:border-emerald-500 py-3 focus:outline-none transition-colors placeholder-gray-700 font-display"
                            autoFocus
                        />
                    </div>
                    <div className="text-gray-500 text-xs font-bold tracking-widest w-full text-right mb-6 opacity-50">{name.length}/25</div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8 flex gap-3 items-start text-left w-full">
                        <i className="fas fa-info-circle text-blue-400 mt-0.5 flex-shrink-0"></i>
                        <div>
                            <div className="text-blue-400 font-bold text-xs uppercase tracking-wide">Note importante</div>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                Ce groupe sera <strong>public et visible par tous</strong> jusqu'à ce que vous y ajoutiez le premier participant.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => onCreate(name)}
                        disabled={!name.trim()}
                        className="w-full glass-button-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl text-base"
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

const ConversationList = ({ onSelect, selectedId, currentUserId, currentUserName, currentUserAvatarKey, onOpenInfo, onAvatarUpdate, initialRecipientId, onRecipientProcessed }: { onSelect: (id: string) => void, selectedId: string | null, currentUserId: number | null, currentUserName: string, currentUserAvatarKey: string | null, onOpenInfo: () => void, onAvatarUpdate: () => void, initialRecipientId?: number | null, onRecipientProcessed?: () => void }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    // ...
    
    // Auto-Start Direct Chat from URL
    useEffect(() => {
        if (initialRecipientId && !loading && conversations) {
            startDirectChat(initialRecipientId);
            if (onRecipientProcessed) onRecipientProcessed();
        }
    }, [initialRecipientId, loading]);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [currentUserRole, setCurrentUserRole] = useState<string>('operator');
    
    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [currentUserAvatarKey]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validation client-side
            if (file.size > 5 * 1024 * 1024) {
                alert("L'image est trop volumineuse (maximum 5 Mo)");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            setUploadingAvatar(true);
            try {
                await axios.post('/api/auth/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                onAvatarUpdate(); // Refresh in App
            } catch (err) {
                alert("Erreur lors de l'upload de l'avatar");
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

    const handleDeleteAvatar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Voulez-vous supprimer votre photo de profil ?")) return;
        
        setUploadingAvatar(true);
        try {
            await axios.delete('/api/auth/avatar');
            onAvatarUpdate();
        } catch (err) {
            alert("Erreur lors de la suppression");
        } finally {
            setUploadingAvatar(false);
        }
    };
    
    // UI States
    const [showUserSelect, setShowUserSelect] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGuestManager, setShowGuestManager] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    
    // --- SMART SEARCH LOGIC ---
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [viewingList, setViewingList] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
    }, []);

    const startDirectChat = async (targetUserId: number) => {
        try {
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'direct',
                participantIds: [targetUserId]
            });
            if (res.data.conversationId) {
                onSelect(res.data.conversationId);
                setSearchTerm('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createBroadcastGroup = async () => {
        if (!confirm(`Créer un groupe avec TOUS les ${allUsers.length} utilisateurs ?`)) return;
        
        try {
            const allIds = allUsers.map(u => u.id).filter(id => id !== currentUserId);
            const res = await axios.post('/api/v2/chat/conversations', {
                type: 'group',
                name: `📢 Annonce Générale ${new Date().toLocaleDateString()}`,
                participantIds: allIds
            });
            if (res.data.conversationId) {
                onSelect(res.data.conversationId);
                setSearchTerm('');
            }
        } catch (err) {
            alert("Erreur création groupe global");
        }
    };
    // --------------------------

    // Sound logic
    // Removed local ref to use global SoundManager
    const prevConversationsRef = useRef<Conversation[]>([]);

    const firstName = currentUserName.split(' ')[0] || 'Utilisateur';

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role) setCurrentUserRole(payload.role);
            } catch (e) { console.error(e); }
        }

        // Helper to check robust subscription status
        const checkSubscriptionStatus = () => {
            if ((window as any).isPushSubscribed) {
                (window as any).isPushSubscribed().then((isSubscribed: boolean) => {
                    setPushEnabled(isSubscribed);
                    // Also update permission state to be in sync
                    if ('Notification' in window) {
                        setPushPermission(Notification.permission);
                    }
                });
            } else {
                 // Fallback if script not loaded yet (shouldn't happen often)
                 if ('serviceWorker' in navigator && 'PushManager' in window) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.pushManager.getSubscription().then(subscription => {
                             // This is the "naive" check that caused the bug, 
                             // but better than nothing if script missing.
                             // Ideally we wait for script.
                        });
                    });
                 }
            }
        };

        // Monitor Push Permission and Check Status
        if ('Notification' in window) {
            setPushPermission(Notification.permission);
        }
        checkSubscriptionStatus();

        // SERVICE WORKER SOUND LISTENER (For Background/Lock Screen sounds that SW sends to window if visible)
        const swSoundListener = (event: MessageEvent) => {
            if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
                SoundManager.play().catch(e => console.error("SW triggered sound blocked", e));
            }
        };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', swSoundListener);
        }
        
        // Listen for custom event from push-notifications.js
        const handlePushChange = () => {
            checkSubscriptionStatus();
        };
        window.addEventListener('push-notification-changed', handlePushChange);

        const fetchConversations = async () => {
            try {
                const res = await axios.get('/api/v2/chat/conversations');
                const newConvs = res.data.conversations || [];
                setConversations(newConvs);

                // Check for new unread messages in OTHER conversations
                const prevConvs = prevConversationsRef.current;
                
                // Only if we have history (not first load)
                if (prevConvs.length > 0) {
                    const hasNew = newConvs.some(nc => {
                        // Skip if this conversation is currently open (ChatWindow handles sound for active chat)
                        if (selectedId && nc.id === selectedId) return false;

                        const pc = prevConvs.find(p => p.id === nc.id);
                        // If unread count increased
                        if (pc && nc.unread_count > pc.unread_count) return true;
                        // If new conversation with unread messages
                        if (!pc && nc.unread_count > 0) return true;
                        return false;
                    });

                    if (hasNew) {
                        SoundManager.play().catch(e => {
                           console.error("Sound blocked by browser policy", e);
                        });
                    }
                }
                prevConversationsRef.current = newConvs;

            } catch (err: any) {
                console.error("Fetch conv error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [selectedId]);

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
                console.error("Group creation error:", err);
                const detail = err.response?.data?.error || err.message || "Inconnue";
                alert(`Erreur création groupe: ${detail}`);
            }
        }
    };

    const canCreateGroup = ['admin', 'supervisor', 'technician', 'coordinator', 'planner'].includes(currentUserRole);
    const isAdmin = currentUserRole === 'admin';

    const handleLogout = async () => {
        if (!confirm("Voulez-vous vous déconnecter ?")) return;

        try {
            // 1. DÉSABONNEMENT PUSH (Nettoyage Serveur)
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await axios.post('/api/push/unsubscribe', { endpoint: subscription.endpoint });
                }
            }
        } catch (e) {
            console.error("Erreur désabonnement push", e);
        } finally {
            // 2. NETTOYAGE LOCAL (Toujours exécuté)
            localStorage.removeItem('auth_token');
            window.location.reload();
        }
    };

    const handleSubscribe = async () => {
        // Diagnostic avant l'erreur
        if (!('serviceWorker' in navigator)) {
            alert("Votre navigateur ne supporte pas les Service Workers. Impossible d'activer les notifications.");
            return;
        }
        if (!('PushManager' in window)) {
            alert("Votre navigateur ne supporte pas le Push API (iOS: Ajoutez à l'écran d'accueil).");
            return;
        }
        
        if ((window as any).requestPushPermission) {
            const res = await (window as any).requestPushPermission();
            if (res && res.success) {
                setPushPermission('granted');
                setPushEnabled(true);
                alert("✅ Notifications activées avec succès !");
            } else {
                alert("❌ Erreur d'activation: " + (res?.error || "Inconnue"));
            }
        } else {
            alert("⚠️ Erreur système: Le script de notification n'est pas chargé. Rafraîchissez la page.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full glass-sidebar w-full md:w-[420px]">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                <div className="text-emerald-500 text-sm font-bold tracking-widest uppercase animate-pulse">Chargement...</div>
            </div>
        </div>
    );

    return (
        <div className="glass-sidebar w-full md:w-[320px] lg:w-[360px] xl:w-[420px] flex flex-col h-full z-20 relative bg-[#080808]">
            <div className="bg-noise absolute inset-0 opacity-10 pointer-events-none"></div>
            
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

            {/* PREMIUM HEADER - ID CARD STYLE */}
            <div className="px-4 md:px-6 pt-6 pb-4 flex-shrink-0 z-30 relative">
                {/* THE GLASS CARD CONTAINER */}
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f0f0f]/60 backdrop-blur-2xl shadow-2xl group/card transition-all duration-500 hover:border-white/15 hover:shadow-emerald-900/10">
                    
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center p-6">
                        
                        {/* 1. PROFILE SECTION */}
                        <div className="flex flex-row items-center gap-6 w-full cursor-pointer px-2" onClick={handleAvatarClick}>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                            
                            {/* Avatar with Animated Rings */}
                            <div className="relative group/avatar flex-shrink-0">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-20 group-hover/avatar:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                                
                                <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900 shadow-xl">
                                    <div className="w-full h-full rounded-full border-[3px] border-[#0a0a0a] overflow-hidden bg-[#0a0a0a] relative">
                                        {currentUserAvatarKey && !avatarError ? (
                                            <img 
                                                src={`/api/auth/avatar/${currentUserId}?v=${currentUserAvatarKey}`} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                                                alt="Avatar"
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold text-xl">
                                                {getInitials(currentUserName)}
                                            </div>
                                        )}
                                        
                                        {/* Camera Overlay on Hover */}
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                                            <i className="fas fa-camera text-white text-xs"></i>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    {currentUserAvatarKey && (
                                        <div 
                                            onClick={handleDeleteAvatar}
                                            className="absolute top-0 right-0 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] opacity-0 group-hover/avatar:opacity-100 transition-all hover:scale-110 shadow-lg z-20"
                                        >
                                            <i className="fas fa-times text-[8px] text-white"></i>
                                        </div>
                                    )}

                                    {/* Online Badge */}
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#0a0a0a] rounded-full flex items-center justify-center z-10">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Name & Role */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h2 className="text-white font-display font-bold text-lg tracking-wide leading-tight group-hover/card:text-emerald-400 transition-colors truncate">
                                    {firstName}
                                </h2>
                                <p className="text-emerald-500/70 text-[9px] font-bold uppercase tracking-wide mt-0.5 leading-tight whitespace-normal">Les Produits Verriers International IGP Inc.</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400 uppercase tracking-wider backdrop-blur-md truncate">
                                        {getRoleDisplayName(currentUserRole)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-5"></div>

                        {/* 2. DASHBOARD ACTIONS */}
                        <div className="flex items-center justify-between w-full px-2 gap-2">
                            <button 
                                onClick={handleSubscribe}
                                className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border backdrop-blur-md group/btn ${
                                    pushPermission === 'granted' && pushEnabled
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10' 
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover/btn:scale-110 ${pushPermission === 'granted' && pushEnabled ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                    <i className={`fas ${pushPermission === 'granted' && pushEnabled ? 'fa-bell' : 'fa-bell-slash'} text-sm`}></i>
                                </div>
                            </button>

                            <button 
                                onClick={() => SoundManager.play()}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-emerald-400 hover:bg-white/10 hover:text-white backdrop-blur-md group/btn"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110">
                                    <i className="fas fa-volume-up text-sm"></i>
                                </div>
                            </button>

                            {isAdmin && (
                                <button 
                                    onClick={() => setShowGuestManager(true)}
                                    className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-blue-400 hover:bg-white/10 hover:text-white backdrop-blur-md group/btn"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110">
                                        <i className="fas fa-user-shield text-sm"></i>
                                    </div>
                                </button>
                            )}

                            <button 
                                onClick={handleLogout}
                                className="flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 backdrop-blur-md group/btn"
                            >
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center transition-transform group-hover/btn:scale-110 group-hover/btn:rotate-90">
                                    <i className="fas fa-power-off text-sm"></i>
                                </div>
                            </button>
                        </div>

                    </div>
                </div>
            </div>

                <div className="flex gap-3 relative z-50 px-4 md:px-6 mb-4">
                    <div 
                        className="flex-1 relative group"
                        onMouseEnter={() => setIsFocused(true)}
                        onMouseLeave={() => {
                            if (document.activeElement !== searchInputRef.current && !searchTerm && !viewingList) {
                                setIsFocused(false);
                            }
                        }}
                    >
                        <i className="fas fa-search absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors"></i>
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Rechercher une personne..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => { setIsFocused(true); setViewingList(true); }}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            className="w-full bg-white/5 border border-white/5 text-white text-sm rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder-gray-600 shadow-inner font-medium" 
                        />
                        
                        {/* CHEVRON "Open List" Button (When collapsed and empty) */}
                        {(!searchTerm && !viewingList && !isFocused) && (
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input focus
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingList(true);
                                    // Do NOT focus input
                                }}
                                className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 hover:text-white transition-colors z-20"
                            >
                                <i className="fas fa-chevron-down"></i>
                            </button>
                        )}

                        {/* BOUTON D'ACTION SMART (CLAVIER/FERMER) */}
                        {(searchTerm || viewingList || isFocused) && (
                            <button
                                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (searchTerm) {
                                        setSearchTerm('');
                                        searchInputRef.current?.focus();
                                    } else if (isFocused) {
                                        // Cas: Focus actif -> On veut fermer le clavier mais garder la liste
                                        searchInputRef.current?.blur();
                                        // viewingList reste true grâce au onFocus précédent
                                    } else {
                                        // Cas: Pas de focus, liste ouverte -> On veut fermer la liste
                                        setViewingList(false);
                                        setIsFocused(false);
                                    }
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <i className={`fas ${searchTerm ? 'fa-times' : (isFocused ? 'fa-keyboard' : 'fa-times')}`}></i>
                            </button>
                        )}
                        
                        {(searchTerm.length > 0 || isFocused || viewingList) && (
                            <div 
                                onTouchStart={() => {
                                    // ZERO FRICTION: Toucher la liste ferme le clavier automatiquement
                                    if (isFocused) {
                                        searchInputRef.current?.blur();
                                    }
                                }}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-96 overflow-y-auto custom-scrollbar animate-slide-up z-50"
                            >
                                <div className="p-2">
                                    <div className="px-3 py-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                        {searchTerm ? 'Résultats' : 'Contacts'}
                                    </div>
                                    
                                    {/* OPTION ADMIN: TOUT LE MONDE */}
                                    {currentUserRole === 'admin' && (
                                        <div 
                                            onClick={createBroadcastGroup}
                                            className="flex items-center gap-3 p-3 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-colors group/item border border-transparent hover:border-emerald-500/30 mb-2 bg-emerald-500/5"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <i className="fas fa-bullhorn text-xs"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-emerald-400 font-bold text-sm">📢 TOUT LE MONDE</div>
                                                <div className="text-gray-500 text-[10px] uppercase font-bold">Créer un groupe avec tous ({allUsers.length})</div>
                                            </div>
                                            <i className="fas fa-arrow-right text-gray-600 group-hover/item:text-emerald-500 transition-colors"></i>
                                        </div>
                                    )}

                                    {allUsers
                                        .filter(u => u.id !== currentUserId)
                                        .filter(u => !searchTerm || u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(user => (
                                        <div 
                                            key={user.id}
                                            onClick={() => startDirectChat(user.id)}
                                            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group/item"
                                        >
                                            {user.avatar_key ? (
                                                <img src={`/api/auth/avatar/${user.id}?v=${user.avatar_key}`} className="w-8 h-8 rounded-full object-cover" alt={user.full_name} />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full ${getAvatarGradient(user.full_name)} flex items-center justify-center text-white text-xs font-bold`}>{getInitials(user.full_name)}</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-bold text-sm truncate">{user.full_name}</div>
                                                <div className="text-gray-500 text-[10px] uppercase font-bold">{getRoleDisplayName(user.role)}</div>
                                            </div>
                                            <i className="fas fa-comment-alt text-gray-600 group-hover/item:text-emerald-500 transition-colors"></i>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && u.id !== currentUserId).length === 0 && (
                                        <div className="px-3 py-2 text-gray-500 text-xs italic">Aucun utilisateur trouvé</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <button className="w-12 h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:scale-105 flex items-center justify-center transition-all shadow-lg shadow-emerald-900/30 border border-emerald-400/20">
                            <i className="fas fa-plus text-lg"></i>
                        </button>
                        <div className="absolute right-0 top-full mt-3 w-64 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden hidden group-hover:block z-50 p-2 backdrop-blur-xl">
                            <button 
                                onClick={() => { setSelectedUsers([]); setShowUserSelect(true); }} 
                                className="w-full text-left px-4 py-3.5 hover:bg-white/5 rounded-xl text-white text-sm flex items-center gap-4 transition-colors group/item"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all"><i className="fas fa-comment-alt"></i></div>
                                <div>
                                    <div className="font-bold text-gray-200 group-hover/item:text-white">Discussion Privée</div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Direct Message</div>
                                </div>
                            </button>
                            {canCreateGroup && (
                                <button 
                                    onClick={() => { setSelectedUsers([]); setShowCreateGroup(true); setShowUserSelect(false); }} 
                                    className="w-full text-left px-4 py-3.5 hover:bg-white/5 rounded-xl text-white text-sm flex items-center gap-4 transition-colors mt-1 group/item"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all"><i className="fas fa-users"></i></div>
                                    <div>
                                        <div className="font-bold text-gray-200 group-hover/item:text-white">Nouveau Groupe</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Team Chat</div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            
            {/* LISTE CONVERSATIONS - PREMIUM STYLE */}
            <div className="overflow-y-auto flex-1 custom-scrollbar px-4 pb-4 space-y-2 relative z-10">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-40 mt-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center mb-6 border border-white/5">
                            <i className="fas fa-wind text-4xl text-gray-600"></i>
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Vide pour l'instant</p>
                    </div>
                ) : conversations.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(conv => {
                    const avatarGradient = conv.name ? getAvatarGradient(conv.name) : 'bg-gray-800';
                    const isActive = selectedId === conv.id;
                    
                    return (
                        <div 
                            key={conv.id} 
                            onClick={() => onSelect(conv.id)} 
                            className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-500 border backdrop-blur-sm
                                ${isActive 
                                    ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-900/5 border-emerald-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] translate-x-2' 
                                    : 'bg-[#111111]/90 border-white/5 hover:bg-[#161616] hover:border-white/10 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1'
                                }`}
                        >
                            {/* Glowing Active Border */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    {conv.avatar_key ? (
                                        <img 
                                            src={`/api/v2/chat/asset?key=${encodeURIComponent(conv.avatar_key)}`} 
                                            // Fallback to auth avatar endpoint if asset key is standard avatar key
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                if (!target.src.includes('/api/auth/avatar/')) {
                                                    // If it's a user avatar key, we might need to parse ID from it or just use the direct serving endpoint if we knew the ID. 
                                                    // Actually, the backend returns u.avatar_key. 
                                                    // Let's use the robust /api/auth/avatar endpoint if it fails, BUT we need User ID.
                                                    // Easier: The backend returns 'avatars/USERID/...' as key.
                                                    // Let's try to load it via R2 asset proxy first.
                                                    // Actually, for Avatars, better to use the avatar endpoint if possible, but we don't have the ID easily here without parsing.
                                                    // Let's stick to R2 asset proxy for now, it should work if key is correct.
                                                    target.style.display = 'none'; // Hide if fail
                                                }
                                            }}
                                            className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className={`w-14 h-14 rounded-2xl ${avatarGradient} flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg text-lg border border-white/10 group-hover:scale-105 transition-transform duration-300`}>
                                            {conv.type === 'group' ? <i className="fas fa-users text-white/80"></i> : getInitials(conv.name || '')}
                                        </div>
                                    )}
                                    {conv.unread_count > 0 && (
                                        <div className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 bg-emerald-500 rounded-full border-[3px] border-[#080808] flex items-center justify-center text-[10px] font-bold shadow-sm text-black animate-bounce">
                                            {conv.unread_count}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className={`font-bold text-base truncate transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                {conv.name || (conv.type === 'group' ? 'Groupe sans nom' : 'Discussion Privée')}
                                            </h3>
                                            
                                            {/* BADGE PREMIUM PUBLIC/PRIVÉ */}
                                            {conv.type === 'group' && (
                                                (conv.participant_count && conv.participant_count <= 1) ? (
                                                    <div className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1 shrink-0">
                                                        <i className="fas fa-globe text-[8px] text-cyan-400"></i>
                                                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wide">Public</span>
                                                    </div>
                                                ) : (
                                                    <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                                                        <i className="fas fa-lock text-[8px] text-emerald-400"></i>
                                                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide">Privé</span>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <span className={`text-[10px] font-bold tracking-wide whitespace-nowrap ml-2 ${isActive ? 'text-emerald-400' : 'text-gray-600 group-hover:text-gray-500'}`}>
                                            {formatTime(conv.last_message_time)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate w-[75%] font-medium ${isActive ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'} ${conv.unread_count > 0 ? 'text-white font-semibold' : ''}`}>
                                            {conv.last_message ? (
                                                conv.last_message.startsWith('🎤') ? <span className="text-emerald-400 italic">{conv.last_message}</span> :
                                                conv.last_message.startsWith('📷') ? <span className="text-blue-400 italic">{conv.last_message}</span> :
                                                conv.last_message
                                            ) : <span className="opacity-50 italic">Nouvelle discussion</span>}
                                        </p>
                                        
                                        {/* COMPTEUR PARTICIPANTS (GROUPE) OU ONLINE (DIRECT) */}
                                        {conv.type === 'group' ? (
                                            <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-1.5 py-0.5 border border-white/5">
                                                {/* Online Count */}
                                                {conv.online_count !== undefined && conv.online_count > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.8)]"></div>
                                                        <span className="text-[9px] font-bold text-emerald-400 font-mono">{conv.online_count}</span>
                                                    </div>
                                                )}
                                                
                                                {/* Separator if both exist */}
                                                {conv.online_count !== undefined && conv.online_count > 0 && (
                                                    <div className="w-px h-2 bg-white/10"></div>
                                                )}

                                                {/* Total Count */}
                                                <div className="flex items-center gap-1">
                                                    <i className="fas fa-user text-[8px] text-gray-500"></i>
                                                    <span className="text-[9px] font-bold text-gray-500 font-mono">{conv.participant_count || 1}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Pour Direct Message : Juste le point vert si en ligne */
                                            conv.online_count !== undefined && conv.online_count > 0 && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ImageViewer = ({ src, createdAt, onClose, onDelete, onDownload, onAnnotate, canDelete }: { src: string, createdAt?: string, onClose: () => void, onDelete?: () => void, onDownload: () => void, onAnnotate: () => void, canDelete?: boolean }) => {
    const retention = createdAt ? getRetentionInfo(createdAt) : null;
    
    // État pour le Zoom et Pan
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        // Zoom avec la molette
        e.stopPropagation();
        const delta = e.deltaY * -0.005;
        const newScale = Math.min(Math.max(1, scale + delta), 5); // Max zoom 5x
        setScale(newScale);
        if (newScale === 1) setPosition({ x: 0, y: 0 });
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (scale > 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            setScale(2.5); // Zoom rapide
        }
    };

    // Gestion du déplacement (Pan) - Souris
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            // Pas de preventDefault ici pour laisser passer le double-clic
            e.stopPropagation();
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            e.stopPropagation();
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Gestion du déplacement (Pan) - Touch (Mobile)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (scale > 1 && e.touches.length === 1) {
            e.stopPropagation();
            setIsDragging(true);
            setStartPos({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && scale > 1 && e.touches.length === 1) {
            e.stopPropagation();
            setPosition({
                x: e.touches[0].clientX - startPos.x,
                y: e.touches[0].clientY - startPos.y
            });
        }
    };

    const handleTouchEnd = () => setIsDragging(false);

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in select-none overflow-hidden" 
            onClick={onClose}
            onWheel={handleWheel}
        >
            <div className="absolute top-6 right-6 flex gap-3 z-50">
                <button 
                    onClick={(e) => { e.stopPropagation(); onAnnotate(); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-white text-emerald-400 flex items-center justify-center transition-all border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
                    title="Annoter cette image"
                >
                    <i className="fas fa-pen text-lg group-hover:scale-110 transition-transform"></i>
                </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-white text-emerald-400 flex items-center justify-center transition-all border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group"
                    title="Télécharger l'image"
                >
                    <i className="fas fa-download text-lg group-hover:scale-110 transition-transform"></i>
                </button>

                {canDelete && onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] group"
                        title="Supprimer cette image"
                    >
                        <i className="fas fa-trash-alt text-lg group-hover:scale-110 transition-transform"></i>
                    </button>
                )}
                
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10 ml-2">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            <div 
                className="flex-1 flex items-center justify-center relative w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img 
                    src={src} 
                    alt="Full view" 
                    className={`max-h-full max-w-full object-contain transition-transform duration-100 ease-out ${scale === 1 ? 'cursor-zoom-in' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
                    style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
                    onClick={(e) => e.stopPropagation()} 
                    onDoubleClick={toggleZoom}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onDragStart={(e) => e.preventDefault()} // Empêche le drag natif
                />
                
                {/* Information de rétention - Masquée si zoomé pour pas gêner */}
                {retention && scale === 1 && (
                    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full border flex items-center gap-2 pointer-events-none backdrop-blur-md shadow-lg ${retention.bg} ${retention.border}`}>
                        <i className={`fas ${retention.icon} ${retention.color} text-xs`}></i>
                        <span className={`${retention.color} text-[10px] font-bold uppercase tracking-widest`}>{retention.text}</span>
                    </div>
                )}

                {/* Indication visuelle de zoom */}
                {scale === 1 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/30 text-[9px] uppercase font-bold tracking-widest pointer-events-none animate-pulse">
                        Double-clic pour zoomer
                    </div>
                )}
            </div>
        </div>
    );
};

const GroupInfo = ({ participants, conversationId, conversationName, conversationAvatarKey, conversationType, currentUserId, currentUserRole, onClose, onPrivateChat, autoOpenAddMember = false }: { participants: Participant[], conversationId: string, conversationName: string | null, conversationAvatarKey: string | null, conversationType: 'direct' | 'group', currentUserId: number | null, currentUserRole: string, onClose: () => void, onPrivateChat: (userId: number) => void, autoOpenAddMember?: boolean }) => {
    const [showAddMember, setShowAddMember] = useState(false);
    const [isManageMode, setIsManageMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(conversationName || '');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditName(conversationName || '');
    }, [conversationName]);
    
    useEffect(() => {
        if (autoOpenAddMember) setShowAddMember(true);
    }, [autoOpenAddMember]);

    const currentUserParticipant = participants.find(p => p.user_id === currentUserId);
    const isGroupAdmin = currentUserParticipant && currentUserParticipant.role === 'admin';
    const isGlobalAdmin = currentUserRole === 'admin';
    const canEdit = (isGroupAdmin || isGlobalAdmin) && conversationType === 'group';

    const handleSaveInfo = async () => {
        try {
            await axios.put(`/api/v2/chat/conversations/${conversationId}`, { name: editName });
            setIsEditing(false);
            window.location.reload(); 
        } catch (e) {
            alert("Erreur lors de la modification");
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            setUploadingAvatar(true);
            try {
                await axios.post(`/api/v2/chat/conversations/${conversationId}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                window.location.reload();
            } catch (err) {
                alert("Erreur upload avatar");
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

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

    const handleClearChat = async () => {
        if (!confirm("ATTENTION : Voulez-vous supprimer TOUS les messages de cette discussion ? Cette action est irréversible.")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/messages`);
            onClose();
            window.location.reload(); 
        } catch (e) {
            alert('Erreur lors de la suppression des messages');
        }
    };

    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:absolute md:inset-y-0 md:right-0 md:left-auto md:w-[380px] flex justify-end">
            {showAddMember && (
                <UserSelect selectedIds={[]} onClose={() => setShowAddMember(false)} onSelect={handleAddMember} />
            )}

            <div className="w-full md:w-[380px] bg-[#0c0c0c] h-full flex flex-col animate-slide-in-right border-l border-white/10 shadow-2xl">
                {/* En-tête Panel */}
                <div className="h-20 bg-white/5 px-6 flex items-center justify-between flex-shrink-0 border-b border-white/5 backdrop-blur-xl">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex items-center gap-3 font-bold text-sm group">
                        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Retour
                    </button>
                    <div className="text-white font-bold font-display tracking-wide">DÉTAILS</div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 min-h-0 pb-10">
                    {/* Gros Icone de Groupe */}
                    <div className="flex flex-col items-center mb-10 relative group/avatar">
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        <div className="relative">
                            {conversationAvatarKey ? (
                                <img 
                                    src={`/api/v2/chat/asset?key=${encodeURIComponent(conversationAvatarKey)}`}
                                    className="w-28 h-28 rounded-3xl object-cover shadow-2xl border border-white/10"
                                    alt="Group"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl"></div>
                                    <i className={`fas ${conversationType === 'group' ? 'fa-users' : 'fa-user'} text-gray-200 text-4xl`}></i>
                                </div>
                            )}
                            
                            {canEdit && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-10 h-10 bg-gray-800 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-emerald-500 transition-colors shadow-lg z-10"
                                >
                                    {uploadingAvatar ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-camera text-xs"></i>}
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mt-6 w-full flex flex-col gap-2 animate-fade-in">
                                <input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-center font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="Nom du groupe"
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-center mt-2">
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold uppercase">Annuler</button>
                                    <button onClick={handleSaveInfo} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase shadow-lg">Sauvegarder</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mt-6 relative group/title">
                                <h2 className="text-white text-2xl font-bold text-center font-display flex items-center justify-center gap-3">
                                    {conversationName || (conversationType === 'group' ? 'Groupe sans nom' : 'Discussion Privée')}
                                    {canEdit && (
                                        <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition-colors ml-2">
                                            <i className="fas fa-pen text-sm"></i>
                                        </button>
                                    )}
                                </h2>
                                <div className="text-emerald-500 text-sm font-bold uppercase tracking-widest mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
                                    {participants.length} participant{participants.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Principales */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <button 
                            onClick={() => setShowAddMember(true)}
                            className="flex flex-col items-center justify-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <span className="text-xs font-bold text-gray-300 group-hover:text-white uppercase tracking-wide">Ajouter</span>
                        </button>
                        
                        {isGroupAdmin && conversationType === 'group' && (
                            <button 
                                onClick={() => setIsManageMode(!isManageMode)}
                                className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all group ${isManageMode ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${isManageMode ? 'bg-red-500 text-white' : 'bg-white/5 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'}`}>
                                    <i className={`fas ${isManageMode ? 'fa-check' : 'fa-cog'}`}></i>
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wide ${isManageMode ? 'text-red-400' : 'text-gray-300 group-hover:text-white'}`}>{isManageMode ? 'Terminer' : 'Gérer'}</span>
                            </button>
                        )}
                    </div>

                    {/* Liste des Membres */}
                    <div className="space-y-3">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 pl-1">
                            Membres du groupe
                        </div>
                        
                        {participants.map(p => (
                            <div key={p.user_id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group/member">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className={`w-10 h-10 rounded-xl ${getAvatarGradient(p.full_name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                                            {getInitials(p.full_name)}
                                        </div>
                                        <div className="min-w-0 cursor-pointer" onClick={() => p.user_id !== currentUserId && onPrivateChat(p.user_id)}>
                                            <div className="text-white font-bold truncate text-sm flex items-center gap-2">
                                                {p.full_name}
                                                {p.user_id === currentUserId && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 border border-white/5">Moi</span>}
                                            </div>
                                            <div className="text-gray-500 text-xs font-medium mt-0.5 uppercase tracking-wide">{getRoleDisplayName(p.role)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                        {/* Message Privé Button */}
                                        {p.user_id !== currentUserId && (
                                            <button 
                                                onClick={() => onPrivateChat(p.user_id)}
                                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-emerald-500 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                                                title="Message privé"
                                            >
                                                <i className="fas fa-comment-alt text-xs"></i>
                                            </button>
                                        )}

                                        {/* Bouton d'action contextuel */}
                                        {isManageMode && p.user_id !== currentUserId ? (
                                            <button 
                                                onClick={() => handleRemoveMember(p.user_id, p.full_name)}
                                                className="w-8 h-8 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                title="Retirer du groupe"
                                            >
                                                <i className="fas fa-minus"></i>
                                            </button>
                                        ) : (
                                            p.role === 'admin' && <i className="fas fa-crown text-amber-400 text-xs ml-1" title="Admin"></i>
                                        )}
                                    </div>
                            </div>
                        ))}
                    </div>

                </div>
                
                <div className="p-6 bg-[#0c0c0c] border-t border-white/10 flex-shrink-0 space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 relative">
                    {conversationType === 'group' && (
                        <button 
                            onClick={handleLeaveGroup}
                            className="w-full flex items-center justify-center gap-3 p-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm font-bold uppercase tracking-wide border border-transparent hover:border-white/10"
                        >
                            <i className="fas fa-sign-out-alt"></i> Quitter le groupe
                        </button>
                    )}

                    {(isGroupAdmin || isGlobalAdmin) && (
                        <button 
                            onClick={handleClearChat}
                            className="w-full flex items-center justify-center gap-3 p-4 text-orange-500 hover:text-white hover:bg-orange-600 rounded-xl transition-all text-sm font-bold uppercase tracking-wide border border-orange-900/30 bg-orange-500/5"
                        >
                            <i className="fas fa-eraser"></i> Vider la discussion
                        </button>
                    )}

                    {isGlobalAdmin && (
                        <button 
                            onClick={handleDeleteGroup}
                            className="w-full flex items-center justify-center gap-3 p-4 text-red-500 hover:text-white hover:bg-red-600 rounded-xl transition-all text-sm font-bold uppercase tracking-wide border border-red-900/30 bg-red-500/5"
                        >
                            <i className="fas fa-trash-alt"></i> Supprimer (Admin)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const AudioPlayer = ({ src, isMe }: { src: string, isMe: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        // DESIGN UPDATE: Suppression des bordures et fonds intérieurs. Le lecteur "flotte" dans la bulle.
        <div className="flex items-center gap-4 py-1 pr-2 min-w-[240px] max-w-[300px] select-none">
            
            {/* BOUTON PLAY PREMIUM (Inversé pour max contraste) */}
            <button 
                onClick={togglePlay}
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md active:scale-95 ${
                    isMe 
                    ? 'bg-white text-emerald-600' // MOI: Bouton Blanc sur fond Vert (Super clean)
                    : 'bg-emerald-500 text-white hover:bg-emerald-400' // EUX: Bouton Vert sur fond Gris (Call to action)
                }`}
            >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play ml-1'} text-xl`}></i>
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1.5">
                {/* Visualisation Onde Sonore - Organique */}
                <div className="h-8 flex items-center gap-1">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i} 
                            // Barres blanches pures pour Moi, Grises/Blanches pour Eux
                            className={`w-1 rounded-full transition-all duration-300 ${
                                i/20 * 100 < progress 
                                    ? (isMe ? 'bg-white/90' : 'bg-emerald-500') // Played part
                                    : (isMe ? 'bg-emerald-900/30' : 'bg-gray-600') // Unplayed part
                            }`}
                            style={{ 
                                // Onde sonore plus naturelle (sinusoidale simulée)
                                height: [30, 50, 70, 40, 60, 90, 45, 80, 55, 75, 45, 65, 85, 50, 40, 70, 45, 60, 40, 30][i] + '%',
                                animation: isPlaying ? `pulse 0.4s infinite alternate ${i * 0.05}s` : 'none'
                            }}
                        />
                    ))}
                </div>
                
                {/* Timer Discret */}
                <div className={`text-[10px] font-bold font-mono tracking-widest ${isMe ? 'text-emerald-100/80' : 'text-gray-400'}`}>
                    {isPlaying ? formatTime(audioRef.current?.currentTime || 0) : formatTime(duration)}
                </div>
            </div>

            <audio 
                ref={audioRef} 
                src={src} 
                preload="metadata"
                playsInline
                onTimeUpdate={() => {
                    if (audioRef.current && audioRef.current.duration) {
                        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                    }
                }}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => { setIsPlaying(false); setProgress(0); }}
                className="hidden" 
            />
        </div>
    );
};

const ChatWindow = ({ conversationId, currentUserId, currentUserRole, onBack, onNavigate, initialShowInfo, onConsumeInfo, initialMessage, onMessageConsumed }: { conversationId: string, currentUserId: number | null, currentUserRole: string, onBack: () => void, onNavigate: (id: string) => void, initialShowInfo: boolean, onConsumeInfo: () => void, initialMessage?: string, onMessageConsumed?: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [input, setInput] = useState(initialMessage || ''); // Init with prop
    const [editingTranscriptionId, setEditingTranscriptionId] = useState<string | null>(null);
    const [editingTranscriptionText, setEditingTranscriptionText] = useState('');

    const [showEmoji, setShowEmoji] = useState(false);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [triggerAddMember, setTriggerAddMember] = useState(false);
    const [viewImage, setViewImage] = useState<{ src: string; msgId: string; canDelete: boolean; mediaKey: string; createdAt: string } | null>(null);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    // Search In-Chat Logic
    const [searchMode, setSearchMode] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]); // Pour la navigation rapide

    useEffect(() => {
        if (searchMode && allUsers.length === 0) {
            axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
        }
    }, [searchMode]);

    const inputTimeoutRef = useRef<any>(null);
    
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- ANNOTATION TOOL ---
    const [annotatedFile, setAnnotatedFile] = useState<File | null>(null);
    const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [annotationColor, setAnnotationColor] = useState('#EF4444'); // Default Red
    const annotationCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    
    // --- ADVANCED ANNOTATION ENGINE STATE ---
    type AnnotationTool = 'select' | 'freehand' | 'arrow' | 'rectangle' | 'circle' | 'text';
    type AnnotationObject = 
        | { id: string, type: 'freehand', points: {x: number, y: number}[], color: string, rotation: number }
        | { id: string, type: 'arrow', start: {x: number, y: number}, end: {x: number, y: number}, color: string, rotation: number }
        | { id: string, type: 'rectangle' | 'circle', start: {x: number, y: number}, end: {x: number, y: number}, color: string, rotation: number }
        | { id: string, type: 'text', x: number, y: number, text: string, color: string, fontSize: number, rotation: number };

    const [annotationTool, setAnnotationTool] = useState<AnnotationTool>('freehand');
    // Cursor style management
    const [cursorStyle, setCursorStyle] = useState('cursor-crosshair');
    useEffect(() => {
        if (annotationTool === 'select') setCursorStyle('cursor-move');
        else if (annotationTool === 'text') setCursorStyle('cursor-text');
        else setCursorStyle('cursor-crosshair');
    }, [annotationTool]);

    const [annotations, setAnnotations] = useState<AnnotationObject[]>([]);
    const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationObject | null>(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Transform State
    const [transformMode, setTransformMode] = useState<'none' | 'move' | 'resize' | 'rotate'>('none');
    const [activeHandle, setActiveHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 'rot' | null>(null);
    const [initialTransformState, setInitialTransformState] = useState<AnnotationObject | null>(null);

    // Initialize Canvas when previewFile changes
    useEffect(() => {
        if (previewFile && !annotatedFile) {
            const img = new Image();
            img.src = URL.createObjectURL(previewFile);
            img.onload = () => {
                setOriginalImage(img);
                setAnnotations([]); // Reset annotations for new file
                if (annotationCanvasRef.current) {
                    const canvas = annotationCanvasRef.current;
                    // Full resolution strategy
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.lineWidth = 15; 
                        annotationCtxRef.current = ctx;
                        renderCanvas(); // Initial render
                    }
                }
            };
        }
    }, [previewFile]);

    // Refs for performance
    const annotationsRef = useRef<AnnotationObject[]>([]);
    const currentAnnotationRef = useRef<AnnotationObject | null>(null);
    
    // Sync state to refs (one-way sync for Undo/Redo/Load)
    useEffect(() => {
        annotationsRef.current = annotations;
        renderCanvas();
    }, [annotations]);

    // --- HELPER FUNCTIONS FOR ANNOTATIONS ---
    
    // Moved up to ensure availability
    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
        const headlen = 60; // Adjusted size
        const angle = Math.atan2(toY - fromY, toX - fromX);
        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    };

    const getBounds = (ann: AnnotationObject) => {
        if (!ann) return { x: 0, y: 0, w: 0, h: 0 };
        
        if (ann.type === 'freehand') {
            if (!ann.points || ann.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
            const xs = ann.points.map(p => p.x);
            const ys = ann.points.map(p => p.y);
            return {
                x: Math.min(...xs),
                y: Math.min(...ys),
                w: Math.max(...xs) - Math.min(...xs),
                h: Math.max(...ys) - Math.min(...ys)
            };
        } else if (ann.type === 'text') {
            const width = ann.text.length * (ann.fontSize * 0.6);
            return { x: ann.x, y: ann.y - ann.fontSize, w: width, h: ann.fontSize };
        } else {
            // For arrow, rectangle, circle
            if (!ann.start || !ann.end) return { x: 0, y: 0, w: 0, h: 0 };
            const x = Math.min(ann.start.x, ann.end.x);
            const y = Math.min(ann.start.y, ann.end.y);
            const w = Math.abs(ann.end.x - ann.start.x);
            const h = Math.abs(ann.end.y - ann.start.y);
            return { x, y, w, h };
        }
    };

    const getCenter = (ann: AnnotationObject) => {
        const b = getBounds(ann);
        return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    };

    const drawSelectionHandles = (ctx: CanvasRenderingContext2D, ann: AnnotationObject) => {
        const b = getBounds(ann);
        const handleSize = 40; 
        
        ctx.save();
        const center = getCenter(ann);
        // Ensure center is valid
        if (isNaN(center.x) || isNaN(center.y)) {
            ctx.restore();
            return;
        }

        ctx.translate(center.x, center.y);
        ctx.rotate(ann.rotation || 0);
        ctx.translate(-center.x, -center.y);
        
        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.setLineDash([]);
        
        const handles = [
            { x: b.x, y: b.y },
            { x: b.x + b.w, y: b.y },
            { x: b.x, y: b.y + b.h },
            { x: b.x + b.w, y: b.y + b.h }
        ];
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        handles.forEach(h => {
            ctx.beginPath();
            ctx.rect(h.x - handleSize/2, h.y - handleSize/2, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
        });
        
        // Rotation handle
        const rotX = b.x + b.w/2;
        const rotY = b.y - 150; 
        
        ctx.beginPath();
        ctx.moveTo(rotX, b.y);
        ctx.lineTo(rotX, rotY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'white';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(rotX, rotY, 25, 0, Math.PI * 2); 
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    };

    const renderCanvas = () => {
        if (!annotationCanvasRef.current || !annotationCtxRef.current || !originalImage) return;
        const canvas = annotationCanvasRef.current;
        const ctx = annotationCtxRef.current;

        // 1. Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Background Image
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        // 3. Draw All Annotations from Refs (Single source of truth during render)
        const annsToDraw = [...annotationsRef.current];
        if (currentAnnotationRef.current) annsToDraw.push(currentAnnotationRef.current);

        annsToDraw.forEach(ann => {
            if (!ann) return;
            ctx.save();
            
            // Apply rotation around center
            const center = getCenter(ann);
            
            // Safety Check: Only apply rotation if center is valid
            if (!isNaN(center.x) && !isNaN(center.y)) {
                ctx.translate(center.x, center.y);
                ctx.rotate(ann.rotation || 0); // Fallback to 0
                ctx.translate(-center.x, -center.y);
            }

            ctx.beginPath();
            ctx.strokeStyle = ann.color;
            ctx.fillStyle = ann.color;
            ctx.lineWidth = 15; // Reduced back to 15 for better visibility on smaller screens
            
            // Highlight selected (shadow only, box handled separately)
            if (ann.id === selectedAnnotationId) {
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 20;
            } else {
                ctx.shadowBlur = 0;
            }

            try {
                if (ann.type === 'freehand') {
                    if (ann.points && ann.points.length > 0) {
                        ctx.moveTo(ann.points[0].x, ann.points[0].y);
                        ann.points.forEach(p => ctx.lineTo(p.x, p.y));
                        ctx.stroke();
                    }
                } else if (ann.type === 'arrow') {
                    if (ann.start && ann.end) {
                        drawArrow(ctx, ann.start.x, ann.start.y, ann.end.x, ann.end.y);
                    }
                } else if (ann.type === 'rectangle') {
                    if (ann.start && ann.end) {
                        ctx.rect(ann.start.x, ann.start.y, ann.end.x - ann.start.x, ann.end.y - ann.start.y);
                        ctx.stroke();
                    }
                } else if (ann.type === 'circle') {
                    if (ann.start && ann.end) {
                        const radius = Math.sqrt(Math.pow(ann.end.x - ann.start.x, 2) + Math.pow(ann.end.y - ann.start.y, 2));
                        ctx.beginPath();
                        ctx.arc(ann.start.x, ann.start.y, radius, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                } else if (ann.type === 'text') {
                    ctx.font = `bold ${ann.fontSize}px Arial`;
                    ctx.fillText(ann.text, ann.x, ann.y);
                }
            } catch (e) {
                console.error("Error drawing annotation", e);
            }
            
            ctx.restore(); // Restore context (remove rotation) for next item

            // Draw selection handles ON TOP if selected
            if (ann.id === selectedAnnotationId) {
                drawSelectionHandles(ctx, ann);
            }
        });
    };

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
        if (!annotationCanvasRef.current) return { x: 0, y: 0 };
        const canvas = annotationCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: (cos * (x - cx)) - (sin * (y - cy)) + cx,
            y: (sin * (x - cx)) + (cos * (y - cy)) + cy
        };
    };

    const hitTestHandles = (x: number, y: number, ann: AnnotationObject): 'tl' | 'tr' | 'bl' | 'br' | 'rot' | null => {
        const center = getCenter(ann);
        // Rotate mouse point negatively to align with unrotated object
        const p = rotatePoint(x, y, center.x, center.y, -(ann.rotation || 0)); // Fallback to 0
        
        const b = getBounds(ann);
        const handleSize = 150; 
        
        const handles = [
            { id: 'tl', x: b.x, y: b.y },
            { id: 'tr', x: b.x + b.w, y: b.y },
            { id: 'bl', x: b.x, y: b.y + b.h },
            { id: 'br', x: b.x + b.w, y: b.y + b.h },
            { id: 'rot', x: b.x + b.w/2, y: b.y - 150 } // Increased distance
        ];

        for (const h of handles) {
             if (Math.abs(p.x - h.x) < handleSize && Math.abs(p.y - h.y) < handleSize) {
                 return h.id as any;
             }
        }
        return null;
    };

    const isPointInAnnotation = (x: number, y: number, ann: AnnotationObject): boolean => {
        const center = getCenter(ann);
        const p = rotatePoint(x, y, center.x, center.y, -(ann.rotation || 0)); // Fallback to 0
        const lx = p.x;
        const ly = p.y;
        
        // ... rest of function ...
        // Dynamic HIT_RADIUS based on image size to ensure usability on high-res
        const canvas = annotationCanvasRef.current;
        const baseSize = canvas ? Math.max(canvas.width, canvas.height) : 2000;
        const HIT_RADIUS = Math.max(100, baseSize * 0.05); // Min 100px, or 5% of image size
        
        if (ann.type === 'freehand') {
            // Check all points
            return ann.points.some(pt => Math.hypot(pt.x - lx, pt.y - ly) < HIT_RADIUS);
        } else if (ann.type === 'text') {
            const width = ann.text.length * (ann.fontSize * 0.6);
            const height = ann.fontSize;
            // More generous text hit box
            return lx >= ann.x - HIT_RADIUS && 
                   lx <= ann.x + width + HIT_RADIUS && 
                   ly >= ann.y - height - HIT_RADIUS && 
                   ly <= ann.y + HIT_RADIUS;
        } else if (ann.type === 'rectangle') {
            const minX = Math.min(ann.start.x, ann.end.x);
            const maxX = Math.max(ann.start.x, ann.end.x);
            const minY = Math.min(ann.start.y, ann.end.y);
            const maxY = Math.max(ann.start.y, ann.end.y);
            // Check if point is near the border OR inside
             return (lx >= minX - HIT_RADIUS && lx <= maxX + HIT_RADIUS &&
                    ly >= minY - HIT_RADIUS && ly <= maxY + HIT_RADIUS);
        } else if (ann.type === 'circle') {
            const radius = Math.sqrt(Math.pow(ann.end.x - ann.start.x, 2) + Math.pow(ann.end.y - ann.start.y, 2));
            const dist = Math.hypot(ann.start.x - lx, ann.start.y - ly); 
            return Math.abs(dist - radius) < HIT_RADIUS || dist < radius; 
        } else if (ann.type === 'arrow') {
            // Check distance to line segment
            const x1 = ann.start.x, y1 = ann.start.y;
            const x2 = ann.end.x, y2 = ann.end.y;
            
            const A = lx - x1;
            const B = ly - y1;
            const C = x2 - x1;
            const D = y2 - y1;
            
            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) param = dot / len_sq;
            
            let xx, yy;
            
            if (param < 0) {
              xx = x1; yy = y1;
            } else if (param > 1) {
              xx = x2; yy = y2;
            } else {
              xx = x1 + param * C;
              yy = y1 + param * D;
            }
            
            const dist = Math.hypot(lx - xx, ly - yy);
            return dist < HIT_RADIUS;
        }
        return false;
    };

    const changeColor = (color: string) => {
        setAnnotationColor(color);
        if (selectedAnnotationId) {
            setAnnotations(prev => prev.map(ann => 
                ann.id === selectedAnnotationId ? { ...ann, color } : ann
            ));
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent default only if necessary to allow scrolling elsewhere, but here we want to block scroll on canvas
        // e.preventDefault(); 
        // Actually, for touch events we must prevent default to avoid scrolling the page while drawing
        if (e.cancelable) e.preventDefault(); 
        
        const { x, y } = getCanvasPoint(e);
        
        // Ensure tool is actually select if we are in select mode
        // (State is reliable, but let's be explicit in logic flow)
        
        if (annotationTool === 'select') {
            // First, try to hit handles of the CURRENTLY selected annotation
            if (selectedAnnotationId) {
                const selectedAnn = annotationsRef.current.find(a => a.id === selectedAnnotationId); // Use Ref
                if (selectedAnn) {
                    const handle = hitTestHandles(x, y, selectedAnn);
                    if (handle) {
                        setTransformMode(handle === 'rot' ? 'rotate' : 'resize');
                        setActiveHandle(handle);
                        setDragStartPos({ x, y });
                        setInitialTransformState(JSON.parse(JSON.stringify(selectedAnn)));
                        setIsDragging(true);
                        return;
                    }
                }
            }

            // If no handle hit, check if we clicked on ANY annotation to select/move it
            // We search in reverse to find top-most first
            const clickedAnn = [...annotationsRef.current].reverse().find(ann => isPointInAnnotation(x, y, ann)); // Use Ref
            
            if (clickedAnn) {
                setSelectedAnnotationId(clickedAnn.id);
                setDragStartPos({ x, y });
                setTransformMode('move');
                setInitialTransformState(JSON.parse(JSON.stringify(clickedAnn)));
                setIsDragging(true);
            } else {
                // Deselect if clicked empty space
                setSelectedAnnotationId(null);
                setTransformMode('none');
            }
            return;
        }

        setIsDrawing(true);
        const id = Date.now().toString();

        if (annotationTool === 'freehand') {
            currentAnnotationRef.current = { id, type: 'freehand', points: [{x, y}], color: annotationColor, rotation: 0 };
            // setCurrentAnnotation removed to avoid state update
        } else if (annotationTool === 'text') {
             const text = prompt("Entrez le texte:");
             if (text) {
                 const newAnn = { id, type: 'text', x, y, text, color: annotationColor, fontSize: 120, rotation: 0 };
                 annotationsRef.current.push(newAnn as any);
                 setAnnotations([...annotationsRef.current]); // State update immediate for text
                 
                 // Auto-select text for immediate modification
                 setSelectedAnnotationId(id);
                 setAnnotationTool('select');
             }
             setIsDrawing(false); 
        } else {
            currentAnnotationRef.current = { id, type: annotationTool, start: {x, y}, end: {x, y}, color: annotationColor, rotation: 0 } as any;
            // setCurrentAnnotation removed
        }
        
        requestAnimationFrame(renderCanvas);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const { x, y } = getCanvasPoint(e);

        if (annotationTool === 'select' && isDragging && selectedAnnotationId && dragStartPos && initialTransformState) {
            const dx = x - dragStartPos.x;
            const dy = y - dragStartPos.y;
            
            // DIRECT REF MUTATION FOR PERFORMANCE (60FPS)
            // We mutate the object inside annotationsRef.current directly.
            // React State is NOT updated here to avoid re-renders.
            
            const index = annotationsRef.current.findIndex(ann => ann.id === selectedAnnotationId);
            if (index === -1) return;
            
            const ann = { ...annotationsRef.current[index] }; // Copy to modify
            
            if (transformMode === 'move') {
                if (ann.type === 'freehand') {
                    ann.points = initialTransformState.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
                } else if (ann.type === 'text') {
                    ann.x = initialTransformState.x + dx;
                    ann.y = initialTransformState.y + dy;
                } else {
                    ann.start = { x: initialTransformState.start.x + dx, y: initialTransformState.start.y + dy };
                    ann.end = { x: initialTransformState.end.x + dx, y: initialTransformState.end.y + dy };
                }
            } else if (transformMode === 'rotate') {
                const center = getCenter(ann);
                const angle = Math.atan2(y - center.y, x - center.x);
                ann.rotation = angle + Math.PI / 2;
            } else if (transformMode === 'resize') {
                const center = getCenter(initialTransformState as any);
                const localMouse = rotatePoint(x, y, center.x, center.y, -(initialTransformState.rotation || 0));
                const localStartClick = rotatePoint(dragStartPos.x, dragStartPos.y, center.x, center.y, -(initialTransformState.rotation || 0));
                
                const ldx = localMouse.x - localStartClick.x;
                const ldy = localMouse.y - localStartClick.y;
                
                if (ann.type === 'text') {
                        const initialDist = Math.hypot(dragStartPos.x - center.x, dragStartPos.y - center.y);
                        const currentDist = Math.hypot(x - center.x, y - center.y);
                        const scale = currentDist / initialDist;
                        ann.fontSize = Math.max(20, (initialTransformState as any).fontSize * scale);
                } else if (ann.type !== 'freehand') {
                    let s = { ...(initialTransformState as any).start };
                    let e = { ...(initialTransformState as any).end };
                    const x1 = Math.min(s.x, e.x);
                    const x2 = Math.max(s.x, e.x);
                    const y1 = Math.min(s.y, e.y);
                    const y2 = Math.max(s.y, e.y);
                    
                    let nx1 = x1, nx2 = x2, ny1 = y1, ny2 = y2;
                    if (activeHandle?.includes('l')) nx1 += ldx;
                    if (activeHandle?.includes('r')) nx2 += ldx;
                    if (activeHandle?.includes('t')) ny1 += ldy;
                    if (activeHandle?.includes('b')) ny2 += ldy;
                    
                    const newStart = { x: (s.x === x1) ? nx1 : nx2, y: (s.y === y1) ? ny1 : ny2 };
                    const newEnd = { x: (e.x === x1) ? nx1 : nx2, y: (e.y === y1) ? ny1 : ny2 };
                    ann.start = newStart;
                    ann.end = newEnd;
                }
            }
            
            // Apply mutation back to ref array
            annotationsRef.current[index] = ann;
            requestAnimationFrame(renderCanvas);
            return;
        }

        if (!isDrawing || !currentAnnotation) return;

        // For drawing new shapes, we update currentAnnotationRef
        // We switched renderCanvas to use `currentAnnotationRef`, so we update the Ref here.
        
        // Ensure currentAnnotationRef is initialized if it wasn't in startDrawing (fallback)
        // Though startDrawing should handle it. 
        // We need to mutate the EXISTING ref object if possible to avoid GC, 
        // but replacing it is fine for this frequency.
        
        // Wait, currentAnnotationRef.current IS the object we want to mutate.
        // If we mutate it in place, renderCanvas sees it.
        // We just need to ensure `startDrawing` created it.
        
        if (!currentAnnotationRef.current) return;

        const curr = currentAnnotationRef.current;
        if (curr.type === 'freehand') {
            curr.points.push({x, y});
        } else if (curr.type !== 'text') {
            (curr as any).end = {x, y};
        }
        
        requestAnimationFrame(renderCanvas);
    };

    const stopDrawing = () => {
        if (annotationTool === 'select') {
            setIsDragging(false);
            setDragStartPos(null);
            setTransformMode('none');
            
            // Sync Ref back to State on drag end (IMPORTANT)
            setAnnotations([...annotationsRef.current]); 
            return;
        }

        if (isDrawing && currentAnnotationRef.current) {
            // Commit new annotation to refs first
            annotationsRef.current.push(currentAnnotationRef.current);
            
            // Then sync to state (and auto-select logic)
            const newAnnId = currentAnnotationRef.current.id;
            const newAnnType = currentAnnotationRef.current.type;
            
            setAnnotations([...annotationsRef.current]);
            setCurrentAnnotation(null); 
            currentAnnotationRef.current = null;

            if (newAnnType !== 'freehand') {
                setSelectedAnnotationId(newAnnId);
                setAnnotationTool('select');
            }
        }
        setIsDrawing(false);
    };

    const undoAnnotation = () => {
        setAnnotations(prev => prev.slice(0, -1));
    };



    const clearAnnotation = () => {
        if (selectedAnnotationId) {
            setAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotationId));
            setSelectedAnnotationId(null);
            setTransformMode('none');
        } else {
            if (confirm("Effacer toutes les annotations ?")) {
                setAnnotations([]);
            }
        }
    };

    const saveAnnotation = async () => {
        if (annotationCanvasRef.current) {
            return new Promise<void>((resolve) => {
                annotationCanvasRef.current?.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], "annotated_image.jpg", { type: "image/jpeg" });
                        setAnnotatedFile(newFile);
                        resolve();
                    }
                }, 'image/jpeg', 0.85);
            });
        }
    };

    // Override sendImage to use annotated file
    const handleSendImage = async () => {
        await saveAnnotation(); // Ensure latest canvas state is captured
        
        // Wait a tick for state update (or pass directly)
        // Better: pass the file directly to upload function logic
        if (annotationCanvasRef.current) {
            annotationCanvasRef.current.toBlob(async (blob) => {
                if (blob) {
                    const finalFile = new File([blob], "annotated_image.jpg", { type: "image/jpeg" });
                    
                    const token = localStorage.getItem('auth_token');
                    if (!token) return;
                    setUploading(true);
                    try {
                        const formData = new FormData();
                        formData.append('file', finalFile);
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
                            body: JSON.stringify({ conversationId, content: '📷 Photo annotée', type: 'image', mediaKey: uploadData.key })
                        });
                        setPreviewFile(null);
                        setAnnotatedFile(null); // Reset
                        setOriginalImage(null);
                        fetchMessages();
                    } catch (err: any) { alert(`Erreur: ${err.message}`); } finally { setUploading(false); }
                }
            }, 'image/jpeg', 0.85);
        }
    };

    
    useEffect(() => {
        if (initialMessage && initialMessage !== input) {
            setInput(initialMessage);
            setIsInputExpanded(true);
            if (onMessageConsumed) onMessageConsumed();
        }
    }, [initialMessage]);


    
    // Sound logic handled by SoundManager

    const handleInputInteraction = (currentValue?: string) => {
        setIsInputExpanded(true);
        if (inputTimeoutRef.current) {
            clearTimeout(inputTimeoutRef.current);
        }
        
        const valueToCheck = currentValue !== undefined ? currentValue : input;

        // Only auto-collapse if empty
        if (valueToCheck.trim().length === 0) {
            inputTimeoutRef.current = setTimeout(() => {
                setIsInputExpanded(false);
            }, 1000);
        }
    };

    // Auto-resize and persistent expansion logic
    useEffect(() => {
        if (textareaRef.current) {
            // Reset height to auto/min to correctly calculate scrollHeight for shrinking
            textareaRef.current.style.height = '48px'; 
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`;
        }
        
        if (input.trim().length > 0) {
            setIsInputExpanded(true);
            if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
        }
    }, [input]);

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
            // Capture status BEFORE state update to avoid race condition with React batching
            const isFirstLoad = !initialFetchDone.current;

            setMessages(prev => {
                if (prev.length !== newMessages.length) {
                    // Play sound if new message from others (ONLY if not initial load)
                    if (!isFirstLoad && newMessages.length > prev.length) {
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg.sender_id !== currentUserId) {
                            SoundManager.play().catch(e => console.error("Sound error:", e));
                        }
                    }
                    setTimeout(scrollToBottom, 100);
                    markAsRead();
                }
                return newMessages;
            });
            
            if (isFirstLoad) initialFetchDone.current = true; // Mark initial fetch as done
        } catch (err) { console.error(err); }
        finally { setLoadingMessages(false); }
    };

    const initialFetchDone = useRef(false);

    useEffect(() => {
        setLoadingMessages(true);
        setMessages([]);
        setParticipants([]);
        setShowInfo(false);
        initialFetchDone.current = false;
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

    // --- DICTATION FEATURE (TEXT) ---
    const [isDictating, setIsDictating] = useState(false);
    
    // Polyfill type for SpeechRecognition
    const startDictation = () => {
        if (isRecording) {
            alert("Impossible de dicter pendant l'enregistrement d'un message vocal.");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("La dictée vocale n'est pas supportée par votre navigateur.");
            return;
        }

        if (isDictating) {
            // Stop logic is handled by 'end' event or manual toggle off if needed, 
            // but usually we just let it run. If clicked again, we can stop it.
            // For now, let's allow toggle off.
            // Actually, we can't easily access the instance here without a ref. 
            // Simplified: This button will mainly be a "Start" button. 
            // The browser usually provides UI to stop, or silence stops it.
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsDictating(true);
        
        recognition.onend = () => {
            setIsDictating(false);
            // Auto-focus textarea for immediate correction
            if (textareaRef.current) {
                textareaRef.current.focus();
                // Optional: set cursor to end
                textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error("Dictation error", event.error);
            setIsDictating(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => {
                const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                return prev + space + transcript;
            });
            handleInputInteraction(input + " " + transcript); // Update UI size
        };

        recognition.start();
    };

    const startRecording = async () => {
        if (isDictating) {
            alert("Veuillez terminer la dictée de texte avant d'enregistrer un message vocal.");
            return;
        }
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
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "voice_message.webm", { type: 'audio/webm' });
                
                // UI Update Immediately (Optimistic)
                setIsRecording(false);
                setRecordingTime(0);
                clearInterval(timerRef.current);
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                // Send in background
                await sendAudio(audioFile);
            };
            mediaRecorderRef.current.stop();
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

    const [isSending, setIsSending] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;
        
        // Offline check
        if (!navigator.onLine) {
            alert("⚠️ Vous êtes hors ligne. Impossible d'envoyer le message.");
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        setIsSending(true);
        try {
            const response = await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ conversationId, content: input, type: 'text' })
            });
            
            if (response.ok) { 
                setInput(''); 
                setShowEmoji(false); 
                fetchMessages();
                
                // Start timeout to collapse after sending
                if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
                inputTimeoutRef.current = setTimeout(() => setIsInputExpanded(false), 1000);
            } else {
                const data = await response.json();
                throw new Error(data.error || "Erreur serveur");
            }
        } catch (err: any) { 
            console.error(err);
            alert(`❌ Erreur d'envoi: ${err.message || "Problème de connexion"}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        handleInputInteraction();
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handlePrivateChat = async (targetUserId: number) => {
        if (!targetUserId || targetUserId === currentUserId) return;
        
        // Anti-Redondance : Si on est DÉJÀ dans une conversation directe avec cette personne
        if (conversation?.type === 'direct' && participants.some(p => p.user_id === targetUserId)) {
            // Optionnel : Focus l'input pour inviter à écrire
            textareaRef.current?.focus();
            return;
        }

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

    const handleAudioCall = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Envoyer une SONNERIE d'appel à ce groupe/utilisateur ?\n\nCela enverra une notification push immédiate.")) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            await fetch('/api/v2/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    conversationId,
                    content: '📞 SONNERIE: Je tente de vous joindre sur IGP Connect ! (Ouvrez le chat)',
                    type: 'text',
                    isCall: true // Special flag for Service Worker to boost priority/vibration
                })
            });
            alert("📳 Sonnerie envoyée avec succès !");
            fetchMessages(); // Refresh UI to show the system message
        } catch (err) {
            alert("Erreur lors de l'envoi de la sonnerie");
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if(!confirm("Supprimer ce message définitivement ?")) return;
        try {
            await axios.delete(`/api/v2/chat/conversations/${conversationId}/messages/${msgId}`);
            fetchMessages();
        } catch(e) { alert("Erreur suppression"); }
    };

    const handleSaveTranscription = async (messageId: string, newText: string) => {
        try {
            await axios.put(`/api/v2/chat/conversations/${conversationId}/messages/${messageId}/transcription`, {
                transcription: newText
            });
            
            // Update local state
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, transcription: newText } : msg
            ));
            
            setEditingTranscriptionId(null);
            setEditingTranscriptionText('');
        } catch (e) {
            console.error("Failed to save transcription", e);
            alert("Erreur lors de la sauvegarde de la transcription");
        }
    };

    const handleDownload = async (mediaKey: string, type: 'image' | 'audio') => {
        try {
            const token = localStorage.getItem('auth_token');
            // Fetch as blob to force download and handle auth headers
            const response = await fetch(`/api/v2/chat/asset?key=${encodeURIComponent(mediaKey)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error("Erreur réseau");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Generate filename: "type-date.ext"
            const ext = type === 'image' ? 'jpg' : 'webm';
            a.download = `igp-${type}-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert("Impossible de télécharger le fichier.");
            console.error(e);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnnotateExisting = async (src: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(src, {
                 headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const blob = await response.blob();
            const file = new File([blob], "annotation_edit.jpg", { type: blob.type });
            
            setViewImage(null); // Close viewer
            setPreviewFile(file); // Open editor
        } catch (e) {
            alert("Impossible de charger l'image pour l'édition");
        }
    };

    const renderMessages = () => {
        if (loadingMessages) {
             return (
                <div className="flex justify-center items-center h-full animate-fade-in">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                    </div>
                </div>
             );
        }

        if (messages.length === 0 && conversation?.type === 'group') {
            const hasMembers = participants.length > 1; // More than just me
            
            return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in p-8 text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-gray-800 to-black flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                        <i className="fas fa-users text-gray-600 text-4xl"></i>
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-3 font-display">
                        {hasMembers ? "La discussion est ouverte" : "Le groupe est prêt"}
                    </h3>
                    <p className="text-gray-400 mb-10 max-w-sm mx-auto text-lg font-light">
                        {hasMembers 
                            ? "Il n'y a pas encore de messages. Lancez la conversation avec vos collègues." 
                            : "Il n'y a pas encore de messages. Ajoutez des collègues pour commencer la discussion."}
                    </p>
                    
                    {hasMembers ? (
                         <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-6 max-w-xs w-full backdrop-blur-md">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 text-left">Membres présents</div>
                            <div className="flex flex-wrap gap-3">
                                {participants.map(p => (
                                    <div key={p.user_id} className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center text-xs text-white border border-gray-600 shadow-lg font-bold" title={p.full_name}>
                                        {getInitials(p.full_name)}
                                    </div>
                                )).slice(0, 5)}
                                {participants.length > 5 && <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xs text-gray-400 border border-gray-700 font-bold">+{participants.length - 5}</div>}
                            </div>
                         </div>
                    ) : (
                        <button 
                            onClick={() => { setShowInfo(true); setTriggerAddMember(true); }}
                            className="glass-button-primary text-white font-bold py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 transition-transform text-base"
                        >
                            <i className="fas fa-user-plus"></i> Ajouter des membres
                        </button>
                    )}
                </div>
            );
        }

        const result = [];
        let lastDate = '';

        // SEARCH FILTERING
        const messagesToDisplay = searchMode && searchKeyword.trim() 
            ? messages.filter(m => m.content.toLowerCase().includes(searchKeyword.toLowerCase()))
            : messages;

        if (searchMode && messagesToDisplay.length === 0 && searchKeyword.trim()) {
             return (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in opacity-50 text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <i className="fas fa-search text-2xl"></i>
                    </div>
                    <p className="font-bold">Aucun message trouvé</p>
                    <p className="text-xs mt-1">"{searchKeyword}"</p>
                </div>
             );
        }

        for (let i = 0; i < messagesToDisplay.length; i++) {
            const msg = messagesToDisplay[i];
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
                    <div key={`date-${dateStr}`} className="flex justify-center my-8">
                        <span className="bg-black/40 border border-white/10 backdrop-blur-md text-gray-400 text-[11px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest shadow-lg">
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

            // Avatar rendering logic
            const avatarUrl = msg.sender_avatar_key 
                ? `/api/auth/avatar/${msg.sender_id}?v=${msg.sender_avatar_key}` // Stable cache busting
                : null;

            result.push(
                <div key={msg.id} className={`flex mb-6 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in group items-end gap-3`}>
                    
                    {/* Avatar for OTHERS (Left) */}
                    {!isMe && (
                        <div className="flex-shrink-0 mb-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={msg.sender_name}
                                    className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => handlePrivateChat(msg.sender_id)}
                                    title={msg.sender_name}
                                />
                            ) : (
                                <div 
                                    className={`w-8 h-8 rounded-xl ${getAvatarGradient(msg.sender_name)} flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10 cursor-pointer hover:scale-110 transition-transform`}
                                    onClick={() => handlePrivateChat(msg.sender_id)}
                                    title={msg.sender_name}
                                >
                                    {getInitials(msg.sender_name)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[65%]`}>
                        {!isMe && (
                            <div 
                                onClick={() => handlePrivateChat(msg.sender_id)}
                                className={`text-[11px] font-bold mb-1.5 ml-1 ${getAvatarGradient(msg.sender_name).replace('bg-gradient-to-br', '').replace('from-', 'text-').replace('to-', 'text-opacity-100')} cursor-pointer hover:underline transition-colors flex items-center gap-1.5`}
                                title="Envoyer un message privé"
                            >
                                {msg.sender_name} 
                            </div>
                        )}
                        
                        <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-md relative transition-all ${isMe ? 'message-bubble-me text-white rounded-tr-sm' : 'message-bubble-them text-gray-100 rounded-tl-sm'}`}>
                            {(isGlobalAdmin || isMe) && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                    className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 text-xs border-2 border-[#0b141a] hover:scale-110"
                                    title="Supprimer le message"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                            {msg.type === 'image' && msg.media_key ? (
                                <div className="overflow-hidden rounded-xl border border-white/10 relative group/image">
                                    <img 
                                        src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} 
                                        alt="Photo" 
                                        className="max-h-96 object-cover w-full cursor-pointer hover:scale-105 transition-transform duration-700"
                                        onClick={() => setViewImage({
                                            src: `/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key!)}`,
                                            msgId: msg.id,
                                            canDelete: isMe || isGlobalAdmin,
                                            mediaKey: msg.media_key!,
                                            createdAt: msg.created_at
                                        })}
                                    />
                                    {/* Download Button Overlay (Optional now, but kept for quick access without opening) */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownload(msg.media_key!, 'image'); }}
                                        className="absolute bottom-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover/image:opacity-100 shadow-lg border border-white/10 md:hidden"
                                        title="Télécharger l'image"
                                    >
                                        <i className="fas fa-download text-xs"></i>
                                    </button>
                                </div>
                            ) : msg.type === 'audio' && msg.media_key ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <AudioPlayer src={`/api/v2/chat/asset?key=${encodeURIComponent(msg.media_key)}`} isMe={isMe} />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownload(msg.media_key!, 'audio'); }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMe ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-black/10'}`}
                                            title="Télécharger l'audio"
                                        >
                                            <i className="fas fa-download text-xs"></i>
                                        </button>
                                    </div>
                                    {msg.transcription && (
                                        editingTranscriptionId === msg.id ? (
                                            <div className="flex flex-col gap-2 mt-2 w-full min-w-[200px]">
                                                <textarea
                                                    value={editingTranscriptionText}
                                                    onChange={(e) => setEditingTranscriptionText(e.target.value)}
                                                    className="w-full bg-black/20 text-white text-xs p-2 rounded-lg border border-white/10 focus:border-emerald-500 outline-none resize-y min-h-[60px]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingTranscriptionId(null); }}
                                                        className="text-[10px] uppercase font-bold text-gray-400 hover:text-white px-2 py-1"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleSaveTranscription(msg.id, editingTranscriptionText); }}
                                                        className="text-[10px] uppercase font-bold bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600 shadow-lg"
                                                    >
                                                        Enregistrer
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`text-[11px] italic font-medium tracking-wide flex items-start gap-1.5 p-2 rounded-lg ${isMe ? 'bg-black/10 text-emerald-100/90' : 'bg-white/5 text-gray-300'} relative`}>
                                                <i className="fas fa-robot text-[10px] mt-0.5 opacity-70 flex-shrink-0"></i>
                                                <span className="flex-1">{msg.transcription}</span>
                                                
                                                {isMe && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTranscriptionId(msg.id);
                                                            setEditingTranscriptionText(msg.transcription || '');
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-white hover:scale-110"
                                                        title="Éditer la transcription"
                                                    >
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-10 pb-1 font-medium tracking-wide">
                                    {msg.content}
                                </div>
                            )}
                            
                            <div className={`text-[10px] absolute bottom-1.5 right-3 flex items-center gap-1.5 font-bold tracking-wide ${isMe ? 'text-emerald-100/60' : 'text-gray-500'}`}>
                                <span>{formatTime(msg.created_at)}</span>
                                {isMe && (
                                    <i className={`fas fa-check-double text-[10px] ${isRead ? 'text-white' : 'text-emerald-200/40'}`}></i>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Avatar for ME (Right) */}
                    {isMe && (
                        <div className="flex-shrink-0 mb-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt="Me"
                                    className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10"
                                />
                            ) : (
                                <div className={`w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10`}>
                                    {getInitials(msg.sender_name)}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            );
        }
        return result;
    };

    return (
        <div className="flex-1 flex flex-col bg-[#050505] relative h-full overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div>
            <div className="bg-noise absolute inset-0 opacity-[0.03] pointer-events-none z-0"></div>

            {viewImage && (
                <ImageViewer 
                    src={viewImage.src} 
                    createdAt={viewImage.createdAt}
                    onClose={() => setViewImage(null)} 
                    canDelete={viewImage.canDelete}
                    onDelete={() => {
                        handleDeleteMessage(viewImage.msgId);
                        setViewImage(null);
                    }}
                    onDownload={() => handleDownload(viewImage.mediaKey, 'image')}
                    onAnnotate={() => handleAnnotateExisting(viewImage.src)}
                />
            )}
            {showInfo && <GroupInfo participants={participants} conversationId={conversationId} conversationName={conversation?.name || null} conversationAvatarKey={conversation?.avatar_key || null} conversationType={conversation?.type || 'group'} currentUserId={currentUserId} currentUserRole={currentUserRole} onClose={() => { setShowInfo(false); setTriggerAddMember(false); }} onPrivateChat={handlePrivateChat} autoOpenAddMember={triggerAddMember} />}
            
            {previewFile && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in select-none">
                    <div className="w-full h-full flex flex-col relative">
                        
                        {/* Header Toolbar */}
                        <div className="bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0 z-20">
                             <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => { 
                                        if (confirm("Voulez-vous vraiment quitter l'éditeur sans envoyer ?")) {
                                            setPreviewFile(null); 
                                            setAnnotatedFile(null); 
                                            setOriginalImage(null); 
                                        }
                                    }} 
                                    className="text-white hover:text-red-400 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 font-bold"
                                    title="Fermer sans envoyer"
                                >
                                    <i className="fas fa-times text-lg"></i>
                                    <span className="hidden md:inline">Fermer</span>
                                </button>
                                <h3 className="text-white font-bold text-lg hidden lg:block">Éditeur</h3>
                             </div>

                             <button onClick={handleSendImage} disabled={uploading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all">
                                {uploading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>ENVOYER <i className="fas fa-paper-plane ml-2"></i></span>}
                             </button>
                        </div>
                        
                        {/* Canvas Area */}
                        <div 
                            className={`flex-1 bg-[#101010] relative overflow-hidden flex items-center justify-center touch-none ${cursorStyle}`}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        >
                            <canvas 
                                ref={annotationCanvasRef} 
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                        </div>

                        {/* Tools Toolbar (Scrollable) */}
                        <div className="bg-black/90 backdrop-blur-md border-t border-white/10 p-2 flex justify-center items-center gap-2 overflow-x-auto z-20 w-full no-scrollbar">
                            <button onClick={() => setAnnotationTool('select')} className={`p-3 rounded-xl transition-all flex-shrink-0 ${annotationTool === 'select' ? 'bg-white text-black scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`} title="Déplacer"><i className="fas fa-hand-paper text-xl"></i></button>
                            <div className="w-px h-8 bg-white/10 flex-shrink-0 mx-1"></div>
                            <button onClick={() => setAnnotationTool('freehand')} className={`p-3 rounded-xl transition-all flex-shrink-0 ${annotationTool === 'freehand' ? 'bg-emerald-500 text-white scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`} title="Crayon"><i className="fas fa-pencil-alt text-xl"></i></button>
                            <button onClick={() => setAnnotationTool('arrow')} className={`p-3 rounded-xl transition-all flex-shrink-0 ${annotationTool === 'arrow' ? 'bg-emerald-500 text-white scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`} title="Flèche"><i className="fas fa-long-arrow-alt-right text-xl"></i></button>
                            <button onClick={() => setAnnotationTool('rectangle')} className={`p-3 rounded-xl transition-all flex-shrink-0 ${annotationTool === 'rectangle' ? 'bg-emerald-500 text-white scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`} title="Carré"><i className="far fa-square text-xl"></i></button>
                            <button onClick={() => setAnnotationTool('circle')} className={`p-3 rounded-xl transition-all flex-shrink-0 ${annotationTool === 'circle' ? 'bg-emerald-500 text-white scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`} title="Cercle"><i className="far fa-circle text-xl"></i></button>
                            <button onClick={() => setAnnotationTool('text')} className={`p-3 rounded-xl transition-all flex-shrink-0 ${annotationTool === 'text' ? 'bg-emerald-500 text-white scale-105 shadow-lg' : 'bg-white/10 text-gray-400'}`} title="Texte"><i className="fas fa-font text-xl"></i></button>
                        </div>

                        {/* Footer Toolbar (Colors & Undo) */}
                        <div className="bg-black/80 backdrop-blur-md border-t border-white/5 p-4 flex justify-center items-center gap-4 flex-shrink-0 z-20 overflow-x-auto safe-area-bottom">
                            <button onClick={() => changeColor('#EF4444')} className={`w-10 h-10 rounded-full bg-red-500 border-4 transition-transform flex-shrink-0 ${annotationColor === '#EF4444' ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                            <button onClick={() => changeColor('#F59E0B')} className={`w-10 h-10 rounded-full bg-amber-500 border-4 transition-transform flex-shrink-0 ${annotationColor === '#F59E0B' ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                            <button onClick={() => changeColor('#10B981')} className={`w-10 h-10 rounded-full bg-emerald-500 border-4 transition-transform flex-shrink-0 ${annotationColor === '#10B981' ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                            <button onClick={() => changeColor('#3B82F6')} className={`w-10 h-10 rounded-full bg-blue-500 border-4 transition-transform flex-shrink-0 ${annotationColor === '#3B82F6' ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                            <button onClick={() => changeColor('#FFFFFF')} className={`w-10 h-10 rounded-full bg-white border-4 transition-transform flex-shrink-0 ${annotationColor === '#FFFFFF' ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`} />
                            
                            <div className="w-px h-10 bg-white/20 mx-2 flex-shrink-0"></div>
                            
                            <button 
                                onClick={undoAnnotation} 
                                className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                                title="Annuler (Ctrl+Z)"
                            >
                                <i className="fas fa-undo text-xl"></i>
                            </button>
                            <button 
                                onClick={clearAnnotation} 
                                className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${selectedAnnotationId ? 'bg-red-500 text-white shadow-lg scale-110' : 'bg-white/10 text-red-400 hover:bg-red-500/20'}`}
                                title={selectedAnnotationId ? "Supprimer la sélection" : "Effacer tout"}
                            >
                                <i className={`fas ${selectedAnnotationId ? 'fa-eraser' : 'fa-trash-alt'} text-xl`}></i>
                            </button>
                        </div>

                    </div>
                </div>
            )}

            <header onClick={() => !searchMode && setShowInfo(true)} className="min-h-[5rem] h-auto py-3 glass-header px-4 md:px-8 flex flex-wrap items-center justify-between z-20 flex-shrink-0 cursor-pointer hover:bg-white/5 transition-all duration-300 shadow-2xl shadow-black/40 sticky top-0 w-full group/header backdrop-blur-xl border-b border-white/5 gap-y-2">
                {searchMode ? (
                    <div className="flex-1 flex items-center gap-4 animate-fade-in w-full">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSearchMode(false); setSearchKeyword(''); }}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-500 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-3 border border-emerald-500/30 shadow-inner relative group/search min-w-0">
                            <i className="fas fa-search text-gray-500 mr-3 flex-shrink-0"></i>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Chercher..." 
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 font-medium min-w-0"
                                onKeyDown={(e) => e.key === 'Escape' && setSearchMode(false)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchKeyword && (
                                <i onClick={(e) => {e.stopPropagation(); setSearchKeyword('');}} className="fas fa-times-circle text-gray-500 hover:text-white cursor-pointer ml-2 flex-shrink-0"></i>
                            )}

                            {/* SMART USER DROPDOWN (In-Chat) */}
                            {(searchKeyword || isSearchFocused) && allUsers.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#151515] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-slide-up max-h-60 overflow-y-auto custom-scrollbar">
                                    <div className="px-3 py-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-black/20">
                                        {searchKeyword ? 'Aller vers...' : 'Contacts rapides'}
                                    </div>
                                    {allUsers
                                        .filter(u => u.id !== currentUserId)
                                        .filter(u => !searchKeyword || u.full_name.toLowerCase().includes(searchKeyword.toLowerCase()))
                                        .map(user => (
                                        <div 
                                            key={user.id}
                                            onClick={(e) => { e.stopPropagation(); handlePrivateChat(user.id); setSearchMode(false); }}
                                            className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                        >
                                            {user.avatar_key ? (
                                                <img src={`/api/auth/avatar/${user.id}`} className="w-8 h-8 rounded-full object-cover shadow-sm" alt={user.full_name} />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full ${getAvatarGradient(user.full_name)} flex items-center justify-center text-white text-xs font-bold`}>{getInitials(user.full_name)}</div>
                                            )}
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="text-white font-bold text-sm truncate">{user.full_name}</div>
                                                <div className="text-gray-500 text-[10px] uppercase font-bold">{getRoleDisplayName(user.role)}</div>
                                            </div>
                                            <i className="fas fa-comment-alt text-emerald-500/50"></i>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    {/* Bouton Retour / Sortir Renforcé */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onBack(); }} 
                        className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 transition-all shadow-lg flex-shrink-0"
                        title="Sortir de la discussion"
                    >
                        <i className="fas fa-chevron-left text-emerald-500 group-hover:text-white transition-colors text-xl"></i>
                    </button>

                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-xl border border-white/10 group-hover/header:scale-105 transition-transform duration-300">
                            <i className="fas fa-users text-gray-400 text-sm md:text-lg group-hover/header:text-emerald-400 transition-colors"></i>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-[#050505] rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="text-white font-bold text-base md:text-xl leading-tight truncate font-display tracking-wide group-hover/header:text-emerald-400 transition-colors">Discussion</div>
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5 flex-shrink-0 flex items-center gap-1 shadow-sm" title="Suppression automatique des médias après 30 jours">
                                <i className="fas fa-history text-[9px] text-orange-400"></i>
                                <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Médias 30j</span>
                            </div>
                        </div>
                        <div className="text-gray-500 text-[10px] md:text-xs font-bold flex items-center tracking-wider uppercase leading-tight">
                            <span className="truncate w-full block">
                                {participants.length > 0 ? participants.map(p => p.full_name.split(' ')[0]).join(', ') : 'Chargement...'}
                            </span>
                        </div>
                    </div>
                </div>
                )}
                
                {/* HEADER FIX MOBILE - Phone Icon Force Visible & Button Group */}
                <div className="flex gap-2 items-center flex-shrink-0">
                    <button 
                        onClick={handleAudioCall}
                        className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl md:rounded-2xl hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-all border border-transparent hover:border-emerald-500/30 group/phone z-50 relative"
                        title="Appel Audio (Envoie une sonnerie)"
                        style={{ display: 'flex' }}
                    >
                        <i className="fas fa-phone-alt text-base md:text-lg group-hover/phone:scale-110 transition-transform"></i>
                    </button>

                    {!searchMode && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setSearchMode(true); 
                                setIsSearchFocused(true);
                                if (allUsers.length === 0) {
                                    axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
                                }
                            }}
                            onMouseEnter={() => {
                                if (allUsers.length === 0) {
                                    axios.get('/api/v2/chat/users').then(res => setAllUsers(res.data.users || [])).catch(console.error);
                                }
                            }}
                            className="flex hover:text-white transition-colors w-10 h-10 md:w-12 md:h-12 items-center justify-center rounded-xl md:rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 flex-shrink-0"
                            title="Rechercher dans la discussion"
                        >
                            <i className="fas fa-search text-base md:text-lg"></i>
                        </button>
                    )}
                    
                    {/* Bouton Fermer Explicite (X) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onBack(); }} 
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 hover:border-red-500 flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/20 flex-shrink-0"
                        title="Fermer la discussion"
                    >
                        <i className="fas fa-times text-lg md:text-xl"></i>
                    </button>
                </div>
            </header>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 z-10 custom-scrollbar relative scroll-smooth">
                {renderMessages()}
                <div ref={messagesEndRef} />
            </div>

            <footer className="glass-header p-4 md:p-6 z-20 flex-shrink-0 border-t border-white/5">
                <div className="max-w-5xl mx-auto flex items-end gap-3 relative">
                    {showEmoji && !isRecording && (
                        <div className="absolute bottom-full right-0 mb-4 bg-[#151515] border border-white/10 rounded-3xl shadow-2xl p-4 grid grid-cols-6 gap-2 w-80 animate-slide-up backdrop-blur-xl z-50">
                            {commonEmojis.map(emoji => (
                                <button key={emoji} onClick={() => setInput(prev => prev + emoji)} className="text-3xl hover:bg-white/10 rounded-xl p-3 transition-all hover:scale-110">{emoji}</button>
                            ))}
                        </div>
                    )}

                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-6 py-3 animate-pulse bg-red-500/10 rounded-[2rem] border border-red-500/20 h-[56px]">
                            <div className="flex items-center gap-4 text-white">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                                <span className="font-mono text-lg text-red-400 font-bold tracking-widest">{formatDuration(recordingTime)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={cancelRecording} className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest px-2 hover:underline">Annuler</button>
                                <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all transform hover:scale-110">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Bouton Plus (Upload) - Gauche */}
                            <div 
                                className={`pb-1 transition-all duration-300 ease-in-out overflow-hidden ${isInputExpanded ? 'w-0 opacity-0 mr-0' : 'w-12 opacity-100 mr-0'}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-all shadow-lg group">
                                    <i className="fas fa-plus text-lg group-hover:rotate-90 transition-transform duration-300"></i>
                                </button>
                            </div>

                            {/* Zone de texte + Emoji - Centre (Style Input) */}
                            <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-[1.5rem] flex items-end p-1.5 pl-5 gap-2 shadow-inner focus-within:border-emerald-500/50 focus-within:bg-[#202020] transition-all">
                                <textarea 
                                    ref={textareaRef}
                                    value={input}
                                    onChange={e => {
                                        setInput(e.target.value);
                                        handleInputInteraction(e.target.value);
                                    }}
                                    onFocus={() => handleInputInteraction()}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Message..." 
                                    className="bg-transparent text-white w-full max-h-32 focus:outline-none placeholder-gray-500 resize-none text-[15px] font-medium leading-relaxed custom-scrollbar py-3"
                                    rows={1}
                                    style={{ minHeight: '48px' }}
                                />
                                <button onClick={() => setShowEmoji(!showEmoji)} className={`w-12 h-12 flex-shrink-0 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${showEmoji ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}>
                                    <i className="far fa-smile text-xl"></i>
                                </button>
                                
                                {/* Dictation Button (Inside Input) */}
                                <button 
                                    onClick={startDictation}
                                    className={`w-10 h-10 flex-shrink-0 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${isDictating ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                                    title="Dictée vocale (Texte)"
                                >
                                    <i className="fas fa-microphone text-lg"></i>
                                </button>
                            </div>

                            {/* Bouton Envoyer / Micro - Droite */}
                            <div className="pb-1">
                                {input.trim() ? (
                                    <button 
                                        onClick={sendMessage} 
                                        disabled={isSending}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-all transform ${isSending ? 'bg-gray-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white'}`}
                                    >
                                        {isSending ? <i className="fas fa-circle-notch fa-spin text-lg"></i> : <i className="fas fa-paper-plane text-lg ml-0.5"></i>}
                                    </button>
                                ) : (
                                    <button onClick={startRecording} className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 text-gray-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all shadow-lg" title="Maintenir pour message vocal">
                                        <i className="fas fa-wave-square text-lg"></i>
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
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
        <div className="absolute top-[20%] right-[30%] w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
        
        <div className="relative z-10 text-center p-12 backdrop-blur-xl bg-white/5 rounded-[3rem] border border-white/5 shadow-2xl max-w-lg transform hover:scale-105 transition-transform duration-700">
            <img src="/logo-igp.png" alt="IGP Logo" className="h-40 mx-auto mb-10 object-contain drop-shadow-2xl" />
            <h1 className="text-white text-4xl font-bold mb-6 tracking-tight font-display">IGP Messenger</h1>
            <p className="text-gray-400 text-xl leading-relaxed mb-10 font-light">
                L'expérience de communication ultime pour les professionnels.
                <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-bold">Rapide. Sécurisé. Fluide.</span>
            </p>
            <div className="flex items-center justify-center gap-3 text-gray-600 text-xs font-mono border-t border-white/5 pt-8 uppercase tracking-widest">
                <i className="fas fa-shield-alt text-emerald-500"></i>
                Chiffré de bout en bout • v3.0.0 Premium
            </div>
        </div>
    </div>
);

const OfflineBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-red-500/90 text-white text-xs font-bold text-center py-1 absolute top-0 left-0 right-0 z-[100] backdrop-blur-md animate-slide-in-right">
            <i className="fas fa-wifi-slash mr-2"></i> MODE HORS LIGNE
        </div>
    );
};

const App = () => {
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [currentUserAvatarKey, setCurrentUserAvatarKey] = useState<string | null>(null);
    const [showLogin, setShowLogin] = useState(true);
    const [autoOpenInfo, setAutoOpenInfo] = useState(false);
    
    // Magic Bridge State
    const [initialRecipientId, setInitialRecipientId] = useState<number | null>(null);
    const [initialMessage, setInitialMessage] = useState<string>('');
    
    const fetchUserInfo = async () => {
        try {
            // Force bypass cache with timestamp
            const res = await axios.get(`/api/auth/me?t=${Date.now()}`);
            if (res.data.user) {
                 setCurrentUserAvatarKey(res.data.user.avatar_key);
                 
                 // --- AUTO-MAINTENANCE (Admin Only) ---
                 // Remplacement du CRON Cloudflare manquant
                 if (res.data.user.role === 'admin') {
                     const lastRun = localStorage.getItem('last_maintenance_run');
                     const today = new Date().toDateString();
                     
                     if (lastRun !== today) {
                         console.log('🧹 Lancement de la maintenance journalière...');
                         axios.post('/api/maintenance/force-cleanup').then(() => {
                             console.log('✅ Maintenance terminée.');
                             localStorage.setItem('last_maintenance_run', today);
                         }).catch(err => console.error('Maintenance error:', err));
                     }
                 }
            }
        } catch (e) { console.error("Error fetching user info", e); }
    };

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            setCurrentUserId(getUserIdFromToken(token));
            setCurrentUserRole(getUserRoleFromToken(token));
            setCurrentUserName(getNameFromToken(token));
            fetchUserInfo();
            setShowLogin(false);
        }

        // --- PUSH NOTIFICATIONS ---
        // Auto-init on load
        if ((window as any).initPushNotifications) {
            (window as any).initPushNotifications();
        }

        // --- DEEP LINKING & SSO ---
        const params = new URLSearchParams(window.location.search);
        const conversationId = params.get('conversationId');
        const recipientId = params.get('recipientId');
        const message = params.get('message');
        const tokenParam = params.get('token');

        // SSO: Inject token if provided
        if (tokenParam) {
            console.log("🔐 SSO Token detected, auto-login...");
            localStorage.setItem('auth_token', tokenParam);
            // Force reload context with new token
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + tokenParam;
            
            // Update state immediately
            try {
                const payload = JSON.parse(atob(tokenParam.split('.')[1]));
                setCurrentUserId(payload.userId);
                setCurrentUserRole(payload.role || '');
                setCurrentUserName(payload.full_name || payload.name || 'Utilisateur');
                fetchUserInfo();
                setShowLogin(false);
            } catch(e) {
                console.error("Invalid SSO Token", e);
            }
        }
        
        if (conversationId) {
            console.log("🔗 Deep link detected:", conversationId);
            setSelectedConvId(conversationId);
        }
        
        if (recipientId) {
            console.log("🔗 Magic Bridge Recipient:", recipientId);
            setInitialRecipientId(parseInt(recipientId));
        }
        
        if (message) {
            console.log("🔗 Magic Bridge Message:", message);
            setInitialMessage(message);
        }

        if (conversationId || recipientId || message || tokenParam) {
            // Clean URL to prevent loop on refresh, but keep it clean
            window.history.replaceState({}, '', window.location.pathname);
        }

        // --- AUDIO UNLOCKER ---
        // Aggressive unlocking on any interaction
        const handleInteraction = () => {
            SoundManager.unlock();
            // We don't remove the listener to ensure we keep the session "warm" if needed
            // But usually once is enough for the session.
            // Let's keep it lightweight.
        };

        ['click', 'touchstart', 'keydown'].forEach(evt => 
            window.addEventListener(evt, handleInteraction, { once: true })
        );

        return () => {
            ['click', 'touchstart', 'keydown'].forEach(evt => 
                window.removeEventListener(evt, handleInteraction)
            );
        };
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
                        setCurrentUserName(getNameFromToken(token));
                        fetchUserInfo();
                        setShowLogin(false);
                    }
                }} />
            </>
        );
    }

    return (
        <>
            <GlobalStyles />
            <OfflineBanner />
            <div className="flex h-[100dvh] bg-[#050505] overflow-hidden font-sans relative" style={{ backgroundImage: 'url(/static/maintenance-bg-premium.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-md pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[150px] mix-blend-overlay"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[150px] mix-blend-overlay"></div>
                </div>

                <div className={`${selectedConvId ? 'hidden md:flex' : 'flex'} w-full md:w-auto md:flex-none h-full z-20 relative shadow-[20px_0_50px_rgba(0,0,0,0.5)]`}>
                    <ConversationList 
                        onSelect={setSelectedConvId} 
                        selectedId={selectedConvId} 
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        currentUserAvatarKey={currentUserAvatarKey}
                        onOpenInfo={() => setAutoOpenInfo(true)} 
                        onAvatarUpdate={fetchUserInfo}
                        initialRecipientId={initialRecipientId}
                        onRecipientProcessed={() => setInitialRecipientId(null)}
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
                            initialMessage={initialMessage}
                            onMessageConsumed={() => setInitialMessage('')}
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