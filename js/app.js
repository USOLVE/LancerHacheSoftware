// ========================================
// APP - Point d'entrée principal
// ========================================

import { initUI } from './ui.js';

/**
 * Initialisation de l'application
 */
function init() {
    // Enregistre le Service Worker pour PWA
    registerServiceWorker();

    // Initialise l'interface utilisateur
    initUI();

    // Empêche le zoom sur double-tap (tablette)
    preventDoubleTapZoom();

    // Gère le mode plein écran
    handleFullscreenChange();

    // Demande le plein écran à la première interaction utilisateur
    requestFullscreenOnFirstInteraction();

    console.log('🪓 Lancer de Hache - Application initialisée');
}

/**
 * Demande le plein écran à la première interaction utilisateur
 */
function requestFullscreenOnFirstInteraction() {
    function onFirstInteraction() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Plein écran auto non autorisé:', err);
            });
        }
        document.removeEventListener('click', onFirstInteraction);
        document.removeEventListener('touchstart', onFirstInteraction);
    }
    document.addEventListener('click', onFirstInteraction, { once: true });
    document.addEventListener('touchstart', onFirstInteraction, { once: true });
}

/**
 * Enregistre le Service Worker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker enregistré:', registration.scope);
            })
            .catch(error => {
                console.log('Erreur Service Worker:', error);
            });
    }
}

/**
 * Empêche le zoom sur double-tap
 */
function preventDoubleTapZoom() {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Empêche également le pinch-to-zoom
    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
}

/**
 * Gère les changements de mode plein écran
 */
function handleFullscreenChange() {
    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = !!document.fullscreenElement;
        document.body.classList.toggle('fullscreen', isFullscreen);
    });
}

/**
 * Gère les erreurs non capturées
 */
window.addEventListener('error', (event) => {
    console.error('Erreur non capturée:', event.error);
});

/**
 * Gère les rejets de promesses non capturés
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée:', event.reason);
});

// Démarre l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
