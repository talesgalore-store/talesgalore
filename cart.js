/* =========================================
   TALESGALORE — Cart Manager
   Stores cart in localStorage
   ========================================= */

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
  const container = document.getElementById('cartItems');
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
    
    <a href="product.html?id=${item.id}" style="display:flex;gap:12px;text-decoration:none;color:inherit;align-items:center;">
      
      <img 
        src="${item.image}" 
        width="80" 
        style="border-radius:6px;object-fit:cover;"
      />

      <div>
        <h3 style="margin:0;font-size:15px;">
          ${item.title}
        </h3>

        <p style="margin:4px 0 0;color:#777;">
          ₹${item.price}
        </p>
      </div>

    </a>

    <button 
      onclick="removeFromCart('${item.id}')" 
      style="margin-top:8px;background:#c4622d;color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;"
    >
      Remove
    </button>

  </div>
`).join('');

  document.getElementById('cartSubtotal').textContent = '₹' + getCartTotal();
  document.getElementById('cartTotal').textContent = '₹' + getCartTotal();
}

document.addEventListener("DOMContentLoaded", renderCart);
