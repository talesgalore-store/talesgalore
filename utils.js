function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
  const book = window._allBooks?.find(b => b.id === id);
  if (!book) { console.error("Book not found:", id); return; }

  let cart = getCart();
  let item = cart.find(p => p.id === id);
  const currentQty = item ? item.qty : 0;

  if (currentQty >= book.stockCount) {
    alert("Maximum count reached");
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

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});
