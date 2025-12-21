import React from 'react';
import type { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  onDragStart?: (e: React.DragEvent, ticket: Ticket) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

// Labels français
const priorityLabels: Record<string, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse'
};

// Utility: format relative time
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}m`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-CA');
};

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false
}) => {
  const priorityClass = `priority-${ticket.priority}`;
  
  return (
    <div
      className={`ticket-card ${priorityClass} ${isDragging ? 'dragging' : ''} animate-fade-in`}
      draggable
      onDragStart={(e) => onDragStart?.(e, ticket)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(ticket)}
    >
      {/* Header: ID + Priority Badge */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500">
          #{ticket.ticket_id || ticket.id}
        </span>
        <span className={`badge badge-${ticket.priority}`}>
          {priorityLabels[ticket.priority] || ticket.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">
        {ticket.title}
      </h4>

      {/* Machine info */}
      {ticket.machine_name && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <i className="fas fa-cog text-gray-400"></i>
          <span className="truncate">{ticket.machine_name}</span>
        </div>
      )}

      {/* Footer: Time + Assignee */}
      <div className="flex justify-between items-center text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <i className="far fa-clock"></i>
          {formatRelativeTime(ticket.created_at)}
        </span>
        {ticket.assigned_to_name && (
          <span className="flex items-center gap-1 truncate max-w-[100px]">
            <i className="fas fa-user-cog text-blue-400"></i>
            <span className="truncate">{ticket.assigned_to_name}</span>
          </span>
        )}
      </div>

      {/* Indicators: attachments, comments */}
      {(ticket.media_count && ticket.media_count > 0) && (
        <div className="flex gap-2 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <i className="fas fa-paperclip"></i>
            {ticket.media_count}
          </span>
        </div>
      )}
    </div>
  );
};

export default TicketCard;
