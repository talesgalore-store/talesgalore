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
