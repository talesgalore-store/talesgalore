function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
 let book = window._allBooks?.find(b => b.id === id);
 console.log("BOOK STOCK COUNT:", book?.stockCount, "FULL BOOK:", book);
  if (!book) { console.error("Book not found:", id); return; }

  let cart = getCart();
  let item = cart.find(p => p.id === id);
  const currentQty = item ? item.qty : 0;

if (currentQty >= (book.stockCount || 1)) {
  alert("Maximum stock reached");
  return;
}

  if (item) {
    item.qty += 1;
  } else {
    cart.push({
      id:        book.id,
      title:     book.title,
      author:    book.author || '',
      price:     Number(book.price),
      condition: book.condition || '',
      image:     book.image || '',
      stockCount: book.stockCount, 
      qty:       1
    });
  }

  saveCart(cart);
  updateCartCount();
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(p => p.id !== id);
  saveCart(cart);
}

function increaseQty(id) {
  const book = (window._allBooks || window.__BOOKS__ || []).find(b => b.id === id);
  let cart = getCart();
  console.log("FOUND BOOK:", book);
  let item = cart.find(p => p.id === id);
  if (!item || !book) return;

  if (item.qty >= book.stockCount) {
    alert("Maximum stock reached");
    return;
  }

  item.qty += 1;
  saveCart(cart);
}

function decreaseQty(id) {
  let cart = getCart();

  let item = cart.find(p => p.id === id);
  if (!item) return;

  item.qty -= 1;

  if (item.qty <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  saveCart(cart);
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

function updateCartCount() {
  const cart = getCart();

  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  const badge = document.getElementById("cartCount");

  if (badge) {
    badge.textContent = count;
  }
}
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

const WISHLIST_KEY = 'wishlist';

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
    // Already in wishlist, just remove from cart
    removeFromCart(id);
    if (typeof renderCart === 'function') renderCart();
    return;
  }

  wishlist.push({ ...item });
  saveWishlist(wishlist);

  removeFromCart(id);
  if (typeof renderCart === 'function') renderCart();
}

function removeFromWishlist(id) {
  const wishlist = getWishlist().filter(p => p.id !== id);
  saveWishlist(wishlist);
}

function moveToCart(id) {
  const wishlist = getWishlist();
  const item = wishlist.find(p => p.id === id);
  if (!item) return;

  const cart = getCart();
  if (!cart.find(p => p.id === id)) {
    cart.push({ ...item, qty: 1 });
    saveCart(cart);
    updateCartCount();
  }

  removeFromWishlist(id);
  if (typeof renderWishlist === 'function') renderWishlist();
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

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateWishlistCount(); // add this line
});

function flyBookToCart(buttonEl) {
  const cart = document.querySelector('.header-cart') || document.querySelector('a[href="cart.html"]');
  if (!buttonEl || !cart) return;

  const btnRect  = buttonEl.getBoundingClientRect();
  const cartRect = cart.getBoundingClientRect();

  const el = document.createElement('div');
  el.classList.add('fly-to-cart');
  el.textContent = '📖';
  el.style.left = btnRect.left + btnRect.width / 2 + 'px';
  el.style.top  = btnRect.top  + btnRect.height / 2 + 'px';

  // Override animation to fly toward cart position
  el.style.animation = 'none';
  document.body.appendChild(el);

  const deltaX = cartRect.left - btnRect.left;
  const deltaY = cartRect.top  - btnRect.top;

  el.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0deg)',               opacity: 1 },
    { transform: `translate(${deltaX * 0.4}px, ${deltaY * 0.2}px) scale(1.3) rotate(-20deg)`, opacity: 1, offset: 0.4 },
    { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2) rotate(20deg)`, opacity: 0 }
  ], {
    duration: 700,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fill: 'forwards'
  }).onfinish = () => el.remove();
}
