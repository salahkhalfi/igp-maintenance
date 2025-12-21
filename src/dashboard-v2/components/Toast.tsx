/**
 * Toast Component - Dashboard V2
 * 
 * Notification toast moderne avec auto-dismiss.
 * Migré depuis legacy Toast.js
 */

import React, { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  show: boolean
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

const toastStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-emerald-500', icon: '✓' },
  error: { bg: 'bg-red-500', icon: '✕' },
  warning: { bg: 'bg-amber-500', icon: '⚠' },
  info: { bg: 'bg-blue-500', icon: 'ℹ' },
}

export default function Toast({ 
  show, 
  message, 
  type, 
  onClose, 
  duration = 3000 
}: ToastProps) {
  
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  const style = toastStyles[type]

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={`${style.bg} text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-sm`}>
        <span className="text-lg font-bold">{style.icon}</span>
        <p className="font-medium flex-1 text-sm">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-xl leading-none ml-2"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Hook pour gérer les toasts facilement
export function useToast() {
  const [toast, setToast] = React.useState<{
    show: boolean
    message: string
    type: ToastType
  }>({
    show: false,
    message: '',
    type: 'info',
  })

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  return {
    toast,
    showToast,
    hideToast,
    // Raccourcis
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    warning: (msg: string) => showToast(msg, 'warning'),
    info: (msg: string) => showToast(msg, 'info'),
  }
}
