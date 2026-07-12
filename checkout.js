/* =========================================
   TALESGALORE — Checkout + Razorpay
   ========================================= */

const RAZORPAY_KEY_ID = 'rzp_live_SUkydXEvJ1GdJV';

const STORE_PICKUP_ADDRESS = 'TalesGalore, Sector 43, Noida, Uttar Pradesh';

const shippingRates = {
  "Andaman and Nicobar Islands": 99,
  "Andhra Pradesh": 99,
  "Arunachal Pradesh": 99,
  "Assam": 99,
  "Bihar": 99,
  "Chandigarh": 99,
  "Chhattisgarh": 99,
  "Dadra and Nagar Haveli and Daman and Diu": 99,
  "Delhi": 99,
  "Goa": 99,
  "Gujarat": 99,
  "Haryana": 99,
  "Himachal Pradesh": 99,
  "Jammu and Kashmir": 99,
  "Jharkhand": 99,
  "Karnataka": 99,
  "Kerala": 99,
  "Ladakh": 99,
  "Lakshadweep": 99,
  "Madhya Pradesh": 99,
  "Maharashtra": 99,
  "Manipur": 99,
  "Meghalaya": 99,
  "Mizoram": 99,
  "Nagaland": 99,
  "Odisha": 99,
  "Puducherry": 99,
  "Punjab": 99,
  "Rajasthan": 99,
  "Sikkim": 99,
  "Tamil Nadu": 99,
  "Telangana": 99,
  "Tripura": 99,
  "Uttar Pradesh": 99,
  "Uttarakhand": 99,
  "West Bengal": 99
};

/* ── Get the currently-selected delivery method ── */
function getDeliveryMethod() {
  const checked = document.querySelector('input[name="deliveryMethod"]:checked');
  return checked ? checked.value : 'ship';
}

/* ── Toggle UI when the person switches between Ship / Pick-up ── */
window.updateDeliveryMethod = function () {
  const method       = getDeliveryMethod();
  const isPickup      = method === 'pickup';

  const shipFields    = document.getElementById('shipToFields');
  const addressField  = document.getElementById('addressField');
  const pickupNote    = document.getElementById('pickupNote');
  const shipLabel     = document.getElementById('shipOptionLabel');
  const pickupLabel   = document.getElementById('pickupOptionLabel');
  const stateSelect   = document.getElementById('deliveryState');
  const addressInput  = document.getElementById('custAddress');

  if (shipFields)   shipFields.style.display   = isPickup ? 'none' : 'block';
  if (addressField) addressField.style.display = isPickup ? 'none' : 'block';
  if (pickupNote)    pickupNote.style.display    = isPickup ? 'block' : 'none';

  if (shipLabel)   shipLabel.classList.toggle('active', !isPickup);
  if (pickupLabel) pickupLabel.classList.toggle('active', isPickup);

  // Pick-up doesn't need a state or a typed address — relax the `required`
  // attributes so the browser doesn't block submission on hidden fields.
  if (stateSelect)  stateSelect.required  = !isPickup;
  if (addressInput) addressInput.required = !isPickup;

  updateShipping();
};

window.updateShipping = function () {
  const isPickup = getDeliveryMethod() === 'pickup';
  const subtotal = getCartTotal();

  const shippingEl = document.getElementById('shippingCost');
  const totalEl    = document.getElementById('cartTotal');

  if (isPickup) {
    if (shippingEl) shippingEl.textContent = 'Free (Store Pick-up)';
    if (totalEl)    totalEl.textContent    = `₹${subtotal}`;
    return;
  }

  const state    = document.getElementById('deliveryState')?.value;
  const shipping = state ? (shippingRates[state] || 99) : 0;
  const total    = subtotal + shipping;

  if (shippingEl) shippingEl.textContent = state ? `₹${shipping}` : '— Select state —';
  if (totalEl)    totalEl.textContent    = state ? `₹${total}`    : `₹${subtotal}`;
};

/* ── Build the compact "id:qty,id:qty" string the stock-decrement
     webhook (functions/stockDecrement.js) reads from payment notes ── */
function buildBookIdsNote(cart) {
  return cart
    .filter(item => item.id)
    .map(item => `${item.id}:${item.qty || 1}`)
    .join(',');
}

