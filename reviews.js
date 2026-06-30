/* =========================================
   TALESGALORE — Store Reviews
   Firebase Firestore (CDN, no bundler)
   Photo upload removed for now — Spark (free) plan only
   ========================================= */

import { initializeApp, getApps, getApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc,
         query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Same Firebase project as auth.js — reuse the existing app instead of
// initializing a second one (which throws app/duplicate-app and silently
// kills this whole module, including the star picker).
const firebaseConfig = {
  apiKey:            "AIzaSyDhBOGaJKp6tb0B495p0BnCwcNCvTafRDs",
  authDomain:        "talesgalore-fb431.firebaseapp.com",
  projectId:         "talesgalore-fb431",
  storageBucket:     "talesgalore-fb431.firebasestorage.app",
  messagingSenderId: "772991771036",
  appId:             "1:772991771036:web:b85c2ef90a7eb36e2c6859",
  measurementId:     "G-ED7Y5BN84J"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ── ADMIN CONFIG ──────────────────────────────────────────
   Add the email address(es) allowed to delete reviews.
   This checks against window.getCurrentUser().email,
   which comes from your existing auth.js.
   ──────────────────────────────────────────────────────── */
const ADMIN_EMAILS = [
  'you@talesgalore.com' // 🔑 replace with your actual admin email(s)
];

function isAdmin() {
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  return !!user && ADMIN_EMAILS.includes(user.email);
}

/* ── Helpers ── */
function starsHTML(rating, size = '1rem') {
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? '#C8923A' : '#DDD8CF'};font-size:${size};">★</span>`
  ).join('');
}

function formatDate(ts) {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── Load all reviews (reviews page) ── */
export async function loadAllReviews() {
  const container = document.getElementById('reviews-list');
  const countEl   = document.getElementById('reviews-count');
  const avgEl     = document.getElementById('reviews-avg');
  if (!container) return;

  container.innerHTML = `<p class="reviews-loading">Loading reviews…</p>`;

  try {
    const q    = query(collection(db, 'store-reviews'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<p class="reviews-empty">No reviews yet — be the first to share your experience!</p>`;
      if (countEl) countEl.textContent = '0 reviews';
      return;
    }

    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const avg     = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    const admin   = isAdmin();

    if (countEl) countEl.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
    if (avgEl)   avgEl.innerHTML     = `${starsHTML(Math.round(avg), '1.2rem')} <span style="font-weight:700;font-size:1.1rem;color:#1C1C1A;">${avg}</span> <span style="color:#888;font-size:13px;">/ 5</span>`;

    container.innerHTML = reviews.map(r => `
      <div class="review-card" data-id="${r.id}">
        <div class="review-header">
          <div class="review-stars">${starsHTML(r.rating, '1rem')}</div>
          <span class="review-author">${esc(r.userName)}</span>
          <span class="review-date">${formatDate(r.createdAt)}</span>
          ${admin ? `<button class="review-delete-btn" data-id="${r.id}" title="Delete review">🗑</button>` : ''}
        </div>
        ${r.headline ? `<p class="review-headline">"${esc(r.headline)}"</p>` : ''}
        <p class="review-body">${esc(r.body)}</p>
      </div>`).join('');

    if (admin) {
      container.querySelectorAll('.review-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteReview(btn.dataset.id));
      });
    }

  } catch (err) {
    console.error('loadAllReviews:', err);
    container.innerHTML = `<p style="color:#cc4444;">Could not load reviews. Please try again later.</p>`;
  }
}

/* ── Delete a review (admin only) ── */
async function deleteReview(reviewId) {
  if (!isAdmin()) {
    alert('Only the store admin can delete reviews.');
    return;
  }
  if (!confirm('Delete this review? This cannot be undone.')) return;

  try {
    await deleteDoc(doc(db, 'store-reviews', reviewId));
    await loadAllReviews();
  } catch (err) {
    console.error('deleteReview:', err);
    alert('Could not delete review. Please try again.');
  }
}

/* ── Load 3 latest reviews (homepage strip) ── */
export async function loadHomepageReviews() {
  const container = document.getElementById('homepage-reviews');
  if (!container) return;

  try {
    const q    = query(collection(db, 'store-reviews'), orderBy('createdAt', 'desc'), limit(3));
    const snap = await getDocs(q);
    if (snap.empty) { container.closest('section')?.remove(); return; }

    container.innerHTML = snap.docs.map(doc => {
      const r = doc.data();
      return `
        <div class="hp-review-card">
          <div style="margin-bottom:8px;">${starsHTML(r.rating, '0.95rem')}</div>
          ${r.headline ? `<p class="hp-review-headline">"${esc(r.headline)}"</p>` : ''}
          <p class="hp-review-body">${esc(r.body)}</p>
          <p class="hp-review-author">— ${esc(r.userName)}</p>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('loadHomepageReviews:', err);
    container.closest('section')?.remove();
  }
}

/* ── Submit a store review ── */
export async function submitReview() {
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  if (!user) {
    if (typeof openAuthModal === 'function') openAuthModal('signin');
    if (typeof showToast    === 'function') showToast('Please sign in to leave a review.');
    return;
  }

  const rating    = parseInt(document.getElementById('review-rating')?.value || '0');
  const headline  = document.getElementById('review-headline')?.value.trim();
  const body      = document.getElementById('review-body')?.value.trim();
  const submitBtn = document.getElementById('review-submit-btn');

  if (!rating) { alert('Please select a star rating.'); return; }
  if (!body)   { alert('Please write your review before submitting.'); return; }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Submitting…';

  try {
    await addDoc(collection(db, 'store-reviews'), {
      rating,
      headline: headline || '',
      body,
      userName:  user.displayName || user.email?.split('@')[0] || 'Reader',
      userEmail: user.email || '',
      createdAt: serverTimestamp()
    });

    // Reset form
    document.getElementById('review-rating').value   = '0';
    document.getElementById('review-headline').value = '';
    document.getElementById('review-body').value     = '';
    updateStarUI(0);

    if (typeof showToast === 'function') showToast('Thank you for your review! 🎉');
    await loadAllReviews();

    document.getElementById('reviews-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('submitReview:', err);
    alert('Could not submit review. Please try again.');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Submit Review';
  }
}

/* ── Interactive star picker ── */
export function initStarPicker() {
  const picker = document.getElementById('star-picker');
  if (!picker) return;

  picker.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="star-pick" data-val="${i + 1}" style="color:#DDD8CF;">★</span>`
  ).join('');

  const stars = picker.querySelectorAll('.star-pick');

  // Initialize to unfilled state explicitly (fixes "broken" appearance)
  updateStarUI(0, stars);

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => updateStarUI(+star.dataset.val, stars));
    star.addEventListener('mouseleave', () => {
      updateStarUI(parseInt(document.getElementById('review-rating')?.value || '0'), stars);
    });
    star.addEventListener('click', () => {
      const val = +star.dataset.val;
      document.getElementById('review-rating').value = val;
      updateStarUI(val, stars);
    });
  });
}

function updateStarUI(val, stars) {
  if (!stars) stars = document.querySelectorAll('.star-pick');
  stars.forEach(s => {
    s.style.color = +s.dataset.val <= val ? '#C8923A' : '#DDD8CF';
  });
}
