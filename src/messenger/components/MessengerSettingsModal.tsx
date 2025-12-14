import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MessengerSettingsModal = ({ onClose }: { onClose: () => void }) => {
    const [appName, setAppName] = useState('Connect');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get('/api/settings/messenger_app_name').then(res => {
            if (res.data?.setting_value) setAppName(res.data.setting_value);
        }).catch(() => {});
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('/api/settings/messenger_app_name', { value: appName });
            window.location.reload();
        } catch (err) {
            alert('Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex flex-col animate-slide-up items-center justify-center p-4">
            <div className="w-full max-w-md glass-panel rounded-3xl flex flex-col border border-white/10 shadow-2xl">
                <div className="h-20 px-8 flex items-center justify-between border-b border-white/5">
                    <div>
                        <div className="text-white font-bold text-xl font-display">Personnalisation</div>
                        <div className="text-gray-500 text-xs font-bold tracking-wide uppercase mt-1">Apparence & Marque</div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSave} className="space-y-6">
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
                        <button type="submit" disabled={loading} className="glass-button-primary text-white font-bold py-4 rounded-xl w-full flex items-center justify-center gap-2">
                            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-save"></i> Enregistrer</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MessengerSettingsModal;