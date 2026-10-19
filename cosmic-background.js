/**
 * IBAC Cosmic Background Engine
 * Features:
 * - Dynamic Starfield with blinking and non-blinking stars of varied sizes
 * - Telescope-style diffraction spikes & glowing halos on bright stars
 * - Random shooting stars (meteors) with glowing heads, fading plasma tails, and spark dust
 * - Deep-space galaxy background images with smooth cosmic blend & gentle parallax
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__IBAC_COSMIC_INITIALIZED__) return;
  window.__IBAC_COSMIC_INITIALIZED__ = true;

  // Configuration
  const CONFIG = {
    starDensityDivisor: 3400, // Pixels per star
    minStars: 220,
    maxStars: 520,
    blinkingRatio: 0.45,      // ~45% blinking, ~55% non-blinking steady lights
    meteorMinInterval: 2000,  // Min ms between shooting stars
    meteorMaxInterval: 4500,  // Max ms between shooting stars
    galaxies: [
      { id: 'spiral', class: 'galaxy-spiral', src: 'images/galaxies/galaxy1.jpg', alt: 'Whirlpool Spiral Galaxy' },
      { id: 'sombrero', class: 'galaxy-sombrero', src: 'images/galaxies/galaxy2.jpg', alt: 'Sombrero Galaxy' },
      { id: 'andromeda', class: 'galaxy-andromeda', src: 'images/galaxies/galaxy3.jpg', alt: 'Andromeda Galaxy' },
      { id: 'ring', class: 'galaxy-ring', src: 'images/galaxies/galaxy4.jpg', alt: 'Starburst Ring Galaxy' }
    ]
  };

  // Color palettes for stars (astronomical spectral classes)
  const STAR_COLORS = [
    { r: 255, g: 255, b: 255, name: 'white' },        // Pure diamond white
    { r: 215, g: 238, b: 255, name: 'ice-blue' },     // Spectral B-type
    { r: 140, g: 225, b: 255, name: 'cyan' },         // Vibrant electric cyan
    { r: 255, g: 242, b: 200, name: 'gold' },         // Solar G-type
    { r: 255, g: 215, b: 195, name: 'amber' },        // Warm K-type
    { r: 225, g: 205, b: 255, name: 'violet' }        // Ionized nebula tint
  ];

  // DOM Elements
  let universeContainer = null;
  let galaxyPlane = null;
  let canvas = null;
  let ctx = null;

  // State
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

  /**
   * Ensure Universe DOM structure exists
   */
  function initDOM() {
    universeContainer = document.getElementById('cosmic-universe');
    if (!universeContainer) {
      universeContainer = document.createElement('div');
      universeContainer.id = 'cosmic-universe';
      universeContainer.className = 'cosmic-universe';
      document.body.prepend(universeContainer);
    }

    // Build Galaxy Plane if not present
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
  }

  /**
   * Handle Canvas Resize
   */
  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
    createStarfield();
  }

  /**
   * Generate Stars with distinct blinking vs non-blinking behaviors and diverse sizes
   */
  function createStarfield() {
    const starCount = Math.min(
      CONFIG.maxStars,
      Math.max(CONFIG.minStars, Math.floor((width * height) / CONFIG.starDensityDivisor))
    );

    stars = [];

    for (let i = 0; i < starCount; i++) {
      const isBlinking = Math.random() < CONFIG.blinkingRatio;
      const roll = Math.random();

      let radius, baseAlpha, hasSpikes = false, hasGlow = false;

      // Size distribution:
      // ~50% Micro faint background stars
      // ~30% Small standard stars
      // ~15% Medium bright stars
      // ~5%  Major telescope beacon stars with diffraction spikes
      if (roll < 0.50) {
        radius = 0.5 + Math.random() * 0.5; // 0.5 - 1.0px
        baseAlpha = 0.35 + Math.random() * 0.45;
      } else if (roll < 0.80) {
        radius = 1.0 + Math.random() * 0.7; // 1.0 - 1.7px
        baseAlpha = 0.60 + Math.random() * 0.35;
        hasGlow = Math.random() < 0.3;
      } else if (roll < 0.95) {
        radius = 1.7 + Math.random() * 0.9; // 1.7 - 2.6px
        baseAlpha = 0.75 + Math.random() * 0.25;
        hasGlow = true;
      } else {
        radius = 2.7 + Math.random() * 1.1; // 2.7 - 3.8px
        baseAlpha = 0.85 + Math.random() * 0.15;
        hasGlow = true;
        hasSpikes = true; // 4-pointed cross diffraction spikes
      }

      // Color selection
      const colorObj = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: radius,
        color: colorObj,
        isBlinking: isBlinking,
        baseAlpha: baseAlpha,
        // Blinking parameters
        minAlpha: isBlinking ? (baseAlpha * (0.15 + Math.random() * 0.25)) : baseAlpha,
        maxAlpha: isBlinking ? Math.min(1.0, baseAlpha * (1.1 + Math.random() * 0.3)) : baseAlpha,
        blinkSpeed: 0.8 + Math.random() * 3.4, // Radians per sec
        blinkPhase: Math.random() * Math.PI * 2,
        blinkStyle: Math.random() < 0.25 ? 'shimmer' : 'sine', // Subtle occasional sparkle vs smooth pulse
        hasGlow: hasGlow,
        hasSpikes: hasSpikes,
        // Faint cosmic drift
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02
      });
    }
  }

  /**
   * Spawn a shooting star (meteor) at random intervals
   */
  function spawnShootingStar() {
    if (document.hidden) return;

    // Angle: typically streaking diagonally down (between 25° and 60°)
    const angleDeg = 30 + Math.random() * 35;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Start position: top edge or upper half of left/right edges
    const startSide = Math.random();
    let startX, startY;

    if (startSide < 0.7) {
      // Start from top
      startX = Math.random() * width * 0.9;
      startY = -20;
    } else {
      // Start from upper left
      startX = -20;
      startY = Math.random() * (height * 0.4);
    }

    const speed = 15 + Math.random() * 12; // 15 - 27 px per frame
    const length = 140 + Math.random() * 160; // Tail length
    const maxLife = 40 + Math.floor(Math.random() * 30); // 40 - 70 frames

    // Color: White core with cyan, electric blue, or golden trail
    const meteorColorRoll = Math.random();
    let trailColor;
    if (meteorColorRoll < 0.6) {
      trailColor = '0, 220, 255'; // Cyan
    } else if (meteorColorRoll < 0.85) {
      trailColor = '100, 160, 255'; // Electric blue
    } else {
      trailColor = '255, 215, 140'; // Warm gold
    }

    shootingStars.push({
      x: startX,
      y: startY,
      dx: Math.cos(angleRad) * speed,
      dy: Math.sin(angleRad) * speed,
      angleRad: angleRad,
      length: length,
      thickness: 1.6 + Math.random() * 1.2,
      trailColor: trailColor,
      life: 0,
      maxLife: maxLife,
      particles: []
    });

    // 15% chance to spawn an accompanying secondary twin meteor
    if (Math.random() < 0.15) {
      setTimeout(() => {
        shootingStars.push({
          x: startX + (Math.random() - 0.5) * 80,
          y: startY + (Math.random() - 0.5) * 40,
          dx: Math.cos(angleRad) * (speed * 0.95),
          dy: Math.sin(angleRad) * (speed * 0.95),
          angleRad: angleRad,
          length: length * 0.85,
          thickness: 1.4,
          trailColor: trailColor,
          life: 0,
          maxLife: maxLife * 0.9,
          particles: []
        });
      }, 150 + Math.random() * 200);
    }

    scheduleNextMeteor();
  }

  function scheduleNextMeteor() {
    if (nextMeteorTimeout) clearTimeout(nextMeteorTimeout);
    const delay = CONFIG.meteorMinInterval + Math.random() * (CONFIG.meteorMaxInterval - CONFIG.meteorMinInterval);
    nextMeteorTimeout = setTimeout(spawnShootingStar, delay);
  }

  /**
   * Draw diffraction spike cross on major stars
   */
  function drawDiffractionSpike(context, x, y, size, alpha, color) {
    const spikeLen = size * 5.5;
    const spikeWidth = 0.75;

    context.save();
    context.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.75})`;
    context.lineWidth = spikeWidth;

    // Horizontal spike
    context.beginPath();
    context.moveTo(x - spikeLen, y);
    context.lineTo(x + spikeLen, y);
    context.stroke();

    // Vertical spike
    context.beginPath();
    context.moveTo(x, y - spikeLen);
    context.lineTo(x, y + spikeLen);
    context.stroke();

    // Inner bright core
    context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(x - (spikeLen * 0.4), y);
    context.lineTo(x + (spikeLen * 0.4), y);
    context.moveTo(x, y - (spikeLen * 0.4));
    context.lineTo(x, y + (spikeLen * 0.4));
    context.stroke();

    context.restore();
  }

  /**
   * Main Render Loop
   */
  function render(time) {
    animFrameId = requestAnimationFrame(render);

    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    // 1. Render Stars
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      // Slight drift
      star.x += star.vx;
      star.y += star.vy;
      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;
      if (star.y < 0) star.y = height;
      if (star.y > height) star.y = 0;

      let currentAlpha;

      if (!star.isBlinking) {
        // Steady non-blinking light
        currentAlpha = star.baseAlpha;
      } else {
        // Blinking light with sinusoidal or shimmering oscillations
        const cycle = Math.sin((time / 1000) * star.blinkSpeed + star.blinkPhase);
        if (star.blinkStyle === 'shimmer') {
          // Add a high-frequency micro harmonic for organic sparkling
          const shimmer = Math.sin((time / 1000) * (star.blinkSpeed * 2.8) + star.blinkPhase * 1.5) * 0.15;
          const normalized = Math.max(0, Math.min(1, 0.5 + 0.5 * cycle + shimmer));
          currentAlpha = star.minAlpha + (star.maxAlpha - star.minAlpha) * normalized;
        } else {
          const normalized = 0.5 + 0.5 * cycle;
          currentAlpha = star.minAlpha + (star.maxAlpha - star.minAlpha) * normalized;
        }
      }

      // Draw Star Core
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${currentAlpha})`;
      ctx.fill();

      // Soft Glow Halo for medium & bright stars
      if (star.hasGlow && currentAlpha > 0.4) {
        const glowRadius = star.radius * 3.2;
        const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
        grad.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${currentAlpha * 0.5})`);
        grad.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${currentAlpha * 0.15})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Diffraction Spikes for major stars
      if (star.hasSpikes && currentAlpha > 0.5) {
        drawDiffractionSpike(ctx, star.x, star.y, star.radius, currentAlpha, star.color);
      }
    }

    // 2. Render & Update Shooting Stars (Meteors)
    for (let m = shootingStars.length - 1; m >= 0; m--) {
      const meteor = shootingStars[m];
      meteor.life++;

      // Progress alpha: fades in fast, stays luminous, fades out toward end
      const lifeRatio = meteor.life / meteor.maxLife;
      let meteorAlpha = 1;
      if (lifeRatio < 0.15) {
        meteorAlpha = lifeRatio / 0.15;
      } else if (lifeRatio > 0.65) {
        meteorAlpha = Math.max(0, 1 - (lifeRatio - 0.65) / 0.35);
      }

      // Move meteor
      meteor.x += meteor.dx;
      meteor.y += meteor.dy;

      // Tail coordinates
      const tailX = meteor.x - Math.cos(meteor.angleRad) * meteor.length;
      const tailY = meteor.y - Math.sin(meteor.angleRad) * meteor.length;

      // Draw Meteor Trail
      const trailGrad = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
      trailGrad.addColorStop(0, `rgba(255, 255, 255, ${meteorAlpha})`);
      trailGrad.addColorStop(0.18, `rgba(${meteor.trailColor}, ${meteorAlpha * 0.95})`);
      trailGrad.addColorStop(0.65, `rgba(${meteor.trailColor}, ${meteorAlpha * 0.35})`);
      trailGrad.addColorStop(1, `rgba(${meteor.trailColor}, 0)`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(meteor.x, meteor.y);
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = meteor.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glowing Head
      const headGlow = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, meteor.thickness * 4.5);
      headGlow.addColorStop(0, `rgba(255, 255, 255, ${meteorAlpha})`);
      headGlow.addColorStop(0.35, `rgba(${meteor.trailColor}, ${meteorAlpha * 0.8})`);
      headGlow.addColorStop(1, `rgba(${meteor.trailColor}, 0)`);

      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, meteor.thickness * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = headGlow;
      ctx.fill();

      // Emit spark dust particles
      if (Math.random() < 0.6 && meteorAlpha > 0.3) {
        meteor.particles.push({
          x: meteor.x - Math.cos(meteor.angleRad) * (Math.random() * 25),
          y: meteor.y - Math.sin(meteor.angleRad) * (Math.random() * 25),
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          alpha: meteorAlpha * 0.9,
          decay: 0.05 + Math.random() * 0.04,
          size: 0.8 + Math.random() * 1.0
        });
      }

      // Draw & update spark dust
      for (let p = meteor.particles.length - 1; p >= 0; p--) {
        const pt = meteor.particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          meteor.particles.splice(p, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${meteor.trailColor}, ${pt.alpha})`;
        ctx.fill();
      }

      ctx.restore();

      // Terminate when dead or offscreen
      if (
        meteor.life >= meteor.maxLife ||
        meteor.x > width + 300 ||
        meteor.y > height + 300
      ) {
        shootingStars.splice(m, 1);
      }
    }
  }

  /**
   * Subtle Parallax Drift for Galaxy Layer on Page Scroll
   */
  function handleScroll() {
    scrollY = window.scrollY || window.pageYOffset;
    if (!tickingScroll) {
      window.requestAnimationFrame(() => {
        if (galaxyPlane) {
          const parallaxOffset = scrollY * -0.06; // Slow majestic parallax
          galaxyPlane.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
        }
        tickingScroll = false;
      });
      tickingScroll = true;
    }
  }

  /**
   * Visibility Change Handler (save CPU / GPU when tab is inactive)
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (nextMeteorTimeout) clearTimeout(nextMeteorTimeout);
    } else {
      lastTime = performance.now();
      animFrameId = requestAnimationFrame(render);
      scheduleNextMeteor();
    }
  }

  /**
   * Initialization
   */
  function init() {
    initDOM();
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial shooting star kick-off
    scheduleNextMeteor();

    // Start render loop
    lastTime = performance.now();
    animFrameId = requestAnimationFrame(render);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
