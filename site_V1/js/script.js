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
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sector, location })
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
 * Afficher les résultats de l'analyse
 */
function displayResults(data) {
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

// Vérifier l'API au chargement de la page
checkApiHealth();
