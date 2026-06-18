/* =========================================
   TALESGALORE — Shop Page Script
   Filtering, sorting, URL param support
   ========================================= */

let allBooks = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadAllBooks();
  readUrlParams();
  attachFilterListeners();
});

async function loadAllBooks() {
  const grid = document.getElementById('productsGrid');
  try {
    const books = await fetchBooks({ limit: 200, order: '-sys.createdAt' });
    allBooks = books;
    window._allBooks = books;
    renderBooks(books);
  } catch (err) {
    console.error(err);
    showError('productsGrid', 'Could not load books. Please refresh the page.');
  }
}

function renderBooks(books) {
  const grid    = document.getElementById('productsGrid');
  const counter = document.getElementById('resultCount');

  if (!books.length) {
    grid.innerHTML    = '<p style="color:#4A4A46;padding:48px 0;grid-column:1/-1;">No books match your filters. Try clearing them!</p>';
    counter.textContent = '0 books';
    return;
  }

  grid.innerHTML      = books.map(buildProductCard).join('');
  counter.textContent = `${books.length} book${books.length !== 1 ? 's' : ''}`;
}

function getActiveFilters() {
  const age       = document.querySelector('input[name="age"]:checked')?.value       || '';
  const genre     = document.querySelector('input[name="genre"]:checked')?.value     || '';
  const condition = document.querySelector('input[name="condition"]:checked')?.value || '';
  return { age, genre, condition };
}

function applyFilters() {
  const { age, genre, condition } = getActiveFilters();
  let filtered = allBooks.filter(b => {
    if (age       && b.ageGroup   !== age)       return false;
    if (genre     && b.genre      !== genre)     return false;
    if (condition && b.condition  !== condition) return false;
    return true;
  });

  filtered = sortBooks(filtered);
  renderBooks(filtered);
  updateShopTitle(age, genre);
}

function sortBooks(books) {
  const sort = document.getElementById('sortSelect')?.value || 'newest';
  return [...books].sort((a, b) => {
    if (sort === 'newest')     return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === 'price-asc')  return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'title')      return a.title.localeCompare(b.title);
    return 0;
  });
}

function sortProducts() { applyFilters(); }

function clearFilters() {
  document.querySelectorAll('input[name="age"]')[0].checked       = true;
  document.querySelectorAll('input[name="genre"]')[0].checked     = true;
  document.querySelectorAll('input[name="condition"]')[0].checked = true;
  applyFilters();
}

function attachFilterListeners() {
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', applyFilters);
  });
}

function updateShopTitle(age, genre) {
  const title    = document.getElementById('shopTitle');
  const subtitle = document.getElementById('shopSubtitle');
  if (!title) return;

  if (age) {
    title.textContent    = `Ages ${age}`;
    subtitle.textContent = `Books for children aged ${age}`;
  } else if (genre) {
    title.textContent    = genre;
    subtitle.textContent = `All ${genre} books`;
  } else {
    title.textContent    = 'All Books';
    subtitle.textContent = 'Browse our full collection of pre-loved children\'s books';
  }
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const age    = params.get('age');
  const genre  = params.get('genre');

  if (age) {
    const radio = document.querySelector(`input[name="age"][value="${age}"]`);
    if (radio) radio.checked = true;
  }
  if (genre) {
    const radio = document.querySelector(`input[name="genre"][value="${genre}"]`);
    if (radio) radio.checked = true;
  }

  if (age || genre) applyFilters();
}
