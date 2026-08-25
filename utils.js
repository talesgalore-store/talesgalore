/* =========================================
   TALESGALORE — Cart, Wishlist & Shared UI Helpers
   Single source of truth for cart/wishlist logic.
   Loaded on every page. cart.js (page-specific rendering
   for cart.html) depends on everything defined here.
   ========================================= */

const CART_KEY = 'cart';
const WISHLIST_KEY = 'wishlist';

/* ── Cart storage ── */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function getCartTotal() {
  return getCart().reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.qty || 1),
    0
  );
}

function getCartTotalWeight() {
  return getCart().reduce(
    (sum, item) => sum + (Number(item.weight) || 0) * (item.qty || 1),
    0
  );
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = count;
  });
}

/* ── Add / remove / adjust ──
   addToCart accepts either a book id (string, looked up in
   window._allBooks) or a full book object directly. If the book
   is already in the cart, its quantity is increased instead of
   showing a duplicate line — respecting stockCount as a ceiling. */
function addToCart(idOrBook, event) {
  let book;
  if (typeof idOrBook === 'object') {
    book = idOrBook;
  } else {
    book = window._allBooks ? window._allBooks.find(b => b.id === idOrBook) : null;
  }

  if (!book) { console.error('addToCart: book not found', idOrBook); return; }

  const cart = getCart();
  const existing = cart.find(item => item.id === book.id);
  const stockLimit = book.stockCount || 99;

  if (existing) {
    if (existing.qty >= stockLimit) {
      alert('Maximum stock reached');
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({
      id:         book.id,
      title:      book.title,
      author:     book.author || '',
      price:      Number(book.price),
      condition:  book.condition || '',
      image:      book.image || '',
      weight:     Number(book.weightGrams || book.weight) || 0,
      stockCount: stockLimit,
      qty:        1
    });
  }

  saveCart(cart);

  // Visual feedback on the clicked button, if available
  if (event && event.target) {
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('added');
    }, 1500);
  }

  showToast(`"${book.title}" added to cart`);
}

function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

function increaseQty(id) {
  const book = (window._allBooks || []).find(b => b.id === id);
  const cart = getCart();
  const item = cart.find(p => p.id === id);
  if (!item) return;

  const stockLimit = (book && book.stockCount) || item.stockCount || 99;
  if (item.qty >= stockLimit) {
    alert('Maximum stock reached');
    return;
  }

  item.qty += 1;
  saveCart(cart);
}

function decreaseQty(id) {
  const cart = getCart();
  const item = cart.find(p => p.id === id);
  if (!item) return;

  item.qty -= 1;
  const next = item.qty <= 0 ? cart.filter(p => p.id !== id) : cart;
  saveCart(next);
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

/* ── Wishlist ── */
function getWishlist() {
  return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
}

function saveWishlist(wishlist) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  updateWishlistCount();
}

function addToWishlist(id) {
  const cart = getCart();
  const item = cart.find(p => p.id === id);
  if (!item) return;

  const wishlist = getWishlist();
  if (wishlist.find(p => p.id === id)) {
    // Already in wishlist — just remove it from the cart
    removeFromCart(id);
    return;
  }

  wishlist.push({ ...item });
  saveWishlist(wishlist);
  removeFromCart(id);
}

function removeFromWishlist(id) {
  const wishlist = getWishlist().filter(p => p.id !== id);
  saveWishlist(wishlist);
  if (typeof renderWishlist === 'function') renderWishlist();
}

function moveToCart(id) {
  const wishlist = getWishlist();
  const item = wishlist.find(p => p.id === id);
  if (!item) return;

  const cart = getCart();
  const existing = cart.find(p => p.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);

  removeFromWishlist(id);
}

function updateWishlistCount() {
  const count = getWishlist().length;
  document.querySelectorAll('#wishlistCount').forEach(el => {
    el.textContent = count;
  });
}

window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.moveToCart = moveToCart;

/* ── Toast notification ── */
function showToast(message) {
  const existing = document.querySelector('.tg-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'tg-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 90px; right: 28px;
    background: #1C1C1A; color: white;
    padding: 12px 20px; border-radius: 8px;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 9999; animation: fadeInUp 0.25s ease;
  `;

  if (!document.getElementById('tg-toast-style')) {
    const style = document.createElement('style');
    style.id = 'tg-toast-style';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

/* ── Fly-to-cart animation ── */
function flyBookToCart(buttonEl) {
  const cartIcon = document.querySelector('.header-cart') || document.querySelector('a[href="cart.html"]');
  if (!buttonEl || !cartIcon) return;

  const btnRect  = buttonEl.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  const el = document.createElement('div');
  el.classList.add('fly-to-cart');
  el.textContent = '📖';
  el.style.left = btnRect.left + btnRect.width / 2 + 'px';
  el.style.top  = btnRect.top  + btnRect.height / 2 + 'px';
  el.style.animation = 'none';
  document.body.appendChild(el);

  const deltaX = cartRect.left - btnRect.left;
  const deltaY = cartRect.top  - btnRect.top;

  el.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(${deltaX * 0.4}px, ${deltaY * 0.2}px) scale(1.3) rotate(-20deg)`, opacity: 1, offset: 0.4 },
    { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2) rotate(20deg)`, opacity: 0 }
  ], {
    duration: 700,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fill: 'forwards'
  }).onfinish = () => el.remove();
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateWishlistCount();
});
