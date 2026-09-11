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

  // Server route that verifies a Razorpay payment against the Payments API and
  // returns { active: true, plan: '...' }.  ** Until this is set, no membership
  // is ever activated in the browser ** — see beginPaymentFlow() below.
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
   from ONYX.MEMBERSHIP_VERIFY_ENDPOINT. With no backend configured the member
   stays pending and staff confirm manually — which is the correct, safe
   default. It is never possible to unlock paid content by opening and closing
   the payment tab.
   --------------------------------------------------------------------------- */
const paymentRef = () => 'ONYX-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const verifyMembership = async (user, payment) => {
  if (!ONYX.MEMBERSHIP_VERIFY_ENDPOINT) return false;
  try {
    const response = await fetch(ONYX.MEMBERSHIP_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, ref: payment.ref, plan: payment.plan, paymentId: payment.paymentId || null })
    });
    if (!response.ok) return false;
    const result = await response.json();
    if (!result || result.active !== true) return false;
    user.plan = result.plan || payment.plan;      // ← the ONLY place plan is set
    user.activatedAt = new Date().toISOString();
    user.expiresAt = addMonths(new Date(), planMonths(user.plan)).toISOString();
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
  const fullPlan = plan.includes('PT') ? plan : `${plan} membership`;
  const payment = { plan: fullPlan, ref: paymentRef(), startedAt: new Date().toISOString(), paymentId: null };
  user.pendingPayment = payment;                  // pending — NOT an active plan
  saveCurrentUser(user);
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
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
  const nextStep = payment.plan.includes('PT')
    ? `a coach will call you within 24 hours to schedule your sessions once the payment clears. `
    : `we activate your membership as soon as the payment clears. `;
  note.innerHTML = `Your reference is <strong>${payment.ref}</strong>. Keep it handy — ` +
    nextStep +
    `<a href="https://wa.me/${ONYX.WHATSAPP}?text=${encodeURIComponent('Hi ONYX, I just paid for ' + payment.plan + '. My reference is ' + payment.ref + '.')}" target="_blank" rel="noopener">Send it to us on WhatsApp</a> to speed that up.`;
  main.hidden = true;
  confirmation.hidden = false;
  if (!dialog.open) dialog.showModal();
};

// If Razorpay redirects back with its status params, capture the payment id and
// ask the backend (if any) to verify. Never trusted on its own.
// Deferred to DOMContentLoaded: renderProfile() is declared further down this
// file, so calling it during the initial synchronous pass would hit the TDZ.
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('razorpay_payment_link_status');
  if (!status) return;
  const user = currentUser();
  if (user && user.pendingPayment) {
    user.pendingPayment.paymentId = params.get('razorpay_payment_id') || null;
    user.pendingPayment.reportedStatus = status;
    saveCurrentUser(user);
    if (status === 'paid') await verifyMembership(user, user.pendingPayment);
  }
  history.replaceState(null, '', window.location.pathname);
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
  if (!user) {
    empty.hidden = training.hidden = diet.hidden = true;
    ['profile-membership', 'profile-today', 'profile-library', 'profile-progress', 'profile-attendance', 'profile-coach', 'profile-goals', 'profile-challenges'].forEach(id => {
      const section = document.getElementById(id);
      if (section) section.hidden = true;
    });
    return;
  }

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
    banner.innerHTML = `We're confirming your payment for <strong>${pending.plan}</strong> — reference ` +
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
    const coachProg = user.activeProgram && user.activeProgram.source === 'coach' ? user.activeProgram : null;
    if (user.plan && coachProg && coachProg.week) {
      empty.hidden = true;
      memberGate.hidden = true;
      training.hidden = false;
      document.getElementById('pf-training-note').textContent = `${String(coachProg.name).toUpperCase()} · ASSIGNED BY ${String(coachProg.coach || 'YOUR COACH').toUpperCase()}`;
      document.getElementById('pf-days').innerHTML = coachProg.week.map(day =>
        `<div class="pf-day"><div class="pf-day-head"><h4>${esc(day.label)}</h4><span>${esc(day.focus).toUpperCase()}</span></div><ul>${day.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>`
      ).join('');
    }
    if (user.plan && user.customDiet && user.customDiet.meals) {
      diet.hidden = false;
      renderDietSection(user);
    }
    renderDashboard(user);
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
  const activeProgram = user.activeProgram && user.activeProgram.week ? user.activeProgram : { name: 'My ONYX Plan', week: p.week };
  document.getElementById('pf-training-note').textContent = `${activeProgram.name.toUpperCase()} \u00b7 ${activeProgram.week.length} SESSIONS / WEEK \u00b7 ADD 2.5 KG OR 1 REP WEEKLY}`;
  document.getElementById('pf-days').innerHTML = activeProgram.week.map(day =>
    `<div class="pf-day"><div class="pf-day-head"><h4>${esc(day.label)}</h4><span>${esc(day.focus).toUpperCase()}</span></div><ul>${day.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>`
  ).join('');

  renderDietSection(user);  const ap = user.activeProgram || {};
  const coachLine = document.getElementById('pf-coach-note');
  if (coachLine) {
    const showCoach = ap.source === 'coach' && ap.coach;
    coachLine.hidden = !showCoach;
    if (showCoach) coachLine.textContent = `ASSIGNED BY ${String(ap.coach).toUpperCase()}${ap.assignedAt ? ` · ${fmtDate(ap.assignedAt).toUpperCase()}` : ''} — FOLLOW IT AS WRITTEN; ASK BEFORE SWAPPING DAYS.`;
  }
  const prLine = document.getElementById('pf-prs');
  if (prLine) {
    const prs = (user.prs || []).slice(-3).reverse();
    prLine.hidden = !prs.length;
    if (prs.length) prLine.textContent = `LATEST PRS — ${prs.map(r => `${r.lift} ${r.weight}kg`).join(' · ')}`;
  }
  const notesBox = document.getElementById('pf-coach-notes');
  if (notesBox) {
    const shared = (user.coachNotes || []).filter(n => n.shared).slice(-3).reverse();
    notesBox.hidden = !shared.length;
    notesBox.innerHTML = shared.map(n => `<p><strong>${esc(n.by)} · ${esc(fmtDate(n.at))}</strong>${esc(n.text)}</p>`).join('');
  }
  renderDashboard(user);
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

/* First paint happens at the end of this file, after all modules load. */

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

// PT pack buttons: same safe payment entry point as membership plans.
document.querySelectorAll('[data-pt-plan]').forEach(button => button.addEventListener('click', () => {
  const plan = button.dataset.ptPlan;
  const link = PAYMENT_LINKS[plan];
  if (link) beginPaymentFlow(link, plan);
}));

/* ===========================================================================
   MEMBER DASHBOARD — membership card, today's overview, program library.
   Demo storage: dashboard data lives on the member's user record in
   localStorage until the backend endpoints replace it (see README).
   =========================================================================== */
ONYX.COACH_EMAILS = ONYX.COACH_EMAILS || []; // Coach emails unlock Coach Studio, e.g. ['coach@onyxathletic.club'].

const ONYX_PROGRAMS = [
  { id: 'onyx-engine', name: 'Fat Loss Engine', goal: 'lose', official: true, builtin: true, author: 'ONYX Coaching Team', week: [
    { label: 'Day 1', focus: 'Upper strength', items: ['Bench press — 4 × 8', 'Barbell row — 4 × 8', 'Overhead press — 3 × 10', 'Lat pulldown — 3 × 10', 'Bike finisher — 8 min'] },
    { label: 'Day 2', focus: 'Engine intervals', items: ['Row erg — 6 × 250m', 'Kettlebell swings — 5 × 15', 'Battle ropes — 8 × (20s on / 40s off)', 'Farmer carry — 4 × 30m'] },
    { label: 'Day 3', focus: 'Lower strength', items: ['Back squat — 4 × 6', 'Romanian deadlift — 3 × 8', 'Walking lunges — 3 × 10 / side', 'Standing calf raise — 3 × 12', 'Rope finisher — 8 min'] },
    { label: 'Day 4', focus: 'Full-body circuit', items: ['Thrusters — 4 × 10', 'Pull-ups — 4 × max', 'Dips — 3 × 10', 'Hanging leg raise — 3 × 12', 'Sled push — 6 × 20m'] }
  ] },
  { id: 'onyx-first-barbell', name: 'First Barbell', goal: 'fit', official: true, builtin: true, author: 'ONYX Coaching Team', week: [
    { label: 'Day 1', focus: 'Full body A', items: ['Goblet squat — 3 × 10', 'Bench press — 3 × 8', 'Seated row — 3 × 10', 'Plank — 3 × 30s'] },
    { label: 'Day 2', focus: 'Full body B', items: ['Romanian deadlift — 3 × 8', 'Overhead press — 3 × 8', 'Lat pulldown — 3 × 10', 'Glute bridge — 3 × 12'] },
    { label: 'Day 3', focus: 'Full body C', items: ['Leg press — 3 × 10', 'Incline dumbbell press — 3 × 10', 'Single-arm dumbbell row — 3 × 10 / side', 'Dead hang — 3 × 20s'] }
  ] },
  { id: 'onyx-ppl', name: 'Push · Pull · Legs + Engine', goal: 'build', official: true, builtin: true, author: 'ONYX Coaching Team', week: [
    { label: 'Day 1', focus: 'Chest + triceps', items: ['Bench press — 4 × 6', 'Incline dumbbell press — 3 × 10', 'Cable fly — 3 × 12', 'Rope pressdown — 3 × 12'] },
    { label: 'Day 2', focus: 'Back + biceps', items: ['Deadlift — 3 × 5', 'Pull-ups — 4 × 6', 'Barbell row — 3 × 8', 'Incline curl — 3 × 10'] },
    { label: 'Day 3', focus: 'Legs', items: ['Back squat — 4 × 6', 'Leg press — 3 × 10', 'Seated leg curl — 3 × 12', 'Standing calf raise — 4 × 12'] },
    { label: 'Day 4', focus: 'Shoulders + arms', items: ['Overhead press — 4 × 6', 'Lateral raise — 4 × 12', 'Rear-delt fly — 3 × 14', 'Barbell curl — 3 × 10'] },
    { label: 'Day 5', focus: 'Engine + core', items: ['Row — 3 × 1000m', 'Kettlebell swings — 4 × 20', 'Hanging leg raise — 4 × 12', 'Side plank — 3 × 30s / side'] }
  ] }
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const fmtDate = iso => {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};
const planMonths = plan => {
  if (!plan) return 0;
  const m = String(plan).match(/^(\d+)\s*months?\s*membership/i);
  if (m) return parseInt(m[1], 10);
  if (/^monthly/i.test(plan)) return 1;
  if (/single PT/i.test(plan)) return 1;
  if (/PT pack/i.test(plan)) return 3;
  return 1;
};
const addMonths = (date, n) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; };
const isCoach = user => !!user && Array.isArray(ONYX.COACH_EMAILS) &&
  ONYX.COACH_EMAILS.map(e => String(e).toLowerCase()).includes(String(user.email).toLowerCase());

const ensureMembershipDates = user => {
  if (!user || !user.plan) return;
  if (!user.activatedAt) user.activatedAt = user.createdAt || new Date().toISOString();
  if (!user.expiresAt) user.expiresAt = addMonths(new Date(user.activatedAt), planMonths(user.plan)).toISOString();
  saveCurrentUser(user);
};

const normalizeDash = user => {
  let changed = false;
  const ensure = (key, value) => { if (user[key] === undefined) { user[key] = value; changed = true; } };
  ensure('checkins', []); ensure('foodLog', {}); ensure('stepsLog', {});
  ensure('goals', []); ensure('customPrograms', []); ensure('workoutDone', {});
  ensure('threads', {}); ensure('coachPrograms', []); ensure('coachNotes', []);
  ensure('prs', []); ensure('measurements', []); ensure('sessions', []);
  ensure('memberReadAt', {}); ensure('coachReadAt', {}); ensure('foodLog', {}); ensure('aiChat', []);
  if (user.assignedCoach === undefined) { user.assignedCoach = null; changed = true; }
  if (user.customDiet === undefined) { user.customDiet = null; changed = true; }
  if (user.mainGoal === undefined) { user.mainGoal = null; changed = true; }
  if (user.checkinCount === undefined) { user.checkinCount = 0; changed = true; }
  if (!user.visits) {
    user.visits = (user.checkins || []).map(d => ({ at: `${d}T12:00:00.000`, method: 'manual' }));
    changed = true;
  }
  if (user.profile && user.profile.week && !user.activeProgram) {
    user.activeProgram = { name: 'My ONYX Plan', source: 'assessment', week: user.profile.week };
    changed = true;
  }
  if (user.profile && !user.goalsSeeded) {
    user.goalsSeeded = true; changed = true;
    user.goals.push({ id: 'g-seed', title: `Reach ${user.profile.target} kg`, target: user.profile.target, unit: 'kg', current: user.profile.weight, done: false });
  }
  if (changed) saveCurrentUser(user);
};

const calcStreak = checkins => {
  const set = new Set(checkins || []);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const todaysSession = user => {
  if (new Date().getDay() === 0) return { rest: true };
  const program = user.activeProgram && user.activeProgram.week ? user.activeProgram
    : (user.profile && user.profile.week ? { name: 'My ONYX Plan', week: user.profile.week } : null);
  if (!program) return null;
  const start = new Date(new Date().getFullYear(), 0, 0);
  const doy = Math.floor((Date.now() - start.getTime()) / 86400000);
  return { rest: false, program: program.name, session: program.week[doy % program.week.length] };
};

/* ---------- membership card ---------- */
const renderMembership = user => {
  const section = document.getElementById('profile-membership');
  if (!section) return;
  section.hidden = false;
  const planEl = document.getElementById('ms-plan');
  const startEl = document.getElementById('ms-start');
  const expiryEl = document.getElementById('ms-expiry');
  const daysEl = document.getElementById('ms-days');
  const barEl = document.getElementById('ms-bar');
  const stateEl = document.getElementById('ms-state');
  const renewEl = document.getElementById('ms-renew');
  const pendingEl = document.getElementById('ms-pending');
  const pending = user.pendingPayment;
  if (!user.plan) {
    planEl.textContent = 'No active membership';
    startEl.textContent = expiryEl.textContent = daysEl.textContent = '—';
    barEl.style.width = '0%';
    section.classList.remove('is-expiring', 'is-expired');
    stateEl.textContent = pending
      ? `Payment for ${pending.plan} is confirming — reference ${pending.ref}.`
      : 'Pick a plan to unlock your training week, diet plan and programs.';
    renewEl.querySelector('span').textContent = pending ? 'View plans' : 'Become a member';
    if (pending) {
      pendingEl.hidden = false;
      pendingEl.innerHTML = `Confirming <strong>${esc(pending.plan)}</strong> · ref <strong>${esc(pending.ref)}</strong>`;
    } else pendingEl.hidden = true;
    return;
  }
  pendingEl.hidden = true;
  ensureMembershipDates(user);
  const start = new Date(user.activatedAt);
  const expiry = new Date(user.expiresAt);
  const total = Math.max(1, Math.round((expiry - start) / 86400000));
  const left = Math.ceil((expiry - Date.now()) / 86400000);
  planEl.textContent = user.plan;
  startEl.textContent = fmtDate(user.activatedAt);
  expiryEl.textContent = fmtDate(user.expiresAt);
  daysEl.textContent = left >= 0 ? `${left} day${left === 1 ? '' : 's'}` : 'Expired';
  barEl.style.width = `${Math.max(0, Math.min(100, Math.round((left / total) * 100)))}%`;
  section.classList.toggle('is-expiring', left >= 0 && left <= 7);
  section.classList.toggle('is-expired', left < 0);
  stateEl.textContent = left < 0
    ? 'Your membership has expired — renew to keep training.'
    : left <= 7 ? 'Expiring soon — renew now so your streak never breaks.'
    : `${left} days of training ahead. Keep showing up.`;
  renewEl.querySelector('span').textContent = left < 0 ? 'Renew now' : 'Renew / extend';
};

/* ---------- today's overview ---------- */
const renderToday = user => {
  const section = document.getElementById('profile-today');
  if (!section) return;
  section.hidden = false;
  const today = dayKey();
  document.getElementById('td-date').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();

  // Workout
  const titleEl = document.getElementById('td-workout-title');
  const progEl = document.getElementById('td-workout-prog');
  const listEl = document.getElementById('td-workout-list');
  const doneBtn = document.getElementById('td-workout-done');
  const done = !!(user.workoutDone && user.workoutDone[today]);
  if (!user.plan) {
    titleEl.textContent = 'Members only';
    progEl.textContent = 'UNLOCK WITH ANY MEMBERSHIP';
    listEl.innerHTML = '<li>Your training week, diet plan and programs unlock the moment you join.</li>';
    doneBtn.disabled = false;
    doneBtn.textContent = 'View plans';
    doneBtn.onclick = () => { window.location.href = 'index.html#membership'; };
  } else {
    const t = todaysSession(user);
    if (!t) {
      titleEl.textContent = 'No program yet';
      progEl.textContent = 'START WITH THE ASSESSMENT OR LIBRARY';
      listEl.innerHTML = '<li>Finish your assessment or start a program from the library below.</li>';
      doneBtn.disabled = true;
      doneBtn.textContent = 'Nothing scheduled';
      doneBtn.onclick = null;
    } else if (t.rest) {
      titleEl.textContent = 'Rest day';
      progEl.textContent = 'SUNDAY · THE FLOOR IS CLOSED';
      listEl.innerHTML = '<li>Sleep, walk, stretch. Growth happens between sessions.</li>';
      doneBtn.disabled = true;
      doneBtn.textContent = 'Rest well';
      doneBtn.onclick = null;
    } else {
      titleEl.textContent = t.session.focus;
      progEl.textContent = `${t.session.label.toUpperCase()} · ${String(t.program).toUpperCase()}`;
      listEl.innerHTML = t.session.items.map(item => `<li>${esc(item)}</li>`).join('');
      doneBtn.disabled = done;
      doneBtn.textContent = done ? 'Done ✓' : 'Mark done';
      doneBtn.onclick = () => {
        user.workoutDone[today] = true;
        if (!user.checkins.includes(today)) user.checkins.push(today);
        saveCurrentUser(user);
        renderToday(user);
      };
    }
  }

  // Calories
  const target = (user.profile && user.profile.calories) || 2200;
  const entries = (user.foodLog && user.foodLog[today]) || [];
  const eaten = entries.reduce((sum, e) => sum + (parseInt(e.kcal, 10) || 0), 0);
  document.getElementById('td-cal-left').textContent = Math.max(0, target - eaten).toLocaleString('en-IN');
  document.getElementById('td-cal-sub').textContent = `${eaten.toLocaleString('en-IN')} EATEN · ${target.toLocaleString('en-IN')} TARGET`;
  document.getElementById('td-cal-bar').style.width = `${Math.min(100, Math.round((eaten / target) * 100))}%`;
  document.getElementById('td-food-list').innerHTML = entries.length
    ? entries.map((e, i) => `<li><span>${esc(e.label)}</span><span>${esc(String(e.kcal))} kcal <button type="button" data-food-del="${i}" aria-label="Remove ${esc(e.label)}">×</button></span></li>`).join('')
    : '<li class="log-empty">Nothing logged yet today.</li>';

  // Steps
  const steps = (user.stepsLog && user.stepsLog[today]) || 0;
  document.getElementById('td-steps-count').textContent = steps.toLocaleString('en-IN');
  document.getElementById('td-steps-bar').style.width = `${Math.min(100, Math.round((steps / 10000) * 100))}%`;

  // Attendance
  const checkins = user.checkins || [];
  const checked = checkins.includes(today);
  document.getElementById('td-streak').textContent = calcStreak(checkins);
  const monthPrefix = today.slice(0, 7);
  document.getElementById('td-month').textContent =
    `${checkins.filter(d => d.startsWith(monthPrefix)).length} CHECK-INS THIS MONTH · ${checkins.length} ALL TIME`;
  const dots = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    dots.push(`<span class="${checkins.includes(key) ? 'is-on' : ''}" title="${key}"></span>`);
  }
  document.getElementById('td-dots').innerHTML = dots.join('');
  const checkinBtn = document.getElementById('td-checkin');
  checkinBtn.disabled = checked;
  checkinBtn.textContent = checked ? 'Checked in ✓' : 'Check in at gym';
  checkinBtn.onclick = () => {
    if (!user.checkins.includes(today)) user.checkins.push(today);
    saveCurrentUser(user);
    renderToday(user);
  };

  // Goals
  const goals = user.goals || [];
  document.getElementById('td-goal-list').innerHTML = goals.length
    ? goals.map(g => {
        const pct = g.target > 0 ? Math.max(0, Math.min(100, Math.round((g.current / g.target) * 100))) : 0;
        return `<li class="goal-row${g.done ? ' is-done' : ''}"><div><strong>${esc(g.title)}</strong>` +
          `<span>${esc(String(g.current))} / ${esc(String(g.target))} ${esc(g.unit)}</span>` +
          `<div class="today-bar goal-bar"><i style="width:${pct}%"></i></div></div>` +
          `<div class="goal-actions"><button type="button" data-goal="${g.id}" data-act="down" aria-label="Decrease">−</button>` +
          `<button type="button" data-goal="${g.id}" data-act="up" aria-label="Increase">+</button>` +
          `<button type="button" data-goal="${g.id}" data-act="done" aria-label="Toggle done">✓</button>` +
          `<button type="button" data-goal="${g.id}" data-act="del" aria-label="Delete">×</button></div></li>`;
      }).join('')
    : '<li class="log-empty">No goals yet — set your first one below.</li>';
};

/* ---------- program library + builder ---------- */
const expandedLib = new Set();
const allPrograms = user => [...ONYX_PROGRAMS, ...(user.customPrograms || [])];

