/**
 * OfflineBanner - Premium Offline Status Indicator
 * 
 * Elegant, non-intrusive banner that appears when the user loses internet connection.
 * Features smooth animations, glassmorphism design, and auto-hide on reconnection.
 * 
 * @version 1.0.0
 */

const OfflineBanner = () => {
    const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
    const [isVisible, setIsVisible] = React.useState(!navigator.onLine);
    const [showReconnecting, setShowReconnecting] = React.useState(false);

    React.useEffect(() => {
        const handleOnline = () => {
            setShowReconnecting(true);
            // Show "Reconnecting..." briefly before hiding
            setTimeout(() => {
                setIsOffline(false);
                setShowReconnecting(false);
                // Smooth exit animation
                setTimeout(() => setIsVisible(false), 300);
            }, 1500);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setIsVisible(true);
            setShowReconnecting(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isVisible) return null;

    return React.createElement('div', {
        className: `
            fixed top-0 left-0 right-0 z-[9999]
            transform transition-all duration-500 ease-out
            ${isOffline && !showReconnecting ? 'translate-y-0 opacity-100' : ''}
            ${showReconnecting ? 'translate-y-0 opacity-100' : ''}
            ${!isOffline && !showReconnecting ? '-translate-y-full opacity-0' : ''}
        `.trim(),
        style: {
            background: showReconnecting 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: showReconnecting 
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
        }
    },
        React.createElement('div', {
            className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        },
            React.createElement('div', {
                className: 'flex items-center justify-center py-3 sm:py-4 gap-3 sm:gap-4'
            },
                // Icon Container with Pulse Animation
                React.createElement('div', {
                    className: `
                        relative flex items-center justify-center
                        w-10 h-10 sm:w-12 sm:h-12 rounded-full
                        ${showReconnecting 
                            ? 'bg-white/20' 
                            : 'bg-gradient-to-br from-amber-400/20 to-orange-500/20'
                        }
                    `.trim()
                },
                    // Pulse ring animation
                    React.createElement('div', {
                        className: `
                            absolute inset-0 rounded-full
                            ${showReconnecting ? 'bg-white/10' : 'bg-amber-400/20'}
                            animate-ping
                        `.trim(),
                        style: { animationDuration: '2s' }
                    }),
                    // Icon
                    React.createElement('i', {
                        className: `
                            fas ${showReconnecting ? 'fa-sync fa-spin' : 'fa-wifi-slash'}
                            text-lg sm:text-xl
                            ${showReconnecting ? 'text-white' : 'text-amber-400'}
                        `.trim()
                    })
                ),

                // Text Content
                React.createElement('div', {
                    className: 'flex flex-col sm:flex-row sm:items-center sm:gap-3'
                },
                    React.createElement('span', {
                        className: `
                            font-semibold text-sm sm:text-base tracking-wide
                            ${showReconnecting ? 'text-white' : 'text-white'}
                        `.trim()
                    }, showReconnecting ? 'Reconnexion en cours...' : 'Vous etes hors ligne'),
                    
                    !showReconnecting && React.createElement('span', {
                        className: 'text-slate-400 text-xs sm:text-sm hidden sm:inline'
                    }, 'Verifiez votre connexion internet pour continuer')
                ),

                // Status Indicator Dots (only when offline)
                !showReconnecting && React.createElement('div', {
                    className: 'hidden md:flex items-center gap-1.5 ml-4'
                },
                    React.createElement('span', {
                        className: 'w-2 h-2 rounded-full bg-amber-400 animate-pulse'
                    }),
                    React.createElement('span', {
                        className: 'w-2 h-2 rounded-full bg-amber-400/60 animate-pulse',
                        style: { animationDelay: '0.2s' }
                    }),
                    React.createElement('span', {
                        className: 'w-2 h-2 rounded-full bg-amber-400/30 animate-pulse',
                        style: { animationDelay: '0.4s' }
                    })
                )
            )
        ),

        // Subtle Progress Bar Animation at Bottom
        !showReconnecting && React.createElement('div', {
            className: 'h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent',
            style: {
                animation: 'shimmer 2s infinite linear',
                backgroundSize: '200% 100%'
            }
        })
    );
};

// Add shimmer animation to document if not exists
if (typeof document !== 'undefined' && !document.getElementById('offline-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'offline-banner-styles';
    style.textContent = `
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .fa-wifi-slash::before {
            content: "\\f6ac";
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other components
if (typeof window !== 'undefined') {
    window.OfflineBanner = OfflineBanner;
}
