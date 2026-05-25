import { fetchWithAuth } from '../api.js';

let categoriesData = [];

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Categories Management (Admin Panel)</h2>
                <button id="add-category-btn" style="padding: 10px 15px; background-color: #28a745; color: white; border: none; cursor: pointer;">Add New Category</button>
            </div>
            
            <div id="categories-message" style="margin-bottom: 10px; font-weight: bold;"></div>
            
            <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; text-align: left; background-color: #fff;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="categories-tbody">
                    <tr><td colspan="5">Loading categories data...</td></tr>
                </tbody>
            </table>

            <div id="category-form-container" style="display: none; margin-top: 30px; border: 1px solid #ccc; padding: 20px; max-width: 400px; background-color: #fff;">
                <h3 id="category-form-title">Add New Category</h3>
                <form id="category-form">
                    <input type="hidden" id="category-id">
                    
                    <div style="margin-bottom: 15px;">
                        <label>Name:</label><br>
                        <input type="text" id="category-name" required style="width: 100%; padding: 5px; box-sizing: border-box;">
                    </div>

                    <div style="margin-bottom: 15px;" id="slug-group">
                        <label>Slug (Optional):</label><br>
                        <input type="text" id="category-slug" style="width: 100%; padding: 5px; box-sizing: border-box;">
                        <small style="color: #666;">Leave blank to auto-generate from name.</small>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Description:</label><br>
                        <textarea id="category-description" rows="3" style="width: 100%; padding: 5px; box-sizing: border-box;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 15px; display: none;" id="category-status-group">
                        <label>Status:</label><br>
                        <select id="category-status" style="width: 100%; padding: 5px;">
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    
                    <button type="submit" id="save-category-btn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; cursor: pointer;">Save</button>
                    <button type="button" id="cancel-category-btn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; cursor: pointer; margin-left: 5px;">Cancel</button>
                </form>
            </div>
        </div>
    `;

    attachEventListeners(container);
    await loadCategories();
}

function attachEventListeners(container) {
    container.querySelector('#add-category-btn').addEventListener('click', showAddForm);
    container.querySelector('#cancel-category-btn').addEventListener('click', hideForm);
    container.querySelector('#category-form').addEventListener('submit', handleFormSubmit);

    container.querySelector('#categories-tbody').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('edit-btn')) {
            showEditForm(id);
        } else if (e.target.classList.contains('archive-btn')) {
            archiveCategory(id);
        }
    });
}

async function loadCategories() {
    const tbody = document.getElementById('categories-tbody');
    const messageDiv = document.getElementById('categories-message');

    try {
        const response = await fetchWithAuth('/categories/admin');
        const responseData = await response.json();

        if (!response.ok) throw new Error(responseData.message || 'Failed to fetch categories');

        if (responseData && Array.isArray(responseData.items)) {
            categoriesData = responseData.items;
        } else {
            throw new Error('Unexpected data format received from server');
        }

        renderTable();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        tbody.innerHTML = `<tr><td colspan="5">No data available.</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('categories-tbody');

    if (categoriesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No categories found.</td></tr>`;
        return;
    }

    tbody.innerHTML = categoriesData.map(category => `
        <tr>
            <td><b>${category.name}</b></td>
            <td><code>${category.slug}</code></td>
            <td>${category.description || '<span style="color:#ccc;">No description</span>'}</td>
            <td><span style="padding: 3px 6px; background-color: ${category.status === 'active' ? '#d4edda' : '#f8d7da'}">${category.status}</span></td>
            <td>
                <button class="edit-btn" data-id="${category.id}">Edit</button>
                ${category.status !== 'archived' ? `<button class="archive-btn" data-id="${category.id}" style="color: orange;">Archive</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function showAddForm() {
    document.getElementById('category-form-title').innerText = 'Add New Category';
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';

    document.getElementById('slug-group').style.display = 'block';
    document.getElementById('category-status-group').style.display = 'none';
    document.getElementById('category-form-container').style.display = 'block';
}

function showEditForm(id) {
    const category = categoriesData.find(c => c.id === id);
    if (!category) return;

    document.getElementById('category-form-title').innerText = 'Edit Category';
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';

    document.getElementById('slug-group').style.display = 'none';
    document.getElementById('category-status-group').style.display = 'block';
    document.getElementById('category-status').value = category.status;

    document.getElementById('category-form-container').style.display = 'block';
}

function hideForm() {
    document.getElementById('category-form-container').style.display = 'none';
    document.getElementById('category-form').reset();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('categories-message');
    const submitBtn = document.getElementById('save-category-btn');

    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    const description = document.getElementById('category-description').value;

    const isEditing = id !== '';
    submitBtn.disabled = true;

    try {
        let response;
        if (isEditing) {
            const status = document.getElementById('category-status').value;
            const payload = { name, description, status };

            response = await fetchWithAuth(`/categories/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } else {
            const slug = document.getElementById('category-slug').value;
            const payload = { name, description };
            if (slug.trim() !== '') {
                payload.slug = slug;
            }

            response = await fetchWithAuth('/categories', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        if (!response.ok) {
            const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Failed to save category');
            throw new Error(errorMsg);
        }

        messageDiv.innerHTML = `<span style="color: green;">Category successfully saved.</span>`;
        hideForm();
        await loadCategories();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
    }
}

async function archiveCategory(id) {
    if (!confirm('Are you sure you want to archive this category?')) return;
    const messageDiv = document.getElementById('categories-message');

    try {
        const response = await fetchWithAuth(`/categories/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to archive category');
        }

        messageDiv.innerHTML = `<span style="color: green;">Category archived successfully.</span>`;
        await loadCategories();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
}