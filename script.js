/* ===========================================================================
   ONYX — SITE CONFIGURATION
   This is the only block you need to edit when wiring the site to a backend.
   Every integration below degrades safely when left blank.
   =========================================================================== */
const ONYX = {
  // Presentation mode: keeps payment links and business data safe while owners review the prototype.
  DEMO_MODE: false,

  // Where "Request a call back" leads are POSTed as JSON:
  // { name, phone, source, at }.  Leave '' to use the WhatsApp/email handoff.
  CONTACT_ENDPOINT: '',

  // Supabase public browser config. RLS protects the tables; never put a service-role key here.
  SUPABASE_URL: 'https://xetcagevubbvxjxinvcf.supabase.co',
  SUPABASE_KEY: 'sb_publishable_WDE52G7LnSmnFHHL03OuzQ_imM4F12Z',

  // Real signup/login API. Leave '' to keep browser-local demo accounts.
  AUTH_ENDPOINT: '',

  // Server route that verifies a Razorpay payment against the Payments API and
  // returns { active: true, plan: '...' }. ** Until this is deployed, no
  // membership is ever activated in the browser ** — see beginPaymentFlow()
  // and supabase/functions/verify-payment/index.ts (deploy steps: SUPABASE_SETUP.md).
  MEMBERSHIP_VERIFY_ENDPOINT: 'https://xetcagevubbvxjxinvcf.supabase.co/functions/v1/verify-payment',

  // Fallback contact channels used when CONTACT_ENDPOINT is blank.
  WHATSAPP: '917973960144',
  PHONE: '+917973960144',
  EMAIL: 'vx.monit@gmail.com'
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = () => (reducedMotion ? 'auto' : 'smooth');

document.querySelectorAll('a[href^="#"]:not(.pillar)').forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href'));
  if (target) { event.preventDefault(); target.scrollIntoView({ behavior: scrollBehavior() }); }
}));

document.querySelectorAll('.directional-tile').forEach(tile => {
  const direction = event => {
    const box = tile.getBoundingClientRect();
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    return Math.abs(x / box.width) > Math.abs(y / box.height)
      ? (x > 0 ? 'right' : 'left')
      : (y > 0 ? 'bottom' : 'top');
  };
  tile.addEventListener('pointerenter', event => {
    tile.classList.remove('enter-left', 'enter-right', 'enter-top', 'enter-bottom');
    tile.classList.add(`enter-${direction(event)}`);
    requestAnimationFrame(() => tile.classList.add('is-hovered'));
  });
  tile.addEventListener('pointerleave', event => {
    tile.classList.remove('enter-left', 'enter-right', 'enter-top', 'enter-bottom');
    tile.classList.add(`enter-${direction(event)}`);
    requestAnimationFrame(() => tile.classList.remove('is-hovered'));
  });
});

document.querySelectorAll('.nav-directional').forEach(link => {
  const setDirection = event => {
    const box = link.getBoundingClientRect();
    link.classList.toggle('enter-left', event.clientX < box.left + box.width / 2);
  };
  link.addEventListener('pointerenter', event => {
    setDirection(event);
    requestAnimationFrame(() => link.classList.add('is-hovered'));
  });
  link.addEventListener('pointerleave', event => {
    setDirection(event);
    requestAnimationFrame(() => link.classList.remove('is-hovered'));
  });
});

const stories = [
  { quote: '“It gave me more than a stronger body. It gave me a place to show up as my <em>best self.</em>”', attribution: 'ALEX MERCER · ONYX MEMBER' },
  { quote: '“The programming is hard. The people make it <em>worth coming back for.</em>”', attribution: 'PRIYA NAIR · ONYX MEMBER' },
  { quote: '“I came for the strength work. I stayed because I found my <em>community.</em>”', attribution: 'JORDAN LEE · ONYX MEMBER' },
  { quote: '“Every session leaves me feeling more capable than when I <em>walked in.</em>”', attribution: 'MAYA SHAH · ONYX MEMBER' },
  { quote: '“The coaches see what you can become—and help you <em>get there.</em>”', attribution: 'DANIEL PARK · ONYX MEMBER' }
];

const quoteText = document.querySelector('.quote blockquote');
const quoteAttribution = document.querySelector('.quote-attribution');
const storyDots = [...document.querySelectorAll('.story-dot')];
let activeStory = 0;
let isChangingStory = false;
let storyTimer;
const storyDelay = 6000;
const updateStoryDots = () => {
  storyDots.forEach((dot, index) => {
    dot.classList.remove('is-active');
    dot.setAttribute('aria-selected', String(index === activeStory));
  });
  const activeDot = storyDots[activeStory];
  if (activeDot) {
    void activeDot.offsetWidth;
    activeDot.classList.add('is-active');
  }
};
/* ── WCAG 2.2.2 — the rotation can always be paused ────────────────────────
   Auto-advance stops for the visible Pause control, for pointer hover over the
   quote, for keyboard focus anywhere inside it, for prefers-reduced-motion
   (starts paused), and while the tab is hidden.
   While it runs the quote is aria-live="off" so a screen reader is not
   interrupted every 6 s; once stopped it becomes "polite" so changes made with
   the dots or the control are announced (WAI-ARIA carousel pattern). */
const quoteSection = document.querySelector('.quote');
const storyPauseButton = document.getElementById('story-pause');
const storyReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storyCanHover = window.matchMedia('(hover: hover)');
let storyUserPaused = storyReducedMotion.matches;
let storyHoverHold = false;
let storyFocusHold = false;

const storyRotationRunning = () => !storyUserPaused && !storyHoverHold && !storyFocusHold;

const syncStoryRotation = () => {
  window.clearTimeout(storyTimer);
  const running = storyRotationRunning();
  if (quoteText) quoteText.setAttribute('aria-live', running ? 'off' : 'polite');
  if (storyPauseButton) {
    storyPauseButton.setAttribute('aria-pressed', String(storyUserPaused));
    storyPauseButton.title = storyUserPaused ? 'Start automatic rotation' : 'Stop automatic rotation';
  }
  if (running) storyTimer = window.setTimeout(() => changeStory((activeStory + 1) % stories.length), storyDelay);
};
const changeStory = async nextStory => {
  if (!quoteText || !quoteAttribution) return;
  if (isChangingStory || nextStory === activeStory) return;
  isChangingStory = true;
  window.clearTimeout(storyTimer);
  const direction = nextStory > activeStory || (activeStory === stories.length - 1 && nextStory === 0) ? 1 : -1;
  storyDots.forEach(dot => { dot.disabled = true; });
  const moveOut = [
    { opacity: 1, transform: 'translateX(0)' },
    { opacity: 0, transform: `translateX(${-28 * direction}px)` }
  ];
  const moveIn = [
    { opacity: 0, transform: `translateX(${28 * direction}px)` },
    { opacity: 1, transform: 'translateX(0)' }
  ];
  await Promise.all([
    quoteText.animate(moveOut, { duration: 260, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).finished,
    quoteAttribution.animate(moveOut, { duration: 190, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).finished
  ]);
  activeStory = nextStory;
  quoteText.innerHTML = stories[activeStory].quote;
  quoteAttribution.textContent = stories[activeStory].attribution;
  updateStoryDots();
  await Promise.all([
    quoteText.animate(moveIn, { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }).finished,
    quoteAttribution.animate(moveIn, { duration: 280, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }).finished
  ]);
  quoteText.getAnimations().forEach(animation => animation.cancel());
  quoteAttribution.getAnimations().forEach(animation => animation.cancel());
  storyDots.forEach(dot => { dot.disabled = false; });
  isChangingStory = false;
  syncStoryRotation();
};
storyDots.forEach((dot, index) => dot.addEventListener('click', () => changeStory(index)));

if (storyPauseButton) {
  storyPauseButton.addEventListener('click', () => {
    storyUserPaused = !storyUserPaused;
    syncStoryRotation();
  });
}
if (quoteSection) {
  if (storyCanHover.matches) {
    quoteSection.addEventListener('pointerenter', () => { storyHoverHold = true; syncStoryRotation(); });
    quoteSection.addEventListener('pointerleave', () => { storyHoverHold = false; syncStoryRotation(); });
  }
  quoteSection.addEventListener('focusin', () => { storyFocusHold = true; syncStoryRotation(); });
  quoteSection.addEventListener('focusout', event => {
    if (event.relatedTarget && quoteSection.contains(event.relatedTarget)) return;
    storyFocusHold = false;
    syncStoryRotation();
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) window.clearTimeout(storyTimer);
  else syncStoryRotation();
});
storyReducedMotion.addEventListener('change', event => {
  if (event.matches) { storyUserPaused = true; syncStoryRotation(); }
});
syncStoryRotation();

// Membership plans dialog
const plansDialog = document.getElementById('plans-dialog');
// Razorpay Payment Links, one per plan. Clicking Continue opens the link but does
// NOT grant membership — see beginPaymentFlow() for why and how activation works.
const PAYMENT_LINKS = {
  'Monthly': 'https://rzp.io/rzp/JSB2YFiU',
  '3 months': 'https://rzp.io/rzp/cgbXV09',
  '6 months': 'https://rzp.io/rzp/iM36BiGS',
  '12 months': 'https://rzp.io/rzp/6KLhx0W',
  'Single PT session': 'https://rzp.io/rzp/oz6JiXGl',
  '8-session PT pack': 'https://rzp.io/rzp/5BCtWy2L',
  '12-session PT pack': 'https://rzp.io/rzp/xYu0PMwf'
};
if (plansDialog) {
  const openPlansButton = document.getElementById('open-plans');
  const plansMain = plansDialog.querySelector('.plans-main');
  const plansConfirmation = plansDialog.querySelector('.plans-confirmation');
  const planCards = [...plansDialog.querySelectorAll('.plan-card')];
  const plansSummary = plansDialog.querySelector('.plans-summary');
  const continueButton = plansDialog.querySelector('.plans-continue');
  let selectedCard = null;

  if (openPlansButton) {
    openPlansButton.addEventListener('click', () => {
      plansConfirmation.hidden = true;
      plansMain.hidden = false;
      plansDialog.showModal();
    });
  }

  // Clicking the backdrop (or the dialog's padding) closes it.
  plansDialog.addEventListener('click', event => {
    if (event.target === plansDialog) plansDialog.close();
  });

  planCards.forEach(card => card.addEventListener('click', () => {
    selectedCard = card;
    planCards.forEach(c => c.classList.toggle('is-selected', c === card));
    plansSummary.textContent = `SELECTED — ${card.dataset.plan.toUpperCase()} · ${card.dataset.price} TOTAL`;
    continueButton.disabled = false;
  }));

  continueButton.addEventListener('click', () => {
    if (!selectedCard) return;
    const paymentLink = PAYMENT_LINKS[selectedCard.dataset.plan];
    if (paymentLink) { beginPaymentFlow(paymentLink, selectedCard.dataset.plan); return; }
    setConfirmationPending(plansConfirmation, selectedCard.dataset.plan);
    plansMain.hidden = true;
    plansConfirmation.hidden = false;
  });

  plansDialog.querySelector('.plans-done').addEventListener('click', () => plansDialog.close());
}

// Pillar program dialog: tile morphs into a pill, then opens a per-discipline flow
const programDialog = document.getElementById('program-dialog');
if (programDialog) {
  const PROGRAMS = {
    strength: {
      tag: '01 / STRENGTH',
      title: 'Strength',
      desc: 'Progressive barbell and dumbbell work that builds real, usable power. Every block is coached, tracked and periodized — you just show up and lift.',
      meta: '45–60 MIN SESSIONS · COACH-LED · PROGRESSIVE BLOCKS',
      note: 'Progression: add 2.5 kg to your main lift each week. Miss a week? Repeat it. This is a generic template — your coach will personalize it.',
      targets: [
        { label: 'Chest', block: '4-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Heavy press', items: ['Barbell bench press — 4 × 5', 'Incline dumbbell press — 3 × 8', 'Weighted dips — 3 × 6', 'Push-up finisher — 2 × max reps'] },
          { name: 'Session B — Volume', items: ['Dumbbell bench press — 4 × 10', 'Machine incline press — 3 × 12', 'Cable fly — 3 × 14', 'Tempo push-ups — 3 × 8'] }] },
        { label: 'Back', block: '4-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Pull power', items: ['Deadlift — 4 × 5', 'Pull-ups — 4 × 6', 'Barbell row — 4 × 8', 'Face pulls — 3 × 15'] },
          { name: 'Session B — Volume', items: ['Lat pulldown — 3 × 10', 'Chest-supported row — 3 × 10', 'Single-arm dumbbell row — 3 × 12', 'Dead hang — 3 × 30s'] }] },
        { label: 'Legs', block: '4-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Squat focus', items: ['Back squat — 4 × 5', 'Romanian deadlift — 3 × 8', 'Walking lunges — 3 × 10 / side', 'Standing calf raise — 4 × 12'] },
          { name: 'Session B — Posterior chain', items: ['Front squat — 3 × 6', 'Leg press — 3 × 10', 'Seated leg curl — 3 × 12', 'Split-squat hold — 3 × 20s / side'] }] },
        { label: 'Shoulders & arms', block: '4-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Press', items: ['Overhead press — 4 × 5', 'Lateral raise — 3 × 12', 'Barbell curl — 3 × 10', 'Rope pressdown — 3 × 12'] },
          { name: 'Session B — Volume', items: ['Seated dumbbell press — 3 × 8', 'Rear-delt fly — 3 × 14', 'Incline curl — 3 × 10', 'Overhead extension — 3 × 12'] }] },
        { label: 'Full body', block: '4-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A', items: ['Back squat — 3 × 5', 'Bench press — 3 × 5', 'Bent-over row — 3 × 8', 'Plank — 3 × 40s'] },
          { name: 'Session B', items: ['Deadlift — 3 × 5', 'Overhead press — 3 × 6', 'Pull-ups — 3 × 6', 'Farmer carry — 3 × 40m'] }] }
      ]
    },
    conditioning: {
      tag: '02 / CONDITIONING',
      title: 'Conditioning',
      desc: 'Engine-building interval work — sleds, ropes, ergs and sprints — scaled by heart rate so every session meets you where you are.',
      meta: '30–45 MIN SESSIONS · HEART-RATE GUIDED · 2–3 SESSIONS / WEEK',
      note: 'Effort: hard intervals should be truly hard (RPE 8–9), easy parts truly easy. Add one round per week.',
      targets: [
        { label: 'Legs', block: '3-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Power intervals', items: ['Sled push — 10 × 20m', 'Hill sprints — 8 × 15s', 'Air squats EMOM — 10 × 15', 'Pogo hops — 3 × 20s'] },
          { name: 'Session B — Capacity', items: ['Assault bike — 10 rounds: 30s hard / 60s easy', 'Walking lunges — 4 × 40m', 'Box step-overs — 3 × 20', 'Calf jumps — 3 × 15'] }] },
        { label: 'Upper body', block: '3-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Rope & row', items: ['Battle ropes — 10 rounds: 20s on / 40s off', 'Row erg — 5 × 250m', 'Med-ball slams — 4 × 20', 'Push-up ladder — 1 to 10'] },
          { name: 'Session B — Volume', items: ['Ski erg — 6 × 200m', 'Rope waves Tabata — 8 × (20s / 10s)', 'Dumbbell clean & press — 3 × 10 / side', 'Plank shoulder taps — 3 × 30'] }] },
        { label: 'Core', block: '3-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Loaded carries', items: ['Farmer carry — 6 × 30m', 'Mountain climbers — 4 × 40s', 'Hollow hold — 4 × 20s', 'Kettlebell swings — 4 × 15'] },
          { name: 'Session B — Anti-rotation', items: ['Backward sled drag — 6 × 20m', 'Russian twists — 3 × 20', 'Side plank — 3 × 30s / side', 'Burpees — 3 × 10'] }] },
        { label: 'Full body', block: '3-WEEK BLOCK · 2 SESSIONS / WEEK', days: [
          { name: 'Session A — Aerobic base', items: ['Row — 3 × 1000m at 5K pace', 'Burpee box step-ups — 4 × 10', 'Kettlebell swings — 4 × 20', 'Bike sprints — 6 × 20s'] },
          { name: 'Session B — AMRAP', items: ['20-min AMRAP: 10 cal bike + 10 wall balls + 10 KB swings', 'Rest 4 min', 'Finisher: sled sprints — 4 × 15m'] }] }
      ]
    },
    recovery: {
      tag: '03 / RECOVERY',
      title: 'Recovery',
      desc: 'Mobility and down-regulation practices that keep you supple and ready to train tomorrow — breath-led flows you can run daily.',
      meta: '15–25 MIN · DAILY FLOW · BREATH-LED',
      note: 'Dosage: run the flow daily or on rest days. Move slowly and never into pain — mild stretch sensation only.',
      targets: [
        { label: 'Hips & hamstrings', block: 'DAILY FLOW · 15 MIN', days: [
          { name: 'Daily flow', items: ['90/90 hip switches — 60s', 'Couch stretch — 45s / side', 'Pigeon pose — 60s / side', 'Light Jefferson curl — 3 × 8', 'Foam roll hamstrings — 60s / side'] }] },
        { label: 'Spine & back', block: 'DAILY FLOW · 15 MIN', days: [
          { name: 'Daily flow', items: ['Cat-cow — 10 reps', 'Thoracic open books — 8 / side', 'Child’s pose with reach — 60s', 'Foam roll upper back — 60s', 'Dead hang — accumulate 60s'] }] },
        { label: 'Shoulders & neck', block: 'DAILY FLOW · 15 MIN', days: [
          { name: 'Daily flow', items: ['Band dislocates — 12 reps', 'Wall slides — 10 reps', 'Scap push-ups — 12 reps', 'Neck CARs — 5 / side', 'Doorway pec stretch — 45s / side'] }] },
        { label: 'Full body reset', block: 'DAILY FLOW · 20 MIN', days: [
          { name: 'Daily flow', items: ['World’s greatest stretch — 5 / side', 'Deep squat hold — 60s', 'Thread the needle — 8 / side', 'Frog pose — 45s', 'Box breathing 4-4-4-4 — 2 min'] }] }
      ]
    }
  };

  const steps = {};
  programDialog.querySelectorAll('.program-step').forEach(step => { steps[step.dataset.step] = step; });
  const introTag = programDialog.querySelector('.program-tag');
  const introTitle = programDialog.querySelector('.program-title');

  const introDesc = programDialog.querySelector('.program-desc');
  const introMeta = programDialog.querySelector('.program-meta');
  const muscleList = programDialog.querySelector('.muscle-list');
  const planTitle = programDialog.querySelector('.plan-title');
  const planMeta = programDialog.querySelector('.plan-meta');
  const planDays = programDialog.querySelector('.plan-days');
  const planNote = programDialog.querySelector('.plan-note');
  let currentProgram = null;

  const animateIn = () => [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }];

  const showStep = (name, delay = 0) => {
    Object.values(steps).forEach(step => { step.hidden = step.dataset.step !== name; });
    const active = steps[name];
    let targets = [...active.children];
    if (name === 'muscle') {
      targets = [...active.children].filter(el => el !== muscleList);
      targets.splice(2, 0, ...muscleList.children);
    }
    if (name === 'plan') {
      targets = [...active.children].filter(el => el !== planDays);
      targets.splice(3, 0, ...planDays.children);
    }
    targets.forEach((el, index) => el.animate(animateIn(), {
      duration: reducedMotion ? 1 : 480,
      delay: reducedMotion ? 0 : delay + index * 55,
      easing: 'cubic-bezier(.16,1,.3,1)',
      fill: 'backwards'
    }));
    programDialog.scrollTop = 0;
  };

  const renderIntro = key => {
    const program = PROGRAMS[key];
    currentProgram = { key, program };
    introTag.textContent = program.tag;
    introTitle.textContent = program.title;
    introDesc.textContent = program.desc;
    introMeta.textContent = program.meta;
    showStep('intro', 120);
  };

  const renderMuscles = () => {
    muscleList.innerHTML = '';
    currentProgram.program.targets.forEach((target, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'muscle-option';
      option.innerHTML = `<span>${target.label}</span><b class="arrow-icon" aria-hidden="true">→</b>`;
      option.addEventListener('click', () => renderPlan(target));
      muscleList.appendChild(option);
    });
    showStep('muscle');
  };

  const renderPlan = target => {
    const { program } = currentProgram;
    planTitle.textContent = `${program.title} — ${target.label}`;
    planMeta.textContent = target.block;
    planDays.innerHTML = target.days.map(day =>
      `<div class="plan-day"><h4>${day.name}</h4><ul>${day.items.map(item => `<li>${item}</li>`).join('')}</ul></div>`
    ).join('');
    planNote.textContent = program.note;
    showStep('plan');
  };

  const openProgram = (pillar, key) => {
    renderIntro(key);
    programDialog.showModal();
    if (reducedMotion) return;
    const dialogRect = programDialog.getBoundingClientRect();
    const tileRect = pillar.getBoundingClientRect();
    // The dialog itself emerges from where the tile was clicked — no image transition.
    programDialog.style.transformOrigin = `${tileRect.left + tileRect.width / 2 - dialogRect.left}px ${tileRect.top + tileRect.height / 2 - dialogRect.top}px`;
    programDialog.animate([
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' });
  };

  document.querySelectorAll('.pillar').forEach(pillar => {
    const key = pillar.classList.contains('pillar-conditioning') ? 'conditioning'
      : pillar.classList.contains('pillar-recovery') ? 'recovery' : 'strength';
    pillar.addEventListener('click', event => {
      event.preventDefault();
      openProgram(pillar, key);
    });
  });

  programDialog.querySelector('.program-get-started').addEventListener('click', renderMuscles);
  programDialog.querySelector('.program-link-back').addEventListener('click', () => showStep('intro'));
  programDialog.querySelector('.plan-ghost').addEventListener('click', () => showStep('muscle'));
  programDialog.querySelector('.plan-join').addEventListener('click', () => {
    programDialog.close();
    const membership = document.getElementById('membership');
    if (membership) membership.scrollIntoView({ behavior: scrollBehavior() });
  });

  // Clicking the backdrop (or the dialog's padding) closes it.
  programDialog.addEventListener('click', event => {
    if (event.target === programDialog) programDialog.close();
  });
}

// Mobile menu
const menuButton = document.getElementById('menu-button');
const mobileMenu = document.getElementById('mobile-menu');
if (menuButton && mobileMenu) {
  // Everything that must stay inside the Tab loop while the drawer is open:
  // the header controls that sit above the overlay (wordmark + ☰/✕ toggle)
  // plus the drawer links. Hidden ones (desktop nav) drop out via getClientRects.
  const menuFocusables = () => [...document.querySelectorAll('.site-header a[href], .site-header button, #mobile-menu a[href], #mobile-menu button')].filter(el => el.getClientRects().length);
  const setMenuOpen = open => {
    const wasOpen = mobileMenu.classList.contains('is-open');
    document.body.classList.toggle('menu-open', open);
    mobileMenu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuButton.textContent = open ? '✕' : '☰';
    if (open && !wasOpen) {
      // Park focus on the first drawer link so Tab starts inside the menu
      // instead of behind it (mouse clicks don't focus buttons in Safari).
      // The rAF may land after a rapid close — never focus a closing drawer.
      requestAnimationFrame(() => {
        if (mobileMenu.classList.contains('is-open')) (mobileMenu.querySelector('a[href], button') || menuButton).focus({ preventScroll: true });
      });
    } else if (!open && (wasOpen || mobileMenu.contains(document.activeElement))) {
      // Hand focus back to the ☰ toggle rather than dropping it on <body> —
      // including when focus is stranded on a drawer link during the 550ms
      // close transition (the link is still focusable until visibility flips).
      menuButton.focus({ preventScroll: true });
      if (document.activeElement !== menuButton) {
        // ☰ is display:none past 720px (force-close on resize): land on the
        // wordmark instead of <body>.
        const fallback = document.querySelector('.site-header .wordmark, .site-header a[href]');
        if (fallback && fallback.getClientRects().length) fallback.focus({ preventScroll: true });
      }
    }
  };
  menuButton.addEventListener('click', () => setMenuOpen(!mobileMenu.classList.contains('is-open')));
  window.addEventListener('keydown', event => {
    if (!mobileMenu.classList.contains('is-open')) return;
    if (event.key === 'Escape') { setMenuOpen(false); return; }
    if (event.key !== 'Tab') return;
    const focusable = menuFocusables();
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    const active = document.activeElement;
    // Focus escaped the drawer (e.g. landed on <body>): pull it back in.
    if (!focusable.includes(active)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 721px)').addEventListener('change', event => {
    if (event.matches) setMenuOpen(false);
  });
  // Same-page anchors: unlock the body first, then smooth-scroll. Delegated in
  // the capture phase so it also covers links injected later (the "Sign in"
  // auth link) and runs before a link's own handler — the drawer closes and
  // focus moves to the ☰ button before e.g. the auth dialog takes focus, so
  // closing that dialog returns focus to the button instead of a hidden link.
  mobileMenu.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !mobileMenu.contains(link)) return;
    const target = document.querySelector(link.getAttribute('href'));
    setMenuOpen(false);
    if (target) {
      event.preventDefault();
      requestAnimationFrame(() => target.scrollIntoView({ behavior: scrollBehavior() }));
    }
  }, true);
}

