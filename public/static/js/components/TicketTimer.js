// Composant Chronomètre dynamique (mise à jour chaque seconde)
const TicketTimer = ({ createdAt, status }) => {
    const [elapsed, setElapsed] = React.useState(() => getElapsedTime(createdAt));

    React.useEffect(() => {
        // Ne pas afficher le chronomètre si le ticket est terminé ou archivé
        if (status === 'completed' || status === 'archived') {
            return;
        }

        // Mettre à jour chaque seconde pour afficher les secondes
        const interval = setInterval(() => {
            setElapsed(getElapsedTime(createdAt));
        }, 1000); // 1000ms = 1 seconde

        return () => clearInterval(interval);
    }, [createdAt, status]);

    // Ne pas afficher si ticket terminé/archivé
    if (status === 'completed' || status === 'archived') {
        return null;
    }

    return React.createElement('div', {
        className: 'mt-1.5 pt-1.5 border-t border-gray-200 text-xs ' + elapsed.color
    },
        React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex items-center gap-1' },
                React.createElement('span', {}, elapsed.icon),
                React.createElement('i', { className: 'fas fa-hourglass-half' }),
                React.createElement('span', { className: 'ml-1 text-gray-600 font-normal' }, 'Requête reçue depuis:')
            ),
            React.createElement('span', { className: 'font-bold font-mono' }, formatElapsedTime(elapsed))
        )
    );
};
