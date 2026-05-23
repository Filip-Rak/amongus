import { fetchWithAuth } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; background-color: #fff; border: 1px solid #ccc; border-radius: 4px;">
            <h2>Order Checkout</h2>
            <div id="checkout-message" style="margin-bottom: 15px; font-weight: bold;"></div>

            <div id="checkout-form-section">
                <form id="checkout-form">
                    <div style="margin-bottom: 12px;">
                        <label>Full Name:</label>
                        <input type="text" id="ship-name" value="Jan Kowalski" required style="width:100%; padding:6px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label>Address Line 1:</label>
                        <input type="text" id="ship-address" value="Testowa 12" required style="width:100%; padding:6px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label>City:</label>
                        <input type="text" id="ship-city" value="Warsaw" required style="width:100%; padding:6px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label>Postal Code:</label>
                        <input type="text" id="ship-postal" value="00-001" required style="width:100%; padding:6px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label>Country:</label>
                        <input type="text" id="ship-country" value="Poland" required style="width:100%; padding:6px; box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Phone Number:</label>
                        <input type="text" id="ship-phone" value="+48123123123" required style="width:100%; padding:6px; box-sizing:border-box;">
                    </div>
                    <button type="submit" id="checkout-submit-btn" style="width:100%; padding:10px; background-color:#28a745; color:white; border:none; font-weight:bold; cursor:pointer;">
                        Place Order & Go to Payment
                    </button>
                </form>
            </div>

            <div id="payment-mock-section" style="display: none; text-align: center; padding: 20px 0;">
                <h3 style="color: #007bff;">Simulate Payment Gateway</h3>
                <p>Order has been registered in database. Choose mock payment status outcome:</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button id="pay-success-btn" style="padding:10px 20px; background-color:#28a745; color:white; border:none; font-weight:bold; cursor:pointer;">
                        Simulate Success (200 OK)
                    </button>
                    <button id="pay-failure-btn" style="padding:10px 20px; background-color:#dc3545; color:white; border:none; font-weight:bold; cursor:pointer;">
                        Simulate Failure
                    </button>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#checkout-form').addEventListener('submit', handleCheckoutSubmit);
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('checkout-message');
    const submitBtn = document.getElementById('checkout-submit-btn');

    const payload = {
        shippingAddress: {
            fullName: document.getElementById('ship-name').value,
            line1: document.getElementById('ship-address').value,
            city: document.getElementById('ship-city').value,
            postalCode: document.getElementById('ship-postal').value,
            country: document.getElementById('ship-country').value,
            phone: document.getElementById('ship-phone').value
        }
    };

    submitBtn.disabled = true;

    try {
        const response = await fetchWithAuth('/orders/checkout', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Checkout request failed');

        messageDiv.innerHTML = '<span style="color: green;">Order created! Please complete payment step.</span>';

        // Hide form and open payment mock controls
        document.getElementById('checkout-form-section').style.display = 'none';
        const paymentSection = document.getElementById('payment-mock-section');
        paymentSection.style.display = 'block';

        // Extract payment id or fallback to order id depending on backend implementation strategy
        const targetId = data.payment?.id || data.id;

        paymentSection.querySelector('#pay-success-btn').addEventListener('click', () => handlePaymentMock(targetId, true));
        paymentSection.querySelector('#pay-failure-btn').addEventListener('click', () => handlePaymentMock(targetId, false));

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        submitBtn.disabled = false;
    }
}

async function handlePaymentMock(id, isSuccess) {
    const messageDiv = document.getElementById('checkout-message');
    const endpoint = isSuccess ? `/payments/${id}/mock-success` : `/payments/${id}/mock-failure`;
    const options = { method: 'POST' };

    if (!isSuccess) {
        options.body = JSON.stringify({ reason: 'Insufficient funds' });
    }

    try {
        const response = await fetchWithAuth(endpoint, options);
        if (!response.ok) throw new Error('Payment gateway simulation rejected');

        if (isSuccess) {
            messageDiv.innerHTML = '<span style="color: green; font-size: 18px;">Payment Successful! Order status updated to PAID.</span>';
            document.getElementById('payment-mock-section').style.display = 'none';
        } else {
            messageDiv.innerHTML = '<span style="color: red; font-size: 18px;">Payment Failed: Insufficient funds.</span>';
        }
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Gateway Error: ${error.message}</span>`;
    }
}