// Contact / reach-out dialog (shared by "Still confused?" and the floating "Reach out to us" button)
const contactDialog = document.getElementById('contact-dialog');
if (contactDialog) {
  const contactMain = contactDialog.querySelector('.contact-main');
  const contactSuccess = contactDialog.querySelector('.contact-success');
  const contactForm = document.getElementById('contact-form');
  const nameInput = contactForm.querySelector('input[name="name"]');
  const phoneInput = contactForm.querySelector('input[name="phone"]');
  const fieldError = contactForm.querySelector('.field-error');
  const contactEcho = contactDialog.querySelector('.contact-echo');

  const showFieldError = message => {
    fieldError.textContent = message;
    fieldError.hidden = !message;
  };

  // The dialog is opened from ten different buttons ("Book free trial", "Talk to
  // a coach", "Support"…), so it introduces itself with the action the visitor
  // actually asked for instead of one generic heading for every entry point.
  const CONTACT_HEADINGS = [
    { test: /trial|free class|first class|book in/i, eyebrow: 'Free trial', title: 'Book your<br /><em>free trial.</em>' },
    { test: /coach|trainer|speak|talk|support|question/i, eyebrow: 'Talk to a coach', title: 'Talk to a<br /><em>coach.</em>' },
    { test: /visit|tour|direction|find us|come/i, eyebrow: 'Visit ONYX', title: 'Plan your<br /><em>visit.</em>' }
  ];
  const CONTACT_DEFAULT_HEADING = { eyebrow: 'Reach out to us', title: 'Talk to a<br /><em>human.</em>' };
  const contactEyebrow = contactMain.querySelector('.eyebrow');
  const contactTitle = contactDialog.querySelector('#contact-title');

  // Set by openClassBooking() when a visitor taps a specific session in the
  // timetable. Every other opener clears it, so a stale class can never leak
  // into an unrelated enquiry.
  let booking = null;

  const showContact = () => {
    contactSuccess.hidden = true;
    contactMain.hidden = false;
    showFieldError('');
    contactDialog.showModal();
    requestAnimationFrame(() => nameInput.focus());
  };

  const openContact = event => {
    booking = null;
    const label = String(event?.currentTarget?.textContent || '').replace(/\s+/g, ' ').trim();
    const heading = CONTACT_HEADINGS.find(h => h.test.test(label)) || CONTACT_DEFAULT_HEADING;
    if (contactEyebrow) contactEyebrow.textContent = heading.eyebrow;
    if (contactTitle) contactTitle.innerHTML = heading.title;
    showContact();
  };

  /* Per-class booking. The timetable hands over the exact session, so the
     visitor never retypes it and the gym receives it in the lead record.
     Time windows are read off the form itself — never hardcoded — so renaming
     an option cannot silently break the prefill. */
  const FULL_DAY = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  const toMinutes = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return (h || 0) * 60 + (m || 0); };

  const slotFor = (hhmm, timeField) => {
    if (!timeField) return '';
    const mins = toMinutes(hhmm);
    let best = '', bestDist = Infinity;
    [...timeField.options].forEach(option => {
      const bounds = option.value.match(/\d{1,2}:\d{2}/g);
      if (!bounds || bounds.length < 2) return;
      const shift = /pm/i.test(option.value) ? 12 * 60 : 0;
      const normalise = value => { const v = toMinutes(value); return v + (shift && v < 12 * 60 ? shift : 0); };
      const dist = Math.min(Math.abs(mins - normalise(bounds[0])), Math.abs(mins - normalise(bounds[1])));
      if (dist < bestDist) { bestDist = dist; best = option.value; }
    });
    return best;
  };

  // Next date that falls on the class's weekday, so "Mon 06:00" prefill is a
  // real future date rather than an empty field the visitor must work out.
  const nextDateFor = dayAbbr => {
    const order = Object.keys(FULL_DAY);
    const target = order.indexOf(dayAbbr);
    if (target < 0) return '';
    const now = new Date();
    const today = (now.getDay() + 6) % 7;               // 0 = Monday
    const delta = (target - today + 7) % 7 || 7;        // never a past date
    return new Date(now.getTime() + delta * 86400000).toLocaleDateString('en-CA');
  };

  const openClassBooking = session => {
    const name = String(session?.name || '').trim();
    const day = String(session?.day || '').trim();
    const time = String(session?.time || '').trim();
    if (!name) return;
    booking = { name, day, time };
    if (contactEyebrow) contactEyebrow.textContent = 'Book a class';
    if (contactTitle) {
      contactTitle.innerHTML = `${esc(name)}<br /><em>${esc(FULL_DAY[day] || day)} &middot; ${esc(time)}</em>`;
    }
    const dateField = contactForm.elements['preferred-date'];
    const timeField = contactForm.elements['preferred-time'];
    if (dateField) dateField.value = nextDateFor(day);
    const slot = slotFor(time, timeField);
    if (timeField && slot) timeField.value = slot;
    showContact();
  };
  // Exposed because the timetable builds its Book buttons after this block runs.
  window.openClassBooking = openClassBooking;
  document.querySelectorAll('[data-open-contact]').forEach(button => button.addEventListener('click', openContact));
  // Exposed so controls created later (mobile action bar) open the same way and
  // get the same contextual heading.
  window.openContactDialog = openContact;

  contactDialog.addEventListener('click', event => {
    if (event.target === contactDialog) contactDialog.close();
  });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
  });

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.replace(/\D/g, '');
    if (name.length < 2) return showFieldError('Please tell us your name.');
    if (!/^[6-9]\d{9}$/.test(phone)) return showFieldError('Enter a valid 10-digit Indian mobile number.');
    showFieldError('');

    const valueOf = name => { const field = contactForm.elements[name]; return field ? String(field.value || '').trim() : ''; };
    const goal = valueOf('goal');
    const capturedAt = new Date().toISOString();
    const lead = {
      name,
      phone: '+91' + phone,
      source: 'Website',
      plan: goal || 'General',
      at: capturedAt,
      preferredDate: valueOf('preferred-date'),
      preferredTime: valueOf('preferred-time'),
      goal,
      experience: valueOf('experience'),
      consent: !!contactForm.elements['contact-consent']?.checked,
      status: 'lead',
      followUp: '',
      notes: booking ? `Requested class: ${booking.name} \u2014 ${booking.day} ${booking.time}` : ''
    };
    const supabaseLead = {
      name,
      phone: '+91' + phone,
      source: 'website',
      plan: goal || 'General',
      preferred_date: valueOf('preferred-date') || null,
      preferred_time: valueOf('preferred-time') || null,
      goal: goal || null,
      experience: valueOf('experience') || null,
      consent: !!contactForm.elements['contact-consent']?.checked,
      status: 'lead',
      notes: `Page: ${window.location.pathname}` +
        (booking ? ` \u00b7 Requested class: ${booking.name}, ${booking.day} ${booking.time}` : ''),
      follow_up: null
    };
    try {
      const stored = JSON.parse(localStorage.getItem('onyx-leads') || '[]');
      stored.push(lead);
      localStorage.setItem('onyx-leads', JSON.stringify(stored));
    } catch (error) { console.warn('Could not store lead locally.', error); }

    let delivered = false;
    if (ONYX.CONTACT_ENDPOINT || (ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY)) {
      try {
        const endpoint = ONYX.CONTACT_ENDPOINT || `${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/leads`;
        const headers = { 'Content-Type': 'application/json' };
        if (!ONYX.CONTACT_ENDPOINT) {
          headers.apikey = ONYX.SUPABASE_KEY;
          headers.Authorization = `Bearer ${ONYX.SUPABASE_KEY}`;
          headers.Prefer = 'return=minimal';
        }
        const response = await fetch(endpoint, {
          method: 'POST', headers, body: JSON.stringify(ONYX.CONTACT_ENDPOINT ? lead : supabaseLead)
        });
        delivered = response.ok;
        if (!delivered) console.warn('Lead endpoint responded', response.status);
      } catch (error) { console.warn('Lead saved locally but could not reach the backend.', error); }
    }

    // No endpoint (or it failed): hand the lead straight to a human instead of
    // letting it die in localStorage. WhatsApp first, email as the fallback.
    if (!delivered) {
      const message = `Hi ONYX, please call me back.\n\nName: ${name}\nPhone: +91 ${phone}` +
        (booking ? `\nClass: ${booking.name}, ${booking.day} ${booking.time}` : '') +
        `\nPage: ${window.location.pathname}`;
      const handoff = contactSuccess.querySelector('.contact-handoff') || (() => {
        const el = document.createElement('p');
        el.className = 'contact-handoff';
        contactSuccess.querySelector('.contact-echo').after(el);
        return el;
      })();
      if (ONYX.DEMO_MODE) {
        handoff.textContent = 'Demo only — this request stayed in this browser and was not sent to the gym.';
      } else {
        const whatsapp = `https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent(message)}`;
        handoff.innerHTML =
          `<a class="handoff-primary" href="${whatsapp}" target="_blank" rel="noopener">Send it on WhatsApp</a>` +
          `<a href="tel:${ONYX.PHONE}">Call ${ONYX.PHONE}</a>` +
          `<a href="mailto:${ONYX.EMAIL}?subject=${encodeURIComponent('Call back request — ' + name)}&body=${encodeURIComponent(message)}">Email us</a>`;
        window.open(whatsapp, '_blank', 'noopener');
      }
    }

    contactEcho.textContent = `${name.toUpperCase()} · +91 ${phone.slice(0, 5)} ${phone.slice(5)}` +
      (booking ? ` · ${booking.name}, ${booking.day} ${booking.time}` : '');
    const successEyebrow = contactSuccess.querySelector('.eyebrow');
    const successTitle = contactSuccess.querySelector('.contact-success-title');
    const successCopy = contactSuccess.querySelector('.plans-confirmation-copy');
    if (delivered) {
      if (successEyebrow) successEyebrow.textContent = 'Request received';
      if (successTitle) successTitle.innerHTML = 'You’re on<br /><em>our list.</em>';
      if (successCopy) successCopy.textContent = 'Our team will reach out within 24 hours to confirm your preferred slot.';
    } else {
      if (successEyebrow) successEyebrow.textContent = 'One last step';
      if (successTitle) successTitle.innerHTML = 'Send it to<br /><em>ONYX.</em>';
      if (successCopy) successCopy.textContent = 'Your request is ready. Please use WhatsApp, call, or email below so a coach can confirm your slot. Nothing is booked until a human confirms it.';
    }
    contactForm.reset();
    contactMain.hidden = true;
    contactSuccess.hidden = false;
  });

  contactDialog.querySelector('.contact-done').addEventListener('click', () => contactDialog.close());
}

