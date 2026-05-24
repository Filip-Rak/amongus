import { fetchWithAuth } from '../api.js';

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 900px; margin: 0 auto;">
            <h2>My Orders History</h2>
            <div id="orders-message" style="margin-bottom: 10px; font-weight: bold;"></div>
            <div id="orders-list">Loading orders data...</div>
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
            const dateCreated = new Date(order.createdAt).toLocaleString();
            const datePaid = order.paidAt ? new Date(order.paidAt).toLocaleString() : null;
            const dateCancelled = order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : null;

            // Define status color code mapping
            let statusColor = '#ffc107';
            if (order.status === 'paid') statusColor = '#28a745';
            if (order.status === 'cancelled') statusColor = '#dc3545';

            // Generate HTML layout structure for purchased items inside single order
            const itemsHtml = order.items && order.items.length > 0
                ? order.items.map(item => {
                    const unitPrice = (item.unitPriceAmount / 100).toFixed(2);
                    const itemTotal = ((item.unitPriceAmount * item.quantity) / 100).toFixed(2);

                    const imgHtml = item.imageUrl
                        ? `<img src="${item.imageUrl}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">`
                        : `<div style="width: 50px; height: 50px; background: #e9ecef; border-radius: 4px; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6c757d; border: 1px solid #dee2e6;">No image</div>`;

                    return `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #f8f9fa; padding-bottom: 10px;">
                            <div style="display: flex; align-items: center;">
                                ${imgHtml}
                                <div>
                                    <span style="font-weight: bold; color: #212529;">${item.productName}</span><br>
                                    <small style="color: #6c757d;">Unit Price: ${unitPrice} ${item.currency}</small>
                                </div>
                            </div>
                            <div style="text-align: right; min-width: 100px;">
                                <span style="font-size: 13px; color: #495057;">Qty: ${item.quantity}</span><br>
                                <span style="font-weight: bold; color: #212529;">${itemTotal} ${item.currency}</span>
                            </div>
                        </div>
                    `;
                }).join('')
                : '<p style="font-size: 14px; color: #6c757d;">No items inside this order record.</p>';

            // Handle math pricing structures conversions
            const subtotal = (order.totals.subtotalAmount / 100).toFixed(2);
            const shipping = (order.totals.shippingAmount / 100).toFixed(2);
            const total = (order.totals.totalAmount / 100).toFixed(2);
            const currency = order.totals.currency;

            const addr = order.shippingAddress || {};
            const addressLine2Html = addr.line2 ? `${addr.line2}<br>` : '';
            const phoneHtml = addr.phone ? `<br><b>Phone:</b> ${addr.phone}` : '';

            return `
                <div style="border: 1px solid #dee2e6; padding: 20px; margin-bottom: 25px; background-color: #fff; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #f8f9fa; padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <span style="font-size: 13px; color: #6c757d; display: block; margin-bottom: 2px;">Order Reference ID:</span>
                            <code style="font-size: 15px; font-weight: bold; color: #212529;">${order.id}</code>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 12px; color: #6c757d; display: block;">Placed on: ${dateCreated}</span>
                            <span style="padding: 4px 8px; border-radius: 4px; color: white; background-color: ${statusColor}; font-weight: bold; font-size: 12px; display: inline-block; margin-top: 6px;">
                                ${order.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    ${datePaid ? `<p style="margin: -5px 0 15px 0; font-size: 13px; color: #28a745;"><b>Paid Execution Date:</b> ${datePaid}</p>` : ''}
                    ${dateCancelled ? `<p style="margin: -5px 0 15px 0; font-size: 13px; color: #dc3545;"><b>Cancellation Log Date:</b> ${dateCancelled}</p>` : ''}

                    <div style="display: flex; gap: 30px; flex-wrap: wrap; margin-top: 15px;">
                        <div style="flex: 2; min-width: 280px;">
                            <h4 style="margin: 0 0 12px 0; color: #495057; font-size: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Items Summaries</h4>
                            ${itemsHtml}
                        </div>
                        
                        <div style="flex: 1; min-width: 240px; background-color: #f8f9fa; padding: 15px; border-radius: 4px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #e9ecef;">
                            <div>
                                <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px; border-bottom: 1px solid #e9ecef; padding-bottom: 5px;">Delivery Destination</h4>
                                <p style="margin: 0; font-size: 13px; color: #333; line-height: 1.5;">
                                    <b>${addr.fullName || ''}</b><br>
                                    ${addr.line1 || ''}<br>
                                    ${addressLine2Html}
                                    ${addr.postalCode || ''} ${addr.city || ''}<br>
                                    ${addr.country || ''}
                                    ${phoneHtml}
                                </p>
                            </div>
                            <div style="margin-top: 20px; border-top: 1px solid #dee2e6; padding-top: 10px;">
                                <table style="width: 100%; font-size: 13px; color: #495057; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 3px 0;">Subtotal:</td>
                                        <td style="text-align: right; padding: 3px 0; font-family: monospace;">${subtotal} ${currency}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 3px 0;">Shipping Cost:</td>
                                        <td style="text-align: right; padding: 3px 0; font-family: monospace;">${shipping} ${currency}</td>
                                    </tr>
                                    <tr style="font-weight: bold; font-size: 15px; color: #28a745;">
                                        <td style="padding: 8px 0 0 0; border-top: 1px dashed #ced4da;">Total Charged:</td>
                                        <td style="text-align: right; padding: 8px 0 0 0; border-top: 1px dashed #ced4da; font-family: monospace;">${total} ${currency}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        listDiv.innerHTML = '<p style="color: #6c757d;">No historical information loaded.</p>';
    }
}