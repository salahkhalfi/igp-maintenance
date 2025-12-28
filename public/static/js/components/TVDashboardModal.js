// TVDashboardModal - Modal pour configurer l'affichage TV
// v1.1.0 - Protection contre double-chargement + Lien sécurisé + régénération de clé

// Protection contre double-déclaration
if (typeof window.TVDashboardModal !== 'undefined') {
    console.log('TVDashboardModal already loaded, skipping');
} else {
    console.log('TVDashboardModal loaded v1.1.0');

const TVDashboardModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = React.useState(true);
    const [tvUrl, setTvUrl] = React.useState('');
    const [tvKey, setTvKey] = React.useState('');
    const [regenerating, setRegenerating] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [error, setError] = React.useState(null);

    // Charger la configuration TV
    React.useEffect(() => {
        if (isOpen) {
            loadTvConfig();
        }
    }, [isOpen]);

    const loadTvConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get('/api/tv/admin/config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setTvUrl(response.data.url || '');
                setTvKey(response.data.key || '');
            }
        } catch (err) {
            console.error('Erreur chargement config TV:', err);
            setError('Impossible de charger la configuration TV');
        } finally {
            setLoading(false);
        }
    };

    const regenerateKey = async () => {
        if (!window.confirm('Régénérer la clé ? L\'ancien lien ne fonctionnera plus.')) {
            return;
        }
        
        setRegenerating(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.post('/api/tv/admin/regenerate', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setTvUrl(response.data.url || '');
                setTvKey(response.data.key || '');
                window.showToast && window.showToast('Nouvelle clé générée avec succès', 'success');
            }
        } catch (err) {
            console.error('Erreur régénération clé:', err);
            setError('Impossible de régénérer la clé');
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(tvUrl);
            setCopied(true);
            window.showToast && window.showToast('Lien copié !', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback pour anciens navigateurs
            const textArea = document.createElement('textarea');
            textArea.value = tvUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openTvDisplay = () => {
        window.open(tvUrl, '_blank');
    };

    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-[300] overflow-y-auto',
        style: { background: 'rgba(0, 0, 0, 0.5)' },
        onClick: onClose
    },
        React.createElement('div', {
            className: 'min-h-screen px-4 py-8 flex items-center justify-center'
        },
            React.createElement('div', {
                className: 'w-full max-w-md bg-white rounded-2xl shadow-2xl relative',
                onClick: (e) => e.stopPropagation()
            },
                // Header
                React.createElement('div', { className: 'px-6 py-5 border-b border-gray-100 flex justify-between items-center' },
                    React.createElement('div', { className: 'flex items-center gap-3' },
                        React.createElement('div', { className: 'w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center' },
                            React.createElement('i', { className: 'fas fa-tv text-blue-600 text-lg' })
                        ),
                        React.createElement('h2', { className: 'text-xl font-bold text-gray-900' }, 'Mode Affichage TV')
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition'
                    }, React.createElement('i', { className: 'fas fa-times text-lg' }))
                ),

                // Content
                React.createElement('div', { className: 'p-6 space-y-5' },
                    // Loading state
                    loading ? React.createElement('div', { className: 'flex items-center justify-center py-8' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl text-blue-500' })
                    ) : error ? React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-xl p-4 text-center' },
                        React.createElement('i', { className: 'fas fa-exclamation-circle text-red-500 text-2xl mb-2' }),
                        React.createElement('p', { className: 'text-sm text-red-700' }, error),
                        React.createElement('button', {
                            onClick: loadTvConfig,
                            className: 'mt-3 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700'
                        }, 'Réessayer')
                    ) : React.createElement(React.Fragment, null,
                        // URL Section
                        React.createElement('div', { className: 'bg-gray-50 rounded-xl p-4' },
                            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                                'Lien d\'accès sécurisé pour l\'écran TV :'
                            ),
                            React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: tvUrl,
                                    readOnly: true,
                                    className: 'flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-mono truncate'
                                }),
                                React.createElement('button', {
                                    onClick: copyToClipboard,
                                    className: `px-4 py-3 rounded-xl font-medium transition flex items-center justify-center ${
                                        copied 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`,
                                    title: 'Copier le lien'
                                },
                                    React.createElement('i', { className: `fas ${copied ? 'fa-check' : 'fa-copy'}` })
                                )
                            )
                        ),

                        // Action Buttons
                        React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                            React.createElement('button', {
                                onClick: openTvDisplay,
                                className: 'flex flex-col items-center gap-2 p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group'
                            },
                                React.createElement('i', { className: 'fas fa-external-link-alt text-2xl text-gray-400 group-hover:text-blue-500 transition' }),
                                React.createElement('span', { className: 'text-sm font-medium text-gray-700 group-hover:text-blue-700' }, 'Ouvrir l\'affichage')
                            ),
                            React.createElement('button', {
                                onClick: regenerateKey,
                                disabled: regenerating,
                                className: 'flex flex-col items-center gap-2 p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition group disabled:opacity-50'
                            },
                                React.createElement('i', { className: `fas ${regenerating ? 'fa-spinner fa-spin' : 'fa-sync-alt'} text-2xl text-gray-400 group-hover:text-orange-500 transition` }),
                                React.createElement('span', { className: 'text-sm font-medium text-gray-700 group-hover:text-orange-700' }, 
                                    regenerating ? 'Génération...' : 'Régénérer la Clé'
                                )
                            )
                        ),

                        // Security Warning
                        React.createElement('div', { className: 'flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl' },
                            React.createElement('i', { className: 'fas fa-shield-alt text-amber-500 mt-0.5' }),
                            React.createElement('p', { className: 'text-xs text-amber-700' },
                                'Ce lien contient une clé d\'accès. Ne le partagez qu\'aux personnes autorisées.'
                            )
                        )
                    )
                ),

                // Footer
                React.createElement('div', { className: 'px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl' },
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition'
                    }, 'Fermer')
                )
            )
        )
    );
};

window.TVDashboardModal = TVDashboardModal;
} // Fin protection double-chargement