// ── Member accounts, assessment & profile (local demo store) ──────────────────
// Backend developer: replace with real auth. Seams: AUTH_ENDPOINT for signup/login,
// and swap readUsers/writeUsers/currentUser for token-based API calls. Passwords are
// SHA-256 hashed locally until then; this is demo-grade client-side auth only.
const USERS_KEY = 'onyx-users';
const SESSION_KEY = 'onyx-session';
let pendingAfterAuth = null;

/* Password hashing.
   Demo accounts live in this browser only, but they still must not store a
   password that survives a look-up table. PBKDF2-SHA256, 210k iterations
   (OWASP 2023 guidance), 16 random bytes of salt per user. Legacy records
   written by the old bare-SHA-256 build are re-hashed on next successful
   login, so nobody gets locked out. */
const PBKDF2_ITERATIONS = 210000;
const toHex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');

const legacyHash = async password => {
  if (window.crypto && crypto.subtle) {
    return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)));
  }
  return btoa(unescape(encodeURIComponent(password)));
};

const hashPassword = async (password, saltHex) => {
  if (!(window.crypto && crypto.subtle && crypto.subtle.importKey)) {
    return { algo: 'legacy-sha256', salt: '', hash: await legacyHash(password) };
  }
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return { algo: 'pbkdf2-sha256', salt: toHex(salt), hash: toHex(bits) };
};

// Constant-time-ish comparison so a timing side channel can't leak the digest.
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const verifyPassword = async (record, password) => {
  if (record.algo === 'pbkdf2-sha256' && record.salt) {
    const { hash } = await hashPassword(password, record.salt);
    return safeEqual(hash, record.pass);
  }
  return safeEqual(record.pass, await legacyHash(password));   // legacy record
};
const readUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; } };
const writeUsers = users => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const currentUser = () => {
  const email = localStorage.getItem(SESSION_KEY);
  const users = readUsers();
  return email && users[email] ? users[email] : null;
};
const saveCurrentUser = record => {
  const users = readUsers();
  const prev = users[record.email] || {};
  // Never let a stale in-memory snapshot overwrite a newer session
  // (e.g. one minted by a background refresh in another call or tab).
  if (prev.supabaseToken && jwtExpSeconds(prev.supabaseToken) > jwtExpSeconds(record.supabaseToken)) {
    record.supabaseToken = prev.supabaseToken;
    if (prev.supabaseRefreshToken) record.supabaseRefreshToken = prev.supabaseRefreshToken;
  } else if (prev.supabaseRefreshToken && !record.supabaseRefreshToken) {
    record.supabaseRefreshToken = prev.supabaseRefreshToken;
  }
  users[record.email] = record;
  writeUsers(users);
  syncRecordToSupabase(record);
};

const supabaseHeaders = token => ({
  'Content-Type': 'application/json',
  apikey: ONYX.SUPABASE_KEY,
  Authorization: `Bearer ${token || ONYX.SUPABASE_KEY}`
});

/* Supabase access tokens expire after ~1 hour. Login/signup stores the
   refresh_token alongside the access_token; before any shared-sync call we
   check the JWT's exp claim and silently renew the session when it is stale.
   Without this, an expired token makes the edge-function gateway reject the
   request (surfacing in the browser as an opaque "Failed to fetch") and the
   admin dashboard silently degrades to browser-local demo data. */
const jwtExpSeconds = token => {
  try {
    const part = String(token || '').split('.')[1];
    if (!part) return 0;
    const exp = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))).exp;
    return Number(exp) || 0;
  } catch { return 0; }
};
const supabaseTokenIsFresh = token => !!token && (jwtExpSeconds(token) - Date.now() / 1000) > 60;
let supabaseRefreshInFlight = null;
// Refreshes the session. Resolves to the NEW access token on success, to the
// untouched current token when no refresh was attempted (nothing to refresh
// with), or to null when a refresh was attempted and failed.
const refreshSupabaseSession = user => {
  const fallback = (user && user.supabaseToken) || '';
  if (!user || !user.email || !user.supabaseRefreshToken || !(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY)) {
    return Promise.resolve(fallback);
  }
  if (supabaseRefreshInFlight) return supabaseRefreshInFlight;
  const base = ONYX.SUPABASE_URL.replace(/\/$/, '');
  const refreshToken = user.supabaseRefreshToken;
  supabaseRefreshInFlight = (async () => {
    try {
      const response = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.access_token) return null;
      const users = readUsers();
      const record = users[user.email];
      if (record) {
        record.supabaseToken = payload.access_token;
        if (payload.refresh_token) record.supabaseRefreshToken = payload.refresh_token;
        writeUsers(users);
      }
      return payload.access_token;
    } catch { return null; }
    finally { supabaseRefreshInFlight = null; }
  })();
  return supabaseRefreshInFlight;
};
// Returns a usable access token for the user, refreshing it first if stale.
const ensureSupabaseToken = async user => {
  const target = user || currentUser();
  if (!target) return '';
  if (supabaseTokenIsFresh(target.supabaseToken)) return target.supabaseToken;
  if (target.supabaseRefreshToken) {
    const renewed = await refreshSupabaseSession(target);
    if (renewed) return renewed;
  }
  return target.supabaseToken || '';
};

const stripSupabaseAppData = record => {
  const copy = JSON.parse(JSON.stringify(record || {}));
  ['pass', 'salt', 'algo', 'supabaseToken', 'supabaseRefreshToken', 'supabaseRole', 'supabaseId', '_adminSource', '_sharedSyncedAt', 'pendingPayment'].forEach(key => { delete copy[key]; });
  ['name', 'email', 'phone', 'role', 'plan', 'expiresAt', 'activatedAt', 'assignedCoach', 'suspended'].forEach(key => { delete copy[key]; });
  return copy;
};
const mergeSupabaseMember = (record, profile, membership) => {
  const appData = profile && profile.app_data && typeof profile.app_data === 'object' ? JSON.parse(JSON.stringify(profile.app_data)) : {};
  const next = { ...(record || {}), ...appData };
  next.name = (profile && profile.full_name) || next.name || next.email || '';
  next.phone = (profile && profile.phone) || next.phone || '';
  next.role = (profile && profile.role) || next.role || 'member';
  next.supabaseRole = (profile && profile.role) || next.supabaseRole || next.role || 'member';
  next.assignedCoach = (profile && profile.assigned_coach_email) || next.assignedCoach || null;
  next.suspended = !!(profile && profile.suspended);
  next.plan = (membership && membership.plan) || (profile && profile.active_plan) || next.plan || null;
  next.activatedAt = normalizeSupabaseDate((membership && membership.starts_at) || next.activatedAt);
  next.expiresAt = normalizeSupabaseDate((membership && membership.ends_at) || (profile && profile.membership_expires_at) || next.expiresAt);
  next.lastPayment = next.lastPayment || {};
  if (profile && profile.last_payment_ref) next.lastPayment.ref = profile.last_payment_ref;
  if (profile && profile.last_payment_id) next.lastPayment.paymentId = profile.last_payment_id;
  if (membership && membership.status === 'pending' && next.plan) {
    next.pendingPayment = { plan: next.plan, ref: membership.payment_reference || (profile && profile.last_payment_ref) || '' };
  } else {
    next.pendingPayment = null;
  }
  return next;
};
const syncRecordToSupabase = async record => {
  const actor = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && actor && actor.supabaseToken && record && record.supabaseId)) return;
  const actorRole = String(actor.supabaseRole || actor.role || '').toLowerCase();
  const canWrite = actor.supabaseId === record.supabaseId || ['admin', 'manager', 'trainer'].includes(actorRole);
  if (!canWrite) return;
  const token = await ensureSupabaseToken(actor);
  if (!token) return;
  const base = ONYX.SUPABASE_URL.replace(/\/$/, '');
  const payload = {
    full_name: record.name || '',
    phone: record.phone || null,
    assigned_coach_email: record.assignedCoach || null,
    suspended: !!record.suspended,
    active_plan: record.plan || null,
    membership_expires_at: record.expiresAt || null,
    last_payment_ref: record.lastPayment && record.lastPayment.ref ? record.lastPayment.ref : null,
    last_payment_id: record.lastPayment && record.lastPayment.paymentId ? record.lastPayment.paymentId : null,
    app_data: stripSupabaseAppData(record)
  };
  try {
    await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(record.supabaseId)}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders(token), Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
  } catch (error) { console.warn('Supabase profile sync failed.', error); }
};
const syncCurrentUserFromSupabase = async () => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseId && user.supabaseToken)) return null;
  const token = await ensureSupabaseToken(user);
  if (!token) return null;
  const base = ONYX.SUPABASE_URL.replace(/\/$/, '');
  try {
    const [profileRes, membershipRes] = await Promise.all([
      fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(user.supabaseId)}&select=id,full_name,phone,role,assigned_coach_email,suspended,app_data,active_plan,membership_expires_at,last_payment_ref,last_payment_id`, {
        headers: { ...supabaseHeaders(token), Accept: 'application/json' }
      }),
      fetch(`${base}/rest/v1/memberships?member_id=eq.${encodeURIComponent(user.supabaseId)}&select=plan,status,starts_at,ends_at,payment_reference,created_at&order=created_at.desc&limit=1`, {
        headers: { ...supabaseHeaders(token), Accept: 'application/json' }
      })
    ]);
    if (!profileRes.ok) return null;
    const profiles = await profileRes.json().catch(() => []);
    const memberships = membershipRes.ok ? await membershipRes.json().catch(() => []) : [];
    const profile = profiles[0];
    if (!profile) return null;
    const merged = mergeSupabaseMember(user, profile, memberships[0] || null);
    const users = readUsers();
    const stored = users[merged.email] || {};
    // The stored record is the session source of truth — it may hold tokens
    // minted by a refresh that ran while this fetch was in flight. Never let
    // the pre-fetch snapshot overwrite them.
    merged.supabaseToken = stored.supabaseToken || token;
    merged.supabaseRefreshToken = stored.supabaseRefreshToken || merged.supabaseRefreshToken || user.supabaseRefreshToken || null;
    users[merged.email] = merged;
    writeUsers(users);
    return merged;
  } catch (error) {
    console.warn('Supabase self sync failed.', error);
    return null;
  }
};

const supabaseAuth = async (mode, email, password, name) => {
  if (!ONYX.SUPABASE_URL || !ONYX.SUPABASE_KEY) return null;
  const base = ONYX.SUPABASE_URL.replace(/\/$/, '');
  const path = mode === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
  let response;
  try {
    response = await fetch(base + path, {
      method: 'POST', headers: supabaseHeaders(),
      body: JSON.stringify(mode === 'signup' ? { email, password, data: { full_name: name } } : { email, password })
    });
  } catch (netErr) {
    const e = new Error('We could not reach the server. Please check your connection and try again.');
    e.code = 'NETWORK';
    throw e;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Supabase rate-limit for confirmation emails (free tier is ~3-4/hour)
    if (response.status === 429) {
      const e = new Error('We could not send the confirmation email just now. Please try again in a few minutes, or use Log in if you already have an account.');
      e.code = 'RATE_LIMIT';
      e.status = 429;
      e.payload = payload;
      throw e;
    }
    // Common Supabase signup errors that still create the user
    const msg = (payload.msg || payload.error_description || payload.message || '').toLowerCase();
    if (mode === 'signup' && (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already registered'))) {
      const e = new Error('That email is already registered — please use Log in.');
      e.code = 'USER_EXISTS';
      throw e;
    }
    const e = new Error(payload.msg || payload.error_description || payload.message || 'We could not sign you in. Please try again.');
    e.code = 'SUPABASE_ERROR';
    e.status = response.status;
    e.payload = payload;
    throw e;
  }
  const token = payload.access_token || null;
  const user = payload.user || payload || {};
  // Signup with Confirm email ON returns user but no session/token
  if (mode === 'signup' && !token) {
    // User was created but needs email confirmation
    return {
      email: (user.email || email),
      name: name || (user.email || email).split('@')[0],
      id: user.id || user.user_id || null,
      token: null,
      role: 'member',
      needsConfirmation: true,
      created: true,
      raw: payload
    };
  }
  let profile = {};
  if (token && (user.id || payload.user && payload.user.id)) {
    const uid = user.id || (payload.user && payload.user.id);
    try {
      const profileResponse = await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=full_name,phone,role`, { headers: { ...supabaseHeaders(token), Accept: 'application/json' } });
      const profiles = await profileResponse.json().catch(() => []);
      profile = profiles[0] || {};
    } catch (err) { /* profile fetch is optional */ }
  }
  return {
    email: (user.email || payload.user && payload.user.email || email),
    name: profile.full_name || name || (user.email || email).split('@')[0],
    id: (user.id || payload.user && payload.user.id || null),
    token,
    refreshToken: payload.refresh_token || null,
    role: profile.role || 'member',
    needsConfirmation: false,
    created: mode === 'signup'
  };
};

