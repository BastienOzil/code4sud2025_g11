#!/bin/bash

echo "🚀 Déploiement de MarketAI sur Render.com"
echo "=========================================="
echo ""

# Vérifier si on est dans un repo git
if [ ! -d .git ]; then
    echo "❌ Erreur: Ce n'est pas un repository Git"
    echo "Initialisez d'abord avec: git init"
    exit 1
fi

# Vérifier les fichiers nécessaires
echo "✓ Vérification des fichiers..."
if [ ! -f app_cloud.py ]; then
    echo "❌ Fichier app_cloud.py manquant"
    exit 1
fi

if [ ! -f requirements_cloud.txt ]; then
    echo "❌ Fichier requirements_cloud.txt manquant"
    exit 1
fi

if [ ! -f Procfile ]; then
    echo "❌ Fichier Procfile manquant"
    exit 1
fi

echo "✓ Tous les fichiers sont présents"
echo ""

# Ajouter et commit
echo "📦 Préparation du commit..."
git add .
git commit -m "Deploy: MarketAI for Code4Sud 2025" || echo "⚠️ Rien à committer"

# Vérifier la remote
if ! git remote | grep -q origin; then
    echo ""
    echo "⚠️ Pas de remote 'origin' configurée"
    echo ""
    echo "Configurez votre repository GitHub:"
    echo "  git remote add origin https://github.com/VOTRE_USERNAME/code4sud_sujet2.git"
    echo ""
    echo "Puis poussez avec:"
    echo "  git push -u origin main"
    echo ""
else
    echo ""
    echo "🚀 Push vers GitHub..."
    git push origin main || git push origin master
    echo ""
fi

echo "✅ Préparation terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Allez sur https://render.com"
echo "2. Connectez-vous avec GitHub"
echo "3. Créez un nouveau 'Web Service'"
echo "4. Sélectionnez ce repository"
echo "5. Render détectera automatiquement render.yaml"
echo "6. Cliquez 'Create Web Service'"
echo ""
echo "⏱️  Le déploiement prendra 2-3 minutes"
echo "🌐 Votre site sera disponible sur: https://[votre-nom].onrender.com"
echo ""
