import React, { useEffect } from 'react';
import { NotificationModalProps } from '../types';

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  type = 'info',
  title,
  message
}) => {
  useEffect(() => {
    if (isOpen) {
      // Focus management could go here
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4 text-2xl"><i className="fas fa-check"></i></div>;
      case 'error':
        return <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 text-2xl"><i className="fas fa-times"></i></div>;
      case 'warning':
        return <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4 text-2xl"><i className="fas fa-exclamation"></i></div>;
      default:
        return <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 text-2xl"><i className="fas fa-info"></i></div>;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success': return 'Succès';
      case 'error': return 'Erreur';
      case 'warning': return 'Attention';
      default: return 'Information';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 p-6 flex flex-col items-center text-center">
        {getIcon()}
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {getTitle()}
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
