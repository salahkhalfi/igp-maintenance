import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="bg-red-500/90 text-white text-xs font-bold text-center py-1 absolute top-0 left-0 right-0 z-[100] backdrop-blur-md animate-slide-in-right">
            <i className="fas fa-wifi-slash mr-2"></i> MODE HORS LIGNE
        </div>
    );
};

export default OfflineBanner;
