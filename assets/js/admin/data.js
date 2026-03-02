async function logAction(action, target) {
    const admin = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const rawAudits = await getFirebaseData('adminAudit');
    const audits = Array.isArray(rawAudits)
        ? [...rawAudits]
        : (rawAudits && typeof rawAudits === 'object' ? Object.values(rawAudits).filter(Boolean) : []);
    audits.push({ time: new Date().toISOString(), admin: admin ? admin.email : null, action, target });
    await setFirebaseData('adminAudit', audits);
}

function isLikelyUserRecord(value) {
    if (!value || typeof value !== 'object') return false;
    const hasEmail = ['email', 'userEmail', 'mail', 'correo'].some((key) => {
        const candidate = value[key];
        return candidate !== undefined && candidate !== null && String(candidate).trim() !== '';
    });
    const hasNestedEmail = ['profile', 'user', 'data', 'info', 'usuario'].some((key) => {
        const nested = value[key];
        if (!nested || typeof nested !== 'object') return false;
        return ['email', 'userEmail', 'mail', 'correo'].some((emailKey) => {
            const candidate = nested[emailKey];
            return candidate !== undefined && candidate !== null && String(candidate).trim() !== '';
        });
    });
    return hasEmail || hasNestedEmail;
}

function extractUserRecords(rawUsers, depth = 0) {
    if (depth > 4 || rawUsers === null || rawUsers === undefined) return [];

    if (Array.isArray(rawUsers)) {
        return rawUsers.flatMap((item) => extractUserRecords(item, depth + 1));
    }

    if (typeof rawUsers !== 'object') {
        return [];
    }

    if (isLikelyUserRecord(rawUsers)) {
        return [rawUsers];
    }

    const containerKeys = ['users', 'usuarios', 'Usuarios', 'Users', 'items', 'list', 'data', 'records'];
    const collected = [];

    containerKeys.forEach((key) => {
        if (rawUsers[key] !== undefined) {
            collected.push(...extractUserRecords(rawUsers[key], depth + 1));
        }
    });

    if (collected.length > 0) {
        return collected;
    }

    return Object.values(rawUsers).flatMap((value) => extractUserRecords(value, depth + 1));
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
    let best = { path: null, value: null, count: -1 };

    for (const path of paths) {
        const fromWrapper = await getFirebaseData(path);
        if (fromWrapper && (Array.isArray(fromWrapper) || typeof fromWrapper === 'object')) {
            const count = extractUserRecords(fromWrapper).length;
            if (count > best.count) {
                best = { path, value: fromWrapper, count };
            }
        }
    }

    if (window.firebaseGet && window.firebaseRef && window.firebaseDB) {
        for (const path of paths) {
            try {
                const snapshot = await window.firebaseGet(window.firebaseRef(window.firebaseDB, path));
                if (snapshot.exists()) {
                    const value = snapshot.val();
                    if (value && (Array.isArray(value) || typeof value === 'object')) {
                        const count = extractUserRecords(value).length;
                        if (count > best.count) {
                            best = { path, value, count };
                        }
                    }
                }
            } catch (error) {
                console.error(`Fallback read ${path} error:`, error);
            }
        }
    }

    window.adminUsersPath = best.path || 'users';
    return best.value;
}

async function loadUsers() {
    const rawUsers = await readUsersFromKnownPaths();
    const extracted = extractUserRecords(rawUsers);
    const source = extracted.length > 0 ? extracted : normalizeUsers(rawUsers);
    const users = source
        .map((record) => normalizeSingleUser(record))
        .filter(Boolean);

    const dedupedByEmail = new Map();
    users.forEach((user) => {
        dedupedByEmail.set(String(user.email).toLowerCase(), user);
    });

    return Array.from(dedupedByEmail.values());
}

async function saveUsers(list) {
    const targetPath = window.adminUsersPath || 'users';
    await setFirebaseData(targetPath, list);
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
