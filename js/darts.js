// ========================================
// DARTS - Mode Fléchettes 301
// ========================================

// État du jeu de fléchettes
let dartsState = null;
let onDartsUpdateCallback = null;

// Configuration de la cible de fléchettes
const DARTS_CONFIG = {
    size: 500,
    center: 250,
    // Ordre des segments (sens horaire depuis le haut)
    segments: [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5],
    // Rayons des zones (en pixels depuis le centre)
    // Agrandis pour correspondre à la taille de la cible classique (rayon 220)
    radii: {
        doubleBull: 10,   // Double bull (50 pts)
        singleBull: 26,   // Single bull (25 pts)
        innerTriple: 123, // Début triple
        outerTriple: 138, // Fin triple
        innerDouble: 207, // Début double
        outerDouble: 220, // Fin double (bord)
    }
};

/**
 * Initialise une partie de 301
 * @param {Array} playerNames - Noms des joueurs
 * @param {Function} callback - Callback de mise à jour
 * @param {number} startScore - Score de départ (301)
 * @param {Object} options - Options (teamMode, teams)
 */
export function initDarts(playerNames, callback, startScore = 301, options = {}) {
    onDartsUpdateCallback = callback;

    const teamMode = options.teamMode || false;
    const teamsConfig = options.teams || {};

    dartsState = {
        players: playerNames.map((name, i) => ({
            id: i,
            name: name || `Joueur ${i + 1}`,
            score: teamMode ? 0 : startScore, // En mode équipe, le score individuel n'est pas utilisé
            team: teamMode ? (teamsConfig[i] || 1) : null,
            throws: [],
            currentRoundThrows: [],
            stats: {
                totalThrows: 0,
                doubles: 0,
                triples: 0,
                bulls: 0
            }
        })),
        currentPlayerIndex: 0,
        currentThrow: 1,
        throwsPerRound: 3,
        startScore,
        status: 'playing',
        winner: null,
        startTime: Date.now(),
        teamMode,
        teams: teamMode ? {
            1: { name: 'Équipe 1', score: startScore },
            2: { name: 'Équipe 2', score: startScore }
        } : null,
        playOrder: null, // Ordre de jeu pour alterner entre équipes
        currentOrderIndex: 0,
        waitingForNextPlayer: false,
        roundComplete: false
    };

    // En mode équipe, crée l'ordre de jeu en alternant entre les équipes
    if (teamMode) {
        dartsState.playOrder = createAlternatingPlayOrder(dartsState.players);
    }

    notifyUpdate();
    return dartsState;
}

/**
 * Crée un ordre de jeu alternant entre les équipes
 */
function createAlternatingPlayOrder(players) {
    const team1 = players.filter(p => p.team === 1).map(p => p.id);
    const team2 = players.filter(p => p.team === 2).map(p => p.id);
    const order = [];
    const maxLen = Math.max(team1.length, team2.length);

    for (let i = 0; i < maxLen; i++) {
        if (i < team1.length) order.push(team1[i]);
        if (i < team2.length) order.push(team2[i]);
    }

    return order;
}

/**
 * Récupère l'état actuel
 */
export function getDartsState() {
    return dartsState;
}

/**
 * Récupère le joueur actuel
 */
export function getCurrentDartsPlayer() {
    if (!dartsState) return null;

    if (dartsState.teamMode && dartsState.playOrder) {
        const playerId = dartsState.playOrder[dartsState.currentOrderIndex];
        return dartsState.players[playerId];
    }

    return dartsState.players[dartsState.currentPlayerIndex];
}

/**
 * Enregistre un lancer
 */
export function registerDartsThrow(segment, multiplier) {
    if (!dartsState || dartsState.status !== 'playing') return null;
    if (dartsState.waitingForNextPlayer) return null; // Bloque pendant le délai

    const player = getCurrentDartsPlayer();
    const points = segment * multiplier;

    // En mode équipe, on vérifie le score de l'équipe, sinon le score individuel
    const currentScore = dartsState.teamMode
        ? dartsState.teams[player.team].score
        : player.score;
    const newScore = currentScore - points;

    // Sauvegarde le lancer
    const throwData = {
        segment,
        multiplier,
        points,
        valid: true,
        isLastThrow: dartsState.currentThrow === dartsState.throwsPerRound
    };

    // Règle du bust : si on dépasse 0
    if (newScore < 0) {
        throwData.valid = false;
        throwData.bust = true;
        player.currentRoundThrows.push(throwData);
        bustRound();
        return throwData;
    }

    // Lancer valide
    if (dartsState.teamMode) {
        // En mode équipe, seul le score d'équipe compte
        dartsState.teams[player.team].score = newScore;
    } else {
        player.score = newScore;
    }

    player.throws.push(throwData);
    player.currentRoundThrows.push(throwData);
    player.stats.totalThrows++;

    // Stats
    if (multiplier === 2) player.stats.doubles++;
    if (multiplier === 3) player.stats.triples++;
    if (segment === 25 || segment === 50) player.stats.bulls++;

    // Vérifie victoire (score à 0)
    const checkScore = dartsState.teamMode
        ? dartsState.teams[player.team].score
        : player.score;

    if (checkScore === 0) {
        dartsState.status = 'finished';
        if (dartsState.teamMode) {
            dartsState.winner = dartsState.teams[player.team];
            dartsState.winningTeam = player.team;
            dartsState.winningPlayer = player;
        } else {
            dartsState.winner = player;
        }
        dartsState.endTime = Date.now();
        notifyUpdate();
        return throwData;
    }

    // Avance dans le jeu
    advanceDarts();
    notifyUpdate();

    return throwData;
}

