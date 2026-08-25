/* =========================================
   TALESGALORE — Cart Page Renderer
   Page-specific logic for cart.html only.
   Depends on utils.js for getCart/saveCart/addToCart/
   increaseQty/decreaseQty/getCartTotalWeight/etc. —
   utils.js must be loaded BEFORE this file on any page
   that uses it.
   ========================================= */

const SPACE_ID = 'tx11zsju5n7c';
const ACCESS_TOKEN = '1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ';

async function fetchBooks() {
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=book&access_token=${ACCESS_TOKEN}&include=1`
  );
  const data = await res.json();
  const assets = {};
  (data.includes?.Asset || []).forEach(a => {
    assets[a.sys.id] = 'https:' + a.fields.file.url;
  });
  return (data.items || []).map(item => {
    const f = item.fields;
    const img = f.coverImage?.sys?.id
      ? assets[f.coverImage.sys.id]
      : null;
    return {
      id: item.sys.id,
      title: f.title,
      price: f.price,
      image: img
    };
  });
}

async function renderCart() {
  const raw = getCart();
  // Filter corrupted entries for display only — don't save back
  const cartItems = raw.filter(item => item.id);

  const container = document.getElementById('cartItems');
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty</h3>
        <a href="shop.html">Browse books</a>
      </div>
    `;
    const summary = document.getElementById('cartSummary');
    if (summary) summary.style.display = 'none';
    return;
  }

  container.innerHTML = cartItems.map(item => `
    <div class="cart-item">

      <div class="cart-img">
        ${item.image
          ? `<img src="${item.image}" alt="${item.title}">`
          : '📖'}
      </div>

      <div class="cart-item-info">
        <h3 class="cart-item-title">${item.title}</h3>
        <p class="cart-item-author">${item.author || ''}</p>
        <p class="cart-item-price">₹${item.price}</p>
      </div>

      <div class="cart-item-actions-col">
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="decreaseQty('${item.id}'); renderCart()">−</button>
          <span class="qty-display">${item.qty || 1}</span>
          <button class="qty-btn" onclick="increaseQty('${item.id}'); renderCart()">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
      </div>

    </div>
  `).join('');

  // Multiplies by quantity — matches getCartTotal() in utils.js
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.qty || 1),
    0
  );

  document.getElementById('cartSubtotal').textContent = `₹${subtotal}`;
  document.getElementById('cartTotal').textContent = `₹${subtotal}`;
  document.getElementById('cartSummary').style.display = 'block';

  // Display total parcel weight — grams under 1000, kg (2dp) above that
  const weightEl = document.getElementById('cartWeight');
  if (weightEl) {
    const totalGrams = getCartTotalWeight();
    weightEl.textContent = totalGrams >= 1000
      ? `${(totalGrams / 1000).toFixed(2)} kg`
      : `${totalGrams} g`;
  }

  if (typeof updateShipping === 'function') updateShipping();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartItems')) {
    renderCart();
  }
});
