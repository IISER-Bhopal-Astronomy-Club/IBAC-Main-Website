/**
 * IBAC Cosmic Background & Skyroot-Inspired Mission Engine
 * Features:
 * - Authentic Morgan-Keenan spectral classification (HR Diagram) starfield on pitch-black space canvas
 * - Real deep-space galaxy plane with gentle parallax
 * - Earth Surface Photographic Horizon Header
 * - Moon Surface Photographic Touchdown Footer
 * - Skyroot-Inspired Aerospace Scrollbar: Modular rocket that jettisons strap-on boosters,
 *   core stage, and deploys lunar rover at the Moon footer. Zero altitude numbers.
 */

(function () {
  'use strict';

  if (window.__IBAC_COSMIC_INITIALIZED__) return;
  window.__IBAC_COSMIC_INITIALIZED__ = true;

  // Configuration
  const CONFIG = {
    starDensityDivisor: 2800, // Realistic stellar density
    minStars: 300,
    maxStars: 600,
    blinkingRatio: 0.3,
    meteorMinInterval: 4000,
    meteorMaxInterval: 8000,
    galaxies: [
      { id: 'spiral', class: 'galaxy-spiral', src: 'images/galaxies/galaxy1.jpg', alt: 'Whirlpool Spiral Galaxy' },
      { id: 'sombrero', class: 'galaxy-sombrero', src: 'images/galaxies/galaxy2.jpg', alt: 'Sombrero Galaxy' },
      { id: 'andromeda', class: 'galaxy-andromeda', src: 'images/galaxies/galaxy3.jpg', alt: 'Andromeda Galaxy' },
      { id: 'ring', class: 'galaxy-ring', src: 'images/galaxies/galaxy4.jpg', alt: 'Starburst Ring Galaxy' }
    ]
  };

  // Astronomical Spectral Classes (HR Diagram Morgan-Keenan classification)
  const HR_STAR_COLORS = [
    { r: 180, g: 210, b: 255 }, // Class O / B (Blue-White)
    { r: 245, g: 248, b: 255 }, // Class A (Vega Stark White)
    { r: 255, g: 250, b: 230 }, // Class F (Yellow-White)
    { r: 255, g: 235, b: 175 }, // Class G (Solar Gold)
    { r: 255, g: 190, b: 130 }, // Class K (Arcturus Orange)
    { r: 255, g: 130, b: 110 }  // Class M (Betelgeuse Red)
  ];

  // DOM Elements
  let universeContainer = null;
  let galaxyPlane = null;
  let canvas = null;
  let ctx = null;

  // Starfield State
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [];
  let shootingStars = [];
  let nextMeteorTimeout = null;
  let animFrameId = null;
  let lastTime = performance.now();
  let scrollY = window.scrollY || 0;
  let tickingScroll = false;

  // Skyroot Rocket Flight System State
  let rocketVehicleEl = null;
  let flightCorridorEl = null;

  /**
   * 1. DOM INITIALIZATION
   */
  function initDOM() {
    universeContainer = document.getElementById('cosmic-universe');
    if (!universeContainer) {
      universeContainer = document.createElement('div');
      universeContainer.id = 'cosmic-universe';
      universeContainer.className = 'cosmic-universe';
      document.body.prepend(universeContainer);
    }

    // Galaxy Plane
    galaxyPlane = universeContainer.querySelector('.galaxy-plane');
    if (!galaxyPlane) {
      galaxyPlane = document.createElement('div');
      galaxyPlane.className = 'galaxy-plane';
      galaxyPlane.id = 'galaxyPlane';

      CONFIG.galaxies.forEach(galaxy => {
        const galEl = document.createElement('div');
        galEl.className = `cosmic-galaxy ${galaxy.class}`;
        galEl.setAttribute('data-galaxy', galaxy.id);
        const img = document.createElement('img');
        img.src = galaxy.src;
        img.alt = galaxy.alt;
        img.loading = 'eager';
        galEl.appendChild(img);
        galaxyPlane.appendChild(galEl);
      });

      universeContainer.appendChild(galaxyPlane);
    }

    // Canvas
    canvas = document.getElementById('cosmicCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'cosmicCanvas';
      universeContainer.appendChild(canvas);
    }
    ctx = canvas.getContext('2d');

    setupEarthNavbar();
    setupMoonFooter();
    setupSkyrootRocketScrollbar();
  }

  /**
   * 2. EARTH HORIZON ON NAVBAR
   */
  function setupEarthNavbar() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    if (!header.querySelector('.earth-horizon-layer')) {
      const horizonLayer = document.createElement('div');
      horizonLayer.className = 'earth-horizon-layer';
      header.appendChild(horizonLayer);
    }

    const brandLogo = header.querySelector('.brand-logo');
    if (brandLogo && !header.querySelector('.earth-spaceport-badge')) {
      const spaceportBadge = document.createElement('div');
      spaceportBadge.className = 'earth-spaceport-badge';
      spaceportBadge.innerHTML = `<span class="earth-beacon"></span> Earth Station &bull; Pad 39A`;
      brandLogo.after(spaceportBadge);
    }
  }

  /**
   * 3. MOON HORIZON ON FOOTER (NO ALTITUDE TEXT)
   */
  function setupMoonFooter() {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    const innerFooter = footer.querySelector('.inner-footer');
    if (innerFooter && !footer.querySelector('.lunar-landing-site')) {
      const landingSite = document.createElement('div');
      landingSite.className = 'lunar-landing-site';
      landingSite.id = 'lunarLandingSite';
      landingSite.innerHTML = `
        <div class="lunar-site-meta">
          <span class="lunar-touchdown-badge">
            <i class="fa-solid fa-flag"></i> Tranquility Base &bull; Touchdown Site
          </span>
          <span style="color: #94a3b8; font-size: 0.82rem; font-family: 'Space Grotesk', sans-serif;">
            <i class="fa-solid fa-satellite-dish" style="color: #fbbf24;"></i> Telemetry: Touchdown Confirmed
          </span>
        </div>
        <div class="lunar-rover-unit">
          <div class="rover-svg-wrap">
            <svg viewBox="0 0 100 60" width="100%" height="100%">
              <rect x="20" y="24" width="55" height="14" rx="3" fill="#e2e8f0" stroke="#475569" stroke-width="1" />
              <circle cx="28" cy="12" r="9" fill="none" stroke="#fbbf24" stroke-width="2" />
              <line x1="28" y1="12" x2="35" y2="24" stroke="#fbbf24" stroke-width="1.8" />
              <rect x="52" y="10" width="22" height="7" rx="1.5" fill="#ca8a04" stroke="#fef08a" stroke-width="0.8" />
              <line x1="62" y1="17" x2="62" y2="24" stroke="#94a3b8" stroke-width="1.8" />
              <rect x="36" y="16" width="12" height="8" rx="2" fill="#334155" />
              <circle cx="25" cy="42" r="9" fill="#0f172a" stroke="#94a3b8" stroke-width="2" />
              <circle cx="25" cy="42" r="4" fill="#64748b" />
              <circle cx="70" cy="42" r="9" fill="#0f172a" stroke="#94a3b8" stroke-width="2" />
              <circle cx="70" cy="42" r="4" fill="#64748b" />
              <line x1="25" y1="36" x2="30" y2="28" stroke="#cbd5e1" stroke-width="2" />
              <line x1="70" y1="36" x2="65" y2="28" stroke="#cbd5e1" stroke-width="2" />
            </svg>
          </div>
          <div class="rover-caption">
            <strong>Autonomous Surface Explorer</strong>
            Active on Lunar Regolith
          </div>
        </div>
      `;
      innerFooter.before(landingSite);
    }
  }

  /**
   * 4. SKYROOT-INSPIRED MINIMALIST SCROLLBAR (ROCKET TO ROVER)
   * - Slender vertical hairline rail
   * - Vector rocket thumb that drops stages as user scrolls down
   * - Converts into Lunar Rover at the Moon footer
   * - ZERO ALTITUDE NUMBERS
   */
  function setupSkyrootRocketScrollbar() {
    flightCorridorEl = document.getElementById('rocketFlightCorridor');
    if (flightCorridorEl) return;

    flightCorridorEl = document.createElement('div');
    flightCorridorEl.className = 'rocket-flight-corridor';
    flightCorridorEl.id = 'rocketFlightCorridor';

    flightCorridorEl.innerHTML = `
      <!-- Top Earth Waypoint Node -->
      <div class="corridor-node-earth" id="corridorEarth" title="Earth - Click to return to top"></div>

      <!-- Slender Hairline Trajectory Track -->
      <div class="flight-trajectory-line" id="flightTrajectoryLine" title="Flight Trajectory (Click to navigate)"></div>

      <!-- Bottom Moon Waypoint Node -->
      <div class="corridor-node-moon" id="corridorMoon" title="Moon - Click to land at Tranquility Base"></div>

      <!-- Flying Rocket Vehicle (Scroll Thumb) -->
      <div class="flying-rocket-vehicle" id="flyingRocket">
        <svg class="rocket-svg" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#cbd5e1" />
              <stop offset="50%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#94a3b8" />
            </linearGradient>
            <linearGradient id="rocketBoosterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#94a3b8" />
              <stop offset="50%" stop-color="#f1f5f9" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>
            <linearGradient id="goldMliGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="50%" stop-color="#eab308" />
              <stop offset="100%" stop-color="#ca8a04" />
            </linearGradient>
            <linearGradient id="rocketFlameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="25%" stop-color="#fde047" />
              <stop offset="65%" stop-color="#f97316" />
              <stop offset="100%" stop-color="rgba(239, 68, 68, 0)" />
            </linearGradient>
          </defs>

          <!-- 1. SOLID ROCKET BOOSTERS (SRBs) - Jettison at ~18% scroll -->
          <g class="stage-srb stage-srb-left" id="stageSrbLeft">
            <path d="M 23 48 Q 26 34 29 48 L 29 106 L 23 106 Z" fill="url(#rocketBoosterGrad)" stroke="#1e293b" stroke-width="1" />
            <polygon points="21,106 31,106 28,112 24,112" fill="#0f172a" />
            <polygon class="rocket-flame booster-flame" points="23,112 29,112 26,128" fill="url(#rocketFlameGrad)" />
          </g>

          <g class="stage-srb stage-srb-right" id="stageSrbRight">
            <path d="M 71 48 Q 74 34 77 48 L 77 106 L 71 106 Z" fill="url(#rocketBoosterGrad)" stroke="#1e293b" stroke-width="1" />
            <polygon points="69,106 79,106 76,112 72,112" fill="#0f172a" />
            <polygon class="rocket-flame booster-flame" points="71,112 77,112 74,128" fill="url(#rocketFlameGrad)" />
          </g>

          <!-- 2. MAIN CORE STAGE 1 - Decouples at ~48% scroll -->
          <g class="stage-core" id="stageCore">
            <rect x="33" y="48" width="34" height="64" rx="2" fill="url(#rocketBodyGrad)" stroke="#1e293b" stroke-width="1.2" />
            <line x1="33" y1="70" x2="67" y2="70" stroke="#64748b" stroke-width="1" />
            <line x1="33" y1="92" x2="67" y2="92" stroke="#64748b" stroke-width="1" />
            <!-- Clean ISRO/Mission Tricolor -->
            <rect x="44" y="74" width="12" height="2" fill="#f97316" />
            <rect x="44" y="76" width="12" height="2" fill="#ffffff" />
            <rect x="44" y="78" width="12" height="2" fill="#16a34a" />
            <!-- Core Engine Nozzle -->
            <polygon points="38,112 62,112 58,118 42,118" fill="#0f172a" />
            <polygon class="rocket-flame core-flame" id="coreFlame" points="40,118 60,118 50,144" fill="url(#rocketFlameGrad)" />
          </g>

          <!-- 3. SERVICE / ORBITAL MODULE - Decouples at ~75% scroll -->
          <g class="stage-service" id="stageService">
            <rect x="37" y="34" width="26" height="15" rx="1.5" fill="#334155" stroke="#0f172a" stroke-width="1" />
            <!-- Solar Array Panels -->
            <rect x="14" y="38" width="22" height="6" rx="1" fill="#0284c7" stroke="#38bdf8" stroke-width="0.8" />
            <rect x="64" y="38" width="22" height="6" rx="1" fill="#0284c7" stroke="#38bdf8" stroke-width="0.8" />
          </g>

          <!-- 4. LUNAR LANDER MODULE (Payload) -->
          <g class="stage-lander" id="stageLander">
            <!-- Command Module Nose Cone -->
            <path d="M 50 12 L 62 34 L 38 34 Z" fill="url(#rocketBodyGrad)" stroke="#1e293b" stroke-width="1.2" />
            <!-- Gold MLI Thermal Foil Descent Stage -->
            <rect x="40" y="28" width="20" height="9" rx="1.5" fill="url(#goldMliGrad)" stroke="#a16207" stroke-width="0.8" />
            <!-- Spider Landing Gear Legs -->
            <g id="landerSpiderLegs">
              <line x1="40" y1="36" x2="30" y2="46" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" />
              <line x1="60" y1="36" x2="70" y2="46" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" />
              <circle cx="30" cy="46" r="2" fill="#64748b" />
              <circle cx="70" cy="46" r="2" fill="#64748b" />
            </g>
          </g>

          <!-- 5. LUNAR ROVER (Revealed & Active at Moon Footer) -->
          <g class="stage-rover" id="stageRover" style="opacity: 0; display: none;">
            <rect x="25" y="26" width="50" height="12" rx="3" fill="#ffffff" stroke="#1e293b" stroke-width="1.2" />
            <!-- Rover Antenna Mast -->
            <line x1="34" y1="14" x2="34" y2="26" stroke="#94a3b8" stroke-width="1.5" />
            <circle cx="34" cy="14" r="3" fill="#fbbf24" />
            <!-- Rover Solar Panel -->
            <rect x="52" y="16" width="18" height="6" rx="1" fill="#ca8a04" stroke="#fef08a" stroke-width="0.6" />
            <!-- Rover Wheels -->
            <circle cx="32" cy="40" r="6" fill="#0f172a" stroke="#94a3b8" stroke-width="1.8" />
            <circle cx="68" cy="40" r="6" fill="#0f172a" stroke="#94a3b8" stroke-width="1.8" />
          </g>
        </svg>
      </div>
    `;

    document.body.appendChild(flightCorridorEl);
    rocketVehicleEl = document.getElementById('flyingRocket');

    // Smooth navigation click on top Earth waypoint
    const earthNode = document.getElementById('corridorEarth');
    if (earthNode) {
      earthNode.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Smooth navigation click on bottom Moon waypoint
    const moonNode = document.getElementById('corridorMoon');
    if (moonNode) {
      moonNode.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      });
    }

    // Click anywhere on trajectory track line to scrub position
    const trackLine = document.getElementById('flightTrajectoryLine');
    if (trackLine) {
      trackLine.addEventListener('click', (e) => {
        const rect = trackLine.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: ratio * maxScroll, behavior: 'smooth' });
      });
    }

    // Drag rocket thumb
    let isDraggingRocket = false;
    if (rocketVehicleEl) {
      rocketVehicleEl.addEventListener('mousedown', (e) => {
        isDraggingRocket = true;
        e.preventDefault();
      });
      window.addEventListener('mouseup', () => { isDraggingRocket = false; });
      window.addEventListener('mousemove', (e) => {
        if (!isDraggingRocket) return;
        const corridorRect = flightCorridorEl.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientY - corridorRect.top) / corridorRect.height));
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: ratio * maxScroll });
      });
    }

    updateRocketPosition();
  }

  /**
   * 5. UPDATE ROCKET POSITION & PROGRESSIVE STAGING (NO ALTITUDE NUMBERS)
   */
  function updateRocketPosition() {
    if (!rocketVehicleEl || !flightCorridorEl) return;

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

    const corridorHeight = flightCorridorEl.clientHeight;
    const rocketY = progress * corridorHeight;
    rocketVehicleEl.style.top = `${rocketY}px`;

    const srbLeft = document.getElementById('stageSrbLeft');
    const srbRight = document.getElementById('stageSrbRight');
    const stageCore = document.getElementById('stageCore');
    const stageService = document.getElementById('stageService');
    const stageLander = document.getElementById('stageLander');
    const stageRover = document.getElementById('stageRover');
    const coreFlame = document.getElementById('coreFlame');
    const boosterFlames = document.querySelectorAll('.booster-flame');

    // Staging thresholds:
    // 0.00 - 0.18: Earth ascent, full rocket configuration
    // 0.18 - 0.48: Solid rocket boosters decoupled
    // 0.48 - 0.75: Main core decoupled, second stage orbital cruise
    // 0.75 - 0.92: Service module decoupled, lunar descent lander configuration
    // 0.92 - 1.00: Lunar touchdown at Moon footer -> Rover deployed!

    if (progress < 0.18) {
      if (srbLeft) srbLeft.classList.remove('jettisoned-srb-left');
      if (srbRight) srbRight.classList.remove('jettisoned-srb-right');
      if (stageCore) stageCore.classList.remove('jettisoned-core');
      if (stageService) stageService.classList.remove('jettisoned-service');
      if (stageLander) { stageLander.style.display = 'block'; stageLander.style.opacity = '1'; }
      if (stageRover) { stageRover.style.display = 'none'; stageRover.style.opacity = '0'; }
      boosterFlames.forEach(f => { f.style.display = 'block'; });
      if (coreFlame) coreFlame.style.display = 'block';
    } else if (progress < 0.48) {
      if (srbLeft) srbLeft.classList.add('jettisoned-srb-left');
      if (srbRight) srbRight.classList.add('jettisoned-srb-right');
      if (stageCore) stageCore.classList.remove('jettisoned-core');
      if (stageService) stageService.classList.remove('jettisoned-service');
      if (stageLander) { stageLander.style.display = 'block'; stageLander.style.opacity = '1'; }
      if (stageRover) { stageRover.style.display = 'none'; stageRover.style.opacity = '0'; }
      boosterFlames.forEach(f => { f.style.display = 'none'; });
      if (coreFlame) coreFlame.style.display = 'block';
    } else if (progress < 0.75) {
      if (srbLeft) srbLeft.classList.add('jettisoned-srb-left');
      if (srbRight) srbRight.classList.add('jettisoned-srb-right');
      if (stageCore) stageCore.classList.add('jettisoned-core');
      if (stageService) stageService.classList.remove('jettisoned-service');
      if (stageLander) { stageLander.style.display = 'block'; stageLander.style.opacity = '1'; }
      if (stageRover) { stageRover.style.display = 'none'; stageRover.style.opacity = '0'; }
      boosterFlames.forEach(f => { f.style.display = 'none'; });
      if (coreFlame) coreFlame.style.display = 'none';
    } else if (progress < 0.92) {
      if (srbLeft) srbLeft.classList.add('jettisoned-srb-left');
      if (srbRight) srbRight.classList.add('jettisoned-srb-right');
      if (stageCore) stageCore.classList.add('jettisoned-core');
      if (stageService) stageService.classList.add('jettisoned-service');
      if (stageLander) { stageLander.style.display = 'block'; stageLander.style.opacity = '1'; }
      if (stageRover) { stageRover.style.display = 'none'; stageRover.style.opacity = '0'; }
      boosterFlames.forEach(f => { f.style.display = 'none'; });
      if (coreFlame) coreFlame.style.display = 'none';
    } else {
      // Touchdown at Moon footer: Deploy Lunar Rover!
      if (srbLeft) srbLeft.classList.add('jettisoned-srb-left');
      if (srbRight) srbRight.classList.add('jettisoned-srb-right');
      if (stageCore) stageCore.classList.add('jettisoned-core');
      if (stageService) stageService.classList.add('jettisoned-service');
      if (stageLander) {
        stageLander.style.transition = 'opacity 0.4s ease';
        stageLander.style.opacity = '0';
        setTimeout(() => { if (stageLander) stageLander.style.display = 'none'; }, 400);
      }
      if (stageRover) {
        stageRover.style.display = 'block';
        stageRover.style.opacity = '1';
        stageRover.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      }
      boosterFlames.forEach(f => { f.style.display = 'none'; });
      if (coreFlame) coreFlame.style.display = 'none';
    }
  }

  /**
   * 6. CANVAS STARFIELD WITH MORGAN-KEENAN SPECTRAL CLASSES
   */
  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (canvas) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    generateStars();
  }

  function generateStars() {
    stars = [];
    const targetCount = Math.min(
      CONFIG.maxStars,
      Math.max(CONFIG.minStars, Math.floor((width * height) / CONFIG.starDensityDivisor))
    );

    for (let i = 0; i < targetCount; i++) {
      const colorDef = HR_STAR_COLORS[Math.floor(Math.random() * HR_STAR_COLORS.length)];
      const radiusBase = Math.random() < 0.92 ? (Math.random() * 0.9 + 0.4) : (Math.random() * 1.3 + 1.2);
      const isBlinking = Math.random() < CONFIG.blinkingRatio;

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: 0,
        baseY: 0,
        r: radiusBase,
        baseAlpha: Math.random() * 0.5 + 0.35,
        alpha: 0.6,
        color: colorDef,
        hasSpikes: radiusBase > 1.8 && Math.random() < 0.4,
        isBlinking: isBlinking,
        blinkSpeed: Math.random() * 0.002 + 0.0008,
        blinkPhase: Math.random() * Math.PI * 2,
        parallaxFactor: (radiusBase / 2.5) * 0.035
      });
    }

    stars.forEach(s => {
      s.baseX = s.x;
      s.baseY = s.y;
    });
  }

  function spawnMeteor() {
    const startX = Math.random() * width * 0.8 + width * 0.1;
    const startY = Math.random() * (height * 0.35);
    const angle = (Math.PI / 4) + (Math.random() * 0.25 - 0.12);
    const speed = Math.random() * 800 + 700;
    const length = Math.random() * 120 + 80;

    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: length,
      alpha: 1.0,
      decay: Math.random() * 0.02 + 0.015,
      color: Math.random() < 0.6 ? '#ffffff' : '#fbbf24'
    });

    scheduleNextMeteor();
  }

  function scheduleNextMeteor() {
    if (nextMeteorTimeout) clearTimeout(nextMeteorTimeout);
    const interval = Math.random() * (CONFIG.meteorMaxInterval - CONFIG.meteorMinInterval) + CONFIG.meteorMinInterval;
    nextMeteorTimeout = setTimeout(spawnMeteor, interval);
  }

  function render(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Stars
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      if (star.isBlinking) {
        star.alpha = star.baseAlpha + Math.sin(now * star.blinkSpeed + star.blinkPhase) * 0.25;
      } else {
        star.alpha = star.baseAlpha;
      }

      const drawY = (star.baseY - scrollY * star.parallaxFactor) % height;
      const finalY = drawY < 0 ? drawY + height : drawY;

      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(1, star.alpha));
      ctx.fillStyle = `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`;

      ctx.beginPath();
      ctx.arc(star.x, finalY, star.r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle diffraction spike for prominent stars
      if (star.hasSpikes && star.alpha > 0.5) {
        ctx.strokeStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${star.alpha * 0.4})`;
        ctx.lineWidth = 0.75;
        const spikeLen = star.r * 4.5;
        ctx.beginPath();
        ctx.moveTo(star.x - spikeLen, finalY);
        ctx.lineTo(star.x + spikeLen, finalY);
        ctx.moveTo(star.x, finalY - spikeLen);
        ctx.lineTo(star.x, finalY + spikeLen);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Meteors
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const m = shootingStars[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.alpha -= m.decay;

      if (m.alpha <= 0 || m.x > width + 100 || m.y > height + 100) {
        shootingStars.splice(i, 1);
        continue;
      }

      const tailX = m.x - (m.vx / 800) * m.length;
      const tailY = m.y - (m.vy / 800) * m.length;

      ctx.save();
      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, m.color);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.restore();
    }

    animFrameId = requestAnimationFrame(render);
  }

  function onScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    if (!tickingScroll) {
      window.requestAnimationFrame(() => {
        updateRocketPosition();
        tickingScroll = false;
      });
      tickingScroll = true;
    }
  }

  // Window Event Listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    updateRocketPosition();
  });

  // Kickstart
  function boot() {
    initDOM();
    resizeCanvas();
    scheduleNextMeteor();
    animFrameId = requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
