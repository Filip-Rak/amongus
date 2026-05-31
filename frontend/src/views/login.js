import { fetchWithAuth } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 id="auth-title">Welcome to Online Shop</h2>
            <div id="auth-message" style="margin-bottom: 15px; font-weight: bold; font-size: 14px;"></div>
            <form id="auth-form">
                <div style="margin-bottom: 12px;">
                    <label>Email Address:</label><br>
                    <input type="email" id="auth-email" required style="width: 100%; padding: 6px; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label>Password:</label><br>
                    <input type="password" id="auth-password" required style="width: 100%; padding: 6px; box-sizing: border-box;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button type="button" id="login-btn" style="flex: 1; padding: 10px; background-color: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">
                        Login
                    </button>
                    <button type="button" id="register-btn" style="flex: 1; padding: 10px; background-color: #28a745; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">
                        Register
                    </button>
                </div>
            </form>
        </div>
    `;

    const emailInput = container.querySelector('#auth-email');
    const passwordInput = container.querySelector('#auth-password');
    const messageDiv = container.querySelector('#auth-message');
    const loginBtn = container.querySelector('#login-btn');
    const registerBtn = container.querySelector('#register-btn');

    // Bind event listeners for both separate authentication actions
    loginBtn.addEventListener('click', () => {
        handleAuth('/auth/login', emailInput.value, passwordInput.value, messageDiv, [loginBtn, registerBtn]);
    });

    registerBtn.addEventListener('click', () => {
        handleAuth('/auth/register', emailInput.value, passwordInput.value, messageDiv, [loginBtn, registerBtn]);
    });
}

async function handleAuth(endpoint, email, password, messageDiv, buttons) {
    const targetEmail = email.trim();
    const targetPassword = password.trim();

    if (!targetEmail || !targetPassword) {
        messageDiv.innerHTML = '<span style="color: red;">Please enter both email and password fields.</span>';
        return;
    }

    // Freeze interface during networking operations
    buttons.forEach(btn => btn.disabled = true);
    messageDiv.innerHTML = '<span style="color: #666;">Processing request...</span>';

    try {
        const response = await fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify({ email: targetEmail, password: targetPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle NestJS DTO class-validator array messages or direct string responses
            const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Authentication failed');
            throw new Error(errorMsg);
        }

        // Persist token in local storage matching configuration expectations
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
        }

        messageDiv.innerHTML = '<span style="color: green;">Success! Initializing interface...</span>';

        // Dispatch global authSuccess event handled inside main.js
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('authSuccess', { detail: data.user }));
        }, 1000);

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        buttons.forEach(btn => btn.disabled = false);
    }
}