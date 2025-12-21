import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '../api';

export const SETTINGS_KEYS = {
    all: ['settings'] as const,
    title: ['settings', 'title'] as const,
    subtitle: ['settings', 'subtitle'] as const,
    messenger: ['settings', 'messenger'] as const,
    modules: ['settings', 'modules'] as const,
    logo: ['settings', 'logo'] as const,
    ai: ['settings', 'ai'] as const,
};

interface ModulesConfig {
    planning: boolean;
    statistics: boolean;
    notifications: boolean;
    messaging: boolean;
    machines: boolean;
}

interface SettingsData {
    title: string;
    subtitle: string;
    messengerName: string;
    modules: ModulesConfig;
    logoUrl: string;
}

const DEFAULT_MODULES: ModulesConfig = {
    planning: true, statistics: true, notifications: true, messaging: true, machines: true
};

export const useSettings = () => {
    return useQuery<SettingsData>({
        queryKey: SETTINGS_KEYS.all,
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // FETCHING VIA RPC (SAFE & TYPED)
            // Utilisation du client Hono au lieu de fetch manuel
            // FORCE NO-CACHE: Important pour les changements de paramètres immédiats
            const requestOptions = { 
                headers: { 
                    ...headers,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                } as any 
            };

            const [titleRes, subtitleRes, messengerRes, modulesRes, logoRes] = await Promise.all([
                // Route générique :key (Cache-busting via timestamp query param si possible, sinon headers)
                client.api.settings[':key'].$get({ param: { key: 'company_title' }, query: { t: Date.now().toString() } as any }, requestOptions),
                client.api.settings[':key'].$get({ param: { key: 'company_subtitle' }, query: { t: Date.now().toString() } as any }, requestOptions),
                // Routes spécifiques
                client.api.settings.messenger_app_name.$get({ query: { t: Date.now().toString() } as any }, requestOptions),
                client.api.settings.modules.$get({ query: { t: Date.now().toString() } as any }, requestOptions),
                // Logo via clé générique ou route spécifique
                client.api.settings.logo.$get({ query: { t: Date.now().toString() } as any }, requestOptions)
            ]);

            let title = "Gestion de la maintenance";
            let subtitle = "Système de Maintenance Universel";
            let messengerName = "Connect";
            let modules = DEFAULT_MODULES;
            let logoUrl = '/logo.png';

            // Traitement des réponses RPC
            if (titleRes.ok) {
                const data = await titleRes.json();
                if (data.value) title = data.value;
            }

            if (subtitleRes.ok) {
                const data = await subtitleRes.json();
                if (data.value) subtitle = data.value;
            }

            if (messengerRes.ok) {
                const data = await messengerRes.json();
                if (data.value) messengerName = data.value;
            }

            if (modulesRes.ok) {
                const data = await modulesRes.json();
                modules = { ...DEFAULT_MODULES, ...data };
            }
            
            // Pour le logo, on construit l'URL manuellement car c'est un binaire/redirect
            // Mais on peut vérifier s'il existe via l'API si besoin.
            // Ici on garde l'URL statique avec cache-buster car c'est ce que l'image src attend
            logoUrl = `/api/settings/logo?t=${Date.now()}`;

            return { title, subtitle, messengerName, modules, logoUrl };
        },
        staleTime: 1000 * 30, // Cache 30 seconds (was 5 minutes)
        refetchOnWindowFocus: true // Refetch when focusing window to catch updates
    });
};
