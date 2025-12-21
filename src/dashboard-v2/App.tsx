/**
 * Dashboard V2 - Root Component
 * 
 * Composant racine du nouveau dashboard moderne.
 * Phase 2A : Structure de base + composants simples.
 */

import React, { useState, useEffect } from 'react'
import type { User, AppConfig } from './types'

// =====================
// API Helper
// =====================

const getAuthToken = (): string | null => {
  return localStorage.getItem('token')
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Vérifier auth
        const token = getAuthToken()
        if (!token) {
          window.location.href = '/'
          return
        }

        // Charger user et config en parallèle
        const [userRes, configRes] = await Promise.all([
          api<{ user: User }>('/api/users/me'),
          api<{ settings: Record<string, string> }>('/api/settings/public')
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
              Bonjour, <strong>{user?.display_name || user?.username}</strong>
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🚀 Dashboard V2 - Phase 2A
          </h2>
          <p className="text-gray-600 mb-4">
            Bienvenue dans le nouveau dashboard moderne. Cette version est en développement 
            et fonctionne en parallèle du dashboard legacy.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Status Card - Phase actuelle */}
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="text-emerald-600 text-2xl mb-2">✅</div>
              <h3 className="font-semibold text-gray-800">Phase Actuelle</h3>
              <p className="text-sm text-gray-600">Structure de base créée</p>
            </div>

            {/* Status Card - Prochaine étape */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-blue-600 text-2xl mb-2">🔄</div>
              <h3 className="font-semibold text-gray-800">Prochaine Étape</h3>
              <p className="text-sm text-gray-600">Migration Toast, ConfirmModal</p>
            </div>

            {/* Status Card - Legacy */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="text-amber-600 text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-800">Legacy Intact</h3>
              <p className="text-sm text-gray-600">Fonctions critiques préservées</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Informations Session
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Utilisateur</p>
              <p className="font-medium text-gray-800">{user?.username}</p>
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
      </main>

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
