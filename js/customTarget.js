// ========================================
// CUSTOM TARGET - Mode Choisi ta Cible
// ========================================

// Configuration du serveur d'images
const IMAGE_SERVER_CONFIG = {
    // URL du serveur (à configurer selon le déploiement)
    // En local: 'http://localhost:3000'
    // En production: 'https://imageserverlancerdehache.onrender.com'
    serverUrl: localStorage.getItem('imageServerUrl') || 'https://imageserverlancerdehache.onrender.com',
    sessionExpiry: 2 * 60 * 60 * 1000 // 2 heures
};

// État du mode custom target
let customTargetState = null;
let socket = null;
let currentSessionId = null;
let receivedImages = [];
let selectedImageIndex = 0;
let onImageUpdateCallback = null;

/**
 * Génère un code de session aléatoire (6 caractères)
 */
function generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Configure l'URL du serveur d'images
 */
export function setImageServerUrl(url) {
    IMAGE_SERVER_CONFIG.serverUrl = url;
    localStorage.setItem('imageServerUrl', url);
}

/**
 * Récupère l'URL du serveur d'images
 */
export function getImageServerUrl() {
    return IMAGE_SERVER_CONFIG.serverUrl;
}

/**
 * Initialise la connexion au serveur d'images
 */
export function initImageServer(onUpdate) {
    onImageUpdateCallback = onUpdate;
    currentSessionId = generateSessionId();

    return new Promise((resolve, reject) => {
        // Charge Socket.io dynamiquement si pas déjà chargé
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
            script.onload = () => {
                connectToServer(resolve, reject);
            };
            script.onerror = () => {
                reject(new Error('Impossible de charger Socket.io'));
            };
            document.head.appendChild(script);
        } else {
            connectToServer(resolve, reject);
        }
    });
}

/**
 * Connecte au serveur Socket.io
 */
function connectToServer(resolve, reject) {
    try {
        socket = io(IMAGE_SERVER_CONFIG.serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 10000
        });

        socket.on('connect', () => {
            console.log('Connecté au serveur d\'images');
            socket.emit('create-session', currentSessionId);
            resolve({ sessionId: currentSessionId, connected: true });
        });

        socket.on('connect_error', (error) => {
            console.error('Erreur de connexion:', error);
            reject(new Error('Impossible de se connecter au serveur'));
        });

        socket.on('session-images', (images) => {
            receivedImages = images;
            if (onImageUpdateCallback) {
                onImageUpdateCallback(receivedImages);
            }
        });

        socket.on('new-image', (imageData) => {
            receivedImages.unshift(imageData);
            if (onImageUpdateCallback) {
                onImageUpdateCallback(receivedImages);
            }
        });

        socket.on('image-deleted', (data) => {
            console.log('image-deleted reçu:', data);
            const before = receivedImages.length;
            receivedImages = receivedImages.filter(img => img.timestamp !== data.timestamp);
            console.log('Images avant:', before, 'après:', receivedImages.length);
            if (onImageUpdateCallback) {
                onImageUpdateCallback(receivedImages);
            }
        });

        socket.on('session-expired', () => {
            console.log('Session expirée');
            disconnectImageServer();
        });

        socket.on('disconnect', () => {
            console.log('Déconnecté du serveur');
        });

    } catch (error) {
        reject(error);
    }
}

/**
 * Déconnecte du serveur d'images
 */
export function disconnectImageServer() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    currentSessionId = null;
    receivedImages = [];
}

/**
 * Récupère le session ID actuel
 */
export function getSessionId() {
    return currentSessionId;
}

/**
 * Récupère l'URL d'upload pour les téléphones
 */
export function getUploadUrl() {
    return `${IMAGE_SERVER_CONFIG.serverUrl}/upload.html?s=${currentSessionId}`;
}

/**
 * Récupère les images reçues
 */
export function getReceivedImages() {
    return receivedImages;
}

/**
 * Récupère l'image actuellement sélectionnée
 */
export function getSelectedImage() {
    if (receivedImages.length === 0) return null;
    return receivedImages[selectedImageIndex];
}

/**
 * Sélectionne une image par son index
 */
export function selectImage(index) {
    if (index >= 0 && index < receivedImages.length) {
        selectedImageIndex = index;
        return receivedImages[index];
    }
    return null;
}

/**
 * Passe à l'image suivante
 */
export function nextImage() {
    if (receivedImages.length === 0) return null;
    selectedImageIndex = (selectedImageIndex + 1) % receivedImages.length;
    return receivedImages[selectedImageIndex];
}

/**
 * Passe à l'image précédente
 */
export function prevImage() {
    if (receivedImages.length === 0) return null;
    selectedImageIndex = (selectedImageIndex - 1 + receivedImages.length) % receivedImages.length;
    return receivedImages[selectedImageIndex];
}

/**
 * Ajoute une image locale (uploadée directement depuis l'appareil)
 */
