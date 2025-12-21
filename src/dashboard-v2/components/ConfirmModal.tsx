/**
 * ConfirmModal Component - Dashboard V2
 * 
 * Modal de confirmation pour actions destructives.
 * Migré depuis legacy ConfirmModal.js
 */

import React from 'react'

export interface ConfirmModalProps {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

const variantStyles = {
  danger: {
    icon: '⚠️',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: '⚡',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700',
  },
  info: {
    icon: 'ℹ️',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700',
  },
}

export default function ConfirmModal({
  show,
  title = 'Confirmation',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!show) return null

  const style = variantStyles[variant]

  // Fermer avec Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 transform animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-2xl">{style.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 ${style.confirmBtn} text-white rounded-lg font-semibold transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook pour gérer les confirmations facilement
export function useConfirm() {
  const [state, setState] = React.useState<{
    show: boolean
    message: string
    title?: string
    variant?: 'danger' | 'warning' | 'info'
    resolve?: (value: boolean) => void
  }>({
    show: false,
    message: '',
  })

  const confirm = (
    message: string,
    options?: { title?: string; variant?: 'danger' | 'warning' | 'info' }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        show: true,
        message,
        title: options?.title,
        variant: options?.variant || 'danger',
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    state.resolve?.(true)
    setState({ show: false, message: '' })
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState({ show: false, message: '' })
  }

  return {
    confirm,
    ConfirmModalComponent: state.show ? (
      <ConfirmModal
        show={state.show}
        message={state.message}
        title={state.title}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ) : null,
  }
}
