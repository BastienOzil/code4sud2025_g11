// Configuration
const API_URL = window.location.origin;
// Détecter mode statique (ouverture file://) et état du backend
const IS_STATIC = window.location.protocol === 'file:';
let BACKEND_AVAILABLE = false;

// Elements DOM
const analyzeForm = document.getElementById('analyzeForm');
const loadingDiv = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const resultsContent = document.getElementById('resultsContent');
const locationInput = document.getElementById('location');
const geolocateBtn = document.getElementById('geolocateBtn');

// Variables pour la carte
let map = null;
let marker = null;
let selectedLocation = null;

// Event Listeners
analyzeForm.addEventListener('submit', handleAnalyze);
geolocateBtn.addEventListener('click', handleGeolocation);

/**
 * Gérer la soumission du formulaire d'analyse
 */
async function handleAnalyze(e) {
    e.preventDefault();
    
    const sector = document.getElementById('sector').value.trim();
    const location = document.getElementById('location').value.trim();
    
    if (!sector) {
        alert('Veuillez entrer un secteur d\'activité');
        return;
    }
    
    // Afficher le loading
    showLoading();
    hideResults();
    
    // Mesurer le temps
    const startTime = Date.now();
    
    // Si mode statique ou backend indisponible, afficher résultats mock côté client
    if (IS_STATIC || !BACKEND_AVAILABLE) {
        // Simuler un petit délai
        setTimeout(() => {
            const now = new Date();
            const mockData = {
                sector,
                location,
                timestamp: now.toISOString(),
                client_time: ((Date.now() - startTime) / 1000).toFixed(1),
                ia_enabled: false,
                ai_analysis: null,
                market_steps: {
                    step1: { title: 'Taille du marché 📊', insights: ['1️⃣ 8 datasets trouvés', '2️⃣ ~15 ressources et rapports disponibles', 'Le marché semble de taille moyen/grand'] },
                    step2: { title: 'Clientèle cible 👥', insights: ['Jeunes professionnels: 25-34 ans', 'PME locales', 'Consommateurs urbains'] },
                    step3: { title: 'Offre concurrentielle', insights: ['Principaux concurrents locaux identifiés', 'Barrières à l\'entrée modérées'] },
                    step4: { title: 'Synthèse', insights: ['Opportunité pour un service différencié à valeur ajoutée'] },
                    step5: { title: 'Rentabilité', insights: ['Marge attendue: moyenne', 'Seuil de rentabilité: 12-18 mois'] }
                },
                datasets_found: [ { title: `${sector} - Dataset public exemple`, description: 'Description synthétique du dataset public.', organization: 'Data.gouv.fr', resources_count: 3, url: 'https://www.data.gouv.fr' } ],
                search_terms_used: [sector, location || 'France'],
                recommendations: [ { category: 'Action', priority: 'high', text: 'Télécharger les datasets et analyser les tendances' } ]
            };

            displayResults(mockData);
            hideLoading();
        }, 600);

        return;
    }

    try {
        // Collect real data from public APIs and build the exact JSON structure for Super-Prompt
        const analysisData = await buildAnalysisData(sector, location, selectedLocation);

        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sector, location, data: analysisData })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'analyse');
        }

        const data = await response.json();

        // Calculer le temps écoulé
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        data.client_time = elapsedTime;

        displayResults(data);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur s\'est produite lors de l\'analyse. Veuillez r\'essayer.');
    } finally {
        hideLoading();
    }
}

/**
 * Nettoyer les emojis d'un texte
 */
function cleanEmojis(text) {
    if (!text) return '';
    // Remplacer les emojis de numéros par du texte simple
    return text
        .replace(/1️⃣/g, 'Étape 1 -')
        .replace(/2️⃣/g, 'Étape 2 -')
        .replace(/3️⃣/g, 'Étape 3 -')
        .replace(/4️⃣/g, 'Étape 4 -')
        .replace(/5️⃣/g, 'Étape 5 -')
        .replace(/📊/g, '')
        .replace(/👥/g, '')
        .replace(/🏢/g, '')
        .replace(/🎯/g, '')
        .replace(/📋/g, '')
        .replace(/💰/g, '')
        .replace(/✅/g, '')
        .replace(/⚠️/g, '')
        .replace(/💡/g, '')
        .replace(/📍/g, '')
        .replace(/📁/g, '')
        .replace(/🔑/g, '')
        .trim();
}

/**
 * Formater les insights sous forme de liste
 */
function formatInsights(insights) {
    if (!insights || insights.length === 0) return '<p>Aucune information disponible</p>';
    
    let html = '<ul class="insights-list">';
    insights.forEach(insight => {
        const cleanInsight = cleanEmojis(insight);
        if (cleanInsight) {
            html += `<li>${escapeHtml(cleanInsight)}</li>`;
        }
    });
    html += '</ul>';
    return html;
}

/**
 * Créer un graphique pour l'étape 1 (Taille du marché)
 */
function createStep1Chart(step1Data, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extraire les données du texte
    let datasetsCount = 0;
    let resourcesCount = 0;
    let marketSize = 'moyen';
    
    step1Data.insights.forEach(insight => {
        const match = insight.match(/(\d+)\s+datasets/i);
        if (match) datasetsCount = parseInt(match[1]);
        
        const matchResources = insight.match(/(\d+)\s+ressources/i);
        if (matchResources) resourcesCount = parseInt(matchResources[1]);
        
        if (insight.includes('grand')) marketSize = 'grand';
        else if (insight.includes('niche')) marketSize = 'niche';
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Datasets trouvés', 'Ressources disponibles'],
            datasets: [{
                data: [datasetsCount, resourcesCount],
                backgroundColor: ['#0078D4', '#34A853'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: `Taille du marché: ${marketSize.toUpperCase()}`
                }
            }
        }
    });
}

/**
 * Créer un graphique pour l'étape 2 (Clientèle cible)
 */
