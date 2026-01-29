# Sauvegarde Session - Lancer de Hache
## Date: 29 Janvier 2026

---

## Aperçu du Projet

Application PWA de scoring pour le lancer de hache, projetée sur une cible réelle.

### URLs des Dépôts

- **Application principale**: https://github.com/USOLVE/LancerHacheSoftware.git
- **Serveur d'images**: https://github.com/USOLVE/imageserverlancerdehache.git
- **Serveur en production**: https://imageserverlancerdehache.onrender.com

---

## Modes de Jeu Disponibles

### 1. Classique
- 5 séries de 3 lancers
- Zones: 1, 2, 3, 4, 6 points + Killshot (8 points)
- Killshot disponible au dernier lancer uniquement (configurable)

### 2. Lucky Luke
- Élimination: si un joueur fait un score > au joueur précédent, il l'élimine
- Dernier joueur en lice gagne

### 3. Race
- Premier à atteindre 25 points gagne
- Pas de limite de lancers

### 4. Suite d'Or
- Toucher les zones dans l'ordre: 1-2-3-4-6-4-3-2-1
- Si bonne zone: rejoue
- Si mauvaise zone: passe au joueur suivant

### 5. 007
- Premier à faire 5 bullseyes (centre) gagne
- Seuls les bullseyes comptent

### 6. Killer
- Atteindre exactement 20 points
- Dépasser = retour à 0
- Égaliser le score d'un autre = l'autre revient à 0

### 7. Morpion
- Grille 3x3, alignez 3 symboles
- Mode équipes disponible (2v2)
- Grille 440x440 (même taille que les cibles)

### 8. Fléchettes 301
- Partir de 301, atteindre exactement 0
- Zones: simples, doubles, triples, bull
- Mode équipes disponible
- Cible agrandie à rayon 220 (même taille que les autres)

### 9. Ta Cible (Custom Target)
- Upload d'image via QR code depuis téléphone
- Upload local depuis l'appareil
- Image projetée sur la cible
- QR code s'affiche automatiquement à l'entrée du mode

---

## Structure des Fichiers

```
LancerHacheSoftware/
├── index.html              # Page principale
├── manifest.json           # Config PWA
├── sw.js                   # Service Worker (v12)
├── css/
│   └── styles.css          # Styles complets
├── js/
│   ├── app.js              # Point d'entrée
│   ├── ui.js               # Interface utilisateur
│   ├── game.js             # Logique mode classique
│   ├── target.js           # Cible SVG classique
│   ├── scoring.js          # Calcul des scores
│   ├── players.js          # Gestion joueurs
│   ├── storage.js          # LocalStorage
│   ├── morpion.js          # Mode Morpion
│   ├── darts.js            # Mode Fléchettes 301
│   ├── customTarget.js     # Mode Ta Cible
│   └── newModes.js         # Lucky Luke, Race, Suite d'Or, 007, Killer
├── assets/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── image-server/           # Serveur d'images (dépôt séparé)
    ├── server.js
    ├── package.json
    ├── package-lock.json
    └── public/
        ├── index.html
        └── upload.html
```

---

## Configuration Git

### Application principale
```bash
cd /mnt/c/Users/lucpe/Desktop/LancerHacheSoftware
git remote: https://github.com/USOLVE/LancerHacheSoftware.git
user.name: USOLVE
user.email: contact@usolve-escapegame.com
```

### Serveur d'images
```bash
cd /mnt/c/Users/lucpe/Desktop/LancerHacheSoftware/image-server
git remote: https://github.com/USOLVE/imageserverlancerdehache.git
```

---

## Tailles des Cibles (Uniformisées)

Toutes les cibles ont les mêmes dimensions pour la projection :

| Mode | Dimensions |
|------|------------|
| Classique | rayon 220 (diamètre 440) |
| Ta Cible | rayon 220 (diamètre 440) |
| Fléchettes | rayon 220 (diamètre 440) |
| Morpion | 440 x 440 centré |
| Nouveaux modes | rayon 220 (utilisent la cible classique) |

SVG viewBox: 500 x 500

---

## Fonctionnalités Clés

### Mode Équipes
- Disponible pour: Classique, Morpion, Fléchettes 301
- 2 équipes avec alternance des joueurs
- Scores par équipe

### Paramètres
- Sons activés/désactivés
- Vibrations activées/désactivées
- Animations activées/désactivées
- Killshot: dernier lancer ou tous les lancers
- URL serveur d'images configurable

### Service Worker
- Cache v12
- Network First avec fallback cache
- Fichiers cachés: HTML, CSS, JS, icônes

---

## Serveur d'Images (Render)

### Configuration Render
- **Service**: Web Service
- **Repository**: USOLVE/imageserverlancerdehache
- **Branch**: main
- **Root Directory**: (vide)
- **Build Command**: npm install
- **Start Command**: npm start

### Fonctionnalités
- Upload d'images via Socket.io
- Sessions avec code 6 caractères
- Expiration sessions: 2 heures
- Support multi-clients par session
- Suppression d'images

---

## Démarrage Local

### Application (serveur simple)
```bash
cd /mnt/c/Users/lucpe/Desktop/LancerHacheSoftware
# Utiliser StartLancerHacheSoftware.bat ou:
npx serve .
```

### Serveur d'images (développement)
```bash
cd /mnt/c/Users/lucpe/Desktop/LancerHacheSoftware/image-server
npm start
# Serveur sur http://localhost:3000
```

---

## Dernières Modifications (29/01/2026)

1. **Modal "Compris !"** - Corrigé avec z-index 9999 et fonction globale
2. **Popup fléchettes** - Affiche maintenant les vrais points (pas +2)
3. **Tailles cibles** - Toutes uniformisées à 440px de diamètre
4. **QR code automatique** - S'affiche immédiatement en mode Ta Cible
5. **Bouton supprimer** - Fonctionne maintenant correctement
6. **Upload local** - Ajout de la fonction handleImageUpload
7. **cleanupTarget()** - Nettoie les handlers entre les modes

---

## Notes Techniques

### Problèmes Résolus
- Event listeners qui persistaient entre les modes (ajout cleanupTarget)
- Cache du navigateur empêchant les mises à jour
- Modal bloqué derrière d'autres éléments (z-index)
- Fonction handleImageUpload manquante

### Pour Vider le Cache
1. F12 → Application → Service Workers → Unregister
2. Application → Storage → Clear site data
3. Ctrl+F5 pour recharger

---

## Prochaines Améliorations Possibles

- [ ] Statistiques détaillées par joueur
- [ ] Historique des parties
- [ ] Mode tournoi
- [ ] Sons personnalisés
- [ ] Thèmes de couleurs
- [ ] Export des résultats

---

*Sauvegarde créée le 29 Janvier 2026*
