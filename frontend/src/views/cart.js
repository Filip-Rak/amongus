import { fetchWithAuth } from '../api.js';

let cartData = null;

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Your Shopping Cart</h2>
                <button id="clear-cart-btn" style="padding: 10px 15px; background-color: #dc3545; color: white; border: none; cursor: pointer; display: none;">Clear Cart</button>
            </div>

            <div id="cart-message" style="margin-bottom: 15px; font-weight: bold;"></div>

            <div id="cart-content">
                <p>Loading cart data...</p>
            </div>
        </div>
    `;

    attachEventListeners(container);
    await loadCart();
}

function attachEventListeners(container) {
    container.querySelector('#clear-cart-btn').addEventListener('click', handleClearCart);

    container.querySelector('#cart-content').addEventListener('click', async (e) => {
        const productId = e.target.dataset.productId;
        if (e.target.id === 'checkout-btn') {
            // Wywołujemy globalne zdarzenie przejścia do kasy
            document.dispatchEvent(new CustomEvent('checkoutRequested'));
            return;
        }
        if (!productId) return;

        if (e.target.classList.contains('qty-minus-btn')) {
            const currentQty = parseInt(e.target.dataset.qty, 10);
            if (currentQty > 1) {
                await handleUpdateQuantity(productId, currentQty - 1);
            } else {
                await handleRemoveItem(productId);
            }
        } else if (e.target.classList.contains('qty-plus-btn')) {
            const currentQty = parseInt(e.target.dataset.qty, 10);
            await handleUpdateQuantity(productId, currentQty + 1);
        } else if (e.target.classList.contains('remove-item-btn')) {
            await handleRemoveItem(productId);
        }
    });
}

async function loadCart() {
    const contentDiv = document.getElementById('cart-content');
    const clearBtn = document.getElementById('clear-cart-btn');
    const messageDiv = document.getElementById('cart-message');

    try {
        const response = await fetchWithAuth('/cart');
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to load cart');

        cartData = data;

        if (!cartData.items || cartData.items.length === 0) {
            contentDiv.innerHTML = '<p>Your cart is empty. Start shopping!</p>';
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        renderCartItems();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        contentDiv.innerHTML = '<p>Could not load cart data.</p>';
    }
}

function renderCartItems() {
    const contentDiv = document.getElementById('cart-content');

    let totalCartPriceCents = 0;

    const itemsHtml = cartData.items.map(item => {
        // Handle both populated product objects or fallback if backend structure differs
        const product = item.product || { name: `Product (${item.productId})`, price: { amount: 0, currency: 'PLN' } };
        const unitPriceFloat = product.price ? product.price.amount / 100 : 0;
        const itemTotalFloat = unitPriceFloat * item.quantity;

        totalCartPriceCents += (product.price ? product.price.amount : 0) * item.quantity;

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 10px; background-color: #fff; border-radius: 4px;">
                <div>
                    <h4 style="margin: 0 0 5px 0;">${product.name}</h4>
                    <small style="color: #6c757d;">Unit Price: ${unitPriceFloat.toFixed(2)} PLN</small>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="qty-minus-btn" data-product-id="${item.productId}" data-qty="${item.quantity}" style="padding: 2px 8px; cursor: pointer;">-</button>
                    <span style="font-weight: bold; min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="qty-plus-btn" data-product-id="${item.productId}" data-qty="${item.quantity}" style="padding: 2px 8px; cursor: pointer;">+</button>
                </div>
                <div style="text-align: right; min-width: 120px;">
                    <div style="font-weight: bold; color: #28a745;">${itemTotalFloat.toFixed(2)} PLN</div>
                    <button class="remove-item-btn" data-product-id="${item.productId}" style="color: red; border: none; background: none; cursor: pointer; padding: 5px 0 0 0; font-size: 12px;">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    const totalCartPriceFloat = totalCartPriceCents / 100;

    contentDiv.innerHTML = `
        <div>
            ${itemsHtml}
            <div style="margin-top: 20px; padding: 15px; border-top: 2px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                <h3>Total Order Price:</h3>
                <span style="font-size: 24px; font-weight: bold; color: #28a745;">${totalCartPriceFloat.toFixed(2)} PLN</span>
            </div>
            <button id="checkout-btn" style="width: 100%; padding: 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                Proceed to Checkout
            </button>
        </div>
    `;
}

async function handleUpdateQuantity(productId, newQuantity) {
    try {
        const response = await fetchWithAuth(`/cart/items/${productId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: newQuantity })
        });
        if (!response.ok) throw new Error();
        await loadCart();
    } catch (error) {
        document.getElementById('cart-message').innerHTML = '<span style="color: red;">Failed to update quantity.</span>';
    }
}

async function handleRemoveItem(productId) {
    try {
        const response = await fetchWithAuth(`/cart/items/${productId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error();
        await loadCart();
    } catch (error) {
        document.getElementById('cart-message').innerHTML = '<span style="color: red;">Failed to remove item.</span>';
    }
}

async function handleClearCart() {
    if (!confirm('Are you sure you want to empty your cart?')) return;

    try {
        const response = await fetchWithAuth('/cart', {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error();
        await loadCart();
    } catch (error) {
        document.getElementById('cart-message').innerHTML = '<span style="color: red;">Failed to clear cart.</span>';
    }
}