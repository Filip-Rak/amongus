import { fetchWithAuth } from '../api.js';

let productsData = [];
let paidProductIds = [];
let categoriesData = [];

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto;">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
                <h2>Products Catalog</h2>
                <div id="storefront-cart-status" style="font-weight: bold; color: #007bff;">
                    Cart: Loading...
                </div>
            </header>

            <!-- Simplest category filter dropdown configuration -->
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

    // Fetch categories alongside products and order histories
    await Promise.all([loadPublicProducts(), loadPaidOrders(), loadPublicCategories(), updateCartCounter()]);

    populateCategoryDropdown();
    renderProductsGrid();
}

function attachEventListeners(container) {
    const grid = container.querySelector('#products-grid');

    // Grid interaction delegation handles
    grid.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('add-to-cart-btn')) {
            handleAddToCart(id, e.target);
        } else if (e.target.classList.contains('toggle-reviews-btn')) {
            handleToggleReviews(id, e.target);
        } else if (e.target.classList.contains('toggle-review-form-btn')) {
            handleToggleReviewForm(id);
        } else if (e.target.classList.contains('submit-review-btn')) {
            e.preventDefault();
            handleSubmitReview(id, e.target);
        }
    });

    // Dropdown change event trigger local re-render
    container.querySelector('#storefront-category-filter').addEventListener('change', () => {
        renderProductsGrid();
    });
}

async function loadPublicCategories() {
    try {
        const response = await fetchWithAuth('/categories');
        const responseData = await response.json();
        if (response.ok) {
            // Handle standard pagination wrapping structure or direct array lists fallback
            categoriesData = responseData.items || responseData || [];
        }
    } catch (error) {
        console.error('Failed to load public categories stream', error);
    }
}

function populateCategoryDropdown() {
    const select = document.getElementById('storefront-category-filter');
    if (!select) return;

    categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

async function loadPaidOrders() {
    try {
        const response = await fetchWithAuth('/orders/my');
        if (!response.ok) return;
        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.items || []);

        const paidOrders = orders.filter(order => order.status === 'paid');
        const ids = [];
        paidOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    if (item.productId) ids.push(item.productId);
                });
            }
        });
        paidProductIds = [...new Set(ids)];
    } catch (error) {
        console.error('Failed to analyze paid user orders history', error);
    }
}

async function loadPublicProducts() {
    try {
        const response = await fetchWithAuth('/products');
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || 'Failed to fetch products');

        if (responseData && Array.isArray(responseData.items)) {
            productsData = responseData.items.filter(p => p.status === 'active');
        } else {
            throw new Error('Unexpected data format received from server');
        }
    } catch (error) {
        document.getElementById('storefront-message').innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}