const renderLibrary = user => {
  const section = document.getElementById('profile-library');
  if (!section) return;
  section.hidden = false;
  const coach = isCoach(user);
  document.getElementById('coach-banner').hidden = !coach;
  document.getElementById('lib-grid').innerHTML = allPrograms(user).map(p => {
    const isActive = !!(user.activeProgram && user.activeProgram.id && user.activeProgram.id === p.id);
    const open = expandedLib.has(p.id);
    const canDelete = !p.builtin && (coach || p.email === user.email);
    return `<article class="lib-card${p.official ? ' is-official' : ''}${isActive ? ' is-active' : ''}">` +
      `<span class="lib-tag">${p.official ? 'ONYX OFFICIAL' : 'COMMUNITY'} · ${esc((GOAL_LABELS[p.goal] || p.goal || '').toUpperCase())} · ${p.week.length} DAYS/WK</span>` +
      `<h3>${esc(p.name)}</h3><p class="lib-by">by ${esc(p.author || 'ONYX')}</p>` +
      (open ? `<div class="lib-week">${p.week.map(d =>
        `<div><h4>${esc(d.label)} — ${esc(d.focus)}</h4><ul>${d.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`
      ).join('')}</div>` : '') +
      `<div class="lib-actions"><button type="button" data-lib="${p.id}" data-act="preview">${open ? 'Hide' : 'Preview'}</button>` +
      (isActive
        ? '<button type="button" disabled>Active ✓</button>'
        : `<button type="button" data-lib="${p.id}" data-act="start">Start program</button>`) +
      (coach && !p.builtin ? `<button type="button" data-lib="${p.id}" data-act="official">${p.official ? 'Unofficial' : 'Make official'}</button>` : '') +
      (canDelete ? `<button type="button" data-lib="${p.id}" data-act="del">Delete</button>` : '') +
      '</div></article>';
  }).join('');
  document.getElementById('lib-build').onclick = () => {
    builderGoal = '';
    document.querySelectorAll('#builder-chips button').forEach(b => b.classList.remove('is-on'));
    document.getElementById('builder-error').hidden = true;
    document.getElementById('builder-form').reset();
    renderBuilderDays(4);
    document.getElementById('builder-dialog').showModal();
  };
};

let builderGoal = '';
const renderBuilderDays = count => {
  const wrap = document.getElementById('builder-days');
  if (!wrap) return;
  wrap.innerHTML = Array.from({ length: count }, (_, i) =>
    `<div class="builder-day" data-day="${i}"><span class="field-label">DAY ${i + 1} FOCUS</span>` +
    `<input name="focus-${i}" maxlength="40" placeholder="e.g. Upper strength" />` +
    `<div class="ex-list" id="ex-list-${i}"></div>` +
    `<button type="button" class="builder-add" data-add-ex="${i}">+ Add exercise</button></div>`
  ).join('');
  for (let i = 0; i < count; i++) addExerciseRow(i);
};
const addExerciseRow = day => {
  const list = document.getElementById(`ex-list-${day}`);
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'ex-row';
  row.innerHTML = '<input maxlength="60" placeholder="Exercise — e.g. Bench press" aria-label="Exercise name" />' +
    '<input inputmode="numeric" maxlength="3" placeholder="Sets" aria-label="Sets" />' +
    '<input maxlength="12" placeholder="Reps — 8" aria-label="Reps" />' +
    '<button type="button" aria-label="Remove exercise">×</button>';
  row.querySelector('button').addEventListener('click', () => row.remove());
  list.appendChild(row);
};

const renderDashboard = user => {
  if (!document.body.classList.contains('profile-page')) return;
  if (!user) return;
  normalizeDash(user);
  renderMembership(user);
  renderToday(user);
  renderLibrary(user);
  renderGoals(user);
  renderAttendance(user);
  renderChallenges(user);
  renderCoachSection(user);
  renderProgress(user).catch(() => {});
};

/* ---------- dashboard events (bound once) ---------- */
(() => {
  const foodForm = document.getElementById('td-food-form');
  if (foodForm) foodForm.addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const label = foodForm.elements.food.value.trim().slice(0, 40);
    const kcal = parseInt(foodForm.elements.kcal.value, 10);
    if (!label || !(kcal > 0)) return;
    const today = dayKey();
    user.foodLog[today] = user.foodLog[today] || [];
    user.foodLog[today].push({ label, kcal });
    saveCurrentUser(user);
    foodForm.reset();
    renderToday(user);
  });

  const foodList = document.getElementById('td-food-list');
  if (foodList) foodList.addEventListener('click', event => {
    const btn = event.target.closest('[data-food-del]');
    if (!btn) return;
    const user = currentUser();
    if (!user) return;
    const entries = user.foodLog[dayKey()] || [];
    entries.splice(parseInt(btn.dataset.foodDel, 10), 1);
    saveCurrentUser(user);
    renderToday(user);
  });

  const stepsForm = document.getElementById('td-steps-form');
  if (stepsForm) stepsForm.addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const val = parseInt(stepsForm.elements.steps.value, 10);
    if (!(val > 0)) return;
    const today = dayKey();
    user.stepsLog[today] = (user.stepsLog[today] || 0) + val;
    saveCurrentUser(user);
    stepsForm.reset();
    renderToday(user);
  });

  const goalForm = document.getElementById('td-goal-form');
  if (goalForm) goalForm.addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const title = goalForm.elements.title.value.trim().slice(0, 50);
    const target = parseFloat(goalForm.elements.target.value);
    const unit = goalForm.elements.unit.value.trim().slice(0, 10) || 'units';
    if (!title || !(target > 0)) return;
    user.goals.push({ id: 'g' + Date.now().toString(36), title, target, unit, current: 0, done: false });
    saveCurrentUser(user);
    goalForm.reset();
    renderToday(user);
  });

  const goalList = document.getElementById('td-goal-list');
  if (goalList) goalList.addEventListener('click', event => {
    const btn = event.target.closest('[data-goal]');
    if (!btn) return;
    const user = currentUser();
    if (!user) return;
    const goal = (user.goals || []).find(g => g.id === btn.dataset.goal);
    if (!goal) return;
    const step = goal.target >= 100 ? 5 : 1;
    if (btn.dataset.act === 'up') goal.current = Math.round((goal.current + step) * 10) / 10;
    if (btn.dataset.act === 'down') goal.current = Math.max(0, Math.round((goal.current - step) * 10) / 10);
    if (btn.dataset.act === 'done') goal.done = !goal.done;
    if (btn.dataset.act === 'del') user.goals = user.goals.filter(g => g.id !== goal.id);
    saveCurrentUser(user);
    renderToday(user);
  });

  const libGrid = document.getElementById('lib-grid');
  if (libGrid) libGrid.addEventListener('click', event => {
    const btn = event.target.closest('[data-lib]');
    if (!btn) return;
    const user = currentUser();
    if (!user) return;
    const id = btn.dataset.lib;
    const program = allPrograms(user).find(p => p.id === id);
    if (!program) return;
    if (btn.dataset.act === 'preview') {
      if (expandedLib.has(id)) expandedLib.delete(id); else expandedLib.add(id);
      renderLibrary(user);
    }
    if (btn.dataset.act === 'start') {
      if (!user.plan) { window.location.href = 'index.html#membership'; return; }
      user.activeProgram = { id: program.id, name: program.name, source: program.builtin ? 'library' : 'custom', week: JSON.parse(JSON.stringify(program.week)) };
      saveCurrentUser(user);
      renderProfile();
    }
    if (btn.dataset.act === 'del') {
      user.customPrograms = (user.customPrograms || []).filter(p => p.id !== id);
      if (user.activeProgram && user.activeProgram.id === id) user.activeProgram = null;
      saveCurrentUser(user);
      renderProfile();
    }
    if (btn.dataset.act === 'official' && isCoach(user)) {
      program.official = !program.official;
      saveCurrentUser(user);
      renderLibrary(user);
    }
  });

  const builderDialog = document.getElementById('builder-dialog');
  if (builderDialog) {
    builderDialog.addEventListener('click', event => {
      if (event.target === builderDialog) builderDialog.close();
      const addBtn = event.target.closest('[data-add-ex]');
      if (addBtn) addExerciseRow(parseInt(addBtn.dataset.addEx, 10));
    });
    document.getElementById('builder-chips').addEventListener('click', event => {
      const chip = event.target.closest('button[data-value]');
      if (!chip) return;
      builderGoal = chip.dataset.value;
      document.querySelectorAll('#builder-chips button').forEach(b => b.classList.toggle('is-on', b === chip));
    });
    const bdays = builderDialog.querySelector('select[name="bdays"]');
    if (bdays) bdays.addEventListener('change', () => renderBuilderDays(parseInt(bdays.value, 10)));
    document.getElementById('builder-form').addEventListener('submit', event => {
      event.preventDefault();
      const user = currentUser();
      if (!user) return;
      const errorEl = document.getElementById('builder-error');
      const fail = message => { errorEl.textContent = message; errorEl.hidden = !message; };
      const form = event.target;
      const name = form.elements.bname.value.trim().slice(0, 50);
      if (name.length < 3) return fail('Give your program a name (3+ characters).');
      if (!builderGoal) return fail('Pick a goal for this program.');
      const count = parseInt(form.elements.bdays.value, 10);
      const week = [];
      for (let i = 0; i < count; i++) {
        const focus = form.elements[`focus-${i}`].value.trim().slice(0, 40);
        if (!focus) return fail(`Day ${i + 1} needs a focus (e.g. Upper strength).`);
        const rows = [...document.querySelectorAll(`#ex-list-${i} .ex-row`)];
        const items = rows.map(row => {
          const [ex, sets, reps] = [...row.querySelectorAll('input')].map(input => input.value.trim());
          return ex && sets && reps ? `${ex} — ${sets} × ${reps}` : null;
        }).filter(Boolean);
        if (!items.length) return fail(`Day ${i + 1} needs at least one complete exercise.`);
        week.push({ label: `Day ${i + 1}`, focus, items });
      }
      fail('');
      const coach = isCoach(user);
      user.customPrograms.push({
        id: 'c' + Date.now().toString(36), name, goal: builderGoal, week,
        official: coach, builtin: false, author: coach ? `Coach ${user.name.split(' ')[0]}` : user.name,
        email: user.email, createdAt: new Date().toISOString()
      });
      saveCurrentUser(user);
      builderDialog.close();
      renderLibrary(user);
      if (document.body.classList.contains('coach-page')) refreshCoach();
    });
  }
})();

/* ===========================================================================
   TRANSFORMATION TRACKING — on-device photo vault (IndexedDB), week timeline,
   before/after compare, weight trend. Photos never leave this browser until
   the backend member cloud replaces local storage.
   =========================================================================== */
const PRIVACY_LABELS = { private: 'PRIVATE', coaches: 'COACHES', public: 'FEATURE ME' };

const ProgressDB = {
  db: null,
  open() {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      if (!('indexedDB' in window)) return reject(new Error('no-idb'));
      const req = indexedDB.open('onyx_progress', 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('email', 'email', { unique: false });
      };
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => reject(req.error || new Error('idb-open'));
    });
  },
  all(email) {
    return this.open().then(db => new Promise((resolve, reject) => {
      const out = [];
      const cursor = db.transaction('entries', 'readonly').objectStore('entries').index('email').openCursor(IDBKeyRange.only(email));
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (c) { out.push(c.value); c.continue(); } else resolve(out);
      };
      cursor.onerror = () => reject(cursor.error || new Error('idb-read'));
    }));
  },
  put(entry) {
    return this.open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction('entries', 'readwrite');
      t.objectStore('entries').put(entry);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error || new Error('idb-write'));
    }));
  },
  del(id) {
    return this.open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction('entries', 'readwrite');
      t.objectStore('entries').delete(id);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error || new Error('idb-del'));
    }));
  },
  clearUser(email) {
    return this.open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction('entries', 'readwrite');
      const store = t.objectStore('entries');
      const cursor = store.index('email').openCursor(IDBKeyRange.only(email));
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (c) { store.delete(c.primaryKey); c.continue(); }
      };
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error || new Error('idb-wipe'));
    }));
  }
};

const processPhoto = file => new Promise((resolve, reject) => {
  if (!file || !file.type.startsWith('image/')) return reject(new Error('not-image'));
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode-fail'))), 'image/jpeg', 0.72);
    } catch (err) { URL.revokeObjectURL(url); reject(err); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load-fail')); };
  img.src = url;
});

const photoURLs = new Set();
const photoURL = blob => {
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  photoURLs.add(url);
  return url;
};
const revokePhotos = () => { photoURLs.forEach(u => URL.revokeObjectURL(u)); photoURLs.clear(); };

let progressCache = [];
let cmpA = null, cmpB = null, cmpAngle = 'front', cmpPct = 50;
let activeEntryId = null, pdAngle = 'front';
let ckFiles = { front: null, side: null, back: null };

const suggestedWeek = user => {
  const base = new Date(user.activatedAt || user.createdAt || Date.now()).getTime();
  return Math.max(1, Math.min(16, Math.floor((Date.now() - base) / (7 * 86400000)) + 1));
};
const entryLabel = e => `Week ${e.week} · ${fmtDate(e.dateISO)}`;

const renderProgress = async user => {
  const section = document.getElementById('profile-progress');
  if (!section || !user) return;
  section.hidden = false;
  if (user.discreetMode === undefined) { user.discreetMode = true; saveCurrentUser(user); }
  const discreetBox = document.getElementById('pg-discreet');
  if (discreetBox) discreetBox.checked = !!user.discreetMode;
  document.body.classList.toggle('pg-discreet', !!user.discreetMode);
  let entries = [];
  try {
    entries = await ProgressDB.all(user.email);
  } catch (err) {
    document.getElementById('pg-milestones').innerHTML =
      '<p class="pg-fallback">Photo vault unavailable in this browser mode (private windows block storage). Your check-ins will work in a regular window.</p>';
    return;
  }
  entries.sort((a, b) => a.week - b.week || (a.dateISO < b.dateISO ? -1 : 1));
  revokePhotos();
  entries.forEach(e => {
    e._urls = {
      front: photoURL(e.photos && e.photos.front),
      side: photoURL(e.photos && e.photos.side),
      back: photoURL(e.photos && e.photos.back)
    };
  });
  progressCache = entries;

  // Milestones: Week 1 → 4 → 8 → 12
  const byWeek = {};
  entries.forEach(e => { byWeek[e.week] = e; });
  document.getElementById('pg-milestones').innerHTML = [1, 4, 8, 12].map((w, i) => {
    const e = byWeek[w];
    const thumb = e ? (e._urls.front || e._urls.side || e._urls.back) : null;
    return `<div class="pg-mile-step"><button type="button" class="pg-slot${e ? '' : ' is-empty'}" data-mile="${w}">` +
      (thumb ? `<img src="${thumb}" alt="Week ${w} progress photo" loading="lazy" />`
        : `<span class="pg-slot-empty">W${w}</span>`) +
      `</button><div class="pg-mile-cap"><strong>WEEK ${w}</strong><span>${e ? `${esc(fmtDate(e.dateISO))}${e.weight ? ` · ${esc(String(e.weight))} KG` : ''}` : 'Not logged yet'}</span></div>` +
      (i < 3 ? '<i class="pg-arrow" aria-hidden="true">→</i>' : '') + '</div>';
  }).join('');

  document.getElementById('pg-chips').innerHTML = entries.length
    ? entries.map(e => `<button type="button" data-entry="${e.id}" class="${e.id === activeEntryId ? 'is-on' : ''}">W${e.week}</button>`).join('')
    : '<span class="pg-none">No check-ins yet.</span>';

  // Weight trend
  const weighed = entries.filter(e => e.weight > 0);
  const chartWrap = document.getElementById('pg-chart-wrap');
  if (weighed.length >= 2) {
    chartWrap.hidden = false;
    const W = 600, H = 160, padL = 8, padB = 22, padT = 16;
    const weights = weighed.map(e => e.weight);
    let min = Math.min(...weights), max = Math.max(...weights);
    if (max - min < 2) { min -= 1; max += 1; }
    const x = i => padL + (i * (W - padL * 2)) / Math.max(1, weighed.length - 1);
    const y = v => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
    const pts = weighed.map((e, i) => `${x(i).toFixed(1)},${y(e.weight).toFixed(1)}`).join(' ');
    document.getElementById('pg-chart').innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend chart">` +
      `<polyline points="${pts}" fill="none" stroke="var(--lime)" stroke-width="2" />` +
      weighed.map((e, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(e.weight).toFixed(1)}" r="4" fill="var(--lime)" />` +
        `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">W${e.week}</text>`).join('') +
      `<text x="${padL}" y="${padT - 5}">${esc(String(max))} kg max</text></svg>` +
      `<p class="chart-sub">FIRST ${esc(String(weighed[0].weight))} KG → LATEST ${esc(String(weighed[weighed.length - 1].weight))} KG</p>`;
  } else chartWrap.hidden = true;

  // Compare defaults: earliest vs latest
  const ids = entries.map(e => e.id);
  if (!ids.includes(cmpA)) cmpA = ids[0] || null;
  if (!ids.includes(cmpB)) cmpB = ids[ids.length - 1] || null;
  const opts = entries.map(e => `<option value="${e.id}">${esc(entryLabel(e))}</option>`).join('');
  const selA = document.getElementById('cmp-a');
  const selB = document.getElementById('cmp-b');
  selA.innerHTML = opts; selB.innerHTML = opts;
  if (cmpA) selA.value = cmpA;
  if (cmpB) selB.value = cmpB;
  renderCompare();
};

const renderCompare = () => {
  const frame = document.getElementById('cmp-frame');
  if (!frame) return;
  const a = progressCache.find(e => e.id === cmpA);
  const b = progressCache.find(e => e.id === cmpB);
  const empty = document.getElementById('cmp-empty');
  const hasPhotos = progressCache.some(e => e._urls && (e._urls.front || e._urls.side || e._urls.back));
  const ready = !!(a && b && hasPhotos);
  empty.hidden = ready;
  frame.style.display = ready ? '' : 'none';
  document.getElementById('cmp-range').style.display = ready ? '' : 'none';
  if (!ready) return;
  const urlA = a._urls[cmpAngle], urlB = b._urls[cmpAngle];
  const layerA = document.getElementById('cmp-layer-before');
  const layerB = document.getElementById('cmp-layer-after');
  layerA.classList.toggle('is-empty', !urlA);
  layerB.classList.toggle('is-empty', !urlB);
  layerA.style.backgroundImage = urlA ? `url("${urlA}")` : 'none';
  layerB.style.backgroundImage = urlB ? `url("${urlB}")` : 'none';
  layerA.innerHTML = urlA ? '' : '<span>NO PHOTO</span>';
  layerB.innerHTML = urlB ? '' : '<span>NO PHOTO</span>';
  document.getElementById('cmp-label-a').textContent = `W${a.week} · ${cmpAngle.toUpperCase()}`;
  document.getElementById('cmp-label-b').textContent = `W${b.week} · ${cmpAngle.toUpperCase()}`;
  syncCompare();
};
const syncCompare = () => {
  const top = document.getElementById('cmp-layer-after');
  const handle = document.getElementById('cmp-handle');
  const range = document.getElementById('cmp-range');
  if (!top || !handle) return;
  top.style.clipPath = `inset(0 0 0 ${cmpPct}%)`;
  handle.style.left = `${cmpPct}%`;
  if (range && document.activeElement !== range) range.value = cmpPct;
};

const syncEntryPhoto = () => {
  const e = progressCache.find(x => x.id === activeEntryId);
  const img = document.getElementById('pd-img');
  const fig = document.getElementById('pd-photo');
  const cap = document.getElementById('pd-cap');
  const url = e && e._urls ? e._urls[pdAngle] : null;
  fig.classList.toggle('is-empty', !url);
  img.style.display = url ? '' : 'none';
  img.src = url || '';
  img.alt = e ? `Week ${e.week} ${pdAngle} progress photo` : 'Progress photo';
  fig.classList.remove('revealed');
  cap.textContent = url ? 'Tap to reveal' : 'No photo for this angle';
};
const syncEntryPrivacy = () => {
  const e = progressCache.find(x => x.id === activeEntryId);
  if (!e) return;
  document.getElementById('pd-privacy').innerHTML =
    `VISIBILITY: <strong>${PRIVACY_LABELS[e.privacy] || 'PRIVATE'}</strong>`;
};
const openEntry = id => {
  const e = progressCache.find(x => x.id === id);
  if (!e) return;
  activeEntryId = id;
  pdAngle = 'front';
  document.querySelectorAll('#pd-angles button').forEach(b => b.classList.toggle('is-on', b.dataset.pdAngle === 'front'));
  syncEntryPhoto();
  document.getElementById('pd-title').innerHTML = `Week<br /><em>${e.week}.</em>`;
  document.getElementById('pd-meta').textContent =
    `${fmtDate(e.dateISO).toUpperCase()}${e.weight ? ` · ${e.weight} KG` : ''}`;
  document.getElementById('pd-note').textContent = e.note || '';
  document.getElementById('pd-note').hidden = !e.note;
  syncEntryPrivacy();
  document.querySelectorAll('#pg-chips button').forEach(btn => btn.classList.toggle('is-on', btn.dataset.entry === id));
  document.getElementById('progress-dialog').showModal();
};

const openCheckin = (presetWeek, existing) => {
  const user = currentUser();
  if (!user) return;
  const form = document.getElementById('checkin-form');
  form.reset();
  ckFiles = { front: null, side: null, back: null };
  ['front', 'side', 'back'].forEach(k => {
    document.getElementById(`ck-${k}`).value = '';
    const prev = document.getElementById(`ck-${k}-prev`);
    prev.classList.remove('has-img');
    prev.innerHTML = `<b>${k.toUpperCase()}</b><i>${existing && existing.photos && existing.photos[k] ? 'Kept — tap to replace' : 'Tap to upload'}</i>`;
  });
  const weekSel = document.getElementById('ck-week');
  weekSel.innerHTML = Array.from({ length: 16 }, (_, i) => `<option value="${i + 1}">Week ${i + 1}</option>`).join('');
  const logged = new Set(progressCache.map(e => e.week));
  [...weekSel.options].forEach(o => {
    if (logged.has(parseInt(o.value, 10))) o.textContent += ' · logged';
  });
  weekSel.value = (existing && existing.week) || presetWeek || suggestedWeek(user);
  if (existing) weekSel.disabled = true; else weekSel.disabled = false;
  document.getElementById('ck-date').value = existing ? (existing.dateISO || '').slice(0, 10) : dayKey();
  document.getElementById('ck-weight').value = (existing && existing.weight) || (user.profile && user.profile.weight) || '';
  document.getElementById('ck-note').value = (existing && existing.note) || '';
  if (existing) {
    const radio = form.querySelector(`input[name="ck-privacy"][value="${existing.privacy}"]`);
    if (radio) radio.checked = true;
  }
  document.getElementById('checkin-error').hidden = true;
  document.getElementById('checkin-title').innerHTML = existing ? `Update<br /><em>week ${existing.week}.</em>` : `Log your<br /><em>week.</em>`;
  form.dataset.editing = existing ? existing.id : '';
  document.getElementById('checkin-dialog').showModal();
};