export function addLocalImage(imageData, playerName = 'Local') {
    const localImage = {
        data: imageData,
        playerName,
        timestamp: Date.now()
    };

    receivedImages.unshift(localImage);
    selectedImageIndex = 0;

    if (onImageUpdateCallback) {
        onImageUpdateCallback(receivedImages);
    }

    return localImage;
}

/**
 * Supprime une image
 */
export function deleteImage(timestamp) {
    console.log('deleteImage appelé avec timestamp:', timestamp);
    console.log('socket:', socket ? 'connecté' : 'non connecté');
    console.log('currentSessionId:', currentSessionId);

    if (socket && currentSessionId) {
        console.log('Envoi delete-image au serveur...');
        socket.emit('delete-image', { sessionId: currentSessionId, timestamp });
    } else {
        console.error('Impossible de supprimer: socket ou session manquant');
    }
}

/**
 * Vérifie si connecté au serveur
 */
export function isConnected() {
    return socket && socket.connected;
}

// ========================================
// GÉNÉRATION QR CODE (via API externe)
// ========================================

/**
 * Génère l'URL d'une image QR code via l'API QR Server
 */
export function generateQRCodeURL(text, size = 200) {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&bgcolor=ffffff&color=000000`;
}

/**
 * Génère un élément HTML pour le QR code
 */
export function generateQRCodeHTML(text, size = 200) {
    const qrUrl = generateQRCodeURL(text, size);
    return `<img src="${qrUrl}" alt="QR Code" width="${size}" height="${size}" style="border-radius: 10px; background: white; padding: 10px;">`;
}

// ========================================
// DESSIN DE LA CIBLE PERSONNALISÉE
// ========================================

/**
 * Dessine la cible personnalisée avec l'image sélectionnée
 */
export function drawCustomTarget(svgElement, onZoneClick) {
    if (!svgElement) return;

    const size = 500;
    const center = 250;
    const selectedImage = getSelectedImage();

    svgElement.innerHTML = '';

    // Définitions pour le masque circulaire
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'circle-clip');

    const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    clipCircle.setAttribute('cx', center);
    clipCircle.setAttribute('cy', center);
    clipCircle.setAttribute('r', 220);
    clipPath.appendChild(clipCircle);
    defs.appendChild(clipPath);

    svgElement.appendChild(defs);

    // Fond
    const background = createSvgElement('rect', {
        x: 0, y: 0, width: size, height: size,
        fill: '#2d2d2d'
    });
    svgElement.appendChild(background);

    // Cercle de la cible
    const targetCircle = createSvgElement('circle', {
        cx: center, cy: center, r: 220,
        fill: '#f5f5dc',
        stroke: '#333',
        'stroke-width': 3
    });
    svgElement.appendChild(targetCircle);

    // Image personnalisée si disponible
    if (selectedImage) {
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', selectedImage.data);
        image.setAttribute('x', center - 220);
        image.setAttribute('y', center - 220);
        image.setAttribute('width', 440);
        image.setAttribute('height', 440);
        image.setAttribute('clip-path', 'url(#circle-clip)');
        image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svgElement.appendChild(image);
    }

    // Cercles de zone (lignes uniquement)
    const zones = [220, 165, 110, 55, 25];
    zones.forEach(radius => {
        const circle = createSvgElement('circle', {
            cx: center, cy: center, r: radius,
            fill: 'none',
            stroke: 'rgba(0, 0, 0, 0.3)',
            'stroke-width': 2,
            'stroke-dasharray': '5,5'
        });
        svgElement.appendChild(circle);
    });

    // Centre (bullseye)
    const bullseye = createSvgElement('circle', {
        cx: center, cy: center, r: 25,
        fill: 'rgba(255, 0, 0, 0.6)',
        stroke: '#fff',
        'stroke-width': 2
    });
    svgElement.appendChild(bullseye);

    // Zone cliquable
    if (onZoneClick) {
        const clickZone = createSvgElement('circle', {
            cx: center, cy: center, r: 220,
            fill: 'transparent',
            cursor: 'crosshair'
        });

        clickZone.addEventListener('click', (e) => {
            const rect = svgElement.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (size / rect.width);
            const y = (e.clientY - rect.top) * (size / rect.height);

            const dx = x - center;
            const dy = y - center;
            const distance = Math.sqrt(dx * dx + dy * dy);

            let points = 0;
            let zoneName = 'miss';

            if (distance <= 25) {
                points = 5;
                zoneName = 'bullseye';
            } else if (distance <= 55) {
                points = 4;
                zoneName = 'zone4';
            } else if (distance <= 110) {
                points = 3;
                zoneName = 'zone3';
            } else if (distance <= 165) {
                points = 2;
                zoneName = 'zone2';
            } else if (distance <= 220) {
                points = 1;
                zoneName = 'zone1';
            }

            onZoneClick({
                points,
                zone: zoneName,
                x, y,
                screenX: e.clientX,
                screenY: e.clientY
            });
        });

        svgElement.appendChild(clickZone);
    }
}

/**
 * Crée un élément SVG
 */
function createSvgElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}
