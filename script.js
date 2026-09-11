/* ===========================================================================
   ONYX — SITE CONFIGURATION
   This is the only block you need to edit when wiring the site to a backend.
   Every integration below degrades safely when left blank.
   =========================================================================== */
const ONYX = {
  // Where "Request a call back" leads are POSTed as JSON:
  // { name, phone, source, at }.  Leave '' to use the WhatsApp/email handoff.
  CONTACT_ENDPOINT: '',

  // Real signup/login API. Leave '' to keep browser-local demo accounts.
  AUTH_ENDPOINT: '',

  // Base URL of the payments worker in server/ (see the README, "Deploy the
  // payments worker"), e.g. 'https://onyx-payments.yourname.workers.dev'.
  // When set, plan checkout runs through Razorpay Orders + Checkout and the
  // membership activates automatically the instant the worker confirms the
  // payment — no staff involvement. Leave '' to keep the manual payment-link
  // + WhatsApp flow.
  PAYMENTS_API: '',

  // Legacy single-route verifier, kept for compatibility. Ignored when
  // PAYMENTS_API is set (the worker's /verify route is used instead).
  MEMBERSHIP_VERIFY_ENDPOINT: '',

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
const startStoryTimer = () => {
  window.clearTimeout(storyTimer);
  storyTimer = window.setTimeout(() => changeStory((activeStory + 1) % stories.length), storyDelay);
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
  startStoryTimer();
};
storyDots.forEach((dot, index) => dot.addEventListener('click', () => changeStory(index)));
startStoryTimer();

// Membership plans dialog
const plansDialog = document.getElementById('plans-dialog');
// Razorpay Payment Links, one per plan. Clicking Continue opens the link but does
// NOT grant membership — see beginPaymentFlow() for why and how activation works.
const PAYMENT_LINKS = {
  'Monthly': 'https://rzp.io/rzp/JSB2YFiU',
  '3 months': 'https://rzp.io/rzp/cgbXV09',
  '6 months': 'https://rzp.io/rzp/iM36BiGS',
  '12 months': 'https://rzp.io/rzp/6KLhx0W'
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
    plansConfirmation.querySelector('.chosen-plan').textContent = selectedCard.dataset.plan;
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
  const setMenuOpen = open => {
    document.body.classList.toggle('menu-open', open);
    mobileMenu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuButton.textContent = open ? '✕' : '☰';
  };
  menuButton.addEventListener('click', () => setMenuOpen(!mobileMenu.classList.contains('is-open')));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
  window.matchMedia('(min-width: 721px)').addEventListener('change', event => {
    if (event.matches) setMenuOpen(false);
  });
  // Same-page anchors: unlock the body first, then smooth-scroll.
  mobileMenu.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    setMenuOpen(false);
    if (target) {
      event.preventDefault();
      requestAnimationFrame(() => target.scrollIntoView({ behavior: scrollBehavior() }));
    }
  }));
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

  const openContact = () => {
    contactSuccess.hidden = true;
    contactMain.hidden = false;
    showFieldError('');
    contactDialog.showModal();
    requestAnimationFrame(() => nameInput.focus());
  };
  document.querySelectorAll('[data-open-contact]').forEach(button => button.addEventListener('click', openContact));

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

    const lead = { name, phone: '+91' + phone, source: window.location.pathname, at: new Date().toISOString() };
    try {
      const stored = JSON.parse(localStorage.getItem('onyx-leads') || '[]');
      stored.push(lead);
      localStorage.setItem('onyx-leads', JSON.stringify(stored));
    } catch (error) { console.warn('Could not store lead locally.', error); }

    let delivered = false;
    if (ONYX.CONTACT_ENDPOINT) {
      try {
        const response = await fetch(ONYX.CONTACT_ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead)
        });
        delivered = response.ok;
        if (!delivered) console.warn('Lead endpoint responded', response.status);
      } catch (error) { console.warn('Lead saved locally but could not reach the backend.', error); }
    }

    // No endpoint (or it failed): hand the lead straight to a human instead of
    // letting it die in localStorage. WhatsApp first, email as the fallback.
    if (!delivered) {
      const message = `Hi ONYX, please call me back.\n\nName: ${name}\nPhone: +91 ${phone}\nPage: ${window.location.pathname}`;
      const whatsapp = `https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent(message)}`;
      const handoff = contactSuccess.querySelector('.contact-handoff') || (() => {
        const el = document.createElement('p');
        el.className = 'contact-handoff';
        contactSuccess.querySelector('.contact-echo').after(el);
        return el;
      })();
      handoff.innerHTML =
        `<a class="handoff-primary" href="${whatsapp}" target="_blank" rel="noopener">Send it on WhatsApp</a>` +
        `<a href="tel:${ONYX.PHONE}">Call ${ONYX.PHONE}</a>` +
        `<a href="mailto:${ONYX.EMAIL}?subject=${encodeURIComponent('Call back request — ' + name)}&body=${encodeURIComponent(message)}">Email us</a>`;
      window.open(whatsapp, '_blank', 'noopener');
    }

    contactEcho.textContent = `${name.toUpperCase()} · +91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
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
  users[record.email] = record;
  writeUsers(users);
};

// Inject the auth + assessment dialogs once, on every page.
if (!document.getElementById('auth-dialog')) {
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="auth-dialog" id="auth-dialog" aria-labelledby="auth-title">
      <form method="dialog"><button class="plans-close" aria-label="Close" value="close">✕</button></form>
      <p class="eyebrow">Member access</p>
      <h2 id="auth-title">Your ONYX<br /><em>account.</em></h2>
      <div class="auth-tabs" role="tablist"><button type="button" class="auth-tab is-active" data-mode="login">Log in</button><button type="button" class="auth-tab" data-mode="signup">Sign up</button></div>
      <p class="auth-note" id="auth-note" hidden></p>
      <form class="auth-form" id="auth-form" novalidate>
        <label class="field" id="auth-name-field" hidden><span class="field-label">YOUR NAME</span><input type="text" name="auth-name" autocomplete="name" placeholder="e.g. Aarav Sharma" /></label>
        <label class="field"><span class="field-label">EMAIL</span><input type="email" name="auth-email" autocomplete="email" placeholder="you@example.com" /></label>
        <label class="field"><span class="field-label">PASSWORD</span><input type="password" name="auth-password" autocomplete="current-password" placeholder="Min. 6 characters" /></label>
        <p class="field-error" id="auth-error" role="alert" hidden></p>
        <button type="submit" class="auth-submit">Log in</button>
      </form>
    </dialog>`);
}
if (!document.getElementById('onboard-dialog')) {
  const chip = (field, value, label) => `<button type="button" data-value="${value}">${label}</button>`;
  const group = (label, field, chipsHtml) => `<div class="ob-group"><span class="field-label">${label}</span><div class="ob-chips" data-field="${field}">${chipsHtml}</div></div>`;
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="onboard-dialog" id="onboard-dialog" aria-labelledby="onboard-title">
      <form method="dialog"><button class="plans-close" aria-label="Skip assessment" value="close">✕</button></form>
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
   Payment flow.

   SECURITY: a browser can never prove a payment succeeded — only the Razorpay
   Payments API can, and that needs a key secret which must never ship to the
   client. So clicking "Continue" records a *pending* membership request and
   nothing else. Access is granted in exactly one place: a successful response
   from the payments worker (ONYX.PAYMENTS_API, which checks every payment
   against the Razorpay API server-side) or the legacy
   ONYX.MEMBERSHIP_VERIFY_ENDPOINT. With neither configured the member stays
   pending and staff confirm manually — which is the safe default. It is never
   possible to unlock paid content by opening and closing the payment tab.
   --------------------------------------------------------------------------- */
const paymentRef = () => 'ONYX-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const verifyMembership = async (user, payment) => {
  const endpoint = ONYX.PAYMENTS_API
    ? ONYX.PAYMENTS_API.replace(/\/+$/, '') + '/verify'
    : ONYX.MEMBERSHIP_VERIFY_ENDPOINT;
  if (!endpoint) return false;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, ref: payment.ref, plan: payment.plan, paymentId: payment.paymentId || null, orderId: payment.orderId || null, signature: payment.signature || null })
    });
    if (!response.ok) return false;
    const result = await response.json();
    if (!result || result.active !== true) return false;
    user.plan = result.plan || payment.plan;      // ← the ONLY place plan is set
    user.pendingPayment = null;
    saveCurrentUser(user);
    return true;
  } catch (error) {
    console.warn('Could not reach the membership verification service.', error);
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
  const payment = { plan: `${plan} membership`, ref: paymentRef(), startedAt: new Date().toISOString(), paymentId: null, orderId: null, signature: null };
  user.pendingPayment = payment;                  // pending — NOT an active plan
  saveCurrentUser(user);
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  if (ONYX.PAYMENTS_API) { openRazorpayCheckout(user, payment); return; }
  window.open(link, '_blank', 'noopener');
  showPaymentPending(payment);
  if (document.body.classList.contains('profile-page')) renderProfile();
};

