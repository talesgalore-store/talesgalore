/* =========================================
   TALESGALORE — Cart Manager
   Stores cart in localStorage
   ========================================= */
console.log("cart.js loaded on:", window.location.pathname);
const SPACE_ID = 'tx11zsju5n7c';
const ACCESS_TOKEN = '1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ';
const CART_KEY = 'cart';

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
  const count = getCart().reduce(
    (sum, item) => sum + (item.qty || 1),
    0
  );

  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = count;
  });
}

function addToCart(bookData, event) {
  console.log("addToCart called with:", bookData); // add this
  let book;
  if (typeof bookData === 'string') {
    book = window._allBooks && window._allBooks.find(b => b.id === bookData);
  } else {
    book = bookData;
  }
  if (!book) { console.warn('addToCart: book not found', bookData); return; }

  const cart = getCart();
  if (cart.find(item => item.id === book.id)) {
    showToast('Already in your cart!');
    return;
  }

  cart.push({
    id:        book.id,
    title:     book.title,
    author:    book.author || '',
    price:     Number(book.price),
    condition: book.condition || '',
    image:     book.image || '',
    qty:       1
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
  const raw = getCart();
  // Filter corrupted entries for display only — don't save back
  const cartItems = raw.filter(item => item.id); // just check id exists
  
  const container = document.getElementById("cartItems");
  if (!container) return;

  if (cartItems.length === 0) {
     console.log("CART ITEMS:", cartItems);
    container.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty</h3>
        <a href="shop.html">Browse books</a>
      </div>
    `;
    return;
  }

container.innerHTML = cartItems.map(item => `
  <div class="cart-item">

    <div class="cart-img">
      ${item.image
        ? `<img src="${item.image}" alt="${item.title}">`
        : '📖'}
    </div>

    <div class="cart-details">
      <h3>${item.title}</h3>

      <p class="cart-author">
        ${item.author || ''}
      </p>

      <p class="cart-price">
        ₹${item.price}
      </p>

      <p class="cart-qty">
        Quantity: ${item.qty || 1}
      </p>

      <button onclick="removeFromCart('${item.id}')">
        Remove
      </button>
    </div>

  </div>
`).join('');

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  document.getElementById("cartSubtotal").textContent =
    `₹${subtotal}`;

  document.getElementById("cartTotal").textContent =
    `₹${subtotal}`;

  document.getElementById("cartSummary").style.display = "block";
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
