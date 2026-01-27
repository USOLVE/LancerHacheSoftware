// ========================================
// SCORING - Calcul des scores
// ========================================

// Configuration des zones de scoring (cible WATL/IATF)
export const SCORING_ZONES = {
    bullseye: { points: 6, name: 'Bullseye', color: '#000000' },
    zone4: { points: 4, name: 'Zone 4', color: '#ff0000' },
    zone3: { points: 3, name: 'Zone 3', color: '#0066cc' },
    zone2: { points: 2, name: 'Zone 2', color: '#ff0000' },
    zone1: { points: 1, name: 'Zone 1', color: '#0066cc' },
    killshot: { points: 8, name: 'Killshot', color: '#00ff00' },
    miss: { points: 0, name: 'Raté', color: 'transparent' }
};

// Ratio de la cible (mainRadius / size = 220 / 500)
const TARGET_RATIO = 0.44;

// Rayons des zones (en pourcentage du rayon total, multiplié par le ratio cible)
const ZONE_RADII = {
    bullseye: 0.08 * TARGET_RATIO,    // Centre - 6 points
    zone4: 0.20 * TARGET_RATIO,       // Zone 4 points
    zone3: 0.40 * TARGET_RATIO,       // Zone 3 points
    zone2: 0.65 * TARGET_RATIO,       // Zone 2 points
    zone1: 0.90 * TARGET_RATIO        // Zone 1 point (bord)
};

/**
 * Détermine la zone touchée en fonction des coordonnées
 * @param {number} x - Position X relative au centre (0-1, 0.5 = centre)
 * @param {number} y - Position Y relative au centre (0-1, 0.5 = centre)
 * @param {boolean} killshotEnabled - Si le killshot est autorisé
 * @returns {string} - Nom de la zone touchée
 */
export function getZoneFromPosition(x, y, killshotEnabled = false) {
    // Convertit en coordonnées centrées (-0.5 à 0.5)
    const centerX = x - 0.5;
    const centerY = y - 0.5;

    // Vérifie les killshots (coins supérieurs)
    // Valeurs basées sur target.js: x=155, y=-185, radius=18, size=500
    if (killshotEnabled) {
        const killshotRadius = 18 / 500;  // 0.036
        const killshotY = -185 / 500;     // -0.37 (depuis le centre)
        const killshotX = 155 / 500;      // 0.31 (distance du centre)

        // Killshot gauche
        if (Math.sqrt((centerX + killshotX) ** 2 + (centerY - killshotY) ** 2) < killshotRadius) {
            return 'killshot';
        }
        // Killshot droit
        if (Math.sqrt((centerX - killshotX) ** 2 + (centerY - killshotY) ** 2) < killshotRadius) {
            return 'killshot';
        }
    }

    // Calcule la distance au centre
    const distance = Math.sqrt(centerX ** 2 + centerY ** 2);

    // Détermine la zone en fonction de la distance
    if (distance <= ZONE_RADII.bullseye) {
        return 'bullseye';
    } else if (distance <= ZONE_RADII.zone4) {
        return 'zone4';
    } else if (distance <= ZONE_RADII.zone3) {
        return 'zone3';
    } else if (distance <= ZONE_RADII.zone2) {
        return 'zone2';
    } else if (distance <= ZONE_RADII.zone1) {
        return 'zone1';
    } else {
        return 'miss';
    }
}

/**
 * Récupère les points pour une zone donnée
 */
export function getPointsForZone(zone) {
    return SCORING_ZONES[zone]?.points ?? 0;
}

/**
 * Récupère le nom d'affichage d'une zone
 */
export function getZoneName(zone) {
    return SCORING_ZONES[zone]?.name ?? 'Inconnu';
}

/**
 * Calcule le score total d'une liste de lancers
 */
export function calculateTotalScore(throws) {
    return throws.reduce((sum, t) => sum + (t.points || 0), 0);
}

/**
 * Vérifie si un lancer est un "bon" lancer (bullseye ou killshot)
 */
export function isExceptionalThrow(zone) {
    return zone === 'bullseye' || zone === 'killshot';
}

/**
 * Génère un résumé des statistiques de scoring
 */
export function generateScoringStats(throws) {
    const stats = {
        total: throws.length,
        totalPoints: 0,
        zoneBreakdown: {},
        average: 0,
        hitRate: 0
    };

    // Initialise le breakdown pour chaque zone
    Object.keys(SCORING_ZONES).forEach(zone => {
        stats.zoneBreakdown[zone] = 0;
    });

    // Compte les lancers par zone
    throws.forEach(t => {
        const zone = t.zone || 'miss';
        stats.zoneBreakdown[zone]++;
        stats.totalPoints += t.points || 0;
    });

    // Calcule les moyennes
    if (stats.total > 0) {
        stats.average = (stats.totalPoints / stats.total).toFixed(2);
        const hits = stats.total - stats.zoneBreakdown.miss;
        stats.hitRate = ((hits / stats.total) * 100).toFixed(1);
    }

    return stats;
}
