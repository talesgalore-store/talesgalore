/* ============================================================
   Story Beneath the Story — reusable widgets
   Requires sbts-data.js to be loaded first.
   Injects its own scoped CSS on first use, so it's safe to
   drop into any page regardless of that page's existing styles.
   ============================================================ */

(function () {
  if (document.getElementById('sbts-widget-styles')) return;
  const style = document.createElement('style');
  style.id = 'sbts-widget-styles';
  style.textContent = `
    .sbts-w-card {
      --gold: #C8923A; --gold-lt: #E8B96A; --ink-w: #8B5E3C;
      --cream: #FDFAF4; --warm: #F5EDD8; --rule: #E2D5BC; --ink-dk: #2C2416;
      font-family: 'Lato', sans-serif;
    }

    /* ---- Shared thumbnail styles ---- */
    .sbts-w-thumb {
      border-radius: 6px;
      object-fit: cover;
      background: var(--warm);
      border: 1px solid var(--rule);
      box-shadow: 0 4px 10px rgba(139,94,60,0.12);
      flex: 0 0 auto;
    }
    .sbts-w-thumb--fallback {
      display: flex; align-items: center; justify-content: center;
      color: var(--gold-lt);
    }

    /* ---- Product page accordion ---- */
    .sbts-panel {
      margin-top: 28px; border: 1px solid var(--rule); border-radius: 10px;
      overflow: hidden; background: #fff;
    }
    .sbts-panel-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; cursor: pointer; background: var(--warm);
    }
    .sbts-panel-head-left { display: flex; align-items: center; gap: 12px; }
    .sbts-panel-thumb { width: 40px; height: 56px; font-size: 18px; }
    .sbts-panel-head h3 {
      font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700;
      color: var(--ink-w); margin: 0; display: flex; align-items: center; gap: 8px;
    }
    .sbts-panel-arrow { color: var(--gold); font-size: 0.75rem; transition: transform .25s; }
    .sbts-panel.open .sbts-panel-arrow { transform: rotate(90deg); }
    .sbts-panel-reveal { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s ease; }
    .sbts-panel.open .sbts-panel-reveal { grid-template-rows: 1fr; }
    .sbts-panel-reveal-inner { overflow: hidden; }
    .sbts-panel-body { padding: 18px 20px 6px; }
    .sbts-panel-body p { font-size: 0.9rem; line-height: 1.7; color: #4a3d2c; margin-bottom: 12px; }
    .sbts-panel-reminder {
      margin: 0 20px 20px; padding: 14px 18px; background: var(--cream);
      border-left: 3px solid var(--gold); border-radius: 4px;
      font-family: 'Playfair Display', serif; font-style: italic; font-weight: 600;
      color: var(--ink-w); font-size: 0.95rem; line-height: 1.5;
    }

    /* ---- Homepage widget ---- */
    .sbts-w-home {
      max-width: 640px; margin: 0 auto; background: #fff;
      border: 1px solid var(--rule); border-radius: 12px; padding: 32px;
      text-align: center;
    }
    .sbts-w-home .sbts-w-eyebrow {
      font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
      color: var(--gold); font-weight: 700; margin-bottom: 10px; display: block;
    }
    .sbts-w-home .sbts-w-thumb {
      width: 84px; height: 116px; font-size: 30px;
      margin: 0 auto 16px;
    }
    .sbts-w-home h3 {
      font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--ink-dk); margin-bottom: 4px;
    }
    .sbts-w-home .sbts-w-author { font-size: 0.78rem; color: #9c8a6f; font-style: italic; margin-bottom: 16px; }
    .sbts-w-home .sbts-w-quote {
      font-family: 'Playfair Display', serif; font-style: italic; font-weight: 600;
      font-size: 1.15rem; color: var(--ink-w); line-height: 1.5; margin-bottom: 20px;
    }
    .sbts-w-home a.sbts-w-cta {
      display: inline-block; font-size: 0.76rem; font-weight: 700; letter-spacing: .05em;
      text-transform: uppercase; color: #fff; background: var(--ink-w);
      padding: 10px 22px; border-radius: 6px; text-decoration: none; transition: background .2s;
    }
    .sbts-w-home a.sbts-w-cta:hover { background: var(--gold); }

    /* ---- Why TalesGalore callout ---- */
    .sbts-w-callout {
      background: var(--warm); border-radius: 12px; padding: 40px 32px; text-align: center;
    }
    .sbts-w-callout h3 {
      font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--ink-dk); margin-bottom: 10px;
    }
    .sbts-w-callout > p { max-width: 540px; margin: 0 auto 26px; color: #6B5A47; font-size: 0.95rem; line-height: 1.7; }
    .sbts-w-quotes {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 18px; max-width: 760px; margin: 0 auto 26px;
    }
    .sbts-w-quotes blockquote {
      background: #fff; border-radius: 8px; padding: 18px; margin: 0;
      font-family: 'Playfair Display', serif; font-style: italic; font-size: 0.92rem;
      color: var(--ink-w); line-height: 1.5; border: 1px solid var(--rule);
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .sbts-w-quotes .sbts-w-thumb { width: 56px; height: 78px; font-size: 20px; margin-bottom: 12px; }
    .sbts-w-quotes cite { display: block; margin-top: 10px; font-family: 'Lato', sans-serif; font-style: normal;
      font-size: 0.72rem; letter-spacing: .04em; text-transform: uppercase; color: var(--gold); }
    .sbts-w-callout a.sbts-w-cta {
      display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: .05em;
      text-transform: uppercase; color: #fff; background: var(--ink-w);
      padding: 11px 24px; border-radius: 6px; text-decoration: none; transition: background .2s;
    }
    .sbts-w-callout a.sbts-w-cta:hover { background: var(--gold); }
  `;
  document.head.appendChild(style);
})();

