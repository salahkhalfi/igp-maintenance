import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MessengerSettingsModal = ({ onClose }: { onClose: () => void }) => {
    const [appName, setAppName] = useState('Connect');
    const [aiName, setAiName] = useState('Expert Industriel (IA)');
    const [loading, setLoading] = useState(false);
    const [aiAvatarTimestamp, setAiAvatarTimestamp] = useState(Date.now());
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Fetch App Name
        axios.get('/api/settings/messenger_app_name').then(res => {
            if (res.data?.setting_value) setAppName(res.data.setting_value);
        }).catch(() => {});

        // Fetch AI Name
        axios.get('/api/settings/ai_expert_name').then(res => {
            if (res.data?.setting_value) setAiName(res.data.setting_value);
        }).catch(() => {});
    }, []);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                alert("L'image est trop volumineuse (maximum 2 Mo)");
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file);
            setLoading(true);
            try {
                await axios.post('/api/settings/upload-ai-avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setAiAvatarTimestamp(Date.now()); // Refresh image
            } catch (err) {
                alert("Erreur lors de l'upload de l'avatar");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await Promise.all([
                axios.put('/api/settings/messenger_app_name', { value: appName }),
                axios.put('/api/settings/ai_expert_name', { value: aiName })
            ]);
            window.location.reload();
        } catch (err) {
            alert('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex flex-col animate-slide-up items-center justify-center p-4">
            <div className="w-full max-w-md glass-panel rounded-3xl flex flex-col border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 flex-shrink-0">
                    <div>
                        <div className="text-white font-bold text-xl font-display">Personnalisation</div>
                        <div className="text-gray-500 text-xs font-bold tracking-wide uppercase mt-1">Apparence & Marque</div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* APP NAME */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nom de l'application</label>
                            <input 
                                value={appName}
                                onChange={e => setAppName(e.target.value)}
                                className="w-full glass-input rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                                placeholder="Ex: Connect"
                                required
                            />
                        </div>

                        <div className="w-full h-px bg-white/5"></div>

                        {/* AI EXPERT SETTINGS */}
                        <div className="space-y-4">
                            <div className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Expert Industriel (IA)</div>
                            
                            {/* Avatar Upload */}
                            <div className="flex items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                            <img 
                                                src={`/api/settings/ai-avatar?t=${aiAvatarTimestamp}`} 
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/messenger/messenger-icon.png'; }} 
                                                className="w-full h-full object-cover"
                                                alt="AI Avatar"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <i className="fas fa-camera text-white"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleAvatarChange} 
                                        className="hidden" 
                                        accept="image/*" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-bold text-sm">Avatar de l'Assistant</div>
                                    <div className="text-gray-500 text-xs mt-1">Cliquez pour modifier l'image</div>
                                </div>
                            </div>

                            {/* AI Name Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nom de l'Assistant</label>
                                <input 
                                    value={aiName}
                                    onChange={e => setAiName(e.target.value)}
                                    className="w-full glass-input rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                                    placeholder="Ex: Expert Industriel"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="glass-button-primary text-white font-bold py-4 rounded-xl w-full flex items-center justify-center gap-2">
                            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-save"></i> Enregistrer & Appliquer</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MessengerSettingsModal;