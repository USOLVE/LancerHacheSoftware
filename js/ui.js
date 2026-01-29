// ========================================
// UI - Interface Utilisateur
// ========================================

import { initTarget, setKillshotEnabled, addImpactMarker, clearImpactMarkers, cleanupTarget } from './target.js';
import {
    initGame, loadGame, getGameState, getCurrentPlayer, isKillshotAllowed,
    registerThrow, registerMiss, undoLast, getGameResult, rematch, quitGame, getTeamInfo
} from './game.js';
import {
    initMorpion, getMorpionState, getCurrentMorpionPlayer, playCell,
    getMorpionResult, restartMorpion, nextRound, quitMorpion, drawMorpionGrid, updateMorpionDisplay
} from './morpion.js';
import {
    initDarts, getDartsState, getCurrentDartsPlayer, registerDartsThrow, registerDartsMiss,
    getDartsResult, restartDarts, quitDarts, drawDartsTarget, confirmNextDartsPlayer
} from './darts.js';
import {
    initImageServer, disconnectImageServer, getSessionId, getUploadUrl, getReceivedImages,
    getSelectedImage, selectImage, nextImage, prevImage, deleteImage, isConnected,
    drawCustomTarget, generateQRCodeHTML, setImageServerUrl, getImageServerUrl
} from './customTarget.js';
import {
    initLuckyLuke, registerLuckyLukeThrow, getLuckyLukeState, getCurrentLuckyLukePlayer, getLuckyLukeResult,
    initRace, registerRaceThrow, getRaceState, getCurrentRacePlayer, getRaceResult,
    initSuiteOr, registerSuiteOrThrow, getSuiteOrState, getCurrentSuiteOrPlayer, getSuiteOrResult, getExpectedZone,
    init007, register007Throw, get007State, getCurrent007Player, get007Result,
    initKiller, registerKillerThrow, getKillerState, getCurrentKillerPlayer, getKillerResult,
    quitNewMode, restartNewMode
} from './newModes.js';
import { loadCurrentGame, loadSettings, saveSettings, clearAllData, hasCurrentGame, loadLeaderboard, clearLeaderboard } from './storage.js';
import { sortPlayersByScore, getAverageScore, getHitRate } from './players.js';

// Descriptions des modes de jeu
const MODE_DESCRIPTIONS = {
    classic: {
        title: 'Mode Classique',
        description: 'Chaque joueur effectue 5 séries de 3 lancers. Le score est calculé selon la zone touchée : Centre (6 pts), Zone 4 (4 pts), Zone 3 (3 pts), Zone 2 (2 pts), Zone 1 (1 pt). Les Killshots valent 8 points et sont disponibles au dernier lancer de chaque série.'
    },
    luckyLuke: {
        title: 'Lucky Luke',
        description: 'Chaque joueur lance une fois. Si un joueur fait un score STRICTEMENT SUPÉRIEUR au joueur précédent, il l\'élimine ! Le dernier joueur encore en lice remporte la partie. Soyez rapide et précis comme Lucky Luke !'
    },
    race: {
        title: 'Race',
        description: 'Course aux points ! Le premier joueur à atteindre ou dépasser 25 points remporte la partie. Chaque joueur lance à tour de rôle. Visez les zones à haut score pour gagner rapidement !'
    },
    suiteOr: {
        title: 'Suite d\'Or',
        description: 'Touchez les zones dans l\'ordre : 1 → 2 → 3 → 4 → 6 → 4 → 3 → 2 → 1. Si vous touchez la bonne zone, vous rejouez immédiatement ! Sinon, c\'est au joueur suivant. Vous reprenez toujours là où vous en étiez dans la séquence.'
    },
    mode007: {
        title: '007',
        description: 'Soyez précis comme James Bond ! Le premier joueur à toucher le CENTRE (Bullseye) 5 fois remporte la partie. Seuls les tirs au centre comptent. Concentration maximale requise !'
    },
    killer: {
        title: 'Killer',
        description: 'Atteignez EXACTEMENT 20 points pour gagner. Attention : si vous dépassez 20, vous revenez à 0 ! De plus, si votre score égalise celui d\'un autre joueur, ce joueur est remis à 0. Stratégie et précision sont de mise !'
    },
    morpion: {
        title: 'Morpion',
        description: 'Jouez au morpion sur la cible ! 2 joueurs (ou 2 équipes de 2) s\'affrontent. Alignez 3 de vos symboles pour gagner la manche. Le premier à 3 victoires remporte la partie.'
    },
    darts301: {
        title: 'Fléchettes 301',
        description: 'Commencez à 301 points et descendez jusqu\'à exactement 0. Chaque joueur lance 3 fléchettes par tour. En mode équipe, le score est partagé. Attention aux "bust" si vous dépassez !'
    },
    customTarget: {
        title: 'Choisis ta Cible',
        description: 'Scannez le QR code avec votre téléphone pour envoyer une photo qui s\'affichera sur la cible. Parfait pour personnaliser vos parties avec des photos de vos amis !'
    }
};

// Mode de jeu actuel
let currentMode = null;

// Éléments DOM
let screens = {};
let elements = {};
let settings = {};

/**
 * Initialise l'interface utilisateur
 */
export function initUI() {
    cacheElements();
    loadUserSettings();
    setupEventListeners();
    checkForSavedGame();
    showScreen('home');
}

/**
 * Met en cache les éléments DOM
 */
function cacheElements() {
    // Écrans
    screens = {
        home: document.getElementById('screen-home'),
        setup: document.getElementById('screen-setup'),
        game: document.getElementById('screen-game'),
        end: document.getElementById('screen-end'),
        settings: document.getElementById('screen-settings'),
        leaderboard: document.getElementById('screen-leaderboard')
    };

    // Éléments interactifs
    elements = {
        // Accueil
        btnNewGame: document.getElementById('btn-new-game'),
        btnResumeGame: document.getElementById('btn-resume-game'),
        btnSettings: document.getElementById('btn-settings'),

        // Configuration
        playerCount: document.getElementById('player-count'),
        playerCountDisplay: document.getElementById('player-count-display'),
        playerNamesContainer: document.getElementById('player-names-container'),
        gameModes: document.querySelectorAll('.mode-btn'),
        btnBackHome: document.getElementById('btn-back-home'),
        btnStartGame: document.getElementById('btn-start-game'),

        // Jeu
        targetSvg: document.getElementById('target-svg'),
        currentPlayerName: document.getElementById('current-player-name'),
        currentScore: document.getElementById('current-score'),
        throwNumber: document.getElementById('throw-number'),
        seriesNumber: document.getElementById('series-number'),
        scoreboardList: document.getElementById('scoreboard-list'),
        btnUndo: document.getElementById('btn-undo'),
        btnMiss: document.getElementById('btn-miss'),
        btnKillshot: document.getElementById('btn-killshot'),
        btnMenu: document.getElementById('btn-menu'),
        pauseMenu: document.getElementById('pause-menu'),
        btnResume: document.getElementById('btn-resume'),
        btnFullscreen: document.getElementById('btn-fullscreen'),
        btnQuitGame: document.getElementById('btn-quit-game'),
        pointsPopup: document.getElementById('points-popup'),

        // Fin de partie
        winnerTitle: document.getElementById('winner-title'),
        winnerName: document.getElementById('winner-name'),
        rankingsList: document.getElementById('rankings-list'),
        statsContainer: document.getElementById('stats-container'),
        btnRematch: document.getElementById('btn-rematch'),
        btnNewGameEnd: document.getElementById('btn-new-game-end'),
        btnHome: document.getElementById('btn-home'),

        // Paramètres
        settingSounds: document.getElementById('setting-sounds'),
        settingVibration: document.getElementById('setting-vibration'),
        settingAnimations: document.getElementById('setting-animations'),
        settingKillshotThrow: document.getElementById('setting-killshot-throw'),
        settingImageServer: document.getElementById('setting-image-server'),
        btnBackSettings: document.getElementById('btn-back-settings'),
        btnClearData: document.getElementById('btn-clear-data'),

        // Leaderboard
        btnLeaderboard: document.getElementById('btn-leaderboard'),
        leaderboardList: document.getElementById('leaderboard-list'),
        btnBackLeaderboard: document.getElementById('btn-back-leaderboard'),
        btnClearLeaderboard: document.getElementById('btn-clear-leaderboard'),

        // Mode équipes
        teamModeSection: document.getElementById('team-mode-section'),
        teamModeToggle: document.getElementById('team-mode-toggle'),

        // Historique des lancers (fléchettes)
        roundThrows: document.getElementById('round-throws'),
        roundThrowsList: document.getElementById('round-throws-list'),
        roundThrowsTotal: document.getElementById('round-throws-total'),

        // QR Code / Upload modal
        qrUploadModal: document.getElementById('qr-upload-modal'),
        qrCodeContainer: document.getElementById('qr-code-container'),
        imageUpload: document.getElementById('image-upload'),
        imagePreview: document.getElementById('image-preview'),
        previewImg: document.getElementById('preview-img'),
        imageTimer: document.getElementById('image-timer'),
        btnClearImage: document.getElementById('btn-clear-image'),
        btnCloseQrModal: document.getElementById('btn-close-qr-modal'),

        // Modal description des modes
        modeDescModal: document.getElementById('mode-description-modal'),
        modeDescTitle: document.getElementById('mode-desc-title'),
        modeDescText: document.getElementById('mode-desc-text'),
        btnCloseModeDesc: document.getElementById('btn-close-mode-desc')
    };
}