// Inject the auth + assessment dialogs once, on every page.
if (!document.getElementById('auth-dialog')) {
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="auth-dialog" id="auth-dialog" aria-labelledby="auth-title">
      <form method="dialog"><button class="plans-close" aria-label="Close" value="close"><span aria-hidden="true">✕</span></button></form>
      <p class="eyebrow">Member access</p>
      <h2 id="auth-title">Your ONYX<br /><em>account.</em></h2>
      <div class="auth-tabs" role="tablist" aria-label="Log in or create an account"><button type="button" class="auth-tab is-active" role="tab" id="auth-tab-login" aria-selected="true" aria-controls="auth-form" data-mode="login">Log in</button><button type="button" class="auth-tab" role="tab" id="auth-tab-signup" aria-selected="false" aria-controls="auth-form" data-mode="signup">Sign up</button></div>
      <p class="auth-note" id="auth-note" hidden></p>
      <form class="auth-form" id="auth-form" novalidate>
        <label class="field" id="auth-name-field" hidden><span class="field-label">YOUR NAME</span><input type="text" name="auth-name" autocomplete="name" placeholder="e.g. Aarav Sharma" /></label>
        <label class="field"><span class="field-label">EMAIL</span><input type="email" name="auth-email" autocomplete="email" placeholder="you@example.com" /></label>
        <label class="field"><span class="field-label">PASSWORD</span><input type="password" name="auth-password" autocomplete="current-password" placeholder="Min. 6 characters" /></label>
        <p class="field-error" id="auth-error" role="alert" hidden></p>
        <button type="submit" class="auth-submit">Log in</button>
        <div class="auth-alt" style="margin-top:14px;display:flex;flex-direction:column;gap:8px" hidden>
          <button type="button" class="auth-text-btn" id="auth-use-local" style="align-self:flex-start">Continue without the server</button>
        </div>
      </form>
    </dialog>`);
}
if (!document.getElementById('onboard-dialog')) {
  const chip = (field, value, label) => `<button type="button" data-value="${value}">${label}</button>`;
  const group = (label, field, chipsHtml) => `<div class="ob-group"><span class="field-label">${label}</span><div class="ob-chips" data-field="${field}">${chipsHtml}</div></div>`;
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="onboard-dialog" id="onboard-dialog" aria-labelledby="onboard-title">
      <form method="dialog"><button class="plans-close" aria-label="Skip assessment" value="close"><span aria-hidden="true">✕</span></button></form>
      <p class="eyebrow">Your assessment</p>
      <h2 id="onboard-title">Built for<br /><em>your body.</em></h2>
      <p class="contact-copy">Seven quick answers — your training week and diet plan write themselves onto your profile page.</p>
      <form class="ob-form" id="onboard-form" novalidate>
        <div class="ob-grid">
          <label class="field"><span class="field-label">AGE</span><input type="number" name="age" min="14" max="80" inputmode="numeric" placeholder="27" /></label>
          <label class="field"><span class="field-label">HEIGHT (CM)</span><input type="number" name="height" min="120" max="230" inputmode="numeric" placeholder="175" /></label>
          <label class="field"><span class="field-label">CURRENT WEIGHT (KG)</span><input type="number" name="weight" min="30" max="250" inputmode="decimal" step="0.5" placeholder="78" /></label>
          <label class="field"><span class="field-label">TARGET WEIGHT (KG)</span><input type="number" name="target" min="30" max="250" inputmode="decimal" step="0.5" placeholder="72" /></label>
        </div>
        ${group('SEX', 'sex', chip('sex','male','Male') + chip('sex','female','Female'))}
        ${group('MAIN GOAL', 'goal', chip('goal','build','Build muscle') + chip('goal','lose','Lose fat') + chip('goal','fit','Get fit & lean') + chip('goal','athlete','Athletic performance'))}
        ${group('TRAINING EXPERIENCE', 'experience', chip('experience','beginner','Beginner · &lt;6 mo') + chip('experience','intermediate','6–24 mo') + chip('experience','advanced','2+ years'))}
        ${group('DAYS YOU CAN TRAIN / WEEK', 'days', chip('days','3','3 days') + chip('days','4','4 days') + chip('days','5','5 days') + chip('days','6','6 days'))}
        ${group('DIET PREFERENCE', 'diet', chip('diet','veg','Vegetarian') + chip('diet','eggs','Eggs included') + chip('diet','nonveg','Non-veg'))}
        <p class="field-error" id="ob-error" role="alert" hidden></p>
        <button type="submit" class="auth-submit">Generate my plan</button>
        <button type="button" class="auth-text-btn" id="ob-skip">Skip for now</button>
      </form>
    </dialog>`);
}

const authDialog = document.getElementById('auth-dialog');
const onboardDialog = document.getElementById('onboard-dialog');
let authMode = 'login';

const openAuth = note => {
  const noteEl = document.getElementById('auth-note');
  noteEl.textContent = note || '';
  noteEl.hidden = !note;
  document.getElementById('auth-error').hidden = true;
  authDialog.showModal();
  requestAnimationFrame(() => authDialog.querySelector('input[name="auth-email"]').focus());
};
const openOnboard = () => {
  if (!onboardDialog.open) onboardDialog.showModal();
};
const runPendingAction = () => {
  const pending = pendingAfterAuth;
  pendingAfterAuth = null;
  if (!pending) return;
  document.querySelectorAll('dialog[open]').forEach(d => { if (d !== onboardDialog) d.close(); });
  if (pending.kind === 'payment') {
    // Route back through the single, safe entry point — never grant here.
    beginPaymentFlow(pending.link, pending.plan.replace(/ membership$/, ''));
  }
};
/* ---------------------------------------------------------------------------
   Payment flow — v70: NO client-side activation (free-membership exploit fix).
   - Production: a membership activates ONLY when the server endpoint
     (MEMBERSHIP_VERIFY_ENDPOINT) verifies the payment against Razorpay and
     returns { active: true }. There is deliberately NO fallback to
     browser-side confirmation, even when Razorpay reports status=paid.
   - No endpoint configured: payment stays PENDING until the owner confirms it
     in Admin → Members → "Set plan". The UI tells the user exactly that.
   - DEMO_MODE (presentation only): simulates activation locally, labeled demo.
   --------------------------------------------------------------------------- */
const paymentRef = () => 'ONYX-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

// Only plans that actually have a payment link can be activated — a forged
// plan name (e.g. smuggled in a URL parameter) can never mint a membership.
const isValidPlanName = name => {
  const n = String(name || '').trim();
  if (!n) return false;
  const base = n.replace(/ membership$/, '');
  return Object.keys(PAYMENT_LINKS).some(key => key === n || key === base);
};

const activateMembership = (user, payment, source = 'local') => {
  if (!user || !payment) return false;
  if (!isValidPlanName(payment.plan)) {
    console.warn('Refused membership activation for unknown plan:', payment.plan);
    return false;
  }
  user.plan = payment.plan;
  user.activatedAt = new Date().toISOString();
  user.expiresAt = addMonths(new Date(), planMonths(user.plan)).toISOString();
  user.pendingPayment = null;
  user.lastPayment = {
    ref: payment.ref,
    paymentId: payment.paymentId || null,
    plan: payment.plan,
    at: new Date().toISOString(),
    source,
    verified: true
  };
  saveCurrentUser(user);
  // Optional Supabase sync if configured
  if (ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user.supabaseId && user.supabaseToken) {
    const base = ONYX.SUPABASE_URL.replace(/\/$/, '');
    ensureSupabaseToken(user).then(token => fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(user.supabaseId)}`, {
      method: 'PATCH',
      headers: {
        ...supabaseHeaders(token || user.supabaseToken),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        active_plan: payment.plan,
        membership_expires_at: user.expiresAt,
        last_payment_ref: payment.ref,
        last_payment_id: payment.paymentId || null
      })
    })).catch(() => {});
  }
  pushNotif(user, '✅', `Payment confirmed — ${payment.plan} active till ${fmtDate(user.expiresAt)}!`);
  return true;
};

// Activation policy: the browser is NOT trusted with payments.
// - DEMO_MODE: local simulation (clearly labeled demo, for owner presentations).
// - MEMBERSHIP_VERIFY_ENDPOINT set: activate only on the server's explicit
//   { active: true }. A failed response or unreachable endpoint keeps the
//   payment PENDING — never a client-side fallback.
// - Neither set: return false. Only the owner (Admin → Members → "Set plan")
//   can activate after manually confirming the Razorpay payment.
const verifyMembership = async (user, payment) => {
  if (!user || !payment) return false;
  if (!isValidPlanName(payment.plan)) return false;
  if (ONYX.DEMO_MODE) {
    return activateMembership(user, payment, 'demo');
  }
  if (!ONYX.MEMBERSHIP_VERIFY_ENDPOINT) return false;
  try {
    const response = await fetch(ONYX.MEMBERSHIP_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: supabaseHeaders(), // anon-key JWT — verified by Supabase at the function edge
      body: JSON.stringify({ email: user.email, ref: payment.ref, plan: payment.plan, paymentId: payment.paymentId || null })
    });
    if (!response.ok) return false;
    const result = await response.json().catch(() => ({}));
    if (result && result.active === true) {
      return activateMembership(user, { ...payment, plan: result.plan || payment.plan }, 'backend');
    }
    return false;
  } catch (error) {
    console.warn('Payment verification endpoint unreachable — keeping membership pending.', error);
    return false;
  }
};

const beginPaymentFlow = (link, plan) => {
  const user = currentUser();
  if (!user) {
    pendingAfterAuth = { kind: 'payment', link, plan };
    openAuth('Log in or create your free ONYX account to continue to secure payment.');
    return;
  }
  const fullPlan = plan.includes('PT') ? plan : `${plan} membership`;
  const payment = {
    plan: fullPlan,
    ref: paymentRef(),
    startedAt: new Date().toISOString(),
    paymentId: null,
    link,
    demo: !!ONYX.DEMO_MODE,
    reportedStatus: null
  };
  user.pendingPayment = payment;
  saveCurrentUser(user);
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  if (!ONYX.DEMO_MODE) {
    // Add reference_id to Razorpay link for tracking if supported
    const sep = link.includes('?') ? '&' : '?';
    const linkWithRef = `${link}${sep}ref=${encodeURIComponent(payment.ref)}`;
    window.open(linkWithRef, '_blank', 'noopener');
  }
  showPaymentPending(payment);
  if (document.body.classList.contains('profile-page') && typeof renderProfile === 'function') renderProfile();
};

/* Put the confirmation panel back into its PENDING wording.
   The verified-return path (see the razorpay_payment_link_status handler)
   rewrites the heading and replaces the copy paragraph's text outright, which
   destroys the .chosen-plan element. Without this reset a LATER pending payment
   inherits "Payment confirmed." plus the previous plan's activation date, and
   silently loses its plan name. So rebuild the wording every time rather than
   trusting whatever the last render happened to leave behind. */
const setConfirmationPending = (confirmation, plan) => {
  if (!confirmation) return null;
  const eyebrow = confirmation.querySelector('.eyebrow');
  if (eyebrow) eyebrow.textContent = 'You\u2019re all set';
  const heading = confirmation.querySelector('h3');
  if (heading) heading.innerHTML = 'Welcome to<br /><em>ONYX.</em>';
  let copyEl = confirmation.querySelector('.plans-confirmation-copy');
  if (!copyEl) {
    copyEl = document.createElement('p');
    copyEl.className = 'plans-confirmation-copy';
    if (heading) heading.after(copyEl);
    else confirmation.appendChild(copyEl);
  }
  copyEl.innerHTML = `You chose <strong class="chosen-plan">${esc(plan)}</strong>. ` +
    'Our team will reach out within 24 hours to set up your first session.';
  const chosenEl = confirmation.querySelector('.chosen-plan');
  if (chosenEl) chosenEl.textContent = plan;
  return copyEl;
};

const showPaymentPending = payment => {
  const dialog = document.getElementById('plans-dialog');
  if (!dialog) return;
  const main = dialog.querySelector('.plans-main');
  const confirmation = dialog.querySelector('.plans-confirmation');
  const copyEl = setConfirmationPending(confirmation, payment.plan);

  let note = confirmation.querySelector('.payment-ref');
  if (!note) {
    note = document.createElement('p');
    note.className = 'payment-ref';
    if (copyEl) copyEl.after(note);
    else confirmation.appendChild(note);
  }

  let actions = confirmation.querySelector('.payment-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'payment-actions';
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-top:18px';
    note.after(actions);
  }

  const isPT = payment.plan.includes('PT');
  const hasServerVerify = !ONYX.DEMO_MODE && !!ONYX.MEMBERSHIP_VERIFY_ENDPOINT;
  const nextStep = ONYX.DEMO_MODE
    ? `This is a presentation demo — no payment was taken. Click Verify to simulate activation.`
    : isPT
      ? `A coach will call you within 24 hours to schedule your sessions once payment clears.`
      : `Our team confirms your payment and activates your plan the moment it clears — it will show up on your profile automatically.`;

  note.innerHTML = `Reference <strong>${payment.ref}</strong>. ${nextStep}` +
    (ONYX.DEMO_MODE ? `` : hasServerVerify
      ? `<br/><small style="opacity:.7">If Razorpay redirects back, we verify and activate automatically. If you closed the tab, use the button below.</small>`
      : `<br/><small style="opacity:.7">If you closed the tab or the payment page looked off, message us on WhatsApp below with your reference — we'll match the payment to your account.</small>`);

  // Build action buttons
  actions.innerHTML = '';
  const verifyBtn = document.createElement('button');
  verifyBtn.type = 'button';
  verifyBtn.className = 'solid-button directional-tile';
  verifyBtn.innerHTML = `<span>${ONYX.DEMO_MODE ? 'Verify (demo — simulates)' : ONYX.MEMBERSHIP_VERIFY_ENDPOINT ? 'Verify payment' : 'Check payment status'}</span><b class="arrow-icon" aria-hidden="true">→</b>`;
  verifyBtn.onclick = async () => {
    verifyBtn.disabled = true;
    verifyBtn.querySelector('span').textContent = 'Verifying…';
    const user = currentUser();
    if (!user || !user.pendingPayment) {
      verifyBtn.querySelector('span').textContent = 'No pending payment';
      setTimeout(() => { verifyBtn.disabled = false; verifyBtn.querySelector('span').textContent = 'Verify payment'; }, 2000);
      return;
    }
    const ok = await verifyMembership(user, user.pendingPayment);
    if (ok) {
      confirmation.querySelector('h3').innerHTML = `Payment<br/><em>confirmed.</em>`;
      if (copyEl) copyEl.textContent = `${user.plan} is now active till ${fmtDate(user.expiresAt)}. Welcome to ONYX — your training week and diet plan are unlocked.`;
      note.innerHTML = `✅ Activated via <strong>${user.lastPayment?.source || 'local'}</strong> · Ref <strong>${user.lastPayment?.ref}</strong>${user.lastPayment?.paymentId ? ` · ID ${esc(String(user.lastPayment.paymentId).slice(0, 20))}` : ''}`;
      actions.innerHTML = `<button type="button" class="solid-button directional-tile" id="go-profile"><span>Go to my profile</span><b class="arrow-icon" aria-hidden="true">→</b></button>`;
      const goBtn = actions.querySelector('#go-profile');
      if (goBtn) goBtn.onclick = () => { dialog.close(); window.location.href = 'profile.html'; };
      if (typeof renderProfile === 'function') renderProfile();
      if (typeof renderMembership === 'function') renderMembership(user);
    } else {
      verifyBtn.disabled = false;
      const pendingOnly = !ONYX.DEMO_MODE && !ONYX.MEMBERSHIP_VERIFY_ENDPOINT;
      verifyBtn.querySelector('span').textContent = pendingOnly ? 'Still awaiting confirmation' : 'Verification failed — try again';
      const waLink = `https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent('Hi ONYX, I paid for ' + payment.plan + ' ref ' + payment.ref)}`;
      note.innerHTML += pendingOnly
        ? `<br/><small>Payments can’t self-activate — the front desk confirms it and your plan activates automatically (usually within a few hours). To speed it up, <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> with ref ${payment.ref}.</small>`
        : `<br/><small style="color:#ff6b6b">Could not verify. If you paid, wait 30s and try again, or <a href="${waLink}" target="_blank" rel="noopener">message us on WhatsApp</a> with ref ${payment.ref}.</small>`;
    }
  };

  const waBtn = document.createElement('a');
  waBtn.className = 'ghost-button directional-tile';
  waBtn.style.cssText = 'text-decoration:none;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border:1px solid var(--line)';
  waBtn.target = '_blank';
  waBtn.rel = 'noopener';
  waBtn.href = `https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent('Hi ONYX, I just paid for ' + payment.plan + '. My reference is ' + payment.ref + '.')}`;
  waBtn.innerHTML = `<span>WhatsApp us</span><b class="arrow-icon" aria-hidden="true">→</b>`;

  actions.appendChild(verifyBtn);
  if (!ONYX.DEMO_MODE) actions.appendChild(waBtn);

  if (main) main.hidden = true;
  confirmation.hidden = false;
  if (!dialog.open) dialog.showModal();
};

// Auto-confirmation on return from Razorpay
// Handles: razorpay_payment_link_status, razorpay_payment_id, razorpay_payment_link_id, reference_id
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('razorpay_payment_link_status') || params.get('status');
  const paymentId = params.get('razorpay_payment_id') || params.get('razorpay_payment_link_id') || params.get('payment_id');
  const ref = params.get('razorpay_payment_link_reference_id') || params.get('ref') || params.get('reference_id');

  if (!status && !paymentId) return;

  const user = currentUser();
  if (!user) {
    history.replaceState(null, '', window.location.pathname);
    return;
  }

  // If pending payment exists, update it
  if (user.pendingPayment) {
    if (paymentId) user.pendingPayment.paymentId = paymentId;
    if (status) user.pendingPayment.reportedStatus = status;
    if (ref) user.pendingPayment.gatewayRef = ref;
    saveCurrentUser(user);

    if (status === 'paid' || status === 'captured' || status === 'authorized') {
      const ok = await verifyMembership(user, user.pendingPayment);
      if (ok) {
        // Show success dialog
        const dialog = document.getElementById('plans-dialog');
        if (dialog) {
          const main = dialog.querySelector('.plans-main');
          const confirmation = dialog.querySelector('.plans-confirmation');
          if (main) main.hidden = true;
          if (confirmation) {
            confirmation.hidden = false;
            const h3 = confirmation.querySelector('h3');
            if (h3) h3.innerHTML = `Payment<br/><em>confirmed.</em>`;
            const copy = confirmation.querySelector('.plans-confirmation-copy');
            if (copy) copy.textContent = `${user.plan} is now active till ${fmtDate(user.expiresAt)}. Verified via Razorpay return.`;
            let note = confirmation.querySelector('.payment-ref');
            if (note) note.innerHTML = `✅ Verified · Ref <strong>${user.lastPayment?.ref}</strong> · Razorpay ID <strong>${esc(String(paymentId || '').slice(0, 24))}</strong>`;
            let actions = confirmation.querySelector('.payment-actions');
            if (actions) actions.innerHTML = `<button type="button" class="solid-button directional-tile" onclick="window.location.href='profile.html'"><span>Go to my profile</span><b class="arrow-icon" aria-hidden="true">→</b></button>`;
          }
          if (!dialog.open) dialog.showModal();
        }
      } else if (status === 'abandoned') {
        // Payment link closed without a captured payment — tell the user plainly.
        showPaymentPending(user.pendingPayment);
      } else {
        // Razorpay says "paid" but the server (or configured verification)
        // didn't confirm it — keep it PENDING and tell the user plainly.
        showPaymentPending(user.pendingPayment);
      }
    }
  } else if (status === 'paid' && paymentId) {
    // Razorpay returned "paid" but this account has no pending payment.
    // We deliberately do NOT try to recover/activate from URL parameters —
    // without a server check, that is how free memberships get minted.
    // The user should contact the front desk with their reference.
    console.warn('Razorpay paid-return without a pending payment — no auto-activation. User should contact the front desk.');
  }

  history.replaceState(null, '', window.location.pathname);
  if (document.body.classList.contains('profile-page') && typeof renderProfile === 'function') renderProfile();
});

