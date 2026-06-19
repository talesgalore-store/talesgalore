/* Rotating announcement bar — works on all pages */
(function () {
  function initAnnouncement() {
    var messages = document.querySelectorAll('.announcement-message');
    if (messages.length === 0) return;
    var current = 0;
    // Make sure first one is active
    messages[0].classList.add('active');
    setInterval(function () {
      messages[current].classList.remove('active');
      current = (current + 1) % messages.length;
      messages[current].classList.add('active');
    }, 3000);
  }
 
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncement);
  } else {
    initAnnouncement();
  }
})();
