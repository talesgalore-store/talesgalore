/* =========================================
   TALESGALORE — Checkout + Razorpay
   Replace RAZORPAY_KEY_ID with your key
   ========================================= */

const RAZORPAY_KEY_ID = 'rzp_live_SUkydXEvJ1GdJV'; // 🔑 Replace this

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
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-author">${item.author}</div>
        <div class="cart-item-price">₹${item.price}</div>
        <div style="font-size:12px;color:#4A4A46;margin-top:4px;">${item.condition}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Remove">×</button>
    </div>`).join('');

  const total = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = `₹${total}`;
  if (totalEl)    totalEl.textContent    = `₹${total}`;
  if (summaryEl)  summaryEl.style.display = 'block';
}

function initiatePayment() {
  const name    = document.getElementById('custName')?.value.trim();
  const email   = document.getElementById('custEmail')?.value.trim();
  const phone   = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();

  if (!name || !email || !phone || !address) {
    alert('Please fill in all your details before paying.');
    return;
  }

  const cart  = getCart();
  const total = getCartTotal();

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
      onPaymentSuccess(response, { name, email, phone, address, cart, total });
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
  // Clear the cart
  clearCart();

  // Show confirmation
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div style="text-align:center;padding:80px 0;">
      <div style="font-size:72px;margin-bottom:24px;">🎉</div>
      <h1 style="font-family:'Playfair Display',serif;font-size:36px;margin-bottom:16px;">Order Confirmed!</h1>
      <p style="color:#4A4A46;font-size:18px;margin-bottom:8px;">Thank you, ${orderDetails.name}!</p>
      <p style="color:#4A4A46;margin-bottom:8px;">Payment ID: <strong>${response.razorpay_payment_id}</strong></p>
      <p style="color:#4A4A46;margin-bottom:32px;">We'll reach out to <strong>${orderDetails.email}</strong> shortly with your order details.</p>
      <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
    </div>`;
}
