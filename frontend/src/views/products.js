import { fetchWithAuth } from '../api.js';

let productsData = [];
let categoriesList = [];

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Products Management (Admin Panel)</h2>
                <button id="add-product-btn" style="padding: 10px 15px; background-color: #28a745; color: white; border: none; cursor: pointer;">Add New Product</button>
            </div>
            
            <div id="products-message" style="margin-bottom: 10px; font-weight: bold;"></div>
            
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; text-align: left; background-color: #fff;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="products-tbody">
                    <tr><td colspan="7">Loading products data...</td></tr>
                </tbody>
            </table>

            <div id="product-form-container" style="display: none; margin-top: 30px; border: 1px solid #ccc; padding: 20px; max-width: 500px; background-color: #fff;">
                <h3 id="product-form-title">Add New Product</h3>
                <form id="product-form">
                    <input type="hidden" id="product-id">
                    
                    <div style="margin-bottom: 15px;">
                        <label>Product Name:</label><br>
                        <input type="text" id="product-name" required style="width: 100%; padding: 5px; box-sizing: border-box;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label>Description:</label><br>
                        <textarea id="product-description" rows="3" required style="width: 100%; padding: 5px; box-sizing: border-box;"></textarea>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label>Category:</label><br>
                        <select id="product-category" required style="width: 100%; padding: 5px;">
                            <option value="">-- Select Category --</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <label>Price (PLN):</label><br>
                            <input type="number" id="product-price" step="0.01" min="0" required style="width: 100%; padding: 5px; box-sizing: border-box;">
                        </div>
                        <div style="flex: 1;">
                            <label>Stock Qty:</label><br>
                            <input type="number" id="product-stock" min="0" required style="width: 100%; padding: 5px; box-sizing: border-box;">
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label>Primary Image URL:</label><br>
                        <input type="url" id="product-image-url" style="width: 100%; padding: 5px; box-sizing: border-box;">
                    </div>
                    
                    <div style="margin-bottom: 15px; display: none;" id="product-status-group">
                        <label>Status:</label><br>
                        <select id="product-status" style="width: 100%; padding: 5px;">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    
                    <button type="submit" id="save-product-btn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; cursor: pointer;">Save</button>
                    <button type="button" id="cancel-product-btn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; cursor: pointer; margin-left: 5px;">Cancel</button>
                </form>
            </div>
        </div>
    `;

    attachEventListeners(container);
    await Promise.all([loadCategories(), loadProducts()]);
    populateCategoryDropdown();
}

function attachEventListeners(container) {
    container.querySelector('#add-product-btn').addEventListener('click', showAddForm);
    container.querySelector('#cancel-product-btn').addEventListener('click', hideForm);
    container.querySelector('#product-form').addEventListener('submit', handleFormSubmit);

    container.querySelector('#products-tbody').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('edit-btn')) {
            showEditForm(id);
        } else if (e.target.classList.contains('archive-btn')) {
            archiveProduct(id);
        }
    });
}

async function loadCategories() {
    try {
        const response = await fetchWithAuth('/categories/admin');
        const responseData = await response.json();
        if (response.ok && responseData && Array.isArray(responseData.items)) {
            categoriesList = responseData.items;
        }
    } catch (error) {
        console.error('Failed to load categories for dropdown', error);
    }
}

function populateCategoryDropdown() {
    const select = document.getElementById('product-category');
    // Clear previous options except placeholder
    select.innerHTML = '<option value="">-- Select Category --</option>';

    categoriesList.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

async function loadProducts() {
    const tbody = document.getElementById('products-tbody');
    const messageDiv = document.getElementById('products-message');

    try {
        const response = await fetchWithAuth('/products/admin');
        const responseData = await response.json();

        if (!response.ok) throw new Error(responseData.message || 'Failed to fetch products');

        if (responseData && Array.isArray(responseData.items)) {
            productsData = responseData.items;
        } else {
            throw new Error('Unexpected data format received from server');
        }

        renderTable();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        tbody.innerHTML = `<tr><td colspan="7">No data available.</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('products-tbody');

    if (productsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">No products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = productsData.map(product => {
        // Find category name from local list
        const category = categoriesList.find(c => c.id === product.categoryId);
        const categoryName = category ? category.name : '<span style="color:red;">Unknown</span>';

        // Format price from cents to standard decimal format
        const formattedPrice = product.price ? `${(product.price.amount / 100).toFixed(2)} ${product.price.currency}` : 'N/A';

        return `
            <tr>
                <td><b>${product.name}</b></td>
                <td>${product.description || ''}</td>
                <td><small>${categoryName}</small></td>
                <td><code>${formattedPrice}</code></td>
                <td>${product.stock}</td>
                <td><span style="padding: 3px 6px; background-color: ${product.status === 'active' ? '#d4edda' : '#fff3cd'}">${product.status}</span></td>
                <td>
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    ${product.status !== 'archived' ? `<button class="archive-btn" data-id="${product.id}" style="color: orange;">Archive</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function showAddForm() {
    document.getElementById('product-form-title').innerText = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';

    document.getElementById('product-status-group').style.display = 'none';
    document.getElementById('product-form-container').style.display = 'block';
}

function showEditForm(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-form-title').innerText = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-category').value = product.categoryId;

    // Fill price conversion from cents back to float input string
    document.getElementById('product-price').value = product.price ? (product.price.amount / 100).toFixed(2) : '';
    document.getElementById('product-stock').value = product.stock;

    // Extract first image url if available
    const primaryImg = product.images && product.images.find(img => img.isPrimary);
    document.getElementById('product-image-url').value = primaryImg ? primaryImg.url : '';

    document.getElementById('product-status-group').style.display = 'block';
    document.getElementById('product-status').value = product.status;

    document.getElementById('product-form-container').style.display = 'block';
}

function hideForm() {
    document.getElementById('product-form-container').style.display = 'none';
    document.getElementById('product-form').reset();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('products-message');
    const submitBtn = document.getElementById('save-product-btn');

    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const categoryId = document.getElementById('product-category').value;
    const priceFloat = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value, 10);
    const imageUrl = document.getElementById('product-image-url').value;

    const isEditing = id !== '';
    submitBtn.disabled = true;

    // Convert decimal price input to integer cents for the backend DTO specification
    const priceAmountCents = Math.round(priceFloat * 100);

    try {
        let response;
        if (isEditing) {
            const status = document.getElementById('product-status').value;
            const payload = {
                name,
                description,
                categoryId,
                price: { amount: priceAmountCents, currency: 'PLN' },
                stock,
                status
            };

            if (imageUrl.trim() !== '') {
                payload.images = [{ url: imageUrl, alt: name, isPrimary: true }];
            }

            response = await fetchWithAuth(`/products/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } else {
            const payload = {
                name,
                description,
                categoryId,
                price: { amount: priceAmountCents, currency: 'PLN' },
                stock,
                status: 'active',
                attributes: {}, // Fallback schema requirement instantiation
                images: []
            };

            if (imageUrl.trim() !== '') {
                payload.images.push({ url: imageUrl, alt: name, isPrimary: true });
            }

            response = await fetchWithAuth('/products', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to save product');

        messageDiv.innerHTML = `<span style="color: green;">Product successfully saved.</span>`;
        hideForm();
        await loadProducts();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
    }
}

async function archiveProduct(id) {
    if (!confirm('Are you sure you want to archive this product?')) return;
    const messageDiv = document.getElementById('products-message');

    try {
        const response = await fetchWithAuth(`/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to archive product');
        }

        messageDiv.innerHTML = `<span style="color: green;">Product archived successfully.</span>`;
        await loadProducts();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}