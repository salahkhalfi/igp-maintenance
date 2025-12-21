import React, { useState, useEffect } from 'react';
import { client } from '../api';

interface LoginFormProps {
    onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginTitle, setLoginTitle] = useState('Gestion de la maintenance');
    const [loginSubtitle, setLoginSubtitle] = useState('Système de Maintenance Universel');
    const [logoUrl, setLogoUrl] = useState('/logo.png');
    const [bannerIndex, setBannerIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const bannerMessages = [
        { text: "BIENVENUE", icon: "👋", color: "from-blue-500 to-indigo-600" },
        { text: "VERSION STABILISÉE", icon: "💎", color: "from-emerald-500 to-teal-600" },
        { text: "PRÊTE POUR VALIDATION", icon: "🚀", color: "from-violet-500 to-purple-600" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(false);
            setTimeout(() => {
                setBannerIndex((prev) => (prev + 1) % bannerMessages.length);
                setIsAnimating(true);
            }, 500);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Load settings from PUBLIC endpoints
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Fetch in parallel for speed
                const [titleRes, subtitleRes, logoRes] = await Promise.all([
                    client.api.settings[':key'].$get({ param: { key: 'company_title' }, query: { t: Date.now().toString() } as any }),
                    client.api.settings[':key'].$get({ param: { key: 'company_subtitle' }, query: { t: Date.now().toString() } as any }),
                    client.api.settings.logo.$get({ query: { t: Date.now().toString() } as any })
                ]);

                if (titleRes.ok) {
                    const data = await titleRes.json();
                    if (data.value) setLoginTitle(data.value);
                }
                if (subtitleRes.ok) {
                    const data = await subtitleRes.json();
                    if (data.value) setLoginSubtitle(data.value);
                }
                // Logo URL is constructed
                setLogoUrl(`/api/settings/logo?t=${Date.now()}`);
            } catch (e) {
                console.warn("Failed to load public settings", e);
            }
        };
        loadSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await client.api.auth.login.$post({
                json: { email, password, rememberMe }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem('auth_token', data.token);
                    onLogin();
                } else {
                    setError("Erreur: Token manquant");
                }
            } else {
                const errData = await res.json();
                setError(errData.error || "Échec de connexion");
            }
        } catch (e) {
            setError("Erreur de connexion serveur");
        } finally {
            setLoading(false);
        }
    };

    const currentBanner = bannerMessages[bannerIndex];

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[3px]" style={{ zIndex: 0 }} />

            <div 
                className="p-6 sm:p-8 rounded-2xl w-full max-w-md mx-4 relative bg-white/90 shadow-2xl border border-white/80"
                style={{ zIndex: 1, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}
            >
                <div className="text-center mb-4 sm:mb-8">
                    <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-14 sm:h-20 w-auto mx-auto mb-2 sm:mb-4 drop-shadow-md object-contain"
                        onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                    />
                    <h1 
                        className="text-lg sm:text-xl md:text-2xl font-bold mb-2 px-2 break-words"
                        style={{ color: '#003B73', textShadow: '0 2px 4px rgba(255,255,255,0.5)' }}
                    >
                        {loginTitle}
                    </h1>

                    {/* Animated Banner */}
                    <div 
                        className="relative overflow-hidden inline-flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2 mb-3 sm:mb-4 rounded-full shadow-lg border border-white/40 backdrop-blur-md"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))', minWidth: '260px' }}
                    >
                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${currentBanner.color} transition-all duration-1000`} />
                        <div className={`flex items-center font-bold text-xs sm:text-sm tracking-wide text-gray-800 transition-all duration-500 transform ${isAnimating ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-4 scale-95 blur-sm'}`}>
                            <span className="mr-3 text-base">{currentBanner.icon}</span>
                            <span>{currentBanner.text}</span>
                        </div>
                    </div>

                    <p className="text-xs sm:text-sm px-4 font-semibold text-gray-700">
                        {loginSubtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-bold text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <div className="mb-3 sm:mb-4">
                        <label className="block text-gray-800 text-sm font-bold mb-1 shadow-black/5">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2.5 border border-white/50 bg-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="email@entreprise.com"
                        />
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <label className="block text-gray-800 text-sm font-bold mb-1 shadow-black/5">Mot de passe</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-3 py-2.5 pr-10 border border-white/50 bg-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-700"
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mr-2 h-4 w-4 text-blue-600 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-800 font-bold group-hover:text-blue-800 transition-colors">
                                Se souvenir de moi
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-bold py-3 px-4 rounded-xl hover:from-blue-800 hover:to-blue-950 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200/30 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-700 font-medium">
                        Conçue par <span className="font-bold text-blue-900">Le département IT</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
