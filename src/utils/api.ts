/**
 * API Wrapper - Centralise tous les appels axios
 *
 * Bénéfices:
 * - Gestion d'erreurs unifiée
 * - Interception 401 automatique (logout)
 * - Token JWT automatiquement ajouté
 * - Logging centralisé
 * - Moins de duplication de code
 */

import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// URL de base de l'API
const API_URL = '/api';

/**
 * Configuration axios par défaut
 */
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Intercepteur de requêtes - Ajoute le token JWT automatiquement
 */
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponses - Gère les erreurs 401 automatiquement
 */
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Logout automatique si 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];

      // Rediriger vers login sauf si déjà sur la page login
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Wrapper GET
 * @param endpoint - Endpoint relatif (ex: '/tickets')
 * @param config - Configuration axios optionnelle
 */
export const apiGet = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.get<T>(endpoint, config);
    return response.data;
  } catch (error) {
    console.error(`API GET ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * Wrapper POST
 * @param endpoint - Endpoint relatif (ex: '/tickets')
 * @param data - Données à envoyer
 * @param config - Configuration axios optionnelle
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.post<T>(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`API POST ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * Wrapper PUT
 * @param endpoint - Endpoint relatif (ex: '/tickets/123')
 * @param data - Données à mettre à jour
 * @param config - Configuration axios optionnelle
 */
export const apiPut = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.put<T>(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`API PUT ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * Wrapper PATCH
 * @param endpoint - Endpoint relatif (ex: '/tickets/123')
 * @param data - Données partielles à mettre à jour
 * @param config - Configuration axios optionnelle
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.patch<T>(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`API PATCH ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * Wrapper DELETE
 * @param endpoint - Endpoint relatif (ex: '/tickets/123')
 * @param config - Configuration axios optionnelle
 */
export const apiDelete = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.delete<T>(endpoint, config);
    return response.data;
  } catch (error) {
    console.error(`API DELETE ${endpoint} error:`, error);
    throw error;
  }
};

/**
 * Helper pour définir le token JWT manuellement
 * Utilisé lors du login
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Helper pour retirer le token JWT
 * Utilisé lors du logout
 */
export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
  delete axios.defaults.headers.common['Authorization'];
};

/**
 * Export axios pour cas spéciaux (FormData, etc)
 */
export default axios;
