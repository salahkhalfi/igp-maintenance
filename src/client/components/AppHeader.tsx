import React, { useState, useEffect, useRef } from 'react';
import { 
    Menu, X, Search, Bell, BellOff, RefreshCw, LogOut, 
    PlusCircle, Users, Settings, Monitor, Shield, 
    Calendar, Activity, Clock, Layers, Rocket, Bot,
    ChevronDown, Archive, EyeOff
} from 'lucide-react';
import { User } from '../types';
import { client, getAuthToken } from '../api';

interface AppHeaderProps {
    currentUser: User;
    activeTicketsCount: number;
    headerTitle?: string;
    headerSubtitle?: string;
    messengerName?: string;
    logoUrl?: string;
    activeModules?: {
        planning: boolean;
        statistics: boolean;
        notifications: boolean;
        messaging: boolean;
        machines: boolean;
    };
    onRefresh: () => void;
    onLogout: () => void;
    onOpenCreateModal: () => void;
    onOpenUserManagement: () => void;
    onOpenMachineManagement: () => void;
    
    // Legacy callbacks (to be properly typed later)
    onOpenMessaging?: () => void;
    onOpenPerformance?: () => void;
    onOpenOverdue?: () => void;
    onOpenPushDevices?: () => void;
    onOpenManageColumns?: () => void;
    onOpenSystemSettings?: () => void;
    onOpenAdminRoles?: () => void;
    onOpenTv?: () => void;
    onOpenAIChat?: () => void;
    onOpenPlanning?: () => void;
    onOpenDetails?: (id: number) => void;
    
