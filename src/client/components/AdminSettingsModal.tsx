import React, { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { client } from '../api';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Fetch current setting on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/app_base_url');
      if (res.ok) {
        const data = await res.json();
        setBaseUrl(data.value || '');
      } else if (res.status === 404) {
        // Not set yet, try to be helpful but don't set automatically to avoid confusion
        setBaseUrl(''); 
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDetect = () => {
    const currentOrigin = window.location.origin;
    setBaseUrl(currentOrigin);
    setNotification({ type: 'success', message: `Domaine détecté : ${currentOrigin}` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    // Basic validation
    let cleanUrl = baseUrl.trim();
    if (!cleanUrl) return;
    
    // Remove trailing slash
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

    // Ensure protocol
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
    }

    setIsSaving(true);
    setNotification(null);

    try {
      const res = await fetch('/api/settings/app_base_url', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ value: cleanUrl })
      });

      if (res.ok) {
        setBaseUrl(cleanUrl);
        setNotification({ type: 'success', message: 'Configuration enregistrée avec succès !' });
        setTimeout(() => {
            setNotification(null);
            onClose();
        }, 1500);
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Impossible de sauvegarder la configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Configuration du Domaine</h3>
              <p className="text-xs text-slate-400">Paramètres système globaux</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Configuration Critique</p>
              <p>Cette URL est utilisée par l'IA et les notifications pour générer des liens. Assurez-vous qu'elle correspond exactement à l'adresse visible dans votre navigateur.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700">
              URL de l'application (Base URL)
            </label>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://votre-domaine.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                  disabled={isLoading || isSaving}
                />
                <Globe className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              
              <button
                onClick={handleAutoDetect}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-semibold whitespace-nowrap"
                title="Détecter automatiquement"
              >
                <RefreshCw className="w-4 h-4" />
                Auto
              </button>
            </div>
            
            <p className="text-xs text-gray-500 ml-1">
              Actuel: <span className="font-mono text-slate-600">{window.location.origin}</span>
            </p>
          </div>

          {/* Notification Area */}
          {notification && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2 ${
              notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {notification.message}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !baseUrl.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminSettingsModal;