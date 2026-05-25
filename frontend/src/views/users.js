import { fetchWithAuth } from '../api.js';

let usersData = [];

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Users Management (Admin Panel)</h2>
                <button id="add-user-btn" style="padding: 10px 15px; background-color: #28a745; color: white; border: none; cursor: pointer;">Add New User</button>
            </div>
            
            <div id="users-message" style="margin-bottom: 10px; font-weight: bold;"></div>
            
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; text-align: left; background-color: #fff;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="users-tbody">
                    <tr><td colspan="4">Loading users data...</td></tr>
                </tbody>
            </table>

            <div id="user-form-container" style="display: none; margin-top: 30px; border: 1px solid #ccc; padding: 20px; max-width: 400px; background-color: #fff;">
                <h3 id="form-title">Add New User</h3>
                <form id="user-form">
                    <input type="hidden" id="user-id">
                    
                    <div style="margin-bottom: 15px;">
                        <label>Email:</label><br>
                        <input type="email" id="user-email" required style="width: 100%; padding: 5px; box-sizing: border-box;">
                    </div>
                    
                    <div style="margin-bottom: 15px;" id="password-group">
                        <label>Password:</label><br>
                        <input type="password" id="user-password" style="width: 100%; padding: 5px; box-sizing: border-box;">
                        <small style="color: #666;" id="password-hint">Required for new users.</small>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Role:</label><br>
                        <select id="user-role" required style="width: 100%; padding: 5px;">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;" id="status-group">
                        <label>Status:</label><br>
                        <select id="user-status" style="width: 100%; padding: 5px;">
                            <option value="active">Active</option>
                            <option value="deleted">Deleted</option>
                        </select>
                    </div>
                    
                    <button type="submit" id="save-user-btn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; cursor: pointer;">Save</button>
                    <button type="button" id="cancel-user-btn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; cursor: pointer; margin-left: 5px;">Cancel</button>
                </form>
            </div>
        </div>
    `;

    attachEventListeners(container);
    await loadUsers();
}

function attachEventListeners(container) {
    container.querySelector('#add-user-btn').addEventListener('click', showAddForm);
    container.querySelector('#cancel-user-btn').addEventListener('click', hideForm);
    container.querySelector('#user-form').addEventListener('submit', handleFormSubmit);

    container.querySelector('#users-tbody').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('edit-btn')) {
            showEditForm(id);
        } else if (e.target.classList.contains('delete-btn')) {
            deleteUser(id);
        }
    });
}

async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    const messageDiv = document.getElementById('users-message');

    try {
        const response = await fetchWithAuth('/users');
        const responseData = await response.json();

        if (!response.ok) {
            const errorMsg = Array.isArray(responseData.message)
                ? responseData.message.join(', ')
                : (responseData.message || 'Failed to fetch users');
            throw new Error(errorMsg);
        }

        if (responseData && Array.isArray(responseData.items)) {
            usersData = responseData.items;
        } else {
            throw new Error('Unexpected data format received from server');
        }

        renderTable();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        tbody.innerHTML = `<tr><td colspan="4">No data available.</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('users-tbody');

    if (usersData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = usersData.map(user => `
        <tr>
            <td>${user.email}</td>
            <td><span style="padding: 3px 6px; background-color: ${user.role === 'admin' ? '#f8d7da' : '#d1ecf1'}">${user.role}</span></td>
            <td><span style="padding: 3px 6px; background-color: ${user.status === 'active' ? '#d4edda' : '#f8d7da'}">${user.status || 'active'}</span></td>
            <td>
                <button class="edit-btn" data-id="${user.id}">Edit</button>
                <button class="delete-btn" data-id="${user.id}" style="color: red;">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddForm() {
    document.getElementById('form-title').innerText = 'Add New User';
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';

    document.getElementById('user-password').required = true;
    document.getElementById('password-hint').innerText = 'Required for new users.';

    // Hide status selection for new users as backend repository assigns it automatically
    document.getElementById('status-group').style.display = 'none';
    document.getElementById('user-form-container').style.display = 'block';
}

function showEditForm(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) return;

    document.getElementById('form-title').innerText = 'Edit User';
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;

    // Password is now optional during edit process
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('password-hint').innerText = 'Leave blank to keep current password.';

    // Show status selection during modification
    document.getElementById('status-group').style.display = 'block';
    document.getElementById('user-status').value = user.status || 'active';

    document.getElementById('user-form-container').style.display = 'block';
}

function hideForm() {
    document.getElementById('user-form-container').style.display = 'none';
    document.getElementById('user-form').reset();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('users-message');
    const submitBtn = document.getElementById('save-user-btn');

    const id = document.getElementById('user-id').value;
    const email = document.getElementById('user-email').value;
    const role = document.getElementById('user-role').value;
    const password = document.getElementById('user-password').value.trim();

    const isEditing = id !== '';
    submitBtn.disabled = true;

    try {
        let response;
        if (isEditing) {
            const status = document.getElementById('user-status').value;
            const payload = { email, role, status };

            // Only attach password field if administrator filled the text input
            if (password !== '') {
                payload.password = password;
            }

            response = await fetchWithAuth(`/users/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } else {
            const payload = { email, password, role };

            response = await fetchWithAuth('/users', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        if (!response.ok) {
            const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Failed to save user');
            throw new Error(errorMsg);
        }

        messageDiv.innerHTML = `<span style="color: green;">User successfully saved.</span>`;
        hideForm();
        await loadUsers();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const messageDiv = document.getElementById('users-message');

    try {
        const response = await fetchWithAuth(`/users/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to delete user');
        }

        messageDiv.innerHTML = `<span style="color: green;">User soft-deleted successfully.</span>`;
        await loadUsers();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}