/* ---------- transformation events (bound once) ---------- */
(() => {
  const logBtn = document.getElementById('pg-log');
  if (logBtn) logBtn.addEventListener('click', () => openCheckin());

  const wipeBtn = document.getElementById('pg-wipe');
  if (wipeBtn) wipeBtn.addEventListener('click', async () => {
    const user = currentUser();
    if (!user || !progressCache.length) return;
    if (!window.confirm(`Delete all ${progressCache.length} check-ins and photos? This cannot be undone.`)) return;
    try { await ProgressDB.clearUser(user.email); } catch (err) { /* vault unavailable */ }
    cmpA = cmpB = null;
    activeEntryId = null;
    await renderProgress(user).catch(() => {});
  });

  const discreet = document.getElementById('pg-discreet');
  if (discreet) discreet.addEventListener('change', () => {
    const user = currentUser();
    if (!user) return;
    user.discreetMode = discreet.checked;
    saveCurrentUser(user);
    document.body.classList.toggle('pg-discreet', discreet.checked);
  });

  const miles = document.getElementById('pg-milestones');
  if (miles) miles.addEventListener('click', event => {
    const btn = event.target.closest('[data-mile]');
    if (!btn) return;
    const w = parseInt(btn.dataset.mile, 10);
    const e = progressCache.find(x => x.week === w);
    if (e) openEntry(e.id); else openCheckin(w);
  });

  const chips = document.getElementById('pg-chips');
  if (chips) chips.addEventListener('click', event => {
    const btn = event.target.closest('[data-entry]');
    if (btn) openEntry(btn.dataset.entry);
  });

  const selA = document.getElementById('cmp-a');
  const selB = document.getElementById('cmp-b');
  if (selA) selA.addEventListener('change', () => { cmpA = selA.value; renderCompare(); });
  if (selB) selB.addEventListener('change', () => { cmpB = selB.value; renderCompare(); });
  const angles = document.getElementById('cmp-angles');
  if (angles) angles.addEventListener('click', event => {
    const btn = event.target.closest('[data-cmp-angle]');
    if (!btn) return;
    cmpAngle = btn.dataset.cmpAngle;
    angles.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b === btn));
    renderCompare();
  });
  const frame = document.getElementById('cmp-frame');
  if (frame) {
    let dragging = false;
    const setPct = clientX => {
      const rect = frame.getBoundingClientRect();
      cmpPct = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
      syncCompare();
    };
    frame.addEventListener('pointerdown', event => {
      if (document.body.classList.contains('pg-discreet') && !frame.classList.contains('revealed')) {
        frame.classList.add('revealed');
        return;
      }
      dragging = true;
      if (frame.setPointerCapture) { try { frame.setPointerCapture(event.pointerId); } catch (err) { /* noop */ } }
      setPct(event.clientX);
    });
    frame.addEventListener('pointermove', event => { if (dragging) setPct(event.clientX); });
    frame.addEventListener('pointerup', () => { dragging = false; });
    frame.addEventListener('pointercancel', () => { dragging = false; });
  }
  const range = document.getElementById('cmp-range');
  if (range) range.addEventListener('input', () => { cmpPct = parseInt(range.value, 10); syncCompare(); });

  ['front', 'side', 'back'].forEach(k => {
    const input = document.getElementById(`ck-${k}`);
    if (!input) return;
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      const prev = document.getElementById(`ck-${k}-prev`);
      const errorEl = document.getElementById('checkin-error');
      if (!file) return;
      try {
        const blob = await processPhoto(file);
        ckFiles[k] = blob;
        prev.classList.add('has-img');
        prev.innerHTML = `<b>${k.toUpperCase()}</b><img src="${URL.createObjectURL(blob)}" alt="${k} preview" />`;
        errorEl.hidden = true;
      } catch (err) {
        input.value = '';
        errorEl.textContent = 'That file could not be read as a photo — try another.';
        errorEl.hidden = false;
      }
    });
  });

  const checkinForm = document.getElementById('checkin-form');
  if (checkinForm) checkinForm.addEventListener('submit', async event => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const form = event.target;
    const errorEl = document.getElementById('checkin-error');
    const fail = message => { errorEl.textContent = message; errorEl.hidden = !message; };
    const week = parseInt(form.elements['ck-week'].value, 10);
    const dateVal = document.getElementById('ck-date').value || dayKey();
    const weightRaw = parseFloat(document.getElementById('ck-weight').value);
    const note = document.getElementById('ck-note').value.trim().slice(0, 120);
    const picked = form.querySelector('input[name="ck-privacy"]:checked');
    const privacy = picked ? picked.value : 'private';
    const editingId = form.dataset.editing || '';
    const existing = (editingId && progressCache.find(e => e.id === editingId)) || progressCache.find(e => e.week === week) || null;
    const photos = {
      front: ckFiles.front || (existing && existing.photos.front) || null,
      side: ckFiles.side || (existing && existing.photos.side) || null,
      back: ckFiles.back || (existing && existing.photos.back) || null
    };
    if (!photos.front && !photos.side && !photos.back) return fail('Add at least one photo — front, side or back.');
    fail('');
    const submitBtn = form.querySelector('.auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      await ProgressDB.put({
        id: existing ? existing.id : `${user.email}|w${week}`,
        email: user.email, week,
        dateISO: new Date(`${dateVal}T12:00:00`).toISOString(),
        weight: weightRaw > 0 ? Math.round(weightRaw * 10) / 10 : null,
        note, privacy, photos, createdAt: existing ? existing.createdAt : new Date().toISOString()
      });
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save check-in';
      return fail('Could not save — photo vault unavailable in this browser mode.');
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save check-in';
    user.checkinCount = await ProgressDB.all(user.email).then(e => e.length).catch(() => user.checkinCount || 0);
    saveCurrentUser(user);
    document.getElementById('checkin-dialog').close();
    await renderProgress(user).catch(() => {});
    renderChallenges(user);
  });

  const pdAngles = document.getElementById('pd-angles');
  if (pdAngles) pdAngles.addEventListener('click', event => {
    const btn = event.target.closest('[data-pd-angle]');
    if (!btn) return;
    pdAngle = btn.dataset.pdAngle;
    pdAngles.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b === btn));
    syncEntryPhoto();
  });
  const pdPhoto = document.getElementById('pd-photo');
  if (pdPhoto) pdPhoto.addEventListener('click', () => pdPhoto.classList.toggle('revealed'));
  const pdCycle = document.getElementById('pd-cycle');
  if (pdCycle) pdCycle.addEventListener('click', async () => {
    const user = currentUser();
    const e = progressCache.find(x => x.id === activeEntryId);
    if (!user || !e) return;
    const order = ['private', 'coaches', 'public'];
    const clean = { ...e };
    delete clean._urls;
    clean.privacy = order[(order.indexOf(e.privacy) + 1) % order.length];
    try { await ProgressDB.put(clean); } catch (err) { /* vault unavailable */ }
    e.privacy = clean.privacy;
    syncEntryPrivacy();
  });
  const pdCompare = document.getElementById('pd-compare');
  if (pdCompare) pdCompare.addEventListener('click', () => {
    if (!activeEntryId) return;
    cmpB = activeEntryId;
    if (!cmpA || cmpA === cmpB) {
      const others = progressCache.map(e => e.id).filter(id => id !== cmpB);
      cmpA = others[0] || cmpB;
    }
    document.getElementById('progress-dialog').close();
    const selB = document.getElementById('cmp-b');
    const selA = document.getElementById('cmp-a');
    if (selB) selB.value = cmpB;
    if (selA && cmpA) selA.value = cmpA;
    renderCompare();
    document.getElementById('pg-compare').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  const pdDownload = document.getElementById('pd-download');
  if (pdDownload) pdDownload.addEventListener('click', () => {
    const e = progressCache.find(x => x.id === activeEntryId);
    const blob = e && e.photos ? e.photos[pdAngle] : null;
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `onyx-week${e.week}-${pdAngle}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  const pdEdit = document.getElementById('pd-edit');
  if (pdEdit) pdEdit.addEventListener('click', () => {
    const e = progressCache.find(x => x.id === activeEntryId);
    if (!e) return;
    document.getElementById('progress-dialog').close();
    openCheckin(e.week, e);
  });
  const pdDelete = document.getElementById('pd-delete');
  if (pdDelete) pdDelete.addEventListener('click', async () => {
    const user = currentUser();
    if (!user || !activeEntryId) return;
    if (!window.confirm('Delete this check-in and its photos?')) return;
    try { await ProgressDB.del(activeEntryId); } catch (err) { /* vault unavailable */ }
    if (cmpA === activeEntryId) cmpA = null;
    if (cmpB === activeEntryId) cmpB = null;
    activeEntryId = null;
    user.checkinCount = await ProgressDB.all(user.email).then(e => e.length).catch(() => user.checkinCount || 0);
    saveCurrentUser(user);
    document.getElementById('progress-dialog').close();
    await renderProgress(user).catch(() => {});
    renderChallenges(user);
  });
  const progressDialog = document.getElementById('progress-dialog');
  if (progressDialog) progressDialog.addEventListener('click', event => {
    if (event.target === progressDialog) progressDialog.close();
  });
  const checkinDialog = document.getElementById('checkin-dialog');
  if (checkinDialog) checkinDialog.addEventListener('click', event => {
    if (event.target === checkinDialog) checkinDialog.close();
  });
})();

// First paint — runs after every module above is defined.
/* First paint moved to end of file. */

/* ===========================================================================
   ATTENDANCE SYSTEM — member pass (QR + rotating code), 5 check-in methods,
   stats, heatmap, 30-day challenge, badges. Demo storage is local; staff PIN
   and pass codes are demo-grade until the backend replaces them.
   =========================================================================== */
ONYX.GYM_LOCATION = ONYX.GYM_LOCATION || { lat: 30.7410, lng: 76.6510, radiusM: 250 }; // TODO: confirm exact gym coords
ONYX.RECEPTION_PIN = ONYX.RECEPTION_PIN || '2468'; // demo staff PIN — real staff auth needs backend

// QR-ENCODER-START
/* Minimal QR encoder: byte mode, ECC level L, versions 1-2 (auto-select).
   Single data block, capacities 17 / 32 bytes. No dependencies. */
const QR = (() => {
  const ECC = { 1: 7, 2: 10 };
  const TOTAL = { 1: 26, 2: 44 };
  const REM = { 1: 0, 2: 7 };
  const ALIGN = { 1: [], 2: [6, 18] };
  const sizeOf = v => 17 + v * 4;
  const EXP = new Array(512), LOG = new Array(256);
  (() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  const rsGen = deg => {
    let poly = [1];
    for (let i = 0; i < deg; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) { next[j] ^= poly[j]; next[j + 1] ^= gfMul(poly[j], EXP[i]); }
      poly = next;
    }
    return poly;
  };
  const rsRem = (data, gen) => {
    const res = [...data, ...new Array(gen.length - 1).fill(0)];
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (coef !== 0) for (let j = 0; j < gen.length; j++) res[i + j] ^= gfMul(gen[j], coef);
    }
    return res.slice(data.length);
  };
  const bitsOf = (val, len) => { const b = []; for (let i = len - 1; i >= 0; i--) b.push((val >> i) & 1); return b; };
  const MASKS = [
    (r, c) => (r + c) % 2 === 0, (r, c) => r % 2 === 0, (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0, (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r, c) => (((r * c) % 2 + (r * c) % 3) % 2) === 0,
    (r, c) => (((r + c) % 2 + (r * c) % 3) % 2) === 0
  ];
  const pen1D = arr => {
    let s = 0, run = 1;
    for (let i = 1; i <= arr.length; i++) {
      if (i < arr.length && arr[i] === arr[i - 1]) run++;
      else { if (run >= 5) s += 3 + (run - 5); run = 1; }
    }
    const pat = [1, 0, 1, 1, 1, 0, 1];
    for (let i = 0; i + 11 <= arr.length; i++) {
      const w = arr.slice(i, i + 11);
      const a = w.slice(0, 4).every(v => !v) && w.slice(4).every((v, k) => !!v === !!pat[k]);
      const b = w.slice(7).every(v => !v) && w.slice(0, 7).every((v, k) => !!v === !!pat[k]);
      if (a || b) s += 40;
    }
    return s;
  };
  const penalty = (mat, size) => {
    let s = 0;
    for (let i = 0; i < size; i++) { s += pen1D(mat[i]); s += pen1D(mat.map(row => row[i])); }
    for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++)
      if (mat[r][c] === mat[r][c + 1] && mat[r][c] === mat[r + 1][c] && mat[r][c] === mat[r + 1][c + 1]) s += 3;
    let dark = 0;
    mat.forEach(row => row.forEach(v => { if (v) dark++; }));
    s += Math.floor(Math.abs((dark / (size * size)) * 100 - 50) / 5) * 10;
    return s;
  };
  const encode = text => {
    const bytes = [...new TextEncoder().encode(text)];
    if (bytes.length > 32) throw new Error('qr-too-long');
    const version = bytes.length <= 17 ? 1 : 2;
    const size = sizeOf(version);
    const dataLen = TOTAL[version] - ECC[version];
    let bits = [0, 1, 0, 0, ...bitsOf(bytes.length, 8)];
    bytes.forEach(b => bits.push(...bitsOf(b, 8)));
    bits = bits.concat(new Array(Math.min(4, dataLen * 8 - bits.length)).fill(0));
    while (bits.length % 8 !== 0) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let pad = 0xEC; data.length < dataLen; pad ^= 0xEC ^ 0x11) data.push(pad);
    const codewords = data.concat(rsRem(data, rsGen(ECC[version])));
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const func = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (r, c, v) => { modules[r][c] = !!v; func[r][c] = true; };
    const finder = (r, c) => {
      for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        set(rr, cc, (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) || (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
      }
    };
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    ALIGN[version].forEach(r => ALIGN[version].forEach(c => {
      if (Math.min(r, c) < 9 && (r < 9 || c < 9)) return;
      if ((r < 9 && c >= size - 8) || (r >= size - 8 && c < 9)) return;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
        set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }));
    for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    for (let i = 0; i <= 5; i++) { func[8][i] = true; func[i][8] = true; }
    func[8][7] = true; func[8][8] = true; func[7][8] = true;
    for (let i = 0; i < 7; i++) func[size - 1 - i][8] = true;
    for (let i = 7; i < 15; i++) func[8][size - 15 + i] = true;
    func[4 * version + 9][8] = true;
    const allBits = [];
    codewords.forEach(w => allBits.push(...bitsOf(w, 8)));
    let bitIdx = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const c = right - j, r = upward ? size - 1 - vert : vert;
        if (r < 0 || r >= size || func[r][c]) continue;
        if (bitIdx < allBits.length) modules[r][c] = allBits[bitIdx++] === 1;
      }
    }
    let best = null, bestScore = Infinity, bestMask = 0;
    for (let m = 0; m < 8; m++) {
      const trial = modules.map((row, r) => row.map((v, c) => (func[r][c] ? v : (v !== MASKS[m](r, c)))));
      const score = penalty(trial, size);
      if (score < bestScore) { bestScore = score; best = trial; bestMask = m; }
    }
    const data5 = (1 << 3) | bestMask;
    let rem = data5;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    const bits15 = ((data5 << 10) | rem) ^ 0x5412;
    const bit = i => ((bits15 >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) best[8][i] = bit(i);
    best[8][7] = bit(6); best[8][8] = bit(7); best[7][8] = bit(8);
    for (let i = 9; i < 15; i++) best[14 - i][8] = bit(i);
    for (let i = 0; i < 7; i++) best[size - 1 - i][8] = bit(i);
    for (let i = 7; i < 15; i++) best[8][size - 15 + i] = bit(i);
    best[4 * version + 9][8] = true;
    return { version, size, mask: bestMask, modules: best, codewords };
  };
  return { encode, _gf: { EXP, LOG }, _tables: { ECC, TOTAL, REM } };
})();
// QR-ENCODER-END

const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
const slotNow = () => Math.floor(Date.now() / 30000);
const memberPass = user => {
  if (!user.memberId || !user.passSecret) {
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const pick = n => {
      const buf = new Uint32Array(n);
      if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(buf);
      else for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 4294967296);
      return buf;
    };
    let id = '';
    pick(6).forEach(v => { id += abc[v % abc.length]; });
    let secret = '';
    pick(4).forEach(v => { secret += v.toString(16).padStart(8, '0'); });
    user.memberId = 'ONYX-' + id;
    user.passSecret = secret;
    saveCurrentUser(user);
  }
  return user;
};
const passCode = (user, slot) => {
  const s = slot === undefined ? slotNow() : slot;
  return String(cyrb53(`${user.passSecret}|${s}`) % 1000000).padStart(6, '0');
};
const qrPayload = (user, slot) => {
  const s = slot === undefined ? slotNow() : slot;
  return `O1.${user.memberId.slice(5)}.${passCode(user, s)}.${s}`;
};

const METHOD_LABELS = { manual: 'Manual', reception: 'Reception', geo: 'GPS', nfc: 'NFC', qr: 'QR scan', code: 'Pass code', pt: 'PT session' };

const doCheckin = (method, targetUser) => {
  const user = targetUser || currentUser();
  if (!user) return null;
  user.visits = user.visits || [];
  user.checkins = user.checkins || [];
  const now = new Date();
  const last = user.visits[user.visits.length - 1];
  if (last && now - new Date(last.at) < 60000) return { dup: true, visit: last, count: user.visits.length, user };
  const visit = { at: now.toISOString(), method };
  user.visits.push(visit);
  const key = dayKey(now);
  if (!user.checkins.includes(key)) user.checkins.push(key);
  saveCurrentUser(user);
  return { visit, count: user.visits.length, user };
};

const maxStreak = checkins => {
  const days = [...new Set(checkins || [])].sort();
  let best = 0, run = 0, prev = null;
  days.forEach(d => {
    if (prev && (new Date(d) - new Date(prev)) / 86400000 === 1) run++;
    else run = 1;
    prev = d;
    if (run > best) best = run;
  });
  return best;
};

const attendanceStats = user => {
  const visits = user.visits || [];
  const days = new Set((user.checkins || []).map(d => String(d).slice(0, 10)));
  const start = new Date(user.activatedAt || user.createdAt || Date.now());
  start.setHours(0, 0, 0, 0);
  const elapsed = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
  const pct = Math.min(100, Math.round((days.size / elapsed) * 100));
  const monthPrefix = dayKey().slice(0, 7);
  const monthDays = [...days].filter(d => d.startsWith(monthPrefix)).length;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  let challenge = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (days.has(dayKey(d))) challenge++;
  }
  return { total: visits.length, distinct: days.size, pct, elapsed, monthDays, daysInMonth, challenge,
    streak: calcStreak(user.checkins), best: maxStreak(user.checkins) };
};

const computeBadges = (user, stats) => {
  const visits = user.visits || [];
  const early = visits.some(v => new Date(v.at).getHours() < 7);
  const late = visits.some(v => new Date(v.at).getHours() >= 20);
  return [
    { id: 'first', name: 'First session', desc: 'Check in once', earned: stats.total >= 1 },
    { id: 'streak7', name: 'Week warrior', desc: '7-day streak', earned: stats.best >= 7 },
    { id: 'challenge', name: '30-day challenge', desc: '30 visits in 30 days', earned: stats.challenge >= 30 },
    { id: 'fifty', name: 'Half century', desc: '50 total visits', earned: stats.total >= 50 },
    { id: 'hundred', name: 'Century club', desc: '100 total visits', earned: stats.total >= 100 },
    { id: 'early', name: 'Early bird', desc: 'Train before 7 AM', earned: early },
    { id: 'late', name: 'Night owl', desc: 'Train after 8 PM', earned: late },
    { id: 'unstoppable', name: 'Unstoppable', desc: '30-day streak', earned: stats.best >= 30 }
  ];
};

let lastQRSlot = -1;
const drawPassQR = user => {
  const canvas = document.getElementById('pass-qr');
  if (!canvas || !user.memberId) return;
  const ctx = canvas.getContext('2d');
  try {
    const q = QR.encode(qrPayload(user));
    const cell = Math.floor(canvas.width / (q.size + 8));
    const off = Math.floor((canvas.width - q.size * cell) / 2);
    ctx.fillStyle = '#f4f2ec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#071616';
    q.modules.forEach((row, r) => row.forEach((v, c) => {
      if (v) ctx.fillRect(off + c * cell, off + r * cell, cell, cell);
    }));
  } catch (err) {
    ctx.fillStyle = '#0b2422';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a8b1aa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QR unavailable — use', canvas.width / 2, canvas.height / 2 - 8);
    ctx.fillText('your code below', canvas.width / 2, canvas.height / 2 + 10);
  }
};

const tickPassCode = () => {
  const user = currentUser();
  const codeEl = document.getElementById('pass-code');
  if (!user || !user.memberId || !codeEl) return;
  const section = document.getElementById('profile-attendance');
  if (!section || section.hidden) return;
  codeEl.textContent = passCode(user);
  const secs = 30 - Math.floor(Date.now() / 1000) % 30;
  document.getElementById('pass-count').textContent = `${secs}s`;
  document.getElementById('pass-bar').style.width = `${Math.round((secs / 30) * 100)}%`;
  const slot = slotNow();
  if (slot !== lastQRSlot) {
    lastQRSlot = slot;
    document.getElementById('pass-payload').textContent = qrPayload(user);
    drawPassQR(user);
  }
};
setInterval(tickPassCode, 1000);

const attStatus = (msg, isErr) => {
  const el = document.getElementById('att-status');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('is-err', !!isErr);
};
const afterCheckin = (res, method) => {
  const user = currentUser();
  if (!res || !user) return;
  if (res.dup) { attStatus(`Already checked in (${METHOD_LABELS[method] || method}). See you on the floor!`); return; }
  attStatus('');
  renderAttendance(user);
  renderToday(user);
};

const renderAttendance = user => {
  const section = document.getElementById('profile-attendance');
  if (!section || !user) return;
  section.hidden = false;
  memberPass(user);
  document.getElementById('pass-name').textContent = user.name;
  document.getElementById('pass-id').textContent = user.memberId;
  document.getElementById('pass-code').textContent = passCode(user);
  document.getElementById('pass-payload').textContent = qrPayload(user);
  lastQRSlot = slotNow();
  drawPassQR(user);
  tickPassCode();

  const stats = attendanceStats(user);
  document.getElementById('st-pct').textContent = `${stats.pct}%`;
  document.getElementById('st-pct-sub').textContent = `${stats.distinct} OF ${stats.elapsed} DAYS`;
  document.getElementById('st-streak').textContent = stats.streak;
  document.getElementById('st-best').textContent = `BEST ${stats.best}`;
  document.getElementById('st-total').textContent = stats.total;
  document.getElementById('st-total-sub').textContent = `ACROSS ${stats.distinct} DAYS`;
  document.getElementById('st-month').textContent = stats.monthDays;
  document.getElementById('st-month-sub').textContent = `OF ${stats.daysInMonth} DAYS`;

  const success = document.getElementById('att-success');
  const visits = user.visits || [];
  const last = visits[visits.length - 1];
  if (last && dayKey(new Date(last.at)) === dayKey()) {
    success.hidden = false;
    const time = new Date(last.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    document.getElementById('att-s-sub').textContent =
      `${time} · ${METHOD_LABELS[last.method] || last.method}${stats.streak > 1 ? ` · 🔥 ${stats.streak}-day streak` : ''}`;
    document.getElementById('att-s-num').textContent = `SESSION #${visits.length}`;
  } else success.hidden = true;

  const byDay = {};
  visits.forEach(v => {
    const k = dayKey(new Date(v.at));
    byDay[k] = (byDay[k] || 0) + 1;
  });
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  let cells = '';
  for (let w = 11; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setDate(date.getDate() - w * 7 + d);
      if (date > new Date()) { cells += '<i class="heat-spacer"></i>'; continue; }
      const k = dayKey(date);
      const n = byDay[k] || 0;
      const level = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
      cells += `<i data-l="${level}" title="${k}: ${n} visit${n === 1 ? '' : 's'}"></i>`;
    }
  }
  document.getElementById('att-heat').innerHTML =
    '<span class="heat-labels"><span>M</span><span></span><span>W</span><span></span><span>F</span><span></span><span>S</span></span>' + cells;

  const ch = stats.challenge;
  document.getElementById('ch-text').textContent = ch >= 30 ? '🏆 Challenge complete — 30 / 30!' : `${ch} / 30 days completed`;
  document.getElementById('ch-bar').style.width = `${Math.round((ch / 30) * 100)}%`;
  document.getElementById('att-challenge').classList.toggle('is-complete', ch >= 30);
  document.getElementById('ch-miles').innerHTML = [7, 14, 21, 30].map(m =>
    `<span class="${ch >= m ? 'is-on' : ''}">${m}</span>`).join('');

  document.getElementById('att-badges').innerHTML = computeBadges(user, stats).map(b =>
    `<div class="badge${b.earned ? ' is-earned' : ''}"><strong>${b.earned ? '★' : '☆'} ${esc(b.name)}</strong><span>${esc(b.desc)}</span></div>`).join('');
};

const haversineM = (a, b, c, d) => {
  const R = 6371000, t = Math.PI / 180;
  const h = Math.sin((c - a) * t / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin((d - b) * t / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const fmtDist = m => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
const geoCheckin = () => {
  if (!('geolocation' in navigator)) return attStatus('Geolocation is not supported in this browser.', true);
  attStatus('Locating you…');
  navigator.geolocation.getCurrentPosition(pos => {
    const g = ONYX.GYM_LOCATION;
    const d = haversineM(pos.coords.latitude, pos.coords.longitude, g.lat, g.lng);
    if (d <= g.radiusM) afterCheckin(doCheckin('geo'), 'geo');
    else attStatus(`You're ${fmtDist(d)} from ONYX — step within ${g.radiusM} m of the gym to check in.`, true);
  }, err => attStatus(err && err.code === 1
    ? 'Location permission denied — allow it once to use GPS check-in.'
    : 'Could not get your location — try again outside.', true),
  { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
};

const nfcCheckin = async () => {
  if (!('NDEFReader' in window)) {
    attStatus('NFC scanning needs Android Chrome. On iPhone: tap the gym tag to open this page, then use GPS check-in.', true);
    return;
  }
  attStatus('Hold your phone near the ONYX tag… (30s)');
  try {
    const reader = new NDEFReader();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    await reader.scan({ signal: ctrl.signal });
    reader.onreading = event => {
      clearTimeout(timer);
      let text = '';
      try {
        for (const rec of event.message.records) {
          if (rec.recordType === 'url' || rec.recordType === 'text') text += new TextDecoder().decode(rec.data);
        }
      } catch (err) { /* unreadable record */ }
      if (/onyx-checkin|onyxathletic/i.test(text)) afterCheckin(doCheckin('nfc'), 'nfc');
      else attStatus('That is not an ONYX gym tag.', true);
    };
    reader.onreadingerror = () => { clearTimeout(timer); attStatus('Could not read the tag — try again.', true); };
  } catch (err) {
    attStatus('NFC unavailable or permission denied.', true);
  }
};

let recTargetEmail = null;
const staffUnlocked = () => { try { return sessionStorage.getItem('onyx_staff') === '1'; } catch (err) { return false; } };
const findMemberById = id => {
  const norm = String(id || '').trim().toUpperCase();
  if (!norm) return null;
  const users = readUsers();
  return Object.values(users).find(u =>
    (u.memberId && u.memberId.toUpperCase() === norm) ||
    (u.memberId && u.memberId.toUpperCase() === `ONYX-${norm}`) ||
    (u.memberId && u.memberId.toUpperCase().endsWith(norm))) || null;
};
const verifyPassCode = (member, code) => {
  const clean = String(code || '').replace(/\D/g, '');
  if (clean.length !== 6 || !member.passSecret) return false;
  const now = slotNow();
  return [now - 1, now, now + 1].some(s => passCode(member, s) === clean);
};
const recStatus = (msg, isErr) => {
  const el = document.getElementById('rec-status');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('is-err', !!isErr);
};
const refreshRecToday = () => {
  const el = document.getElementById('rec-today');
  if (!el) return;
  const today = dayKey();
  const users = readUsers();
  let n = 0;
  Object.values(users).forEach(u => (u.visits || []).forEach(v => {
    if (dayKey(new Date(v.at)) === today) n++;
  }));
  el.textContent = `${n} CHECK-IN${n === 1 ? '' : 'S'} TODAY · DEMO: THIS BROWSER ONLY`;
};
const syncRecViews = () => {
  const unlocked = staffUnlocked();
  document.getElementById('rec-pin-view').hidden = unlocked;
  document.getElementById('rec-main-view').hidden = !unlocked;
  if (unlocked) refreshRecToday();
};
const renderRecMember = member => {
  const box = document.getElementById('rec-member');
  if (!box) return;
  if (!member) { box.hidden = true; box.innerHTML = ''; return; }
  const visits = (member.visits || []).length;
  box.hidden = false;
  box.innerHTML = `<strong>${esc(member.name)}</strong><span>${esc(member.memberId || '')} · ${esc(member.plan || 'NO PLAN')} · ${visits} VISITS</span>`;
};

/* ---------- attendance events (bound once) ---------- */
(() => {
  const manual = document.getElementById('att-manual');
  if (manual) manual.addEventListener('click', () => afterCheckin(doCheckin('manual'), 'manual'));
  const geo = document.getElementById('att-geo');
  if (geo) geo.addEventListener('click', geoCheckin);
  const nfc = document.getElementById('att-nfc');
  if (nfc) nfc.addEventListener('click', nfcCheckin);
  const recBtn = document.getElementById('att-reception');
  if (recBtn) recBtn.addEventListener('click', () => {
    recTargetEmail = null;
    renderRecMember(null);
    recStatus('');
    syncRecViews();
    document.getElementById('reception-dialog').showModal();
    setTimeout(() => {
      const f = staffUnlocked() ? document.getElementById('rec-id') : document.getElementById('rec-pin');
      if (f) f.focus();
    }, 60);
  });
  const dialog = document.getElementById('reception-dialog');
  if (dialog) dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  const unlock = document.getElementById('rec-unlock');
  if (unlock) unlock.addEventListener('click', () => {
    const pin = document.getElementById('rec-pin').value;
    const err = document.getElementById('rec-pin-error');
    if (pin === ONYX.RECEPTION_PIN) {
      try { sessionStorage.setItem('onyx_staff', '1'); } catch (e) { /* private mode */ }
      err.hidden = true;
      document.getElementById('rec-pin').value = '';
      syncRecViews();
    } else {
      err.textContent = 'Wrong PIN — ask the duty manager.';
      err.hidden = false;
    }
  });
  const find = document.getElementById('rec-find');
  if (find) find.addEventListener('click', () => {
    const member = findMemberById(document.getElementById('rec-id').value);
    recTargetEmail = member ? member.email : null;
    renderRecMember(member);
    recStatus(member ? 'Member found — enter their 6-digit code.' : 'No member with that ID on this device.', !member);
  });
  const verify = document.getElementById('rec-verify');
  if (verify) verify.addEventListener('click', () => {
    const users = readUsers();
    const member = recTargetEmail ? users[recTargetEmail] : null;
    if (!member) return recStatus('Find the member first.', true);
    const code = document.getElementById('rec-code').value;
    if (!verifyPassCode(member, code)) return recStatus('Code invalid or expired — ask for the fresh one.', true);
    const res = doCheckin('reception', member);
    document.getElementById('rec-code').value = '';
    renderRecMember(readUsers()[member.email]);
    refreshRecToday();
    if (res && !res.dup) {
      recStatus(`✓ ${member.name.split(' ')[0]} checked in — session #${res.count}.`);
      const me = currentUser();
      if (me && me.email === member.email) { renderAttendance(me); renderToday(me); }
    } else recStatus('Already checked in within the last minute.', true);
  });
  const pasteGo = document.getElementById('rec-paste-go');
  if (pasteGo) pasteGo.addEventListener('click', () => {
    const raw = document.getElementById('rec-paste').value.trim();
    const m = raw.match(/^O1\.([A-Z0-9]{6})\.(\d{6})\.(\d+)$/i);
    if (!m) return recStatus('That does not look like an ONYX QR payload.', true);
    const member = findMemberById(m[1]);
    if (!member) return recStatus('Member not found on this device.', true);
    const slot = parseInt(m[3], 10);
    if (Math.abs(slotNow() - slot) > 2 || passCode(member, slot) !== m[2])
      return recStatus('QR expired — ask the member to show the fresh code.', true);
    const res = doCheckin('qr', member);
    document.getElementById('rec-paste').value = '';
    renderRecMember(readUsers()[member.email]);
    refreshRecToday();
    if (res && !res.dup) {
      recStatus(`✓ ${member.name.split(' ')[0]} checked in via QR — session #${res.count}.`);
      const me = currentUser();
      if (me && me.email === member.email) { renderAttendance(me); renderToday(me); }
    } else recStatus('Already checked in within the last minute.', true);
  });
  if (document.body.classList.contains('profile-page') && window.location.hash === '#gym-checkin') {
    const section = document.getElementById('profile-attendance');
    if (section) {
      setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        attStatus('ONYX tag detected — tap NFC tap above to finish check-in, or use GPS.');
      }, 600);
    }
  }
})();

// First paint — runs after every module above is defined.
/* First paint moved to end of file. */

/* ===========================================================================
   COACH CORNER (member side) — upcoming sessions + message threads.
   =========================================================================== */
const renderCoachSection = user => {
  const section = document.getElementById('profile-coach');
  if (!section || !user) return;
  const threads = user.threads || {};
  const sessions = (user.sessions || []).filter(s => s.status === 'scheduled')
    .sort((a, b) => String(a.date + a.time).localeCompare(String(b.date + b.time)));
  if (!user.assignedCoach && !Object.keys(threads).length && !sessions.length) { section.hidden = true; return; }
  section.hidden = false;
  const users = readUsers();
  const coachName = email => (users[email] && users[email].name) || email;
  document.getElementById('pc-coach-line').textContent = user.assignedCoach
    ? `YOUR COACH: ${coachName(user.assignedCoach).toUpperCase()}`
    : 'COACH MESSAGES';
  document.getElementById('pc-sessions').innerHTML = sessions.length
    ? sessions.map(s => `<li><span><strong>${esc(fmtDate(`${s.date}T12:00:00`))} · ${esc(s.time)}</strong> — ${esc(s.type || 'Session')}${s.note ? ` · ${esc(s.note)}` : ''}</span></li>`).join('')
    : '<li class="log-empty">No sessions booked yet.</li>';
  const wrap = document.getElementById('pc-threads');
  wrap.innerHTML = Object.keys(threads).length ? Object.entries(threads).map(([coach, msgs]) => {
    const fresh = (msgs || []).filter(m => m.from === 'coach' && m.at > ((user.coachReadAt || {})[coach] || '')).length;
    return `<div class="pc-thread"><h4>${esc(coachName(coach))}${fresh ? ` <em>${fresh} NEW</em>` : ''}</h4>` +
      `<div class="pc-msgs">${(msgs || []).map(m => `<p class="${m.from === 'coach' ? 'from-coach' : 'from-me'}"><span>${esc(m.text)}</span><small>${esc(fmtDate(m.at))}</small></p>`).join('') || '<p class="log-empty">No messages yet.</p>'}</div>` +
      `<form class="pc-reply" data-reply="${esc(coach)}"><input maxlength="500" placeholder="Reply to your coach…" required /><button type="submit">Send</button></form></div>`;
  }).join('') : '<p class="log-empty">No messages yet — your coach will reach out here.</p>';
  user.coachReadAt = user.coachReadAt || {};
  Object.keys(threads).forEach(c => { user.coachReadAt[c] = new Date().toISOString(); });
  saveCurrentUser(user);
};

(() => {
  const threads = document.getElementById('pc-threads');
  if (threads) threads.addEventListener('submit', event => {
    const form = event.target.closest('form[data-reply]');
    if (!form) return;
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const coach = form.dataset.reply;
    const input = form.querySelector('input');
    const text = input.value.trim().slice(0, 500);
    if (!text) return;
    user.threads[coach] = user.threads[coach] || [];
    user.threads[coach].push({ from: 'member', text, at: new Date().toISOString() });
    saveCurrentUser(user);
    renderCoachSection(user);
  });
})();

/* ===========================================================================
   TRAINER DASHBOARD — roster, client files, assign/modify programs, diet,
   sessions, notes, messages, progress review. Same-browser demo: trainers see
   accounts on this device; cross-device needs the backend.
   =========================================================================== */
let activeClientEmail = null;

const getMember = email => { const users = readUsers(); return users[email] || null; };
const saveMember = m => { const users = readUsers(); users[m.email] = m; writeUsers(users); };
const memberStatus = m => {
  if (!m.plan) return m.pendingPayment ? `PENDING · ${String(m.pendingPayment.plan).toUpperCase()}` : 'NO PLAN';
  const left = m.expiresAt ? Math.ceil((new Date(m.expiresAt) - Date.now()) / 86400000) : null;
  return `${String(m.plan).toUpperCase()}${left === null ? '' : left < 0 ? ' · EXPIRED' : ` · ${left}D LEFT`}`;
};
const threadUnreadCoach = (coach, m) => {
  const thread = ((m.threads || {})[coach.email]) || [];
  const since = (coach.memberReadAt || {})[m.email] || '';
  return thread.filter(x => x.from === 'member' && x.at > since).length;
};

const renderCoachGate = user => {
  const box = document.getElementById('coach-gate-body');
  if (!box) return;
  if (!user) {
    box.innerHTML = '<p class="about-hero-desc">Log in with your coach account to open the trainer dashboard.</p><button type="button" class="program-get-started" id="coach-login"><span>Log in</span></button>';
    document.getElementById('coach-login').addEventListener('click', () => openAuth('Log in with your coach account.'));
  } else {
    box.innerHTML = `<p class="about-hero-desc">Signed in as ${esc(user.email)} — this account is not on the coach roster yet. Ask an admin to add it to <strong>COACH_EMAILS</strong> in site config, then reload.</p><a class="program-get-started pf-member-link" href="mailto:vx.monit@gmail.com?subject=${encodeURIComponent(`Coach access request — ${user.email}`)}"><span>Request access</span></a>`;
  }
};

const clientCard = (coach, m, isMine) => {
  const visits = m.visits || [];
  const last = visits.length ? fmtDate(visits[visits.length - 1].at) : 'Never';
  const unread = isMine ? threadUnreadCoach(coach, m) : 0;
  return `<article class="client-card"><div><h3>${esc(m.name)}${unread ? ` <em>${unread} NEW</em>` : ''}</h3>` +
    `<p class="client-sub">${esc(memberStatus(m))}</p>` +
    `<p class="client-meta">STREAK ${calcStreak(m.checkins)} · ${visits.length} VISITS · LAST ${esc(String(last)).toUpperCase()}</p></div>` +
    `<div class="client-actions"><button type="button" data-client="${esc(m.email)}" data-act="open">Open</button>` +
    (isMine ? `<button type="button" data-client="${esc(m.email)}" data-act="release">Release</button>`
      : `<button type="button" data-client="${esc(m.email)}" data-act="claim">Claim</button>`) + '</div></article>';
};

const renderCoachDash = coach => {
  const users = Object.values(readUsers()).filter(u => !isCoach(u));
  const mine = users.filter(u => u.assignedCoach === coach.email);
  const pool = users.filter(u => u.assignedCoach !== coach.email);
  const today = dayKey();
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const weekKey = dayKey(in7);
  let checkinsToday = 0, sessions7 = 0, unread = 0;
  mine.forEach(m => {
    (m.visits || []).forEach(v => { if (dayKey(new Date(v.at)) === today) checkinsToday++; });
    (m.sessions || []).forEach(s => { if (s.status === 'scheduled' && s.date <= weekKey) sessions7++; });
    unread += threadUnreadCoach(coach, m);
  });
  document.getElementById('coach-title').innerHTML = `Namaste,<br /><em>${esc(coach.name.split(' ')[0])}.</em>`;
  document.getElementById('coach-sub').textContent = `${mine.length} CLIENT${mine.length === 1 ? '' : 'S'} · ${coach.email}`;
  document.getElementById('coach-stats').innerHTML = [
    [mine.length, 'CLIENTS'], [sessions7, 'SESSIONS / 7 DAYS'], [checkinsToday, 'CHECK-INS TODAY'], [unread, 'UNREAD MSGS']
  ].map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join('');
  document.getElementById('coach-clients').innerHTML = mine.length ? mine.map(m => clientCard(coach, m, true)).join('')
    : '<p class="log-empty">No clients yet — claim members from the pool below.</p>';
  document.getElementById('coach-pool').innerHTML = pool.length ? pool.map(m => clientCard(coach, m, false)).join('')
    : '<p class="log-empty">No other members on this device yet.</p>';
};

const clientPhotoURLs = new Set();
const revokeClientPhotos = () => { clientPhotoURLs.forEach(u => URL.revokeObjectURL(u)); clientPhotoURLs.clear(); };

const renderClientDetail = (coach, m) => {
  const body = document.getElementById('client-body');
  if (!body || !m) return;
  revokeClientPhotos();
  const stats = attendanceStats(m);
  const visits = m.visits || [];
  const goals = m.goals || [];
  const measures = m.measurements || [];
  const prs = m.prs || [];
  const notes = [...(m.coachNotes || [])].reverse();
  const sessions = [...(m.sessions || [])].sort((a, b) => String(a.date + a.time).localeCompare(String(b.date + b.time)));
  const upcoming = sessions.filter(s => s.status === 'scheduled');
  const past = sessions.filter(s => s.status !== 'scheduled').reverse();
  const thread = ((m.threads || {})[coach.email]) || [];
  const ap = m.activeProgram;
  const diet = m.customDiet;
  const p = m.profile;
  const programs = [...ONYX_PROGRAMS.map(x => ({ tag: 'b', ...x })), ...(coach.customPrograms || []).map(x => ({ tag: 'c', ...x }))];
  const doneDates = Object.keys(m.workoutDone || {}).sort().reverse().slice(0, 12);

  body.innerHTML =
  `<p class="eyebrow">CLIENT FILE · ${esc(m.memberId || 'NO PASS YET')}</p><h2>${esc(m.name)}</h2>` +
  `<p class="client-file-sub">${esc(m.email).toUpperCase()} · ${esc(memberStatus(m))} · STREAK ${stats.streak} · ${stats.total} VISITS · LV ${levelOf(pointsOf(m)).n}</p>` +
  `<div class="cgrid">` +
  `<section class="cblock"><span class="today-tag">ACTIVE PROGRAM</span>` +
    (ap && ap.week
      ? `<h3>${esc(ap.name)}</h3><p class="csub">${ap.week.length} DAYS/WK${ap.source === 'coach' ? ` · ASSIGNED BY ${esc(String(ap.coach || '')).toUpperCase()}` : ap.source === 'library' || ap.source === 'custom' ? ' · FROM LIBRARY' : ' · FROM ASSESSMENT'}</p><ul class="clist">` +
        ap.week.map(d => `<li><span><strong>${esc(d.label)} — ${esc(d.focus)}</strong>${d.items.length} exercises</span></li>`).join('') + `</ul>`
      : '<p class="log-empty">No active program.</p>') +
    `<div class="crow"><button type="button" data-act="modify"${ap && ap.week ? '' : ' disabled'}>Modify exercises</button><button type="button" data-act="build">Build new</button></div>` +
    `<div class="crow"><select id="assign-picker" aria-label="Program to assign">${programs.map(x => `<option value="${x.tag}:${x.id}">${esc(x.name)} · ${x.week.length}d</option>`).join('')}</select><button type="button" data-act="assign">Assign to client</button></div></section>` +
  `<section class="cblock"><span class="today-tag">SESSIONS</span><ul class="clist">` +
    (upcoming.length ? upcoming.map(s => `<li><span><strong>${esc(fmtDate(`${s.date}T12:00:00`))} · ${esc(s.time)}</strong>${esc(s.type || 'Session')}${s.note ? ` — ${esc(s.note)}` : ''}</span><span class="cbtns"><button type="button" data-act="session-done" data-id="${s.id}">Done</button><button type="button" data-act="session-cancel" data-id="${s.id}">Cancel</button></span></li>`).join('') : '<li class="log-empty">Nothing booked.</li>') + `</ul>` +
    `<form data-form="session" class="cform"><input type="date" name="sdate" required /><input type="time" name="stime" required /><input name="stype" maxlength="30" placeholder="Type — PT / Assessment" /><input name="snote" maxlength="80" placeholder="Note (optional)" /><button type="submit">Book session</button></form>` +
    (past.length ? `<p class="csub">PAST: ${past.slice(0, 5).map(s => `${esc(s.date.slice(5))} ${esc(s.status)}`).join(' · ')}</p>` : '') + `</section>` +
  `<section class="cblock"><span class="today-tag">GOALS</span>${clientGoalLine(m)}<ul class="clist">` +
    (goals.length ? goals.map(g => `<li><span><strong>${esc(g.title)}</strong>${esc(String(g.current))} / ${esc(String(g.target))} ${esc(g.unit)}${g.done ? ' · DONE ✓' : ''}</span><span class="cbtns"><button type="button" data-act="goal-del" data-id="${g.id}">×</button></span></li>`).join('') : '<li class="log-empty">No goals set.</li>') + `</ul>` +
    `<form data-form="goal" class="cform"><input name="title" maxlength="50" placeholder="Goal — e.g. 100 kg squat" required /><input name="target" type="number" step="any" min="1" placeholder="Target" required /><input name="unit" maxlength="10" placeholder="Unit" required /><button type="submit">Add goal</button></form></section>` +
  `<section class="cblock"><span class="today-tag">MEASUREMENTS</span>` +
    (measures.length ? `<div class="ctable"><table><tr><th>DATE</th><th>WT</th><th>CHEST</th><th>WAIST</th><th>ARM</th><th>THIGH</th><th></th></tr>` +
      [...measures].reverse().slice(0, 6).map((x, i) => `<tr><td>${esc(String(x.d || '').slice(5))}</td><td>${esc(String(x.weight || '—'))}</td><td>${esc(String(x.chest || '—'))}</td><td>${esc(String(x.waist || '—'))}</td><td>${esc(String(x.arm || '—'))}</td><td>${esc(String(x.thigh || '—'))}</td><td><button type="button" data-act="measure-del" data-id="${measures.length - 1 - i}">×</button></td></tr>`).join('') + `</table></div>` : '<p class="log-empty">No measurements logged.</p>') +
    `<form data-form="measure" class="cform cform-measure"><input name="weight" type="number" step="0.1" min="30" max="250" placeholder="kg *" required /><input name="chest" type="number" step="0.5" placeholder="chest" /><input name="waist" type="number" step="0.5" placeholder="waist" /><input name="arm" type="number" step="0.5" placeholder="arm" /><input name="thigh" type="number" step="0.5" placeholder="thigh" /><button type="submit">Log</button></form></section>` +
  `<section class="cblock"><span class="today-tag">PERSONAL RECORDS</span><ul class="clist">` +
    (prs.length ? [...prs].reverse().map(r => `<li><span><strong>${esc(r.lift)} — ${esc(String(r.weight))}kg</strong>${esc(fmtDate(r.date))}${r.note ? ` · ${esc(r.note)}` : ''}</span><span class="cbtns"><button type="button" data-act="pr-del" data-id="${r.id}">×</button></span></li>`).join('') : '<li class="log-empty">No PRs logged.</li>') + `</ul>` +
    `<form data-form="pr" class="cform"><input name="lift" maxlength="40" placeholder="Lift — e.g. Deadlift" required /><input name="weight" type="number" step="0.5" min="1" placeholder="kg" required /><input name="note" maxlength="60" placeholder="Note (optional)" /><button type="submit">Log PR</button></form></section>` +
  `<section class="cblock"><span class="today-tag">DIET PLAN</span>` +
    clientDietHTML(m) +
    `<div class="crow"><button type="button" data-act="diet">Write diet plan</button></div></section>` +
  `<section class="cblock"><span class="today-tag">COACH NOTES</span><ul class="clist">` +
    (notes.length ? notes.map(n => `<li><span><strong>${esc(fmtDate(n.at))} · ${n.shared ? 'SHARED' : 'PRIVATE'}</strong>${esc(n.text)}</span><span class="cbtns"><button type="button" data-act="note-share" data-id="${n.id}">${n.shared ? 'Unshare' : 'Share'}</button><button type="button" data-act="note-del" data-id="${n.id}">×</button></span></li>`).join('') : '<li class="log-empty">No notes yet.</li>') + `</ul>` +
    `<form data-form="note" class="cform"><input name="text" maxlength="280" placeholder="Note about this client…" required /><label class="ccheck"><input type="checkbox" name="shared" /> Share with member</label><button type="submit">Add note</button></form></section>` +
  `<section class="cblock"><span class="today-tag">MESSAGES</span><div class="pc-msgs cmsgs">` +
    (thread.length ? thread.map(x => `<p class="${x.from === 'coach' ? 'from-me' : 'from-coach'}"><span>${esc(x.text)}</span><small>${esc(fmtDate(x.at))}</small></p>`).join('') : '<p class="log-empty">No messages yet.</p>') + `</div>` +
    `<form data-form="msg" class="cform"><input name="text" maxlength="500" placeholder="Message this member…" required /><button type="submit">Send</button></form></section>` +
  `<section class="cblock"><span class="today-tag">ATTENDANCE</span><p class="csub">${stats.pct}% · STREAK ${stats.streak} (BEST ${stats.best}) · ${stats.total} VISITS · ${stats.monthDays} THIS MONTH</p><ul class="clist">` +
    (visits.length ? [...visits].reverse().slice(0, 6).map(v => `<li><span><strong>${esc(fmtDate(v.at))}</strong>${esc((METHOD_LABELS[v.method] || v.method).toUpperCase())}</span></li>`).join('') : '<li class="log-empty">No visits yet.</li>') + `</ul></section>` +
  `<section class="cblock"><span class="today-tag">WORKOUT HISTORY</span>` +
    (doneDates.length ? `<div class="chips">${doneDates.map(d => `<span>${esc(d.slice(5))} ✓</span>`).join('')}</div>` : '<p class="log-empty">No completed workouts logged.</p>') +
    `<p class="csub">MEMBERSHIP: ${esc(memberStatus(m))}${p ? ` · GOAL ${(GOAL_LABELS[p.goal] || '').toUpperCase()} · ${p.weight} → ${p.target} KG` : ''}</p></section>` +
  `<section class="cblock cwide"><span class="today-tag">PROGRESS PHOTOS</span><div class="cphotos" id="client-photos"><p class="log-empty">Loading vault…</p></div></section>` +
  `</div>`;
  loadClientPhotos(m);
};

const loadClientPhotos = async m => {
  const box = document.getElementById('client-photos');
  if (!box) return;
  let entries = [];
  try { entries = await ProgressDB.all(m.email); }
  catch (err) { box.innerHTML = '<p class="log-empty">Vault unavailable.</p>'; return; }
  entries.sort((a, b) => a.week - b.week);
  if (!entries.length) { box.innerHTML = '<p class="log-empty">No check-ins yet.</p>'; return; }
  box.innerHTML = entries.map(e => {
    const locked = e.privacy === 'private';
    const blob = !locked && e.photos ? (e.photos.front || e.photos.side || e.photos.back) : null;
    let url = null;
    if (blob) { url = URL.createObjectURL(blob); clientPhotoURLs.add(url); }
    return `<div class="cphoto${locked ? ' is-locked' : ''}">${url ? `<img src="${url}" alt="Week ${e.week}" loading="lazy" />` : `<span>${locked ? '🔒 PRIVATE' : 'NO PHOTO'}</span>`}<strong>W${e.week}</strong><small>${esc(fmtDate(e.dateISO))}${e.weight ? ` · ${e.weight}KG` : ''} · ${(PRIVACY_LABELS[e.privacy] || '')}</small>${locked ? `<button type="button" data-act="reqphoto" data-id="${e.week}">Request access</button>` : ''}</div>`;
  }).join('');
};

const refreshClientDetail = () => {
  const coach = currentUser();
  const m = activeClientEmail ? getMember(activeClientEmail) : null;
  if (!coach || !m) return;
  const y = window.scrollY;
  renderClientDetail(coach, m);
  window.scrollTo(0, y);
};

const renderCoach = () => {
  if (!document.body.classList.contains('coach-page')) return;
  const gate = document.getElementById('coach-gate');
  const dash = document.getElementById('coach-dash');
  const roster = document.getElementById('coach-roster');
  const detail = document.getElementById('coach-client');
  const user = currentUser();
  if (!user || !isCoach(user)) {
    gate.hidden = false; dash.hidden = true; roster.hidden = true; detail.hidden = true;
    renderCoachGate(user);
    return;
  }
  gate.hidden = true;
  if (activeClientEmail && getMember(activeClientEmail)) {
    dash.hidden = true; roster.hidden = true; detail.hidden = false;
    renderClientDetail(user, getMember(activeClientEmail));
  } else {
    activeClientEmail = null;
    dash.hidden = false; roster.hidden = false; detail.hidden = true;
    renderCoachDash(user);
  }
};
const refreshCoach = () => renderCoach();

const openModify = () => {
  const m = activeClientEmail ? getMember(activeClientEmail) : null;
  if (!m || !m.activeProgram || !m.activeProgram.week) return;
  document.getElementById('mod-sub').textContent = `${m.name.toUpperCase()} · ${m.activeProgram.name.toUpperCase()} — EDITS GO LIVE ON THEIR DASHBOARD INSTANTLY.`;
  document.getElementById('mod-days').innerHTML = m.activeProgram.week.map((d, i) =>
    `<div class="builder-day" data-day="${i}"><span class="field-label">DAY ${i + 1} FOCUS</span>` +
    `<input name="focus-${i}" maxlength="40" value="${esc(d.focus)}" />` +
    `<div class="ex-list" id="mod-list-${i}">` +
    d.items.map(item => `<div class="mod-row"><input maxlength="120" value="${esc(item)}" aria-label="Exercise" /><button type="button" data-mod-del aria-label="Remove">×</button></div>`).join('') +
    `</div><button type="button" class="builder-add" data-mod-add="${i}">+ Add exercise</button></div>`
  ).join('');
  document.getElementById('modify-error').hidden = true;
  document.getElementById('modify-dialog').showModal();
};

const openDiet = () => {
  const m = activeClientEmail ? getMember(activeClientEmail) : null;
  if (!m) return;
  const cur = m.customDiet;
  const p = m.profile;
  document.getElementById('diet-sub').textContent = `${m.name.toUpperCase()} — PUBLISHING REPLACES THEIR CURRENT DIET PLAN.`;
  document.getElementById('diet-cal').value = (cur && cur.calories) || (p && p.calories) || '';
  document.getElementById('diet-pro').value = (cur && cur.protein) || (p && p.protein) || '';
  document.getElementById('diet-carb').value = (cur && cur.carbs) || '';
  document.getElementById('diet-fat').value = (cur && cur.fat) || '';
  const meals = (cur && cur.meals) || (p && p.meals) || [];
  document.querySelectorAll('#diet-dialog .diet-meal').forEach((block, i) => {
    const meal = normMeal(meals[i] || [MEAL_SLOTS[i] || `Meal ${i + 1}`, ''], i);
    const box = block.querySelector('textarea');
    const time = block.querySelector('.diet-time');
    if (box) box.value = meal.x || '';
    if (time) time.value = meal.time || defaultMealTime(i);
    ['kcal', 'p', 'c', 'f'].forEach(k => {
      const inp = block.querySelector(`[data-mk="${k}"]`);
      if (inp) inp.value = meal[k] > 0 ? meal[k] : '';
    });
  });
  document.getElementById('diet-find').value = '';
  document.getElementById('diet-find-results').innerHTML = '';
  document.getElementById('diet-error').hidden = true;
  document.getElementById('diet-dialog').showModal();
};

/* ---------- trainer events (bound once) ---------- */
(() => {
  const logout = document.getElementById('coach-logout');
  if (logout) logout.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    activeClientEmail = null;
    updateAuthLinks();
    renderCoach();
  });

  const roster = document.getElementById('coach-roster');
  if (roster) roster.addEventListener('click', event => {
    const btn = event.target.closest('[data-client]');
    if (!btn) return;
    const coach = currentUser();
    const m = getMember(btn.dataset.client);
    if (!coach || !m) return;
    if (btn.dataset.act === 'claim') {
      m.assignedCoach = coach.email;
      m.assignedAt = new Date().toISOString();
      saveMember(m);
      renderCoach();
    }
    if (btn.dataset.act === 'release') {
      m.assignedCoach = null;
      saveMember(m);
      renderCoach();
    }
    if (btn.dataset.act === 'open') {
      activeClientEmail = m.email;
      coach.memberReadAt = coach.memberReadAt || {};
      coach.memberReadAt[m.email] = new Date().toISOString();
      saveCurrentUser(coach);
      renderCoach();
      window.scrollTo(0, 0);
    }
  });

  const detail = document.getElementById('coach-client');
  if (detail) {
    detail.addEventListener('click', event => {
      const btn = event.target.closest('[data-act]');
      if (!btn || btn.disabled) return;
      const coach = currentUser();
      const m = activeClientEmail ? getMember(activeClientEmail) : null;
      const act = btn.dataset.act;
      if (act === 'back') { activeClientEmail = null; renderCoach(); window.scrollTo(0, 0); return; }
      if (!coach || !m) return;
      if (act === 'build') {
        builderGoal = '';
        document.querySelectorAll('#builder-chips button').forEach(b => b.classList.remove('is-on'));
        document.getElementById('builder-error').hidden = true;
        document.getElementById('builder-form').reset();
        renderBuilderDays(4);
        document.getElementById('builder-dialog').showModal();
      }
      if (act === 'assign') {
        const picker = document.getElementById('assign-picker');
        const [tag, id] = (picker.value || '').split(':');
        const src = tag === 'b'
          ? ONYX_PROGRAMS.find(x => x.id === id)
          : (coach.customPrograms || []).find(x => x.id === id);
        if (!src) return;
        const assigned = { id: `a${Date.now().toString(36)}`, name: src.name, source: 'coach', coach: coach.name, assignedAt: new Date().toISOString(), week: JSON.parse(JSON.stringify(src.week)) };
        m.activeProgram = assigned;
        m.coachPrograms = m.coachPrograms || [];
        m.coachPrograms.push(assigned);
        (m.threads = m.threads || {})[coach.email] = m.threads[coach.email] || [];
        m.threads[coach.email].push({ from: 'coach', text: `New program assigned: ${src.name} (${src.week.length} days/week). It is live on your dashboard now.`, at: new Date().toISOString() });
        saveMember(m);
        refreshClientDetail();
      }
      if (act === 'modify') openModify();
      if (act === 'diet') openDiet();
      if (act === 'session-done' || act === 'session-cancel') {
        const s = (m.sessions || []).find(x => x.id === btn.dataset.id);
        if (!s) return;
        s.status = act === 'session-done' ? 'done' : 'cancelled';
        if (act === 'session-done' && s.date === dayKey()) doCheckin('pt', m);
        saveMember(m);
        refreshClientDetail();
      }
      if (act === 'note-del') { m.coachNotes = (m.coachNotes || []).filter(n => n.id !== btn.dataset.id); saveMember(m); refreshClientDetail(); }
      if (act === 'note-share') {
        const n = (m.coachNotes || []).find(x => x.id === btn.dataset.id);
        if (n) { n.shared = !n.shared; saveMember(m); refreshClientDetail(); }
      }
      if (act === 'goal-del') { m.goals = (m.goals || []).filter(g => g.id !== btn.dataset.id); saveMember(m); refreshClientDetail(); }
      if (act === 'measure-del') {
        const idx = parseInt(btn.dataset.id, 10);
        m.measurements = m.measurements || [];
        if (!Number.isNaN(idx) && m.measurements[idx]) m.measurements.splice(idx, 1);
        saveMember(m);
        refreshClientDetail();
      }
      if (act === 'pr-del') { m.prs = (m.prs || []).filter(r => r.id !== btn.dataset.id); saveMember(m); refreshClientDetail(); }
      if (act === 'reqphoto') {
        (m.threads = m.threads || {})[coach.email] = m.threads[coach.email] || [];
        m.threads[coach.email].push({ from: 'coach', text: `Could you share your Week ${btn.dataset.id} photos with coaches? Open the check-in and change visibility from Private to Coaches.`, at: new Date().toISOString() });
        saveMember(m);
        refreshClientDetail();
      }
    });

    detail.addEventListener('submit', event => {
      const form = event.target.closest('form[data-form]');
      if (!form) return;
      event.preventDefault();
      const coach = currentUser();
      const m = activeClientEmail ? getMember(activeClientEmail) : null;
      if (!coach || !m) return;
      const kind = form.dataset.form;
      const val = name => (form.elements[name] ? form.elements[name].value.trim() : '');
      if (kind === 'goal') {
        const target = parseFloat(val('target'));
        if (!val('title') || !(target > 0)) return;
        m.goals = m.goals || [];
        m.goals.push({ id: `g${Date.now().toString(36)}`, title: val('title').slice(0, 50), target, unit: val('unit').slice(0, 10) || 'units', current: 0, done: false });
      }
      if (kind === 'measure') {
        const weight = parseFloat(val('weight'));
        if (!(weight > 0)) return;
        const num = name => { const v = parseFloat(val(name)); return v > 0 ? v : null; };
        m.measurements = m.measurements || [];
        m.measurements.push({ d: dayKey(), weight, chest: num('chest'), waist: num('waist'), arm: num('arm'), thigh: num('thigh') });
      }
      if (kind === 'pr') {
        const weight = parseFloat(val('weight'));
        if (!val('lift') || !(weight > 0)) return;
        m.prs = m.prs || [];
        m.prs.push({ id: `r${Date.now().toString(36)}`, lift: val('lift').slice(0, 40), weight, note: val('note').slice(0, 60), date: new Date().toISOString() });
      }
      if (kind === 'note') {
        if (!val('text')) return;
        m.coachNotes = m.coachNotes || [];
        m.coachNotes.push({ id: `n${Date.now().toString(36)}`, text: val('text').slice(0, 280), shared: !!(form.elements.shared && form.elements.shared.checked), by: coach.name, at: new Date().toISOString() });
      }
      if (kind === 'session') {
        if (!val('sdate') || !val('stime')) return;
        m.sessions = m.sessions || [];
        m.sessions.push({ id: `s${Date.now().toString(36)}`, date: val('sdate'), time: val('stime'), type: val('stype').slice(0, 30) || 'Session', note: val('snote').slice(0, 80), status: 'scheduled' });
      }
      if (kind === 'msg') {
        if (!val('text')) return;
        (m.threads = m.threads || {})[coach.email] = m.threads[coach.email] || [];
        m.threads[coach.email].push({ from: 'coach', text: val('text').slice(0, 500), at: new Date().toISOString() });
      }
      saveMember(m);
      refreshClientDetail();
    });
  }

  const modDialog = document.getElementById('modify-dialog');
  if (modDialog) {
    modDialog.addEventListener('click', event => {
      if (event.target === modDialog) { modDialog.close(); return; }
      const add = event.target.closest('[data-mod-add]');
      if (add) {
        const list = document.getElementById(`mod-list-${add.dataset.modAdd}`);
        if (!list) return;
        const row = document.createElement('div');
        row.className = 'mod-row';
        row.innerHTML = '<input maxlength="120" placeholder="Exercise — sets × reps" aria-label="Exercise" /><button type="button" data-mod-del aria-label="Remove">×</button>';
        list.appendChild(row);
        row.querySelector('input').focus();
        return;
      }
      const del = event.target.closest('[data-mod-del]');
      if (del) { const row = del.closest('.mod-row'); if (row) row.remove(); }
    });
    document.getElementById('modify-form').addEventListener('submit', event => {
      event.preventDefault();
      const m = activeClientEmail ? getMember(activeClientEmail) : null;
      if (!m || !m.activeProgram) return;
      const errorEl = document.getElementById('modify-error');
      const fail = message => { errorEl.textContent = message; errorEl.hidden = !message; };
      const week = m.activeProgram.week.map((d, i) => {
        const focusInput = modDialog.querySelector(`input[name="focus-${i}"]`);
        const focus = focusInput ? focusInput.value.trim().slice(0, 40) : d.focus;
        const items = [...modDialog.querySelectorAll(`#mod-list-${i} .mod-row input`)].map(x => x.value.trim()).filter(Boolean);
        return { label: d.label, focus: focus || d.focus, items };
      });
      if (week.some(d => !d.items.length)) return fail('Every day needs at least one exercise.');
      fail('');
      m.activeProgram.week = week;
      m.activeProgram.modifiedAt = new Date().toISOString();
      saveMember(m);
      modDialog.close();
      refreshClientDetail();
    });
  }

  const dietDialog = document.getElementById('diet-dialog');
  if (dietDialog) {
    dietDialog.addEventListener('click', event => { if (event.target === dietDialog) dietDialog.close(); });
    document.getElementById('diet-form').addEventListener('submit', event => {
      event.preventDefault();
      const coach = currentUser();
      const m = activeClientEmail ? getMember(activeClientEmail) : null;
      if (!coach || !m) return;
      const errorEl = document.getElementById('diet-error');
      const fail = message => { errorEl.textContent = message; errorEl.hidden = !message; };
      const meals = [...document.querySelectorAll('#diet-dialog .diet-meal')].map((block, i) => {
        const box = block.querySelector('textarea');
        const time = block.querySelector('.diet-time');
        const num = k => { const inp = block.querySelector(`[data-mk="${k}"]`); const v = inp ? parseFloat(inp.value) : 0; return v > 0 ? +v.toFixed(1) : 0; };
        return { t: MEAL_SLOTS[i] || `Meal ${i + 1}`, time: time ? time.value : '', x: box ? box.value.trim().slice(0, 300) : '', kcal: Math.round(num('kcal')), p: num('p'), c: num('c'), f: num('f') };
      });
      if (meals.some(m => !m.x)) return fail('Fill all four meals \u2014 even a short line each.');
      const calories = parseInt(document.getElementById('diet-cal').value, 10);
      const protein = parseInt(document.getElementById('diet-pro').value, 10);
      const carbs = parseInt(document.getElementById('diet-carb').value, 10);
      const fat = parseInt(document.getElementById('diet-fat').value, 10);
      if (!(calories >= 1200 && calories <= 5000)) return fail('Calories must be between 1200 and 5000.');
      if (!(protein >= 20 && protein <= 400)) return fail('Protein must be between 20 and 400 g.');
      if (!(carbs >= 50 && carbs <= 700)) return fail('Carbs must be between 50 and 700 g.');
      if (!(fat >= 20 && fat <= 250)) return fail('Fat must be between 20 and 250 g.');
      fail('');
      m.customDiet = { meals, calories, protein, carbs, fat, by: coach.name, at: new Date().toISOString() };
      saveMember(m);
      dietDialog.close();
      refreshClientDetail();
    });
  }
})();

/* ===========================================================================
   NUTRITION SYSTEM — embedded food database, daily tracker, trainer diet plans.
   FOOD_DB rows: [name, kcal, protein, carbs, fat per 100g, serving label, serving g]
   Values are standard per-100g reference values (cooked weights where noted).
   =========================================================================== */
const FOOD_DB = [
// Staples & grains
["Roti / Chapati (whole wheat)",265,9,49,3.7,"1 roti",40],["Cooked white rice",130,2.7,28,0.3,"1 katori",150],
["Cooked brown rice",123,2.7,25.6,1,"1 katori",150],["Whole wheat bread",247,13,41,3.4,"2 slices",60],
["White bread",265,9,49,3.2,"2 slices",60],["Oats (dry)",389,16.9,66,6.9,"1 bowl",40],
["Poha (cooked)",130,2.5,27,0.8,"1 plate",180],["Upma (cooked)",132,3.5,24,2.2,"1 plate",180],
["Idli",145,4,30,0.5,"2 pc",80],["Plain dosa",170,4.5,32,3,"1 pc",80],
["Masala dosa",165,4.5,28,4,"1 pc",150],["Paratha (with ghee)",290,7,42,10,"1 pc",60],
["Naan",310,9,56,5,"1 pc",90],["Quinoa (cooked)",120,4.4,21,1.9,"1 katori",150],
["Dalia (cooked)",120,4,25,0.6,"1 bowl",180],["Cornflakes",357,7.5,84,0.4,"1 bowl",30],
["Muesli",380,10,65,12,"1 bowl",40],["Pasta (cooked)",131,5,25,1.1,"1 plate",200],
["Noodles (cooked)",138,4.5,25,2.1,"1 plate",200],["Besan / Gram flour",387,22,58,6.7,"4 tbsp",30],
["Suji / Rava",360,10,73,1,"4 tbsp",30],["Bajra flour",361,11.6,67.5,5,"4 tbsp",30],
["Jowar flour",349,10.4,72.6,1.9,"4 tbsp",30],
// Protein
["Chicken breast (cooked)",165,31,0,3.6,"1 palm",150],["Chicken thigh (cooked)",209,26,0,11,"2 pc",120],
["Chicken curry (homemade)",145,15,4,7,"1 katori",150],["Egg (boiled)",155,13,1.1,11,"1 egg",50],
["Egg white",52,11,0.7,0.2,"1 white",33],["Paneer",265,18,6,20,"4 cubes",60],
["Tofu",76,8,1.9,4.8,"1 slab",100],["Rohu fish (cooked)",135,20,0,5,"2 pc",120],
["Salmon (cooked)",206,22,0,12,"1 fillet",120],["Tuna (canned, in water)",108,25,0,1,"1 can",100],
["Prawns (cooked)",99,24,0.2,0.3,"1 katori",100],["Mutton (cooked, lean)",250,26,0,16,"4 pc",100],
["Whey protein",400,80,8,6,"1 scoop",30],["Soya chunks (dry)",345,52,33,0.5,"1 handful",40],
["Soya milk",54,3.3,6,1.6,"1 glass",200],["Toor dal (cooked)",116,7,19,0.6,"1 katori",150],
["Moong dal (cooked)",105,7,18,0.4,"1 katori",150],["Masoor dal (cooked)",116,9,20,0.4,"1 katori",150],
["Chana / Chickpeas (cooked)",164,9,27.4,2.6,"1 katori",150],["Rajma (cooked)",132,8.9,23.7,0.5,"1 katori",150],
["Chole (curry)",150,8,20,4,"1 katori",150],["Kala chana (cooked)",150,9,25,2,"1 katori",120],
["Sprouts (moong)",30,3,5.7,0.2,"1 bowl",100],["Peanuts",567,26,16,49,"1 handful",30],
["Almonds",579,21,22,50,"8-10 pc",15],["Cashews",553,18,30,44,"8 pc",15],
["Walnuts",654,15,14,65,"4 halves",15],["Peanut butter",588,25,20,50,"1 tbsp",16],
["Makhana (roasted)",347,9.7,77,0.1,"1 bowl",20],
// Dairy & fats
["Toned milk",55,3.2,4.8,3,"1 glass",200],["Full-cream milk",67,3.2,4.8,4,"1 glass",200],
["Curd (plain)",63,3.5,4.7,3.3,"1 katori",150],["Greek yogurt",97,9,3.6,5,"1 katori",150],
["Chaas / Buttermilk",30,1.5,3,1,"1 glass",200],["Cheese slice",402,23,1.3,33,"1 slice",20],
["Ghee",876,0.3,0,99.5,"1 tsp",5],["Butter",717,0.9,0.1,81,"1 tsp",5],
["Mustard oil",884,0,0,100,"1 tsp",5],
// Vegetables
["Potato (boiled)",87,1.9,20,0.1,"1 med",150],["Sweet potato (boiled)",86,1.6,20,0.1,"1 med",150],
["Onion",40,1.1,9.3,0.1,"1 med",100],["Tomato",18,0.9,3.9,0.2,"1 med",100],
["Palak / Spinach",23,2.9,3.6,0.4,"1 bunch",100],["Cauliflower",25,1.9,5,0.3,"1 katori",100],
["Cabbage",25,1.3,5.8,0.1,"1 katori",100],["Broccoli",34,2.8,6.6,0.4,"1 katori",100],
["Carrot",41,0.9,9.6,0.2,"1 med",60],["Green beans",31,1.8,7,0.2,"1 katori",100],
["Green peas",81,5.4,14.5,0.4,"1 katori",100],["Bhindi / Okra",33,1.9,7.5,0.2,"1 katori",100],
["Lauki / Bottle gourd",14,0.6,3.4,0,"1 katori",150],["Baingan",25,1,5.9,0.2,"1 katori",150],
["Shimla mirch",31,1,6,0.3,"1 med",100],["Mix veg sabzi",70,2.5,9,3,"1 katori",150],
["Dal tadka",120,7,15,4,"1 katori",150],["Sambar",60,3,9,1.5,"1 katori",150],
// Fruits
["Banana",89,1.1,22.8,0.3,"1 med",120],["Apple",52,0.3,13.8,0.2,"1 med",180],
["Orange",47,0.9,11.8,0.1,"1 med",130],["Mango",60,0.8,15,0.4,"1 cup",150],
["Papaya",43,0.5,11,0.3,"1 cup",150],["Watermelon",30,0.6,7.6,0.2,"1 wedge",200],
["Grapes",69,0.7,18,0.2,"15 pc",100],["Pomegranate",83,1.7,18.7,1.2,"1 katori",100],
["Pineapple",50,0.5,13,0.1,"1 cup",150],["Guava",68,2.6,14,1,"1 med",100],
["Dates",282,2.5,75,0.4,"2 pc",16],["Raisins",299,3.1,79,0.5,"1 tbsp",20],
["Coconut water",19,0.7,3.7,0.2,"1 glass",200],
// Snacks & eating out
["Samosa",262,6,32,13,"1 pc",100],["Veg pakora",290,7,28,17,"5 pc",100],
["Dhokla",160,6,28,3,"2 pc",100],["Vada pav",220,5.5,30,9,"1 pc",140],
["Pav bhaji (with 2 pav)",150,4,20,6,"1 plate",300],["Chole bhature",190,6,28,6,"1 plate",350],
["Veg biryani",150,4,28,3,"1 plate",250],["Chicken biryani",165,9,22,5,"1 plate",250],
["Veg fried rice",150,4,27,3,"1 plate",200],["Hakka noodles",140,4,25,3,"1 plate",200],
["Veg momos (steamed)",150,5,28,2,"5 pc",120],["Spring rolls",200,5,24,10,"2 pc",100],
["Pizza slice (veg)",240,10,30,9,"1 slice",100],["Veg burger",230,7,30,9,"1 pc",150],
["French fries",319,3.4,37,17,"1 med",100],["Mixture namkeen",500,12,45,30,"1 handful",30],
["Popcorn (air-popped)",387,13,78,4.5,"1 bowl",20],["Dark chocolate",598,7.8,46,43,"2 squares",20],
["Milk chocolate",535,8,59,30,"2 squares",20],["Vanilla ice cream",207,3.5,23.6,11,"1 scoop",60],
["Gulab jamun",300,5,45,12,"2 pc",60],["Jalebi",380,3,75,8,"2 pc",40],
["Rasgulla",140,6,25,2,"2 pc",80],["Motichoor ladoo",450,6,60,20,"1 pc",30],
// Beverages
["Chai (milk + sugar)",40,1.5,6,1,"1 cup",150],["Filter coffee (milk + sugar)",45,1.8,6.5,1.2,"1 cup",150],
["Black coffee",2,0.3,0,0,"1 cup",150],["Green tea",1,0,0,0,"1 cup",150],
["Sweet lassi",110,3.5,16,4,"1 glass",200],["Fresh lime soda (sweet)",45,0,11,0,"1 glass",250],
["Orange juice",45,0.7,10.4,0.2,"1 glass",200],["Cola",42,0,10.6,0,"1 glass",250],
["Badam milk",90,3,12,3.5,"1 glass",200],["Cold coffee",80,2.5,13,2,"1 glass",250]
];
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
const foodByName = name => FOOD_DB.find(f => f[0] === name);
const searchFoods = q => {
  const needle = String(q || '').trim().toLowerCase();
  if (needle.length < 2) return [];
  const starts = [], hits = [];
  FOOD_DB.forEach(f => {
    const name = f[0].toLowerCase();
    if (name.startsWith(needle)) starts.push(f);
    else if (name.includes(needle)) hits.push(f);
  });
  return [...starts, ...hits].slice(0, 8);
};
const scaleFood = (food, grams) => {
  const k = Math.max(0, grams) / 100;
  return { kcal: Math.round(food[1] * k), p: +(food[2] * k).toFixed(1), c: +(food[3] * k).toFixed(1), f: +(food[4] * k).toFixed(1) };
};
const fmtNum = n => Number(n || 0).toLocaleString('en-US');
const fmtClock = hhmm => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};
const defaultMealTime = i => ['08:00', '13:00', '17:00', '20:00'][i] || '';
const mealForHour = (h = new Date().getHours()) => h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 19 ? 'Snack' : 'Dinner';

/* Diet targets: trainer plan wins, else assessment template, else sensible default. */
const getDietTargets = user => {
  const d = user.customDiet;
  if (d && d.calories) return { kcal: d.calories, p: d.protein || 0, c: d.carbs || 0, f: d.fat || 0 };
  const p = user.profile;
  if (p && p.calories) return { kcal: p.calories, p: p.protein || 0, c: Math.round(p.calories * 0.45 / 4), f: Math.round(p.calories * 0.25 / 9) };
  return { kcal: 2400, p: 150, c: 270, f: 65 };
};
/* Normalize legacy [title, text] pairs and new meal objects into one shape. */
const normMeal = (m, i) => Array.isArray(m)
  ? { t: m[0] || MEAL_SLOTS[i] || `Meal ${i + 1}`, time: '', x: m[1] || '', kcal: 0, p: 0, c: 0, f: 0 }
  : { t: (m && m.t) || MEAL_SLOTS[i] || `Meal ${i + 1}`, time: (m && m.time) || '', x: (m && m.x) || '', kcal: +(m && m.kcal) || 0, p: +(m && m.p) || 0, c: +(m && m.c) || 0, f: +(m && m.f) || 0 };
const dayIntake = user => {
  const log = ((user.foodLog || {})[dayKey()] || []);
  return log.reduce((a, e) => ({ kcal: a.kcal + (+e.kcal || 0), p: a.p + (+e.p || 0), c: a.c + (+e.c || 0), f: a.f + (+e.f || 0), count: a.count + 1 }),
    { kcal: 0, p: 0, c: 0, f: 0, count: 0 });
};

/* ---------- member diet section: plan + tracker + log ---------- */
const renderDietSection = user => {
  const tg = getDietTargets(user);
  document.getElementById('pf-calories').textContent = fmtNum(tg.kcal);
  document.getElementById('pf-protein').textContent = `${fmtNum(tg.p)}g`;
  document.getElementById('pf-carbs').textContent = `${fmtNum(tg.c)}g`;
  document.getElementById('pf-fat').textContent = `${fmtNum(tg.f)}g`;
  const raw = (user.customDiet && user.customDiet.meals) || (user.profile && user.profile.meals) || [];
  document.getElementById('pf-meals').innerHTML = raw.map((m, i) => {
    const meal = normMeal(m, i);
    const clock = meal.time ? `<time>${esc(fmtClock(meal.time))}</time>` : '';
    const macros = meal.kcal > 0 ? `<small>${fmtNum(meal.kcal)} KCAL · P${fmtNum(meal.p)} C${fmtNum(meal.c)} F${fmtNum(meal.f)}</small>` : '';
    return `<div class="pf-meal"><h4>${esc(meal.t)}${clock}</h4><p>${esc(meal.x).replace(/\n/g, '<br />')}</p>${macros}</div>`;
  }).join('');
  const dietNote = document.getElementById('pf-diet-note');
  if (dietNote) dietNote.textContent = user.customDiet
    ? `CUSTOMIZED BY ${String(user.customDiet.by).toUpperCase()} · ${fmtDate(user.customDiet.at).toUpperCase()} — YOUR COACH FINE-TUNED THIS PLAN FOR YOU.`
    : 'Generic template from your assessment — your coach and a nutritionist fine-tune it to you. Not medical advice.';
  const counter = document.getElementById('food-count');
  if (counter) counter.textContent = FOOD_DB.length;
  renderTracker(user);
};

const renderTracker = user => {
  const card = document.getElementById('diet-track');
  const logBox = document.getElementById('food-log');
  if (!card || !logBox) return;
  const tg = getDietTargets(user);
  const ate = dayIntake(user);
  const left = tg.kcal - ate.kcal;
  const bar = (val, goal) => {
    const pc = goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : 0;
    return `<span class="track-bar"><i style="width:${pc}%"></i></span>`;
  };
  card.hidden = false;
  card.innerHTML = `<span class="today-tag">TODAY'S INTAKE</span>` +
    `<p class="track-big"><strong>${fmtNum(ate.kcal)}</strong> / ${fmtNum(tg.kcal)} kcal</p>${bar(ate.kcal, tg.kcal)}` +
    `<p class="track-left">${left >= 0 ? `${fmtNum(left)} kcal left today` : `${fmtNum(-left)} kcal over target`}</p>` +
    `<div class="track-macros">` +
    [['PROTEIN', ate.p, tg.p], ['CARBS', ate.c, tg.c], ['FAT', ate.f, tg.f]].map(([l, v, g]) =>
      `<div><span>${l}</span><strong>${fmtNum(Math.round(v))} / ${fmtNum(g)}g</strong>${bar(v, g)}</div>`).join('') + `</div>`;
  const entries = ((user.foodLog || {})[dayKey()] || []);
  logBox.innerHTML = entries.length
    ? MEAL_SLOTS.map(slot => {
        const items = entries.map((e, i) => ({ ...e, i })).filter(e => e.meal === slot);
        if (!items.length) return '';
        const sub = items.reduce((a, e) => a + (+e.kcal || 0), 0);
        return `<div class="food-slot"><h4>${slot}<em>${fmtNum(sub)} kcal</em></h4><ul>` +
          items.map(e => `<li><span><strong>${esc(e.name)}</strong>${esc(String(e.grams))}g · ${fmtNum(e.kcal)} kcal · P${e.p} C${e.c} F${e.f}</span><button type="button" data-food-del="${e.i}" aria-label="Remove">×</button></li>`).join('') + `</ul></div>`;
      }).join('')
    : '<p class="log-empty">Nothing logged yet — search the food database below and tap a result to add it.</p>';
};

/* ---------- member food search + log events (bound once) ---------- */
(() => {
  const input = document.getElementById('food-search');
  if (!input) return;
  const results = document.getElementById('food-results');
  const pick = document.getElementById('food-pick');
  const pickName = document.getElementById('food-pick-name');
  const pickGrams = document.getElementById('food-pick-grams');
  const pickMeal = document.getElementById('food-pick-meal');
  const pickMacros = document.getElementById('food-pick-macros');
  let selected = null;
  const paintPick = () => {
    if (!selected) { pick.hidden = true; return; }
    pick.hidden = false;
    pickName.textContent = selected[0];
    const g = Math.max(1, parseInt(pickGrams.value, 10) || selected[6] || 100);
    const s = scaleFood(selected, g);
    pickMacros.textContent = `${fmtNum(g)}g = ${fmtNum(s.kcal)} kcal · P${s.p} C${s.c} F${s.f} (per 100g: ${selected[1]} kcal · P${selected[2]} C${selected[3]} F${selected[4]})`;
  };
  input.addEventListener('input', () => {
    const hits = searchFoods(input.value);
    results.innerHTML = hits.map(f =>
      `<button type="button" data-food="${esc(f[0])}"><strong>${esc(f[0])}</strong><span>100g: ${f[1]} kcal · P${f[2]} C${f[3]} F${f[4]}</span><em>${esc(f[5])} · ${f[6]}g</em></button>`
    ).join('');
  });
  results.addEventListener('click', event => {
    const btn = event.target.closest('[data-food]');
    if (!btn) return;
    selected = foodByName(btn.dataset.food);
    if (!selected) return;
    pickGrams.value = selected[6] || 100;
    pickMeal.value = mealForHour();
    paintPick();
    pickGrams.focus();
    pickGrams.select();
  });
  pickGrams.addEventListener('input', paintPick);
  pick.addEventListener('submit', event => {
    event.preventDefault();
    if (!selected) return;
    const user = currentUser();
    if (!user) return;
    const grams = Math.min(2000, Math.max(1, parseInt(pickGrams.value, 10) || selected[6] || 100));
    const s = scaleFood(selected, grams);
    user.foodLog = user.foodLog || {};
    const key = dayKey();
    user.foodLog[key] = user.foodLog[key] || [];
    user.foodLog[key].push({ name: selected[0], grams, meal: pickMeal.value, ...s, at: new Date().toISOString() });
    saveCurrentUser(user);
    selected = null;
    pick.hidden = true;
    input.value = '';
    results.innerHTML = '';
    renderTracker(user);
  });
  const logBox = document.getElementById('food-log');
  if (logBox) logBox.addEventListener('click', event => {
    const btn = event.target.closest('[data-food-del]');
    if (!btn) return;
    const user = currentUser();
    if (!user) return;
    const key = dayKey();
    const list = (user.foodLog || {})[key] || [];
    const idx = parseInt(btn.dataset.foodDel, 10);
    if (!Number.isNaN(idx) && list[idx]) list.splice(idx, 1);
    saveCurrentUser(user);
    renderTracker(user);
  });
})();

/* ---------- trainer: client diet block + intake ---------- */
const clientDietHTML = m => {
  const diet = m.customDiet;
  const p = m.profile;
  let html = '';
  if (diet && diet.meals) {
    const tg = getDietTargets(m);
    html += `<p class="csub">CUSTOM · ${fmtNum(tg.kcal)} KCAL · P${fmtNum(tg.p)} C${fmtNum(tg.c)} F${fmtNum(tg.f)} · BY ${esc(String(diet.by)).toUpperCase()}</p><ul class="clist">` +
      diet.meals.map((mm, i) => {
        const meal = normMeal(mm, i);
        return `<li><span><strong>${esc(meal.t)}${meal.time ? ` · ${esc(fmtClock(meal.time))}` : ''}</strong>${esc(meal.x)}${meal.kcal > 0 ? ` (${fmtNum(meal.kcal)} kcal · P${meal.p} C${meal.c} F${meal.f})` : ''}</span></li>`;
      }).join('') + `</ul>`;
  } else if (p && p.meals) {
    html += '<p class="log-empty">Assessment template active — no custom plan yet.</p>';
  } else {
    html += '<p class="log-empty">No diet data.</p>';
  }
  const ate = dayIntake(m);
  if (ate.count) {
    const tg = getDietTargets(m);
    html += `<p class="csub">TODAY: ATE ${fmtNum(ate.kcal)} / ${fmtNum(tg.kcal)} KCAL · P${fmtNum(Math.round(ate.p))}/${fmtNum(tg.p)} · C${fmtNum(Math.round(ate.c))}/${fmtNum(tg.c)} · F${fmtNum(Math.round(ate.f))}/${fmtNum(tg.f)} (${ate.count} ITEMS)</p>`;
  }
  return html;
};

/* ---------- trainer diet-dialog food finder + autosum (bound once) ---------- */
(() => {
  const dialog = document.getElementById('diet-dialog');
  if (!dialog) return;
  const input = document.getElementById('diet-find');
  const gramsInput = document.getElementById('diet-find-grams');
  const mealSel = document.getElementById('diet-find-meal');
  const results = document.getElementById('diet-find-results');
  input.addEventListener('input', () => {
    const hits = searchFoods(input.value);
    results.innerHTML = hits.map(f =>
      `<button type="button" data-dfood="${esc(f[0])}"><strong>${esc(f[0])}</strong><span>100g: ${f[1]} kcal · P${f[2]} C${f[3]} F${f[4]}</span><em>+</em></button>`
    ).join('');
  });
  results.addEventListener('click', event => {
    const btn = event.target.closest('[data-dfood]');
    if (!btn) return;
    const food = foodByName(btn.dataset.dfood);
    if (!food) return;
    const grams = Math.min(2000, Math.max(1, parseInt(gramsInput.value, 10) || 100));
    const s = scaleFood(food, grams);
    const block = dialog.querySelector(`.diet-meal[data-meal="${mealSel.value}"]`);
    if (!block) return;
    const box = block.querySelector('textarea');
    const line = `${grams}g ${food[0]} — ${fmtNum(s.kcal)} kcal · P${s.p} C${s.c} F${s.f}`;
    if (box) {
      box.value = box.value ? `${box.value.replace(/\s+$/, '')}\n${line}` : line;
      box.focus();
    }
    const acc = (k, v) => {
      const inp = block.querySelector(`[data-mk="${k}"]`);
      if (inp) inp.value = +(((parseFloat(inp.value) || 0) + v).toFixed(1));
    };
    acc('kcal', s.kcal); acc('p', s.p); acc('c', s.c); acc('f', s.f);
  });
  document.getElementById('diet-autosum').addEventListener('click', () => {
    const sum = { kcal: 0, p: 0, c: 0, f: 0 };
    dialog.querySelectorAll('.diet-meal').forEach(block => {
      ['kcal', 'p', 'c', 'f'].forEach(k => {
        const inp = block.querySelector(`[data-mk="${k}"]`);
        sum[k] += (inp && parseFloat(inp.value)) || 0;
      });
    });
    document.getElementById('diet-cal').value = Math.round(sum.kcal) || '';
    document.getElementById('diet-pro').value = Math.round(sum.p) || '';
    document.getElementById('diet-carb').value = Math.round(sum.c) || '';
    document.getElementById('diet-fat').value = Math.round(sum.f) || '';
  });
})();

/* ===========================================================================
   AI FITNESS ASSISTANT — on-device smart coach for members.
   Reads the member's real data (program, diet, tracker, measurements, streak)
   and answers training / nutrition / recovery questions instantly, offline.
   Set ONYX.AI_ENDPOINT to a POST JSON endpoint ({message, context} -> {reply})
   to upgrade answers to a cloud LLM; the local brain stays as instant fallback.
   The assistant NEVER replaces a qualified trainer or doctor — the disclaimer
   is baked into the UI and every medical-adjacent answer.
   =========================================================================== */
ONYX.AI_ENDPOINT = ONYX.AI_ENDPOINT || '';
const AI_SAFETY = 'I\u2019m an AI guide, not your trainer — and never a doctor. For injuries, medical conditions, or clinical nutrition needs, please talk to a qualified professional (or your ONYX coach).';
let lastAIWorkout = null;

const aiCoachName = user => {
  if (!user.assignedCoach) return null;
  const users = readUsers();
  return (users[user.assignedCoach] && users[user.assignedCoach].name) || null;
};
const aiTodaySession = user => {
  if (!user.plan) return { none: true };
  const t = todaysSession(user);
  if (!t) return { none: true };
  if (t.rest) return { rest: true };
  return { session: t.session, program: t.program, done: !!(user.workoutDone && user.workoutDone[dayKey()]) };
};
const aiWeightTrend = user => {
  const ws = (user.measurements || []).filter(m => +m.weight > 0).slice(-4);
  if (ws.length < 2) return null;
  const first = +ws[0].weight, last = +ws[ws.length - 1].weight;
  return { from: first, to: last, delta: +(last - first).toFixed(1), n: ws.length };
};
const aiWeekAdherence = user => {
  const keys = Object.keys(user.foodLog || {}).sort().slice(-7);
  const tg = getDietTargets(user);
  if (!keys.length) return null;
  const days = keys.map(k => (user.foodLog[k] || []).reduce((a, e) => a + (+e.kcal || 0), 0));
  const avg = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  return { days: days.length, avg, target: tg.kcal };
};
const aiRecentWorkouts = (user, n = 14) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    if (user.workoutDone && user.workoutDone[k]) out.push(k);
  }
  return out;
};

