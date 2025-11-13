const express = require('express');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '1mb' }));

// Servir les fichiers statiques (html, css, js)
app.use(express.static(path.join(__dirname)));

// Route pour servir index.html à la racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

// Health check: vérifier si Ollama CLI est présent (très simple)
app.get('/api/health', async (req, res) => {
  // Vérifier si OLLAMA_HTTP_URL est défini (utiliser HTTP API) — simple probe
  const ollamaHttp = process.env.OLLAMA_HTTP_URL;
  if (ollamaHttp) {
    return res.json({ ia_status: 'available', ollama_mode: 'http', ollama_http: ollamaHttp });
  }

  // Sinon tester la présence de la CLI
  exec('ollama --version', (err, stdout, stderr) => {
    if (err) {
      return res.json({ ia_status: 'unavailable', error: 'ollama cli not found' });
    }
    return res.json({ ia_status: 'available', ollama_mode: 'cli', ollama_version: stdout.trim() });
  });
});

// Endpoint principal: /api/analyze
// Expects JSON body: { sector: string, location?: string, data?: { ... } }
app.post('/api/analyze', async (req, res) => {
  const { sector, location, data } = req.body || {};

  if (!sector) return res.status(400).json({ error: 'sector is required' });

  // Build a prompt for the model. We provide clear instructions to return JSON only
  const prompt = buildPrompt({ sector, location, data });

  try {
    const ollamaHttp = process.env.OLLAMA_HTTP_URL;
    let rawOutput = null;

    if (ollamaHttp) {
      // If the user configured an Ollama HTTP endpoint, POST to it.
      // We don't include axios as dependency to keep package small; use a child_process curl as fallback
      rawOutput = await runHttpOllama(ollamaHttp, prompt);
    } else {
      rawOutput = await runOllamaCLI(prompt, { model: 'deepseek-r1:8b', timeout: 300000 });
    }

    // Try to extract JSON from the model output
    const json = extractJson(rawOutput);
    if (!json) {
      console.log('Failed to parse JSON from deepseek-r1:8b:', rawOutput.substring(0, 500));
      return res.status(502).json({ 
        error: 'deepseek-r1:8b did not return valid JSON', 
        raw: rawOutput.substring(0, 1000),
        suggestion: 'Try with a simpler sector or location'
      });
    }

    // Attach metadata and return optimized response
    const response = {
      ...json,
      sector,
      location,
      timestamp: new Date().toISOString(),
      ollama_enabled: true,
      model_used: 'deepseek-r1:8b',
      processing_time: Date.now() - Date.now() // Will be calculated by frontend
    };
    
    return res.json(response);
  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ error: 'internal_error', detail: String(err) });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (serving static files from ${__dirname})`);
});

// Utilities
function buildPrompt({ sector, location, data }) {
  if (!data) {
    throw new Error('Data is required for analysis');
  }

  // Calculs automatiques pour aider l'IA
  const pressionCommerciale = Math.round(data.population / data.nb_concurrents_directs);
  const indicePouvoirAchat = Math.round((data.revenu_median / 23160) * 100);
  const densiteBio = Math.round(data.surface_bio_hectares / data.surface_km2);

  const prompt = `Analyse ${sector} pour ${data.zone_analysee}. Utilise ces données pour calculer les scores et commenter l'état du marché:

DONNÉES API:
${JSON.stringify(data, null, 2)}

CALCULS AUTOMATIQUES:
- Pression commerciale: ${pressionCommerciale} hab/acteur
- Indice pouvoir d'achat: ${indicePouvoirAchat} (base 100 = moyenne nationale)
- Densité bio: ${densiteBio} Ha/km²

MISSION: Analyse ces données et réponds par ce JSON exact:

{
  "metadonnees_analyse": {
    "zone_analysee": "${data.zone_analysee}",
    "segment_analyse": "${data.segment_analyse}",
    "date_analyse": "${new Date().toISOString()}"
  },
  "kpi_synthese": {
    "score_opportunite": [note sur 10 basée sur pression commerciale et marché],
    "score_viabilite": [note sur 10 basée sur risques environnementaux],
    "saturation_marche": "[Faible/Moyenne/Élevée selon nb_concurrents_directs vs population]",
    "pression_commerciale": "${pressionCommerciale} hab/acteur",
    "pouvoir_achat_local": "Indice ${indicePouvoirAchat} (${indicePouvoirAchat > 100 ? 'Supérieur' : indicePouvoirAchat < 95 ? 'Inférieur' : 'Aligné'} à la moyenne)",
    "risque_environnemental": "[Évalue selon hist_secheresse_catnat et risque_pollution_basol]"
  },
  "commentaire_marche": {
    "etat_general": "[Analyse globale du marché en 2-3 phrases]",
    "facteurs_cles": "[Points déterminants pour réussir sur ce marché]",
    "recommandations_graphiques": {
      "graphique_1": "Graphique en camembert: Répartition des ${data.nb_operateurs_bio_total} opérateurs bio (Producteurs: ${data.ventilation_acteurs.producteurs}, Transformateurs: ${data.ventilation_acteurs.transformateurs}, Distributeurs: ${data.ventilation_acteurs.distributeurs})",
      "graphique_2": "Graphique en barres: Comparaison revenus (${data.zone_analysee}: ${data.revenu_median}€ vs France: 23160€)",
      "graphique_3": "Indicateur de risque: ${data.hist_secheresse_catnat} sécheresses + ${data.hist_inondation_catnat} inondations sur zone de ${data.surface_km2} km²"
    }
  },
  "swot_externe": {
    "opportunites": ["[Basé sur les forces des données]"],
    "menaces": ["[Basé sur les faiblesses des données]"]
  },
  "kpi_detailles_bruts": [
    {"label": "Population (Zone)", "valeur": "${data.population.toLocaleString()}", "source": "API Géo"},
    {"label": "Revenu Médian", "valeur": "${data.revenu_median}€", "source": "BDD FILOSOFI"},
    {"label": "Surface Bio", "valeur": "${data.surface_bio_hectares} Ha", "source": "BDD Agreste"},
    {"label": "Concurrents Directs", "valeur": "${data.nb_concurrents_directs}", "source": "API Agence Bio"},
    {"label": "Taux Pauvreté", "valeur": "${data.taux_pauvrete}%", "source": "INSEE"},
    {"label": "Risque Sécheresse", "valeur": "${data.hist_secheresse_catnat} arrêtés CATNAT", "source": "API GéoRisques"}
  ]
}`;

  return prompt;
}

function runOllamaCLI(prompt, opts = {}) {
  const model = 'deepseek-r1:8b';
  const timeout = 60000; // Réduit à 60s pour plus de rapidité

  return new Promise((resolve, reject) => {
    // Options optimisées pour deepseek-r1:8b
    const proc = spawn('ollama', ['run', model], { 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        OLLAMA_NUM_PARALLEL: '1',
        OLLAMA_MAX_LOADED_MODELS: '1'
      }
    });

    let stdout = '';
    let stderr = '';
    let responseStarted = false;

    proc.stdout.on('data', (chunk) => {
      const data = chunk.toString('utf8');
      stdout += data;
      
      // Détecter le début de la réponse JSON pour optimiser
      if (!responseStarted && data.includes('{')) {
        responseStarted = true;
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    proc.on('error', (err) => {
      reject(new Error(`Ollama process error: ${err.message}`));
    });

    proc.on('close', (code) => {
      // Nettoyage de la sortie pour deepseek-r1:8b
      let cleanOutput = stdout.trim();
      
      // Supprimer les messages de "thinking" si présents
      cleanOutput = cleanOutput.replace(/Thinking\.\.\.|\.\.\.done thinking\./g, '');
      cleanOutput = cleanOutput.replace(/^[^{]*/, ''); // Supprimer tout avant le premier {
      cleanOutput = cleanOutput.replace(/[^}]*$/, '}'); // S'assurer que ça finit par }
      
      resolve(cleanOutput || stderr);
    });

    // Prompt optimisé avec paramètres
    const optimizedPrompt = `${prompt}\n\nRéponds immédiatement par le JSON demandé:`;
    proc.stdin.write(optimizedPrompt);
    proc.stdin.end();

    // Timeout réduit
    setTimeout(() => {
      try { 
        proc.kill('SIGTERM');
        setTimeout(() => proc.kill('SIGKILL'), 2000);
      } catch (e) {}
      resolve(stdout || 'Timeout: analyse trop longue');
    }, timeout);
  });
}

function runHttpOllama(url, prompt) {
  // Lightweight approach: try to use curl via child_process to POST JSON.
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ model: 'deepseek-r1:8b', prompt });
    const curl = spawn('curl', ['-s', '-X', 'POST', '-H', 'Content-Type: application/json', url, '-d', payload]);

    let out = '';
    let err = '';
    curl.stdout.on('data', (c) => out += c.toString('utf8'));
    curl.stderr.on('data', (c) => err += c.toString('utf8'));
    curl.on('close', (code) => {
      if (code !== 0) return reject(new Error('curl failed: ' + err));
      resolve(out);
    });
    curl.on('error', (e) => reject(e));
  });
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Nettoyage spécifique pour deepseek-r1:8b
  let cleaned = text.trim();
  
  // Supprimer les messages de thinking
  cleaned = cleaned.replace(/Thinking\.\.\.|\.\.\.done thinking\./g, '');
  cleaned = cleaned.replace(/^.*?(?=\{)/s, ''); // Tout avant le premier {
  cleaned = cleaned.replace(/\}.*$/s, '}'); // Tout après le dernier }
  
  // Supprimer les caractères de contrôle et ANSI
  cleaned = cleaned.replace(/\u001b\[[0-9;]*m/g, '');
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Tentative de réparation automatique pour deepseek-r1:8b
    try {
      // Ajouter des guillemets manquants autour des valeurs numériques dans les strings
      let repaired = cleaned.replace(/("score_\w+":\s*)(\d+\.?\d*)/g, '$1$2');
      return JSON.parse(repaired);
    } catch (e2) {
      console.error('JSON parse failed:', e2.message);
      console.error('Raw text:', text.substring(0, 200));
      return null;
    }
  }
}
