#!/usr/bin/env node

/**
 * Test script to validate Super-Prompt integration without calling Ollama
 * This shows exactly what prompt would be sent to the AI model
 */

const path = require('path');

// Import the buildPrompt function from server.js (simulate)
function buildPrompt({ sector, location, data }) {
  if (!data) {
    throw new Error('Data is required for Super-Prompt');
  }

  const dataJson = JSON.stringify(data, null, 2);

  const prompt = `Rôle : Tu es un consultant senior en étude de marché, spécialisé dans l'agriculture biologique et l'économie locale française. Ton analyse est destinée à un entrepreneur.

Contexte National (Statique) : Le marché français du bio croît de 5% par an. Le revenu médian national est de 23 160 €.

Données Locales (Input) : Voici les données brutes que tu dois analyser pour la zone ciblée.

\`\`\`json
${dataJson}
\`\`\`

Tâche et Étapes à Suivre :

1.  Calculer les KPI de Synthèse : Calcule les scores (Opportunité, Viabilité, etc.) et les ratios clés (Pression Commerciale).
2.  Rédiger l'Analyse Textuelle : Rédige un paragraphe de synthèse (\`analyse_textuelle_generale\`). Tu dois *interpréter* les chiffres : explique *pourquoi* le score d'opportunité est bon (ex: à cause de la \`pression_commerciale\`) et *pourquoi* le score de viabilité est mauvais (ex: à cause des \`hist_secheresse_catnat\` et \`risque_pollution_basol\`).
3.  Rédiger le SWOT Externe : Identifie et liste les 'Opportunités' (points positifs des données) et les 'Menaces' (points négatifs/risques).
4.  Lister les Données Brutes : Formate les données brutes les plus importantes dans la section \`kpi_detailles_bruts\`.
5.  Être Concluant : Ton ton doit être professionnel et direct.

Format de Sortie OBLIGATOIRE :
Ta réponse doit être *uniquement* un objet JSON valide, sans aucun texte avant ou après. Elle doit suivre *strictement* cette structure :

\`\`\`json
{
  "metadonnees_analyse": {
    "zone_analysee": "...",
    "segment_analyse": "...",
    "date_analyse": "..."
  },
  "kpi_synthese": {
    "score_opportunite": 0.0,
    "score_viabilite": 0.0,
    "saturation_marche": "...",
    "pression_commerciale": "...",
    "pouvoir_achat_local": "...",
    "risque_environnemental": "..."
  },
  "analyse_textuelle_generale": "...",
  "swot_externe": {
    "opportunites": [
      "..."
    ],
    "menaces": [
      "..."
    ]
  },
  "kpi_detailles_bruts": [
    { "label": "Population (Zone)", "valeur": "...", "source": "API Géo" },
    { "label": "Revenu Médian (Zone)", "valeur": "...", "source": "BDD FILOSOFI" }
  ]
}
\`\`\``;

  return prompt;
}

// Test data (same structure as frontend builds)
const testData = {
  zone_analysee: "Nice",
  segment_analyse: "Maraîchage Bio",
  population: 342669,
  surface_km2: 71.9,
  revenu_median: 21800,
  taux_pauvrete: 18,
  nb_operateurs_bio_total: 28,
  nb_concurrents_directs: 7,
  ventilation_acteurs: {
    producteurs: 7,
    transformateurs: 10,
    distributeurs: 11
  },
  surface_bio_hectares: 2800,
  risque_pollution_basol: "Surveillance renforcée",
  risque_inondation_azi: "Modéré",
  hist_secheresse_catnat: 6,
  hist_inondation_catnat: 3
};

console.log('🧪 TEST SUPER-PROMPT INTEGRATION');
console.log('=' .repeat(50));
console.log('');

try {
  const prompt = buildPrompt({
    sector: "Maraîchage Bio",
    location: "Nice", 
    data: testData
  });

  console.log('✅ Super-Prompt généré avec succès !');
  console.log('');
  console.log('📏 Longueur du prompt:', prompt.length, 'caractères');
  console.log('');
  console.log('🔍 Aperçu du prompt (200 premiers caractères):');
  console.log('-'.repeat(50));
  console.log(prompt.substring(0, 200) + '...');
  console.log('-'.repeat(50));
  console.log('');
  
  console.log('📋 Données incluses dans le prompt:');
  console.log('- Zone analysée:', testData.zone_analysee);
  console.log('- Segment:', testData.segment_analyse);  
  console.log('- Population:', testData.population.toLocaleString());
  console.log('- Concurrents directs:', testData.nb_concurrents_directs);
  console.log('- Risques identifiés:', testData.hist_secheresse_catnat, 'sécheresses,', testData.hist_inondation_catnat, 'inondations');
  console.log('');

  console.log('✨ Le Super-Prompt est prêt à être envoyé à Ollama !');
  console.log('');
  console.log('📌 Commande pour tester avec Ollama:');
  console.log('echo "' + prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '" | ollama run deepseek-r1:8b');
  
} catch (error) {
  console.error('❌ Erreur lors de la génération du Super-Prompt:', error.message);
}