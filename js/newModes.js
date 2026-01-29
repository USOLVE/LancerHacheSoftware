// ========================================
// NEW MODES - Nouveaux modes de jeu
// ========================================

// État des différents modes
let modeState = null;
let onUpdateCallback = null;

// ========================================
// LUCKY LUKE
// ========================================
// Si un joueur fait un score strictement supérieur au joueur précédent, il l'élimine.
// Le vainqueur est le dernier joueur en lice.

export function initLuckyLuke(playerNames, onUpdate) {
    onUpdateCallback = onUpdate;
    modeState = {
        mode: 'luckyLuke',
        players: playerNames.map((name, i) => ({
            id: i,
            name: name || `Joueur ${i + 1}`,
            eliminated: false,
            lastScore: null
        })),
        currentPlayerIndex: 0,
        previousScore: null,
        previousPlayerId: null,
        status: 'playing',
        winner: null
    };
    return modeState;
}

export function registerLuckyLukeThrow(points) {
    if (!modeState || modeState.mode !== 'luckyLuke' || modeState.status !== 'playing') return null;

    const currentPlayer = modeState.players[modeState.currentPlayerIndex];
    currentPlayer.lastScore = points;

    let eliminated = null;

    // Si ce n'est pas le premier lancer et que le score est supérieur, éliminer le joueur précédent
    if (modeState.previousScore !== null && points > modeState.previousScore) {
        const previousPlayer = modeState.players.find(p => p.id === modeState.previousPlayerId);
        if (previousPlayer && !previousPlayer.eliminated) {
            previousPlayer.eliminated = true;
            eliminated = previousPlayer;
        }
    }

    modeState.previousScore = points;
    modeState.previousPlayerId = currentPlayer.id;

    // Passe au joueur suivant non éliminé
    nextLuckyLukePlayer();

    // Vérifie s'il reste un seul joueur
    const activePlayers = modeState.players.filter(p => !p.eliminated);
    if (activePlayers.length === 1) {
        modeState.status = 'finished';
        modeState.winner = activePlayers[0];
    }

    if (onUpdateCallback) onUpdateCallback(modeState);

    return { points, eliminated, currentPlayer };
}

function nextLuckyLukePlayer() {
    const activePlayers = modeState.players.filter(p => !p.eliminated);
    if (activePlayers.length <= 1) return;

    do {
        modeState.currentPlayerIndex = (modeState.currentPlayerIndex + 1) % modeState.players.length;
    } while (modeState.players[modeState.currentPlayerIndex].eliminated);
}

export function getLuckyLukeState() {
    return modeState?.mode === 'luckyLuke' ? modeState : null;
}

export function getCurrentLuckyLukePlayer() {
    if (!modeState || modeState.mode !== 'luckyLuke') return null;
    return modeState.players[modeState.currentPlayerIndex];
}

export function getLuckyLukeResult() {
    if (!modeState || modeState.mode !== 'luckyLuke') return null;
    return {
        winner: modeState.winner,
        players: modeState.players
    };
}

// ========================================
// RACE
// ========================================
// Le premier joueur à atteindre ou dépasser 25 points l'emporte.

export function initRace(playerNames, onUpdate, targetScore = 25) {
    onUpdateCallback = onUpdate;
    modeState = {
        mode: 'race',
        players: playerNames.map((name, i) => ({
            id: i,
            name: name || `Joueur ${i + 1}`,
            score: 0
        })),
        currentPlayerIndex: 0,
        targetScore: targetScore,
        status: 'playing',
        winner: null
    };
    return modeState;
}

export function registerRaceThrow(points) {
    if (!modeState || modeState.mode !== 'race' || modeState.status !== 'playing') return null;

    const currentPlayer = modeState.players[modeState.currentPlayerIndex];
    currentPlayer.score += points;

    // Vérifie si le joueur a gagné
    if (currentPlayer.score >= modeState.targetScore) {
        modeState.status = 'finished';
        modeState.winner = currentPlayer;
    } else {
        // Passe au joueur suivant
        modeState.currentPlayerIndex = (modeState.currentPlayerIndex + 1) % modeState.players.length;
    }

    if (onUpdateCallback) onUpdateCallback(modeState);

    return { points, currentPlayer };
}

