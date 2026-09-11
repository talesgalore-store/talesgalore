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
      image: img,
      // Live stock, as it stands right now in Contentful — used to
      // reconcile against whatever stockCount was cached on the cart
      // item at the time it was added.
      stockCount: parseInt(f.stockCount) || 0
    };
  });
}

// Mirrors the slugify() in product.html — used only to make cart → product
// links a little more readable; product.html ignores the slug param anyway
// and looks the book up purely by ?id=.
function slugify(title) {
  return (title || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/* Cross-checks every cart line against the live Contentful stock count.
   - If a book was deleted entirely, or its stock has dropped to 0,
     the line is flagged outOfStock (kept visible so the customer can
     see + remove it, but excluded from totals/shipping/payment).
   - If stock dropped but is still >0, quantity is clamped down to
     whatever's actually available, so nobody gets charged/shipped for
     more copies than exist.
   Returns true if anything changed, so the caller knows whether to
   persist + show a heads-up. */
function reconcileStock(cart, liveBooksById) {
  let changed = false;

  cart.forEach(item => {
    const live = liveBooksById.get(item.id);
    const liveStock = live ? live.stockCount : 0;

    const wasOutOfStock = !!item.outOfStock;
    item.outOfStock = liveStock <= 0;
    if (item.outOfStock !== wasOutOfStock) changed = true;

    if (item.stockCount !== liveStock) {
      item.stockCount = liveStock;
      changed = true;
    }

    if (!item.outOfStock && (item.qty || 1) > liveStock) {
      item.qty = liveStock;
      changed = true;
    }
  });

  return changed;
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

  // Check live stock before rendering so quantities/badges are accurate.
  // If the stock check fails for any reason (offline, API hiccup), fall
  // back to whatever was already cached on the cart items rather than
  // blocking the page.
  let stockChanged = false;
  try {
    const liveBooks = await fetchBooks();
    const liveBooksById = new Map(liveBooks.map(b => [b.id, b]));
    stockChanged = reconcileStock(cartItems, liveBooksById);
    if (stockChanged) saveCart(getCart().filter(item => item.id));
  } catch (err) {
    console.warn('Stock check failed, showing cached cart data:', err);
  }

  container.innerHTML = cartItems.map(item => {
    const oos = !!item.outOfStock;
    const link = `product.html?id=${item.id}&slug=${slugify(item.title)}`;

    return `
    <div class="cart-item${oos ? ' cart-item-oos' : ''}" ${oos ? 'style="opacity:0.6;"' : ''}>

      <a href="${link}" class="cart-img" style="display:block;">
        ${item.image
          ? `<img src="${item.image}" alt="${item.title}">`
          : '📖'}
      </a>

      <div class="cart-item-info">
        <h3 class="cart-item-title">
          <a href="${link}" style="color:inherit;text-decoration:none;">${item.title}</a>
        </h3>
        <p class="cart-item-author">${item.author || ''}</p>
        <p class="cart-item-price">₹${item.price}</p>
        ${oos
          ? `<p class="cart-item-oos-note" style="color:#C4622D;font-weight:700;font-size:12.5px;margin-top:4px;">
               Out of stock — please remove this item to check out
             </p>`
          : ''}
      </div>

      <div class="cart-item-actions-col">
        <div class="cart-qty-controls">
          <button class="qty-btn" ${oos ? 'disabled' : ''} onclick="decreaseQty('${item.id}'); renderCart()">−</button>
          <span class="qty-display">${item.qty || 1}</span>
          <button class="qty-btn" ${oos ? 'disabled' : ''} onclick="increaseQty('${item.id}'); renderCart()">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
      </div>

    </div>
  `;
  }).join('');

  // Multiplies by quantity — matches getCartTotal() in utils.js.
  // Out-of-stock items are excluded, same as getCartTotal() does.
  const subtotal = cartItems
    .filter(item => !item.outOfStock)
    .reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 1), 0);

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

  if (stockChanged) {
    showToast('Some items in your cart changed availability — please review before checkout.');
  }

  if (typeof updateShipping === 'function') updateShipping();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartItems')) {
    renderCart();
  }
});