// Confirmation panel shown after the payment tab opens.
const showPaymentPending = payment => {
  const dialog = document.getElementById('plans-dialog');
  if (!dialog) return;
  const main = dialog.querySelector('.plans-main');
  const confirmation = dialog.querySelector('.plans-confirmation');
  confirmation.querySelector('.chosen-plan').textContent = payment.plan;
  let note = confirmation.querySelector('.payment-ref');
  if (!note) {
    note = document.createElement('p');
    note.className = 'payment-ref';
    confirmation.querySelector('.plans-confirmation-copy').after(note);
  }
  note.innerHTML = `Your reference is <strong>${payment.ref}</strong>. Keep it handy — ` +
    `we activate your membership as soon as the payment clears. ` +
    `<a href="https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent('Hi ONYX, I just paid for ' + payment.plan + '. My reference is ' + payment.ref + '.')}" target="_blank" rel="noopener">Send it to us on WhatsApp</a> to speed that up.`;
  main.hidden = true;
  confirmation.hidden = false;
  if (!dialog.open) dialog.showModal();
};

// ---------------------------------------------------------------------------
// Automated checkout (ONYX.PAYMENTS_API). Loads Razorpay Checkout on demand,
// pays against an order the worker created, and activates the membership as
// soon as the worker confirms the payment against the Razorpay API. Falls
// back to the manual payment-link flow whenever the worker is unreachable.
// ---------------------------------------------------------------------------
const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Razorpay Checkout failed to load.'));
  document.head.appendChild(script);
});

