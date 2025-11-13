/**
 * Test de détection automatique des régions françaises
 */

// Import de la fonction (simulation)
function detectRegion(zone) {
    const zoneKey = zone.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const regionMapping = {
        // Île-de-France
        'paris': 'ile-de-france',
        'versailles': 'ile-de-france',
        
        // Auvergne-Rhône-Alpes
        'lyon': 'auvergne-rhone-alpes',
        'grenoble': 'auvergne-rhone-alpes',
        'clermont-ferrand': 'auvergne-rhone-alpes',
        
        // Occitanie
        'toulouse': 'occitanie',
        'montpellier': 'occitanie',
        'nimes': 'occitanie',
        
        // Nouvelle-Aquitaine
        'bordeaux': 'nouvelle-aquitaine',
        'poitiers': 'nouvelle-aquitaine',
        
        // Provence-Alpes-Côte d'Azur
        'marseille': 'provence-alpes-cote-azur',
        'nice': 'provence-alpes-cote-azur',
        'toulon': 'provence-alpes-cote-azur',
        
        // Grand Est
        'strasbourg': 'grand-est',
        'metz': 'grand-est',
        'nancy': 'grand-est',
        
        // Autres
        'lille': 'hauts-de-france',
        'rennes': 'bretagne',
        'nantes': 'pays-de-la-loire'
    };
    
    return regionMapping[zoneKey] || 'occitanie';
}

// Tests de détection
console.log('🗺️  TEST DÉTECTION AUTOMATIQUE DES RÉGIONS');
console.log('=' .repeat(60));
console.log('');

const testCases = [
    'Toulouse',
    'Nice', 
    'Lyon',
    'Paris',
    'Marseille',
    'Bordeaux',
    'Lille',
    'Strasbourg',
    'Rennes',
    'Nantes',
    'Montpellier',
    'Clermont-Ferrand',
    'Zone Inconnue'
];

testCases.forEach(zone => {
    const region = detectRegion(zone);
    console.log(`📍 ${zone.padEnd(18)} → ${region}`);
});

console.log('');
console.log('✅ Avantages du système par région:');
console.log('• Cohérence des données économiques régionales');
console.log('• Facteurs de développement bio spécifiques');
console.log('• Risques environnementaux par région');
console.log('• Revenus médians régionaux réalistes');
console.log('• Densité d\'opérateurs bio adaptée');
console.log('');
console.log('🎯 L\'IA deepseek-r1:8b recevra des données');
console.log('   contextualisées par région française pour');
console.log('   des analyses plus précises et réalistes.');