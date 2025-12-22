// Composant Toast pour notifications rapides - ARIA Enhanced
const Toast = ({ show, message, type, onClose }) => {
    React.useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!show) return null;

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const ariaLive = type === 'error' ? 'assertive' : 'polite';

    return React.createElement('div', {
        className: 'fixed bottom-4 right-4 z-50 animate-slide-up',
        style: { animation: 'slideUp 0.3s ease-out' },
        role: 'alert',
        'aria-live': ariaLive,
        'aria-atomic': 'true'
    },
        React.createElement('div', {
            className: colors[type] + ' text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md'
        },
            React.createElement('i', { className: 'fas ' + icons[type] + ' text-xl', 'aria-hidden': 'true' }),
            React.createElement('p', { className: 'font-semibold flex-1' }, message),
            React.createElement('button', {
                onClick: onClose,
                className: 'text-white hover:text-gray-200 text-xl ml-2',
                'aria-label': 'Fermer la notification'
            }, '×')
        )
    );
};
