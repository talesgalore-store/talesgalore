/* =========================================
   TALESGALORE — Homepage Script
   Loads latest 8 arrivals
   ========================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('latestProducts');
  try {
    const books = await fetchBooks({ order: '-sys.createdAt', limit: 8 });
    window._allBooks = books;

    if (!books.length) {
      container.innerHTML = '<p style="color:#4A4A46;padding:24px 0;">No books available right now. Check back soon!</p>';
      return;
    }

    container.innerHTML = books.map(buildProductCard).join('');
  } catch (err) {
    console.error(err);
    showError('latestProducts', 'Could not load books. Please refresh the page.');
  }
});

function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  input.value = '';
  showToast('Thanks for subscribing!');
}
