// Composant de notification personnalisé
const NotificationModal = ({ show, message, type, onClose }) => {
    if (!show) return null;

    const colors = {
        success: 'bg-green-50 border-green-500 text-green-800',
        error: 'bg-red-50 border-red-500 text-red-800',
        info: 'bg-blue-50 border-blue-500 text-blue-800'
    };

    const icons = {
        success: 'fa-check-circle text-green-600',
        error: 'fa-exclamation-circle text-red-600',
        info: 'fa-info-circle text-blue-600'
    };

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: 'flex items-start gap-4' },
                React.createElement('i', {
                    className: 'fas ' + icons[type] + ' text-3xl mt-1'
                }),
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('p', { className: 'text-lg font-semibold mb-4' }, message)
                )
            ),
            React.createElement('div', { className: 'flex justify-end mt-4' },
                React.createElement('button', {
                    onClick: onClose,
                    className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-700 font-semibold'
                }, 'OK')
            )
        )
    );
};