const paymentsApi = path => ONYX.PAYMENTS_API.replace(/\/+$/, '') + path;

const showPaymentResult = (payment, confirmed) => {
  const dialog = document.getElementById('plans-dialog');
  if (!dialog) return;
  const main = dialog.querySelector('.plans-main');
  const confirmation = dialog.querySelector('.plans-confirmation');
  confirmation.querySelector('.chosen-plan').textContent = payment.plan;
  const copy = confirmation.querySelector('.plans-confirmation-copy');
  let note = confirmation.querySelector('.payment-ref');
  if (!note) {
    note = document.createElement('p');
    note.className = 'payment-ref';
    if (copy) copy.after(note); else confirmation.appendChild(note);
  }
  if (confirmed) {
    if (copy) copy.textContent = 'Payment received — your membership is active. See you on the floor.';
    note.innerHTML = `Reference <strong>${payment.ref}</strong> · paid in full.`;
  } else {
    if (copy) copy.textContent = 'Your payment is being confirmed — this usually takes a few seconds.';
    note.innerHTML = `Your reference is <strong>${payment.ref}</strong>. This page updates automatically once the payment clears.`;
  }
  main.hidden = true;
  confirmation.hidden = false;
  if (!dialog.open) dialog.showModal();
};

const openRazorpayCheckout = async (user, payment) => {
  let order = null;
  try {
    const response = await fetch(paymentsApi('/order'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: payment.plan.replace(/ membership$/, ''), ref: payment.ref, email: user.email })
    });
    if (!response.ok) throw new Error('order rejected');
    order = await response.json();
  } catch (error) {
    console.warn('Payment service unreachable — falling back to the manual flow.', error);
    showPaymentPending(payment);
    return;
  }
  payment.orderId = order.order_id;
  user.pendingPayment = payment;
  saveCurrentUser(user);
  try { await loadRazorpayCheckout(); } catch (error) {
    console.warn(error);
    showPaymentPending(payment);
    return;
  }
  const checkout = new window.Razorpay({
    key: order.key_id,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency,
    name: 'ONYX Athletic Club',
    description: payment.plan,
    prefill: { name: user.name, email: user.email },
    theme: { color: '#d7ff32' },
    handler: async response => {
      payment.paymentId = response.razorpay_payment_id;
      payment.orderId = response.razorpay_order_id;
      payment.signature = response.razorpay_signature;
      user.pendingPayment = payment;
      saveCurrentUser(user);
      const confirmed = await verifyMembership(user, payment);
      showPaymentResult(payment, confirmed);
      if (confirmed) pollPaymentStatus(user, 0);   // no-op when already active
      if (document.body.classList.contains('profile-page')) renderProfile();
    },
    modal: {
      ondismiss: () => {
        showPaymentPending(payment);
        if (document.body.classList.contains('profile-page')) renderProfile();
      }
    }
  });
  checkout.open();
};

