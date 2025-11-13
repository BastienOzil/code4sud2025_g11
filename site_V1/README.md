# MarketAI — Analyse IA Optimisée avec deepseek-r1:8b

## 📖 Présentation

MarketAI est une application d'analyse de marché optimisée pour `deepseek-r1:8b`, conçue pour des analyses rapides et précises avec des données régionales françaises.

### Architecture

1. **Frontend** : Interface utilisateur avec collecte automatique de données
2. **Backend Node.js** : API Express qui envoie le Super-Prompt à Ollama
3. **IA Ollama** : Modèle `deepseek-r1:8b` qui analyse et retourne du JSON structuré

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v16+)
- Ollama installé localement : https://ollama.com
- Modèle `deepseek-r1:8b` téléchargé : `ollama pull deepseek-r1:8b`

### Installation
```bash
cd /home/bozil/Documents/Code4sud/code4sud_sujet2/site_V1
npm install
npm start
```

Le serveur démarre sur : **http://localhost:3000**

## ⚡ Optimisations deepseek-r1:8b

### Performance
L'IA est optimisée pour des réponses rapides et fiables :
1. **Prompt raccourci** : 1200 caractères (vs 2600 avant)
2. **Données directes** : Injection des KPI dans le template
3. **Timeout réduit** : 60 secondes maximum
4. **Nettoyage automatique** : Parsing JSON robuste
5. **Variables Ollama** : Configuration optimale

### Structure des données d'entrée
```json
{
  "zone_analysee": "Nice",
  "segment_analyse": "Maraîchage Bio",
  "population": 342669,
  "surface_km2": 71.9,
  "revenu_median": 21800,
  "taux_pauvrete": 18,
  "nb_operateurs_bio_total": 28,
  "nb_concurrents_directs": 7,
  "ventilation_acteurs": {
    "producteurs": 7,
    "transformateurs": 10,
    "distributeurs": 11
  },
  "surface_bio_hectares": 2800,
  "risque_pollution_basol": "Surveillance renforcée",
  "risque_inondation_azi": "Modéré",
  "hist_secheresse_catnat": 6,
  "hist_inondation_catnat": 3
}
```

### Structure JSON de sortie
```json
{
  "metadonnees_analyse": {
    "zone_analysee": "...",
    "segment_analyse": "...",
    "date_analyse": "..."
  },
  "kpi_synthese": {
    "score_opportunite": 8.2,
    "score_viabilite": 5.5,
    "saturation_marche": "Faible",
    "pression_commerciale": "Élevée (12050 hab/acteur)",
    "pouvoir_achat_local": "Aligné (Indice 98)",
    "risque_environnemental": "Élevé (Indice 7.5/10)"
  },
  "analyse_textuelle_generale": "...",
  "swot_externe": {
    "opportunites": ["..."],
    "menaces": ["..."]
  },
  "kpi_detailles_bruts": [
    { "label": "Population (Zone)", "valeur": "342 669", "source": "API Géo" }
  ]
}
```

## 🔧 API Endpoints

### GET /api/health
Vérifie la disponibilité d'Ollama
```bash
curl -s http://localhost:3000/api/health
```

### POST /api/analyze
Lance une analyse de marché complète
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"sector":"Maraîchage Bio","location":"Nice"}'
```

## 🧪 Test du Super-Prompt

Un script de test est disponible pour vérifier la génération du prompt :
```bash
node test_super_prompt.js
```

## 🔄 Workflow Complet

1. **Utilisateur** saisit secteur + zone géographique
2. **Frontend** collecte automatiquement les données (population, revenus, risques...)
3. **Backend** construit le Super-Prompt avec les données
4. **Ollama** analyse et retourne le JSON structuré
5. **Frontend** affiche l'analyse avec KPI, SWOT et recommandations

## ⚙️ Configuration Avancée

### Ollama HTTP (optionnel)
```bash
export OLLAMA_HTTP_URL="http://localhost:11434/api/generate"
npm start
```

### Variables d'environnement
- `PORT` : Port du serveur (défaut: 3000)
- `OLLAMA_HTTP_URL` : URL API Ollama (optionnel, utilise CLI par défaut)

**Note** : Ce projet utilise exclusivement le modèle `deepseek-r1:8b` pour garantir la cohérence des analyses.

## 📊 Collecte de Données

Le frontend collecte automatiquement des données réalistes basées sur :
- Population et démographie par ville
- Revenus médians régionaux
- Risques environnementaux (sécheresse, inondation, pollution)
- Densité d'opérateurs bio par zone
- Ratios concurrentiels par secteur

*Note : En production, ces données peuvent être remplacées par des appels réels aux APIs publiques (INSEE, data.gouv.fr, GéoRisques, Agreste).*
