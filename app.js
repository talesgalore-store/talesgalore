const SPACE_ID     = 'tx11zsju5n7c';
const ACCESS_TOKEN = '1gi_iikDoQygU8FDuM4__2GE6YWb4iJMrOYLUCsyviQ';

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
        const author = Array.isArray(rawAuthor) ? rawAuthor.join(', ') : rawAuthor;

        return {
          id:    item.sys.id,
          title: f.title || 'Untitled',
          author,
          price: parseFloat(f.price) || 0,
          image: imageUrl
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

  grid.innerHTML = books.map(b => `
    <a href="product.html?id=${b.id}&slug=${slugify(b.title)}" class="product-card">
      <div class="product-img-wrap">
        ${b.image
          ? `<img src="${b.image}" alt="${b.title}" loading="lazy"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:#F5EDD8;">📖</div>`}
      </div>
      <div class="product-info">
        <h3>${b.title}</h3>
        ${b.author ? `<p style="font-size:0.78rem;color:#888;margin-bottom:4px;">${b.author}</p>` : ''}
        <p class="product-price">₹ ${b.price.toFixed(2)}</p>
      </div>
    </a>
  `).join('');
}

loadHomeBooks();
