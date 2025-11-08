/**
 * 🪟 Modal Component - Modal Réutilisable
 * 
 * Remplace plusieurs occurrences de modals dupliqués dans index.tsx
 * 
 * @example
 * <Modal 
 *   isOpen={showModal} 
 *   onClose={() => setShowModal(false)} 
 *   title="Détails du Ticket"
 *   size="large"
 * >
 *   {/* Contenu */}
 * </Modal>
 */

import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  className = ''
}: ModalProps) {
  
  // Ne rien afficher si le modal est fermé
  if (!isOpen) return null;
  
  // Tailles du modal
  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-7xl'
  };
  
  // Empêcher le scroll du body quand modal ouvert
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Fermer avec la touche Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Handler pour le clic sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      {/* Modal Container */}
      <div 
        className={`
          bg-white rounded-lg shadow-2xl 
          ${sizes[size]} w-full 
          max-h-[90vh] overflow-hidden
          animate-fadeIn
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            {title && (
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all"
                title="Fermer (Esc)"
              >
                <i className="fas fa-times text-xl" />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation Modal
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'warning',
  loading = false
}: ConfirmModalProps) {
  
  const variants = {
    danger: {
      icon: 'exclamation-triangle',
      color: 'red',
      bg: 'bg-red-50'
    },
    warning: {
      icon: 'exclamation-circle',
      color: 'amber',
      bg: 'bg-amber-50'
    },
    info: {
      icon: 'info-circle',
      color: 'blue',
      bg: 'bg-blue-50'
    }
  };
  
  const config = variants[variant];
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="small"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto w-16 h-16 rounded-full ${config.bg} flex items-center justify-center mb-4`}>
          <i className={`fas fa-${config.icon} text-3xl text-${config.color}-600`} />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-6 py-2 rounded-lg font-semibold transition-all
              ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 
                variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 
                'bg-blue-600 hover:bg-blue-700'}
              text-white
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />
                Traitement...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Success Modal
 */
export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK'
}: SuccessModalProps) {
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="small"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <i className="fas fa-check-circle text-3xl text-green-600" />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {/* OK Button */}
        <button
          onClick={onClose}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Error Modal
 */
export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: string;
  buttonText?: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  buttonText = 'Fermer'
}: ErrorModalProps) {
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="small"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <i className="fas fa-exclamation-circle text-3xl text-red-600" />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 mb-4">
          {message}
        </p>
        
        {/* Details (if provided) */}
        {details && (
          <div className="mb-6 p-3 bg-gray-100 rounded-lg text-left">
            <p className="text-sm font-mono text-gray-700">
              {details}
            </p>
          </div>
        )}
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
