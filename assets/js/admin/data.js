async function logAction(action, target) {
    const admin = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const audits = await getFirebaseData('adminAudit') || [];
    audits.push({ time: new Date().toISOString(), admin: admin ? admin.email : null, action, target });
    await setFirebaseData('adminAudit', audits);
}

async function loadUsers() {
    const users = normalizeUsers(await getFirebaseData('users'));
    return users.filter((user) => {
        if (!user || typeof user !== 'object') return false;
        const email = String(user.email || '').trim();
        const role = String(user.role || '').trim();
        return email.length > 0 && role.length > 0;
    });
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
