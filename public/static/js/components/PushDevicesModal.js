// Composant modal des appareils push
const PushDevicesModal = ({ show, onClose }) => {
    const [loading, setLoading] = React.useState(true);
    const [devices, setDevices] = React.useState([]);

    React.useEffect(() => {
        if (show) {
            loadDevices();
        }
    }, [show]);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/push/subscriptions-list', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                }
            });
            const data = await response.json();
            setDevices(data.subscriptions || []);
        } catch (error) {
            console.error('Erreur chargement appareils:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDeviceIcon = (deviceType) => {
        if (!deviceType) return 'fa-mobile-alt';
        const type = deviceType.toLowerCase();
        if (type.includes('mobile') || type.includes('phone')) return 'fa-mobile-alt';
        if (type.includes('tablet') || type.includes('ipad')) return 'fa-tablet-alt';
        if (type.includes('desktop') || type.includes('windows')) return 'fa-desktop';
        if (type.includes('laptop') || type.includes('mac')) return 'fa-laptop';
        return 'fa-mobile-alt';
    };

    const getDevicePlatform = (deviceType, deviceName) => {
        if (deviceName) return deviceName;
        if (!deviceType) return 'Appareil inconnu';
        return deviceType;
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
            // Header
            React.createElement('div', { 
                className: 'bg-gradient-to-r from-teal-700 to-teal-800 text-white p-4 sm:p-6'
            },
                React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('div', {},
                        React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-bell' }),
                            'Appareils Notifications Push'
                        ),
                        React.createElement('p', { className: 'text-teal-200 text-xs sm:text-sm mt-1' }, 
                            'Appareils enregistrés pour recevoir les notifications'
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
                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-teal-600 mb-4' }),
                        React.createElement('p', { className: 'text-gray-600' }, 'Chargement des appareils...')
                    ) :
                    devices.length > 0 ?
                        React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                            // Stats summary
                            React.createElement('div', { className: 'bg-teal-50 border border-teal-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6' },
                                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                    React.createElement('i', { className: 'fas fa-info-circle text-teal-700' }),
                                    React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                ),
                                React.createElement('p', { className: 'text-xs sm:text-sm text-gray-700' },
                                    React.createElement('span', { className: 'font-bold text-teal-800' }, devices.length),
                                    ' appareil(s) enregistré(s) pour recevoir les notifications push.'
                                )
                            ),

                            // Devices list
                            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4' },
                                devices.map((device, index) =>
                                    React.createElement('div', {
                                        key: device.id,
                                        className: 'border-2 border-teal-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-white'
                                    },
                                        React.createElement('div', { className: 'flex items-start gap-3' },
                                            React.createElement('div', { className: 'w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0' },
                                                React.createElement('i', { 
                                                    className: 'fas ' + getDeviceIcon(device.device_type) + ' text-teal-700 text-xl'
                                                })
                                            ),
                                            React.createElement('div', { className: 'flex-1' },
                                                React.createElement('h3', { className: 'font-bold text-gray-800 mb-1' }, 
                                                    getDevicePlatform(device.device_type, device.device_name)
                                                ),
                                                React.createElement('p', { className: 'text-xs text-gray-500 mb-2' }, 
                                                    'Utilisateur: ' + (device.user_full_name || 'Inconnu')
                                                ),
                                                React.createElement('div', { className: 'flex items-center gap-2' },
                                                    React.createElement('span', { 
                                                        className: 'px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700'
                                                    },
                                                        React.createElement('i', { className: 'fas fa-check-circle mr-1' }),
                                                        'Actif'
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        ) :
                        React.createElement('div', {
                            className: 'text-center py-12 bg-gray-50 rounded-lg'
                        },
                            React.createElement('i', { className: 'fas fa-mobile-alt text-5xl text-gray-300 mb-4' }),
                            React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                'Aucun appareil enregistré'
                            ),
                            React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                'Les appareils apparaîtront ici une fois les notifications push activées.'
                            )
                        )
            )
        )
    );
};
