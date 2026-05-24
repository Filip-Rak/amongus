const BASE_URL = 'http://localhost:3001';

export function setToken(token) {
    localStorage.setItem('accessToken', token);
}

export function getToken() {
    return localStorage.getItem('accessToken');
}

export function removeToken() {
    localStorage.removeItem('accessToken');
}

export async function fetchWithAuth(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        ...options.headers,
    };

    // Add Content-Type header only if body is present or method modifies data
    if (options.body || ['POST', 'PUT', 'PATCH'].includes(options.method)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
}