// Polls the worker for a pending payment — catches the case where the member
// paid but the browser never ran the success handler (tab closed mid-checkout,
// phone locked, connection dropped). Activation still happens only through
// verifyMembership().
const pollPaymentStatus = async (user, attempts = 12) => {
  for (let i = 0; i < attempts; i++) {
    const fresh = currentUser();
    if (!fresh || fresh.plan || !fresh.pendingPayment) return;
    const payment = fresh.pendingPayment;
    try {
      const response = await fetch(paymentsApi('/status') +
        `?ref=${encodeURIComponent(payment.ref)}&email=${encodeURIComponent(fresh.email)}`);
      if (response.ok && (await response.json()).active === true) {
        await verifyMembership(fresh, payment);
        if (document.body.classList.contains('profile-page')) renderProfile();
        return;
      }
    } catch (error) { /* offline — retry */ }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

// If Razorpay redirects back with its status params, capture the payment id and
// ask the backend (if any) to verify. Never trusted on its own.
// Deferred to DOMContentLoaded: renderProfile() is declared further down this
// file, so calling it during the initial synchronous pass would hit the TDZ.
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('razorpay_payment_link_status');
  if (status) {
    const user = currentUser();
    if (user && user.pendingPayment) {
      user.pendingPayment.paymentId = params.get('razorpay_payment_id') || null;
      user.pendingPayment.reportedStatus = status;
      saveCurrentUser(user);
      if (status === 'paid') await verifyMembership(user, user.pendingPayment);
    }
    history.replaceState(null, '', window.location.pathname);
  } else {
    // Automated mode: settle a payment that finished outside this tab
    // (tab closed mid-checkout, phone locked, connection dropped).
    const user = currentUser();
    if (user && user.pendingPayment && ONYX.PAYMENTS_API && !user.plan) pollPaymentStatus(user);
  }
  if (document.body.classList.contains('profile-page')) renderProfile();
});

authDialog.querySelectorAll('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
  authMode = tab.dataset.mode;
  authDialog.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('is-active', t === tab));
  document.getElementById('auth-name-field').hidden = authMode === 'login';
  authDialog.querySelector('.auth-submit').textContent = authMode === 'login' ? 'Log in' : 'Create account';
}));

authDialog.addEventListener('click', event => { if (event.target === authDialog) authDialog.close(); });
onboardDialog.addEventListener('click', event => { if (event.target === onboardDialog) { onboardDialog.close(); runPendingAction(); } });

document.querySelectorAll('[data-open-auth]').forEach(button => button.addEventListener('click', () => openAuth()));

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

  const users = readUsers();
  if (authMode === 'signup') {
    if (users[email]) return fail('That email already has an account — log in instead.');
    const { algo, salt, hash } = await hashPassword(password);
    const record = { name, email, algo, salt, pass: hash, createdAt: new Date().toISOString(), onboarded: false, profile: null, plan: null, pendingPayment: null };
    users[email] = record;
    writeUsers(users);
    localStorage.setItem(SESSION_KEY, email);
    form.reset();
    authDialog.close();
    updateAuthLinks();
    renderProfile();
    openOnboard();
  } else {
    const record = users[email];
    if (!record || !(await verifyPassword(record, password))) return fail('Wrong email or password.');
    if (record.algo !== 'pbkdf2-sha256') {          // silently upgrade legacy hashes
      const { algo, salt, hash } = await hashPassword(password);
      Object.assign(record, { algo, salt, pass: hash });
      writeUsers(users);
    }
    localStorage.setItem(SESSION_KEY, email);
    form.reset();
    authDialog.close();
    updateAuthLinks();
    renderProfile();
    runPendingAction();
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

const GOAL_LABELS = { build: 'Build muscle', lose: 'Lose fat', fit: 'Get fit & lean', athlete: 'Athletic performance' };
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
  renderProfile();
});

// Header: show "Sign in" when logged out, first name (→ profile) when logged in.
const updateAuthLinks = () => {
  document.querySelectorAll('.auth-nav').forEach(el => el.remove());
  const user = currentUser();
  document.querySelectorAll('.site-header nav, .mobile-menu nav').forEach(nav => {
    const link = document.createElement('a');
    link.className = 'nav-directional auth-nav';
    if (user) {
      link.href = 'profile.html';
      link.textContent = user.name.split(' ')[0];
    } else {
      link.href = '#signin';
      link.textContent = 'Sign in';
      link.addEventListener('click', event => { event.preventDefault(); openAuth(); });
    }
    nav.appendChild(link);
  });
};