export function getRaceState() {
    return modeState?.mode === 'race' ? modeState : null;
}

export function getCurrentRacePlayer() {
    if (!modeState || modeState.mode !== 'race') return null;
    return modeState.players[modeState.currentPlayerIndex];
}

export function getRaceResult() {
    if (!modeState || modeState.mode !== 'race') return null;
    return {
        winner: modeState.winner,
        players: [...modeState.players].sort((a, b) => b.score - a.score)
    };
}

// ========================================
// SUITE D'OR (Golden Sequence)
// ========================================
// Toucher les zones 1-2-3-4-6-4-3-2-1 dans cet ordre.
// Si le joueur touche la bonne zone il rejoue, sinon c'est à l'autre de jouer.

const GOLDEN_SEQUENCE = [1, 2, 3, 4, 6, 4, 3, 2, 1];

export function initSuiteOr(playerNames, onUpdate) {
    onUpdateCallback = onUpdate;
    modeState = {
        mode: 'suiteOr',
        players: playerNames.map((name, i) => ({
            id: i,
            name: name || `Joueur ${i + 1}`,
            sequenceIndex: 0 // Position dans la suite
        })),
        currentPlayerIndex: 0,
        sequence: GOLDEN_SEQUENCE,
        status: 'playing',
        winner: null
    };
    return modeState;
}

export function registerSuiteOrThrow(zone, points) {
    if (!modeState || modeState.mode !== 'suiteOr' || modeState.status !== 'playing') return null;

    const currentPlayer = modeState.players[modeState.currentPlayerIndex];
    const expectedPoints = modeState.sequence[currentPlayer.sequenceIndex];

    // Convertit la zone en points attendus (bullseye = 6)
    const zonePoints = zone === 'bullseye' ? 6 : points;

    let success = false;

    if (zonePoints === expectedPoints) {
        // Bonne zone ! Avance dans la séquence
        currentPlayer.sequenceIndex++;
        success = true;

        // Vérifie si le joueur a terminé la séquence
        if (currentPlayer.sequenceIndex >= modeState.sequence.length) {
            modeState.status = 'finished';
            modeState.winner = currentPlayer;
        }
        // Sinon il rejoue (pas de changement de joueur)
    } else {
        // Mauvaise zone, passe au joueur suivant
        modeState.currentPlayerIndex = (modeState.currentPlayerIndex + 1) % modeState.players.length;
    }

    if (onUpdateCallback) onUpdateCallback(modeState);

    return { points: zonePoints, expectedPoints, success, currentPlayer };
}

export function getSuiteOrState() {
    return modeState?.mode === 'suiteOr' ? modeState : null;
}

export function getCurrentSuiteOrPlayer() {
    if (!modeState || modeState.mode !== 'suiteOr') return null;
    return modeState.players[modeState.currentPlayerIndex];
}

export function getSuiteOrResult() {
    if (!modeState || modeState.mode !== 'suiteOr') return null;
    return {
        winner: modeState.winner,
        players: [...modeState.players].sort((a, b) => b.sequenceIndex - a.sequenceIndex)
    };
}

export function getExpectedZone() {
    if (!modeState || modeState.mode !== 'suiteOr') return null;
    const currentPlayer = modeState.players[modeState.currentPlayerIndex];
    return modeState.sequence[currentPlayer.sequenceIndex];
}

// ========================================
// 007
// ========================================
// Le premier qui vise 5 fois le centre (bullseye) l'emporte.

export function init007(playerNames, onUpdate, targetHits = 5) {
    onUpdateCallback = onUpdate;
    modeState = {
        mode: '007',
        players: playerNames.map((name, i) => ({
            id: i,
            name: name || `Joueur ${i + 1}`,
            bullseyeHits: 0
        })),
        currentPlayerIndex: 0,
        targetHits: targetHits,
        status: 'playing',
        winner: null
    };
    return modeState;
}

