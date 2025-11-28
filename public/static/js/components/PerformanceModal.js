// Composant de performance des techniciens (ÉTAPE 2: VERSION BASIQUE)
const PerformanceModal = ({ show, onClose }) => {
    const [loading, setLoading] = React.useState(true);
    const [performanceData, setPerformanceData] = React.useState(null);

    React.useEffect(() => {
        if (show) {
            loadPerformanceData();
        }
    }, [show]);

    const loadPerformanceData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/stats/technicians-performance', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                }
            });
            const data = await response.json();
            setPerformanceData(data);
        } catch (error) {
            console.error('Erreur chargement performance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
            onClick: (e) => e.stopPropagation()
        },
            // Header with gradient
            React.createElement('div', { 
                className: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 sm:p-6'
            },
                React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('div', {},
                        React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-chart-line' }),
                            'Tableau de Performance'
                        ),
                        React.createElement('p', { className: 'text-slate-200 text-xs sm:text-sm mt-1' }, 
                            'Analyse des performances sur les 30 derniers jours'
                        )
                    ),
                    React.createElement('button', {
                        className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                        onClick: onClose
                    }, React.createElement('i', { className: 'fas fa-times' }))
                )
            ),

            // Content
            React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                loading ? 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-slate-500 mb-4' }),
                        React.createElement('p', { className: 'text-gray-600' }, 'Chargement des données...')
                    ) :
                    React.createElement('div', { className: 'space-y-3 sm:space-y-6' },
                        // Top Performers Section
                        React.createElement('div', {},
                            React.createElement('div', { className: 'flex items-center gap-2 mb-3 sm:mb-4' },
                                React.createElement('i', { className: 'fas fa-trophy text-yellow-500 text-xl' }),
                                React.createElement('h3', { className: 'text-base sm:text-lg font-bold text-gray-800' }, 
                                    'Top Performers'
                                ),
                                React.createElement('span', { className: 'text-xs sm:text-sm text-gray-500' }, 
                                    '(Meilleurs techniciens)'
                                )
                            ),
                            
                            // Performance Cards
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4' },
                                performanceData?.topTechnicians?.slice(0, 3).map((tech, index) => {
                                    const rankColors = [
                                        { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', border: 'border-amber-400', icon: 'fa-medal text-amber-600', badge: 'bg-amber-600' },
                                        { bg: 'bg-gradient-to-br from-slate-50 to-slate-100', border: 'border-slate-300', icon: 'fa-medal text-slate-500', badge: 'bg-slate-500' },
                                        { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-400', icon: 'fa-medal text-orange-700', badge: 'bg-orange-700' }
                                    ];
                                    const colors = rankColors[index] || rankColors[2];
                                    
                                    return React.createElement('div', {
                                        key: tech.id,
                                        className: 'border-2 rounded-lg p-3 sm:p-4 ' + colors.bg + ' ' + colors.border + ' hover:shadow-lg transition-shadow'
                                    },
                                        React.createElement('div', { className: 'flex items-start justify-between mb-3' },
                                            React.createElement('div', { className: 'flex items-center gap-2' },
                                                React.createElement('i', { className: 'fas ' + colors.icon + ' text-2xl' }),
                                                React.createElement('span', { className: 'text-xs font-semibold text-gray-600' }, 
                                                    '#' + (index + 1)
                                                )
                                            ),
                                            React.createElement('span', { 
                                                className: 'px-2 py-1 rounded-full text-white text-xs font-bold ' + colors.badge 
                                            }, tech.completed_count + ' tickets')
                                        ),
                                        React.createElement('div', {},
                                            React.createElement('p', { className: 'font-bold text-gray-800 mb-1' }, 
                                                tech.full_name || (tech.first_name + ' ' + tech.last_name)
                                            ),
                                            React.createElement('div', { className: 'flex items-center gap-2 text-xs text-gray-600' },
                                                React.createElement('i', { className: 'fas fa-check-circle text-green-500' }),
                                                React.createElement('span', {}, tech.completed_count + ' interventions réussies')
                                            )
                                        )
                                    );
                                })
                            )
                        ),

                        // Stats Summary
                        performanceData?.topTechnicians?.length > 0 && React.createElement('div', { 
                            className: 'bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4'
                        },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                React.createElement('i', { className: 'fas fa-info-circle text-slate-600' }),
                                React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                            ),
                            React.createElement('p', { className: 'text-xs sm:text-sm text-gray-700' },
                                'Total de ',
                                React.createElement('span', { className: 'font-bold' }, 
                                    performanceData.topTechnicians.reduce((sum, t) => sum + t.completed_count, 0)
                                ),
                                ' tickets complétés par les ',
                                React.createElement('span', { className: 'font-bold' }, 
                                    performanceData.topTechnicians.length
                                ),
                                ' meilleurs techniciens au cours des 30 derniers jours.'
                            )
                        ),

                        // Empty state
                        performanceData?.topTechnicians?.length === 0 && React.createElement('div', {
                            className: 'text-center py-12 bg-gray-50 rounded-lg'
                        },
                            React.createElement('i', { className: 'fas fa-inbox text-5xl text-gray-300 mb-4' }),
                            React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                'Aucune donnée de performance disponible'
                            ),
                            React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                'Les statistiques apparaîtront une fois que les techniciens auront complété des tickets.'
                            )
                        )
                    )
            )
        )
    );
};
