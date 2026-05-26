/* LA CLÉ — interactions partagées */
(function () {
  // navbar scrolled
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 30);
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
