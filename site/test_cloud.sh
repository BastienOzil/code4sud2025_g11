#!/bin/bash

echo "🧪 Test de la version Cloud (sans Ollama)"
echo "=========================================="
echo ""

# Activer l'environnement virtuel si disponible
if [ -d .venv ]; then
    echo "✓ Activation de l'environnement virtuel..."
    source .venv/bin/activate
fi

# Vérifier les dépendances
echo "✓ Vérification des dépendances..."
pip install -q -r requirements_cloud.txt

echo ""
echo "🚀 Lancement du serveur avec Gunicorn..."
echo ""
echo "📍 URLs d'accès:"
echo "   - Local: http://127.0.0.1:8000"
echo "   - Réseau: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "⏹️  Pour arrêter: Ctrl+C"
echo ""
echo "=========================================="
echo ""

# Lancer avec Gunicorn (comme sur Render)
gunicorn app_cloud:app --bind 0.0.0.0:8000 --workers 2 --timeout 30 --log-level info
