/* =========================================
   TALESGALORE — Checkout + Razorpay
   ========================================= */

const RAZORPAY_KEY_ID = 'rzp_live_SUkydXEvJ1GdJV';

const STORE_PICKUP_ADDRESS = 'TalesGalore, Sector 43, Noida, Uttar Pradesh';

/* ── India Post Parcel — Contractual Tariff (rates inclusive of GST) ──
   Each row: "up to `uptoGrams` grams costs this much" per zone.
   `within` = Uttar Pradesh (our home state)
   `zone`   = Uttarakhand
   `other`  = every other state/UT
   (The `local` column isn't used — we don't offer same-city rates
   separately from Store Pick-up.)
   NOTE: the source chart only lists milestone weights (it says the
   full chart runs in 500g/1kg slabs up to 35kg, but this table only
   has the values actually shown on the card). For a weight that falls
   between two listed brackets, this always rounds UP to the next known
   bracket — so it may occasionally overcharge slightly rather than
   ever undercharge. If you get the full granular chart later, just
   add the missing rows below and the lookup will automatically use
   the tighter brackets. */
const PARCEL_RATES = [
  { uptoGrams: 500,   local: 31,  within: 37,  zone: 40,   other: 41   },
  { uptoGrams: 1000,  local: 37,  within: 52,  zone: 61,   other: 67   },
  { uptoGrams: 1500,  local: 42,  within: 68,  zone: 82,   other: 94   },
  { uptoGrams: 2000,  local: 53,  within: 94,  zone: 118,  other: 135  },
  { uptoGrams: 3000,  local: 67,  within: 118, zone: 147,  other: 171  },
  { uptoGrams: 4000,  local: 81,  within: 142, zone: 178,  other: 207  },
  { uptoGrams: 5000,  local: 95,  within: 166, zone: 207,  other: 241  },
  { uptoGrams: 6000,  local: 109, within: 188, zone: 236,  other: 277  },
  { uptoGrams: 7000,  local: 123, within: 210, zone: 265,  other: 313  },
  { uptoGrams: 8000,  local: 137, within: 232, zone: 296,  other: 349  },
  { uptoGrams: 9000,  local: 160, within: 260, zone: 325,  other: 383  },
  { uptoGrams: 10000, local: 184, within: 284, zone: 354,  other: 419  },
  { uptoGrams: 12000, local: 220, within: 330, zone: 414,  other: 489  },
  { uptoGrams: 15000, local: 273, within: 402, zone: 501,  other: 595  },
  { uptoGrams: 20000, local: 362, within: 520, zone: 650,  other: 773  },
  { uptoGrams: 25000, local: 449, within: 638, zone: 797,  other: 949  },
  { uptoGrams: 30000, local: 538, within: 756, zone: 944,  other: 1127 },
  { uptoGrams: 35000, local: 627, within: 874, zone: 1091, other: 1303 }
];

const WITHIN_STATE_NAME = 'Uttar Pradesh';
const SAME_ZONE_STATES  = ['Uttarakhand'];

// PIN code prefixes that always count as "local" delivery,
// regardless of which state was selected — takes priority
// over the state-based zone below.
const LOCAL_PINCODE_PREFIXES = ['11', '12', '20'];

/* Maps a delivery state + PIN code to which rate-table column applies.
   PIN code is checked first: if it starts with one of the "local"
   prefixes, that wins outright. Otherwise falls back to the
   state-based zone (within / zone / other). */
function getShippingZone(state, pincode) {
  const pin = (pincode || '').trim();
  if (LOCAL_PINCODE_PREFIXES.some(prefix => pin.startsWith(prefix))) {
    return 'local';
  }
  if (state === WITHIN_STATE_NAME) return 'within';
  if (SAME_ZONE_STATES.includes(state)) return 'zone';
  return 'other';
}

/* Looks up the shipping cost for a given total weight (grams) and zone.
   Finds the first bracket whose ceiling covers the weight. If the order
   is heavier than the table's top bracket (35,000g), extrapolates
   using the per-gram rate implied by the last two known brackets
   (rather than assuming a fixed 1000g step, since this table's
   brackets aren't evenly spaced). */
function getShippingForWeight(grams, zoneKey) {
  const weight = Math.max(0, Number(grams) || 0);
  const row = PARCEL_RATES.find(r => weight <= r.uptoGrams);
  if (row) return row[zoneKey];

  const last        = PARCEL_RATES[PARCEL_RATES.length - 1];
  const secondLast   = PARCEL_RATES[PARCEL_RATES.length - 2];
  const weightDiff   = last.uptoGrams - secondLast.uptoGrams;
  const rateDiff     = last[zoneKey] - secondLast[zoneKey];
  const ratePerGram  = rateDiff / weightDiff;
  const extraGrams   = weight - last.uptoGrams;
  return Math.ceil(last[zoneKey] + ratePerGram * extraGrams);
}

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

  const state       = document.getElementById('deliveryState')?.value;
  const totalWeight = typeof getCartTotalWeight === 'function' ? getCartTotalWeight() : 0;
  const shipping    = state ? getShippingForWeight(totalWeight, getZoneForState(state)) : 0;
  const total       = subtotal + shipping;

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

  if (!name) {
    alert('Please enter your full name.');
    return;
  }

  if (!email) {
    alert('Please enter your email address.');
    return;
  }

  if (!phone) {
    alert('Please enter your phone number.');
    document.getElementById('custPhone')?.focus();
    return;
  }

  // Phone must look like a real 10-digit Indian mobile number
  // (optionally with a +91 / 91 / 0 prefix) — not just any non-empty text.
  const digitsOnly   = phone.replace(/\D/g, '');
  const phoneDigits  = digitsOnly.replace(/^(91|0)/, '');
  const isValidPhone = /^[6-9]\d{9}$/.test(phoneDigits);

  if (!isValidPhone) {
    alert('Please enter a valid 10-digit phone number.');
    document.getElementById('custPhone')?.focus();
    return;
  }

  if (!isPickup) {
    if (!address) {
      alert('Please fill in your delivery address.');
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

  const totalWeight = typeof getCartTotalWeight === 'function' ? getCartTotalWeight() : 0;
  const shipping     = isPickup ? 0 : getShippingForWeight(totalWeight, getZoneForState(state));
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
  sendOrderConfirmationEmail(response, orderDetails);
  sendAdminNotificationEmails(response, orderDetails);
  clearCart();

  // Stock is decremented server-side by the Razorpay webhook
  // (functions/stockDecrement.js) once payment.captured fires.
  // Do NOT add any Contentful Management API calls to this file — it runs
  // in the customer's browser, so a Management token placed here would be
  // visible to anyone via view-source / browser dev tools.

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