    // State props
    showArchived: boolean;
    setShowArchived: (show: boolean) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    currentUser,
    activeTicketsCount,
    headerTitle = "Gestion de la maintenance",
    headerSubtitle = "Système de Maintenance Universel",
    messengerName = "Connect",
    logoUrl: propLogoUrl,
    activeModules = { planning: true, statistics: true, notifications: true, messaging: true, machines: true },
    onRefresh,
    onLogout,
    onOpenCreateModal,
    onOpenUserManagement,
    onOpenMachineManagement,
    onOpenOverdue,
    onOpenPerformance,
    onOpenManageColumns,
    onOpenPlanning,
    onOpenSystemSettings,
    onOpenAdminRoles,
    onOpenTv,
    onOpenAIChat,
    onOpenPushDevices,
    showArchived,
    setShowArchived
}) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Logo logic: Use prop if available, else fallback to default
    const logoUrl = propLogoUrl || '/logo.png'; 

    // Permissions Helper (Simple version)
    const isAdmin = currentUser.role === 'admin';
    const isTech = currentUser.role === 'technician';
    
    return (
        <header className="sticky top-0 z-50 bg-transparent transition-all duration-300">
            {/* ROW 1: IDENTITY & NAVIGATION */}
            <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
                <div className="max-w-[1600px] mx-auto px-4 py-2">
                    <div className="flex justify-between items-center h-12">
                        
                        {/* LEFT: LOGO & TITLE */}
                        <div className="flex items-center group cursor-pointer flex-1 min-w-0" onClick={() => window.location.reload()}>
                            <img 
                                src={logoUrl} 
                                alt="Logo" 
                                className="h-8 md:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
                                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                            />
                            <div className="flex flex-col justify-center ml-3 pl-3 border-l border-slate-200 flex-1 min-w-0">
                                <h1 className="text-sm font-bold leading-none text-slate-800 tracking-tight truncate">{headerTitle}</h1>
                                <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">{headerSubtitle}</p>
                            </div>
                        </div>

                        {/* RIGHT: ACTIONS */}
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                            
                            {/* User Badge (Desktop) */}
                            <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 cursor-default">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2">
                                    {currentUser.first_name?.[0] || 'U'}
                                </div>
                                <span className="text-xs font-medium text-slate-700">
                                    Bonjour, {currentUser.first_name}
                                </span>
                                {(isAdmin) && (
                                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-600 rounded uppercase tracking-wide">ADM</span>
                                )}
                            </div>

                            {/* Desktop Actions Icons */}
                            <div className="hidden md:flex items-center gap-1">
                                <button onClick={onOpenAIChat} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors" title="Expert IA">
                                    <Bot className="w-5 h-5" />
                                </button>
                                
                                {activeModules.messaging && (
                                    <button onClick={() => window.open('/messenger', '_blank')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors relative" title={messengerName}>
                                        <Rocket className="w-5 h-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white"></span>
                                    </button>
                                )}

                                {(isAdmin || isTech) && (
                                    <button onClick={onOpenUserManagement} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Utilisateurs">
                                        <Users className="w-5 h-5" />
                                    </button>
                                )}

                                {(isAdmin) && (
                                    <button onClick={onOpenAdminRoles} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Rôles">
                                        <Shield className="w-5 h-5" />
                                    </button>
                                )}

                                {activeModules.machines && (
                                    <button onClick={onOpenMachineManagement} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors" title="Machines">
                                        <Settings className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button 
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="w-10 h-10 flex md:hidden items-center justify-center rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm ml-2"
                            >
                                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2: TOOLBAR (Desktop Only) */}
            <div className="hidden md:block bg-white/80 border-b border-slate-200/60 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 py-3">
                    <div className="flex items-center gap-4">
                        
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-2xl">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un ticket, une machine..." 
                                    className="w-full h-10 pl-11 pr-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Quick Filters */}
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 mr-auto">
                            <button onClick={onOpenOverdue} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                                <Clock className="w-3 h-3 text-orange-500" /> Retard
                            </button>
                            <button onClick={onOpenPerformance} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                <Activity className="w-3 h-3 text-blue-500" /> Performance
                            </button>
                            {activeModules.planning && (
                                <button onClick={onOpenPlanning} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                                    <Calendar className="w-3 h-3 text-indigo-500" /> Planning
                                </button>
                            )}
                        </div>

                        {/* Primary Actions */}
                        <div className="flex items-center gap-3">
                            <span className="hidden xl:inline-block text-xs font-extrabold text-blue-800 mr-2 bg-blue-50 px-2 py-1 rounded-md">
                                {activeTicketsCount} actifs
                            </span>

                            <button onClick={onRefresh} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <RefreshCw className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={onOpenCreateModal}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all"
                            >
                                <PlusCircle className="w-5 h-5" />
                                <span>Nouveau Ticket</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE MENU OVERLAY */}
            {showMobileMenu && (
                <div className="fixed inset-0 top-[48px] z-40 bg-white flex flex-col p-4 overflow-y-auto animate-in slide-in-from-top-10">
                    <button onClick={onOpenCreateModal} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mb-6">
                        <PlusCircle className="w-5 h-5" /> Nouveau Ticket
                    </button>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button onClick={onOpenOverdue} className="p-4 bg-orange-50 rounded-xl flex flex-col items-center gap-2 border border-orange-100">
                            <Clock className="w-6 h-6 text-orange-500" />
                            <span className="text-xs font-bold text-orange-700">Retard</span>
                        </button>
                        {activeModules.planning && (
                            <button onClick={onOpenPlanning} className="p-4 bg-indigo-50 rounded-xl flex flex-col items-center gap-2 border border-indigo-100">
                                <Calendar className="w-6 h-6 text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-700">Planning</span>
                            </button>
                        )}
                        {activeModules.messaging && (
                            <button onClick={() => window.open('/messenger', '_blank')} className="p-4 bg-emerald-50 rounded-xl flex flex-col items-center gap-2 border border-emerald-100">
                                <Rocket className="w-6 h-6 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-700">Message</span>
                            </button>
                        )}
                        <button onClick={onOpenAIChat} className="p-4 bg-purple-50 rounded-xl flex flex-col items-center gap-2 border border-purple-100">
                            <Bot className="w-6 h-6 text-purple-500" />
                            <span className="text-xs font-bold text-purple-700">Expert IA</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <button onClick={() => setShowArchived(!showArchived)} className="w-full py-3 px-4 bg-slate-50 rounded-lg flex items-center gap-3 text-slate-700 font-medium">
                            {showArchived ? <EyeOff className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                            {showArchived ? "Masquer les archives" : "Voir les archives"}
                        </button>
                        
                        {(isAdmin || isTech) && (
                            <button onClick={onOpenUserManagement} className="w-full py-3 px-4 bg-slate-50 rounded-lg flex items-center gap-3 text-slate-700 font-medium">
                                <Users className="w-5 h-5" /> Gestion Utilisateurs
                            </button>
                        )}
                        
                        {activeModules.machines && (
                            <button onClick={onOpenMachineManagement} className="w-full py-3 px-4 bg-slate-50 rounded-lg flex items-center gap-3 text-slate-700 font-medium">
                                <Settings className="w-5 h-5" /> Gestion Machines
                            </button>
                        )}

                        {(isAdmin) && (
                            <button onClick={onOpenSystemSettings} className="w-full py-3 px-4 bg-slate-50 rounded-lg flex items-center gap-3 text-slate-700 font-medium">
                                <Monitor className="w-5 h-5" /> Paramètres Système
                            </button>
                        )}
                        
                        {activeModules.planning && (
                            <button onClick={onOpenPlanning} className="w-full py-3 px-4 bg-slate-50 rounded-lg flex items-center gap-3 text-slate-700 font-medium">
                                <Calendar className="w-5 h-5" /> Planning Production
                            </button>
                        )}
                    </div>

                    <div className="mt-auto pt-6">
                        <button onClick={onLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2">
                            <LogOut className="w-5 h-5" /> Déconnexion
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default AppHeader;
