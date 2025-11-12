"""
Application Flask pour l'analyse de marché basée sur data.gouv.fr
Projet Code4Sud - Sujet 2: Aide aux études de marché
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import json
from datetime import datetime
import os
import ollama

app = Flask(__name__)
CORS(app)

# Configuration
DATA_GOUV_API = "https://www.data.gouv.fr/api/1"
CACHE_DIR = "cache"
OLLAMA_MODEL = "mistral"  # Modèle Ollama à utiliser

# Créer le dossier cache s'il n'existe pas
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)


class DataGouvClient:
    """Client pour interagir avec l'API de data.gouv.fr"""
    
    def __init__(self):
        self.base_url = DATA_GOUV_API
        
    def search_datasets(self, query, page_size=20):
        """Rechercher des datasets sur data.gouv.fr"""
        try:
            url = f"{self.base_url}/datasets/"
            params = {
                'q': query,
                'page_size': page_size
            }
            response = requests.get(url, params=params, timeout=5)  # Timeout de 5 secondes
            response.raise_for_status()
            return response.json()
        except requests.Timeout:
            print(f"Timeout lors de la recherche: {query}")
            return {'data': []}
        except Exception as e:
            print(f"Erreur lors de la recherche: {e}")
            return {'data': []}
    
    def get_dataset(self, dataset_id):
        """Récupérer un dataset spécifique"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}/"
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erreur lors de la récupération du dataset: {e}")
            return None
    
    def download_resource(self, resource_url):
        """Télécharger une ressource (fichier CSV, JSON, etc.)"""
        try:
            response = requests.get(resource_url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"Erreur lors du téléchargement: {e}")
            return None


class OllamaAIAnalyzer:
    """Analyseur IA utilisant Ollama pour l'analyse intelligente"""
    
    def __init__(self, model=OLLAMA_MODEL):
        self.model = model
        self.ollama_available = self._check_ollama()
    
    def _check_ollama(self):
        """Vérifier si Ollama est disponible"""
        try:
            ollama.list()
            return True
        except Exception as e:
            print(f"Ollama non disponible: {e}")
            return False
    
    def analyze_datasets(self, datasets, sector, location=None):
        """Analyser les datasets avec l'IA - VERSION RAPIDE"""
        if not self.ollama_available or not datasets:
            return None
        
        # Préparer un contexte COURT pour l'IA
        datasets_summary = "\n".join([
            f"- {ds.get('title', '')[:80]}"
            for ds in datasets[:3]  # Seulement 3 datasets au lieu de 5
        ])
        
        # Prompt COURT et DIRECT
        prompt = f"""Analyse rapide du marché {sector}{f' à {location}' if location else ''}.

Datasets: {datasets_summary}

En 3 points courts (max 150 mots):
1. Pertinence des données
2. Opportunité principale
3. Risque principal"""

        try:
            response = ollama.generate(
                model=self.model, 
                prompt=prompt,
                options={
                    'temperature': 0.7,
                    'num_predict': 200  # Limite à 200 tokens pour accélérer
                }
            )
            return response['response']
        except Exception as e:
            print(f"Erreur Ollama: {e}")
            return None
    
    def generate_recommendations(self, sector, location, datasets_count):
        """Générer des recommandations personnalisées avec l'IA - VERSION RAPIDE"""
        if not self.ollama_available:
            return None
        
        # Prompt TRÈS COURT
        prompt = f"""3 conseils rapides pour étude de marché {sector}{f' à {location}' if location else ''}.

{datasets_count} datasets trouvés.

Format: liste numérotée, 1 ligne par conseil."""

        try:
            response = ollama.generate(
                model=self.model, 
                prompt=prompt,
                options={
                    'temperature': 0.7,
                    'num_predict': 150  # Limite stricte
                }
            )
            return response['response']
        except Exception as e:
            print(f"Erreur Ollama: {e}")
            return None
    
    def analyze_competition(self, sector, location=None):
        """Analyser la concurrence avec l'IA - DÉSACTIVÉ PAR DÉFAUT POUR VITESSE"""
        # Désactivé pour accélérer - peut être réactivé si besoin
        return None
        
        # Code original commenté pour référence
        # if not self.ollama_available:
        #     return None
        # 
        # prompt = f"""Points clés pour analyser la concurrence {sector}{f' à {location}' if location else ''}.
        # 
        # 3 axes d'analyse principaux (très court)."""
        # 
        # try:
        #     response = ollama.generate(
        #         model=self.model, 
        #         prompt=prompt,
        #         options={'num_predict': 100}
        #     )
        #     return response['response']
        # except Exception as e:
        #     print(f"Erreur Ollama: {e}")
        #     return None
    
    def generate_generic_recommendations(self, sector, location=None):
        """Générer des recommandations même sans datasets"""
        if not self.ollama_available:
            return None
        
        prompt = f"""Conseils pour étude de marché {sector}{f' à {location}' if location else ''}.

Aucune donnée publique spécifique trouvée.

3 conseils pour trouver des informations utiles (sources alternatives, approches créatives).
Format: liste courte."""

        try:
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={
                    'temperature': 0.8,
                    'num_predict': 200
                }
            )
            return response['response']
        except Exception as e:
            print(f"Erreur Ollama: {e}")
            return None


