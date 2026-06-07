import { fetchWithAuth } from '../api.js';

let productsData = [];
let categoryTree = [];

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
                <h2>Products Catalog</h2>
                <div id="storefront-cart-status" style="font-weight: bold; color: #007bff;">
                    Cart: Loading...
                </div>
            </header>

            <div style="margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
                <label for="storefront-category-filter" style="font-weight: bold; color: #333;">Category Filter:</label>
                <select id="storefront-category-filter" style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc; background-color: #fff; font-size: 14px; cursor: pointer;">
                    <option value="all">All Categories</option>
                </select>
            </div>

            <div id="storefront-message" style="margin-bottom: 15px; font-weight: bold;"></div>

            <div id="products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                <p>Loading products...</p>
            </div>
        </div>
    `;

    attachEventListeners(container);
    // Fetch multi-level category tree and active public products in parallel
    await Promise.all([loadCategoryTree(), loadPublicProducts('all'), updateCartCounter()]);
    populateCategoryDropdown();
}

function attachEventListeners(container) {
    const grid = container.querySelector('#products-grid');

    grid.addEventListener('click', (e) => {
        if (e.target.classList.contains('product-title-link')) {
            const id = e.target.dataset.id;
            document.dispatchEvent(new CustomEvent('productDetailsRequested', { detail: { productId: id } }));
            return;
        }

        if (e.target.classList.contains('add-to-cart-btn')) {
            const id = e.target.dataset.id;
            handleAddToCart(id, e.target);
        }
    });

    // Trigger api refetch on dropdown change event loop
    container.querySelector('#storefront-category-filter').addEventListener('change', async (e) => {
        const categoryId = e.target.value;
        await loadPublicProducts(categoryId);
    });
}

async function loadCategoryTree() {
    try {
        const response = await fetchWithAuth('/categories/tree');
        if (response.ok) {
            categoryTree = await response.json();
        }
    } catch (error) {
        console.error('Failed to load hierarchical category tree', error);
    }
}

function populateCategoryDropdown() {
    const select = document.getElementById('storefront-category-filter');
    if (!select) return;

    // Recursive helper to flatten category tree into select options with indents
    function appendCategoryOptions(nodes, depth = 0) {
        nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.innerHTML = '— '.repeat(depth) + node.name;
            select.appendChild(option);

            if (node.children && node.children.length > 0) {
                appendCategoryOptions(node.children, depth + 1);
            }
        });
    }

    appendCategoryOptions(categoryTree);
}

async function loadPublicProducts(categoryId) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<p>Loading products...</p>';

    try {
        let url = '/products?limit=100';
        // Append nested query options to pull items from children branches too
        if (categoryId && categoryId !== 'all') {
            url += `&categoryId=${categoryId}&includeSubcategories=true`;
        }

        const response = await fetchWithAuth(url);
        const responseData = await response.json();

        if (!response.ok) throw new Error(responseData.message || 'Failed to fetch products');

        productsData = Array.isArray(responseData.items) ? responseData.items : [];
        renderProductsGrid();
    } catch (error) {
        document.getElementById('storefront-message').innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        grid.innerHTML = '<p>No products available.</p>';
    }
}

function renderProductsGrid() {
    const grid = document.getElementById('products-grid');

    if (productsData.length === 0) {
        grid.innerHTML = '<p>No products found matching the criteria.</p>';
        return;
    }

    grid.innerHTML = productsData.map(product => {
        const formattedPrice = product.price ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency}` : 'N/A';

        // Adapt to the optimized product shape 7.1 (single image object instead of images array)
        const primaryImg = product.image;

        const imageHtml = primaryImg && primaryImg.url
            ? `<img src="${primaryImg.url}" alt="${primaryImg.alt || product.name}" class="product-title-link" data-id="${product.id}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 15px; cursor: pointer;">`
            : `<div class="product-title-link" data-id="${product.id}" style="width: 100%; height: 200px; background-color: #e9ecef; border-radius: 4px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: #6c757d; cursor: pointer;">No Image Available</div>`;

        // Stock tracking attributes are omitted in compact DTO mode 7.1, purchase button remains active
        return `
            <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; background-color: #fff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div>
                    ${imageHtml}
                    <h3 class="product-title-link" data-id="${product.id}" style="margin: 0 0 10px 0; font-size: 18px; color: #007bff; cursor: pointer;">${product.name}</h3>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #6c757d; min-height: 40px;">${product.description || ''}</p>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span style="font-size: 18px; font-weight: bold; color: #28a745;">${formattedPrice}</span>
                    </div>
                    <button class="add-to-cart-btn" data-id="${product.id}" 
                        style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function updateCartCounter() {
    const counterDiv = document.getElementById('storefront-cart-status');
    if (!counterDiv) return;
    try {
        const response = await fetchWithAuth('/cart');
        if (!response.ok) throw new Error();
        const cart = await response.json();
        const totalItems = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        counterDiv.textContent = `Cart: ${totalItems} items`;
    } catch (error) {
        counterDiv.textContent = 'Cart: Error';
    }
}

async function handleAddToCart(productId, buttonElement) {
    const messageDiv = document.getElementById('storefront-message');
    buttonElement.disabled = true;
    try {
        const response = await fetchWithAuth('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add item to cart');

        messageDiv.innerHTML = '<span style="color: green;">Product added to cart successfully!</span>';
        await updateCartCounter();
        setTimeout(() => { messageDiv.innerHTML = ''; }, 2000);
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        buttonElement.disabled = false;
    }
}