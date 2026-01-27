// ========================================
// STORAGE - Gestion du localStorage
// ========================================

const STORAGE_KEYS = {
    CURRENT_GAME: 'lh_current_game',
    SETTINGS: 'lh_settings',
    HISTORY: 'lh_history',
    STATS: 'lh_stats',
    LEADERBOARD: 'lh_leaderboard'
};

// Paramètres par défaut
const DEFAULT_SETTINGS = {
    soundsEnabled: true,
    vibrationEnabled: true,
    animationsEnabled: true,
    killshotThrow: 3 // Dernier lancer uniquement
};

/**
 * Sauvegarde une partie en cours
 */
export function saveCurrentGame(gameState) {
    try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, JSON.stringify(gameState));
        return true;
    } catch (e) {
        console.error('Erreur sauvegarde partie:', e);
        return false;
    }
}

/**
 * Récupère la partie en cours
 */
export function loadCurrentGame() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Erreur chargement partie:', e);
        return null;
    }
}

/**
 * Supprime la partie en cours
 */
export function clearCurrentGame() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
}

/**
 * Sauvegarde les paramètres
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (e) {
        console.error('Erreur sauvegarde paramètres:', e);
        return false;
    }
}

/**
 * Récupère les paramètres
 */
export function loadSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
        console.error('Erreur chargement paramètres:', e);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Ajoute une partie à l'historique
 */
export function addToHistory(gameResult) {
    try {
        const history = loadHistory();
        history.unshift({
            ...gameResult,
            date: new Date().toISOString()
        });
        // Garde les 50 dernières parties
        if (history.length > 50) {
            history.pop();
        }
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        return true;
    } catch (e) {
        console.error('Erreur sauvegarde historique:', e);
        return false;
    }
}

/**
 * Récupère l'historique des parties
 */
export function loadHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Erreur chargement historique:', e);
        return [];
    }
}

/**
 * Efface toutes les données
 */
export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

/**
 * Vérifie si une partie est en cours
 */
export function hasCurrentGame() {
    return loadCurrentGame() !== null;
}

/**
 * Récupère le leaderboard
 */
export function loadLeaderboard() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Erreur chargement leaderboard:', e);
        return [];
    }
}

/**
 * Met à jour le leaderboard avec les résultats d'une partie
 */
export function updateLeaderboard(players, mode) {
    try {
        const leaderboard = loadLeaderboard();

        players.forEach(player => {
            // Cherche si le joueur existe déjà
            let entry = leaderboard.find(e => e.name.toLowerCase() === player.name.toLowerCase());

            if (entry) {
                // Met à jour les stats existantes
                entry.gamesPlayed++;
                entry.totalScore += player.score;
                entry.totalThrows += player.stats.totalThrows;
                entry.totalBullseyes += player.stats.bullseyes;
                entry.totalKillshots += player.stats.killshots;
                if (player.score > entry.bestScore) {
                    entry.bestScore = player.score;
                }
                entry.averageScore = Math.round(entry.totalScore / entry.gamesPlayed);
                entry.lastPlayed = new Date().toISOString();
            } else {
                // Nouveau joueur
                leaderboard.push({
                    name: player.name,
                    gamesPlayed: 1,
                    totalScore: player.score,
                    bestScore: player.score,
                    averageScore: player.score,
                    totalThrows: player.stats.totalThrows,
                    totalBullseyes: player.stats.bullseyes,
                    totalKillshots: player.stats.killshots,
                    firstPlayed: new Date().toISOString(),
                    lastPlayed: new Date().toISOString()
                });
            }
        });

        // Trie par meilleur score
        leaderboard.sort((a, b) => b.bestScore - a.bestScore);

        localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard));
        return true;
    } catch (e) {
        console.error('Erreur mise à jour leaderboard:', e);
        return false;
    }
}

/**
 * Efface le leaderboard
 */
export function clearLeaderboard() {
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
}