class MarketAnalyzer:
    """Analyseur de marché utilisant les données de data.gouv.fr"""
    
    def __init__(self):
        self.data_client = DataGouvClient()
        self.ai_analyzer = OllamaAIAnalyzer()
        
        # Mapping des secteurs vers des termes de recherche plus larges
        self.sector_mappings = {
            'boulangerie': ['commerce alimentaire', 'artisanat', 'commerces', 'établissements'],
            'restaurant': ['restauration', 'commerce', 'tourisme', 'établissements'],
            'commerce': ['commerces', 'établissements', 'entreprises', 'économie'],
            'technologie': ['innovation', 'numérique', 'entreprises', 'startups'],
            'santé': ['santé', 'établissements santé', 'professionnels santé'],
            'immobilier': ['logement', 'construction', 'foncier', 'urbanisme'],
            'tourisme': ['tourisme', 'hébergement', 'culture', 'loisirs'],
            'transport': ['transport', 'mobilité', 'infrastructure'],
            'agriculture': ['agriculture', 'exploitation agricole', 'alimentaire'],
            'éducation': ['éducation', 'formation', 'établissements scolaires'],
        }
    
    def _expand_search_terms(self, sector):
        """Élargir les termes de recherche pour un secteur"""
        # Normaliser le secteur
        sector_lower = sector.lower()
        
        # Chercher des correspondances
        expanded_terms = [sector]
        
        for key, terms in self.sector_mappings.items():
            if key in sector_lower or sector_lower in key:
                expanded_terms.extend(terms)
                break
        
        # Ajouter des termes génériques si rien trouvé
        if len(expanded_terms) == 1:
            expanded_terms.extend(['entreprises', 'établissements', 'activité économique'])
        
        return expanded_terms
    
    def _analyze_step1_market_size(self, datasets, sector, location):
        """ÉTAPE 1: Analyser la taille du marché"""
        analysis = {
            'title': 'Étape 1 - Taille du marché',
            'data': {},
            'insights': []
        }
        
        # Compter les établissements/entreprises dans les datasets
        total_resources = sum(len(ds.get('resources', [])) for ds in datasets)
        
        analysis['data'] = {
            'datasets_disponibles': len(datasets),
            'ressources_totales': total_resources,
            'secteur': sector,
            'zone': location or 'France'
        }
        
        analysis['insights'].append(f"{len(datasets)} sources de données identifiées pour {sector}")
        if location:
            analysis['insights'].append(f"Zone géographique: {location}")
        analysis['insights'].append(f"{total_resources} fichiers de données disponibles")
        
        # Estimer la taille du marché
        if total_resources > 50:
            analysis['insights'].append("Marché important avec de nombreuses données disponibles")
        elif total_resources > 20:
            analysis['insights'].append("Marché de taille moyenne, données suffisantes")
        else:
            analysis['insights'].append("Marché de niche, données limitées")
        
        return analysis
    
    def _analyze_step2_target_audience(self, datasets, sector, location):
        """ÉTAPE 2: Identifier la clientèle cible"""
        analysis = {
            'title': 'Étape 2 - Clientèle cible',
            'data': {},
            'insights': []
        }
        
        # Déterminer les personas en fonction du secteur
        personas = {
            'restaurant': ['Familles', 'Professionnels en pause déjeuner', 'Touristes', 'Étudiants'],
            'boulangerie': ['Habitants du quartier', 'Travailleurs locaux', 'Familles', 'Retraités'],
            'commerce': ['Consommateurs locaux', 'Entreprises B2B', 'Touristes'],
            'technologie': ['Entreprises', 'Startups', 'Collectivités', 'Particuliers tech-savvy'],
            'santé': ['Patients locaux', 'Personnes âgées', 'Familles avec enfants', 'Sportifs'],
            'tourisme': ['Touristes nationaux', 'Touristes internationaux', 'Excursionnistes', 'Groupes'],
        }
        
        # Identifier le type de clientèle
        sector_lower = sector.lower()
        target_personas = []
        
        for key, values in personas.items():
            if key in sector_lower or sector_lower in key:
                target_personas = values
                break
        
        if not target_personas:
            target_personas = ['Grand public', 'Professionnels', 'Collectivités']
        
        analysis['data'] = {
            'personas_identifies': target_personas,
            'nombre_segments': len(target_personas)
        }
        
        analysis['insights'].append(f"{len(target_personas)} segments de clientèle identifiés:")
        for persona in target_personas:
            analysis['insights'].append(f"  • {persona}")
        
        if location:
            analysis['insights'].append(f"Ciblage géographique: {location}")
        
        return analysis
    
    def _analyze_step3_competition(self, datasets, sector, location):
        """ÉTAPE 3: Analyser la concurrence"""
        analysis = {
            'title': 'Étape 3 - Concurrence',
            'data': {},
            'insights': []
        }
        
        # Chercher des données sur les établissements
        establishment_data = []
        for ds in datasets:
            title_lower = ds.get('title', '').lower()
            if any(word in title_lower for word in ['établissement', 'entreprise', 'commerce', 'sirene', 'siret']):
                establishment_data.append(ds)
        
        analysis['data'] = {
            'sources_concurrence': len(establishment_data),
            'datasets_pertinents': [ds.get('title', '')[:60] for ds in establishment_data[:3]]
        }
        
        if establishment_data:
            analysis['insights'].append(f"{len(establishment_data)} sources de données sur les établissements")
            analysis['insights'].append("Possibilité d'identifier les concurrents directs")
            analysis['insights'].append("Analyse SWOT recommandée:")
            analysis['insights'].append("  • Forces: Votre différenciation")
            analysis['insights'].append("  • Faiblesses: À améliorer")
            analysis['insights'].append("  • Opportunités: Niches non exploitées")
            analysis['insights'].append("  • Menaces: Concurrents établis")
        else:
            analysis['insights'].append("Peu de données concurrentielles disponibles")
            analysis['insights'].append("Complétez avec recherche terrain locale")
        
        return analysis
    
    def _analyze_step4_positioning(self, datasets, sector, location):
        """ÉTAPE 4: Définir le positionnement"""
        analysis = {
            'title': 'Étape 4 - Positionnement stratégique',
            'data': {},
            'insights': []
        }
        
        # Stratégies de positionnement par secteur
        positioning = {
            'restaurant': {
                'strategies': ['Qualité premium', 'Rapidité/Prix bas', 'Cuisine spécialisée', 'Bio/Local'],
                'differentiation': ['Menu unique', 'Ambiance', 'Service', 'Origine produits']
            },
            'boulangerie': {
                'strategies': ['Artisanat traditionnel', 'Innovation', 'Bio/Sans gluten', 'Prix compétitifs'],
                'differentiation': ['Recettes uniques', 'Horaires étendus', 'Produits locaux', 'Service personnalisé']
            },
            'commerce': {
                'strategies': ['Spécialisation', 'Diversité', 'Prix', 'Service client'],
                'differentiation': ['Expertise', 'Gamme unique', 'Conseil', 'Expérience']
            },
            'technologie': {
                'strategies': ['Innovation', 'Open-source', 'IA/Automation', 'Sur-mesure'],
                'differentiation': ['Technologie unique', 'Support', 'Prix', 'Rapidité']
            }
        }
        
        sector_lower = sector.lower()
        strategy_data = None
        
        for key, value in positioning.items():
            if key in sector_lower or sector_lower in key:
                strategy_data = value
                break
        
        if not strategy_data:
            strategy_data = {
                'strategies': ['Qualité', 'Prix', 'Service', 'Innovation'],
                'differentiation': ['Expertise', 'Proximité', 'Personnalisation', 'Rapidité']
            }
        
        analysis['data'] = {
            'strategies_possibles': strategy_data['strategies'],
            'axes_differentiation': strategy_data['differentiation']
        }
        
        analysis['insights'].append("Stratégies de positionnement recommandées:")
        for i, strat in enumerate(strategy_data['strategies'], 1):
            analysis['insights'].append(f"  {i}. {strat}")
        
        analysis['insights'].append("\nAxes de différenciation possibles:")
        for diff in strategy_data['differentiation']:
            analysis['insights'].append(f"  • {diff}")
        
        if location:
            analysis['insights'].append(f"\nAdaptez votre positionnement au contexte de {location}")
        
        return analysis
    
    def _analyze_step5_business_plan(self, datasets, sector, location):
        """ÉTAPE 5: Élaborer le business plan"""
        analysis = {
            'title': 'Étape 5 - Business Plan',
            'data': {},
            'insights': []
        }
        
        # Données économiques disponibles
        economic_data = []
        for ds in datasets:
            title_lower = ds.get('title', '').lower()
            if any(word in title_lower for word in ['économique', 'emploi', 'démographique', 'population', 'revenus']):
                economic_data.append(ds)
        
        analysis['data'] = {
            'sources_economiques': len(economic_data),
            'datasets_pour_bp': [ds.get('title', '')[:60] for ds in economic_data[:3]]
        }
        
        analysis['insights'].append("Éléments du Business Plan:")
        analysis['insights'].append("\nInvestissement initial:")
        analysis['insights'].append("  • Local/Loyer")
        analysis['insights'].append("  • Équipement/Matériel")
        analysis['insights'].append("  • Stock initial")
        analysis['insights'].append("  • Marketing/Communication")
        
        analysis['insights'].append("\nPrévisions financières:")
        analysis['insights'].append("  • Chiffre d'affaires prévisionnel")
        analysis['insights'].append("  • Charges fixes et variables")
        analysis['insights'].append("  • Seuil de rentabilité")
        analysis['insights'].append("  • Cash-flow sur 3 ans")
        
        if economic_data:
            analysis['insights'].append(f"\n{len(economic_data)} sources de données économiques disponibles")
            analysis['insights'].append("Utilisez ces données pour affiner vos prévisions")
        else:
            analysis['insights'].append("\nComplétez avec données chambre de commerce locale")
        
        analysis['insights'].append("\nProchaines actions:")
        analysis['insights'].append("  1. Télécharger les datasets pertinents")
        analysis['insights'].append("  2. Analyser la démographie locale")
        analysis['insights'].append("  3. Calculer le marché potentiel")
        analysis['insights'].append("  4. Établir les projections financières")
        analysis['insights'].append("  5. Rédiger le plan d'action")
        
        return analysis
    
    def analyze_market(self, sector, location=None):
        """
        Analyser un marché spécifique
        
        Args:
            sector: Secteur d'activité (ex: "commerce", "restauration", "technologie")
            location: Zone géographique (ex: "Nice", "Marseille", "PACA")
        
        Returns:
            dict: Résultats de l'analyse
        """
        analysis = {
            'sector': sector,
            'location': location,
            'timestamp': datetime.now().isoformat(),
            'datasets_found': [],
            'ai_analysis': None,
            'ai_recommendations': None,
            'competition_analysis': None,
            'key_indicators': {},
            'competitors': [],
            'recommendations': [],
            'ollama_enabled': self.ai_analyzer.ollama_available,
            'search_terms_used': []
        }
        
        # Obtenir les termes de recherche élargis
        search_terms = self._expand_search_terms(sector)
        analysis['search_terms_used'] = search_terms
        
        print(f"🔍 Recherche avec les termes: {', '.join(search_terms[:3])}")
        
        # Essayer plusieurs recherches pour maximiser les résultats - EN PARALLÈLE
        all_datasets = []
        max_terms = 2  # Réduire à 2 termes maximum pour la vitesse
        
        for term in search_terms[:max_terms]:  # Limiter à 2 termes pour la vitesse
            query = term
            if location:
                query += f" {location}"
            
            datasets = self.data_client.search_datasets(query, page_size=8)  # Réduire à 8 résultats
            
            if datasets and 'data' in datasets:
                all_datasets.extend(datasets['data'])
                
            # Si on a déjà 15+ datasets, arrêter la recherche
            if len(all_datasets) >= 15:
                break
        
        # Dédupliquer par ID
        seen_ids = set()
        unique_datasets = []
        for ds in all_datasets:
            ds_id = ds.get('id')
            if ds_id and ds_id not in seen_ids:
                seen_ids.add(ds_id)
                unique_datasets.append(ds)
        
        print(f"{len(unique_datasets)} datasets uniques trouvés")
        
        if unique_datasets:
            analysis['datasets_found'] = [
                {
                    'title': ds.get('title', 'Sans titre'),
                    'description': ds.get('description', '')[:150] + '...' if ds.get('description') else '',
                    'url': ds.get('page', ''),
                    'organization': ds.get('organization', {}).get('name', 'Inconnu') if ds.get('organization') else 'Inconnu',
                    'resources_count': len(ds.get('resources', []))
                }
                for ds in unique_datasets[:8]
            ]
            
            # ✨ EXÉCUTER LES 5 ÉTAPES D'ANALYSE DE MARCHÉ
            print("Exécution des 5 étapes d'analyse de marché...")
            
            analysis['market_steps'] = {
                'step1': self._analyze_step1_market_size(unique_datasets, sector, location),
                'step2': self._analyze_step2_target_audience(unique_datasets, sector, location),
                'step3': self._analyze_step3_competition(unique_datasets, sector, location),
                'step4': self._analyze_step4_positioning(unique_datasets, sector, location),
                'step5': self._analyze_step5_business_plan(unique_datasets, sector, location)
            }
            
            # Analyse IA des datasets (seulement si des datasets trouvés)
            if self.ai_analyzer.ollama_available and len(unique_datasets) > 0:
                print("Analyse IA rapide en cours avec Ollama...")
                
                # Analyse des datasets (prioritaire) - SEULEMENT 2 datasets pour plus de vitesse
                analysis['ai_analysis'] = self.ai_analyzer.analyze_datasets(
                    unique_datasets[:2], sector, location
                )
                
                # Recommandations (optionnel - seulement si rapide)
                analysis['ai_recommendations'] = self.ai_analyzer.generate_recommendations(
                    sector, location, len(unique_datasets)
                )
                
                # Analyse concurrentielle DÉSACTIVÉE pour vitesse
                # Réactiver si besoin en décommentant la ligne ci-dessous
                # analysis['competition_analysis'] = self.ai_analyzer.analyze_competition(sector, location)
                
                print("Analyse IA terminée")
        else:
            # Aucun dataset trouvé - générer des recommandations génériques
            print("Aucun dataset trouvé - génération de recommandations génériques")
            analysis['datasets_found'] = []
            
            # Si Ollama disponible, donner des conseils même sans données
            if self.ai_analyzer.ollama_available:
                analysis['ai_recommendations'] = self.ai_analyzer.generate_generic_recommendations(sector, location)
        
        # Générer des recommandations basiques (fallback)
        analysis['recommendations'] = self._generate_recommendations(sector, location)
        
        return analysis
    
    def _generate_recommendations(self, sector, location):
        """Générer des recommandations pour l'étude de marché"""
        recommendations = [
            {
                'category': 'Définition du marché',
                'text': f"Analyser le secteur {sector}" + (f" dans la zone {location}" if location else ""),
                'priority': 'high'
            },
            {
                'category': 'Analyse de la demande',
                'text': "Étudier les comportements d'achat et créer des personas clients",
                'priority': 'high'
            },
            {
                'category': 'Analyse de l\'offre',
                'text': "Identifier les concurrents directs et indirects via les données publiques",
                'priority': 'medium'
            },
            {
                'category': 'Conformité RGPD',
                'text': "Toutes les données utilisées sont publiques et conformes au RGPD",
                'priority': 'info'
            }
        ]
        return recommendations
    
    def get_economic_indicators(self, location):
        """Récupérer des indicateurs économiques pour une zone"""
        query = f"économie {location} entreprises"
        datasets = self.data_client.search_datasets(query, page_size=10)
        
        indicators = {
            'location': location,
            'datasets_available': 0,
            'sources': []
        }
        
        if datasets and 'data' in datasets:
            indicators['datasets_available'] = len(datasets['data'])
            indicators['sources'] = [
                {
                    'title': ds.get('title', ''),
                    'url': ds.get('page', '')
                }
                for ds in datasets['data'][:3]
            ]
        
        return indicators


