import React from 'react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
    CalendarCheck, UserCheck, Clock, Camera, User, 
    AlertTriangle, AlertCircle, CheckCircle, Info 
} from 'lucide-react';
import { Ticket, User as UserType } from '../../types';

// --- UTILS ---
const formatDateEST = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        // En prod, les dates sont en UTC. On les affiche en local.
        // Simplification: new Date() gère la locale du navigateur
        return new Intl.DateTimeFormat('fr-CA', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        }).format(new Date(dateStr));
    } catch (e) {
        return dateStr;
    }
};

const parseUTCDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    // Manage "YYYY-MM-DD" or ISO
    return new Date(dateStr);
};

// --- SUB-COMPONENTS (Migrated) ---

const TicketTimer: React.FC<{ createdAt: string; status: string }> = ({ createdAt, status }) => {
    const [elapsed, setElapsed] = React.useState('');
    const [color, setColor] = React.useState('text-gray-400');

    React.useEffect(() => {
        if (status === 'completed' || status === 'archived') {
            setElapsed('Terminé');
            return;
        }

        const update = () => {
            const diff = differenceInMinutes(new Date(), new Date(createdAt));
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            const days = Math.floor(hours / 24);

            let text = '';
            if (days > 0) text = `${days}j ${hours % 24}h`;
            else if (hours > 0) text = `${hours}h ${mins}m`;
            else text = `${mins}m`;

            setElapsed(text);

            if (days >= 7) setColor('text-red-600 font-bold animate-pulse');
            else if (days >= 3) setColor('text-orange-500 font-bold');
            else if (hours >= 24) setColor('text-yellow-600');
            else setColor('text-gray-400');
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [createdAt, status]);

    return (
        <div className={`flex items-center gap-1 text-[10px] ${color}`}>
            <Clock className="w-3 h-3" />
            <span>{elapsed}</span>
        </div>
    );
};

const ScheduledCountdown: React.FC<{ scheduledDate: string }> = ({ scheduledDate }) => {
    const [text, setText] = React.useState('');
    const [style, setStyle] = React.useState('bg-gray-100 text-gray-600');

    React.useEffect(() => {
        const target = new Date(scheduledDate);
        const now = new Date();
        const diffHours = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0) {
            setText(`Retard: ${Math.abs(Math.round(diffHours))}h`);
            setStyle('bg-red-100 text-red-700 border-red-200 font-bold animate-pulse');
        } else if (diffHours < 24) {
            setText(`Dans: ${Math.round(diffHours)}h`);
            setStyle('bg-orange-100 text-orange-700 border-orange-200 font-bold');
        } else {
            setText(`Dans: ${Math.round(diffHours / 24)}j`);
            setStyle('bg-blue-50 text-blue-600 border-blue-100');
        }
    }, [scheduledDate]);

    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style}`}>
            {text}
        </span>
    );
};

// --- MAIN COMPONENT ---

interface TicketCardProps {
    ticket: Ticket;
    currentUser: UserType;
    onClick: (id: number) => void;
    onDragStart: (e: React.DragEvent, ticket: Ticket) => void;
    onContextMenu: (e: React.MouseEvent, ticket: Ticket) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ 
    ticket, currentUser, onClick, onDragStart, onContextMenu 
}) => {
    const hasAssigned = ticket.assigned_to !== null && ticket.assigned_to !== undefined;
    const isScheduled = ticket.scheduled_date && ticket.scheduled_date !== 'null';
    const isCompletedOrArchived = ticket.status === 'completed' || ticket.status === 'archived';
    const isOperator = currentUser.role === 'operator';

    const getPriorityStyle = (p: string) => {
        switch(p) {
            case 'critical': return 'border-l-4 border-l-red-600 shadow-red-100';
            case 'high': return 'border-l-4 border-l-orange-500 shadow-orange-100';
            case 'medium': return 'border-l-4 border-l-yellow-500 shadow-yellow-100';
            default: return 'border-l-4 border-l-green-500 shadow-green-100';
        }
    };

    const getPriorityBadge = (p: string) => {
        switch(p) {
            case 'critical': return <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">🔴 CRIT</span>;
            case 'high': return <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold">🟠 HAUT</span>;
            case 'medium': return <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-bold">🟡 MOY</span>;
            default: return <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">🟢 BAS</span>;
        }
    };

    return (
        <div 
            className={`
                bg-white rounded-lg p-3 mb-2 shadow-sm border border-slate-200 
                hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing
                ${getPriorityStyle(ticket.priority)}
            `}
            draggable={!isOperator}
            onDragStart={(e) => onDragStart(e, ticket)}
            onClick={(e) => { if(!e.defaultPrevented) onClick(ticket.id); }}
            onContextMenu={(e) => onContextMenu(e, ticket)}
        >
            {/* HEADER BANNER (Assigned/Scheduled) */}
            {hasAssigned && !isCompletedOrArchived && (
                <div className={`
                    -mx-3 -mt-3 mb-2 px-3 py-1.5 flex items-center gap-2 text-[10px] 
                    ${isScheduled ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-700 text-white'}
                `}>
                    <div className="flex items-center gap-1 font-bold">
                        {isScheduled ? <CalendarCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span>{isScheduled ? 'PLANIFIÉ' : 'ASSIGNÉ'}</span>
                    </div>
                    <span className="flex-1 truncate text-right font-medium opacity-90">
                        {ticket.assigned_to === 0 ? "👥 Équipe" : `👤 ${ticket.assigned_to_name || 'Technicien'}`}
                    </span>
                </div>
            )}

            {/* ID & TITLE */}
            <div className="mb-1">
                <span className="text-[10px] text-slate-400 font-mono">#{ticket.ticket_id}</span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2 leading-tight">
                {ticket.title}
            </h4>

            {/* TAGS ROW */}
            <div className="flex items-center gap-2 mb-2">
                {getPriorityBadge(ticket.priority)}
                <span className="text-xs text-slate-600 truncate flex-1" title={`${ticket.machine_name}`}>
                    {ticket.machine_name}
                </span>
            </div>

            {/* REPORTER */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-2">
                <User className="w-3 h-3 text-blue-400" />
                <span>Rapporté par {ticket.reporter_name || 'N/A'}</span>
            </div>

            {/* SCHEDULED COUNTDOWN */}
            {isScheduled && !isCompletedOrArchived && ticket.scheduled_date && (
                <div className="mb-2">
                    <ScheduledCountdown scheduledDate={ticket.scheduled_date} />
                </div>
            )}

            {/* FOOTER */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{formatDateEST(ticket.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-3">
                    {(ticket.media_count || 0) > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                            <Camera className="w-3 h-3" />
                            <span>{ticket.media_count}</span>
                        </div>
                    )}
                    <TicketTimer createdAt={ticket.created_at} status={ticket.status} />
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
