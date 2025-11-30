class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
        // Here you could also send error reports to a service like Sentry
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', {
                className: 'min-h-screen flex items-center justify-center bg-slate-50 p-4'
            },
                React.createElement('div', {
                    className: 'bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border border-red-100'
                },
                    React.createElement('div', {
                        className: 'w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'
                    },
                        React.createElement('i', { className: 'fas fa-bomb text-red-500 text-3xl' })
                    ),
                    React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-4' },
                        'Oups ! Quelque chose s\'est mal passé.'
                    ),
                    React.createElement('p', { className: 'text-gray-600 mb-6' },
                        'Une erreur inattendue est survenue. L\'application a été mise en pause pour éviter toute perte de données.'
                    ),
                    React.createElement('div', { className: 'bg-slate-100 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40 text-xs font-mono text-slate-600' },
                        this.state.error && this.state.error.toString()
                    ),
                    React.createElement('button', {
                        onClick: () => window.location.reload(),
                        className: 'w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02]'
                    },
                        React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                        'Recharger l\'application'
                    )
                )
            );
        }

        return this.props.children;
    }
}