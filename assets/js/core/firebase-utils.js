function normalizeUsers(rawUsers) {
    if (Array.isArray(rawUsers)) return rawUsers.filter(Boolean);
    if (rawUsers && typeof rawUsers === 'object') return Object.values(rawUsers);
    return [];
}

async function getFirebaseData(path) {
    try {
        const dbRef = window.firebaseRef(window.firebaseDB);
        const snapshot = await window.firebaseGet(window.firebaseChild(dbRef, path));
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Error reading from Firebase:', error);
        return null;
    }
}

async function setFirebaseData(path, data) {
    try {
        await window.firebaseSet(window.firebaseRef(window.firebaseDB, path), data);
        return true;
    } catch (error) {
        console.error('Error writing to Firebase:', error);
        return false;
    }
}

async function waitForFirebaseReady(options = {}) {
    const maxAttempts = Number(options.maxAttempts) || 100;
    const intervalMs = Number(options.intervalMs) || 30;
    const required = Array.isArray(options.required) ? options.required : [
        'firebaseAuth',
        'firebaseAuthStateChanged',
        'firebaseDB'
    ];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const ready = required.every((key) => !!window[key]);
        if (ready) return true;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return false;
}

window.normalizeUsers = normalizeUsers;
window.getFirebaseData = getFirebaseData;
window.setFirebaseData = setFirebaseData;
window.waitForFirebaseReady = waitForFirebaseReady;
