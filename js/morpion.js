// ========================================
// MORPION - Mode de jeu Tic-Tac-Toe
// ========================================

// État du jeu de morpion
let morpionState = null;
let onMorpionUpdateCallback = null;

// Symboles des joueurs
const SYMBOLS = ['X', 'O'];

/**
 * Initialise une nouvelle session de morpion (remet les scores à 0)
 * @param {Array} playerNames - Noms des joueurs
 * @param {Function} callback - Callback de mise à jour
 * @param {Object} options - Options (teamMode, teams)
 */
export function initMorpion(playerNames, callback, options = {}) {
    onMorpionUpdateCallback = callback;

    const teamMode = options.teamMode || false;

    if (teamMode) {
        // Mode équipes : 4 joueurs (2v2)
        const names = [
            playerNames[0] || 'Joueur 1',
            playerNames[1] || 'Joueur 2',
            playerNames[2] || 'Joueur 3',
            playerNames[3] || 'Joueur 4'
        ];

        morpionState = {
            board: Array(9).fill(null),
            players: names.map((name, i) => ({
                id: i,
                name,
                team: i < 2 ? 1 : 2,  // Joueurs 0,1 = Équipe 1, Joueurs 2,3 = Équipe 2
                symbol: i < 2 ? 'X' : 'O'
            })),
            teams: {
                1: { name: 'Équipe 1', symbol: 'X', score: 0 },
                2: { name: 'Équipe 2', symbol: 'O', score: 0 }
            },
            teamMode: true,
            currentPlayerIndex: 0,
            playOrder: [0, 2, 1, 3],  // Alterne entre équipes: E1-J1, E2-J1, E1-J2, E2-J2
            currentOrderIndex: 0,
            roundNumber: 1,
            status: 'playing',
            winner: null,
            winningTeam: null,
            winningLine: null,
            startTime: Date.now()
        };
    } else {
        // Mode normal : 2 joueurs
        const names = [playerNames[0] || 'Joueur 1', playerNames[1] || 'Joueur 2'];

        morpionState = {
            board: Array(9).fill(null),
            players: names.map((name, i) => ({
                id: i,
                name,
                symbol: SYMBOLS[i],
                score: 0
            })),
            teamMode: false,
            currentPlayerIndex: 0,
            roundNumber: 1,
            status: 'playing',
            winner: null,
            winningLine: null,
            startTime: Date.now()
        };
    }

    notifyUpdate();
    return morpionState;
}

/**
 * Récupère l'état actuel du morpion
 */
export function getMorpionState() {
    return morpionState;
}

/**
 * Récupère le joueur actuel
 */
export function getCurrentMorpionPlayer() {
    if (!morpionState) return null;

    if (morpionState.teamMode) {
        const playerIndex = morpionState.playOrder[morpionState.currentOrderIndex];
        return morpionState.players[playerIndex];
    }

    return morpionState.players[morpionState.currentPlayerIndex];
}

/**
 * Joue un coup sur une case
 * @param {number} cellIndex - Index de la case (0-8)
 * @returns {object|null} - Résultat du coup
 */
export function playCell(cellIndex) {
    if (!morpionState || morpionState.status !== 'playing') return null;
    if (cellIndex < 0 || cellIndex > 8) return null;

    const currentPlayer = getCurrentMorpionPlayer();
    const cellContent = morpionState.board[cellIndex];

    // Case vide : place le symbole du joueur
    if (cellContent === null) {
        morpionState.board[cellIndex] = currentPlayer.symbol;
        checkWinner();
        if (morpionState.status === 'playing') {
            nextPlayer();
        }
        notifyUpdate();
        return { action: 'place', symbol: currentPlayer.symbol, cell: cellIndex };
    }

    // Case avec symbole adverse : efface le symbole
    if (cellContent !== currentPlayer.symbol) {
        morpionState.board[cellIndex] = null;
        nextPlayer();
        notifyUpdate();
        return { action: 'erase', symbol: cellContent, cell: cellIndex };
    }

    // Case avec son propre symbole : rien ne se passe (coup perdu)
    nextPlayer();
    notifyUpdate();
    return { action: 'wasted', cell: cellIndex };
}

/**
 * Passe au joueur suivant
 */
