/* ============================================================
   JESSE PAUL WARREN - PORTFOLIO SCRIPTS
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;

  /* ---- Theme Toggle ---- */
  const themeToggle = document.getElementById('themeToggle');
  const htmlEl = document.documentElement;

  // Apply saved preference before paint
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') htmlEl.setAttribute('data-theme', 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = htmlEl.getAttribute('data-theme') === 'dark';
      const next   = isDark ? 'light' : 'dark';

      // Pass the toggle's screen position as the ripple origin
      const rect = themeToggle.getBoundingClientRect();
      htmlEl.style.setProperty('--vt-x', `${rect.left + rect.width  / 2}px`);
      htmlEl.style.setProperty('--vt-y', `${rect.top  + rect.height / 2}px`);

      const applyTheme = () => {
        if (next === 'dark') {
          htmlEl.setAttribute('data-theme', 'dark');
        } else {
          htmlEl.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', next);
      };

      // Use View Transitions API for the cinematic circle reveal
      if (!prefersReducedMotion && document.startViewTransition) {
        document.startViewTransition(applyTheme);
      } else {
        applyTheme();
      }
    });
  }


  /* ---- Scroll-based nav frosting ---- */
  const nav = document.querySelector('.nav');

  function updateNav() {
    if (!nav) return;

    if (window.scrollY > 24) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();


  /* ---- IntersectionObserver reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealEls.forEach((el) => {
      observer.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }


  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = nav ? nav.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 24;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });


  /* ---- Custom cursor — context-aware shape-shifter ---- */
  if (canHover && !prefersReducedMotion) {
    const cursorDot   = document.createElement('div');
    const cursorRing  = document.createElement('div');
    const cursorLabel = document.createElement('span');

    cursorDot.className   = 'cursor-dot';
    cursorRing.className  = 'cursor-ring';
    cursorLabel.className = 'cursor-label';
    cursorLabel.textContent = 'View';

    cursorRing.appendChild(cursorLabel);
    document.body.append(cursorRing, cursorDot);
    document.body.classList.add('has-custom-cursor');

    // Separate positions: dot is fast, ring trails behind
    let mouseX = window.innerWidth  * 0.5;
    let mouseY = window.innerHeight * 0.25;
    let dotX   = mouseX, dotY = mouseY;
    let ringX  = mouseX, ringY = mouseY;
    let cursorVisible = false;

    // Context selectors — checked in priority order
    const SEL_LINK = 'a, button, [role="button"]';
    const SEL_CARD = '.project-card';
    const SEL_TEXT = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, label';

    function setCursorState(state) {
      if (document.body.dataset.cursor !== state) {
        document.body.dataset.cursor = state;
      }
    }

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Drive the ambient body glow
      document.body.style.setProperty('--cursor-x', `${(e.clientX / window.innerWidth)  * 100}%`);
      document.body.style.setProperty('--cursor-y', `${(e.clientY / window.innerHeight) * 100}%`);

      if (!cursorVisible) {
        cursorVisible = true;
        document.body.classList.add('cursor-visible');
      }

      // Priority: link > card > text > default
      const t = e.target;
      if      (t.closest(SEL_LINK)) setCursorState('link');
      else if (t.closest(SEL_CARD)) setCursorState('card');
      else if (t.closest(SEL_TEXT)) setCursorState('text');
      else                          setCursorState('');
    }, { passive: true });

    const hideCursor = () => {
      cursorVisible = false;
      document.body.classList.remove('cursor-visible');
      setCursorState('');
    };

    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) hideCursor(); });
    window.addEventListener('blur',  hideCursor);
    window.addEventListener('focus', () => {
      if (!cursorVisible) {
        cursorVisible = true;
        document.body.classList.add('cursor-visible');
      }
    });

    const animateCursor = () => {
      // Dot: snappy (follows mouse closely)
      dotX  += (mouseX - dotX)  * 0.28;
      dotY  += (mouseY - dotY)  * 0.28;

      // Ring: snaps tight on links (so clicks feel precise), trails elsewhere
      const isLink = document.body.dataset.cursor === 'link';
      const ringLerp = isLink ? 0.28 : 0.1;
      ringX += (mouseX - ringX) * ringLerp;
      ringY += (mouseY - ringY) * ringLerp;

      cursorDot.style.transform  = `translate3d(${dotX}px,  ${dotY}px,  0) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      window.requestAnimationFrame(animateCursor);
    };

    window.requestAnimationFrame(animateCursor);
  }


  /* ---- Subtle parallax on hero name (desktop only) ---- */
  const heroName = document.querySelector('.hero-name');
  const heroSection = document.querySelector('.hero');

  if (heroName && heroSection && canHover && !prefersReducedMotion) {
    let scrollY = window.scrollY;
    let ticking = false;

    const renderHeroParallax = () => {
      const heroH = heroSection.offsetHeight;
      const offset = Math.min(scrollY, heroH) * 0.06;
      heroName.style.transform = `translateY(${offset}px)`;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;

      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(renderHeroParallax);
      }
    }, { passive: true });

    renderHeroParallax();
  }


  /* ---- Project card tilt micro-interaction (desktop) ---- */
  const cards = document.querySelectorAll('.project-card');

  if (canHover && !prefersReducedMotion) {
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        card.style.setProperty('--card-tilt-x', `${dx * 3}deg`);
        card.style.setProperty('--card-tilt-y', `${-dy * 2}deg`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.removeProperty('--card-tilt-x');
        card.style.removeProperty('--card-tilt-y');
      });
    });
  }


  /* ---- Article hover: subtle flow between rows ---- */
  const projects = document.querySelectorAll('.project');

  if (canHover && !prefersReducedMotion) {
    projects.forEach((proj) => {
      proj.addEventListener('mouseenter', () => {
        projects.forEach((other) => {
          if (other !== proj) {
            other.style.opacity = '0.62';
            other.style.transform = 'translateY(4px)';
          }
        });
      });

      proj.addEventListener('mouseleave', () => {
        projects.forEach((other) => {
          other.style.opacity = '';
          other.style.transform = '';
        });
      });
    });
  }


  /* ---- Playground: fisheye mosaic + FLIP lightbox ---- */
  const pgMosaic    = document.getElementById('pgMosaic');
  const pgOverlay   = document.getElementById('pgOverlay');
  const pgModal     = document.getElementById('pgModal');
  const pgModalClose = document.getElementById('pgModalClose');

  if (pgMosaic && pgOverlay) {
    const tiles = Array.from(pgMosaic.querySelectorAll('.pg-tile'));

    // Pre-computed tile centers in page coordinates (stable across scroll)
    let tileCenters = [];
    const computeCenters = () => {
      tileCenters = tiles.map(t => {
        const r = t.getBoundingClientRect();
        return {
          x:  r.left + r.width  / 2 + window.scrollX,
          y:  r.top  + r.height / 2 + window.scrollY,
          el: t,
        };
      });
    };
    // Wait one frame so fonts/layout are settled
    requestAnimationFrame(computeCenters);
    window.addEventListener('resize', computeCenters, { passive: true });

    // Fisheye constants
    const PEAK  = 2.0;   // max scale at cursor
    const EDGE  = 0.88;  // peripheral compression
    const SIGMA = 110;   // px — lens spread (Gaussian σ)
    const SIG2  = 2 * SIGMA * SIGMA;

    // Per-tile scale state (avoids parsing transform strings)
    const tileScales = new Array(tiles.length).fill(1.0);

    // Cursor tracking
    let cursorX = 0, cursorY = 0;
    let lerpX   = 0, lerpY   = 0;
    let isOver  = false;
    let rafId   = null;

    const tick = () => {
      if (isOver) {
        lerpX += (cursorX - lerpX) * 0.15;
        lerpY += (cursorY - lerpY) * 0.15;

        tileCenters.forEach(({ x, y, el }, i) => {
          const dx    = x - lerpX;
          const dy    = y - lerpY;
          const dist2 = dx * dx + dy * dy;
          tileScales[i] = EDGE + (PEAK - EDGE) * Math.exp(-dist2 / SIG2);
          el.style.transform = `scale(${tileScales[i].toFixed(3)})`;
          el.style.zIndex    = tileScales[i] > 1.5 ? '10' : tileScales[i] > 1.1 ? '5' : '1';
        });
        rafId = requestAnimationFrame(tick);

      } else {
        // Ease all tiles back to 1.0
        let anyMoving = false;
        tileCenters.forEach(({ el }, i) => {
          if (Math.abs(tileScales[i] - 1.0) > 0.003) {
            tileScales[i] += (1.0 - tileScales[i]) * 0.12;
            el.style.transform = `scale(${tileScales[i].toFixed(3)})`;
            el.style.zIndex    = tileScales[i] > 1.1 ? '5' : '';
            anyMoving = true;
          } else if (tileScales[i] !== 1.0) {
            tileScales[i]      = 1.0;
            el.style.transform = '';
            el.style.zIndex    = '';
          }
        });
        rafId = anyMoving ? requestAnimationFrame(tick) : null;
      }
    };

    // Listen on the whole section so edge-breaker tiles (negative left) still trigger fisheye
    const pgSection = pgMosaic.closest('.playground') || pgMosaic;

    pgSection.addEventListener('mousemove', (e) => {
      if (!isOver) {
        lerpX = e.pageX;
        lerpY = e.pageY;
      }
      cursorX = e.pageX;
      cursorY = e.pageY;
      isOver  = true;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });

    pgSection.addEventListener('mouseleave', () => {
      isOver = false;
      if (!rafId) rafId = requestAnimationFrame(tick);
    });


    /* -- FLIP lightbox: tile expands to modal at screen centre -- */
    tiles.forEach(tile => {
      tile.addEventListener('click', () => {
        // Populate modal
        const ti = tile.querySelector('.pg-ti');
        const modalImg = document.getElementById('pgModalImg');
        modalImg.className = 'pg-modal-img';
        if (ti && ti.tagName === 'IMG') {
          modalImg.style.backgroundImage    = `url(${ti.src})`;
          modalImg.style.backgroundSize     = 'cover';
          modalImg.style.backgroundPosition = 'center';
        } else {
          modalImg.style.backgroundImage = '';
          const colorClass = ti ? Array.from(ti.classList).find(c => c.startsWith('pg-c')) : null;
          if (colorClass) modalImg.classList.add(colorClass);
        }

        document.getElementById('pgModalTitle').textContent = tile.dataset.title || '';
        document.getElementById('pgModalTag').textContent   = tile.dataset.tag   || '';
        document.getElementById('pgModalDesc').textContent  = tile.dataset.desc  || '';

        // FLIP: measure tile at its current (possibly scaled) position
        const tileRect = tile.getBoundingClientRect();
        const modalW   = Math.min(500, window.innerWidth * 0.92);
        const modalH   = modalW * 0.95;
        const viewCX   = window.innerWidth  / 2;
        const viewCY   = window.innerHeight / 2;
        const startTX  = (tileRect.left + tileRect.width  / 2) - viewCX;
        const startTY  = (tileRect.top  + tileRect.height / 2) - viewCY;
        const startSX  = tileRect.width  / modalW;
        const startSY  = tileRect.height / modalH;

        pgModal.style.transition = 'none';
        pgModal.style.opacity    = '0.2';
        pgModal.style.transform  =
          `translate(${startTX}px, ${startTY}px) scale(${startSX}, ${startSY})`;

        pgOverlay.setAttribute('aria-hidden', 'false');
        pgOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        pgModal.offsetHeight; // force reflow
        pgModal.style.transition =
          'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease';
        pgModal.style.opacity   = '1';
        pgModal.style.transform = 'translate(0,0) scale(1)';
      });
    });


    /* -- Close -- */
    const closeModal = () => {
      pgModal.style.transition = 'transform 0.4s cubic-bezier(0.4,0,1,1), opacity 0.3s ease';
      pgModal.style.opacity    = '0';
      pgModal.style.transform  = 'translate(0,0) scale(0.9) rotate(-4deg)';

      setTimeout(() => {
        pgOverlay.classList.remove('open');
        pgOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        pgModal.style.transition = '';
      }, 320);
    };

    pgOverlay.addEventListener('click', (e) => {
      if (e.target === pgOverlay) closeModal();
    });
    if (pgModalClose) pgModalClose.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pgOverlay.classList.contains('open')) closeModal();
    });
  }

})();
