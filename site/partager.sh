#!/bin/bash

# Script de partage rapide du site Code4Sud

echo "════════════════════════════════════════════════════════════"
echo "   🌐 PARTAGE DU SITE D'ANALYSE DE MARCHÉ - CODE4SUD 2025"
echo "════════════════════════════════════════════════════════════"
echo ""

# Obtenir l'adresse IP locale
echo "📡 Détection de votre adresse IP..."
IP_LOCAL=$(hostname -I | awk '{print $1}')
echo "   ✅ IP détectée: $IP_LOCAL"
echo ""

# Vérifier si le serveur tourne déjà
echo "🔍 Vérification du serveur Flask..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ✅ Serveur déjà en cours d'exécution"
    echo ""
else
    echo "   ⚠️  Serveur non détecté"
    echo "   🚀 Lancement du serveur Flask..."
    echo ""
    
    # Activer l'environnement virtuel et lancer
    cd "$(dirname "$0")"
    source .venv/bin/activate
    python app.py &
    FLASK_PID=$!
    
    echo "   ⏳ Démarrage en cours..."
    sleep 3
    echo "   ✅ Serveur lancé (PID: $FLASK_PID)"
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo "   📋 ADRESSES DE PARTAGE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🖥️  Sur VOTRE ordinateur :"
echo "   → http://127.0.0.1:5000"
echo "   → http://localhost:5000"
echo ""
echo "📱 Sur le RÉSEAU LOCAL (WiFi/Ethernet) :"
echo "   → http://$IP_LOCAL:5000"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "💡 PARTAGE AVEC VOS COLLÈGUES :"
echo ""
echo "   Donnez-leur cette adresse :"
echo "   ┌─────────────────────────────────────────┐"
echo "   │                                         │"
echo "   │   http://$IP_LOCAL:5000          │"
echo "   │                                         │"
echo "   └─────────────────────────────────────────┘"
echo ""
echo "   Ils doivent être sur le MÊME réseau WiFi !"
echo ""

# Générer un QR Code si qrencode est installé
if command -v qrencode &> /dev/null; then
    echo "📸 QR Code généré !"
    qrencode -t ANSIUTF8 "http://$IP_LOCAL:5000"
    echo ""
    echo "   → Les utilisateurs peuvent scanner ce QR code"
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo "   🔧 DÉPANNAGE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Si ça ne fonctionne pas :"
echo ""
echo "1️⃣  Vérifier le pare-feu :"
echo "   sudo ufw allow 5000"
echo ""
echo "2️⃣  Vérifier que vous êtes sur le même réseau"
echo ""
echo "3️⃣  Tester depuis votre machine d'abord :"
echo "   curl http://localhost:5000"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "   🚀 DÉPLOIEMENT EN LIGNE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Pour partager sur INTERNET (accessible partout) :"
echo ""
echo "Option 1 - Render.com (gratuit, permanent) :"
echo "   → Consultez DEPLOIEMENT.md"
echo "   → 5 minutes de configuration"
echo "   → URL publique du type: https://votre-app.onrender.com"
echo ""
echo "Option 2 - ngrok (gratuit, temporaire) :"
echo "   1. Installez: snap install ngrok"
echo "   2. Lancez: ngrok http 5000"
echo "   3. Partagez l'URL fournie"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✨ Votre site est prêt à être partagé !"
echo ""
echo "Pour arrêter le serveur : Ctrl+C"
echo ""
