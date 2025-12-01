import React, { useEffect, useState } from 'react';
import { client, getAuthToken } from '../api';

interface UserStatus {
  id: number;
  email: string;
  role: string;
  full_name: string;
}

const RPCStatus: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error' | 'unauthorized'>('loading');
  const [user, setUser] = useState<UserStatus | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setStatus('unauthorized');
          return;
        }

        // RPC Call: GET /api/auth/me
        const res = await client.api.auth.me.$get();
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setStatus('connected');
        } else {
          if (res.status === 401) {
            setStatus('unauthorized');
          } else {
            setStatus('error');
            setError(`Erreur ${res.status}`);
          }
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      }
    };

    checkConnection();
    
    // Poll every 30s to check connection alive
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-500 animate-pulse">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        Connexion RPC...
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-bold text-orange-700">
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        Mode Invité (Non connecté)
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-bold text-red-700" title={error}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        RPC Erreur
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      RPC Connecté: {user?.email} ({user?.role})
    </div>
  );
};

export default RPCStatus;
