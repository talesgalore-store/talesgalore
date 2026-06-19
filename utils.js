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

  const book = window._allBooks?.find(b => b.id === id);

  console.log("BOOK:", book);

  if (!book) {
    console.error("Book not found in _allBooks");
    return;
  }

  let cart = getCart();

  let item = cart.find(p => p.id === id);

  const currentQty = item ? item.qty : 0;

  console.log("CURRENT QTY:", currentQty);
  console.log("STOCK COUNT:", book.stockCount);

  if (currentQty >= book.stockCount) {
    alert("Maximum count reached");
    return;
  }

  if (item) {
    item.qty += 1;
  } else {
    cart.push({
      id,
      qty: 1
    });
  }

  saveCart(cart);

  console.log("CART SAVED:", cart);
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
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
