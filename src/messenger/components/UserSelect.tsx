import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';
import { getAvatarGradient, getInitials, getRoleDisplayName } from '../utils';

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

export default UserSelect;
