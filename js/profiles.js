// ========================================
// PROFILES - Gestion des profils joueurs
// ========================================
// Player profile: { id, name, photo (base64 or null), createdAt }
// localStorage key: lh_profiles

const PROFILES_KEY = 'lh_profiles';

/**
 * Charge tous les profils depuis le localStorage
 */
export function loadProfiles() {
    try {
        const raw = localStorage.getItem(PROFILES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erreur chargement profils:', e);
        return [];
    }
}

/**
 * Sauvegarde les profils dans le localStorage
 */
function saveProfiles(profiles) {
    try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error('Erreur sauvegarde profils:', e);
    }
}

/**
 * Ajoute un nouveau profil
 * @param {string} name - Nom du joueur
 * @param {string|null} photo - Photo en base64 ou null
 * @returns {object} Le nouveau profil créé
 */
export function addProfile(name, photo) {
    const profiles = loadProfiles();
    const newProfile = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: name.trim(),
        photo: photo || null,
        createdAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    saveProfiles(profiles);
    return newProfile;
}

/**
 * Met à jour un profil existant
 * @param {string} id - Identifiant du profil
 * @param {object} updates - Champs à mettre à jour
 */
export function updateProfile(id, updates) {
    const profiles = loadProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updates };
        saveProfiles(profiles);
    }
}

/**
 * Supprime un profil
 * @param {string} id - Identifiant du profil à supprimer
 */
export function deleteProfile(id) {
    const profiles = loadProfiles();
    const filtered = profiles.filter(p => p.id !== id);
    saveProfiles(filtered);
}

/**
 * Récupère un profil par son identifiant
 * @param {string} id - Identifiant du profil
 * @returns {object|undefined}
 */
export function getProfile(id) {
    return loadProfiles().find(p => p.id === id);
}

export function clearAllProfiles() {
    saveProfiles([]);
}

/**
 * Redimensionne une photo pour le profil
 * @param {File} file - Fichier image
 * @returns {Promise<string>} Base64 JPEG redimensionné à 200px
 */
export function resizePhoto(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const MAX = 200;
            let w = img.width;
            let h = img.height;

            if (w > h) {
                if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
            } else {
                if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Impossible de charger l\'image'));
        };

        img.src = url;
    });
}