authDialog.querySelectorAll('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
  authMode = tab.dataset.mode;
  authDialog.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('is-active', t === tab);
    t.setAttribute('aria-selected', String(t === tab));
  });
  document.getElementById('auth-name-field').hidden = authMode === 'login';
  authDialog.querySelector('.auth-submit').textContent = authMode === 'login' ? 'Log in' : 'Create account';
}));

const useLocalBtn = authDialog.querySelector('#auth-use-local');
if (useLocalBtn) {
  useLocalBtn.addEventListener('click', () => {
    // Temporarily disable Supabase for this session so local demo works instantly
    const note = document.getElementById('auth-note');
    if (note) {
      note.textContent = 'Continuing without the server — your details stay in this browser only. Reload the page to reconnect.';
      note.hidden = false;
    }
    const err = document.getElementById('auth-error');
    if (err) err.hidden = true;
    // Clear Supabase config for this page load
    ONYX.SUPABASE_URL = '';
    ONYX.SUPABASE_KEY = '';
    useLocalBtn.textContent = 'Offline mode active — reload the page to reconnect';
    useLocalBtn.disabled = true;
  });
}

authDialog.addEventListener('click', event => { if (event.target === authDialog) authDialog.close(); });
onboardDialog.addEventListener('click', event => { if (event.target === onboardDialog) { onboardDialog.close(); runPendingAction(); } });

document.querySelectorAll('[data-open-auth]').forEach(button => button.addEventListener('click', () => openAuth()));

// ── Post-auth routing — role aware ─────────────────────────────────────
const handlePostAuth = (user, opts = {}) => {
  const isSignup = !!opts.isSignup;
  updateAuthLinks();
  if (typeof renderProfile === 'function') renderProfile();
  if (typeof renderCoach === 'function') renderCoach();
  if (typeof renderAdmin === 'function') renderAdmin();
  if (user && user.supabaseToken) {
    syncCurrentUserFromSupabase().then(() => {
      updateAuthLinks();
      if (typeof renderProfile === 'function') renderProfile();
      if (typeof renderCoach === 'function') renderCoach();
      if (typeof renderAdmin === 'function') renderAdmin();
    });
    if (canAccessTrainer(user)) loadAdminSupabaseMembers(true);
  }
  const role = roleOf(user);
  // Role-based auto-routing: staff should land in their own dashboard, never member upsell
  if (role === 'admin' || role === 'manager') {
    if (!document.body.classList.contains('admin-page')) {
      // If on profile or trainer page, or coming from index with ?redirect, go to admin
      if (document.body.classList.contains('profile-page') || document.body.classList.contains('coach-page') || isSignup) {
        window.location.href = 'admin.html';
        return;
      }
    }
  } else if (role === 'trainer') {
    if (!document.body.classList.contains('coach-page') && !document.body.classList.contains('admin-page')) {
      if (document.body.classList.contains('profile-page') || isSignup) {
        window.location.href = 'trainers.html';
        return;
      }
    }
  }
  // Member flow
  if (isSignup) openOnboard();
  else runPendingAction();
};

document.getElementById('auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const errorEl = document.getElementById('auth-error');
  const fail = message => { errorEl.textContent = message; errorEl.hidden = !message; };
  const form = event.target;
  const email = form.querySelector('input[name="auth-email"]').value.trim().toLowerCase();
  const password = form.querySelector('input[name="auth-password"]').value;
  const nameField = form.querySelector('input[name="auth-name"]');
  const name = nameField.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
  if (password.length < 6) return fail('Password needs at least 6 characters.');
  if (authMode === 'signup' && name.length < 2) return fail('Please tell us your name.');
  fail('');

  // Helper to create a local demo account when Supabase is unavailable or rate-limited
  const createLocalAccount = async (email, password, name) => {
    const users = readUsers();
    if (users[email]) {
      // already exists locally — verify password later via normal flow
      return users[email];
    }
    const { algo, salt, hash } = await hashPassword(password);
    const record = { name: name || email.split('@')[0], email, algo, salt, pass: hash, createdAt: new Date().toISOString(), onboarded: false, profile: null, plan: null, pendingPayment: null };
    users[email] = record;
    writeUsers(users);
    return record;
  };

  if (ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY) {
    try {
      const remote = await supabaseAuth(authMode, email, password, name);
      // Case: signup succeeded but needs email confirmation (no token)
      if (remote.needsConfirmation) {
        // Still create a local demo account so user can continue immediately
        const localUser = await createLocalAccount(email, password, remote.name || name);
        // Preserve role from Supabase if present
        if (remote.role) { localUser.supabaseRole = remote.role; localUser.role = remote.role; saveCurrentUser(localUser); }
        localStorage.setItem(SESSION_KEY, email);
        form.reset();
        authDialog.close();
        handlePostAuth(localUser, { isSignup: true });
        // Non-blocking info for next open
        setTimeout(() => {
          const note = document.getElementById('auth-note');
          if (note) {
            note.textContent = 'Your account is created. Check your inbox to confirm your email, then use Log in.';
            note.hidden = false;
          }
        }, 400);
        return;
      }
      const record = { name: remote.name, email: remote.email, supabaseId: remote.id, supabaseToken: remote.token, supabaseRefreshToken: remote.refreshToken || null, supabaseRole: remote.role, role: remote.role, createdAt: new Date().toISOString(), onboarded: false, profile: null, plan: null, pendingPayment: null };
      saveCurrentUser(record);
      localStorage.setItem(SESSION_KEY, email);
      form.reset(); authDialog.close();
      handlePostAuth(record, { isSignup: authMode === 'signup' });
      return;
    } catch (error) {
      // RATE_LIMIT (429) — try login if we were signing up, else fallback to local
      if (error.code === 'RATE_LIMIT' && authMode === 'signup') {
        try {
          const remoteLogin = await supabaseAuth('login', email, password, name);
          if (remoteLogin && remoteLogin.token) {
            const record = { name: remoteLogin.name, email: remoteLogin.email, supabaseId: remoteLogin.id, supabaseToken: remoteLogin.token, supabaseRefreshToken: remoteLogin.refreshToken || null, supabaseRole: remoteLogin.role, role: remoteLogin.role, createdAt: new Date().toISOString(), onboarded: false, profile: null, plan: null, pendingPayment: null };
            saveCurrentUser(record);
            localStorage.setItem(SESSION_KEY, email);
            form.reset(); authDialog.close();
            handlePostAuth(record, { isSignup: false });
            return;
          }
        } catch (loginErr) {
          // login also rate-limited or not confirmed — fall through to local fallback
        }
        // Fallback to local demo account so user isn't blocked
        const users = readUsers();
        if (users[email]) {
          return fail('We could not send the confirmation email just now. Please try again in a few minutes, or use Log in if you already have an account.');
        }
        try {
          const localRec = await createLocalAccount(email, password, name);
          localStorage.setItem(SESSION_KEY, email);
          form.reset(); authDialog.close();
          handlePostAuth(localRec, { isSignup: true });
          console.warn('Supabase 429 — created local demo account instead:', error.message);
          return;
        } catch (localErr) {
          return fail(error.message);
        }
      }
      if (error.code === 'USER_EXISTS') {
        // Switch UI to login mode
        authMode = 'login';
        const authDialogEl = document.getElementById('auth-dialog');
        if (authDialogEl) {
          authDialogEl.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('is-active', t.dataset.mode === 'login'));
          const nameField = document.getElementById('auth-name-field');
          if (nameField) nameField.hidden = true;
          const submitBtn = authDialogEl.querySelector('.auth-submit');
          if (submitBtn) submitBtn.textContent = 'Log in';
        }
        return fail('That email is already registered — we have switched you to Log in. Enter your password to continue.');
      }
      // For login, if Supabase fails, try local fallback instead of hard error
      if (authMode === 'login') {
        const users = readUsers();
        const localRecord = users[email];
        if (localRecord) {
          // let the local login logic below handle it — don't return error yet
          console.warn('Supabase login failed, trying local account:', error.message);
        } else {
          // No local account either — show Supabase error but hint at local creation
          if (error.code === 'RATE_LIMIT') {
            return fail('Too many attempts in a short time. Please wait a minute and try again.');
          }
          return fail('We could not reach the server. Please try again in a moment.');
        }
      } else {
        // Signup — any other Supabase error, fallback to local demo so user isn't blocked
        try {
          const users = readUsers();
          if (!users[email]) {
            const rec = await createLocalAccount(email, password, name);
            localStorage.setItem(SESSION_KEY, email);
            form.reset(); authDialog.close();
            handlePostAuth(rec, { isSignup: true });
            console.warn('Supabase signup failed, created local account:', error.message);
            return;
          }
        } catch (e) { /* fall through */ }
        return fail('We could not reach the server. Please try again in a moment.');
      }
    }
  }

  const users = readUsers();
  if (authMode === 'signup') {
    if (users[email]) return fail('That email already has an account — log in instead.');
    const { algo, salt, hash } = await hashPassword(password);
    const record = { name, email, algo, salt, pass: hash, role: 'member', supabaseRole: 'member', createdAt: new Date().toISOString(), onboarded: false, profile: null, plan: null, pendingPayment: null };
    users[email] = record;
    writeUsers(users);
    localStorage.setItem(SESSION_KEY, email);
    form.reset();
    authDialog.close();
    handlePostAuth(record, { isSignup: true });
  } else {
    const record = users[email];
    let lock = {};
    try { lock = JSON.parse(localStorage.getItem('onyx_login_lock') || '{}'); } catch (err) { lock = {}; }
    if (lock.until && Date.now() < lock.until) return fail('Too many tries — wait a minute and try again.');
    if (!record || !(await verifyPassword(record, password))) {
      lock.n = (lock.n || 0) + 1;
      if (lock.n >= 5) { lock.until = Date.now() + 60000; lock.n = 0; }
      try { localStorage.setItem('onyx_login_lock', JSON.stringify(lock)); } catch (err) { /* private mode */ }
      return fail(lock.until && Date.now() < lock.until ? 'Too many tries — wait a minute and try again.' : 'Wrong email or password.');
    }
    try { localStorage.removeItem('onyx_login_lock'); } catch (err) { /* private mode */ }
    if (record.algo !== 'pbkdf2-sha256') {          // silently upgrade legacy hashes
      const { algo, salt, hash } = await hashPassword(password);
      Object.assign(record, { algo, salt, pass: hash });
      writeUsers(users);
    }
    localStorage.setItem(SESSION_KEY, email);
    form.reset();
    authDialog.close();
    handlePostAuth(record, { isSignup: false });
  }
});

// Assessment: chips + validation + plan generation
const obForm = document.getElementById('onboard-form');
const obState = {};
onboardDialog.querySelectorAll('.ob-chips').forEach(groupEl => {
  groupEl.addEventListener('click', event => {
    const chipButton = event.target.closest('button[data-value]');
    if (!chipButton) return;
    obState[groupEl.dataset.field] = chipButton.dataset.value;
    groupEl.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b === chipButton));
  });
});
document.getElementById('ob-skip').addEventListener('click', () => { onboardDialog.close(); runPendingAction(); });
onboardDialog.addEventListener('close', () => runPendingAction());

const GOAL_LABELS = { build: 'Build muscle', lose: 'Lose fat', fit: 'Get fit & lean', athlete: 'Athletic performance', strength: 'Strength', endurance: 'Endurance' };
const EXP_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

const generateMemberPlan = p => {
  const bmr = p.sex === 'female'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age - 161
    : 10 * p.weight + 6.25 * p.height - 5 * p.age + 5;
  const activity = { 3: 1.4, 4: 1.5, 5: 1.55, 6: 1.65 }[p.days] || 1.45;
  const goalDelta = { build: 0.1, lose: -0.2, fit: -0.05, athlete: 0.05 }[p.goal] || 0;
  const calories = Math.min(3800, Math.max(1200, Math.round(bmr * activity * (1 + goalDelta) / 10) * 10));
  const protein = Math.round(p.weight * 1.8);
  const perMeal = Math.max(20, Math.round(protein / 4));

  const splits = {
    beginner: [
      ['Full body A', ['Goblet squat — 3 × 10', 'Bench press — 3 × 8', 'Seated row — 3 × 10', 'Plank — 3 × 30s']],
      ['Full body B', ['Romanian deadlift — 3 × 8', 'Overhead press — 3 × 8', 'Lat pulldown — 3 × 10', 'Glute bridge — 3 × 12', 'Farmer carry — 3 × 30m']]
    ],
    intermediate: [
      ['Upper body', ['Bench press — 4 × 6', 'Barbell row — 4 × 8', 'Incline dumbbell press — 3 × 10', 'Lat pulldown — 3 × 10', 'Lateral raise — 3 × 12']],
      ['Lower body', ['Back squat — 4 × 6', 'Romanian deadlift — 3 × 8', 'Leg press — 3 × 10', 'Seated leg curl — 3 × 12', 'Standing calf raise — 4 × 12']]
    ],
    advanced: [
      ['Push', ['Bench press — 4 × 5', 'Overhead press — 3 × 8', 'Incline dumbbell press — 3 × 10', 'Weighted dips — 2 × 8']],
      ['Pull', ['Deadlift — 4 × 5', 'Pull-ups — 3 × 6', 'Barbell row — 3 × 8', 'Face pulls — 3 × 12']],
      ['Legs + core', ['Back squat — 4 × 6', 'Romanian deadlift — 3 × 8', 'Walking lunges — 3 × 10 / side', 'Hanging leg raise — 3 × 12']]
    ]
  }[p.experience] || [];

  const finisher = { build: '', lose: 'Bike / rope finisher — 10 min', fit: 'Core circuit — 8 min', athlete: 'Sprints — 6 × 40m' }[p.goal] || '';
  const week = Array.from({ length: p.days }, (_, i) => {
    const [focus, items] = splits[i % splits.length];
    return { label: `Day ${i + 1}`, focus, items: finisher ? [...items, finisher] : items };
  });

  const mealsByDiet = {
    veg: [
      ['Breakfast', `Oats porridge in milk, banana, 1 tbsp peanut butter, paneer bhurji on toast (~${perMeal}g protein)`],
      ['Lunch', `2 rotis, dal, jeera rice small portion, big salad bowl, curd (~${perMeal}g protein)`],
      ['Snack', `Soya chunks fry or roasted chana + buttermilk (~${perMeal}g protein)`],
      ['Dinner', `Paneer sabzi or mixed dal khichdi + veggies, 1 roti (~${perMeal}g protein)`]
    ],
    eggs: [
      ['Breakfast', `4 eggs (2 whole + whites), oats with milk, fruit (~${perMeal}g protein)`],
      ['Lunch', `2 rotis, dal, rice small portion, salad, curd (~${perMeal}g protein)`],
      ['Snack', `3 boiled eggs + sprouts chaat (~${perMeal}g protein)`],
      ['Dinner', `Paneer/tofu sabzi + veggies + 1 roti (~${perMeal}g protein)`]
    ],
    nonveg: [
      ['Breakfast', `Oats + milk + fruit + 3 egg whites (~${perMeal}g protein)`],
      ['Lunch', `150g chicken curry, 2 rotis, rice small, salad (~${perMeal}g protein)`],
      ['Snack', `Greek yogurt / paneer + nuts (~${perMeal}g protein)`],
      ['Dinner', `150g chicken or fish + veggies + 1 roti (~${perMeal}g protein)`]
    ]
  }[p.diet];

  return { calories, protein, week, meals: mealsByDiet };
};

