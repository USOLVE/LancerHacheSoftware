# Session de Développement - LancerHacheSoftware

## État Actuel : MVP Complet

**Date** : 26 janvier 2026

---

## Ce qui a été fait

### Structure du projet
- Projet PWA complet créé dans `LancerHacheSoftware/`
- Fichier batch `StartLancerHacheSoftware.bat` pour lancer le serveur local
- Service Worker configuré pour fonctionnement offline
- Manifest PWA avec icônes (72px à 512px)

### Fichiers créés
```
LancerHacheSoftware/
├── StartLancerHacheSoftware.bat
├── index.html (6 écrans : accueil, config, jeu, fin, paramètres, leaderboard)
├── manifest.json
├── sw.js
├── README.md
├── css/styles.css (thème sombre/rustique, responsive)
├── js/
│   ├── app.js (point d'entrée, init PWA)
│   ├── game.js (logique mode Classique + équipes)
│   ├── morpion.js (logique mode Morpion avec manches)
│   ├── darts.js (logique mode Fléchettes 301)
│   ├── target.js (cible SVG interactive WATL/IATF)
│   ├── scoring.js (zones : bullseye 6pts, zone4 4pts, etc.)
│   ├── players.js (gestion joueurs, stats)
│   ├── ui.js (interface, événements, tous les modes)
│   └── storage.js (localStorage + leaderboard)
└── assets/icons/ (8 tailles PNG)
```

### Fonctionnalités implémentées
1. **Mode Classique** : 5 séries × 3 lancers, cumul points
   - Option mode équipes (2 équipes, scores cumulés)
   - Indication du joueur actuel et de son équipe
2. **Mode Morpion** : 2 joueurs, grille 3x3, X vs O
   - Placer son symbole sur une case vide
   - Effacer le symbole adverse en lançant dessus
   - Premier à aligner 3 symboles gagne
   - Système de points par manche (victoires comptées)
   - Bouton "Manche suivante" pour continuer la session
3. **Mode Fléchettes 301** : Cible de fléchettes classique
   - Zones simple, double, triple
   - Bull (25pts) et Double Bull (50pts)
   - Partir de 301, atteindre exactement 0
   - Doit finir sur un double
   - Règle du bust (annule le tour si dépasse)
4. **Cible SVG** : Zones cliquables, calcul automatique corrigé
5. **Killshot** : 8 points, activable au dernier lancer (configurable)
6. **Contrôles** : Annuler, Raté, Menu pause
7. **Scores** : Tableau temps réel, classement final
8. **Sauvegarde** : localStorage, reprise de partie
9. **Paramètres** : Sons, vibrations, animations
10. **1 à 12 joueurs** : Mode solo ou multijoueur jusqu'à 12 personnes
    - Scoreboard compact automatique pour 7+ joueurs
    - Écran de fin adapté pour le mode solo
11. **Leaderboard** : Classement persistant de tous les joueurs
    - Meilleur score, moyenne, nombre de parties
    - Statistiques bullseyes et killshots

### Zones de scoring (WATL/IATF)
- Bullseye (centre) : 6 points
- Zone 4 : 4 points
- Zone 3 : 3 points
- Zone 2 : 2 points
- Zone 1 : 1 point
- Killshot (coins supérieurs) : 8 points
- Miss : 0 point

---

## Ce qui reste à faire (Phase 2+)

### Modes de jeu à ajouter
- [ ] Morpion (Tic-Tac-Toe) : Grille 3x3 sur la cible
- [ ] Killer : 3 vies, élimination
- [ ] Cricket : Fermer zones 15-20 + bullseye
- [ ] 501 : Partir de 501, atteindre 0

### Améliorations potentielles
- [ ] Sons réels (actuellement beeps synthétiques)
- [ ] Animations plus élaborées
- [ ] Statistiques persistantes par joueur
- [ ] Mode entraînement solo
- [ ] Multi-langue FR/EN
- [ ] Icônes PWA avec logo hache (actuellement couleur unie)

---

## Comment tester

1. Ouvrir un terminal dans `LancerHacheSoftware/`
2. Lancer : `python -m http.server 5000`
3. Aller sur `http://localhost:5000`
4. Ou double-cliquer sur `StartLancerHacheSoftware.bat` (Windows)

---

## Contexte technique

- **Tablette cible** : Samsung Galaxy Tab A9+
- **Projecteur** : Epson EB-W51 (1280×800)
- **Mode** : Duplication écran tablette → projection sur cible bois
- **Scoring** : Manuel (tap sur zone touchée)

---

## Prompt pour reprendre

Copiez ce prompt dans Claude pour reprendre :

```
Je travaille sur une application web de scoring pour le lancer de hache appelée "LancerHacheSoftware".

Le MVP est terminé avec :
- Mode Classique (5 séries de 3 lancers)
- Mode Around the World
- Cible SVG interactive avec scoring WATL/IATF
- Sauvegarde localStorage
- PWA offline

Structure : index.html + css/styles.css + js/{app,game,target,scoring,players,ui,storage}.js

Je souhaite maintenant [DÉCRIRE LA SUITE ICI : bug à corriger, nouvelle fonctionnalité, etc.]
```
