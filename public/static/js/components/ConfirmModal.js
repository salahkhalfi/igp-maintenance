// Composant de confirmation personnalisé
const ConfirmModal = ({ show, message, onConfirm, onCancel }) => {
    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: onCancel
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: 'flex items-start gap-4 mb-6' },
                React.createElement('i', {
                    className: 'fas fa-exclamation-triangle text-yellow-600 text-3xl mt-1'
                }),
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('p', { className: 'text-lg font-semibold' }, message)
                )
            ),
            React.createElement('div', { className: 'flex justify-end gap-3' },
                React.createElement('button', {
                    onClick: onCancel,
                    className: 'px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-semibold'
                }, 'Annuler'),
                React.createElement('button', {
                    onClick: onConfirm,
                    className: 'px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold'
                }, 'Confirmer')
            )
        )
    );
};
