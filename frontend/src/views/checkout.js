import { fetchWithAuth } from '../api.js';

let cartData = null;

export async function render(container) {
    container.innerHTML = `
        <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h2>Checkout</h2>
            <div id="checkout-message" style="margin-bottom: 15px; font-weight: bold;"></div>
            
            <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                <div style="flex: 2; min-width: 320px;" id="checkout-form-panel">
                    <form id="checkout-form">
                        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">1. Shipping Address</h3>
                        <div style="margin-bottom: 10px;">
                            <label>Full Name *</label><br>
                            <input type="text" id="ship-fullname" required style="width:100%; padding:6px; box-sizing:border-box;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label>Address Line 1 *</label><br>
                            <input type="text" id="ship-line1" required style="width:100%; padding:6px; box-sizing:border-box;" placeholder="Street address, P.O. box">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label>Address Line 2 (Optional)</label><br>
                            <input type="text" id="ship-line2" style="width:100%; padding:6px; box-sizing:border-box;" placeholder="Apartment, suite, unit">
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <div style="flex: 1;">
                                <label>City *</label><br>
                                <input type="text" id="ship-city" required style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                            <div style="flex: 1;">
                                <label>Postal Code *</label><br>
                                <input type="text" id="ship-postalcode" required style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                            <div style="flex: 1;">
                                <label>Country *</label><br>
                                <input type="text" id="ship-country" required style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                            <div style="flex: 1;">
                                <label>Phone Number (Optional)</label><br>
                                <input type="text" id="ship-phone" style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                        </div>

                        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">2. Billing & Purchase Type</h3>
                        <div style="margin-bottom: 12px;">
                            <label>Purchase Entity Type</label><br>
                            <select id="purchase-type" style="width:100%; padding:6px;">
                                <option value="private">Private Purchase</option>
                                <option value="company">Company Purchase</option>
                            </select>
                        </div>

                        <div id="invoice-request-group" style="margin-bottom: 12px;">
                            <label style="font-size: 14px;">
                                <input type="checkbox" id="invoice-requested"> Request Invoice snapshot layout
                            </label>
                        </div>

                        <div id="company-details-block" style="display: none; border: 1px dashed #28a745; padding: 12px; margin-bottom: 15px; background: #fdfdfd;">
                            <h4 style="margin: 0 0 10px 0; color: #28a745;">Company Registration Details</h4>
                            <div style="margin-bottom: 8px;">
                                <label>Company Name *</label><br>
                                <input type="text" id="company-name" style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                            <div>
                                <label>Tax Identification ID (NIP) *</label><br>
                                <input type="text" id="company-taxid" style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                        </div>

                        <div id="billing-address-toggle-group" style="margin-bottom: 12px; display: none;">
                            <label style="font-size: 14px;">
                                <input type="checkbox" id="billing-same-as-shipping" checked> Billing address is the same as shipping
                            </label>
                        </div>

                        <div id="billing-address-block" style="display: none; border: 1px solid #ccc; padding: 12px; margin-bottom: 20px; background: #fafafa;">
                            <h4 style="margin: 0 0 10px 0;">Distinct Billing Address Fields</h4>
                            <div style="margin-bottom: 8px;">
                                <label>Billing Full Name *</label><br>
                                <input type="text" id="bill-fullname" style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                            <div style="margin-bottom: 8px;">
                                <label>Billing Line 1 *</label><br>
                                <input type="text" id="bill-line1" style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                            <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                                <div style="flex: 1;">
                                    <label>Billing City *</label><br>
                                    <input type="text" id="bill-city" style="width:100%; padding:6px; box-sizing:border-box;">
                                </div>
                                <div style="flex: 1;">
                                    <label>Billing Postal Code *</label><br>
                                    <input type="text" id="bill-postalcode" style="width:100%; padding:6px; box-sizing:border-box;">
                                </div>
                            </div>
                            <div>
                                <label>Billing Country *</label><br>
                                <input type="text" id="bill-country" style="width:100%; padding:6px; box-sizing:border-box;">
                            </div>
                        </div>

                        <button type="submit" id="submit-order-btn" style="width:100%; padding:12px; background:#007bff; color:white; border:none; font-size:16px; font-weight:bold; cursor:pointer; border-radius:4px;">
                            Place Order & Proceed to Payment
                        </button>
                    </form>
                </div>

                <div style="flex: 1; min-width: 240px; background: #f8f9fa; padding: 15px; border: 1px solid #e9ecef; border-radius: 4px; height: fit-content;">
                    <h3 style="margin-top:0; border-bottom:1px solid #ddd; padding-bottom:5px;">Order Summary</h3>
                    <div id="checkout-cart-items" style="font-size:14px; margin-bottom:15px;">Loading items...</div>
                    <div id="checkout-cart-totals" style="border-top:1px dashed #ccc; padding-top:10px; font-weight:bold; font-size:16px; color:#28a745;">Total: 0.00 PLN</div>
                </div>
            </div>
        </div>
    `;

    attachEventListeners(container);
    await loadCartSummary();
}

