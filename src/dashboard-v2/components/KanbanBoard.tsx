import React, { useState } from 'react';
import type { Ticket } from '../types';
import { TicketCard } from './TicketCard';

interface Column {
  key: string;
  label: string;
  color: string;
  icon: string;
}

interface KanbanBoardProps {
  tickets: Ticket[];
  columns: Column[];
  onTicketClick?: (ticket: Ticket) => void;
  onTicketMove?: (ticket: Ticket, newStatus: string) => void;
  currentUserRole?: string;
}

// Default columns if not provided
const defaultColumns: Column[] = [
  { key: 'pending', label: 'En attente', color: '#f59e0b', icon: 'fa-clock' },
  { key: 'diagnostic', label: 'Diagnostic', color: '#8b5cf6', icon: 'fa-search' },
  { key: 'in_progress', label: 'En cours', color: '#3b82f6', icon: 'fa-spinner' },
  { key: 'waiting_parts', label: 'Attente pièces', color: '#ec4899', icon: 'fa-box' },
  { key: 'on_hold', label: 'En pause', color: '#6b7280', icon: 'fa-pause' },
  { key: 'completed', label: 'Terminé', color: '#10b981', icon: 'fa-check' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  columns = defaultColumns,
  onTicketClick,
  onTicketMove,
  currentUserRole = 'admin'
}) => {
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Get tickets for a specific column
  const getTicketsByStatus = (status: string): Ticket[] => {
    return tickets.filter(t => t.status === status);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    if (currentUserRole === 'operator') {
      e.preventDefault();
      return;
    }
    setDraggedTicket(ticket);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(ticket.id));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedTicket(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTicket) return;
    if (draggedTicket.status !== targetStatus) {
      onTicketMove?.(draggedTicket, targetStatus);
    }
    setDraggedTicket(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scroll">
      {columns.map((column) => {
        const columnTickets = getTicketsByStatus(column.key);
        const isEmpty = columnTickets.length === 0;
        const isDragOver = dragOverColumn === column.key;

        return (
          <div
            key={column.key}
            className={`kanban-column ${isEmpty ? 'empty' : 'has-tickets'} ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <i className={`fas ${column.icon} text-sm`} style={{ color: column.color }}></i>
                <h3 className="font-semibold text-gray-700 text-sm">
                  {column.label}
                </h3>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: column.color }}
              >
                {columnTickets.length}
              </span>
            </div>

            {/* Tickets */}
            <div className="space-y-2">
              {columnTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <i className="fas fa-inbox text-2xl mb-2 block opacity-50"></i>
                  Aucun ticket
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={onTicketClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTicket?.id === ticket.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