function nextPlayer() {
    if (morpionState.teamMode) {
        morpionState.currentOrderIndex = (morpionState.currentOrderIndex + 1) % 4;
    } else {
        morpionState.currentPlayerIndex = (morpionState.currentPlayerIndex + 1) % 2;
    }
}

/**
 * Vérifie s'il y a un gagnant
 */
function checkWinner() {
    const board = morpionState.board;

    // Lignes gagnantes possibles
    const lines = [
        [0, 1, 2], // Ligne 1
        [3, 4, 5], // Ligne 2
        [6, 7, 8], // Ligne 3
        [0, 3, 6], // Colonne 1
        [1, 4, 7], // Colonne 2
        [2, 5, 8], // Colonne 3
        [0, 4, 8], // Diagonale 1
        [2, 4, 6]  // Diagonale 2
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            morpionState.status = 'won';
            morpionState.winningLine = line;
            morpionState.endTime = Date.now();

            if (morpionState.teamMode) {
                // Mode équipes : incrémente le score de l'équipe
                const winningSymbol = board[a];
                morpionState.winningTeam = winningSymbol === 'X' ? 1 : 2;
                morpionState.teams[morpionState.winningTeam].score++;
                morpionState.winner = morpionState.teams[morpionState.winningTeam];
            } else {
                // Mode normal : incrémente le score du joueur
                morpionState.winner = morpionState.players.find(p => p.symbol === board[a]);
                morpionState.winner.score++;
            }
            return;
        }
    }

    // Vérifie match nul (grille pleine sans gagnant)
    if (!board.includes(null)) {
        morpionState.status = 'draw';
        morpionState.endTime = Date.now();
    }
}

/**
 * Récupère le résultat du morpion
 */
export function getMorpionResult() {
    if (!morpionState || morpionState.status === 'playing') return null;

    return {
        status: morpionState.status,
        winner: morpionState.winner,
        winningLine: morpionState.winningLine,
        winningTeam: morpionState.winningTeam,
        players: morpionState.players,
        teams: morpionState.teams,
        teamMode: morpionState.teamMode,
        board: morpionState.board,
        roundNumber: morpionState.roundNumber
    };
}

/**
 * Lance une nouvelle manche (garde les scores)
 */
export function nextRound() {
    if (!morpionState) return null;

    // Réinitialise la grille mais garde les scores
    morpionState.board = Array(9).fill(null);
    morpionState.roundNumber++;
    morpionState.status = 'playing';
    morpionState.winner = null;
    morpionState.winningLine = null;

    if (morpionState.teamMode) {
        morpionState.currentOrderIndex = 0;
        morpionState.winningTeam = null;
    } else {
        morpionState.currentPlayerIndex = 0;
    }

    notifyUpdate();
    return morpionState;
}

/**
 * Relance une session complète (remet les scores à 0)
 */
export function restartMorpion() {
    if (!morpionState) return null;

    const names = morpionState.players.map(p => p.name);
    return initMorpion(names, onMorpionUpdateCallback);
}

/**
 * Quitte le morpion
 */
export function quitMorpion() {
    morpionState = null;
}

/**
 * Notifie les mises à jour
 */
function notifyUpdate() {
    if (onMorpionUpdateCallback) {
        onMorpionUpdateCallback(morpionState);
    }
}

/**
 * Dessine la grille de morpion dans un SVG
 */
