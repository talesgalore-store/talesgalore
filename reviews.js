/* =========================================
   TALESGALORE — Reviews System
   Firebase Firestore (CDN, no bundler)
   ========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCNuMz24vkzr551Mmjme4WkHBFXI2GdP80",
  authDomain:        "talesgalore-reviews.firebaseapp.com",
  projectId:         "talesgalore-reviews",
  storageBucket:     "talesgalore-reviews.firebasestorage.app",
  messagingSenderId: "251408630247",
  appId:             "1:251408630247:web:dfe7796c11affe21f0fd42"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ── Render star rating (read-only display) ── */
function starsHTML(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < rating ? '#C8923A' : '#DDD8CF'};font-size:1.1rem;">★</span>`
  ).join('');
}

/* ── Load and display reviews for a book ── */
export async function loadReviews(bookId) {
  const container = document.getElementById('reviews-list');
  const countEl   = document.getElementById('reviews-count');
  if (!container) return;

  container.innerHTML = `<p style="color:#888;font-style:italic;padding:16px 0;">Loading reviews…</p>`;

  try {
    const q = query(
      collection(db, 'reviews'),
      where('bookId', '==', bookId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<p style="color:#888;font-style:italic;padding:16px 0;">No reviews yet — be the first!</p>`;
      if (countEl) countEl.textContent = '0 reviews';
      return;
    }

    if (countEl) countEl.textContent = `${snap.size} review${snap.size !== 1 ? 's' : ''}`;

    container.innerHTML = snap.docs.map(doc => {
      const r    = doc.data();
      const date = r.createdAt?.toDate
        ? r.createdAt.toDate().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
        : '';
      return `
        <div class="review-card">
          <div class="review-header">
            <span class="review-stars">${starsHTML(r.rating)}</span>
            <span class="review-author">${r.userName}</span>
            <span class="review-date">${date}</span>
          </div>
          ${r.headline ? `<p class="review-headline">${r.headline}</p>` : ''}
          <p class="review-body">${r.body}</p>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('loadReviews error:', err);
    container.innerHTML = `<p style="color:#cc4444;">Could not load reviews.</p>`;
  }
}

/* ── Submit a new review ── */
export async function submitReview(bookId, bookTitle) {
  const user = window.getCurrentUser ? window.getCurrentUser() : null;
  if (!user) {
    if (typeof openAuthModal === 'function') openAuthModal('signin');
    showToast('Please sign in to leave a review.');
    return;
  }

  const rating   = parseInt(document.getElementById('review-rating')?.value || '0');
  const headline = document.getElementById('review-headline')?.value.trim();
  const body     = document.getElementById('review-body')?.value.trim();
  const submitBtn = document.getElementById('review-submit-btn');

  if (!rating || rating < 1 || rating > 5) {
    alert('Please select a star rating.');
    return;
  }
  if (!body) {
    alert('Please write your review before submitting.');
    return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Submitting…';

  try {
    await addDoc(collection(db, 'reviews'), {
      bookId,
      bookTitle,
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

    showToast('Thank you for your review!');
    await loadReviews(bookId); // refresh list

  } catch (err) {
    console.error('submitReview error:', err);
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
    `<span class="star-pick" data-val="${i + 1}" style="font-size:1.8rem;cursor:pointer;color:#DDD8CF;transition:color 0.15s;">★</span>`
  ).join('');

  const stars = picker.querySelectorAll('.star-pick');

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => updateStarUI(+star.dataset.val, stars));
    star.addEventListener('mouseleave', () => {
      const current = parseInt(document.getElementById('review-rating')?.value || '0');
      updateStarUI(current, stars);
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
