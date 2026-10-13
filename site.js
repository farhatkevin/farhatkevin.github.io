const hoverAvailable = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Keep section jumps in the current document, including versioned previews.
document.querySelectorAll('.site-header nav a[href^="#"]').forEach((link) => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'section-link';
  button.textContent = link.textContent;
  button.setAttribute('aria-controls', target.id);
  button.addEventListener('click', () => {
    const nextHash = `#${target.id}`;
    if (window.location.hash !== nextHash) {
      history.pushState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  });
  link.replaceWith(button);
});

window.addEventListener('popstate', () => {
  const target = document.getElementById(window.location.hash.slice(1));
  if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
});

const previews = [...document.querySelectorAll('.paper-preview')];
const states = new Map();

function positionPreview(preview) {
  preview.classList.remove('preview-above');
  const panel = preview.querySelector('.preview-panel');
  panel.style.maxHeight = '';
  if (!preview.open || window.innerWidth <= 600) return;
  const row = preview.closest('.paper-row').getBoundingClientRect();
  const bounds = panel.getBoundingClientRect();
  const below = window.innerHeight - row.bottom - 16;
  const above = row.top - 16;
  if (bounds.height > below && above > below) {
    preview.classList.add('preview-above');
    panel.style.maxHeight = `${Math.max(100, above)}px`;
  } else {
    panel.style.maxHeight = `${Math.max(100, below)}px`;
  }
}

function closePreview(preview) {
  const state = states.get(preview);
  clearTimeout(state.timer);
  state.pinned = false;
  preview.open = false;
}

function openPreview(preview) {
  previews.forEach((other) => {
    if (other !== preview) closePreview(other);
  });
  preview.open = true;
  positionPreview(preview);
}

previews.forEach((preview) => {
  const row = preview.closest('.paper-row');
  const summary = preview.querySelector('summary');
  const state = { hovered: false, focused: false, pinned: false, suppressed: false, timer: null };
  states.set(preview, state);

  row.addEventListener('pointerenter', (event) => {
    if (!hoverAvailable.matches || event.pointerType === 'touch') return;
    state.hovered = true;
    state.suppressed = false;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => openPreview(preview), 180);
  });
  row.addEventListener('pointerleave', () => {
    state.hovered = false;
    state.suppressed = false;
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      if (!state.pinned && !state.focused) closePreview(preview);
    }, 180);
  });
  row.addEventListener('focusin', (event) => {
    state.focused = true;
    clearTimeout(state.timer);
    if (!row.contains(event.relatedTarget)) state.suppressed = false;
    if (!state.suppressed && hoverAvailable.matches) openPreview(preview);
  });
  row.addEventListener('focusout', (event) => {
    if (row.contains(event.relatedTarget)) return;
    state.focused = false;
    if (!state.hovered && !state.pinned) closePreview(preview);
  });
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    if (state.pinned) {
      state.suppressed = true;
      closePreview(preview);
    } else {
      state.pinned = true;
      state.suppressed = false;
      openPreview(preview);
    }
  });
  preview.addEventListener('toggle', () => positionPreview(preview));
  preview.querySelectorAll('img').forEach((image) => {
    image.addEventListener('load', () => positionPreview(preview));
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  previews.forEach((preview) => {
    if (!preview.open) return;
    if (preview.querySelector('.preview-panel').contains(document.activeElement)) {
      preview.querySelector('summary').focus();
    }
    closePreview(preview);
    states.get(preview).suppressed = true;
  });
});
document.addEventListener('pointerdown', (event) => {
  previews.forEach((preview) => {
    if (!preview.closest('.paper-row').contains(event.target)) closePreview(preview);
  });
});
window.addEventListener('resize', () => previews.forEach(positionPreview));

const mark = document.querySelector('.modular-mark');
if (mark) {
  mark.hidden = false;
  let turns = 0;
  mark.addEventListener('click', () => {
    turns += 1;
    mark.style.setProperty('--turn', `${turns * 90}deg`);
  });
}

const ball = document.querySelector('.soccer-ball');
if (ball) {
  ball.hidden = false;
  let kicks = 0;
  ball.addEventListener('click', () => {
    kicks += 1;
    document.getElementById('soccer-status').textContent = `Kick ${kicks}. Nice touch.`;
    if (!reducedMotion.matches) ball.classList.add('kicked');
  });
  ball.addEventListener('animationend', () => ball.classList.remove('kicked'));
  reducedMotion.addEventListener('change', () => ball.classList.remove('kicked'));
}