/**
 * Charge les paramètres utilisateur
 */
function loadUserSettings() {
    settings = loadSettings();
    applySettings();
}

/**
 * Applique les paramètres à l'UI
 */
function applySettings() {
    if (elements.settingSounds) elements.settingSounds.checked = settings.soundsEnabled;
    if (elements.settingVibration) elements.settingVibration.checked = settings.vibrationEnabled;
    if (elements.settingAnimations) elements.settingAnimations.checked = settings.animationsEnabled;
    if (elements.settingKillshotThrow) elements.settingKillshotThrow.value = settings.killshotThrow;
    if (elements.settingImageServer) {
        elements.settingImageServer.value = getImageServerUrl();
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Accueil
    elements.btnNewGame?.addEventListener('click', () => showScreen('setup'));
    elements.btnResumeGame?.addEventListener('click', resumeGame);
    elements.btnLeaderboard?.addEventListener('click', showLeaderboard);
    elements.btnSettings?.addEventListener('click', () => showScreen('settings'));

    // Configuration
    elements.playerCount?.addEventListener('input', updatePlayerInputs);
    elements.teamModeToggle?.addEventListener('change', updatePlayerInputs);
    elements.gameModes?.forEach(btn => {
        btn.addEventListener('click', () => selectGameMode(btn));
    });
    elements.btnBackHome?.addEventListener('click', () => showScreen('home'));
    elements.btnStartGame?.addEventListener('click', startGame);

    // Jeu
    elements.btnUndo?.addEventListener('click', handleUndo);
    elements.btnMiss?.addEventListener('click', handleMiss);
    elements.btnKillshot?.addEventListener('click', handleKillshot);
    elements.btnMenu?.addEventListener('click', showPauseMenu);
    elements.btnResume?.addEventListener('click', hidePauseMenu);
    elements.btnFullscreen?.addEventListener('click', toggleFullscreen);
    elements.btnQuitGame?.addEventListener('click', handleQuitGame);

    // Fin de partie
    elements.btnRematch?.addEventListener('click', handleRematch);
    elements.btnNewGameEnd?.addEventListener('click', handleNewGameFromEnd);
    elements.btnHome?.addEventListener('click', () => showScreen('home'));

    // Paramètres
    elements.settingSounds?.addEventListener('change', saveUserSettings);
    elements.settingVibration?.addEventListener('change', saveUserSettings);
    elements.settingAnimations?.addEventListener('change', saveUserSettings);
    elements.settingKillshotThrow?.addEventListener('change', saveUserSettings);
    elements.settingImageServer?.addEventListener('change', handleImageServerChange);
    elements.btnBackSettings?.addEventListener('click', () => showScreen('home'));
    elements.btnClearData?.addEventListener('click', handleClearData);

    // Leaderboard
    elements.btnBackLeaderboard?.addEventListener('click', () => showScreen('home'));
    elements.btnClearLeaderboard?.addEventListener('click', handleClearLeaderboard);

    // QR Code / Upload modal
    elements.btnCloseQrModal?.addEventListener('click', hideQrUploadModal);
    elements.imageUpload?.addEventListener('change', handleImageUpload);
    elements.btnClearImage?.addEventListener('click', handleClearCustomImage);

    // Modal description des modes
    elements.btnCloseModeDesc?.addEventListener('click', hideModeDescModal);

    // Initialise le nombre de joueurs
    updatePlayerInputs();
}

/**
 * Vérifie s'il y a une partie sauvegardée
 */
function checkForSavedGame() {
    if (hasCurrentGame()) {
        elements.btnResumeGame.style.display = 'block';
    } else {
        elements.btnResumeGame.style.display = 'none';
    }
}

/**
 * Affiche un écran spécifique
 */
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen?.classList.remove('active');
    });
    screens[screenName]?.classList.add('active');
}

/**
 * Met à jour les champs de saisie des noms de joueurs
 */
function updatePlayerInputs() {
    const count = parseInt(elements.playerCount.value);
    elements.playerCountDisplay.textContent = count;

    const teamMode = elements.teamModeToggle?.checked && count >= 2;

    updateTeamModeVisibility();

    let html = '';
    if (teamMode) {
        // Mode équipes : divise les joueurs en 2 équipes
        const team1Count = Math.ceil(count / 2);
        const team2Count = count - team1Count;

        html += '<div class="team-group"><div class="team-label" style="color: #ff6b35;">Équipe 1</div>';
        for (let i = 0; i < team1Count; i++) {
            html += `
                <input type="text"
                       class="player-name-input"
                       placeholder="Joueur ${i + 1}"
                       data-player="${i}"
                       data-team="1"
                       maxlength="15">
            `;
        }
        html += '</div>';

        html += '<div class="team-group"><div class="team-label" style="color: #4fc3f7;">Équipe 2</div>';
        for (let i = team1Count; i < count; i++) {
            html += `
                <input type="text"
                       class="player-name-input"
                       placeholder="Joueur ${i + 1}"
                       data-player="${i}"
                       data-team="2"
                       maxlength="15">
            `;
        }
        html += '</div>';
    } else {
        for (let i = 0; i < count; i++) {
            html += `
                <input type="text"
                       class="player-name-input"
                       placeholder="Joueur ${i + 1}"
                       data-player="${i}"
                       maxlength="15">
            `;
        }
    }
    elements.playerNamesContainer.innerHTML = html;
}

/**
 * Sélectionne un mode de jeu
 */
function selectGameMode(btn) {
    elements.gameModes.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const mode = btn.dataset.mode;

    // Affiche la description du mode
    showModeDescModal(mode);

    // Le mode Morpion : 2 joueurs ou 4 en équipes
    if (mode === 'morpion') {
        elements.playerCount.min = 2;
        elements.playerCount.max = 4;
        elements.playerCount.value = 2;
        elements.playerCount.disabled = false;
        elements.playerCountDisplay.textContent = '2';
        elements.teamModeSection.style.display = 'none';
        elements.teamModeToggle.checked = false;
        updatePlayerInputs();
    } else if (mode === 'darts301') {
        // Mode 301 : supporte les équipes
        elements.playerCount.min = 1;
        elements.playerCount.max = 12;
        elements.playerCount.disabled = false;
        updateTeamModeVisibility();
        updatePlayerInputs();
    } else if (mode === 'customTarget') {
        // Mode Custom Target : pas de joueurs, juste affichage
        elements.playerCount.min = 1;
        elements.playerCount.max = 1;
        elements.playerCount.value = 1;
        elements.playerCount.disabled = true;
        elements.playerCountDisplay.textContent = '-';
        elements.teamModeSection.style.display = 'none';
        elements.teamModeToggle.checked = false;
        elements.playerNamesContainer.innerHTML = '<p style="color: #888; text-align: center;">Ce mode affiche simplement une image personnalisée sur la cible</p>';
    } else if (mode === 'luckyLuke') {
        // Lucky Luke : minimum 2 joueurs
        elements.playerCount.min = 2;
        elements.playerCount.max = 12;
        if (parseInt(elements.playerCount.value) < 2) elements.playerCount.value = 2;
        elements.playerCount.disabled = false;
        elements.playerCountDisplay.textContent = elements.playerCount.value;
        elements.teamModeSection.style.display = 'none';
        elements.teamModeToggle.checked = false;
        updatePlayerInputs();
    } else {
        // Autres modes (classic, race, suiteOr, mode007, killer)
        elements.playerCount.min = 1;
        elements.playerCount.max = 12;
        elements.playerCount.disabled = false;
        elements.teamModeSection.style.display = 'none';
        elements.teamModeToggle.checked = false;
        updatePlayerInputs();
    }
}

/**
 * Affiche le modal de description du mode
 */
function showModeDescModal(mode) {
    const desc = MODE_DESCRIPTIONS[mode];
    if (!desc || !elements.modeDescModal) return;

    elements.modeDescTitle.textContent = desc.title;
    elements.modeDescText.textContent = desc.description;
    elements.modeDescModal.style.display = 'flex';
}

/**
 * Cache le modal de description du mode
 */
function hideModeDescModal() {
    if (elements.modeDescModal) {
        elements.modeDescModal.style.display = 'none';
    }
}

/**
 * Met à jour la visibilité de l'option équipes
 */
function updateTeamModeVisibility() {
    const count = parseInt(elements.playerCount.value);
    const modeBtn = document.querySelector('.mode-btn.selected');
    const mode = modeBtn?.dataset.mode || 'classic';

    // Affiche l'option équipes pour:
    // - Mode classique avec 2+ joueurs
    // - Mode morpion avec exactement 4 joueurs
    // - Mode fléchettes 301 avec 2+ joueurs
    // - Mode custom target avec 2+ joueurs
    if (mode === 'classic' && count >= 2) {
        elements.teamModeSection.style.display = 'block';
    } else if (mode === 'morpion' && count === 4) {
        elements.teamModeSection.style.display = 'block';
    } else if (mode === 'darts301' && count >= 2) {
        elements.teamModeSection.style.display = 'block';
    } else if (mode === 'customTarget' && count >= 2) {
        elements.teamModeSection.style.display = 'block';
    } else {
        elements.teamModeSection.style.display = 'none';
        elements.teamModeToggle.checked = false;
    }
}

/**
 * Démarre une nouvelle partie
 */
