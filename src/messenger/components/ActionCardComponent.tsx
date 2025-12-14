import React from 'react';
import { ActionCard } from '../types';

const ActionCardComponent = ({ card, isSender, onUpdateStatus, content, imageUrl }: { card: ActionCard, isSender: boolean, onUpdateStatus: (status: 'open' | 'in_progress' | 'resolved') => void, content?: string, imageUrl?: string }) => {
    const statusConfig: Record<string, { color: string, icon: string, label: string, bg: string }> = {
        'open': { color: 'text-red-600', icon: 'fa-exclamation-circle', label: 'À faire', bg: 'bg-red-50 border-l-4 border-red-500' },
        'in_progress': { color: 'text-amber-600', icon: 'fa-spinner fa-spin', label: 'En cours', bg: 'bg-amber-50 border-l-4 border-amber-500' },
        'resolved': { color: 'text-emerald-600', icon: 'fa-check-circle', label: 'Terminé', bg: 'bg-emerald-50 border-l-4 border-emerald-500' },
    };

    const config = statusConfig[card.status] || statusConfig['open'];

    const handleEscalate = () => {
        // Approche "Deep Link" simple et élégante
        // On ouvre l'app principale dans un nouvel onglet pour ne pas perdre le fil de la conversation
        // Le SSO gère l'authentification automatiquement
        const params = new URLSearchParams();
        params.set('createTicket', 'true');
        // Sécurité : on tronque à 1000 caractères pour éviter que l'URL ne plante le navigateur
        if (content) params.set('description', content.substring(0, 1000));
        
        // Ajout de l'URL de l'image (si présente) pour que l'app principale puisse la télécharger
        if (imageUrl) params.set('imageUrl', imageUrl);
        
        // Ouverture dans un nouvel onglet ('_blank')
        window.open('/?' + params.toString(), '_blank');
    };

    return (
        <div className={`mt-3 p-3 rounded-r-lg shadow-sm ${config.bg} flex flex-col gap-3 min-w-[200px]`}>
            {/* Header: Statut + Icône */}
            <div className="flex justify-between items-center">
                <div className={`flex items-center gap-2 font-bold uppercase text-xs tracking-wider ${config.color}`}>
                    <i className={`fas ${config.icon}`}></i>
                    <span>{config.label}</span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">TICKET #{card.id.slice(0,4)}</div>
            </div>
            
            {/* Actions: Boutons de changement de statut */}
            <div className="flex gap-1 bg-white/60 p-1 rounded-lg backdrop-blur-sm">
                {(['open', 'in_progress', 'resolved'] as const).map((s) => {
                    const isActive = card.status === s;
                    const btnLabel = statusConfig[s].label;
                    return (
                        <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); onUpdateStatus(s); }}
                            className={`flex-1 py-1.5 px-1 text-[10px] uppercase font-bold rounded transition-all ${
                                isActive 
                                    ? 'bg-white text-black shadow-md transform scale-105' 
                                    : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                            }`}
                        >
                            {btnLabel}
                        </button>
                    );
                })}
            </div>

            {/* Escalade vers Ticket (Seulement si non résolu) */}
            {card.status !== 'resolved' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleEscalate(); }}
                    className="w-full py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <i className="fas fa-file-alt text-blue-500"></i>
                    Créer un Ticket Complet
                </button>
            )}
        </div>
    );
};

export default ActionCardComponent;
