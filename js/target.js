// ========================================
// TARGET - Gestion de la cible SVG
// ========================================

import { getZoneFromPosition, getPointsForZone, SCORING_ZONES } from './scoring.js';

// Configuration de la cible
const TARGET_CONFIG = {
    size: 500,
    center: 250,
    mainRadius: 220,
    zones: [
        { id: 'zone1', radius: 0.90, color: '#1a4a7a' },      // Bleu foncé
        { id: 'zone2', radius: 0.65, color: '#cc3333' },      // Rouge
        { id: 'zone3', radius: 0.40, color: '#1a4a7a' },      // Bleu foncé
        { id: 'zone4', radius: 0.20, color: '#cc3333' },      // Rouge
        { id: 'bullseye', radius: 0.08, color: '#000000' }    // Noir
    ],
    killshot: {
        radius: 18,
        y: -185,
        x: 155
    },
    woodColor: '#5D4037',
    ringColor: '#3E2723'
};

let targetSvg = null;
let onZoneClickCallback = null;
let killshotEnabled = false;

// Références aux handlers pour pouvoir les supprimer
let boundClickHandler = null;
let boundTouchHandler = null;

/**
 * Nettoie les écouteurs d'événements de la cible
 */
export function cleanupTarget() {
    if (targetSvg && boundClickHandler) {
        targetSvg.removeEventListener('click', boundClickHandler);
        targetSvg.removeEventListener('touchend', boundTouchHandler);
    }
    boundClickHandler = null;
    boundTouchHandler = null;
    onZoneClickCallback = null;
}

/**
 * Initialise la cible SVG
 */
export function initTarget(svgElement, onZoneClick) {
    // Nettoie les anciens handlers si présents
    cleanupTarget();

    targetSvg = svgElement;
    onZoneClickCallback = onZoneClick;
    drawTarget();
    setupEventListeners();
}

/**
 * Active/désactive les killshots
 */
export function setKillshotEnabled(enabled) {
    killshotEnabled = enabled;
    updateKillshotVisibility();
}

/**
 * Dessine la cible complète
 */
function drawTarget() {
    if (!targetSvg) return;

    const { size, center, mainRadius, zones, killshot, woodColor, ringColor } = TARGET_CONFIG;

    // Efface le contenu existant
    targetSvg.innerHTML = '';

    // Fond en bois
    const background = createSvgElement('rect', {
        x: 0, y: 0, width: size, height: size,
        fill: woodColor,
        rx: 20, ry: 20
    });
    targetSvg.appendChild(background);

    // Texture du bois (lignes)
    for (let i = 0; i < 20; i++) {
        const line = createSvgElement('line', {
            x1: 0, y1: 25 * i, x2: size, y2: 25 * i,
            stroke: ringColor,
            'stroke-width': 1,
            opacity: 0.3
        });
        targetSvg.appendChild(line);
    }

    // Cercle extérieur (cadre)
    const outerRing = createSvgElement('circle', {
        cx: center, cy: center, r: mainRadius + 10,
        fill: 'none',
        stroke: ringColor,
        'stroke-width': 8
    });
    targetSvg.appendChild(outerRing);

    // Dessine les zones de l'extérieur vers l'intérieur
    zones.forEach(zone => {
        const radius = mainRadius * zone.radius;
        const circle = createSvgElement('circle', {
            cx: center, cy: center, r: radius,
            fill: zone.color,
            stroke: '#ffffff',
            'stroke-width': 2,
            class: 'target-zone',
            'data-zone': zone.id
        });
        targetSvg.appendChild(circle);
    });

    // Lignes de division (croix)
    const lineAttrs = {
        stroke: '#ffffff',
        'stroke-width': 2,
        opacity: 0.5
    };

    // Ligne horizontale
    targetSvg.appendChild(createSvgElement('line', {
        x1: center - mainRadius, y1: center,
        x2: center + mainRadius, y2: center,
        ...lineAttrs
    }));

    // Ligne verticale
    targetSvg.appendChild(createSvgElement('line', {
        x1: center, y1: center - mainRadius,
        x2: center, y2: center + mainRadius,
        ...lineAttrs
    }));

    // Killshots (coins supérieurs)
    const killshotLeft = createSvgElement('circle', {
        cx: center - killshot.x, cy: center + killshot.y,
        r: killshot.radius,
        fill: '#00aa00',
        stroke: '#ffffff',
        'stroke-width': 3,
        class: 'target-zone killshot-zone',
        'data-zone': 'killshot',
        opacity: 0.5
    });
    killshotLeft.id = 'killshot-left';
    targetSvg.appendChild(killshotLeft);

    const killshotRight = createSvgElement('circle', {
        cx: center + killshot.x, cy: center + killshot.y,
        r: killshot.radius,
        fill: '#00aa00',
        stroke: '#ffffff',
        'stroke-width': 3,
        class: 'target-zone killshot-zone',
        'data-zone': 'killshot',
        opacity: 0.5
    });
    killshotRight.id = 'killshot-right';
    targetSvg.appendChild(killshotRight);

    // Labels des points (optionnel, pour aide visuelle)
    addPointLabels();
}

