/* =========================================
   TALESGALORE — Announcement Bar Loader
   Fetches announcement.html and injects it
   at the top of <body> on every page.
   To change the announcement, edit only
   announcement.html — all pages update.
   ========================================= */
(function () {
  fetch('/announcement.html')
    .then(res => res.text())
    .then(html => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      // Insert as very first child of body
      document.body.insertBefore(wrapper, document.body.firstChild);
      // Run any inline scripts inside the fetched HTML
      wrapper.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        document.head.appendChild(newScript);
      });
    })
    .catch(() => {
      // Silently fail — announcement bar is non-critical
    });
})();