function startGame() {
    const modeBtn = document.querySelector('.mode-btn.selected');
    const mode = modeBtn?.dataset.mode || 'classic';
    currentMode = mode;

    const nameInputs = elements.playerNamesContainer.querySelectorAll('.player-name-input');
    const playerNames = Array.from(nameInputs).map((input, i) =>
        input.value.trim() || `Joueur ${i + 1}`
    );

    // Cache l'historique des lancers par défaut
    elements.roundThrows.style.display = 'none';

    if (mode === 'morpion') {
        // Mode Morpion (avec ou sans équipes)
        cleanupTarget(); // Nettoie les handlers de la cible classique
        const teamMode = elements.teamModeToggle?.checked && playerNames.length === 4;
        initMorpion(playerNames, onMorpionUpdate, { teamMode });
        drawMorpionGrid(elements.targetSvg, onMorpionCellClick);
        updateMorpionUI();

        // Cache les contrôles classiques
        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = 'none';
        elements.btnKillshot.style.display = 'none';
    } else if (mode === 'darts301') {
        // Mode Fléchettes 301 (avec ou sans équipes)
        cleanupTarget(); // Nettoie les handlers de la cible classique
        const teamMode = elements.teamModeToggle?.checked && playerNames.length >= 2;
        const teams = {};

        if (teamMode) {
            nameInputs.forEach((input, i) => {
                teams[i] = parseInt(input.dataset.team) || 1;
            });
        }

        initDarts(playerNames, onDartsUpdate, 301, { teamMode, teams });
        drawDartsTarget(elements.targetSvg, onDartsClick);
        updateDartsUI();

        // Affiche seulement le bouton raté
        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté';
        elements.btnKillshot.style.display = 'none';
    } else if (mode === 'customTarget') {
        // Mode Custom Target : connexion au serveur d'images
        cleanupTarget(); // Nettoie les handlers de la cible classique

        // Bouton QR Code (utilise btnUndo)
        elements.btnUndo.style.display = '';
        elements.btnUndo.textContent = '📱 QR Code';
        elements.btnUndo.onclick = () => {
            showQrUploadModal();
        };

        // Bouton image précédente (utilise btnMiss)
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '◀ Préc.';
        elements.btnMiss.onclick = () => {
            prevImage();
            drawCustomTarget(elements.targetSvg, onCustomTargetClick);
            updateCustomTargetUI();
        };

        // Bouton image suivante (utilise btnKillshot)
        elements.btnKillshot.style.display = '';
        elements.btnKillshot.disabled = false;
        elements.btnKillshot.textContent = 'Suiv. ▶';
        elements.btnKillshot.onclick = () => {
            nextImage();
            drawCustomTarget(elements.targetSvg, onCustomTargetClick);
            updateCustomTargetUI();
        };

        // Cache les infos de jeu
        elements.throwNumber.textContent = 'Connexion...';
        elements.seriesNumber.textContent = 'Choisis ta cible';
        elements.currentPlayerName.textContent = '';
        elements.currentScore.textContent = '';
        elements.roundThrows.style.display = 'none';

        // Dessine la cible par défaut
        drawCustomTarget(elements.targetSvg, onCustomTargetClick);

        // Initialise la connexion au serveur
        initImageServer(onImagesUpdate)
            .then((result) => {
                console.log('Connecté avec session:', result.sessionId);
                drawCustomTarget(elements.targetSvg, onCustomTargetClick);
                updateCustomTargetUI();
                showQrUploadModal();
            })
            .catch((error) => {
                console.error('Erreur connexion:', error);
                elements.throwNumber.textContent = 'Hors ligne';
                elements.scoreboardList.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #dc3545;">
                        <p>Impossible de se connecter au serveur d'images.</p>
                        <p style="font-size: 0.9rem; color: #888; margin-top: 10px;">
                            Vérifiez que le serveur est démarré sur:<br>
                            <code style="background: #333; padding: 5px 10px; border-radius: 5px;">${getImageServerUrl()}</code>
                        </p>
                        <button class="btn btn-secondary" style="margin-top: 15px;" onclick="location.reload()">Réessayer</button>
                    </div>
                `;
                // Affiche quand même le modal pour voir l'état
                showQrUploadModal();
            });
    } else if (mode === 'luckyLuke') {
        // Mode Lucky Luke
        initLuckyLuke(playerNames, onLuckyLukeUpdate);
        initTarget(elements.targetSvg, onNewModeTargetClick);
        setKillshotEnabled(false);
        updateLuckyLukeUI();

        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté (0 pt)';
        elements.btnMiss.onclick = () => handleNewModeThrow(0, 'miss');
        elements.btnKillshot.style.display = 'none';
    } else if (mode === 'race') {
        // Mode Race
        initRace(playerNames, onRaceUpdate);
        initTarget(elements.targetSvg, onNewModeTargetClick);
        setKillshotEnabled(false);
        updateRaceUI();

        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté (0 pt)';
        elements.btnMiss.onclick = () => handleNewModeThrow(0, 'miss');
        elements.btnKillshot.style.display = 'none';
    } else if (mode === 'suiteOr') {
        // Mode Suite d'Or
        initSuiteOr(playerNames, onSuiteOrUpdate);
        initTarget(elements.targetSvg, onNewModeTargetClick);
        setKillshotEnabled(false);
        updateSuiteOrUI();

        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté';
        elements.btnMiss.onclick = () => handleNewModeThrow(0, 'miss');
        elements.btnKillshot.style.display = 'none';
    } else if (mode === 'mode007') {
        // Mode 007
        init007(playerNames, on007Update);
        initTarget(elements.targetSvg, onNewModeTargetClick);
        setKillshotEnabled(false);
        update007UI();

        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté';
        elements.btnMiss.onclick = () => handleNewModeThrow(0, 'miss');
        elements.btnKillshot.style.display = 'none';
    } else if (mode === 'killer') {
        // Mode Killer
        initKiller(playerNames, onKillerUpdate);
        initTarget(elements.targetSvg, onNewModeTargetClick);
        setKillshotEnabled(false);
        updateKillerUI();

        elements.btnUndo.style.display = 'none';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté (0 pt)';
        elements.btnMiss.onclick = () => handleNewModeThrow(0, 'miss');
        elements.btnKillshot.style.display = 'none';
    } else {
        // Mode Classique (avec ou sans équipes)
        const teamMode = elements.teamModeToggle?.checked || false;
        const teams = {};

        if (teamMode) {
            nameInputs.forEach((input, i) => {
                teams[i] = parseInt(input.dataset.team) || 1;
            });
        }

        initGame(mode, playerNames, onGameUpdate, { teamMode, teams });
        initTarget(elements.targetSvg, onTargetClick);

        elements.btnUndo.style.display = '';
        elements.btnMiss.style.display = '';
        elements.btnMiss.textContent = '✗ Raté';
        elements.btnMiss.onclick = null;
        elements.btnKillshot.style.display = '';
    }

    showScreen('game');
    if (mode !== 'morpion' && mode !== 'darts301' && !['luckyLuke', 'race', 'suiteOr', 'mode007', 'killer'].includes(mode)) {
        updateGameUI();
    }
}

/**
 * Reprend une partie sauvegardée
 */
function resumeGame() {
    const savedGame = loadCurrentGame();
    if (savedGame) {
        loadGame(savedGame, onGameUpdate);
        initTarget(elements.targetSvg, onTargetClick);
        showScreen('game');
        updateGameUI();
    }
}

/**
 * Callback appelé lors d'un clic sur la cible
 */
function onTargetClick(hitData) {
    const result = registerThrow(hitData.zone, hitData.points);

    if (result) {
        // Affiche le marqueur d'impact
        addImpactMarker(
            elements.targetSvg.parentElement,
            hitData.relativeX,
            hitData.relativeY,
            hitData.zone
        );

        // Affiche les points
        showPointsPopup(hitData.points, hitData.zone, hitData.screenX, hitData.screenY);

        // Feedback haptique
        if (settings.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(hitData.points > 0 ? 50 : 100);
        }

        // Son (placeholder)
        playSound(hitData.zone);
    }
}

/**
 * Callback appelé lors d'une mise à jour du jeu
 */
function onGameUpdate(gameState) {
    updateGameUI();

    if (gameState.status === 'finished') {
        setTimeout(() => {
            showEndScreen();
        }, 1000);
    }
}

/**
 * Callback appelé lors d'un clic sur une case du morpion
 */
function onMorpionCellClick(cellIndex) {
    const result = playCell(cellIndex);

    if (result) {
        // Feedback haptique
        if (settings.vibrationEnabled && navigator.vibrate) {
            if (result.action === 'place') {
                navigator.vibrate(50);
            } else if (result.action === 'erase') {
                navigator.vibrate([50, 50, 50]);
            }
        }

        // Son
        if (settings.soundsEnabled) {
            playMorpionSound(result.action);
        }

        // Met à jour l'affichage
        updateMorpionDisplay(elements.targetSvg);
        updateMorpionUI();
    }
}

/**
 * Callback appelé lors d'une mise à jour du morpion
 */
function onMorpionUpdate(state) {
    updateMorpionDisplay(elements.targetSvg);
    updateMorpionUI();

    if (state.status !== 'playing') {
        setTimeout(() => {
            showMorpionEndScreen();
        }, 1500);
    }
}

/**
 * Met à jour l'interface du morpion
 */
function updateMorpionUI() {
    const state = getMorpionState();
    if (!state) return;

    const player = getCurrentMorpionPlayer();

    // Informations du joueur actuel
    const teamColor = player.symbol === 'X' ? '#ff6b35' : '#4fc3f7';
    elements.currentPlayerName.innerHTML = `<span style="color: ${teamColor}">${player.name} (${player.symbol})</span>`;

    // Score affiché
    if (state.teamMode) {
        elements.currentScore.textContent = `${state.teams[1].score} - ${state.teams[2].score}`;
    } else {
        elements.currentScore.textContent = `${state.players[0].score} - ${state.players[1].score}`;
    }

    // Informations de jeu
    elements.throwNumber.textContent = state.status === 'playing' ? 'En cours' : (state.status === 'won' ? 'Victoire !' : 'Match nul');
    elements.seriesNumber.textContent = `Manche ${state.roundNumber}`;

    // Tableau des scores
    if (state.teamMode) {
        // Mode équipes : affiche par équipe
        const team1Players = state.players.filter(p => p.team === 1);
        const team2Players = state.players.filter(p => p.team === 2);
        const currentPlayer = getCurrentMorpionPlayer();

        elements.scoreboardList.innerHTML = `
            <div class="team-score-header" style="color: #ff6b35; border-left: 3px solid #ff6b35;">
                Équipe X: <strong>${state.teams[1].score}</strong>
            </div>
            ${team1Players.map(p => `
                <div class="scoreboard-item ${p.id === currentPlayer.id && state.status === 'playing' ? 'active' : ''}" style="border-left-color: #ff6b35;">
                    <span class="name">${p.name}</span>
                </div>
            `).join('')}
            <div class="team-score-header" style="color: #4fc3f7; border-left: 3px solid #4fc3f7; margin-top: 10px;">
                Équipe O: <strong>${state.teams[2].score}</strong>
            </div>
            ${team2Players.map(p => `
                <div class="scoreboard-item ${p.id === currentPlayer.id && state.status === 'playing' ? 'active' : ''}" style="border-left-color: #4fc3f7;">
                    <span class="name">${p.name}</span>
                </div>
            `).join('')}
        `;
    } else {
        // Mode normal
        elements.scoreboardList.innerHTML = state.players.map((p, i) => `
            <div class="scoreboard-item ${i === state.currentPlayerIndex && state.status === 'playing' ? 'active' : ''}">
                <span class="name">${p.name}</span>
                <span class="score" style="color: ${p.symbol === 'X' ? '#ff6b35' : '#4fc3f7'}">
                    <span style="font-size: 24px">${p.symbol}</span>
                    <span style="font-size: 28px; margin-left: 10px">${p.score}</span>
                </span>
            </div>
        `).join('');
    }
}

/**
 * Joue un son pour le morpion
 */
function playMorpionSound(action) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Fréquence selon l'action
        const frequencies = {
            'place': 660,
            'erase': 330,
            'wasted': 220
        };

        oscillator.frequency.value = frequencies[action] || 440;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        // Audio non supporté
    }
}

/**
 * Callback appelé lors d'un clic sur la cible de fléchettes
 */
function onDartsClick(zoneData, screenX, screenY) {
    const result = registerDartsThrow(zoneData.segment, zoneData.multiplier);

    if (result) {
        // Feedback haptique
        if (settings.vibrationEnabled && navigator.vibrate) {
            if (result.bust) {
                navigator.vibrate([100, 50, 100]);
            } else {
                navigator.vibrate(50);
            }
        }

        // Affiche les points
        showDartsPointsPopup(result, zoneData.name, screenX, screenY);

        // Met à jour l'affichage
        updateDartsUI();
    }
}

/**
 * Callback appelé lors d'une mise à jour du 301
 */
function onDartsUpdate(state) {
    updateDartsUI();

    if (state.status === 'finished') {
        setTimeout(() => {
            showDartsEndScreen();
        }, 1500);
    } else if (state.waitingForNextPlayer) {
        // Délai de 5 secondes après le 3ème lancer avant de passer au joueur suivant
        setTimeout(() => {
            confirmNextDartsPlayer();
        }, 5000);
    }
}

/**
 * Met à jour l'interface du 301
 */
function updateDartsUI() {
    const state = getDartsState();
    if (!state) return;

    const player = getCurrentDartsPlayer();

    // Informations du joueur actuel
    if (state.teamMode) {
        const teamColor = player.team === 1 ? '#ff6b35' : '#4fc3f7';
        elements.currentPlayerName.innerHTML = `<span style="color: ${teamColor}">${player.name}</span>`;
        // Affiche le score de l'équipe du joueur actuel
        elements.currentScore.textContent = state.teams[player.team].score;
    } else {
        elements.currentPlayerName.textContent = player.name;
        elements.currentScore.textContent = player.score;
    }

    // Informations de lancer
    if (state.waitingForNextPlayer) {
        elements.throwNumber.textContent = 'Tour terminé';
        elements.seriesNumber.textContent = 'Joueur suivant...';
    } else {
        elements.throwNumber.textContent = `Lancer ${state.currentThrow}/${state.throwsPerRound}`;
        elements.seriesNumber.textContent = 'Mode 301';
    }

    // Affiche l'historique des lancers du tour
    elements.roundThrows.style.display = 'flex';
    updateRoundThrowsDisplay(player.currentRoundThrows, state.throwsPerRound);

    // Tableau des scores
    if (state.teamMode) {
        const team1Players = state.players.filter(p => p.team === 1);
        const team2Players = state.players.filter(p => p.team === 2);
        const currentPlayerId = player.id;

        elements.scoreboardList.innerHTML = `
            <div class="team-score-header" style="color: #ff6b35; border-left: 3px solid #ff6b35;">
                Équipe 1: <strong>${state.teams[1].score}</strong>
            </div>
            ${team1Players.map(p => `
                <div class="scoreboard-item ${p.id === currentPlayerId ? 'active' : ''}" style="border-left-color: #ff6b35;">
                    <span class="name">${p.name}</span>
                </div>
            `).join('')}
            <div class="team-score-header" style="color: #4fc3f7; border-left: 3px solid #4fc3f7; margin-top: 10px;">
                Équipe 2: <strong>${state.teams[2].score}</strong>
            </div>
            ${team2Players.map(p => `
                <div class="scoreboard-item ${p.id === currentPlayerId ? 'active' : ''}" style="border-left-color: #4fc3f7;">
                    <span class="name">${p.name}</span>
                </div>
            `).join('')}
        `;
    } else {
        elements.scoreboardList.innerHTML = state.players.map((p, i) => `
            <div class="scoreboard-item ${i === state.currentPlayerIndex ? 'active' : ''}">
                <span class="name">${p.name}</span>
                <span class="score">${p.score}</span>
            </div>
        `).join('');
    }
}

/**
 * Met à jour l'affichage des lancers du tour
 */
function updateRoundThrowsDisplay(throws, maxThrows) {
    let html = '';
    let total = 0;
    let hasBust = false;

    for (let i = 0; i < maxThrows; i++) {
        const t = throws[i];
        if (t) {
            if (t.bust) {
                hasBust = true;
                html += `
                    <div class="round-throw-item bust">
                        <span class="round-throw-name">BUST</span>
                        <span class="round-throw-points">X</span>
                    </div>
                `;
            } else {
                total += t.points;
                const name = t.multiplier === 3 ? `T${t.segment}` :
                            t.multiplier === 2 ? `D${t.segment}` :
                            t.segment === 25 ? 'Bull' :
                            t.segment === 50 ? 'D-Bull' :
                            `${t.segment}`;
                html += `
                    <div class="round-throw-item">
                        <span class="round-throw-name">${name}</span>
                        <span class="round-throw-points">${t.points}</span>
                    </div>
                `;
            }
        } else {
            html += `
                <div class="round-throw-item empty">
                    <span class="round-throw-name">-</span>
                    <span class="round-throw-points">-</span>
                </div>
            `;
        }
    }

    elements.roundThrowsList.innerHTML = html;
    elements.roundThrowsTotal.textContent = hasBust ? 'BUST!' : `= ${total}`;
    elements.roundThrowsTotal.style.color = hasBust ? 'var(--accent-danger)' : 'var(--accent-primary)';
}

/**
 * Affiche le popup des points pour les fléchettes
 */
function showDartsPointsPopup(result, zoneName, x, y) {
    const popup = elements.pointsPopup;
    if (!popup) return;

    if (result.bust) {
        popup.textContent = 'BUST!';
        popup.className = 'points-popup miss';
    } else if (result.points === 0) {
        popup.textContent = 'RATÉ';
        popup.className = 'points-popup miss';
    } else {
        popup.textContent = `${zoneName} (${result.points})`;
        popup.className = 'points-popup';
        if (result.multiplier === 3) {
            popup.classList.add('killshot');
        }
    }

    // Positionne le popup
    const container = elements.targetSvg.parentElement;
    const rect = container.getBoundingClientRect();
    popup.style.left = `${x - rect.left}px`;
    popup.style.top = `${y - rect.top}px`;

    // Animation
    popup.classList.remove('visible');
    void popup.offsetWidth;
    popup.classList.add('visible');
}

/**
 * Affiche l'écran de fin du 301
 */
function showDartsEndScreen() {
    const result = getDartsResult();
    if (!result) return;

    if (result.teamMode) {
        // Mode équipes
        const winColor = result.winningTeam === 1 ? '#ff6b35' : '#4fc3f7';
        elements.winnerTitle.textContent = '🎯 Victoire !';
        elements.winnerName.innerHTML = `<span style="color: ${winColor}">Équipe ${result.winningTeam}</span>`;

        // Classement par équipes puis par joueur
        const team1Players = result.players.filter(p => p.team === 1);
        const team2Players = result.players.filter(p => p.team === 2);
        const winningTeamFirst = result.winningTeam === 1;

        const team1Html = `
            <div class="ranking-item ${winningTeamFirst ? 'first' : ''}" style="border-left: 4px solid #ff6b35;">
                <span class="ranking-position">${winningTeamFirst ? '🥇' : '🥈'}</span>
                <span class="ranking-name" style="color: #ff6b35;">Équipe 1</span>
                <span class="ranking-score">${result.teams[1].score === 0 ? 'Terminé!' : result.teams[1].score}</span>
            </div>
            ${team1Players.map(player => `
                <div class="ranking-item" style="padding-left: 30px; border-left: 2px solid #ff6b35;">
                    <span class="ranking-name">${player.name}</span>
                </div>
            `).join('')}
        `;

        const team2Html = `
            <div class="ranking-item ${!winningTeamFirst ? 'first' : ''}" style="border-left: 4px solid #4fc3f7; margin-top: 10px;">
                <span class="ranking-position">${!winningTeamFirst ? '🥇' : '🥈'}</span>
                <span class="ranking-name" style="color: #4fc3f7;">Équipe 2</span>
                <span class="ranking-score">${result.teams[2].score === 0 ? 'Terminé!' : result.teams[2].score}</span>
            </div>
            ${team2Players.map(player => `
                <div class="ranking-item" style="padding-left: 30px; border-left: 2px solid #4fc3f7;">
                    <span class="ranking-name">${player.name}</span>
                </div>
            `).join('')}
        `;

        elements.rankingsList.innerHTML = winningTeamFirst ? team1Html + team2Html : team2Html + team1Html;

        // Stats agrégées des deux équipes
        const totalThrows = result.players.reduce((sum, p) => sum + p.stats.totalThrows, 0);
        const totalDoubles = result.players.reduce((sum, p) => sum + p.stats.doubles, 0);
        const totalTriples = result.players.reduce((sum, p) => sum + p.stats.triples, 0);

        elements.statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalThrows}</div>
                <div class="stat-label">Lancers</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalDoubles}</div>
                <div class="stat-label">Doubles</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalTriples}</div>
                <div class="stat-label">Triples</div>
            </div>
        `;
    } else {
        // Mode normal
        elements.winnerTitle.textContent = '🎯 Victoire !';
        elements.winnerName.textContent = result.winner.name;

        // Classement
        elements.rankingsList.innerHTML = result.rankings.map((player, i) => `
            <div class="ranking-item ${i === 0 ? 'first' : ''}">
                <span class="ranking-position">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${player.score === 0 ? 'Terminé!' : player.score}</span>
            </div>
        `).join('');

        // Stats
        const winner = result.winner;
        elements.statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${winner.stats.totalThrows}</div>
                <div class="stat-label">Lancers</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${winner.stats.doubles}</div>
                <div class="stat-label">Doubles</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${winner.stats.triples}</div>
                <div class="stat-label">Triples</div>
            </div>
        `;
    }

    // Restaure les textes des boutons
    elements.btnRematch.textContent = 'Revanche';
    elements.btnNewGameEnd.textContent = 'Nouvelle Partie';

    showScreen('end');
}

/**
 * Affiche l'écran de fin du morpion
 */
function showMorpionEndScreen() {
    const result = getMorpionResult();
    if (!result) return;

    if (result.teamMode) {
        // Mode équipes
        if (result.status === 'won') {
            const winColor = result.winningTeam === 1 ? '#ff6b35' : '#4fc3f7';
            elements.winnerTitle.textContent = '🏆 Victoire !';
            elements.winnerName.innerHTML = `<span style="color: ${winColor}">Équipe ${result.teams[result.winningTeam].symbol}</span>`;
        } else {
            elements.winnerTitle.textContent = '🤝 Match Nul !';
            elements.winnerName.textContent = `${result.teams[1].score} - ${result.teams[2].score}`;
        }

        // Classement par équipes
        elements.rankingsList.innerHTML = `
            <div class="ranking-item ${result.teams[1].score > result.teams[2].score ? 'first' : ''}" style="border-left: 4px solid #ff6b35;">
                <span class="ranking-position" style="color: #ff6b35;">X</span>
                <span class="ranking-name">Équipe X</span>
                <span class="ranking-score">${result.teams[1].score} victoire${result.teams[1].score > 1 ? 's' : ''}</span>
            </div>
            <div class="ranking-item ${result.teams[2].score > result.teams[1].score ? 'first' : ''}" style="border-left: 4px solid #4fc3f7;">
                <span class="ranking-position" style="color: #4fc3f7;">O</span>
                <span class="ranking-name">Équipe O</span>
                <span class="ranking-score">${result.teams[2].score} victoire${result.teams[2].score > 1 ? 's' : ''}</span>
            </div>
        `;
    } else {
        // Mode normal
        if (result.status === 'won') {
            elements.winnerTitle.textContent = `🏆 ${result.winner.name} gagne la manche !`;
            elements.winnerName.textContent = `${result.players[0].score} - ${result.players[1].score}`;
        } else {
            elements.winnerTitle.textContent = '🤝 Match Nul !';
            elements.winnerName.textContent = `${result.players[0].score} - ${result.players[1].score}`;
        }

        // Classement (juste les 2 joueurs avec leurs scores)
        elements.rankingsList.innerHTML = result.players.map((player, i) => `
            <div class="ranking-item ${player.score > result.players[1-i].score ? 'first' : ''}">
                <span class="ranking-position" style="color: ${player.symbol === 'X' ? '#ff6b35' : '#4fc3f7'}">${player.symbol}</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${player.score} victoire${player.score > 1 ? 's' : ''}</span>
            </div>
        `).join('');
    }

    // Stats de la session
    elements.statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${result.roundNumber}</div>
            <div class="stat-label">Manche${result.roundNumber > 1 ? 's' : ''}</div>
        </div>
    `;

    // Modifie les boutons pour le morpion
    elements.btnRematch.textContent = 'Manche suivante';
    elements.btnNewGameEnd.textContent = 'Nouvelle partie';

    showScreen('end');
}

/**
 * Met à jour l'interface du jeu
 */
function updateGameUI() {
    const state = getGameState();
    if (!state) return;

    const player = getCurrentPlayer();

    // Informations du joueur actuel
    if (state.teamMode) {
        const teamColor = player.team === 1 ? '#ff6b35' : '#4fc3f7';
        elements.currentPlayerName.innerHTML = `<span style="color: ${teamColor}">${player.name}</span>`;
        elements.currentScore.textContent = `${state.teams[1].score} - ${state.teams[2].score}`;
    } else {
        elements.currentPlayerName.textContent = player.name;
        elements.currentScore.textContent = player.score;
    }

    // Informations de lancer (mode classique)
    if (state.mode === 'classic') {
        elements.throwNumber.textContent = `Lancer ${state.currentThrow}/${state.modeConfig.throwsPerSeries}`;
        elements.seriesNumber.textContent = `Série ${state.currentSeries}/${state.modeConfig.series}`;
    } else {
        elements.throwNumber.textContent = `Lancer ${state.currentThrow}`;
        elements.seriesNumber.textContent = '';
    }

    // Killshot
    const killshotAllowed = isKillshotAllowed();
    elements.btnKillshot.disabled = !killshotAllowed;
    setKillshotEnabled(killshotAllowed);

    // Tableau des scores
    updateScoreboard(state.players, state.currentPlayerIndex, state.teamMode, state.teams);

    // Efface le marqueur d'impact après un délai
    setTimeout(() => clearImpactMarkers(), 2000);
}

/**
 * Met à jour le tableau des scores
 */
function updateScoreboard(players, currentIndex, teamMode = false, teams = null) {
    // Ajoute la classe many-players si plus de 6 joueurs
    if (players.length > 6) {
        elements.scoreboardList.classList.add('many-players');
    } else {
        elements.scoreboardList.classList.remove('many-players');
    }

    if (teamMode && teams) {
        // Affichage par équipes
        const team1Players = players.filter(p => p.team === 1);
        const team2Players = players.filter(p => p.team === 2);

        elements.scoreboardList.innerHTML = `
            <div class="team-score-header" style="color: #ff6b35; border-left: 3px solid #ff6b35;">
                Équipe 1: <strong>${teams[1].score}</strong>
            </div>
            ${team1Players.map(player => `
                <div class="scoreboard-item ${players.indexOf(player) === currentIndex ? 'active' : ''}" style="border-left-color: #ff6b35;">
                    <span class="name">${player.name}</span>
                    <span class="score">${player.score}</span>
                </div>
            `).join('')}
            <div class="team-score-header" style="color: #4fc3f7; border-left: 3px solid #4fc3f7; margin-top: 10px;">
                Équipe 2: <strong>${teams[2].score}</strong>
            </div>
            ${team2Players.map(player => `
                <div class="scoreboard-item ${players.indexOf(player) === currentIndex ? 'active' : ''}" style="border-left-color: #4fc3f7;">
                    <span class="name">${player.name}</span>
                    <span class="score">${player.score}</span>
                </div>
            `).join('')}
        `;
    } else {
        elements.scoreboardList.innerHTML = players.map((player, i) => `
            <div class="scoreboard-item ${i === currentIndex ? 'active' : ''}">
                <span class="name">${player.name}</span>
                <span class="score">${player.score}</span>
            </div>
        `).join('');
    }
}

/**
 * Affiche le popup des points
 */
function showPointsPopup(points, zone, x, y) {
    const popup = elements.pointsPopup;
    if (!popup) return;

    popup.textContent = points > 0 ? `+${points}` : 'RATÉ';
    popup.className = 'points-popup';

    if (zone === 'killshot') {
        popup.classList.add('killshot');
        popup.textContent = `+${points} KILLSHOT!`;
    } else if (points === 0) {
        popup.classList.add('miss');
    }

    // Positionne le popup
    const container = elements.targetSvg.parentElement;
    const rect = container.getBoundingClientRect();
    popup.style.left = `${x - rect.left}px`;
    popup.style.top = `${y - rect.top}px`;

    // Animation
    popup.classList.remove('visible');
    void popup.offsetWidth;
    popup.classList.add('visible');

    // Animation de célébration pour bullseye/killshot
    if (settings.animationsEnabled && (zone === 'bullseye' || zone === 'killshot')) {
        container.classList.add('celebrate');
        setTimeout(() => container.classList.remove('celebrate'), 500);
    }
}

/**
 * Gère le bouton Annuler
 */
function handleUndo() {
    undoLast();
    clearImpactMarkers();
}

/**
 * Gère le bouton Raté
 */
function handleMiss() {
    let result;

    if (currentMode === 'darts301') {
        result = registerDartsMiss();
        if (result) {
            updateDartsUI();
        }
    } else {
        result = registerMiss();
    }

    if (result && settings.animationsEnabled) {
        elements.targetSvg.parentElement.classList.add('shake');
        setTimeout(() => elements.targetSvg.parentElement.classList.remove('shake'), 300);
    }

    if (currentMode !== 'darts301') {
        showPointsPopup(0, 'miss', window.innerWidth / 2, window.innerHeight / 2);
    }
}

/**
 * Gère le bouton Killshot
 */
function handleKillshot() {
    // Active temporairement pour permettre un clic killshot manuel
    setKillshotEnabled(true);
    // Note: L'utilisateur doit ensuite cliquer sur un killshot de la cible
}

/**
 * Affiche le menu pause
 */
function showPauseMenu() {
    elements.pauseMenu.style.display = 'flex';
}

/**
 * Cache le menu pause
 */
function hidePauseMenu() {
    elements.pauseMenu.style.display = 'none';
}

/**
 * Toggle plein écran
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Erreur plein écran:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

/**
 * Gère la sortie du jeu
 */
function handleQuitGame() {
    const newModes = ['luckyLuke', 'race', 'suiteOr', 'mode007', 'killer'];

    if (currentMode === 'customTarget') {
        disconnectImageServer();
        resetGameButtons();
        hidePauseMenu();
        showScreen('home');
        return;
    }

    if (newModes.includes(currentMode)) {
        if (confirm('Voulez-vous vraiment quitter la partie ?')) {
            quitNewMode();
            resetGameButtons();
            hidePauseMenu();
            showScreen('home');
        }
        return;
    }

    if (confirm('Voulez-vous vraiment quitter la partie ? La progression sera perdue.')) {
        if (currentMode === 'morpion') {
            quitMorpion();
        } else if (currentMode === 'darts301') {
            quitDarts();
        } else {
            quitGame();
        }
        resetGameButtons();
        hidePauseMenu();
        showScreen('home');
        checkForSavedGame();
    }
}

/**
 * Restaure les boutons de jeu à leur état par défaut
 */
function resetGameButtons() {
    elements.btnUndo.textContent = '↶ Annuler';
    elements.btnUndo.onclick = null;
    elements.btnMiss.textContent = '✗ Raté';
    elements.btnMiss.onclick = null;
    elements.btnKillshot.textContent = '★ Killshot';
    elements.btnKillshot.onclick = null;
}

/**
 * Affiche l'écran de fin
 */
function showEndScreen() {
    const result = getGameResult();
    if (!result) return;

    const isSoloMode = result.rankings.length === 1;

    // Mode équipes
    if (result.teamMode) {
        if (result.winningTeam === 0) {
            elements.winnerTitle.textContent = '🤝 Égalité !';
            elements.winnerName.textContent = `${result.teams[1].score} - ${result.teams[2].score}`;
        } else {
            const winColor = result.winningTeam === 1 ? '#ff6b35' : '#4fc3f7';
            elements.winnerTitle.textContent = '🏆 Victoire !';
            elements.winnerName.innerHTML = `<span style="color: ${winColor}">Équipe ${result.winningTeam}</span>`;
        }

        // Classement par équipes puis par joueur
        const team1Players = result.rankings.filter(p => p.team === 1);
        const team2Players = result.rankings.filter(p => p.team === 2);

        elements.rankingsList.innerHTML = `
            <div class="ranking-item ${result.winningTeam === 1 ? 'first' : ''}" style="border-left: 4px solid #ff6b35;">
                <span class="ranking-position">1</span>
                <span class="ranking-name" style="color: #ff6b35;">Équipe 1</span>
                <span class="ranking-score">${result.teams[1].score}</span>
            </div>
            ${team1Players.map(player => `
                <div class="ranking-item" style="padding-left: 30px; border-left: 2px solid #ff6b35;">
                    <span class="ranking-name">${player.name}</span>
                    <span class="ranking-score">${player.score}</span>
                </div>
            `).join('')}
            <div class="ranking-item ${result.winningTeam === 2 ? 'first' : ''}" style="border-left: 4px solid #4fc3f7; margin-top: 10px;">
                <span class="ranking-position">2</span>
                <span class="ranking-name" style="color: #4fc3f7;">Équipe 2</span>
                <span class="ranking-score">${result.teams[2].score}</span>
            </div>
            ${team2Players.map(player => `
                <div class="ranking-item" style="padding-left: 30px; border-left: 2px solid #4fc3f7;">
                    <span class="ranking-name">${player.name}</span>
                    <span class="ranking-score">${player.score}</span>
                </div>
            `).join('')}
        `;
    } else if (isSoloMode) {
        elements.winnerTitle.textContent = '🎯 Partie Terminée !';
        elements.winnerName.textContent = `Score : ${result.winner.score} pts`;

        elements.rankingsList.innerHTML = result.rankings.map((player, i) => `
            <div class="ranking-item ${i === 0 ? 'first' : ''}">
                <span class="ranking-position">🎯</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${player.score}</span>
            </div>
        `).join('');
    } else {
        elements.winnerTitle.textContent = '🏆 Victoire !';
        elements.winnerName.textContent = result.winner.name;

        elements.rankingsList.innerHTML = result.rankings.map((player, i) => `
            <div class="ranking-item ${i === 0 ? 'first' : ''}">
                <span class="ranking-position">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${player.score}</span>
            </div>
        `).join('');
    }

    // Statistiques
    elements.statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${result.stats.totalThrows}</div>
            <div class="stat-label">Lancers</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${result.stats.averagePerThrow}</div>
            <div class="stat-label">Moyenne/lancer</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${result.stats.totalBullseyes}</div>
            <div class="stat-label">Bullseyes</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${result.stats.totalKillshots}</div>
            <div class="stat-label">Killshots</div>
        </div>
    `;

    // Restaure les textes des boutons pour le mode classique
    elements.btnRematch.textContent = 'Revanche';
    elements.btnNewGameEnd.textContent = 'Nouvelle Partie';

    showScreen('end');
}

/**
 * Gère la revanche / manche suivante
 */
function handleRematch() {
    const newModes = ['luckyLuke', 'race', 'suiteOr', 'mode007', 'killer'];

    if (currentMode === 'morpion') {
        nextRound();
        drawMorpionGrid(elements.targetSvg, onMorpionCellClick);
        updateMorpionDisplay(elements.targetSvg);
        updateMorpionUI();
    } else if (currentMode === 'darts301') {
        restartDarts();
        drawDartsTarget(elements.targetSvg, onDartsClick);
        updateDartsUI();
    } else if (newModes.includes(currentMode)) {
        restartNewMode();
        initTarget(elements.targetSvg, onNewModeTargetClick);
        setKillshotEnabled(false);
        // Met à jour l'UI selon le mode
        switch (currentMode) {
            case 'luckyLuke': updateLuckyLukeUI(); break;
            case 'race': updateRaceUI(); break;
            case 'suiteOr': updateSuiteOrUI(); break;
            case 'mode007': update007UI(); break;
            case 'killer': updateKillerUI(); break;
        }
    } else {
        rematch();
        initTarget(elements.targetSvg, onTargetClick);
        updateGameUI();
    }
    showScreen('game');
}

/**
 * Gère le bouton "Nouvelle partie" depuis l'écran de fin
 */
function handleNewGameFromEnd() {
    if (currentMode === 'morpion') {
        // Réinitialise complètement (scores à 0)
        restartMorpion();
        drawMorpionGrid(elements.targetSvg, onMorpionCellClick);
        updateMorpionDisplay(elements.targetSvg);
        updateMorpionUI();
        showScreen('game');
    } else if (currentMode === 'darts301') {
        restartDarts();
        drawDartsTarget(elements.targetSvg, onDartsClick);
        updateDartsUI();
        showScreen('game');
    } else {
        // Retourne à l'écran de config
        showScreen('setup');
    }
}

/**
 * Sauvegarde les paramètres utilisateur
 */
function saveUserSettings() {
    settings = {
        soundsEnabled: elements.settingSounds.checked,
        vibrationEnabled: elements.settingVibration.checked,
        animationsEnabled: elements.settingAnimations.checked,
        killshotThrow: parseInt(elements.settingKillshotThrow.value)
    };
    saveSettings(settings);
}

/**
 * Gère le changement d'URL du serveur d'images
 */
function handleImageServerChange() {
    const url = elements.settingImageServer.value.trim();
    if (url) {
        setImageServerUrl(url);
    }
}

/**
 * Efface toutes les données
 */
function handleClearData() {
    if (confirm('Voulez-vous vraiment effacer toutes les données ? Cette action est irréversible.')) {
        clearAllData();
        checkForSavedGame();
        alert('Données effacées.');
    }
}

/**
 * Joue un son (placeholder)
 */
function playSound(zone) {
    if (!settings.soundsEnabled) return;

    // TODO: Implémenter avec Web Audio API
    // Pour l'instant, on utilise un simple beep via AudioContext
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Fréquence selon la zone
        const frequencies = {
            'bullseye': 880,
            'killshot': 1000,
            'zone4': 660,
            'zone3': 550,
            'zone2': 440,
            'zone1': 330,
            'miss': 220
        };

        oscillator.frequency.value = frequencies[zone] || 440;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        // Audio non supporté
    }
}

/**
 * Affiche l'écran leaderboard
 */
function showLeaderboard() {
    const leaderboard = loadLeaderboard();

    if (leaderboard.length === 0) {
        elements.leaderboardList.innerHTML = `
            <div class="leaderboard-empty">
                Aucun score enregistré.<br>
                Jouez une partie en mode Classique pour apparaître ici !
            </div>
        `;
    } else {
        elements.leaderboardList.innerHTML = leaderboard.map((entry, i) => `
            <div class="leaderboard-item ${i < 3 ? 'top-3' : ''}">
                <span class="leaderboard-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${entry.name}</div>
                    <div class="leaderboard-stats">
                        ${entry.gamesPlayed} partie${entry.gamesPlayed > 1 ? 's' : ''} •
                        ${entry.totalBullseyes} bullseye${entry.totalBullseyes > 1 ? 's' : ''} •
                        ${entry.totalKillshots} killshot${entry.totalKillshots > 1 ? 's' : ''}
                    </div>
                </div>
                <div class="leaderboard-score">
                    <div class="leaderboard-best">${entry.bestScore}</div>
                    <div class="leaderboard-avg">Moy: ${entry.averageScore}</div>
                </div>
            </div>
        `).join('');
    }

    showScreen('leaderboard');
}

/**
 * Efface le leaderboard
 */
function handleClearLeaderboard() {
    if (confirm('Voulez-vous vraiment effacer le classement ? Cette action est irréversible.')) {
        clearLeaderboard();
        showLeaderboard(); // Rafraîchit l'affichage
    }
}

// ========================================
// CUSTOM TARGET MODE
// ========================================

/**
 * Callback lors d'un clic sur la cible personnalisée
 */
function onCustomTargetClick(hitData) {
    // En mode custom target sans joueurs, juste un feedback visuel
    if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(30);
    }

    // Affiche un petit effet visuel
    showPointsPopup(hitData.points, hitData.zone, hitData.screenX, hitData.screenY);
}

/**
 * Callback quand les images sont mises à jour depuis le serveur
 */
function onImagesUpdate(images) {
    console.log('Images mises à jour:', images.length);
    updateCustomTargetUI();
    drawCustomTarget(elements.targetSvg, onCustomTargetClick);
}

/**
 * Met à jour l'interface du mode custom target
 */
function updateCustomTargetUI() {
    const images = getReceivedImages();
    const selectedImage = getSelectedImage();
    const sessionId = getSessionId();

    // Met à jour le statut de connexion
    if (isConnected()) {
        elements.throwNumber.textContent = `Session: ${sessionId}`;
    }

    // Affiche le nombre d'images
    elements.currentScore.textContent = images.length > 0 ? images.length : '';

    // Met à jour le scoreboard avec la liste des images
    if (images.length > 0) {
        elements.scoreboardList.innerHTML = images.map((img, i) => `
            <div class="scoreboard-item ${img === selectedImage ? 'active' : ''}"
                 onclick="window.selectCustomImage(${i})" style="cursor: pointer;">
                <span class="name">${img.playerName}</span>
                <span class="score" style="font-size: 0.8rem; color: #888;">
                    ${new Date(img.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        `).join('');
    } else {
        elements.scoreboardList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #888;">
                <p>En attente d'images...</p>
                <p style="font-size: 0.85rem; margin-top: 10px;">
                    Scannez le QR code pour envoyer une photo
                </p>
            </div>
        `;
    }

    // Met à jour la prévisualisation dans le modal
    if (selectedImage && elements.imagePreview) {
        elements.imagePreview.style.display = 'block';
        elements.previewImg.src = selectedImage.data;
        elements.btnClearImage.style.display = 'block';
        elements.imageTimer.textContent = `De: ${selectedImage.playerName}`;
    } else if (elements.imagePreview) {
        elements.imagePreview.style.display = 'none';
        elements.btnClearImage.style.display = 'none';
    }
}

// Fonction globale pour sélectionner une image depuis le scoreboard
window.selectCustomImage = function(index) {
    selectImage(index);
    drawCustomTarget(elements.targetSvg, onCustomTargetClick);
    updateCustomTargetUI();
};

/**
 * Affiche le modal QR code / upload
 */
function showQrUploadModal() {
    if (!elements.qrUploadModal) return;

    const sessionId = getSessionId();
    const uploadUrl = getUploadUrl();

    // Vérifie si connecté au serveur
    if (sessionId && uploadUrl) {
        // Génère le QR code via API externe
        const qrHtml = generateQRCodeHTML(uploadUrl, 200);
        elements.qrCodeContainer.innerHTML = qrHtml;

        // Affiche le code de session
        const existingSessionDisplay = elements.qrCodeContainer.parentElement.querySelector('.session-display');
        if (existingSessionDisplay) {
            existingSessionDisplay.textContent = sessionId;
        } else {
            const sessionDisplay = document.createElement('div');
            sessionDisplay.className = 'session-display';
            sessionDisplay.style.cssText = 'font-size: 1.5rem; font-weight: bold; letter-spacing: 5px; color: #ff6b35; margin-top: 15px;';
            sessionDisplay.textContent = sessionId;
            elements.qrCodeContainer.parentElement.insertBefore(sessionDisplay, elements.qrCodeContainer.nextSibling);
        }

        // Affiche l'URL pour debug
        const existingUrlDisplay = elements.qrCodeContainer.parentElement.querySelector('.url-display');
        if (existingUrlDisplay) {
            existingUrlDisplay.textContent = uploadUrl;
        } else {
            const urlDisplay = document.createElement('div');
            urlDisplay.className = 'url-display';
            urlDisplay.style.cssText = 'font-size: 0.75rem; color: #888; margin-top: 10px; word-break: break-all; max-width: 250px;';
            urlDisplay.textContent = uploadUrl;
            elements.qrCodeContainer.parentElement.appendChild(urlDisplay);
        }
    } else {
        // Pas encore connecté
        elements.qrCodeContainer.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #888;">
                <p style="font-size: 1.2rem; margin-bottom: 15px;">Connexion au serveur...</p>
                <p style="font-size: 0.9rem;">Serveur: ${getImageServerUrl()}</p>
                <p style="font-size: 0.8rem; margin-top: 15px; color: #dc3545;">
                    Si le QR code n'apparaît pas, vérifiez que le serveur est démarré.
                </p>
            </div>
        `;
    }

    // Met à jour la prévisualisation si image existante
    const selectedImage = getSelectedImage();
    if (selectedImage) {
        elements.imagePreview.style.display = 'block';
        elements.previewImg.src = selectedImage.data;
        elements.btnClearImage.style.display = 'block';
        elements.imageTimer.textContent = `De: ${selectedImage.playerName}`;
    } else {
        elements.imagePreview.style.display = 'none';
        elements.btnClearImage.style.display = 'none';
    }

    elements.qrUploadModal.style.display = 'flex';
}

/**
 * Cache le modal QR code / upload
 */
function hideQrUploadModal() {
    if (elements.qrUploadModal) {
        elements.qrUploadModal.style.display = 'none';
    }
    updateCustomTargetUI();
}

/**
 * Supprime l'image sélectionnée
 */
function handleClearCustomImage() {
    const selectedImage = getSelectedImage();
    if (selectedImage && confirm('Supprimer cette image ?')) {
        deleteImage(selectedImage.timestamp);
    }
}

/**
 * Vérifie si on est en mode upload via QR code (obsolète avec le serveur externe)
 */
function isUploadMode() {
    // Cette fonction n'est plus utilisée car l'upload se fait via le serveur externe
    return false;
}

// ========================================
// NOUVEAUX MODES DE JEU
// ========================================

/**
 * Gère le clic sur la cible pour les nouveaux modes
 */
function onNewModeTargetClick(hitData) {
    handleNewModeThrow(hitData.points, hitData.zone);

    // Affiche le marqueur d'impact
    addImpactMarker(
        elements.targetSvg.parentElement,
        hitData.relativeX,
        hitData.relativeY,
        hitData.zone
    );

    // Feedback haptique
    if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(hitData.points > 0 ? 50 : 100);
    }

    // Affiche les points
    showPointsPopup(hitData.points, hitData.zone, hitData.screenX, hitData.screenY);

    // Son
    playSound(hitData.zone);
}

/**
 * Traite un lancer pour les nouveaux modes
 */
function handleNewModeThrow(points, zone) {
    let result;

    switch (currentMode) {
        case 'luckyLuke':
            result = registerLuckyLukeThrow(points);
            break;
        case 'race':
            result = registerRaceThrow(points);
            break;
        case 'suiteOr':
            result = registerSuiteOrThrow(zone, points);
            break;
        case 'mode007':
            result = register007Throw(zone);
            break;
        case 'killer':
            result = registerKillerThrow(points);
            break;
    }

    return result;
}

// --- LUCKY LUKE ---

function onLuckyLukeUpdate(state) {
    updateLuckyLukeUI();
    if (state.status === 'finished') {
        setTimeout(() => showNewModeEndScreen('luckyLuke'), 1500);
    }
}

function updateLuckyLukeUI() {
    const state = getLuckyLukeState();
    if (!state) return;

    const player = getCurrentLuckyLukePlayer();
    const activePlayers = state.players.filter(p => !p.eliminated);

    elements.currentPlayerName.textContent = player.name;
    elements.currentScore.textContent = state.previousScore !== null ? `Précédent: ${state.previousScore}` : '-';
    elements.throwNumber.textContent = `${activePlayers.length} joueurs restants`;
    elements.seriesNumber.textContent = 'Lucky Luke';

    // Tableau des scores
    elements.scoreboardList.innerHTML = state.players.map(p => `
        <div class="scoreboard-item ${p.id === player.id ? 'active' : ''} ${p.eliminated ? 'eliminated' : ''}">
            <span class="name" style="${p.eliminated ? 'text-decoration: line-through; color: #666;' : ''}">${p.name}</span>
            <span class="score">${p.eliminated ? '❌' : (p.lastScore !== null ? p.lastScore : '-')}</span>
        </div>
    `).join('');

    setTimeout(() => clearImpactMarkers(), 2000);
}

// --- RACE ---

function onRaceUpdate(state) {
    updateRaceUI();
    if (state.status === 'finished') {
        setTimeout(() => showNewModeEndScreen('race'), 1500);
    }
}

function updateRaceUI() {
    const state = getRaceState();
    if (!state) return;

    const player = getCurrentRacePlayer();

    elements.currentPlayerName.textContent = player.name;
    elements.currentScore.textContent = player.score;
    elements.throwNumber.textContent = `Objectif: ${state.targetScore} pts`;
    elements.seriesNumber.textContent = 'Race';

    // Tableau des scores trié par score
    const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
    elements.scoreboardList.innerHTML = sortedPlayers.map(p => `
        <div class="scoreboard-item ${p.id === player.id ? 'active' : ''}">
            <span class="name">${p.name}</span>
            <span class="score">${p.score}/${state.targetScore}</span>
        </div>
    `).join('');

    setTimeout(() => clearImpactMarkers(), 2000);
}

// --- SUITE D'OR ---

function onSuiteOrUpdate(state) {
    updateSuiteOrUI();
    if (state.status === 'finished') {
        setTimeout(() => showNewModeEndScreen('suiteOr'), 1500);
    }
}

function updateSuiteOrUI() {
    const state = getSuiteOrState();
    if (!state) return;

    const player = getCurrentSuiteOrPlayer();
    const expectedZone = getExpectedZone();
    const sequence = state.sequence;

    elements.currentPlayerName.textContent = player.name;
    elements.currentScore.textContent = `Zone ${expectedZone}`;
    elements.throwNumber.textContent = `${player.sequenceIndex}/${sequence.length}`;
    elements.seriesNumber.textContent = 'Suite d\'Or';

    // Affiche la séquence avec progression
    const sequenceHtml = sequence.map((z, i) => {
        let style = 'display: inline-block; width: 25px; height: 25px; line-height: 25px; text-align: center; margin: 2px; border-radius: 50%;';
        if (i < player.sequenceIndex) {
            style += 'background: #28a745; color: white;'; // Complété
        } else if (i === player.sequenceIndex) {
            style += 'background: #ff6b35; color: white; font-weight: bold;'; // Actuel
        } else {
            style += 'background: #444; color: #888;'; // À venir
        }
        return `<span style="${style}">${z}</span>`;
    }).join('');

    // Tableau des joueurs
    elements.scoreboardList.innerHTML = `
        <div style="padding: 10px; text-align: center; margin-bottom: 10px;">
            ${sequenceHtml}
        </div>
        ${state.players.map(p => `
            <div class="scoreboard-item ${p.id === player.id ? 'active' : ''}">
                <span class="name">${p.name}</span>
                <span class="score">${p.sequenceIndex}/${sequence.length}</span>
            </div>
        `).join('')}
    `;

    setTimeout(() => clearImpactMarkers(), 2000);
}

// --- 007 ---

function on007Update(state) {
    update007UI();
    if (state.status === 'finished') {
        setTimeout(() => showNewModeEndScreen('mode007'), 1500);
    }
}

function update007UI() {
    const state = get007State();
    if (!state) return;

    const player = getCurrent007Player();

    elements.currentPlayerName.textContent = player.name;
    elements.currentScore.textContent = `${player.bullseyeHits}/${state.targetHits}`;
    elements.throwNumber.textContent = 'Visez le centre !';
    elements.seriesNumber.textContent = '007';

    // Tableau des scores
    const sortedPlayers = [...state.players].sort((a, b) => b.bullseyeHits - a.bullseyeHits);
    elements.scoreboardList.innerHTML = sortedPlayers.map(p => `
        <div class="scoreboard-item ${p.id === player.id ? 'active' : ''}">
            <span class="name">${p.name}</span>
            <span class="score">${'🎯'.repeat(p.bullseyeHits)}${'○'.repeat(state.targetHits - p.bullseyeHits)}</span>
        </div>
    `).join('');

    setTimeout(() => clearImpactMarkers(), 2000);
}

// --- KILLER ---

function onKillerUpdate(state) {
    updateKillerUI();
    if (state.status === 'finished') {
        setTimeout(() => showNewModeEndScreen('killer'), 1500);
    }
}

function updateKillerUI() {
    const state = getKillerState();
    if (!state) return;

    const player = getCurrentKillerPlayer();

    elements.currentPlayerName.textContent = player.name;
    elements.currentScore.textContent = player.score;
    elements.throwNumber.textContent = `Objectif: exactement ${state.targetScore}`;
    elements.seriesNumber.textContent = 'Killer';

    // Tableau des scores trié
    const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
    elements.scoreboardList.innerHTML = sortedPlayers.map(p => `
        <div class="scoreboard-item ${p.id === player.id ? 'active' : ''}">
            <span class="name">${p.name}</span>
            <span class="score" style="${p.score === state.targetScore ? 'color: #28a745;' : ''}">${p.score}/${state.targetScore}</span>
        </div>
    `).join('');

    setTimeout(() => clearImpactMarkers(), 2000);
}

// --- ÉCRAN DE FIN NOUVEAUX MODES ---

function showNewModeEndScreen(mode) {
    let result, title, winnerText;

    switch (mode) {
        case 'luckyLuke':
            result = getLuckyLukeResult();
            title = '🤠 Lucky Luke !';
            winnerText = result.winner?.name || 'Personne';
            break;
        case 'race':
            result = getRaceResult();
            title = '🏃 Race terminée !';
            winnerText = result.winner?.name || 'Personne';
            break;
        case 'suiteOr':
            result = getSuiteOrResult();
            title = '🥇 Suite d\'Or !';
            winnerText = result.winner?.name || 'Personne';
            break;
        case 'mode007':
            result = get007Result();
            title = '🔫 Mission accomplie !';
            winnerText = result.winner?.name || 'Personne';
            break;
        case 'killer':
            result = getKillerResult();
            title = '💀 Killer !';
            winnerText = result.winner?.name || 'Personne';
            break;
        default:
            return;
    }

    elements.winnerTitle.textContent = title;
    elements.winnerName.textContent = winnerText;

    // Classement
    elements.rankingsList.innerHTML = result.players.map((p, i) => {
        let scoreText = '';
        switch (mode) {
            case 'luckyLuke':
                scoreText = p.eliminated ? '❌ Éliminé' : '🏆 Vainqueur';
                break;
            case 'race':
            case 'killer':
                scoreText = `${p.score} pts`;
                break;
            case 'suiteOr':
                scoreText = `${p.sequenceIndex}/9`;
                break;
            case 'mode007':
                scoreText = `${p.bullseyeHits} bullseyes`;
                break;
        }
        return `
            <div class="ranking-item ${i === 0 ? 'first' : ''}">
                <span class="ranking-position">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span class="ranking-name">${p.name}</span>
                <span class="ranking-score">${scoreText}</span>
            </div>
        `;
    }).join('');

    // Stats simples
    elements.statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${result.players.length}</div>
            <div class="stat-label">Joueurs</div>
        </div>
    `;

    elements.btnRematch.textContent = 'Revanche';
    elements.btnNewGameEnd.textContent = 'Nouvelle Partie';

    showScreen('end');
}
