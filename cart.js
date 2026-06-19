/* =========================================
   TALESGALORE — Cart Manager
   Stores cart in localStorage
   ========================================= */
console.log("cart.js loaded on:", window.location.pathname);
const SPACE_ID = 'tx11zsju5n7c';
const ACCESS_TOKEN = '1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ';
const CART_KEY = 'talesgalore_cart';

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

function updateCartCount() {
  const count = getCart().length;
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = count;
  });
}

function addToCart(bookId, event) {
  // Fetch full book data from the page's loaded books
  const book = window._allBooks && window._allBooks.find(b => b.id === bookId);
  if (!book) return;

  const cart = getCart();
  // Each pre-loved book is unique — only one copy allowed
  if (cart.find(item => item.id === bookId)) {
    showToast('Already in your cart!');
    return;
  }

  cart.push({
    id:        book.id,
    title:     book.title,
    author:    book.author,
    price:     book.price,
    condition: book.condition,
    image:     book.image
  });
  saveCart(cart);

  // Visual feedback on the button
  if (event && event.target) {
    const btn = event.target;
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
      btn.classList.remove('added');
    }, 1500);
  }

  showToast(`"${book.title}" added to cart`);
}

function removeFromCart(bookId) {
  const cart = getCart().filter(item => item.id !== bookId);
  saveCart(cart);
  if (typeof renderCart === 'function') renderCart();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price, 0);
}

// Toast notification
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

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Initialise count on every page
document.addEventListener('DOMContentLoaded', updateCartCount);

function renderCart() {
  const books = await fetchBooks();
  window.__BOOKS__ = books; // 👈 ADD HERE
  const container = document.getElementById("cartItems");

  if (!container) {
    console.error("cartItems div not found in HTML");
    return;
  }
  const summary = document.getElementById('cartSummary');
  const cart = getCart();

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    summary.style.display = "none";
    return;
  }

  summary.style.display = "block";

container.innerHTML = cart.map(item => `
  <div class="cart-item">
    <a href="product.html?id=${item.id}" class="cart-item-link">
      <img src="${item.image}" width="80" />
      <div class="cart-item-info">
        <div class="cart-img">
          ${item.image ? `<img src="${item.image}" />` : '📖'}
        </div>
        <h3>${item.title}</h3>
        <p>₹${item.price}</p>
      </div>
    </a>
<div class="qty-controls">
  <button onclick="decreaseQty('${item.id}')">−</button>
  <span>${item.qty}</span>
  <button onclick="increaseQty('${item.id}')">+</button>
</div>
  </div>
`).join('');

  document.getElementById('cartSubtotal').textContent = '₹' + getCartTotal();
  document.getElementById('cartTotal').textContent = '₹' + getCartTotal();
}

document.addEventListener("DOMContentLoaded", renderCart);

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
  console.log("PAGE CHECK:", window.location.pathname);
console.log("cartItems:", document.getElementById("cartItems"));
  const cartIds = getCart();
  const books = await fetchBooks();

  const cartItems = cartIds.map(id =>
    books.find(b => b.id === id)
  ).filter(Boolean);

  const container = document.getElementById("cartItems");
  container.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <div class="cart-img">
        ${item.image ? `<img src="${item.image}" />` : '📖'}
      </div>
      <div>
        <h3>${item.title}</h3>
        <p>₹${item.price}</p>
      </div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("cartItems");
  if (!container) {
    console.log("Cart page not detected — skipping cart render");
    return;
  }
  await renderCart();
});

if (!document.getElementById("cartItems")) {
  console.log("Not cart page — skipping cart.js");
} else {
  renderCart();
}
