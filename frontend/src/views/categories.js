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
                        <th>Hierarchy</th>
                        <th>Defined Attributes</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="categories-tbody">
                    <tr><td colspan="5">Loading categories data...</td></tr>
                </tbody>
            </table>

            <div id="category-form-container" style="display: none; margin-top: 30px; border: 1px solid #ccc; padding: 20px; max-width: 600px; background-color: #fff;">
                <h3 id="category-form-title">Add New Category</h3>
                <form id="category-form">
                    <input type="hidden" id="category-id">
                    
                    <div style="margin-bottom: 15px;" id="parent-category-group">
                        <label>Parent Category:</label><br>
                        <select id="category-parent" style="width: 100%; padding: 5px;">
                            <option value="">-- None (Root Category) --</option>
                        </select>
                        <small style="color: #666;">Note: Parent cannot be changed after creation.</small>
                    </div>

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

                    <div style="margin-bottom: 15px; border: 1px solid #ced4da; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="font-weight: bold;">Attribute Definitions:</label>
                            <button type="button" id="add-attr-def-btn" style="padding: 4px 8px; background-color: #17a2b8; color: white; border: none; cursor: pointer; font-size: 12px;">+ Add Attribute</button>
                        </div>
                        <div id="attribute-definitions-wrapper"></div>
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
    container.querySelector('#add-attr-def-btn').addEventListener('click', () => addAttributeDefRow());

    container.querySelector('#categories-tbody').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('edit-btn')) {
            showEditForm(id);
        } else if (e.target.classList.contains('archive-btn')) {
            archiveCategory(id);
        }
    });

    container.querySelector('#attribute-definitions-wrapper').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-attr-def-btn')) {
            e.target.closest('.attr-def-row').remove();
        }
    });
}

