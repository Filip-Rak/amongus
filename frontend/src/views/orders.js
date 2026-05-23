import { fetchWithAuth } from '../api.js';

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <h2>My Historical Orders</h2>
            <div id="orders-message" style="margin-bottom: 10px; font-weight: bold;"></div>
            <div id="orders-list">Loading historical records...</div>
        </div>
    `;

    await loadMyOrders();
}

async function loadMyOrders() {
    const listDiv = document.getElementById('orders-list');
    const messageDiv = document.getElementById('orders-message');

    try {
        const response = await fetchWithAuth('/orders/my');
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to retrieve orders');

        const orders = Array.isArray(data) ? data : (data.items || []);

        if (orders.length === 0) {
            listDiv.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        listDiv.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleString();
            return `
                <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; background-color: #fff; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                        <span><b>Order Reference ID:</b> <code>${order.id}</code></span>
                        <span>Date: ${date}</span>
                    </div>
                    <div>
                        <p style="margin: 5px 0;"><b>Status:</b> <span style="color: ${order.status === 'paid' ? 'green' : 'orange'}; font-weight: bold;">${order.status.toUpperCase()}</span></p>
                        <p style="margin: 5px 0;"><b>Shipment To:</b> ${order.shippingAddress?.fullName}, ${order.shippingAddress?.city} (${order.shippingAddress?.postalCode})</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        listDiv.innerHTML = '<p>No historical information loaded.</p>';
    }
}