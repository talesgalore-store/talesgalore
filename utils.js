function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
  console.log("ADD TO CART CALLED");
  console.log("ID:", id);
  console.log("_allBooks:", window._allBooks);
  let cart = getCart();

  let item = cart.find(p => p.id === id);

  if (item) {
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
