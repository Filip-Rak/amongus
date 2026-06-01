import { fetchWithAuth } from './api.js';
import { render as renderLogin } from './views/login.js';
import { render as renderUsers } from './views/users.js';
import { render as renderCategories } from './views/categories.js';
import { render as renderProducts } from './views/products.js';
import { render as renderStorefront } from './views/storefront.js';
import { render as renderCart } from './views/cart.js';
import { render as renderCheckout } from './views/checkout.js';
import { render as renderOrders } from './views/orders.js';
import { render as renderProductDetails } from './views/productDetails.js';
import { render as renderProfile } from './views/profile.js';

const appContainer = document.querySelector('#app');

// Shared function to handle rendering after successful authentication
function setupAuthenticatedView(user) {
  if (user.role === 'admin') {
    // Set up the admin panel layout with navigation buttons
    appContainer.innerHTML = `
            <div style="font-family: sans-serif; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 10px 20px; display: flex; gap: 20px; align-items: center;">
                <strong>Admin Panel:</strong>
                <button id="nav-users-btn" style="padding: 5px 10px; cursor: pointer;">Manage Users</button>
                <button id="nav-categories-btn" style="padding: 5px 10px; cursor: pointer;">Manage Categories</button>
                <button id="nav-products-btn" style="padding: 5px 10px; cursor: pointer;">Manage Products</button>
                <span style="margin-left: auto; color: #6c757d; display: flex; align-items: center; gap: 10px;">
                    Logged as: ${user.email}
                    <button id="logout-btn" style="padding: 3px 8px; cursor: pointer; background-color: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: bold;">Log out</button>
                </span>
            </div>
            <div id="admin-content-container"></div>
        `;

    const contentContainer = document.getElementById('admin-content-container');

    // Attach click event listeners for view switching within the admin panel
    document.getElementById('nav-users-btn').addEventListener('click', () => renderUsers(contentContainer));
    document.getElementById('nav-categories-btn').addEventListener('click', () => renderCategories(contentContainer));
    document.getElementById('nav-products-btn').addEventListener('click', () => renderProducts(contentContainer));
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Load the default admin view on initial login redirection
    renderUsers(contentContainer);
  } else {
    // Set up the customer interface layout with shop, cart, orders and profile navigation
    appContainer.innerHTML = `
            <div style="font-family: sans-serif; background-color: #e3f2fd; border-bottom: 1px solid #bbdefb; padding: 10px 20px; display: flex; gap: 20px; align-items: center;">
                <strong>Customer Panel:</strong>
                <button id="nav-shop-btn" style="padding: 5px 10px; cursor: pointer;">Browse Shop</button>
                <button id="nav-cart-btn" style="padding: 5px 10px; cursor: pointer;">My Cart</button>
                <button id="nav-orders-btn" style="padding: 5px 10px; cursor: pointer;">My Orders</button>
                <button id="nav-profile-btn" style="padding: 5px 10px; cursor: pointer;">My Profile</button>
                <span style="margin-left: auto; color: #455a64; display: flex; align-items: center; gap: 10px;">
                    Logged as: ${user.email}
                    <button id="logout-btn" style="padding: 3px 8px; cursor: pointer; background-color: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: bold;">Log out</button>
                </span>
            </div>
            <div id="customer-content-container"></div>
        `;

    const contentContainer = document.getElementById('customer-content-container');

    // Attach click event listeners for view switching within the customer panel
    document.getElementById('nav-shop-btn').addEventListener('click', () => renderStorefront(contentContainer));
    document.getElementById('nav-cart-btn').addEventListener('click', () => renderCart(contentContainer));
    document.getElementById('nav-orders-btn').addEventListener('click', () => renderOrders(contentContainer));
    document.getElementById('nav-profile-btn').addEventListener('click', () => renderProfile(contentContainer));
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Load the default shop view on initial login redirection
    renderStorefront(contentContainer);
  }
}

// Global event listener for successful user authentication
document.addEventListener('authSuccess', (e) => {
  const user = e.detail;
  console.log('User logged in successfully:', user);
  setupAuthenticatedView(user);
});

// Setup global non-recreated side effect event handlers for customer flows
document.addEventListener('productDetailsRequested', (event) => {
  const contentContainer = document.getElementById('customer-content-container');
  if (contentContainer) renderProductDetails(contentContainer, event.detail.productId);
});

document.addEventListener('backToStoreRequested', () => {
  const contentContainer = document.getElementById('customer-content-container');
  if (contentContainer) renderStorefront(contentContainer);
});

document.addEventListener('checkoutRequested', () => {
  const contentContainer = document.getElementById('customer-content-container');
  if (contentContainer) renderCheckout(contentContainer);
});

document.addEventListener('navRequested', (event) => {
  const contentContainer = document.getElementById('customer-content-container');
  if (contentContainer && event.detail.view === 'orders') {
    renderOrders(contentContainer);
  }
});

// Handle token clearing and boundary redirection on logout session exit
function handleLogout() {
  localStorage.removeItem('accessToken');
  appContainer.innerHTML = '';
  renderLogin(appContainer);
}

// Check localStorage session tokens on application initial load sequences
async function initApp() {
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const response = await fetchWithAuth('/auth/me');
      if (response.ok) {
        const identity = await response.json();
        // Map identity sub property back to matching standard system user id schema
        const user = {
          id: identity.sub,
          email: identity.email,
          role: identity.role
        };
        setupAuthenticatedView(user);
        return;
      }
    } catch (error) {
      console.error('Session persistence verification exception occurred:', error);
    }
    // Remove corrupted or expired token records if authentication pipeline fails
    localStorage.removeItem('accessToken');
  }
  renderLogin(appContainer);
}

// Run startup routine
initApp();