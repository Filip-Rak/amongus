import { fetchWithAuth } from '../api.js';

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2>My Profile & Account Settings</h2>
            <div id="profile-message" style="margin-bottom: 15px; font-weight: bold;"></div>
            
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; color: #495057;">Account Information</h4>
                <p style="margin: 4px 0; font-size: 14px;"><b>Current Email:</b> <span id="info-email">Loading...</span></p>
                <p style="margin: 4px 0; font-size: 14px;"><b>Account Role:</b> <span id="info-role" style="text-transform: uppercase; font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 3px;">Loading...</span></p>
                <p style="margin: 4px 0; font-size: 14px;"><b>Member Since:</b> <span id="info-created">Loading...</span></p>
            </div>

            <form id="profile-form" style="border: 1px solid #dee2e6; padding: 20px; border-radius: 6px; background-color: #fff;">
                <h3 style="margin-top: 0; color: #333; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Update Credentials</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 14px; font-weight: bold;">New Email Address (Optional):</label><br>
                    <input type="email" id="profile-new-email" style="width: 100%; padding: 6px; box-sizing: border-box; margin-top: 4px;">
                    <small style="color: #6c757d;">Leave blank if you do not want to modify your email address.</small>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="font-size: 14px; font-weight: bold;">New Password (Optional):</label><br>
                    <input type="password" id="profile-new-password" style="width: 100%; padding: 6px; box-sizing: border-box; margin-top: 4px;">
                    <small style="color: #6c757d;">Minimum 6 characters. Leave blank to keep current password.</small>
                </div>

                <div style="margin-bottom: 20px; padding-top: 10px; border-top: 1px dashed #eee;">
                    <label style="font-size: 14px; font-weight: bold; color: #dc3545;">Current Password *</label><br>
                    <input type="password" id="profile-current-password" required style="width: 100%; padding: 6px; box-sizing: border-box; margin-top: 4px; border: 1px solid #dc3545; border-radius: 4px;">
                    <small style="color: #dc3545;">Required to authorize any credential alterations.</small>
                </div>

                <button type="submit" id="save-profile-btn" style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                    Save Changes
                </button>
            </form>
        </div>
    `;

    container.querySelector('#profile-form').addEventListener('submit', handleProfileUpdate);
    await loadUserProfile();
}

async function loadUserProfile() {
    try {
        const response = await fetchWithAuth('/users/me');
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to retrieve profile data');

        document.getElementById('info-email').textContent = data.email;
        document.getElementById('info-created').textContent = new Date(data.createdAt).toLocaleString();

        const roleSpan = document.getElementById('info-role');
        roleSpan.textContent = data.role;
        roleSpan.style.backgroundColor = data.role === 'admin' ? '#f8d7da' : '#d1ecf1';
        roleSpan.style.color = data.role === 'admin' ? '#721c24' : '#0c5460';

    } catch (error) {
        document.getElementById('profile-message').innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('profile-message');
    const submitBtn = document.getElementById('save-profile-btn');

    const newEmail = document.getElementById('profile-new-email').value.trim();
    const newPassword = document.getElementById('profile-new-password').value.trim();
    const currentPassword = document.getElementById('profile-current-password').value.trim();

    // Enforce business rule: at least one field must be provided for update
    if (newEmail === '' && newPassword === '') {
        messageDiv.innerHTML = '<span style="color: red;">Error: Provide a new email or a new password to perform an update.</span>';
        return;
    }

    submitBtn.disabled = true;
    messageDiv.innerHTML = '<span style="color: #666;">Updating account...</span>';

    // Construct request body snapshot according to DTO definitions
    const payload = { currentPassword };
    if (newEmail !== '') payload.email = newEmail;
    if (newPassword !== '') payload.password = newPassword;

    try {
        const response = await fetchWithAuth('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Update rejected');
            throw new Error(errorMsg);
        }

        messageDiv.innerHTML = '<span style="color: green;">Profile updated successfully.</span>';

        // Clear input form fields securely
        document.getElementById('profile-new-email').value = '';
        document.getElementById('profile-new-password').value = '';
        document.getElementById('profile-current-password').value = '';

        // Refresh upper read-only values view layout
        await loadUserProfile();

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
    }
}