export function register007Throw(zone) {
    if (!modeState || modeState.mode !== '007' || modeState.status !== 'playing') return null;

    const currentPlayer = modeState.players[modeState.currentPlayerIndex];
    const isBullseye = zone === 'bullseye';

    if (isBullseye) {
        currentPlayer.bullseyeHits++;

        // Vérifie si le joueur a gagné
        if (currentPlayer.bullseyeHits >= modeState.targetHits) {
            modeState.status = 'finished';
            modeState.winner = currentPlayer;
        }
    }

    // Passe au joueur suivant
    modeState.currentPlayerIndex = (modeState.currentPlayerIndex + 1) % modeState.players.length;

    if (onUpdateCallback) onUpdateCallback(modeState);

    return { isBullseye, currentPlayer };
}

export function get007State() {
    return modeState?.mode === '007' ? modeState : null;
}

export function getCurrent007Player() {
    if (!modeState || modeState.mode !== '007') return null;
    return modeState.players[modeState.currentPlayerIndex];
}

export function get007Result() {
    if (!modeState || modeState.mode !== '007') return null;
    return {
        winner: modeState.winner,
        players: [...modeState.players].sort((a, b) => b.bullseyeHits - a.bullseyeHits)
    };
}

// ========================================
// KILLER
// ========================================
// Le premier joueur à faire exactement 20 points l'emporte.
// Si un joueur égalise le score d'un autre joueur, ce dernier est remis à 0.

export function initKiller(playerNames, onUpdate, targetScore = 20) {
    onUpdateCallback = onUpdate;
    modeState = {
        mode: 'killer',
        players: playerNames.map((name, i) => ({
            id: i,
            name: name || `Joueur ${i + 1}`,
            score: 0
        })),
        currentPlayerIndex: 0,
        targetScore: targetScore,
        status: 'playing',
        winner: null
    };
    return modeState;
}

export function registerKillerThrow(points) {
    if (!modeState || modeState.mode !== 'killer' || modeState.status !== 'playing') return null;

    const currentPlayer = modeState.players[modeState.currentPlayerIndex];
    const oldScore = currentPlayer.score;
    currentPlayer.score += points;

    let resetPlayers = [];

    // Vérifie si le joueur a exactement le score cible
    if (currentPlayer.score === modeState.targetScore) {
        modeState.status = 'finished';
        modeState.winner = currentPlayer;
    } else if (currentPlayer.score > modeState.targetScore) {
        // Dépassement : le score revient à 0
        currentPlayer.score = 0;
        resetPlayers.push(currentPlayer);
    } else {
        // Vérifie si le joueur égalise le score d'un autre joueur
        modeState.players.forEach(player => {
            if (player.id !== currentPlayer.id && player.score === currentPlayer.score && player.score > 0) {
                player.score = 0;
                resetPlayers.push(player);
            }
        });
    }

    // Passe au joueur suivant
    modeState.currentPlayerIndex = (modeState.currentPlayerIndex + 1) % modeState.players.length;

    if (onUpdateCallback) onUpdateCallback(modeState);

    return { points, currentPlayer, resetPlayers, oldScore };
}

export function getKillerState() {
    return modeState?.mode === 'killer' ? modeState : null;
}

export function getCurrentKillerPlayer() {
    if (!modeState || modeState.mode !== 'killer') return null;
    return modeState.players[modeState.currentPlayerIndex];
}

export function getKillerResult() {
    if (!modeState || modeState.mode !== 'killer') return null;
    return {
        winner: modeState.winner,
        players: [...modeState.players].sort((a, b) => b.score - a.score)
    };
}

// ========================================
// FONCTIONS COMMUNES
// ========================================

export function quitNewMode() {
    modeState = null;
    onUpdateCallback = null;
}

export function restartNewMode() {
    if (!modeState) return;

    const playerNames = modeState.players.map(p => p.name);
    const mode = modeState.mode;

    switch (mode) {
        case 'luckyLuke':
            initLuckyLuke(playerNames, onUpdateCallback);
            break;
        case 'race':
            initRace(playerNames, onUpdateCallback, modeState.targetScore);
            break;
        case 'suiteOr':
            initSuiteOr(playerNames, onUpdateCallback);
            break;
        case '007':
            init007(playerNames, onUpdateCallback, modeState.targetHits);
            break;
        case 'killer':
            initKiller(playerNames, onUpdateCallback, modeState.targetScore);
            break;
    }

    if (onUpdateCallback) onUpdateCallback(modeState);
}

export function getNewModeState() {
    return modeState;
}