// Profile page rendering
const renderProfile = () => {
  if (!document.body.classList.contains('profile-page')) return;
  const gate = document.getElementById('profile-gate');
  const view = document.getElementById('profile-view');
  const empty = document.getElementById('profile-empty');
  const training = document.getElementById('profile-training');
  const diet = document.getElementById('profile-diet');
  const user = currentUser();
  gate.hidden = !!user;
  view.hidden = !user;
  if (!user) { empty.hidden = training.hidden = diet.hidden = true; return; }

  document.getElementById('pf-name').textContent = `${user.name.split(' ')[0]}.`;
  const since = new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const pending = user.pendingPayment;
  const status = user.plan
    ? user.plan
    : (pending ? `${pending.plan} — awaiting payment confirmation` : 'no active membership yet');
  document.getElementById('pf-sub').textContent = `Member since ${since} · ${status} · ${user.email}`;

  // A pending payment gets a visible, actionable banner instead of a silent lock.
  let banner = document.getElementById('pf-pending');
  if (pending && !user.plan) {
    if (!banner) {
      banner = document.createElement('p');
      banner.id = 'pf-pending';
      banner.className = 'pf-pending';
      document.getElementById('pf-sub').after(banner);
    }
    const message = `Hi ONYX, I've paid for ${pending.plan}. My reference is ${pending.ref}.`;
    banner.innerHTML = ONYX.PAYMENTS_API
      ? `We're confirming your payment for <strong>${pending.plan}</strong> — reference ` +
        `<strong>${pending.ref}</strong>. This updates automatically the moment it clears.`
      : `We're confirming your payment for <strong>${pending.plan}</strong> — reference ` +
        `<strong>${pending.ref}</strong>. Your plans unlock the moment it clears. ` +
        `<a href="https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">Nudge us on WhatsApp</a>.`;
    banner.hidden = false;
  } else if (banner) {
    banner.hidden = true;
  }

  const memberGate = document.getElementById('profile-member');
  if (!user.onboarded || !user.profile) {
    empty.hidden = false;
    memberGate.hidden = true;
    training.hidden = diet.hidden = true;
    document.getElementById('pf-stats').innerHTML = '';
    return;
  }
  empty.hidden = true;
  const p = user.profile;
  document.getElementById('pf-stats').innerHTML = [
    [GOAL_LABELS[p.goal], 'GOAL'],
    [`${p.weight} kg`, 'CURRENT'],
    [`${p.target} kg`, 'TARGET'],
    [`${p.days} d/wk`, 'TRAINING DAYS']
  ].map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('');

  // Customized training + diet plans unlock only with an active membership.
  memberGate.hidden = !!user.plan;
  training.hidden = diet.hidden = !user.plan;
  if (!user.plan) return;
  document.getElementById('pf-training-note').textContent = `${EXP_LABELS[p.experience].toUpperCase()} BLOCK · ${p.days} SESSIONS / WEEK · ADD 2.5 KG OR 1 REP WEEKLY`;
  document.getElementById('pf-days').innerHTML = p.week.map(day =>
    `<div class="pf-day"><div class="pf-day-head"><h4>${day.label}</h4><span>${day.focus.toUpperCase()}</span></div><ul>${day.items.map(item => `<li>${item}</li>`).join('')}</ul></div>`
  ).join('');

  document.getElementById('pf-calories').textContent = p.calories;
  document.getElementById('pf-protein').textContent = `${p.protein}g`;
  document.getElementById('pf-meals').innerHTML = p.meals.map(([title, text]) =>
    `<div class="pf-meal"><h4>${title}</h4><p>${text}</p></div>`
  ).join('');
};

const retakeButton = document.getElementById('pf-retake');
if (retakeButton) retakeButton.addEventListener('click', openOnboard);
const startAssessment = document.getElementById('pf-start-assessment');
if (startAssessment) startAssessment.addEventListener('click', openOnboard);
const logoutButton = document.getElementById('pf-logout');
if (logoutButton) logoutButton.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  updateAuthLinks();
  renderProfile();
});

updateAuthLinks();
renderProfile();

// Duck the floating "Reach out" CTA out of the way when the footer is visible
(() => {
  const fab = document.querySelector('.reach-fab');
  const footer = document.querySelector('footer');
  if (!fab || !footer || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(
    ([entry]) => fab.classList.toggle('fab-clear', entry.isIntersecting),
    { rootMargin: '0px 0px -12px 0px' }
  ).observe(footer);
})();