/* ---------- intent answers (all user data escaped) ---------- */
const aiMedical = () =>
  `<p><strong>I'd rather be safe than helpful here.</strong> Pain, injuries, dizziness, blood pressure, diabetes, thyroid, pregnancy, medication — anything medical — is outside what I can advise on.</p><p>${AI_SAFETY}</p><p>If it hurts sharply, swells, or doesn't ease in a few days, stop training that area and get it checked before your next session.</p>`;

const aiGreeting = user => {
  const t = aiTodaySession(user);
  const tg = getDietTargets(user);
  const ate = dayIntake(user);
  const stats = attendanceStats(user);
  const train = t.session ? `Today is <strong>${esc(t.session.focus)}</strong> (${esc(t.session.items.length)} exercises)${t.done ? ' — already crushed ✓' : ''}.` : t.rest ? 'Today is a <strong>rest day</strong> — walk, stretch, sleep.' : 'No program yet — finish your assessment or start one from the library.';
  return `<p>Namaste, <strong>${esc(user.name.split(' ')[0])}</strong> ✦ ${train}</p><p>Fuel: <strong>${fmtNum(ate.kcal)} / ${fmtNum(tg.kcal)} kcal</strong> so far · Streak: <strong>${stats.streak} days</strong>. Ask me about training, food, or recovery — e.g. "create a 45-min push workout".</p><p class="ai-fine">${AI_SAFETY}</p>`;
};

