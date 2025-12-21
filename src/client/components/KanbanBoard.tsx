import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketStatus } from '../../types';
import KanbanColumn from './kanban/KanbanColumn';
import { AlertTriangle, Archive, Trash2 } from 'lucide-react';

interface ColumnConfig {
    key: string;
    label: string;
    icon: string;
    color: string;
}

interface KanbanBoardProps {
    tickets: Ticket[];
    currentUser: User;
    showArchived: boolean;
    onTicketClick: (id: number) => void;
    onTicketMove: (id: number, status: string, log: string) => void;
    onTicketDelete: (id: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
    { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
    { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
    { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
    { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    tickets,
    currentUser,
    showArchived,
    onTicketClick,
    onTicketMove,
    onTicketDelete
}) => {
    // --- STATE ---
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, ticket: Ticket } | null>(null);
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

    // Load preferences (Columns)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('kanban_columns');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validation : doit être un tableau non vide
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setColumns(parsed);
                } else {
                    console.warn("Invalid columns in localStorage, using defaults");
                    // Reset localStorage to avoid stuck state
                    localStorage.removeItem('kanban_columns');
                }
            }
        } catch (e) { 
            console.warn("Failed to load columns", e); 
            // Fallback automatique sur DEFAULT_COLUMNS via state initial
        }
    }, []);

    // --- FILTERING ---
    const getTicketsByStatus = (status: string) => {
        let filtered = tickets.filter(t => t.status === status);
        
        // Operator view restriction
        if (currentUser.role === 'operator') {
            filtered = filtered.filter(t => t.reported_by === currentUser.id);
        }
        
        // Sort by priority then date (Simple default sort)
        // Can be improved later with a sort selector
        return filtered.sort((a, b) => {
            const pMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
            const pDiff = pMap[b.priority] - pMap[a.priority];
            if (pDiff !== 0) return pDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    };

    // --- DRAG & DROP HANDLERS ---
    const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
        if (currentUser.role === 'operator') {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticket.id.toString());
        // Add dragging class for visuals if needed
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Simple logic: if leaving column, clear highlight
        // Could be improved with rect checks
    };

    const handleDrop = (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        const ticketId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        
        if (!isNaN(ticketId)) {
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket && ticket.status !== targetStatus) {
                onTicketMove(ticketId, targetStatus, `Déplacé vers ${targetStatus}`);
            }
        }
    };

    // --- CONTEXT MENU ---
    const handleContextMenu = (e: React.MouseEvent, ticket: Ticket) => {
        if (currentUser.role === 'operator') return;
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, ticket });
    };

    const closeContextMenu = () => setContextMenu(null);

    // Global click listener to close menu
    useEffect(() => {
        if (contextMenu) {
            document.addEventListener('click', closeContextMenu);
            return () => document.removeEventListener('click', closeContextMenu);
        }
    }, [contextMenu]);

    // --- RENDER ---
    return (
        <div className="space-y-8">
            {/* WORKFLOW COLUMNS */}
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 items-start min-w-full">
                    {columns.filter(c => c.key !== 'archived').map(col => (
                        <KanbanColumn
                            key={col.key}
                            statusKey={col.key}
                            label={col.label}
                            icon={col.icon}
                            color={col.color}
                            tickets={getTicketsByStatus(col.key)}
                            currentUser={currentUser}
                            isDragOver={dragOverColumn === col.key}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onTicketClick={onTicketClick}
                            onDragStart={handleDragStart}
                            onContextMenu={handleContextMenu}
                        />
                    ))}
                </div>
            </div>

            {/* ARCHIVED SECTION */}
            {showArchived && (
                <div className="border-t-2 border-dashed border-slate-200 pt-6">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Archive className="w-5 h-5 text-slate-400" />
                        <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs">Zone d'Archives</h3>
                    </div>
                    <div className="flex gap-4">
                        <KanbanColumn
                            statusKey="archived"
                            label="Archivé"
                            icon="archive"
                            color="gray"
                            tickets={getTicketsByStatus('archived')}
                            currentUser={currentUser}
                            isDragOver={dragOverColumn === 'archived'}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onTicketClick={onTicketClick}
                            onDragStart={handleDragStart}
                            onContextMenu={handleContextMenu}
                        />
                    </div>
                </div>
            )}

            {/* CONTEXT MENU PORTAL */}
            {contextMenu && (
                <div 
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[200px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-100">
                        Déplacer vers...
                    </div>
                    {columns.map(col => (
                        <button
                            key={col.key}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${contextMenu.ticket.status === col.key ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (contextMenu.ticket.status !== col.key) {
                                    onTicketMove(contextMenu.ticket.id, col.key, `Déplacé via menu`);
                                    closeContextMenu();
                                }
                            }}
                        >
                            <span className={`w-2 h-2 rounded-full bg-${col.color}-500`}></span>
                            {col.label}
                        </button>
                    ))}
                    {(currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                        <>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => {
                                    onTicketDelete(contextMenu.ticket.id);
                                    closeContextMenu();
                                }}
                            >
                                <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
