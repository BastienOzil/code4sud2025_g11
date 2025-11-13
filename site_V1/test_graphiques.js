/**
 * Test des graphiques avec données JSON simulées de deepseek-r1:8b
 */

// Données JSON simulées comme celles que deepseek-r1:8b pourrait retourner
const mockAIResponse = {
  "metadonnees_analyse": {
    "zone_analysee": "Nice",
    "segment_analyse": "Maraîchage Bio", 
    "date_analyse": "2025-11-13T10:30:00Z"
  },
  "kpi_synthese": {
    "score_opportunite": 8.5,
    "score_viabilite": 6.2,
    "saturation_marche": "Faible",
    "pression_commerciale": "Élevée (48 952 hab/acteur)",
    "pouvoir_achat_local": "Légèrement au-dessus (Indice 105)",
    "risque_environnemental": "Modéré (Indice 6.5/10)"
  },
  "analyse_textuelle_generale": "L'analyse pour Nice révèle une opportunité forte (8.5/10) grâce à une pression commerciale élevée et un pouvoir d'achat favorable. Cependant, la viabilité est tempérée par les risques climatiques méditerranéens.",
  "swot_externe": {
    "opportunites": [
      "Forte pression commerciale (48 952 hab/acteur)",
      "Pouvoir d'achat supérieur à la moyenne nationale",
      "Faible saturation du marché bio",
      "Climat méditerranéen favorable au maraîchage"
    ],
    "menaces": [
      "Risque de sécheresse élevé (6 arrêtés CATNAT)",
      "Concurrence des importations italiennes",
      "Coût foncier élevé sur la Côte d'Azur",
      "Surveillance environnementale renforcée"
    ]
  },
  "kpi_detailles_bruts": [
    { "label": "Population (Zone)", "valeur": "342 669 hab", "source": "API Géo" },
    { "label": "Revenu Médian (Zone)", "valeur": "21 800 €", "source": "BDD FILOSOFI" },
    { "label": "Nb. Opérateurs Bio (Total)", "valeur": "28", "source": "API Agence Bio" },
    { "label": "Nb. Concurrents Directs", "valeur": "7", "source": "API Agence Bio" },
    { "label": "Surface Bio (Dpt)", "valeur": "2 800 Ha", "source": "BDD Agreste" },
    { "label": "Hist. Sécheresse (CATNAT)", "valeur": "6 arrêtés", "source": "API GéoRisques" },
    { "label": "Taux Pauvreté (%)", "valeur": "18%", "source": "INSEE" }
  ]
};

console.log('📊 TEST DES GRAPHIQUES AVEC DONNÉES IA');
console.log('=' .repeat(50));
console.log('');
console.log('🤖 Données simulées de deepseek-r1:8b:');
console.log('- Score Opportunité:', mockAIResponse.kpi_synthese.score_opportunite);
console.log('- Score Viabilité:', mockAIResponse.kpi_synthese.score_viabilite);
console.log('- Saturation Marché:', mockAIResponse.kpi_synthese.saturation_marche);
console.log('- Nombre de KPI détaillés:', mockAIResponse.kpi_detailles_bruts.length);
console.log('');

console.log('📈 KPI Détaillés pour graphiques:');
mockAIResponse.kpi_detailles_bruts.forEach((kpi, index) => {
    const valStr = String(kpi.valeur);
    const numbers = valStr.match(/[\d\s]+/g);
    let numValue = 0;
    if (numbers) {
        numValue = parseInt(numbers[0].replace(/\s/g, '')) || 0;
    }
    console.log(`${index + 1}. ${kpi.label}: ${kpi.valeur} (Valeur numérique: ${numValue})`);
});

console.log('');
console.log('📋 SWOT Externe:');
console.log('✅ Opportunités:', mockAIResponse.swot_externe.opportunites.length, 'éléments');
console.log('⚠️  Menaces:', mockAIResponse.swot_externe.menaces.length, 'éléments');
console.log('');

console.log('🎯 Les graphiques suivants seront générés:');
console.log('1. Graphique Radar: Scores Opportunité vs Viabilité');
console.log('2. Graphique Barres: Données détaillées (population, revenus, etc.)');
console.log('3. Cartes KPI: Synthèse visuelle des scores');
console.log('');

console.log('✨ Pour tester les graphiques:');
console.log('1. Accédez à http://localhost:3000');
console.log('2. Remplissez le formulaire');
console.log('3. Les graphiques s\'afficheront automatiquement avec les données de deepseek-r1:8b');