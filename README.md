# Lancer de Hache - Scoring Software

Application web de scoring pour le lancer de hache, conçue pour être utilisée avec une tablette et un vidéoprojecteur.

## Fonctionnalités

- **Mode Classique** : 5 séries de 3 lancers, cumul des points
- **Around the World** : Toucher les zones 1 à 6 dans l'ordre
- Interface tactile optimisée pour tablette
- Projection plein écran sur cible
- Sauvegarde automatique des parties
- Fonctionne hors-ligne (PWA)

## Installation

1. Assurez-vous d'avoir Python ou Node.js installé sur votre machine
2. Double-cliquez sur `StartLancerHacheSoftware.bat`
3. Le navigateur s'ouvre automatiquement sur `http://localhost:5000`

## Utilisation

### Configuration de la partie
1. Cliquez sur "Nouvelle Partie"
2. Sélectionnez le mode de jeu
3. Choisissez le nombre de joueurs (2-8)
4. Entrez les noms des joueurs
5. Cliquez sur "Commencer"

### Pendant la partie
- **Tapez sur la cible** pour marquer un impact
- Les points sont calculés automatiquement selon la zone touchée
- Le bouton "Raté" permet d'enregistrer un lancer manqué
- Le bouton "Annuler" permet d'annuler le dernier lancer
- Le bouton "Killshot" s'active au dernier lancer de chaque série

### Zones de scoring
- **Bullseye (centre)** : 6 points
- **Zone 4** : 4 points
- **Zone 3** : 3 points
- **Zone 2** : 2 points
- **Zone 1** : 1 point
- **Killshot** (coins supérieurs) : 8 points
- **Miss** : 0 point

## Configuration Technique

### Matériel recommandé
- Tablette : Samsung Galaxy Tab A9+ (ou équivalent)
- Vidéoprojecteur : Epson EB-W51 (1280x800, WXGA)
- Navigateur : Chrome (recommandé)

### Mode Projection
1. Connectez la tablette au vidéoprojecteur (sans fil ou HDMI)
2. Activez la duplication d'écran
3. Passez en mode plein écran (F11 ou bouton dans le menu)

## Structure du Projet

```
LancerHacheSoftware/
├── StartLancerHacheSoftware.bat  # Script de lancement
├── index.html                     # Page principale
├── manifest.json                  # Configuration PWA
├── sw.js                          # Service Worker
├── css/
│   └── styles.css                 # Styles
├── js/
│   ├── app.js                     # Point d'entrée
│   ├── game.js                    # Logique du jeu
│   ├── target.js                  # Gestion de la cible
│   ├── scoring.js                 # Calcul des scores
│   ├── players.js                 # Gestion des joueurs
│   ├── ui.js                      # Interface utilisateur
│   └── storage.js                 # Persistance locale
├── assets/
│   ├── sounds/                    # Sons (à ajouter)
│   └── icons/                     # Icônes PWA
└── README.md
```

## Développement

### Prérequis
- Python 3.x ou Node.js

### Lancer en développement
```bash
# Avec Python
python -m http.server 5000

# Avec Node.js
npx http-server -p 5000
```

## Licence

Projet personnel - Tous droits réservés
