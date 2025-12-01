const useTickets = () => {
    const [tickets, setTickets] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const fetchTickets = React.useCallback(async () => {
        try {
            const response = await axios.get(API_URL + '/tickets');
            setTickets(response.data.tickets || []);
            setLoading(false);
            return response.data.tickets;
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setError(err);
            setLoading(false);
            throw err;
        }
    }, []);

    const moveTicket = React.useCallback(async (ticketId, newStatus, comment) => {
        try {
            await axios.patch(API_URL + '/tickets/' + ticketId, {
                status: newStatus,
                comment: comment
            });
            return true;
        } catch (err) {
            throw err;
        }
    }, []);

    const deleteTicket = React.useCallback(async (ticketId) => {
        try {
            await axios.delete(API_URL + '/tickets/' + ticketId);
            return true;
        } catch (err) {
            throw err;
        }
    }, []);

    return { tickets, loading, error, fetchTickets, moveTicket, deleteTicket, setTickets };
};
