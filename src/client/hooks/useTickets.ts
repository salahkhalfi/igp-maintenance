import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, getAuthToken } from '../api';
import { Ticket } from '../types';

// Clés de requête constantes pour éviter les fautes de frappe
export const TICKETS_KEYS = {
    all: ['tickets'] as const,
    details: (id: number) => [...TICKETS_KEYS.all, id] as const,
};

export const useTickets = () => {
    return useQuery({
        queryKey: TICKETS_KEYS.all,
        queryFn: async () => {
            const token = getAuthToken();
            if (!token) return [];
            
            // Utilisation du client RPC typé
            const res = await client.api.tickets.$get(
                { query: {} }, // Paramètres de requête optionnels
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) {
                throw new Error('Failed to fetch tickets');
            }

            const data = await res.json();
            // Validation centralisée : on garantit un tableau
            return Array.isArray(data.tickets) ? data.tickets : [];
        },
        // Rafraîchissement automatique intelligent (optionnel)
        staleTime: 1000 * 60 * 1, // 1 minute
    });
};

export const useTicketMutations = () => {
    const queryClient = useQueryClient();

    const moveTicket = useMutation({
        mutationFn: async ({ id, status, log }: { id: number; status: string; log: string }) => {
            // CORRECTION: Utilisation de la route standard PATCH /api/tickets/:id
            // L'API attend 'status' et optionnellement 'comment' (mappé depuis 'log')
            const res = await client.api.tickets[':id'].$patch(
                { 
                    param: { id: id.toString() },
                    json: { status, comment: log }
                },
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to move ticket');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.all });
        }
    });

    const deleteTicket = useMutation({
        mutationFn: async (id: number) => {
            const res = await client.api.tickets[':id'].$delete(
                { param: { id: id.toString() } },
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
            );
            if (!res.ok) throw new Error('Failed to delete ticket');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TICKETS_KEYS.all });
        }
    });

    return { moveTicket, deleteTicket };
};