const aiPostWorkout = user => {
  const t = aiTodaySession(user);
  const tg = getDietTargets(user);
  const ate = dayIntake(user);
  const pLeft = Math.max(0, Math.round(tg.p - ate.p));
  const whey = foodByName('Whey protein');
  const banana = foodByName('Banana');
  const w = whey ? scaleFood(whey, 30) : null;
  const b = banana ? scaleFood(banana, 120) : null;
  const trained = t.session ? `after <strong>${esc(t.session.focus)}</strong>` : 'after training';
  return `<p>After training ${trained}, aim for <strong>30–50g protein + some carbs within 2 hours</strong> — protein rebuilds, carbs refill.</p><p>Easy combo: whey scoop (30g ≈ ${w ? `${w.kcal} kcal · P${w.p}` : '120 kcal · P24'}) + banana (≈ ${b ? `${b.kcal} kcal` : '105 kcal'}). Whole-food option: 4 eggs + 2 roti + curd.</p><p>You still have <strong>${fmtNum(pLeft)}g protein</strong> left in today's budget — log it in the tracker so I can keep count. <span class="ai-fine">General guidance; your coach fine-tunes portions to you.</span></p>`;
};

const aiMissed = user => {
  const ap = user.activeProgram;
  const coach = aiCoachName(user);
  let chestDay = null;
  if (ap && ap.week) chestDay = ap.week.find(d => /chest|push/i.test(d.focus || ''));
  const recent = aiRecentWorkouts(user, 7).length;
  return `<p>One missed session changes nothing — <strong>don't double up to "punish" yourself.</strong> Here's the fix:</p><ul><li><strong>Best:</strong> do ${chestDay ? `<strong>${esc(chestDay.label)} (${esc(chestDay.focus)})</strong>` : 'that session'} on your next rest day, then continue the week as written.</li><li><strong>Busy week?</strong> Merge: add 2 chest moves (bench + fly) to your next push/upper day.</li><li><strong>Missed 2+ weeks?</strong> Restart the current week fresh instead of cramming.</li></ul><p>You trained <strong>${recent} day${recent === 1 ? '' : 's'}</strong> this week — protect the streak, not the guilt.${coach ? ` Your coach <strong>${esc(coach)}</strong> can reshuffle your week in one message.` : ''}</p>`;
};

