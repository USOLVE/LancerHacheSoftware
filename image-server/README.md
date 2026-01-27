# Serveur d'Images - Lancer de Hache

Serveur d'upload d'images en temps réel permettant aux joueurs d'envoyer des photos depuis leur téléphone vers un écran principal (tablette/projecteur).

## Fonctionnement

1. **Écran principal (tablette/projecteur)** : Affiche un QR code et une galerie d'images
2. **Téléphones des joueurs** : Scannent le QR code et peuvent envoyer des photos
3. **Temps réel** : Les images apparaissent instantanément sur l'écran principal
4. **Auto-nettoyage** : Les sessions expirent automatiquement après 2 heures

## Installation locale

```bash
# Cloner ou copier les fichiers
cd image-server

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## Structure des fichiers

```
image-server/
├── server.js          # Serveur Express + Socket.io
├── package.json       # Configuration npm
├── README.md          # Documentation
└── public/
    ├── index.html     # Frontend tablette (QR code + galerie)
    └── upload.html    # Frontend téléphone (upload photo)
```

## Déploiement sur Render.com

1. Créez un compte sur [Render.com](https://render.com)
2. Cliquez sur "New" → "Web Service"
3. Connectez votre repository GitHub ou uploadez les fichiers
4. Configurez :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : Free
5. Déployez et récupérez l'URL publique

## Déploiement sur Railway.app

1. Créez un compte sur [Railway.app](https://railway.app)
2. Cliquez sur "New Project" → "Deploy from GitHub"
3. Sélectionnez votre repository
4. Railway détecte automatiquement Node.js
5. Déployez et récupérez l'URL publique

## Architecture technique

### Backend (server.js)
- **Express** : Serveur HTTP pour servir les fichiers statiques
- **Socket.io** : Communication temps réel bidirectionnelle
- **Map()** : Stockage en mémoire (pas de base de données)
- **CORS** : Activé pour accepter les connexions de n'importe où

### Events Socket.io

| Event | Direction | Description |
|-------|-----------|-------------|
| `create-session` | Client → Server | Crée/rejoint une session (tablette) |
| `join-session` | Client → Server | Rejoint une session (téléphone) |
| `send-image` | Client → Server | Envoie une image compressée |
| `new-image` | Server → Client | Diffuse une nouvelle image |
| `delete-image` | Client → Server | Supprime une image |
| `session-expired` | Server → Client | Notifie l'expiration de session |

### Compression d'images
- Redimensionnement max 800x800 pixels
- Compression JPEG qualité 70%
- Conversion en base64 avant envoi

### Sécurité
- Images stockées uniquement en mémoire
- Nettoyage automatique toutes les 5 minutes
- Sessions expirées après 2 heures
- Pas de stockage sur disque

## Utilisation

### Sur la tablette/projecteur
1. Ouvrez `http://[votre-serveur]/`
2. Un code de session (6 caractères) et un QR code s'affichent
3. Les images reçues apparaissent en temps réel dans la galerie

### Sur les téléphones
1. Scannez le QR code affiché sur la tablette
2. Entrez votre nom (optionnel)
3. Prenez une photo ou sélectionnez une image
4. Appuyez sur "Envoyer"
5. L'image apparaît instantanément sur l'écran principal

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 3000 | Port du serveur |

## Limites

- Taille max d'image : 5MB (avant compression)
- Durée de session : 2 heures
- Stockage : Mémoire uniquement (redémarrage = perte des données)

## Licence

MIT
