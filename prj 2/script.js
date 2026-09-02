const observer = new IntersectionObserver((entries) => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('in-view');
}), { threshold: 0.14 });

document.querySelectorAll('section, article, .reveal').forEach(el => observer.observe(el));
document.querySelectorAll('a[href^="#"]:not(.pillar)').forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href'));
  if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
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
    plansSummary.textContent = `SELECTED — ${card.dataset.plan.toUpperCase()} · ${card.dataset.price} / WEEK`;
    continueButton.disabled = false;
  }));

  continueButton.addEventListener('click', () => {
    if (!selectedCard) return;
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
      duration: 480,
      delay: delay + index * 55,
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
    if (membership) membership.scrollIntoView({ behavior: 'smooth' });
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
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth' }));
    }
  }));
}