/* ------------------------------------------------------------
   1) PRODUCT PAGE ACCORDION
   Call after your product page knows the current book's title:
     renderSBTSPanel('sbtsPanelSlot', book.title);
   `book.title` should be whatever variable holds the book's
   title in product.html. If there's no matching reflection for
   that title, nothing is rendered — safe to call unconditionally.
   ------------------------------------------------------------ */
function renderSBTSPanel(containerId, bookTitle) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const entry = findSBTSEntry(bookTitle);
  if (!entry) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="sbts-w-card sbts-panel" id="sbtsPanel">
      <div class="sbts-panel-head" onclick="document.getElementById('sbtsPanel').classList.toggle('open')">
        <div class="sbts-panel-head-left">
          ${sbtsCoverMarkup(entry, 'sbts-w-thumb sbts-panel-thumb')}
          <h3>✨ The Story Beneath the Story</h3>
        </div>
        <span class="sbts-panel-arrow">▶</span>
      </div>
      <div class="sbts-panel-reveal">
        <div class="sbts-panel-reveal-inner">
          <div class="sbts-panel-body">
            ${entry.body.map(p => `<p>${p}</p>`).join('')}
          </div>
          <div class="sbts-panel-reminder">${entry.reminder}</div>
        </div>
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------
   2) HOMEPAGE "REFLECTION" WIDGET
   Rotates automatically — a different entry each ISO week, so
   it changes on its own with no manual updating.
   Call: renderSBTSHomeWidget('sbtsHomeSlot');
   ------------------------------------------------------------ */
function renderSBTSHomeWidget(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !SBTS_ENTRIES.length) return;

  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const entry = SBTS_ENTRIES[weekNumber % SBTS_ENTRIES.length];

  container.innerHTML = `
    <div class="sbts-w-card sbts-w-home">
      <span class="sbts-w-eyebrow">This Week's Reflection</span>
      ${sbtsCoverMarkup(entry, 'sbts-w-thumb')}
      <h3>${entry.bookTitle}</h3>
      ${entry.author ? `<div class="sbts-w-author">${entry.author}</div>` : ''}
      <p class="sbts-w-quote">${entry.reminder}</p>
      <a class="sbts-w-cta" href="story-beneath-the-story.html#${entry.slug}">Read the story beneath it →</a>
    </div>
  `;
}

/* ------------------------------------------------------------
   3) WHY TALESGALORE CALLOUT
   A static showcase of 3 reminder lines to make the brand case.
   Call: renderSBTSWhyCallout('sbtsWhySlot');
   ------------------------------------------------------------ */
function renderSBTSWhyCallout(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const picks = SBTS_ENTRIES.slice(0, 3);

  container.innerHTML = `
    <div class="sbts-w-card sbts-w-callout">
      <h3>Every Book Carries More Than Pages</h3>
      <p>Beyond the condition grading and the cover art, we sit with each story and ask what it's really trying to tell a child. We call it the Story Beneath the Story.</p>
      <div class="sbts-w-quotes">
        ${picks.map(e => `
          <blockquote>
            ${sbtsCoverMarkup(e, 'sbts-w-thumb')}
            "${e.reminder}"
            <cite>${e.bookTitle}</cite>
          </blockquote>
        `).join('')}
      </div>
      <a class="sbts-w-cta" href="story-beneath-the-story.html">Read the reflections →</a>
    </div>
  `;
}
