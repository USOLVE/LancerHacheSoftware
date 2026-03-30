// ========================================
// SESSION - Gestion des sessions de jeu
// ========================================
// Session: { duration (minutes or null=unlimited), startTime, timerVisible, playerIds[] }
// localStorage key: lh_active_session

const SESSION_KEY = 'lh_active_session';

/**
 * Démarre une nouvelle session
 * @param {object} param0
 * @param {number|null} param0.duration - Durée en minutes, null = illimitée
 * @param {boolean} param0.timerVisible - Afficher le chrono
 * @param {string[]} param0.playerIds - Identifiants des joueurs participants
 */
export function startSession({ duration, timerVisible, playerIds }) {
    const session = {
        duration: duration || null,
        startTime: Date.now(),
        timerVisible: timerVisible !== false,
        playerIds: playerIds || []
    };
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
        console.error('Erreur démarrage session:', e);
    }
    return session;
}

/**
 * Charge la session active depuis le localStorage
 * @returns {object|null}
 */
export function loadSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Erreur chargement session:', e);
        return null;
    }
}

/**
 * Termine la session active
 */
export function endSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error('Erreur fin de session:', e);
    }
}

/**
 * Vérifie si une session est active et non expirée
 * @returns {boolean}
 */
export function isSessionActive() {
    const session = loadSession();
    if (!session) return false;
    if (session.duration === null) return true; // illimitée
    const elapsed = Date.now() - session.startTime;
    const durationMs = session.duration * 60 * 1000;
    return elapsed < durationMs;
}

/**
 * Retourne le temps restant en millisecondes, ou null si illimité
 * @returns {number|null}
 */
export function getTimeRemaining() {
    const session = loadSession();
    if (!session) return null;
    if (session.duration === null) return null;
    const elapsed = Date.now() - session.startTime;
    const durationMs = session.duration * 60 * 1000;
    return Math.max(0, durationMs - elapsed);
}

/**
 * Formate un nombre de millisecondes en "MM:SS"
 * @param {number} ms
 * @returns {string} e.g. "29:55"
 */
export function formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