function createStep2Chart(step2Data, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extraire les personas du texte
    const personas = [];
    step2Data.insights.forEach(insight => {
        const cleanText = cleanEmojis(insight);
        if (cleanText.includes(':')) {
            const parts = cleanText.split(':');
            if (parts.length > 1) {
                personas.push(parts[0].trim());
            }
        }
    });
    
    if (personas.length > 0) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: personas,
                datasets: [{
                    label: 'Segments identifiés',
                    data: personas.map(() => 1),
                    backgroundColor: '#0078D4',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Segments de clientèle cible'
                    }
                },
                scales: {
                    x: {
                        display: false
                    }
                }
            }
        });
    }
}

/**
 * Afficher les résultats de l'analyse selon le format JSON exact du Super-Prompt
 */
function displayResults(data) {
    let html = '';
    
    // Check if this is the expected JSON structure from Super-Prompt
    if (data.metadonnees_analyse && data.kpi_synthese && data.swot_externe) {
        // Display results from Super-Prompt JSON response
        html = displaySuperPromptResults(data);
    } else {
        // Fallback to original display for backward compatibility
        html = displayLegacyResults(data);
    }
    
    resultsContent.innerHTML = html;
    showResults();
    
    // Créer les graphiques basés sur les données JSON de deepseek-r1:8b
    setTimeout(() => {
        if (data.metadonnees_analyse && data.kpi_synthese) {
            createAIResultCharts(data);
        }
    }, 100);
}

/**
 * Display results from Super-Prompt JSON structure with market commentary
 */
function displaySuperPromptResults(data) {
    const metadata = data.metadonnees_analyse;
    const kpi = data.kpi_synthese;
    const swot = data.swot_externe;
    const kpiDetails = data.kpi_detailles_bruts || [];
    const commentaire = data.commentaire_marche;
    
    let html = `
        <div class="result-item" style="background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border-left: 4px solid #0078D4;">
            <h3>🤖 Analyse IA deepseek-r1:8b - ${metadata.segment_analyse}</h3>
            <div class="metadata-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0;">
                <div><strong>Zone analysée:</strong> ${metadata.zone_analysee}</div>
                <div><strong>Segment:</strong> ${metadata.segment_analyse}</div>
                <div><strong>Date d'analyse:</strong> ${new Date(metadata.date_analyse).toLocaleString('fr-FR')}</div>
                ${data.client_time ? `<div><strong>Temps d'analyse:</strong> <span style="color: #34A853; font-weight: 600;">${data.client_time}s</span></div>` : ''}
                <div><strong>Modèle IA:</strong> <span style="color: #0078D4;">deepseek-r1:8b</span></div>
            </div>
        </div>
    `;

    // KPI de Synthèse avec Graphiques
    html += `
        <div class="result-item" style="background: linear-gradient(135deg, #E8F8F5 0%, #D4EDDA 100%); border-left: 4px solid #34A853;">
            <h3>🎯 KPI de Synthèse</h3>
            <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0;">
                <div class="kpi-card" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #0078D4;">${kpi.score_opportunite}/10</div>
                    <div>Score Opportunité</div>
                </div>
                <div class="kpi-card" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #EA4335;">${kpi.score_viabilite}/10</div>
                    <div>Score Viabilité</div>
                </div>
                <div class="kpi-card" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-weight: bold;">${kpi.saturation_marche}</div>
                    <div>Saturation Marché</div>
                </div>
            </div>
            
            <!-- Graphique des Scores -->
            <div class="chart-container" style="margin: 20px 0; background: white; padding: 20px; border-radius: 8px;">
                <canvas id="scoresChart" width="400" height="200"></canvas>
            </div>
            
            <div class="kpi-details" style="margin-top: 15px;">
                <p><strong>Pression Commerciale:</strong> ${kpi.pression_commerciale}</p>
                <p><strong>Pouvoir d'Achat Local:</strong> ${kpi.pouvoir_achat_local}</p>
                <p><strong>Risque Environnemental:</strong> ${kpi.risque_environnemental}</p>
            </div>
        </div>
    `;

    // Commentaire de Marché par l'IA
    if (commentaire) {
        html += `
            <div class="result-item" style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border-left: 4px solid #FF9800;">
                <h3>💬 Commentaire IA sur l'État du Marché</h3>
                <div style="margin: 15px 0;">
                    <h4 style="color: #E65100; margin-bottom: 10px;">📈 État Général</h4>
                    <div style="line-height: 1.8; font-size: 16px; margin-bottom: 20px;">
                        ${escapeHtml(commentaire.etat_general || 'Non fourni')}
                    </div>
                    
                    <h4 style="color: #E65100; margin-bottom: 10px;">🎯 Facteurs Clés de Succès</h4>
                    <div style="line-height: 1.8; font-size: 16px; margin-bottom: 20px;">
                        ${escapeHtml(commentaire.facteurs_cles || 'Non fourni')}
                    </div>
                </div>
            </div>
        `;

        // Recommandations graphiques de l'IA
        if (commentaire.recommandations_graphiques) {
            html += `
                <div class="result-item" style="background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%); border-left: 4px solid #9C27B0;">
                    <h3>📊 Recommandations Graphiques de l'IA</h3>
                    <div class="graphiques-recommendations">
            `;
            
            Object.entries(commentaire.recommandations_graphiques).forEach(([key, recommendation]) => {
                html += `
                    <div class="graphique-recommendation" style="margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                        <strong>${key.replace('_', ' ').toUpperCase()}:</strong>
                        <p style="margin: 5px 0; font-style: italic;">${escapeHtml(recommendation)}</p>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    }

    // Analyse Textuelle Générale (fallback)
    if (data.analyse_textuelle_generale && !commentaire) {
        html += `
            <div class="result-item" style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border-left: 4px solid #FF9800;">
                <h3>📝 Analyse Générale</h3>
                <div style="line-height: 1.8; font-size: 16px; text-align: justify;">
                    ${escapeHtml(data.analyse_textuelle_generale)}
                </div>
            </div>
        `;
    }

    // SWOT Externe
    if (swot.opportunites || swot.menaces) {
        html += `
            <div class="result-item" style="background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%); border-left: 4px solid #9C27B0;">
                <h3>🔍 Analyse SWOT Externe</h3>
                <div class="swot-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        `;
        
        if (swot.opportunites && swot.opportunites.length > 0) {
            html += `
                <div class="swot-section">
                    <h4 style="color: #34A853; margin-bottom: 15px;">✅ Opportunités</h4>
                    <ul class="swot-list" style="list-style: none; padding: 0;">
            `;
            swot.opportunites.forEach(opp => {
                html += `<li style="margin-bottom: 8px; padding: 8px; background: rgba(52, 168, 83, 0.1); border-radius: 4px;">• ${escapeHtml(opp)}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (swot.menaces && swot.menaces.length > 0) {
            html += `
                <div class="swot-section">
                    <h4 style="color: #EA4335; margin-bottom: 15px;">⚠️ Menaces</h4>
                    <ul class="swot-list" style="list-style: none; padding: 0;">
            `;
            swot.menaces.forEach(menace => {
                html += `<li style="margin-bottom: 8px; padding: 8px; background: rgba(234, 67, 53, 0.1); border-radius: 4px;">• ${escapeHtml(menace)}</li>`;
            });
            html += `</ul></div>`;
        }
        
        html += `</div></div>`;
    }

    // KPI Détaillés Bruts avec Graphiques
    if (kpiDetails.length > 0) {
        html += `
            <div class="result-item">
                <h3>📈 Données Brutes Détaillées</h3>
                
                <!-- Graphique des données détaillées -->
                <div class="chart-container" style="margin: 20px 0; background: white; padding: 20px; border-radius: 8px;">
                    <canvas id="kpiDetailsChart" width="400" height="300"></canvas>
                </div>
                
                <div class="kpi-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0;">
        `;
        
        kpiDetails.forEach(kpi => {
            html += `
                <div class="kpi-detail-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 3px solid #0078D4;">
                    <div style="font-weight: bold; color: #333;">${escapeHtml(kpi.label)}</div>
                    <div style="font-size: 18px; color: #0078D4; margin: 5px 0;">${escapeHtml(kpi.valeur)}</div>
                    <div style="font-size: 12px; color: #666;">Source: ${escapeHtml(kpi.source)}</div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }

    return html;
}

/**
 * Créer les graphiques basés sur les données JSON et recommandations de l'IA deepseek-r1:8b
 */
function createAIResultCharts(data) {
    const kpi = data.kpi_synthese;
    const kpiDetails = data.kpi_detailles_bruts || [];
    const commentaire = data.commentaire_marche;
    
    // Graphique des scores (Opportunité vs Viabilité)
    createScoresChart(kpi);
    
    // Graphiques recommandés par l'IA si disponibles
    if (commentaire && commentaire.recommandations_graphiques) {
        createAIRecommendedCharts(data, kpiDetails);
    } else if (kpiDetails.length > 0) {
        // Graphique des données détaillées (fallback)
        createKpiDetailsChart(kpiDetails);
    }
}

/**
 * Créer les graphiques recommandés par l'IA deepseek-r1:8b
 */
function createAIRecommendedCharts(data, kpiDetails) {
    const commentaire = data.commentaire_marche;
    const recommendations = commentaire.recommandations_graphiques;
    
    if (!recommendations || recommendations.length === 0) {
        createKpiDetailsChart(kpiDetails);
        return;
    }
    
    // Créer les graphiques selon les recommandations de l'IA
    recommendations.forEach((rec, index) => {
        const canvasId = `ai-chart-${index}`;
        
        // Ajouter un canvas pour chaque graphique recommandé
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.innerHTML = `
            <h4>${rec.titre || 'Graphique recommandé'}</h4>
            <canvas id="${canvasId}" width="400" height="300"></canvas>
            <p class="chart-description">${rec.description || ''}</p>
        `;
        
        const resultDiv = document.getElementById('analysis-result');
        resultDiv.appendChild(chartContainer);
        
        // Créer le graphique selon le type recommandé
        createRecommendedChart(canvasId, rec, data, kpiDetails);
    });
}

/**
 * Créer un graphique spécifique selon la recommandation de l'IA
 */
function createRecommendedChart(canvasId, recommendation, data, kpiDetails) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    
    const type = recommendation.type || 'bar';
    const titre = recommendation.titre || 'Analyse de marché';
    
    // Construire les données selon le type de graphique
    let chartData;
    
    switch (type) {
        case 'radar':
            chartData = createRadarChartData(data, kpiDetails);
            break;
        case 'line':
            chartData = createLineChartData(data, kpiDetails);
            break;
        case 'pie':
            chartData = createPieChartData(data, kpiDetails);
            break;
        default: // 'bar'
            chartData = createBarChartData(data, kpiDetails);
    }
    
    new Chart(ctx, {
        type: type,
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: titre
                }
            }
        }
    });
}

