(function () {
  'use strict';

  const PAGE = document.body.dataset.page || 'page';

  /* ─── CSS ─── */
  const CSS = `
    .cw { margin-top: 12px; }

    .cw-bar {
      display: flex; align-items: center; gap: 8px;
      padding-top: 10px;
      border-top: 1px solid rgba(128,128,128,0.14);
    }
    /* inside q-list: border already on the li, skip extra rule */
    .q-list li .cw .cw-bar { border-top: none; padding-top: 4px; }
    /* q-list li uses flexbox row; allow widget to wrap below */
    .q-list li { flex-wrap: wrap; }
    .q-list li .cw { flex-basis: 100%; margin-top: 8px; }

    .cw-thumb {
      background: none;
      border: 1px solid rgba(128,128,128,0.22);
      border-radius: 5px; padding: 3px 8px;
      cursor: pointer; font-size: 14px; line-height: 1;
      opacity: 0.45; transition: opacity 0.15s, border-color 0.15s;
    }
    .cw-thumb.active { opacity: 1; border-color: rgba(128,128,128,0.55); }
    .cw-thumb:hover { opacity: 0.75; }

    .cw-toggle {
      background: none; border: none; cursor: pointer;
      font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(128,128,128,0.5); font-family: inherit;
      padding: 0; transition: color 0.15s;
    }
    .cw-toggle:hover { color: rgba(128,128,128,0.85); }
    .cw-toggle.has-note { color: rgba(128,128,128,0.7); }

    .cw-panel {
      margin-top: 9px;
      display: flex; flex-direction: column; gap: 7px;
    }

    .cw-input-row { display: flex; gap: 6px; align-items: flex-start; }

    .cw-textarea {
      flex: 1; min-height: 66px; padding: 8px 10px;
      background: rgba(128,128,128,0.07);
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 5px; font-family: inherit;
      font-size: 12px; line-height: 1.55; resize: vertical;
      color: inherit; outline: none;
    }
    .cw-textarea:focus { border-color: rgba(128,128,128,0.45); }
    .cw-textarea::placeholder { color: rgba(128,128,128,0.35); }

    .cw-mic {
      background: rgba(128,128,128,0.1);
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 5px; padding: 8px;
      cursor: pointer; color: rgba(128,128,128,0.55);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    .cw-mic:hover { background: rgba(128,128,128,0.18); }
    .cw-mic.recording {
      background: rgba(220,38,38,0.12);
      border-color: rgba(220,38,38,0.4);
      color: #ef4444;
    }

    .cw-footer {
      display: flex; align-items: center; justify-content: space-between;
    }
    .cw-status { font-size: 11px; color: rgba(34,197,94,0.85); }

    .cw-submit {
      background: rgba(128,128,128,0.1);
      border: 1px solid rgba(128,128,128,0.22);
      border-radius: 5px; padding: 5px 13px;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      font-family: inherit; cursor: pointer; color: inherit;
      transition: background 0.15s;
    }
    .cw-submit:hover { background: rgba(128,128,128,0.2); }
  `;

  /* ─── Visitor ─── */
  function getVisitor() {
    return sessionStorage.getItem('wj_visitor_name') || localStorage.getItem('wj_visitor_name') || null;
  }
  function setVisitor(name) {
    sessionStorage.setItem('wj_visitor_name', name);
    localStorage.setItem('wj_visitor_name', name);
  }
  function ensureVisitor(cb) {
    if (getVisitor()) { cb(getVisitor()); return; }
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center';
    ov.innerHTML = `
      <div style="background:#1c1c1c;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:28px;width:280px;display:flex;flex-direction:column;gap:14px">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3)">Before you comment</div>
        <input id="_cwn" placeholder="Your name" autocomplete="off"
          style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:5px;padding:10px 12px;color:#edeae2;font-size:14px;font-family:inherit;outline:none;width:100%;box-sizing:border-box"/>
        <button id="_cwg" style="padding:9px;background:#edeae2;color:#111;border:none;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.05em">Continue</button>
      </div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('#_cwn');
    const btn = ov.querySelector('#_cwg');
    inp.focus();
    function go() {
      const v = inp.value.trim();
      if (!v) { inp.style.borderColor = 'rgba(220,38,38,0.6)'; return; }
      setVisitor(v);
      ov.remove();
      cb(v);
    }
    btn.addEventListener('click', go);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  /* ─── Local cache ─── */
  function cKey(id) { return `wjc_${id}`; }
  function getCache(id) {
    try { return JSON.parse(localStorage.getItem(cKey(id))) || {}; } catch { return {}; }
  }
  function setCache(id, data) {
    localStorage.setItem(cKey(id), JSON.stringify(data));
  }

  /* ─── DB save ─── */
  function dbSave(type, key, value) {
    const visitor = getVisitor() || 'Anonymous';
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor, type, key, value })
    }).catch(() => {});
  }

  /* ─── Helpers ─── */
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function slug(el, i) {
    const h = el.querySelector('h3, .q-num, strong');
    const t = h ? h.textContent.trim().slice(0, 35) : String(i);
    return `${PAGE}-${t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || i}`;
  }
  /* where to attach widget inside the card */
  function target(card) {
    if (card.matches('.q-list li')) return card.querySelector('.q-body') || card;
    return card;
  }

  /* ─── Build widget ─── */
  function buildWidget(card, id) {
    /* skip cards that already have a built-in answer interface */
    if (card.querySelector('.q-answer')) return;

    const cache = getCache(id);
    const hasNote = !!cache.text;

    const cw = document.createElement('div');
    cw.className = 'cw';
    cw.innerHTML = `
      <div class="cw-bar">
        <button class="cw-thumb${cache.thumb ? ' active' : ''}" title="Helpful">👍</button>
        <button class="cw-toggle${hasNote ? ' has-note' : ''}">${hasNote ? '💬 Edit note' : '+ Add note'}</button>
      </div>
      <div class="cw-panel" style="display:none">
        <div class="cw-input-row">
          <textarea class="cw-textarea" placeholder="Leave a note about this...">${hasNote ? esc(cache.text) : ''}</textarea>
          <button class="cw-mic" title="Voice input">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        </div>
        <div class="cw-footer">
          <span class="cw-status"></span>
          <button class="cw-submit">Save note</button>
        </div>
      </div>`;

    target(card).appendChild(cw);

    const thumb    = cw.querySelector('.cw-thumb');
    const toggle   = cw.querySelector('.cw-toggle');
    const panel    = cw.querySelector('.cw-panel');
    const textarea = cw.querySelector('.cw-textarea');
    const mic      = cw.querySelector('.cw-mic');
    const submit   = cw.querySelector('.cw-submit');
    const status   = cw.querySelector('.cw-status');

    /* thumbs up */
    thumb.addEventListener('click', () => {
      ensureVisitor(() => {
        const on = thumb.classList.toggle('active');
        const c = getCache(id); c.thumb = on; setCache(id, c);
        dbSave('reaction', id, on ? '👍' : '');
      });
    });

    /* toggle panel */
    toggle.addEventListener('click', () => {
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'flex';
      if (!open) textarea.focus();
    });

    /* mic STT */
    let rec = null;
    mic.addEventListener('click', () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      const base = textarea.value;
      rec.onresult = e => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        textarea.value = (base + ' ' + t).trim();
      };
      rec.onend = () => { rec = null; mic.classList.remove('recording'); };
      rec.start();
      mic.classList.add('recording');
    });

    /* save — Shift+Enter or button */
    function doSave() {
      ensureVisitor(() => {
        const text = textarea.value.trim();
        const c = getCache(id); c.text = text; setCache(id, c);
        dbSave('comment', id, text);

        toggle.textContent = text ? '💬 Edit note' : '+ Add note';
        toggle.classList.toggle('has-note', !!text);

        status.textContent = 'Saved ✓';
        setTimeout(() => { status.textContent = ''; panel.style.display = 'none'; }, 1200);
      });
    }

    submit.addEventListener('click', doSave);
    textarea.addEventListener('keydown', e => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); doSave(); } });
  }

  /* ─── Init ─── */
  function init() {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);

    const sel = '.f-card, .e-card, .explainer-block, .q-list li, .track-card, .v-card, .uc-card, .a-card, .ap-card, .collab-card';
    document.querySelectorAll(sel).forEach((card, i) => buildWidget(card, slug(card, i)));
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