obForm.addEventListener('submit', event => {
  event.preventDefault();
  const errorEl = document.getElementById('ob-error');
  const fail = message => { errorEl.textContent = message; errorEl.hidden = !message; };
  const num = name => parseFloat(obForm.querySelector(`input[name="${name}"]`).value);
  const p = {
    age: num('age'), height: num('height'), weight: num('weight'), target: num('target'),
    sex: obState.sex, goal: obState.goal, experience: obState.experience,
    days: parseInt(obState.days, 10), diet: obState.diet
  };
  if (!(p.age >= 14 && p.age <= 80)) return fail('Age must be between 14 and 80.');
  if (!(p.height >= 120 && p.height <= 230)) return fail('Height must be between 120 and 230 cm.');
  if (!(p.weight >= 30 && p.weight <= 250)) return fail('Enter your current weight in kg.');
  if (!(p.target >= 30 && p.target <= 250)) return fail('Enter your target weight in kg.');
  for (const field of ['sex', 'goal', 'experience', 'diet']) {
    if (!p[field]) return fail('Pick one option in every row below the numbers.');
  }
  if (!p.days) return fail('Pick how many days a week you can train.');
  fail('');

  const user = currentUser();
  if (!user) return fail('Session expired — log in again.');
  const generated = generateMemberPlan(p);
  user.profile = { ...p, ...generated, assessedAt: new Date().toISOString() };
  user.onboarded = true;
  saveCurrentUser(user);
  onboardDialog.close();
  if (typeof renderProfile === 'function') renderProfile();
});

// Header: show "Sign in" when logged out, first name (→ profile) when logged in.
const updateAuthLinks = () => {
  document.querySelectorAll('.auth-nav').forEach(el => el.remove());
  const user = currentUser();
  document.querySelectorAll('.site-header nav, .mobile-menu nav').forEach(nav => {
    const link = document.createElement('a');
    link.className = 'nav-directional auth-nav';
    if (user) {
      const role = roleOf(user);
      if (role === 'admin' || role === 'manager') link.href = 'admin.html';
      else if (role === 'trainer') link.href = 'trainers.html';
      else link.href = 'profile.html';
      link.textContent = `${user.name.split(' ')[0]} · ${role.toUpperCase()}`;
      link.title = `${user.email} — ${role}`;
    } else {
      link.href = '#signin';
      link.textContent = 'Sign in';
      link.addEventListener('click', event => { event.preventDefault(); openAuth(); });
    }
    nav.appendChild(link);
  });
}; // Coach emails unlock Coach Studio, e.g. ['coach@trainwithonyx.fwh.is'].

/* ── Role system — single source of truth ────────────────────────────────
   Supabase `profiles.role` is authoritative. Email lists are fallback for
   local demo accounts. Canonical roles: admin (owner), manager, trainer,
   member (default), receptionist.
   Hierarchy: admin > manager > trainer > member.
   - Admin: full access — admin dashboard all tabs, trainer dashboard, member view override
   - Manager: admin dashboard limited (members, reminders, inventory, reports) + trainer access
   - Trainer: trainer dashboard only, no admin
   - Member: profile.html only
   ------------------------------------------------------------------------ */
/* ===========================================================================
   SHARED CORE UTILITIES — promoted here from the dashboard sections (role
   helpers, formatting, gamification points, supabase roster sync, site CMS)
   so this core file is self-contained. js/dashboard.js and js/admin.js load
   after it and re-use these bindings.
   =========================================================================== */
ONYX.ADMIN_EMAILS = ONYX.ADMIN_EMAILS || [];
ONYX.MANAGER_EMAILS = ONYX.MANAGER_EMAILS || [];
ONYX.COACH_EMAILS = ONYX.COACH_EMAILS || [];
const normalizeRole = user => {
  if (!user) return 'guest';
  const raw = String(user.supabaseRole || user.role || '').toLowerCase().trim();
  if (['admin', 'owner'].includes(raw)) return 'admin';
  if (['manager'].includes(raw)) return 'manager';
  if (['trainer', 'coach'].includes(raw)) return 'trainer';
  if (['receptionist', 'staff'].includes(raw)) return 'receptionist';
  const email = String(user.email || '').toLowerCase();
  if (ONYX.ADMIN_EMAILS.map(e => String(e).toLowerCase()).includes(email)) return 'admin';
  if (ONYX.MANAGER_EMAILS.map(e => String(e).toLowerCase()).includes(email)) return 'manager';
  if (ONYX.COACH_EMAILS.map(e => String(e).toLowerCase()).includes(email)) return 'trainer';
  return 'member';
};
const roleOf = user => normalizeRole(user);
const isAdminStrict = user => roleOf(user) === 'admin';
const isManagerStrict = user => roleOf(user) === 'manager';
const isTrainerStrict = user => roleOf(user) === 'trainer';
const isAdmin = user => roleOf(user) === 'admin'; // strict admin only
const isManager = user => ['admin', 'manager'].includes(roleOf(user)); // admin has manager perms
const isTrainer = user => ['admin', 'manager', 'trainer'].includes(roleOf(user)); // admin/manager can access trainer
const isCoach = isTrainer; // legacy alias
const isMember = user => roleOf(user) === 'member';
const isReceptionist = user => roleOf(user) === 'receptionist';
const canAccessAdmin = isManager; // admin + manager
const canAccessTrainer = isTrainer; // admin + manager + trainer

const routeByRole = user => {
  if (!user) return;
  const role = roleOf(user);
  const body = document.body;
  const onAdmin = body.classList.contains('admin-page');
  const onCoach = body.classList.contains('coach-page');
  const onProfile = body.classList.contains('profile-page');
  // Admin/Manager should live in admin.html, Trainer in trainers.html, Member in profile.html
  if ((role === 'admin' || role === 'manager') && !onAdmin) {
    // Avoid redirect loop from index — only auto-route when coming from auth or profile/coach pages
    if (onProfile || onCoach || window.location.pathname.includes('profile.html') || window.location.pathname.includes('trainers.html')) {
      window.location.href = 'admin.html';
    }
  } else if (role === 'trainer' && !onCoach && !onAdmin) {
    if (onProfile) {
      window.location.href = 'trainers.html';
    }
  } else if (role === 'member' && (onAdmin || onCoach)) {
    window.location.href = 'profile.html';
  }
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const fmtDate = iso => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};
const planMonths = plan => {
  if (!plan) return 0;
  const m = String(plan).trim().match(/^(\d+)\s*months?(?:\s*membership)?/i);
  if (m) return parseInt(m[1], 10);
  if (/^monthly/i.test(plan)) return 1;
  if (/single PT/i.test(plan)) return 1;
  if (/PT pack/i.test(plan)) return 3;
  return 1;
};
const addMonths = (date, n) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; };

const calcStreak = checkins => {
  const set = new Set(checkins || []);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const getMember = email => { const users = readUsers(); return users[email] || null; };
const saveMember = m => { const users = readUsers(); users[m.email] = m; writeUsers(users); syncRecordToSupabase(m); };

/* Diet targets: trainer plan wins, else assessment template, else sensible default. */
const getDietTargets = user => {
  const d = user.customDiet;
  if (d && d.calories) return { kcal: d.calories, p: d.protein || 0, c: d.carbs || 0, f: d.fat || 0 };
  const p = user.profile;
  if (p && p.calories) return { kcal: p.calories, p: p.protein || 0, c: Math.round(p.calories * 0.45 / 4), f: Math.round(p.calories * 0.25 / 9) };
  return { kcal: 2400, p: 150, c: 270, f: 65 };
};
const lastNDayKeys = n => {
  const out = [];
  for (let i = 0; i < n; i++) { const d = new Date(); d.setDate(d.getDate() - i); out.push(dayKey(d)); }
  return out;
};
const sumMacroDay = (user, key, k) => ((user.foodLog || {})[key] || []).reduce((a, e) => a + (+e[k] || 0), 0);
const mergedWeights = (user, extra = []) => {
  const all = [...(user.measurements || []).filter(m => +m.weight > 0).map(m => ({ d: String(m.d || '').slice(0, 10), weight: +m.weight })), ...extra];
  const uniq = [];
  all.forEach(w => { const i = uniq.findIndex(u => u.d === w.d); if (i >= 0) uniq[i] = w; else uniq.push(w); });
  return uniq.sort((a, b) => String(a.d).localeCompare(String(b.d)));
};const LEVELS = [[0, 'Rookie'], [100, 'Regular'], [250, 'Committed'], [500, 'Grinder'], [1000, 'Athlete'], [1750, 'Elite'], [2750, 'Legend'], [4000, 'Icon']];
const levelOf = pts => {
  let idx = 0;
  LEVELS.forEach(([need], i) => { if (pts >= need) idx = i; });
  const next = LEVELS[idx + 1] || null;
  const base = LEVELS[idx][0];
  const pct = next ? Math.min(100, Math.round(((pts - base) / (next[0] - base)) * 100)) : 100;
  return { n: idx + 1, name: LEVELS[idx][1], pts, next: next ? next[0] : null, pct };
};
const proteinStreak = u => {
  const tg = getDietTargets(u).p || 0;
  if (!tg) return 0;
  const keys = lastNDayKeys(30);
  let n = 0;
  const start = sumMacroDay(u, keys[0], 'p') >= tg ? 0 : 1;
  for (let i = start; i < keys.length; i++) {
    if (sumMacroDay(u, keys[i], 'p') >= tg) n++;
    else break;
  }
  return n;
};
const logStreak = u => {
  const keys = lastNDayKeys(60);
  let n = 0;
  const start = ((u.foodLog || {})[keys[0]] || []).length ? 0 : 1;
  for (let i = start; i < keys.length; i++) {
    if (((u.foodLog || {})[keys[i]] || []).length) n++;
    else break;
  }
  return n;
};
const weightGoalPct = u => {
  const mg = u.mainGoal || {};
  const ws = mergedWeights(u);
  const target = +mg.target > 0 ? +mg.target : (u.profile && +u.profile.target) || 0;
  if (!target || !ws.length) return 0;
  const start = +mg.start > 0 ? +mg.start : ws[0].weight;
  const cur = ws[ws.length - 1].weight;
  const total = Math.abs(target - start);
  if (!total) return 0;
  const done = target < start ? start - cur : cur - start;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
};
const CHALLENGES = [
  { id: 'first', emoji: '👣', name: 'First Check-In', desc: 'Walk through the door once.', target: 1, reward: 25, prog: u => (u.visits || []).length },
  { id: 'streak7', emoji: '🔥', name: 'Week Warrior', desc: '7-day check-in streak.', target: 7, reward: 50, prog: u => calcStreak(u.checkins) },
  { id: 'streak30', emoji: '♾️', name: 'Unstoppable', desc: '30-day check-in streak.', target: 30, reward: 200, prog: u => calcStreak(u.checkins) },
  { id: 'club100', emoji: '💯', name: 'Century Club', desc: '100 all-time visits.', target: 100, reward: 300, prog: u => (u.visits || []).length },
  { id: 'steps10k', emoji: '👟', name: '10K Day', desc: '10,000 steps in one day.', target: 10000, reward: 60, prog: u => Math.max(0, ...Object.values(u.stepsLog || {})) },
  { id: 'steps70k', emoji: '🚀', name: 'Step Machine', desc: '70,000 steps in 7 days.', target: 70000, reward: 120, prog: u => lastNDayKeys(7).reduce((a, k) => a + ((u.stepsLog || {})[k] || 0), 0) },
  { id: 'protein5', emoji: '🍗', name: 'Protein Streak', desc: 'Hit protein 5 days straight.', target: 5, reward: 100, prog: u => proteinStreak(u) },
  { id: 'log7', emoji: '📝', name: 'Consistent Logger', desc: 'Log food 7 days straight.', target: 7, reward: 80, prog: u => logStreak(u) },
  { id: 'pr1', emoji: '🏅', name: 'PR Hunter', desc: 'Log your first PR.', target: 1, reward: 50, prog: u => (u.prs || []).length },
  { id: 'squat', emoji: '🦵', name: 'Squat PR', desc: 'Log a squat personal record.', target: 1, reward: 60, prog: u => (u.prs || []).filter(r => /squat/i.test(r.lift || '')).length },
  { id: 'workouts50', emoji: '⚒️', name: 'Half Century', desc: 'Complete 50 workouts.', target: 50, reward: 150, prog: u => Object.keys(u.workoutDone || {}).length },
  { id: 'goal100', emoji: '🎯', name: 'Goal Crusher', desc: 'Reach your weight goal.', target: 100, reward: 150, prog: u => weightGoalPct(u) },
  { id: 'transform4', emoji: '📸', name: 'Transformation', desc: 'Log 4 weekly check-ins.', target: 4, reward: 120, prog: u => u.checkinCount || 0 },
  { id: 'early5', emoji: '🌅', name: 'Early Bird', desc: '5 check-ins before 8 AM.', target: 5, reward: 70, prog: u => (u.visits || []).filter(v => new Date(v.at).getHours() < 8).length }
];
const pointsOf = u => {
  if (!u) return 0;
  const visits = (u.visits || []).length;
  const workouts = Object.keys(u.workoutDone || {}).length;
  const foodDays = Object.keys(u.foodLog || {}).filter(k => (u.foodLog[k] || []).length).length;
  const prs = (u.prs || []).length;
  const measures = (u.measurements || []).length;
  const goalsDone = (u.goals || []).filter(g => g.done).length;
  const checkins = u.checkinCount || 0;
  let pts = visits * 10 + workouts * 20 + foodDays * 5 + prs * 50 + measures * 10 + goalsDone * 100 + checkins * 30;
  CHALLENGES.forEach(c => {
    let cur = 0;
    try { cur = c.prog(u) || 0; } catch (err) { cur = 0; }
    if (cur >= c.target) pts += c.reward;
  });
  return pts;
};const pushNotif = (u, icon, text) => {
  u.notifs = u.notifs || [];
  u.notifs.unshift({ id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10), icon, text: String(text).slice(0, 200), at: new Date().toISOString(), read: false });
  if (u.notifs.length > 30) u.notifs.length = 30;
};
const coachList = () => Object.values(readUsers()).filter(u => u && isTrainerStrict(u) && u.name);const PLAN_PRICES = { 'Monthly': 1999, '3 months': 5499, '6 months': 9999, '12 months': 17999 };
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const adminMembersEndpoint = () => ONYX.SUPABASE_URL
  ? `${ONYX.SUPABASE_URL.replace(/\/$/, '')}/functions/v1/admin-members`
  : '';
let adminSupabaseState = { token: '', loading: false, loaded: false, error: '', members: [] };

