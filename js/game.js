// ========================================
// GAME - Logique principale du jeu
// ========================================

import { createPlayer, addThrow, undoLastThrow, sortPlayersByScore } from './players.js';
import { getPointsForZone, getZoneName, generateScoringStats } from './scoring.js';
import { saveCurrentGame, clearCurrentGame, addToHistory, loadSettings, updateLeaderboard } from './storage.js';

// Configuration des modes de jeu
const GAME_MODES = {
    classic: {
        name: 'Classique',
        series: 5,
        throwsPerSeries: 3,
        description: '5 séries de 3 lancers, cumul des points'
    },
    morpion: {
        name: 'Morpion',
        players: 2,
        description: 'Alignez 3 symboles pour gagner'
    }
};

// État du jeu
let gameState = null;
let settings = null;
let onGameUpdateCallback = null;

/**
 * Initialise une nouvelle partie
 * @param {string} mode - Mode de jeu
 * @param {Array} playerNames - Noms des joueurs
 * @param {Function} callback - Callback de mise à jour
 * @param {Object} options - Options (teamMode, teams)
 */
export function initGame(mode, playerNames, callback, options = {}) {
    settings = loadSettings();
    onGameUpdateCallback = callback;

    const players = playerNames.map((name, i) => {
        const player = createPlayer(i, name);
        if (options.teamMode && options.teams) {
            player.team = options.teams[i];
        }
        return player;
    });

    gameState = {
        mode,
        modeConfig: GAME_MODES[mode],
        players,
        currentPlayerIndex: 0,
        currentSeries: 1,
        currentThrow: 1,
        status: 'playing', // 'playing', 'finished'
        history: [], // Pour le undo global
        startTime: Date.now(),
        teamMode: options.teamMode || false,
        teams: options.teamMode ? {
            1: { name: 'Équipe 1', score: 0 },
            2: { name: 'Équipe 2', score: 0 }
        } : null
    };

    saveGame();
    notifyUpdate();

    return gameState;
}

/**
 * Charge une partie existante
 */
export function loadGame(savedState, callback) {
    settings = loadSettings();
    onGameUpdateCallback = callback;
    gameState = savedState;
    notifyUpdate();
    return gameState;
}

/**
 * Récupère l'état actuel du jeu
 */
export function getGameState() {
    return gameState;
}

/**
 * Récupère le joueur actuel
 */
export function getCurrentPlayer() {
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex];
}

/**
 * Vérifie si le killshot est autorisé pour le lancer actuel
 */
export function isKillshotAllowed() {
    if (!gameState || gameState.mode !== 'classic') return false;

    const killshotThrow = settings?.killshotThrow ?? 3;
    if (killshotThrow === 0) return true; // Tous les lancers

    return gameState.currentThrow === killshotThrow;
}

/**
 * Enregistre un lancer
 */
export function registerThrow(zone, points) {
    if (!gameState || gameState.status !== 'playing') return null;

    const player = getCurrentPlayer();

    // Sauvegarde l'état pour le undo
    gameState.history.push({
        playerIndex: gameState.currentPlayerIndex,
        series: gameState.currentSeries,
        throw: gameState.currentThrow,
        teamScores: gameState.teamMode ? { ...gameState.teams } : null
    });

    // Ajoute le lancer au joueur
    const throwData = addThrow(
        player,
        points,
        zone,
        gameState.currentSeries,
        gameState.currentThrow
    );

    // Met à jour le score de l'équipe
    if (gameState.teamMode && player.team) {
        gameState.teams[player.team].score += points;
    }

    // Avance dans le jeu
    advanceGame();

    saveGame();
    notifyUpdate();

    return {
        player,
        throwData,
        zone,
        points,
        zoneName: getZoneName(zone)
    };
}

/**
 * Enregistre un lancer raté (miss)
 */
export function registerMiss() {
    return registerThrow('miss', 0);
}

/**
 * Annule le dernier lancer
 */
export function undoLast() {
    if (!gameState || gameState.history.length === 0) return false;

    const lastState = gameState.history.pop();

    // Restaure l'état du jeu
    gameState.currentPlayerIndex = lastState.playerIndex;
    gameState.currentSeries = lastState.series;
    gameState.currentThrow = lastState.throw;
    gameState.status = 'playing';

    // Annule le lancer du joueur
    const player = getCurrentPlayer();
    const undoneThrow = undoLastThrow(player);

    // Restaure le score de l'équipe
    if (gameState.teamMode && player.team && undoneThrow) {
        gameState.teams[player.team].score -= undoneThrow.points;
    }

    saveGame();
    notifyUpdate();

    return true;
}

