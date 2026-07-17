/* =========================================================
   TALESGALORE — 3D Tilt + Shine for book covers
   -----------------------------------------------------------
   Auto-wraps any matching <img> in a .tilt-shine wrapper and
   attaches pointer tracking. Works on images already in the
   page AND ones added later by app.js (Contentful-rendered
   product grids, marquees, search suggestions, etc.) via a
   MutationObserver.

   TO INCLUDE A NEW CARD TYPE: just add its image selector to
   the SELECTORS array below — no other changes needed.
   ========================================================= */
(function () {
  'use strict';

  const SELECTORS = [
    '.product-image img',        // shop/home product cards
    '.product-img-wrap img',     // ← catalogue product cards (shop.html)
    '#featured-grid img',        // featured products
    '.marquee-card img',         // arrivals & popular marquees
    '.cart-img img',             // cart page thumbnails
    '.search-suggestion img',    // homepage search dropdown
    '.ssr-thumb img',            // ← live search dropdown (shop.html)
    '.age-card img',             // shop-by-age icons
    '.genre-card img',           // shop-by-genre icons
    '.product-detail-image img', // single product page hero image (if present)
  ].join(', ');

  const MAX_TILT_DEG = 10;   // how far the cover tilts toward the cursor
  const HOVER_SCALE  = 1.035;

  function wrapImage(img) {
    if (img.closest('.tilt-shine')) return; // already wrapped
    if (!img.parentNode) return;

    const wrapper = document.createElement('span');
    wrapper.className = 'tilt-shine';

    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    const shineLayer = document.createElement('span');
    shineLayer.className = 'tilt-shine-layer';
    wrapper.appendChild(shineLayer);

    attachPointerEvents(wrapper, img);
  }

  function attachPointerEvents(wrapper, img) {
    let ticking = false;
    let lastX = 0.5, lastY = 0.5;

    function applyTilt(px, py) {
      const rotateY = (px - 0.5) * MAX_TILT_DEG * 2;
      const rotateX = (0.5 - py) * MAX_TILT_DEG * 2;
      img.style.transform =
        `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${HOVER_SCALE})`;
      wrapper.style.setProperty('--tilt-x', `${(px * 100).toFixed(1)}%`);
      wrapper.style.setProperty('--tilt-y', `${(py * 100).toFixed(1)}%`);
    }

    function onMove(e) {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      lastX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      lastY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          applyTilt(lastX, lastY);
          ticking = false;
        });
      }
    }

    wrapper.addEventListener('mouseenter', () => wrapper.classList.add('tilt-active'));
    wrapper.addEventListener('mousemove', onMove);
    wrapper.addEventListener('mouseleave', () => {
      wrapper.classList.remove('tilt-active');
      img.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });

    // Touch devices don't have hover — give a quick one-shot shine sweep on tap
    wrapper.addEventListener('touchstart', () => {
      wrapper.classList.add('tilt-touch-sweep');
      setTimeout(() => wrapper.classList.remove('tilt-touch-sweep'), 750);
    }, { passive: true });
  }

  function scan(root) {
    (root || document).querySelectorAll(SELECTORS).forEach(wrapImage);
  }

  function init() {
    scan(document);

    // Watch for dynamically-added cards (Contentful renders, search results, etc.)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return; // element nodes only
          if (node.matches && node.matches(SELECTORS)) wrapImage(node);
          if (node.querySelectorAll) scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
