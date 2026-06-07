import { fetchWithAuth } from '../api.js';

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
            <h2>My Profile & Account Settings</h2>
            <div id="profile-message" style="margin-bottom: 15px; font-weight: bold;"></div>
            
            <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 320px;">
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

                <div style="flex: 1; min-width: 320px; border: 1px solid #dee2e6; padding: 20px; border-radius: 6px; background-color: #fff; height: fit-content;">
                    <h3 style="margin-top: 0; color: #333; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">My Product Reviews</h3>
                    <div id="profile-reviews-list" style="max-height: 520px; overflow-y: auto; padding-right: 5px;">
                        <p style="color: #666; font-size: 14px;">Loading reviews history stream...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#profile-form').addEventListener('submit', handleProfileUpdate);

    // Execute both data population routines in parallel stream loops
    await Promise.all([loadUserProfile(), loadMyReviews()]);

    container.querySelector('#profile-form').addEventListener('submit', handleProfileUpdate);

    // Intercept clicks on dynamically rendered view product buttons inside reviews feed
    container.querySelector('#profile-reviews-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('view-product-btn')) {
            const productId = e.target.dataset.productId;
            document.dispatchEvent(new CustomEvent('productDetailsRequested', { detail: { productId } }));
        }
    });

    // Execute both data population routines in parallel stream loops
    await Promise.all([loadUserProfile(), loadMyReviews()]);
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

async function loadMyReviews() {
    const listDiv = document.getElementById('profile-reviews-list');
    if (!listDiv) return;

    try {
        // Fetch active reviews authored by current token identity (Section 11.5)
        const response = await fetchWithAuth('/reviews/my?limit=100');
        const data = await response.json();

        const reviews = Array.isArray(data) ? data : (data.items || []);

        if (reviews.length === 0) {
            listDiv.innerHTML = '<p style="color: #999; font-size: 14px; margin: 10px 0;">You have not written any reviews yet.</p>';
            return;
        }

        listDiv.innerHTML = reviews.map(rev => {
            const dateStr = new Date(rev.createdAt).toLocaleDateString();
            return `
                <div style="padding: 12px 0; border-bottom: 1px solid #f1f3f5; font-size: 14px;">
                    <div style="margin-bottom: 4px;">
                        <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #17a2b8; background: #eef9fa; padding: 2px 6px; border-radius: 3px;">
                            ${rev.productName || 'Unknown Product'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; margin-top: 6px;">
                        <span style="font-weight: bold; color: #333;">${rev.title || 'Untitled'}</span>
                        <span style="color: #ffc107; font-family: monospace;">${'★'.repeat(rev.rating)}</span>
                    </div>
                    <p style="margin: 0; color: #555; font-size: 13px; line-height: 1.4; font-style: italic;">"${rev.comment || ''}"</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                        <button class="view-product-btn" data-product-id="${rev.productId}" style="padding: 3px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                            View Product
                        </button>
                        <small style="color: #b2bec3;">Posted on: ${dateStr}</small>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        listDiv.innerHTML = `<p style="color: red; font-size: 14px;">Error loading reviews: ${error.message}</p>`;
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('profile-message');
    const submitBtn = document.getElementById('save-profile-btn');

    const newEmail = document.getElementById('profile-new-email').value.trim();
    const newPassword = document.getElementById('profile-new-password').value.trim();
    const currentPassword = document.getElementById('profile-current-password').value.trim();

    if (newEmail === '' && newPassword === '') {
        messageDiv.innerHTML = '<span style="color: red;">Error: Provide a new email or a new password to perform an update.</span>';
        return;
    }

    submitBtn.disabled = true;
    messageDiv.innerHTML = '<span style="color: #666;">Updating account...</span>';

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

        document.getElementById('profile-new-email').value = '';
        document.getElementById('profile-new-password').value = '';
        document.getElementById('profile-current-password').value = '';

        await loadUserProfile();

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
    }
}