/**
 * Enregistre un lancer raté
 */
export function registerDartsMiss() {
    return registerDartsThrow(0, 1);
}

/**
 * Gère un bust (annule le tour)
 */
function bustRound() {
    const player = getCurrentDartsPlayer();

    // Restaure le score du début du tour
    const roundPoints = player.currentRoundThrows
        .filter(t => t.valid)
        .reduce((sum, t) => sum + t.points, 0);

    if (dartsState.teamMode) {
        // Restaure le score de l'équipe
        dartsState.teams[player.team].score += roundPoints;
    } else {
        player.score += roundPoints;
    }

    // Marque la fin du tour avec délai
    dartsState.roundComplete = true;
    dartsState.waitingForNextPlayer = true;
    notifyUpdate();
}

/**
 * Avance dans le jeu
 */
function advanceDarts() {
    dartsState.currentThrow++;

    if (dartsState.currentThrow > dartsState.throwsPerRound) {
        // Marque la fin du tour - attend le délai avant de passer au joueur suivant
        dartsState.roundComplete = true;
        dartsState.waitingForNextPlayer = true;
    }
}

/**
 * Passe au joueur suivant (appelé après le délai de 5 sec)
 */
function nextPlayer() {
    const player = getCurrentDartsPlayer();
    player.currentRoundThrows = [];

    if (dartsState.teamMode && dartsState.playOrder) {
        dartsState.currentOrderIndex = (dartsState.currentOrderIndex + 1) % dartsState.playOrder.length;
    } else {
        dartsState.currentPlayerIndex = (dartsState.currentPlayerIndex + 1) % dartsState.players.length;
    }

    dartsState.currentThrow = 1;
    dartsState.roundComplete = false;
    dartsState.waitingForNextPlayer = false;
}

/**
 * Confirme le passage au joueur suivant (appelé par l'UI après le délai)
 */
export function confirmNextDartsPlayer() {
    if (!dartsState || !dartsState.waitingForNextPlayer) return;

    nextPlayer();
    notifyUpdate();
}

/**
 * Récupère le résultat
 */
export function getDartsResult() {
    if (!dartsState || dartsState.status !== 'finished') return null;

    // Trie par score (le plus bas gagne)
    const rankings = [...dartsState.players].sort((a, b) => a.score - b.score);

    return {
        winner: dartsState.winner,
        winningTeam: dartsState.winningTeam,
        rankings,
        players: dartsState.players,
        teamMode: dartsState.teamMode,
        teams: dartsState.teams
    };
}

/**
 * Relance une partie
 */
export function restartDarts() {
    if (!dartsState) return null;

    const names = dartsState.players.map(p => p.name);
    const teams = {};
    if (dartsState.teamMode) {
        dartsState.players.forEach((p, i) => {
            teams[i] = p.team;
        });
    }

    return initDarts(names, onDartsUpdateCallback, dartsState.startScore, {
        teamMode: dartsState.teamMode,
        teams
    });
}

/**
 * Quitte la partie
 */
export function quitDarts() {
    dartsState = null;
}

/**
 * Notifie les mises à jour
 */
function notifyUpdate() {
    if (onDartsUpdateCallback) {
        onDartsUpdateCallback(dartsState);
    }
}

/**
 * Détermine la zone touchée sur la cible
 */
export function getDartsZone(x, y) {
    const { center, radii, segments } = DARTS_CONFIG;

    // Coordonnées relatives au centre
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Double bull (centre exact)
    if (distance <= radii.doubleBull) {
        return { segment: 50, multiplier: 1, zone: 'doubleBull', name: 'Double Bull' };
    }

    // Single bull
    if (distance <= radii.singleBull) {
        return { segment: 25, multiplier: 1, zone: 'singleBull', name: 'Single Bull' };
    }

    // Hors cible
    if (distance > radii.outerDouble) {
        return { segment: 0, multiplier: 0, zone: 'miss', name: 'Raté' };
    }

    // Calcule l'angle pour déterminer le segment
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Chaque segment fait 18 degrés, décalé de 9 degrés
    const segmentIndex = Math.floor((angle + 9) / 18) % 20;
    const segment = segments[segmentIndex];

    // Détermine le multiplicateur
    let multiplier = 1;
    let zone = 'single';
    let name = `${segment}`;

    if (distance >= radii.innerTriple && distance <= radii.outerTriple) {
        multiplier = 3;
        zone = 'triple';
        name = `Triple ${segment}`;
    } else if (distance >= radii.innerDouble && distance <= radii.outerDouble) {
        multiplier = 2;
        zone = 'double';
        name = `Double ${segment}`;
    }

    return { segment, multiplier, zone, name };
}