const normalizeSupabaseDate = value => {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00.000Z` : String(value);
};
const remoteAdminMember = raw => ({
  ...(raw.appData && typeof raw.appData === 'object' ? raw.appData : {}),
  id: raw.id || raw.email,
  supabaseId: raw.id || null,
  email: raw.email || '',
  name: raw.fullName || raw.name || raw.email || 'Member',
  phone: raw.phone || '',
  role: raw.role || 'member',
  supabaseRole: raw.role || 'member',
  createdAt: raw.createdAt || null,
  plan: raw.plan || null,
  activatedAt: normalizeSupabaseDate(raw.membershipStartsAt),
  expiresAt: normalizeSupabaseDate(raw.membershipEndsAt),
  membershipStatus: raw.membershipStatus || (raw.plan ? 'active' : 'none'),
  paymentReference: raw.paymentReference || null,
  assignedCoach: raw.assignedCoachEmail || (raw.appData && raw.appData.assignedCoach) || null,
  suspended: !!raw.suspended,
  pendingPayment: raw.membershipStatus === 'pending' && raw.plan ? { plan: raw.plan, ref: raw.paymentReference || '' } : null,
  _adminSource: 'supabase'
});

const shadowSharedMembers = members => {
  const users = readUsers();
  let changed = false;
  (members || []).forEach(member => {
    if (!member || !member.email) return;
    const existing = users[member.email] || {};
    const merged = {
      ...existing,
      ...member,
      email: member.email,
      name: member.name || existing.name || member.email,
      supabaseId: member.supabaseId || existing.supabaseId || null,
      role: member.supabaseRole || member.role || existing.role || 'member',
      supabaseRole: member.supabaseRole || member.role || existing.supabaseRole || 'member',
      phone: member.phone || existing.phone || '',
      assignedCoach: member.assignedCoach || existing.assignedCoach || null,
      suspended: typeof member.suspended === 'boolean' ? member.suspended : !!existing.suspended,
      _sharedSyncedAt: new Date().toISOString()
    };
    users[member.email] = merged;
    changed = true;
  });
  if (changed) writeUsers(users);
};

const loadAdminSupabaseMembers = async (force = false) => {
  const user = currentUser();
  const endpoint = adminMembersEndpoint();
  if (!user || !user.supabaseToken || !endpoint || !canAccessTrainer(user)) return [];
  let token = await ensureSupabaseToken(user);
  if (!token) token = user.supabaseToken;
  if (!force && adminSupabaseState.loading) return adminSupabaseState.members;
  if (!force && adminSupabaseState.loaded && adminSupabaseState.token === token) return adminSupabaseState.members;
  adminSupabaseState = { ...adminSupabaseState, token, loading: true, error: '' };
  const attempt = async tok => {
    const response = await fetch(endpoint, {
      headers: {
        apikey: ONYX.SUPABASE_KEY,
        Authorization: `Bearer ${tok}`
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(payload.error || payload.message || payload.msg || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return payload;
  };
  try {
    let payload;
    try {
      payload = await attempt(token);
    } catch (firstError) {
      // 401 = expired/invalid session; TypeError ("Failed to fetch") = the
      // gateway rejected the request before a readable response reached us.
      // In both cases one silent token refresh + retry is worth trying.
      const retriable = firstError.status === 401 || firstError.name === 'TypeError';
      const renewed = retriable && user.supabaseRefreshToken ? await refreshSupabaseSession(currentUser() || user) : null;
      if (!retriable || renewed === null) throw firstError;
      token = renewed;
      payload = await attempt(token);
    }
    adminSupabaseState = {
      token,
      loading: false,
      loaded: true,
      error: '',
      members: (payload.members || []).map(remoteAdminMember)
    };
    shadowSharedMembers(adminSupabaseState.members);
  } catch (error) {
    adminSupabaseState = {
      ...adminSupabaseState,
      token,
      loading: false,
      loaded: true,
      error: error && error.message ? error.message : 'sync failed'
    };
  }
  if (document.body.classList.contains('admin-page') && typeof renderAdmin === 'function') renderAdmin();
  if (document.body.classList.contains('coach-page') && typeof renderCoach === 'function') renderCoach();
  if (document.body.classList.contains('profile-page') && typeof renderProfile === 'function') renderProfile();
  return adminSupabaseState.members;
};const SITE_KEY = 'onyx-site-content';
const readSiteLocal = () => {
  try { return JSON.parse(localStorage.getItem(SITE_KEY) || '{}') || {}; }
  catch (err) { return {}; }
};
const writeSiteLocal = v => localStorage.setItem(SITE_KEY, JSON.stringify(v));
let siteSharedState = { loading: false, loaded: false, error: '', data: null };
const siteData = () => (siteSharedState.loaded && !siteSharedState.error && siteSharedState.data ? siteSharedState.data : readSiteLocal());
const loadRemoteSiteContent = async (force = false) => {
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY)) return siteData();
  if (!force && siteSharedState.loading) return siteSharedState.data;
  if (!force && siteSharedState.loaded) return siteSharedState.data;
  siteSharedState = { ...siteSharedState, loading: true, error: '' };
  try {
    const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/site_content?id=eq.1&select=payload`, {
      headers: {
        apikey: ONYX.SUPABASE_KEY,
        Authorization: `Bearer ${ONYX.SUPABASE_KEY}`,
        Accept: 'application/json'
      }
    });
    const payload = await response.json().catch(() => []);
    if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
    const data = payload && payload[0] && payload[0].payload ? payload[0].payload : {};
    siteSharedState = { loading: false, loaded: true, error: '', data };
    writeSiteLocal(data);
    applySiteContent();
    if (typeof renderAdminSite === 'function') renderAdminSite();
  } catch (error) {
    siteSharedState = { ...siteSharedState, loading: false, loaded: true, error: error && error.message ? error.message : 'sync failed' };
  }
  return siteSharedState.data;
};
const SITE_DEFAULT_PRICES = { 'Monthly': 1999, '3 months': 5499, '6 months': 9999, '12 months': 17999 };
const SITE_PLAN_MONTHS = { 'Monthly': 1, '3 months': 3, '6 months': 6, '12 months': 12 };
const siteDefaults = { faqHTML: null, hoursText: null, phoneHref: null, phoneText: null, emailText: null, addressHTML: null };
const captureSiteDefaults = () => {
  if (siteDefaults.faqHTML === null) {
    const list = document.querySelector('#faq .faq-list');
    siteDefaults.faqHTML = list ? list.innerHTML : null;
  }
  if (siteDefaults.hoursText === null) {
    document.querySelectorAll('.visit-grid > div').forEach(div => {
      const label = div.querySelector('span');
      if (label && label.textContent.trim() === 'HOURS') {
        const p = div.querySelector('p');
        siteDefaults.hoursText = p ? p.textContent : null;
      }
      if (label && label.textContent.trim() === 'CALL US') {
        const a = div.querySelector('a[href^="tel:"]');
        siteDefaults.phoneHref = a ? a.getAttribute('href') : null;
        siteDefaults.phoneText = a ? a.textContent : null;
      }
      if (label && label.textContent.trim() === 'EMAIL') {
        const a = div.querySelector('a[href^="mailto:"]');
        siteDefaults.emailText = a ? a.textContent : null;
      }
      if (label && label.textContent.trim() === 'ADDRESS') {
        siteDefaults.addressHTML = div.querySelector('p') ? div.querySelector('p').innerHTML : null;
      }
    });
  }
};
const applySiteContent = () => {
  captureSiteDefaults();
  const site = siteData();
  const prices = site.prices || {};
  Object.keys(SITE_DEFAULT_PRICES).forEach(plan => {
    const val = parseFloat(prices[plan]);
    PLAN_PRICES[plan] = val > 0 ? Math.round(val) : SITE_DEFAULT_PRICES[plan];
  });
  document.querySelectorAll('.plan-card[data-plan]').forEach(card => {
    const plan = card.dataset.plan;
    const val = PLAN_PRICES[plan];
    const strong = card.querySelector('.plan-price strong');
    if (strong) strong.textContent = inr(val);
    card.dataset.price = inr(val);
    const perMo = card.querySelectorAll('ul li')[2];
    const mo = SITE_PLAN_MONTHS[plan] || 1;
    if (perMo) perMo.textContent = `≈ ${inr(Math.round(val / mo))} / month`;
  });
  const mem = document.getElementById('membership');
  let banner = document.getElementById('cms-offer');
  if (mem && site.offer && site.offer.active && site.offer.title) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'cms-offer';
      banner.className = 'cms-offer';
      mem.prepend(banner);
    }
    banner.innerHTML = `<strong>${esc(site.offer.title)}</strong>${site.offer.text ? `<span>${esc(site.offer.text)}</span>` : ''}`;
  } else if (banner) {
    banner.remove();
  }
  let announce = document.getElementById('cms-announce');
  if (site.announcement && site.announcement.active && site.announcement.text && !sessionStorage.getItem('onyx-ann-x')) {
    if (!announce) {
      announce = document.createElement('div');
      announce.id = 'cms-announce';
      announce.className = 'cms-announce';
      document.body.prepend(announce);
    }
    announce.innerHTML = `<span>${esc(site.announcement.text)}</span><button type="button" id="cms-announce-x" aria-label="Dismiss">×</button>`;
    document.getElementById('cms-announce-x').addEventListener('click', () => {
      sessionStorage.setItem('onyx-ann-x', '1');
      announce.remove();
    });
  } else if (announce) {
    announce.remove();
  }
  const list = document.querySelector('#faq .faq-list');
  if (list) {
    if (Array.isArray(site.faqs) && site.faqs.length) list.innerHTML = site.faqs.map(f => `<details><summary>${esc(f.q)}<span aria-hidden="true"></span></summary><p>${esc(f.a)}</p></details>`).join('');
    else if (siteDefaults.faqHTML !== null) list.innerHTML = siteDefaults.faqHTML;
  }
  const contact = site.contact || {};
  document.querySelectorAll('.visit-grid > div').forEach(div => {
    const label = div.querySelector('span');
    if (!label) return;
    const key = label.textContent.trim();
    if (key === 'HOURS') {
      const p = div.querySelector('p');
      if (p) p.textContent = contact.hours || siteDefaults.hoursText || p.textContent;
    }
    if (key === 'CALL US') {
      const a = div.querySelector('a[href^="tel:"]');
      if (!a) return;
      if (contact.phone) {
        const digits = String(contact.phone).replace(/\D/g, '');
        if (digits.length >= 10) {
          ONYX.WHATSAPP = digits;
          ONYX.PHONE = '+' + digits;
          a.href = 'tel:+' + digits;
          a.textContent = '+' + digits.slice(0, 2) + ' ' + digits.slice(2);
        }
      } else {
        if (siteDefaults.phoneHref) a.href = siteDefaults.phoneHref;
        if (siteDefaults.phoneText) a.textContent = siteDefaults.phoneText;
      }
    }
    if (key === 'EMAIL') {
      const a = div.querySelector('a[href^="mailto:"]');
      if (!a) return;
      if (contact.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) {
        a.href = 'mailto:' + contact.email;
        a.textContent = contact.email;
      } else if (siteDefaults.emailText) {
        a.textContent = siteDefaults.emailText;
      }
    }
    if (key === 'ADDRESS') {
      const p = div.querySelector('p');
      if (!p) return;
      if (contact.address) {
        const map = p.querySelector('.visit-map');
        p.innerHTML = `${esc(contact.address)}<br />`;
        if (map) p.appendChild(map);
      } else if (siteDefaults.addressHTML) {
        p.innerHTML = siteDefaults.addressHTML;
      }
    }
  });
};// First paint — deferred to DOMContentLoaded so it runs AFTER every chunk
// (js/dashboard.js, js/admin.js) has been evaluated: deferred scripts always
// execute before DOMContentLoaded fires. Chunk-provided renderers are guarded
// with typeof so pages that don't ship a chunk skip them cleanly.
window.addEventListener('DOMContentLoaded', () => {
  applySiteContent();
  updateAuthLinks();
  if (typeof renderProfile === 'function') renderProfile();
  if (typeof renderCoach === 'function') renderCoach();
  if (typeof renderAdmin === 'function') renderAdmin();
  loadRemoteSiteContent();
  const bootUser = currentUser();
  if (bootUser && bootUser.supabaseToken) {
    syncCurrentUserFromSupabase().then(() => {
      updateAuthLinks();
      if (typeof renderProfile === 'function') renderProfile();
      if (typeof renderCoach === 'function') renderCoach();
      if (typeof renderAdmin === 'function') renderAdmin();
    });
    if (canAccessTrainer(bootUser)) loadAdminSupabaseMembers();
  }
});


// Demo privacy controls: make the browser-only nature of the prototype actionable.
(() => {
  const exportButton = document.getElementById('pf-export');
  const deleteButton = document.getElementById('pf-delete-device');
  const safeUser = () => {
    const user = currentUser();
    if (!user) return null;
    const copy = JSON.parse(JSON.stringify(user));
    // The local password record is stored as { pass, salt, algo } (see the
    // signup path) — deleting `password`/`hash` only removed keys that never
    // exist, so the PBKDF2 hash and salt were exported in the JSON file.
    // Supabase session tokens and the pass-code seed (passSecret, which the
    // reception check-in validates against) must never leave the browser.
    ['pass', 'password', 'hash', 'salt', 'algo', 'supabaseToken', 'supabaseRefreshToken', 'passSecret']
      .forEach(key => { delete copy[key]; });
    return copy;
  };
  exportButton?.addEventListener('click', () => {
    const data = safeUser();
    if (!data) return;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), member: data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'onyx-my-data.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  deleteButton?.addEventListener('click', () => {
    if (!window.confirm('Delete ONYX demo data from this device? This cannot be undone.')) return;
    localStorage.clear(); sessionStorage.clear(); window.location.href = 'index.html';
  });
})();

