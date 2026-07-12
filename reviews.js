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

// Reviews use a SEPARATE Firebase project (talesgalore-reviews)
// which already has Firestore set up on the free Spark plan.
// We initialise it as a NAMED app ("reviews") so it coexists with
// the default app used by auth.js (talesgalore-fb431) without
// throwing app/duplicate-app.
const REVIEWS_APP_NAME = 'reviews';

const reviewsConfig = {
  apiKey:            "AIzaSyCNuMz24vkzr551Mmjme4WkHBFXI2GdP80",
  authDomain:        "talesgalore-reviews.firebaseapp.com",
  projectId:         "talesgalore-reviews",
  storageBucket:     "talesgalore-reviews.firebasestorage.app",
  messagingSenderId: "251408630247",
  appId:             "1:251408630247:web:dfe7796c11affe21f0fd42"
};

const reviewsApp = getApps().find(a => a.name === REVIEWS_APP_NAME)
  ?? initializeApp(reviewsConfig, REVIEWS_APP_NAME);

const db = getFirestore(reviewsApp);

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

/* ── Manually-curated reviews (e.g. from Google Reviews) ──
   These always appear on the homepage strip, blended in with
   live Firestore reviews. Add more objects here anytime. ── */
/* ── Manually-curated reviews (e.g. from Google Reviews) ──
   These always appear on the homepage strip and the All Reviews
   page, blended in with live Firestore reviews. Add more here
   anytime — just give each a unique id. ── */
const STATIC_REVIEWS = [
  {
    id: 'static-zainab',
    rating: 5,
    headline: 'Everything exceeded my expectations',
    body: "I recently bought books for my baby from this platform, and I'm very happy with my purchase. The owner was extremely supportive and helpful throughout the process. The prices were very reasonable, and the quality of the books is excellent. Everything exceeded my expectations. I highly recommend buying from her. Thank you for the wonderful service!",
    userName: 'Zainab Fozdar',
    source: 'Google Reviews'
  },
  {
    id: 'static-donna',
    rating: 5,
    headline: 'The best of both — website and personal touch',
    body: "One of the best places to get affordable quality preloved books! There are many pages on Instagram selling second hand books, but most don't entertain you by sharing details of books on requests. You will have to wait and comment and block immediately after they post. And most websites don't share videos of the books. It's very tasking, time consuming and difficult for new moms. If you prefer buying from a website leisurely at reasonable prices, and also would like to see the videos of the books on request, or know more about the books, or want to have a proper conversation with the seller, then Tales Galore has the best of both! They have a dedicated website for you to browse, an Instagram page and also a warm team passionate about books eager to help you get what you want!",
    userName: 'Donna Partha',
    source: 'Google Reviews'
  }
];

/* ── Load 3 latest reviews (homepage strip) ── */
export async function loadHomepageReviews() {
  const container = document.getElementById('homepage-reviews');
  if (!container) return;

  let liveReviews = [];

  try {
    const q    = query(collection(db, 'store-reviews'), orderBy('createdAt', 'desc'), limit(3));
    const snap = await getDocs(q);
    liveReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('loadHomepageReviews:', err);
    // fall through — we still have STATIC_REVIEWS to show
  }

  const combined = [...STATIC_REVIEWS, ...liveReviews].slice(0, 3);

  if (!combined.length) {
    container.closest('section')?.remove();
    return;
  }

  container.innerHTML = combined.map(r => `
    <a href="reviews.html#review-${esc(r.id)}" class="hp-review-card" style="text-decoration:none;color:inherit;display:block;">
      <div style="margin-bottom:8px;">${starsHTML(r.rating, '0.95rem')}</div>
      ${r.headline ? `<p class="hp-review-headline">"${esc(r.headline)}"</p>` : ''}
      <p class="hp-review-body">${esc(r.body)}</p>
      <p class="hp-review-author">— ${esc(r.userName)}${r.source ? ` <span style="font-weight:400;color:#999;">(${esc(r.source)})</span>` : ''}</p>
    </a>`).join('');
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