function renderProductsGrid() {
    const grid = document.getElementById('products-grid');

    // Read the current chosen option state from the filter selector
    const filterSelect = document.getElementById('storefront-category-filter');
    const selectedCategoryId = filterSelect ? filterSelect.value : 'all';

    // Perform filter match validation criteria checks
    let displayProducts = productsData;
    if (selectedCategoryId !== 'all') {
        displayProducts = productsData.filter(product => product.categoryId === selectedCategoryId);
    }

    if (displayProducts.length === 0) {
        grid.innerHTML = '<p>No products found matching the selected category filter.</p>';
        return;
    }

    grid.innerHTML = displayProducts.map(product => {
        const formattedPrice = product.price ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency}` : 'N/A';
        const primaryImg = product.images && product.images.find(img => img.isPrimary);

        const imageHtml = primaryImg && primaryImg.url
            ? `<img src="${primaryImg.url}" alt="${primaryImg.alt || product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 15px;">`
            : `<div style="width: 100%; height: 200px; background-color: #e9ecef; border-radius: 4px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: #6c757d;">No Image Available</div>`;

        const isOutOfStock = product.stock <= 0;
        const hasPurchased = paidProductIds.includes(product.id);

        return `
            <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; background-color: #fff; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div>
                    ${imageHtml}
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">${product.name}</h3>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #6c757d; min-height: 40px;">${product.description || ''}</p>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span style="font-size: 18px; font-weight: bold; color: #28a745;">${formattedPrice}</span>
                        <span style="font-size: 12px; color: ${isOutOfStock ? 'red' : '#6c757d'};">
                            ${isOutOfStock ? 'Out of stock' : `Stock: ${product.stock}`}
                        </span>
                    </div>
                    <button class="add-to-cart-btn" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''} 
                        style="width: 100%; padding: 10px; background-color: ${isOutOfStock ? '#6c757d' : '#007bff'}; color: white; border: none; border-radius: 4px; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'}; font-weight: bold; margin-bottom: 10px;">
                        ${isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                    </button>

                    <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between;">
                        <button class="toggle-reviews-btn" data-id="${product.id}" style="background:none; border:none; color:#007bff; cursor:pointer; padding:0; font-size:13px;">Show Reviews</button>
                        ${hasPurchased ? `<button class="toggle-review-form-btn" data-id="${product.id}" style="background:none; border:none; color:#28a745; cursor:pointer; padding:0; font-size:13px;">Write a Review</button>` : ''}
                    </div>

                    <div id="reviews-list-${product.id}" style="display: none; margin-top: 10px; max-height: 150px; overflow-y: auto; border-top: 1px dashed #eee; padding-top: 5px;"></div>

                    <div id="review-form-${product.id}" style="display: none; margin-top: 10px; padding: 10px; border: 1px dashed #28a745; background-color: #fdfdfd; border-radius: 4px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 13px;">New Review Summary</h4>
                        <input type="text" id="rev-title-${product.id}" placeholder="Title" required style="width:100%; margin-bottom:5px; padding:3px; font-size:12px; box-sizing:border-box;">
                        <select id="rev-rating-${product.id}" style="width:100%; margin-bottom:5px; padding:3px; font-size:12px;">
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                        <textarea id="rev-comment-${product.id}" placeholder="Your comment text..." rows="2" required style="width:100%; margin-bottom:5px; padding:3px; font-size:12px; box-sizing:border-box;"></textarea>
                        <button class="submit-review-btn" data-id="${product.id}" style="width:100%; padding:5px; background-color:#28a745; color:white; border:none; font-size:12px; font-weight:bold; cursor:pointer;">Submit Review</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function handleToggleReviews(productId, buttonElement) {
    const listDiv = document.getElementById(`reviews-list-${productId}`);
    if (listDiv.style.display === 'block') {
        listDiv.style.display = 'none';
        buttonElement.textContent = 'Show Reviews';
        return;
    }

    listDiv.innerHTML = '<p style="font-size:11px; color:#666;">Loading reviews...</p>';
    listDiv.style.display = 'block';
    buttonElement.textContent = 'Hide Reviews';

    try {
        const response = await fetchWithAuth(`/products/${productId}/reviews`);
        const data = await response.json();
        if (!response.ok) throw new Error();

        const reviews = Array.isArray(data) ? data : (data.items || []);

        if (reviews.length === 0) {
            listDiv.innerHTML = '<p style="font-size:11px; color:#999; margin:5px 0;">No reviews for this product yet.</p>';
            return;
        }

        listDiv.innerHTML = reviews.map(rev => `
            <div style="padding: 5px 0; border-bottom: 1px solid #f1f1f1; font-size: 12px;">
                <div style="display:flex; justify-content:space-between; font-weight:bold;">
                    <span>${rev.title}</span>
                    <span style="color:#ffc107;">${'★'.repeat(rev.rating)}</span>
                </div>
                <p style="margin:2px 0 0 0; color:#555;">${rev.comment}</p>
            </div>
        `).join('');
    } catch (error) {
        listDiv.innerHTML = '<p style="font-size:11px; color:red; margin:5px 0;">Failed to load reviews.</p>';
    }
}

function handleToggleReviewForm(productId) {
    const formDiv = document.getElementById(`review-form-${productId}`);
    formDiv.style.display = formDiv.style.display === 'block' ? 'none' : 'block';
}

async function handleSubmitReview(productId, submitButton) {
    const titleInput = document.getElementById(`rev-title-${productId}`);
    const ratingSelect = document.getElementById(`rev-rating-${productId}`);
    const commentInput = document.getElementById(`rev-comment-${productId}`);
    const messageDiv = document.getElementById('storefront-message');

    const payload = {
        title: titleInput.value.trim(),
        rating: parseInt(ratingSelect.value, 10),
        comment: commentInput.value.trim()
    };

    if (!payload.title || !payload.comment) return;

    submitButton.disabled = true;

    try {
        const response = await fetchWithAuth(`/products/${productId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to submit review');

        messageDiv.innerHTML = '<span style="color: green;">Review added successfully!</span>';

        titleInput.value = '';
        commentInput.value = '';
        document.getElementById(`review-form-${productId}`).style.display = 'none';

        const toggleBtn = document.querySelector(`.toggle-reviews-btn[data-id="${productId}"]`);
        if (toggleBtn && toggleBtn.textContent === 'Hide Reviews') {
            document.getElementById(`reviews-list-${productId}`).style.display = 'none';
            await handleToggleReviews(productId, toggleBtn);
        }

        setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitButton.disabled = false;
    }
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