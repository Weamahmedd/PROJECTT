/* ============================================
   CARTIFY — GLOBAL UI ENHANCEMENTS
   Back to Top Button only
   ============================================ */

// ═══════════════════════════════════════════
// BACK TO TOP BUTTON
// ═══════════════════════════════════════════

(function () {
  // Create button
  var btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
  document.body.appendChild(btn);

  // Show / hide on scroll
  window.addEventListener('scroll', function () {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  // Smooth scroll to top on click
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