function addAttributeDefRow(def = {}) {
    const wrapper = document.getElementById('attribute-definitions-wrapper');
    const row = document.createElement('div');
    row.classList.add('attr-def-row');
    row.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; background: #fff;';

    const allowedValuesStr = (def.allowedValues && Array.isArray(def.allowedValues)) ? def.allowedValues.join(', ') : '';

    row.innerHTML = `
        <input type="text" class="attr-key" placeholder="Key (e.g. switch_type)" value="${def.key || ''}" required style="flex: 1; min-width: 120px; padding: 4px;">
        <input type="text" class="attr-label" placeholder="Label (e.g. Switch Type)" value="${def.label || ''}" required style="flex: 1; min-width: 120px; padding: 4px;">
        <select class="attr-type" style="flex: 1; min-width: 100px; padding: 4px;">
            <option value="string" ${def.type === 'string' ? 'selected' : ''}>String</option>
            <option value="number" ${def.type === 'number' ? 'selected' : ''}>Number</option>
            <option value="boolean" ${def.type === 'boolean' ? 'selected' : ''}>Boolean</option>
            <option value="string_array" ${def.type === 'string_array' ? 'selected' : ''}>String Array</option>
        </select>
        <label style="display: flex; align-items: center; gap: 5px; min-width: 80px;"><input type="checkbox" class="attr-required" ${def.isRequired ? 'checked' : ''}> Required</label>
        <div style="flex-basis: 100%; display: flex; gap: 8px; margin-top: 4px;">
            <input type="text" class="attr-allowed" placeholder="Allowed values (comma separated)" value="${allowedValuesStr}" style="flex: 2; padding: 4px;">
            <input type="number" step="any" class="attr-min" placeholder="Min" value="${def.min !== undefined ? def.min : ''}" style="flex: 1; max-width: 80px; padding: 4px;">
            <input type="number" step="any" class="attr-max" placeholder="Max" value="${def.max !== undefined ? def.max : ''}" style="flex: 1; max-width: 80px; padding: 4px;">
            <input type="text" class="attr-unit" placeholder="Unit" value="${def.unit || ''}" style="flex: 1; max-width: 80px; padding: 4px;">
            <button type="button" class="remove-attr-def-btn" style="background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; padding: 0 10px;">X</button>
        </div>
    `;
    wrapper.appendChild(row);
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

    tbody.innerHTML = categoriesData.map(category => {
        const parent = category.parentId ? categoriesData.find(c => c.id === category.parentId) : null;
        const parentName = parent ? parent.name : '<span style="color:#28a745;">Root (Level 0)</span>';
        const attrsCount = category.attributeDefinitions ? category.attributeDefinitions.length : 0;

        return `
            <tr>
                <td>
                    <b>${category.name}</b><br>
                    <small style="color: #6c757d;">Slug: <code>${category.slug}</code></small>
                </td>
                <td><small>Parent: ${parentName}</small></td>
                <td>${attrsCount} attributes</td>
                <td><span style="padding: 3px 6px; background-color: ${category.status === 'active' ? '#d4edda' : '#f8d7da'}">${category.status}</span></td>
                <td>
                    <button class="edit-btn" data-id="${category.id}">Edit</button>
                    ${category.status !== 'archived' ? `<button class="archive-btn" data-id="${category.id}" style="color: orange;">Archive</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function populateParentDropdown(excludeId = null) {
    const select = document.getElementById('category-parent');
    select.innerHTML = '<option value="">-- None (Root Category) --</option>';

    categoriesData.forEach(category => {
        if (category.status === 'active' && category.id !== excludeId) {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        }
    });
}

function showAddForm() {
    document.getElementById('category-form-title').innerText = 'Add New Category';
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('attribute-definitions-wrapper').innerHTML = '';

    populateParentDropdown();
    document.getElementById('parent-category-group').style.display = 'block';

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

    document.getElementById('parent-category-group').style.display = 'none';

    document.getElementById('attribute-definitions-wrapper').innerHTML = '';
    if (category.attributeDefinitions && category.attributeDefinitions.length > 0) {
        category.attributeDefinitions.forEach(def => addAttributeDefRow(def));
    }

    document.getElementById('slug-group').style.display = 'none';
    document.getElementById('category-status-group').style.display = 'block';
    document.getElementById('category-status').value = category.status;

    document.getElementById('category-form-container').style.display = 'block';
}

function hideForm() {
    document.getElementById('category-form-container').style.display = 'none';
    document.getElementById('category-form').reset();
    document.getElementById('attribute-definitions-wrapper').innerHTML = '';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('categories-message');
    const submitBtn = document.getElementById('save-category-btn');

    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    const description = document.getElementById('category-description').value;

    const attributeDefinitions = [];
    const rows = document.querySelectorAll('.attr-def-row');

    rows.forEach(row => {
        const key = row.querySelector('.attr-key').value.trim();
        const label = row.querySelector('.attr-label').value.trim();
        const type = row.querySelector('.attr-type').value;
        const isRequired = row.querySelector('.attr-required').checked;

        if (key && label) {
            // Initialize default safe fallback values to prevent backend class-transformer undefined-to-null bugs
            const def = {
                key,
                label,
                type,
                isRequired,
                allowedValues: [],
                min: 0,
                max: 0,
                unit: ""
            };

            const allowedValuesRaw = row.querySelector('.attr-allowed').value;
            const arr = allowedValuesRaw.split(',').map(v => v.trim()).filter(v => v !== '');
            if (arr.length > 0) {
                def.allowedValues = arr;
            }

            const minRaw = row.querySelector('.attr-min').value.trim();
            const maxRaw = row.querySelector('.attr-max').value.trim();
            const unit = row.querySelector('.attr-unit').value.trim();

            if (minRaw !== '' && !isNaN(minRaw)) def.min = parseFloat(minRaw);
            if (maxRaw !== '' && !isNaN(maxRaw)) def.max = parseFloat(maxRaw);
            if (unit !== '') def.unit = unit;

            attributeDefinitions.push(def);
        }
    });

    const isEditing = id !== '';
    submitBtn.disabled = true;

    try {
        let response;
        if (isEditing) {
            const status = document.getElementById('category-status').value;
            const payload = { name, status, attributeDefinitions };
            if (description.trim() !== '') payload.description = description;

            response = await fetchWithAuth(`/categories/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } else {
            const slug = document.getElementById('category-slug').value;
            const parentId = document.getElementById('category-parent').value;

            const payload = { name, attributeDefinitions };
            if (description.trim() !== '') payload.description = description;
            if (slug.trim() !== '') payload.slug = slug;
            if (parentId !== '') payload.parentId = parentId;

            response = await fetchWithAuth('/categories', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        if (!response.ok) {
            const validationDetails = data.validationErrors ? ` [${data.validationErrors.join(', ')}]` : '';
            const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Failed to save category');
            throw new Error(errorMsg + validationDetails);
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