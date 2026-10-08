/**
 * ==========================================================================
 * SCROLL STUDIO — SCRIPT PRINCIPAL (VANILLA JS)
 * Autor: Thiago Paulovich Garcia
 * Funcionalidades:
 *  - Barra de progreso de scroll en tiempo real
 *  - Menú mobile accesible (aria-expanded, cierre automático)
 *  - Navegación activa con IntersectionObserver
 *  - Animaciones de revelado progresivo (IntersectionObserver)
 *  - Respeto a prefers-reduced-motion
 *  - Copiar email al portapapeles con feedback visual
 *  - Año actual dinámico para el copyright
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------------------------------
  // 1. SELECTORES PRINCIPALES
  // ------------------------------------------------------------------------
  const progressBar = document.getElementById('scroll-progress-bar');
  const header = document.getElementById('header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const revealElements = document.querySelectorAll('.reveal');
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const currentYearSpan = document.getElementById('current-year');

  // ------------------------------------------------------------------------
  // 2. AÑO ACTUAL DINÁMICO EN FOOTER
  // ------------------------------------------------------------------------
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // ------------------------------------------------------------------------
  // 3. BARRA DE PROGRESO DE SCROLL Y ESTADO DEL HEADER
  // ------------------------------------------------------------------------
  const handleScrollUpdates = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Actualizar barra de progreso
    if (progressBar && scrollHeight > 0) {
      const progressPercent = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      progressBar.style.width = `${progressPercent}%`;
    }

    // Header sombreado con scroll
    if (header) {
      if (scrollTop > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }
  };

  window.addEventListener('scroll', handleScrollUpdates, { passive: true });
  handleScrollUpdates(); // Ejecutar al inicio

  // ------------------------------------------------------------------------
  // 4. MENÚ MÓVIL (ACCESIBILIDAD Y CONTROL)
  // ------------------------------------------------------------------------
  if (mobileToggle && mainNav) {
    const toggleMenu = (open) => {
      const isExpanded = open !== undefined ? open : mobileToggle.getAttribute('aria-expanded') !== 'true';
      mobileToggle.setAttribute('aria-expanded', isExpanded);
      mobileToggle.setAttribute('aria-label', isExpanded ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');

      if (isExpanded) {
        mainNav.classList.add('is-open');
        document.body.style.overflow = 'hidden'; // Evita scroll de fondo en mobile abierto
      } else {
        mainNav.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    };

    mobileToggle.addEventListener('click', () => toggleMenu());

    // Cerrar menú al hacer clic en cualquier ancla de navegación
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('is-open')) {
          toggleMenu(false);
        }
      });
    });

    // Cerrar al presionar la tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        toggleMenu(false);
        mobileToggle.focus();
      }
    });

    // Cerrar al hacer clic fuera del menú en pantallas móviles
    document.addEventListener('click', (e) => {
      if (
        mainNav.classList.contains('is-open') &&
        !mainNav.contains(e.target) &&
        !mobileToggle.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });
  }

  // ------------------------------------------------------------------------
  // 5. ANIMACIONES AL HACER SCROLL (INTERSECTION OBSERVER)
  //    Respeta prefers-reduced-motion
  // ------------------------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Si el usuario prefiere reducir movimiento, mostramos todo sin esperar
    revealElements.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Dejar de observar una vez visible
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1,
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback para navegadores antiguos
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  // ------------------------------------------------------------------------
  // 6. DETECCIÓN DE SECCIÓN ACTIVA EN EL MENÚ DE NAVEGACIÓN
  // ------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -65% 0px',
        threshold: 0,
      }
    );

    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  // ------------------------------------------------------------------------
  // 7. BOTÓN DE COPIAR EMAIL CON FEEDBACK VISUAL
  // ------------------------------------------------------------------------
  if (copyEmailBtn) {
    const copyTextSpan = copyEmailBtn.querySelector('.copy-text');
    const defaultText = copyTextSpan ? copyTextSpan.textContent : 'Copiar email';
    const emailToCopy = copyEmailBtn.getAttribute('data-email') || 'Thiagopgnqn@gmail.com';

    copyEmailBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(emailToCopy);
        } else {
          // Fallback clásico en caso de navegadores sin soporte de Clipboard API
          const tempInput = document.createElement('textarea');
          tempInput.value = emailToCopy;
          tempInput.style.position = 'fixed';
          tempInput.style.opacity = '0';
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        // Estado visual de éxito
        copyEmailBtn.classList.add('copied');
        if (copyTextSpan) {
          copyTextSpan.textContent = '¡Email copiado!';
        }

        // Restaurar estado después de 2.5 segundos
        setTimeout(() => {
          copyEmailBtn.classList.remove('copied');
          if (copyTextSpan) {
            copyTextSpan.textContent = defaultText;
          }
        }, 2500);

      } catch (err) {
        console.error('Error al intentar copiar el email:', err);
      }
    });
  }

});
