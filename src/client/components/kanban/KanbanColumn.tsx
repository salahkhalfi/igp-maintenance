import React from 'react';
import { Ticket, User } from '../../types';
import TicketCard from './TicketCard';
import { 
    Inbox, Search, Wrench, Clock, CheckCircle, Archive, AlertTriangle 
} from 'lucide-react';

interface KanbanColumnProps {
    statusKey: string;
    label: string;
    icon: string;
    color: string;
    tickets: Ticket[];
    currentUser: User;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent, status: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: string) => void;
    onTicketClick: (id: number) => void;
    onDragStart: (e: React.DragEvent, ticket: Ticket) => void;
    onContextMenu: (e: React.MouseEvent, ticket: Ticket) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    statusKey, label, icon, color, tickets, currentUser,
    isDragOver, onDragOver, onDragLeave, onDrop,
    onTicketClick, onDragStart, onContextMenu
}) => {
    // Icon mapping (Lucide)
    const getIcon = (iconName: string) => {
        switch(iconName) {
            case 'inbox': return <Inbox className={`w-4 h-4 text-${color}-500`} />;
            case 'search': return <Search className={`w-4 h-4 text-${color}-500`} />;
            case 'wrench': return <Wrench className={`w-4 h-4 text-${color}-500`} />;
            case 'clock': return <Clock className={`w-4 h-4 text-${color}-500`} />;
            case 'check-circle': return <CheckCircle className={`w-4 h-4 text-${color}-500`} />;
            case 'archive': return <Archive className={`w-4 h-4 text-${color}-500`} />;
            default: return <AlertTriangle className={`w-4 h-4 text-${color}-500`} />;
        }
    };

    // Color mapping for Tailwind classes (safelist workaround)
    const getBgColor = () => {
        if (statusKey === 'received') return 'bg-blue-100 text-blue-800';
        if (statusKey === 'diagnostic') return 'bg-yellow-100 text-yellow-800';
        if (statusKey === 'in_progress') return 'bg-orange-100 text-orange-800';
        if (statusKey === 'waiting_parts') return 'bg-purple-100 text-purple-800';
        if (statusKey === 'completed') return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div 
            className={`
                kanban-column flex-1 min-w-[280px] max-w-xs flex flex-col
                bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/80 shadow-sm
                transition-transform duration-200
                ${isDragOver ? 'ring-2 ring-blue-400 scale-[1.02] bg-blue-50' : ''}
                ${tickets.length === 0 ? 'opacity-80' : ''}
            `}
            onDragOver={(e) => onDragOver(e, statusKey)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, statusKey)}
            data-status={statusKey}
        >
            {/* COLUMN HEADER */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    {getIcon(icon)}
                    <h3 className="font-bold text-slate-700 text-sm">{label}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getBgColor()}`}>
                    {tickets.length}
                </span>
            </div>

            {/* TICKETS LIST */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px] scrollbar-thin scrollbar-thumb-slate-200">
                {tickets.map(ticket => (
                    <TicketCard 
                        key={ticket.id}
                        ticket={ticket}
                        currentUser={currentUser}
                        onClick={onTicketClick}
                        onDragStart={onDragStart}
                        onContextMenu={onContextMenu}
                    />
                ))}
                {tickets.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-300 text-xs italic py-10 border-2 border-dashed border-slate-100 rounded-lg">
                        Aucun ticket
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
