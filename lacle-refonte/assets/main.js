/* LA CLÉ — interactions partagées */
(function () {
  // ============================================================
  // THEME jour/nuit — auto (selon coucher du soleil) + toggle manuel
  // ============================================================
  // Heures approximées du lever / coucher du soleil en France métropolitaine
  // (Nîmes / Paris ≈ latitude moyenne) — par mois, en heure locale.
  var SUNRISE = [8, 7, 7, 7, 6, 6, 6, 7, 7, 8, 7, 8];   // jan...déc
  var SUNSET  = [17, 18, 19, 20, 21, 21, 21, 21, 20, 19, 17, 17];

  function autoTheme () {
    var now = new Date();
    var m = now.getMonth();
    var h = now.getHours() + now.getMinutes() / 60;
    return (h >= SUNRISE[m] && h < SUNSET[m]) ? 'day' : 'night';
  }

  function applyTheme (theme) {
    var root = document.documentElement;
    if (theme === 'night') root.classList.add('theme-night');
    else root.classList.remove('theme-night');
    // Met à jour la couleur de barre de statut mobile (theme-color)
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'night' ? '#161210' : '#fbfaf7');
  }

  var stored = null;
  try { stored = localStorage.getItem('lacle-theme'); } catch (e) {}
  // stored = 'day' | 'night' | null (= auto)
  var initial = stored || autoTheme();
  applyTheme(initial);

  // bouton toggle
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.classList.contains('theme-night') ? 'night' : 'day';
      var next = current === 'night' ? 'day' : 'night';
      applyTheme(next);
      try { localStorage.setItem('lacle-theme', next); } catch (e) {}
    });
  }

  // Recheck l'heure toutes les 5 min — si l'utilisateur n'a PAS encore choisi,
  // le site bascule tout seul au coucher / lever du soleil.
  setInterval(function () {
    var hasManual = false;
    try { hasManual = !!localStorage.getItem('lacle-theme'); } catch (e) {}
    if (!hasManual) applyTheme(autoTheme());
  }, 5 * 60 * 1000);

  // ============================================================
  // Positionnement dynamique du bouton toggle (à droite de la pill nav)
  // ============================================================
  var nav = document.querySelector('.nav');
  function placeToggle () {
    if (!toggle || !nav) return;
    var r = nav.getBoundingClientRect();
    // colle à droite de la pill, mais reste dans l'écran (clamp à 56 px du bord)
    var maxLeft = window.innerWidth - 56;
    var leftPos = Math.min(r.right + 10, maxLeft);
    toggle.style.left = leftPos + 'px';
    toggle.style.transform = 'none';
  }
  placeToggle();
  window.addEventListener('resize', placeToggle);
  window.addEventListener('load', placeToggle);
  // re-positionne quand les fonts custom sont prêtes (la pill peut grandir un peu)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(placeToggle);
  }

  // navbar scrolled
  if (nav) {
    var onScroll = function () {
      var s = window.scrollY > 30;
      nav.classList.toggle('scrolled', s);
      if (toggle) toggle.classList.toggle('scrolled', s);
      placeToggle();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // menu mobile
  var burger = document.querySelector('.nav-burger');
  var links  = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  var showAll = function () {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  };

  if (!('IntersectionObserver' in window)) {
    // navigateur sans IntersectionObserver : on affiche tout
    showAll();
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { io.observe(el); });

  // filet de sécurité : si du contenu reste masqué (JS lent, scroll
  // instantané, capture), on force l'affichage après 2,5 s
  setTimeout(showAll, 2500);
})();