/**
 * Créer les données pour un graphique radar
 */
function createRadarChartData(data, kpiDetails) {
    const kpi = data.kpi_synthese;
    return {
        labels: ['Opportunité', 'Viabilité', 'Concurrence', 'Potentiel', 'Risques'],
        datasets: [{
            label: 'Analyse de marché',
            data: [
                kpi.score_opportunite || 0,
                kpi.score_viabilite || 0,
                Math.max(0, 100 - (kpi.niveau_concurrence || 50)),
                kpi.potentiel_croissance || 50,
                Math.max(0, 100 - (kpi.niveau_risque || 50))
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
        }]
    };
}

/**
 * Créer les données pour un graphique en ligne
 */
function createLineChartData(data, kpiDetails) {
    if (kpiDetails && kpiDetails.length > 0) {
        return {
            labels: kpiDetails.map((item, i) => `Indicateur ${i + 1}`),
            datasets: [{
                label: 'Évolution des KPI',
                data: kpiDetails.map(item => item.valeur || 0),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }]
        };
    }
    
    return createBarChartData(data, kpiDetails);
}

/**
 * Créer les données pour un graphique circulaire
 */
function createPieChartData(data, kpiDetails) {
    const kpi = data.kpi_synthese;
    return {
        labels: ['Opportunité', 'Viabilité', 'Autres facteurs'],
        datasets: [{
            data: [
                kpi.score_opportunite || 0,
                kpi.score_viabilite || 0,
                Math.abs(100 - (kpi.score_opportunite || 0) - (kpi.score_viabilite || 0))
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)'
            ]
        }]
    };
}

