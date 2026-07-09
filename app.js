const SPACE_ID     = 'tx11zsju5n7c';
const ACCESS_TOKEN = '1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ';

/* =========================================
   POPULAR TITLES MARQUEE
   ─────────────────────────────────────────
   Add or remove keywords below to control
   which books appear in this section.
   Matching is case-insensitive and checks
   title, author name, and publisher fields.
   ========================================= */
const POPULAR_KEYWORDS = [
  'Disney',
  'Julia Donaldson',
  'Harry Potter',
  'Miles Kelly',
  'Usborne',
  'Enid Blyton',
  'Horrid Henry',
  'David Walliams',
  'Roald Dahl',
];

function buildPopularMarquee(books) {
  const track = document.getElementById('popular-marquee');
  if (!track) return;

  const keywords = POPULAR_KEYWORDS.map(k => k.toLowerCase());

  const matches = books.filter(b => {
const haystack = [
  b.title,
  ...(Array.isArray(b.authorArray) ? b.authorArray : [b.author || '']),
  b.publisher || ''
].join(' ').toLowerCase();

    return keywords.some(k => haystack.includes(k));
  });

  if (!matches.length) {
    track.closest('section')?.remove();
    return;
  }

  // Duplicate for seamless infinite scroll (same as arrivals marquee)
  const all = [...matches, ...matches];

  track.innerHTML = all.map(b => `
    <a href="product.html?id=${b.id}&slug=${slugify(b.title)}" class="marquee-card">
      ${b.image
        ? `<img src="${b.image}" alt="${b.title}" loading="lazy"/>`
        : `<div class="marquee-card-placeholder">📖</div>`}
      <div class="marquee-card-info">
        <div class="marquee-card-title">${b.title}</div>
         ${b.author ? `<div class="marquee-card-author">${b.author}</div>` : ''}        <div class="marquee-card-price">₹${b.price}</div>
      </div>
    </a>
  `).join('');

  // Slightly offset animation so it doesn't sync with Latest Arrivals
  track.style.animationDuration = '44s';
}

function popularMarqueeScroll(dir) {
  const wrapper = document.querySelector('#popular-marquee')?.closest('.marquee-wrapper');
  if (wrapper) wrapper.scrollBy({ left: dir * 300, behavior: 'smooth' });
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadHomeBooks() {
  try {
    const res  = await fetch(
      `https://cdn.contentful.com/spaces/${SPACE_ID}/entries?content_type=book&limit=1000&access_token=${ACCESS_TOKEN}&include=1`
    );
    const data = await res.json();

    const assets = {};
    (data.includes?.Asset || []).forEach(a => {
      assets[a.sys.id] = 'https:' + a.fields.file.url;
    });

    const books = (data.items || [])
      .filter(item => item.fields.inStock !== false)
      .map(item => {
        const f = item.fields;

        const imgField = f.coverImage;
        let imageUrl = null;
        if (imgField?.sys?.id) {
          imageUrl = assets[imgField.sys.id] || null;
        } else if (Array.isArray(imgField)) {
          const first = imgField[0];
          if (first?.sys?.id) imageUrl = assets[first.sys.id] || null;
          else if (first?.fields?.file?.url) imageUrl = 'https:' + first.fields.file.url;
        } else if (imgField?.fields?.file?.url) {
          imageUrl = 'https:' + imgField.fields.file.url;
        }

        const rawAuthor = f.author || f.authorName || '';
        const authorArray = Array.isArray(rawAuthor) ? rawAuthor : (rawAuthor ? [rawAuthor] : []);
        const author = authorArray.join(', ');

        return {
          id:         item.sys.id,
          title:      f.title || 'Untitled',
          author,
          authorArray,
          price:      parseFloat(f.price) || 0,
          image:      imageUrl
        };
      });

const shuffled  = shuffle(books);
// Take up to 8 for featured first, then rest for marquee
const featured8 = shuffled.slice(0, Math.min(8, shuffled.length));
const remaining = shuffled.slice(featured8.length);

// For marquee, use remaining + loop back through all books if needed
let marqueeBooks = remaining.length >= 8 ? remaining.slice(0, 20) : shuffled.slice(0, 20);

renderMarquee(marqueeBooks);
renderFeatured(featured8);
buildPopularMarquee(books);

  } catch (e) {
    console.error('Failed to load books for homepage:', e);
  }
}

function renderMarquee(books) {
  const track = document.getElementById('arrivals-marquee');
  if (!track) return;

  // Duplicate for seamless infinite loop
  const items = [...books, ...books];
  track.innerHTML = items.map(b => `
    <a href="product.html?id=${b.id}&slug=${slugify(b.title)}" class="marquee-card">
      ${b.image
        ? `<img src="${b.image}" alt="${b.title}"/>`
        : `<div class="marquee-card-placeholder">📖</div>`}
      <div class="marquee-card-info">
        <div class="marquee-card-title">${b.title}</div>
        ${b.author ? `<div class="marquee-card-author">${b.author}</div>` : ''}
        <div class="marquee-card-price">₹${b.price}</div>
      </div>
    </a>
  `).join('');
}

function renderFeatured(books) {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  grid.innerHTML = books.map(b => {
    const safeId     = b.id;
    const safeTitle  = b.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeAuthor = (b.author || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeImage  = (b.image || '').replace(/'/g, "\\'");
    const safePrice  = b.price;

    return `
    <div class="product-card" onclick="window.location='product.html?id=${safeId}&slug=${slugify(b.title)}'" style="cursor:pointer;">
      <div class="product-img-wrap">
        ${b.image
          ? `<img src="${b.image}" alt="${b.title}" loading="lazy"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:#F5EDD8;">📖</div>`}
      </div>
      <div class="product-info">
        <h3>${b.title}</h3>
        ${b.authorArray && b.authorArray.length ? `<p style="font-size:0.78rem;color:#888;margin-bottom:4px;">
          ${b.authorArray.map(a =>
            `<a href="shop.html?author=${encodeURIComponent(a)}"
                onclick="event.stopPropagation()"
                style="color:#C8923A;text-decoration:none;"
                onmouseover="this.style.textDecoration='underline'"
                onmouseout="this.style.textDecoration='none'"
            >${a}</a>`
          ).join(', ')}
        </p>` : ''}
        <p class="product-price">₹ ${safePrice.toFixed(2)}</p>
        <button
          class="product-add-btn"
          onclick="event.stopPropagation(); handleAddToCart('${safeId}', '${safeTitle}', '${safeAuthor}', ${safePrice}, '${safeImage}', this);"
        >Add to Cart</button>
      </div>
    </div>`;
  }).join('');
}

loadHomeBooks();

let marqueeOffset = 0;
let isManual = false;
let manualTimeout;

function marqueeScroll(direction) {
  const track = document.getElementById('arrivals-marquee');
  if (!track) return;

  // Pause auto-scroll temporarily
  track.style.animationPlayState = 'paused';
  isManual = true;
  clearTimeout(manualTimeout);

  marqueeOffset += direction * 200;
  track.style.transform = `translateX(${-marqueeOffset}px)`;
  track.style.transition = 'transform 0.4s ease';

  // Resume auto-scroll after 3 seconds of inactivity
  manualTimeout = setTimeout(() => {
    track.style.transition = '';
    track.style.transform  = '';
    track.style.animationPlayState = 'running';
    marqueeOffset = 0;
  }, 3000);
}

window.handleAddToCart = function(id, title, author, price, image, btn) {
  addToCart({
    id:        id,
    title:     title,
    author:    author,
    price:     price,
    image:     image,
    condition: 'Good'
  });
  flyBookToCart(btn);
}
