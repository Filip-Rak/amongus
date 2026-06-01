import { fetchWithAuth } from '../api.js';

let productData = null;
let hasPurchased = false;
let flatCategoriesList = [];
let categoryAttributesDefs = []; // Store mapping schema for keys and labels
let currentUserId = null;       // ID of logged in user
let editingReviewId = null;

export async function render(container, productId) {
    container.innerHTML = `<div style="font-family: sans-serif; padding: 20px;"><p>Loading product details...</p></div>`;

    editingReviewId = null; // Reset edit context on view activation

    await loadProductDetails(productId);

    if (!productData) {
        container.innerHTML = `<div style="font-family: sans-serif; padding: 20px; color: red;">Product not found.</div>`;
        return;
    }

    await Promise.all([
        checkUserPurchaseHistory(productId),
        loadFlatCategories(),
        loadCategoryAttributes(productData.categoryId),
        loadCurrentUserId() // Retrieve identity profile context
    ]);

    const formattedPrice = productData.price ? `${(productData.price.amount / 100).toFixed(2)} ${productData.price.currency}` : 'N/A';
    const primaryImg = productData.images && productData.images.find(img => img.isPrimary);
    const imageHtml = primaryImg && primaryImg.url
        ? `<img src="${primaryImg.url}" alt="${primaryImg.alt || productData.name}" style="max-width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">`
        : `<div style="width: 100%; height: 300px; background-color: #e9ecef; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6c757d;">No Image Available</div>`;

    // Map the nested categories trail path (Breadcrumbs) using data references
    let categoryTrailHtml = 'Uncategorized';
    const currentCategory = flatCategoriesList.find(c => c.id === productData.categoryId);
    if (currentCategory) {
        const trailNames = [];
        if (currentCategory.ancestorIds && Array.isArray(currentCategory.ancestorIds)) {
            currentCategory.ancestorIds.forEach(ancId => {
                const ancCat = flatCategoriesList.find(c => c.id === ancId);
                if (ancCat) trailNames.push(ancCat.name);
            });
        }
        trailNames.push(currentCategory.name);
        categoryTrailHtml = trailNames.join(' &gt; ');
    }

    // Adapt formatting to fit strict technical validation rules from backend schema
    const targetAttributes = productData.attributeValues || productData.attributes || {};
    const attributesHtml = Object.keys(targetAttributes).length > 0
        ? Object.entries(targetAttributes).map(([key, val]) => {
            const def = categoryAttributesDefs.find(a => a.key === key);
            const displayLabel = def ? def.label : key;
            const formattedVal = Array.isArray(val) ? val.join(', ') : val;
            return `<li><b>${displayLabel}:</b> ${formattedVal}</li>`;
        }).join('')
        : '<li>No specific attributes listed.</li>';

    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 900px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <button id="back-to-store-btn" style="padding: 8px 15px; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 4px;">
                    &larr; Back to Catalog
                </button>
                <span style="font-size: 13px; color: #6c757d;"><b>Path:</b> ${categoryTrailHtml}</span>
            </div>

            <div id="details-message" style="margin-bottom: 15px; font-weight: bold;"></div>

            <div style="display: flex; gap: 30px; margin-bottom: 40px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    ${imageHtml}
                </div>
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h2 style="margin: 0 0 10px 0; color: #333;">${productData.name}</h2>
                        <p style="color: #6c757d; line-height: 1.5; font-size: 15px;">${productData.description || ''}</p>
                        <h4 style="margin: 20px 0 5px 0;">Technical Specifications:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.6;">
                            ${attributesHtml}
                        </ul>
                    </div>
                    <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <span style="font-size: 24px; font-weight: bold; color: #28a745;">${formattedPrice}</span>
                            <span style="color: ${productData.stock <= 0 ? 'red' : '#6c757d'}; font-size: 14px;">
                                ${productData.stock <= 0 ? 'Out of stock' : `Available Stock: ${productData.stock}`}
                            </span>
                        </div>
                        <button id="details-add-to-cart-btn" data-id="${productData.id}" ${productData.stock <= 0 ? 'disabled' : ''} 
                            style="width: 100%; padding: 12px; background-color: ${productData.stock <= 0 ? '#6c757d' : '#007bff'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px;">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>

            <div style="border-top: 2px solid #f0f0f0; padding-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Customer Reviews</h3>
                    ${hasPurchased ? `<button id="open-review-form-btn" style="padding: 6px 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Write a Review</button>` : ''}
                </div>

                <div id="details-review-form-container" style="display: none; margin-bottom: 25px; padding: 15px; border: 1px dashed #28a745; background-color: #fdfdfd; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0;">Submit Product Feedback</h4>
                    <input type="text" id="details-rev-title" placeholder="Summary title" required style="width:100%; margin-bottom:8px; padding:6px; box-sizing:border-box;">
                    <select id="details-rev-rating" style="width:100%; margin-bottom:8px; padding:6px;">
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                    <textarea id="details-rev-comment" placeholder="Write your comments here..." rows="3" required style="width:100%; margin-bottom:10px; padding:6px; box-sizing:border-box("></textarea>
                    <button id="details-submit-review-btn" style="padding: 8px 15px; background-color: #28a745; color: white; border: none; cursor: pointer; font-weight: bold;">Submit Review</button>
                </div>

                <div id="details-reviews-list"><p style="color:#666;">Loading reviews stream...</p></div>
            </div>
        </div>
    `;

    attachEventListeners(container, productId);
    await loadProductReviews(productId);
}

function attachEventListeners(container, productId) {
    container.querySelector('#back-to-store-btn').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('backToStoreRequested'));
    });

    container.querySelector('#details-add-to-cart-btn').addEventListener('click', (e) => {
        handleAddToCart(productId, e.target);
    });

    const openFormBtn = container.querySelector('#open-review-form-btn');
    if (openFormBtn) {
        openFormBtn.addEventListener('click', () => {
            editingReviewId = null;
            container.querySelector('#details-review-form-container h4').innerText = 'Submit Product Feedback';
            document.getElementById('details-submit-review-btn').innerText = 'Submit Review';
            const form = document.getElementById('details-review-form-container');
            form.style.display = form.style.display === 'block' ? 'none' : 'block';
        });
    }

    const submitReviewBtn = container.querySelector('#details-submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', () => handleReviewSubmit(productId, submitReviewBtn));
    }

    // Intercept clicks on dynamically rendered edit and delete actions inside the reviews stream
    container.querySelector('#details-reviews-list').addEventListener('click', (e) => {
        const reviewId = e.target.dataset.reviewId;
        if (!reviewId) return;

        if (e.target.classList.contains('edit-own-review-btn')) {
            setupReviewEdit(reviewId);
        } else if (e.target.classList.contains('delete-own-review-btn')) {
            handleReviewDelete(productId, reviewId);
        }
    });
}

async function loadProductDetails(productId) {
    try {
        const response = await fetchWithAuth(`/products/${productId}`);
        if (response.ok) {
            productData = await response.json();
        }
    } catch (error) {
        console.error('Failed to resolve product data response payload', error);
    }
}

async function loadFlatCategories() {
    try {
        // Changed endpoint from '/categories/admin?limit=100' to public route to avoid 403 error for customers
        const response = await fetchWithAuth('/categories?limit=100');
        if (response.ok) {
            const data = await response.json();
            flatCategoriesList = data.items || [];
        }
    } catch (error) {
        console.error('Failed to pre-fetch category indexing fields', error);
    }
}

async function checkUserPurchaseHistory(productId) {
    try {
        const response = await fetchWithAuth('/orders/my');
        if (!response.ok) return;
        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.items || []);

        hasPurchased = orders
            .filter(order => order.status === 'paid')
            .some(order => order.items && order.items.some(item => item.productId === productId));
    } catch (error) {
        hasPurchased = false;
    }
}

async function loadProductReviews(productId) {
    const listDiv = document.getElementById('details-reviews-list');
    try {
        const response = await fetchWithAuth(`/products/${productId}/reviews`);
        const data = await response.json();
        const reviews = Array.isArray(data) ? data : (data.items || []);

        if (reviews.length === 0) {
            listDiv.innerHTML = '<p style="color: #999;">No reviews for this product yet.</p>';
            return;
        }

        listDiv.innerHTML = reviews.map(rev => {
            // Check review ownership flag
            const isOwnReview = rev.userId === currentUserId;

            const actionButtons = isOwnReview
                ? `<div style="margin-top: 8px;">
                     <button class="edit-own-review-btn" data-review-id="${rev.id}" style="padding: 2px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">Edit</button>
                     <button class="delete-own-review-btn" data-review-id="${rev.id}" style="padding: 2px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Delete</button>
                   </div>`
                : '';

            return `
                <div style="padding: 12px 0; border-bottom: 1px solid #eee;" class="review-item-block" data-title="${rev.title}" data-rating="${rev.rating}" data-comment="${rev.comment}">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
                        <span>${rev.title}</span>
                        <span style="color: #ffc107;">${'★'.repeat(rev.rating)}</span>
                    </div>
                    <p style="margin: 0; color: #555; font-size: 14px;">${rev.comment}</p>
                    ${actionButtons}
                </div>
            `;
        }).join('');
    } catch (error) {
        listDiv.innerHTML = '<p style="color: red;">Failed to load reviews payload.</p>';
    }
}

async function handleAddToCart(productId, buttonElement) {
    const messageDiv = document.getElementById('details-message');
    buttonElement.disabled = true;
    try {
        const response = await fetchWithAuth('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });
        if (!response.ok) throw new Error('Cart integration error');
        messageDiv.innerHTML = '<span style="color: green;">Added to cart successfully!</span>';
        setTimeout(() => { messageDiv.innerHTML = ''; }, 2000);
    } catch (error) {
        messageDiv.innerHTML = '<span style="color: red;">Failed to add product to cart.</span>';
    } finally {
        buttonElement.disabled = false;
    }
}

async function handleReviewSubmit(productId, submitButton) {
    const titleInput = document.getElementById('details-rev-title');
    const ratingSelect = document.getElementById('details-rev-rating');
    const commentInput = document.getElementById('details-rev-comment');
    const messageDiv = document.getElementById('details-message');

    const payload = {
        title: titleInput.value.trim(),
        rating: parseInt(ratingSelect.value, 10),
        comment: commentInput.value.trim()
    };

    if (!payload.title || !payload.comment) return;
    submitButton.disabled = true;

    try {
        let response;
        if (editingReviewId) {
            // Update an existing active review owned by the session context user (Section 11.5)
            response = await fetchWithAuth(`/reviews/${editingReviewId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } else {
            // Create a brand new product review entry instance (Section 11.4)
            response = await fetchWithAuth(`/products/${productId}/reviews`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Feedback rejection');

        messageDiv.innerHTML = `<span style="color: green;">Review ${editingReviewId ? 'updated' : 'added'} successfully.</span>`;

        // Restore default state parameters mapping controls
        titleInput.value = '';
        commentInput.value = '';
        editingReviewId = null;
        document.querySelector('#details-review-form-container h4').innerText = 'Submit Product Feedback';
        submitButton.innerText = 'Submit Review';
        document.getElementById('details-review-form-container').style.display = 'none';

        // Parallel data refresh since average statistics are recalculated by backend on writes
        await Promise.all([
            loadProductDetails(productId),
            loadProductReviews(productId)
        ]);

        setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitButton.disabled = false;
    }
}

async function loadCategoryAttributes(categoryId) {
    try {
        const response = await fetchWithAuth(`/categories/${categoryId}/attributes`);
        if (response.ok) {
            const data = await response.json();
            categoryAttributesDefs = data.attributes || [];
        }
    } catch (error) {
        console.error('Failed to load category attribute definitions map', error);
    }
}

async function loadCurrentUserId() {
    try {
        const response = await fetchWithAuth('/users/me');
        if (response.ok) {
            const data = await response.json();
            currentUserId = data.id;
        }
    } catch (error) {
        console.error('Failed to retrieve active user context info', error);
    }
}

function setupReviewEdit(reviewId) {
    const btn = document.querySelector(`.edit-own-review-btn[data-review-id="${reviewId}"]`);
    const block = btn.closest('.review-item-block');

    const title = block.dataset.title;
    const rating = block.dataset.rating;
    const comment = block.dataset.comment;

    document.getElementById('details-rev-title').value = title;
    document.getElementById('details-rev-rating').value = rating;
    document.getElementById('details-rev-comment').value = comment;

    editingReviewId = reviewId;
    document.querySelector('#details-review-form-container h4').innerText = 'Edit Your Review';
    document.getElementById('details-submit-review-btn').innerText = 'Update Review';

    const form = document.getElementById('details-review-form-container');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
}

async function handleReviewDelete(productId, reviewId) {
    if (!confirm('Are you sure you want to delete your review?')) return;
    const messageDiv = document.getElementById('details-message');

    try {
        // Soft delete active review entry owned by current session container context (Section 11.6)
        const response = await fetchWithAuth(`/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to delete review');
        }

        messageDiv.innerHTML = '<span style="color: green;">Review deleted successfully.</span>';

        // Refresh product aggregations layout parameters
        await Promise.all([
            loadProductDetails(productId),
            loadProductReviews(productId)
        ]);

        setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}