export function drawMorpionGrid(svgElement, onCellClick) {
    if (!svgElement) return;

    const svgSize = 500;
    const gridSize = 440; // Même diamètre que les cibles (2 × 220)
    const offset = (svgSize - gridSize) / 2; // Centrage = 30
    const cellSize = gridSize / 3;
    const padding = 15;

    svgElement.innerHTML = '';

    // Fond du SVG
    const background = createSvgElement('rect', {
        x: 0, y: 0, width: svgSize, height: svgSize,
        fill: '#2d2d2d'
    });
    svgElement.appendChild(background);

    // Fond de la grille (style bois)
    const gridBackground = createSvgElement('rect', {
        x: offset, y: offset, width: gridSize, height: gridSize,
        fill: '#5D4037',
        rx: 15, ry: 15
    });
    svgElement.appendChild(gridBackground);

    // Lignes de la grille
    const lineAttrs = {
        stroke: '#3E2723',
        'stroke-width': 8,
        'stroke-linecap': 'round'
    };

    // Lignes verticales
    svgElement.appendChild(createSvgElement('line', {
        x1: offset + cellSize, y1: offset + padding,
        x2: offset + cellSize, y2: offset + gridSize - padding,
        ...lineAttrs
    }));
    svgElement.appendChild(createSvgElement('line', {
        x1: offset + cellSize * 2, y1: offset + padding,
        x2: offset + cellSize * 2, y2: offset + gridSize - padding,
        ...lineAttrs
    }));

    // Lignes horizontales
    svgElement.appendChild(createSvgElement('line', {
        x1: offset + padding, y1: offset + cellSize,
        x2: offset + gridSize - padding, y2: offset + cellSize,
        ...lineAttrs
    }));
    svgElement.appendChild(createSvgElement('line', {
        x1: offset + padding, y1: offset + cellSize * 2,
        x2: offset + gridSize - padding, y2: offset + cellSize * 2,
        ...lineAttrs
    }));

    // Cases cliquables
    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = offset + col * cellSize;
        const y = offset + row * cellSize;

        const cell = createSvgElement('rect', {
            x, y, width: cellSize, height: cellSize,
            fill: 'transparent',
            class: 'morpion-cell',
            'data-cell': i,
            cursor: 'pointer'
        });

        cell.addEventListener('click', () => onCellClick(i));
        svgElement.appendChild(cell);
    }
}

/**
 * Met à jour l'affichage de la grille
 */
export function updateMorpionDisplay(svgElement) {
    if (!svgElement || !morpionState) return;

    const svgSize = 500;
    const gridSize = 440; // Même diamètre que les cibles
    const offset = (svgSize - gridSize) / 2; // Centrage = 30
    const cellSize = gridSize / 3;

    // Supprime les anciens symboles
    svgElement.querySelectorAll('.morpion-symbol, .winning-line').forEach(el => el.remove());

    // Dessine les symboles
    morpionState.board.forEach((symbol, i) => {
        if (symbol) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const centerX = offset + col * cellSize + cellSize / 2;
            const centerY = offset + row * cellSize + cellSize / 2;
            const symbolSize = cellSize * 0.35;

            if (symbol === 'X') {
                // Dessine X
                const line1 = createSvgElement('line', {
                    x1: centerX - symbolSize, y1: centerY - symbolSize,
                    x2: centerX + symbolSize, y2: centerY + symbolSize,
                    stroke: '#ff6b35',
                    'stroke-width': 12,
                    'stroke-linecap': 'round',
                    class: 'morpion-symbol'
                });
                const line2 = createSvgElement('line', {
                    x1: centerX + symbolSize, y1: centerY - symbolSize,
                    x2: centerX - symbolSize, y2: centerY + symbolSize,
                    stroke: '#ff6b35',
                    'stroke-width': 12,
                    'stroke-linecap': 'round',
                    class: 'morpion-symbol'
                });
                svgElement.appendChild(line1);
                svgElement.appendChild(line2);
            } else {
                // Dessine O
                const circle = createSvgElement('circle', {
                    cx: centerX, cy: centerY, r: symbolSize,
                    fill: 'none',
                    stroke: '#4fc3f7',
                    'stroke-width': 12,
                    class: 'morpion-symbol'
                });
                svgElement.appendChild(circle);
            }
        }
    });

    // Dessine la ligne gagnante
    if (morpionState.winningLine) {
        const [a, , c] = morpionState.winningLine;
        const rowA = Math.floor(a / 3);
        const colA = a % 3;
        const rowC = Math.floor(c / 3);
        const colC = c % 3;

        const x1 = offset + colA * cellSize + cellSize / 2;
        const y1 = offset + rowA * cellSize + cellSize / 2;
        const x2 = offset + colC * cellSize + cellSize / 2;
        const y2 = offset + rowC * cellSize + cellSize / 2;

        const winLine = createSvgElement('line', {
            x1, y1, x2, y2,
            stroke: '#ffd700',
            'stroke-width': 8,
            'stroke-linecap': 'round',
            class: 'winning-line'
        });
        svgElement.appendChild(winLine);
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