/**
 * Dessine la cible de fléchettes
 */
export function drawDartsTarget(svgElement, onZoneClick) {
    if (!svgElement) return;

    const { size, center, radii, segments } = DARTS_CONFIG;

    svgElement.innerHTML = '';

    // Couleurs
    const colors = {
        black: '#1a1a1a',
        white: '#f5f5dc',
        red: '#e53935',
        green: '#43a047'
    };

    // Fond
    svgElement.appendChild(createSvgElement('rect', {
        x: 0, y: 0, width: size, height: size,
        fill: '#2d2d2d'
    }));

    // Cercle extérieur (cadre)
    svgElement.appendChild(createSvgElement('circle', {
        cx: center, cy: center, r: radii.outerDouble + 15,
        fill: '#1a1a1a',
        stroke: '#444',
        'stroke-width': 2
    }));

    // Dessine les segments
    for (let i = 0; i < 20; i++) {
        const startAngle = (i * 18 - 99) * (Math.PI / 180);
        const endAngle = ((i + 1) * 18 - 99) * (Math.PI / 180);

        const isEven = i % 2 === 0;
        const segment = segments[i];

        // Zone simple externe (entre triple et double)
        drawSegment(svgElement, center, radii.outerTriple, radii.innerDouble,
            startAngle, endAngle, isEven ? colors.black : colors.white);

        // Zone simple interne (entre bull et triple)
        drawSegment(svgElement, center, radii.singleBull, radii.innerTriple,
            startAngle, endAngle, isEven ? colors.black : colors.white);

        // Zone triple
        drawSegment(svgElement, center, radii.innerTriple, radii.outerTriple,
            startAngle, endAngle, isEven ? colors.red : colors.green);

        // Zone double
        drawSegment(svgElement, center, radii.innerDouble, radii.outerDouble,
            startAngle, endAngle, isEven ? colors.red : colors.green);

        // Numéro du segment
        const labelAngle = (i * 18 - 90) * (Math.PI / 180);
        const labelRadius = radii.outerDouble + 25;
        const labelX = center + Math.cos(labelAngle) * labelRadius;
        const labelY = center + Math.sin(labelAngle) * labelRadius;

        const label = createSvgElement('text', {
            x: labelX, y: labelY,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            fill: '#ffffff',
            'font-size': 14,
            'font-weight': 'bold'
        });
        label.textContent = segment;
        svgElement.appendChild(label);
    }

    // Single bull (vert)
    svgElement.appendChild(createSvgElement('circle', {
        cx: center, cy: center, r: radii.singleBull,
        fill: colors.green,
        stroke: '#333',
        'stroke-width': 1
    }));

    // Double bull (rouge)
    svgElement.appendChild(createSvgElement('circle', {
        cx: center, cy: center, r: radii.doubleBull,
        fill: colors.red,
        stroke: '#333',
        'stroke-width': 1
    }));

    // Zone cliquable transparente
    const clickZone = createSvgElement('circle', {
        cx: center, cy: center, r: radii.outerDouble + 10,
        fill: 'transparent',
        cursor: 'crosshair'
    });

    clickZone.addEventListener('click', (e) => {
        const rect = svgElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (size / rect.width);
        const y = (e.clientY - rect.top) * (size / rect.height);
        const zoneData = getDartsZone(x, y);
        onZoneClick(zoneData, e.clientX, e.clientY);
    });

    svgElement.appendChild(clickZone);
}

/**
 * Dessine un segment de la cible
 */
function drawSegment(svg, center, innerRadius, outerRadius, startAngle, endAngle, fill) {
    const x1 = center + Math.cos(startAngle) * innerRadius;
    const y1 = center + Math.sin(startAngle) * innerRadius;
    const x2 = center + Math.cos(startAngle) * outerRadius;
    const y2 = center + Math.sin(startAngle) * outerRadius;
    const x3 = center + Math.cos(endAngle) * outerRadius;
    const y3 = center + Math.sin(endAngle) * outerRadius;
    const x4 = center + Math.cos(endAngle) * innerRadius;
    const y4 = center + Math.sin(endAngle) * innerRadius;

    const path = createSvgElement('path', {
        d: `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`,
        fill,
        stroke: '#333',
        'stroke-width': 0.5
    });

    svg.appendChild(path);
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