const aiPlateau = user => {
  const trend = aiWeightTrend(user);
  const adh = aiWeekAdherence(user);
  const recent = aiRecentWorkouts(user, 14).length;
  const tg = getDietTargets(user);
  const goal = user.profile ? user.profile.goal : null;
  let line1 = 'I need more data to diagnose you properly — log weight in Measurements and food in the tracker for a week.';
  if (trend) {
    const dir = trend.delta > 0 ? 'up' : trend.delta < 0 ? 'down' : 'flat';
    line1 = `Your last ${trend.n} weigh-ins went <strong>${trend.from} → ${trend.to} kg (${dir})</strong>.`;
  }
  let line2 = 'No food logs this week — most "stuck" phases are untracked snacking, not a broken metabolism.';
  if (adh) {
    const diff = adh.avg - adh.target;
    line2 = `You averaged <strong>${fmtNum(adh.avg)} kcal</strong> over ${adh.days} logged day${adh.days === 1 ? '' : 's'} vs a ${fmtNum(adh.target)} target (${diff > 0 ? '+' : ''}${fmtNum(diff)}). ${goal === 'lose' && diff > -100 ? 'For fat loss that gap is too small — tighten portions or add a walk.' : 'Consistency beats perfection — keep logging.'}`;
  }
  return `<p>${line1}</p><p>${line2}</p><ul><li><strong>Training:</strong> ${recent} sessions in 14 days — progressive overload + steps matter as much as diet.</li><li><strong>Weigh right:</strong> same time, morning, after bathroom; compare weekly averages, not days.</li><li><strong>Stuck 3+ weeks?</strong> That's when a coach earns their fee — ${aiCoachName(user) ? `ask <strong>${esc(aiCoachName(user))}</strong> to review this data.` : 'ask a coach to review your plan.'}</li></ul>`;
};

