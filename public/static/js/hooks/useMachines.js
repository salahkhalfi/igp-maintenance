const useMachines = () => {
    const [machines, setMachines] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const fetchMachines = React.useCallback(async () => {
        try {
            const response = await axios.get(API_URL + '/machines');
            setMachines(response.data.machines || []);
            setLoading(false);
            return response.data.machines;
        } catch (err) {
            console.error("Error fetching machines:", err);
            setError(err);
            setLoading(false);
            throw err;
        }
    }, []);

    return { machines, loading, error, fetchMachines };
};

window.useMachines = useMachines;
