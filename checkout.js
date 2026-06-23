/* =========================================
   TALESGALORE — Checkout + Razorpay
   Replace RAZORPAY_KEY_ID with your key
   ========================================= */

const RAZORPAY_KEY_ID = 'rzp_live_SUkydXEvJ1GdJV'; // 🔑 Replace this

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

window.updateShipping = function() {
  const state    = document.getElementById('deliveryState')?.value;
  const shipping = state ? (shippingRates[state] || 99) : 0;
  const subtotal = getCartTotal();
  const total    = subtotal + shipping;

  const shippingEl = document.getElementById('shippingCost');
  const totalEl    = document.getElementById('cartTotal');

  if (shippingEl) shippingEl.textContent = state ? `₹${shipping}` : '— Select state —';
  if (totalEl)    totalEl.textContent    = state ? `₹${total}`    : `₹${subtotal}`;
};
document.addEventListener('DOMContentLoaded', renderCart);

function renderCart() {
  const cart        = getCart();
  const itemsEl     = document.getElementById('cartItems');
  const summaryEl   = document.getElementById('cartSummary');
  const subtotalEl  = document.getElementById('cartSubtotal');
  const totalEl     = document.getElementById('cartTotal');

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any books yet.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top:20px;">Browse Books</a>
      </div>`;
    if (summaryEl) summaryEl.style.display = 'none';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      ${item.image
        ? `<img class="cart-item-image" src="${item.image}" alt="${item.title}" />`
        : `<div class="cart-item-image" style="display:flex;align-items:center;justify-content:center;font-size:40px;">📖</div>`}
<div class="cart-item-info">
        <div class="cart-item-title"><a href="product.html?id=${item.id}" style="color:inherit;text-decoration:none;">${item.title}</a></div>
       <div class="cart-item-author">
          ${(Array.isArray(item.author) ? item.author : (item.author ? [item.author] : []))
            .map(a => `<a href="shop.html?author=${encodeURIComponent(a)}"
                          style="color:#C8923A;text-decoration:none;"
                          onmouseover="this.style.textDecoration='underline'"
                          onmouseout="this.style.textDecoration='none'"
                       >${a}</a>`)
            .join(', ')}
        </div>
        <div class="cart-item-price">₹${item.price}</div>
        <div style="font-size:12px;color:#4A4A46;margin-top:4px;">${item.condition}</div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="decreaseQty('${item.id}'); renderCart()">−</button>
          <span class="qty-display">${item.qty || 1}</span>
          <button class="qty-btn" onclick="increaseQty('${item.id}'); renderCart()">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.id}'); renderCart()">Remove from Cart</button>
        <button class="wishlist-btn" onclick="addToWishlist('${item.id}'); renderCart()">♡ Save for Later</button>
      </div>
    </div>`).join('');

  const total = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = `₹${total}`;
  if (totalEl)    totalEl.textContent    = `₹${total}`;
  if (summaryEl)  summaryEl.style.display = 'block';
}

function initiatePayment() {
   // Check auth first
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  if (!user) {
    openAuthModal('signin');
    showToast('Please sign in to complete your purchase.');
    return;
  }
  const name    = document.getElementById('custName')?.value.trim();
  const email   = document.getElementById('custEmail')?.value.trim();
  const phone   = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();

  if (!name || !email || !phone || !address) {
    alert('Please fill in all your details before paying.');
    return;
  }

  const state    = document.getElementById('deliveryState')?.value;
  const shipping = shippingRates[state] || 0;
  const subtotal = getCartTotal();
  const total    = subtotal + shipping;

  if (!state) {
    alert('Please select your delivery state.');
    return;
  }

  if (!cart.length) {
    alert('Your cart is empty!');
    return;
  }

  const bookTitles = cart.map(b => b.title).join(', ');

  const options = {
    key:         RAZORPAY_KEY_ID,
    amount:      total * 100,       // Razorpay uses paise
    currency:    'INR',
    name:        'TalesGalore',
    description: `Books: ${bookTitles}`,
    image:       '/images/logo.png',
handler: function(response) {
      onPaymentSuccess(response, { name, email, phone, address, state, cart, total });
    },
    prefill: {
      name:    name,
      email:   email,
      contact: phone
    },
    notes: {
      delivery_address: address,
      books: bookTitles
    },
    theme: {
      color: '#5C7A5E'
    },
    modal: {
      ondismiss: function() {
        console.log('Payment cancelled by user');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    alert('Payment failed. Please try again.\nError: ' + response.error.description);
  });
  rzp.open();
}

function onPaymentSuccess(response, orderDetails) {
  sendOrderConfirmationEmail(response, orderDetails);
  clearCart();

  const container = document.querySelector('.container');
  container.innerHTML = `
    <div style="text-align:center;padding:80px 0;">
      <div style="font-size:72px;margin-bottom:24px;">🎉</div>
      <h1 style="font-family:'Playfair Display',serif;font-size:36px;margin-bottom:16px;">Order Confirmed!</h1>
      <p style="color:#4A4A46;font-size:18px;margin-bottom:8px;">Thank you, ${orderDetails.name}!</p>
      <p style="color:#4A4A46;margin-bottom:8px;">Payment ID: <strong>${response.razorpay_payment_id}</strong></p>
      <p style="color:#4A4A46;margin-bottom:8px;">A confirmation email has been sent to <strong>${orderDetails.email}</strong>.</p>
      <p style="color:#4A4A46;margin-bottom:32px;">We'll ship your books via India Post soon!</p>
      <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
    </div>`;
}

function sendOrderConfirmationEmail(response, orderDetails) {
  const orderItems = orderDetails.cart.map(item =>
    `${item.title} — ₹${item.price} x ${item.qty || 1}`
  ).join('\n');

  const subtotal = orderDetails.cart.reduce(
    (sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0
  );
  const shipping = orderDetails.total - subtotal;

  const templateParams = {
    to_email:         orderDetails.email,
    customer_name:    orderDetails.name,
    order_items:      orderItems,
    subtotal:         subtotal.toFixed(2),
    shipping:         shipping.toFixed(2),
    total:            orderDetails.total.toFixed(2),
    delivery_address: orderDetails.address,
    delivery_state:   orderDetails.state || '',
    payment_id:       response.razorpay_payment_id
  };

  emailjs.send('service_7bvqnof', 'template_7gm9ak5', templateParams)
    .then(() => console.log('Order confirmation email sent'))
    .catch(err => console.error('EmailJS error:', err));
}
