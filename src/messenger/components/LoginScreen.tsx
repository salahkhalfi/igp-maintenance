import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appName, setAppName] = useState('Connect');

    useEffect(() => {
        axios.get('/api/settings/messenger_app_name').then(res => {
            if(res.data?.setting_value) setAppName(res.data.setting_value);
        }).catch(() => {});
    }, []);

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
                        <img src="/static/logo.png" onError={(e) => { e.currentTarget.src = '/static/logo-igp.png'; }} alt="Logo" className="h-20 object-contain mb-4 drop-shadow-2xl" />
                        <p className="text-emerald-500/90 text-[10px] font-bold tracking-widest uppercase text-center mb-6 leading-relaxed max-w-[280px] mx-auto">
                            Système de<br/>Maintenance Universel
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white font-display">{appName}</h1>
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
                                    placeholder="nom@email.com"
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

export default LoginScreen;