function attachEventListeners(container) {
    const pTypeSelect = container.querySelector('#purchase-type');
    const invReqCheck = container.querySelector('#invoice-requested');
    const billSameCheck = container.querySelector('#billing-same-as-shipping');

    const companyBlock = container.querySelector('#company-details-block');
    const billingToggleGroup = container.querySelector('#billing-address-toggle-group');
    const billingBlock = container.querySelector('#billing-address-block');

    // Dynamic UI visibility control loops matching backend domain boundary assertions
    pTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'company') {
            companyBlock.style.display = 'block';
            billingToggleGroup.style.display = 'block';
            invReqCheck.checked = true;
            container.querySelector('#invoice-request-group').style.display = 'none'; // Forced true by schema definition
        } else {
            companyBlock.style.display = 'none';
            container.querySelector('#invoice-request-group').style.display = 'block';
            if (!invReqCheck.checked) {
                billingToggleGroup.style.display = 'none';
                billingBlock.style.display = 'none';
            }
        }
    });

    invReqCheck.addEventListener('change', (e) => {
        if (e.target.checked || pTypeSelect.value === 'company') {
            billingToggleGroup.style.display = 'block';
            if (!billSameCheck.checked) {
                billingBlock.style.display = 'block';
            }
        } else {
            billingToggleGroup.style.display = 'none';
            billingBlock.style.display = 'none';
        }
    });

    billSameCheck.addEventListener('change', (e) => {
        if (!e.target.checked && (invReqCheck.checked || pTypeSelect.value === 'company')) {
            billingBlock.style.display = 'block';
        } else {
            billingBlock.style.display = 'none';
        }
    });

    container.querySelector('#checkout-form').addEventListener('submit', handleCheckoutSubmit);
}