/**
 * Ajoute les labels des points sur la cible
 */
function addPointLabels() {
    const { center, mainRadius } = TARGET_CONFIG;

    const labels = [
        { text: '6', x: center, y: center + 5, size: 16 },
        { text: '4', x: center, y: center - mainRadius * 0.14, size: 14 },
        { text: '3', x: center, y: center - mainRadius * 0.30, size: 14 },
        { text: '2', x: center, y: center - mainRadius * 0.52, size: 14 },
        { text: '1', x: center, y: center - mainRadius * 0.77, size: 14 },
        { text: '8', x: center - TARGET_CONFIG.killshot.x, y: center + TARGET_CONFIG.killshot.y + 5, size: 12 },
        { text: '8', x: center + TARGET_CONFIG.killshot.x, y: center + TARGET_CONFIG.killshot.y + 5, size: 12 }
    ];

    labels.forEach(label => {
        const text = createSvgElement('text', {
            x: label.x,
            y: label.y,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            fill: '#ffffff',
            'font-size': label.size,
            'font-weight': 'bold',
            'pointer-events': 'none',
            class: 'point-label'
        });
        text.textContent = label.text;
        targetSvg.appendChild(text);
    });
}

/**
 * Met à jour la visibilité des killshots
 */
function updateKillshotVisibility() {
    const killshots = targetSvg?.querySelectorAll('.killshot-zone');
    killshots?.forEach(ks => {
        ks.style.opacity = killshotEnabled ? '1' : '0.3';
        ks.style.cursor = killshotEnabled ? 'pointer' : 'not-allowed';
    });
}

/**
 * Configure les événements de clic sur la cible
 */
function setupEventListeners() {
    if (!targetSvg) return;

    // Sauvegarde les références pour pouvoir les supprimer plus tard
    boundClickHandler = handleTargetClick;
    boundTouchHandler = handleTargetTouch;

    targetSvg.addEventListener('click', boundClickHandler);
    targetSvg.addEventListener('touchend', boundTouchHandler);
}

/**
 * Gère le clic sur la cible
 */
function handleTargetClick(event) {
    event.preventDefault();
    const coords = getRelativeCoords(event);
    processHit(coords.x, coords.y, event.clientX, event.clientY);
}

/**
 * Gère le touch sur la cible
 */
function handleTargetTouch(event) {
    event.preventDefault();
    if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        const coords = getRelativeCoords(touch);
        processHit(coords.x, coords.y, touch.clientX, touch.clientY);
    }
}

/**
 * Calcule les coordonnées relatives (0-1) à partir de l'événement
 */
function getRelativeCoords(event) {
    const rect = targetSvg.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}

/**
 * Traite un impact sur la cible
 */
function processHit(relX, relY, screenX, screenY) {
    const zone = getZoneFromPosition(relX, relY, killshotEnabled);

    // Si c'est un killshot mais qu'il n'est pas activé, ignore
    if (zone === 'killshot' && !killshotEnabled) {
        return;
    }

    const points = getPointsForZone(zone);

    if (onZoneClickCallback) {
        onZoneClickCallback({
            zone,
            points,
            relativeX: relX,
            relativeY: relY,
            screenX,
            screenY
        });
    }
}

/**
 * Crée un élément SVG avec des attributs
 */
function createSvgElement(tag, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

/**
 * Ajoute un marqueur d'impact visuel
 */
export function addImpactMarker(container, x, y, zone) {
    const marker = document.getElementById('impact-marker');
    if (!marker) return;

    // Positionne le marqueur
    const rect = targetSvg.getBoundingClientRect();
    marker.style.left = `${x * rect.width}px`;
    marker.style.top = `${y * rect.height}px`;

    // Couleur selon la zone
    if (zone === 'killshot') {
        marker.style.background = 'radial-gradient(circle, #ffd700 0%, #ffaa00 70%, transparent 70%)';
    } else if (zone === 'miss') {
        marker.style.background = 'radial-gradient(circle, #666666 0%, #444444 70%, transparent 70%)';
    } else {
        marker.style.background = 'radial-gradient(circle, #ff0000 0%, #cc0000 70%, transparent 70%)';
    }

    // Affiche avec animation
    marker.classList.remove('visible');
    void marker.offsetWidth; // Force reflow
    marker.classList.add('visible');
}

/**
 * Efface tous les marqueurs d'impact
 */
export function clearImpactMarkers() {
    const marker = document.getElementById('impact-marker');
    if (marker) {
        marker.classList.remove('visible');
    }
}

/**
 * Récupère la configuration de la cible
 */
export function getTargetConfig() {
    return TARGET_CONFIG;
}
