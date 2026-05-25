import { render as renderLogin } from './views/login.js';
import { render as renderUsers } from './views/users.js';
import { render as renderCategories } from './views/categories.js';
import { render as renderProducts } from './views/products.js';
import { render as renderStorefront } from './views/storefront.js';
import { render as renderCart } from './views/cart.js';
import { render as renderCheckout } from './views/checkout.js';
import { render as renderOrders } from './views/orders.js';
import { render as renderProductDetails } from './views/productDetails.js';

const appContainer = document.querySelector('#app');

// Render the initial login view on application startup
renderLogin(appContainer);

// Global event listener for successful user authentication
document.addEventListener('authSuccess', (e) => {
  const user = e.detail;
  console.log('User logged in successfully:', user);

  if (user.role === 'admin') {
    // Set up the admin panel layout with navigation buttons
    appContainer.innerHTML = `
            <div style="font-family: sans-serif; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 10px 20px; display: flex; gap: 20px; align-items: center;">
                <strong>Admin Panel:</strong>
                <button id="nav-users-btn" style="padding: 5px 10px; cursor: pointer;">Manage Users</button>
                <button id="nav-categories-btn" style="padding: 5px 10px; cursor: pointer;">Manage Categories</button>
                <button id="nav-products-btn" style="padding: 5px 10px; cursor: pointer;">Manage Products</button>
                <span style="margin-left: auto; color: #6c757d;">Logged as: ${user.email}</span>
            </div>
            <div id="admin-content-container"></div>
        `;

    const contentContainer = document.getElementById('admin-content-container');

    // Attach click event listeners for view switching within the admin panel
    document.getElementById('nav-users-btn').addEventListener('click', () => renderUsers(contentContainer));
    document.getElementById('nav-categories-btn').addEventListener('click', () => renderCategories(contentContainer));
    document.getElementById('nav-products-btn').addEventListener('click', () => renderProducts(contentContainer));

    // Load the default admin view on initial login redirection
    renderUsers(contentContainer);
  } else {
    // Set up the customer interface layout with shop, cart and orders navigation
    appContainer.innerHTML = `
            <div style="font-family: sans-serif; background-color: #e3f2fd; border-bottom: 1px solid #bbdefb; padding: 10px 20px; display: flex; gap: 20px; align-items: center;">
                <strong>Customer Panel:</strong>
                <button id="nav-shop-btn" style="padding: 5px 10px; cursor: pointer;">Browse Shop</button>
                <button id="nav-cart-btn" style="padding: 5px 10px; cursor: pointer;">My Cart</button>
                <button id="nav-orders-btn" style="padding: 5px 10px; cursor: pointer;">My Orders</button>
                <span style="margin-left: auto; color: #455a64;">Logged as: ${user.email}</span>
            </div>
            <div id="customer-content-container"></div>
        `;

    const contentContainer = document.getElementById('customer-content-container');

    // Attach click event listeners for view switching within the customer panel
    document.getElementById('nav-shop-btn').addEventListener('click', () => renderStorefront(contentContainer));
    document.getElementById('nav-cart-btn').addEventListener('click', () => renderCart(contentContainer));
    document.getElementById('nav-orders-btn').addEventListener('click', () => renderOrders(contentContainer));

    // Global event listener to open specific product details view
    document.addEventListener('productDetailsRequested', (event) => {
      renderProductDetails(contentContainer, event.detail.productId);
    });

    // Global event listener to return back to standard store view catalog
    document.addEventListener('backToStoreRequested', () => {
      renderStorefront(contentContainer);
    });

    // Global event interceptor to route the user directly to checkout view from the cart screen
    document.addEventListener('checkoutRequested', () => {
      renderCheckout(contentContainer);
    });

    // Load the default shop view on initial login redirection
    renderStorefront(contentContainer);
  }
});