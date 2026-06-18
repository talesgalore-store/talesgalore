/* =========================================
   TALESGALORE — Contact Form
   Uses Netlify Forms (free, no backend needed)
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note   = document.getElementById('formNote');
    const btn    = form.querySelector('button[type="submit"]');
    const data   = new FormData(form);

    btn.textContent = 'Sending...';
    btn.disabled    = true;

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'contact',
          ...Object.fromEntries(data)
        }).toString()
      });

      if (res.ok) {
        form.reset();
        note.textContent  = '✓ Message sent! We\'ll get back to you soon.';
        note.style.color  = '#5C7A5E';
      } else {
        throw new Error('Form submission failed');
      }
    } catch {
      note.textContent = 'Something went wrong. Please WhatsApp us directly.';
      note.style.color = '#C4622D';
    } finally {
      btn.textContent = 'Send Message';
      btn.disabled    = false;
    }
  });
});