const aiProtein = user => {
  const w = user.profile && +user.profile.weight;
  const goal = (user.mainGoal && user.mainGoal.type) || (user.profile ? user.profile.goal : null);
  const tg = getDietTargets(user);
  const perKg = goal === 'lose' ? '2.0–2.2' : goal === 'build' || goal === 'strength' ? '1.8–2.2' : goal === 'endurance' ? '1.6–1.8' : '1.6–2.0';
  const range = w ? ` — that's <strong>${Math.round(w * parseFloat(perKg))}–${Math.round(w * (parseFloat(perKg) + 0.2))}g</strong> at your ${w} kg` : '';
  return `<p>Aim for <strong>${perKg}g protein per kg bodyweight</strong>${range}. Your plan targets <strong>${fmtNum(tg.p)}g/day</strong>.</p><p>Spread it over 3–4 meals (30–50g each absorbs best): eggs, paneer, chicken, dal + curd, whey on training days. Ask me <em>"protein in paneer"</em> for any food's numbers.</p>`;
};

const aiFoodQuery = (user, foodName, grams) => {
  const clean = foodName.replace(/^(how many|how much|whats|what s|what is|tell me about|tell me|give me|a|an|the)\b\s*/, '').trim();
  if (clean.length < 2) return `<p>Ask me like <em>"protein in eggs"</em> or <em>"calories in 150g chicken"</em> and I'll pull the numbers from my food database.</p>`;
  const hits = searchFoods(clean);
  if (!hits.length) return `<p>I couldn't find "<strong>${esc(foodName)}</strong>" in my 126-food database. Try a simpler name — <em>paneer, roti, whey, banana</em>.</p>`;
  const f = hits[0];
  const g = grams || f[6] || 100;
  const s = scaleFood(f, g);
  return `<p><strong>${esc(f[0])}</strong> — per 100g: <strong>${f[1]} kcal · P${f[2]} C${f[3]} F${f[4]}</strong>.</p><p>${fmtNum(g)}g (${esc(f[5])} ≈ ${f[6]}g) = <strong>${fmtNum(s.kcal)} kcal · P${s.p} C${s.c} F${s.f}</strong>. Log it from the Diet tab's food search to count it today.</p>`;
};

const aiTargets = user => {
  const tg = getDietTargets(user);
  const ate = dayIntake(user);
  const custom = !!(user.customDiet && user.customDiet.calories);
  return `<p>Your daily targets${custom ? ` (set by your coach)` : ' (from your assessment)'}:</p><ul><li><strong>${fmtNum(tg.kcal)} kcal</strong> — eaten ${fmtNum(ate.kcal)}, ${fmtNum(Math.max(0, tg.kcal - ate.kcal))} left</li><li><strong>Protein ${fmtNum(tg.p)}g</strong> · <strong>Carbs ${fmtNum(tg.c)}g</strong> · <strong>Fat ${fmtNum(tg.f)}g</strong></li><li>Water: 3–4 litres, more on training days</li></ul>`;
};

const aiToday = user => {
  const t = aiTodaySession(user);
  if (t.session) return `<p>Today: <strong>${esc(t.session.focus)}</strong> — ${esc(t.session.label)} · ${esc(String(t.program))}${t.done ? ' ✓ done' : ''}.</p><ul>${t.session.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p>Warm up 5 minutes, rest 60–120s between sets. Mark it done on the Today tab when you finish.</p>`;
  if (t.rest) return `<p>Today is a <strong>rest day</strong> — the gym floor is closed on Sundays. Walk 20–30 min, stretch hips + shoulders, sleep early. Growth happens between sessions.</p>`;
  return `<p>No program on your account yet — finish the assessment or start any program from the library, and I'll brief you daily.</p>`;
};

const aiStreak = user => {
  const stats = attendanceStats(user);
  const recent = aiRecentWorkouts(user, 14).length;
  return `<p>You're on a <strong>${stats.streak}-day streak</strong> (best: ${stats.best}) · <strong>${stats.total} visits</strong> logged · ${stats.monthDays} this month.</p><p>Workouts completed in the last 14 days: <strong>${recent}</strong>. ${stats.streak >= 7 ? 'That consistency is the whole game — protect it.' : 'Two sessions this week and the streak starts compounding.'}</p>`;
};

const aiPRs = user => {
  const prs = (user.prs || []).slice(-5).reverse();
  if (!prs.length) return `<p>No PRs logged yet — tell your coach (or log one) the next time you hit a big lift, and I'll track your strongest numbers here.</p>`;
  return `<p>Your latest PRs:</p><ul>${prs.map(r => `<li><strong>${esc(r.lift)} — ${esc(String(r.weight))}kg</strong> · ${esc(fmtDate(r.date))}</li>`).join('')}</ul><p>Test a true max every 8–12 weeks, not every week — and always with a spotter or coach watching.</p>`;
};

const aiCoach = user => {
  const coach = aiCoachName(user);
  return coach
    ? `<p>Your coach is <strong>${esc(coach)}</strong> — for program changes, injuries, or anything personal, they're the human to ask.</p><p><button type="button" class="ai-goto" data-ai-goto="profile-coach">Open Coach Corner →</button></p>`
    : `<p>No coach assigned yet — I can handle general guidance, but a human coach is worth it for personal programming. Ask at the front desk or message us and we'll match you.</p><p><button type="button" class="ai-goto" data-open-contact>Message the team →</button></p>`;
};

const aiWater = () => `<p>Target <strong>3–4 litres a day</strong>, +500–750ml per hour of training. Practical rule: carry the bottle, sip between sets, and check your urine — pale yellow means you're on track.</p>`;
const aiRecovery = () => `<p>Sore, not sharp? That's DOMS — it peaks at 24–48h. Move gently (walk, light cycle), sleep 7–9 hours, eat your protein.</p><p><strong>Sharp, one-sided, or joint pain is different</strong> — stop training it and see a professional. ${AI_SAFETY}</p>`;
const aiThanks = user => `<p>Anytime, <strong>${esc(user.name.split(' ')[0])}</strong> — now go earn the streak. 💪</p>`;
const aiWho = () => `<p>I'm the <strong>ONYX AI assistant (beta)</strong> — I read your program, diet, tracker, and progress to answer personally. I can brief today's workout, build sessions, look up any food, and diagnose plateaus.</p><p class="ai-fine">${AI_SAFETY}</p>`;
const aiFallback = () => `<p>I can help with <strong>training</strong> ("create a 45-min push workout"), <strong>food</strong> ("protein in eggs", "what to eat after workout"), and <strong>progress</strong> ("why is my weight stuck", "my streak").</p><p>Try one — or ask your coach for anything personal.</p>`;

/* ---------- workout generator ---------- */
const AI_EX = {
  push: [['Barbell Bench Press', 4, '6–8'], ['Overhead Press', 4, '6–8'], ['Incline Dumbbell Press', 3, '8–10'], ['Dips', 3, '8–12'], ['Lateral Raises', 3, '12–15'], ['Cable Chest Fly', 3, '10–12'], ['Tricep Pushdown', 3, '10–12'], ['Overhead Extension', 3, '10–12']],
  pull: [['Deadlift', 4, '5'], ['Pull-ups / Lat Pulldown', 4, '6–10'], ['Barbell Row', 4, '6–8'], ['Seated Cable Row', 3, '8–10'], ['Face Pulls', 3, '12–15'], ['Barbell Curl', 3, '8–10'], ['Hammer Curl', 3, '10–12'], ['Shrugs', 3, '12–15']],
  legs: [['Back Squat', 4, '6–8'], ['Romanian Deadlift', 4, '8–10'], ['Leg Press', 3, '10–12'], ['Walking Lunges', 3, '12/leg'], ['Lying Leg Curl', 3, '10–12'], ['Hip Thrust', 3, '10–12'], ['Standing Calf Raise', 4, '12–15'], ['Bulgarian Split Squat', 3, '8/leg']],
  chest: [['Barbell Bench Press', 4, '6–8'], ['Incline Dumbbell Press', 4, '8–10'], ['Dips', 3, '8–12'], ['Cable Chest Fly', 3, '10–12'], ['Push-ups', 3, 'max'], ['Decline Press', 3, '8–10']],
  back: [['Deadlift', 4, '5'], ['Pull-ups / Lat Pulldown', 4, '6–10'], ['Barbell Row', 4, '6–8'], ['Seated Cable Row', 3, '8–10'], ['Straight-arm Pulldown', 3, '10–12'], ['Hyperextension', 3, '12–15']],
  shoulders: [['Overhead Press', 4, '6–8'], ['Arnold Press', 3, '8–10'], ['Lateral Raises', 4, '12–15'], ['Rear-delt Fly', 3, '12–15'], ['Face Pulls', 3, '12–15'], ['Shrugs', 3, '12–15']],
  arms: [['Barbell Curl', 4, '8–10'], ['Tricep Pushdown', 4, '8–10'], ['Hammer Curl', 3, '10–12'], ['Overhead Extension', 3, '10–12'], ['Preacher Curl', 3, '10–12'], ['Dips', 3, '8–12']],
  core: [['Hanging Knee Raise', 3, '12–15'], ['Cable Crunch', 3, '12–15'], ['Plank', 3, '45–60s'], ['Russian Twist', 3, '20'], ['Ab Wheel', 3, '8–10'], ['Side Plank', 3, '30s/side']],
  full: [['Back Squat', 4, '6–8'], ['Barbell Bench Press', 4, '6–8'], ['Barbell Row', 4, '6–8'], ['Overhead Press', 3, '8–10'], ['Romanian Deadlift', 3, '8–10'], ['Pull-ups / Lat Pulldown', 3, '6–10'], ['Plank', 3, '45–60s']],
  upper: [['Barbell Bench Press', 4, '6–8'], ['Barbell Row', 4, '6–8'], ['Overhead Press', 3, '8–10'], ['Pull-ups / Lat Pulldown', 3, '6–10'], ['Lateral Raises', 3, '12–15'], ['Barbell Curl', 3, '8–10'], ['Tricep Pushdown', 3, '10–12']],
  lower: [['Back Squat', 4, '6–8'], ['Romanian Deadlift', 4, '8–10'], ['Leg Press', 3, '10–12'], ['Walking Lunges', 3, '12/leg'], ['Lying Leg Curl', 3, '10–12'], ['Standing Calf Raise', 4, '12–15']],
  hiit: [['Kettlebell Swings', 5, '40s on/20s off'], ['Box Jumps', 5, '40s on/20s off'], ['Battle Ropes', 5, '30s on/30s off'], ['Burpees', 4, '40s on/20s off'], ['Rowing Sprint', 4, '250m'], ['Mountain Climbers', 4, '40s on/20s off']]
};
const aiDetectFocus = q => {
  if (/\bpush\b|chest|bench/.test(q)) return /back|pull/.test(q) ? 'upper' : /\bpush\b/.test(q) && !/chest/.test(q) ? 'push' : 'chest';
  if (/\bpull\b|back\b|bicep|lat\b/.test(q)) return 'pull';
  if (/\bleg\b|legs|squat|glute|quad|hamstring|calf|calves/.test(q)) return 'legs';
  if (/shoulder|delt/.test(q)) return 'shoulders';
  if (/\barm\b|arms|tricep/.test(q)) return 'arms';
  if (/core|abs|ab |six.pack/.test(q)) return 'core';
  if (/full.body|fullbody|full body/.test(q)) return 'full';
  if (/upper/.test(q)) return 'upper';
  if (/lower/.test(q)) return 'lower';
  if (/hiit|cardio|condition|fat.burn|metcon/.test(q)) return 'hiit';
  return 'full';
};
const aiDetectMinutes = q => {
  const m = q.match(/(\d{2,3})\s*(?:min|m\b)/);
  if (m) return Math.min(90, Math.max(20, parseInt(m[1], 10)));
  if (/quick|short|busy/.test(q)) return 30;
  return 45;
};
const aiGenerate = (user, q) => {
  const focus = aiDetectFocus(q);
  const mins = aiDetectMinutes(q);
  const pool = AI_EX[focus] || AI_EX.full;
  const count = mins <= 32 ? 5 : mins <= 52 ? 6 : Math.min(pool.length, 8);
  const items = [`Warm-up — 5 min bike/row + arm circles + leg swings`, ...pool.slice(0, count).map(([n, s, r]) => `${n} — ${s} × ${r} (rest ${focus === 'hiit' ? 'as written' : s >= 4 ? '2–3 min' : '60–90s'})`), `Cool-down — 5 min easy cardio + full-body stretch`];
  const label = `${mins}-Min ${focus.charAt(0).toUpperCase() + focus.slice(1)}`;
  lastAIWorkout = { name: `${label} — AI Built`, focus: label, items };
  return `<p>Here's your <strong>${label} workout</strong> (~${mins} min):</p><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p><button type="button" class="ai-goto" data-ai-save>Save to my programs →</button></p><p class="ai-fine">New to these lifts? Ask a coach to check your form on the big compounds first.</p>`;
};

/* ---------- router ---------- */
const aiLocalReply = (text, user) => {
  const q = ` ${String(text || '').toLowerCase()} `;
  if (/\b(pain|hurts?|injur|doctor|diabet|thyroid|blood pressure|\bbp\b|pregnan|medic|dizz|joint|tear|sprain|surgery|depress|anxiet|eating disorder|steroid|chest pain|doctor)\b/.test(q)) return aiMedical();
  if (/^(hi|hii+|hey|hello|yo|namaste|good (morning|afternoon|evening))\b/.test(q.trim())) return aiGreeting(user);
  if (/who are you|what can you/.test(q)) return aiWho();
  if (/(after|post)[-\s]?workout|what.*eat.*(after|train)/.test(q)) return aiPostWorkout(user);
  const qc = q.replace(/\d+\s*g\b/g, ' ');
  const fm = qc.match(/(?:calories|kcal|protein|carbs|fat|macros?|nutrition)\s+(?:are\s+)?(?:in|of)\s+([a-z][a-z\s\/\-.()]*)/)
    || qc.match(/([a-z][a-z\s\/\-.()]*?)\s+(?:calories|kcal|nutrition|macros?)\b/)
    || qc.match(/(?:protein|carbs|fat|calories|kcal)\s+does\s+([a-z][a-z\s\/\-.()]*?)(?:\s+have)?\s*$/);
  if (fm) {
    const gm = q.match(/(\d+)\s*g\b/);
    return aiFoodQuery(user, fm[1].trim().replace(/\s+/g, ' '), gm ? parseInt(gm[1], 10) : null);
  }
  if (/(\bmiss(ed|ing)?|skipped|behind|couldn.?t (train|workout|go|make)|catch up|stop(ped)? (going|training))\b/.test(q) && !/rope|jump/.test(q)) return aiMissed(user);
  if (/\bskipped?\b.*(day|workout|session|gym|chest|leg|push|pull)/.test(q)) return aiMissed(user);
  if (/plateau|stuck|not losing|not gaining|weigh the same|no progress|scale (wont|won't|isnt|isn't|not|stuck)|stop(ped|s)?/.test(q) && /weight|los|gain|diet|fat|kg|scale|stuck|plateau|progress|eating|deficit/.test(q)) return aiPlateau(user);
  if (/(diet|meal|food).{0,20}(plan|chart|suggest|idea|make|create)/.test(q)) return `<p>Your current targets: <strong>${fmtNum(getDietTargets(user).kcal)} kcal · P${fmtNum(getDietTargets(user).p)} C${fmtNum(getDietTargets(user).c)} F${fmtNum(getDietTargets(user).f)}</strong> — full plan's on your Diet tab.</p><p>Want changes? ${aiCoachName(user) ? `Message <strong>${esc(aiCoachName(user))}</strong> — they can rewrite your plan in minutes.` : 'A coach can build you a custom plan — ask at the front desk.'} Meanwhile, ask me <em>"protein in eggs"</em> for any food's numbers.</p>`;
  if (/(create|make|generate|give|build|design|write).{0,30}(workout|session|training|exercise|routine|plan)|((push|pull|leg|chest|back|shoulder|arm|full.body|upper|lower|hiit|core)\s*(day|workout|session|routine))/.test(q)) return aiGenerate(user, q);
  if (/protein/.test(q)) return aiProtein(user);
  if (/calor|macros?\b|my target/.test(q)) return aiTargets(user);
  if (/today.*(workout|train|session|exercise)|what.*(train|workout).*today|my workout\b/.test(q)) return aiToday(user);
  if (/streak|attendance|check.?in|how many.*workout|workouts.*(done|last)|my progress/.test(q)) return aiStreak(user);
  if (/\bprs?\b|personal record|max lift|strongest|1rm/.test(q)) return aiPRs(user);
  if (/coach|trainer|human|expert|call me|contact|support/.test(q)) return aiCoach(user);
  if (/water|hydrat|drink/.test(q)) return aiWater();
  if (/sleep|sore|recover|tired|fatigue|doms|rest\b/.test(q)) return aiRecovery();
  if (/thank|great|awesome|nice|bye|perfect/.test(q)) return aiThanks(user);
  return aiFallback();
};

