import { useQuery } from '@tanstack/react-query';
import { client, getAuthToken } from '../api';

export const MACHINES_KEYS = {
    all: ['machines'] as const,
};

export const useMachines = () => {
    return useQuery({
        queryKey: MACHINES_KEYS.all,
        queryFn: async () => {
            const token = getAuthToken();
            if (!token) return [];

            const res = await client.api.machines.$get(
                { query: {} },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) {
                throw new Error('Failed to fetch machines');
            }

            const data = await res.json();
            // Validation et extraction sécurisée
            return Array.isArray(data.machines) ? data.machines : [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes (les machines changent peu)
    });
};
