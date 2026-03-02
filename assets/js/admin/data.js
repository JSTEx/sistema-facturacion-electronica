async function logAction(action, target) {
    const admin = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const audits = await getFirebaseData('adminAudit') || [];
    audits.push({ time: new Date().toISOString(), admin: admin ? admin.email : null, action, target });
    await setFirebaseData('adminAudit', audits);
}

async function loadUsers() {
    return normalizeUsers(await getFirebaseData('users'));
}

async function saveUsers(list) {
    await setFirebaseData('users', list);
}

function countAdmins(list) {
    return list.filter(u => u.role === 'admin').length;
}

window.adminData = {
    logAction,
    loadUsers,
    saveUsers,
    countAdmins
};