/* ---------- cloud endpoint seam (optional upgrade) ---------- */
const aiViaEndpoint = async (user, text) => {
  const url = ONYX.AI_ENDPOINT;
  if (!url) return null;
  const t = aiTodaySession(user);
  const tg = getDietTargets(user);
  const ate = dayIntake(user);
  const context = {
    name: user.name, goal: user.profile ? user.profile.goal : null,
    weightKg: user.profile ? user.profile.weight : null, targetKg: user.profile ? user.profile.target : null,
    program: user.activeProgram ? user.activeProgram.name : null,
    todayWorkout: t.session ? `${t.session.label}: ${t.session.focus} (${t.session.items.length} exercises)` : t.rest ? 'Rest day' : 'No program',
    targets: tg, eatenToday: { kcal: Math.round(ate.kcal), p: +ate.p.toFixed(1), c: +ate.c.toFixed(1), f: +ate.f.toFixed(1) },
    streak: calcStreak(user.checkins), visits: (user.visits || []).length,
    recentWeights: (user.measurements || []).filter(m => +m.weight > 0).slice(-4).map(m => m.weight),
    prs: (user.prs || []).slice(-5), coach: aiCoachName(user)
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: String(text).slice(0, 500), context }), signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.reply ? String(data.reply) : null;
  } catch (err) { clearTimeout(timer); return null; }
};

/* ---------- chat UI (bound once) ---------- */
(() => {
  const fab = document.getElementById('ai-fab');
  if (!fab) return;
  const dialog = document.getElementById('ai-dialog');
  const msgs = document.getElementById('ai-msgs');
  const chips = document.getElementById('ai-chips');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const QUICK = ['What should I eat after my workout?', 'I missed chest day — what now?', 'Why is my weight stuck?', 'Create a 45-min push workout', 'How much protein do I need?'];
  let booted = false;
  const scrollDown = () => { msgs.scrollTop = msgs.scrollHeight; };
  const pushHist = (role, html) => {
    const user = currentUser();
    if (!user) return;
    user.aiChat = user.aiChat || [];
    user.aiChat.push({ r: role, h: String(html).slice(0, 4000) });
    if (user.aiChat.length > 30) user.aiChat = user.aiChat.slice(-30);
    saveCurrentUser(user);
  };
  const bubble = (role, html, save = true) => {
    const div = document.createElement('div');
    div.className = `ai-msg ${role}`;
    div.innerHTML = html;
    msgs.appendChild(div);
    scrollDown();
    if (save) pushHist(role, html);
    return div;
  };
  const boot = () => {
    if (booted) return;
    booted = true;
    chips.innerHTML = QUICK.map(q => `<button type="button" data-ai-chip="${esc(q)}">${esc(q)}</button>`).join('');
    const user = currentUser();
    if (!user) {
      bubble('bot', `<p>Namaste ✦ I'm the ONYX AI coach — I read your program, diet, and progress to answer personally.</p><p><button type="button" class="ai-goto" data-ai-login>Log in to start →</button></p>`, false);
      return;
    }
    (user.aiChat || []).forEach(m => bubble(m.r === 'u' ? 'user' : 'bot', m.h, false));
    if (!(user.aiChat || []).length) bubble('bot', aiGreeting(user));
  };
  const send = async text => {
    const clean = String(text || '').trim().slice(0, 300);
    if (!clean) return;
    const user = currentUser();
    if (!user) { openAuth('Log in to chat with your AI coach.'); return; }
    bubble('user', esc(clean));
    input.value = '';
    const typing = document.createElement('div');
    typing.className = 'ai-msg bot ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(typing);
    scrollDown();
    let reply = await aiViaEndpoint(user, clean);
    if (reply) reply = `<p>${esc(reply).replace(/\n/g, '<br />')}</p>`;
    else {
      await new Promise(r => setTimeout(r, 450 + Math.min(600, clean.length * 8)));
      reply = aiLocalReply(clean, user);
    }
    typing.remove();
    bubble('bot', reply);
  };
  fab.addEventListener('click', () => { boot(); dialog.showModal(); setTimeout(() => input.focus(), 50); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  form.addEventListener('submit', event => { event.preventDefault(); send(input.value); });
  chips.addEventListener('click', event => {
    const btn = event.target.closest('[data-ai-chip]');
    if (btn) send(btn.dataset.aiChip);
  });
  msgs.addEventListener('click', event => {
    if (event.target.closest('[data-ai-login]')) { dialog.close(); openAuth('Log in to chat with your AI coach.'); return; }
    const go = event.target.closest('[data-ai-goto]');
    if (go) {
      dialog.close();
      const el = document.getElementById(go.dataset.aiGoto);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      return;
    }
    if (event.target.closest('[data-ai-save]')) {
      const user = currentUser();
      if (!user || !lastAIWorkout) return;
      user.customPrograms = user.customPrograms || [];
      user.customPrograms.push({
        id: 'c' + Date.now().toString(36), name: lastAIWorkout.name, goal: user.profile ? user.profile.goal : '',
        week: [{ label: 'Day 1', focus: lastAIWorkout.focus, items: [...lastAIWorkout.items] }],
        official: false, builtin: false, author: user.name, email: user.email, createdAt: new Date().toISOString()
      });
      saveCurrentUser(user);
      renderLibrary(user);
      bubble('bot', `<p>Saved <strong>${esc(lastAIWorkout.name)}</strong> to your program library — start it anytime from below.</p><p><button type="button" class="ai-goto" data-ai-goto="profile-library">Open library →</button></p>`);
    }
  });
})();

/* ===========================================================================
   PERSONAL GOALS — member picks a primary goal; progress syncs live with real
   data: measurements + check-in weights, food log, workouts, steps, PRs, streak.
   =========================================================================== */
const MAIN_GOALS = {
  build: { emoji: '💪', label: 'Muscle gain', desc: 'Surplus, PRs, growth.', focus: 'HYPERTROPHY · PROTEIN FIRST' },
  lose: { emoji: '🔥', label: 'Fat loss', desc: 'Sustainable deficit.', focus: 'DEFICIT · STEPS · CONSISTENCY' },
  strength: { emoji: '🏋️', label: 'Strength', desc: 'Big lifts, big numbers.', focus: 'SQUAT · BENCH · DEADLIFT' },
  endurance: { emoji: '🏃', label: 'Endurance', desc: 'Engine + stamina.', focus: 'STEPS · CONDITIONING' },
  fit: { emoji: '⚡', label: 'General fitness', desc: 'Look good, feel good.', focus: 'BALANCE · STREAK · HEALTH' }
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
};
const bestWeight = user => {
  const ws = mergedWeights(user);
  if (ws.length) return ws[ws.length - 1].weight;
  return user.profile && +user.profile.weight > 0 ? +user.profile.weight : null;
};
const big3Total = user => {
  const find = re => {
    const hits = (user.prs || []).filter(r => re.test(r.lift || ''));
    return hits.length ? +hits[hits.length - 1].weight || 0 : 0;
  };
  const s = find(/squat/i), b = find(/bench|press/i), d = find(/deadlift/i);
  return { s, b, d, total: s + b + d, count: [s, b, d].filter(Boolean).length };
};

const paintWeightCard = (user, ws) => {
  const box = document.getElementById('goal-card');
  if (!box) return;
  const mg = user.mainGoal || {};
  const targetForm = cur =>
    `<form class="goal-target" id="goal-target-form"><input type="number" step="0.1" min="30" max="250" value="${cur || ''}" placeholder="Target kg — e.g. 68" required aria-label="Target weight in kg" /><button type="submit">Set target</button></form>`;
  const uniq = [];
  (ws || []).forEach(w => { const i = uniq.findIndex(u => u.d === w.d); if (i >= 0) uniq[i] = w; else uniq.push(w); });
  uniq.sort((a, b) => String(a.d).localeCompare(String(b.d)));
  const p = user.profile || {};
  const start = +mg.start > 0 ? +mg.start : uniq.length ? uniq[0].weight : +p.weight || 0;
  const current = uniq.length ? uniq[uniq.length - 1].weight : +p.weight || 0;
  const target = +mg.target > 0 ? +mg.target : +p.target || 0;
  if (!start || !current) {
    box.innerHTML = `<p class="log-empty">Log your weight to start tracking — save a weekly check-in and it lands here automatically.</p><p><button type="button" class="goal-link" data-goal-goto="profile-progress">Log a check-in →</button></p>`;
    return;
  }
  if (!target || target === start) {
    box.innerHTML = `<p class="goal-head">CURRENT <strong>${current} kg</strong></p><p class="log-empty">Set a target and I'll track every kilo with you.</p>${targetForm('')}`;
    return;
  }
  const losing = target < start;
  const total = Math.abs(target - start);
  const done = losing ? start - current : current - start;
  const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  const remain = Math.abs(target - current);
  const miles = [25, 50, 75, 100].filter(m => pct >= m);
  box.innerHTML = `<p class="goal-head">${losing ? 'LOSE' : 'GAIN'} <strong>${+total.toFixed(1)} kg</strong></p>` +
    `<p class="track-big"><strong>${pct}%</strong></p><span class="track-bar"><i style="width:${pct}%"></i></span>` +
    (miles.length ? `<p class="goal-miles">${miles.map(m => `<span>🏁 ${m}%</span>`).join('')}</p>` : '') +
    (pct >= 100 ? `<p class="goal-done">🎉 GOAL REACHED — set your next target below.</p>` : '') +
    `<div class="goal-nums"><div><span>CURRENT</span><strong>${current} kg</strong></div><div><span>TARGET</span><strong>${target} kg</strong></div><div><span>${losing ? 'TO LOSE' : 'TO GAIN'}</span><strong>${+remain.toFixed(1)} kg</strong></div><div><span>STARTED</span><strong>${start} kg</strong></div></div>` +
    targetForm(target);
};

const renderGoalMetrics = user => {
  const box = document.getElementById('goal-metrics');
  if (!box) return;
  const type = (user.mainGoal && user.mainGoal.type) || 'fit';
  const keys7 = lastNDayKeys(7);
  const kcalAvg = Math.round(keys7.reduce((a, k) => a + sumMacroDay(user, k, 'kcal'), 0) / 7);
  const proAvg = Math.round(keys7.reduce((a, k) => a + sumMacroDay(user, k, 'p'), 0) / 7);
  const tg = getDietTargets(user);
  const workouts14 = lastNDayKeys(14).filter(k => user.workoutDone && user.workoutDone[k]).length;
  const streak = calcStreak(user.checkins);
  const stepsToday = (user.stepsLog && user.stepsLog[dayKey()]) || 0;
  const steps7 = keys7.reduce((a, k) => a + ((user.stepsLog && user.stepsLog[k]) || 0), 0);
  const b3 = big3Total(user);
  const tile = (v, l) => `<div><strong>${v}</strong><span>${l}</span></div>`;
  const tiles = {
    lose: tile(`${fmtNum(kcalAvg)} / ${fmtNum(tg.kcal)}`, 'AVG KCAL · 7 DAYS') + tile(workouts14, 'WORKOUTS · 14 DAYS') + tile(streak, 'DAY STREAK'),
    build: tile(`${fmtNum(proAvg)} / ${fmtNum(tg.p)}g`, 'AVG PROTEIN · 7 DAYS') + tile((user.prs || []).length, 'PRS LOGGED') + tile(workouts14, 'WORKOUTS · 14 DAYS'),
    strength: tile(b3.count ? `${fmtNum(b3.total)} kg` : '—', b3.count ? `BIG 3 TOTAL · S${b3.s} B${b3.b} D${b3.d}` : 'LOG SQUAT / BENCH / DEADLIFT PRS') + tile((user.prs || []).length, 'PRS LOGGED') + tile(workouts14, 'WORKOUTS · 14 DAYS'),
    endurance: tile(fmtNum(stepsToday), 'STEPS TODAY') + tile(fmtNum(steps7), 'STEPS · 7 DAYS') + tile(streak, 'DAY STREAK'),
    fit: tile(streak, 'DAY STREAK') + tile(workouts14, 'WORKOUTS · 14 DAYS') + tile((user.visits || []).length, 'TOTAL VISITS')
  };
  box.innerHTML = tiles[type] || tiles.fit;
};

const renderGoalList = user => {
  const box = document.getElementById('goal-list');
  if (!box) return;
  box.innerHTML = (user.goals || []).length ? (user.goals || []).map(g => {
    const pct = +g.target > 0 ? Math.min(100, Math.round(((+g.current || 0) / +g.target) * 100)) : 0;
    return `<div class="goal-row"><div class="goal-row-main"><strong>${esc(g.title)}</strong><span>${esc(String(g.current))} / ${esc(String(g.target))} ${esc(g.unit)}${g.done ? ' · DONE ✓' : ''}</span><span class="track-bar"><i style="width:${pct}%"></i></span></div>` +
      `<form data-goal-up="${g.id}"><input type="number" step="any" value="${+g.current || 0}" aria-label="Current value" /><button type="submit">Set</button></form><button type="button" data-goal-del="${g.id}" aria-label="Delete goal">×</button></div>`;
  }).join('') : '<p class="log-empty">No custom goals yet — add your first below.</p>';
};

const renderGoals = user => {
  const section = document.getElementById('profile-goals');
  if (!section || !user) return;
  section.hidden = false;
  if (!user.mainGoal || !MAIN_GOALS[user.mainGoal.type]) {
    const map = { build: 'build', lose: 'lose', fit: 'fit', athlete: 'fit' };
    user.mainGoal = {
      type: (user.profile && map[user.profile.goal]) || 'fit',
      target: user.profile && +user.profile.target > 0 ? +user.profile.target : null,
      start: null
    };
    saveCurrentUser(user);
  }
  document.getElementById('goal-pick').innerHTML = Object.entries(MAIN_GOALS).map(([k, g]) =>
    `<button type="button" data-goal="${k}" class="${user.mainGoal.type === k ? 'is-on' : ''}" aria-pressed="${user.mainGoal.type === k}"><b>${g.emoji}</b><strong>${g.label}</strong><span>${g.desc}</span></button>`
  ).join('');
  renderGoalMetrics(user);
  renderGoalList(user);
  paintWeightCard(user, mergedWeights(user));
  ProgressDB.all(user.email).then(entries => {
    const extra = (entries || []).filter(e => +e.weight > 0).map(e => ({ d: String(e.dateISO || '').slice(0, 10), weight: +e.weight }));
    if (extra.length) paintWeightCard(user, mergedWeights(user, extra));
  }).catch(() => {});
};

/* Trainer client-file focus line. */
const clientGoalLine = m => {
  const t = m.mainGoal && MAIN_GOALS[m.mainGoal.type] ? m.mainGoal.type : null;
  let extra = '';
  const ws = mergedWeights(m);
  if (m.mainGoal && +m.mainGoal.target > 0 && ws.length) {
    const start = +m.mainGoal.start > 0 ? +m.mainGoal.start : ws[0].weight;
    const cur = ws[ws.length - 1].weight;
    const total = Math.abs(m.mainGoal.target - start);
    const done = m.mainGoal.target < start ? start - cur : cur - start;
    const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
    extra = ` · ${start} → ${cur} / ${m.mainGoal.target} KG (${pct}%)`;
  }
  return `<p class="csub">FOCUS: ${t ? MAIN_GOALS[t].label.toUpperCase() : '—'}${esc(extra)}</p>`;
};

/* ---------- goals events (bound once, delegated) ---------- */
(() => {
  const section = document.getElementById('profile-goals');
  if (!section) return;
  section.addEventListener('click', event => {
    const pick = event.target.closest('[data-goal]');
    const user = currentUser();
    if (pick && user) {
      if (!user.mainGoal || user.mainGoal.type !== pick.dataset.goal) {
        user.mainGoal = { type: pick.dataset.goal, target: null, start: bestWeight(user) };
        saveCurrentUser(user);
        renderGoals(user);
      }
      return;
    }
    const go = event.target.closest('[data-goal-goto]');
    if (go) {
      const el = document.getElementById(go.dataset.goalGoto);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const del = event.target.closest('[data-goal-del]');
    if (del && user) {
      user.goals = (user.goals || []).filter(g => g.id !== del.dataset.goalDel);
      saveCurrentUser(user);
      renderGoalList(user);
    }
  });
  section.addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (!user) return;
    const form = event.target;
    if (form.id === 'goal-target-form') {
      const v = parseFloat(form.querySelector('input').value);
      if (!(v >= 30 && v <= 250)) return;
      user.mainGoal = user.mainGoal || { type: 'fit', start: null };
      user.mainGoal.target = +v.toFixed(1);
      if (!(+user.mainGoal.start > 0)) user.mainGoal.start = bestWeight(user);
      saveCurrentUser(user);
      renderGoals(user);
      return;
    }
    if (form.id === 'goal-add-form') {
      const title = form.elements.title.value.trim().slice(0, 50);
      const target = parseFloat(form.elements.target.value);
      const unit = form.elements.unit.value.trim().slice(0, 10) || 'units';
      if (!title || !(target > 0)) return;
      user.goals = user.goals || [];
      user.goals.push({ id: 'g' + Date.now().toString(36), title, target, unit, current: 0, done: false });
      saveCurrentUser(user);
      form.reset();
      renderGoalList(user);
      return;
    }
    const upWrap = event.target.closest('form[data-goal-up]');
    if (upWrap) {
      const g = (user.goals || []).find(x => x.id === upWrap.dataset.goalUp);
      if (!g) return;
      const v = parseFloat(upWrap.querySelector('input').value);
      if (!(v >= 0)) return;
      g.current = v;
      g.done = v >= +g.target && +g.target > 0;
      saveCurrentUser(user);
      renderGoalList(user);
    }
  });
})();

/* ===========================================================================
   CHALLENGES & GAMIFICATION — derived points/levels (always consistent, never
   double-counted), 14 auto-tracked challenges, same-browser leaderboards,
   level-based rewards. All computed live from real member data.
   =========================================================================== */
const LEVELS = [[0, 'Rookie'], [100, 'Regular'], [250, 'Committed'], [500, 'Grinder'], [1000, 'Athlete'], [1750, 'Elite'], [2750, 'Legend'], [4000, 'Icon']];
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
};
const REWARDS = [
  { level: 2, emoji: '🎟️', text: 'Free guest pass — bring a friend' },
  { level: 3, emoji: '🥤', text: '10% off shakers & merch' },
  { level: 4, emoji: '🥗', text: 'Free diet-plan review with a coach' },
  { level: 5, emoji: '👕', text: '15% off ONYX merch + 2 guest passes' },
  { level: 6, emoji: '💪', text: 'Free personal-training session' },
  { level: 7, emoji: '🏆', text: 'Limited ONYX athlete tee' },
  { level: 8, emoji: '👑', text: 'Founders wall feature + 25% off renewal' }
];
let boardMode = 'visits';

const renderChallenges = user => {
  const section = document.getElementById('profile-challenges');
  if (!section || !user) return;
  section.hidden = false;
  const lv = levelOf(pointsOf(user));
  document.getElementById('ch-level').innerHTML =
    `<div class="ch-level-badge"><b>LV ${lv.n}</b><strong>${esc(lv.name)}</strong><span>${fmtNum(lv.pts)} PTS${lv.next ? ` · ${fmtNum(lv.next - lv.pts)} TO LV ${lv.n + 1}` : ' · MAX LEVEL'}</span></div>` +
    `<span class="ch-bar"><i style="width:${lv.pct}%"></i></span>`;
  document.getElementById('ch-grid').innerHTML = CHALLENGES.map(c => {
    let cur = 0;
    try { cur = c.prog(user) || 0; } catch (err) { cur = 0; }
    const done = cur >= c.target;
    const pct = Math.min(100, Math.round((cur / c.target) * 100));
    return `<div class="ch-card${done ? ' is-done' : ''}"><b>${c.emoji}</b><div><strong>${esc(c.name)}${done ? ' 🏆' : ''}</strong><span>${esc(c.desc)}</span>` +
      `<span class="ch-bar"><i style="width:${pct}%"></i></span><em>${fmtNum(Math.min(cur, c.target))} / ${fmtNum(c.target)} · +${c.reward} PTS</em></div></div>`;
  }).join('');
  document.getElementById('ch-month').textContent = new Date().toLocaleDateString('en-IN', { month: 'long' }).toUpperCase();
  renderBoard(user);
  document.getElementById('ch-rewards').innerHTML = REWARDS.map(r => {
    const unlocked = lv.n >= r.level;
    return `<div class="ch-reward${unlocked ? ' is-open' : ''}"><b>${unlocked ? r.emoji : '🔒'}</b><div><strong>${esc(r.text)}</strong><span>${unlocked ? 'UNLOCKED — CLAIM AT FRONT DESK' : `UNLOCKS AT LV ${r.level}`}</span></div></div>`;
  }).join('');
};

const renderBoard = me => {
  const box = document.getElementById('ch-board');
  if (!box || !me) return;
  document.querySelectorAll('#ch-tabs button').forEach(b => b.classList.toggle('is-on', b.dataset.board === boardMode));
  const month = dayKey().slice(0, 7);
  const rows = Object.values(readUsers())
    .filter(u => u && !isCoach(u) && u.name)
    .map(u => {
      let best = 0;
      try { best = attendanceStats(u).best || 0; } catch (err) { best = 0; }
      return {
        name: u.name, me: u.email === me.email,
        visits: (u.visits || []).filter(v => String(v.at || '').slice(0, 7) === month).length,
        points: pointsOf(u), streak: best
      };
    })
    .sort((a, b) => b[boardMode] - a[boardMode])
    .slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];
  const unit = boardMode === 'visits' ? 'visits' : boardMode === 'points' ? 'pts' : 'days';
  box.innerHTML = rows.length ? rows.map((r, i) =>
    `<div class="ch-row${r.me ? ' is-me' : ''}"><b>${medals[i] || `#${i + 1}`}</b><strong>${esc(r.name)}${r.me ? ' (YOU)' : ''}</strong><span>${fmtNum(r[boardMode])} ${unit}</span></div>`
  ).join('') : '<p class="log-empty">No members on this device yet.</p>';
  if (rows.length > 1) {
    const rank = rows.findIndex(r => r.me);
    if (rank >= 0) box.innerHTML += `<p class="ch-rank">You rank <strong>#${rank + 1}</strong> of ${rows.length} this month.</p>`;
  }
};

/* ---------- challenges events (bound once) ---------- */
(() => {
  const tabs = document.getElementById('ch-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', event => {
    const btn = event.target.closest('[data-board]');
    if (!btn) return;
    boardMode = btn.dataset.board;
    const user = currentUser();
    if (user) renderBoard(user);
  });
})();

// First paint — runs after every module above is defined.
updateAuthLinks();
renderProfile();
renderCoach();