/**
 * Créer les données pour un graphique en barres
 */
function createBarChartData(data, kpiDetails) {
    const kpi = data.kpi_synthese;
    return {
        labels: ['Opportunité', 'Viabilité', 'Score Global'],
        datasets: [{
            label: 'Scores d\'analyse',
            data: [
                kpi.score_opportunite || 0,
                kpi.score_viabilite || 0,
                kpi.score_global || 0
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(75, 192, 192, 0.8)'
            ]
        }]
    };
}

/**
 * Graphique radar pour les scores d'opportunité et viabilité
 */
function createScoresChart(kpi) {
    const canvas = document.getElementById('scoresChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extraire les valeurs numériques
    const opportunite = parseFloat(kpi.score_opportunite) || 0;
    const viabilite = parseFloat(kpi.score_viabilite) || 0;
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Opportunité', 'Viabilité', 'Potentiel Global'],
            datasets: [{
                label: 'Analyse IA deepseek-r1:8b',
                data: [opportunite, viabilite, (opportunite + viabilite) / 2],
                backgroundColor: 'rgba(0, 120, 212, 0.2)',
                borderColor: 'rgba(0, 120, 212, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(0, 120, 212, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(0, 120, 212, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Analyse IA: ${kpi.saturation_marche} - Scores de Performance`
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Graphique en barres pour les données détaillées
 */
function createKpiDetailsChart(kpiDetails) {
    const canvas = document.getElementById('kpiDetailsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Extraire les données numériques des KPI
    const labels = [];
    const values = [];
    const colors = [
        '#0078D4', '#34A853', '#EA4335', '#FBBC04', '#9C27B0', 
        '#FF9800', '#795548', '#607D8B', '#E91E63', '#009688'
    ];
    
    kpiDetails.forEach((kpi, index) => {
        labels.push(kpi.label.replace(/ \(.*?\)/g, '')); // Enlever les parenthèses
        
        // Extraire le nombre de la valeur (gérer différents formats)
        const valStr = String(kpi.valeur);
        let numValue = 0;
        
        // Chercher des nombres dans la chaîne
        const numbers = valStr.match(/[\d\s]+/g);
        if (numbers) {
            numValue = parseInt(numbers[0].replace(/\s/g, '')) || 0;
        }
        
        // Normalisation pour l'affichage (éviter les valeurs trop grandes)
        if (numValue > 100000) {
            numValue = Math.round(numValue / 1000); // En milliers
            labels[labels.length - 1] += ' (k)';
        }
        
        values.push(numValue);
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Données analysées par IA',
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderColor: colors.slice(0, values.length).map(color => color + '80'),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Barres horizontales pour les longs labels
            plugins: {
                title: {
                    display: true,
                    text: 'Données Brutes - Analyse deepseek-r1:8b'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Legacy display function for backward compatibility
 */
function displayLegacyResults(data) {
    let html = '';
    
    // Info générale avec temps d'exécution
    html += `
        <div class="result-item">
            <h3>Analyse du secteur</h3>
            <p><strong>Secteur:</strong> ${data.sector}</p>
            ${data.location ? `<p><strong>Zone:</strong> ${data.location}</p>` : ''}
            <p><strong>Date:</strong> ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
            ${data.client_time ? `<p><strong>Temps d'analyse:</strong> <span style="color: ${data.client_time < 10 ? '#34A853' : '#EA4335'}; font-weight: 600;">${data.client_time}s</span></p>` : ''}
            ${data.ollama_enabled ? '<p><span style="color: #34A853; font-weight: 600;">Analyse IA activée (Ollama)</span></p>' : '<p><span style="color: #EA4335;">Ollama non disponible - Analyse basique uniquement</span></p>'}
        </div>
    `;
    
    // Analyse IA des datasets
    if (data.ai_analysis) {
        html += `
            <div class="result-item" style="background: linear-gradient(135deg, #E8F8F5 0%, #D4EDDA 100%); border-left: 4px solid #34A853;">
                <h3>Analyse IA des données</h3>
                <div style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(data.ai_analysis)}</div>
            </div>
        `;
    }
    
    // LES 5 ÉTAPES D'ANALYSE DE MARCHÉ avec graphiques
    if (data.market_steps) {
        html += `
            <div class="result-item" style="background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border-left: 4px solid #0078D4;">
                <h3>Les 5 Étapes d'Analyse de Marché</h3>
                <p style="margin-bottom: 20px; font-style: italic; color: #555;">Analyse complète et actionnable pour votre projet</p>
        `;
        
        // ÉTAPE 1: Taille du marché avec graphique
        const step1 = data.market_steps.step1;
        if (step1) {
            html += `
                <div class="market-step">
                    <h4>${cleanEmojis(step1.title)}</h4>
                    <div class="step-content">
                        <div class="step-chart">
                            <canvas id="chart-step1" width="400" height="200"></canvas>
                        </div>
                        <div class="step-insights">
                            ${formatInsights(step1.insights)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ÉTAPE 2: Clientèle cible avec graphique radar
        const step2 = data.market_steps.step2;
        if (step2) {
            html += `
                <div class="market-step">
                    <h4>${cleanEmojis(step2.title)}</h4>
                    <div class="step-content">
                        <div class="step-chart">
                            <canvas id="chart-step2" width="400" height="200"></canvas>
                        </div>
                        <div class="step-insights">
                            ${formatInsights(step2.insights)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ÉTAPE 3, 4, 5: Format simplifié
        ['step3', 'step4', 'step5'].forEach(stepKey => {
            const step = data.market_steps[stepKey];
            if (step) {
                html += `
                    <div class="market-step">
                        <h4>${cleanEmojis(step.title)}</h4>
                        <div class="step-insights">
                            ${formatInsights(step.insights)}
                        </div>
                    </div>
                `;
            }
        });
        
        html += `</div>`;
    }
    
    // Datasets trouvés - version simplifiée
    if (data.datasets_found && data.datasets_found.length > 0) {
        html += `
            <div class="result-item">
                <h3>Données publiques disponibles (${data.datasets_found.length})</h3>
                ${data.search_terms_used && data.search_terms_used.length > 1 ? 
                    `<p class="text-muted">Recherche élargie: ${data.search_terms_used.slice(0, 3).join(', ')}</p>` : ''}
                <div class="datasets-list">
        `;
        
        data.datasets_found.forEach(dataset => {
            html += `
                <div class="dataset-item">
                    <h4>${dataset.title}</h4>
                    <p>${dataset.description}</p>
                    <div class="dataset-meta">
                        <span class="meta-item">Organisation: ${dataset.organization}</span>
                        <span class="meta-item">Ressources: ${dataset.resources_count}</span>
                    </div>
                    ${dataset.url ? `<a href="${dataset.url}" target="_blank" class="btn-link">Consulter les données</a>` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="result-item alert-warning">
                <h3>Aucune donnée publique spécifique trouvée</h3>
                <p>Nous n'avons pas trouvé de datasets publics spécifiques pour "${data.sector}"${data.location ? ` à ${data.location}` : ''}.</p>
                ${data.search_terms_used && data.search_terms_used.length > 1 ? 
                    `<p class="text-muted">Termes recherchés: ${data.search_terms_used.join(', ')}</p>` : ''}
                <div class="suggestions">
                    <strong>Suggestions:</strong>
                    <ul>
                        <li>Essayez des termes plus généraux</li>
                        <li>Visitez <a href="https://www.data.gouv.fr" target="_blank">data.gouv.fr</a></li>
                        <li>Consultez les chambres de commerce locales</li>
                        <li>Regardez les statistiques INSEE pour votre secteur</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Recommandations IA
    if (data.ai_recommendations) {
        html += `
            <div class="result-item" style="background: #E5F6FD; border-left: 4px solid #0078D4;">
                <h3>Recommandations stratégiques (IA)</h3>
                <div style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(data.ai_recommendations)}</div>
            </div>
        `;
    }
    
    // Analyse concurrentielle
    if (data.competition_analysis) {
        html += `
            <div class="result-item" style="background: #FFF4CE; border-left: 4px solid #FBBC04;">
                <h3>Analyse concurrentielle</h3>
                <div style="white-space: pre-wrap; line-height: 1.8;">${escapeHtml(data.competition_analysis)}</div>
            </div>
        `;
    }
    
    // Recommandations basiques (fallback)
    if (data.recommendations && data.recommendations.length > 0 && !data.ai_recommendations) {
        html += `
            <div class="result-item">
                <h3>Recommandations pour votre étude de marché</h3>
        `;
        
        data.recommendations.forEach(rec => {
            html += `
                <div class="recommendation ${rec.priority}">
                    <div>
                        <strong>${rec.category}</strong>
                        <p>${rec.text}</p>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    // Actions suivantes
    html += `
        <div class="result-item">
            <h3>Prochaines étapes</h3>
            <ul class="benefits-list">
                <li>Consulter les datasets identifiés ci-dessus</li>
                <li>Télécharger et analyser les données pertinentes</li>
                <li>Créer des personas clients basés sur les données</li>
                <li>Identifier les concurrents via les registres publics</li>
                <li>Élaborer votre business plan avec ces informations</li>
            </ul>
        </div>
    `;
    
    resultsContent.innerHTML = html;
    showResults();
    
    // Créer les graphiques après que le DOM soit mis à jour
    if (data.market_steps) {
        setTimeout(() => {
            if (data.market_steps.step1) {
                createStep1Chart(data.market_steps.step1, 'chart-step1');
            }
            if (data.market_steps.step2) {
                createStep2Chart(data.market_steps.step2, 'chart-step2');
            }
        }, 100);
    }
}

/**
 * Afficher/masquer les sections
 */
function showLoading() {
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showResults() {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    resultsSection.style.display = 'none';
}

/**
 * Échapper le HTML pour affichage sécurisé
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Vérifier l'état de l'API au chargement
 */
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (!response.ok) {
            throw new Error('API health non-OK');
        }
        const data = await response.json();
        console.log('API Status:', data);

        // Si on reçoit une réponse attendue, marquer le backend comme disponible
        BACKEND_AVAILABLE = true;

        // Afficher un statut générique IA
        if (data.ia_status === 'available' || data.ollama_status === 'available') {
            console.log('✅ IA backend disponible - modèle:', data.ia_model || data.ollama_model || 'inconnu');
        } else if (data.ia_status === 'model_not_found' || data.ollama_status === 'model_not_found') {
            console.warn('⚠️ IA backend disponible mais modèle non trouvé.');
        } else {
            console.warn('ℹ️ IA backend présent mais état inconnu');
        }
    } catch (error) {
        BACKEND_AVAILABLE = false;
        console.info('Backend non joignable, le site utilisera le mode démo local.');
    }
}

/**
 * Initialiser la carte Leaflet
 */
function initMap() {
    // Créer la carte centrée sur la France (Nice par défaut)
    map = L.map('map').setView([43.7102, 7.2620], 10);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Créer une icône personnalisée
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #0078D4; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 4px; font-size: 16px; text-align: center;">📍</div></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    // Événement de clic sur la carte
    map.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Ajouter ou déplacer le marqueur
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng, { icon: customIcon }).addTo(map);
        }
        
            // Géocodage inverse pour obtenir le nom de la ville
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'MarketAI-Code4Sud/1.0'
                }
            });
            const data = await response.json();
            
            if (data.address) {
                // Priorité: city > town > village > municipality > suburb > county
                const city = data.address.city || 
                            data.address.town || 
                            data.address.village || 
                            data.address.municipality ||
                            data.address.suburb ||
                            data.address.county;
                const region = data.address.state || data.address.region;
                
                if (city) {
                    locationInput.value = city;
                    selectedLocation = { city, region, lat, lng };
                    
                    // Mettre à jour le popup du marqueur
                    marker.bindPopup(`<b>${city}</b>${region ? '<br>' + region : ''}`).openPopup();
                }
            }
        } catch (error) {
            console.error('Erreur de géocodage:', error);
        }
    });
}

/**
 * Gérer la géolocalisation de l'utilisateur
 */
async function handleGeolocation() {
    if (!navigator.geolocation) {
        alert('La géolocalisation n\'est pas supportée par votre navigateur');
        return;
    }
    
    geolocateBtn.classList.add('loading');
    geolocateBtn.innerHTML = '<span class="geo-icon">⏳</span>';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Centrer la carte sur la position
            map.setView([lat, lng], 13);
            
            // Ajouter le marqueur
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #34A853; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 4px; font-size: 16px; text-align: center;">📍</div></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });
            
            if (marker) {
                marker.setLatLng([lat, lng]);
                marker.setIcon(customIcon);
            } else {
                marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            }
            
            // Géocodage inverse
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                    headers: {
                        'User-Agent': 'MarketAI-Code4Sud/1.0'
                    }
                });
                const data = await response.json();
                
                console.log('Géolocalisation détectée:', data);
                
                if (data.address) {
                    // Priorité: city > town > village > municipality > suburb > county
                    const city = data.address.city || 
                                data.address.town || 
                                data.address.village || 
                                data.address.municipality ||
                                data.address.suburb ||
                                data.address.county;
                    const region = data.address.state || data.address.region;
                    
                    if (city) {
                        locationInput.value = city;
                        selectedLocation = { city, region, lat, lng };
                        marker.bindPopup(`<b>Votre position</b><br>${city}${region ? '<br>' + region : ''}`).openPopup();
                        console.log(`✅ Ville détectée: ${city}`);
                    }
                }
            } catch (error) {
                console.error('Erreur de géocodage:', error);
            }
            
            geolocateBtn.classList.remove('loading');
            geolocateBtn.innerHTML = '<span class="geo-icon">✓</span>';
            
            setTimeout(() => {
                geolocateBtn.innerHTML = '<span class="geo-icon">📍</span>';
            }, 2000);
        },
        (error) => {
            console.error('Erreur de géolocalisation:', error);
            alert('Impossible d\'obtenir votre position. Veuillez vérifier les permissions de géolocalisation.');
            
            geolocateBtn.classList.remove('loading');
            geolocateBtn.innerHTML = '<span class="geo-icon">❌</span>';
            
            setTimeout(() => {
                geolocateBtn.innerHTML = '<span class="geo-icon">📍</span>';
            }, 2000);
        },
        {
            enableHighAccuracy: true,  // Force le GPS au lieu du WiFi
            timeout: 15000,  // Augmenter le timeout à 15s
            maximumAge: 0  // Ne pas utiliser de position en cache
        }
    );
}

/**
 * Géocoder une adresse (pour la recherche manuelle)
 */
async function geocodeAddress(address) {
    if (!address) return;
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, France&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            // Centrer la carte
            map.setView([lat, lng], 12);
            
            // Ajouter le marqueur
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #0078D4; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 4px; font-size: 16px; text-align: center;">📍</div></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });
            
            if (marker) {
                marker.setLatLng([lat, lng]);
                marker.setIcon(customIcon);
            } else {
                marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            }
            
            marker.bindPopup(`<b>${result.display_name}</b>`).openPopup();
            selectedLocation = { lat, lng, address: result.display_name };
        }
    } catch (error) {
        console.error('Erreur de géocodage:', error);
    }
}

// Géocoder automatiquement quand l'utilisateur tape une adresse
let geocodeTimeout;
locationInput.addEventListener('input', (e) => {
    clearTimeout(geocodeTimeout);
    geocodeTimeout = setTimeout(() => {
        if (e.target.value.length > 3) {
            geocodeAddress(e.target.value);
        }
    }, 1000); // Attendre 1 seconde après que l'utilisateur arrête de taper
});

// Initialiser la carte au chargement
window.addEventListener('load', () => {
    initMap();
});

/**
 * Build analysis data by collecting from public APIs and formatting for Super-Prompt
 */
async function buildAnalysisData(sector, location, selectedLocation) {
    const zone = location || (selectedLocation && selectedLocation.city) || 'Toulouse';
    
    try {
        // For now, use enhanced mock data with realistic variations based on location
        // In production, replace with real API calls to INSEE, data.gouv.fr, GéoRisques, etc.
        
        // Base data with realistic variations
        const basePopulation = getPopulationByZone(zone);
        const baseRevenu = getRevenuByZone(zone);
        const riskData = getRiskDataByZone(zone);
        const bioOperators = getBioOperatorsByZone(zone, sector);
        
        const analysisData = {
            zone_analysee: zone,
            segment_analyse: sector,
            population: basePopulation,
            surface_km2: getSurfaceByZone(zone),
            revenu_median: baseRevenu,
            taux_pauvrete: Math.round(19 + (Math.random() - 0.5) * 6), // 16-22%
            nb_operateurs_bio_total: bioOperators.total,
            nb_concurrents_directs: bioOperators.concurrents,
            ventilation_acteurs: bioOperators.ventilation,
            surface_bio_hectares: bioOperators.surface_bio,
            risque_pollution_basol: riskData.pollution,
            risque_inondation_azi: riskData.inondation,
            hist_secheresse_catnat: riskData.secheresse,
            hist_inondation_catnat: riskData.hist_inondation
        };
        
        console.log('📊 Données d\'analyse construites:', analysisData);
        return analysisData;
        
    } catch (error) {
        console.error('Erreur lors de la construction des données:', error);
        // Fallback sur données par défaut
        return getDefaultAnalysisData(sector, zone);
    }
}

/**
 * Get population data by region (realistic regional data)
 */
function getPopulationByZone(zone) {
    // Détection automatique de région basée sur la zone
    const region = detectRegion(zone);
    
    const regionData = {
        'ile-de-france': {
            population: 12278000,
            densityFactor: 2.1,
            economicIndex: 1.25
        },
        'auvergne-rhone-alpes': {
            population: 8032000,
            densityFactor: 1.4,
            economicIndex: 1.15
        },
        'occitanie': {
            population: 5885000,
            densityFactor: 0.9,
            economicIndex: 1.05
        },
        'nouvelle-aquitaine': {
            population: 6006000,
            densityFactor: 0.7,
            economicIndex: 1.0
        },
        'provence-alpes-cote-azur': {
            population: 5055000,
            densityFactor: 1.2,
            economicIndex: 1.1
        },
        'grand-est': {
            population: 5555000,
            densityFactor: 0.8,
            economicIndex: 0.95
        },
        'hauts-de-france': {
            population: 5973000,
            densityFactor: 0.9,
            economicIndex: 0.85
        },
        'normandie': {
            population: 3329000,
            densityFactor: 0.6,
            economicIndex: 0.9
        },
        'bretagne': {
            population: 3340000,
            densityFactor: 0.7,
            economicIndex: 0.95
        },
        'pays-de-la-loire': {
            population: 3791000,
            densityFactor: 0.8,
            economicIndex: 1.05
        },
        'centre-val-de-loire': {
            population: 2572000,
            densityFactor: 0.5,
            economicIndex: 0.9
        },
        'bourgogne-franche-comte': {
            population: 2807000,
            densityFactor: 0.4,
            economicIndex: 0.85
        }
    };
    
    const data = regionData[region] || regionData['occitanie']; // Fallback
    
    // Retourner population régionale avec variation locale
    const localVariation = 0.7 + Math.random() * 0.6; // 70% à 130% de la moyenne
    return Math.round(data.population * localVariation * 0.1); // ~10% de la pop régionale pour une zone locale
}

/**
 * Get revenue data by region (realistic regional income)
 */
function getRevenuByZone(zone) {
    const region = detectRegion(zone);
    
    const regionRevenus = {
        'ile-de-france': 28900,
        'auvergne-rhone-alpes': 24200,
        'occitanie': 22000,
        'nouvelle-aquitaine': 22800,
        'provence-alpes-cote-azur': 23500,
        'grand-est': 22300,
        'hauts-de-france': 20100,
        'normandie': 21500,
        'bretagne': 21800,
        'pays-de-la-loire': 22600,
        'centre-val-de-loire': 21200,
        'bourgogne-franche-comte': 21000
    };
    
    const baseRevenu = regionRevenus[region] || 22000;
    const variation = 0.9 + Math.random() * 0.2; // Variation locale ±10%
    
    return Math.round(baseRevenu * variation);
}

/**
 * Get surface data by region (average zone size per region)
 */
function getSurfaceByZone(zone) {
    const region = detectRegion(zone);
    
    const regionSurfaces = {
        'ile-de-france': 85,      // Zones plus petites mais denses
        'auvergne-rhone-alpes': 145, // Zones moyennes-grandes
        'occitanie': 165,         // Grandes zones rurales
        'nouvelle-aquitaine': 180, // Très grandes zones
        'provence-alpes-cote-azur': 95, // Zones moyennes côtières
        'grand-est': 130,         // Zones moyennes
        'hauts-de-france': 75,    // Zones plus petites et denses
        'normandie': 120,         // Zones moyennes
        'bretagne': 100,          // Zones moyennes
        'pays-de-la-loire': 110,  // Zones moyennes
        'centre-val-de-loire': 155, // Grandes zones rurales
        'bourgogne-franche-comte': 140 // Zones moyennes-grandes
    };
    
    const baseSurface = regionSurfaces[region] || 120;
    const variation = 0.7 + Math.random() * 0.6; // Variation locale
    
    return Math.round(baseSurface * variation);
}

/**
 * Get risk data by region (regional environmental patterns)
 */
function getRiskDataByZone(zone) {
    const region = detectRegion(zone);
    
    const regionRisks = {
        'ile-de-france': {
            pollution: 'Surveillance urbaine renforcée',
            inondation: 'Modéré (Seine)',
            secheresse: 2,
            hist_inondation: 3
        },
        'auvergne-rhone-alpes': {
            pollution: 'Zones industrielles ponctuelles',
            inondation: 'Élevé (Rhône, torrents)',
            secheresse: 3,
            hist_inondation: 4
        },
        'occitanie': {
            pollution: 'Sites suspects à proximité',
            inondation: 'Modéré',
            secheresse: 5,
            hist_inondation: 2
        },
        'nouvelle-aquitaine': {
            pollution: 'Surveillance côtière',
            inondation: 'Élevé (Atlantique)',
            secheresse: 4,
            hist_inondation: 3
        },
        'provence-alpes-cote-azur': {
            pollution: 'Surveillance renforcée (industrie)',
            inondation: 'Modéré',
            secheresse: 6,
            hist_inondation: 2
        },
        'grand-est': {
            pollution: 'Zones industrielles historiques',
            inondation: 'Modéré (Rhin, Moselle)',
            secheresse: 2,
            hist_inondation: 3
        },
        'hauts-de-france': {
            pollution: 'Zones industrielles classées',
            inondation: 'Élevé (côte, bassins)',
            secheresse: 1,
            hist_inondation: 4
        },
        'normandie': {
            pollution: 'Surveillance côtière et industrielle',
            inondation: 'Élevé (Seine, côte)',
            secheresse: 1,
            hist_inondation: 4
        },
        'bretagne': {
            pollution: 'Surveillance agricole intensive',
            inondation: 'Modéré (côte)',
            secheresse: 1,
            hist_inondation: 2
        },
        'pays-de-la-loire': {
            pollution: 'Surveillance standard',
            inondation: 'Modéré (Loire, côte)',
            secheresse: 2,
            hist_inondation: 3
        },
        'centre-val-de-loire': {
            pollution: 'Surveillance standard',
            inondation: 'Modéré (Loire)',
            secheresse: 3,
            hist_inondation: 2
        },
        'bourgogne-franche-comte': {
            pollution: 'Surveillance standard',
            inondation: 'Faible',
            secheresse: 2,
            hist_inondation: 1
        }
    };
    
    const baseRisk = regionRisks[region] || regionRisks['occitanie'];
    
    return {
        pollution: baseRisk.pollution,
        inondation: baseRisk.inondation,
        secheresse: baseRisk.secheresse + Math.round((Math.random() - 0.5) * 2), // Variation locale ±1
        hist_inondation: Math.max(1, baseRisk.hist_inondation + Math.round((Math.random() - 0.5) * 2))
    };
}

/**
 * Get bio operators data by region and sector
 */
function getBioOperatorsByZone(zone, sector) {
    const region = detectRegion(zone);
    const population = getPopulationByZone(zone);
    
    // Facteur de développement bio par région (basé sur les données agricoles)
    const regionBioFactors = {
        'ile-de-france': 0.6,     // Moins d'agriculture
        'auvergne-rhone-alpes': 1.3, // Forte agriculture bio
        'occitanie': 1.4,         // Leader national bio
        'nouvelle-aquitaine': 1.2, // Forte agriculture
        'provence-alpes-cote-azur': 1.1, // Bio développé
        'grand-est': 1.0,         // Moyenne nationale
        'hauts-de-france': 0.8,   // Agriculture conventionnelle
        'normandie': 0.9,         // Agriculture mixte
        'bretagne': 0.7,          // Agriculture intensive
        'pays-de-la-loire': 1.0,  // Équilibrée
        'centre-val-de-loire': 1.1, // Agriculture diversifiée
        'bourgogne-franche-comte': 1.2 // Agriculture qualité
    };
    
    const bioFactor = regionBioFactors[region] || 1.0;
    const densityFactor = population / 100000;
    
    const total = Math.round((15 + densityFactor * 8) * bioFactor);
    const concurrents = Math.round(total * (0.2 + bioFactor * 0.1));
    
    // Répartition selon le profil régional
    const producteurs = Math.round(concurrents + Math.random() * 3);
    const transformateurs = Math.round(total * 0.35 * bioFactor);
    const distributeurs = Math.round(total * 0.40);
    
    return {
        total,
        concurrents,
        ventilation: {
            producteurs,
            transformateurs,
            distributeurs
        },
        surface_bio: Math.round((1000 + densityFactor * 800) * bioFactor)
    };
}

/**
 * Detect region from zone name
 */
function detectRegion(zone) {
    const zoneKey = zone.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const regionMapping = {
        // Île-de-France
        'paris': 'ile-de-france',
        'versailles': 'ile-de-france',
        'nanterre': 'ile-de-france',
        'melun': 'ile-de-france',
        'meaux': 'ile-de-france',
        'creteil': 'ile-de-france',
        
        // Auvergne-Rhône-Alpes
        'lyon': 'auvergne-rhone-alpes',
        'grenoble': 'auvergne-rhone-alpes',
        'saint-etienne': 'auvergne-rhone-alpes',
        'clermont-ferrand': 'auvergne-rhone-alpes',
        'annecy': 'auvergne-rhone-alpes',
        'chambery': 'auvergne-rhone-alpes',
        
        // Occitanie
        'toulouse': 'occitanie',
        'montpellier': 'occitanie',
        'nimes': 'occitanie',
        'perpignan': 'occitanie',
        'beziers': 'occitanie',
        'carcassonne': 'occitanie',
        
        // Nouvelle-Aquitaine
        'bordeaux': 'nouvelle-aquitaine',
        'poitiers': 'nouvelle-aquitaine',
        'limoges': 'nouvelle-aquitaine',
        'pau': 'nouvelle-aquitaine',
        'bayonne': 'nouvelle-aquitaine',
        'la rochelle': 'nouvelle-aquitaine',
        
        // Provence-Alpes-Côte d'Azur
        'marseille': 'provence-alpes-cote-azur',
        'nice': 'provence-alpes-cote-azur',
        'toulon': 'provence-alpes-cote-azur',
        'avignon': 'provence-alpes-cote-azur',
        'cannes': 'provence-alpes-cote-azur',
        'antibes': 'provence-alpes-cote-azur',
        
        // Grand Est
        'strasbourg': 'grand-est',
        'metz': 'grand-est',
        'nancy': 'grand-est',
        'reims': 'grand-est',
        'mulhouse': 'grand-est',
        'colmar': 'grand-est',
        
        // Hauts-de-France
        'lille': 'hauts-de-france',
        'amiens': 'hauts-de-france',
        'roubaix': 'hauts-de-france',
        'tourcoing': 'hauts-de-france',
        'calais': 'hauts-de-france',
        'dunkerque': 'hauts-de-france',
        
        // Normandie
        'rouen': 'normandie',
        'le havre': 'normandie',
        'caen': 'normandie',
        'cherbourg': 'normandie',
        'evreux': 'normandie',
        
        // Bretagne
        'rennes': 'bretagne',
        'brest': 'bretagne',
        'quimper': 'bretagne',
        'lorient': 'bretagne',
        'saint-brieuc': 'bretagne',
        'vannes': 'bretagne',
        
        // Pays de la Loire
        'nantes': 'pays-de-la-loire',
        'angers': 'pays-de-la-loire',
        'le mans': 'pays-de-la-loire',
        'la roche-sur-yon': 'pays-de-la-loire',
        'cholet': 'pays-de-la-loire',
        
        // Centre-Val de Loire
        'orleans': 'centre-val-de-loire',
        'tours': 'centre-val-de-loire',
        'bourges': 'centre-val-de-loire',
        'chartres': 'centre-val-de-loire',
        'blois': 'centre-val-de-loire',
        
        // Bourgogne-Franche-Comté
        'dijon': 'bourgogne-franche-comte',
        'besancon': 'bourgogne-franche-comte',
        'chalon-sur-saone': 'bourgogne-franche-comte',
        'nevers': 'bourgogne-franche-comte',
        'auxerre': 'bourgogne-franche-comte'
    };
    
    return regionMapping[zoneKey] || 'occitanie'; // Default fallback
}

/**
 * Fallback default data
 */
function getDefaultAnalysisData(sector, zone) {
    return {
        zone_analysee: zone,
        segment_analyse: sector,
        population: 498000,
        surface_km2: 118.3,
        revenu_median: 22500,
        taux_pauvrete: 19,
        nb_operateurs_bio_total: 45,
        nb_concurrents_directs: 12,
        ventilation_acteurs: {
            producteurs: 12,
            transformateurs: 15,
            distributeurs: 18
        },
        surface_bio_hectares: 5000,
        risque_pollution_basol: 'Sites suspects à proximité',
        risque_inondation_azi: 'Oui',
        hist_secheresse_catnat: 4,
        hist_inondation_catnat: 2
    };
}

// Vérifier l'API au chargement de la page
checkApiHealth();
