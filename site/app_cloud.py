"""
Application Flask pour l'analyse de marché basée sur data.gouv.fr
Version Cloud - Sans Ollama (pour hébergement gratuit)
Projet Code4Sud - Sujet 2: Aide aux études de marché
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configuration
DATA_GOUV_API = "https://www.data.gouv.fr/api/1"
PORT = int(os.environ.get('PORT', 5000))

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
            response = requests.get(url, params=params, timeout=5)
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
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erreur lors de la récupération du dataset: {e}")
            return None


class MarketAnalyzer:
    """Analyseur de marché utilisant les données de data.gouv.fr (Version Cloud)"""
    
    def __init__(self):
        self.data_client = DataGouvClient()
        
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
        sector_lower = sector.lower()
        expanded_terms = [sector]
        
        for key, terms in self.sector_mappings.items():
            if key in sector_lower or sector_lower in key:
                expanded_terms.extend(terms)
                break
        
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
        
        personas = {
            'restaurant': ['Familles', 'Professionnels en pause déjeuner', 'Touristes', 'Étudiants'],
            'boulangerie': ['Habitants du quartier', 'Travailleurs locaux', 'Familles', 'Retraités'],
            'commerce': ['Consommateurs locaux', 'Entreprises B2B', 'Touristes'],
            'technologie': ['Entreprises', 'Startups', 'Collectivités', 'Particuliers tech-savvy'],
            'santé': ['Patients locaux', 'Personnes âgées', 'Familles avec enfants', 'Sportifs'],
            'tourisme': ['Touristes nationaux', 'Touristes internationaux', 'Excursionnistes', 'Groupes'],
        }
        
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
        analysis['insights'].append("\n💰 Investissement initial:")
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
    
    def _generate_basic_analysis(self, datasets, sector, location):
        """Générer une analyse basique sans IA"""
        if not datasets:
            return None
        
        analysis = f"Analyse du secteur {sector}"
        if location:
            analysis += f" à {location}"
        analysis += f"\n\n"
        
        analysis += f"{len(datasets)} sources de données identifiées\n\n"
        
        # Analyser les organisations
        orgs = set()
        for ds in datasets[:5]:
            if ds.get('organization'):
                org_name = ds.get('organization', {}).get('name')
                if org_name:
                    orgs.add(org_name)
        
        if orgs:
            analysis += f"Principales sources:\n"
            for org in list(orgs)[:3]:
                analysis += f"  • {org}\n"
            analysis += "\n"
        
        # Recommandations basiques
        analysis += "Recommandations:\n"
        analysis += f"  • Consultez les {len(datasets)} datasets identifiés ci-dessous\n"
        analysis += "  • Analysez les données démographiques et économiques\n"
        analysis += "  • Identifiez les zones à fort potentiel\n"
        analysis += "  • Étudiez la concurrence locale\n"
        
        return analysis
    
    def _generate_basic_recommendations(self, sector, location, dataset_count):
        """Générer des recommandations basiques sans IA"""
        reco = f"Recommandations pour votre projet {sector}"
        if location:
            reco += f" à {location}"
        reco += "\n\n"
        
        if dataset_count > 0:
            reco += "Points positifs:\n"
            reco += f"  • {dataset_count} sources de données disponibles\n"
            reco += "  • Données publiques accessibles gratuitement\n"
            reco += "  • Informations officielles et fiables\n\n"
        
        reco += "Prochaines étapes:\n"
        reco += "  1. Télécharger et analyser les datasets pertinents\n"
        reco += "  2. Étudier la démographie de la zone\n"
        reco += "  3. Analyser la concurrence existante\n"
        reco += "  4. Identifier votre clientèle cible\n"
        reco += "  5. Élaborer votre business plan\n"
        
        return reco
    
    def analyze_market(self, sector, location=None):
        """
        Analyser un marché spécifique (Version Cloud sans IA)
        
        Args:
            sector: Secteur d'activité
            location: Zone géographique
        
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
            'ollama_enabled': False,
            'search_terms_used': [],
            'cloud_mode': True
        }
        
        # Obtenir les termes de recherche élargis
        search_terms = self._expand_search_terms(sector)
        analysis['search_terms_used'] = search_terms
        
        print(f"🔍 Recherche avec les termes: {', '.join(search_terms[:3])}")
        
        # Recherche de datasets
        all_datasets = []
        max_terms = 2
        
        for term in search_terms[:max_terms]:
            query = term
            if location:
                query += f" {location}"
            
            datasets = self.data_client.search_datasets(query, page_size=8)
            
            if datasets and 'data' in datasets:
                all_datasets.extend(datasets['data'])
                
            if len(all_datasets) >= 15:
                break
        
        # Dédupliquer
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
            
            # Analyse basique sans IA
            analysis['ai_analysis'] = self._generate_basic_analysis(
                unique_datasets[:3], sector, location
            )
            
            analysis['ai_recommendations'] = self._generate_basic_recommendations(
                sector, location, len(unique_datasets)
            )
        else:
            analysis['datasets_found'] = []
            analysis['ai_recommendations'] = self._generate_basic_recommendations(
                sector, location, 0
            )
        
        return analysis


# Instance globale
analyzer = MarketAnalyzer()


@app.route('/')
def index():
    """Page d'accueil"""
    return render_template('index.html')


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Endpoint pour l'analyse de marché"""
    try:
        data = request.json
        sector = data.get('sector')
        location = data.get('location')
        
        if not sector:
            return jsonify({'error': 'Le secteur est requis'}), 400
        
        # Effectuer l'analyse
        result = analyzer.analyze_market(sector, location)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Erreur dans /api/analyze: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health')
def health():
    """Endpoint de santé"""
    return jsonify({
        'status': 'ok',
        'ollama_available': False,
        'cloud_mode': True,
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False)
