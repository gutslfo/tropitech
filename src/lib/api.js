// src/lib/api.js - Configuration client API pour le frontend

/**
 * Configuration de l'URL de l'API avec gestion du contexte d'exécution
 * Utilise différentes URL selon que le code s'exécute côté client ou serveur
 */
export const API_URL = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    : process.env.BACKEND_URL || 'http://backend:5000';

/**
 * Fonction utilitaire pour effectuer des requêtes à l'API backend
 * @param {string} endpoint - Point de terminaison API (sans le slash initial)
 * @param {Object} options - Options fetch (method, headers, body, etc.)
 * @returns {Promise<any>} - Réponse de l'API analysée en JSON
 */
export async function fetchApi(endpoint, options = {}) {
    // S'assurer que l'endpoint ne commence pas par un slash
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_URL}/${sanitizedEndpoint}`;
    
    // Headers par défaut
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',  // Pour les cookies d'authentification si nécessaire
        });
        
        // Vérifier si la réponse est OK (status 200-299)
        if (!response.ok) {
            // Essayer d'obtenir l'erreur au format JSON
            try {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur API: ${response.status}`);
            } catch (e) {
                // Si pas de JSON, utiliser le statut HTTP
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }
        }
        
        // Vérifier si la réponse est vide
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

/**
 * Services API pour les différentes fonctionnalités
 */
export const apiService = {
    // Récupérer les places restantes
    async getAvailableTickets() {
        return fetchApi('api/ticket/places-restantes');
    },
    
    // Créer un paiement
    async createPayment(paymentData) {
        return fetchApi('api/payment/create-payment', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    },
    
    // Vérifier le statut d'un billet
    async checkTicketStatus(paymentId) {
        return fetchApi(`api/ticket/status/${paymentId}`);
    },
    
    // Générer un billet PDF
    async generateTicket(paymentId) {
        return fetchApi(`api/ticket/generate?paymentId=${paymentId}`);
    }
};