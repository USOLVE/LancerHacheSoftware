// ========================================
// PLAYERS - Gestion des joueurs
// ========================================

/**
 * Crée un nouveau joueur
 */
export function createPlayer(id, name) {
    return {
        id,
        name: name || `Joueur ${id + 1}`,
        score: 0,
        throws: [], // Historique des lancers [{points, zone, series, throw}]
        stats: {
            totalThrows: 0,
            hits: 0,
            misses: 0,
            bullseyes: 0,
            killshots: 0,
            bestThrow: 0,
            seriesScores: []
        }
    };
}

/**
 * Ajoute un lancer au joueur
 */
export function addThrow(player, points, zone, series, throwNum) {
    const throwData = {
        points,
        zone,
        series,
        throw: throwNum,
        timestamp: Date.now()
    };

    player.throws.push(throwData);
    player.score += points;

    // Met à jour les statistiques
    player.stats.totalThrows++;
    if (points > 0) {
        player.stats.hits++;
    } else {
        player.stats.misses++;
    }
    if (zone === 'bullseye') {
        player.stats.bullseyes++;
    }
    if (zone === 'killshot') {
        player.stats.killshots++;
    }
    if (points > player.stats.bestThrow) {
        player.stats.bestThrow = points;
    }

    return throwData;
}

/**
 * Annule le dernier lancer du joueur
 */
export function undoLastThrow(player) {
    if (player.throws.length === 0) {
        return null;
    }

    const lastThrow = player.throws.pop();
    player.score -= lastThrow.points;

    // Met à jour les statistiques
    player.stats.totalThrows--;
    if (lastThrow.points > 0) {
        player.stats.hits--;
    } else {
        player.stats.misses--;
    }
    if (lastThrow.zone === 'bullseye') {
        player.stats.bullseyes--;
    }
    if (lastThrow.zone === 'killshot') {
        player.stats.killshots--;
    }

    // Recalcule le meilleur lancer
    player.stats.bestThrow = player.throws.reduce(
        (max, t) => Math.max(max, t.points), 0
    );

    return lastThrow;
}

/**
 * Calcule la moyenne des lancers
 */
export function getAverageScore(player) {
    if (player.stats.totalThrows === 0) return 0;
    return (player.score / player.stats.totalThrows).toFixed(2);
}

/**
 * Calcule le taux de réussite
 */
export function getHitRate(player) {
    if (player.stats.totalThrows === 0) return 0;
    return ((player.stats.hits / player.stats.totalThrows) * 100).toFixed(1);
}

/**
 * Récupère les lancers d'une série spécifique
 */
export function getSeriesThrows(player, seriesNum) {
    return player.throws.filter(t => t.series === seriesNum);
}

/**
 * Calcule le score d'une série
 */
export function getSeriesScore(player, seriesNum) {
    return getSeriesThrows(player, seriesNum).reduce((sum, t) => sum + t.points, 0);
}

/**
 * Trie les joueurs par score (décroissant)
 */
export function sortPlayersByScore(players) {
    return [...players].sort((a, b) => b.score - a.score);
}

/**
 * Récupère le classement d'un joueur
 */
export function getPlayerRank(players, playerId) {
    const sorted = sortPlayersByScore(players);
    return sorted.findIndex(p => p.id === playerId) + 1;
}
