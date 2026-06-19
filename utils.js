function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
  let cart = getCart();

  if (cart.includes(id)) {
    alert("Maximum count reached");
    return;
  }

  cart.push(id);
  saveCart(cart);
  alert("Added to cart 🛒");
}