function initiatePayment() {
  // Check auth first
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  if (!user) {
    if (typeof openAuthModal === 'function') openAuthModal('signin');
    showToast('Please sign in to complete your purchase.');
    return;
  }

  const method  = getDeliveryMethod();
  const isPickup = method === 'pickup';

  const name    = document.getElementById('custName')?.value.trim();
  const email   = document.getElementById('custEmail')?.value.trim();
  const phone   = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();
  const state   = document.getElementById('deliveryState')?.value;

  if (!name || !email || !phone) {
    alert('Please fill in all your details before paying.');
    return;
  }

  if (!isPickup) {
    if (!address) {
      alert('Please fill in all your details before paying.');
      return;
    }
    if (!state) {
      alert('Please select your delivery state.');
      return;
    }
  }

  const cart = getCart();

  if (!cart.length) {
    alert('Your cart is empty!');
    return;
  }

  const shipping   = isPickup ? 0 : (shippingRates[state] || 99);
  const subtotal   = getCartTotal();
  const total      = subtotal + shipping;
  const bookTitles = cart.map(b => b.title).join(', ');
  const bookIdsNote = buildBookIdsNote(cart);

  const resolvedAddress = isPickup ? STORE_PICKUP_ADDRESS : address;
  const resolvedState   = isPickup ? 'Store Pick-up — Noida Sector 43' : state;

  const options = {
    key:         RAZORPAY_KEY_ID,
    amount:      total * 100,   // paise
    currency:    'INR',
    name:        'TalesGalore',
    description: `Books: ${bookTitles}`,
    image:       '/images/TalesGalore-logo.PNG',
    handler: function (response) {
      onPaymentSuccess(response, {
        name, email, phone,
        address: resolvedAddress,
        state:   resolvedState,
        deliveryMethod: method,
        cart, total
      });
    },
    prefill: {
      name:    name,
      email:   email,
      contact: phone
    },
    notes: {
      delivery_method:  isPickup ? 'Store Pick-up' : 'Shipping',
      delivery_address: resolvedAddress,
      books: bookTitles,
      // Read by functions/stockDecrement.js (Razorpay webhook) to know
      // exactly which Contentful entries to decrement, and by how much.
      book_ids: bookIdsNote
    },
    theme: {
      color: '#5C7A5E'
    },
    modal: {
      ondismiss: function () {
        console.log('Payment cancelled by user');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function (response) {
    alert('Payment failed. Please try again.\nError: ' + response.error.description);
  });
  rzp.open();
}

function onPaymentSuccess(response, orderDetails) {
  decrementStock(orderDetails.cart);  // ← add this
  sendOrderConfirmationEmail(response, orderDetails);
  sendAdminNotificationEmails(response, orderDetails);
  clearCart();

  // NOTE: Stock is now decremented server-side by the Razorpay webhook
  // (functions/stockDecrement.js) once payment.captured fires — not here.
  // This keeps stock accurate even if the customer closes this tab before
  // this function finishes running.

  const isPickup = orderDetails.deliveryMethod === 'pickup';

  const container = document.querySelector('.container');
  container.innerHTML = `
    <div style="text-align:center;padding:80px 0;">
      <div style="font-size:72px;margin-bottom:24px;">🎉</div>
      <h1 style="font-family:'Playfair Display',serif;font-size:36px;margin-bottom:16px;">Order Confirmed!</h1>
      <p style="color:#4A4A46;font-size:18px;margin-bottom:8px;">Thank you, ${orderDetails.name}!</p>
      <p style="color:#4A4A46;margin-bottom:8px;">Payment ID: <strong>${response.razorpay_payment_id}</strong></p>
      <p style="color:#4A4A46;margin-bottom:8px;">A confirmation email has been sent to <strong>${orderDetails.email}</strong>.</p>
      ${isPickup
        ? `<p style="color:#4A4A46;margin-bottom:32px;">We'll message you once your order is ready for pick-up at <strong>${STORE_PICKUP_ADDRESS}</strong>. No shipping charges apply!</p>`
        : `<p style="color:#4A4A46;margin-bottom:32px;">We'll ship your books via India Post soon!</p>`
      }
      <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
    </div>`;
}

function buildOrderEmailParams(response, orderDetails) {
  const orderItems = orderDetails.cart.map(item =>
    `${item.title} — ₹${item.price} x ${item.qty || 1}`
  ).join('\n');

  const subtotal = orderDetails.cart.reduce(
    (sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0
  );
  const shipping = orderDetails.total - subtotal;

  return {
    customer_name:    orderDetails.name,
    customer_email:   orderDetails.email,
    customer_phone:   orderDetails.phone,
    order_items:      orderItems,
    subtotal:         subtotal.toFixed(2),
    shipping:         shipping.toFixed(2),
    total:            orderDetails.total.toFixed(2),
    delivery_method:  orderDetails.deliveryMethod === 'pickup' ? 'Free Store Pick-up' : 'Shipping (India Post)',
    delivery_address: orderDetails.address,
    delivery_state:   orderDetails.state || '',
    payment_id:       response.razorpay_payment_id
  };
}

function sendOrderConfirmationEmail(response, orderDetails) {
  const templateParams = {
    to_email: orderDetails.email,
    ...buildOrderEmailParams(response, orderDetails)
  };

  emailjs.send('service_7bvqnof', 'template_7gm9ak5', templateParams)
    .then(() => console.log('Order confirmation email sent to customer'))
    .catch(err => console.error('EmailJS error (customer):', err));
}

/* ── Notify store admins on every order ──
   Sends the same order details (name, phone, address, items, total)
   to both admin inboxes. Uses the same template as the customer email —
   to_email is swapped per recipient since EmailJS sends to one address
   per call. ── */
function sendAdminNotificationEmails(response, orderDetails) {
  const ADMIN_EMAILS = [
    'support@talesgalore.com',
    'talesgalore.store@gmail.com'
  ];

  const baseParams = buildOrderEmailParams(response, orderDetails);

  ADMIN_EMAILS.forEach(adminEmail => {
    const templateParams = {
      to_email: adminEmail,
      ...baseParams
    };

    emailjs.send('service_7bvqnof', 'template_7gm9ak5', templateParams)
      .then(() => console.log(`Admin notification sent to ${adminEmail}`))
      .catch(err => console.error(`EmailJS error (admin: ${adminEmail}):`, err));
  });
}

const CONTENTFUL_MGMT_TOKEN = 'your-management-token-here';
const CONTENTFUL_SPACE      = 'tx11zsju5n7c';
const CONTENTFUL_ENV        = 'master';

async function decrementStock(cart) {
  for (const item of cart) {
    try {
      // 1. Fetch current entry
      const res = await fetch(
        `https://api.contentful.com/spaces/${CONTENTFUL_SPACE}/environments/${CONTENTFUL_ENV}/entries/${item.id}`,
        { headers: { Authorization: `Bearer ${CONTENTFUL_MGMT_TOKEN}` } }
      );
      const entry = await res.json();

      const currentStock = Number(entry.fields?.stockCount?.['en-US'] ?? 1);
      const qty          = item.qty || 1;
      const newStock     = Math.max(0, currentStock - qty);

      const updatedFields = {
        ...entry.fields,
        stockCount: { 'en-US': newStock },
      };

      // If sold out, flip inStock to false
      if (newStock === 0) {
        updatedFields.inStock = { 'en-US': false };
      }

      // 2. Update entry (creates draft)
      const putRes = await fetch(
        `https://api.contentful.com/spaces/${CONTENTFUL_SPACE}/environments/${CONTENTFUL_ENV}/entries/${item.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization:          `Bearer ${CONTENTFUL_MGMT_TOKEN}`,
            'Content-Type':         'application/vnd.contentful.management.v1+json',
            'X-Contentful-Version': String(entry.sys.version),
          },
          body: JSON.stringify({ fields: updatedFields }),
        }
      );
      const updated = await putRes.json();

      // 3. Publish so it goes live immediately
      await fetch(
        `https://api.contentful.com/spaces/${CONTENTFUL_SPACE}/environments/${CONTENTFUL_ENV}/entries/${item.id}/published`,
        {
          method: 'PUT',
          headers: {
            Authorization:          `Bearer ${CONTENTFUL_MGMT_TOKEN}`,
            'X-Contentful-Version': String(updated.sys.version),
          },
        }
      );

      console.log(`Stock updated: ${item.title} → ${newStock} remaining`);

    } catch (err) {
      console.error(`Failed to decrement stock for ${item.id}:`, err);
    }
  }
}
