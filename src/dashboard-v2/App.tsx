/**
 * Dashboard V2 - Root Component
 * 
 * Design glassmorphism identique au legacy avec React 18 + TypeScript
 */

import React, { useState, useEffect } from 'react'
import type { User, AppConfig, Ticket, Machine } from './types'
import Toast, { useToast } from './components/Toast'
import ConfirmModal, { useConfirm } from './components/ConfirmModal'
import { KanbanBoard } from './components/KanbanBoard'

// Note: Les styles glassmorphism sont inclus dans le HTML template
// pour éviter les problèmes de build/bundle

// =====================
// Kanban Columns Config
// =====================

interface Column {
  key: string;
  label: string;
  color: string;
  icon: string;
}

const defaultColumns: Column[] = [
  { key: 'pending', label: 'En attente', color: '#f59e0b', icon: 'fa-clock' },
  { key: 'diagnostic', label: 'Diagnostic', color: '#8b5cf6', icon: 'fa-search' },
  { key: 'in_progress', label: 'En cours', color: '#3b82f6', icon: 'fa-spinner' },
  { key: 'waiting_parts', label: 'Attente pièces', color: '#ec4899', icon: 'fa-box' },
  { key: 'on_hold', label: 'En pause', color: '#6b7280', icon: 'fa-pause' },
  { key: 'completed', label: 'Terminé', color: '#10b981', icon: 'fa-check' }
];

// =====================
// API Helper
// =====================

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

const api = async <T,>(endpoint: string, options?: RequestInit): Promise<T> => {
  const token = getAuthToken()
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}

// =====================
// Main App Component
// =====================

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI Hooks
  const { toast, showToast, hideToast, success, error: showError } = useToast()
  const { confirm, ConfirmModalComponent } = useConfirm()

  // Load data on mount
  useEffect(() => {
    const init = async () => {
      console.log('[Dashboard V2] Init started')
      try {
        const token = getAuthToken()
        console.log('[Dashboard V2] Token:', token ? 'present' : 'missing')
        if (!token) {
          console.log('[Dashboard V2] No token, redirecting to /')
          window.location.href = '/'
          return
        }

        // Load all data in parallel
        const [userRes, configRes, ticketsRes, machinesRes] = await Promise.all([
          api<{ user: User }>('/api/auth/me'),
          api<{ settings: Record<string, string> }>('/api/settings/config/public'),
          api<{ tickets: Ticket[] }>('/api/tickets'),
          api<{ machines: Machine[] }>('/api/machines')
        ])

        setUser(userRes.user)
        setConfig({
          app_name: configRes.settings?.app_name || 'MaintenanceOS',
          app_base_url: configRes.settings?.app_base_url || '',
          primary_color: configRes.settings?.primary_color || '#10b981',
          secondary_color: configRes.settings?.secondary_color || '#1f2937',
          ai_expert_name: configRes.settings?.ai_expert_name || 'Max',
          ai_expert_avatar_key: configRes.settings?.ai_expert_avatar_key || 'default',
        })
        setTickets(ticketsRes.tickets || [])
        setMachines(machinesRes.machines || [])

        // TODO: Load custom columns from API
        // setColumns(columnsRes.columns || defaultColumns)

      } catch (err) {
        console.error('[Dashboard V2] Init error:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  // Handle ticket click (will open modal in future)
  const handleTicketClick = (ticket: Ticket) => {
    // For now, redirect to legacy with ticket open
    // In future: open TicketDetailsModal
    window.location.href = `/?ticket=${ticket.id}`
  }

  // Handle ticket move (drag & drop)
  const handleTicketMove = async (ticket: Ticket, newStatus: string) => {
    try {
      // Optimistic update
      setTickets(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, status: newStatus as Ticket['status'] } : t)
      )

      // API call
      await api(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })

      success(`Ticket déplacé vers "${columns.find(c => c.key === newStatus)?.label}"`)
    } catch (err) {
      // Revert on error
      setTickets(prev => 
        prev.map(t => t.id === ticket.id ? ticket : t)
      )
      showError('Erreur lors du déplacement du ticket')
    }
  }

  // Calculate stats
  const stats = {
    tickets: {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      completed: tickets.filter(t => t.status === 'completed').length,
      critical: tickets.filter(t => t.priority === 'critical').length,
    },
    machines: {
      total: machines.length,
      operational: machines.filter(m => m.status === 'operational').length,
      maintenance: machines.filter(m => m.status === 'maintenance').length,
      broken: machines.filter(m => m.status === 'broken').length,
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)' }}>
        <div className="text-center glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Chargement Dashboard V2...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)' }}>
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 backdrop-blur"
            >
              Réessayer
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Retour Legacy
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard with glassmorphism
  return (
    <div className="min-h-screen">
      {/* Background Layer - Workshop image */}
      <div id="app-background"></div>

      {/* Header - Glass effect */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <img 
              src="/static/logo-igp.png" 
              alt="Logo" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div>
              <h1 className="text-lg font-bold text-white">
                {config?.app_name || 'MaintenanceOS'}
              </h1>
              <span className="text-xs text-emerald-400 font-medium">Dashboard V2</span>
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Stats rapides */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-amber-400">
                <i className="fas fa-clock mr-1"></i>
                {stats.tickets.pending} en attente
              </span>
              <span className="text-blue-400">
                <i className="fas fa-spinner mr-1"></i>
                {stats.tickets.in_progress} en cours
              </span>
              {stats.tickets.critical > 0 && (
                <span className="text-red-400 animate-pulse">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  {stats.tickets.critical} critiques
                </span>
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <i className="fas fa-user-circle text-white/70"></i>
              <span className="text-sm text-white">
                {user?.first_name || user?.full_name}
              </span>
            </div>

            {/* Legacy link */}
            <a
              href="/"
              className="text-sm text-white/60 hover:text-white flex items-center gap-1 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Legacy
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Quick Stats Bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="glass-card flex items-center gap-3 px-4 py-2">
            <span className="text-2xl">🎫</span>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-800">{stats.tickets.total}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 px-4 py-2">
            <span className="text-2xl">🏭</span>
            <div>
              <p className="text-xs text-gray-500">Machines</p>
              <p className="text-xl font-bold text-gray-800">{stats.machines.total}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 px-4 py-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-xs text-gray-500">Opérationnelles</p>
              <p className="text-xl font-bold text-emerald-600">{stats.machines.operational}</p>
            </div>
          </div>
          {stats.machines.broken > 0 && (
            <div className="glass-card flex items-center gap-3 px-4 py-2 border-l-4 border-red-500">
              <span className="text-2xl">🔴</span>
              <div>
                <p className="text-xs text-gray-500">En panne</p>
                <p className="text-xl font-bold text-red-600">{stats.machines.broken}</p>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          tickets={tickets}
          columns={columns}
          onTicketClick={handleTicketClick}
          onTicketMove={handleTicketMove}
          currentUserRole={user?.role}
        />
      </main>

      {/* Toast Component */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* Confirm Modal */}
      {ConfirmModalComponent}

      {/* Footer - Subtle */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm text-white/60 py-1 px-4 text-xs">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <span>Dashboard V2 • React 18 + TypeScript + Glassmorphism</span>
          <span>Legacy: / • Messenger: /messenger</span>
        </div>
      </footer>
    </div>
  )
}
