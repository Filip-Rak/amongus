import { fetchWithAuth, setToken } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <div style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; background-color: #fff; font-family: sans-serif;">
            <h2>Store Login</h2>
            
            <div id="login-message" style="margin-bottom: 15px; font-weight: bold;"></div>
            
            <form id="login-form">
                <div style="margin-bottom: 15px;">
                    <label for="login-email">Email:</label><br>
                    <input type="email" id="login-email" required style="width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label for="login-password">Password:</label><br>
                    <input type="password" id="login-password" required style="width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box;">
                </div>
                
                <button type="submit" id="login-submit-btn" style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; cursor: pointer; font-size: 16px;">
                    Sign In
                </button>
            </form>
        </div>
    `;

    attachEventListeners(container);
}

function attachEventListeners(container) {
    container.querySelector('#login-form').addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('login-message');
    const submitBtn = document.getElementById('login-submit-btn');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    submitBtn.disabled = true;
    messageDiv.innerHTML = '';

    try {
        // Direct call to login endpoint using basic fetch
        const response = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Invalid email or password');
        }

        // Save token to localStorage using api.js helper
        setToken(data.accessToken);

        messageDiv.innerHTML = '<span style="color: green;">Login successful. Fetching profile...</span>';

        // Fetch user info to verify role (admin vs user)
        const profileResponse = await fetchWithAuth('/auth/me');
        if (!profileResponse.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const userData = await profileResponse.json();

        // Dispatch custom event to notify main application router about successful authentication
        const authEvent = new CustomEvent('authSuccess', { detail: userData });
        document.dispatchEvent(authEvent);

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        submitBtn.disabled = false;
    }
}