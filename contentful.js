/* =========================================
   TALESGALORE — Contentful API Helper
   Fetches books from Contentful CMS
   ========================================= */

const CONTENTFUL_SPACE    = 'tx11zsju5n7c';
const CONTENTFUL_TOKEN    = '1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ';
const CONTENTFUL_BASE_URL = `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE}`;

/**
 * Fetch entries from Contentful with optional filters
 * @param {object} params - Query params to append
 * @returns {Promise<Array>} - Normalised book array
 */
async function fetchBooks(params = {}) {
  const query = new URLSearchParams({
    content_type: 'book',
    access_token: CONTENTFUL_TOKEN,
    ...params
  });

  const res = await fetch(`${CONTENTFUL_BASE_URL}/entries?${query}`);
  if (!res.ok) throw new Error(`Contentful error: ${res.status}`);
  const data = await res.json();
  return normaliseBooks(data);
}

/**
 * Normalise raw Contentful response into clean book objects
 */
function normaliseBooks(data) {
  const assets = {};
  if (data.includes && data.includes.Asset) {
    data.includes.Asset.forEach(a => {
      assets[a.sys.id] = 'https:' + a.fields.file.url;
    });
  }

  return (data.items || []).map(item => {
    const f = item.fields;
    const imageRef = f.coverImage && f.coverImage.sys && f.coverImage.sys.id;
    return {
      id:          item.sys.id,
      title:       f.title       || 'Untitled',
      author:      f.author      || '',
      price:       f.price       || 0,
      condition:   f.condition   || '',
      ageGroup:    f.ageGroup    || '',
      genre:       f.genre       || '',
      description: f.description || '',
      inStock:     f.inStock !== false,
      image:       imageRef ? assets[imageRef] : null,
      createdAt:   item.sys.createdAt
    };
  });
}

/**
 * Build a product card HTML string
 */
function buildProductCard(book) {
  const imageHtml = book.image
    ? `<img src="${book.image}" alt="${book.title}" loading="lazy" />`
    : `<div class="product-image-placeholder">📖</div>`;

  const actionHtml = book.inStock
    ? `<button class="add-to-cart" onclick="addToCart('${book.id}', event)" data-id="${book.id}">Add to Cart</button>`
    : `<div class="sold-out-badge">Sold</div>`;

  return `
    <div class="product-card" data-id="${book.id}">
      <div class="product-image">
        ${imageHtml}
        ${book.inStock ? `<span class="product-badge">${book.condition}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-meta">
          ${book.ageGroup ? `<span class="product-tag">${book.ageGroup}</span>` : ''}
          ${book.genre    ? `<span class="product-tag">${book.genre}</span>`    : ''}
        </div>
        <div class="product-title">${book.title}</div>
        <div class="product-author">${book.author}</div>
        <div class="product-footer">
          <span class="product-price">₹${book.price}</span>
          <span class="product-condition">${book.condition}</span>
        </div>
        ${actionHtml}
      </div>
    </div>`;
}

/**
 * Show error state in a container
 */
function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<p style="color:#C4622D;padding:32px 0;">${message}</p>`;
}
