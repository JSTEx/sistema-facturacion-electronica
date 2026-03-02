async function logAction(action, target) {
    const admin = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const audits = await getFirebaseData('adminAudit') || [];
    audits.push({ time: new Date().toISOString(), admin: admin ? admin.email : null, action, target });
    await setFirebaseData('adminAudit', audits);
}

function pickFirstString(candidates, keys) {
    for (const source of candidates) {
        if (!source || typeof source !== 'object') continue;
        for (const key of keys) {
            const value = source[key];
            if (value === null || value === undefined) continue;
            const parsed = String(value).trim();
            if (parsed) return parsed;
        }
    }
    return '';
}

function inferRoleFromCandidates(candidates) {
    const explicit = pickFirstString(candidates, ['role', 'rol', 'userRole']).toLowerCase();
    if (explicit) return explicit;

    const hasAdminFlag = candidates.some((source) =>
        source && typeof source === 'object' && (source.isAdmin === true || source.admin === true)
    );

    return hasAdminFlag ? 'admin' : 'user';
}

function normalizeSingleUser(record) {
    if (!record) return null;

    if (typeof record === 'string') {
        const email = record.trim();
        if (!email) return null;
        return { email, role: 'user' };
    }

    if (typeof record !== 'object') return null;

    const nestedCandidates = [
        record,
        record.profile,
        record.user,
        record.data,
        record.info,
        record.usuario
    ].filter(Boolean);

    const email = pickFirstString(nestedCandidates, ['email', 'userEmail', 'mail', 'correo']);
    if (!email) return null;

    const role = inferRoleFromCandidates(nestedCandidates);
    const uid = pickFirstString(nestedCandidates, ['uid', 'id', 'userId']);

    return {
        ...record,
        email,
        role,
        uid
    };
}

async function readUsersFromKnownPaths() {
    const paths = ['users', 'usuarios', 'Usuarios', 'Users'];

    for (const path of paths) {
        const fromWrapper = await getFirebaseData(path);
        if (fromWrapper && (Array.isArray(fromWrapper) || typeof fromWrapper === 'object')) {
            return fromWrapper;
        }
    }

    if (window.firebaseGet && window.firebaseRef && window.firebaseDB) {
        for (const path of paths) {
            try {
                const snapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, path));
                if (snapshot.exists()) {
                    const value = snapshot.val();
                    if (value && (Array.isArray(value) || typeof value === 'object')) {
                        return value;
                    }
                }
            } catch (error) {
                console.error(`Fallback read ${path} error:`, error);
            }
        }
    }

    return null;
}

async function loadUsers() {
    const rawUsers = await readUsersFromKnownPaths();
    const users = normalizeUsers(rawUsers)
        .map((record) => normalizeSingleUser(record))
        .filter(Boolean);

    const dedupedByEmail = new Map();
    users.forEach((user) => {
        dedupedByEmail.set(String(user.email).toLowerCase(), user);
    });

    return Array.from(dedupedByEmail.values());
}

async function saveUsers(list) {
    await setFirebaseData('users', list);
}

function countAdmins(list) {
    return list.filter(u => String(u?.role || '').toLowerCase() === 'admin').length;
}

window.adminData = {
    logAction,
    loadUsers,
    saveUsers,
    countAdmins
};
