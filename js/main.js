// Smooth scroll para enlaces internos (si se quiere comportamiento suave)
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        e.preventDefault();
        var target = document.querySelector(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      // si href == "#" o "#top" simplemente dejamos el comportamiento por defecto
    });
  });
});
