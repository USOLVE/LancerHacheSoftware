// ========================================
// IMAGE SERVER - Serveur d'upload d'images en temps réel
// ========================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 5e6 // 5MB max pour les images
});

// Configuration
const PORT = process.env.PORT || 3000;
const SESSION_EXPIRY = 2 * 60 * 60 * 1000; // 2 heures en ms
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Stockage en mémoire des sessions
const sessions = new Map();

// Structure d'une session:
// {
//     id: string,
//     createdAt: number,
//     images: [{ data: string, playerName: string, timestamp: number }],
//     clients: Set<socketId>
// }

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Socket.io events
io.on('connection', (socket) => {
    console.log(`Client connecté: ${socket.id}`);

    // Création d'une session (tablette)
    socket.on('create-session', (sessionId) => {
        console.log(`Création session: ${sessionId}`);

        // Crée ou récupère la session
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                id: sessionId,
                createdAt: Date.now(),
                images: [],
                clients: new Set()
            });
        }

        const session = sessions.get(sessionId);
        session.clients.add(socket.id);
        socket.join(sessionId);

        // Envoie les images existantes
        socket.emit('session-images', session.images);

        console.log(`Session ${sessionId} - ${session.clients.size} clients connectés`);
    });

    // Rejoindre une session (téléphone)
    socket.on('join-session', (sessionId) => {
        console.log(`Téléphone rejoint session: ${sessionId}`);

        if (!sessions.has(sessionId)) {
            // Crée la session si elle n'existe pas
            sessions.set(sessionId, {
                id: sessionId,
                createdAt: Date.now(),
                images: [],
                clients: new Set()
            });
        }

        const session = sessions.get(sessionId);
        session.clients.add(socket.id);
        socket.join(sessionId);

        socket.emit('session-joined', { success: true, imageCount: session.images.length });
    });

    // Réception d'une image
    socket.on('send-image', (data) => {
        const { sessionId, image, playerName } = data;
        console.log(`Image reçue de ${playerName} pour session ${sessionId}`);

        if (!sessions.has(sessionId)) {
            socket.emit('upload-error', { message: 'Session non trouvée' });
            return;
        }

        const session = sessions.get(sessionId);

        const imageData = {
            data: image,
            playerName: playerName || 'Anonyme',
            timestamp: Date.now()
        };

        session.images.push(imageData);

        // Diffuse l'image à tous les clients de la session
        io.to(sessionId).emit('new-image', imageData);

        // Confirmation à l'envoyeur
        socket.emit('upload-success', { message: 'Image envoyée avec succès!' });

        console.log(`Session ${sessionId} - ${session.images.length} images`);
    });

    // Supprimer une image
    socket.on('delete-image', (data) => {
        const { sessionId, timestamp } = data;

        if (sessions.has(sessionId)) {
            const session = sessions.get(sessionId);
            session.images = session.images.filter(img => img.timestamp !== timestamp);
            io.to(sessionId).emit('image-deleted', { timestamp });
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Client déconnecté: ${socket.id}`);

        // Retire le client de toutes les sessions
        sessions.forEach((session, sessionId) => {
            session.clients.delete(socket.id);
        });
    });
});

// Nettoyage automatique des sessions expirées
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    sessions.forEach((session, sessionId) => {
        if (now - session.createdAt > SESSION_EXPIRY) {
            // Notifie les clients avant suppression
            io.to(sessionId).emit('session-expired', { message: 'Session expirée' });
            sessions.delete(sessionId);
            cleaned++;
        }
    });

    if (cleaned > 0) {
        console.log(`Nettoyage: ${cleaned} session(s) expirée(s) supprimée(s)`);
    }
}, CLEANUP_INTERVAL);

// Démarrage du serveur
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     IMAGE SERVER - Lancer de Hache         ║
╠════════════════════════════════════════════╣
║  Serveur démarré sur le port ${PORT}           ║
║                                            ║
║  Tablette: http://localhost:${PORT}            ║
║  Sessions actives: ${sessions.size}                       ║
╚════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Arrêt du serveur...');
    server.close(() => {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});
