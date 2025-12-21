/**
 * Dashboard V2 - Root Component
 * 
 * Composant racine du nouveau dashboard moderne.
 * Phase 2A : Structure de base + composants simples.
 */

import React, { useState, useEffect } from 'react'
import type { User, AppConfig, Ticket, Machine } from './types'
import Toast, { useToast } from './components/Toast'
import ConfirmModal, { useConfirm } from './components/ConfirmModal'

// =====================
// Dashboard Stats Type
// =====================

interface DashboardStats {
  tickets: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    critical: number;
  };
  machines: {
    total: number;
    operational: number;
    maintenance: number;
    broken: number;
  };
}

// =====================
// API Helper
// =====================

const getAuthToken = (): string | null => {
  // Le legacy utilise 'auth_token', pas 'token'
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
  
  // Hooks pour composants UI
  const { toast, showToast, hideToast, success, error: showError } = useToast()
  const { confirm, ConfirmModalComponent } = useConfirm()
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      console.log('[Dashboard V2] Init started')
      try {
        // Vérifier auth
        const token = getAuthToken()
        console.log('[Dashboard V2] Token:', token ? 'present' : 'missing')
        if (!token) {
          console.log('[Dashboard V2] No token, redirecting to /')
          window.location.href = '/'
          return
        }

        // Charger toutes les données en parallèle
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

        // Calculer stats tickets
        const tickets = ticketsRes.tickets || []
        const machines = machinesRes.machines || []
        
        setStats({
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
        })

        // Derniers tickets (5 plus récents non complétés)
        setRecentTickets(
          tickets
            .filter(t => t.status !== 'completed')
            .slice(0, 5)
        )

      } catch (err) {
        console.error('[Dashboard V2] Init error:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement Dashboard V2...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Réessayer
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Retour Dashboard Legacy
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {config?.app_name || 'MaintenanceOS'}
              </h1>
              <span className="text-xs text-emerald-600 font-medium">Dashboard V2 (Preview)</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Bonjour, <strong>{user?.first_name || user?.full_name || user?.email}</strong>
            </span>
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Legacy
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 pb-20">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Tickets Total</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.tickets.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
          </div>

          {/* En attente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">En attente</p>
                <p className="text-3xl font-bold text-amber-600">{stats?.tickets.pending || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          {/* En cours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">En cours</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.tickets.in_progress || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
            </div>
          </div>

          {/* Critiques */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Critiques</p>
                <p className="text-3xl font-bold text-red-600">{stats?.tickets.critical || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Machines Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🏭 État des Machines
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{stats?.machines.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">{stats?.machines.operational || 0}</p>
              <p className="text-xs text-gray-500">Opérationnelles</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{stats?.machines.maintenance || 0}</p>
              <p className="text-xs text-gray-500">En maintenance</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats?.machines.broken || 0}</p>
              <p className="text-xs text-gray-500">En panne</p>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📋 Tickets Récents (non complétés)
            </h3>
            <a href="/" className="text-sm text-emerald-600 hover:text-emerald-700">
              Voir tout →
            </a>
          </div>
          
          {recentTickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun ticket en cours</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      ticket.priority === 'critical' ? 'bg-red-500' :
                      ticket.priority === 'high' ? 'bg-orange-500' :
                      ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{ticket.title}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.ticket_id} • {ticket.machine_name || 'Sans machine'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    ticket.status === 'on_hold' ? 'bg-gray-100 text-gray-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {ticket.status === 'pending' ? 'En attente' :
                     ticket.status === 'in_progress' ? 'En cours' :
                     ticket.status === 'on_hold' ? 'En pause' : 'Complété'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            👤 Informations Session
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Utilisateur</p>
              <p className="font-medium text-gray-800">{user?.first_name} {user?.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Rôle</p>
              <p className="font-medium text-gray-800">{user?.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Équipe</p>
              <p className="font-medium text-gray-800">{user?.team_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">ID</p>
              <p className="font-medium text-gray-800">#{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Test Components Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🧪 Test Composants Migrés
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => success('Action réussie !')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Toast Success
            </button>
            <button
              onClick={() => showError('Une erreur est survenue')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Toast Error
            </button>
            <button
              onClick={() => showToast('Information importante', 'info')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Toast Info
            </button>
            <button
              onClick={async () => {
                const confirmed = await confirm('Voulez-vous vraiment effectuer cette action ?', {
                  title: 'Confirmation requise',
                  variant: 'danger'
                })
                if (confirmed) {
                  success('Action confirmée !')
                } else {
                  showToast('Action annulée', 'info')
                }
              }}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
            >
              Test Confirm Modal
            </button>
          </div>
        </div>
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

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <span>Dashboard V2 Preview • React 18 + TypeScript</span>
          <span className="text-gray-400">Legacy disponible à /</span>
        </div>
      </footer>
    </div>
  )
}