/**
 * Avance dans le jeu (prochain lancer/joueur/série)
 */
function advanceGame() {
    if (gameState.mode === 'classic') {
        advanceClassicMode();
    }
    // Le mode morpion est géré séparément dans morpion.js
}

/**
 * Logique d'avancement pour le mode Classique
 */
function advanceClassicMode() {
    const { throwsPerSeries, series } = gameState.modeConfig;

    // Prochain lancer
    gameState.currentThrow++;

    // Si fin de la série de lancers pour ce joueur
    if (gameState.currentThrow > throwsPerSeries) {
        gameState.currentThrow = 1;
        gameState.currentPlayerIndex++;

        // Si tous les joueurs ont joué cette série
        if (gameState.currentPlayerIndex >= gameState.players.length) {
            gameState.currentPlayerIndex = 0;
            gameState.currentSeries++;

            // Si toutes les séries sont terminées
            if (gameState.currentSeries > series) {
                endGame();
            }
        }
    }
}


/**
 * Termine la partie
 */
function endGame() {
    gameState.status = 'finished';
    gameState.endTime = Date.now();

    // Calcule le classement final
    const rankings = sortPlayersByScore(gameState.players);

    // Ajoute à l'historique
    addToHistory({
        mode: gameState.mode,
        players: gameState.players.map(p => ({
            name: p.name,
            score: p.score,
            stats: p.stats
        })),
        winner: rankings[0].name,
        duration: gameState.endTime - gameState.startTime
    });

    // Met à jour le leaderboard (uniquement pour le mode classique)
    if (gameState.mode === 'classic') {
        updateLeaderboard(gameState.players, gameState.mode);
    }

    // Supprime la sauvegarde de partie en cours
    clearCurrentGame();
}

/**
 * Récupère le résultat final
 */
export function getGameResult() {
    if (!gameState || gameState.status !== 'finished') return null;

    const rankings = sortPlayersByScore(gameState.players);

    const result = {
        winner: rankings[0],
        rankings,
        stats: generateGameStats(),
        teamMode: gameState.teamMode
    };

    // Ajoute les infos d'équipe si mode équipes
    if (gameState.teamMode) {
        result.teams = gameState.teams;
        result.winningTeam = gameState.teams[1].score > gameState.teams[2].score ? 1 :
                            gameState.teams[2].score > gameState.teams[1].score ? 2 : 0; // 0 = égalité
    }

    return result;
}

/**
 * Récupère les infos d'équipe en cours de partie
 */
export function getTeamInfo() {
    if (!gameState || !gameState.teamMode) return null;
    return gameState.teams;
}

/**
 * Génère les statistiques de la partie
 */
function generateGameStats() {
    if (!gameState) return null;

    const allThrows = gameState.players.flatMap(p => p.throws);

    return {
        totalThrows: allThrows.length,
        totalPoints: allThrows.reduce((sum, t) => sum + t.points, 0),
        averagePerThrow: (allThrows.reduce((sum, t) => sum + t.points, 0) / allThrows.length).toFixed(2),
        bestThrow: Math.max(...allThrows.map(t => t.points)),
        totalBullseyes: allThrows.filter(t => t.zone === 'bullseye').length,
        totalKillshots: allThrows.filter(t => t.zone === 'killshot').length,
        duration: gameState.endTime - gameState.startTime
    };
}

/**
 * Sauvegarde l'état du jeu
 */
function saveGame() {
    if (gameState && gameState.status === 'playing') {
        saveCurrentGame(gameState);
    }
}

/**
 * Notifie les mises à jour
 */
function notifyUpdate() {
    if (onGameUpdateCallback) {
        onGameUpdateCallback(gameState);
    }
}

/**
 * Récupère les modes de jeu disponibles
 */
export function getGameModes() {
    return GAME_MODES;
}

/**
 * Réinitialise le jeu pour une revanche
 */
export function rematch() {
    if (!gameState) return null;

    const playerNames = gameState.players.map(p => p.name);
    const mode = gameState.mode;

    return initGame(mode, playerNames, onGameUpdateCallback);
}

/**
 * Quitte la partie en cours
 */
export function quitGame() {
    clearCurrentGame();
    gameState = null;
}
