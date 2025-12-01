const TicketHistory = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return React.createElement('div', { className: "bg-gray-50 p-4 rounded max-h-96 overflow-y-auto" },
            React.createElement('p', { className: "text-gray-500 italic" }, "Aucun historique disponible.")
        );
    }

    return React.createElement('div', { className: "space-y-4" },
        React.createElement('h3', { className: "font-bold text-lg mb-2" }, "Historique d'activité"),
        React.createElement('div', { className: "bg-gray-50 p-4 rounded max-h-96 overflow-y-auto" },
            React.createElement('ul', { className: "space-y-3" },
                logs.map((log, index) => (
                    React.createElement('li', { key: index, className: "text-sm text-gray-700 border-b pb-2 last:border-0" },
                        React.createElement('div', { className: "flex justify-between" },
                            React.createElement('span', { className: "font-semibold" }, log.action),
                            React.createElement('span', { className: "text-xs text-gray-500" },
                                new Date(log.created_at).toLocaleString()
                            )
                        ),
                        React.createElement('p', { className: "text-gray-600 mt-1" },
                            log.details, " ",
                            React.createElement('span', { className: "italic text-xs" }, "- par " + log.user_name)
                        )
                    )
                ))
            )
        )
    );
};

window.TicketHistory = TicketHistory;
