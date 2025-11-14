/**
 * Configuration dynamique pour l'application BioMarket Insights
 * Détecte automatiquement l'environnement (local vs production) 
 * et configure les URLs d'API en conséquence.
 */

const CONFIG = (() => {
  // Détection de l'environnement
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // Configuration des URLs d'API
  const API_URLS = {
    // En local : utiliser le serveur Node.js local
    local: 'http://localhost:3000',
    
    // En production GitHub Pages : vous devrez déployer votre API ailleurs
    // Options possibles :
    // - Heroku, Render, Railway, Vercel, etc.
    // - Ou utiliser un mode "démo" avec des données statiques
    production: '' // À REMPLIR avec l'URL de votre API déployée (ex: 'https://votre-api.onrender.com')
  };
  
  // Sélection de l'URL selon l'environnement
  const getApiBaseUrl = () => {
    if (isLocalhost) {
      return API_URLS.local;
    }
    
    // Si pas d'API en production configurée, retourner null
    // pour basculer en mode démo avec données statiques
    if (!API_URLS.production) {
      console.warn('⚠️ Aucune API configurée pour la production. Mode démo activé.');
      return null;
    }
    
    return API_URLS.production;
  };
  
  const apiBaseUrl = getApiBaseUrl();
  
  return {
    // URLs
    API_BASE_URL: apiBaseUrl,
    API_ANALYZE_URL: apiBaseUrl ? `${apiBaseUrl}/api/analyze` : null,
    API_HEALTH_URL: apiBaseUrl ? `${apiBaseUrl}/api/health` : null,
    
    // Flags d'environnement
    IS_LOCAL: isLocalhost,
    IS_PRODUCTION: !isLocalhost,
    IS_GITHUB_PAGES: isGitHubPages,
    
    // Mode de fonctionnement
    USE_DEMO_MODE: apiBaseUrl === null,
    
    // Paramètres de timeout
    API_TIMEOUT: 30000, // 30 secondes
    
    // Messages d'erreur personnalisés
    ERROR_MESSAGES: {
      NO_API: 'Le site fonctionne en mode démonstration. Les données affichées sont des exemples. Pour utiliser l\'analyse IA réelle, exécutez le serveur local (voir README) ou contactez l\'administrateur.',
      FETCH_FAILED: 'Impossible de contacter le serveur d\'analyse. Vérifiez votre connexion internet ou utilisez le mode démo.',
      TIMEOUT: 'L\'analyse prend plus de temps que prévu. Veuillez réessayer.',
    }
  };
})();

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
