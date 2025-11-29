// Composant de prompt personnalisé
const PromptModal = ({ show, message, onConfirm, onCancel }) => {
    const [value, setValue] = React.useState('');

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]',
        onClick: onCancel
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all',
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: 'mb-4' },
                React.createElement('p', { className: 'text-lg font-semibold mb-4' }, message),
                React.createElement('input', {
                    type: 'password',
                    value: value,
                    onChange: (e) => setValue(e.target.value),
                    className: 'w-full px-3 py-2 border-2 rounded-md',
                    placeholder: 'Minimum 6 caracteres',
                    autoFocus: true
                })
            ),
            React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
                React.createElement('button', {
                    onClick: onCancel,
                    className: 'px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-semibold'
                }, 'Annuler'),
                React.createElement('button', {
                    onClick: () => onConfirm(value),
                    className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-700 font-semibold'
                }, 'OK')
            )
        )
    );
};
