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
        <div class="cart-item-title"><a href="product.html?id=${item.id}" style="color:inherit;text-decoration:none;">${item.title}</a></div>
        <div class="cart-item-author">${Array.isArray(item.author) ? item.author.join(', ') : item.author}</div>
        <div class="cart-item-price">₹${item.price}</div>
        <div style="font-size:12px;color:#4A4A46;margin-top:4px;">${item.condition}</div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="decreaseQty('${item.id}'); renderCart()">−</button>
          <span class="qty-display">${item.qty || 1}</span>
          <button class="qty-btn" onclick="increaseQty('${item.id}'); renderCart()">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove from Cart</button>
        <button class="wishlist-btn" onclick="addToWishlist('${item.id}')">♡ Save for Later</button>
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

<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script>emailjs.init("ravklld-LaAz-FXZy");</script>
