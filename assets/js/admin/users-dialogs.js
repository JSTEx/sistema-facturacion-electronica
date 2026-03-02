async function openEditDialog(index) {
    const users = await loadUsers();
    const target = users[index];
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const { value: formValues } = await Swal.fire({
        title: `Editar ${target.email}`,
        html:
            `<div class="edit-user-form">` +
            `<p class="edit-user-note">Las contraseñas se gestionan mediante Firebase Authentication. Los usuarios pueden cambiarlas desde su perfil.</p>` +
            `<div class="edit-user-group">` +
            `<label class="edit-user-field-label">Rol del usuario</label>` +
            `<select id="swal-role" class="edit-user-select"><option value="user">Usuario</option><option value="admin">Administrador</option></select>` +
            `</div>` +
            `<div class="edit-user-group is-tight">` +
            `<label class="edit-user-field-label">Descripción</label>` +
            `<textarea id="swal-description" class="edit-user-textarea" placeholder="Agrega notas sobre este usuario (proyectos, empresa, contacto, etc.)"></textarea>` +
            `</div>` +
            `</div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'edit-user-popup',
            title: 'edit-user-title',
            htmlContainer: 'edit-user-html',
            confirmButton: 'edit-user-confirm',
            cancelButton: 'edit-user-cancel',
            actions: 'edit-user-actions'
        },
        didOpen: () => {
            const roleSelect = document.getElementById('swal-role');
            if (roleSelect) roleSelect.value = target.role;
            const descField = document.getElementById('swal-description');
            if (descField) descField.value = target.description || '';
        },
        preConfirm: () => {
            return {
                newRole: document.getElementById('swal-role').value,
                newDescription: (document.getElementById('swal-description')?.value || '').trim()
            };
        }
    });

    if (formValues) {
        if (current && current.email && current.email.toLowerCase() === target.email.toLowerCase() && formValues.newRole !== 'admin') {
            Swal.fire({ icon: 'error', title: 'Acción no permitida', text: 'No puedes despromover tu propia cuenta.' });
            return;
        }

        target.role = formValues.newRole;
        target.description = formValues.newDescription;
        await saveUsers(users);
        await logAction('edit', target.email);
        showToast('Usuario actualizado', 'success', 1200);
        await render();
    }
}