# Initialiser l'analyseur
analyzer = MarketAnalyzer()


@app.route('/')
def index():
    """Page d'accueil"""
    return render_template('index.html')


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Endpoint pour lancer une analyse de marché"""
    data = request.get_json()
    
    sector = data.get('sector', '')
    location = data.get('location', '')
    
    if not sector:
        return jsonify({'error': 'Le secteur est requis'}), 400
    
    # Lancer l'analyse
    result = analyzer.analyze_market(sector, location)
    
    return jsonify(result)


@app.route('/api/datasets/search', methods=['GET'])
def search_datasets():
    """Rechercher des datasets"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'error': 'Paramètre de recherche requis'}), 400
    
    client = DataGouvClient()
    results = client.search_datasets(query)
    
    return jsonify(results)


@app.route('/api/indicators/<location>', methods=['GET'])
def get_indicators(location):
    """Récupérer les indicateurs économiques d'une zone"""
    indicators = analyzer.get_economic_indicators(location)
    return jsonify(indicators)


@app.route('/api/health', methods=['GET'])
def health():
    """Vérifier l'état de l'API"""
    ollama_status = 'available'
    ollama_model = None
    
    try:
        models = ollama.list()
        ollama_model = OLLAMA_MODEL
        if not any(m['name'].startswith(OLLAMA_MODEL) for m in models.get('models', [])):
            ollama_status = 'model_not_found'
    except Exception as e:
        ollama_status = 'unavailable'
    
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'data_gouv_api': DATA_GOUV_API,
        'ollama_status': ollama_status,
        'ollama_model': ollama_model
    })


@app.route('/api/ollama/models', methods=['GET'])
def list_models():
    """Lister les modèles Ollama disponibles"""
    try:
        models = ollama.list()
        return jsonify({
            'available': True,
            'models': [m['name'] for m in models.get('models', [])],
            'current_model': OLLAMA_MODEL
        })
    except Exception as e:
        return jsonify({
            'available': False,
            'error': str(e)
        }), 503


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
