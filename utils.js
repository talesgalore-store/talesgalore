function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

async function addToCart(id) {
  let cart = getCart();

  // fetch ONLY this product if needed
  const books = window.__BOOKS__ || [];

  let book = books.find(b => b.id === id);

  // fallback: if book not loaded, allow safe add
  if (!book) {
    cart.push({ id, qty: 1 });
    saveCart(cart);
    return;
  }

  let item = cart.find(p => p.id === id);

  if (item) {
    if (item.qty >= book.stockCount) {
      alert("Maximum stock reached");
      return;
    }
    item.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveCart(cart);
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(p => p.id !== id);
  saveCart(cart);
}

function increaseQty(id) {
  let cart = getCart();
  const books = window.__BOOKS__;
  const book = books.find(b => b.id === id);

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
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
