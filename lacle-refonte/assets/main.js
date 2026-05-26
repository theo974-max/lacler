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
  // Positionnement dynamique des boutons flottants (search + theme)
  // — alignés sur le centre vertical de la pill nav
  // ============================================================
  var nav = document.querySelector('.nav');
  var searchBtn = document.querySelector('.search-toggle');
  // l'ordre dans le tableau = ordre visuel de gauche à droite
  var floatingBtns = [searchBtn, toggle].filter(Boolean);
  var BTN_GAP = 8;

  function placeButtons () {
    if (!nav || floatingBtns.length === 0) return;
    var r = nav.getBoundingClientRect();
    var navCenterY = r.top + r.height / 2;
    var x = r.right + 10;
    var maxRight = window.innerWidth - 12;

    floatingBtns.forEach(function (btn) {
      var w = btn.offsetWidth || 44;
      var h = btn.offsetHeight || 44;
      // si on dépasse, on empile : descendre d'une ligne au lieu d'overflow
      if (x + w > maxRight) {
        // fallback : on garde à droite de la pill quand même
        x = Math.max(r.right + 10, maxRight - w);
      }
      btn.style.left = x + 'px';
      btn.style.top  = (navCenterY - h / 2) + 'px';
      btn.style.transform = 'none';
      x += w + BTN_GAP;
    });
  }
  placeButtons();
  window.addEventListener('resize', placeButtons);
  window.addEventListener('load', placeButtons);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(placeButtons);
  }

  // navbar scrolled
  if (nav) {
    var onScroll = function () {
      var s = window.scrollY > 30;
      nav.classList.toggle('scrolled', s);
      placeButtons();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ============================================================
  // SEARCH — modal command palette (Cmd/Ctrl+K)
  // ============================================================
  var SEARCH_ITEMS = [
    { title: 'Accueil',              tag: 'Page',     desc: 'Studio de commerce digital à Nîmes',           url: 'index.html' },
    { title: 'Services',             tag: 'Page',     desc: 'Sites web, vidéos pub et devis interactifs',    url: 'services.html' },
    { title: 'Sites web sur-mesure', tag: 'Service',  desc: 'Vitrine, e-commerce, plateformes',              url: 'services.html' },
    { title: 'Vidéos publicitaires', tag: 'Service',  desc: 'Spots, motion, contenus social',                url: 'services.html' },
    { title: 'Devis interactifs',    tag: 'Service',  desc: 'Notre outil propriétaire : Le devis vivant',    url: 'services.html' },
    { title: 'Réalisations',         tag: 'Page',     desc: 'Nos projets clients',                           url: 'realisations.html' },
    { title: 'Le devis vivant',      tag: 'Projet',   desc: 'Plateforme propriétaire de devis interactifs',  url: 'realisations.html' },
    { title: 'Plateforme automobile',tag: 'Projet',   desc: 'Site complet pour un garage',                   url: 'realisations.html' },
    { title: 'MEDKEY',               tag: 'Projet',   desc: 'Portfolio Aymen Cherfi',                        url: 'realisations.html' },
    { title: 'The K',                tag: 'Projet',   desc: 'Chaîne YouTube de défis',                       url: 'realisations.html' },
    { title: 'Défis sport',          tag: 'Page',     desc: 'Du vélo Nîmes-Marseille au saut en parachute',  url: 'defis.html' },
    { title: 'L’équipe',        tag: 'Page',     desc: 'Aymen Cherfi & Théo Clapet',                    url: 'equipe.html' },
    { title: 'Aymen Cherfi',         tag: 'Équipe',   desc: 'Co-fondateur',                                  url: 'equipe.html' },
    { title: 'Théo Clapet',          tag: 'Équipe',   desc: 'Co-fondateur',                                  url: 'equipe.html' },
    { title: 'FAQ',                  tag: 'Page',     desc: 'Questions fréquentes',                          url: 'faq.html' },
    { title: 'Demander un devis',    tag: 'Action',   desc: 'Formulaire de contact',                         url: 'index.html#contact' }
  ];

  // Crée le modal une seule fois et l'ajoute au body
  function buildSearchModal () {
    var modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML =
      '<div class="search-backdrop"></div>' +
      '<div class="search-card">' +
        '<div class="search-input-wrap">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>' +
            '<path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
          '</svg>' +
          '<input type="text" placeholder="Rechercher une page, un service, un projet…" autocomplete="off" />' +
          '<kbd>Esc</kbd>' +
        '</div>' +
        '<ul class="search-results"></ul>' +
        '<div class="search-footer">' +
          '<span><kbd>↑↓</kbd> naviguer</span>' +
          '<span><kbd>↵</kbd> ouvrir</span>' +
          '<span><kbd>Esc</kbd> fermer</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  var searchModal = null;
  var searchInput = null;
  var searchResults = null;
  var searchFooter = null;
  var focusIdx = 0;

  function normalize (s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, ''); // accents
  }

  function renderResults (query) {
    var q = normalize(query.trim());
    var items;
    if (!q) {
      items = SEARCH_ITEMS;
    } else {
      items = SEARCH_ITEMS.filter(function (it) {
        return normalize(it.title).indexOf(q) >= 0
            || normalize(it.desc).indexOf(q) >= 0
            || normalize(it.tag).indexOf(q) >= 0;
      });
    }
    if (items.length === 0) {
      searchResults.innerHTML = '<li class="search-empty">Aucun résultat pour "' + query + '"</li>';
      return;
    }
    searchResults.innerHTML = items.map(function (it, i) {
      return '<li><a href="' + it.url + '" data-idx="' + i + '">' +
        '<span class="sr-title">' + it.title + ' <span class="sr-tag">' + it.tag + '</span></span>' +
        '<span class="sr-desc">' + it.desc + '</span>' +
      '</a></li>';
    }).join('');
    focusIdx = 0;
    updateFocus();
  }

  function updateFocus () {
    var links = searchResults.querySelectorAll('a');
    links.forEach(function (a, i) { a.classList.toggle('focus', i === focusIdx); });
    var focused = links[focusIdx];
    if (focused) focused.scrollIntoView({ block: 'nearest' });
  }

  function openSearch () {
    if (!searchModal) {
      searchModal = buildSearchModal();
      searchInput   = searchModal.querySelector('input');
      searchResults = searchModal.querySelector('.search-results');
      searchFooter  = searchModal.querySelector('.search-footer');
      // listeners modal
      searchModal.querySelector('.search-backdrop').addEventListener('click', closeSearch);
      searchInput.addEventListener('input', function () { renderResults(searchInput.value); });
      searchInput.addEventListener('keydown', function (e) {
        var links = searchResults.querySelectorAll('a');
        if (e.key === 'ArrowDown') { e.preventDefault(); focusIdx = Math.min(focusIdx + 1, links.length - 1); updateFocus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); focusIdx = Math.max(focusIdx - 1, 0); updateFocus(); }
        else if (e.key === 'Enter')  { e.preventDefault(); if (links[focusIdx]) window.location.href = links[focusIdx].getAttribute('href'); }
        else if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
      });
    }
    searchInput.value = '';
    renderResults('');
    searchModal.classList.add('open');
    setTimeout(function () { searchInput.focus(); }, 50);
  }
  function closeSearch () {
    if (searchModal) searchModal.classList.remove('open');
  }

  // bouton & raccourci global
  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchModal && searchModal.classList.contains('open')) closeSearch();
      else openSearch();
    }
  });

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

  // ============================================================
  // TESTIMONIALS — duplique les cards pour un défilement sans coupure
  // (le keyframe va jusqu'à -50%, donc il faut bien 2× le contenu)
  // ============================================================
  document.querySelectorAll('.testi-track').forEach(function (track) {
    var originals = Array.from(track.children);
    originals.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });
})();
