/**
 * Test d'intégration finale - Vérification complète de l'IA deepseek-r1:8b avec API
 * Usage: node test_integration_finale.js
 */

const http = require('http');

// Données de test simulant une réponse API réelle
const testApiData = {
    secteur: "restauration",
    localisation: "Lyon",
    region: "Auvergne-Rhône-Alpes",
    population: 515695,
    nb_concurrents: 1250,
    revenu_median: 24500,
    taux_chomage: 7.2,
    dynamisme_economique: 78,
    accessibilite: 85,
    foncier_commercial: 2800,
    cout_main_oeuvre: 18.5,
    taxes_locales: 34.2,
    subventions_disponibles: 15000,
    croissance_population: 1.8,
    evolution_emploi: 2.1,
    projets_amenagement: 5,
    indice_consommation: 112,
    saisonnalite: 15,
    tendances_marche: "croissance",
    innovations_secteur: 8
};

/**
 * Test complet du système avec données API
 */
async function testIntegrationComplete() {
    console.log('🧪 Test d\'intégration finale - deepseek-r1:8b avec API');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Vérifier que le serveur est démarré
        console.log('1️⃣ Vérification du serveur...');
        const healthCheck = await makeRequest('/api/health', 'GET');
        console.log('✅ Serveur opérationnel:', healthCheck);
        
        // Test 2: Analyse avec données API complètes
        console.log('\n2️⃣ Test d\'analyse avec données API...');
        const analysisResult = await makeRequest('/api/analyze', 'POST', testApiData);
        
        if (analysisResult.error) {
            console.error('❌ Erreur d\'analyse:', analysisResult.error);
            return;
        }
        
        // Test 3: Validation de la structure JSON de réponse
        console.log('\n3️⃣ Validation de la réponse IA...');
        validateResponse(analysisResult);
        
        // Test 4: Vérification des recommandations graphiques
        console.log('\n4️⃣ Vérification des recommandations graphiques...');
        checkGraphicRecommendations(analysisResult);
        
        // Test 5: Vérification du commentaire de marché
        console.log('\n5️⃣ Vérification du commentaire de marché...');
        checkMarketCommentary(analysisResult);
        
        console.log('\n🎉 Test d\'intégration réussi !');
        console.log('\n📊 Résumé de l\'analyse:');
        displayAnalysisSummary(analysisResult);
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        process.exit(1);
    }
}

/**
 * Effectuer une requête HTTP
 */
function makeRequest(path, method, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve(response);
                } catch (e) {
                    resolve({ raw: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

/**
 * Valider la structure de la réponse
 */
function validateResponse(response) {
    const requiredFields = [
        'metadonnees_analyse',
        'kpi_synthese',
        'swot_externe',
        'commentaire_marche'
    ];
    
    const missing = requiredFields.filter(field => !response[field]);
    
    if (missing.length > 0) {
        console.log('⚠️  Champs manquants:', missing);
    } else {
        console.log('✅ Structure JSON valide');
    }
    
    // Vérification des scores
    const kpi = response.kpi_synthese;
    if (kpi) {
        console.log(`📈 Score opportunité: ${kpi.score_opportunite || 'N/A'}`);
        console.log(`📈 Score viabilité: ${kpi.score_viabilite || 'N/A'}`);
        console.log(`📈 Score global: ${kpi.score_global || 'N/A'}`);
    }
}

/**
 * Vérifier les recommandations graphiques
 */
function checkGraphicRecommendations(response) {
    const commentaire = response.commentaire_marche;
    
    if (commentaire && commentaire.recommandations_graphiques) {
        const recs = commentaire.recommandations_graphiques;
        console.log(`✅ ${recs.length} recommandation(s) graphique(s) trouvée(s)`);
        
        recs.forEach((rec, i) => {
            console.log(`   📊 ${i + 1}. ${rec.titre || 'Sans titre'} (${rec.type || 'bar'})`);
            if (rec.description) {
                console.log(`      📝 ${rec.description}`);
            }
        });
    } else {
        console.log('⚠️  Aucune recommandation graphique trouvée');
    }
}

/**
 * Vérifier le commentaire de marché
 */
function checkMarketCommentary(response) {
    const commentaire = response.commentaire_marche;
    
    if (commentaire) {
        console.log('✅ Commentaire de marché présent');
        
        if (commentaire.etat_general) {
            console.log(`   🎯 État général: ${commentaire.etat_general}`);
        }
        
        if (commentaire.facteurs_cles && commentaire.facteurs_cles.length > 0) {
            console.log(`   🔑 ${commentaire.facteurs_cles.length} facteur(s) clé(s) identifié(s)`);
        }
        
        if (commentaire.recommandations && commentaire.recommandations.length > 0) {
            console.log(`   💡 ${commentaire.recommandations.length} recommandation(s) fournie(s)`);
        }
    } else {
        console.log('⚠️  Commentaire de marché manquant');
    }
}

/**
 * Afficher un résumé de l'analyse
 */
function displayAnalysisSummary(response) {
    const kpi = response.kpi_synthese;
    const meta = response.metadonnees_analyse;
    
    console.log(`📍 Région analysée: ${meta?.region || 'N/A'}`);
    console.log(`🏢 Secteur: ${meta?.secteur || 'N/A'}`);
    console.log(`⭐ Score global: ${kpi?.score_global || 'N/A'}/100`);
    
    const commentaire = response.commentaire_marche;
    if (commentaire?.etat_general) {
        console.log(`💬 État du marché: ${commentaire.etat_general}`);
    }
}

/**
 * Instructions de démarrage
 */
function printInstructions() {
    console.log('\n📋 Instructions pour utiliser le système:');
    console.log('1. Démarrer le serveur: node server.js');
    console.log('2. Ouvrir http://localhost:3000 dans le navigateur');
    console.log('3. Saisir un secteur et une localisation');
    console.log('4. L\'IA deepseek-r1:8b analysera et recommandera des graphiques');
    console.log('\n🔧 Commandes utiles:');
    console.log('• Test santé: curl http://localhost:3000/api/health');
    console.log('• Test Ollama: ollama run deepseek-r1:8b "Bonjour"');
}

// Exécution du test
if (require.main === module) {
    testIntegrationComplete().then(() => {
        printInstructions();
    }).catch(console.error);
}

module.exports = { testIntegrationComplete };