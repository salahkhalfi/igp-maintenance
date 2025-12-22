import React from 'react';

const EmptyState = () => (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
        <div className="absolute top-[20%] right-[30%] w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
        
        <div className="relative z-10 text-center p-12 backdrop-blur-xl bg-white/5 rounded-[3rem] border border-white/5 shadow-2xl max-w-lg transform hover:scale-105 transition-transform duration-700">
            <img src="/static/logo.png" alt="Logo" className="h-40 mx-auto mb-10 object-contain drop-shadow-2xl" />
            <h1 className="text-white text-4xl font-bold mb-6 tracking-tight font-display">Messenger</h1>
            <p className="text-gray-400 text-xl leading-relaxed mb-10 font-light">
                L'expérience de communication ultime pour les professionnels.
                <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-bold">Rapide. Sécurisé. Fluide.</span>
            </p>
            <div className="flex items-center justify-center gap-3 text-gray-600 text-xs font-mono border-t border-white/5 pt-8 uppercase tracking-widest">
                <i className="fas fa-shield-alt text-emerald-500"></i>
                Chiffré de bout en bout • v3.0.1 (Fix Audio + Target)
            </div>
        </div>
    </div>
);

export default EmptyState;
