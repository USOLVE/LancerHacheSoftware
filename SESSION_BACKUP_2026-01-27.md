# Session Backup - 27 Janvier 2026

## Résumé du Projet

**Lancer de Hache PWA** - Application de scoring pour le lancer de hache avec plusieurs modes de jeu.

## Repositories GitHub

1. **Application principale (PWA)**
   - URL: https://github.com/USOLVE/LancerHacheSoftware
   - Contient: PWA complète avec tous les modes de jeu

2. **Serveur d'images**
   - URL: https://github.com/USOLVE/imageserverlancerdehache
   - Déployé sur: https://imageserverlancerdehache.onrender.com

## Modes de Jeu Implémentés

### 1. Mode Classique
- 5 séries de 3 lancers
- Zones: Bullseye (6pts), Zone 4 (4pts), Zone 3 (3pts), Zone 2 (2pts), Zone 1 (1pt)
- Killshot disponible (8pts)
- Support équipes (2 équipes de 6 joueurs max)

### 2. Mode Morpion
- 2 ou 4 joueurs (mode équipes avec 4)
- Alignez 3 symboles pour gagner
- Système de manches

### 3. Mode Fléchettes 301
- Score partagé par équipe (commence à 301, descend à 0)
- Alternance entre équipes (jamais 2 joueurs de la même équipe consécutifs)
- Affichage du 3ème lancer pendant 5 secondes avant changement de joueur
- Support équipes (2 équipes de 6 joueurs max)

### 4. Mode "Choisis ta Cible"
- Connexion au serveur d'images en temps réel
- QR code scannable pour upload de photos depuis téléphone
- Navigation entre les images reçues
- Pas de gestion de joueurs, juste affichage

## Structure des Fichiers

```
LancerHacheSoftware/
├── index.html              # Page principale PWA
├── manifest.json           # Configuration PWA
├── sw.js                   # Service Worker
├── css/
│   └── styles.css          # Styles de l'application
├── js/
│   ├── app.js              # Point d'entrée
│   ├── ui.js               # Gestion de l'interface
│   ├── game.js             # Logique mode classique
│   ├── target.js           # Dessin de la cible classique
│   ├── morpion.js          # Logique mode morpion
│   ├── darts.js            # Logique mode 301
│   ├── customTarget.js     # Mode choisis ta cible + connexion serveur
│   ├── players.js          # Gestion des joueurs
│   ├── scoring.js          # Calcul des scores
│   └── storage.js          # Sauvegarde locale
├── assets/
│   └── icons/              # Icônes PWA (72-512px)
└── image-server/           # Serveur d'images (aussi repo séparé)
    ├── server.js           # Express + Socket.io
    ├── package.json
    └── public/
        ├── index.html      # Interface tablette
        └── upload.html     # Interface mobile upload
```

## Configuration Git

- User: USOLVE
- Email: contact@usolve-escapegame.com

## Points Techniques Importants

### Mode Équipes Fléchettes
- Score d'équipe partagé (pas de score individuel)
- Fonction `createAlternatingPlayOrder()` pour alterner entre équipes
- Délai de 5 secondes après le 3ème lancer (`waitingForNextPlayer`)

### Serveur d'Images
- Socket.io pour communication temps réel
- Sessions stockées en mémoire (Map)
- Auto-nettoyage après 2 heures
- QR code généré via API `api.qrserver.com`

### Paramètres Utilisateur
- Sons, vibrations, animations
- Killshot autorisé au dernier lancer ou tous les lancers
- URL du serveur d'images configurable

## Commandes Utiles

```bash
# Démarrer le serveur local (pour dev)
cd image-server && npm start

# Pousser les changements
git add -A && git commit -m "message" && git push
```

## Notes

- Les serveurs Render gratuits se mettent en veille après 15 min d'inactivité
- Première connexion peut prendre ~30 secondes pour le réveil
- PWA fonctionne hors-ligne grâce au Service Worker (sauf mode Ta Cible)