async function loadCartSummary() {
    try {
        const response = await fetchWithAuth('/cart');
        if (!response.ok) throw new Error('Could not access user shopping cart state');
        cartData = await response.json();

        const itemsDiv = document.getElementById('checkout-cart-items');
        const totalsDiv = document.getElementById('checkout-cart-totals');

        if (!cartData.items || cartData.items.length === 0) {
            itemsDiv.innerHTML = '<p style="color:red;">Your cart is empty. Cannot checkout.</p>';
            document.getElementById('submit-order-btn').disabled = true;
            return;
        }

        itemsDiv.innerHTML = cartData.items.map(item => {
            if (!item.isAvailable) return `<div><del>Unavailable Product</del></div>`;
            const price = (item.product.price.amount / 100).toFixed(2);
            return `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>${item.product.name} (x${item.quantity})</span>
                    <span>${price} ${item.product.price.currency}</span>
                </div>
            `;
        }).join('');

        if (cartData.totals && cartData.totals.length > 0) {
            const mainTotal = cartData.totals[0];
            totalsDiv.textContent = `Total Due: ${(mainTotal.amount / 100).toFixed(2)} ${mainTotal.currency}`;
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('checkout-message');
    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;

    // Construct shipping address block structure
    const shippingAddress = {
        fullName: document.getElementById('ship-fullname').value.trim(),
        line1: document.getElementById('ship-line1').value.trim(),
        city: document.getElementById('ship-city').value.trim(),
        postalCode: document.getElementById('ship-postalcode').value.trim(),
        country: document.getElementById('ship-country').value.trim()
    };

    const shipLine2 = document.getElementById('ship-line2').value.trim();
    const shipPhone = document.getElementById('ship-phone').value.trim();
    if (shipLine2 !== '') shippingAddress.line2 = shipLine2;
    if (shipPhone !== '') shippingAddress.phone = shipPhone;

    const purchaseType = document.getElementById('purchase-type').value;
    const invoiceRequested = document.getElementById('invoice-requested').checked || purchaseType === 'company';
    const billingSame = document.getElementById('billing-same-as-shipping').checked;

    // Assemble dynamic infrastructure object payloads matching endpoint constraints mapping
    const payload = {
        shippingAddress,
        purchaseType,
        invoice: {
            requested: invoiceRequested,
            billingAddressSameAsShipping: billingSame
        }
    };

    if (purchaseType === 'company') {
        payload.invoice.companyDetails = {
            companyName: document.getElementById('company-name').value.trim(),
            taxId: document.getElementById('company-taxid').value.trim()
        };
    }

    if (invoiceRequested && !billingSame) {
        payload.invoice.billingAddress = {
            fullName: document.getElementById('bill-fullname').value.trim(),
            line1: document.getElementById('bill-line1').value.trim(),
            city: document.getElementById('bill-city').value.trim(),
            postalCode: document.getElementById('bill-postalcode').value.trim(),
            country: document.getElementById('bill-country').value.trim()
        };
    }

    try {
        const response = await fetchWithAuth('/orders/checkout', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Checkout failed');
            throw new Error(errorMsg);
        }

        messageDiv.innerHTML = `<span style="color: green;">Order successfully initialized. Reference ID: ${data.order.id}</span>`;

        // Pass control sequence directly to mock payment visual component handler
        renderPaymentGatewayPanel(data.payment);

    } catch (error) {
        messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        submitBtn.disabled = false;
    }
}

function renderPaymentGatewayPanel(payment) {
    const panel = document.getElementById('checkout-form-panel');
    const amountFormatted = (payment.amount / 100).toFixed(2);

    panel.innerHTML = `
        <div style="border: 2px solid #ffc107; padding: 20px; background-color: #fffdf6; border-radius: 6px; margin-top: 10px;">
            <h3 style="color:#b58100; margin-top:0;">Mock Payment Gateway Simulation</h3>
            <p>Your order has been recorded. A transaction record under provider <code>${payment.provider}</code> is waiting for execution.</p>
            <p><b>Amount to Charge:</b> <code style="font-size:16px; font-weight:bold;">${amountFormatted} ${payment.currency}</code></p>
            <p style="font-size:13px; color:#666;">Payment Database Index ID: <code>${payment.id}</code></p>
            
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button id="mock-pay-success-btn" style="flex:1; padding:12px; background:#28a745; color:white; border:none; font-weight:bold; cursor:pointer; border-radius:4px;">
                    Simulate Payment Success (HTTP 201)
                </button>
                <button id="mock-pay-fail-btn" style="flex:1; padding:12px; background:#dc3545; color:white; border:none; font-weight:bold; cursor:pointer; border-radius:4px;">
                    Simulate Payment Failure
                </button>
            </div>
        </div>
    `;

    document.getElementById('mock-pay-success-btn').addEventListener('click', async () => {
        try {
            const res = await fetchWithAuth(`/payments/${payment.id}/mock-success`, { method: 'POST' });
            if (res.ok) {
                document.getElementById('checkout-message').innerHTML = '<span style="color:green; font-size:18px;">Payment successfully completed! Redirecting to orders profile history...</span>';
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('navRequested', { detail: { view: 'orders' } }));
                }, 2000);
            }
        } catch (err) {
            console.error(err);
        }
    });

    document.getElementById('mock-pay-fail-btn').addEventListener('click', async () => {
        try {
            const res = await fetchWithAuth(`/payments/${payment.id}/mock-failure`, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Simulated interface rejection session trigger' })
            });
            if (res.ok) {
                document.getElementById('checkout-message').innerHTML = '<span style="color:red; font-size:18px;">Transaction marked as FAILED. Check history for cancellation metrics log.</span>';
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('navRequested', { detail: { view: 'orders' } }));
                }, 2000);
            }
        } catch (err) {
            console.error(err);
        }
    });
}