// Installable shell for the demo. Private/member data is deliberately not cached by the service worker.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// === MEMORIES WALL ENHANCED — zoom + explore more, super smooth ===
(() => {
  const grid = document.getElementById('memory-grid');
  const extra = document.getElementById('memory-extra');
  const exploreBtn = document.getElementById('memory-explore');
  if (!grid) return;

  // Create lightbox dialog if not exists
  let lightbox = document.getElementById('memory-lightbox');
  if (!lightbox) {
    document.body.insertAdjacentHTML('beforeend', `
      <dialog class="memory-lightbox" id="memory-lightbox" aria-labelledby="memory-lightbox-title">
        <button type="button" class="plans-close" aria-label="Close memory"><span aria-hidden="true">✕</span></button>
        <div class="memory-lightbox-grid">
          <div class="memory-lightbox-image"><img id="memory-lightbox-img" alt="" /></div>
          <div class="memory-lightbox-copy">
            <p class="eyebrow" id="memory-lightbox-eyebrow">ONYX MEMORY</p>
            <h3 id="memory-lightbox-title">Moment</h3>
            <p id="memory-lightbox-story"></p>
            <div class="memory-lightbox-meta">TAP OUTSIDE OR PRESS ESC TO CLOSE · ONYX ATHLETIC CLUB · KHARAR</div>
          </div>
        </div>
      </dialog>
    `);
    lightbox = document.getElementById('memory-lightbox');
  }

  const imgEl = document.getElementById('memory-lightbox-img');
  const titleEl = document.getElementById('memory-lightbox-title');
  const eyebrowEl = document.getElementById('memory-lightbox-eyebrow');
  const storyEl = document.getElementById('memory-lightbox-story');

  const MEMORY_IMAGES = {
    '01': 'assets/memory-5k.jpg',
    '02': 'assets/memory-post-class.jpg',
    '03': 'assets/memory-pr-bell.jpg',
    '04': 'assets/memory-friday-lifts.jpg',
    '05': 'assets/memory-6am-crew.jpg',
    '06': 'assets/memory-community-wod.jpg',
    '07': 'assets/memory-recovery.jpg',
    '08': 'assets/memory-coach-corner.jpg'
  };

  const closeLightbox = () => {
    if (!lightbox.open) return;
    if (lightbox.classList.contains('is-closing')) return;
    lightbox.classList.add('is-closing');
    setTimeout(() => {
      lightbox.classList.remove('is-closing');
      try { lightbox.close(); } catch(e) { lightbox.removeAttribute('open'); }
    }, 360);
  };

  const openLightbox = (card) => {
    const id = card.dataset.memory || '01';
    const title = card.dataset.title || card.querySelector('span')?.textContent || 'ONYX Moment';
    const story = card.dataset.story || 'This is what training at ONYX feels like — you have to be here to understand it.';
    const src = MEMORY_IMAGES[id] || MEMORY_IMAGES['01'];

    // Set content
    eyebrowEl.textContent = `${id} / ${title.toUpperCase()}`;
    titleEl.textContent = title;
    storyEl.textContent = story;
    imgEl.src = src;
    imgEl.alt = `${title} — ONYX memory wall`;

    // Direction-aware origin for super smooth emergence
    const rect = card.getBoundingClientRect();
    const lbRect = { left: window.innerWidth/2, top: window.innerHeight/2, width: 400, height: 400 };
    const originX = ((rect.left + rect.width/2) / window.innerWidth) * 100;
    const originY = ((rect.top + rect.height/2) / window.innerHeight) * 100;
    lightbox.style.transformOrigin = `${originX}% ${originY}%`;

    lightbox.classList.remove('is-closing');
    try { lightbox.showModal(); } catch(e) { lightbox.setAttribute('open',''); }

    // Focus trap handled by dialog, but ensure close button focus
    requestAnimationFrame(() => {
      lightbox.querySelector('.plans-close')?.focus({ preventScroll: true });
    });
  };

  // Click on any memory card
  document.querySelectorAll('.memory-card[data-memory]').forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking zoom btn, handled separately but also opens
      if (e.target.closest('.memory-zoom-btn')) {
        e.stopPropagation();
      }
      openLightbox(card);
    });
    /* Keyboard + screen-reader access goes through the real .memory-zoom-btn
       inside the card. Marking the card itself role="button" nested one
       interactive control inside another (axe: nested-interactive) and put a
       role on <article> that ARIA does not allow there (axe: aria-allowed-role),
       while adding a second tab stop for the exact same action. The click
       handler stays as a pointer convenience only. */
  });

  // Zoom buttons (stop propagation handled above)
  document.querySelectorAll('.memory-zoom-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.memory-card');
      if (card) openLightbox(card);
    });
  });

  // Explore more toggle with super smooth height + stagger
  if (exploreBtn && extra) {
    // Directional hover for explore button (same as site)
    const dir = ev => {
      const b = exploreBtn.getBoundingClientRect();
      const x = ev.clientX - b.left - b.width/2;
      const y = ev.clientY - b.top - b.height/2;
      return Math.abs(x / b.width) > Math.abs(y / b.height) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'bottom' : 'top');
    };
    exploreBtn.addEventListener('pointerenter', ev => {
      exploreBtn.classList.remove('enter-left','enter-right','enter-top','enter-bottom');
      exploreBtn.classList.add(`enter-${dir(ev)}`);
      requestAnimationFrame(() => exploreBtn.classList.add('is-hovered'));
    });
    exploreBtn.addEventListener('pointerleave', ev => {
      exploreBtn.classList.remove('enter-left','enter-right','enter-top','enter-bottom');
      exploreBtn.classList.add(`enter-${dir(ev)}`);
      requestAnimationFrame(() => exploreBtn.classList.remove('is-hovered'));
    });

    exploreBtn.addEventListener('click', () => {
      const isOpen = extra.classList.contains('is-open');
      if (!isOpen) {
        // Opening
        extra.hidden = false;
        // Force reflow for transition
        void extra.offsetHeight;
        extra.classList.add('is-open');
        exploreBtn.classList.add('is-open');
        exploreBtn.querySelector('span').textContent = 'Show less moments';
        // Smooth scroll to extra after animation starts
        setTimeout(() => {
          extra.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 320);
      } else {
        // Closing
        extra.classList.remove('is-open');
        exploreBtn.classList.remove('is-open');
        exploreBtn.querySelector('span').textContent = 'Explore more moments';
        setTimeout(() => {
          if (!extra.classList.contains('is-open')) {
            extra.hidden = true;
            document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 750);
      }
    });
  }

  // Lightbox close handlers
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  lightbox.querySelector('.plans-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeLightbox();
  });
  lightbox.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeLightbox();
  });
  // Prevent form submit
  lightbox.querySelectorAll('form[method="dialog"]').forEach(f => f.addEventListener('submit', ev => { ev.preventDefault(); closeLightbox(); }));

  // Keyboard trap for lightbox (reuse existing logic)
  lightbox.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...lightbox.querySelectorAll('button:not([disabled])')].filter(el => !el.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

// === FILM PRO — tap to play/pause with voiceover + progress ===
(() => {
  const wrap = document.getElementById('film-video-wrap');
  const video = document.getElementById('onyx-film');
  const btn = document.getElementById('film-play-btn');
  const bar = document.getElementById('film-progress-bar');
  if (!wrap || !video) return;

  // Pick the correct source based on viewport (the <source media> attribute is
  // only valid inside <picture>, not <video>, so we set video.src synchronously
  // from a global set by an inline head script before the <video> tag parses).
  // Saves ~4.7 MB on mobile; resize across the 720px boundary re-picks the file.
  const MOBILE_SRC = 'assets/onyx-overview-720.mp4?v=90';
  const DESKTOP_SRC = 'assets/onyx-overview.mp4?v=90';
  const pickSource = () => {
    const mobile = window.matchMedia('(max-width: 720px)').matches;
    const chosen = mobile ? MOBILE_SRC : DESKTOP_SRC;
    if (!video.currentSrc || !video.currentSrc.endsWith(chosen.split('/').pop())) {
      video.src = chosen;
      video.load();
    }
  };
  video.src = window.__ONYX_VIDEO_SRC__ || DESKTOP_SRC;
  pickSource();
  window.addEventListener('resize', pickSource, { passive: true });

  const sync = () => {
    const playing = !video.paused && !video.ended;
    wrap.classList.toggle('is-playing', playing);
    if (btn) btn.setAttribute('aria-label', playing ? 'Pause tour' : 'Play tour with voiceover');
    if (btn) {
      const icon = btn.querySelector('.film-play-icon');
      if (icon) icon.textContent = playing ? '❚❚' : '▶';
    }
  };

  const toggle = (e) => {
    if (e) e.preventDefault();
    if (video.paused) {
      video.play().then(sync).catch(() => {});
    } else {
      video.pause();
      sync();
    }
  };

  wrap.addEventListener('click', toggle);
  wrap.addEventListener('touchend', (e) => {
    e.preventDefault();
    toggle(e);
  }, { passive: false });

  /* The wrap keeps its click/touch handlers so tapping anywhere on the video
     still plays it, but it is NOT advertised as a control: #film-play-btn inside
     it is the real one, and sync() already keeps its label and icon in step.
     Giving the wrapper role="button" too nested one control inside another
     (axe: nested-interactive) and added a second tab stop for the same action. */
  if (btn) btn.addEventListener('click', toggle);

  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    sync();
    if (bar) bar.style.width = '0%';
  });

  video.addEventListener('timeupdate', () => {
    if (!bar) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    bar.style.width = `${pct}%`;
  });

  // Initial state
  sync();
})();

/* ===========================================================================
   TRAINER RAIL — keyboard + button navigation and a position read-out
   The rail used to be drag/scroll only: a <div> carrying an aria-label with no
   role (so the label was never exposed), hidden scrollbars, no controls and no
   way to tell how many coaches there are. It is now a labelled, focusable
   region with prev/next buttons, arrow-key scrolling and a live "X–Y of Z"
   status. Dragging, swiping and the scrollbar all still work.
   =========================================================================== */
(() => {
  const rail = document.querySelector('.trainer-rail');
  if (!rail) return;
  const cards = [...rail.querySelectorAll('.trainer-card')];
  if (!cards.length) return;
  const prevButton = document.getElementById('rail-prev');
  const nextButton = document.getElementById('rail-next');
  const statusEl = document.getElementById('rail-status');
  const motion = () => (reducedMotion ? 'auto' : 'smooth');

  // One card plus the gap between cards, so a press always lands on a snap point.
  const cardStep = () => {
    const first = cards[0].getBoundingClientRect();
    if (first.width > 0) {
      const gap = cards.length > 1 ? cards[1].getBoundingClientRect().left - first.right : 0;
      return first.width + Math.max(gap, 0);
    }
    return rail.clientWidth || 300;
  };

  // Cards count as visible once more than half of them is on screen.
  const visibleRange = () => {
    const box = rail.getBoundingClientRect();
    let first = -1;
    let last = -1;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const overlap = Math.min(rect.right, box.right) - Math.max(rect.left, box.left);
      if (rect.width > 0 && overlap >= rect.width * 0.5) {
        if (first < 0) first = index;
        last = index;
      }
    });
    if (first < 0) {
      const fallback = Math.min(cards.length - 1, Math.max(0, Math.round(rail.scrollLeft / (cardStep() || 1))));
      first = last = fallback;
    }
    return [first, last];
  };

  let lastAnnounced = '';
  const updateRail = () => {
    const scrollable = rail.scrollWidth - rail.clientWidth > 2;
    const atStart = rail.scrollLeft <= 2;
    const atEnd = !scrollable || rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    if (prevButton) prevButton.disabled = atStart;
    if (nextButton) nextButton.disabled = atEnd;
    if (statusEl) {
      const [first, last] = visibleRange();
      const text = first === last
        ? `Coach ${first + 1} of ${cards.length}`
        : `Coaches ${first + 1}–${last + 1} of ${cards.length}`;
      // Only touch the DOM when the range actually changes, so the live region
      // is not announced several times during one smooth scroll.
      if (text !== lastAnnounced) {
        lastAnnounced = text;
        statusEl.textContent = text;
      }
    }
  };

  const scrollRail = left => rail.scrollBy({ left, behavior: motion() });

  prevButton?.addEventListener('click', () => scrollRail(-cardStep()));
  nextButton?.addEventListener('click', () => scrollRail(cardStep()));

  rail.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const step = cardStep();
    const handled = {
      ArrowRight: () => scrollRail(step),
      ArrowLeft: () => scrollRail(-step),
      PageDown: () => scrollRail(rail.clientWidth),
      PageUp: () => scrollRail(-rail.clientWidth),
      Home: () => rail.scrollTo({ left: 0, behavior: motion() }),
      End: () => rail.scrollTo({ left: rail.scrollWidth, behavior: motion() })
    }[event.key];
    if (!handled) return;
    // Stop the page from scrolling as well; the rail owns these keys once focused.
    event.preventDefault();
    handled();
    updateRail();
  });

  let railFrame = null;
  rail.addEventListener('scroll', () => {
    if (railFrame) return;
    railFrame = window.requestAnimationFrame(() => { railFrame = null; updateRail(); });
  }, { passive: true });
  window.addEventListener('resize', updateRail);
  updateRail();
})();

/* ---------------------------------------------------------------------------
   IN-PAGE PLAN BUTTONS — open the plans dialog in place.
   Pages that list the plans in the page body (membership.html) used to render
   "Start monthly" as <a href="index.html#membership">: a round trip back to the
   home page that also threw away the plan the visitor had just picked. Those
   are now real buttons that open #plans-dialog on the CURRENT page with that
   plan already selected, so the next tap is Continue -> secure payment.
   --------------------------------------------------------------------------- */
(() => {
  const dialog = document.getElementById('plans-dialog');
  // Only the cards that live in the page body — the dialog carries its own set.
  const pageCards = [...document.querySelectorAll('.plan-card[data-plan]')]
    .filter(card => !card.closest('dialog'));
  if (!pageCards.length) return;

  const dialogCards = dialog ? [...dialog.querySelectorAll('.plan-card[data-plan]')] : [];

  // Defensive: a page could ship the cards without the dialog. Rather than leave
  // a button that does nothing, fall back to the old destination.
  if (!dialogCards.length) {
    pageCards.forEach(card => {
      const button = card.querySelector('.plan-select');
      if (button) button.addEventListener('click', () => { window.location.assign('index.html#membership'); });
    });
    return;
  }

  pageCards.forEach(card => {
    const button = card.querySelector('.plan-select');
    const match = dialogCards.find(c => c.dataset.plan === card.dataset.plan);
    if (!button || !match) return;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      const main = dialog.querySelector('.plans-main');
      const confirmation = dialog.querySelector('.plans-confirmation');
      // Always land on the plan grid, never on a stale payment confirmation.
      if (main) main.hidden = false;
      if (confirmation) confirmation.hidden = true;
      if (!dialog.open) dialog.showModal();
      // Re-use the dialog's own click handler so the highlight, the summary and
      // the Continue button all stay in sync — no duplicated selection state.
      match.click();
    });
  });
})();

/* ---------------------------------------------------------------------------
   TIMETABLE — day picker + per-class booking.
   On a phone the grid was a 740px-wide horizontal scroller: seven columns you
   had to drag sideways through, and the only way to act on any of it was the
   generic "Book a free trial class" button at the bottom of the section.
   Below 900px it now collapses to ONE day — today by default — picked from a
   row of day chips, and every class in it is a Book button that opens the
   contact dialog already filled in with that exact session. Above 900px the
   full week stays on screen exactly as before; the classes are still bookable.
   The picker, the caption and the buttons are all built from the existing
   table, so without JS the page degrades to the original static timetable.
   --------------------------------------------------------------------------- */
(() => {
  const grid = document.querySelector('.schedule-grid');
  const head = grid && grid.querySelector('.schedule-head');
  if (!head) return;
  const headCells = [...head.children];
  const dayNames = headCells.slice(1).map(cell => cell.textContent.trim());
  const rows = [...grid.querySelectorAll('.schedule-row')];
  if (!dayNames.length || !rows.length) return;

  const BLANK = ['', '\u2014', '\u2013', '-'];
  const isBlank = text => BLANK.includes(String(text || '').trim());
  const bodyCells = rows.map(row => [...row.children]);

  /* ---- 1. every real class in the grid becomes a Book button ---- */
  let bookable = 0;
  bodyCells.forEach(cells => {
    const time = cells[0] ? cells[0].textContent.trim() : '';
    cells.slice(1).forEach((cell, dayIndex) => {
      const label = cell.textContent.trim();
      if (isBlank(label)) return;
      const day = dayNames[dayIndex];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'class-book';
      button.innerHTML = `${esc(label)}<span class="class-book-cta" aria-hidden="true">Book</span>`;
      // The visible text is just the class name, so name the control fully.
      button.setAttribute('aria-label', `Book ${label}, ${day} at ${time}`);
      cell.textContent = '';
      cell.appendChild(button);
      button.addEventListener('click', () => {
        if (window.openClassBooking) window.openClassBooking({ name: label, day, time });
        else if (window.openContactDialog) window.openContactDialog({ currentTarget: { textContent: 'Book a free trial class' } });
      });
      bookable++;
    });
  });
  if (!bookable) return;

  /* ---- 2. day chips + a line that says what you are looking at ---- */
  const picker = document.createElement('div');
  picker.className = 'schedule-days';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', 'Choose a day to view');
  const chips = dayNames.map((day, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'schedule-day';
    chip.dataset.day = String(index);
    chip.setAttribute('aria-pressed', 'false');
    chip.textContent = day;
    picker.appendChild(chip);
    return chip;
  });

  const caption = document.createElement('p');
  caption.className = 'schedule-caption';
  caption.setAttribute('role', 'status');
  caption.setAttribute('aria-live', 'polite');


  const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const FULL_DAY = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
  const todayIndex = (new Date().getDay() + 6) % 7;            // 0 = Monday
  const isToday = dayNames.indexOf(ORDER[todayIndex]);
  let active = isToday >= 0 ? isToday : 0;                     // Sunday: floor closed

  const classesOn = dayIndex => bodyCells.reduce((total, cells) => {
    const cell = cells[dayIndex + 1];
    return total + (cell && cell.querySelector('.class-book') ? 1 : 0);
  }, 0);

  const narrow = window.matchMedia('(max-width: 900px)');
  const applyView = () => {
    const single = narrow.matches;
    headCells.slice(1).forEach((cell, index) => { cell.hidden = single && index !== active; });
    bodyCells.forEach(cells => cells.slice(1).forEach((cell, index) => { cell.hidden = single && index !== active; }));
    if (single) grid.dataset.day = String(active); else delete grid.dataset.day;
    chips.forEach((chip, index) => chip.setAttribute('aria-pressed', String(single && index === active)));
    const count = classesOn(active);
    const day = dayNames[active] || '';
    // role="table" carries an accessible name — keep it true to what is on screen.
    grid.setAttribute('aria-label', single
      ? `${FULL_DAY[day] || day} class timetable`
      : 'Weekly class timetable');
    caption.textContent = single
      ? `${active === isToday ? 'TODAY \u00b7 ' : ''}${day.toUpperCase()} \u00b7 ${count} CLASS${count === 1 ? '' : 'ES'}`
      : 'SELECT ANY CLASS TO BOOK IT';
  };

  chips.forEach((chip, index) => chip.addEventListener('click', () => {
    active = index;
    applyView();
  }));

  if (narrow.addEventListener) narrow.addEventListener('change', applyView);
  else if (narrow.addListener) narrow.addListener(applyView);
  // First paint happens before the caption joins the DOM, so the live region
  // never announces the initial state — only changes the visitor makes.
  applyView();
  grid.parentNode.insertBefore(picker, grid);
  grid.parentNode.insertBefore(caption, grid);
})();
